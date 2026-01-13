import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  return await proxyToBackend(event, '/recent-searches', {
    nonBlocking: true,
    maxRetries: 0,
    timeoutMs: 3000,
  })
})
