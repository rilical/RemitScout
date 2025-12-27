import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  return await proxyToBackend(event, '/popular-corridors')
})
