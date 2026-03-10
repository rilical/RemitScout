import { proxyToBackend } from '~/server/utils/backendProxy'
import { getPulseDevMockResponse, shouldUsePulseDevMock } from '../../utils/pulseDevMockData'
import { getQuery, getMethod } from 'h3'

export default defineEventHandler(async (event) => {
  const params = event.context.params?.path
  const suffix = Array.isArray(params) ? params.join('/') : params || ''
  const method = getMethod(event)
  const query = getQuery(event) as Record<string, string | string[] | undefined>

  if (process.env.NODE_ENV !== 'production' && method === 'GET' && shouldUsePulseDevMock(query)) {
    const mock = getPulseDevMockResponse(suffix, query)
    if (mock !== null) return mock
  }

  const target = suffix ? `/pulse/${suffix}` : '/pulse'
  return await proxyToBackend(event, target)
})
