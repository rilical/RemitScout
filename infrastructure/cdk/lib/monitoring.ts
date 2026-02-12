import { Duration } from 'aws-cdk-lib'
import {
  Alarm,
  ComparisonOperator,
  Dashboard,
  GraphWidget,
  MathExpression,
  Metric,
  TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions'
import type { QueueResources } from './queues'
import type { ApiResources } from './api'
import type { EcsServiceResources } from './ecs-services'
import type { DatabaseResources } from './database'
import type { CacheResources } from './cache'
import type { Construct } from 'constructs'

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
  const planeA5xxRate = new MathExpression({
    label: 'Plane A 5xx Rate',
    expression: 'IF(mcountA>0, m5xxA/mcountA, 0)',
    usingMetrics: {
      mcountA: planeARequestCount,
      m5xxA: planeA5xxCount,
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
      options.ecs.planeBIngestService.metricCpuUtilization(),
      options.ecs.b2cRefreshService.metricCpuUtilization(),
      options.ecs.fxRateRefreshService.metricCpuUtilization(),
      options.ecs.ingestFanoutTier1Service.metricCpuUtilization(),
      options.ecs.ingestFanoutTier2Service.metricCpuUtilization(),
      options.ecs.goldLiveService.metricCpuUtilization(),
      options.ecs.notificationsQueueService.metricCpuUtilization(),
      options.ecs.opsAlertsQueueService.metricCpuUtilization(),
    ],
    period: Duration.minutes(5),
  })

  const ecsMemoryWidget = new GraphWidget({
    title: 'ECS Memory Utilization',
    left: [
      options.ecs.planeBIngestService.metricMemoryUtilization(),
      options.ecs.b2cRefreshService.metricMemoryUtilization(),
      options.ecs.fxRateRefreshService.metricMemoryUtilization(),
      options.ecs.ingestFanoutTier1Service.metricMemoryUtilization(),
      options.ecs.ingestFanoutTier2Service.metricMemoryUtilization(),
      options.ecs.goldLiveService.metricMemoryUtilization(),
      options.ecs.notificationsQueueService.metricMemoryUtilization(),
      options.ecs.opsAlertsQueueService.metricMemoryUtilization(),
    ],
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
    lambdaErrorWidget,
    apiLatencyWidget,
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
    'gold-reconciliation-job',
    'provider-weighting-job',
    'data-health-slo',
    'b2b-sweep-scheduler',
    'stoplist-auto-resume',
    'quote-refresh-queue-cleanup',
    'audit-log-cleanup',
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

  const ingestFanoutAgeThresholdSeconds =
    options.envName === 'prod' ? 4 * 60 * 60 : 6 * 60 * 60
  const ingestFanoutHardMaxSeconds = 24 * 60 * 60
  const ingestFanoutQueues = [
    { name: 'IngestFanout', queue: options.queues.ingestFanoutQueue },
    { name: 'IngestFanoutTier2', queue: options.queues.ingestFanoutTier2Queue },
  ]
  for (const { name, queue } of ingestFanoutQueues) {
    const ageAlarm = new Alarm(scope, `${name}AgeAlarm`, {
      alarmName: `remit-scout-${options.envName}-${name.toLowerCase()}-age`,
      metric: queue.metricApproximateAgeOfOldestMessage({
        period: Duration.minutes(5),
      }),
      threshold: ingestFanoutAgeThresholdSeconds,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `${name} queue age exceeds sweep deadline`,
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

  // Provider Probe Failure Alarms
  const probeProviders = [
    'remitly',
    'westernunion',
    'wise',
    'worldremit',
    'ria',
    'dahabshiil',
    'sendwave',
    'mukuru',
    'xe',
    'alansari',
    'instarem',
    'xoom',
    'singx',
  ]
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

  // Provider health alarms that rely on custom metrics should be added only
  // once those metrics are emitted with stable dimensions.

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

  dashboard.addWidgets(
    dataFreshnessWidget,
    quoteSuccessRateWidget,
    providerCoverageWidget,
    sloComplianceWidget,
    indicesReadinessWidget,
    probeHeartbeatWidget,
  )

  return {
    dashboard,
    criticalTopic: options.criticalTopic,
    warningTopic: options.warningTopic,
    opsTopic: options.opsTopic,
  }
}
