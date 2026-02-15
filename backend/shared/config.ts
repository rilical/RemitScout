import './load-env'
import './error-extensions'
import { PROVIDER_QUALITY_GATES } from './provider-quality-gates'
import { clampInt, toBoolean, toList, toNumber, toPositiveInt } from './config-helpers'

const toQueueMode = (value: string | undefined) => {
  if (value === 'queue' || value === 'shadow') return value
  return 'off'
}

const toVerifyMode = (value: string | undefined) => {
  if (value === 'jwks' || value === 'remote' || value === 'auto') {
    return value
  }
  return 'auto'
}

const toSupabaseJwksUrl = (baseUrl?: string, explicit?: string) => {
  if (explicit && explicit.trim()) {
    return explicit.trim()
  }
  if (baseUrl && baseUrl.trim()) {
    return `${baseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`
  }
  return ''
}

const isAwsRuntime = Boolean(
  process.env.AWS_EXECUTION_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.AWS_REGION ||
  process.env.ECS_CONTAINER_METADATA_URI ||
  process.env.ECS_CONTAINER_METADATA_URI_V4,
)

const isStaging = process.env.NODE_ENV === 'staging'
const isStrictConfig =
  process.env.NODE_ENV === 'production' || isStaging || toBoolean(process.env.STRICT_CONFIG)

const defaultLocalDbUrl = 'postgres://remit:remit@localhost:5432/remit'
const frontendFallbackUrl = isAwsRuntime ? '' : 'http://localhost:3000'

const getDatabaseUrl = (primary?: string, fallback?: string) => {
  if (primary && primary.trim()) {
    return primary.trim()
  }
  if (!isStrictConfig && fallback && fallback.trim()) {
    return fallback.trim()
  }
  return ''
}

