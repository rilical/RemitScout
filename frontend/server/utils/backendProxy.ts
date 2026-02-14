import { randomUUID } from 'node:crypto'
import { createError, getHeaders, getMethod, getQuery, getRequestHeader, readBody, setResponseHeader, setResponseStatus } from 'h3'
import { $fetch } from 'ofetch'

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
  const envBase = process.env.API_BASE || process.env.NUXT_API_BASE
  // Prefer env wiring for server proxying. Only fall back to runtime config if env is unset.
  const config = envBase ? undefined : useRuntimeConfig()
  const base = envBase || config?.apiBase || config?.public.apiBase

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
const RETRYABLE_ERROR_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EAI_AGAIN',
  'ENOTFOUND',
])

const isNonBlockingPath = (path: string) => NON_BLOCKING_PATHS.has(path)

const joinUrl = (base: string, path: string) => {
  const cleanBase = base.endsWith('/') ? base : `${base}/`
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${cleanBase}${cleanPath}`
}

type ProxyOptions = {
  timeoutMs?: number
  maxRetries?: number
  nonBlocking?: boolean
}

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 100,
): Promise<T> => {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    }
    catch (error: any) {
      lastError = error
      const statusCode = error?.statusCode || error?.response?.status
      const errorCode = error?.code || error?.cause?.code
      const shouldRetry = (statusCode && statusCode >= 500) || (errorCode && RETRYABLE_ERROR_CODES.has(errorCode))
      if (shouldRetry && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw lastError
}

export const proxyToBackend = async (event: any, path: string, options: ProxyOptions = {}) => {
  const base = getBackendBase()
  const method = getMethod(event)
  const query = getQuery(event)
  const headers = buildForwardHeaders(getHeaders(event))

  const requestId = event.context?.requestId
    || getRequestHeader(event, 'x-request-id')
    || headers['x-request-id']
    || randomUUID()
  headers['x-request-id'] = requestId
  setResponseHeader(event, 'x-request-id', requestId)

  // Body size guardrail (1MB). Prefer header-based rejection when available.
  const contentLengthRaw = getRequestHeader(event, 'content-length')
  const contentLength = contentLengthRaw ? Number(contentLengthRaw) : Number.NaN
  const hasBody = method !== 'GET' && method !== 'HEAD'
  if (hasBody && Number.isFinite(contentLength) && contentLength > 1_000_000) {
    throw createError({ statusCode: 413, statusMessage: 'Payload too large' })
  }

  const body = !hasBody ? undefined : await readBody(event)
  if (body && typeof body === 'string' && body.length > 1_000_000) {
    throw createError({ statusCode: 413, statusMessage: 'Payload too large' })
  }
  const nonBlocking = options.nonBlocking ?? isNonBlockingPath(path)
  const fetcher: any = $fetch as any

  const envTimeoutMs = Number(process.env.BACKEND_PROXY_TIMEOUT_MS)
  const resolvedEnvTimeoutMs = Number.isFinite(envTimeoutMs) && envTimeoutMs > 0 ? envTimeoutMs : undefined

  const timeoutMs = options.timeoutMs
    ?? (nonBlocking ? 3000 : undefined)
    ?? resolvedEnvTimeoutMs
    ?? DEFAULT_TIMEOUT_MS
  const maxRetries = options.maxRetries ?? (nonBlocking ? 0 : 3)

  const start = Date.now()
  try {
    return await retryWithBackoff(async () => {
      try {
        const res = await fetcher.raw(joinUrl(base, path), {
          method,
          query,
          body,
          headers,
          timeout: timeoutMs,
          ignoreResponseError: true,
        })
        const duration = Date.now() - start
        setResponseHeader(event, 'Server-Timing', `backend;dur=${duration}`)

        const statusCode: number = res?.status ?? 0

        // For GET/HEAD, forward backend caching validators to the client.
        // This allows the backend (Plane A) to be the single source of truth for cache policy.
        if ((method === 'GET' || method === 'HEAD') && statusCode > 0 && statusCode < 400) {
          const cacheControl = res.headers?.get?.('cache-control')
          const etag = res.headers?.get?.('etag')
          const lastModified = res.headers?.get?.('last-modified')
          if (cacheControl) setResponseHeader(event, 'cache-control', cacheControl)
          if (etag) setResponseHeader(event, 'etag', etag)
          if (lastModified) setResponseHeader(event, 'last-modified', lastModified)
        }

        if (nonBlocking && statusCode >= 400) {
          setResponseStatus(event, 204)
          return { ok: false, status: statusCode }
        }

        // Propagate non-5xx responses from the backend instead of turning them into 500s.
        if (statusCode >= 400 && statusCode < 500) {
          setResponseStatus(event, statusCode)
          return res?._data ?? { error: 'backend_error', message: res?.statusText || 'Request failed' }
        }

        // Trigger retry/backoff for backend/server errors.
        if (statusCode >= 500) {
          const err: any = new Error('Backend error')
          err.statusCode = statusCode
          err.data = res?._data
          throw err
        }

        return res?._data
      }
      catch (error: any) {
        const statusCode = error?.statusCode || error?.response?.status
        const errorCode = error?.code || error?.cause?.code
        if (nonBlocking) {
          setResponseStatus(event, 204)
          return { ok: false, status: statusCode ?? 0 }
        }
        // Propagate non-5xx responses from the backend instead of turning them into 500s.
        if (statusCode && statusCode < 500) {
          setResponseStatus(event, statusCode)
          return error?.data ?? { error: 'backend_error', message: error?.message || 'Request failed' }
        }
        // Retryable backend/server errors bubble up to the retry wrapper. We'll map them to 503 if retries exhaust.
        if (statusCode && statusCode >= 500) throw error
        if (errorCode && RETRYABLE_ERROR_CODES.has(errorCode)) throw error
        if (!statusCode && typeof error?.message === 'string' && error.message.includes('fetch failed')) throw error
        throw error
      }
    }, maxRetries)
  }
  catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status
    const errorCode = error?.code || error?.cause?.code
    const message = error?.data?.message || error?.message || 'Request failed'

    const duration = Date.now() - start
    setResponseHeader(event, 'Server-Timing', `backend;dur=${duration}`)

    // Don't swallow client errors raised inside the proxy (e.g., 413).
    if (statusCode && statusCode < 500) throw error

    if (statusCode && statusCode >= 500) {
      // Log full backend error details server-side (sanitized client response).
      console.error(JSON.stringify({ requestId, target: path, statusCode, backendError: error?.data }))

      setResponseStatus(event, 503)
      return {
        error: 'service_unavailable',
        message: 'Service temporarily unavailable',
        requestId,
      }
    }

    // Never crash the Nuxt server due to backend outages; return a stable 503 shape.
    setResponseStatus(event, 503)
    return {
      error: 'backend_unreachable',
      message: errorCode
        ? `Backend unreachable (${errorCode}).`
        : statusCode
          ? `Backend error (${statusCode}).`
          : 'Backend unreachable.',
      requestId,
    }
  }
}
