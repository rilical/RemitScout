import './load-env'

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: string | undefined) => value === '1' || value === 'true'

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
  process.env.NODE_ENV === 'production' || isStaging || process.env.STRICT_CONFIG === '1'

const defaultLocalDbUrl = 'postgres://remit:remit@localhost:5432/remit'

const getDatabaseUrl = (primary?: string, fallback?: string) => {
  if (primary && primary.trim()) {
    return primary.trim()
  }
  if (!isStrictConfig && fallback && fallback.trim()) {
    return fallback.trim()
  }
  return ''
}

const toList = (value: string | undefined) =>
  (value || '').split(',').map(item => item.trim()).filter(Boolean)

export const config = {
  env: process.env.NODE_ENV || 'development',
  runtime: {
    readOnly: toBoolean(process.env.READ_ONLY_MODE),
  },
  planeA: {
    port: toNumber(process.env.PLANE_A_PORT, 4000),
    rateLimitMax: toNumber(process.env.PLANE_A_RATE_LIMIT_MAX, 120),
    rateLimitWindowMs: toNumber(process.env.PLANE_A_RATE_LIMIT_WINDOW_MS, 60000),
    requireApiKey: process.env.PLANE_A_REQUIRE_API_KEY === '1',
    requireJwt: process.env.PLANE_A_REQUIRE_JWT === '1',
    apiKeys: (process.env.PLANE_A_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean),
    jwtSecret: process.env.PLANE_A_JWT_SECRET || '',
    planeCBaseUrl: process.env.PLANE_C_BASE_URL || 'http://localhost:4100',
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
    },
    cors: {
      origins: toList(process.env.PLANE_A_CORS_ORIGINS),
      allowedHeaders: toList(process.env.PLANE_A_CORS_ALLOWED_HEADERS),
      allowedMethods: toList(process.env.PLANE_A_CORS_ALLOWED_METHODS),
      allowCredentials: toBoolean(process.env.PLANE_A_CORS_ALLOW_CREDENTIALS),
    },
  },
  planeC: {
    port: toNumber(process.env.PLANE_C_PORT, 4100),
  },
  planeB: {
    useSeedData: toBoolean(process.env.PLANE_B_USE_SEED_DATA),
    b2bSweepIntervalMinutes: toNumber(process.env.PLANE_B_B2B_SWEEP_INTERVAL_MINUTES, 15),
    b2bMinProviderCount: toNumber(process.env.PLANE_B_B2B_MIN_PROVIDER_COUNT, 0),
    b2bFullSweepDays: toNumber(process.env.PLANE_B_B2B_FULL_SWEEP_DAYS, 30),
    b2bTargetMinutes: toNumber(process.env.PLANE_B_B2B_TARGET_MINUTES, 0),
    b2bTier1Enabled: toBoolean(process.env.PLANE_B_B2B_TIER1_ENABLED, false),
    b2bFreshnessSloMinutes: toNumber(process.env.PLANE_B_B2B_FRESHNESS_SLO_MINUTES, 30),
    b2bFreshnessSloEnabled: toBoolean(process.env.PLANE_B_B2B_FRESHNESS_SLO_ENABLED),
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
    b2cRefreshBatchLimit: toNumber(process.env.PLANE_B_B2C_REFRESH_BATCH_LIMIT, 25),
    b2cRefreshMaxRetries: toNumber(process.env.PLANE_B_B2C_REFRESH_MAX_RETRIES, 3),
    b2cRefreshConcurrency: toNumber(process.env.PLANE_B_B2C_REFRESH_CONCURRENCY, 3),
    b2cQueueInSweep: process.env.PLANE_B_B2C_QUEUE_IN_SWEEP !== undefined
      ? toBoolean(process.env.PLANE_B_B2C_QUEUE_IN_SWEEP)
      : process.env.NODE_ENV !== 'production' && !isStaging,
  },
  fxRates: {
    oandaFallbackEnabled: toBoolean(process.env.FX_RATE_OANDA_FALLBACK),
    cacheTtlSeconds: toNumber(process.env.FX_RATE_CACHE_TTL_SECONDS, 300),
    historyCacheTtlSeconds: toNumber(process.env.FX_RATE_HISTORY_CACHE_TTL_SECONDS, 3600),
    dbFreshnessHours: toNumber(process.env.FX_RATE_DB_FRESHNESS_HOURS, 1),
    historyDays: toNumber(process.env.FX_RATE_HISTORY_DAYS, 30),
    syncIntervalMinutes: toNumber(process.env.OANDA_SYNC_INTERVAL_MINUTES, 60),
  },
  redis: {
    url: process.env.REDIS_URL || '',
  },
  queues: {
    quoteRefreshUrl: process.env.QUOTE_REFRESH_QUEUE_URL || '',
    quoteRefreshDlqUrl: process.env.QUOTE_REFRESH_DLQ_URL || '',
    quoteRefreshMode: toQueueMode(process.env.QUOTE_REFRESH_QUEUE_MODE),
    exports: {
      url: process.env.EXPORT_JOB_QUEUE_URL || '',
      mode: toQueueMode(process.env.EXPORT_JOB_QUEUE_MODE),
    },
    ingestFanout: {
      url: process.env.PLANE_B_INGEST_FANOUT_QUEUE_URL || '',
      mode: toQueueMode(process.env.PLANE_B_INGEST_FANOUT_QUEUE_MODE),
    },
    notifications: {
      url: process.env.PLANE_B_NOTIFICATIONS_QUEUE_URL || '',
      mode: toQueueMode(process.env.PLANE_B_NOTIFICATIONS_QUEUE_MODE),
    },
    opsAlerts: {
      url: process.env.PLANE_B_OPS_ALERT_QUEUE_URL || '',
      mode: toQueueMode(process.env.PLANE_B_OPS_ALERT_QUEUE_MODE),
    },
  },
  exports: {
    maxActivePerUser: toNumber(process.env.EXPORT_JOB_MAX_ACTIVE_PER_USER, 2),
  },
  alerts: {
    slackWebhookUrl: process.env.ALERT_SLACK_WEBHOOK_URL || '',
    unsubscribe: {
      secret: process.env.ALERT_UNSUBSCRIBE_SECRET || '',
      baseUrl:
        process.env.ALERT_UNSUBSCRIBE_BASE_URL ||
        process.env.FRONTEND_BASE_URL ||
        process.env.PUBLIC_SITE_URL ||
        'http://localhost:3000',
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
      concurrency: toNumber(process.env.ALERT_EVALUATION_CONCURRENCY, 10),
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
    },
  },
  db: {
    url: getDatabaseUrl(process.env.DATABASE_URL, defaultLocalDbUrl),
    planeAUrl: getDatabaseUrl(
      process.env.DATABASE_URL_PLANE_A,
      process.env.DATABASE_URL || defaultLocalDbUrl,
    ),
    planeBUrl: getDatabaseUrl(
      process.env.DATABASE_URL_PLANE_B,
      process.env.DATABASE_URL || defaultLocalDbUrl,
    ),
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
    userAssets: {
      bucket: process.env.USER_ASSETS_S3_BUCKET || '',
      prefix: process.env.USER_ASSETS_S3_PREFIX || 'avatars',
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
      verifyMode: toVerifyMode(process.env.SUPABASE_AUTH_VERIFY_MODE),
      remoteVerifyCacheTtlSeconds: toNumber(process.env.SUPABASE_AUTH_REMOTE_VERIFY_CACHE_TTL_SECONDS, 30),
      mock: {
        enabled: toBoolean(process.env.SUPABASE_MOCK),
        token: process.env.SUPABASE_MOCK_TOKEN || 'dev-token',
        adminToken: process.env.SUPABASE_MOCK_ADMIN_TOKEN || 'admin-token',
        userId: process.env.SUPABASE_MOCK_USER_ID || 'dev-user',
        email: process.env.SUPABASE_MOCK_EMAIL || 'dev@example.com',
        role: process.env.SUPABASE_MOCK_ROLE || 'authenticated',
        adminEmail: process.env.SUPABASE_MOCK_ADMIN_EMAIL || 'admin@example.com',
        planOverride: process.env.SUPABASE_MOCK_PLAN || undefined, // 'plus' or 'free' to override plan in dev mode
      },
    },
  },
  billing: {
    stripe: {
      mockEnabled: toBoolean(process.env.STRIPE_MOCK),
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      priceIdPlus: process.env.STRIPE_PRICE_ID_PLUS || '',
      frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
    },
  },
  newsletter: {
    enabled:
      process.env.NEWSLETTER_EMAIL_ENABLED !== undefined
        ? toBoolean(process.env.NEWSLETTER_EMAIL_ENABLED)
        : true,
    from: process.env.NEWSLETTER_EMAIL_FROM || process.env.SES_FROM_ADDRESS || '',
    fromName: process.env.NEWSLETTER_EMAIL_FROM_NAME || 'RemitScout Newsletter',
    baseUrl: process.env.NEWSLETTER_BASE_URL || process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
    tokenExpiryHours: toNumber(process.env.NEWSLETTER_TOKEN_EXPIRY_HOURS, 168),
    welcomeEnabled: toBoolean(process.env.NEWSLETTER_WELCOME_ENABLED),
  },
}