const buildPostgresUrlFromParts = (parts: {
  username?: string
  password?: string
  host?: string
  port?: string
  dbName?: string
  sslMode?: string
}): string => {
  const username = parts.username?.trim()
  const password = parts.password?.trim()
  const host = parts.host?.trim()
  const port = parts.port?.trim()
  const dbName = parts.dbName?.trim()

  if (!username || !password || !host || !port || !dbName) {
    return ''
  }

  const encodedUser = encodeURIComponent(username)
  const encodedPass = encodeURIComponent(password)
  const baseUrl = `postgresql://${encodedUser}:${encodedPass}@${host}:${port}/${dbName}`
  const sslMode = parts.sslMode?.trim()
  if (!sslMode) return baseUrl

  const delimiter = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${delimiter}sslmode=${encodeURIComponent(sslMode)}`
}

type ProviderLimits = {
  rpm: number
  concurrency: number
  perCorridorRpm: number
}

const resolveProviderHttpLimits = (
  envPrefix: string,
  defaults: ProviderLimits = { rpm: 12, concurrency: 2, perCorridorRpm: 4 },
): ProviderLimits => {
  const rpm = toNumber(process.env[`${envPrefix}_RPM`], defaults.rpm)
  const concurrency = toNumber(process.env[`${envPrefix}_CONCURRENCY`], defaults.concurrency)
  const perCorridorRpm = toNumber(
    process.env[`${envPrefix}_CORRIDOR_RPM`],
    defaults.perCorridorRpm,
  )
  return { rpm, concurrency, perCorridorRpm }
}

const resolveProviderPlaywrightLimits = (
  envPrefix: string,
  defaults: ProviderLimits = { rpm: 4, concurrency: 1, perCorridorRpm: 2 },
): ProviderLimits => {
  const rpm = toNumber(process.env[`${envPrefix}_PLAYWRIGHT_RPM`], defaults.rpm)
  const concurrency = toNumber(
    process.env[`${envPrefix}_PLAYWRIGHT_CONCURRENCY`],
    defaults.concurrency,
  )
  const perCorridorRpm = toNumber(
    process.env[`${envPrefix}_PLAYWRIGHT_CORRIDOR_RPM`],
    defaults.perCorridorRpm,
  )
  return { rpm, concurrency, perCorridorRpm }
}

type Primitive = null | undefined | string | number | boolean | symbol | bigint
export type DeepReadonly<T> =
  T extends Primitive
    ? T
    : T extends (infer U)[]
      ? ReadonlyArray<DeepReadonly<U>>
      : T extends (...args: never[]) => unknown
        ? T
        : { readonly [K in keyof T]: DeepReadonly<T[K]> }

const deepFreeze = <T>(obj: T): DeepReadonly<T> => {
  if (obj === null || obj === undefined) return obj as DeepReadonly<T>
  if (typeof obj !== 'object') return obj as DeepReadonly<T>
  if (Object.isFrozen(obj)) return obj as DeepReadonly<T>

  for (const key of Object.getOwnPropertyNames(obj)) {
    const value = (obj as Record<string, unknown>)[key]
    deepFreeze(value)
  }

  return Object.freeze(obj) as DeepReadonly<T>
}

const env = process.env.NODE_ENV || 'development'

const rawConfig = {
  env,
  envName: process.env.ENVIRONMENT || '',
  runtime: {
    readOnly: toBoolean(process.env.READ_ONLY_MODE),
    isAwsRuntime,
    isStaging,
    isStrictConfig,
    isLambda: Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME),
    isEcs: Boolean(
      process.env.ECS_CONTAINER_METADATA_URI || process.env.ECS_CONTAINER_METADATA_URI_V4,
    ),
    // Snapshot environment-derived AWS metadata so the rest of the codebase can avoid direct
    // `process.env` reads (enforced by lint). Values are stable per container.
    ecsMetadataUri: process.env.ECS_CONTAINER_METADATA_URI || '',
    ecsMetadataUriV4: process.env.ECS_CONTAINER_METADATA_URI_V4 || '',
    lambdaFunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME || '',
    lambdaFunctionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION || '',
    lambdaFunctionArn: process.env.AWS_LAMBDA_FUNCTION_ARN || '',
    ecsTaskArn: process.env.ECS_TASK_ARN || '',
    ecsContainerName: process.env.ECS_CONTAINER_NAME || '',
    awsAccountId: process.env.AWS_ACCOUNT_ID || '',
  },
  build: {
    // Prefer explicit version in deploys; fall back to npm injected var when present.
    version: process.env.APP_VERSION || process.env.npm_package_version || '',
  },
  logging: {
    level: process.env.LOG_LEVEL || '',
  },
  aws: {
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '',
    sesRegion:
      process.env.SES_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
    snsRegion:
      process.env.SNS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
  },
  providerQualityGates: PROVIDER_QUALITY_GATES,
  planeA: {
    port: toNumber(process.env.PLANE_A_PORT, 4000),
    rateLimitMax: toNumber(process.env.PLANE_A_RATE_LIMIT_MAX, 120),
    rateLimitWindowMs: toNumber(process.env.PLANE_A_RATE_LIMIT_WINDOW_MS, 60000),
    enterpriseApiRateLimitMax: toNumber(process.env.PLANE_A_ENTERPRISE_API_RATE_LIMIT_MAX, 600),
    enterpriseApiRateLimitWindowMs: toNumber(process.env.PLANE_A_ENTERPRISE_API_RATE_LIMIT_WINDOW_MS, 60000),
    enterpriseApiKeyMax: toNumber(process.env.PLANE_A_ENTERPRISE_API_KEY_MAX, 5),
    requireApiKey: toBoolean(process.env.PLANE_A_REQUIRE_API_KEY),
    requireJwt: toBoolean(process.env.PLANE_A_REQUIRE_JWT),
    apiKeys: (process.env.PLANE_A_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean),
    jwtSecret: process.env.PLANE_A_JWT_SECRET || '',
    planeCBaseUrl: process.env.PLANE_C_BASE_URL || (isStrictConfig ? '' : 'http://localhost:4100'),
    adminEmails: (process.env.PLANE_A_ADMIN_EMAILS || '')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean),
    b2c: {
      cacheTtlSeconds: toNumber(process.env.PLANE_A_B2C_CACHE_TTL_SECONDS, 900),
      jitterMs: toNumber(process.env.PLANE_A_B2C_JITTER_MS, 300),
      fxRateCacheTtlSeconds: toNumber(process.env.PLANE_A_FX_RATE_CACHE_TTL_SECONDS, 300),
      latestQuoteCacheTtlSeconds: toNumber(process.env.PLANE_A_LATEST_QUOTE_CACHE_TTL_SECONDS, 15),
      maxQuoteAgeSeconds: toNumber(process.env.PLANE_A_B2C_MAX_QUOTE_AGE_SECONDS, 1800),
      maxBucketDeltaPct: toNumber(process.env.PLANE_A_B2C_MAX_BUCKET_DELTA_PCT, 0),
      providerWeightedMidMarketEnabled: toBoolean(
        process.env.PLANE_A_B2C_PROVIDER_WEIGHTED_MID_MARKET,
      ),
    },
    cors: {
      origins: toList(process.env.PLANE_A_CORS_ORIGINS),
      allowedHeaders: toList(process.env.PLANE_A_CORS_ALLOWED_HEADERS),
      allowedMethods: toList(process.env.PLANE_A_CORS_ALLOWED_METHODS),
      allowCredentials: toBoolean(process.env.PLANE_A_CORS_ALLOW_CREDENTIALS),
    },
    smartAlerts: {
      enabled: toBoolean(
        process.env.PLANE_A_SMART_ALERTS_ENABLED,
        env !== 'production' && env !== 'staging',
      ),
      intervalMinutes: toNumber(process.env.PLANE_A_SMART_ALERTS_INTERVAL_MINUTES, 15),
    },
    swagger: {
      enabled: isAwsRuntime ? toBoolean(process.env.SWAGGER_ENABLED) : true,
      apiGatewayUrl:
        process.env.API_GATEWAY_URL ||
        process.env.API_BASE_URL ||
        (process.env.AWS_REGION && process.env.API_ID
          ? `https://${process.env.API_ID}.execute-api.${process.env.AWS_REGION}.amazonaws.com`
          : ''),
      apiId: process.env.API_ID || '',
    },
  },
  planeC: {
    port: toNumber(process.env.PLANE_C_PORT, 4100),
  },
  planeB: {
    useSeedData: toBoolean(process.env.PLANE_B_USE_SEED_DATA),
    ingest: {
      loopEnabled: toBoolean(process.env.PLANE_B_INGEST_LOOP),
      loopIntervalSeconds: toNumber(process.env.PLANE_B_INGEST_LOOP_INTERVAL_SECONDS, 60),
      ingestFanoutMessageMode: (process.env.PLANE_B_INGEST_FANOUT_MESSAGE_MODE || 'corridor')
        .toLowerCase()
        .trim(),
      b2bCorridorProviderBatchSize: toPositiveInt(
        process.env.PLANE_B_B2B_CORRIDOR_PROVIDER_BATCH_SIZE,
        0,
      ),
      healthEnabled: toBoolean(process.env.PLANE_B_HEALTH_ENABLED, true),
    },
    b2bSweepIntervalMinutes: toNumber(process.env.PLANE_B_B2B_SWEEP_INTERVAL_MINUTES, 15),
    b2bTargetMinutes: toNumber(process.env.PLANE_B_B2B_TARGET_MINUTES, 180),
    b2bMaxTargetMinutes: toNumber(process.env.PLANE_B_B2B_MAX_TARGET_MINUTES, 1440),
    b2bMaxQueueDepth: toNumber(process.env.PLANE_B_B2B_MAX_QUEUE_DEPTH, 5000),
    b2bMaxQueueAgeSeconds: toNumber(process.env.PLANE_B_B2B_MAX_QUEUE_AGE_SECONDS, 0),
    b2bDrainMode: toBoolean(process.env.PLANE_B_B2B_DRAIN_MODE),
    b2bMinShards: toNumber(process.env.PLANE_B_B2B_MIN_SHARDS, 0),
    b2bMaxCorridorsPerShard: toNumber(process.env.PLANE_B_B2B_MAX_CORRIDORS_PER_SHARD, 250),
    b2bFreshnessSloMinutes: toNumber(process.env.PLANE_B_B2B_FRESHNESS_SLO_MINUTES, 30),
    b2bFreshnessSloEnabled: toBoolean(process.env.PLANE_B_B2B_FRESHNESS_SLO_ENABLED),
    b2bFreshnessChunkSize: toNumber(process.env.PLANE_B_B2B_FRESHNESS_CHUNK_SIZE, 250),
    b2bSweepTaskInsertChunkSize: toNumber(
      process.env.PLANE_B_B2B_SWEEP_TASK_INSERT_CHUNK_SIZE,
      250,
    ),
    b2bSweepTaskInsertMaxRetries: toNumber(
      process.env.PLANE_B_B2B_SWEEP_TASK_INSERT_MAX_RETRIES,
      2,
    ),
    b2bNativeCurrencyOnly: toBoolean(process.env.PLANE_B_B2B_NATIVE_CURRENCY_ONLY ?? '1'),
    b2bWiseCurrencyOverride: toBoolean(process.env.PLANE_B_B2B_WISE_CURRENCY_OVERRIDE),
    b2bTierVersion: process.env.PLANE_B_B2B_TIER_VERSION?.trim() || '0',
    b2bRpmSafetyFactor: toNumber(process.env.PLANE_B_B2B_RPM_SAFETY_FACTOR, 0.7),
    b2bRpmMultiplier: toNumber(process.env.PLANE_B_B2B_RPM_MULTIPLIER, 2),
    b2bPerCorridorRpmMultiplier: toNumber(
      process.env.PLANE_B_B2B_CORRIDOR_RPM_MULTIPLIER,
      2,
    ),
    circuitOpenMs: toNumber(process.env.PLANE_B_CIRCUIT_OPEN_MS, 300000),
    circuitHalfOpenMs: toNumber(process.env.PLANE_B_CIRCUIT_HALF_OPEN_MS, 60000),
    blockCooldownMs: toNumber(process.env.PLANE_B_BLOCK_COOLDOWN_MS, 86400000),
    remitly: {
      delayMs: toNumber(process.env.PLANE_B_REMITLY_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_REMITLY_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_REMITLY_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_REMITLY_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_REMITLY_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_REMITLY_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_REMITLY_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_REMITLY_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_REMITLY_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_REMITLY_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_REMITLY_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_REMITLY_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_REMITLY_FRESHNESS_SLO_ENABLED),
    },
    wise: {
      delayMs: toNumber(process.env.PLANE_B_WISE_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_WISE_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_WISE_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_WISE_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_WISE_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_WISE_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_WISE_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_WISE_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_WISE_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_WISE_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_WISE_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_WISE_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_WISE_FRESHNESS_SLO_ENABLED),
    },
    xe: {
      delayMs: toNumber(process.env.PLANE_B_XE_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_XE_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_XE_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_XE_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_XE_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_XE_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_XE_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_XE_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_XE_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_XE_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_XE_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_XE_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_XE_FRESHNESS_SLO_ENABLED),
    },
    transfergo: {
      delayMs: toNumber(process.env.PLANE_B_TRANSFERGO_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_TRANSFERGO_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_TRANSFERGO_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_TRANSFERGO_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_TRANSFERGO_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_TRANSFERGO_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_TRANSFERGO_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_TRANSFERGO_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_TRANSFERGO_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_TRANSFERGO_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_TRANSFERGO_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_TRANSFERGO_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_TRANSFERGO_FRESHNESS_SLO_ENABLED),
    },
    paysend: {
      delayMs: toNumber(process.env.PLANE_B_PAYSEND_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_PAYSEND_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_PAYSEND_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_PAYSEND_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_PAYSEND_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_PAYSEND_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_PAYSEND_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_PAYSEND_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_PAYSEND_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_PAYSEND_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_PAYSEND_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_PAYSEND_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_PAYSEND_FRESHNESS_SLO_ENABLED),
    },
    pangea: {
      delayMs: toNumber(process.env.PLANE_B_PANGEA_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_PANGEA_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_PANGEA_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_PANGEA_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_PANGEA_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_PANGEA_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_PANGEA_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_PANGEA_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_PANGEA_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_PANGEA_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_PANGEA_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_PANGEA_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_PANGEA_FRESHNESS_SLO_ENABLED),
    },
    orbitremit: {
      delayMs: toNumber(process.env.PLANE_B_ORBITREMIT_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_ORBITREMIT_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_ORBITREMIT_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_ORBITREMIT_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_ORBITREMIT_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_ORBITREMIT_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_ORBITREMIT_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_ORBITREMIT_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_ORBITREMIT_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_ORBITREMIT_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_ORBITREMIT_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_ORBITREMIT_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_ORBITREMIT_FRESHNESS_SLO_ENABLED),
    },
    bossmoney: {
      delayMs: toNumber(process.env.PLANE_B_BOSSMONEY_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_BOSSMONEY_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_BOSSMONEY_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_BOSSMONEY_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_BOSSMONEY_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_BOSSMONEY_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_BOSSMONEY_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_BOSSMONEY_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_BOSSMONEY_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_BOSSMONEY_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_BOSSMONEY_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_BOSSMONEY_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_BOSSMONEY_FRESHNESS_SLO_ENABLED),
      stateCode: process.env.PLANE_B_BOSSMONEY_STATE_CODE ?? 'NJ',
    },
    worldremit: {
      delayMs: toNumber(process.env.PLANE_B_WORLDREMIT_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_WORLDREMIT_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_WORLDREMIT_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_WORLDREMIT_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_WORLDREMIT_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_WORLDREMIT_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_WORLDREMIT_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_WORLDREMIT_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_WORLDREMIT_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_WORLDREMIT_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_WORLDREMIT_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_WORLDREMIT_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_WORLDREMIT_FRESHNESS_SLO_ENABLED),
    },
    westernunion: {
      delayMs: toNumber(process.env.PLANE_B_WESTERNUNION_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_WESTERNUNION_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_WESTERNUNION_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_WESTERNUNION_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_WESTERNUNION_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_WESTERNUNION_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_WESTERNUNION_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_WESTERNUNION_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_WESTERNUNION_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_WESTERNUNION_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_WESTERNUNION_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_WESTERNUNION_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_WESTERNUNION_FRESHNESS_SLO_ENABLED),
    },
    xoom: {
      delayMs: toNumber(process.env.PLANE_B_XOOM_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_XOOM_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_XOOM_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_XOOM_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_XOOM_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_XOOM_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_XOOM_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_XOOM_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_XOOM_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_XOOM_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_XOOM_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_XOOM_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_XOOM_FRESHNESS_SLO_ENABLED),
    },
    instarem: {
      delayMs: toNumber(process.env.PLANE_B_INSTAREM_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_INSTAREM_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_INSTAREM_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_INSTAREM_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_INSTAREM_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_INSTAREM_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_INSTAREM_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_INSTAREM_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_INSTAREM_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_INSTAREM_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_INSTAREM_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_INSTAREM_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_INSTAREM_FRESHNESS_SLO_ENABLED),
    },
    wirebarley: {
      delayMs: toNumber(process.env.PLANE_B_WIREBARLEY_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_WIREBARLEY_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_WIREBARLEY_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_WIREBARLEY_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_WIREBARLEY_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_WIREBARLEY_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_WIREBARLEY_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_WIREBARLEY_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_WIREBARLEY_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_WIREBARLEY_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_WIREBARLEY_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_WIREBARLEY_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_WIREBARLEY_FRESHNESS_SLO_ENABLED),
    },
    alansari: {
      delayMs: toNumber(process.env.PLANE_B_ALANSARI_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_ALANSARI_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_ALANSARI_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_ALANSARI_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_ALANSARI_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_ALANSARI_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_ALANSARI_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_ALANSARI_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_ALANSARI_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_ALANSARI_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_ALANSARI_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_ALANSARI_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_ALANSARI_FRESHNESS_SLO_ENABLED),
    },
    intermex: {
      delayMs: toNumber(process.env.PLANE_B_INTERMEX_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_INTERMEX_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_INTERMEX_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_INTERMEX_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_INTERMEX_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_INTERMEX_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_INTERMEX_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_INTERMEX_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_INTERMEX_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_INTERMEX_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_INTERMEX_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_INTERMEX_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_INTERMEX_FRESHNESS_SLO_ENABLED),
    },
    koronapay: {
      delayMs: toNumber(process.env.PLANE_B_KORONAPAY_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_KORONAPAY_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_KORONAPAY_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_KORONAPAY_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_KORONAPAY_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_KORONAPAY_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_KORONAPAY_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_KORONAPAY_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_KORONAPAY_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_KORONAPAY_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_KORONAPAY_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_KORONAPAY_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_KORONAPAY_FRESHNESS_SLO_ENABLED),
    },
    remitbee: {
      delayMs: toNumber(process.env.PLANE_B_REMITBEE_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_REMITBEE_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_REMITBEE_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_REMITBEE_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_REMITBEE_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_REMITBEE_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_REMITBEE_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_REMITBEE_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_REMITBEE_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_REMITBEE_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_REMITBEE_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_REMITBEE_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_REMITBEE_FRESHNESS_SLO_ENABLED),
      proxyTier: process.env.PLANE_B_REMITBEE_PROXY_TIER || '',
      proxyTierFallback: process.env.PLANE_B_REMITBEE_PROXY_TIER_FALLBACK || '',
      sessionCookie: process.env.PLANE_B_REMITBEE_SESSION_COOKIE || '',
      sessionWarmupUrl: process.env.PLANE_B_REMITBEE_SESSION_WARMUP_URL || 'https://www.remitbee.com/',
      sessionTtlMs: toNumber(process.env.PLANE_B_REMITBEE_SESSION_TTL_MS, 1800000),
    },
    singx: {
      delayMs: toNumber(process.env.PLANE_B_SINGX_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_SINGX_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_SINGX_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_SINGX_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_SINGX_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_SINGX_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_SINGX_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_SINGX_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_SINGX_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_SINGX_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_SINGX_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_SINGX_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_SINGX_FRESHNESS_SLO_ENABLED),
    },
    placid: {
      delayMs: toNumber(process.env.PLANE_B_PLACID_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_PLACID_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_PLACID_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_PLACID_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_PLACID_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_PLACID_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_PLACID_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_PLACID_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_PLACID_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_PLACID_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_PLACID_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_PLACID_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_PLACID_FRESHNESS_SLO_ENABLED),
      proxyTier: process.env.PLANE_B_PLACID_PROXY_TIER || '',
      proxyTierFallback: process.env.PLANE_B_PLACID_PROXY_TIER_FALLBACK || '',
      sessionCookie: process.env.PLANE_B_PLACID_SESSION_COOKIE || '',
      sessionWarmupUrl: process.env.PLANE_B_PLACID_SESSION_WARMUP_URL || 'https://www.placid.net/',
      sessionTtlMs: toNumber(process.env.PLANE_B_PLACID_SESSION_TTL_MS, 1800000),
    },
    ria: {
      delayMs: toNumber(process.env.PLANE_B_RIA_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_RIA_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_RIA_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_RIA_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_RIA_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_RIA_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_RIA_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_RIA_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_RIA_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_RIA_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_RIA_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_RIA_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_RIA_FRESHNESS_SLO_ENABLED),
    },
    dahabshiil: {
      delayMs: toNumber(process.env.PLANE_B_DAHABSHIIL_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_DAHABSHIIL_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_DAHABSHIIL_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_DAHABSHIIL_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_DAHABSHIIL_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_DAHABSHIIL_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_DAHABSHIIL_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_DAHABSHIIL_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_DAHABSHIIL_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_DAHABSHIIL_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_DAHABSHIIL_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_DAHABSHIIL_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_DAHABSHIIL_FRESHNESS_SLO_ENABLED),
    },
    sendwave: {
      delayMs: toNumber(process.env.PLANE_B_SENDWAVE_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_SENDWAVE_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_SENDWAVE_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_SENDWAVE_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_SENDWAVE_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_SENDWAVE_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_SENDWAVE_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_SENDWAVE_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_SENDWAVE_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_SENDWAVE_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_SENDWAVE_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_SENDWAVE_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_SENDWAVE_FRESHNESS_SLO_ENABLED),
    },
    mukuru: {
      delayMs: toNumber(process.env.PLANE_B_MUKURU_DELAY_MS, 1500),
      jitterMs: toNumber(process.env.PLANE_B_MUKURU_JITTER_MS, 600),
      rateLimitBackoffMs: toNumber(process.env.PLANE_B_MUKURU_RATE_LIMIT_BACKOFF_MS, 5000),
      rateLimitJitterMs: toNumber(process.env.PLANE_B_MUKURU_RATE_LIMIT_JITTER_MS, 2000),
      rateLimitMaxRetries: toNumber(process.env.PLANE_B_MUKURU_RATE_LIMIT_MAX_RETRIES, 2),
      corridorDelayMs: toNumber(process.env.PLANE_B_MUKURU_CORRIDOR_DELAY_MS, 2000),
      corridorJitterMs: toNumber(process.env.PLANE_B_MUKURU_CORRIDOR_JITTER_MS, 1000),
      b2bAmount: toNumber(process.env.PLANE_B_MUKURU_B2B_AMOUNT, 500),
      blockCooldownMs: toNumber(process.env.PLANE_B_MUKURU_BLOCK_COOLDOWN_MS, 3600000),
      sweepShardIndex: toNumber(process.env.PLANE_B_MUKURU_SWEEP_SHARD_INDEX, 0),
      sweepShardCount: toNumber(process.env.PLANE_B_MUKURU_SWEEP_SHARD_COUNT, 1),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_MUKURU_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_MUKURU_FRESHNESS_SLO_ENABLED),
    },
    b2cRefreshBatchLimit: toNumber(process.env.PLANE_B_B2C_REFRESH_BATCH_LIMIT, 50),
    b2cRefreshMaxRetries: toNumber(process.env.PLANE_B_B2C_REFRESH_MAX_RETRIES, 3),
    b2cRefreshConcurrency: toNumber(process.env.PLANE_B_B2C_REFRESH_CONCURRENCY, 5),
    b2cQueueInSweep: toBoolean(process.env.PLANE_B_B2C_QUEUE_IN_SWEEP, !isAwsRuntime),
    b2cLiveRpm: toNumber(process.env.PLANE_B_B2C_LIVE_RPM, 0),
    b2cLivePerCorridorRpm: toNumber(process.env.PLANE_B_B2C_LIVE_CORRIDOR_RPM, 0),
    disableTier1: toBoolean(process.env.PLANE_B_DISABLE_TIER1),
    providerLimits: {
      http: {
        alansari: resolveProviderHttpLimits('PLANE_B_ALANSARI', {
          rpm: 20,
          concurrency: 1,
          perCorridorRpm: 4,
        }),
        bossmoney: resolveProviderHttpLimits('PLANE_B_BOSSMONEY', {
          rpm: 6,
          concurrency: 1,
          perCorridorRpm: 2,
        }),
        dahabshiil: resolveProviderHttpLimits('PLANE_B_DAHABSHIIL', {
          rpm: 6,
          concurrency: 1,
          perCorridorRpm: 2,
        }),
        instarem: resolveProviderHttpLimits('PLANE_B_INSTAREM', {
          rpm: 30,
          concurrency: 2,
          perCorridorRpm: 6,
        }),
        intermex: resolveProviderHttpLimits('PLANE_B_INTERMEX', {
          rpm: 20,
          concurrency: 1,
          perCorridorRpm: 4,
        }),
        koronapay: resolveProviderHttpLimits('PLANE_B_KORONAPAY', {
          rpm: 20,
          concurrency: 2,
          perCorridorRpm: 4,
        }),
        mukuru: resolveProviderHttpLimits('PLANE_B_MUKURU', {
          rpm: 6,
          concurrency: 1,
          perCorridorRpm: 2,
        }),
        orbitremit: resolveProviderHttpLimits('PLANE_B_ORBITREMIT', {
          rpm: 6,
          concurrency: 1,
          perCorridorRpm: 2,
        }),
        pangea: resolveProviderHttpLimits('PLANE_B_PANGEA', {
          rpm: 6,
          concurrency: 1,
          perCorridorRpm: 2,
        }),
        paysend: resolveProviderHttpLimits('PLANE_B_PAYSEND', {
          rpm: 6,
          concurrency: 1,
          perCorridorRpm: 2,
        }),
        placid: resolveProviderHttpLimits('PLANE_B_PLACID', {
          rpm: 20,
          concurrency: 2,
          perCorridorRpm: 4,
        }),
        remitbee: resolveProviderHttpLimits('PLANE_B_REMITBEE', {
          rpm: 20,
          concurrency: 2,
          perCorridorRpm: 4,
        }),
        remitly: resolveProviderHttpLimits('PLANE_B_REMITLY'),
        ria: resolveProviderHttpLimits('PLANE_B_RIA', {
          rpm: 6,
          concurrency: 1,
          perCorridorRpm: 2,
        }),
        sendwave: resolveProviderHttpLimits('PLANE_B_SENDWAVE', {
          rpm: 6,
          concurrency: 1,
          perCorridorRpm: 2,
        }),
        singx: resolveProviderHttpLimits('PLANE_B_SINGX', {
          rpm: 20,
          concurrency: 2,
          perCorridorRpm: 4,
        }),
        transfergo: resolveProviderHttpLimits('PLANE_B_TRANSFERGO', {
          rpm: 8,
          concurrency: 2,
          perCorridorRpm: 3,
        }),
        wellsfargo: resolveProviderHttpLimits('PLANE_B_WELLSFARGO', {
          rpm: 6,
          concurrency: 1,
          perCorridorRpm: 2,
        }),
        westernunion: resolveProviderHttpLimits('PLANE_B_WESTERNUNION'),
        wirebarley: resolveProviderHttpLimits('PLANE_B_WIREBARLEY', {
          rpm: 20,
          concurrency: 1,
          perCorridorRpm: 4,
        }),
        wise: resolveProviderHttpLimits('PLANE_B_WISE', { rpm: 30, concurrency: 2, perCorridorRpm: 2 }),
        worldremit: resolveProviderHttpLimits('PLANE_B_WORLDREMIT', {
          rpm: 10,
          concurrency: 1,
          perCorridorRpm: 3,
        }),
        xe: resolveProviderHttpLimits('PLANE_B_XE'),
        xoom: resolveProviderHttpLimits('PLANE_B_XOOM'),
      },
      playwright: {
        alansari: resolveProviderPlaywrightLimits('PLANE_B_ALANSARI'),
        bossmoney: resolveProviderPlaywrightLimits('PLANE_B_BOSSMONEY'),
        dahabshiil: resolveProviderPlaywrightLimits('PLANE_B_DAHABSHIIL'),
        instarem: resolveProviderPlaywrightLimits('PLANE_B_INSTAREM'),
        intermex: resolveProviderPlaywrightLimits('PLANE_B_INTERMEX'),
        koronapay: resolveProviderPlaywrightLimits('PLANE_B_KORONAPAY'),
        mukuru: resolveProviderPlaywrightLimits('PLANE_B_MUKURU'),
        orbitremit: resolveProviderPlaywrightLimits('PLANE_B_ORBITREMIT'),
        pangea: resolveProviderPlaywrightLimits('PLANE_B_PANGEA'),
        paysend: resolveProviderPlaywrightLimits('PLANE_B_PAYSEND'),
        placid: resolveProviderPlaywrightLimits('PLANE_B_PLACID'),
        remitbee: resolveProviderPlaywrightLimits('PLANE_B_REMITBEE'),
        remitly: resolveProviderPlaywrightLimits('PLANE_B_REMITLY'),
        ria: resolveProviderPlaywrightLimits('PLANE_B_RIA'),
        sendwave: resolveProviderPlaywrightLimits('PLANE_B_SENDWAVE'),
        singx: resolveProviderPlaywrightLimits('PLANE_B_SINGX'),
        transfergo: resolveProviderPlaywrightLimits('PLANE_B_TRANSFERGO'),
        wellsfargo: resolveProviderPlaywrightLimits('PLANE_B_WELLSFARGO'),
        westernunion: resolveProviderPlaywrightLimits('PLANE_B_WESTERNUNION'),
        wirebarley: resolveProviderPlaywrightLimits('PLANE_B_WIREBARLEY'),
        wise: resolveProviderPlaywrightLimits('PLANE_B_WISE'),
        worldremit: resolveProviderPlaywrightLimits('PLANE_B_WORLDREMIT'),
        xe: resolveProviderPlaywrightLimits('PLANE_B_XE'),
        xoom: resolveProviderPlaywrightLimits('PLANE_B_XOOM'),
      },
    },
  },
  fxRates: {
    oandaFallbackEnabled: toBoolean(process.env.FX_RATE_OANDA_FALLBACK),
    refreshEnabled: toBoolean(process.env.FX_RATE_REFRESH_ENABLED),
    cacheTtlSeconds: toNumber(process.env.FX_RATE_CACHE_TTL_SECONDS, 300),
    historyCacheTtlSeconds: toNumber(process.env.FX_RATE_HISTORY_CACHE_TTL_SECONDS, 3600),
    dbFreshnessHours: toNumber(process.env.FX_RATE_DB_FRESHNESS_HOURS, 1),
    historyDays: toNumber(process.env.FX_RATE_HISTORY_DAYS, 30),
    syncIntervalMinutes: toNumber(process.env.OANDA_SYNC_INTERVAL_MINUTES, 60),
    useAuthenticatedApi: toBoolean(process.env.OANDA_USE_AUTHENTICATED_API),
    apiKey: process.env.OANDA_API_KEY || '',
    syncCurrencies: toList(process.env.OANDA_SYNC_CURRENCIES).map((c) => c.toUpperCase()),
    syncIncludeCapability:
      process.env.OANDA_SYNC_INCLUDE_CAPABILITY !== undefined
        ? toBoolean(process.env.OANDA_SYNC_INCLUDE_CAPABILITY)
        : env !== 'production' && env !== 'staging',
    syncMaxPairs: toNumber(process.env.OANDA_SYNC_MAX_PAIRS, 0),
    syncConcurrency: toNumber(process.env.OANDA_SYNC_CONCURRENCY, 2),
    oandaRpm: toNumber(process.env.OANDA_RPM, 60),
    oandaBurstMultiplier: toNumber(process.env.OANDA_BURST_MULTIPLIER, 2),
    oandaRateLimitMaxRetries: toNumber(process.env.OANDA_RATE_LIMIT_MAX_RETRIES, 3),
    oandaRateLimitBackoffMs: toNumber(process.env.OANDA_RATE_LIMIT_BACKOFF_MS, 1000),
    oandaRateLimitBackoffMaxMs: toNumber(process.env.OANDA_RATE_LIMIT_BACKOFF_MAX_MS, 10000),
    oandaRateLimitJitterMs: toNumber(process.env.OANDA_RATE_LIMIT_JITTER_MS, 250),
    oandaFallbackMaxWaitMs: toNumber(process.env.OANDA_FALLBACK_MAX_WAIT_MS, 1500),
  },
  redis: {
    url: process.env.REDIS_URL || '',
  },
  queues: {
    quoteRefreshUrl: process.env.QUOTE_REFRESH_QUEUE_URL || '',
    quoteRefreshDlqUrl: process.env.QUOTE_REFRESH_DLQ_URL || '',
    quoteRefreshMode: toQueueMode(process.env.QUOTE_REFRESH_QUEUE_MODE),
    quoteRefreshDbFallback: toBoolean(process.env.QUOTE_REFRESH_DB_FALLBACK),
    fxRateRefreshUrl: process.env.FX_RATE_REFRESH_QUEUE_URL || '',
    fxRateRefreshDlqUrl: process.env.FX_RATE_REFRESH_DLQ_URL || '',
    fxRateRefreshMode: toQueueMode(process.env.FX_RATE_REFRESH_QUEUE_MODE),
    fxRateRefreshDbFallback: toBoolean(process.env.FX_RATE_REFRESH_DB_FALLBACK),
    exports: {
      url: process.env.EXPORT_JOB_QUEUE_URL || '',
      mode: toQueueMode(process.env.EXPORT_JOB_QUEUE_MODE),
    },
    ingestFanout: {
      url: process.env.PLANE_B_INGEST_FANOUT_QUEUE_URL || '',
      mode: toQueueMode(process.env.PLANE_B_INGEST_FANOUT_QUEUE_MODE),
      tier1Url: process.env.PLANE_B_INGEST_FANOUT_TIER1_QUEUE_URL || '',
      tier2Url: process.env.PLANE_B_INGEST_FANOUT_TIER2_QUEUE_URL || '',
    },
    notifications: {
      url: process.env.PLANE_B_NOTIFICATIONS_QUEUE_URL || '',
      mode: toQueueMode(process.env.PLANE_B_NOTIFICATIONS_QUEUE_MODE),
    },
    opsAlerts: {
      url: process.env.PLANE_B_OPS_ALERT_QUEUE_URL || '',
      mode: toQueueMode(process.env.PLANE_B_OPS_ALERT_QUEUE_MODE),
    },
    goldLive: {
      url: process.env.GOLD_LIVE_QUEUE_URL || '',
      mode: toQueueMode(process.env.GOLD_LIVE_QUEUE_MODE),
    },
  },
  exports: {
    maxActivePerUser: toNumber(process.env.EXPORT_JOB_MAX_ACTIVE_PER_USER, 2),
  },
  marketing: {
    meta: {
      pixelId: process.env.META_PIXEL_ID || process.env.PUBLIC_META_PIXEL_ID || '',
      accessToken: process.env.META_CAPI_ACCESS_TOKEN || '',
      testEventCode: process.env.META_CAPI_TEST_EVENT_CODE || '',
    },
  },
  alerts: {
    slackWebhookUrl: process.env.ALERT_SLACK_WEBHOOK_URL || '',
    smart: {
      minConfidence: clampInt(toPositiveInt(process.env.SMART_ALERTS_MIN_CONFIDENCE, 70), 1, 100),
      minSampleDays: clampInt(toPositiveInt(process.env.SMART_ALERTS_MIN_SAMPLE_DAYS, 21), 1, 365),
      weeklySendDow: clampInt(toPositiveInt(process.env.ALERTS_WEEKLY_SEND_DOW, 1), 1, 7),
      weeklySendHour: clampInt(toPositiveInt(process.env.ALERTS_WEEKLY_SEND_HOUR, 9), 0, 23),
    },
    unsubscribe: {
      secret: process.env.ALERT_UNSUBSCRIBE_SECRET || '',
      baseUrl:
        process.env.ALERT_UNSUBSCRIBE_BASE_URL ||
        process.env.FRONTEND_BASE_URL ||
        process.env.PUBLIC_SITE_URL ||
        frontendFallbackUrl,
      tokenExpiryHours: toNumber(process.env.ALERT_UNSUBSCRIBE_TOKEN_TTL_HOURS, 720),
    },
    email: {
      enabled: toBoolean(process.env.ALERT_EMAIL_ENABLED),
      smtpHost: process.env.ALERT_SMTP_HOST || '',
      smtpPort: toNumber(process.env.ALERT_SMTP_PORT, 587),
      smtpSecure: toBoolean(process.env.ALERT_SMTP_SECURE),
      smtpUser: process.env.ALERT_SMTP_USER || '',
      smtpPass: process.env.ALERT_SMTP_PASS || '',
      from: process.env.ALERT_EMAIL_FROM || '',
      to: toList(process.env.ALERT_EMAIL_TO),
    },
    evaluation: {
      enabled:
        process.env.ALERT_EVALUATION_ENABLED !== undefined
          ? toBoolean(process.env.ALERT_EVALUATION_ENABLED)
          : true,
      queueUrl: process.env.ALERT_EVALUATION_QUEUE_URL || '',
      batchSize: toNumber(process.env.ALERT_EVALUATION_BATCH_SIZE, 10),
      concurrency: clampInt(toPositiveInt(process.env.ALERT_EVALUATION_CONCURRENCY, 10), 1, 25),
    },
    notifications: {
      auditAttempts: toBoolean(process.env.ALERTS_NOTIFICATION_AUDIT),
      auditContent: toBoolean(process.env.ALERTS_NOTIFICATION_AUDIT_CONTENT),
      auditPii: toBoolean(process.env.ALERTS_NOTIFICATION_AUDIT_PII),
      email: {
        enabled: toBoolean(process.env.ALERTS_EMAIL_ENABLED),
        from: process.env.ALERTS_EMAIL_FROM || process.env.SES_FROM_ADDRESS || '',
        fromName: process.env.ALERTS_EMAIL_FROM_NAME || 'Remit-Scout Alerts',
      },
      sms: {
        enabled: toBoolean(process.env.ALERTS_SMS_ENABLED),
      },
    },
  },
  observability: {
    cloudwatch: {
      enabled:
        process.env.CLOUDWATCH_METRICS_ENABLED !== undefined
          ? toBoolean(process.env.CLOUDWATCH_METRICS_ENABLED)
          : isAwsRuntime,
      namespace: process.env.CLOUDWATCH_NAMESPACE || 'RemitScout',
      flushIntervalMs: toNumber(process.env.CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS, 15000),
      highCardinalityEnabled: toBoolean(process.env.CLOUDWATCH_HIGH_CARDINALITY_METRICS),
    },
    tracing: {
      exporter: (
        process.env.TRACING_EXPORTER ||
        (process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? 'xray' : '')
      ).toLowerCase(),
      otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '',
      filterHealthChecks: toBoolean(process.env.TRACE_FILTER_HEALTH_CHECKS),
      sampleRate: toNumber(process.env.TRACE_SAMPLE_RATE, NaN),
    },
  },
  db: {
    url: getDatabaseUrl(process.env.DATABASE_URL, defaultLocalDbUrl),
    planeAUrl: getDatabaseUrl(
      process.env.DATABASE_URL_PLANE_A,
      process.env.DATABASE_URL || defaultLocalDbUrl,
    ),
    planeBUrl:
      (process.env.DATABASE_URL_PLANE_B && process.env.DATABASE_URL_PLANE_B.trim()) ||
      buildPostgresUrlFromParts({
        username: process.env.PLANE_B_DB_USERNAME,
        password: process.env.PLANE_B_DB_PASSWORD,
        host: process.env.PLANE_B_DB_HOST,
        port: process.env.PLANE_B_DB_PORT || '5432',
        dbName: process.env.PLANE_B_DB_NAME,
        sslMode: process.env.DB_SSL_MODE || process.env.PGSSLMODE,
      }) ||
      getDatabaseUrl(process.env.DATABASE_URL, defaultLocalDbUrl),
    planeCUrl: getDatabaseUrl(
      process.env.DATABASE_URL_PLANE_C,
      process.env.DATABASE_URL || defaultLocalDbUrl,
    ),
  },
  storage: {
    bronze: {
      bucket: process.env.BRONZE_S3_BUCKET || '',
      prefix: process.env.BRONZE_S3_PREFIX || 'bronze',
    },
    exports: {
      bucket: process.env.EXPORTS_S3_BUCKET || '',
      prefix: process.env.EXPORTS_S3_PREFIX || 'exports',
    },
  },
  auditLogs: {
    bucket: process.env.AUDIT_LOGS_S3_BUCKET || '',
    prefix: process.env.AUDIT_LOGS_S3_PREFIX || 'audit-logs',
    cleanupBatchSize: toNumber(process.env.AUDIT_LOG_CLEANUP_BATCH_SIZE, 1000),
    retentionDays: {
      info: toNumber(process.env.AUDIT_LOG_INFO_RETENTION_DAYS, 90),
      user_action: toNumber(process.env.AUDIT_LOG_USER_ACTION_RETENTION_DAYS, 365 * 3),
      admin: toNumber(process.env.AUDIT_LOG_ADMIN_RETENTION_DAYS, 365 * 3),
      billing: toNumber(process.env.AUDIT_LOG_BILLING_RETENTION_DAYS, 365 * 3),
      data_access: toNumber(process.env.AUDIT_LOG_DATA_ACCESS_RETENTION_DAYS, 365 * 3),
      system: toNumber(process.env.AUDIT_LOG_SYSTEM_RETENTION_DAYS, 365),
      security: toNumber(process.env.AUDIT_LOG_SECURITY_RETENTION_DAYS, 365 * 7),
      compliance: toNumber(process.env.AUDIT_LOG_COMPLIANCE_RETENTION_DAYS, 365 * 7),
    },
  },
  geo: {
    countryHeader: process.env.GEO_COUNTRY_HEADER || 'cf-ipcountry',
  },
  auth: {
    supabase: {
      url: process.env.SUPABASE_URL || '',
      publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      jwksUrl: toSupabaseJwksUrl(process.env.SUPABASE_URL, process.env.SUPABASE_JWKS_URL),
      jwtIssuer: process.env.SUPABASE_JWT_ISSUER || '',
      jwtAudience: process.env.SUPABASE_JWT_AUDIENCE || process.env.SUPABASE_JWT_AUD || '',
      verifyMode: toVerifyMode(process.env.SUPABASE_AUTH_VERIFY_MODE),
      remoteVerifyCacheTtlSeconds: toNumber(process.env.SUPABASE_AUTH_REMOTE_VERIFY_CACHE_TTL_SECONDS, 30),
    },
  },
  billing: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      priceIdPlus: process.env.STRIPE_PRICE_ID_PLUS || '',
      priceIdPlusAnnual: process.env.STRIPE_PRICE_ID_PLUS_ANNUAL || '',
      frontendBaseUrl:
        process.env.FRONTEND_BASE_URL ||
        process.env.PUBLIC_SITE_URL ||
        frontendFallbackUrl,
      trialDays: toNumber(process.env.STRIPE_TRIAL_DAYS, 14),
    },
  },
  newsletter: {
    enabled:
      process.env.NEWSLETTER_EMAIL_ENABLED !== undefined
        ? toBoolean(process.env.NEWSLETTER_EMAIL_ENABLED)
        : true,
    from: process.env.NEWSLETTER_EMAIL_FROM || process.env.SES_FROM_ADDRESS || '',
    fromName: process.env.NEWSLETTER_EMAIL_FROM_NAME || 'RemitScout Newsletter',
    baseUrl:
      process.env.NEWSLETTER_BASE_URL ||
      process.env.FRONTEND_BASE_URL ||
      process.env.PUBLIC_SITE_URL ||
      frontendFallbackUrl,
    tokenExpiryHours: toNumber(process.env.NEWSLETTER_TOKEN_EXPIRY_HOURS, 168),
    welcomeEnabled: toBoolean(process.env.NEWSLETTER_WELCOME_ENABLED),
  },
  communications: {
    email: {
      provider: (process.env.EMAIL_PROVIDER || 'ses').toLowerCase(),
      sesRegion: process.env.SES_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '',
      sesFromAddress: process.env.SES_FROM_ADDRESS || '',
      sesFromName: process.env.SES_FROM_NAME || '',
      sesReplyTo: process.env.SES_REPLY_TO || '',
      sendgridApiKey: process.env.SENDGRID_API_KEY || '',
      legacyFromAddress: process.env.EMAIL_FROM_ADDRESS || '',
      legacyFromName: process.env.EMAIL_FROM_NAME || '',
      maxRetries: toNumber(process.env.EMAIL_MAX_RETRIES, 2),
    },
    sms: {
      provider: (process.env.SMS_PROVIDER || 'sns').toLowerCase(),
      snsRegion: process.env.SNS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '',
      snsTopicArn: process.env.SNS_TOPIC_ARN || '',
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
      twilioFromNumber: process.env.TWILIO_FROM_NUMBER || '',
      maxRetries: toNumber(process.env.SMS_MAX_RETRIES, 2),
    },
    webhook: {
      maxRetries: toNumber(process.env.WEBHOOK_MAX_RETRIES, 3),
      timeoutMs: toNumber(process.env.WEBHOOK_TIMEOUT_MS, 5000),
      backoffBaseMs: toNumber(process.env.WEBHOOK_BACKOFF_BASE_MS, 1000),
      maxBackoffMs: toNumber(process.env.WEBHOOK_MAX_BACKOFF_MS, 8000),
    },
    dispatch: {
      parallelDispatch:
        process.env.NOTIFICATION_PARALLEL !== undefined
          ? toBoolean(process.env.NOTIFICATION_PARALLEL, true)
          : true,
      maxConcurrentDispatches: clampInt(toNumber(process.env.MAX_CONCURRENT_DISPATCHES, 10), 1, 100),
    },
  },
  workers: {
    health: {
      enabled: toBoolean(process.env.WORKER_HEALTH_ENABLED, true),
      port: toNumber(process.env.HEALTH_PORT, 8080),
    },
    exportWorker: {
      queueBatchSize: toNumber(process.env.EXPORT_QUEUE_BATCH_SIZE, 5),
      queueIdleSleepMs: toNumber(process.env.EXPORT_QUEUE_IDLE_SLEEP_MS, 2000),
      queueLockTtlSeconds: toNumber(process.env.EXPORT_QUEUE_LOCK_TTL_SECONDS, 120),
      shutdownTimeoutMs: toNumber(process.env.EXPORT_QUEUE_SHUTDOWN_TIMEOUT_MS, 30000),
      jobExpiryDays: toNumber(process.env.EXPORT_JOB_EXPIRY_DAYS, 7),
      fetchPageSize: clampInt(toNumber(process.env.EXPORT_FETCH_PAGE_SIZE, 1000), 100, 5000),
    },
    alertEvaluationWorker: {
      idleSleepMs: toNumber(process.env.ALERT_EVALUATION_IDLE_SLEEP_MS, 1000),
      loopJitterMs: toNumber(process.env.ALERT_EVALUATION_LOOP_JITTER_MS, 0),
      messageJitterMs: toNumber(process.env.ALERT_EVALUATION_MESSAGE_JITTER_MS, 0),
      shutdownTimeoutMs: toNumber(process.env.ALERT_EVALUATION_SHUTDOWN_TIMEOUT_MS, 30000),
    },
    notificationsQueueWorker: {
      batchSize: toNumber(process.env.NOTIFICATIONS_QUEUE_BATCH_SIZE, 10),
      idleSleepMs: toNumber(process.env.NOTIFICATIONS_QUEUE_IDLE_SLEEP_MS, 1000),
      shutdownTimeoutMs: toNumber(process.env.NOTIFICATIONS_QUEUE_SHUTDOWN_TIMEOUT_MS, 30000),
      loopJitterMs: toNumber(process.env.NOTIFICATIONS_QUEUE_LOOP_JITTER_MS, 0),
      messageJitterMs: toNumber(process.env.NOTIFICATIONS_QUEUE_MESSAGE_JITTER_MS, 0),
    },
    opsAlertsQueueWorker: {
      batchSize: toNumber(process.env.OPS_ALERTS_QUEUE_BATCH_SIZE, 10),
      idleSleepMs: toNumber(process.env.OPS_ALERTS_QUEUE_IDLE_SLEEP_MS, 1000),
      shutdownTimeoutMs: toNumber(process.env.OPS_ALERTS_QUEUE_SHUTDOWN_TIMEOUT_MS, 30000),
      loopJitterMs: toNumber(process.env.OPS_ALERTS_QUEUE_LOOP_JITTER_MS, 0),
      messageJitterMs: toNumber(process.env.OPS_ALERTS_QUEUE_MESSAGE_JITTER_MS, 0),
    },
    fxRateRefreshWorker: {
      limit: toNumber(process.env.FX_RATE_REFRESH_LIMIT, 50),
      maxRetries: toNumber(process.env.FX_RATE_REFRESH_MAX_RETRIES, 3),
      concurrency: toNumber(process.env.FX_RATE_REFRESH_CONCURRENCY, 5),
      backpressureThreshold: toNumber(process.env.FX_RATE_REFRESH_BACKPRESSURE_THRESHOLD, 0),
      lockMode: (process.env.FX_RATE_REFRESH_LOCK_MODE || 'auto').toLowerCase(),
      loopEnabled: toBoolean(process.env.FX_RATE_REFRESH_LOOP),
      loopDelayMs: Math.max(50, toNumber(process.env.FX_RATE_REFRESH_LOOP_DELAY_MS, 250)),
      idleDelayMs: toNumber(process.env.FX_RATE_REFRESH_IDLE_DELAY_MS, 750),
      loopJitterMs: toNumber(process.env.FX_RATE_REFRESH_LOOP_JITTER_MS, 0),
    },
    b2cRefreshWorker: {
      limit: toNumber(process.env.B2C_REFRESH_LIMIT, 50),
      concurrency: toNumber(process.env.B2C_REFRESH_CONCURRENCY, 5),
      healthEnabled: toBoolean(process.env.B2C_REFRESH_HEALTH_ENABLED, true),
      backpressureThreshold: toNumber(process.env.B2C_REFRESH_BACKPRESSURE_THRESHOLD, 0),
      lockMode: (process.env.B2C_REFRESH_LOCK_MODE || 'auto').toLowerCase(),
      loopEnabled: toBoolean(process.env.B2C_REFRESH_LOOP),
      loopDelayMs: Math.max(50, toNumber(process.env.B2C_REFRESH_LOOP_DELAY_MS, 250)),
      idleDelayMs: toNumber(process.env.B2C_REFRESH_IDLE_DELAY_MS, 750),
      loopJitterMs: toNumber(process.env.B2C_REFRESH_LOOP_JITTER_MS, 0),
    },
  },
  indices: {
    amountBucket: toNumber(process.env.GOLD_INDICES_AMOUNT_BUCKET, 500),
    providerWeightModel: process.env.PROVIDER_WEIGHT_MODEL || '',
  },
  dbPool: {
    disablePoolSignalCleanup: toBoolean(process.env.DB_DISABLE_POOL_SIGNAL_CLEANUP),
    maxOverride: toNumber(process.env.DB_POOL_MAX, NaN),
    minOverride: toNumber(process.env.DB_POOL_MIN, NaN),
    sslMode: process.env.DB_SSL_MODE || process.env.PGSSLMODE || '',
    queryTimeoutMs: toNumber(process.env.DB_QUERY_TIMEOUT_MS, 30000),
    connectionTimeoutMs: toNumber(process.env.DB_CONNECTION_TIMEOUT_MS, 10000),
    idleTimeoutMs: toNumber(process.env.DB_IDLE_TIMEOUT_MS, 30000),
    keepAliveEnabled: process.env.DB_KEEPALIVE !== '0',
    keepAliveInitialDelayMs: toNumber(process.env.DB_KEEPALIVE_INITIAL_DELAY_MS, 10000),
    maxUses: toNumber(process.env.DB_MAX_USES, 0),
    disableStatementTimeoutExplicit: toBoolean(process.env.DB_DISABLE_STATEMENT_TIMEOUT),
  },
}

