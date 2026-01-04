import path from 'path'

import { Duration } from 'aws-cdk-lib'
import { Rule, RuleTargetInput, Schedule } from 'aws-cdk-lib/aws-events'
import { EcsTask, LambdaFunction } from 'aws-cdk-lib/aws-events-targets'
import { Runtime, Tracing, LayerVersion, type IFunction, type ILayerVersion } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { SubnetType, type SecurityGroup } from 'aws-cdk-lib/aws-ec2'
import {
  Cluster,
  FargatePlatformVersion,
  type FargateTaskDefinition,
} from 'aws-cdk-lib/aws-ecs'
import type { Construct } from 'constructs'

import type { IamResources } from './iam'

export type ScheduledJobsResources = {
  goldFxRatesFunction: IFunction
  goldFxRatesRule: Rule
  exportWorkerFunction: IFunction
  exportWorkerRule: Rule
  alertEvaluationSchedulerFunction: IFunction
  alertEvaluationRealtimeRule: Rule
  alertEvaluationHourlyRule: Rule
  alertEvaluationDailyRule: Rule
  alertEvaluationWorkerFunction: IFunction
  alertEvaluationWorkerRule: Rule
  telemetryAnalyticsFunction: IFunction
  telemetryAnalyticsRule: Rule
  sessionCleanupFunction: IFunction
  sessionCleanupRule: Rule
  auditLogCleanupFunction: IFunction
  auditLogCleanupRule: Rule
  goldPopularCorridorsRule: Rule
  goldPulseCacheRule: Rule
  goldPublisherRule: Rule
  b2cRetryFailedRule: Rule
  b2cQueueCleanupRule: Rule
  stoplistAutoResumeRule: Rule
  b2cRefreshRule: Rule
  oandaSyncFunction: IFunction
  oandaSyncRule: Rule
  remitlyProbeFunction: IFunction
  remitlyProbeRule: Rule
  westernunionProbeFunction: IFunction
  westernunionProbeRule: Rule
  wiseProbeFunction: IFunction
  wiseProbeRule: Rule
  worldremitProbeFunction: IFunction
  worldremitProbeRule: Rule
  xeProbeFunction: IFunction
  xeProbeRule: Rule
}

export type ScheduledJobsOptions = {
  envName: string
  roles: IamResources
  cluster: Cluster
  b2cRefreshTask: FargateTaskDefinition
  planeBSecurityGroup: SecurityGroup
  otelLambdaLayerArn?: string
  planeADbSecretArn?: string
  planeADbSsmName?: string
  planeADbHost?: string
  planeADbPort?: string
  planeADbName?: string
  exportJobQueueUrl?: string
  exportJobQueueMode?: string
  exportsBucketName?: string
  exportsPrefix?: string
  auditLogsBucketName?: string
  auditLogsPrefix?: string
  alertEvaluationQueueUrl?: string
  planeBDbSecretArn?: string
  planeBDbSsmName?: string
  planeCDbSecretArn?: string
  planeCDbSsmName?: string
  redisSecretArn?: string
  redisSsmName?: string
  oandaSecretArn?: string
  oandaSsmName?: string
  planeBDbHost?: string
  planeBDbPort?: string
  planeBDbName?: string
  planeCDbHost?: string
  planeCDbPort?: string
  planeCDbName?: string
}

