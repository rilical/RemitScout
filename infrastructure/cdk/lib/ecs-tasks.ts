import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib'
import {
  ContainerImage,
  CpuArchitecture,
  FargateTaskDefinition,
  HealthCheck,
  LogDrivers,
  OperatingSystemFamily,
  Protocol,
  Secret as EcsSecret,
} from 'aws-cdk-lib/aws-ecs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import type { Repository } from 'aws-cdk-lib/aws-ecr'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import type { Construct } from 'constructs'

import type { IamResources } from './iam'

export type EcsTaskResources = {
  planeBIngestTask: FargateTaskDefinition
  b2cRefreshTask: FargateTaskDefinition
  ingestFanoutTask: FargateTaskDefinition
  goldLiveTask: FargateTaskDefinition
  notificationsQueueTask: FargateTaskDefinition
  opsAlertsQueueTask: FargateTaskDefinition
}

export type EcsTaskOptions = {
  envName: string
  backendRepository: Repository
  imageTag: string
  roles: IamResources
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
  redisSecretJsonKey?: string
  redisSsmName?: string
  redisUrl?: string
  proxyResidentialSecretArn?: string
  proxyResidentialSecretJsonKey?: string
  proxyResidentialSsmName?: string
  proxyResidentialUrl?: string
  proxyDatacenterSecretArn?: string
  proxyDatacenterSecretJsonKey?: string
  proxyDatacenterSsmName?: string
  proxyDatacenterUrl?: string
  quoteRefreshQueueUrl?: string
  quoteRefreshQueueMode?: string
  ingestFanoutQueueUrl?: string
  goldLiveQueueUrl?: string
  goldLiveQueueMode?: string
  notificationsQueueUrl?: string
  opsAlertsQueueUrl?: string
  bronzeBucketName?: string
  bronzePrefix?: string
  b2cQueueInSweep?: string
  b2cRefreshLoopEnabled?: boolean
  planeBB2bTargetMinutes?: string
  planeBB2bObservationMode?: string
  planeBB2bMaxQueueDepth?: string
  planeBIngestFanoutMessageMode?: string
  ingestFanoutMode?: string
  notificationsMode?: string
  opsAlertsMode?: string
}

