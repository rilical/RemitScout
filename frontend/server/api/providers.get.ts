import { setResponseHeaders } from 'h3'
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const data = await proxyToBackend(event, '/providers')
  setResponseHeaders(event, { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=120' })
  return data
})
