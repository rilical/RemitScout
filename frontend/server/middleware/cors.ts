import { defineEventHandler, getMethod, getRequestHeader, getRequestURL, setResponseHeaders } from 'h3'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const origin = getRequestHeader(event, 'origin')

  // Only add CORS for embed-related API requests.
  if (url.pathname.startsWith('/api/pulse/') || url.pathname.startsWith('/api/indices/')) {
    if (origin) {
      setResponseHeaders(event, {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-request-id',
        'Access-Control-Max-Age': '86400',
      })
    }

    if (getMethod(event) === 'OPTIONS') {
      event.node.res.statusCode = 204
      event.node.res.end()
      return
    }
  }
})
