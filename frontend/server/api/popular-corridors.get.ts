import { setResponseHeaders } from 'h3'
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const data = await proxyToBackend(event, '/popular-corridors')
  setResponseHeaders(event, { 'cache-control': 'public, s-maxage=300, stale-while-revalidate=600' })
  return data
})
