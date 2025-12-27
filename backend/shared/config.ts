const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
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
}
