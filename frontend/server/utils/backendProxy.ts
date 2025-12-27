import { createError, getHeaders, getMethod, getQuery, readBody } from 'h3'
import { joinURL } from 'ufo'

const FORWARDED_HEADERS = [
  'authorization',
  'cookie',
  'user-agent',
  'x-forwarded-for',
  'x-real-ip',
  'x-request-id',
  'accept-language',
]

const getBackendBase = () => {
  const config = useRuntimeConfig()
  const base = config.apiBase || config.public.apiBase

  if (!base || base.startsWith('/')) {
    throw createError({
      statusCode: 500,
      statusMessage: 'API_BASE is not configured for backend proxying.',
    })
  }

  return base
}

const buildForwardHeaders = (headers: Record<string, string | string[] | undefined>) => {
  const forwarded: Record<string, string> = {}

  FORWARDED_HEADERS.forEach((key) => {
    const value = headers[key]
    if (!value) return
    forwarded[key] = Array.isArray(value) ? value.join(',') : value
  })

  return forwarded
}

export const proxyToBackend = async (event: any, path: string) => {
  const base = getBackendBase()
  const method = getMethod(event)
  const query = getQuery(event)
  const headers = buildForwardHeaders(getHeaders(event))
  const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(event)

  return await $fetch(joinURL(base, path), {
    method,
    query,
    body,
    headers,
  })
}
