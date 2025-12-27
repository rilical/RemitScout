import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const params = event.context.params?.path
  const suffix = Array.isArray(params) ? params.join('/') : params || ''
  const target = suffix ? `/${suffix}` : '/'
  return await proxyToBackend(event, target)
})
