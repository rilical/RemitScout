import { setResponseHeaders } from 'h3'
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const data = await proxyToBackend(event, '/bank-vs-specialist')
  setResponseHeaders(event, { 'cache-control': 'public, s-maxage=120, stale-while-revalidate=240' })
  return data
})
