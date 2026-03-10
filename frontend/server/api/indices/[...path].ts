import { proxyToBackend } from '~/server/utils/backendProxy'
import { getQuery, getMethod } from 'h3'
import { getIndicesDevMockResponse, shouldUsePulseDevMock } from '../../utils/pulseDevMockData'

export default defineEventHandler(async (event) => {
  const params = event.context.params?.path
  const suffix = Array.isArray(params) ? params.join('/') : params || ''
  const query = getQuery(event) as Record<string, string | string[] | undefined>

  if (process.env.NODE_ENV !== 'production' && getMethod(event) === 'GET' && shouldUsePulseDevMock(query)) {
    const mock = getIndicesDevMockResponse(suffix, query)
    if (mock !== null) return mock
  }

  const target = suffix ? `/indices/${suffix}` : '/indices'
  return await proxyToBackend(event, target)
})
