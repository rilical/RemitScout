import path from 'path'

import { Duration, Tags } from 'aws-cdk-lib'
import { Rule, RuleTargetInput, Schedule } from 'aws-cdk-lib/aws-events'
import { EcsTask, LambdaFunction } from 'aws-cdk-lib/aws-events-targets'
import { Architecture, Runtime, Tracing, LayerVersion, type IFunction, type ILayerVersion } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { SubnetType, type SecurityGroup, type Vpc } from 'aws-cdk-lib/aws-ec2'
import {
  Cluster,
  FargatePlatformVersion,
  type FargateTaskDefinition,
} from 'aws-cdk-lib/aws-ecs'
import type { Construct } from 'constructs'

import type { IamResources } from './iam'
import { collectOandaThrottleEnv, collectPlaneBProviderThrottleEnv } from './env-utils'

export type ScheduledJobsResources = {
  goldFxRatesFunction: IFunction
  goldFxRatesRule: Rule
  exportWorkerFunction: IFunction
  exportWorkerRule: Rule
  alertEvaluationSchedulerFunction: IFunction
  alertEvaluationWeeklyRule: Rule
  alertEvaluationDailyRule: Rule
  alertEvaluationWorkerFunction: IFunction
  alertEvaluationWorkerRule: Rule
  alertCorridorRefreshFunction: IFunction
  alertCorridorRefreshRule: Rule
  smartAlertsFunction: IFunction
  smartAlertsRule: Rule
  telemetryAnalyticsFunction: IFunction
  telemetryAnalyticsRule: Rule
  sessionCleanupFunction: IFunction
  sessionCleanupRule: Rule
  bankVsSpecialistRefreshFunction: IFunction
  bankVsSpecialistRefreshRule: Rule
  auditLogCleanupFunction: IFunction
  auditLogCleanupRule: Rule
  goldPopularCorridorsRule: Rule
  goldPulseCacheRule: Rule
  goldPublisherRule: Rule
  goldIndicesRule: Rule
  dataHealthSloFunction: IFunction
  dataHealthSloRule: Rule
  goldReconciliationRule: Rule
  b2cRetryFailedRule: Rule
  b2cQueueCleanupRule: Rule
  stoplistAutoResumeRule: Rule
  rightsMatrixSyncCountriesRule: Rule
  b2cRefreshRule: Rule
  fxRateRefreshRule: Rule
  b2bSweepSchedulerRule: Rule
  oandaSyncFunction: IFunction
  oandaSyncRule: Rule
}

export type ScheduledJobsOptions = {
  envName: string
  roles: IamResources
  vpc: Vpc
  cluster: Cluster
  lambdaArchitecture?: Architecture
  b2cRefreshTask: FargateTaskDefinition
  fxRateRefreshTask: FargateTaskDefinition
  b2bSweepSchedulerTask: FargateTaskDefinition
  b2cRefreshServiceEnabled?: boolean
  b2cRefreshDesiredCount?: number
  fxRateRefreshServiceEnabled?: boolean
  fxRateRefreshDesiredCount?: number
  paused?: boolean
  goldIndicesLookbackDays?: string
  providerWeightWindowDays?: string
  planeASecurityGroup: SecurityGroup
  planeBSecurityGroup: SecurityGroup
  planeCSecurityGroup: SecurityGroup
  otelLambdaLayerArn?: string
  sentrySecretArn?: string
  sentrySecretJsonKey?: string
  planeADbSecretArn?: string
  planeADbSsmName?: string
  planeADbHost?: string
  planeADbPort?: string
  planeADbName?: string
  communicationsSecretArn?: string
  quoteRefreshQueueUrl?: string
  quoteRefreshQueueMode?: string
  exportJobQueueUrl?: string
  exportJobQueueMode?: string
  exportsBucketName?: string
  exportsPrefix?: string
  auditLogsBucketName?: string
  auditLogsPrefix?: string
  alertEvaluationQueueUrl?: string
  alertEvaluationServiceEnabled?: boolean
  exportServiceEnabled?: boolean
  planeBDbSecretArn?: string
  planeBDbSsmName?: string
  planeCDbSecretArn?: string
  planeCDbSsmName?: string
  redisSecretArn?: string
  redisSsmName?: string
  redisUrl?: string
  oandaSecretArn?: string
  oandaSsmName?: string
  planeBDbHost?: string
  planeBDbPort?: string
  planeBDbName?: string
  planeCDbHost?: string
  planeCDbPort?: string
  planeCDbName?: string
}

const tagManagedRule = (rule: Rule, envName: string): void => {
  Tags.of(rule).add('managed-by', 'ops-pause')
  Tags.of(rule).add('environment', envName)
}

type LambdaNetworking = {
  vpc: Vpc
  vpcSubnets: { subnetType: SubnetType }
  securityGroups: SecurityGroup[]
  allowPublicSubnet?: boolean
}

const applyRedisEnv = (
  scope: Construct,
  fn: NodejsFunction,
  id: string,
  redisSecretArn?: string,
  redisSsmName?: string,
  redisUrl?: string,
): void => {
  if (redisSecretArn) {
    const secret = Secret.fromSecretCompleteArn(scope, id, redisSecretArn)
    secret.grantRead(fn)
    fn.addEnvironment('REDIS_SECRET_ARN', redisSecretArn)
  }
  if (redisSsmName) {
    fn.addEnvironment('REDIS_SSM_NAME', redisSsmName)
  }
  if (!redisSecretArn && !redisSsmName && redisUrl) {
    fn.addEnvironment('REDIS_URL', redisUrl)
  }
}

const applyCommunicationsEnv = (
  scope: Construct,
  fn: NodejsFunction,
  id: string,
  communicationsSecretArn?: string,
): void => {
  if (!communicationsSecretArn) return
  const secret = Secret.fromSecretCompleteArn(scope, id, communicationsSecretArn)
  secret.grantRead(fn)
  const communicationsEnvKeys = [
    'ALERT_UNSUBSCRIBE_SECRET',
    'ALERT_UNSUBSCRIBE_BASE_URL',
    'ALERT_UNSUBSCRIBE_TOKEN_TTL_HOURS',
    'ALERTS_EMAIL_ENABLED',
    'ALERTS_EMAIL_FROM',
    'ALERTS_EMAIL_FROM_NAME',
    'ALERTS_SMS_ENABLED',
    'NEWSLETTER_EMAIL_ENABLED',
    'NEWSLETTER_EMAIL_FROM',
    'NEWSLETTER_EMAIL_FROM_NAME',
    'NEWSLETTER_BASE_URL',
    'NEWSLETTER_TOKEN_EXPIRY_HOURS',
    'NEWSLETTER_WELCOME_ENABLED',
    'PUSH_WEB_ENABLED',
    'PUSH_WEB_VAPID_PUBLIC_KEY',
    'PUSH_WEB_VAPID_PRIVATE_KEY',
    'PUSH_WEB_VAPID_SUBJECT',
    'PUSH_SNS_ENABLED',
    'PUSH_SNS_IOS_PLATFORM_ARN',
    'PUSH_SNS_ANDROID_PLATFORM_ARN',
    'PUSH_SNS_APNS_SANDBOX',
    'SES_FROM_ADDRESS',
    'SES_REGION',
    'SNS_REGION',
  ]
  for (const envKey of communicationsEnvKeys) {
    fn.addEnvironment(envKey, secret.secretValueFromJson(envKey).toString())
  }
}

