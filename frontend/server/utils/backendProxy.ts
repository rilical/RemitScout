import { createError, getHeaders, getMethod, getQuery, readBody, setResponseStatus } from 'h3'
import { joinURL } from 'ufo'

const FORWARDED_HEADERS = [
  'authorization',
  'cookie',
  'user-agent',
  'x-forwarded-for',
  'x-real-ip',
  'x-request-id',
  'accept-language',
  'cloudfront-viewer-country',
  'cloudfront-request-id',
  'cloudfront-viewer-address',
]

const getBackendBase = () => {
  const config = useRuntimeConfig()
  const base = config.apiBase || config.public.apiBase

  if (!base) {
    throw createError({
      statusCode: 500,
      statusMessage: 'API_BASE is not configured for backend proxying.',
    })
  }

  // If base is a relative path, it's for client-side use only
  // Server-side proxy needs an absolute URL
  if (base.startsWith('/')) {
    throw createError({
      statusCode: 500,
      statusMessage: 'API_BASE must be an absolute URL (e.g., http://localhost:3000) for server-side proxying.',
    })
  }

  // Parse the base URL
  const baseUrl = new URL(base)
  
  // Ensure base URL path ends with /api/v1 for versioned endpoints
  let pathname = baseUrl.pathname.replace(/\/$/, '') // Remove trailing slash
  
  // If pathname doesn't end with /api/v1, append it
  if (!pathname.endsWith('/api/v1')) {
    // Remove /api if present to avoid /api/api/v1
    if (pathname.endsWith('/api')) {
      pathname = pathname.slice(0, -4) // Remove '/api'
    }
    pathname = pathname + '/api/v1'
  }
  
  baseUrl.pathname = pathname

  return baseUrl.toString().replace(/\/$/, '')
}

const buildForwardHeaders = (
  headers: Record<string, string | string[] | undefined>,
) => {
  const forwarded: Record<string, string> = {}

  FORWARDED_HEADERS.forEach((key) => {
    const value = headers[key]
    if (!value) return
    forwarded[key] = Array.isArray(value) ? value.join(',') : value
  })

  const cloudfrontRequestId = headers['cloudfront-request-id']
  if (cloudfrontRequestId) {
    forwarded['x-cloudfront-request-id'] = Array.isArray(cloudfrontRequestId)
      ? cloudfrontRequestId[0]
      : cloudfrontRequestId
  }

  return forwarded
}

const DEFAULT_TIMEOUT_MS = 30000
const NON_BLOCKING_PATHS = new Set([
  '/sessions/track',
  '/telemetry/session',
  '/telemetry/search',
  '/telemetry/click',
])

const isNonBlockingPath = (path: string) => NON_BLOCKING_PATHS.has(path)

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 100,
): Promise<T> => {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      const statusCode = error?.statusCode || error?.response?.status
      if (statusCode && statusCode >= 500 && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw lastError
}

export const proxyToBackend = async (event: any, path: string) => {
  const base = getBackendBase()
  const method = getMethod(event)
  const query = getQuery(event)
  const headers = buildForwardHeaders(getHeaders(event))
  const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(event)
  const nonBlocking = isNonBlockingPath(path)

  const timeoutMs =
    Number(process.env.BACKEND_PROXY_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS

  return await retryWithBackoff(async () => {
    try {
      return await $fetch(joinURL(base, path), {
        method,
        query,
        body,
        headers,
        timeout: timeoutMs,
      })
    } catch (error: any) {
      const statusCode = error?.statusCode || error?.response?.status
      if (nonBlocking && (statusCode === 401 || statusCode === 403)) {
        setResponseStatus(event, 204)
        return { ok: false, status: statusCode }
      }
      if (statusCode && statusCode >= 500) {
        throw error
      }
      if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
        throw error
      }
      throw error
    }
  })
}
