import { Duration } from 'aws-cdk-lib'
import fs from 'node:fs'
import path from 'node:path'
import {
  Alarm,
  ComparisonOperator,
  Dashboard,
  GraphWidget,
  MathExpression,
  Metric,
  TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch'
import { FargateService } from 'aws-cdk-lib/aws-ecs'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions'
import type { QueueResources } from './queues'
import type { ApiResources } from './api'
import type { EcsServiceResources } from './ecs-services'
import type { DatabaseResources } from './database'
import type { CacheResources } from './cache'
import type { Construct } from 'constructs'

type ProviderCatalogFile = {
  version: number
  providers: Array<{
    provider_id: string
    probe?: {
      aws_scheduled?: boolean
      github_actions?: boolean
    }
  }>
}

const loadProviderCatalog = (): ProviderCatalogFile => {
  const repoRoot = path.resolve(__dirname, '..', '..', '..')
  const catalogPath = path.join(repoRoot, '.remit-scout', 'providers', 'catalog.json')
  const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as ProviderCatalogFile
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.providers)) {
    throw new Error(`Invalid provider catalog: ${catalogPath}`)
  }
  return raw
}

export type MonitoringResources = {
  dashboard: Dashboard
  criticalTopic: Topic
  warningTopic: Topic
  opsTopic: Topic
}

export type MonitoringOptions = {
  envName: string
  queues: QueueResources
  api: ApiResources
  ecs: EcsServiceResources
  database: DatabaseResources
  cache: CacheResources
  criticalTopic: Topic
  warningTopic: Topic
  opsTopic: Topic
}

