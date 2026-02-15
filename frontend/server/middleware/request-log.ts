import { randomUUID } from 'node:crypto'
import { defineEventHandler, getMethod, getRequestHeader, getRequestURL, setResponseHeader } from 'h3'

export default defineEventHandler((event) => {
  const start = Date.now()
  const url = getRequestURL(event)
  const method = getMethod(event)

  // Health checks are intentionally quiet.
  if (url.pathname === '/api/health') return

  const requestId = getRequestHeader(event, 'x-request-id') || randomUUID()

  // Set request ID for downstream use.
  event.context.requestId = requestId
  setResponseHeader(event, 'x-request-id', requestId)

  event.node.res.on('finish', () => {
    const duration = Date.now() - start
    const status = event.node.res.statusCode

    // Skip noisy static asset requests.
    if (url.pathname.startsWith('/_nuxt/') || url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|ico|woff2?)$/)) return

    const log = {
      timestamp: new Date().toISOString(),
      method,
      path: url.pathname,
      status,
      duration,
      requestId,
      ip: getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: getRequestHeader(event, 'user-agent')?.slice(0, 200),
    }

    if (status >= 500) {
      console.error(JSON.stringify(log))
    }
    else if (status >= 400) {
      console.warn(JSON.stringify(log))
    }
    else if (duration > 5000) {
      console.warn(JSON.stringify({ ...log, slow: true }))
    }
    // Don't log successful fast requests in production to reduce noise.
  })
})
