import path from 'path'

import { Annotations, Duration, Fn, RemovalPolicy, Stack, Token } from 'aws-cdk-lib'
import { CfnStage, HttpApi, HttpMethod, HttpStage } from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import {
  HttpIamAuthorizer,
  HttpJwtAuthorizer,
} from 'aws-cdk-lib/aws-apigatewayv2-authorizers'
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  HeadersFrameOption,
  HeadersReferrerPolicy,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import { Architecture, Runtime, Tracing, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { SubnetType, type SecurityGroup, type Vpc } from 'aws-cdk-lib/aws-ec2'
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import type { IBucket } from 'aws-cdk-lib/aws-s3'
import { Secret, type ISecret } from 'aws-cdk-lib/aws-secretsmanager'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { CfnIPSet, CfnLoggingConfiguration, CfnWebACL } from 'aws-cdk-lib/aws-wafv2'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import type { Construct } from 'constructs'

import type { IamResources } from './iam'
import { collectOandaThrottleEnv, resolveAdminMfaRequiredEnv } from './env-utils'
import { resolveCloudWatchMetricsEnabled, resolveTracingEnv } from './newrelic-observability'

export type ApiOptions = {
  envName: string
  vpc: Vpc
  roles: IamResources
  lambdaArchitecture?: Architecture
  planeASecurityGroup: SecurityGroup
  planeCSecurityGroup: SecurityGroup
  planeADbSecretArn?: string
  planeADbSecretJsonKey?: string
  planeADbSsmName?: string
  planeADbHost?: string
  planeADbPort?: string
  planeADbName?: string
  supabaseSecretArn?: string
  supabaseSsmName?: string
  stripeSecretArn?: string
  stripeSsmName?: string
  communicationsSecretArn?: string
  sentrySecretArn?: string
  sentrySecretJsonKey?: string
  sharedSecretArn?: string
  planeAJwtSecretJsonKey?: string
  planeCInternalApiTokenSecretJsonKey?: string
  planeAAdminEmails?: string[]
  planeAAdminIpAllowlist?: string[]
  planeAAdminRevocationFailClosed?: boolean
  planeACorsOrigins?: string[]
  planeACorsAllowedHeaders?: string[]
  planeACorsAllowedMethods?: string[]
  planeACorsAllowCredentials?: boolean
  frontendBaseUrl?: string
  publicAdsEnabled?: string
  publicPulseEnabled?: string
  publicPulseScreenerEnabled?: string
  publicEnterpriseEnabled?: string
  planeAB2cMaxBucketDeltaPct?: number
  planeCDbSecretArn?: string
  planeCDbSecretJsonKey?: string
  planeCDbSsmName?: string
  planeCDbHost?: string
  planeCDbPort?: string
  planeCDbName?: string
  redisSecretArn?: string
  redisSecretJsonKey?: string
  redisSsmName?: string
  redisUrl?: string
  planeCBaseUrl?: string
  quoteRefreshQueueUrl?: string
  quoteRefreshQueueMode?: string
  fxRateRefreshQueueUrl?: string
  fxRateRefreshQueueMode?: string
  exportJobQueueUrl?: string
  exportJobQueueMode?: string
  ingestFanoutQueueUrl?: string
  ingestFanoutTier1QueueUrl?: string
  ingestFanoutTier2QueueUrl?: string
  notificationsQueueUrl?: string
  opsAlertsQueueUrl?: string
  goldLiveQueueUrl?: string
  goldLiveQueueMode?: string
  alertEvaluationQueueUrl?: string
  exportsBucketName?: string
  exportsPrefix?: string
  bronzeBucketName?: string
  userAssetsBucketName?: string
  userAssetsPrefix?: string
  enableCloudFront?: boolean
  enableWaf?: boolean
  cloudFrontAccessLogsBucket?: IBucket
  planeADomainName?: string
  planeACertificateArn?: string
  planeAHostedZoneId?: string
  planeAHostedZoneName?: string
  planeAJwtIssuer?: string
  planeAJwtAudiences?: string[]
  enablePlaneAJwtAuth?: boolean
  enablePlaneCIamAuth?: boolean
  disablePlaneAExecuteEndpoint?: boolean
  disablePlaneCExecuteEndpoint?: boolean
  wafAllowListIps?: string[]
  wafBlockListIps?: string[]
  wafStripeWebhookAllowListIps?: string[]
  wafAdminAllowListIps?: string[]
  wafEnableBotControl?: boolean
  otelLambdaLayerArn?: string
  planeAThrottleRate?: number
  planeAThrottleBurst?: number
  planeCThrottleRate?: number
  planeCThrottleBurst?: number
  // Keep Plane A's corridor tiering/freshness logic consistent with Plane B ingestion.
  // When set (typically dev/staging), Plane A should treat all corridors as tier_2.
  planeBDisableTier1?: string
}

export type ApiResources = {
  planeAApi: HttpApi
  planeCApi: HttpApi
  planeAFunction: NodejsFunction
  planeCFunction: NodejsFunction
  planeALambdaDlq: Queue
  planeCLambdaDlq: Queue
  planeACloudFront?: Distribution
  planeAWaf?: CfnWebACL
}

export const PLANE_A_EXPLICIT_EDGE_ROUTE_PATHS = [
  '/healthz',
  '/readyz',
  '/api',
  '/api/v1/quotes/current',
  '/api/v1/providers',
  '/api/v1/providers/metadata',
  '/api/v1/providers/metadata/{id}',
  '/api/v1/quotes/refresh-status',
  '/api/v1/sessions/track',
  '/api/v1/billing/webhook',
  '/api/v1/billing/pricing',
  '/api/v1/corridor-currencies',
  '/api/v1/corridor-limits',
  '/api/v1/rates/spot',
  '/api/v1/rates/providers',
  '/api/v1/rates/history',
  '/api/v1/geo',
  '/api/v1/popular-corridors',
  '/api/v1/contact',
  '/api/v1/pulse/teaser',
  '/api/v1/bank-vs-specialist',
  '/api/v1/alerts/unsubscribe',
  '/api/v1/newsletter/subscribe',
  '/api/v1/newsletter/confirm',
  '/api/v1/newsletter/unsubscribe',
  '/api/v1/newsletter/status',
  '/api/v1/telemetry/search',
  '/api/v1/telemetry/click',
  '/api/v1/telemetry/conversion',
  '/api/v1/telemetry/session',
  '/api/v1/marketing/meta',
  '/api/v1/marketing/tiktok',
  '/api/v1/ads/placement',
  '/api/v1/ads/click',
  '/api/v1/compliance/status',
  '/api/v1/indices/latest',
  '/api/v1/indices/series',
  '/api/v1/indices/corridors',
  '/api/v1/indices/triangulated/{corridorId}',
  '/api/v1/indices/health',
  '/api/v1/indices/headline',
  '/api/v1/indices/methodology',
  '/api/v1/usage',
  '/api/v1/corridors/{corridorId}/coverage',
] as const

export const createApi = (scope: Construct, options: ApiOptions): ApiResources => {
  const completeSecretArnPattern =
    /^arn:aws[a-zA-Z-]*:secretsmanager:[^:]+:\d{12}:secret:[^:]+-[A-Za-z0-9]{6}$/
  const importSecretByRef = (id: string, secretRef: string): ISecret => {
    if (secretRef.startsWith('arn:')) {
      return completeSecretArnPattern.test(secretRef)
        ? Secret.fromSecretCompleteArn(scope, id, secretRef)
        : Secret.fromSecretPartialArn(scope, id, secretRef)
    }
    return Secret.fromSecretNameV2(scope, id, secretRef)
  }

  const logRetention = options.envName === 'prod'
    ? RetentionDays.ONE_MONTH
    : RetentionDays.TWO_WEEKS
  const isDev = options.envName === 'dev'
  const isStaging = options.envName === 'staging'
  const isProd = options.envName === 'prod'
  const enablePlaneCIamAuth =
    options.enablePlaneCIamAuth ?? (options.envName === 'prod' || options.envName === 'staging')
  const cloudwatchMetricsEnabled = resolveCloudWatchMetricsEnabled(options.envName)
  const tracingEnv = resolveTracingEnv({
    envName: options.envName,
    defaultExporter: 'xray',
    defaultEndpoint: options.otelLambdaLayerArn ? 'http://127.0.0.1:4318/v1/traces' : undefined,
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
  const tracingMode = tracingExporter === 'none' ? Tracing.DISABLED : Tracing.ACTIVE
  const newRelicLogsEnabled =
    process.env.NEW_RELIC_LOGS_ENABLED ?? (isProd ? '1' : '0')
  const lambdaSubnets = { subnetType: SubnetType.PRIVATE_WITH_EGRESS }
  const lambdaArchitecture = options.lambdaArchitecture

  const planeAEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    ...tracingEnv,
    NEW_RELIC_LOGS_ENABLED: newRelicLogsEnabled,
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  const privacyHashSalt = (
    process.env.PRIVACY_HASH_SALT ??
    process.env.PLANE_A_PRIVACY_HASH_SALT ??
    ''
  ).trim()
  const privacySessionSalt = (
    process.env.PRIVACY_SESSION_SALT ??
    process.env.PLANE_A_PRIVACY_SESSION_SALT ??
    ''
  ).trim()
  if (privacyHashSalt) {
    planeAEnvironment.PRIVACY_HASH_SALT = privacyHashSalt
  }
  if (privacySessionSalt) {
    planeAEnvironment.PRIVACY_SESSION_SALT = privacySessionSalt
  }
  if (options.publicAdsEnabled !== undefined) {
    planeAEnvironment.PLANE_A_PUBLIC_ADS_ENABLED = options.publicAdsEnabled
    planeAEnvironment.PUBLIC_ENABLE_ADS = options.publicAdsEnabled
    planeAEnvironment.PUBLIC_ADS_ENABLED = options.publicAdsEnabled
  }
  if (options.publicPulseEnabled !== undefined) {
    planeAEnvironment.PLANE_A_PUBLIC_PULSE_ENABLED = options.publicPulseEnabled
    planeAEnvironment.PUBLIC_PULSE_ENABLED = options.publicPulseEnabled
  }
  if (options.publicPulseScreenerEnabled !== undefined) {
    planeAEnvironment.PLANE_A_PUBLIC_PULSE_SCREENER_ENABLED = options.publicPulseScreenerEnabled
    planeAEnvironment.PUBLIC_PULSE_SCREENER_ENABLED = options.publicPulseScreenerEnabled
  }
  if (options.publicEnterpriseEnabled !== undefined) {
    planeAEnvironment.PLANE_A_PUBLIC_ENTERPRISE_ENABLED = options.publicEnterpriseEnabled
    planeAEnvironment.PUBLIC_ENTERPRISE_ENABLED = options.publicEnterpriseEnabled
  }
  const enforceJwtAuth =
    options.enablePlaneAJwtAuth ??
    (options.envName === 'prod' || options.envName === 'staging')
  const jwtIssuer = options.planeAJwtIssuer
    ?? process.env.PLANE_A_JWT_ISSUER
  const jwtAudiences = (options.planeAJwtAudiences ?? [])
    .filter(Boolean)
    .reduce<string[]>((acc, value) => {
      const trimmed = value.trim()
      return trimmed ? [...acc, trimmed] : acc
    }, [])
    .concat(
      (process.env.PLANE_A_JWT_AUDIENCES ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    )
  const resolveBinaryEnv = (value: string | undefined, fallback: '0' | '1'): '0' | '1' => {
    const normalized = value?.trim()
    if (normalized === '0' || normalized === '1') return normalized
    return fallback
  }
  const apiKeyRequirement = resolveBinaryEnv(
    process.env.PLANE_A_REQUIRE_API_KEY,
    enforceJwtAuth ? '1' : '0',
  )
  const requireJwtValue = resolveBinaryEnv(
    process.env.PLANE_A_REQUIRE_JWT,
    enforceJwtAuth ? '1' : '0',
  )

  const dedupJwtAudiences = Array.from(new Set(jwtAudiences))
    .filter((value) => value.trim().length > 0)
    .map((value) => value.trim())
  if (jwtIssuer?.trim()) {
    planeAEnvironment.PLANE_A_JWT_ISSUER = jwtIssuer.trim()
  }
  if (dedupJwtAudiences.length > 0) {
    planeAEnvironment.PLANE_A_JWT_AUDIENCES = dedupJwtAudiences.join(',')
  }
  if (enforceJwtAuth && !planeAEnvironment.PLANE_A_JWT_ISSUER && !options.planeAJwtIssuer) {
    throw new Error('Plane A JWT auth enabled without PLANE_A_JWT_ISSUER')
  }
  if (enforceJwtAuth && dedupJwtAudiences.length === 0 && !options.planeAJwtAudiences) {
    throw new Error('Plane A JWT auth enabled without PLANE_A_JWT_AUDIENCES')
  }
  planeAEnvironment.PLANE_A_REQUIRE_JWT = requireJwtValue
  planeAEnvironment.PLANE_A_REQUIRE_API_KEY = apiKeyRequirement
  if (process.env.PLANE_A_ENABLE_JWT_AUTH === '1') {
    planeAEnvironment.PLANE_A_ENABLE_JWT_AUTH = '1'
  } else if (enforceJwtAuth) {
    planeAEnvironment.PLANE_A_ENABLE_JWT_AUTH = '1'
  }

  Object.assign(planeAEnvironment, collectOandaThrottleEnv())
  const fxRateRefreshEnabled = process.env.FX_RATE_REFRESH_ENABLED
  if (fxRateRefreshEnabled !== undefined) {
    planeAEnvironment.FX_RATE_REFRESH_ENABLED = fxRateRefreshEnabled
  } else if (isDev || isStaging) {
    planeAEnvironment.FX_RATE_REFRESH_ENABLED = '1'
  }
  // Keep dev conservative to avoid exhausting Aurora connections during crashloops/scaling.
  const stageDefaultDbPoolMax = isProd || isStaging ? '8' : (isDev ? '2' : '5')
  const stageDefaultDbPoolMin = isDev ? '0' : '1'
  planeAEnvironment.DB_QUERY_TIMEOUT_MS =
    process.env.DB_QUERY_TIMEOUT_MS || (isDev ? '60000' : '30000')
  planeAEnvironment.DB_CONNECTION_TIMEOUT_MS =
    process.env.DB_CONNECTION_TIMEOUT_MS || (isDev ? '20000' : '10000')
  planeAEnvironment.DB_POOL_MAX =
    process.env.DB_POOL_MAX || stageDefaultDbPoolMax
  planeAEnvironment.DB_POOL_MIN =
    process.env.DB_POOL_MIN || stageDefaultDbPoolMin
  if (options.planeADbHost) {
    planeAEnvironment.PLANE_A_DB_HOST = options.planeADbHost
  }
  if (options.planeADbPort) {
    planeAEnvironment.PLANE_A_DB_PORT = options.planeADbPort
  }
  if (options.planeADbName) {
    planeAEnvironment.PLANE_A_DB_NAME = options.planeADbName
  }
  if (options.ingestFanoutQueueUrl) {
    planeAEnvironment.PLANE_B_INGEST_FANOUT_QUEUE_URL = options.ingestFanoutQueueUrl
  }
  if (options.ingestFanoutTier1QueueUrl) {
    planeAEnvironment.PLANE_B_INGEST_FANOUT_TIER1_QUEUE_URL = options.ingestFanoutTier1QueueUrl
  }
  if (options.ingestFanoutTier2QueueUrl) {
    planeAEnvironment.PLANE_B_INGEST_FANOUT_TIER2_QUEUE_URL = options.ingestFanoutTier2QueueUrl
  }
  if (options.notificationsQueueUrl) {
    planeAEnvironment.PLANE_B_NOTIFICATIONS_QUEUE_URL = options.notificationsQueueUrl
  }
  if (options.opsAlertsQueueUrl) {
    planeAEnvironment.PLANE_B_OPS_ALERT_QUEUE_URL = options.opsAlertsQueueUrl
  }
  if (options.goldLiveQueueUrl) {
    planeAEnvironment.GOLD_LIVE_QUEUE_URL = options.goldLiveQueueUrl
  }
  if (options.goldLiveQueueMode) {
    planeAEnvironment.GOLD_LIVE_QUEUE_MODE = options.goldLiveQueueMode
  }
  if (options.alertEvaluationQueueUrl) {
    planeAEnvironment.ALERT_EVALUATION_QUEUE_URL = options.alertEvaluationQueueUrl
  }
  if (options.bronzeBucketName) {
    planeAEnvironment.BRONZE_S3_BUCKET = options.bronzeBucketName
  }
  if (options.quoteRefreshQueueUrl) {
    planeAEnvironment.QUOTE_REFRESH_QUEUE_URL = options.quoteRefreshQueueUrl
  }
  if (options.quoteRefreshQueueMode) {
    planeAEnvironment.QUOTE_REFRESH_QUEUE_MODE = options.quoteRefreshQueueMode
  }
  if (options.fxRateRefreshQueueUrl) {
    planeAEnvironment.FX_RATE_REFRESH_QUEUE_URL = options.fxRateRefreshQueueUrl
  }
  if (options.fxRateRefreshQueueMode) {
    planeAEnvironment.FX_RATE_REFRESH_QUEUE_MODE = options.fxRateRefreshQueueMode
  }
  if (options.exportJobQueueUrl) {
    planeAEnvironment.EXPORT_JOB_QUEUE_URL = options.exportJobQueueUrl
  }
  if (options.exportJobQueueMode) {
    planeAEnvironment.EXPORT_JOB_QUEUE_MODE = options.exportJobQueueMode
  }
  if (options.exportsBucketName) {
    planeAEnvironment.EXPORTS_S3_BUCKET = options.exportsBucketName
  }
  if (options.exportsPrefix) {
    planeAEnvironment.EXPORTS_S3_PREFIX = options.exportsPrefix
  }
  if (options.userAssetsBucketName) {
    planeAEnvironment.USER_ASSETS_S3_BUCKET = options.userAssetsBucketName
  }
  if (options.userAssetsPrefix) {
    planeAEnvironment.USER_ASSETS_S3_PREFIX = options.userAssetsPrefix
  }
  if (options.planeAAdminEmails && options.planeAAdminEmails.length > 0) {
    planeAEnvironment.PLANE_A_ADMIN_EMAILS = options.planeAAdminEmails.join(',')
  }
  if (options.planeAAdminIpAllowlist && options.planeAAdminIpAllowlist.length > 0) {
    planeAEnvironment.ADMIN_IP_ALLOWLIST = options.planeAAdminIpAllowlist.join(',')
  }
  if (options.planeACorsOrigins && options.planeACorsOrigins.length > 0) {
    planeAEnvironment.PLANE_A_CORS_ORIGINS = options.planeACorsOrigins.join(',')
  }
  if (options.planeACorsAllowedHeaders && options.planeACorsAllowedHeaders.length > 0) {
    planeAEnvironment.PLANE_A_CORS_ALLOWED_HEADERS = options.planeACorsAllowedHeaders.join(',')
  }
  if (options.planeACorsAllowedMethods && options.planeACorsAllowedMethods.length > 0) {
    planeAEnvironment.PLANE_A_CORS_ALLOWED_METHODS = options.planeACorsAllowedMethods.join(',')
  }
  if (options.planeACorsAllowCredentials !== undefined) {
    planeAEnvironment.PLANE_A_CORS_ALLOW_CREDENTIALS = options.planeACorsAllowCredentials
      ? '1'
      : '0'
  }
  if (options.planeAAdminRevocationFailClosed !== undefined) {
    planeAEnvironment.PLANE_A_ADMIN_REVOCATION_FAIL_CLOSED = options.planeAAdminRevocationFailClosed
      ? '1'
      : '0'
  }
  const adminMfaRequired = resolveAdminMfaRequiredEnv(options.envName)
  if (adminMfaRequired !== undefined && adminMfaRequired !== '') {
    planeAEnvironment.ADMIN_MFA_REQUIRED = adminMfaRequired
  }
  if (options.frontendBaseUrl) {
    planeAEnvironment.FRONTEND_BASE_URL = options.frontendBaseUrl
  }
  if (options.planeAB2cMaxBucketDeltaPct !== undefined) {
    planeAEnvironment.PLANE_A_B2C_MAX_BUCKET_DELTA_PCT = String(
      options.planeAB2cMaxBucketDeltaPct,
    )
  }

  const planeCEnvironment: Record<string, string> = {
    ENVIRONMENT: options.envName,
    NODE_ENV: 'production',
    PLANE_C_ENABLE_IAM_AUTH: enablePlaneCIamAuth ? '1' : '0',
    PGSSLMODE: 'require',
    DB_DISABLE_STATEMENT_TIMEOUT: '1',
    ...tracingEnv,
    NEW_RELIC_LOGS_ENABLED: newRelicLogsEnabled,
    CLOUDWATCH_METRICS_ENABLED: cloudwatchMetricsEnabled,
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (privacyHashSalt) {
    planeCEnvironment.PRIVACY_HASH_SALT = privacyHashSalt
  }
  if (privacySessionSalt) {
    planeCEnvironment.PRIVACY_SESSION_SALT = privacySessionSalt
  }
  const cDefaultDbPoolMax = isProd || isStaging ? '8' : '5'
  planeCEnvironment.DB_QUERY_TIMEOUT_MS =
    process.env.DB_QUERY_TIMEOUT_MS || (isDev ? '60000' : '30000')
  planeCEnvironment.DB_CONNECTION_TIMEOUT_MS =
    process.env.DB_CONNECTION_TIMEOUT_MS || (isDev ? '20000' : '10000')
  planeCEnvironment.DB_POOL_MAX =
    process.env.DB_POOL_MAX || cDefaultDbPoolMax
  planeCEnvironment.DB_POOL_MIN =
    process.env.DB_POOL_MIN || '1'

  // Ensure Plane A uses the same tier override as Plane B ingestion when dev/staging disables tier_1.
  // Plane A relies on this env var indirectly via shared corridor tiering logic.
  if (options.planeBDisableTier1) {
    planeAEnvironment.PLANE_B_DISABLE_TIER1 = options.planeBDisableTier1
    planeCEnvironment.PLANE_B_DISABLE_TIER1 = options.planeBDisableTier1
  }

  // Ensure Plane A uses the same tier override as Plane B ingestion when dev/staging disables tier_1.
  // Plane A relies on this env var indirectly via shared corridor tiering logic.
  if (options.planeBDisableTier1) {
    planeAEnvironment.PLANE_B_DISABLE_TIER1 = options.planeBDisableTier1
    planeCEnvironment.PLANE_B_DISABLE_TIER1 = options.planeBDisableTier1
  }

  const otelLambdaLayer = options.otelLambdaLayerArn
    ? LayerVersion.fromLayerVersionArn(scope, 'ApiOtelLambdaLayer', options.otelLambdaLayerArn)
    : undefined
  const sentrySecret = options.sentrySecretArn
    ? importSecretByRef('ApiSentrySecret', options.sentrySecretArn)
    : undefined
  const sentrySecretJsonKey = options.sentrySecretJsonKey
  if (options.planeCDbHost) {
    planeCEnvironment.PLANE_C_DB_HOST = options.planeCDbHost
  }
  if (options.planeCDbPort) {
    planeCEnvironment.PLANE_C_DB_PORT = options.planeCDbPort
  }
  if (options.planeCDbName) {
    planeCEnvironment.PLANE_C_DB_NAME = options.planeCDbName
  }

  let resolvedRedisUrl: string | undefined
  if (options.redisSecretArn) {
    const redisSecret = importSecretByRef('ApiRedisSecret', options.redisSecretArn)
    const redisValue = options.redisSecretJsonKey
      ? redisSecret.secretValueFromJson(options.redisSecretJsonKey)
      : redisSecret.secretValue
    resolvedRedisUrl = redisValue.toString()
  } else if (options.redisSsmName) {
    const redisParam = StringParameter.fromStringParameterName(
      scope,
      'ApiRedisParameter',
      options.redisSsmName,
    )
    resolvedRedisUrl = redisParam.stringValue
  } else if (options.redisUrl) {
    resolvedRedisUrl = options.redisUrl
  }

  if (resolvedRedisUrl) {
    planeAEnvironment.REDIS_URL = resolvedRedisUrl
    planeCEnvironment.REDIS_URL = resolvedRedisUrl
  }

  // Lambda async-invoke DLQs — capture failed invocations that would otherwise be silently lost.
  const planeCDlq = new Queue(scope, 'PlaneCLambdaDlq', {
    queueName: `remit-scout-${options.envName}-plane-c-lambda-dlq`,
    retentionPeriod: Duration.days(14),
  })

  const planeADlq = new Queue(scope, 'PlaneALambdaDlq', {
    queueName: `remit-scout-${options.envName}-plane-a-lambda-dlq`,
    retentionPeriod: Duration.days(14),
  })

  const planeCFunction = new NodejsFunction(scope, 'PlaneCApiFunction', {
    entry: path.resolve(__dirname, '..', '..', '..', 'backend', 'plane-c', 'src', 'lambda.ts'),
    handler: 'handler',
    runtime: Runtime.NODEJS_20_X,
    architecture: lambdaArchitecture,
    memorySize: 1024,
    timeout: Duration.seconds(30),
    reservedConcurrentExecutions: isProd ? 50 : isStaging ? 25 : 10,
    role: options.roles.planeCLambdaRole,
    tracing: tracingMode,
    vpc: options.vpc,
    vpcSubnets: lambdaSubnets,
    allowPublicSubnet: false,
    securityGroups: [options.planeCSecurityGroup],
    environment: planeCEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
    deadLetterQueue: planeCDlq,
  })

  if (sentrySecret) {
    sentrySecret.grantRead(planeCFunction)
    const sentryValue = sentrySecretJsonKey
      ? sentrySecret.secretValueFromJson(sentrySecretJsonKey)
      : sentrySecret.secretValue
    planeCFunction.addEnvironment('SENTRY_DSN', sentryValue.toString())
  }

  if (options.planeCDbSecretArn) {
    const secret = importSecretByRef('PlaneCDbSecret', options.planeCDbSecretArn)
    secret.grantRead(planeCFunction)
    planeCFunction.addEnvironment('PLANE_C_DB_SECRET_ARN', options.planeCDbSecretArn)
  }
  if (options.planeCDbSecretJsonKey) {
    planeCFunction.addEnvironment('PLANE_C_DB_SECRET_JSON_KEY', options.planeCDbSecretJsonKey)
  }
  if (options.planeCDbSsmName) {
    planeCFunction.addEnvironment('PLANE_C_DB_SSM_NAME', options.planeCDbSsmName)
  }
  if (options.redisSecretArn) {
    const secret = importSecretByRef('PlaneCRedisSecret', options.redisSecretArn)
    secret.grantRead(planeCFunction)
    planeCFunction.addEnvironment('REDIS_SECRET_ARN', options.redisSecretArn)
  }
  if (options.redisSecretJsonKey) {
    planeCFunction.addEnvironment('REDIS_SECRET_JSON_KEY', options.redisSecretJsonKey)
  }
  if (options.redisSsmName) {
    planeCFunction.addEnvironment('REDIS_SSM_NAME', options.redisSsmName)
  }
  if (options.sharedSecretArn && options.planeCInternalApiTokenSecretJsonKey) {
    const sharedSecret = importSecretByRef('PlaneCInternalAuthSecret', options.sharedSecretArn)
    sharedSecret.grantRead(planeCFunction)
    const tokenValue = sharedSecret.secretValueFromJson(
      options.planeCInternalApiTokenSecretJsonKey,
    )
    planeCFunction.addEnvironment('PLANE_C_INTERNAL_API_TOKEN', tokenValue.toString())
  }

  if (enablePlaneCIamAuth && !options.disablePlaneCExecuteEndpoint) {
    Annotations.of(scope).addWarning(
      'Plane C IAM auth enabled but execute-api endpoint is still enabled. Consider setting disablePlaneCExecuteEndpoint=true or placing Plane C behind a private domain.',
    )
  }
  const planeCApi = new HttpApi(scope, 'PlaneCHttpApi', {
    apiName: `remit-scout-plane-c-${options.envName}`,
    disableExecuteApiEndpoint: options.disablePlaneCExecuteEndpoint ?? false,
    createDefaultStage: false,
  })
  const planeCIamAuthorizer = enablePlaneCIamAuth
    ? new HttpIamAuthorizer()
    : undefined
  const planeCIntegration = new HttpLambdaIntegration('PlaneCLambdaIntegration', planeCFunction, {
    // Avoid per-route Lambda permissions (resource policy size blow-ups as routes grow).
    scopePermissionToRoute: false,
  })
  planeCApi.addRoutes({
    path: '/{proxy+}',
    methods: [HttpMethod.ANY],
    integration: planeCIntegration,
    authorizer: planeCIamAuthorizer,
  })
  planeCApi.addRoutes({
    path: '/',
    methods: [HttpMethod.ANY],
    integration: planeCIntegration,
    authorizer: planeCIamAuthorizer,
  })

  if (options.planeCBaseUrl) {
    planeAEnvironment.PLANE_C_BASE_URL = options.planeCBaseUrl
  } else if (options.disablePlaneCExecuteEndpoint) {
    throw new Error('planeCBaseUrl is required when disablePlaneCExecuteEndpoint is true')
  } else {
    planeAEnvironment.PLANE_C_BASE_URL = planeCApi.apiEndpoint
  }

  const planeAFunction = new NodejsFunction(scope, 'PlaneAApiFunction', {
    entry: path.resolve(__dirname, '..', '..', '..', 'backend', 'plane-a', 'src', 'lambda.ts'),
    handler: 'handler',
    runtime: Runtime.NODEJS_20_X,
    architecture: lambdaArchitecture,
    memorySize: 1024,
    timeout: Duration.seconds(30),
    reservedConcurrentExecutions: isProd ? 100 : isStaging ? 50 : 25,
    role: options.roles.planeALambdaRole,
    tracing: tracingMode,
    vpc: options.vpc,
    vpcSubnets: lambdaSubnets,
    allowPublicSubnet: false,
    securityGroups: [options.planeASecurityGroup],
    environment: planeAEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
    deadLetterQueue: planeADlq,
  })

  if (sentrySecret) {
    sentrySecret.grantRead(planeAFunction)
    const sentryValue = sentrySecretJsonKey
      ? sentrySecret.secretValueFromJson(sentrySecretJsonKey)
      : sentrySecret.secretValue
    planeAFunction.addEnvironment('SENTRY_DSN', sentryValue.toString())
  }

  if (options.planeADbSecretArn) {
    const secret = importSecretByRef('PlaneADbSecret', options.planeADbSecretArn)
    secret.grantRead(planeAFunction)
    planeAFunction.addEnvironment('PLANE_A_DB_SECRET_ARN', options.planeADbSecretArn)
  }
  if (options.planeADbSecretJsonKey) {
    planeAFunction.addEnvironment('PLANE_A_DB_SECRET_JSON_KEY', options.planeADbSecretJsonKey)
  }
  if (options.planeADbSsmName) {
    planeAFunction.addEnvironment('PLANE_A_DB_SSM_NAME', options.planeADbSsmName)
  }
  if (options.redisSecretArn) {
    const secret = importSecretByRef('PlaneARedisSecret', options.redisSecretArn)
    secret.grantRead(planeAFunction)
    planeAFunction.addEnvironment('REDIS_SECRET_ARN', options.redisSecretArn)
  }
  if (options.redisSecretJsonKey) {
    planeAFunction.addEnvironment('REDIS_SECRET_JSON_KEY', options.redisSecretJsonKey)
  }
  if (options.redisSsmName) {
    planeAFunction.addEnvironment('REDIS_SSM_NAME', options.redisSsmName)
  }
  if (options.supabaseSecretArn) {
    const secret = importSecretByRef('PlaneASupabaseSecret', options.supabaseSecretArn)
    secret.grantRead(planeAFunction)
    planeAFunction.addEnvironment('SUPABASE_SECRET_ARN', options.supabaseSecretArn)
  }
  if (options.supabaseSsmName) {
    planeAFunction.addEnvironment('SUPABASE_SSM_NAME', options.supabaseSsmName)
  }
  if (options.stripeSecretArn) {
    const secret = importSecretByRef('PlaneAStripeSecret', options.stripeSecretArn)
    secret.grantRead(planeAFunction)
    planeAFunction.addEnvironment('STRIPE_SECRET_ARN', options.stripeSecretArn)
  }
  if (options.stripeSsmName) {
    planeAFunction.addEnvironment('STRIPE_SSM_NAME', options.stripeSsmName)
  }
  if (options.sharedSecretArn) {
    const sharedSecret = importSecretByRef('PlaneASharedSecret', options.sharedSecretArn)
    sharedSecret.grantRead(planeAFunction)
    const planeAJwtSecretValue = sharedSecret.secretValueFromJson(
      options.planeAJwtSecretJsonKey ?? 'PLANE_A_JWT_SECRET',
    )
    planeAFunction.addEnvironment('PLANE_A_JWT_SECRET', planeAJwtSecretValue.toString())
  }
  if (options.communicationsSecretArn) {
    const secret = importSecretByRef('PlaneACommunicationsSecret', options.communicationsSecretArn)
    secret.grantRead(planeAFunction)
    const communicationsEnvKeys = [
      'ALERT_UNSUBSCRIBE_SECRET',
      'ALERT_UNSUBSCRIBE_BASE_URL',
      'ALERT_UNSUBSCRIBE_TOKEN_TTL_HOURS',
      'ALERTS_EMAIL_ENABLED',
      'ALERTS_EMAIL_FROM',
      'ALERTS_EMAIL_FROM_NAME',
      'ALERTS_SMS_ENABLED',
      'ALERTS_NOTIFICATION_AUDIT',
      'ALERTS_NOTIFICATION_AUDIT_CONTENT',
      'ALERTS_NOTIFICATION_AUDIT_PII',
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
      planeAFunction.addEnvironment(envKey, secret.secretValueFromJson(envKey).toString())
    }
  }

  const enablePlaneAJwtAuth =
    options.enablePlaneAJwtAuth ??
    (options.envName === 'prod' || options.envName === 'staging')
  const planeJwtAuthorizerIssuer = options.planeAJwtIssuer ?? jwtIssuer
  const supabaseIssuerPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co\/auth\/v1\/?$/i
  const planeAEdgeJwtAuthorizerSupported = !(
    planeJwtAuthorizerIssuer && supabaseIssuerPattern.test(planeJwtAuthorizerIssuer.trim())
  )
  if (enablePlaneAJwtAuth && !planeAEdgeJwtAuthorizerSupported) {
    Annotations.of(scope).addWarning(
      'Plane A edge JWT authorizer disabled for Supabase issuer. AWS HTTP API JWT authorizers require RSA keys, while the current Supabase project publishes ES256 keys. Fastify remains the active JWT enforcement layer.',
    )
  }
  const resolvedJwtAudiences = dedupJwtAudiences
  const planeAJwtAuthorizer = enablePlaneAJwtAuth
    && planeAEdgeJwtAuthorizerSupported
    && planeJwtAuthorizerIssuer
    && dedupJwtAudiences.length > 0
    ? new HttpJwtAuthorizer('PlaneAJwtAuthorizer', planeJwtAuthorizerIssuer, {
      jwtAudience: resolvedJwtAudiences,
    })
    : undefined
  if (enablePlaneAJwtAuth && planeAEdgeJwtAuthorizerSupported && !planeAJwtAuthorizer) {
    const jwtError =
      'Plane A JWT auth enabled but issuer/audience missing. Set planeAJwtIssuer and planeAJwtAudiences.'
    if (options.envName === 'prod' || options.envName === 'staging') {
      throw new Error(jwtError)
    }
    Annotations.of(scope).addError(jwtError)
  }
  if ((options.disablePlaneAExecuteEndpoint ?? false) && (options.enableCloudFront ?? false)) {
    throw new Error('disablePlaneAExecuteEndpoint cannot be true when CloudFront is enabled')
  }

  const planeAApi = new HttpApi(scope, 'PlaneAHttpApi', {
    apiName: `remit-scout-plane-a-${options.envName}`,
    disableExecuteApiEndpoint: options.disablePlaneAExecuteEndpoint ?? false,
    createDefaultStage: false,
  })
  const planeAIntegration = new HttpLambdaIntegration('PlaneALambdaIntegration', planeAFunction, {
    // Avoid per-route Lambda permissions (resource policy size blow-ups as routes grow).
    scopePermissionToRoute: false,
  })

  const publicMetricsEnabled = options.envName === 'dev'
    || process.env.PLANE_A_PUBLIC_METRICS === '1'
  const publicRoutes = [
    ...PLANE_A_EXPLICIT_EDGE_ROUTE_PATHS,
    ...(publicMetricsEnabled ? ['/metrics'] : []),
    ...(isDev
      ? [
          '/api/v1/alerts/corridor-eligibility',
          '/api/v1/alerts/macro-corridors',
        ]
      : []),
  ]

  for (const path of publicRoutes) {
    planeAApi.addRoutes({
      path,
      methods: [HttpMethod.ANY],
      integration: planeAIntegration,
    })
  }

  planeAApi.addRoutes({
    path: '/api/v1/{proxy+}',
    methods: [HttpMethod.ANY],
    integration: planeAIntegration,
    authorizer: planeAJwtAuthorizer,
  })
  planeAApi.addRoutes({
    path: '/api/v1',
    methods: [HttpMethod.ANY],
    integration: planeAIntegration,
    authorizer: planeAJwtAuthorizer,
  })

  planeAApi.addRoutes({
    path: '/{proxy+}',
    methods: [HttpMethod.ANY],
    integration: planeAIntegration,
    authorizer: planeAJwtAuthorizer,
  })
  planeAApi.addRoutes({
    path: '/',
    methods: [HttpMethod.ANY],
    integration: planeAIntegration,
    authorizer: planeAJwtAuthorizer,
  })

  const planeAStage = new HttpStage(scope, 'PlaneAStage', {
    httpApi: planeAApi,
    stageName: '$default',
    autoDeploy: true,
    throttle: {
      rateLimit: options.planeAThrottleRate ?? 50,
      burstLimit: options.planeAThrottleBurst ?? 100,
    },
    detailedMetricsEnabled: true,
  })

  const planeAAccessLogGroup = new LogGroup(scope, 'PlaneAAccessLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/api-gateway-access`,
    retention: options.envName === 'prod' ? RetentionDays.ONE_YEAR : RetentionDays.ONE_MONTH,
    removalPolicy: options.envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  planeAAccessLogGroup.grantWrite(new ServicePrincipal('apigateway.amazonaws.com'))

  // HttpStage does not expose access log settings in the L2 for all configurations; set via L1 override.
  const planeACfnStage = planeAStage.node.defaultChild as CfnStage
  planeACfnStage.accessLogSettings = {
    destinationArn: planeAAccessLogGroup.logGroupArn,
    format: JSON.stringify({
      requestId: '$context.requestId',
      requestTime: '$context.requestTime',
      httpMethod: '$context.httpMethod',
      routeKey: '$context.routeKey',
      status: '$context.status',
      responseLength: '$context.responseLength',
      ip: '$context.identity.sourceIp',
      userAgent: '$context.identity.userAgent',
    }),
  }

  new HttpStage(scope, 'PlaneCStage', {
    httpApi: planeCApi,
    stageName: '$default',
    autoDeploy: true,
    throttle: {
      rateLimit: options.planeCThrottleRate ?? 20,
      burstLimit: options.planeCThrottleBurst ?? 40,
    },
    detailedMetricsEnabled: true,
  })

  let planeAWaf: CfnWebACL | undefined
  let planeACloudFront: Distribution | undefined
  const planeADomainName = options.planeADomainName
  const planeACertificateArn = options.planeACertificateArn
  const enableCloudFront = options.enableCloudFront ?? options.envName === 'prod'
  const enableWaf = options.enableWaf ?? (options.envName === 'prod' || options.envName === 'staging')
  const wafAllowList = options.wafAllowListIps ?? []
  const wafBlockList = options.wafBlockListIps ?? []
  const wafStripeWebhookAllowList = options.wafStripeWebhookAllowListIps ?? []
  const wafAdminAllowList = options.wafAdminAllowListIps ?? []
  const wafEnableBotControl = options.wafEnableBotControl ?? isProd

  if (enableCloudFront) {
    const securityHeadersPolicy = new ResponseHeadersPolicy(scope, 'PlaneASecurityHeaders', {
      securityHeadersBehavior: {
        strictTransportSecurity: {
          accessControlMaxAge: Duration.days(365),
          includeSubdomains: true,
          override: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: HeadersFrameOption.DENY, override: true },
        referrerPolicy: {
          referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
        xssProtection: { protection: true, modeBlock: true, override: true },
      },
    })
    const cloudFrontLoggingConfig = options.cloudFrontAccessLogsBucket
      ? {
          enableLogging: true,
          logBucket: options.cloudFrontAccessLogsBucket,
          logFilePrefix: 'cloudfront/plane-a/',
        }
      : {}

    if (enableWaf) {
      const region = Stack.of(scope).region
      const regionReady = Token.isUnresolved(region) || region === 'us-east-1'

      if (regionReady) {
        const rules: CfnWebACL.RuleProperty[] = []
        const buildPathMatch = (paths: string[]): CfnWebACL.StatementProperty => {
          const statements = paths.map((pathMatch) => ({
            byteMatchStatement: {
              fieldToMatch: { uriPath: {} },
              positionalConstraint: 'STARTS_WITH',
              searchString: pathMatch,
              textTransformations: [{ priority: 0, type: 'NONE' }],
            },
          }))
          if (statements.length === 1) return statements[0]
          return {
            orStatement: {
              statements,
            },
          }
        }
        const withApiPrefixes = (pathMatch: string): string[] => [`/api/v1${pathMatch}`]
        const notIpSet = (ipSetArn: string): CfnWebACL.StatementProperty => ({
          notStatement: {
            statement: {
              ipSetReferenceStatement: { arn: ipSetArn },
            },
          },
        })
        const andStatements = (statements: CfnWebACL.StatementProperty[]): CfnWebACL.StatementProperty => ({
          andStatement: { statements },
        })

        const pushRule = (rule: Omit<CfnWebACL.RuleProperty, 'priority'>): void => {
          rules.push({
            ...rule,
            priority: rules.length,
          })
        }

        if (wafAllowList.length > 0) {
          const allowIpSet = new CfnIPSet(scope, 'PlaneAAllowIpSet', {
            addresses: wafAllowList,
            ipAddressVersion: 'IPV4',
            name: `remit-scout-${options.envName}-allow`,
            scope: 'CLOUDFRONT',
          })
          pushRule({
            name: 'AllowList',
            action: { allow: {} },
            statement: {
              ipSetReferenceStatement: {
                arn: allowIpSet.attrArn,
              },
            },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: `remit-scout-${options.envName}-allow`,
              sampledRequestsEnabled: true,
            },
          })
        }

        if (wafBlockList.length > 0) {
          const blockIpSet = new CfnIPSet(scope, 'PlaneABlockIpSet', {
            addresses: wafBlockList,
            ipAddressVersion: 'IPV4',
            name: `remit-scout-${options.envName}-block`,
            scope: 'CLOUDFRONT',
          })
          pushRule({
            name: 'BlockList',
            action: { block: {} },
            statement: {
              ipSetReferenceStatement: {
                arn: blockIpSet.attrArn,
              },
            },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: `remit-scout-${options.envName}-block`,
              sampledRequestsEnabled: true,
            },
          })
        }

        // Path-scoped IP allowlists (defense-in-depth).
        if (wafStripeWebhookAllowList.length > 0) {
          const stripeIpSet = new CfnIPSet(scope, 'PlaneAStripeWebhookIpSet', {
            addresses: wafStripeWebhookAllowList,
            ipAddressVersion: 'IPV4',
            name: `remit-scout-${options.envName}-stripe-webhook-allow`,
            scope: 'CLOUDFRONT',
          })
          pushRule({
            name: 'StripeWebhookIpAllowlist',
            action: { block: {} },
            statement: andStatements([
              buildPathMatch(withApiPrefixes('/billing/webhook')),
              notIpSet(stripeIpSet.attrArn),
            ]),
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: `remit-scout-${options.envName}-stripe-webhook-allow`,
              sampledRequestsEnabled: true,
            },
          })
        }

        if (wafAdminAllowList.length > 0) {
          const adminIpSet = new CfnIPSet(scope, 'PlaneAAdminIpSet', {
            addresses: wafAdminAllowList,
            ipAddressVersion: 'IPV4',
            name: `remit-scout-${options.envName}-admin-allow`,
            scope: 'CLOUDFRONT',
          })
          pushRule({
            name: 'AdminIpAllowlist',
            action: { block: {} },
            statement: andStatements([
              buildPathMatch([
                ...withApiPrefixes('/admin'),
                ...withApiPrefixes('/ops'),
                ...withApiPrefixes('/audit'),
              ]),
              notIpSet(adminIpSet.attrArn),
            ]),
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: `remit-scout-${options.envName}-admin-allow`,
              sampledRequestsEnabled: true,
            },
          })
        }

        const managedRuleGroups = [
          { name: 'AWSManagedRulesCommonRuleSet', metric: 'common' },
          { name: 'AWSManagedRulesKnownBadInputsRuleSet', metric: 'bad-inputs' },
          { name: 'AWSManagedRulesSQLiRuleSet', metric: 'sqli' },
          { name: 'AWSManagedRulesAmazonIpReputationList', metric: 'ip-reputation' },
        ]

        for (const ruleGroup of managedRuleGroups) {
          pushRule({
            name: ruleGroup.name,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: ruleGroup.name,
              },
            },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: `remit-scout-${options.envName}-${ruleGroup.metric}`,
              sampledRequestsEnabled: true,
            },
          })
        }

        if (wafEnableBotControl) {
          pushRule({
            name: 'AWSManagedRulesBotControlRuleSet',
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesBotControlRuleSet',
              },
            },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: `remit-scout-${options.envName}-bot-control`,
              sampledRequestsEnabled: true,
            },
          })
        }

        const rateLimitRules = [
          {
            name: 'RateLimitContact',
            metric: 'rate-contact',
            limit: 200,
            paths: withApiPrefixes('/contact'),
          },
          {
            name: 'RateLimitNewsletter',
            metric: 'rate-newsletter',
            limit: 200,
            paths: withApiPrefixes('/newsletter'),
          },
          {
            name: 'RateLimitMarketing',
            metric: 'rate-marketing',
            limit: 500,
            paths: withApiPrefixes('/marketing'),
          },
          {
            name: 'RateLimitTelemetry',
            metric: 'rate-telemetry',
            limit: 2000,
            paths: withApiPrefixes('/telemetry'),
          },
          {
            name: 'RateLimitAdminOps',
            metric: 'rate-admin-ops',
            limit: 300,
            paths: [
              ...withApiPrefixes('/admin'),
              ...withApiPrefixes('/ops'),
              ...withApiPrefixes('/audit'),
            ],
          },
        ]

        for (const rateRule of rateLimitRules) {
          pushRule({
            name: rateRule.name,
            action: { block: {} },
            statement: {
              rateBasedStatement: {
                limit: rateRule.limit,
                aggregateKeyType: 'IP',
                scopeDownStatement: buildPathMatch(rateRule.paths),
              },
            },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: `remit-scout-${options.envName}-${rateRule.metric}`,
              sampledRequestsEnabled: true,
            },
          })
        }

        pushRule({
          name: 'RateLimitGlobal',
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `remit-scout-${options.envName}-rate-global`,
            sampledRequestsEnabled: true,
          },
        })

        planeAWaf = new CfnWebACL(scope, 'PlaneAWebAcl', {
          name: `remit-scout-${options.envName}-edge`,
          scope: 'CLOUDFRONT',
          defaultAction: wafAllowList.length > 0 ? { block: {} } : { allow: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `remit-scout-${options.envName}-edge`,
            sampledRequestsEnabled: true,
          },
          rules,
        })

        const wafLogGroup = new LogGroup(scope, 'PlaneAWafLogGroup', {
          logGroupName: `aws-waf-logs-remit-scout-${options.envName}-edge`,
          retention: isProd ? RetentionDays.THREE_MONTHS : (isStaging ? RetentionDays.ONE_MONTH : RetentionDays.TWO_WEEKS),
        })
        if (options.envName !== 'prod') {
          wafLogGroup.applyRemovalPolicy(RemovalPolicy.DESTROY)
        } else {
          wafLogGroup.applyRemovalPolicy(RemovalPolicy.RETAIN)
        }

        new CfnLoggingConfiguration(scope, 'PlaneAWafLogging', {
          resourceArn: planeAWaf.attrArn,
          logDestinationConfigs: [wafLogGroup.logGroupArn],
        })
      } else {
        Annotations.of(scope).addWarning(
          'CloudFront WAF requires stack region us-east-1; set enableWaf=false or deploy edge resources in us-east-1.',
        )
      }
    }

    const apiDomain = Fn.select(2, Fn.split('/', planeAApi.apiEndpoint))
    const origin = new HttpOrigin(apiDomain)

    planeACloudFront = new Distribution(scope, 'PlaneACloudFront', {
      defaultBehavior: {
        origin,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        responseHeadersPolicy: securityHeadersPolicy,
      },
      webAclId: planeAWaf?.attrArn,
      domainNames: planeADomainName ? [planeADomainName] : undefined,
      certificate: planeADomainName && planeACertificateArn
        ? Certificate.fromCertificateArn(scope, 'PlaneACert', planeACertificateArn)
        : undefined,
      comment: `Plane A edge distribution (${options.envName})`,
      ...cloudFrontLoggingConfig,
    })

    if (planeADomainName && !planeACertificateArn) {
      Annotations.of(scope).addWarning(
        'Plane A domain name provided without certificate ARN; CloudFront will use the default domain.',
      )
    }

    if (planeACloudFront && planeADomainName && options.planeAHostedZoneId && options.planeAHostedZoneName) {
      const hostedZone = HostedZone.fromHostedZoneAttributes(scope, 'PlaneAHostedZone', {
        hostedZoneId: options.planeAHostedZoneId,
        zoneName: options.planeAHostedZoneName,
      })
      new ARecord(scope, 'PlaneACloudFrontAlias', {
        zone: hostedZone,
        recordName: planeADomainName,
        target: RecordTarget.fromAlias(new CloudFrontTarget(planeACloudFront)),
      })
    }
  }

  return {
    planeAApi,
    planeCApi,
    planeAFunction,
    planeCFunction,
    planeALambdaDlq: planeADlq,
    planeCLambdaDlq: planeCDlq,
    planeACloudFront,
    planeAWaf,
  }
}