export const createScheduledJobs = (
  scope: Construct,
  options: ScheduledJobsOptions,
): ScheduledJobsResources => {
  const logRetention = options.envName === 'prod'
    ? RetentionDays.ONE_MONTH
    : RetentionDays.TWO_WEEKS
  const otelLambdaLayer = options.otelLambdaLayerArn
    ? LayerVersion.fromLayerVersionArn(scope, 'ScheduledJobsOtelLambdaLayer', options.otelLambdaLayerArn)
    : undefined
  const planeBDbSecretArn = options.planeBDbSecretArn
  const planeBDbSsmName = options.planeBDbSsmName
  const planeCDbSecretArn = options.planeCDbSecretArn
  const planeCDbSsmName = options.planeCDbSsmName
  const redisSecretArn = options.redisSecretArn
  const redisSsmName = options.redisSsmName
  const planeADbSecretArn = options.planeADbSecretArn
  const planeADbSsmName = options.planeADbSsmName
  const planeADbHost = options.planeADbHost
  const planeADbPort = options.planeADbPort
  const planeADbName = options.planeADbName
  const oandaSecretArn = options.oandaSecretArn
  const oandaSsmName = options.oandaSsmName
  const planeBDbHost = options.planeBDbHost
  const planeBDbPort = options.planeBDbPort
  const planeBDbName = options.planeBDbName
  const planeCDbHost = options.planeCDbHost
  const planeCDbPort = options.planeCDbPort
  const planeCDbName = options.planeCDbName
  const auditLogsBucketName = options.auditLogsBucketName
  const auditLogsPrefix = options.auditLogsPrefix

  const goldFxRatesEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    TRACING_EXPORTER: 'xray',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: '1',
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (planeBDbHost) {
    goldFxRatesEnvironment.PLANE_B_DB_HOST = planeBDbHost
  }
  if (planeBDbPort) {
    goldFxRatesEnvironment.PLANE_B_DB_PORT = planeBDbPort
  }
  if (planeBDbName) {
    goldFxRatesEnvironment.PLANE_B_DB_NAME = planeBDbName
  }

  const goldFxRatesFunction = new NodejsFunction(scope, 'GoldFxRatesJobFunction', {
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'gold-fx-rates-lambda.ts',
    ),
    handler: 'handler',
    runtime: Runtime.NODEJS_18_X,
    memorySize: 512,
    timeout: Duration.minutes(5),
    role: options.roles.planeBLambdaRole,
    tracing: Tracing.ACTIVE,
    environment: goldFxRatesEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  if (planeBDbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'PlaneBDatabaseSecret',
      planeBDbSecretArn,
    )
    secret.grantRead(goldFxRatesFunction)
    goldFxRatesFunction.addEnvironment('PLANE_B_DB_SECRET_ARN', planeBDbSecretArn)
  }
  if (planeBDbSsmName) {
    goldFxRatesFunction.addEnvironment('PLANE_B_DB_SSM_NAME', planeBDbSsmName)
  }
  if (redisSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'RedisSecret',
      redisSecretArn,
    )
    secret.grantRead(goldFxRatesFunction)
    goldFxRatesFunction.addEnvironment('REDIS_SECRET_ARN', redisSecretArn)
  }
  if (redisSsmName) {
    goldFxRatesFunction.addEnvironment('REDIS_SSM_NAME', redisSsmName)
  }

  const goldFxRatesRule = new Rule(scope, 'GoldFxRatesSchedule', {
    schedule: Schedule.rate(Duration.minutes(15)),
    description: 'Runs gold-fx-rates job every 15 minutes.',
  })

  goldFxRatesRule.addTarget(new LambdaFunction(goldFxRatesFunction, { retryAttempts: 1 }))

  const exportWorkerEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    TRACING_EXPORTER: 'xray',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: '1',
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (planeADbHost) {
    exportWorkerEnvironment.PLANE_A_DB_HOST = planeADbHost
  }
  if (planeADbPort) {
    exportWorkerEnvironment.PLANE_A_DB_PORT = planeADbPort
  }
  if (planeADbName) {
    exportWorkerEnvironment.PLANE_A_DB_NAME = planeADbName
  }
  if (options.exportJobQueueUrl) {
    exportWorkerEnvironment.EXPORT_JOB_QUEUE_URL = options.exportJobQueueUrl
  }
  if (options.exportJobQueueMode) {
    exportWorkerEnvironment.EXPORT_JOB_QUEUE_MODE = options.exportJobQueueMode
  }
  if (options.exportsBucketName) {
    exportWorkerEnvironment.EXPORTS_S3_BUCKET = options.exportsBucketName
  }
  if (options.exportsPrefix) {
    exportWorkerEnvironment.EXPORTS_S3_PREFIX = options.exportsPrefix
  }

  const exportWorkerFunction = new NodejsFunction(scope, 'ExportWorkerFunction', {
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'export-worker-lambda.ts',
    ),
    handler: 'handler',
    runtime: Runtime.NODEJS_18_X,
    memorySize: 1024,
    timeout: Duration.minutes(15),
    role: options.roles.planeALambdaRole,
    tracing: Tracing.ACTIVE,
    environment: exportWorkerEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  if (planeADbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'ExportWorkerDatabaseSecret',
      planeADbSecretArn,
    )
    secret.grantRead(exportWorkerFunction)
    exportWorkerFunction.addEnvironment('PLANE_A_DB_SECRET_ARN', planeADbSecretArn)
  }
  if (planeADbSsmName) {
    exportWorkerFunction.addEnvironment('PLANE_A_DB_SSM_NAME', planeADbSsmName)
  }
  if (redisSecretArn) {
    const secret = Secret.fromSecretCompleteArn(scope, 'ExportWorkerRedisSecret', redisSecretArn)
    secret.grantRead(exportWorkerFunction)
    exportWorkerFunction.addEnvironment('REDIS_SECRET_ARN', redisSecretArn)
  }
  if (redisSsmName) {
    exportWorkerFunction.addEnvironment('REDIS_SSM_NAME', redisSsmName)
  }

  const exportWorkerRule = new Rule(scope, 'ExportWorkerSchedule', {
    schedule: Schedule.rate(Duration.minutes(1)),
    description: 'Runs export worker every minute to drain queued export jobs.',
  })

  exportWorkerRule.addTarget(new LambdaFunction(exportWorkerFunction, { retryAttempts: 1 }))

  const alertEvaluationSchedulerEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    TRACING_EXPORTER: 'xray',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: '1',
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
    ALERT_EVALUATION_ENABLED: '1',
  }
  if (options.alertEvaluationQueueUrl) {
    alertEvaluationSchedulerEnvironment.ALERT_EVALUATION_QUEUE_URL = options.alertEvaluationQueueUrl
  }

  const alertEvaluationSchedulerFunction = new NodejsFunction(
    scope,
    'AlertEvaluationSchedulerFunction',
    {
      entry: path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'backend',
        'scripts',
        'aws',
        'alert-evaluation-scheduler-lambda.ts',
      ),
      handler: 'handler',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 256,
      timeout: Duration.minutes(1),
      role: options.roles.planeALambdaRole,
      tracing: Tracing.ACTIVE,
      environment: alertEvaluationSchedulerEnvironment,
      logRetention,
      layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
    },
  )

  const alertEvaluationRealtimeRule = new Rule(scope, 'AlertEvaluationRealtimeSchedule', {
    schedule: Schedule.rate(Duration.minutes(5)),
    description: 'Enqueues realtime alerts every 5 minutes.',
  })
  alertEvaluationRealtimeRule.addTarget(
    new LambdaFunction(alertEvaluationSchedulerFunction, {
      retryAttempts: 1,
      event: RuleTargetInput.fromObject({ frequency: 'realtime' }),
    }),
  )

  const alertEvaluationHourlyRule = new Rule(scope, 'AlertEvaluationHourlySchedule', {
    schedule: Schedule.rate(Duration.hours(1)),
    description: 'Enqueues hourly alerts every hour.',
  })
  alertEvaluationHourlyRule.addTarget(
    new LambdaFunction(alertEvaluationSchedulerFunction, {
      retryAttempts: 1,
      event: RuleTargetInput.fromObject({ frequency: 'hourly' }),
    }),
  )

  const alertEvaluationDailyRule = new Rule(scope, 'AlertEvaluationDailySchedule', {
    schedule: Schedule.rate(Duration.hours(1)),
    description: 'Enqueues daily alerts by timezone bucket every hour.',
  })
  alertEvaluationDailyRule.addTarget(
    new LambdaFunction(alertEvaluationSchedulerFunction, {
      retryAttempts: 1,
      event: RuleTargetInput.fromObject({ frequency: 'daily' }),
    }),
  )

  const alertEvaluationWorkerEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    TRACING_EXPORTER: 'xray',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: '1',
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
    ALERT_EVALUATION_ENABLED: '1',
  }
  if (planeADbHost) {
    alertEvaluationWorkerEnvironment.PLANE_A_DB_HOST = planeADbHost
  }
  if (planeADbPort) {
    alertEvaluationWorkerEnvironment.PLANE_A_DB_PORT = planeADbPort
  }
  if (planeADbName) {
    alertEvaluationWorkerEnvironment.PLANE_A_DB_NAME = planeADbName
  }
  if (options.alertEvaluationQueueUrl) {
    alertEvaluationWorkerEnvironment.ALERT_EVALUATION_QUEUE_URL = options.alertEvaluationQueueUrl
  }

  const alertEvaluationWorkerFunction = new NodejsFunction(scope, 'AlertEvaluationWorkerFunction', {
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'alert-evaluation-worker-lambda.ts',
    ),
    handler: 'handler',
    runtime: Runtime.NODEJS_18_X,
    memorySize: 1024,
    timeout: Duration.minutes(15),
    role: options.roles.planeALambdaRole,
    tracing: Tracing.ACTIVE,
    environment: alertEvaluationWorkerEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  if (planeADbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'AlertEvaluationWorkerDbSecret',
      planeADbSecretArn,
    )
    secret.grantRead(alertEvaluationWorkerFunction)
    alertEvaluationWorkerFunction.addEnvironment('PLANE_A_DB_SECRET_ARN', planeADbSecretArn)
  }
  if (planeADbSsmName) {
    alertEvaluationWorkerFunction.addEnvironment('PLANE_A_DB_SSM_NAME', planeADbSsmName)
  }

  const alertEvaluationWorkerRule = new Rule(scope, 'AlertEvaluationWorkerSchedule', {
    schedule: Schedule.rate(Duration.minutes(1)),
    description: 'Runs alert evaluation worker every minute to drain queued alert evaluations.',
  })
  alertEvaluationWorkerRule.addTarget(
    new LambdaFunction(alertEvaluationWorkerFunction, { retryAttempts: 1 }),
  )

  const telemetryAnalyticsEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    TRACING_EXPORTER: 'xray',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: '1',
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (planeADbHost) {
    telemetryAnalyticsEnvironment.PLANE_A_DB_HOST = planeADbHost
  }
  if (planeADbPort) {
    telemetryAnalyticsEnvironment.PLANE_A_DB_PORT = planeADbPort
  }
  if (planeADbName) {
    telemetryAnalyticsEnvironment.PLANE_A_DB_NAME = planeADbName
  }

  const telemetryAnalyticsFunction = new NodejsFunction(scope, 'TelemetryAnalyticsJobFunction', {
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'telemetry-analytics-job-lambda.ts',
    ),
    handler: 'handler',
    runtime: Runtime.NODEJS_18_X,
    memorySize: 512,
    timeout: Duration.minutes(5),
    role: options.roles.planeALambdaRole,
    tracing: Tracing.ACTIVE,
    environment: telemetryAnalyticsEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  if (planeADbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'TelemetryAnalyticsDbSecret',
      planeADbSecretArn,
    )
    secret.grantRead(telemetryAnalyticsFunction)
    telemetryAnalyticsFunction.addEnvironment('PLANE_A_DB_SECRET_ARN', planeADbSecretArn)
  }
  if (planeADbSsmName) {
    telemetryAnalyticsFunction.addEnvironment('PLANE_A_DB_SSM_NAME', planeADbSsmName)
  }

  const telemetryAnalyticsRule = new Rule(scope, 'TelemetryAnalyticsSchedule', {
    schedule: Schedule.rate(Duration.hours(1)),
    description: 'Aggregates telemetry analytics hourly.',
  })

  telemetryAnalyticsRule.addTarget(new LambdaFunction(telemetryAnalyticsFunction, { retryAttempts: 1 }))

  const sessionCleanupEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    TRACING_EXPORTER: 'xray',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: '1',
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (planeADbHost) {
    sessionCleanupEnvironment.PLANE_A_DB_HOST = planeADbHost
  }
  if (planeADbPort) {
    sessionCleanupEnvironment.PLANE_A_DB_PORT = planeADbPort
  }
  if (planeADbName) {
    sessionCleanupEnvironment.PLANE_A_DB_NAME = planeADbName
  }

  const sessionCleanupFunction = new NodejsFunction(scope, 'SessionCleanupFunction', {
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'session-cleanup-lambda.ts',
    ),
    handler: 'handler',
    runtime: Runtime.NODEJS_18_X,
    memorySize: 512,
    timeout: Duration.minutes(5),
    role: options.roles.planeALambdaRole,
    tracing: Tracing.ACTIVE,
    environment: sessionCleanupEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  if (planeADbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'SessionCleanupDbSecret',
      planeADbSecretArn,
    )
    secret.grantRead(sessionCleanupFunction)
    sessionCleanupFunction.addEnvironment('PLANE_A_DB_SECRET_ARN', planeADbSecretArn)
  }
  if (planeADbSsmName) {
    sessionCleanupFunction.addEnvironment('PLANE_A_DB_SSM_NAME', planeADbSsmName)
  }

  const sessionCleanupRule = new Rule(scope, 'SessionCleanupSchedule', {
    schedule: Schedule.cron({ minute: '0', hour: '2' }),
    description: 'Revokes expired and inactive sessions daily.',
  })

  sessionCleanupRule.addTarget(new LambdaFunction(sessionCleanupFunction, { retryAttempts: 1 }))

  const auditLogCleanupEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    TRACING_EXPORTER: 'xray',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: '1',
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (planeADbHost) {
    auditLogCleanupEnvironment.PLANE_A_DB_HOST = planeADbHost
  }
  if (planeADbPort) {
    auditLogCleanupEnvironment.PLANE_A_DB_PORT = planeADbPort
  }
  if (planeADbName) {
    auditLogCleanupEnvironment.PLANE_A_DB_NAME = planeADbName
  }
  if (auditLogsBucketName) {
    auditLogCleanupEnvironment.AUDIT_LOGS_S3_BUCKET = auditLogsBucketName
  }
  if (auditLogsPrefix) {
    auditLogCleanupEnvironment.AUDIT_LOGS_S3_PREFIX = auditLogsPrefix
  }

  const auditLogCleanupFunction = new NodejsFunction(scope, 'AuditLogCleanupFunction', {
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'audit-log-cleanup-lambda.ts',
    ),
    handler: 'handler',
    runtime: Runtime.NODEJS_18_X,
    memorySize: 512,
    timeout: Duration.minutes(10),
    role: options.roles.planeALambdaRole,
    tracing: Tracing.ACTIVE,
    environment: auditLogCleanupEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  if (planeADbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'AuditLogCleanupDbSecret',
      planeADbSecretArn,
    )
    secret.grantRead(auditLogCleanupFunction)
    auditLogCleanupFunction.addEnvironment('PLANE_A_DB_SECRET_ARN', planeADbSecretArn)
  }
  if (planeADbSsmName) {
    auditLogCleanupFunction.addEnvironment('PLANE_A_DB_SSM_NAME', planeADbSsmName)
  }

  const auditLogCleanupRule = new Rule(scope, 'AuditLogCleanupSchedule', {
    schedule: Schedule.cron({ minute: '0', hour: '3', day: '1' }),
    description: 'Archives and deletes expired audit logs monthly.',
  })

  auditLogCleanupRule.addTarget(new LambdaFunction(auditLogCleanupFunction, { retryAttempts: 1 }))

  const oandaSyncEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    TRACING_EXPORTER: 'xray',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: '1',
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (oandaSecretArn || oandaSsmName) {
    oandaSyncEnvironment.OANDA_USE_AUTHENTICATED_API = '1'
  }
  if (planeADbHost) {
    oandaSyncEnvironment.PLANE_A_DB_HOST = planeADbHost
  }
  if (planeADbPort) {
    oandaSyncEnvironment.PLANE_A_DB_PORT = planeADbPort
  }
  if (planeADbName) {
    oandaSyncEnvironment.PLANE_A_DB_NAME = planeADbName
  }

  const oandaSyncFunction = new NodejsFunction(scope, 'OandaSyncJobFunction', {
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'oanda-sync-lambda.ts',
    ),
    handler: 'handler',
    runtime: Runtime.NODEJS_18_X,
    memorySize: 512,
    timeout: Duration.minutes(5),
    role: options.roles.planeALambdaRole,
    tracing: Tracing.ACTIVE,
    environment: oandaSyncEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  if (planeADbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'PlaneADatabaseSecret',
      planeADbSecretArn,
    )
    secret.grantRead(oandaSyncFunction)
    oandaSyncFunction.addEnvironment('PLANE_A_DB_SECRET_ARN', planeADbSecretArn)
  }
  if (planeADbSsmName) {
    oandaSyncFunction.addEnvironment('PLANE_A_DB_SSM_NAME', planeADbSsmName)
  }
  if (redisSecretArn) {
    const secret = Secret.fromSecretCompleteArn(scope, 'OandaRedisSecret', redisSecretArn)
    secret.grantRead(oandaSyncFunction)
    oandaSyncFunction.addEnvironment('REDIS_SECRET_ARN', redisSecretArn)
  }
  if (redisSsmName) {
    oandaSyncFunction.addEnvironment('REDIS_SSM_NAME', redisSsmName)
  }
  if (oandaSecretArn) {
    const secret = Secret.fromSecretCompleteArn(scope, 'OandaApiSecret', oandaSecretArn)
    secret.grantRead(oandaSyncFunction)
    oandaSyncFunction.addEnvironment('OANDA_SECRET_ARN', oandaSecretArn)
  }
  if (oandaSsmName) {
    oandaSyncFunction.addEnvironment('OANDA_SSM_NAME', oandaSsmName)
  }

  const oandaSyncRule = new Rule(scope, 'OandaSyncSchedule', {
    schedule: Schedule.rate(Duration.hours(1)),
    description: 'Runs OANDA FX rates sync every hour.',
  })

  oandaSyncRule.addTarget(new LambdaFunction(oandaSyncFunction, { retryAttempts: 1 }))

  const goldPopularCorridorsRule = createPlaneBLambdaJob({
    scope,
    options,
    id: 'GoldPopularCorridorsJob',
    jobName: 'gold-popular-corridors',
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'gold-popular-corridors-lambda.ts',
    ),
    schedule: Schedule.rate(Duration.hours(1)),
    logRetention,
    otelLambdaLayer,
    planeBDbSecretArn,
    planeBDbSsmName,
    planeBDbHost,
    planeBDbPort,
    planeBDbName,
    redisSecretArn,
    redisSsmName,
  })

  const goldPulseCacheRule = createPlaneBLambdaJob({
    scope,
    options,
    id: 'GoldPulseCacheJob',
    jobName: 'gold-pulse-cache',
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'gold-pulse-cache-lambda.ts',
    ),
    schedule: Schedule.rate(Duration.hours(1)),
    logRetention,
    otelLambdaLayer,
    planeBDbSecretArn,
    planeBDbSsmName,
    planeBDbHost,
    planeBDbPort,
    planeBDbName,
    redisSecretArn,
    redisSsmName,
  })

  const goldPublisherRule = createPlaneCLambdaJob({
    scope,
    options,
    id: 'GoldPublisherJob',
    jobName: 'gold-publisher',
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'gold-publisher-lambda.ts',
    ),
    schedule: Schedule.rate(Duration.minutes(30)),
    logRetention,
    otelLambdaLayer,
    planeCDbSecretArn,
    planeCDbSsmName,
    planeCDbHost,
    planeCDbPort,
    planeCDbName,
    redisSecretArn,
    redisSsmName,
  })

  const b2cRetryFailedRule = createPlaneBLambdaJob({
    scope,
    options,
    id: 'B2cRetryFailedJob',
    jobName: 'b2c-retry-failed',
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'b2c-retry-failed-lambda.ts',
    ),
    schedule: Schedule.rate(Duration.minutes(15)),
    logRetention,
    otelLambdaLayer,
    planeBDbSecretArn,
    planeBDbSsmName,
    planeBDbHost,
    planeBDbPort,
    planeBDbName,
  })

  const b2cQueueCleanupRule = createPlaneBLambdaJob({
    scope,
    options,
    id: 'B2cQueueCleanupJob',
    jobName: 'b2c-queue-cleanup',
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'quote-refresh-queue-cleanup-lambda.ts',
    ),
    schedule: Schedule.cron({ minute: '30', hour: '2' }),
    logRetention,
    otelLambdaLayer,
    planeBDbSecretArn,
    planeBDbSsmName,
    planeBDbHost,
    planeBDbPort,
    planeBDbName,
  })

  const stoplistAutoResumeRule = createPlaneBLambdaJob({
    scope,
    options,
    id: 'StoplistAutoResumeJob',
    jobName: 'stoplist-auto-resume',
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'stoplist-auto-resume-lambda.ts',
    ),
    schedule: Schedule.cron({ minute: '0', hour: '2' }),
    logRetention,
    otelLambdaLayer,
    planeBDbSecretArn,
    planeBDbSsmName,
    planeBDbHost,
    planeBDbPort,
    planeBDbName,
    redisSecretArn,
    redisSsmName,
  })

  const b2cRefreshRule = new Rule(scope, 'B2cRefreshWorkerSchedule', {
    schedule: Schedule.rate(Duration.minutes(2)),
    description: 'Runs the B2C refresh worker on a 2-minute cadence (matches legacy K8s schedule).',
  })

  b2cRefreshRule.addTarget(
    new EcsTask({
      cluster: options.cluster,
      taskDefinition: options.b2cRefreshTask,
      subnetSelection: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [options.planeBSecurityGroup],
      taskCount: 1,
      platformVersion: FargatePlatformVersion.LATEST,
      assignPublicIp: false,
    }),
  )

  // Provider Probe Lambda Functions
  const probeProviders = [
    { id: 'Remitly', providerId: 'remitly' },
    { id: 'WesternUnion', providerId: 'westernunion' },
    { id: 'Wise', providerId: 'wise' },
    { id: 'WorldRemit', providerId: 'worldremit' },
    { id: 'Xe', providerId: 'xe' },
  ]

  const probeFunctions: Record<string, IFunction> = {}
  const probeRules: Record<string, Rule> = {}

  for (const { id, providerId } of probeProviders) {
    const fn = new NodejsFunction(scope, `${id}ProbeFunction`, {
      entry: path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'backend',
        'scripts',
        'aws',
        `${providerId}-probe-lambda.ts`,
      ),
      handler: 'handler',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 512,
      timeout: Duration.minutes(5),
      role: options.roles.planeBLambdaRole,
      tracing: Tracing.ACTIVE,
      environment: {
        JOB_NAME: `${providerId}-probe`,
        ENVIRONMENT: options.envName,
        NODE_ENV: 'production',
        PGSSLMODE: 'require',
        TRACING_EXPORTER: 'xray',
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
        CLOUDWATCH_METRICS_ENABLED: '1',
        CLOUDWATCH_NAMESPACE: 'RemitScout',
        CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
        CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
        ...(planeBDbHost && { PLANE_B_DB_HOST: planeBDbHost }),
        ...(planeBDbPort && { PLANE_B_DB_PORT: planeBDbPort }),
        ...(planeBDbName && { PLANE_B_DB_NAME: planeBDbName }),
      },
      logRetention: logRetention,
      layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
    })

    if (planeBDbSecretArn) {
      const secret = Secret.fromSecretCompleteArn(
        scope,
        `${id}ProbeDbSecret`,
        planeBDbSecretArn,
      )
      secret.grantRead(fn)
      fn.addEnvironment('PLANE_B_DB_SECRET_ARN', planeBDbSecretArn)
    }
    if (planeBDbSsmName) {
      fn.addEnvironment('PLANE_B_DB_SSM_NAME', planeBDbSsmName)
    }
    if (redisSecretArn) {
      const secret = Secret.fromSecretCompleteArn(
        scope,
        `${id}ProbeRedisSecret`,
        redisSecretArn,
      )
      secret.grantRead(fn)
      fn.addEnvironment('REDIS_SECRET_ARN', redisSecretArn)
    }
    if (redisSsmName) {
      fn.addEnvironment('REDIS_SSM_NAME', redisSsmName)
    }

    const rule = new Rule(scope, `${id}ProbeSchedule`, {
      schedule: Schedule.rate(Duration.minutes(5)),
      description: `Runs ${providerId} provider health probe every 5 minutes.`,
    })

    rule.addTarget(new LambdaFunction(fn, { retryAttempts: 1 }))

    probeFunctions[`${providerId}ProbeFunction`] = fn
    probeRules[`${providerId}ProbeRule`] = rule
  }

  return {
    goldFxRatesFunction,
    goldFxRatesRule,
    exportWorkerFunction,
    exportWorkerRule,
    alertEvaluationSchedulerFunction,
    alertEvaluationRealtimeRule,
    alertEvaluationHourlyRule,
    alertEvaluationDailyRule,
    alertEvaluationWorkerFunction,
    alertEvaluationWorkerRule,
    telemetryAnalyticsFunction,
    telemetryAnalyticsRule,
    sessionCleanupFunction,
    sessionCleanupRule,
    auditLogCleanupFunction,
    auditLogCleanupRule,
    goldPopularCorridorsRule,
    goldPulseCacheRule,
    goldPublisherRule,
    b2cRetryFailedRule,
    b2cQueueCleanupRule,
    stoplistAutoResumeRule,
    b2cRefreshRule,
    oandaSyncFunction,
    oandaSyncRule,
    remitlyProbeFunction: probeFunctions.remitlyProbeFunction,
    remitlyProbeRule: probeRules.remitlyProbeRule,
    westernunionProbeFunction: probeFunctions.westernunionProbeFunction,
    westernunionProbeRule: probeRules.westernunionProbeRule,
    wiseProbeFunction: probeFunctions.wiseProbeFunction,
    wiseProbeRule: probeRules.wiseProbeRule,
    worldremitProbeFunction: probeFunctions.worldremitProbeFunction,
    worldremitProbeRule: probeRules.worldremitProbeRule,
    xeProbeFunction: probeFunctions.xeProbeFunction,
    xeProbeRule: probeRules.xeProbeRule,
  }
}

