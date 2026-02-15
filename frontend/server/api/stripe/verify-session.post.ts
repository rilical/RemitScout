import { setResponseHeaders } from 'h3'
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const data = await proxyToBackend(event, '/billing/verify-session')
  setResponseHeaders(event, { 'cache-control': 'no-store' })
  return data
})
