import { setResponseHeaders } from 'h3'
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const data = await proxyToBackend(event, '/geo')
  setResponseHeaders(event, { 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=172800' })
  return data
})