type LambdaJobOptions = {
  scope: Construct
  options: ScheduledJobsOptions
  id: string
  jobName: string
  entry: string
  schedule: Schedule
  logRetention: RetentionDays
  otelLambdaLayer?: ILayerVersion
  planeBDbSecretArn?: string
  planeBDbSsmName?: string
  planeBDbHost?: string
  planeBDbPort?: string
  planeBDbName?: string
  planeCDbSecretArn?: string
  planeCDbSsmName?: string
  planeCDbHost?: string
  planeCDbPort?: string
  planeCDbName?: string
  redisSecretArn?: string
  redisSsmName?: string
}

const createPlaneBLambdaJob = ({
  scope,
  options,
  id,
  jobName,
  entry,
  schedule,
  logRetention,
  otelLambdaLayer,
  planeBDbSecretArn,
  planeBDbSsmName,
  planeBDbHost,
  planeBDbPort,
  planeBDbName,
  redisSecretArn,
  redisSsmName,
}: LambdaJobOptions): Rule => {
  const environment: Record<string, string> = {
    JOB_NAME: jobName,
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    TRACING_EXPORTER: 'xray',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: '1',
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (planeBDbHost) {
    environment.PLANE_B_DB_HOST = planeBDbHost
  }
  if (planeBDbPort) {
    environment.PLANE_B_DB_PORT = planeBDbPort
  }
  if (planeBDbName) {
    environment.PLANE_B_DB_NAME = planeBDbName
  }

  const fn = new NodejsFunction(scope, `${id}Function`, {
    entry,
    handler: 'handler',
    runtime: Runtime.NODEJS_18_X,
    memorySize: 512,
    timeout: Duration.minutes(5),
    role: options.roles.planeBLambdaRole,
    tracing: Tracing.ACTIVE,
    environment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  if (planeBDbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(scope, `${id}DbSecret`, planeBDbSecretArn)
    secret.grantRead(fn)
    fn.addEnvironment('PLANE_B_DB_SECRET_ARN', planeBDbSecretArn)
  }
  if (planeBDbSsmName) {
    fn.addEnvironment('PLANE_B_DB_SSM_NAME', planeBDbSsmName)
  }

  if (redisSecretArn) {
    const secret = Secret.fromSecretCompleteArn(scope, `${id}RedisSecret`, redisSecretArn)
    secret.grantRead(fn)
    fn.addEnvironment('REDIS_SECRET_ARN', redisSecretArn)
  }
  if (redisSsmName) {
    fn.addEnvironment('REDIS_SSM_NAME', redisSsmName)
  }

  const rule = new Rule(scope, `${id}Schedule`, {
    schedule,
    description: `Runs ${jobName} on a schedule.`,
  })

  rule.addTarget(new LambdaFunction(fn, { retryAttempts: 1 }))

  return rule
}

const createPlaneCLambdaJob = ({
  scope,
  options,
  id,
  jobName,
  entry,
  schedule,
  logRetention,
  otelLambdaLayer,
  planeCDbSecretArn,
  planeCDbSsmName,
  planeCDbHost,
  planeCDbPort,
  planeCDbName,
  redisSecretArn,
  redisSsmName,
}: LambdaJobOptions): Rule => {
  const environment: Record<string, string> = {
    JOB_NAME: jobName,
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    TRACING_EXPORTER: 'xray',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: '1',
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (planeCDbHost) {
    environment.PLANE_C_DB_HOST = planeCDbHost
  }
  if (planeCDbPort) {
    environment.PLANE_C_DB_PORT = planeCDbPort
  }
  if (planeCDbName) {
    environment.PLANE_C_DB_NAME = planeCDbName
  }

  const fn = new NodejsFunction(scope, `${id}Function`, {
    entry,
    handler: 'handler',
    runtime: Runtime.NODEJS_18_X,
    memorySize: 512,
    timeout: Duration.minutes(5),
    role: options.roles.planeCLambdaRole,
    tracing: Tracing.ACTIVE,
    environment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  if (planeCDbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(scope, `${id}DbSecret`, planeCDbSecretArn)
    secret.grantRead(fn)
    fn.addEnvironment('PLANE_C_DB_SECRET_ARN', planeCDbSecretArn)
  }
  if (planeCDbSsmName) {
    fn.addEnvironment('PLANE_C_DB_SSM_NAME', planeCDbSsmName)
  }

  if (redisSecretArn) {
    const secret = Secret.fromSecretCompleteArn(scope, `${id}RedisSecret`, redisSecretArn)
    secret.grantRead(fn)
    fn.addEnvironment('REDIS_SECRET_ARN', redisSecretArn)
  }
  if (redisSsmName) {
    fn.addEnvironment('REDIS_SSM_NAME', redisSsmName)
  }

  const rule = new Rule(scope, `${id}Schedule`, {
    schedule,
    description: `Runs ${jobName} on a schedule.`,
  })

  rule.addTarget(new LambdaFunction(fn, { retryAttempts: 1 }))

  return rule
}
