import { Duration, RemovalPolicy, Stack, Token } from 'aws-cdk-lib'
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
import type { IRepository } from 'aws-cdk-lib/aws-ecr'
import { Secret, type ISecret } from 'aws-cdk-lib/aws-secretsmanager'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import type { Construct } from 'constructs'

import type { IamResources } from './iam'
import { collectOandaThrottleEnv, collectPlaneBProviderThrottleEnv } from './env-utils'
import { resolveTracingEnv } from './newrelic-observability'

export type EcsTaskResources = {
  planeATask: FargateTaskDefinition
  planeCTask: FargateTaskDefinition
  planeBIngestTask: FargateTaskDefinition
  b2cRefreshTask: FargateTaskDefinition
  fxRateRefreshTask: FargateTaskDefinition
  b2bSweepSchedulerTask: FargateTaskDefinition
  ingestFanoutTier1Task: FargateTaskDefinition
  ingestFanoutTier2Task: FargateTaskDefinition
  goldLiveTask: FargateTaskDefinition
  notificationsQueueTask: FargateTaskDefinition
  opsAlertsQueueTask: FargateTaskDefinition
  alertEvaluationTask: FargateTaskDefinition
  exportWorkerTask: FargateTaskDefinition
  agentOrchestratorTask: FargateTaskDefinition
  stressResponderTask: FargateTaskDefinition
  normalizationWorkerTask: FargateTaskDefinition
  dbMigrateTask: FargateTaskDefinition
  discoveryTask?: FargateTaskDefinition
}

export type EcsTaskOptions = {
  envName: string
  minimalMode?: boolean
  backendRepository: IRepository
  imageTag: string
  roles: IamResources
  cpuArchitecture?: CpuArchitecture
  sharedSecretArn?: string
  planeAJwtSecretJsonKey?: string
  planeBDbSecretArn?: string
  // Optional: privileged DB secret for migrations only. Do not share this with runtime workers.
  planeBDbMigratorSecretArn?: string
  planeBDbSsmName?: string
  planeBDbHost?: string
  planeBDbPort?: string
  planeBDbName?: string
  quoteRefreshDlqUrl?: string
  fxRateRefreshDlqUrl?: string
  planeADbSecretArn?: string
  planeADbSsmName?: string
  planeADbHost?: string
  planeADbPort?: string
  planeADbName?: string
  alertEvaluationQueueUrl?: string
  exportJobQueueUrl?: string
  exportJobQueueMode?: string
  exportsBucketName?: string
  exportsPrefix?: string
  supabaseSecretArn?: string
  supabaseSsmName?: string
  stripeSecretArn?: string
  stripeSsmName?: string
  communicationsSecretArn?: string
  planeCDbSecretArn?: string
  planeCDbSsmName?: string
  planeCDbHost?: string
  planeCDbPort?: string
  planeCDbName?: string
  redisSecretArn?: string
  redisSecretJsonKey?: string
  redisSsmName?: string
  redisUrl?: string
  alertsSlackWebhookUrl?: string
  proxyResidentialSecretArn?: string
  proxyResidentialSecretJsonKey?: string
  proxyResidentialSsmName?: string
  proxyResidentialUrl?: string
  proxyDatacenterSecretArn?: string
  proxyDatacenterSecretJsonKey?: string
  proxyDatacenterSsmName?: string
  proxyDatacenterUrl?: string
  sentrySecretArn?: string
  sentrySecretJsonKey?: string
  quoteRefreshQueueUrl?: string
  quoteRefreshQueueMode?: string
  fxRateRefreshQueueUrl?: string
  fxRateRefreshQueueMode?: string
  ingestFanoutQueueTier1Url?: string
  ingestFanoutQueueTier2Url?: string
  goldLiveQueueUrl?: string
  goldLiveQueueMode?: string
  notificationsQueueUrl?: string
  opsAlertsQueueUrl?: string
  agentFailureQueueUrl?: string
  agentStressQueueUrl?: string
  toolRequestQueueUrl?: string
  normalizationQueueUrl?: string
  agentFailureQueueMode?: string
  agentStressQueueMode?: string
  toolRequestQueueMode?: string
  normalizationQueueMode?: string
  agentLlmConnector?: 'anthropic' | 'bedrock'
  agentLlmModel?: string
  agentLlmMaxTokens?: string
  agentLlmTemperature?: string
  agentLlmPromptVersion?: string
  agentTelemetryDims?: string
  agentAnthropicApiKeySecretArn?: string
  agentBedrockRegion?: string
  agentBedrockModelId?: string
  agentBedrockMaxTokens?: string
  agentBedrockSecretArn?: string
  newRelicIngestKeySecretArn?: string
  newRelicIngestKeySecretJsonKey?: string
  bronzeBucketName?: string
  bronzePrefix?: string
  b2cQueueInSweep?: string
  b2cRefreshLoopEnabled?: boolean
  fxRateRefreshLoopEnabled?: boolean
  planeBB2bTargetMinutes?: string
  planeBB2bObservationMode?: string
  planeBB2bMaxQueueDepth?: string
  planeBIngestFanoutMessageMode?: string
  planeBDisableTier1?: string
  ingestFanoutMode?: string
  notificationsMode?: string
  opsAlertsMode?: string
  planeBDbPoolMax?: string
  planeBDbPoolMin?: string
  goldIndicesMinProviders?: string
  discoveryRepository?: IRepository
  discoveryImageTag?: string
}