export const createEcsTasks = (
  scope: Construct,
  options: EcsTaskOptions,
): EcsTaskResources => {
  const isProd = options.envName === 'prod'
  const isDev = options.envName === 'dev'
  const logRetention = isProd
    ? RetentionDays.ONE_MONTH
    : (isDev ? RetentionDays.THREE_DAYS : RetentionDays.TWO_WEEKS)
  const cloudwatchMetricsEnabled = process.env.CLOUDWATCH_METRICS_ENABLED ?? '1'
  const tracingExporter = process.env.TRACING_EXPORTER ?? 'xray'
  const enableTelemetry = process.env.ENABLE_TELEMETRY
    ? process.env.ENABLE_TELEMETRY !== '0'
    : true
  const image = ContainerImage.fromEcrRepository(options.backendRepository, options.imageTag)
  const useTsxRuntime = options.envName === 'dev' && process.env.ECS_USE_TSX_RUNTIME === '1'
  const resolveCommand = (distEntry: string, tsEntry: string): string[] => {
    if (useTsxRuntime) {
      return ['/app/backend/node_modules/.bin/tsx', `/app/backend/${tsEntry}`]
    }
    return ['node', `backend/dist/${distEntry}`]
  }
  const otelConfigContent = [
    'receivers:',
    '  otlp:',
    '    protocols:',
    '      http:',
    '        endpoint: 0.0.0.0:4318',
    'exporters:',
    '  awsxray:',
    'service:',
    '  pipelines:',
    '    traces:',
    '      receivers: [otlp]',
    '      exporters: [awsxray]',
  ].join('\n')

  const workerHealthCheck: HealthCheck = {
    command: ['CMD-SHELL', 'pgrep -x node || exit 1'],
    interval: Duration.seconds(30),
    timeout: Duration.seconds(5),
    retries: 3,
    startPeriod: Duration.seconds(60),
  }

  const runtimePlatform = {
    // Dev builds are x86_64 by default in CodeBuild; keep dev tasks compatible.
    cpuArchitecture: isDev ? CpuArchitecture.X86_64 : CpuArchitecture.ARM64,
    operatingSystemFamily: OperatingSystemFamily.LINUX,
  }

  const planeBIngestTask = new FargateTaskDefinition(scope, 'PlaneBIngestTask', {
    cpu: 512,
    memoryLimitMiB: 1024,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })

  const planeBDbSecretArn = options.planeBDbSecretArn
  const planeBDbSsmName = options.planeBDbSsmName
  const planeBDbHost = options.planeBDbHost
  const planeBDbPort = options.planeBDbPort
  const planeBDbName = options.planeBDbName
  const planeCDbSecretArn = options.planeCDbSecretArn ?? options.planeBDbSecretArn
  const planeCDbSsmName = options.planeCDbSsmName ?? options.planeBDbSsmName
  const planeCDbHost = options.planeCDbHost ?? options.planeBDbHost
  const planeCDbPort = options.planeCDbPort ?? options.planeBDbPort
  const planeCDbName = options.planeCDbName ?? options.planeBDbName
  const redisSecretArn = options.redisSecretArn
  const redisSecretJsonKey = options.redisSecretJsonKey
  const redisSsmName = options.redisSsmName
  const redisUrl = options.redisUrl
  const proxyResidentialSecretArn = options.proxyResidentialSecretArn
  const proxyResidentialSecretJsonKey = options.proxyResidentialSecretJsonKey
  const proxyResidentialSsmName = options.proxyResidentialSsmName
  const proxyResidentialUrl = options.proxyResidentialUrl
  const proxyDatacenterSecretArn = options.proxyDatacenterSecretArn
  const proxyDatacenterSecretJsonKey = options.proxyDatacenterSecretJsonKey
  const proxyDatacenterSsmName = options.proxyDatacenterSsmName
  const proxyDatacenterUrl = options.proxyDatacenterUrl
  const quoteRefreshQueueUrl = options.quoteRefreshQueueUrl
  const quoteRefreshQueueMode = options.quoteRefreshQueueMode
  const ingestFanoutQueueUrl = options.ingestFanoutQueueUrl
  const goldLiveQueueUrl = options.goldLiveQueueUrl
  const goldLiveQueueMode = options.goldLiveQueueMode
  const notificationsQueueUrl = options.notificationsQueueUrl
  const opsAlertsQueueUrl = options.opsAlertsQueueUrl
  const bronzeBucketName = options.bronzeBucketName
  const bronzePrefix = options.bronzePrefix
  const b2cQueueInSweep = options.b2cQueueInSweep
  const b2cRefreshLoopEnabled = options.b2cRefreshLoopEnabled ?? false
  const planeBB2bTargetMinutes = options.planeBB2bTargetMinutes
  const planeBB2bObservationMode =
    options.planeBB2bObservationMode ?? process.env.PLANE_B_B2B_OBSERVATION_MODE
  const planeBB2bMaxQueueDepth = options.planeBB2bMaxQueueDepth
  const b2cRefreshLimit = isDev ? '25' : '50'
  const b2cRefreshConcurrency = isDev ? '1' : '5'
  const ingestFanoutMode = options.ingestFanoutMode
  const notificationsMode = options.notificationsMode
  const opsAlertsMode = options.opsAlertsMode

  const buildSecrets = (): Record<string, EcsSecret> => {
    const secrets: Record<string, EcsSecret> = {}

    if (planeBDbSecretArn) {
      const secret = Secret.fromSecretCompleteArn(
        scope,
        'PlaneBEcsDatabaseSecret',
        planeBDbSecretArn,
      )
      secrets.PLANE_B_DB_USERNAME = EcsSecret.fromSecretsManager(secret, 'username')
      secrets.PLANE_B_DB_PASSWORD = EcsSecret.fromSecretsManager(secret, 'password')
    } else if (planeBDbSsmName) {
      const parameter = StringParameter.fromStringParameterName(
        scope,
        'PlaneBEcsDatabaseParameter',
        planeBDbSsmName,
      )
      secrets.DATABASE_URL_PLANE_B = EcsSecret.fromSsmParameter(parameter)
    }

    if (redisSecretArn) {
      const secret = Secret.fromSecretCompleteArn(scope, 'PlaneBEcsRedisSecret', redisSecretArn)
      secrets.REDIS_URL = redisSecretJsonKey
        ? EcsSecret.fromSecretsManager(secret, redisSecretJsonKey)
        : EcsSecret.fromSecretsManager(secret)
    } else if (redisSsmName) {
      const parameter = StringParameter.fromStringParameterName(
        scope,
        'PlaneBEcsRedisParameter',
        redisSsmName,
      )
      secrets.REDIS_URL = EcsSecret.fromSsmParameter(parameter)
    }

    if (proxyResidentialSecretArn) {
      const secret = Secret.fromSecretCompleteArn(
        scope,
        'PlaneBEcsProxyResidentialSecret',
        proxyResidentialSecretArn,
      )
      secrets.PROXY_RESIDENTIAL_URL = proxyResidentialSecretJsonKey
        ? EcsSecret.fromSecretsManager(secret, proxyResidentialSecretJsonKey)
        : EcsSecret.fromSecretsManager(secret)
    } else if (proxyResidentialSsmName) {
      const parameter = StringParameter.fromStringParameterName(
        scope,
        'PlaneBEcsProxyResidentialParameter',
        proxyResidentialSsmName,
      )
      secrets.PROXY_RESIDENTIAL_URL = EcsSecret.fromSsmParameter(parameter)
    }

    if (proxyDatacenterSecretArn) {
      const secret = Secret.fromSecretCompleteArn(
        scope,
        'PlaneBEcsProxyDatacenterSecret',
        proxyDatacenterSecretArn,
      )
      secrets.PROXY_DATACENTER_URL = proxyDatacenterSecretJsonKey
        ? EcsSecret.fromSecretsManager(secret, proxyDatacenterSecretJsonKey)
        : EcsSecret.fromSecretsManager(secret)
    } else if (proxyDatacenterSsmName) {
      const parameter = StringParameter.fromStringParameterName(
        scope,
        'PlaneBEcsProxyDatacenterParameter',
        proxyDatacenterSsmName,
      )
      secrets.PROXY_DATACENTER_URL = EcsSecret.fromSsmParameter(parameter)
    }

    return secrets
  }

  const buildGoldLiveSecrets = (): Record<string, EcsSecret> => {
    const secrets: Record<string, EcsSecret> = {}

    if (planeBDbSecretArn) {
      const planeBSecret = Secret.fromSecretCompleteArn(
        scope,
        'GoldLivePlaneBDatabaseSecret',
        planeBDbSecretArn,
      )
      secrets.PLANE_B_DB_USERNAME = EcsSecret.fromSecretsManager(planeBSecret, 'username')
      secrets.PLANE_B_DB_PASSWORD = EcsSecret.fromSecretsManager(planeBSecret, 'password')
    } else if (planeBDbSsmName) {
      const parameter = StringParameter.fromStringParameterName(
        scope,
        'GoldLivePlaneBDatabaseParameter',
        planeBDbSsmName,
      )
      secrets.DATABASE_URL_PLANE_B = EcsSecret.fromSsmParameter(parameter)
    }

    if (planeCDbSecretArn) {
      const planeCSecret = Secret.fromSecretCompleteArn(
        scope,
        'GoldLivePlaneCDatabaseSecret',
        planeCDbSecretArn,
      )
      secrets.PLANE_C_DB_USERNAME = EcsSecret.fromSecretsManager(planeCSecret, 'username')
      secrets.PLANE_C_DB_PASSWORD = EcsSecret.fromSecretsManager(planeCSecret, 'password')
    } else if (planeCDbSsmName) {
      const parameter = StringParameter.fromStringParameterName(
        scope,
        'GoldLivePlaneCDatabaseParameter',
        planeCDbSsmName,
      )
      secrets.DATABASE_URL_PLANE_C = EcsSecret.fromSsmParameter(parameter)
    }

    return secrets
  }

  const sharedSecrets = buildSecrets()
  const secretsConfig =
    Object.keys(sharedSecrets).length > 0 ? { secrets: sharedSecrets } : {}
  const goldLiveSecrets = buildGoldLiveSecrets()
  const goldLiveSecretsConfig =
    Object.keys(goldLiveSecrets).length > 0 ? { secrets: goldLiveSecrets } : {}
  const sharedEnv: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    NODE_OPTIONS: '--require /app/backend/shared/node-polyfills.js',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    TRACING_EXPORTER: tracingExporter,
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  }
  if (!isProd) {
    sharedEnv.QUOTE_REFRESH_DB_FALLBACK = '1'
  }
  if (isDev) {
    sharedEnv.DB_DISABLE_POOL_SIGNAL_CLEANUP = '1'
    sharedEnv.DB_QUERY_TIMEOUT_MS =
      process.env.DB_QUERY_TIMEOUT_MS || '120000'
    sharedEnv.DB_CONNECTION_TIMEOUT_MS =
      process.env.DB_CONNECTION_TIMEOUT_MS || '20000'
    sharedEnv.DB_POOL_MAX =
      process.env.DB_POOL_MAX || '10'
    sharedEnv.DB_POOL_MIN =
      process.env.DB_POOL_MIN || '2'
    sharedEnv.PLANE_B_B2B_CORRIDOR_PROVIDER_BATCH_SIZE =
      process.env.PLANE_B_B2B_CORRIDOR_PROVIDER_BATCH_SIZE || '1'
    sharedEnv.PLANE_B_B2B_RPM_SAFETY_FACTOR =
      process.env.PLANE_B_B2B_RPM_SAFETY_FACTOR || '1'
    sharedEnv.PLANE_B_B2B_RPM_MULTIPLIER =
      process.env.PLANE_B_B2B_RPM_MULTIPLIER || '8'
    sharedEnv.PLANE_B_B2B_CORRIDOR_RPM_MULTIPLIER =
      process.env.PLANE_B_B2B_CORRIDOR_RPM_MULTIPLIER || '8'
    sharedEnv.PLANE_B_B2B_OBSERVATION_TIER2_RPM =
      process.env.PLANE_B_B2B_OBSERVATION_TIER2_RPM || '60'
    sharedEnv.PLANE_B_B2B_OBSERVATION_TIER2_CORRIDOR_RPM =
      process.env.PLANE_B_B2B_OBSERVATION_TIER2_CORRIDOR_RPM || '60'
  }
  if (process.env.DB_DISABLE_STATEMENT_TIMEOUT) {
    sharedEnv.DB_DISABLE_STATEMENT_TIMEOUT = process.env.DB_DISABLE_STATEMENT_TIMEOUT
  }

  if (planeBDbHost) {
    sharedEnv.PLANE_B_DB_HOST = planeBDbHost
  }
  if (planeBDbSecretArn) {
    sharedEnv.PLANE_B_DB_SECRET_ARN = planeBDbSecretArn
  }
  if (planeBDbPort) {
    sharedEnv.PLANE_B_DB_PORT = planeBDbPort
  }
  if (planeBDbName) {
    sharedEnv.PLANE_B_DB_NAME = planeBDbName
  }
  if (planeCDbHost) {
    sharedEnv.PLANE_C_DB_HOST = planeCDbHost
  }
  if (planeCDbSecretArn) {
    sharedEnv.PLANE_C_DB_SECRET_ARN = planeCDbSecretArn
  }
  if (planeCDbPort) {
    sharedEnv.PLANE_C_DB_PORT = planeCDbPort
  }
  if (planeCDbName) {
    sharedEnv.PLANE_C_DB_NAME = planeCDbName
  }
  if (redisUrl && !sharedSecrets.REDIS_URL) {
    sharedEnv.REDIS_URL = redisUrl
  }
  if (ingestFanoutQueueUrl) {
    sharedEnv.PLANE_B_INGEST_FANOUT_QUEUE_URL = ingestFanoutQueueUrl
  }
  if (goldLiveQueueUrl) {
    sharedEnv.GOLD_LIVE_QUEUE_URL = goldLiveQueueUrl
  }
  if (goldLiveQueueMode) {
    sharedEnv.GOLD_LIVE_QUEUE_MODE = goldLiveQueueMode
  }
  if (notificationsQueueUrl) {
    sharedEnv.PLANE_B_NOTIFICATIONS_QUEUE_URL = notificationsQueueUrl
  }
  if (opsAlertsQueueUrl) {
    sharedEnv.PLANE_B_OPS_ALERT_QUEUE_URL = opsAlertsQueueUrl
  }
  if (quoteRefreshQueueUrl) {
    sharedEnv.QUOTE_REFRESH_QUEUE_URL = quoteRefreshQueueUrl
  }
  if (quoteRefreshQueueMode) {
    sharedEnv.QUOTE_REFRESH_QUEUE_MODE = quoteRefreshQueueMode
  }
  if (ingestFanoutMode) {
    sharedEnv.PLANE_B_INGEST_FANOUT_QUEUE_MODE = ingestFanoutMode
  }
  if (options.planeBIngestFanoutMessageMode) {
    sharedEnv.PLANE_B_INGEST_FANOUT_MESSAGE_MODE = options.planeBIngestFanoutMessageMode
  }
  if (notificationsMode) {
    sharedEnv.PLANE_B_NOTIFICATIONS_QUEUE_MODE = notificationsMode
  }
  if (opsAlertsMode) {
    sharedEnv.PLANE_B_OPS_ALERT_QUEUE_MODE = opsAlertsMode
  }
  if (bronzeBucketName) {
    sharedEnv.BRONZE_S3_BUCKET = bronzeBucketName
  }
  if (bronzePrefix) {
    sharedEnv.BRONZE_S3_PREFIX = bronzePrefix
  }
  if (b2cQueueInSweep) {
    sharedEnv.PLANE_B_B2C_QUEUE_IN_SWEEP = b2cQueueInSweep
  }
  if (planeBB2bTargetMinutes) {
    sharedEnv.PLANE_B_B2B_TARGET_MINUTES = planeBB2bTargetMinutes
  }
  if (planeBB2bObservationMode !== undefined) {
    sharedEnv.PLANE_B_B2B_OBSERVATION_MODE = planeBB2bObservationMode
  }
  if (planeBB2bMaxQueueDepth) {
    sharedEnv.PLANE_B_B2B_MAX_QUEUE_DEPTH = planeBB2bMaxQueueDepth
  }
  if (process.env.PLANE_B_B2B_NATIVE_CURRENCY_ONLY) {
    sharedEnv.PLANE_B_B2B_NATIVE_CURRENCY_ONLY = process.env.PLANE_B_B2B_NATIVE_CURRENCY_ONLY
  }
  if (process.env.PLANE_B_B2B_FRESHNESS_SLO_ENABLED) {
    sharedEnv.PLANE_B_B2B_FRESHNESS_SLO_ENABLED = process.env.PLANE_B_B2B_FRESHNESS_SLO_ENABLED
  }
  if (process.env.PLANE_B_B2B_FANOUT_MODE) {
    sharedEnv.PLANE_B_B2B_FANOUT_MODE = process.env.PLANE_B_B2B_FANOUT_MODE
  }
  if (process.env.PLANE_B_B2B_TIER_VERSION) {
    sharedEnv.PLANE_B_B2B_TIER_VERSION = process.env.PLANE_B_B2B_TIER_VERSION
  }
  if (process.env.PLANE_B_B2B_MAX_TARGET_MINUTES) {
    sharedEnv.PLANE_B_B2B_MAX_TARGET_MINUTES = process.env.PLANE_B_B2B_MAX_TARGET_MINUTES
  }
  if (process.env.PLANE_B_B2B_RPM_SAFETY_FACTOR) {
    sharedEnv.PLANE_B_B2B_RPM_SAFETY_FACTOR = process.env.PLANE_B_B2B_RPM_SAFETY_FACTOR
  }
  if (process.env.PLANE_B_B2B_RPM_MULTIPLIER) {
    sharedEnv.PLANE_B_B2B_RPM_MULTIPLIER = process.env.PLANE_B_B2B_RPM_MULTIPLIER
  }
  if (process.env.PLANE_B_B2B_CORRIDOR_RPM_MULTIPLIER) {
    sharedEnv.PLANE_B_B2B_CORRIDOR_RPM_MULTIPLIER =
      process.env.PLANE_B_B2B_CORRIDOR_RPM_MULTIPLIER
  }
  if (process.env.PLANE_B_INGEST_LOOP) {
    sharedEnv.PLANE_B_INGEST_LOOP = process.env.PLANE_B_INGEST_LOOP
  }
  if (process.env.PLANE_B_INGEST_LOOP_INTERVAL_SECONDS) {
    sharedEnv.PLANE_B_INGEST_LOOP_INTERVAL_SECONDS =
      process.env.PLANE_B_INGEST_LOOP_INTERVAL_SECONDS
  }
  if (process.env.PLANE_B_B2B_MAX_CORRIDORS_PER_SHARD) {
    sharedEnv.PLANE_B_B2B_MAX_CORRIDORS_PER_SHARD =
      process.env.PLANE_B_B2B_MAX_CORRIDORS_PER_SHARD
  }
  if (process.env.PLANE_B_B2B_MIN_SHARDS) {
    sharedEnv.PLANE_B_B2B_MIN_SHARDS = process.env.PLANE_B_B2B_MIN_SHARDS
  }
  if (process.env.PLANE_B_B2B_FRESHNESS_CHUNK_SIZE) {
    sharedEnv.PLANE_B_B2B_FRESHNESS_CHUNK_SIZE =
      process.env.PLANE_B_B2B_FRESHNESS_CHUNK_SIZE
  }
  if (proxyResidentialUrl && !sharedSecrets.PROXY_RESIDENTIAL_URL) {
    sharedEnv.PROXY_RESIDENTIAL_URL = proxyResidentialUrl
  }
  if (proxyDatacenterUrl && !sharedSecrets.PROXY_DATACENTER_URL) {
    sharedEnv.PROXY_DATACENTER_URL = proxyDatacenterUrl
  }

  const planeBIngestEnv = { ...sharedEnv }
  if (!planeBIngestEnv.PLANE_B_INGEST_LOOP) {
    planeBIngestEnv.PLANE_B_INGEST_LOOP = '1'
  }
  if (!planeBIngestEnv.PLANE_B_INGEST_LOOP_INTERVAL_SECONDS) {
    planeBIngestEnv.PLANE_B_INGEST_LOOP_INTERVAL_SECONDS = '60'
  }

  const planeBIngestLogGroup = new LogGroup(scope, 'PlaneBIngestLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/plane-b-ingest`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  planeBIngestTask.addContainer('PlaneBIngestContainer', {
    image,
    command: resolveCommand(
      'scripts/aws/plane-b-ingest-ecs.js',
      'scripts/aws/plane-b-ingest-ecs.ts',
    ),
    environment: planeBIngestEnv,
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'plane-b-ingest',
      logGroup: planeBIngestLogGroup,
    }),
    healthCheck: workerHealthCheck,
  })
  if (enableTelemetry) {
    const planeBIngestOtelLogGroup = new LogGroup(scope, 'PlaneBIngestOtelLogGroup', {
      logGroupName: `/remit-scout/${options.envName}/plane-b-ingest-otel`,
      retention: logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })
    planeBIngestTask.addContainer('PlaneBIngestOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:latest',
      ),
      cpu: 32,
      memoryLimitMiB: 256,
      environment: {
        AWS_REGION: Stack.of(scope).region,
        AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
      },
      logging: LogDrivers.awsLogs({
        streamPrefix: 'plane-b-ingest-otel',
        logGroup: planeBIngestOtelLogGroup,
      }),
      portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
    })
  }

  const b2cRefreshTask = new FargateTaskDefinition(scope, 'B2cRefreshWorkerTask', {
    cpu: 256,
    memoryLimitMiB: 512,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })

  const b2cRefreshLogGroup = new LogGroup(scope, 'B2cRefreshLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/b2c-refresh-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  b2cRefreshTask.addContainer('B2cRefreshWorkerContainer', {
    image,
    command: resolveCommand(
      'scripts/aws/b2c-refresh-worker-ecs.js',
      'scripts/aws/b2c-refresh-worker-ecs.ts',
    ),
    environment: {
      ...sharedEnv,
      B2C_REFRESH_LIMIT: b2cRefreshLimit,
      B2C_REFRESH_CONCURRENCY: b2cRefreshConcurrency,
      B2C_REFRESH_HEALTH_ENABLED: '0',
      ...(b2cRefreshLoopEnabled ? { B2C_REFRESH_LOOP: '1' } : {}),
      ...(quoteRefreshQueueUrl ? { QUOTE_REFRESH_QUEUE_URL: quoteRefreshQueueUrl } : {}),
    },
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'b2c-refresh-worker',
      logGroup: b2cRefreshLogGroup,
    }),
    healthCheck: workerHealthCheck,
  })
  if (enableTelemetry) {
    const b2cRefreshOtelLogGroup = new LogGroup(scope, 'B2cRefreshOtelLogGroup', {
      logGroupName: `/remit-scout/${options.envName}/b2c-refresh-worker-otel`,
      retention: logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })
    b2cRefreshTask.addContainer('B2cRefreshOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:latest',
      ),
      cpu: 32,
      memoryLimitMiB: 256,
      environment: {
        AWS_REGION: Stack.of(scope).region,
        AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
      },
      logging: LogDrivers.awsLogs({
        streamPrefix: 'b2c-refresh-worker-otel',
        logGroup: b2cRefreshOtelLogGroup,
      }),
      portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
    })
  }

  const ingestFanoutTask = new FargateTaskDefinition(scope, 'IngestFanoutWorkerTask', {
    cpu: 512,
    memoryLimitMiB: 1024,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })

  const ingestFanoutLogGroup = new LogGroup(scope, 'IngestFanoutLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/ingest-fanout-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const ingestFanoutEnv = { ...sharedEnv }
  if (process.env.INGEST_FANOUT_BATCH_SIZE) {
    ingestFanoutEnv.INGEST_FANOUT_BATCH_SIZE = process.env.INGEST_FANOUT_BATCH_SIZE
  } else if (isDev) {
    ingestFanoutEnv.INGEST_FANOUT_BATCH_SIZE = '10'
  }
  if (process.env.INGEST_FANOUT_CONCURRENCY) {
    ingestFanoutEnv.INGEST_FANOUT_CONCURRENCY = process.env.INGEST_FANOUT_CONCURRENCY
  } else if (isDev) {
    ingestFanoutEnv.INGEST_FANOUT_CONCURRENCY = '10'
  }
  if (process.env.INGEST_FANOUT_PROVIDER_CONCURRENCY) {
    ingestFanoutEnv.INGEST_FANOUT_PROVIDER_CONCURRENCY =
      process.env.INGEST_FANOUT_PROVIDER_CONCURRENCY
  } else if (isDev) {
    ingestFanoutEnv.INGEST_FANOUT_PROVIDER_CONCURRENCY = '8'
  }
  if (process.env.INGEST_FANOUT_IDLE_SLEEP_MS) {
    ingestFanoutEnv.INGEST_FANOUT_IDLE_SLEEP_MS = process.env.INGEST_FANOUT_IDLE_SLEEP_MS
  } else if (isDev) {
    ingestFanoutEnv.INGEST_FANOUT_IDLE_SLEEP_MS = '250'
  }
  if (process.env.INGEST_FANOUT_MAX_ATTEMPTS) {
    ingestFanoutEnv.INGEST_FANOUT_MAX_ATTEMPTS = process.env.INGEST_FANOUT_MAX_ATTEMPTS
  }
  if (process.env.DB_DISABLE_POOL_SIGNAL_CLEANUP) {
    ingestFanoutEnv.DB_DISABLE_POOL_SIGNAL_CLEANUP =
      process.env.DB_DISABLE_POOL_SIGNAL_CLEANUP
  } else if (isDev) {
    ingestFanoutEnv.DB_DISABLE_POOL_SIGNAL_CLEANUP = '1'
  }
  ingestFanoutTask.addContainer('IngestFanoutWorkerContainer', {
    image,
    command: resolveCommand(
      'scripts/aws/ingest-fanout-worker-ecs.js',
      'scripts/aws/ingest-fanout-worker-ecs.ts',
    ),
    environment: ingestFanoutEnv,
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'ingest-fanout-worker',
      logGroup: ingestFanoutLogGroup,
    }),
    healthCheck: workerHealthCheck,
  })
  if (enableTelemetry) {
    const ingestFanoutOtelLogGroup = new LogGroup(scope, 'IngestFanoutOtelLogGroup', {
      logGroupName: `/remit-scout/${options.envName}/ingest-fanout-worker-otel`,
      retention: logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })
    ingestFanoutTask.addContainer('IngestFanoutOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:latest',
      ),
      cpu: 32,
      memoryLimitMiB: 256,
      environment: {
        AWS_REGION: Stack.of(scope).region,
        AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
      },
      logging: LogDrivers.awsLogs({
        streamPrefix: 'ingest-fanout-worker-otel',
        logGroup: ingestFanoutOtelLogGroup,
      }),
      portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
    })
  }

  const goldLiveTask = new FargateTaskDefinition(scope, 'GoldLiveWorkerTask', {
    cpu: 256,
    memoryLimitMiB: 512,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })

  const goldLiveLogGroup = new LogGroup(scope, 'GoldLiveLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/gold-live-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  const goldLiveEnv: Record<string, string> = { ...sharedEnv }
  if (planeBDbHost) {
    goldLiveEnv.PLANE_B_DB_HOST = planeBDbHost
  }
  if (planeBDbSecretArn) {
    goldLiveEnv.PLANE_B_DB_SECRET_ARN = planeBDbSecretArn
  }
  if (planeBDbPort) {
    goldLiveEnv.PLANE_B_DB_PORT = planeBDbPort
  }
  if (planeBDbName) {
    goldLiveEnv.PLANE_B_DB_NAME = planeBDbName
  }
  goldLiveTask.addContainer('GoldLiveWorkerContainer', {
    image,
    command: resolveCommand(
      'scripts/aws/gold-live-worker-ecs.js',
      'scripts/aws/gold-live-worker-ecs.ts',
    ),
    environment: goldLiveEnv,
    ...goldLiveSecretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'gold-live-worker',
      logGroup: goldLiveLogGroup,
    }),
    healthCheck: workerHealthCheck,
  })
  if (enableTelemetry) {
    const goldLiveOtelLogGroup = new LogGroup(scope, 'GoldLiveOtelLogGroup', {
      logGroupName: `/remit-scout/${options.envName}/gold-live-worker-otel`,
      retention: logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })
    goldLiveTask.addContainer('GoldLiveOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:latest',
      ),
      cpu: 32,
      memoryLimitMiB: 256,
      environment: {
        AWS_REGION: Stack.of(scope).region,
        AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
      },
      logging: LogDrivers.awsLogs({
        streamPrefix: 'gold-live-worker-otel',
        logGroup: goldLiveOtelLogGroup,
      }),
      portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
    })
  }

  const notificationsQueueTask = new FargateTaskDefinition(
    scope,
    'NotificationsQueueWorkerTask',
    {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole: options.roles.planeBEcsTaskExecutionRole,
      taskRole: options.roles.planeBEcsTaskRole,
      runtimePlatform,
    },
  )

  const notificationsLogGroup = new LogGroup(scope, 'NotificationsQueueLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/notifications-queue-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  notificationsQueueTask.addContainer('NotificationsQueueWorkerContainer', {
    image,
    command: resolveCommand(
      'scripts/aws/notifications-queue-worker-ecs.js',
      'scripts/aws/notifications-queue-worker-ecs.ts',
    ),
    environment: sharedEnv,
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'notifications-queue-worker',
      logGroup: notificationsLogGroup,
    }),
    healthCheck: workerHealthCheck,
  })
  if (enableTelemetry) {
    const notificationsOtelLogGroup = new LogGroup(
      scope,
      'NotificationsQueueOtelLogGroup',
      {
        logGroupName: `/remit-scout/${options.envName}/notifications-queue-worker-otel`,
        retention: logRetention,
        removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      },
    )
    notificationsQueueTask.addContainer('NotificationsQueueOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:latest',
      ),
      cpu: 32,
      memoryLimitMiB: 256,
      environment: {
        AWS_REGION: Stack.of(scope).region,
        AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
      },
      logging: LogDrivers.awsLogs({
        streamPrefix: 'notifications-queue-worker-otel',
        logGroup: notificationsOtelLogGroup,
      }),
      portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
    })
  }

  const opsAlertsQueueTask = new FargateTaskDefinition(
    scope,
    'OpsAlertsQueueWorkerTask',
    {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole: options.roles.planeBEcsTaskExecutionRole,
      taskRole: options.roles.planeBEcsTaskRole,
      runtimePlatform,
    },
  )

  const opsAlertsLogGroup = new LogGroup(scope, 'OpsAlertsQueueLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/ops-alerts-queue-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  opsAlertsQueueTask.addContainer('OpsAlertsQueueWorkerContainer', {
    image,
    command: resolveCommand(
      'scripts/aws/ops-alerts-queue-worker-ecs.js',
      'scripts/aws/ops-alerts-queue-worker-ecs.ts',
    ),
    environment: sharedEnv,
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'ops-alerts-queue-worker',
      logGroup: opsAlertsLogGroup,
    }),
    healthCheck: workerHealthCheck,
  })
  if (enableTelemetry) {
    const opsAlertsOtelLogGroup = new LogGroup(scope, 'OpsAlertsQueueOtelLogGroup', {
      logGroupName: `/remit-scout/${options.envName}/ops-alerts-queue-worker-otel`,
      retention: logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })
    opsAlertsQueueTask.addContainer('OpsAlertsQueueOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:latest',
      ),
      cpu: 32,
      memoryLimitMiB: 256,
      environment: {
        AWS_REGION: Stack.of(scope).region,
        AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
      },
      logging: LogDrivers.awsLogs({
        streamPrefix: 'ops-alerts-queue-worker-otel',
        logGroup: opsAlertsOtelLogGroup,
      }),
      portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
    })
  }

  return {
    planeBIngestTask,
    b2cRefreshTask,
    ingestFanoutTask,
    goldLiveTask,
    notificationsQueueTask,
    opsAlertsQueueTask,
  }
}
