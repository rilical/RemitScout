import { createHash } from 'node:crypto'
import { setTimeout as sleep } from 'timers/promises'
import { ProxyAgent } from 'undici'

import { createLogger } from '../../../shared/logger'
import { getProxyForTier } from '../lib/proxy-router'
import type { ProxyTier } from '../lib/proxy-router'

export type HttpClientOptions = {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: string | Record<string, unknown>
  timeoutMs?: number
  jitterMs?: number
  proxyUrl?: string
  proxyTier?: ProxyTier
  corridorId?: string
}

export type HttpResponse = {
  status: number
  bodyText: string
  json?: unknown
}

const logger = createLogger('plane-b.http-client')
const loggedProxyUsage = new Set<string>()

const hashProxyUrl = (proxyUrl: string) =>
  createHash('sha256').update(proxyUrl).digest('hex').slice(0, 12)

export const httpRequest = async (options: HttpClientOptions): Promise<HttpResponse> => {
  const {
    url,
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 20000,
    jitterMs = 0,
    proxyUrl,
    proxyTier,
    corridorId,
  } = options

  if (jitterMs > 0) {
    const delay = Math.floor(Math.random() * jitterMs)
    if (delay > 0) {
      await sleep(delay)
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  const finalHeaders = { ...headers }
  let payload: string | undefined
  if (body !== undefined) {
    if (typeof body === 'string') {
      payload = body
    } else {
      payload = JSON.stringify(body)
      if (!finalHeaders['content-type']) {
        finalHeaders['content-type'] = 'application/json'
      }
    }
  }

  const resolvedProxyUrl = proxyUrl ?? (proxyTier ? getProxyForTier(proxyTier) : null)
  if (proxyTier && corridorId) {
    const proxyUrlHash = resolvedProxyUrl ? hashProxyUrl(resolvedProxyUrl) : null
    const logKey = `${corridorId}:${proxyTier}:${proxyUrlHash ?? 'none'}`
    if (!loggedProxyUsage.has(logKey)) {
      loggedProxyUsage.add(logKey)
      logger.info('proxy_usage', {
        corridor_id: corridorId,
        proxy_tier: proxyTier,
        proxy_url_hash: proxyUrlHash,
      })
    }
  }
  const dispatcher = resolvedProxyUrl ? new ProxyAgent(resolvedProxyUrl) : undefined

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: payload,
      signal: controller.signal,
      dispatcher,
    })
    const bodyText = await response.text()
    let json: unknown
    try {
      json = JSON.parse(bodyText)
    } catch {
      json = undefined
    }

    return {
      status: response.status,
      bodyText,
      json,
    }
  } finally {
    clearTimeout(timeout)
  }
}
