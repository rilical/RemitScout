import { createError, defineEventHandler, getMethod, getRequestHeader, getRequestURL, setResponseHeaders } from 'h3'
import { checkRateLimit } from '~/server/utils/rateLimiter'

const isSensitiveMethodPath = (pathname: string, method: string) => (pathname === '/api/recent-searches' && method === 'POST')
  || (pathname === '/api/click' && method === 'POST')

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const method = getMethod(event)

  // Health checks should never be rate-limited.
  if (url.pathname === '/api/health') return

  // Only rate-limit API proxy routes (not pages/assets).
  if (!url.pathname.startsWith('/api/')) return

  // Don't rate-limit CORS preflights.
  if (method === 'OPTIONS') return

  const ip = getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    || getRequestHeader(event, 'x-real-ip')
    || getRequestHeader(event, 'cloudfront-viewer-address')?.split(':')[0]?.trim()
    || 'unknown'

  const hasAuth = Boolean(getRequestHeader(event, 'authorization'))

  // Default limits
  let limit = hasAuth ? 600 : 120 // per minute

  // Stricter limits for sensitive endpoints
  if (url.pathname === '/api/stripe/create-checkout') limit = 10
  if (url.pathname === '/api/newsletter/subscribe') limit = 5
  if (isSensitiveMethodPath(url.pathname, method)) {
    if (url.pathname === '/api/recent-searches') limit = 30
    if (url.pathname === '/api/click') limit = 60
  }

  const result = checkRateLimit(ip, { windowMs: 60_000, maxRequests: limit })

  setResponseHeaders(event, {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetMs / 1000)),
  })

  if (!result.allowed) {
    throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
  }
})