export type Config = typeof rawConfig
export const config: DeepReadonly<Config> = deepFreeze(rawConfig)

export type RuntimeConfigRequirements = {
  requirePlaneA?: boolean
  requirePlaneB?: boolean
  // Plane C is a hard dependency for Plane A (API calls). This flag validates the Plane C base URL.
  requirePlaneC?: boolean
  // Plane C server/lambda runtime DB requirements.
  requirePlaneCDb?: boolean
  requireRedis?: boolean
  requireSupabase?: boolean
  requireStripe?: boolean
  requireJwtSecret?: boolean
  requireQueues?: boolean
  requireQuoteRefreshQueue?: boolean
  requireFxRateRefreshQueue?: boolean
  requireExportJobQueue?: boolean
  requireIngestFanoutQueue?: boolean
  requireNotificationsQueue?: boolean
  requireOpsAlertsQueue?: boolean
  requireGoldLiveQueue?: boolean
  requireAlertEvaluationQueue?: boolean
  requireStorage?: boolean
  requireBronzeBucket?: boolean
  requireExportsBucket?: boolean
  requireAlerts?: boolean
}

const shouldRequire = (
  overrideValue: boolean | undefined,
  defaultValue: boolean,
) => overrideValue ?? defaultValue

export const assertRuntimeConfig = (
  requirements: RuntimeConfigRequirements = {},
): void => {
  const missing: string[] = []

  if (requirements.requirePlaneA && !config.db.planeAUrl) {
    missing.push('DATABASE_URL_PLANE_A')
  }
  if (requirements.requirePlaneB && !config.db.planeBUrl) {
    missing.push('DATABASE_URL_PLANE_B')
  }
  if (requirements.requirePlaneCDb && !config.db.planeCUrl) {
    missing.push('DATABASE_URL_PLANE_C')
  }
  if (requirements.requirePlaneC && !config.planeA.planeCBaseUrl) {
    missing.push('PLANE_C_BASE_URL')
  }
  if (requirements.requirePlaneC && config.runtime.isAwsRuntime && config.planeA.planeCBaseUrl) {
    const raw = config.planeA.planeCBaseUrl.trim().toLowerCase()
    const isLocalhost =
      raw.includes('://localhost')
      || raw.includes('://127.0.0.1')
      || raw.startsWith('localhost')
      || raw.startsWith('127.0.0.1')
    if (isLocalhost) {
      missing.push('PLANE_C_BASE_URL (must not be localhost/127.0.0.1 in AWS)')
    }
  }
  if (requirements.requireRedis && !config.redis.url) {
    missing.push('REDIS_URL')
  }
  if (requirements.requireQueues) {
    const requireQuoteRefreshQueue = shouldRequire(requirements.requireQuoteRefreshQueue, true)
    const requireFxRateRefreshQueue = shouldRequire(requirements.requireFxRateRefreshQueue, true)
    const requireExportJobQueue = shouldRequire(requirements.requireExportJobQueue, true)
    const requireIngestFanoutQueue = shouldRequire(requirements.requireIngestFanoutQueue, true)
    const requireNotificationsQueue = shouldRequire(requirements.requireNotificationsQueue, true)
    const requireOpsAlertsQueue = shouldRequire(requirements.requireOpsAlertsQueue, true)
    const requireGoldLiveQueue = shouldRequire(requirements.requireGoldLiveQueue, true)
    const requireAlertEvaluationQueue = shouldRequire(
      requirements.requireAlertEvaluationQueue,
      true,
    )

    if (requireQuoteRefreshQueue && !config.queues.quoteRefreshUrl) {
      missing.push('QUOTE_REFRESH_QUEUE_URL')
    }
    if (requireFxRateRefreshQueue && !config.queues.fxRateRefreshUrl) {
      missing.push('FX_RATE_REFRESH_QUEUE_URL')
    }
    if (requireExportJobQueue && !config.queues.exports.url) {
      missing.push('EXPORT_JOB_QUEUE_URL')
    }
    if (requireIngestFanoutQueue && !config.queues.ingestFanout.url) {
      missing.push('PLANE_B_INGEST_FANOUT_QUEUE_URL')
    }
    if (requireNotificationsQueue && !config.queues.notifications.url) {
      missing.push('PLANE_B_NOTIFICATIONS_QUEUE_URL')
    }
    if (requireOpsAlertsQueue && !config.queues.opsAlerts.url) {
      missing.push('PLANE_B_OPS_ALERT_QUEUE_URL')
    }
    if (requireGoldLiveQueue && !config.queues.goldLive.url) {
      missing.push('GOLD_LIVE_QUEUE_URL')
    }
    if (requireAlertEvaluationQueue && !config.alerts.evaluation.queueUrl) {
      missing.push('ALERT_EVALUATION_QUEUE_URL')
    }
  }
  if (requirements.requireStorage) {
    const requireBronzeBucket = shouldRequire(requirements.requireBronzeBucket, true)
    const requireExportsBucket = shouldRequire(requirements.requireExportsBucket, true)

    if (requireBronzeBucket && !config.storage.bronze.bucket) {
      missing.push('BRONZE_S3_BUCKET')
    }
    if (requireExportsBucket && !config.storage.exports.bucket) {
      missing.push('EXPORTS_S3_BUCKET')
    }
  }
  if (requirements.requireAlerts) {
    if (!config.alerts.slackWebhookUrl) missing.push('ALERT_SLACK_WEBHOOK_URL')
    if (config.alerts.email.enabled && !config.alerts.email.smtpHost) {
      missing.push('ALERT_SMTP_HOST')
    }
    if (config.alerts.email.enabled && !config.alerts.email.from) {
      missing.push('ALERT_EMAIL_FROM')
    }
  }
  if (requirements.requireSupabase) {
    if (!config.auth.supabase.url) {
      missing.push('SUPABASE_URL')
    }
    if (!config.auth.supabase.publishableKey) {
      missing.push('SUPABASE_PUBLISHABLE_KEY')
    }
  }
  if (requirements.requireStripe) {
    if (!config.billing.stripe.secretKey) {
      missing.push('STRIPE_SECRET_KEY')
    }
    if (!config.billing.stripe.webhookSecret) {
      missing.push('STRIPE_WEBHOOK_SECRET')
    }
    if (!config.billing.stripe.priceIdPlus) {
      missing.push('STRIPE_PRICE_ID_PLUS')
    }
    if (!config.billing.stripe.priceIdPlusAnnual) {
      missing.push('STRIPE_PRICE_ID_PLUS_ANNUAL')
    }
  }
  if (requirements.requireJwtSecret && !config.planeA.jwtSecret) {
    missing.push('PLANE_A_JWT_SECRET')
  }

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`)
  }
}