const applySentryEnv = (
  scope: Construct,
  fn: NodejsFunction,
  id: string,
  sentrySecretArn?: string,
  sentrySecretJsonKey?: string,
): void => {
  if (!sentrySecretArn) return
  const secret = Secret.fromSecretCompleteArn(scope, id, sentrySecretArn)
  secret.grantRead(fn)
  const value = sentrySecretJsonKey
    ? secret.secretValueFromJson(sentrySecretJsonKey)
    : secret.secretValue
  fn.addEnvironment('SENTRY_DSN', value.toString())
}

export const createScheduledJobs = (
  scope: Construct,
  options: ScheduledJobsOptions,
): ScheduledJobsResources => {
  const isDev = options.envName === 'dev'
  const isProd = options.envName === 'prod'
  const rulesEnabled = !options.paused
  const ruleName = (suffix: string) => `remit-scout-${options.envName}-${suffix}`
  const allowPublicSubnet = false
  const logRetention = options.envName === 'prod'
    ? RetentionDays.ONE_MONTH
    : (isDev ? RetentionDays.THREE_DAYS : RetentionDays.TWO_WEEKS)
  const cloudwatchMetricsEnabled = process.env.CLOUDWATCH_METRICS_ENABLED ?? '1'
  const tracingExporter = process.env.TRACING_EXPORTER ?? 'xray'
  const oandaThrottleEnv = collectOandaThrottleEnv()
  const providerThrottleEnv = collectPlaneBProviderThrottleEnv()
  const tracingMode = tracingExporter === 'none' ? Tracing.DISABLED : Tracing.ACTIVE
  const otelEndpoint = options.otelLambdaLayerArn
    ? 'http://127.0.0.1:4318/v1/traces'
    : undefined

  const exportWorkerIntervalMinutes = isDev ? 5 : 1
  const alertEvaluationIntervalMinutes = isDev ? 15 : 1
  const probeIntervalMinutes = isDev ? 30 : 5

  const lambdaSubnets = { subnetType: SubnetType.PRIVATE_WITH_EGRESS }
  const planeALambdaNetworking = {
    vpc: options.vpc,
    vpcSubnets: lambdaSubnets,
    securityGroups: [options.planeASecurityGroup],
    allowPublicSubnet,
  }
  const planeBLambdaNetworking = {
    vpc: options.vpc,
    vpcSubnets: lambdaSubnets,
    securityGroups: [options.planeBSecurityGroup],
    allowPublicSubnet,
  }
  const planeCLambdaNetworking = {
    vpc: options.vpc,
    vpcSubnets: lambdaSubnets,
    securityGroups: [options.planeCSecurityGroup],
    allowPublicSubnet,
  }
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
  const redisUrl = options.redisUrl
  const b2cRefreshServiceEnabled = options.b2cRefreshServiceEnabled ?? false
  const fxRateRefreshServiceEnabled = options.fxRateRefreshServiceEnabled ?? false

  const goldFxRatesEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
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
    runtime: Runtime.NODEJS_20_X,
    architecture: options.lambdaArchitecture,
    memorySize: 512,
    timeout: Duration.minutes(5),
    ...planeBLambdaNetworking,
    role: options.roles.planeBLambdaRole,
    tracing: tracingMode,
    environment: goldFxRatesEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  applySentryEnv(
    scope,
    goldFxRatesFunction,
    'GoldFxRatesSentrySecret',
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

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
  applyRedisEnv(
    scope,
    goldFxRatesFunction,
    'RedisSecret',
    redisSecretArn,
    redisSsmName,
    redisUrl,
  )

  const goldFxRatesRule = new Rule(scope, 'GoldFxRatesSchedule', {
    ruleName: ruleName('gold-fx-rates'),
    schedule: Schedule.rate(Duration.minutes(15)),
    description: 'Runs gold-fx-rates job every 15 minutes.',
    enabled: rulesEnabled,
  })
  tagManagedRule(goldFxRatesRule, options.envName)

  goldFxRatesRule.addTarget(new LambdaFunction(goldFxRatesFunction, { retryAttempts: 1 }))

  const exportWorkerEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
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
    runtime: Runtime.NODEJS_20_X,
    architecture: options.lambdaArchitecture,
    memorySize: 1024,
    timeout: Duration.minutes(15),
    ...planeALambdaNetworking,
    role: options.roles.planeALambdaRole,
    tracing: tracingMode,
    environment: exportWorkerEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  applySentryEnv(
    scope,
    exportWorkerFunction,
    'ExportWorkerSentrySecret',
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

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
  applyRedisEnv(
    scope,
    exportWorkerFunction,
    'ExportWorkerRedisSecret',
    redisSecretArn,
    redisSsmName,
    redisUrl,
  )

  const exportWorkerRule = new Rule(scope, 'ExportWorkerSchedule', {
    ruleName: ruleName('export-worker'),
    schedule: Schedule.rate(Duration.minutes(exportWorkerIntervalMinutes)),
    description: `Runs export worker every ${exportWorkerIntervalMinutes} minute(s) to drain queued export jobs.`,
    enabled: rulesEnabled && !options.exportServiceEnabled,
  })
  tagManagedRule(exportWorkerRule, options.envName)

  exportWorkerRule.addTarget(new LambdaFunction(exportWorkerFunction, { retryAttempts: 1 }))

  const alertEvaluationSchedulerEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
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
      runtime: Runtime.NODEJS_20_X,
      architecture: options.lambdaArchitecture,
      memorySize: 256,
      timeout: Duration.minutes(1),
      ...planeALambdaNetworking,
      role: options.roles.planeALambdaRole,
      tracing: tracingMode,
      environment: alertEvaluationSchedulerEnvironment,
      logRetention,
      layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
    },
  )

  applySentryEnv(
    scope,
    alertEvaluationSchedulerFunction,
    'AlertEvaluationSchedulerSentrySecret',
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

  const alertEvaluationWeeklyRule = new Rule(scope, 'AlertEvaluationWeeklySchedule', {
    ruleName: ruleName('alert-evaluation-weekly'),
    schedule: Schedule.rate(Duration.hours(1)),
    description: 'Enqueues weekly alerts by timezone bucket every hour.',
    enabled: rulesEnabled,
  })
  tagManagedRule(alertEvaluationWeeklyRule, options.envName)
  alertEvaluationWeeklyRule.addTarget(
    new LambdaFunction(alertEvaluationSchedulerFunction, {
      retryAttempts: 1,
      event: RuleTargetInput.fromObject({ frequency: 'weekly' }),
    }),
  )

  const alertEvaluationDailyRule = new Rule(scope, 'AlertEvaluationDailySchedule', {
    ruleName: ruleName('alert-evaluation-daily'),
    schedule: Schedule.rate(Duration.hours(1)),
    description: 'Enqueues daily alerts by timezone bucket every hour.',
    enabled: rulesEnabled,
  })
  tagManagedRule(alertEvaluationDailyRule, options.envName)
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
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
    ALERT_EVALUATION_ENABLED: '1',
    ALERT_EVALUATION_LOOP_JITTER_MS:
      process.env.ALERT_EVALUATION_LOOP_JITTER_MS || (isDev ? '250' : '0'),
    ALERT_EVALUATION_MESSAGE_JITTER_MS:
      process.env.ALERT_EVALUATION_MESSAGE_JITTER_MS || (isDev ? '250' : '0'),
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
    runtime: Runtime.NODEJS_20_X,
    architecture: options.lambdaArchitecture,
    memorySize: 1024,
    timeout: Duration.minutes(15),
    ...planeALambdaNetworking,
    role: options.roles.planeALambdaRole,
    tracing: tracingMode,
    environment: alertEvaluationWorkerEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  applySentryEnv(
    scope,
    alertEvaluationWorkerFunction,
    'AlertEvaluationWorkerSentrySecret',
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

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
  applyRedisEnv(
    scope,
    alertEvaluationWorkerFunction,
    'AlertEvaluationWorkerRedisSecret',
    redisSecretArn,
    redisSsmName,
    redisUrl,
  )
  applyCommunicationsEnv(
    scope,
    alertEvaluationWorkerFunction,
    'AlertEvaluationWorkerCommunicationsSecret',
    options.communicationsSecretArn,
  )

  const alertEvaluationWorkerRule = new Rule(scope, 'AlertEvaluationWorkerSchedule', {
    ruleName: ruleName('alert-evaluation-worker'),
    schedule: Schedule.rate(Duration.minutes(alertEvaluationIntervalMinutes)),
    description: `Runs alert evaluation worker every ${alertEvaluationIntervalMinutes} minute(s) to drain queued alert evaluations.`,
    enabled: rulesEnabled && !options.alertEvaluationServiceEnabled,
  })
  tagManagedRule(alertEvaluationWorkerRule, options.envName)
  alertEvaluationWorkerRule.addTarget(
    new LambdaFunction(alertEvaluationWorkerFunction, { retryAttempts: 1 }),
  )

  const alertCorridorRefreshEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (planeADbHost) {
    alertCorridorRefreshEnvironment.PLANE_A_DB_HOST = planeADbHost
  }
  if (planeADbPort) {
    alertCorridorRefreshEnvironment.PLANE_A_DB_PORT = planeADbPort
  }
  if (planeADbName) {
    alertCorridorRefreshEnvironment.PLANE_A_DB_NAME = planeADbName
  }
  if (options.quoteRefreshQueueUrl) {
    alertCorridorRefreshEnvironment.QUOTE_REFRESH_QUEUE_URL = options.quoteRefreshQueueUrl
  }
  if (options.quoteRefreshQueueMode) {
    alertCorridorRefreshEnvironment.QUOTE_REFRESH_QUEUE_MODE = options.quoteRefreshQueueMode
  }

  const alertCorridorRefreshFunction = new NodejsFunction(scope, 'AlertCorridorRefreshFunction', {
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'alert-corridor-refresh-lambda.ts',
    ),
    handler: 'handler',
    runtime: Runtime.NODEJS_20_X,
    architecture: options.lambdaArchitecture,
    memorySize: 512,
    timeout: Duration.minutes(10),
    ...planeALambdaNetworking,
    role: options.roles.planeALambdaRole,
    tracing: tracingMode,
    environment: alertCorridorRefreshEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  applySentryEnv(
    scope,
    alertCorridorRefreshFunction,
    'AlertCorridorRefreshSentrySecret',
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

  if (planeADbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'AlertCorridorRefreshDbSecret',
      planeADbSecretArn,
    )
    secret.grantRead(alertCorridorRefreshFunction)
    alertCorridorRefreshFunction.addEnvironment('PLANE_A_DB_SECRET_ARN', planeADbSecretArn)
  }
  if (planeADbSsmName) {
    alertCorridorRefreshFunction.addEnvironment('PLANE_A_DB_SSM_NAME', planeADbSsmName)
  }
  applyRedisEnv(
    scope,
    alertCorridorRefreshFunction,
    'AlertCorridorRefreshRedisSecret',
    redisSecretArn,
    redisSsmName,
    redisUrl,
  )

  const alertCorridorRefreshIntervalHours = isDev ? 6 : 4
  const alertCorridorRefreshRule = new Rule(scope, 'AlertCorridorRefreshSchedule', {
    ruleName: ruleName('alert-corridor-refresh'),
    schedule: Schedule.rate(Duration.hours(alertCorridorRefreshIntervalHours)),
    description: `Refreshes non-macro corridors with active alerts every ${alertCorridorRefreshIntervalHours} hours.`,
    enabled: rulesEnabled,
  })
  tagManagedRule(alertCorridorRefreshRule, options.envName)
  alertCorridorRefreshRule.addTarget(
    new LambdaFunction(alertCorridorRefreshFunction, { retryAttempts: 1 }),
  )

  const smartAlertsEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    DB_QUERY_TIMEOUT_MS: '300000',
    SMART_ALERTS_LOOKBACK_DAYS: isDev ? '7' : '42',
    SMART_ALERTS_MIN_SAMPLE_DAYS: isDev ? '3' : '21',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (planeBDbHost) {
    smartAlertsEnvironment.PLANE_B_DB_HOST = planeBDbHost
  }
  if (planeBDbPort) {
    smartAlertsEnvironment.PLANE_B_DB_PORT = planeBDbPort
  }
  if (planeBDbName) {
    smartAlertsEnvironment.PLANE_B_DB_NAME = planeBDbName
  }

  const smartAlertsTimeout = isDev ? Duration.minutes(15) : Duration.minutes(10)
  const smartAlertsMemory = isDev ? 1024 : 512

  const smartAlertsFunction = new NodejsFunction(scope, 'SmartAlertsJobFunction', {
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'smart-alerts-job-lambda.ts',
    ),
    handler: 'handler',
    runtime: Runtime.NODEJS_20_X,
    architecture: options.lambdaArchitecture,
    memorySize: smartAlertsMemory,
    timeout: smartAlertsTimeout,
    reservedConcurrentExecutions: isProd ? 1 : undefined,
    ...planeBLambdaNetworking,
    role: options.roles.planeBLambdaRole,
    tracing: tracingMode,
    environment: smartAlertsEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  applySentryEnv(
    scope,
    smartAlertsFunction,
    'SmartAlertsSentrySecret',
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

  if (planeBDbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'SmartAlertsDbSecret',
      planeBDbSecretArn,
    )
    secret.grantRead(smartAlertsFunction)
    smartAlertsFunction.addEnvironment('PLANE_B_DB_SECRET_ARN', planeBDbSecretArn)
  }
  if (planeBDbSsmName) {
    smartAlertsFunction.addEnvironment('PLANE_B_DB_SSM_NAME', planeBDbSsmName)
  }
  applyRedisEnv(
    scope,
    smartAlertsFunction,
    'SmartAlertsRedisSecret',
    redisSecretArn,
    redisSsmName,
    redisUrl,
  )

  const smartAlertsIntervalHours = isDev ? 6 : 4
  const smartAlertsRule = new Rule(scope, 'SmartAlertsSchedule', {
    ruleName: ruleName('smart-alerts'),
    schedule: Schedule.rate(Duration.hours(smartAlertsIntervalHours)),
    description: `Updates smart alert signals every ${smartAlertsIntervalHours} hours.`,
    enabled: rulesEnabled,
  })
  tagManagedRule(smartAlertsRule, options.envName)

  smartAlertsRule.addTarget(new LambdaFunction(smartAlertsFunction, { retryAttempts: 1 }))

  const telemetryAnalyticsEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
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
    runtime: Runtime.NODEJS_20_X,
    architecture: options.lambdaArchitecture,
    memorySize: 512,
    timeout: Duration.minutes(5),
    ...planeALambdaNetworking,
    role: options.roles.planeALambdaRole,
    tracing: tracingMode,
    environment: telemetryAnalyticsEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  applySentryEnv(
    scope,
    telemetryAnalyticsFunction,
    'TelemetryAnalyticsSentrySecret',
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

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
  applyRedisEnv(
    scope,
    telemetryAnalyticsFunction,
    'TelemetryAnalyticsRedisSecret',
    redisSecretArn,
    redisSsmName,
    redisUrl,
  )

  const telemetryAnalyticsRule = new Rule(scope, 'TelemetryAnalyticsSchedule', {
    ruleName: ruleName('telemetry-analytics'),
    schedule: Schedule.rate(Duration.hours(1)),
    description: 'Aggregates telemetry analytics hourly.',
    enabled: rulesEnabled,
  })
  tagManagedRule(telemetryAnalyticsRule, options.envName)

  telemetryAnalyticsRule.addTarget(new LambdaFunction(telemetryAnalyticsFunction, { retryAttempts: 1 }))

  const sessionCleanupEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
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
    runtime: Runtime.NODEJS_20_X,
    architecture: options.lambdaArchitecture,
    memorySize: 512,
    timeout: Duration.minutes(5),
    ...planeALambdaNetworking,
    role: options.roles.planeALambdaRole,
    tracing: tracingMode,
    environment: sessionCleanupEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  applySentryEnv(
    scope,
    sessionCleanupFunction,
    'SessionCleanupSentrySecret',
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

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
    ruleName: ruleName('session-cleanup'),
    schedule: Schedule.cron({ minute: '0', hour: '2' }),
    description: 'Revokes expired and inactive sessions daily.',
    enabled: rulesEnabled,
  })
  tagManagedRule(sessionCleanupRule, options.envName)

  sessionCleanupRule.addTarget(new LambdaFunction(sessionCleanupFunction, { retryAttempts: 1 }))

  const bankVsSpecialistRefreshEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (planeADbHost) {
    bankVsSpecialistRefreshEnvironment.PLANE_A_DB_HOST = planeADbHost
  }
  if (planeADbPort) {
    bankVsSpecialistRefreshEnvironment.PLANE_A_DB_PORT = planeADbPort
  }
  if (planeADbName) {
    bankVsSpecialistRefreshEnvironment.PLANE_A_DB_NAME = planeADbName
  }
  if (options.quoteRefreshQueueUrl) {
    bankVsSpecialistRefreshEnvironment.QUOTE_REFRESH_QUEUE_URL = options.quoteRefreshQueueUrl
  }
  if (options.quoteRefreshQueueMode) {
    bankVsSpecialistRefreshEnvironment.QUOTE_REFRESH_QUEUE_MODE = options.quoteRefreshQueueMode
  }

  const bankVsSpecialistRefreshFunction = new NodejsFunction(
    scope,
    'BankVsSpecialistRefreshFunction',
    {
      entry: path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'backend',
        'scripts',
        'aws',
        'bank-vs-specialist-refresh-lambda.ts',
      ),
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      architecture: options.lambdaArchitecture,
      memorySize: 512,
      timeout: Duration.minutes(5),
      ...planeALambdaNetworking,
      role: options.roles.planeALambdaRole,
      tracing: tracingMode,
      environment: bankVsSpecialistRefreshEnvironment,
      logRetention,
      layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
    },
  )

  applySentryEnv(
    scope,
    bankVsSpecialistRefreshFunction,
    'BankVsSpecialistRefreshSentrySecret',
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

  if (planeADbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'BankVsSpecialistRefreshDbSecret',
      planeADbSecretArn,
    )
    secret.grantRead(bankVsSpecialistRefreshFunction)
    bankVsSpecialistRefreshFunction.addEnvironment('PLANE_A_DB_SECRET_ARN', planeADbSecretArn)
  }
  if (planeADbSsmName) {
    bankVsSpecialistRefreshFunction.addEnvironment('PLANE_A_DB_SSM_NAME', planeADbSsmName)
  }
  applyRedisEnv(
    scope,
    bankVsSpecialistRefreshFunction,
    'BankVsSpecialistRefreshRedisSecret',
    redisSecretArn,
    redisSsmName,
    redisUrl,
  )

  const bankVsSpecialistRefreshRule = new Rule(scope, 'BankVsSpecialistRefreshSchedule', {
    ruleName: ruleName('bank-vs-specialist-refresh'),
    schedule: Schedule.rate(Duration.minutes(30)),
    description: 'Enqueues bank vs specialist refresh requests every 30 minutes.',
    enabled: rulesEnabled,
  })
  tagManagedRule(bankVsSpecialistRefreshRule, options.envName)

  bankVsSpecialistRefreshRule.addTarget(
    new LambdaFunction(bankVsSpecialistRefreshFunction, { retryAttempts: 1 }),
  )

  const auditLogCleanupEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
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
    runtime: Runtime.NODEJS_20_X,
    architecture: options.lambdaArchitecture,
    memorySize: 512,
    timeout: Duration.minutes(10),
    ...planeALambdaNetworking,
    role: options.roles.planeALambdaRole,
    tracing: tracingMode,
    environment: auditLogCleanupEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  applySentryEnv(
    scope,
    auditLogCleanupFunction,
    'AuditLogCleanupSentrySecret',
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

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
    ruleName: ruleName('audit-log-cleanup'),
    schedule: Schedule.cron({ minute: '0', hour: '3', day: '1' }),
    description: 'Archives and deletes expired audit logs monthly.',
    enabled: rulesEnabled,
  })
  tagManagedRule(auditLogCleanupRule, options.envName)

  auditLogCleanupRule.addTarget(new LambdaFunction(auditLogCleanupFunction, { retryAttempts: 1 }))

  const oandaSyncEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
    ...oandaThrottleEnv,
  }
  if (options.envName !== 'prod') {
    oandaSyncEnvironment.OANDA_SYNC_INCLUDE_CAPABILITY = '1'
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
    runtime: Runtime.NODEJS_20_X,
    architecture: options.lambdaArchitecture,
    memorySize: 512,
    timeout: Duration.minutes(5),
    ...planeALambdaNetworking,
    role: options.roles.planeALambdaRole,
    tracing: tracingMode,
    environment: oandaSyncEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  applySentryEnv(
    scope,
    oandaSyncFunction,
    'OandaSyncSentrySecret',
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

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
  applyRedisEnv(
    scope,
    oandaSyncFunction,
    'OandaRedisSecret',
    redisSecretArn,
    redisSsmName,
    redisUrl,
  )
  if (oandaSecretArn) {
    const secret = Secret.fromSecretCompleteArn(scope, 'OandaApiSecret', oandaSecretArn)
    secret.grantRead(oandaSyncFunction)
    oandaSyncFunction.addEnvironment('OANDA_SECRET_ARN', oandaSecretArn)
  }
  if (oandaSsmName) {
    oandaSyncFunction.addEnvironment('OANDA_SSM_NAME', oandaSsmName)
  }

  const oandaSyncRule = new Rule(scope, 'OandaSyncSchedule', {
    ruleName: ruleName('oanda-sync'),
    schedule: Schedule.rate(Duration.hours(1)),
    description: 'Runs OANDA FX rates sync every hour.',
    enabled: rulesEnabled,
  })
  tagManagedRule(oandaSyncRule, options.envName)

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
    enabled: rulesEnabled,
    logRetention,
    otelLambdaLayer,
    lambdaNetworking: planeBLambdaNetworking,
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
    enabled: rulesEnabled,
    logRetention,
    otelLambdaLayer,
    lambdaNetworking: planeBLambdaNetworking,
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
    schedule: Schedule.rate(Duration.hours(4)),
    enabled: rulesEnabled,
    logRetention,
    otelLambdaLayer,
    lambdaNetworking: planeCLambdaNetworking,
    planeCDbSecretArn,
    planeCDbSsmName,
    planeCDbHost,
    planeCDbPort,
    planeCDbName,
    redisSecretArn,
    redisSsmName,
  })

  const goldIndicesIntervalHours = 4
  const goldIndicesRule = createPlaneCLambdaJob({
    scope,
    options,
    id: 'GoldIndicesJob',
    jobName: 'gold-indices',
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'gold-indices-job-lambda.ts',
    ),
    schedule: Schedule.rate(Duration.hours(goldIndicesIntervalHours)),
    enabled: rulesEnabled,
    logRetention,
    otelLambdaLayer,
    lambdaNetworking: planeCLambdaNetworking,
    planeCDbSecretArn,
    planeCDbSsmName,
    planeCDbHost,
    planeCDbPort,
    planeCDbName,
    redisSecretArn,
    redisSsmName,
  })

  const providerWeightsIntervalHours = options.envName === 'dev' ? 24 : 6
  const providerWeightsRule = createPlaneCLambdaJob({
    scope,
    options,
    id: 'ProviderWeightingJob',
    jobName: 'provider-weighting',
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'provider-weighting-job-lambda.ts',
    ),
    schedule: Schedule.rate(Duration.hours(providerWeightsIntervalHours)),
    enabled: rulesEnabled,
    logRetention,
    otelLambdaLayer,
    lambdaNetworking: planeCLambdaNetworking,
    planeCDbSecretArn,
    planeCDbSsmName,
    planeCDbHost,
    planeCDbPort,
    planeCDbName,
  })

  const dataHealthSloIntervalMinutes = options.envName === 'dev' ? 15 : 5
  const dataHealthTier2Freshness = options.envName === 'dev' ? '21600' : '10800'
  const dataHealthSloEnvironment: Record<string, string> = {
    JOB_NAME: 'data-health-slo',
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
    SLO_FRESHNESS_P95_THRESHOLD: '900',
    SLO_FRESHNESS_P95_TIER2_THRESHOLD: dataHealthTier2Freshness,
    SLO_QUOTE_SUCCESS_RATE_THRESHOLD: '0.98',
    SLO_QUOTE_SUCCESS_RATE_TIER2_THRESHOLD: '0.95',
    SLO_PROVIDER_COVERAGE_THRESHOLD: '3',
    SLO_PROVIDER_COVERAGE_TIER2_THRESHOLD: '3',
    SLO_INDICES_AVAILABLE_RATIO_THRESHOLD: '0.8',
    SLO_INDICES_SUPPRESSED_RATIO_THRESHOLD: '0.2',
    SLO_WEIGHT_CONFIDENCE_P10_THRESHOLD: '0.3',
  }
  if (planeBDbHost) {
    dataHealthSloEnvironment.PLANE_B_DB_HOST = planeBDbHost
  }
  if (planeBDbPort) {
    dataHealthSloEnvironment.PLANE_B_DB_PORT = planeBDbPort
  }
  if (planeBDbName) {
    dataHealthSloEnvironment.PLANE_B_DB_NAME = planeBDbName
  }
  if (planeCDbHost) {
    dataHealthSloEnvironment.PLANE_C_DB_HOST = planeCDbHost
  }
  if (planeCDbPort) {
    dataHealthSloEnvironment.PLANE_C_DB_PORT = planeCDbPort
  }
  if (planeCDbName) {
    dataHealthSloEnvironment.PLANE_C_DB_NAME = planeCDbName
  }

  const dataHealthSloFunction = new NodejsFunction(scope, 'DataHealthSloJobFunction', {
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'data-health-slo-job-lambda.ts',
    ),
    handler: 'handler',
    runtime: Runtime.NODEJS_20_X,
    architecture: options.lambdaArchitecture,
    memorySize: 512,
    timeout: Duration.minutes(5),
    ...planeCLambdaNetworking,
    role: options.roles.planeCLambdaRole,
    tracing: tracingMode,
    environment: dataHealthSloEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  applySentryEnv(
    scope,
    dataHealthSloFunction,
    'DataHealthSloSentrySecret',
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

  if (planeBDbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'DataHealthSloPlaneBDbSecret',
      planeBDbSecretArn,
    )
    secret.grantRead(dataHealthSloFunction)
    dataHealthSloFunction.addEnvironment('PLANE_B_DB_SECRET_ARN', planeBDbSecretArn)
  }
  if (planeBDbSsmName) {
    dataHealthSloFunction.addEnvironment('PLANE_B_DB_SSM_NAME', planeBDbSsmName)
  }
  if (planeCDbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'DataHealthSloPlaneCDbSecret',
      planeCDbSecretArn,
    )
    secret.grantRead(dataHealthSloFunction)
    dataHealthSloFunction.addEnvironment('PLANE_C_DB_SECRET_ARN', planeCDbSecretArn)
  }
  if (planeCDbSsmName) {
    dataHealthSloFunction.addEnvironment('PLANE_C_DB_SSM_NAME', planeCDbSsmName)
  }

  const dataHealthSloRule = new Rule(scope, 'DataHealthSloSchedule', {
    ruleName: ruleName('data-health-slo'),
    schedule: Schedule.rate(Duration.minutes(dataHealthSloIntervalMinutes)),
    description: 'Runs data health SLO job on a fixed cadence.',
    enabled: rulesEnabled,
  })
  tagManagedRule(dataHealthSloRule, options.envName)

  dataHealthSloRule.addTarget(new LambdaFunction(dataHealthSloFunction, { retryAttempts: 1 }))

  const goldReconciliationEnvironment: Record<string, string> = {
    JOB_NAME: 'gold-reconciliation',
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (planeBDbHost) {
    goldReconciliationEnvironment.PLANE_B_DB_HOST = planeBDbHost
  }
  if (planeBDbPort) {
    goldReconciliationEnvironment.PLANE_B_DB_PORT = planeBDbPort
  }
  if (planeBDbName) {
    goldReconciliationEnvironment.PLANE_B_DB_NAME = planeBDbName
  }
  if (planeCDbHost) {
    goldReconciliationEnvironment.PLANE_C_DB_HOST = planeCDbHost
  }
  if (planeCDbPort) {
    goldReconciliationEnvironment.PLANE_C_DB_PORT = planeCDbPort
  }
  if (planeCDbName) {
    goldReconciliationEnvironment.PLANE_C_DB_NAME = planeCDbName
  }

  const goldReconciliationFunction = new NodejsFunction(scope, 'GoldReconciliationJobFunction', {
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'gold-reconciliation-job-lambda.ts',
    ),
    handler: 'handler',
    runtime: Runtime.NODEJS_20_X,
    architecture: options.lambdaArchitecture,
    memorySize: 512,
    timeout: Duration.minutes(10),
    ...planeCLambdaNetworking,
    role: options.roles.planeCLambdaRole,
    tracing: tracingMode,
    environment: goldReconciliationEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  applySentryEnv(
    scope,
    goldReconciliationFunction,
    'GoldReconciliationSentrySecret',
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

  if (planeBDbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'GoldReconciliationPlaneBDbSecret',
      planeBDbSecretArn,
    )
    secret.grantRead(goldReconciliationFunction)
    goldReconciliationFunction.addEnvironment('PLANE_B_DB_SECRET_ARN', planeBDbSecretArn)
  }
  if (planeBDbSsmName) {
    goldReconciliationFunction.addEnvironment('PLANE_B_DB_SSM_NAME', planeBDbSsmName)
  }
  if (planeCDbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'GoldReconciliationPlaneCDbSecret',
      planeCDbSecretArn,
    )
    secret.grantRead(goldReconciliationFunction)
    goldReconciliationFunction.addEnvironment('PLANE_C_DB_SECRET_ARN', planeCDbSecretArn)
  }
  if (planeCDbSsmName) {
    goldReconciliationFunction.addEnvironment('PLANE_C_DB_SSM_NAME', planeCDbSsmName)
  }
  applyRedisEnv(
    scope,
    goldReconciliationFunction,
    'GoldReconciliationRedisSecret',
    redisSecretArn,
    redisSsmName,
    redisUrl,
  )

  const goldReconciliationRule = new Rule(scope, 'GoldReconciliationSchedule', {
    ruleName: ruleName('gold-reconciliation'),
    schedule: Schedule.rate(Duration.minutes(15)),
    description: 'Runs gold reconciliation job every 15 minutes to backfill missed Gold updates.',
    enabled: rulesEnabled,
  })
  tagManagedRule(goldReconciliationRule, options.envName)

  goldReconciliationRule.addTarget(new LambdaFunction(goldReconciliationFunction, { retryAttempts: 1 }))

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
    enabled: rulesEnabled,
    logRetention,
    otelLambdaLayer,
    lambdaNetworking: planeBLambdaNetworking,
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
    enabled: rulesEnabled,
    logRetention,
    otelLambdaLayer,
    lambdaNetworking: planeBLambdaNetworking,
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
    enabled: rulesEnabled,
    logRetention,
    otelLambdaLayer,
    lambdaNetworking: planeBLambdaNetworking,
    planeBDbSecretArn,
    planeBDbSsmName,
    planeBDbHost,
    planeBDbPort,
    planeBDbName,
    redisSecretArn,
    redisSsmName,
  })

  const rightsMatrixSyncCountriesRule = createPlaneBLambdaJob({
    scope,
    options,
    id: 'RightsMatrixSyncCountriesJob',
    jobName: 'rights-matrix-sync-countries',
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'rights-matrix-sync-countries-lambda.ts',
    ),
    schedule: Schedule.rate(Duration.hours(options.envName === 'dev' ? 1 : 6)),
    enabled: rulesEnabled,
    logRetention,
    otelLambdaLayer,
    lambdaNetworking: planeBLambdaNetworking,
    planeBDbSecretArn,
    planeBDbSsmName,
    planeBDbHost,
    planeBDbPort,
    planeBDbName,
  })

  const b2cRefreshIntervalMinutes = options.envName === 'dev' ? 1 : 2
  const b2cRefreshRule = new Rule(scope, 'B2cRefreshWorkerSchedule', {
    ruleName: ruleName('b2c-refresh-worker'),
    schedule: Schedule.rate(Duration.minutes(b2cRefreshIntervalMinutes)),
    description: `Runs the B2C refresh worker on a ${b2cRefreshIntervalMinutes}-minute cadence.`,
    // If the B2C refresh worker is deployed as an ECS service (with autoscaling), we must not
    // also schedule one-off tasks. Scheduling + a loop-enabled task definition can explode
    // into many long-running tasks and exhaust Fargate vCPU.
    enabled: rulesEnabled && !b2cRefreshServiceEnabled,
  })
  tagManagedRule(b2cRefreshRule, options.envName)

  b2cRefreshRule.addTarget(
    new EcsTask({
      cluster: options.cluster,
      taskDefinition: options.b2cRefreshTask,
      subnetSelection: { subnetType: isDev ? SubnetType.PUBLIC : SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [options.planeBSecurityGroup],
      taskCount: 1,
      platformVersion: FargatePlatformVersion.LATEST,
      assignPublicIp: isDev,
    }),
  )

  const fxRateRefreshIntervalMinutes = options.envName === 'dev' ? 1 : 2
  const fxRateRefreshRule = new Rule(scope, 'FxRateRefreshWorkerSchedule', {
    ruleName: ruleName('fx-rate-refresh-worker'),
    schedule: Schedule.rate(Duration.minutes(fxRateRefreshIntervalMinutes)),
    description: `Runs the FX rate refresh worker on a ${fxRateRefreshIntervalMinutes}-minute cadence.`,
    // If the FX refresh worker is deployed as an ECS service (with autoscaling), we must not
    // also schedule one-off tasks. Scheduling + a loop-enabled task definition can explode
    // into many long-running tasks and exhaust Fargate vCPU.
    enabled: rulesEnabled && !fxRateRefreshServiceEnabled,
  })
  tagManagedRule(fxRateRefreshRule, options.envName)

  fxRateRefreshRule.addTarget(
    new EcsTask({
      cluster: options.cluster,
      taskDefinition: options.fxRateRefreshTask,
      subnetSelection: { subnetType: isDev ? SubnetType.PUBLIC : SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [options.planeBSecurityGroup],
      taskCount: 1,
      platformVersion: FargatePlatformVersion.LATEST,
      assignPublicIp: isDev,
    }),
  )

  const b2bSweepSchedulerRule = new Rule(scope, 'B2bSweepSchedulerSchedule', {
    ruleName: ruleName('b2b-sweep-scheduler'),
    schedule: Schedule.rate(Duration.minutes(1)),
    description: 'Runs the B2B sweep scheduler every minute to enqueue due tier runs.',
    enabled: rulesEnabled,
  })
  tagManagedRule(b2bSweepSchedulerRule, options.envName)

  b2bSweepSchedulerRule.addTarget(
    new EcsTask({
      cluster: options.cluster,
      taskDefinition: options.b2bSweepSchedulerTask,
      subnetSelection: { subnetType: isDev ? SubnetType.PUBLIC : SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [options.planeBSecurityGroup],
      taskCount: 1,
      platformVersion: FargatePlatformVersion.LATEST,
      assignPublicIp: isDev,
    }),
  )

  // Provider Probe Lambda Functions
  const probeProviders = [
    { id: 'Remitly', providerId: 'remitly' },
    { id: 'WesternUnion', providerId: 'westernunion' },
    { id: 'Wise', providerId: 'wise' },
    { id: 'WorldRemit', providerId: 'worldremit' },
    { id: 'Ria', providerId: 'ria' },
    { id: 'Dahabshiil', providerId: 'dahabshiil' },
    { id: 'Sendwave', providerId: 'sendwave' },
    { id: 'Mukuru', providerId: 'mukuru' },
    { id: 'Xe', providerId: 'xe' },
    { id: 'AlAnsari', providerId: 'alansari' },
    { id: 'Instarem', providerId: 'instarem' },
    { id: 'Xoom', providerId: 'xoom' },
    { id: 'Singx', providerId: 'singx' },
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
      runtime: Runtime.NODEJS_20_X,
      architecture: options.lambdaArchitecture,
      memorySize: 512,
      timeout: Duration.minutes(5),
      ...planeBLambdaNetworking,
      role: options.roles.planeBLambdaRole,
      tracing: tracingMode,
      environment: {
        JOB_NAME: `${providerId}-probe`,
        ENVIRONMENT: options.envName,
        NODE_ENV: 'production',
        PGSSLMODE: 'require',
        DB_DISABLE_STATEMENT_TIMEOUT: '1',
        TRACING_EXPORTER: tracingExporter,
        ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
        CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
        CLOUDWATCH_NAMESPACE: 'RemitScout',
        CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
        CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
        ...providerThrottleEnv,
        ...(planeBDbHost && { PLANE_B_DB_HOST: planeBDbHost }),
        ...(planeBDbPort && { PLANE_B_DB_PORT: planeBDbPort }),
        ...(planeBDbName && { PLANE_B_DB_NAME: planeBDbName }),
      },
      layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
    })

    applySentryEnv(
      scope,
      fn,
      `${id}ProbeSentrySecret`,
      options.sentrySecretArn,
      options.sentrySecretJsonKey,
    )

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
    applyRedisEnv(
      scope,
      fn,
      `${id}ProbeRedisSecret`,
      redisSecretArn,
      redisSsmName,
      redisUrl,
    )

    const rule = new Rule(scope, `${id}ProbeSchedule`, {
      schedule: Schedule.rate(Duration.minutes(probeIntervalMinutes)),
      description: `Runs ${providerId} provider health probe every ${probeIntervalMinutes} minutes.`,
      enabled: rulesEnabled,
    })
    tagManagedRule(rule, options.envName)

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
    alertEvaluationWeeklyRule,
    alertEvaluationDailyRule,
    alertEvaluationWorkerFunction,
    alertEvaluationWorkerRule,
    alertCorridorRefreshFunction,
    alertCorridorRefreshRule,
    smartAlertsFunction,
    smartAlertsRule,
    telemetryAnalyticsFunction,
    telemetryAnalyticsRule,
    sessionCleanupFunction,
    sessionCleanupRule,
    bankVsSpecialistRefreshFunction,
    bankVsSpecialistRefreshRule,
    auditLogCleanupFunction,
    auditLogCleanupRule,
    goldPopularCorridorsRule,
    goldPulseCacheRule,
    goldPublisherRule,
    goldIndicesRule,
    dataHealthSloFunction,
    dataHealthSloRule,
    goldReconciliationRule,
    b2cRetryFailedRule,
    b2cQueueCleanupRule,
    stoplistAutoResumeRule,
    rightsMatrixSyncCountriesRule,
    b2cRefreshRule,
    fxRateRefreshRule,
    b2bSweepSchedulerRule,
    oandaSyncFunction,
    oandaSyncRule,
  }
}

