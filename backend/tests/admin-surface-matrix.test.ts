import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type RegisteredRoute = {
  method: string
  url: string
  guards: string[]
}

type RouteOptionsLike = {
  preHandler?: unknown | unknown[]
  url?: string
  method?: string | string[]
}

type GuardHandler = ((...args: unknown[]) => unknown) & {
  __guardTag?: string
}

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

const getGuardTags = (routeOptions: RouteOptionsLike): string[] =>
  toArray(routeOptions?.preHandler)
    .map((fn) => (fn && typeof fn === 'function' ? (fn as GuardHandler).__guardTag ?? null : null))
    .filter(Boolean)
    .map((value) => String(value))

const isAdminProtectedUrl = (url: string) =>
  (url.startsWith('/api/v1/admin')
  || url.startsWith('/api/v1/ops')
  || url.startsWith('/api/v1/audit')
  || url.startsWith('/api/v1/analytics')
  || url.startsWith('/api/v1/indices/corrections')
  || url === '/api/v1/telemetry/analytics')
  && url !== '/api/v1/audit/my-activity'

const captureAdminSurfaceRoutes = async (): Promise<RegisteredRoute[]> => {
  vi.resetModules()

  process.env.NODE_ENV = 'development'
  process.env.ENVIRONMENT = 'dev'
  process.env.PLANE_A_CORS_ORIGINS = 'http://localhost:3000'
  process.env.DATABASE_URL_PLANE_A = 'postgres://remit:remit@localhost:5432/remit'
  process.env.DATABASE_URL_PLANE_B = 'postgres://remit:remit@localhost:5432/remit'
  process.env.DATABASE_URL_PLANE_C = 'postgres://remit:remit@localhost:5432/remit'
  process.env.REDIS_URL = 'redis://localhost:6379'
  process.env.SUPABASE_URL = 'http://localhost:54321'
  process.env.SUPABASE_PUBLISHABLE_KEY = 'anon'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service'
  process.env.PLANE_A_JWT_SECRET = 'test-secret'
  process.env.PLANE_A_ADMIN_EMAILS = 'omar@remit-scout.com'

    const routes: RegisteredRoute[] = []
    const { buildApp } = await import('../plane-a/src/app')
    const app = await buildApp({
      onRoute: (routeOptions: RouteOptionsLike) => {
        const url = typeof routeOptions?.url === 'string' ? routeOptions.url : ''
        if (!url || !isAdminProtectedUrl(url)) {
          return
      }

      for (const method of toArray(routeOptions?.method).map((value) => String(value).toUpperCase())) {
        if (!method || method === 'HEAD' || method === 'OPTIONS') continue
        routes.push({
          method,
          url,
          guards: getGuardTags(routeOptions),
        })
      }
    },
  })

  try {
    await app.ready()
    return routes
  } finally {
    await app.close()
  }
}

describe('admin surface matrix', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('registers every privileged admin surface behind an admin or super-admin guard', async () => {
    const routes = await captureAdminSurfaceRoutes()

    expect(routes.length).toBeGreaterThan(0)

    const violations = routes.filter((route) =>
      !route.guards.includes('requireAdmin') && !route.guards.includes('requireSuperAdmin'),
    )

    expect(violations).toEqual([])
  })

  it('keeps super-admin-only mutations on the strict guard', async () => {
    const routes = await captureAdminSurfaceRoutes()
    const superAdminMutations = new Map([
      ['POST /api/v1/admin/plans/grant', 'requireSuperAdmin'],
      ['POST /api/v1/admin/plans/revoke', 'requireSuperAdmin'],
      ['PATCH /api/v1/admin/users/role', 'requireSuperAdmin'],
      ['POST /api/v1/ops/db/ensure-alert-notification-attempts', 'requireSuperAdmin'],
      ['POST /api/v1/ops/alerts/evaluate', 'requireSuperAdmin'],
    ])

    for (const [routeKey, expectedGuard] of superAdminMutations.entries()) {
      const actual = routes.find((route) => `${route.method} ${route.url}` === routeKey)
      expect(actual, `missing ${routeKey}`).toBeTruthy()
      expect(actual?.guards).toContain(expectedGuard)
    }
  })

  it('registers admin session exchange and refresh routes for the UI bootstrap flow', async () => {
    vi.resetModules()
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development',
      ENVIRONMENT: 'dev',
      PLANE_A_CORS_ORIGINS: 'http://localhost:3000',
      DATABASE_URL_PLANE_A: 'postgres://remit:remit@localhost:5432/remit',
      DATABASE_URL_PLANE_B: 'postgres://remit:remit@localhost:5432/remit',
      DATABASE_URL_PLANE_C: 'postgres://remit:remit@localhost:5432/remit',
      REDIS_URL: 'redis://localhost:6379',
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_PUBLISHABLE_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      PLANE_A_JWT_SECRET: 'test-secret',
      PLANE_A_ADMIN_EMAILS: 'omar@remit-scout.com',
    }

    const urls = new Set<string>()
    const { buildApp } = await import('../plane-a/src/app')
    const app = await buildApp({
      onRoute: (routeOptions: RouteOptionsLike) => {
        const url = typeof routeOptions?.url === 'string' ? routeOptions.url : ''
        if (url.startsWith('/api/v1/sessions/admin')) {
          urls.add(url)
        }
      },
    })

    try {
      await app.ready()
      expect(urls).toEqual(new Set([
        '/api/v1/sessions/admin/exchange',
        '/api/v1/sessions/admin/refresh',
      ]))
    } finally {
      await app.close()
    }
  })
})
