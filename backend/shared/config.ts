const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
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
  },
  planeC: {
    port: toNumber(process.env.PLANE_C_PORT, 4100),
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