export type RuntimeConfigRequirements = {
  requirePlaneA?: boolean
  requirePlaneB?: boolean
  requirePlaneC?: boolean
  requireRedis?: boolean
  requireSupabase?: boolean
  requireStripe?: boolean
  requireJwtSecret?: boolean
}

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
  if (requirements.requirePlaneC && !config.db.planeCUrl) {
    missing.push('DATABASE_URL_PLANE_C')
  }
  if (requirements.requireRedis && !config.redis.url) {
    missing.push('REDIS_URL')
  }
  if (requirements.requireSupabase && !config.auth.supabase.mock.enabled) {
    if (!config.auth.supabase.url) {
      missing.push('SUPABASE_URL')
    }
    if (!config.auth.supabase.publishableKey) {
      missing.push('SUPABASE_PUBLISHABLE_KEY')
    }
  }
  if (requirements.requireStripe && !config.billing.stripe.mockEnabled) {
    if (!config.billing.stripe.secretKey) {
      missing.push('STRIPE_SECRET_KEY')
    }
    if (!config.billing.stripe.webhookSecret) {
      missing.push('STRIPE_WEBHOOK_SECRET')
    }
    if (!config.billing.stripe.priceIdPlus) {
      missing.push('STRIPE_PRICE_ID_PLUS')
    }
  }
  if (requirements.requireJwtSecret && !config.planeA.jwtSecret) {
    missing.push('PLANE_A_JWT_SECRET')
  }

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`)
  }
}