export const createMonitoring = (
  scope: Construct,
  options: MonitoringOptions,
): MonitoringResources => {
  const isProd = options.envName === 'prod'
  const isStaging = options.envName === 'staging'
  const serviceDimension = 'remit-scout'
  const useExplicitAlarmNames = options.envName !== 'dev'
  const dbRunbookRef = 'ops/brain/README.md#database-incidents'

  const providerCatalog = loadProviderCatalog()
  const probeProviders = providerCatalog.providers
    .filter((p) => p?.probe?.aws_scheduled === true)
    .map((p) => p.provider_id)
  const collectionProviders = providerCatalog.providers.map((p) => p.provider_id)

  const dashboard = new Dashboard(scope, 'RemitScoutDashboard', {
    dashboardName: `remit-scout-${options.envName}`,
  })

  const queueDepthWidget = new GraphWidget({
    title: 'SQS Queue Depth',
    left: [
      options.queues.quoteRefreshQueue.metricApproximateNumberOfMessagesVisible(),
      options.queues.fxRateRefreshQueue.metricApproximateNumberOfMessagesVisible(),
      options.queues.exportJobQueue.metricApproximateNumberOfMessagesVisible(),
      options.queues.alertEvaluationQueue.metricApproximateNumberOfMessagesVisible(),
      options.queues.ingestFanoutQueue.metricApproximateNumberOfMessagesVisible(),
      options.queues.ingestFanoutTier2Queue.metricApproximateNumberOfMessagesVisible(),
      options.queues.goldLiveQueue.metricApproximateNumberOfMessagesVisible(),
      options.queues.notificationsQueue.metricApproximateNumberOfMessagesVisible(),
      options.queues.opsAlertsQueue.metricApproximateNumberOfMessagesVisible(),
    ],
    period: Duration.minutes(5),
  })

  const dlqDepthWidget = new GraphWidget({
    title: 'SQS DLQ Depth',
    left: [
      options.queues.quoteRefreshDlq.metricApproximateNumberOfMessagesVisible(),
      options.queues.fxRateRefreshDlq.metricApproximateNumberOfMessagesVisible(),
      options.queues.exportJobDlq.metricApproximateNumberOfMessagesVisible(),
      options.queues.alertEvaluationDlq.metricApproximateNumberOfMessagesVisible(),
      options.queues.ingestFanoutDlq.metricApproximateNumberOfMessagesVisible(),
      options.queues.ingestFanoutTier2Dlq.metricApproximateNumberOfMessagesVisible(),
      options.queues.goldLiveDlq.metricApproximateNumberOfMessagesVisible(),
      options.queues.notificationsDlq.metricApproximateNumberOfMessagesVisible(),
      options.queues.opsAlertsDlq.metricApproximateNumberOfMessagesVisible(),
    ],
    period: Duration.minutes(5),
  })

  const queueAgeWidget = new GraphWidget({
    title: 'SQS Oldest Message Age (max seconds)',
    left: [
      options.queues.quoteRefreshQueue.metricApproximateAgeOfOldestMessage(),
      options.queues.fxRateRefreshQueue.metricApproximateAgeOfOldestMessage(),
      options.queues.exportJobQueue.metricApproximateAgeOfOldestMessage(),
      options.queues.alertEvaluationQueue.metricApproximateAgeOfOldestMessage(),
      options.queues.ingestFanoutQueue.metricApproximateAgeOfOldestMessage(),
      options.queues.ingestFanoutTier2Queue.metricApproximateAgeOfOldestMessage(),
      options.queues.goldLiveQueue.metricApproximateAgeOfOldestMessage(),
      options.queues.notificationsQueue.metricApproximateAgeOfOldestMessage(),
      options.queues.opsAlertsQueue.metricApproximateAgeOfOldestMessage(),
    ],
    period: Duration.minutes(5),
  })

  const queueStaleDropWidget = new GraphWidget({
    title: 'Queue Stale Drops',
    left: [
      'ingest-fanout-worker',
      'gold-live-worker',
      'b2c-refresh-worker',
      'fx-rate-refresh-worker',
    ].map((workerName) =>
      new Metric({
        namespace: 'RemitScout/Workers',
        metricName: 'stale_dropped',
        dimensionsMap: {
          WorkerName: workerName,
          environment: options.envName,
        },
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
    ),
    period: Duration.minutes(5),
  })

  const lambdaErrorWidget = new GraphWidget({
    title: 'Lambda Errors',
    left: [
      options.api.planeAFunction.metricErrors(),
      options.api.planeCFunction.metricErrors(),
    ],
    period: Duration.minutes(5),
  })

  const apiLatencyWidget = new GraphWidget({
    title: 'API Gateway Latency (p95)',
    left: [
      new Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        dimensionsMap: {
          ApiId: options.api.planeAApi.httpApiId,
          Stage: '$default',
        },
        statistic: 'p95',
      }),
      new Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        dimensionsMap: {
          ApiId: options.api.planeCApi.httpApiId,
          Stage: '$default',
        },
        statistic: 'p95',
      }),
    ],
    period: Duration.minutes(5),
  })

  const traceContinuityWidget = new GraphWidget({
    title: 'Cross-plane Trace Health',
    left: [
      new Metric({
        namespace: 'RemitScout/Tracing',
        metricName: 'cross_plane_hop_duration_ms',
        dimensionsMap: {
          environment: options.envName,
        },
        statistic: 'p95',
        period: Duration.minutes(5),
      }),
      new Metric({
        namespace: 'RemitScout/Tracing',
        metricName: 'cross_plane_error_amplification',
        dimensionsMap: {
          environment: options.envName,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
    ],
    period: Duration.minutes(5),
  })

  const planeARequestCount = new Metric({
    namespace: 'AWS/ApiGateway',
    metricName: 'Count',
    dimensionsMap: {
      ApiId: options.api.planeAApi.httpApiId,
      Stage: '$default',
    },
    statistic: 'Sum',
    period: Duration.minutes(5),
  })
  const planeA5xxCount = new Metric({
    namespace: 'AWS/ApiGateway',
    metricName: '5XXError',
    dimensionsMap: {
      ApiId: options.api.planeAApi.httpApiId,
      Stage: '$default',
    },
    statistic: 'Sum',
    period: Duration.minutes(5),
  })
  const planeA4xxCount = new Metric({
    namespace: 'AWS/ApiGateway',
    metricName: '4XXError',
    dimensionsMap: {
      ApiId: options.api.planeAApi.httpApiId,
      Stage: '$default',
    },
    statistic: 'Sum',
    period: Duration.minutes(5),
  })
  const planeA5xxRate = new MathExpression({
    label: 'Plane A 5xx Rate',
    expression: 'IF(mcountA>0, m5xxA/mcountA, 0)',
    usingMetrics: {
      mcountA: planeARequestCount,
      m5xxA: planeA5xxCount,
    },
    period: Duration.minutes(5),
  })
  const planeA4xxRate = new MathExpression({
    label: 'Plane A 4xx Rate',
    expression: 'IF(mcountA>0, m4xxA/mcountA, 0)',
    usingMetrics: {
      mcountA: planeARequestCount,
      m4xxA: planeA4xxCount,
    },
    period: Duration.minutes(5),
  })

  const planeCRequestCount = new Metric({
    namespace: 'AWS/ApiGateway',
    metricName: 'Count',
    dimensionsMap: {
      ApiId: options.api.planeCApi.httpApiId,
      Stage: '$default',
    },
    statistic: 'Sum',
    period: Duration.minutes(5),
  })
  const planeC5xxCount = new Metric({
    namespace: 'AWS/ApiGateway',
    metricName: '5XXError',
    dimensionsMap: {
      ApiId: options.api.planeCApi.httpApiId,
      Stage: '$default',
    },
    statistic: 'Sum',
    period: Duration.minutes(5),
  })
  const planeC5xxRate = new MathExpression({
    label: 'Plane C 5xx Rate',
    expression: 'IF(mcountC>0, m5xxC/mcountC, 0)',
    usingMetrics: {
      mcountC: planeCRequestCount,
      m5xxC: planeC5xxCount,
    },
    period: Duration.minutes(5),
  })

  const ecsCpuWidget = new GraphWidget({
    title: 'ECS CPU Utilization',
    left: [
      ...(options.ecs.planeBIngestService
        ? [options.ecs.planeBIngestService]
        : []),
      ...(options.ecs.b2cRefreshService ? [options.ecs.b2cRefreshService] : []),
      ...(options.ecs.fxRateRefreshService ? [options.ecs.fxRateRefreshService] : []),
      ...(options.ecs.ingestFanoutTier1Service ? [options.ecs.ingestFanoutTier1Service] : []),
      ...(options.ecs.ingestFanoutTier2Service ? [options.ecs.ingestFanoutTier2Service] : []),
      ...(options.ecs.goldLiveService ? [options.ecs.goldLiveService] : []),
      ...(options.ecs.notificationsQueueService ? [options.ecs.notificationsQueueService] : []),
      ...(options.ecs.opsAlertsQueueService ? [options.ecs.opsAlertsQueueService] : []),
    ].map((service) => service.metricCpuUtilization()),
    period: Duration.minutes(5),
  })

  const ecsMemoryWidget = new GraphWidget({
    title: 'ECS Memory Utilization',
    left: [
      ...(options.ecs.planeBIngestService
        ? [options.ecs.planeBIngestService]
        : []),
      ...(options.ecs.b2cRefreshService ? [options.ecs.b2cRefreshService] : []),
      ...(options.ecs.fxRateRefreshService ? [options.ecs.fxRateRefreshService] : []),
      ...(options.ecs.ingestFanoutTier1Service ? [options.ecs.ingestFanoutTier1Service] : []),
      ...(options.ecs.ingestFanoutTier2Service ? [options.ecs.ingestFanoutTier2Service] : []),
      ...(options.ecs.goldLiveService ? [options.ecs.goldLiveService] : []),
      ...(options.ecs.notificationsQueueService ? [options.ecs.notificationsQueueService] : []),
      ...(options.ecs.opsAlertsQueueService ? [options.ecs.opsAlertsQueueService] : []),
    ].map((service) => service.metricMemoryUtilization()),
    period: Duration.minutes(5),
  })

  const rdsCpuWidget = new GraphWidget({
    title: 'Aurora CPU & Connections',
    left: [
      options.database.cluster.metricCPUUtilization(),
      options.database.cluster.metricDatabaseConnections(),
    ],
    period: Duration.minutes(5),
  })

  const redisCpuWidget = new GraphWidget({
    title: 'Redis CPU',
    left: [
      new Metric({
        namespace: 'AWS/ElastiCache',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          ReplicationGroupId: options.cache.replicationGroup.ref,
        },
        statistic: 'Average',
      }),
    ],
    period: Duration.minutes(5),
  })

  dashboard.addWidgets(
    queueDepthWidget,
    dlqDepthWidget,
    queueAgeWidget,
    queueStaleDropWidget,
    lambdaErrorWidget,
    apiLatencyWidget,
    traceContinuityWidget,
    new GraphWidget({
      title: 'API 5xx Error Rate',
      left: [planeA5xxRate, planeC5xxRate],
      period: Duration.minutes(5),
    }),
    ecsCpuWidget,
    ecsMemoryWidget,
    rdsCpuWidget,
    redisCpuWidget,
  )

  const criticalAction = new SnsAction(options.criticalTopic)
  const warningAction = new SnsAction(options.warningTopic)
  const opsAction = new SnsAction(options.opsTopic)

  const dlqAlarms = [
    options.queues.quoteRefreshDlq,
    options.queues.fxRateRefreshDlq,
    options.queues.exportJobDlq,
    options.queues.ingestFanoutDlq,
    options.queues.ingestFanoutTier2Dlq,
    options.queues.notificationsDlq,
    options.queues.opsAlertsDlq,
    options.queues.alertEvaluationDlq,
    options.queues.goldLiveDlq,
  ].map((queue, index) =>
    new Alarm(scope, `DlqAlarm${index}`, {
      alarmName: useExplicitAlarmNames
        ? `remit-scout-${options.envName}-${queue.queueName}-dlq-managed`
        : undefined,
      metric: queue.metricApproximateNumberOfMessagesVisible({
        period: Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    }),
  )

  for (const alarm of dlqAlarms) {
    alarm.addAlarmAction(criticalAction)
  }

  // Lambda async-invoke DLQ alarms — failed invocations that would otherwise be silently lost.
  const lambdaDlqs = [
    { id: 'PlaneALambdaDlqAlarm', queue: options.api.planeALambdaDlq, label: 'Plane A' },
    { id: 'PlaneCLambdaDlqAlarm', queue: options.api.planeCLambdaDlq, label: 'Plane C' },
  ]
  for (const { id, queue, label } of lambdaDlqs) {
    const alarm = new Alarm(scope, id, {
      alarmName: useExplicitAlarmNames
        ? `remit-scout-${options.envName}-${queue.queueName}-depth`
        : undefined,
      metric: queue.metricApproximateNumberOfMessagesVisible({
        period: Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `${label} Lambda DLQ has messages — failed async invocations detected`,
    })
    alarm.addAlarmAction(opsAction)
  }

  const quoteRefreshOldestAgeThresholdSeconds = isProd ? 15 * 60 : (isStaging ? 30 * 60 : 60 * 60)
  const ingestFanoutTier2OldestAgeThresholdSeconds = isProd ? 60 * 60 : (isStaging ? 90 * 60 : 2 * 60 * 60)
  const priorityQueueAgeAlarms = [
    new Alarm(scope, 'QuoteRefreshOldestAgeAlarm', {
      alarmName: useExplicitAlarmNames
        ? `remit-scout-${options.envName}-quote-refresh-oldest-age-high`
        : undefined,
      metric: options.queues.quoteRefreshQueue.metricApproximateAgeOfOldestMessage({
        period: Duration.minutes(5),
      }),
      threshold: quoteRefreshOldestAgeThresholdSeconds,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `Quote refresh queue oldest message age >= ${quoteRefreshOldestAgeThresholdSeconds}s`,
    }),
    new Alarm(scope, 'IngestFanoutTier2OldestAgeAlarm', {
      alarmName: useExplicitAlarmNames
        ? `remit-scout-${options.envName}-ingest-fanout-tier2-oldest-age-high`
        : undefined,
      metric: options.queues.ingestFanoutTier2Queue.metricApproximateAgeOfOldestMessage({
        period: Duration.minutes(5),
      }),
      threshold: ingestFanoutTier2OldestAgeThresholdSeconds,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `Tier2 ingest fanout oldest message age >= ${ingestFanoutTier2OldestAgeThresholdSeconds}s`,
    }),
  ]
  for (const alarm of priorityQueueAgeAlarms) {
    alarm.addAlarmAction(isProd ? opsAction : warningAction)
  }

  // DLQ send failures are data loss events: DLQ is the last resort when a worker fails a message.
  const dlqSendErrorQueues = [
    options.queues.quoteRefreshQueue,
    options.queues.fxRateRefreshQueue,
    options.queues.exportJobQueue,
    options.queues.alertEvaluationQueue,
    options.queues.ingestFanoutQueue,
    options.queues.ingestFanoutTier2Queue,
    options.queues.goldLiveQueue,
    options.queues.notificationsQueue,
    options.queues.opsAlertsQueue,
  ]

  const dlqSendErrorAlarms = dlqSendErrorQueues.map((queue, index) =>
    new Alarm(scope, `DlqSendErrorAlarm${index}`, {
      alarmName: useExplicitAlarmNames
        ? `remit-scout-${options.envName}-${queue.queueName}-dlq-send-errors`
        : undefined,
      metric: new Metric({
        namespace: 'RemitScout',
        metricName: 'sqs_dlq_send_errors_total',
        dimensionsMap: {
          queue_url: queue.queueUrl,
          environment: options.envName,
        },
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    }),
  )

  for (const alarm of dlqSendErrorAlarms) {
    alarm.addAlarmAction(criticalAction)
  }

  const lambdaErrorAlarm = new Alarm(scope, 'LambdaErrorAlarm', {
    alarmName: `remit-scout-${options.envName}-lambda-errors`,
    metric: options.api.planeAFunction.metricErrors({ period: Duration.minutes(5) }),
    threshold: 1,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
  })
  lambdaErrorAlarm.addAlarmAction(warningAction)

  const planeCLambdaErrorAlarm = new Alarm(scope, 'PlaneCLambdaErrorAlarm', {
    alarmName: `remit-scout-${options.envName}-plane-c-lambda-errors`,
    metric: options.api.planeCFunction.metricErrors({ period: Duration.minutes(5) }),
    threshold: 1,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
  })
  planeCLambdaErrorAlarm.addAlarmAction(warningAction)

  const rdsCpuAlarm = new Alarm(scope, 'RdsCpuAlarm', {
    alarmName: `remit-scout-${options.envName}-rds-cpu`,
    metric: options.database.cluster.metricCPUUtilization({ period: Duration.minutes(5) }),
    threshold: 80,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
  })
  rdsCpuAlarm.addAlarmAction(warningAction)

  const rdsConnectionsAlarm = new Alarm(scope, 'RdsConnectionsAlarm', {
    alarmName: `remit-scout-${options.envName}-rds-connections-high`,
    metric: options.database.cluster.metricDatabaseConnections({ period: Duration.minutes(5) }),
    threshold: isProd ? 80 : 60,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Aurora DatabaseConnections approaching capacity',
  })
  rdsConnectionsAlarm.addAlarmAction(warningAction)

  const poolWaitingPlaneA = new Metric({
    namespace: 'RemitScout',
    metricName: 'db_connection_pool_waiting',
    statistic: 'Maximum',
    period: Duration.minutes(1),
    dimensionsMap: {
      pool_name: 'plane-a',
      environment: options.envName,
    },
  })
  const poolWaitingPlaneB = new Metric({
    namespace: 'RemitScout',
    metricName: 'db_connection_pool_waiting',
    statistic: 'Maximum',
    period: Duration.minutes(1),
    dimensionsMap: {
      pool_name: 'plane-b',
      environment: options.envName,
    },
  })
  const poolWaitingPlaneC = new Metric({
    namespace: 'RemitScout',
    metricName: 'db_connection_pool_waiting',
    statistic: 'Maximum',
    period: Duration.minutes(1),
    dimensionsMap: {
      pool_name: 'plane-c',
      environment: options.envName,
    },
  })
  const dbPoolWaitingMax = new MathExpression({
    expression: 'MAX([a,b,c])',
    usingMetrics: {
      a: poolWaitingPlaneA,
      b: poolWaitingPlaneB,
      c: poolWaitingPlaneC,
    },
    period: Duration.minutes(1),
    label: 'DB Pool Waiting Max',
  })
  const dbPoolWaitingAlarm = new Alarm(scope, 'DbPoolWaitingAlarm', {
    alarmName: `remit-scout-${options.envName}-db-pool-waiting-high`,
    metric: dbPoolWaitingMax,
    threshold: 5,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'DB pool waiting count > 5 for at least 2 minutes',
  })
  dbPoolWaitingAlarm.addAlarmAction(opsAction)

  const auroraFreeableMemoryAlarm = new Alarm(scope, 'AuroraFreeableMemoryAlarm', {
    alarmName: `remit-scout-${options.envName}-aurora-freeable-memory-low`,
    metric: options.database.cluster.metric('FreeableMemory', {
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
    threshold: 500 * 1024 * 1024,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Aurora freeable memory below 500MB',
  })
  auroraFreeableMemoryAlarm.addAlarmAction(warningAction)

  const auroraDiskQueueDepthAlarm = new Alarm(scope, 'AuroraDiskQueueDepthAlarm', {
    alarmName: `remit-scout-${options.envName}-aurora-disk-queue-depth-high`,
    metric: options.database.cluster.metric('DiskQueueDepth', {
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
    threshold: 10,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Aurora disk queue depth above 10',
  })
  auroraDiskQueueDepthAlarm.addAlarmAction(warningAction)

  const rdsDeadlockAlarm = new Alarm(scope, 'RdsDeadlockAlarm', {
    alarmName: `remit-scout-${options.envName}-rds-deadlocks`,
    metric: options.database.cluster.metric('Deadlocks', {
      statistic: 'Sum',
      period: Duration.minutes(5),
    }),
    threshold: 0,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: `Aurora deadlocks detected. Runbook: ${dbRunbookRef}`,
  })
  rdsDeadlockAlarm.addAlarmAction(opsAction)

  const replicaLagAlarm = new Alarm(scope, 'RdsReplicaLagAlarm', {
    alarmName: `remit-scout-${options.envName}-rds-replica-lag-high`,
    metric: options.database.cluster.metric('AuroraReplicaLagMaximum', {
      statistic: 'Maximum',
      period: Duration.minutes(5),
    }),
    threshold: isProd ? 5000 : 10000,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: `Aurora replica lag is elevated. Runbook: ${dbRunbookRef}`,
  })
  replicaLagAlarm.addAlarmAction(isProd ? opsAction : warningAction)

  const longQueryDurationAlarm = new Alarm(scope, 'DbLongQueryDurationAlarm', {
    alarmName: `remit-scout-${options.envName}-db-query-duration-p95-high`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'db_query_duration_seconds_env',
      dimensionsMap: {
        environment: options.envName,
      },
      statistic: 'p95',
      period: Duration.minutes(5),
    }),
    threshold: isProd ? 2 : 4,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: `Database query p95 is elevated. Runbook: ${dbRunbookRef}`,
  })
  longQueryDurationAlarm.addAlarmAction(opsAction)

  const redisCurrConnectionsMetric = new Metric({
    namespace: 'AWS/ElastiCache',
    metricName: 'CurrConnections',
    dimensionsMap: {
      ReplicationGroupId: options.cache.replicationGroup.ref,
    },
    statistic: 'Average',
    period: Duration.minutes(5),
  })
  const redisMaxConnectionsMetric = new Metric({
    namespace: 'AWS/ElastiCache',
    metricName: 'MaxConnections',
    dimensionsMap: {
      ReplicationGroupId: options.cache.replicationGroup.ref,
    },
    statistic: 'Maximum',
    period: Duration.minutes(5),
  })
  const redisConnectionsUtilization = new MathExpression({
    expression: 'IF(maxConn>0, curr/maxConn, 0)',
    usingMetrics: {
      curr: redisCurrConnectionsMetric,
      maxConn: redisMaxConnectionsMetric,
    },
    period: Duration.minutes(5),
    label: 'Redis Connections Utilization',
  })
  const redisConnectionsAlarm = new Alarm(scope, 'RedisConnectionsAlarm', {
    alarmName: `remit-scout-${options.envName}-redis-connections-high`,
    metric: redisConnectionsUtilization,
    threshold: 0.8,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Redis CurrConnections exceeds 80% of MaxConnections',
  })
  redisConnectionsAlarm.addAlarmAction(warningAction)

  const redisEngineCpuAlarm = new Alarm(scope, 'RedisEngineCpuAlarm', {
    alarmName: `remit-scout-${options.envName}-redis-engine-cpu-high`,
    metric: new Metric({
      namespace: 'AWS/ElastiCache',
      metricName: 'EngineCPUUtilization',
      dimensionsMap: {
        ReplicationGroupId: options.cache.replicationGroup.ref,
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
    threshold: 70,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Redis EngineCPUUtilization exceeds 70%',
  })
  redisEngineCpuAlarm.addAlarmAction(warningAction)

  const ecsServices: FargateService[] = [
    options.ecs.planeBIngestService,
    options.ecs.b2cRefreshService,
    options.ecs.fxRateRefreshService,
    options.ecs.ingestFanoutTier1Service,
    options.ecs.ingestFanoutTier2Service,
    options.ecs.goldLiveService,
    options.ecs.notificationsQueueService,
    options.ecs.opsAlertsQueueService,
    options.ecs.alertEvaluationService,
    options.ecs.exportWorkerService,
  ].filter((service): service is FargateService => Boolean(service))

  if (ecsServices.length > 0) {
    const restartMetrics = ecsServices.map((service, index) => ({
      key: `m${index + 1}`,
      metric: new Metric({
        namespace: 'ECS/ContainerInsights',
        metricName: 'RestartCount',
        dimensionsMap: {
          ClusterName: service.cluster.clusterName,
          ServiceName: service.serviceName,
        },
        statistic: 'Sum',
        period: Duration.minutes(15),
      }),
    }))

    const restartExpression = restartMetrics.map(({ key }) => key).join('+') || '0'
    const ecsRestartCountMetric = new MathExpression({
      expression: restartExpression,
      usingMetrics: Object.fromEntries(restartMetrics.map(({ key, metric }) => [key, metric])),
      period: Duration.minutes(15),
      label: 'ECS Restart Count (15m)',
    })
    const ecsRestartCountAlarm = new Alarm(scope, 'EcsRestartCountAlarm', {
      alarmName: `remit-scout-${options.envName}-ecs-restarts-high`,
      metric: ecsRestartCountMetric,
      threshold: 3,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: 'ECS task restart count exceeds 3 within 15 minutes',
    })
    ecsRestartCountAlarm.addAlarmAction(opsAction)
  }

  const sloMissingDataBehavior = isProd || isStaging
    ? TreatMissingData.BREACHING
    : TreatMissingData.NOT_BREACHING
  const sloAlarmConfigs = [
    { sloName: 'freshness_p95', timeWindow: '1h', alarmSuffix: 'freshness-slo-breach' },
    { sloName: 'freshness_p95_tier2', timeWindow: '1h', alarmSuffix: 'freshness-tier2-slo-breach' },
    { sloName: 'quote_success_rate', timeWindow: '1h', alarmSuffix: 'quote-success-slo-breach' },
    { sloName: 'quote_success_rate_tier2', timeWindow: '1h', alarmSuffix: 'quote-success-tier2-slo-breach' },
    { sloName: 'provider_coverage', timeWindow: '1h', alarmSuffix: 'provider-coverage-slo-breach' },
    { sloName: 'provider_coverage_tier2', timeWindow: '1h', alarmSuffix: 'provider-coverage-tier2-slo-breach' },
    { sloName: 'gold_export_lag', timeWindow: 'live_p95', alarmSuffix: 'gold-export-lag-slo-breach' },
    { sloName: 'indices_available_ratio', timeWindow: '1h', alarmSuffix: 'indices-available-slo-breach' },
    { sloName: 'indices_suppressed_ratio', timeWindow: '1h', alarmSuffix: 'indices-suppressed-slo-breach' },
    { sloName: 'weight_confidence_p10', timeWindow: '1h', alarmSuffix: 'weight-confidence-p10-slo-breach' },
  ]

  for (const config of sloAlarmConfigs) {
    const alarm = new Alarm(scope, `SloBreach-${config.sloName}-${config.timeWindow}`, {
      alarmName: useExplicitAlarmNames
        ? `remit-scout-${options.envName}-${config.alarmSuffix}`
        : undefined,
      metric: new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_breach_total',
        dimensionsMap: {
          slo_name: config.sloName,
          time_window: config.timeWindow,
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: sloMissingDataBehavior,
      alarmDescription: `SLO breach detected for ${config.sloName} (${config.timeWindow})`,
    })
    alarm.addAlarmAction(opsAction)
  }

  const oandaSyncFailureAlarm = new Alarm(scope, 'OandaSyncFailureAlarm', {
    alarmName: `remit-scout-${options.envName}-oanda-sync-failures`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'oanda_sync_failures_total',
      dimensionsMap: {
        JobName: 'oanda-sync',
        environment: options.envName,
      },
      statistic: 'Sum',
      period: Duration.hours(1),
    }),
    threshold: 1,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'OANDA sync failures detected in the last hour',
  })
  oandaSyncFailureAlarm.addAlarmAction(opsAction)

  const batchJobNames = [
    'gold-publisher-job',
    'gold-indices-job',
    'gold-pulse-cache-job',
    'institutional-daily-export-job',
    'gold-reconciliation-job',
    'provider-weighting-job',
    'data-health-slo',
    'b2b-sweep-scheduler',
    'stoplist-auto-resume',
    'quote-refresh-queue-cleanup',
    'audit-log-cleanup',
    // smart-alerts-job computes corridor signals and rate snapshots on a scheduled cadence
    'smart-alerts-job',
    // refreshes alert/watchlist corridors before evaluation runs
    'alert-corridor-refresh-job',
  ]
  batchJobNames.forEach((jobName) => {
    const alarm = new Alarm(scope, `BatchJobFailure-${jobName}`, {
      alarmName: useExplicitAlarmNames
        ? `remit-scout-${options.envName}-${jobName}-failure`
        : undefined,
      metric: new Metric({
        namespace: 'RemitScout/BatchJobs',
        metricName: 'job_failure',
        statistic: 'Sum',
        period: Duration.minutes(5),
        dimensionsMap: {
          JobName: jobName,
          environment: options.envName,
        },
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `Batch job failure detected for ${jobName}`,
    })
    alarm.addAlarmAction(opsAction)
  })

  // SQS Queue Depth Alarms (threshold: 1000 messages)
  const queueDepthThreshold = isProd ? 1000 : (isStaging ? 500 : 200)
  const queueDepthAlarms = [
    { name: 'QuoteRefresh', queue: options.queues.quoteRefreshQueue },
    { name: 'FxRateRefresh', queue: options.queues.fxRateRefreshQueue },
    { name: 'ExportJob', queue: options.queues.exportJobQueue },
    { name: 'AlertEvaluation', queue: options.queues.alertEvaluationQueue },
    { name: 'IngestFanout', queue: options.queues.ingestFanoutQueue },
    { name: 'IngestFanoutTier2', queue: options.queues.ingestFanoutTier2Queue },
    { name: 'GoldLive', queue: options.queues.goldLiveQueue },
    { name: 'Notifications', queue: options.queues.notificationsQueue },
    { name: 'OpsAlerts', queue: options.queues.opsAlertsQueue },
  ].map(({ name, queue }) =>
    new Alarm(scope, `${name}QueueDepthAlarm`, {
      alarmName: `remit-scout-${options.envName}-${name.toLowerCase()}-queue-depth`,
      metric: queue.metricApproximateNumberOfMessagesVisible({
        period: Duration.minutes(5),
      }),
      threshold: queueDepthThreshold,
      evaluationPeriods: 2,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `${name} queue depth exceeds ${queueDepthThreshold} messages`,
    }),
  )

  for (const alarm of queueDepthAlarms) {
    alarm.addAlarmAction(opsAction)
  }

  const shortQueueAgeThresholdSeconds = isProd ? 300 : (isStaging ? 600 : 1200)
  const standardQueueAgeThresholdSeconds = isProd ? 600 : (isStaging ? 900 : 1800)
  const longQueueAgeThresholdSeconds = isProd ? 1800 : (isStaging ? 3600 : 7200)

  const queueAgeAlarms = [
    {
      name: 'QuoteRefresh',
      queue: options.queues.quoteRefreshQueue,
      thresholdSeconds: standardQueueAgeThresholdSeconds,
    },
    {
      name: 'FxRateRefresh',
      queue: options.queues.fxRateRefreshQueue,
      thresholdSeconds: standardQueueAgeThresholdSeconds,
    },
    {
      name: 'AlertEvaluation',
      queue: options.queues.alertEvaluationQueue,
      thresholdSeconds: standardQueueAgeThresholdSeconds,
    },
    {
      name: 'ExportJob',
      queue: options.queues.exportJobQueue,
      thresholdSeconds: longQueueAgeThresholdSeconds,
    },
    {
      name: 'Notifications',
      queue: options.queues.notificationsQueue,
      thresholdSeconds: shortQueueAgeThresholdSeconds,
    },
    {
      name: 'OpsAlerts',
      queue: options.queues.opsAlertsQueue,
      thresholdSeconds: shortQueueAgeThresholdSeconds,
    },
  ].map(({ name, queue, thresholdSeconds }) =>
    new Alarm(scope, `${name}QueueAgeAlarm`, {
      alarmName: `remit-scout-${options.envName}-${name.toLowerCase()}-queue-age`,
      metric: queue.metricApproximateAgeOfOldestMessage({
        period: Duration.minutes(5),
      }),
      threshold: thresholdSeconds,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `${name} queue age exceeds ${thresholdSeconds}s`,
    }),
  )

  for (const alarm of queueAgeAlarms) {
    alarm.addAlarmAction(opsAction)
  }

  const ingestFanoutHardMaxSeconds = 24 * 60 * 60
  const ingestFanoutQueues = [
    { name: 'IngestFanout', queue: options.queues.ingestFanoutQueue, thresholdSeconds: 15 * 60 },
    { name: 'IngestFanoutTier2', queue: options.queues.ingestFanoutTier2Queue, thresholdSeconds: 3 * 60 * 60 },
  ]
  for (const { name, queue, thresholdSeconds } of ingestFanoutQueues) {
    const ageAlarm = new Alarm(scope, `${name}AgeAlarm`, {
      alarmName: `remit-scout-${options.envName}-${name.toLowerCase()}-age`,
      metric: queue.metricApproximateAgeOfOldestMessage({
        period: Duration.minutes(5),
      }),
      threshold: thresholdSeconds,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `${name} queue age exceeds ${thresholdSeconds}s sweep deadline`,
    })
    ageAlarm.addAlarmAction(opsAction)

    const hardMaxAlarm = new Alarm(scope, `${name}AgeHardMaxAlarm`, {
      alarmName: `remit-scout-${options.envName}-${name.toLowerCase()}-age-hard-max`,
      metric: queue.metricApproximateAgeOfOldestMessage({
        period: Duration.minutes(5),
      }),
      threshold: ingestFanoutHardMaxSeconds,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `${name} queue age exceeds 24h hard max`,
    })
    hardMaxAlarm.addAlarmAction(criticalAction)
  }

  const goldLiveAgeThresholdSeconds = options.envName === 'prod' ? 120 : 300
  const goldLiveAgeAlarm = new Alarm(scope, 'GoldLiveAgeAlarm', {
    alarmName: `remit-scout-${options.envName}-gold-live-age`,
    metric: options.queues.goldLiveQueue.metricApproximateAgeOfOldestMessage({
      period: Duration.minutes(5),
    }),
    threshold: goldLiveAgeThresholdSeconds,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Gold live queue age exceeds freshness target',
  })
  goldLiveAgeAlarm.addAlarmAction(opsAction)

  // Worker Lock Acquisition Failure Alarms (per worker)
  const lockFailureWorkers = ['export-queue-worker', 'export-db-worker']
  lockFailureWorkers.forEach((workerName) => {
    const alarm = new Alarm(scope, `WorkerLockFailure-${workerName}`, {
      alarmName: `remit-scout-${options.envName}-${workerName}-lock-failure`,
      metric: new Metric({
        namespace: 'RemitScout/Workers',
        metricName: 'lock_failed',
        statistic: 'Sum',
        period: Duration.minutes(5),
        dimensionsMap: {
          WorkerName: workerName,
          environment: options.envName,
        },
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `Worker lock acquisition failures detected for ${workerName}`,
    })
    alarm.addAlarmAction(opsAction)
  })

  // Provider Probe Failure Alarms (providers sourced from `.remit-scout/providers/catalog.json`)
  const probeFailureAlarms = probeProviders.map((providerId) =>
    new Alarm(scope, `${providerId.charAt(0).toUpperCase() + providerId.slice(1)}ProbeFailureAlarm`, {
      alarmName: `remit-scout-${options.envName}-${providerId}-probe-failure`,
      metric: new Metric({
        namespace: 'RemitScout/Probes',
        metricName: 'probe_result',
        statistic: 'Sum',
        period: Duration.minutes(5),
        dimensionsMap: {
          ProviderId: providerId,
          Status: 'failure',
          environment: options.envName,
        },
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `${providerId} provider probe failure detected`,
    }),
  )

  for (const alarm of probeFailureAlarms) {
    alarm.addAlarmAction(warningAction)
  }

  const probeHeartbeatAlarms = probeProviders.map((providerId) =>
    new Alarm(scope, `${providerId.charAt(0).toUpperCase() + providerId.slice(1)}ProbeHeartbeatAlarm`, {
      alarmName: `remit-scout-${options.envName}-${providerId}-probe-heartbeat`,
      metric: new Metric({
        namespace: 'RemitScout/Probes',
        metricName: 'probe_run_total',
        statistic: 'Sum',
        period: Duration.minutes(15),
        dimensionsMap: {
          ProviderId: providerId,
          environment: options.envName,
        },
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.BREACHING,
      alarmDescription: `${providerId} probe heartbeat missing`,
    }),
  )

  for (const alarm of probeHeartbeatAlarms) {
    alarm.addAlarmAction(isProd ? opsAction : warningAction)
  }

  // Aggregate probe failure signal: pages ops when multiple providers fail at once.
  // This metric is emitted by probes without ProviderId dimension to avoid CloudWatch
  // alarm metric-query cardinality limits.
  const probeFailuresAllProviders5m = new Metric({
    namespace: 'RemitScout/Probes',
    metricName: 'probe_result_global',
    statistic: 'Sum',
    period: Duration.minutes(5),
    dimensionsMap: {
      Status: 'failure',
      environment: options.envName,
    },
  })

  const probeFailureBurstThreshold = isProd ? 3 : 5
  const probeFailureBurstAlarm = new Alarm(scope, 'ProviderProbeFailureBurstAlarm', {
    alarmName: `remit-scout-${options.envName}-provider-probe-failures-high`,
    metric: probeFailuresAllProviders5m,
    threshold: probeFailureBurstThreshold,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: `Multiple provider probe failures detected (>=${probeFailureBurstThreshold} in 5m)`,
  })
  probeFailureBurstAlarm.addAlarmAction(isProd ? opsAction : warningAction)

  // API Health Alarms
  // High API Error Rate: > 5% for 5 minutes
  const apiErrorRateThreshold = isProd ? 0.02 : (isStaging ? 0.05 : 0.1)
  const apiErrorRateAlarm = new Alarm(scope, 'HighAPIErrorRateAlarm', {
    alarmName: `remit-scout-${options.envName}-api-error-rate-high`,
    metric: planeA5xxRate,
    threshold: apiErrorRateThreshold,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: `Plane A 5xx error rate exceeds ${apiErrorRateThreshold * 100}%`,
  })
  apiErrorRateAlarm.addAlarmAction(warningAction)

  const api4xxRateAlarm = new Alarm(scope, 'HighAPI4xxRateAlarm', {
    alarmName: `remit-scout-${options.envName}-api-4xx-rate-high`,
    metric: planeA4xxRate,
    threshold: 0.10,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Plane A 4xx error rate exceeds 10% for 5 minutes',
  })
  api4xxRateAlarm.addAlarmAction(warningAction)

  // High API Latency: P95 > 5 seconds for 10 minutes
  const apiLatencyThresholdMs = isProd ? 800 : (isStaging ? 1000 : 1500)
  const apiLatencyAlarm = new Alarm(scope, 'HighAPILatencyAlarm', {
    alarmName: `remit-scout-${options.envName}-api-latency-high`,
    metric: new Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiId: options.api.planeAApi.httpApiId,
        Stage: '$default',
      },
      statistic: 'p95',
      period: Duration.minutes(5),
    }),
    threshold: apiLatencyThresholdMs,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: `P95 latency exceeds ${apiLatencyThresholdMs}ms`,
  })
  apiLatencyAlarm.addAlarmAction(warningAction)

  const apiP99LatencyAlarm = new Alarm(scope, 'HighAPIP99LatencyAlarm', {
    alarmName: `remit-scout-${options.envName}-api-p99-latency-high`,
    metric: new Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiId: options.api.planeAApi.httpApiId,
        Stage: '$default',
      },
      statistic: 'p99',
      period: Duration.minutes(5),
    }),
    threshold: 5000,
    evaluationPeriods: 3,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Plane A API p99 latency exceeds 5s for 3 datapoints',
  })
  apiP99LatencyAlarm.addAlarmAction(warningAction)

  const crossPlaneHopLatencyThreshold = isProd ? 1200 : (isStaging ? 1800 : 2500)
  const crossPlaneHopLatencyAlarm = new Alarm(scope, 'CrossPlaneHopLatencyAlarm', {
    alarmName: `remit-scout-${options.envName}-cross-plane-hop-latency-high`,
    metric: new Metric({
      namespace: 'RemitScout/Tracing',
      metricName: 'cross_plane_hop_duration_ms',
      dimensionsMap: {
        environment: options.envName,
      },
      statistic: 'p95',
      period: Duration.minutes(5),
    }),
    threshold: crossPlaneHopLatencyThreshold,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: `Cross-plane hop p95 exceeds ${crossPlaneHopLatencyThreshold}ms`,
  })
  crossPlaneHopLatencyAlarm.addAlarmAction(isProd ? opsAction : warningAction)

  const crossPlaneErrorAmplificationAlarm = new Alarm(scope, 'CrossPlaneErrorAmplificationAlarm', {
    alarmName: `remit-scout-${options.envName}-cross-plane-error-amplification-high`,
    metric: new Metric({
      namespace: 'RemitScout/Tracing',
      metricName: 'cross_plane_error_amplification',
      dimensionsMap: {
        environment: options.envName,
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
    threshold: 1.2,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Cross-plane error amplification ratio exceeds 1.2',
  })
  crossPlaneErrorAmplificationAlarm.addAlarmAction(isProd ? opsAction : warningAction)

  // API Endpoint Down: Lambda function errors
  const apiEndpointDownAlarm = new Alarm(scope, 'APIEndpointDownAlarm', {
    alarmName: `remit-scout-${options.envName}-api-endpoint-down`,
    metric: options.api.planeAFunction.metricErrors({ period: Duration.minutes(1) }),
    threshold: 1,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.BREACHING,
    alarmDescription: 'Plane A API is not responding to health checks',
  })
  apiEndpointDownAlarm.addAlarmAction(criticalAction)

  // Per-provider collection quality alarm:
  // Trigger when any provider has at least 10 failures in 5 minutes and a
  // failure rate above 50% over the same interval.
  const providerFailureRateAlarms = collectionProviders.map((providerId) => {
    const failures = new Metric({
      namespace: 'RemitScout',
      metricName: 'provider_collection_failure_by_provider_total',
      statistic: 'Sum',
      period: Duration.minutes(5),
      dimensionsMap: {
        provider_id: providerId,
        environment: options.envName,
      },
    })
    const successes = new Metric({
      namespace: 'RemitScout',
      metricName: 'provider_collection_success_by_provider_total',
      statistic: 'Sum',
      period: Duration.minutes(5),
      dimensionsMap: {
        provider_id: providerId,
        environment: options.envName,
      },
    })
    const failureRateWhenFailureVolumeHigh = new MathExpression({
      expression: 'IF(f>=10, IF((f+s)>0, f/(f+s), 0), 0)',
      usingMetrics: {
        f: failures,
        s: successes,
      },
      period: Duration.minutes(5),
      label: `${providerId} collection failure rate`,
    })
    return new Alarm(scope, `ProviderCollectionFailureRate-${providerId}`, {
      alarmName: useExplicitAlarmNames
        ? `remit-scout-${options.envName}-provider-${providerId}-failure-rate`
        : undefined,
      metric: failureRateWhenFailureVolumeHigh,
      threshold: 0.5,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `${providerId} has >=10 failures in 5m and failure ratio above 50%`,
    })
  })

  for (const alarm of providerFailureRateAlarms) {
    alarm.addAlarmAction(opsAction)
  }

  // Backpressure alarm (custom metric emitted by Plane B / scheduler)
  const backpressureWorkers = ['b2b-sweep-scheduler', 'plane-b-ingest']
  backpressureWorkers.forEach((worker) => {
    const alarm = new Alarm(scope, `WorkerBackpressure-${worker}`, {
      alarmName: useExplicitAlarmNames
        ? `remit-scout-${options.envName}-${worker}-backpressure`
        : undefined,
      metric: new Metric({
        namespace: 'RemitScout',
        metricName: 'worker_backpressure_active',
        statistic: 'Average',
        period: Duration.minutes(1),
        dimensionsMap: {
          worker,
          environment: options.envName,
        },
      }),
      threshold: 1,
      evaluationPeriods: 5,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `${worker} backpressure active for >= 5 minutes`,
    })
    alarm.addAlarmAction(opsAction)
  })

  if (isProd || isStaging) {
    const envelopeParseErrorWorkers = [
      'ingest-fanout-worker',
      'gold-live-worker',
      'b2c-refresh-worker',
      'fx-rate-refresh-worker',
    ]
    envelopeParseErrorWorkers.forEach((worker) => {
      const alarm = new Alarm(scope, `EnvelopeParseError-${worker}`, {
        alarmName: useExplicitAlarmNames
          ? `remit-scout-${options.envName}-${worker}-envelope-parse-error`
          : undefined,
        metric: new Metric({
          namespace: 'RemitScout/Workers',
          metricName: 'envelope_parse_error',
          statistic: 'Sum',
          period: Duration.minutes(5),
          dimensionsMap: {
            WorkerName: worker,
            environment: options.envName,
          },
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
        alarmDescription: `${worker} observed envelope parse errors in the last 5 minutes`,
      })
      alarm.addAlarmAction(opsAction)
    })
  }

  // Additional Dashboard Widgets for Data Health
  const dataFreshnessWidget = new GraphWidget({
    title: 'Data Freshness P95',
    left: [
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_actual_value',
        dimensionsMap: {
          slo_name: 'freshness_p95',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_actual_value',
        dimensionsMap: {
          slo_name: 'freshness_p95_tier2',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
    ],
    period: Duration.minutes(5),
  })

  const quoteSuccessRateWidget = new GraphWidget({
    title: 'Quote Success Rate by Provider',
    left: [
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_actual_value',
        dimensionsMap: {
          slo_name: 'quote_success_rate',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_actual_value',
        dimensionsMap: {
          slo_name: 'quote_success_rate_tier2',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
    ],
    period: Duration.minutes(5),
  })

  const providerCoverageWidget = new GraphWidget({
    title: 'Provider Coverage by Corridor',
    left: [
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_actual_value',
        dimensionsMap: {
          slo_name: 'provider_coverage',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Minimum',
        period: Duration.minutes(5),
      }),
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_actual_value',
        dimensionsMap: {
          slo_name: 'provider_coverage_tier2',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Minimum',
        period: Duration.minutes(5),
      }),
    ],
    period: Duration.minutes(5),
  })

  const sloComplianceWidget = new GraphWidget({
    title: 'SLO Compliance Ratios',
    left: [
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_compliance_ratio',
        dimensionsMap: {
          slo_name: 'freshness_p95',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_compliance_ratio',
        dimensionsMap: {
          slo_name: 'freshness_p95_tier2',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_compliance_ratio',
        dimensionsMap: {
          slo_name: 'quote_success_rate',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_compliance_ratio',
        dimensionsMap: {
          slo_name: 'quote_success_rate_tier2',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_compliance_ratio',
        dimensionsMap: {
          slo_name: 'provider_coverage',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_compliance_ratio',
        dimensionsMap: {
          slo_name: 'provider_coverage_tier2',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_compliance_ratio',
        dimensionsMap: {
          slo_name: 'gold_export_lag',
          time_window: 'live_p95',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
    ],
    period: Duration.minutes(5),
  })

  const indicesReadinessWidget = new GraphWidget({
    title: 'Indices Readiness (Tier-0)',
    left: [
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_actual_value',
        dimensionsMap: {
          slo_name: 'indices_available_ratio',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_actual_value',
        dimensionsMap: {
          slo_name: 'indices_suppressed_ratio',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      new Metric({
        namespace: 'RemitScout',
        metricName: 'slo_actual_value',
        dimensionsMap: {
          slo_name: 'weight_confidence_p10',
          time_window: '1h',
          environment: options.envName,
          service: serviceDimension,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
    ],
    period: Duration.minutes(5),
  })

  const probeHeartbeatWidget = new GraphWidget({
    title: 'Probe Heartbeat (runs/15m)',
    left: probeProviders.map((providerId) =>
      new Metric({
        namespace: 'RemitScout/Probes',
        metricName: 'probe_run_total',
        dimensionsMap: {
          ProviderId: providerId,
          environment: options.envName,
        },
        statistic: 'Sum',
        period: Duration.minutes(15),
      }),
    ),
    period: Duration.minutes(15),
  })

  const collectorBlocksWidget = new GraphWidget({
    title: 'Collector Blocks (health_probe)',
    left: probeProviders.map((providerId) =>
      new Metric({
        namespace: 'RemitScout/Collectors',
        metricName: 'collector_block_count',
        dimensionsMap: {
          ProviderId: providerId,
          CollectorType: 'health_probe',
          environment: options.envName,
        },
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
    ),
    period: Duration.minutes(5),
  })

  const collectorAvgAttemptWidget = new GraphWidget({
    title: 'Collector Avg Attempt (health_probe ms)',
    left: probeProviders.map((providerId) =>
      new Metric({
        namespace: 'RemitScout/Collectors',
        metricName: 'collector_avg_attempt_ms',
        dimensionsMap: {
          ProviderId: providerId,
          CollectorType: 'health_probe',
          environment: options.envName,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
    ),
    period: Duration.minutes(5),
  })

  // ── Agent Infrastructure Alarms ──────────────────────────────────────

  const agentNamespace = 'RemitScout/Agents'
  const agentPeriod = Duration.minutes(5)

  // Orchestrator health: alarm if no detection cycles run in 10 minutes
  const orchestratorStallAlarm = new Alarm(scope, 'OrchestratorDetectionStall', {
    ...(useExplicitAlarmNames ? { alarmName: `${options.envName}-orchestrator-detection-stall` } : {}),
    alarmDescription: 'Agent orchestrator has not completed a detection cycle in 10 minutes',
    metric: new Metric({
      namespace: agentNamespace,
      metricName: 'detection_cycle_count',
      dimensionsMap: { environment: options.envName, service: serviceDimension },
      statistic: 'Sum',
      period: Duration.minutes(10),
    }),
    threshold: 1,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.BREACHING,
  })
  orchestratorStallAlarm.addAlarmAction(new SnsAction(options.criticalTopic))

  // Failure bundle creation rate: alarm if > 20 bundles in 15 minutes (burst)
  const failureBundleBurstAlarm = new Alarm(scope, 'FailureBundleBurst', {
    ...(useExplicitAlarmNames ? { alarmName: `${options.envName}-failure-bundle-burst` } : {}),
    alarmDescription: 'High rate of failure bundle creation indicates widespread provider issues',
    metric: new Metric({
      namespace: agentNamespace,
      metricName: 'failure_bundle_created',
      dimensionsMap: { environment: options.envName, service: serviceDimension },
      statistic: 'Sum',
      period: Duration.minutes(15),
    }),
    threshold: 20,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
  })
  failureBundleBurstAlarm.addAlarmAction(new SnsAction(options.warningTopic))

  // Repair pipeline throughput: alarm if proposals queue stalls (0 proposals in 30 min when bundles exist)
  const repairPipelineStallAlarm = new Alarm(scope, 'RepairPipelineStall', {
    ...(useExplicitAlarmNames ? { alarmName: `${options.envName}-repair-pipeline-stall` } : {}),
    alarmDescription: 'Repair pipeline has pending bundles but no proposals generated in 30 minutes',
    metric: new Metric({
      namespace: agentNamespace,
      metricName: 'repair_proposal_generated',
      dimensionsMap: { environment: options.envName, service: serviceDimension },
      statistic: 'Sum',
      period: Duration.minutes(30),
    }),
    threshold: 1,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
  })
  repairPipelineStallAlarm.addAlarmAction(new SnsAction(options.warningTopic))

  // Tool gateway policy violations: alarm if > 10 blocked requests in 5 min
  const toolGatewayViolationsAlarm = new Alarm(scope, 'ToolGatewayPolicyViolations', {
    ...(useExplicitAlarmNames ? { alarmName: `${options.envName}-tool-gateway-violations` } : {}),
    alarmDescription: 'Agent tool requests blocked by policy — possible misconfiguration or escalation attempt',
    metric: new Metric({
      namespace: agentNamespace,
      metricName: 'tool_request_blocked',
      dimensionsMap: { environment: options.envName, service: serviceDimension },
      statistic: 'Sum',
      period: agentPeriod,
    }),
    threshold: 10,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
  })
  toolGatewayViolationsAlarm.addAlarmAction(new SnsAction(options.criticalTopic))

  // Knowledge plane retrieval quality: alarm if retrieval insufficient > 50% of searches
  const knowledgeQualityAlarm = new Alarm(scope, 'KnowledgePlaneRetrievalQuality', {
    ...(useExplicitAlarmNames ? { alarmName: `${options.envName}-knowledge-retrieval-quality` } : {}),
    alarmDescription: 'Knowledge plane retrieval quality is insufficient for agent decision-making',
    metric: new MathExpression({
      expression: 'IF(total > 0, insufficient / total, 0)',
      usingMetrics: {
        insufficient: new Metric({
          namespace: agentNamespace,
          metricName: 'knowledge_retrieval_insufficient',
          dimensionsMap: { environment: options.envName, service: serviceDimension },
          statistic: 'Sum',
          period: Duration.minutes(15),
        }),
        total: new Metric({
          namespace: agentNamespace,
          metricName: 'knowledge_retrieval_total',
          dimensionsMap: { environment: options.envName, service: serviceDimension },
          statistic: 'Sum',
          period: Duration.minutes(15),
        }),
      },
      period: Duration.minutes(15),
    }),
    threshold: 0.5,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
  })
  knowledgeQualityAlarm.addAlarmAction(new SnsAction(options.warningTopic))

  // Stress responder escalation: alarm when any corridor reaches "incident" level
  const stressEscalationAlarm = new Alarm(scope, 'CorridorStressIncident', {
    ...(useExplicitAlarmNames ? { alarmName: `${options.envName}-corridor-stress-incident` } : {}),
    alarmDescription: 'A corridor has escalated to incident-level stress — sustained high failure rate',
    metric: new Metric({
      namespace: agentNamespace,
      metricName: 'stress_escalation_incident',
      dimensionsMap: { environment: options.envName, service: serviceDimension },
      statistic: 'Sum',
      period: agentPeriod,
    }),
    threshold: 1,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
  })
  stressEscalationAlarm.addAlarmAction(new SnsAction(options.criticalTopic))

  // Agent DLQ depth: alarm if agent-failure DLQ has messages
  if (options.queues.agentFailureDlq) {
    const agentDlqAlarm = new Alarm(scope, 'AgentFailureDlqDepth', {
      ...(useExplicitAlarmNames ? { alarmName: `${options.envName}-agent-failure-dlq-depth` } : {}),
      alarmDescription: 'Agent failure DLQ has unprocessed messages — agent jobs are failing',
      metric: options.queues.agentFailureDlq.metricApproximateNumberOfMessagesVisible({
        period: agentPeriod,
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    })
    agentDlqAlarm.addAlarmAction(new SnsAction(options.warningTopic))
  }

  // Normalization DLQ depth: alarm if normalization DLQ has messages
  if (options.queues.normalizationDlq) {
    const normDlqAlarm = new Alarm(scope, 'NormalizationDlqDepth', {
      ...(useExplicitAlarmNames ? { alarmName: `${options.envName}-normalization-dlq-depth` } : {}),
      alarmDescription: 'Normalization DLQ has unprocessed messages — factor extraction failing',
      metric: options.queues.normalizationDlq.metricApproximateNumberOfMessagesVisible({
        period: agentPeriod,
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    })
    normDlqAlarm.addAlarmAction(new SnsAction(options.warningTopic))
  }

  // Agent infrastructure dashboard widgets
  const agentHealthWidget = new GraphWidget({
    title: 'Agent Orchestrator Health',
    left: [
      new Metric({
        namespace: agentNamespace,
        metricName: 'detection_cycle_count',
        dimensionsMap: { environment: options.envName, service: serviceDimension },
        statistic: 'Sum',
        period: agentPeriod,
      }),
      new Metric({
        namespace: agentNamespace,
        metricName: 'failure_bundle_created',
        dimensionsMap: { environment: options.envName, service: serviceDimension },
        statistic: 'Sum',
        period: agentPeriod,
      }),
      new Metric({
        namespace: agentNamespace,
        metricName: 'repair_proposal_generated',
        dimensionsMap: { environment: options.envName, service: serviceDimension },
        statistic: 'Sum',
        period: agentPeriod,
      }),
    ],
    period: agentPeriod,
  })

  const toolGatewayWidget = new GraphWidget({
    title: 'Tool Gateway Activity',
    left: [
      new Metric({
        namespace: agentNamespace,
        metricName: 'tool_request_total',
        dimensionsMap: { environment: options.envName, service: serviceDimension },
        statistic: 'Sum',
        period: agentPeriod,
      }),
      new Metric({
        namespace: agentNamespace,
        metricName: 'tool_request_blocked',
        dimensionsMap: { environment: options.envName, service: serviceDimension },
        statistic: 'Sum',
        period: agentPeriod,
      }),
    ],
    period: agentPeriod,
  })

  dashboard.addWidgets(
    dataFreshnessWidget,
    quoteSuccessRateWidget,
    providerCoverageWidget,
    sloComplianceWidget,
    indicesReadinessWidget,
    probeHeartbeatWidget,
    collectorBlocksWidget,
    collectorAvgAttemptWidget,
    agentHealthWidget,
    toolGatewayWidget,
  )

  return {
    dashboard,
    criticalTopic: options.criticalTopic,
    warningTopic: options.warningTopic,
    opsTopic: options.opsTopic,
  }
}
