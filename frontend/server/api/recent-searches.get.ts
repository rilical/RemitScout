import { setResponseHeaders } from 'h3'
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const data = await proxyToBackend(event, '/recent-searches', {
    nonBlocking: true,
    maxRetries: 0,
    timeoutMs: 3000,
  })
  setResponseHeaders(event, { 'cache-control': 'private, no-cache' })
  return data
})
