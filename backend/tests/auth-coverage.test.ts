import { describe, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

type AuthBypassConfig = {
  bypass_paths: string[]
  bypass_prefixes: string[]
  protected_prefixes: string[]
  public_prefixes: string[]
  public_paths: string[]
}

const loadAuthBypassConfig = (): AuthBypassConfig => {
  const docPath = path.resolve(__dirname, '../../docs/security/auth-bypass-paths.md')
  const content = readFileSync(docPath, 'utf8')
  const match = content.match(/```json\s*([\s\S]*?)\s*```/)
  if (!match) {
    throw new Error(`Missing JSON config block in ${docPath}`)
  }
  const parsed = JSON.parse(match[1] ?? '{}') as Partial<AuthBypassConfig>
  const normalizeList = (value: unknown): string[] => {
    if (!Array.isArray(value)) return []
    return value.filter((v) => typeof v === 'string' && v.length > 0) as string[]
  }
  return {
    bypass_paths: normalizeList(parsed.bypass_paths),
    bypass_prefixes: normalizeList(parsed.bypass_prefixes),
    protected_prefixes: normalizeList(parsed.protected_prefixes),
    public_prefixes: normalizeList(parsed.public_prefixes),
    public_paths: normalizeList(parsed.public_paths),
  }
}

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

type RouteOptionsLike = {
  preHandler?: unknown | unknown[]
  url?: string
  method?: string | string[]
}

type GuardHandler = ((...args: unknown[]) => unknown) & {
  __guardTag?: string
}

const hasAuthGuard = (routeOptions: RouteOptionsLike): boolean => {
  const preHandlers = toArray(routeOptions.preHandler)
  const tags = preHandlers
    .map((fn) => (fn && typeof fn === 'function' ? (fn as GuardHandler).__guardTag ?? null : null))
    .filter(Boolean)
    .map((t) => String(t))

  return tags.includes('requireAuth')
    || tags.includes('requireAdmin')
    || tags.includes('requireSuperAdmin')
    || tags.some((t) => t.startsWith('requireEntitlement:'))
}

describe('auth coverage', () => {
  it('guards all non-bypass routes', async () => {
    const originalEnv = { ...process.env }
    const config = loadAuthBypassConfig()
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

    const routes: RouteOptionsLike[] = []
    const { buildApp } = await import('../plane-a/src/app')
    const app = await buildApp({
      onRoute: (routeOptions) => {
        routes.push(routeOptions)
      },
    })

    try {
      await app.ready()

      const violations: string[] = []

      for (const route of routes) {
        const url = typeof route?.url === 'string' ? route.url : ''
        const methods = toArray(route?.method)
          .map((m) => String(m).toUpperCase())
          .filter(Boolean)

        if (!url || methods.length === 0) continue

        // Ignore automatic preflight / HEAD routes.
        if (methods.includes('OPTIONS')) continue
        if (methods.every((m) => m === 'HEAD')) continue

        const bypassed =
          config.bypass_paths.includes(url)
          || config.bypass_prefixes.some((prefix) => url.startsWith(prefix))
          || config.public_paths.includes(url)
          || config.public_prefixes.some((prefix) => url.startsWith(prefix))

        if (bypassed) {
          continue
        }

        const protectedByGlobalAuth =
          config.protected_prefixes.some((prefix) => url.startsWith(prefix))
          && !config.bypass_paths.includes(url)

        if (protectedByGlobalAuth) {
          continue
        }

        if (!hasAuthGuard(route)) {
          for (const method of methods) {
            violations.push(`${method} ${url}`)
          }
        }
      }

      if (violations.length > 0) {
        throw new Error(
          `Routes missing auth guards (and not allowlisted):\\n` + violations.sort().join('\\n'),
        )
      }
    } finally {
      await app.close()
      process.env = originalEnv
    }
  })
})