export const createEcsTasks = (
  scope: Construct,
  options: EcsTaskOptions,
): EcsTaskResources => {
  const completeSecretArnPattern =
    /^arn:aws[a-zA-Z-]*:secretsmanager:[^:]+:\d{12}:secret:[^:]+-[A-Za-z0-9]{6}$/
  const importSecretByRef = (id: string, secretRef: string): ISecret => {
    const normalizedRef = secretRef.trim()
    if (Token.isUnresolved(normalizedRef)) {
      return Secret.fromSecretCompleteArn(scope, id, normalizedRef)
    }
    if (normalizedRef.startsWith('arn:')) {
      return completeSecretArnPattern.test(normalizedRef)
        ? Secret.fromSecretCompleteArn(scope, id, normalizedRef)
        : Secret.fromSecretPartialArn(scope, id, normalizedRef)
    }
    return Secret.fromSecretNameV2(scope, id, normalizedRef)
  }

  const isProd = options.envName === 'prod'
  const isDev = options.envName === 'dev'
  const isStaging = options.envName === 'staging'
  const isConservativeWorkerDefaults = isDev || isStaging
  const minimalMode = options.minimalMode === true
  // Prod stays at 90 days for SOC 2 compliance (DPA mandates 90-day API access logs).
  // Non-prod reduced to 1 day — New Relic retains full log history.
  const appLogRetentionDays = process.env.APP_LOG_RETENTION_DAYS
    ? parseInt(process.env.APP_LOG_RETENTION_DAYS, 10)
    : (isProd ? 90 : 1)
  const logRetention = appLogRetentionDays
  const cloudwatchMetricsEnabled = process.env.CLOUDWATCH_METRICS_ENABLED ?? (isProd ? '1' : '0')
  const tracingEnv = resolveTracingEnv({
    envName: options.envName,
    defaultExporter: 'xray',
    defaultEndpoint: 'http://127.0.0.1:4318/v1/traces',
    preferDefaultEndpoint: true,
  })
  if (
    isStaging
    && !process.env.OTEL_TRACES_SAMPLER
    && !process.env.OTEL_TRACES_SAMPLER_ARG
  ) {
    tracingEnv.OTEL_TRACES_SAMPLER = 'traceidratio'
    tracingEnv.OTEL_TRACES_SAMPLER_ARG = '0.01'
  }
  const tracingExporter = tracingEnv.TRACING_EXPORTER ?? 'xray'
  const newRelicLogsEnabled =
    process.env.NEW_RELIC_LOGS_ENABLED ?? (isProd ? '1' : '0')
  const enableTelemetry = process.env.ENABLE_TELEMETRY === '1'
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
    command: [
      'CMD-SHELL',
      'node -e "require(\'http\').get(\'http://127.0.0.1:8080/healthz\', r=>process.exit(r.statusCode===200?0:1)).on(\'error\',()=>process.exit(1))"',
    ],
    interval: Duration.seconds(30),
    timeout: Duration.seconds(5),
    retries: 3,
    startPeriod: Duration.seconds(120),
  }

  const cpuArchitecture = options.cpuArchitecture ?? CpuArchitecture.ARM64
  const runtimePlatform = {
    cpuArchitecture,
    operatingSystemFamily: OperatingSystemFamily.LINUX,
  }

  // Read-only root filesystems require a writable tmp directory.
  // For Fargate, an unnamed/empty volume is the portable option.
  const tmpMountPoint = { sourceVolume: 'tmp', containerPath: '/tmp', readOnly: false }
  const addTmpVolume = (task: FargateTaskDefinition): void => {
    task.addVolume({ name: 'tmp' })
  }

  const planeBIngestCpu = isDev ? 256 : 512
  const planeBIngestMemory = isDev ? 512 : 1024
  const ingestFanoutCpu = isDev ? 256 : 512
  const ingestFanoutMemory = isDev ? 512 : 1024
  const defaultLoopJitterMs = isDev ? '250' : '0'
  const defaultMessageJitterMs = isDev ? '250' : '0'

  const planeBIngestTask = new FargateTaskDefinition(scope, 'PlaneBIngestTask', {
    cpu: planeBIngestCpu,
    memoryLimitMiB: planeBIngestMemory,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })
  addTmpVolume(planeBIngestTask)

  const planeBDbSecretArn = options.planeBDbSecretArn
  const planeBDbMigratorSecretArn = options.planeBDbMigratorSecretArn
  const planeBDbSsmName = options.planeBDbSsmName
  const planeBDbHost = options.planeBDbHost
  const planeBDbPort = options.planeBDbPort
  const planeBDbName = options.planeBDbName
  const planeCDbSecretArn = options.planeCDbSecretArn ?? options.planeBDbSecretArn
  const planeCDbSsmName = options.planeCDbSsmName ?? options.planeBDbSsmName
  const planeCDbHost = options.planeCDbHost ?? options.planeBDbHost
  const planeCDbPort = options.planeCDbPort ?? options.planeBDbPort
  const planeCDbName = options.planeCDbName ?? options.planeBDbName
  const sharedSecretArn = options.sharedSecretArn
  const planeAJwtSecretJsonKey = options.planeAJwtSecretJsonKey
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
  const sentrySecretArn = options.sentrySecretArn
  const sentrySecretJsonKey = options.sentrySecretJsonKey
  const supabaseSecretArn = options.supabaseSecretArn
  const supabaseSsmName = options.supabaseSsmName
  const stripeSecretArn = options.stripeSecretArn
  const stripeSsmName = options.stripeSsmName
  const communicationsSecretArn = options.communicationsSecretArn
  const quoteRefreshQueueUrl = options.quoteRefreshQueueUrl
  const quoteRefreshDlqUrl = options.quoteRefreshDlqUrl
  const quoteRefreshQueueMode = options.quoteRefreshQueueMode
  const fxRateRefreshQueueUrl = options.fxRateRefreshQueueUrl
  const fxRateRefreshDlqUrl = options.fxRateRefreshDlqUrl
  const fxRateRefreshQueueMode = options.fxRateRefreshQueueMode
  const ingestFanoutQueueTier1Url = options.ingestFanoutQueueTier1Url
  const ingestFanoutQueueTier2Url = options.ingestFanoutQueueTier2Url
  const goldLiveQueueUrl = options.goldLiveQueueUrl
  const goldLiveQueueMode = options.goldLiveQueueMode
  const notificationsQueueUrl = options.notificationsQueueUrl
  const opsAlertsQueueUrl = options.opsAlertsQueueUrl
  const bronzeBucketName = options.bronzeBucketName
  const bronzePrefix = options.bronzePrefix
  const b2cQueueInSweep = options.b2cQueueInSweep
  // Queue-mode workers are deployed as ECS services and must keep running.
  const b2cRefreshLoopEnabled =
    options.quoteRefreshQueueMode === 'queue' || options.b2cRefreshLoopEnabled === true
  const fxRateRefreshLoopEnabled =
    options.fxRateRefreshQueueMode === 'queue' || options.fxRateRefreshLoopEnabled === true
  const planeBB2bTargetMinutes = options.planeBB2bTargetMinutes
  const planeBB2bObservationMode =
    options.planeBB2bObservationMode ?? process.env.PLANE_B_B2B_OBSERVATION_MODE
  const planeBB2bMaxQueueDepth = options.planeBB2bMaxQueueDepth
  const goldIndicesMinProviders = options.goldIndicesMinProviders
  const capabilityProbeProxyTier = process.env.CAPABILITY_PROBE_PROXY_TIER?.trim()
  const b2cRefreshLimit = isConservativeWorkerDefaults ? '25' : '50'
  const b2cRefreshConcurrency = isConservativeWorkerDefaults ? '1' : '5'
  const ingestFanoutMode = options.ingestFanoutMode
  const notificationsMode = options.notificationsMode
  const opsAlertsMode = options.opsAlertsMode
  const agentFailureQueueMode = options.agentFailureQueueMode
  const agentStressQueueMode = options.agentStressQueueMode
  const toolRequestQueueMode = options.toolRequestQueueMode
  const normalizationQueueMode = options.normalizationQueueMode
  const agentLlmConnector = options.agentLlmConnector
    ?? ((isProd || isStaging) ? 'bedrock' : 'anthropic')
  const agentLlmModel = options.agentLlmModel
    ?? process.env.AGENT_LLM_MODEL
    ?? process.env.AGENT_BEDROCK_MODEL_ID
    ?? (agentLlmConnector === 'bedrock'
      ? 'anthropic.claude-sonnet-4-20250514-v1:0'
      : 'claude-sonnet-4-20250514')
  const agentLlmMaxTokens = options.agentLlmMaxTokens ?? process.env.AGENT_LLM_MAX_TOKENS ?? '2048'
  const agentLlmTemperature = options.agentLlmTemperature ?? process.env.AGENT_LLM_TEMPERATURE ?? '0.2'
  const agentLlmPromptVersion = options.agentLlmPromptVersion ?? process.env.AGENT_LLM_PROMPT_VERSION ?? 'v1'
  const agentTelemetryDims = options.agentTelemetryDims ?? process.env.AGENT_TELEMETRY_DIMS
  const agentAnthropicApiKeySecretArn = options.agentAnthropicApiKeySecretArn
  const agentBedrockRegion = options.agentBedrockRegion ?? process.env.AGENT_BEDROCK_REGION
  const agentBedrockModelId = options.agentBedrockModelId ?? process.env.AGENT_BEDROCK_MODEL_ID
  const agentBedrockMaxTokens = options.agentBedrockMaxTokens ?? process.env.AGENT_BEDROCK_MAX_TOKENS
  const agentBedrockSecretArn = options.agentBedrockSecretArn
  const newRelicIngestKeySecretArn = options.newRelicIngestKeySecretArn
  const newRelicIngestKeySecretJsonKey = options.newRelicIngestKeySecretJsonKey

  const buildSecrets = (): Record<string, EcsSecret> => {
    const secrets: Record<string, EcsSecret> = {}

    // Prefer injecting full DB URLs via SSM when available. This avoids runtime URL construction
    // and prevents early `config` evaluation from freezing missing DB settings.
    if (planeBDbSsmName) {
      const parameter = StringParameter.fromStringParameterName(
        scope,
        'PlaneBEcsDatabaseParameter',
        planeBDbSsmName,
      )
      secrets.DATABASE_URL_PLANE_B = EcsSecret.fromSsmParameter(parameter)
    } else if (planeBDbSecretArn) {
      const secret = importSecretByRef(
        'PlaneBEcsDatabaseSecret',
        planeBDbSecretArn,
      )
      secrets.PLANE_B_DB_USERNAME = EcsSecret.fromSecretsManager(secret, 'username')
      secrets.PLANE_B_DB_PASSWORD = EcsSecret.fromSecretsManager(secret, 'password')
    }

    if (redisSecretArn) {
      const secret = importSecretByRef('PlaneBEcsRedisSecret', redisSecretArn)
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
      const secret = importSecretByRef('PlaneBEcsProxyResidentialSecret', proxyResidentialSecretArn)
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
      const secret = importSecretByRef('PlaneBEcsProxyDatacenterSecret', proxyDatacenterSecretArn)
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

    if (sentrySecretArn) {
      const secret = importSecretByRef('PlaneBEcsSentrySecret', sentrySecretArn)
      secrets.SENTRY_DSN = sentrySecretJsonKey
        ? EcsSecret.fromSecretsManager(secret, sentrySecretJsonKey)
        : EcsSecret.fromSecretsManager(secret)
    }

    if (sharedSecretArn) {
      const secret = importSecretByRef('PlaneBEcsSharedSecret', sharedSecretArn)
      secrets.PLANE_A_JWT_SECRET = EcsSecret.fromSecretsManager(
        secret,
        planeAJwtSecretJsonKey || 'PLANE_A_JWT_SECRET',
      )
    }

    if (agentAnthropicApiKeySecretArn) {
      const secret = importSecretByRef(
        'PlaneBAgentAnthropicApiKeySecret',
        agentAnthropicApiKeySecretArn,
      )
      secrets.AGENT_ANTHROPIC_API_KEY = EcsSecret.fromSecretsManager(secret, 'apiKey')
    }

    if (agentBedrockSecretArn) {
      const secret = importSecretByRef('PlaneBAgentBedrockSecret', agentBedrockSecretArn)
      if (!agentBedrockRegion) {
        secrets.AGENT_BEDROCK_REGION = EcsSecret.fromSecretsManager(secret, 'region')
      }
      if (!agentBedrockModelId) {
        secrets.AGENT_BEDROCK_MODEL_ID = EcsSecret.fromSecretsManager(secret, 'modelId')
      }
    }

    if (newRelicIngestKeySecretArn) {
      const secret = importSecretByRef('PlaneBNewRelicIngestKeySecret', newRelicIngestKeySecretArn)
      secrets.NEW_RELIC_INGEST_KEY = newRelicIngestKeySecretJsonKey
        ? EcsSecret.fromSecretsManager(secret, newRelicIngestKeySecretJsonKey)
        : EcsSecret.fromSecretsManager(secret)
    }

    return secrets
  }

  const buildGoldLiveSecrets = (): Record<string, EcsSecret> => {
    const secrets: Record<string, EcsSecret> = {}

    if (planeBDbSsmName) {
      const parameter = StringParameter.fromStringParameterName(
        scope,
        'GoldLivePlaneBDatabaseParameter',
        planeBDbSsmName,
      )
      secrets.DATABASE_URL_PLANE_B = EcsSecret.fromSsmParameter(parameter)
    } else if (planeBDbSecretArn) {
      const planeBSecret = importSecretByRef('GoldLivePlaneBDatabaseSecret', planeBDbSecretArn)
      secrets.PLANE_B_DB_USERNAME = EcsSecret.fromSecretsManager(planeBSecret, 'username')
      secrets.PLANE_B_DB_PASSWORD = EcsSecret.fromSecretsManager(planeBSecret, 'password')
    }

    if (planeCDbSecretArn) {
      const planeCSecret = importSecretByRef('GoldLivePlaneCDatabaseSecret', planeCDbSecretArn)
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

    if (sentrySecretArn) {
      const secret = importSecretByRef('GoldLiveSentrySecret', sentrySecretArn)
      secrets.SENTRY_DSN = sentrySecretJsonKey
        ? EcsSecret.fromSecretsManager(secret, sentrySecretJsonKey)
        : EcsSecret.fromSecretsManager(secret)
    }

    if (sharedSecretArn) {
      const secret = importSecretByRef('GoldLiveSharedSecret', sharedSecretArn)
      secrets.PLANE_A_JWT_SECRET = EcsSecret.fromSecretsManager(
        secret,
        planeAJwtSecretJsonKey || 'PLANE_A_JWT_SECRET',
      )
    }

    return secrets
  }

  const sharedSecrets = buildSecrets()
  const runtimeTracingEnv = { ...tracingEnv }
  if (sharedSecrets.NEW_RELIC_INGEST_KEY) {
    delete runtimeTracingEnv.NEW_RELIC_INGEST_KEY
    const buildTimeNewRelicHeader = process.env.NEW_RELIC_INGEST_KEY?.trim()
      ? `api-key=${process.env.NEW_RELIC_INGEST_KEY.trim()}`
      : ''
    if (
      buildTimeNewRelicHeader
      && runtimeTracingEnv.OTEL_EXPORTER_OTLP_HEADERS === buildTimeNewRelicHeader
    ) {
      delete runtimeTracingEnv.OTEL_EXPORTER_OTLP_HEADERS
    }
  }
  const secretsConfig =
    Object.keys(sharedSecrets).length > 0 ? { secrets: sharedSecrets } : {}
  const goldLiveSecrets = buildGoldLiveSecrets()
  const goldLiveSecretsConfig =
    Object.keys(goldLiveSecrets).length > 0 ? { secrets: goldLiveSecrets } : {}
  const planeBDbRoute =
    planeBDbHost && (planeBDbHost.includes('.proxy-') || planeBDbHost.includes('proxy-'))
      ? 'proxy'
      : 'direct'
  const sharedEnv: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    STRICT_CONFIG: '1',
    ALLOW_DB_FALLBACK: '0',
    NODE_OPTIONS: '--require /app/backend/shared/node-polyfills.js',
    PGSSLMODE: isProd ? 'verify-full' : 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '0',
    DB_CONNECTION_ROUTE: planeBDbRoute,
    DB_STATEMENT_TIMEOUT_POLICY:
      planeBDbRoute === 'proxy' ? 'proxy-guarded' : 'server-statement-timeout',
    ...runtimeTracingEnv,
    TRACING_EXPORTER: tracingExporter,
    NEW_RELIC_REGION: process.env.NEW_RELIC_REGION ?? 'US',
    NEW_RELIC_LOGS_ENABLED: newRelicLogsEnabled,
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: isProd ? '1' : '0',
    AGENT_LLM_CONNECTOR: agentLlmConnector,
    AGENT_LLM_PROVIDER: agentLlmConnector,
    AGENT_LLM_MODEL: agentLlmModel,
    AGENT_LLM_MAX_TOKENS: agentLlmMaxTokens,
    AGENT_LLM_TEMPERATURE: agentLlmTemperature,
    AGENT_LLM_PROMPT_VERSION: agentLlmPromptVersion,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  }
  Object.assign(sharedEnv, collectOandaThrottleEnv(), collectPlaneBProviderThrottleEnv())
  const planeBDbPoolMax = options.planeBDbPoolMax ?? '2'
  const planeBDbPoolMin = options.planeBDbPoolMin ?? '0'
  if (!isProd) {
    sharedEnv.QUOTE_REFRESH_DB_FALLBACK = '1'
  }
  if (options.planeBDisableTier1) {
    sharedEnv.PLANE_B_DISABLE_TIER1 = options.planeBDisableTier1
  }
  if (isDev) {
    sharedEnv.DB_DISABLE_POOL_SIGNAL_CLEANUP = '1'
    sharedEnv.DB_QUERY_TIMEOUT_MS =
      process.env.DB_QUERY_TIMEOUT_MS || '120000'
    sharedEnv.DB_CONNECTION_TIMEOUT_MS =
      process.env.DB_CONNECTION_TIMEOUT_MS || '20000'
    sharedEnv.PLANE_B_B2B_CORRIDOR_PROVIDER_BATCH_SIZE =
      process.env.PLANE_B_B2B_CORRIDOR_PROVIDER_BATCH_SIZE || '1'
    sharedEnv.PLANE_B_B2B_RPM_SAFETY_FACTOR =
      process.env.PLANE_B_B2B_RPM_SAFETY_FACTOR || '1'
    sharedEnv.PLANE_B_B2B_RPM_MULTIPLIER =
      process.env.PLANE_B_B2B_RPM_MULTIPLIER || '2'
    sharedEnv.PLANE_B_B2B_CORRIDOR_RPM_MULTIPLIER =
      process.env.PLANE_B_B2B_CORRIDOR_RPM_MULTIPLIER || '2'
    sharedEnv.PLANE_B_B2B_OBSERVATION_TIER2_RPM =
      process.env.PLANE_B_B2B_OBSERVATION_TIER2_RPM || '60'
    sharedEnv.PLANE_B_B2B_OBSERVATION_TIER2_CORRIDOR_RPM =
      process.env.PLANE_B_B2B_OBSERVATION_TIER2_CORRIDOR_RPM || '60'
    sharedEnv.PLANE_B_B2B_MAX_QUEUE_AGE_SECONDS_TIER1 =
      process.env.PLANE_B_B2B_MAX_QUEUE_AGE_SECONDS_TIER1 || '900'
    sharedEnv.PLANE_B_B2B_MAX_QUEUE_AGE_SECONDS_TIER2 =
      process.env.PLANE_B_B2B_MAX_QUEUE_AGE_SECONDS_TIER2 || '21600'
    sharedEnv.SLO_FRESHNESS_P95_TIER2_THRESHOLD =
      process.env.SLO_FRESHNESS_P95_TIER2_THRESHOLD || '21600'
  }
  if (isStaging) {
    sharedEnv.PLANE_B_B2B_MAX_QUEUE_AGE_SECONDS_TIER1 =
      process.env.PLANE_B_B2B_MAX_QUEUE_AGE_SECONDS_TIER1 || '900'
    sharedEnv.PLANE_B_B2B_MAX_QUEUE_AGE_SECONDS_TIER2 =
      process.env.PLANE_B_B2B_MAX_QUEUE_AGE_SECONDS_TIER2 || '10800'
    sharedEnv.SLO_FRESHNESS_P95_TIER2_THRESHOLD =
      process.env.SLO_FRESHNESS_P95_TIER2_THRESHOLD || '10800'
  }
  if (!sharedEnv.DB_POOL_MAX) {
    sharedEnv.DB_POOL_MAX = planeBDbPoolMax
  }
  if (!sharedEnv.DB_POOL_MIN) {
    sharedEnv.DB_POOL_MIN = planeBDbPoolMin
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
  if (planeCDbSsmName) {
    sharedEnv.PLANE_C_DB_SSM_NAME = planeCDbSsmName
  }
  if (planeCDbPort) {
    sharedEnv.PLANE_C_DB_PORT = planeCDbPort
  }
  if (planeCDbName) {
    sharedEnv.PLANE_C_DB_NAME = planeCDbName
  }
  if (sharedSecretArn) {
    sharedEnv.SHARED_SECRET_ARN = sharedSecretArn
  }
  if (process.env.PLANE_C_INTERNAL_API_TOKEN_SECRET_JSON_KEY) {
    sharedEnv.PLANE_C_INTERNAL_API_TOKEN_SECRET_JSON_KEY =
      process.env.PLANE_C_INTERNAL_API_TOKEN_SECRET_JSON_KEY
  }
  if (redisSecretArn) {
    sharedEnv.REDIS_SECRET_ARN = redisSecretArn
  }
  if (redisSecretJsonKey) {
    sharedEnv.REDIS_SECRET_JSON_KEY = redisSecretJsonKey
  }
  if (redisSsmName) {
    sharedEnv.REDIS_SSM_NAME = redisSsmName
  }
  if (redisUrl && !sharedSecrets.REDIS_URL) {
    sharedEnv.REDIS_URL = redisUrl
  }
  if (ingestFanoutQueueTier1Url) {
    sharedEnv.PLANE_B_INGEST_FANOUT_QUEUE_URL = ingestFanoutQueueTier1Url
    sharedEnv.PLANE_B_INGEST_FANOUT_TIER1_QUEUE_URL = ingestFanoutQueueTier1Url
  }
  if (ingestFanoutQueueTier2Url) {
    sharedEnv.PLANE_B_INGEST_FANOUT_TIER2_QUEUE_URL = ingestFanoutQueueTier2Url
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
  if (quoteRefreshDlqUrl) {
    sharedEnv.QUOTE_REFRESH_DLQ_URL = quoteRefreshDlqUrl
  }
  if (quoteRefreshQueueMode) {
    sharedEnv.QUOTE_REFRESH_QUEUE_MODE = quoteRefreshQueueMode
  }
  if (fxRateRefreshQueueUrl) {
    sharedEnv.FX_RATE_REFRESH_QUEUE_URL = fxRateRefreshQueueUrl
  }
  if (fxRateRefreshDlqUrl) {
    sharedEnv.FX_RATE_REFRESH_DLQ_URL = fxRateRefreshDlqUrl
  }
  if (fxRateRefreshQueueMode) {
    sharedEnv.FX_RATE_REFRESH_QUEUE_MODE = fxRateRefreshQueueMode
  }
  if (options.exportJobQueueUrl) {
    sharedEnv.EXPORT_JOB_QUEUE_URL = options.exportJobQueueUrl
  }
  if (options.exportJobQueueMode) {
    sharedEnv.EXPORT_JOB_QUEUE_MODE = options.exportJobQueueMode
  }
  if (options.alertEvaluationQueueUrl) {
    sharedEnv.ALERT_EVALUATION_QUEUE_URL = options.alertEvaluationQueueUrl
  }
  if (options.agentFailureQueueUrl) {
    sharedEnv.AGENT_FAILURE_QUEUE_URL = options.agentFailureQueueUrl
  }
  if (agentFailureQueueMode) {
    sharedEnv.AGENT_FAILURE_QUEUE_MODE = agentFailureQueueMode
  }
  if (options.agentStressQueueUrl) {
    sharedEnv.AGENT_STRESS_QUEUE_URL = options.agentStressQueueUrl
  }
  if (agentStressQueueMode) {
    sharedEnv.AGENT_STRESS_QUEUE_MODE = agentStressQueueMode
  }
  if (options.toolRequestQueueUrl) {
    sharedEnv.TOOL_REQUEST_QUEUE_URL = options.toolRequestQueueUrl
  }
  if (toolRequestQueueMode) {
    sharedEnv.TOOL_REQUEST_QUEUE_MODE = toolRequestQueueMode
  }
  if (agentAnthropicApiKeySecretArn) {
    sharedEnv.AGENT_ANTHROPIC_API_KEY_SECRET_ARN = agentAnthropicApiKeySecretArn
  }
  if (agentBedrockSecretArn) {
    sharedEnv.AGENT_BEDROCK_SECRET_ARN = agentBedrockSecretArn
  }
  if (agentBedrockRegion && !sharedSecrets.AGENT_BEDROCK_REGION) {
    sharedEnv.AGENT_BEDROCK_REGION = agentBedrockRegion
  }
  if (agentBedrockModelId && !sharedSecrets.AGENT_BEDROCK_MODEL_ID) {
    sharedEnv.AGENT_BEDROCK_MODEL_ID = agentBedrockModelId
  }
  if (agentBedrockMaxTokens) {
    sharedEnv.AGENT_BEDROCK_MAX_TOKENS = agentBedrockMaxTokens
  }
  if (agentTelemetryDims) {
    sharedEnv.AGENT_TELEMETRY_DIMS = agentTelemetryDims
  }
  if (options.normalizationQueueUrl) {
    sharedEnv.NORMALIZATION_QUEUE_URL = options.normalizationQueueUrl
  }
  if (normalizationQueueMode) {
    sharedEnv.NORMALIZATION_QUEUE_MODE = normalizationQueueMode
  }
  if (options.exportsBucketName) {
    sharedEnv.EXPORTS_S3_BUCKET = options.exportsBucketName
  }
  if (options.exportsPrefix) {
    sharedEnv.EXPORTS_S3_PREFIX = options.exportsPrefix
  }
  if (options.alertsSlackWebhookUrl) {
    sharedEnv.ALERT_SLACK_WEBHOOK_URL = options.alertsSlackWebhookUrl
  } else if (process.env.ALERT_SLACK_WEBHOOK_URL) {
    sharedEnv.ALERT_SLACK_WEBHOOK_URL = process.env.ALERT_SLACK_WEBHOOK_URL
  } else if (process.env.SLACK_WEBHOOK_URL) {
    sharedEnv.ALERT_SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
  }
  const hydrateAlertWorkerEnv = (target: Record<string, string>): void => {
    if (!target.ALERT_EVALUATION_QUEUE_URL && options.alertEvaluationQueueUrl) {
      target.ALERT_EVALUATION_QUEUE_URL = options.alertEvaluationQueueUrl
    }
    if (!target.EXPORT_JOB_QUEUE_URL && options.exportJobQueueUrl) {
      target.EXPORT_JOB_QUEUE_URL = options.exportJobQueueUrl
    }
    if (!target.EXPORTS_S3_BUCKET && options.exportsBucketName) {
      target.EXPORTS_S3_BUCKET = options.exportsBucketName
    }
    if (!target.ALERT_SLACK_WEBHOOK_URL) {
      if (options.alertsSlackWebhookUrl) {
        target.ALERT_SLACK_WEBHOOK_URL = options.alertsSlackWebhookUrl
      } else if (process.env.ALERT_SLACK_WEBHOOK_URL) {
        target.ALERT_SLACK_WEBHOOK_URL = process.env.ALERT_SLACK_WEBHOOK_URL
      } else if (process.env.SLACK_WEBHOOK_URL) {
        target.ALERT_SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
      }
    }
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
  const queueStalenessEnvKeys = [
    'QUEUE_STALENESS_ENFORCEMENT_ENABLED',
    'STALE_WINDOW_GOLD_LIVE_MS',
    'STALE_WINDOW_FX_RATE_REFRESH_MS',
    'STALE_WINDOW_INGEST_FANOUT_T1_MS',
    'STALE_WINDOW_INGEST_FANOUT_T2_MS',
    'STALE_WINDOW_QUOTE_REFRESH_MS',
    'STALE_RESUME_GRACE_MS',
  ] as const
  for (const key of queueStalenessEnvKeys) {
    const value = process.env[key]
    if (value !== undefined && value !== '') {
      sharedEnv[key] = value
    }
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
    sharedEnv.PLANE_B_B2B_TARGET_MINUTES = String(planeBB2bTargetMinutes)
  }
  if (planeBB2bObservationMode !== undefined) {
    sharedEnv.PLANE_B_B2B_OBSERVATION_MODE = String(planeBB2bObservationMode)
  }
  if (planeBB2bMaxQueueDepth) {
    sharedEnv.PLANE_B_B2B_MAX_QUEUE_DEPTH = String(planeBB2bMaxQueueDepth)
  }
  if (goldIndicesMinProviders) {
    sharedEnv.GOLD_INDICES_MIN_PROVIDERS = String(goldIndicesMinProviders)
  }
  if (capabilityProbeProxyTier) {
    sharedEnv.CAPABILITY_PROBE_PROXY_TIER = capabilityProbeProxyTier
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
  planeBIngestEnv.DB_APPLICATION_NAME = `rs-${options.envName}:plane-b-ingest`
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
  const planeBIngestContainer = planeBIngestTask.addContainer('PlaneBIngestContainer', {
    image,
    readonlyRootFilesystem: true,
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
    stopTimeout: Duration.seconds(45),
  })
  planeBIngestContainer.addMountPoints(tmpMountPoint)
  if (enableTelemetry) {
    const planeBIngestOtelLogGroup = new LogGroup(scope, 'PlaneBIngestOtelLogGroup', {
      logGroupName: `/remit-scout/${options.envName}/plane-b-ingest-otel`,
      retention: logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })
    const planeBIngestOtelCollector = planeBIngestTask.addContainer('PlaneBIngestOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:v0.40.0',
      ),
      readonlyRootFilesystem: true,
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
    planeBIngestOtelCollector.addMountPoints(tmpMountPoint)
  }

  const b2bSweepSchedulerTask = new FargateTaskDefinition(scope, 'B2bSweepSchedulerTask', {
    cpu: 256,
    memoryLimitMiB: 512,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })
  addTmpVolume(b2bSweepSchedulerTask)

  const b2bSweepSchedulerLogGroup = new LogGroup(scope, 'B2bSweepSchedulerLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/b2b-sweep-scheduler`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const b2bSweepSchedulerContainer = b2bSweepSchedulerTask.addContainer('B2bSweepSchedulerContainer', {
    image,
    readonlyRootFilesystem: true,
    command: resolveCommand(
      'scripts/aws/b2b-sweep-scheduler-ecs.js',
      'scripts/aws/b2b-sweep-scheduler-ecs.ts',
    ),
    environment: {
      ...sharedEnv,
      DB_APPLICATION_NAME: `rs-${options.envName}:b2b-sweep-scheduler`,
      B2B_SWEEP_SCHEDULER_LOOP: '0',
      ...(isDev ? { B2B_SWEEP_SCHEDULER_STALE_RUN_MAX_AGE_MS: '21600000' } : {}),
      ...(isDev && minimalMode
        ? {
            B2B_SWEEP_CANARY_MODE: '1',
            B2B_SWEEP_CANARY_FORCE_DUE: '1',
            B2B_SWEEP_CANARY_INTERVAL_SECONDS: '600',
            // Canary: keep the sweep corridor set fixed + small so we can observe end-to-end behavior
            // within minutes without producing a full Tier-2 backlog.
            B2B_SWEEP_CANARY_MAX_LANES: '30',
	            B2B_SWEEP_CANARY_CORRIDORS: [
	              'GB-NG-GBP-NGN',
	              'GB-IN-GBP-INR',
	              'AE-IN-AED-INR',
	              'AE-PK-AED-PKR',
              'DE-TR-EUR-TRY',
              'FR-MA-EUR-MAD',
              'IT-PH-EUR-PHP',
              'ES-CO-EUR-COP',
              'CA-PH-CAD-PHP',
	              'JP-PH-JPY-PHP',
	              'US-JO-USD-JOD',
	              'AE-JO-AED-JOD',
	              'GB-JO-GBP-JOD',
	              'DE-JO-EUR-JOD',
	            ].join(','),
	          }
	        : {}),
	    },
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'b2b-sweep-scheduler',
      logGroup: b2bSweepSchedulerLogGroup,
    }),
    healthCheck: workerHealthCheck,
    stopTimeout: Duration.seconds(45),
  })
  b2bSweepSchedulerContainer.addMountPoints(tmpMountPoint)
  if (enableTelemetry) {
    const b2bSweepSchedulerOtelLogGroup = new LogGroup(
      scope,
      'B2bSweepSchedulerOtelLogGroup',
      {
        logGroupName: `/remit-scout/${options.envName}/b2b-sweep-scheduler-otel`,
        retention: logRetention,
        removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      },
    )
    const b2bSweepSchedulerOtelCollector = b2bSweepSchedulerTask.addContainer('B2bSweepSchedulerOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:v0.40.0',
      ),
      readonlyRootFilesystem: true,
      cpu: 32,
      memoryLimitMiB: 256,
      environment: {
        AWS_REGION: Stack.of(scope).region,
        AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
      },
      logging: LogDrivers.awsLogs({
        streamPrefix: 'b2b-sweep-scheduler-otel',
        logGroup: b2bSweepSchedulerOtelLogGroup,
      }),
      portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
    })
    b2bSweepSchedulerOtelCollector.addMountPoints(tmpMountPoint)
  }

  const b2cRefreshTask = new FargateTaskDefinition(scope, 'B2cRefreshWorkerTask', {
    cpu: 256,
    memoryLimitMiB: 512,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })
  addTmpVolume(b2cRefreshTask)

  const b2cRefreshLogGroup = new LogGroup(scope, 'B2cRefreshLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/b2c-refresh-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const b2cRefreshWorkerContainer = b2cRefreshTask.addContainer('B2cRefreshWorkerContainer', {
    image,
    readonlyRootFilesystem: true,
    command: resolveCommand(
      'scripts/aws/b2c-refresh-worker-ecs.js',
      'scripts/aws/b2c-refresh-worker-ecs.ts',
    ),
    environment: {
      ...sharedEnv,
      B2C_REFRESH_LIMIT: b2cRefreshLimit,
      B2C_REFRESH_CONCURRENCY: b2cRefreshConcurrency,
      B2C_REFRESH_LOOP_JITTER_MS:
        process.env.B2C_REFRESH_LOOP_JITTER_MS || defaultLoopJitterMs,
      B2C_REFRESH_MESSAGE_JITTER_MS:
        process.env.B2C_REFRESH_MESSAGE_JITTER_MS || defaultMessageJitterMs,
      ...(b2cRefreshLoopEnabled ? { B2C_REFRESH_LOOP: '1' } : {}),
      ...(quoteRefreshQueueUrl ? { QUOTE_REFRESH_QUEUE_URL: quoteRefreshQueueUrl } : {}),
    },
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'b2c-refresh-worker',
      logGroup: b2cRefreshLogGroup,
    }),
    healthCheck: workerHealthCheck,
    stopTimeout: Duration.seconds(45),
  })
  b2cRefreshWorkerContainer.addMountPoints(tmpMountPoint)
  if (enableTelemetry) {
    const b2cRefreshOtelLogGroup = new LogGroup(scope, 'B2cRefreshOtelLogGroup', {
      logGroupName: `/remit-scout/${options.envName}/b2c-refresh-worker-otel`,
      retention: logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })
    const b2cRefreshOtelCollector = b2cRefreshTask.addContainer('B2cRefreshOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:v0.40.0',
      ),
      readonlyRootFilesystem: true,
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
    b2cRefreshOtelCollector.addMountPoints(tmpMountPoint)
  }

  const fxRateRefreshTask = new FargateTaskDefinition(scope, 'FxRateRefreshWorkerTask', {
    cpu: 256,
    memoryLimitMiB: 512,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })
  addTmpVolume(fxRateRefreshTask)

  const fxRateRefreshLogGroup = new LogGroup(scope, 'FxRateRefreshLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/fx-rate-refresh-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const fxRateRefreshWorkerContainer = fxRateRefreshTask.addContainer('FxRateRefreshWorkerContainer', {
    image,
    readonlyRootFilesystem: true,
    command: resolveCommand(
      'scripts/aws/fx-rate-refresh-worker-ecs.js',
      'scripts/aws/fx-rate-refresh-worker-ecs.ts',
    ),
    environment: {
      ...sharedEnv,
      ...(fxRateRefreshLoopEnabled ? { FX_RATE_REFRESH_LOOP: '1' } : {}),
      ...(fxRateRefreshQueueUrl ? { FX_RATE_REFRESH_QUEUE_URL: fxRateRefreshQueueUrl } : {}),
    },
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'fx-rate-refresh-worker',
      logGroup: fxRateRefreshLogGroup,
    }),
    healthCheck: workerHealthCheck,
    stopTimeout: Duration.seconds(45),
  })
  fxRateRefreshWorkerContainer.addMountPoints(tmpMountPoint)
  if (enableTelemetry) {
    const fxRateRefreshOtelLogGroup = new LogGroup(scope, 'FxRateRefreshOtelLogGroup', {
      logGroupName: `/remit-scout/${options.envName}/fx-rate-refresh-worker-otel`,
      retention: logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })
    const fxRateRefreshOtelCollector = fxRateRefreshTask.addContainer('FxRateRefreshOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:v0.40.0',
      ),
      readonlyRootFilesystem: true,
      cpu: 32,
      memoryLimitMiB: 256,
      environment: {
        AWS_REGION: Stack.of(scope).region,
        AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
      },
      logging: LogDrivers.awsLogs({
        streamPrefix: 'fx-rate-refresh-worker-otel',
        logGroup: fxRateRefreshOtelLogGroup,
      }),
      portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
    })
    fxRateRefreshOtelCollector.addMountPoints(tmpMountPoint)
  }

  const buildIngestFanoutEnv = (queueUrl: string, tierLabel: string) => {
    const ingestFanoutEnv = { ...sharedEnv }
    ingestFanoutEnv.DB_APPLICATION_NAME = `rs-${options.envName}:ingest-fanout-${tierLabel}`
    ingestFanoutEnv.PLANE_B_INGEST_FANOUT_QUEUE_URL = queueUrl
    ingestFanoutEnv.PLANE_B_INGEST_FANOUT_QUEUE_TIER = tierLabel
    if (process.env.INGEST_FANOUT_BATCH_SIZE) {
      ingestFanoutEnv.INGEST_FANOUT_BATCH_SIZE = process.env.INGEST_FANOUT_BATCH_SIZE
    } else if (isConservativeWorkerDefaults) {
      ingestFanoutEnv.INGEST_FANOUT_BATCH_SIZE = '10'
    }
    if (process.env.INGEST_FANOUT_CONCURRENCY) {
      ingestFanoutEnv.INGEST_FANOUT_CONCURRENCY = process.env.INGEST_FANOUT_CONCURRENCY
    } else if (isDev) {
      // Dev: keep DB + downstream pressure low until the pipeline is stable.
      ingestFanoutEnv.INGEST_FANOUT_CONCURRENCY = '1'
    } else if (isConservativeWorkerDefaults) {
      ingestFanoutEnv.INGEST_FANOUT_CONCURRENCY = '4'
    }
    if (process.env.INGEST_FANOUT_PROVIDER_CONCURRENCY) {
      ingestFanoutEnv.INGEST_FANOUT_PROVIDER_CONCURRENCY =
        process.env.INGEST_FANOUT_PROVIDER_CONCURRENCY
    } else if (isDev) {
      ingestFanoutEnv.INGEST_FANOUT_PROVIDER_CONCURRENCY = '1'
    } else if (isConservativeWorkerDefaults) {
      ingestFanoutEnv.INGEST_FANOUT_PROVIDER_CONCURRENCY = '2'
    }
    if (process.env.INGEST_FANOUT_IDLE_SLEEP_MS) {
      ingestFanoutEnv.INGEST_FANOUT_IDLE_SLEEP_MS = process.env.INGEST_FANOUT_IDLE_SLEEP_MS
    } else if (isConservativeWorkerDefaults) {
      ingestFanoutEnv.INGEST_FANOUT_IDLE_SLEEP_MS = '250'
    }
    ingestFanoutEnv.INGEST_FANOUT_LOOP_JITTER_MS =
      process.env.INGEST_FANOUT_LOOP_JITTER_MS || defaultLoopJitterMs
    ingestFanoutEnv.INGEST_FANOUT_MESSAGE_JITTER_MS =
      process.env.INGEST_FANOUT_MESSAGE_JITTER_MS || defaultMessageJitterMs
    if (process.env.INGEST_FANOUT_MAX_ATTEMPTS) {
      ingestFanoutEnv.INGEST_FANOUT_MAX_ATTEMPTS = process.env.INGEST_FANOUT_MAX_ATTEMPTS
    }
    if (process.env.DB_DISABLE_POOL_SIGNAL_CLEANUP) {
      ingestFanoutEnv.DB_DISABLE_POOL_SIGNAL_CLEANUP =
        process.env.DB_DISABLE_POOL_SIGNAL_CLEANUP
    } else if (isDev) {
      ingestFanoutEnv.DB_DISABLE_POOL_SIGNAL_CLEANUP = '1'
    }
    return ingestFanoutEnv
  }

  const createIngestFanoutTask = (
    idSuffix: string,
    logSuffix: string,
    queueUrl: string,
    tierLabel: string,
  ) => {
    const task = new FargateTaskDefinition(scope, `IngestFanout${idSuffix}WorkerTask`, {
      cpu: ingestFanoutCpu,
      memoryLimitMiB: ingestFanoutMemory,
      executionRole: options.roles.planeBEcsTaskExecutionRole,
      taskRole: options.roles.planeBEcsTaskRole,
      runtimePlatform,
    })
    addTmpVolume(task)

    const ingestFanoutLogGroup = new LogGroup(scope, `IngestFanout${idSuffix}LogGroup`, {
      logGroupName: `/remit-scout/${options.envName}/ingest-fanout${logSuffix}-worker`,
      retention: logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })

    const ingestFanoutWorkerContainer = task.addContainer('IngestFanoutWorkerContainer', {
      image,
      readonlyRootFilesystem: true,
      command: resolveCommand(
        'scripts/aws/ingest-fanout-worker-ecs.js',
        'scripts/aws/ingest-fanout-worker-ecs.ts',
      ),
      environment: buildIngestFanoutEnv(queueUrl, tierLabel),
      ...secretsConfig,
      logging: LogDrivers.awsLogs({
        streamPrefix: `ingest-fanout${logSuffix}-worker`,
        logGroup: ingestFanoutLogGroup,
      }),
      healthCheck: workerHealthCheck,
      stopTimeout: Duration.seconds(45),
    })
    ingestFanoutWorkerContainer.addMountPoints(tmpMountPoint)

    if (enableTelemetry) {
      const ingestFanoutOtelLogGroup = new LogGroup(
        scope,
        `IngestFanout${idSuffix}OtelLogGroup`,
        {
          logGroupName: `/remit-scout/${options.envName}/ingest-fanout${logSuffix}-worker-otel`,
          retention: logRetention,
          removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
        },
      )
      const ingestFanoutOtelCollector = task.addContainer('IngestFanoutOtelCollector', {
        image: ContainerImage.fromRegistry(
          'public.ecr.aws/aws-observability/aws-otel-collector:v0.40.0',
        ),
        readonlyRootFilesystem: true,
        cpu: 32,
        memoryLimitMiB: 256,
        environment: {
          AWS_REGION: Stack.of(scope).region,
          AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
        },
        logging: LogDrivers.awsLogs({
          streamPrefix: `ingest-fanout${logSuffix}-worker-otel`,
          logGroup: ingestFanoutOtelLogGroup,
        }),
        portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
      })
      ingestFanoutOtelCollector.addMountPoints(tmpMountPoint)
    }

    return task
  }

  if (!ingestFanoutQueueTier1Url || !ingestFanoutQueueTier2Url) {
    throw new Error('Both ingest fanout tier queues must be configured.')
  }

  const ingestFanoutTier1Task = createIngestFanoutTask('', '', ingestFanoutQueueTier1Url, 'tier1')
  const ingestFanoutTier2Task = createIngestFanoutTask(
    'Tier2',
    '-tier2',
    ingestFanoutQueueTier2Url,
    'tier2',
  )

  const goldLiveTask = new FargateTaskDefinition(scope, 'GoldLiveWorkerTask', {
    cpu: 256,
    memoryLimitMiB: 512,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })
  addTmpVolume(goldLiveTask)

  const goldLiveLogGroup = new LogGroup(scope, 'GoldLiveLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/gold-live-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  const goldLiveEnv: Record<string, string> = { ...sharedEnv }
  goldLiveEnv.GOLD_LIVE_QUEUE_LOOP_JITTER_MS =
    process.env.GOLD_LIVE_QUEUE_LOOP_JITTER_MS || defaultLoopJitterMs
  goldLiveEnv.GOLD_LIVE_QUEUE_MESSAGE_JITTER_MS =
    process.env.GOLD_LIVE_QUEUE_MESSAGE_JITTER_MS || defaultMessageJitterMs
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
  const goldLiveWorkerContainer = goldLiveTask.addContainer('GoldLiveWorkerContainer', {
    image,
    readonlyRootFilesystem: true,
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
    stopTimeout: Duration.seconds(45),
  })
  goldLiveWorkerContainer.addMountPoints(tmpMountPoint)
  if (enableTelemetry) {
    const goldLiveOtelLogGroup = new LogGroup(scope, 'GoldLiveOtelLogGroup', {
      logGroupName: `/remit-scout/${options.envName}/gold-live-worker-otel`,
      retention: logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })
    const goldLiveOtelCollector = goldLiveTask.addContainer('GoldLiveOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:v0.40.0',
      ),
      readonlyRootFilesystem: true,
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
    goldLiveOtelCollector.addMountPoints(tmpMountPoint)
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
  addTmpVolume(notificationsQueueTask)

  const notificationsLogGroup = new LogGroup(scope, 'NotificationsQueueLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/notifications-queue-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const notificationsEnv: Record<string, string> = {
    ...sharedEnv,
    NOTIFICATIONS_QUEUE_LOOP_JITTER_MS:
      process.env.NOTIFICATIONS_QUEUE_LOOP_JITTER_MS || defaultLoopJitterMs,
    NOTIFICATIONS_QUEUE_MESSAGE_JITTER_MS:
      process.env.NOTIFICATIONS_QUEUE_MESSAGE_JITTER_MS || defaultMessageJitterMs,
  }
  if (!notificationsEnv.PLANE_B_DB_HOST && planeBDbHost) {
    notificationsEnv.PLANE_B_DB_HOST = planeBDbHost
  }
  if (!notificationsEnv.PLANE_B_DB_PORT && planeBDbPort) {
    notificationsEnv.PLANE_B_DB_PORT = planeBDbPort
  }
  if (!notificationsEnv.PLANE_B_DB_NAME && planeBDbName) {
    notificationsEnv.PLANE_B_DB_NAME = planeBDbName
  }
  if (!notificationsEnv.PLANE_B_DB_SECRET_ARN && planeBDbSecretArn) {
    notificationsEnv.PLANE_B_DB_SECRET_ARN = planeBDbSecretArn
  }
  if (options.alertEvaluationQueueUrl) {
    notificationsEnv.ALERT_EVALUATION_QUEUE_URL = options.alertEvaluationQueueUrl
  }
  if (options.exportJobQueueUrl) {
    notificationsEnv.EXPORT_JOB_QUEUE_URL = options.exportJobQueueUrl
  }
  if (options.exportsBucketName) {
    notificationsEnv.EXPORTS_S3_BUCKET = options.exportsBucketName
  }
  hydrateAlertWorkerEnv(notificationsEnv)
  const notificationsQueueWorkerContainer = notificationsQueueTask.addContainer('NotificationsQueueWorkerContainer', {
    image,
    readonlyRootFilesystem: true,
    command: resolveCommand(
      'scripts/aws/notifications-queue-worker-ecs.js',
      'scripts/aws/notifications-queue-worker-ecs.ts',
    ),
    environment: notificationsEnv,
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'notifications-queue-worker',
      logGroup: notificationsLogGroup,
    }),
    healthCheck: workerHealthCheck,
    stopTimeout: Duration.seconds(45),
  })
  notificationsQueueWorkerContainer.addMountPoints(tmpMountPoint)
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
    const notificationsQueueOtelCollector = notificationsQueueTask.addContainer('NotificationsQueueOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:v0.40.0',
      ),
      readonlyRootFilesystem: true,
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
    notificationsQueueOtelCollector.addMountPoints(tmpMountPoint)
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
  addTmpVolume(opsAlertsQueueTask)

  const opsAlertsLogGroup = new LogGroup(scope, 'OpsAlertsQueueLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/ops-alerts-queue-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const opsAlertsEnv: Record<string, string> = {
    ...sharedEnv,
    OPS_ALERTS_QUEUE_LOOP_JITTER_MS:
      process.env.OPS_ALERTS_QUEUE_LOOP_JITTER_MS || defaultLoopJitterMs,
    OPS_ALERTS_QUEUE_MESSAGE_JITTER_MS:
      process.env.OPS_ALERTS_QUEUE_MESSAGE_JITTER_MS || defaultMessageJitterMs,
  }
  if (!opsAlertsEnv.PLANE_B_DB_HOST && planeBDbHost) {
    opsAlertsEnv.PLANE_B_DB_HOST = planeBDbHost
  }
  if (!opsAlertsEnv.PLANE_B_DB_PORT && planeBDbPort) {
    opsAlertsEnv.PLANE_B_DB_PORT = planeBDbPort
  }
  if (!opsAlertsEnv.PLANE_B_DB_NAME && planeBDbName) {
    opsAlertsEnv.PLANE_B_DB_NAME = planeBDbName
  }
  if (!opsAlertsEnv.PLANE_B_DB_SECRET_ARN && planeBDbSecretArn) {
    opsAlertsEnv.PLANE_B_DB_SECRET_ARN = planeBDbSecretArn
  }
  if (options.alertEvaluationQueueUrl) {
    opsAlertsEnv.ALERT_EVALUATION_QUEUE_URL = options.alertEvaluationQueueUrl
  }
  if (options.exportJobQueueUrl) {
    opsAlertsEnv.EXPORT_JOB_QUEUE_URL = options.exportJobQueueUrl
  }
  if (options.exportsBucketName) {
    opsAlertsEnv.EXPORTS_S3_BUCKET = options.exportsBucketName
  }
  hydrateAlertWorkerEnv(opsAlertsEnv)
  const opsAlertsQueueWorkerContainer = opsAlertsQueueTask.addContainer('OpsAlertsQueueWorkerContainer', {
    image,
    readonlyRootFilesystem: true,
    command: resolveCommand(
      'scripts/aws/ops-alerts-queue-worker-ecs.js',
      'scripts/aws/ops-alerts-queue-worker-ecs.ts',
    ),
    environment: opsAlertsEnv,
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'ops-alerts-queue-worker',
      logGroup: opsAlertsLogGroup,
    }),
    healthCheck: workerHealthCheck,
    stopTimeout: Duration.seconds(45),
  })
  opsAlertsQueueWorkerContainer.addMountPoints(tmpMountPoint)
  if (enableTelemetry) {
    const opsAlertsOtelLogGroup = new LogGroup(scope, 'OpsAlertsQueueOtelLogGroup', {
      logGroupName: `/remit-scout/${options.envName}/ops-alerts-queue-worker-otel`,
      retention: logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })
    const opsAlertsQueueOtelCollector = opsAlertsQueueTask.addContainer('OpsAlertsQueueOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:v0.40.0',
      ),
      readonlyRootFilesystem: true,
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
    opsAlertsQueueOtelCollector.addMountPoints(tmpMountPoint)
  }

  const planeADbSecretArn = options.planeADbSecretArn ?? options.planeBDbSecretArn
  const planeADbSsmName = options.planeADbSsmName ?? options.planeBDbSsmName
  const planeADbHost = options.planeADbHost ?? options.planeBDbHost
  const planeADbPort = options.planeADbPort ?? options.planeBDbPort
  const planeADbName = options.planeADbName ?? options.planeBDbName

  const planeAWorkerEnv: Record<string, string> = {
    ...sharedEnv,
  }
  if (planeADbHost) {
    planeAWorkerEnv.PLANE_A_DB_HOST = planeADbHost
  }
  if (planeADbSecretArn) {
    planeAWorkerEnv.PLANE_A_DB_SECRET_ARN = planeADbSecretArn
  }
  if (planeADbSsmName) {
    planeAWorkerEnv.PLANE_A_DB_SSM_NAME = planeADbSsmName
  }
  if (planeADbPort) {
    planeAWorkerEnv.PLANE_A_DB_PORT = planeADbPort
  }
  if (planeADbName) {
    planeAWorkerEnv.PLANE_A_DB_NAME = planeADbName
  }
  if (supabaseSecretArn) {
    planeAWorkerEnv.SUPABASE_SECRET_ARN = supabaseSecretArn
  }
  if (supabaseSsmName) {
    planeAWorkerEnv.SUPABASE_SSM_NAME = supabaseSsmName
  }
  if (stripeSecretArn) {
    planeAWorkerEnv.STRIPE_SECRET_ARN = stripeSecretArn
  }
  if (stripeSsmName) {
    planeAWorkerEnv.STRIPE_SSM_NAME = stripeSsmName
  }
  if (communicationsSecretArn) {
    planeAWorkerEnv.COMMUNICATIONS_SECRET_ARN = communicationsSecretArn
  }
  if (sharedSecretArn) {
    planeAWorkerEnv.SHARED_SECRET_ARN = sharedSecretArn
  }
  if (planeAJwtSecretJsonKey) {
    planeAWorkerEnv.PLANE_A_JWT_SECRET_JSON_KEY = planeAJwtSecretJsonKey
  }
  if (process.env.PLANE_C_INTERNAL_API_TOKEN_SECRET_JSON_KEY) {
    planeAWorkerEnv.PLANE_C_INTERNAL_API_TOKEN_SECRET_JSON_KEY =
      process.env.PLANE_C_INTERNAL_API_TOKEN_SECRET_JSON_KEY
  }
  const planeARuntimePassthroughKeys = [
    'PLANE_A_ADMIN_EMAILS',
    'ADMIN_IP_ALLOWLIST',
    'WAF_ADMIN_ALLOWLIST_IPS',
    'WAF_ALLOWLIST_IPS',
    'PRIVACY_HASH_SALT',
    'PRIVACY_SESSION_SALT',
    'PLANE_A_CORS_ORIGINS',
    'PLANE_A_CORS_ALLOWED_HEADERS',
    'PLANE_A_CORS_ALLOWED_METHODS',
    'PLANE_A_CORS_ALLOW_CREDENTIALS',
    'PUBLIC_SITE_URL',
    'FRONTEND_BASE_URL',
    'PLANE_A_JWT_ISSUER',
    'PLANE_A_JWT_AUDIENCES',
    'PLANE_A_ENABLE_JWT_AUTH',
    'PLANE_A_REQUIRE_JWT',
    'PLANE_A_REQUIRE_API_KEY',
    'PLANE_A_ADMIN_REVOCATION_FAIL_CLOSED',
  ] as const
  for (const key of planeARuntimePassthroughKeys) {
    const value = process.env[key]
    if (value !== undefined && value !== '') {
      planeAWorkerEnv[key] = value
    }
  }

  const alertEvaluationTask = new FargateTaskDefinition(
    scope,
    'AlertEvaluationWorkerTask',
    {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole: options.roles.planeBEcsTaskExecutionRole,
      taskRole: options.roles.planeBEcsTaskRole,
      runtimePlatform,
    },
  )
  addTmpVolume(alertEvaluationTask)

  const alertEvaluationLogGroup = new LogGroup(scope, 'AlertEvaluationWorkerLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/alert-evaluation-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const alertEvaluationEnv: Record<string, string> = {
    ...planeAWorkerEnv,
    ALERT_EVALUATION_ENABLED: '1',
  }
  if (options.alertEvaluationQueueUrl) {
    alertEvaluationEnv.ALERT_EVALUATION_QUEUE_URL = options.alertEvaluationQueueUrl
  }
  if (options.communicationsSecretArn) {
    alertEvaluationEnv.COMMUNICATIONS_SECRET_ARN = options.communicationsSecretArn
  }
  hydrateAlertWorkerEnv(alertEvaluationEnv)
  const alertEvaluationWorkerContainer = alertEvaluationTask.addContainer('AlertEvaluationWorkerContainer', {
    image,
    readonlyRootFilesystem: true,
    command: resolveCommand(
      'scripts/aws/alert-evaluation-worker-ecs.js',
      'scripts/aws/alert-evaluation-worker-ecs.ts',
    ),
    environment: alertEvaluationEnv,
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'alert-evaluation-worker',
      logGroup: alertEvaluationLogGroup,
    }),
    healthCheck: workerHealthCheck,
    stopTimeout: Duration.seconds(45),
  })
  alertEvaluationWorkerContainer.addMountPoints(tmpMountPoint)
  if (enableTelemetry) {
    const alertEvaluationOtelLogGroup = new LogGroup(
      scope,
      'AlertEvaluationWorkerOtelLogGroup',
      {
        logGroupName: `/remit-scout/${options.envName}/alert-evaluation-worker-otel`,
        retention: logRetention,
        removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      },
    )
    const alertEvaluationOtelCollector = alertEvaluationTask.addContainer('AlertEvaluationOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:v0.40.0',
      ),
      readonlyRootFilesystem: true,
      cpu: 32,
      memoryLimitMiB: 256,
      environment: {
        AWS_REGION: Stack.of(scope).region,
        AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
      },
      logging: LogDrivers.awsLogs({
        streamPrefix: 'alert-evaluation-worker-otel',
        logGroup: alertEvaluationOtelLogGroup,
      }),
      portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
    })
    alertEvaluationOtelCollector.addMountPoints(tmpMountPoint)
  }

  const exportWorkerTask = new FargateTaskDefinition(
    scope,
    'ExportWorkerTask',
    {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole: options.roles.planeBEcsTaskExecutionRole,
      taskRole: options.roles.planeBEcsTaskRole,
      runtimePlatform,
    },
  )
  addTmpVolume(exportWorkerTask)

  const exportWorkerLogGroup = new LogGroup(scope, 'ExportWorkerLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/export-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const exportWorkerEnv: Record<string, string> = {
    ...planeAWorkerEnv,
  }
  if (options.exportJobQueueUrl) {
    exportWorkerEnv.EXPORT_JOB_QUEUE_URL = options.exportJobQueueUrl
  }
  if (options.exportJobQueueMode) {
    exportWorkerEnv.EXPORT_JOB_QUEUE_MODE = options.exportJobQueueMode
  }
  if (options.exportsBucketName) {
    exportWorkerEnv.EXPORTS_S3_BUCKET = options.exportsBucketName
  }
  if (options.exportsPrefix) {
    exportWorkerEnv.EXPORTS_S3_PREFIX = options.exportsPrefix
  }
  const exportWorkerContainer = exportWorkerTask.addContainer('ExportWorkerContainer', {
    image,
    readonlyRootFilesystem: true,
    command: resolveCommand(
      'scripts/aws/export-worker-ecs.js',
      'scripts/aws/export-worker-ecs.ts',
    ),
    environment: exportWorkerEnv,
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'export-worker',
      logGroup: exportWorkerLogGroup,
    }),
    healthCheck: workerHealthCheck,
    stopTimeout: Duration.seconds(45),
  })
  exportWorkerContainer.addMountPoints(tmpMountPoint)
  if (enableTelemetry) {
    const exportWorkerOtelLogGroup = new LogGroup(
      scope,
      'ExportWorkerOtelLogGroup',
      {
        logGroupName: `/remit-scout/${options.envName}/export-worker-otel`,
        retention: logRetention,
        removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      },
    )
    const exportWorkerOtelCollector = exportWorkerTask.addContainer('ExportWorkerOtelCollector', {
      image: ContainerImage.fromRegistry(
        'public.ecr.aws/aws-observability/aws-otel-collector:v0.40.0',
      ),
      readonlyRootFilesystem: true,
      cpu: 32,
      memoryLimitMiB: 256,
      environment: {
        AWS_REGION: Stack.of(scope).region,
        AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
      },
      logging: LogDrivers.awsLogs({
        streamPrefix: 'export-worker-otel',
        logGroup: exportWorkerOtelLogGroup,
      }),
      portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
    })
    exportWorkerOtelCollector.addMountPoints(tmpMountPoint)
  }

  const agentOrchestratorTask = new FargateTaskDefinition(scope, 'AgentOrchestratorTask', {
    cpu: 512,
    memoryLimitMiB: 1024,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })
  addTmpVolume(agentOrchestratorTask)

  const agentOrchestratorLogGroup = new LogGroup(scope, 'AgentOrchestratorLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/agent-orchestrator`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  const agentOrchestratorContainer = agentOrchestratorTask.addContainer('AgentOrchestratorContainer', {
    image,
    readonlyRootFilesystem: true,
    command: resolveCommand(
      'scripts/aws/agent-orchestrator-ecs.js',
      'scripts/aws/agent-orchestrator-ecs.ts',
    ),
    environment: {
      ...sharedEnv,
      AGENT_ENABLED: 'true',
      AGENT_ORCHESTRATOR_ENABLED: 'true',
      HEALTH_PORT: '8080',
      AGENT_PATCH_PIPELINE_ENABLED: scope.node.tryGetContext('agentPatchPipelineEnabled') ?? '0',
    },
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'agent-orchestrator',
      logGroup: agentOrchestratorLogGroup,
    }),
    healthCheck: workerHealthCheck,
    stopTimeout: Duration.seconds(60),
  })
  agentOrchestratorContainer.addMountPoints(tmpMountPoint)

  const stressResponderTask = new FargateTaskDefinition(scope, 'StressResponderTask', {
    cpu: 256,
    memoryLimitMiB: 512,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })
  addTmpVolume(stressResponderTask)

  const stressResponderLogGroup = new LogGroup(scope, 'StressResponderLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/stress-responder`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  const stressResponderContainer = stressResponderTask.addContainer('StressResponderContainer', {
    image,
    readonlyRootFilesystem: true,
    command: resolveCommand(
      'scripts/aws/stress-responder-ecs.js',
      'scripts/aws/stress-responder-ecs.ts',
    ),
    environment: {
      ...sharedEnv,
      HEALTH_PORT: '8080',
    },
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'stress-responder',
      logGroup: stressResponderLogGroup,
    }),
    healthCheck: workerHealthCheck,
    stopTimeout: Duration.seconds(30),
  })
  stressResponderContainer.addMountPoints(tmpMountPoint)

  const normalizationWorkerTask = new FargateTaskDefinition(scope, 'NormalizationWorkerTask', {
    cpu: 256,
    memoryLimitMiB: 512,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })
  addTmpVolume(normalizationWorkerTask)

  const normalizationWorkerLogGroup = new LogGroup(scope, 'NormalizationWorkerLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/normalization-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  const normalizationWorkerContainer = normalizationWorkerTask.addContainer(
    'NormalizationWorkerContainer',
    {
      image,
      readonlyRootFilesystem: true,
      command: resolveCommand(
        'scripts/aws/normalization-worker-ecs.js',
        'scripts/aws/normalization-worker-ecs.ts',
      ),
      environment: {
        ...sharedEnv,
        HEALTH_PORT: '8080',
      },
      ...secretsConfig,
      logging: LogDrivers.awsLogs({
        streamPrefix: 'normalization-worker',
        logGroup: normalizationWorkerLogGroup,
      }),
      healthCheck: workerHealthCheck,
      stopTimeout: Duration.seconds(30),
    },
  )
  normalizationWorkerContainer.addMountPoints(tmpMountPoint)

  // ── Plane A API server task definition ────────────────────────────────────
  // Runs the Fastify API server (plane-a/src/server.ts) on port 4000.
  // Uses FARGATE (not Spot) for stable, predictable API availability.
  const planeAApiCpu = isProd ? 512 : 256
  const planeAApiMemory = isProd ? 1024 : 512
  const planeATask = new FargateTaskDefinition(scope, 'PlaneATask', {
    cpu: planeAApiCpu,
    memoryLimitMiB: planeAApiMemory,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })
  addTmpVolume(planeATask)

  const planeAApiLogGroup = new LogGroup(scope, 'PlaneAApiLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/plane-a-api`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const planeAApiEnv: Record<string, string> = {
    ...sharedEnv,
    ...planeAWorkerEnv,
    PLANE_A_PORT: '4000',
    HEALTH_PORT: '4000',
  }
  const planeAApiContainer = planeATask.addContainer('PlaneAApiContainer', {
    image,
    readonlyRootFilesystem: true,
    command: resolveCommand(
      'scripts/aws/plane-a-api-ecs.js',
      'scripts/aws/plane-a-api-ecs.ts',
    ),
    environment: planeAApiEnv,
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'plane-a-api',
      logGroup: planeAApiLogGroup,
    }),
    healthCheck: {
      command: [
        'CMD-SHELL',
        'node -e "require(\'http\').get(\'http://127.0.0.1:4000/healthz\', r=>process.exit(r.statusCode===200?0:1)).on(\'error\',()=>process.exit(1))"',
      ],
      interval: Duration.seconds(30),
      timeout: Duration.seconds(5),
      retries: 3,
      startPeriod: Duration.seconds(60),
    },
    portMappings: [{ containerPort: 4000, protocol: Protocol.TCP }],
    stopTimeout: Duration.seconds(30),
  })
  planeAApiContainer.addMountPoints(tmpMountPoint)

  // ── Plane C Gold publisher task definition ─────────────────────────────────
  // Runs the Fastify Gold publisher API server (plane-c/src/server.ts) on port 4100.
  // Uses FARGATE (not Spot) for stable internal API availability.
  const planeCApiCpu = isProd ? 512 : 256
  const planeCApiMemory = isProd ? 1024 : 512
  const planeCTask = new FargateTaskDefinition(scope, 'PlaneCTask', {
    cpu: planeCApiCpu,
    memoryLimitMiB: planeCApiMemory,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })
  addTmpVolume(planeCTask)

  const planeCApiLogGroup = new LogGroup(scope, 'PlaneCApiLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/plane-c-api`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const planeCApiEnv: Record<string, string> = {
    ...sharedEnv,
    PLANE_C_PORT: '4100',
    HEALTH_PORT: '4100',
  }
  if (planeCDbHost) {
    planeCApiEnv.PLANE_C_DB_HOST = planeCDbHost
  }
  if (planeCDbPort) {
    planeCApiEnv.PLANE_C_DB_PORT = planeCDbPort
  }
  if (planeCDbName) {
    planeCApiEnv.PLANE_C_DB_NAME = planeCDbName
  }
  const planeCApiContainer = planeCTask.addContainer('PlaneCApiContainer', {
    image,
    readonlyRootFilesystem: true,
    command: resolveCommand(
      'scripts/aws/plane-c-api-ecs.js',
      'scripts/aws/plane-c-api-ecs.ts',
    ),
    environment: planeCApiEnv,
    ...goldLiveSecretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'plane-c-api',
      logGroup: planeCApiLogGroup,
    }),
    healthCheck: {
      command: [
        'CMD-SHELL',
        'node -e "require(\'http\').get(\'http://127.0.0.1:4100/healthz\', r=>process.exit(r.statusCode===200?0:1)).on(\'error\',()=>process.exit(1))"',
      ],
      interval: Duration.seconds(30),
      timeout: Duration.seconds(5),
      retries: 3,
      startPeriod: Duration.seconds(60),
    },
    portMappings: [{ containerPort: 4100, protocol: Protocol.TCP }],
    stopTimeout: Duration.seconds(30),
  })
  planeCApiContainer.addMountPoints(tmpMountPoint)

  const dbMigrateTask = new FargateTaskDefinition(scope, 'DbMigrateTask', {
    cpu: 256,
    memoryLimitMiB: 512,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
    runtimePlatform,
  })
  addTmpVolume(dbMigrateTask)

  const dbMigrateLogGroup = new LogGroup(scope, 'DbMigrateLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/db-migrate`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  const dbMigrateContainer = dbMigrateTask.addContainer('DbMigrateContainer', {
    image,
    readonlyRootFilesystem: true,
    command: resolveCommand(
      'scripts/aws/db-migrate-ecs.js',
      'scripts/aws/db-migrate-ecs.ts',
    ),
    environment: {
      ...sharedEnv,
      ...(planeBDbMigratorSecretArn
        ? { PLANE_B_DB_MIGRATOR_SECRET_ARN: planeBDbMigratorSecretArn }
        : {}),
      ...(options.supabaseSecretArn
        ? { SUPABASE_SECRET_ARN: options.supabaseSecretArn }
        : {}),
      ...(options.supabaseSsmName
        ? { SUPABASE_SSM_NAME: options.supabaseSsmName }
        : {}),
      ALLOW_DB_MIGRATOR_URL: '1',
      HEALTH_PORT: '8080',
    },
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'db-migrate',
      logGroup: dbMigrateLogGroup,
    }),
    healthCheck: workerHealthCheck,
    stopTimeout: Duration.seconds(45),
  })
  dbMigrateContainer.addMountPoints(tmpMountPoint)

  // --- Discovery scanner task (Playwright-based, separate image) ---
  // Only created when a discovery ECR repository is provided. The discovery
  // image is built from infrastructure/docker/Dockerfile.playwright and ships
  // Playwright + Chromium for browser-based corridor crawling.
  let discoveryTask: FargateTaskDefinition | undefined
  if (options.discoveryRepository) {
    const discoveryImageTag = options.discoveryImageTag ?? options.imageTag
    const discoveryImage = ContainerImage.fromEcrRepository(
      options.discoveryRepository,
      discoveryImageTag,
    )

    discoveryTask = new FargateTaskDefinition(scope, 'DiscoveryTask', {
      cpu: 1024,
      memoryLimitMiB: 2048,
      ephemeralStorageGiB: 30,
      executionRole: options.roles.planeBEcsTaskExecutionRole,
      taskRole: options.roles.planeBEcsTaskRole,
      runtimePlatform: {
        cpuArchitecture: CpuArchitecture.X86_64,
        operatingSystemFamily: OperatingSystemFamily.LINUX,
      },
    })
    addTmpVolume(discoveryTask)

    const discoveryLogGroup = new LogGroup(scope, 'DiscoveryLogGroup', {
      logGroupName: `/remit-scout/${options.envName}/discovery`,
      retention: logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })

    const discoveryContainer = discoveryTask.addContainer('DiscoveryContainer', {
      image: discoveryImage,
      readonlyRootFilesystem: false,
      command: ['node', 'backend/dist/scripts/discovery-scan.js'],
      environment: {
        ...sharedEnv,
        DISCOVERY_ENABLED: '1',
        DISCOVERY_APPLY_RESULTS: '0',
        HEALTH_PORT: '8080',
        ...(bronzeBucketName ? { BRONZE_BUCKET_NAME: bronzeBucketName } : {}),
        ...(bronzePrefix ? { BRONZE_PREFIX: bronzePrefix } : {}),
      },
      ...secretsConfig,
      logging: LogDrivers.awsLogs({
        streamPrefix: 'discovery',
        logGroup: discoveryLogGroup,
      }),
      healthCheck: workerHealthCheck,
      stopTimeout: Duration.seconds(120),
    })
    discoveryContainer.addMountPoints(tmpMountPoint)
  }

  return {
    planeATask,
    planeCTask,
    planeBIngestTask,
    b2cRefreshTask,
    fxRateRefreshTask,
    b2bSweepSchedulerTask,
    ingestFanoutTier1Task,
    ingestFanoutTier2Task,
    goldLiveTask,
    notificationsQueueTask,
    opsAlertsQueueTask,
    alertEvaluationTask,
    exportWorkerTask,
    agentOrchestratorTask,
    stressResponderTask,
    normalizationWorkerTask,
    dbMigrateTask,
    discoveryTask,
  }
}
