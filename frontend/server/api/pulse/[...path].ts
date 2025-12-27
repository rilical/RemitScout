import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const params = event.context.params?.path
  const suffix = Array.isArray(params) ? params.join('/') : params || ''
  const target = suffix ? `/pulse/${suffix}` : '/pulse'
  return await proxyToBackend(event, target)
})
