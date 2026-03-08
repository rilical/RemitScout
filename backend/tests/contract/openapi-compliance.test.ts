import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildApp } from '../../plane-a/src/app'
import { resolveRepoPath } from '../support/repo-paths'

type OpenApiOperation = {
  method: string
  path: string
}

const normalizePath = (value: string): string => {
  const withoutTrailingSlash = value.length > 1 ? value.replace(/\/+$/, '') : value
  const withBraces = withoutTrailingSlash.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
  return withBraces.replace(/\/+/g, '/')
}

const toPathMatcher = (openApiPath: string): RegExp => {
  const escaped = openApiPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const withParams = escaped.replace(/\\\{[A-Za-z0-9_]+\\\}/g, '[^/]+')
  return new RegExp(`^${withParams}$`)
}

const extractOpenApiOperations = (doc: string): OpenApiOperation[] => {
  const operations: OpenApiOperation[] = []
  const lines = doc.split(/\r?\n/)
  let inPaths = false
  let currentPath: string | null = null

  for (const line of lines) {
    if (!inPaths) {
      if (/^paths:\s*$/.test(line)) {
        inPaths = true
      }
      continue
    }

    if (/^\S/.test(line)) {
      break
    }

    const pathMatch = line.match(/^ {2}(\/[^:]*):\s*$/)
    if (pathMatch) {
      currentPath = normalizePath(pathMatch[1].trim())
      continue
    }

    const methodMatch = line.match(/^ {4}(get|post|put|patch|delete|options|head):\s*$/i)
    if (methodMatch && currentPath) {
      operations.push({
        method: methodMatch[1].toUpperCase(),
        path: currentPath,
      })
    }
  }

  return operations
}

const extractRuntimeOperations = async (): Promise<Set<string>> => {
  const routes: Array<{ method?: string | string[]; url?: string }> = []
  const app = await buildApp({
    onRoute: (routeOptions) => {
      routes.push(routeOptions as { method?: string | string[]; url?: string })
    },
  })

  try {
    await app.ready()
    const ops = new Set<string>()
    for (const route of routes) {
      const url = typeof route.url === 'string' ? normalizePath(route.url) : ''
      const methodsRaw = route.method
      const methods = Array.isArray(methodsRaw) ? methodsRaw : methodsRaw ? [methodsRaw] : []
      if (!url || methods.length === 0) continue
      for (const method of methods.map((m) => String(m).toUpperCase())) {
        if (method === 'HEAD' || method === 'OPTIONS') continue
        ops.add(`${method} ${url}`)
      }
    }
    return ops
  } finally {
    await app.close()
  }
}

describe('openapi contract compliance', () => {
  it('documents valid OpenAPI header and paths section', () => {
    const file = resolveRepoPath(__dirname, 'docs', 'openapi', 'api.yaml')
    const content = readFileSync(file, 'utf8')

    expect(content).toMatch(/openapi:\s*3\./)
    expect(content).toMatch(/\npaths:\n/)
  })

  it('maps every documented OpenAPI operation to a registered Plane A route', async () => {
    const file = resolveRepoPath(__dirname, 'docs', 'openapi', 'api.yaml')
    const content = readFileSync(file, 'utf8')
    const openApiOperations = extractOpenApiOperations(content)
    const runtimeOperations = await extractRuntimeOperations()

    const missing: string[] = []
    for (const op of openApiOperations) {
      const matcher = toPathMatcher(op.path)
      const hasMatch = [...runtimeOperations].some((runtimeOp) => {
        const [method, runtimePath] = runtimeOp.split(' ', 2)
        return method === op.method && matcher.test(runtimePath)
      })
      if (!hasMatch) {
        missing.push(`${op.method} ${op.path}`)
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `OpenAPI operations missing runtime routes:\n${missing.sort().join('\n')}`,
      )
    }
  })
})
