import { Duration } from 'aws-cdk-lib'
import {
  Alarm,
  ComparisonOperator,
  Dashboard,
  GraphWidget,
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
  alertsTopic: Topic
}

export type MonitoringOptions = {
  envName: string
  queues: QueueResources
  api: ApiResources
  ecs: EcsServiceResources
  database: DatabaseResources
  cache: CacheResources
  alertsTopic: Topic
}

export const createMonitoring = (
  scope: Construct,
  options: MonitoringOptions,
): MonitoringResources => {
  const alertsTopic = options.alertsTopic

  const dashboard = new Dashboard(scope, 'RemitScoutDashboard', {
    dashboardName: `remit-scout-${options.envName}`,
  })

  const queueDepthWidget = new GraphWidget({
    title: 'SQS Queue Depth',
    left: [
      options.queues.quoteRefreshQueue.metricApproximateNumberOfMessagesVisible(),
      options.queues.exportJobQueue.metricApproximateNumberOfMessagesVisible(),
      options.queues.alertEvaluationQueue.metricApproximateNumberOfMessagesVisible(),
      options.queues.ingestFanoutQueue.metricApproximateNumberOfMessagesVisible(),
      options.queues.notificationsQueue.metricApproximateNumberOfMessagesVisible(),
      options.queues.opsAlertsQueue.metricApproximateNumberOfMessagesVisible(),
    ],
    period: Duration.minutes(5),
  })

  const dlqDepthWidget = new GraphWidget({
    title: 'SQS DLQ Depth',
    left: [
      options.queues.quoteRefreshDlq.metricApproximateNumberOfMessagesVisible(),
      options.queues.exportJobDlq.metricApproximateNumberOfMessagesVisible(),
      options.queues.alertEvaluationDlq.metricApproximateNumberOfMessagesVisible(),
      options.queues.ingestFanoutDlq.metricApproximateNumberOfMessagesVisible(),
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

  const ecsCpuWidget = new GraphWidget({
    title: 'ECS CPU Utilization',
    left: [
      options.ecs.planeBIngestService.metricCpuUtilization(),
      options.ecs.ingestFanoutService.metricCpuUtilization(),
      options.ecs.notificationsQueueService.metricCpuUtilization(),
      options.ecs.opsAlertsQueueService.metricCpuUtilization(),
    ],
    period: Duration.minutes(5),
  })

  const ecsMemoryWidget = new GraphWidget({
    title: 'ECS Memory Utilization',
    left: [
      options.ecs.planeBIngestService.metricMemoryUtilization(),
      options.ecs.ingestFanoutService.metricMemoryUtilization(),
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
    ecsCpuWidget,
    ecsMemoryWidget,
    rdsCpuWidget,
    redisCpuWidget,
  )

  const alarmAction = new SnsAction(alertsTopic)

  const dlqAlarms = [
    options.queues.quoteRefreshDlq,
    options.queues.ingestFanoutDlq,
    options.queues.notificationsDlq,
    options.queues.opsAlertsDlq,
    options.queues.alertEvaluationDlq,
  ].map((queue, index) =>
    new Alarm(scope, `DlqAlarm${index}`, {
      alarmName: `remit-scout-${options.envName}-${queue.queueName}-dlq`,
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
    alarm.addAlarmAction(alarmAction)
  }

  const lambdaErrorAlarm = new Alarm(scope, 'LambdaErrorAlarm', {
    alarmName: `remit-scout-${options.envName}-lambda-errors`,
    metric: options.api.planeAFunction.metricErrors({ period: Duration.minutes(5) }),
    threshold: 1,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
  })
  lambdaErrorAlarm.addAlarmAction(alarmAction)

  const rdsCpuAlarm = new Alarm(scope, 'RdsCpuAlarm', {
    alarmName: `remit-scout-${options.envName}-rds-cpu`,
    metric: options.database.cluster.metricCPUUtilization({ period: Duration.minutes(5) }),
    threshold: 80,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
  })
  rdsCpuAlarm.addAlarmAction(alarmAction)

  // SLO Alarms - Data Health Metrics (from RemitScout namespace)
  // Freshness SLO: p95 freshness ≤ 15 minutes for Tier 1 corridors
  const freshnessSLOAlarm = new Alarm(scope, 'FreshnessSLOAlarm', {
    alarmName: `remit-scout-${options.envName}-freshness-slo-breach`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'data_freshness_age_minutes_p95',
      dimensionsMap: {
        priority_tier: 'tier_1_alpha',
      },
      statistic: 'p95',
      period: Duration.minutes(5),
    }),
    threshold: 15,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Tier 1 corridor freshness exceeds 15 minutes (p95)',
  })
  freshnessSLOAlarm.addAlarmAction(alarmAction)

  // Quote Success Rate SLO: ≥ 98% for Tier 1 corridors
  const quoteSuccessRateAlarm = new Alarm(scope, 'QuoteSuccessRateAlarm', {
    alarmName: `remit-scout-${options.envName}-quote-success-rate-drop`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'quote_success_rate',
      dimensionsMap: {
        priority_tier: 'tier_1_alpha',
      },
      statistic: 'Average',
      period: Duration.minutes(10),
    }),
    threshold: 0.98,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Quote success rate below 98% for Tier 1 corridors',
  })
  quoteSuccessRateAlarm.addAlarmAction(alarmAction)

  const oandaSyncFailureAlarm = new Alarm(scope, 'OandaSyncFailureAlarm', {
    alarmName: `remit-scout-${options.envName}-oanda-sync-failures`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'oanda_sync_failures_total',
      dimensionsMap: {
        JobName: 'oanda-sync',
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
  oandaSyncFailureAlarm.addAlarmAction(alarmAction)

  // Provider Coverage SLO: ≥ 3 providers for Tier 1 corridors
  const providerCoverageAlarm = new Alarm(scope, 'ProviderCoverageAlarm', {
    alarmName: `remit-scout-${options.envName}-provider-coverage-drop`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'provider_coverage_count',
      dimensionsMap: {
        priority_tier: 'tier_1_alpha',
      },
      statistic: 'Minimum',
      period: Duration.minutes(5),
    }),
    threshold: 3,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Provider coverage below 3 for Tier 1 corridors',
  })
  providerCoverageAlarm.addAlarmAction(alarmAction)

  // Batch Job Health Alarms
  // Gold Publisher Job Stuck: Last success > 15 minutes ago
  const goldPublisherStuckAlarm = new Alarm(scope, 'GoldPublisherStuckAlarm', {
    alarmName: `remit-scout-${options.envName}-gold-publisher-stuck`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'gold_publisher_job_last_success_age_seconds',
      statistic: 'Maximum',
      period: Duration.minutes(5),
    }),
    threshold: 900, // 15 minutes
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.BREACHING,
    alarmDescription: 'Gold publisher job has not completed in 15 minutes',
  })
  goldPublisherStuckAlarm.addAlarmAction(alarmAction)

  // Gold Batch Job Failures
  const goldJobFailureAlarm = new Alarm(scope, 'GoldJobFailureAlarm', {
    alarmName: `remit-scout-${options.envName}-gold-job-failures`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'gold_batch_job_failures_total',
      statistic: 'Sum',
      period: Duration.minutes(5),
    }),
    threshold: 0,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'One or more gold batch jobs are experiencing failures',
  })
  goldJobFailureAlarm.addAlarmAction(alarmAction)

  // Gold Batch Job Slow: p95 duration exceeds thresholds
  const goldJobSlowAlarm = new Alarm(scope, 'GoldJobSlowAlarm', {
    alarmName: `remit-scout-${options.envName}-gold-job-slow`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'gold_batch_job_duration_seconds_p95',
      statistic: 'p95',
      period: Duration.minutes(10),
    }),
    threshold: 300, // 5 minutes for most jobs, 10 minutes for pulse cache/publisher
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Gold batch job p95 duration exceeds threshold',
  })
  goldJobSlowAlarm.addAlarmAction(alarmAction)

  // Batch Job Failure Alarms (RemitScout/BatchJobs namespace)
  const batchJobFailureAlarm = new Alarm(scope, 'BatchJobFailureAlarm', {
    alarmName: `remit-scout-${options.envName}-batch-job-failures`,
    metric: new Metric({
      namespace: 'RemitScout/BatchJobs',
      metricName: 'job_failure',
      statistic: 'Sum',
      period: Duration.minutes(5),
    }),
    threshold: 0,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'One or more batch jobs are experiencing failures',
  })
  batchJobFailureAlarm.addAlarmAction(alarmAction)

  // Stoplist Auto-Resume Job Failure
  const stoplistAutoResumeFailureAlarm = new Alarm(scope, 'StoplistAutoResumeFailureAlarm', {
    alarmName: `remit-scout-${options.envName}-stoplist-auto-resume-failure`,
    metric: new Metric({
      namespace: 'RemitScout/BatchJobs',
      metricName: 'job_failure',
      statistic: 'Sum',
      period: Duration.minutes(5),
      dimensionsMap: {
        JobName: 'stoplist-auto-resume',
      },
    }),
    threshold: 0,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Stoplist auto-resume job is experiencing failures',
  })
  stoplistAutoResumeFailureAlarm.addAlarmAction(alarmAction)

  // Quote Refresh Queue Cleanup Job Failure
  const queueCleanupFailureAlarm = new Alarm(scope, 'QueueCleanupFailureAlarm', {
    alarmName: `remit-scout-${options.envName}-queue-cleanup-failure`,
    metric: new Metric({
      namespace: 'RemitScout/BatchJobs',
      metricName: 'job_failure',
      statistic: 'Sum',
      period: Duration.minutes(5),
      dimensionsMap: {
        JobName: 'quote-refresh-queue-cleanup',
      },
    }),
    threshold: 0,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Quote refresh queue cleanup job is experiencing failures',
  })
  queueCleanupFailureAlarm.addAlarmAction(alarmAction)

  // SQS Queue Depth Alarms (threshold: 1000 messages)
  const queueDepthThreshold = 1000
  const queueDepthAlarms = [
    { name: 'ExportJob', queue: options.queues.exportJobQueue },
    { name: 'AlertEvaluation', queue: options.queues.alertEvaluationQueue },
    { name: 'IngestFanout', queue: options.queues.ingestFanoutQueue },
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
    alarm.addAlarmAction(alarmAction)
  }

  // Worker Lock Acquisition Failure Alarm
  const workerLockFailureAlarm = new Alarm(scope, 'WorkerLockFailureAlarm', {
    alarmName: `remit-scout-${options.envName}-worker-lock-failures`,
    metric: new Metric({
      namespace: 'RemitScout/Workers',
      metricName: 'lock_failed',
      statistic: 'Sum',
      period: Duration.minutes(5),
    }),
    threshold: 5,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Worker lock acquisition failures detected',
  })
  workerLockFailureAlarm.addAlarmAction(alarmAction)

  // Provider Probe Failure Alarms
  const probeProviders = ['remitly', 'westernunion', 'wise', 'worldremit', 'xe']
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
    alarm.addAlarmAction(alarmAction)
  }

  // API Health Alarms
  // High API Error Rate: > 5% for 5 minutes
  const apiErrorRateAlarm = new Alarm(scope, 'HighAPIErrorRateAlarm', {
    alarmName: `remit-scout-${options.envName}-api-error-rate-high`,
    metric: new Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      dimensionsMap: {
        ApiId: options.api.planeAApi.httpApiId,
        Stage: '$default',
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
    }),
    threshold: 0.05, // 5% error rate threshold
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'API error rate exceeds 5% for more than 5 minutes',
  })
  apiErrorRateAlarm.addAlarmAction(alarmAction)

  // High API Latency: P95 > 5 seconds for 10 minutes
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
    threshold: 5000, // 5 seconds in milliseconds
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'P95 latency for /api/quotes/current exceeds 5 seconds',
  })
  apiLatencyAlarm.addAlarmAction(alarmAction)

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
  apiEndpointDownAlarm.addAlarmAction(alarmAction)

  // Data Health Alarms
  // Data Freshness Stale: Max age > 30 minutes for 10 minutes
  const dataFreshnessStaleAlarm = new Alarm(scope, 'DataFreshnessStaleAlarm', {
    alarmName: `remit-scout-${options.envName}-data-freshness-stale`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'data_freshness_age_minutes',
      statistic: 'Maximum',
      period: Duration.minutes(5),
    }),
    threshold: 30,
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Some corridor/provider combinations have data older than 30 minutes',
  })
  dataFreshnessStaleAlarm.addAlarmAction(alarmAction)

  // Provider Collection Alarms
  // Provider Collection Failure Spike: > 10% failure rate for 5 minutes
  const providerCollectionFailureAlarm = new Alarm(scope, 'ProviderCollectionFailureAlarm', {
    alarmName: `remit-scout-${options.envName}-provider-collection-failure-spike`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'provider_collection_failure_rate',
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
    threshold: 0.1, // 10% failure rate
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Provider collection failure rate exceeds 10% for more than 5 minutes',
  })
  providerCollectionFailureAlarm.addAlarmAction(alarmAction)

  // Circuit Breaker Open: Circuit breaker state == 1 (open) for 10 minutes
  const circuitBreakerOpenAlarm = new Alarm(scope, 'CircuitBreakerOpenAlarm', {
    alarmName: `remit-scout-${options.envName}-circuit-breaker-open`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'circuit_breaker_state',
      statistic: 'Maximum',
      period: Duration.minutes(5),
    }),
    threshold: 1, // Open state
    evaluationPeriods: 2,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Circuit breaker for provider/corridor has been open for more than 10 minutes',
  })
  circuitBreakerOpenAlarm.addAlarmAction(alarmAction)

  // Provider Completely Down: No successful collections in 10 minutes
  const providerCompletelyDownAlarm = new Alarm(scope, 'ProviderCompletelyDownAlarm', {
    alarmName: `remit-scout-${options.envName}-provider-completely-down`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'provider_collection_success_total',
      statistic: 'Sum',
      period: Duration.minutes(10),
    }),
    threshold: 0,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: TreatMissingData.BREACHING,
    alarmDescription: 'Provider has had no successful collections in the last 10 minutes',
  })
  providerCompletelyDownAlarm.addAlarmAction(alarmAction)

  // Database Health Alarms
  // High Database Query Latency: P95 > 1 second for 5 minutes
  const dbQueryLatencyAlarm = new Alarm(scope, 'HighDatabaseQueryLatencyAlarm', {
    alarmName: `remit-scout-${options.envName}-db-query-latency-high`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'db_query_duration_seconds_p95',
      statistic: 'p95',
      period: Duration.minutes(5),
    }),
    threshold: 1, // 1 second
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'P95 database query latency exceeds 1 second',
  })
  dbQueryLatencyAlarm.addAlarmAction(alarmAction)

  // Database Query Errors: > 10 errors in 5 minutes
  const dbQueryErrorsAlarm = new Alarm(scope, 'DatabaseQueryErrorsAlarm', {
    alarmName: `remit-scout-${options.envName}-db-query-errors`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'db_queries_total',
      dimensionsMap: {
        status: 'error',
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
    }),
    threshold: 10,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'More than 10 database query errors in the last 5 minutes',
  })
  dbQueryErrorsAlarm.addAlarmAction(alarmAction)

  // Database Connection Pool Exhausted: > 90% utilization for 5 minutes
  const dbPoolExhaustedAlarm = new Alarm(scope, 'DatabaseConnectionPoolExhaustedAlarm', {
    alarmName: `remit-scout-${options.envName}-db-pool-exhausted`,
    metric: new Metric({
      namespace: 'RemitScout',
      metricName: 'db_connection_pool_utilization',
      statistic: 'Maximum',
      period: Duration.minutes(5),
    }),
    threshold: 0.9, // 90% utilization
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Database connection pool is more than 90% utilized',
  })
  dbPoolExhaustedAlarm.addAlarmAction(alarmAction)

  // Additional Dashboard Widgets for Data Health
  const dataFreshnessWidget = new GraphWidget({
    title: 'Data Freshness P95',
    left: [
      new Metric({
        namespace: 'RemitScout',
        metricName: 'data_freshness_age_minutes_p95',
        statistic: 'p95',
        period: Duration.minutes(5),
      }),
      new Metric({
        namespace: 'RemitScout',
        metricName: 'data_freshness_age_minutes',
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
        metricName: 'quote_success_rate',
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
        metricName: 'provider_coverage_count',
        statistic: 'Minimum',
        period: Duration.minutes(5),
      }),
    ],
    period: Duration.minutes(5),
  })

  const providerCollectionSuccessWidget = new GraphWidget({
    title: 'Provider Collection Success Rate',
    left: [
      new Metric({
        namespace: 'RemitScout',
        metricName: 'provider_collection_success_rate',
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
    ],
    period: Duration.minutes(5),
  })

  const circuitBreakerWidget = new GraphWidget({
    title: 'Circuit Breaker State',
    left: [
      new Metric({
        namespace: 'RemitScout',
        metricName: 'circuit_breaker_state',
        statistic: 'Maximum',
        period: Duration.minutes(5),
      }),
    ],
    period: Duration.minutes(5),
  })

  dashboard.addWidgets(
    dataFreshnessWidget,
    quoteSuccessRateWidget,
    providerCoverageWidget,
    providerCollectionSuccessWidget,
    circuitBreakerWidget,
  )

  return { dashboard, alertsTopic }
}
