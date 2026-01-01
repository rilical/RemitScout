const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: string | undefined) => value === '1' || value === 'true'

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

const toList = (value: string | undefined) =>
  (value || '').split(',').map(item => item.trim()).filter(Boolean)

export const config = {
  env: process.env.NODE_ENV || 'development',
  planeA: {
    port: toNumber(process.env.PLANE_A_PORT, 4000),
    rateLimitMax: toNumber(process.env.PLANE_A_RATE_LIMIT_MAX, 120),
    rateLimitWindowMs: toNumber(process.env.PLANE_A_RATE_LIMIT_WINDOW_MS, 60000),
    requireApiKey: process.env.PLANE_A_REQUIRE_API_KEY === '1',
    requireJwt: process.env.PLANE_A_REQUIRE_JWT === '1',
    apiKeys: (process.env.PLANE_A_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean),
    jwtSecret: process.env.PLANE_A_JWT_SECRET || 'change-me',
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
    b2bFreshnessSloMinutes: toNumber(process.env.PLANE_B_B2B_FRESHNESS_SLO_MINUTES, 30),
    b2bFreshnessSloEnabled: toBoolean(process.env.PLANE_B_B2B_FRESHNESS_SLO_ENABLED),
    circuitOpenMs: toNumber(process.env.PLANE_B_CIRCUIT_OPEN_MS, 300000),
    circuitHalfOpenMs: toNumber(process.env.PLANE_B_CIRCUIT_HALF_OPEN_MS, 60000),
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
      rpm: toNumber(process.env.PLANE_B_REMITLY_RPM, 6),
      perCorridorRpm: toNumber(process.env.PLANE_B_REMITLY_CORRIDOR_RPM, 2),
      freshnessSloMinutes: toNumber(process.env.PLANE_B_REMITLY_FRESHNESS_SLO_MINUTES, 30),
      freshnessSloEnabled: toBoolean(process.env.PLANE_B_REMITLY_FRESHNESS_SLO_ENABLED),
    },
    b2cRefreshBatchLimit: toNumber(process.env.PLANE_B_B2C_REFRESH_BATCH_LIMIT, 25),
  },
  redis: {
    url: process.env.REDIS_URL || '',
  },
  alerts: {
    slackWebhookUrl: process.env.ALERT_SLACK_WEBHOOK_URL || '',
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
  },
  db: {
    url: process.env.DATABASE_URL || 'postgres://remit:remit@localhost:5432/remit',
    planeAUrl: process.env.DATABASE_URL_PLANE_A || process.env.DATABASE_URL || 'postgres://remit:remit@localhost:5432/remit',
    planeBUrl: process.env.DATABASE_URL_PLANE_B || process.env.DATABASE_URL || 'postgres://remit:remit@localhost:5432/remit',
    planeCUrl: process.env.DATABASE_URL_PLANE_C || process.env.DATABASE_URL || 'postgres://remit:remit@localhost:5432/remit',
  },
  geo: {
    countryHeader: process.env.GEO_COUNTRY_HEADER || 'cf-ipcountry',
  },
  auth: {
    supabase: {
      url: process.env.SUPABASE_URL || '',
      publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
      jwksUrl: toSupabaseJwksUrl(process.env.SUPABASE_URL, process.env.SUPABASE_JWKS_URL),
      verifyMode: toVerifyMode(process.env.SUPABASE_AUTH_VERIFY_MODE),
      remoteVerifyCacheTtlSeconds: toNumber(process.env.SUPABASE_AUTH_REMOTE_VERIFY_CACHE_TTL_SECONDS, 30),
    },
  },
  billing: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      priceIdPlus: process.env.STRIPE_PRICE_ID_PLUS || '',
      frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
    },
  },
}
