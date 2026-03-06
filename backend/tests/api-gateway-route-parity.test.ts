import { describe, expect, it } from 'vitest'
import { buildApp } from '../plane-a/src/app'
import { PLANE_A_EXPLICIT_EDGE_ROUTE_PATHS } from '../../infrastructure/cdk/lib/api'

const normalizePath = (value: string): string => {
  const withoutTrailingSlash = value.length > 1 ? value.replace(/\/+$/, '') : value
  return withoutTrailingSlash.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
}

describe('API Gateway route parity', () => {
  it('maps every institutional API-key route to an explicit API Gateway edge route', async () => {
    const runtimeInstitutionalPaths = new Set<string>()
    const app = await buildApp({
      onRoute: (routeOptions: any) => {
        const url = typeof routeOptions?.url === 'string' ? normalizePath(routeOptions.url) : ''
        const policy = routeOptions?.config?.apiKeyAccess
        if (!url || !policy) return
        if (policy.audience !== 'institutional' && policy.audience !== 'both') return
        runtimeInstitutionalPaths.add(url)
      },
    })

    try {
      await app.ready()
      const explicitPaths = new Set(PLANE_A_EXPLICIT_EDGE_ROUTE_PATHS.map(normalizePath))
      const missing = [...runtimeInstitutionalPaths]
        .filter((path) => path.startsWith('/api/v1') && !explicitPaths.has(path))
        .sort()

      expect(missing).toEqual([])
    } finally {
      await app.close()
    }
  })
})