type LambdaJobOptions = {
  scope: Construct
  options: ScheduledJobsOptions
  id: string
  jobName: string
  entry: string
  schedule: Schedule
  enabled?: boolean
  logRetention: RetentionDays
  otelLambdaLayer?: ILayerVersion
  lambdaNetworking: LambdaNetworking
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
  enabled,
  logRetention,
  otelLambdaLayer,
  lambdaNetworking,
  planeBDbSecretArn,
  planeBDbSsmName,
  planeBDbHost,
  planeBDbPort,
  planeBDbName,
  redisSecretArn,
  redisSsmName,
}: LambdaJobOptions): Rule => {
  const isDev = options.envName === 'dev'
  const cloudwatchMetricsEnabled = isDev ? '0' : '1'
  const tracingExporter = isDev ? 'none' : 'xray'
  const tracingMode = isDev ? Tracing.DISABLED : Tracing.ACTIVE
  const otelEndpoint = otelLambdaLayer ? 'http://127.0.0.1:4318/v1/traces' : undefined
  const environment: Record<string, string> = {
    JOB_NAME: jobName,
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
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
    runtime: Runtime.NODEJS_20_X,
    architecture: options.lambdaArchitecture,
    memorySize: 512,
    timeout: Duration.minutes(5),
    ...lambdaNetworking,
    role: options.roles.planeBLambdaRole,
    tracing: tracingMode,
    environment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  applySentryEnv(
    scope,
    fn,
    `${id}SentrySecret`,
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

  if (planeBDbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(scope, `${id}DbSecret`, planeBDbSecretArn)
    secret.grantRead(fn)
    fn.addEnvironment('PLANE_B_DB_SECRET_ARN', planeBDbSecretArn)
  }
  if (planeBDbSsmName) {
    fn.addEnvironment('PLANE_B_DB_SSM_NAME', planeBDbSsmName)
  }

  applyRedisEnv(
    scope,
    fn,
    `${id}RedisSecret`,
    redisSecretArn,
    redisSsmName,
    options.redisUrl,
  )

  const rule = new Rule(scope, `${id}Schedule`, {
    ruleName: `remit-scout-${options.envName}-${jobName}`,
    schedule,
    description: `Runs ${jobName} on a schedule.`,
    enabled,
  })
  tagManagedRule(rule, options.envName)

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
  enabled,
  logRetention,
  otelLambdaLayer,
  lambdaNetworking,
  planeCDbSecretArn,
  planeCDbSsmName,
  planeCDbHost,
  planeCDbPort,
  planeCDbName,
  redisSecretArn,
  redisSsmName,
}: LambdaJobOptions): Rule => {
  const isDev = options.envName === 'dev'
  const cloudwatchMetricsEnabled = isDev ? '0' : '1'
  const tracingExporter = isDev ? 'none' : 'xray'
  const tracingMode = isDev ? Tracing.DISABLED : Tracing.ACTIVE
  const otelEndpoint = otelLambdaLayer ? 'http://127.0.0.1:4318/v1/traces' : undefined
  const environment: Record<string, string> = {
    JOB_NAME: jobName,
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    ...(otelEndpoint ? { OTEL_EXPORTER_OTLP_ENDPOINT: otelEndpoint } : {}),
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (jobName === 'gold-indices') {
    const lookbackOverride =
      options.goldIndicesLookbackDays ?? (options.envName === 'dev' ? '3' : undefined)
    if (lookbackOverride) {
      environment.GOLD_INDICES_LOOKBACK_DAYS = lookbackOverride
    }
  }
  if (jobName === 'provider-weighting') {
    const windowOverride = options.providerWeightWindowDays ?? (isDev ? '7' : undefined)
    if (windowOverride) {
      environment.PROVIDER_WEIGHT_WINDOW_DAYS = windowOverride
    }
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
    runtime: Runtime.NODEJS_20_X,
    architecture: options.lambdaArchitecture,
    memorySize: 512,
    timeout: Duration.minutes(5),
    ...lambdaNetworking,
    role: options.roles.planeCLambdaRole,
    tracing: tracingMode,
    environment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  applySentryEnv(
    scope,
    fn,
    `${id}SentrySecret`,
    options.sentrySecretArn,
    options.sentrySecretJsonKey,
  )

  if (planeCDbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(scope, `${id}DbSecret`, planeCDbSecretArn)
    secret.grantRead(fn)
    fn.addEnvironment('PLANE_C_DB_SECRET_ARN', planeCDbSecretArn)
  }
  if (planeCDbSsmName) {
    fn.addEnvironment('PLANE_C_DB_SSM_NAME', planeCDbSsmName)
  }

  applyRedisEnv(
    scope,
    fn,
    `${id}RedisSecret`,
    redisSecretArn,
    redisSsmName,
    options.redisUrl,
  )

  const rule = new Rule(scope, `${id}Schedule`, {
    ruleName: `remit-scout-${options.envName}-${jobName}`,
    schedule,
    description: `Runs ${jobName} on a schedule.`,
    enabled,
  })
  tagManagedRule(rule, options.envName)

  rule.addTarget(new LambdaFunction(fn, { retryAttempts: 1 }))

  return rule
}
