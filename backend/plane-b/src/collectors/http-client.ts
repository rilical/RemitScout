import { createHash } from 'node:crypto'
import { setTimeout as sleep } from 'timers/promises'
import { ProxyAgent, fetch as undiciFetch } from 'undici'

import { createLogger } from '../../../shared/logger'
import { retry } from '../../../shared/retry'
import { formatError, isError } from '../../../shared/utils/error-handling'
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
const MAX_LOGGED_PROXY_USAGE = 1000
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

  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    throw new Error('Invalid URL: url must be a non-empty string')
  }

  try {
    new URL(url)
  } catch {
    throw new Error(`Invalid URL format: ${url}`)
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`Invalid timeout: timeoutMs must be a positive number`)
  }

  if (!Number.isFinite(jitterMs) || jitterMs < 0) {
    throw new Error(`Invalid jitter: jitterMs must be a non-negative number`)
  }

  if (method && typeof method !== 'string') {
    throw new Error('Invalid method: method must be a string')
  }

  if (jitterMs > 0) {
    const delay = Math.floor(Math.random() * jitterMs)
    if (delay > 0) {
      await sleep(delay)
    }
  }

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

  // Resolve proxy URL (async for Secrets Manager/SSM support)
  let resolvedProxyUrl: string | null = proxyUrl ?? null
  if (!resolvedProxyUrl && proxyTier) {
    const { getProxyForTier, getProxyForTierSync } = await import('../lib/proxy-router')
    // Try sync first (uses cache or env vars)
    resolvedProxyUrl = getProxyForTierSync(proxyTier)
    // If not resolved, try async (resolves from Secrets Manager/SSM)
    if (!resolvedProxyUrl) {
      resolvedProxyUrl = await getProxyForTier(proxyTier)
    }
  }
  if (proxyTier && corridorId) {
    const proxyUrlHash = resolvedProxyUrl ? hashProxyUrl(resolvedProxyUrl) : null
    const logKey = `${corridorId}:${proxyTier}:${proxyUrlHash ?? 'none'}`
    if (!loggedProxyUsage.has(logKey)) {
      if (loggedProxyUsage.size >= MAX_LOGGED_PROXY_USAGE) {
        const firstKey = loggedProxyUsage.values().next().value
        if (firstKey) {
          loggedProxyUsage.delete(firstKey)
        }
      }
      loggedProxyUsage.add(logKey)
      logger.info('proxy_usage', {
        corridor_id: corridorId,
        proxy_tier: proxyTier,
        proxy_url_hash: proxyUrlHash,
      })
    }
  }
  const dispatcher = resolvedProxyUrl ? new ProxyAgent(resolvedProxyUrl) : undefined

  const executeRequest = async (): Promise<HttpResponse> => {
    const requestController = new AbortController()
    const requestTimeout = setTimeout(() => requestController.abort(), timeoutMs)

    try {
      const response = await undiciFetch(url, {
        method,
        headers: finalHeaders,
        body: payload,
        signal: requestController.signal,
        dispatcher,
      })

      let bodyText: string
      try {
        bodyText = await response.text()
      } catch (error: unknown) {
        clearTimeout(requestTimeout)
        const { message } = formatError(error)
        logger.error('http_response_body_read_failed', {
          url,
          status: response.status,
          error: message,
          proxy_tier: proxyTier,
          corridor_id: corridorId,
        })
        return {
          status: response.status,
          bodyText: '',
          json: undefined,
        }
      }

      let json: unknown
      try {
        json = JSON.parse(bodyText)
      } catch (parseError) {
        json = undefined
        if (response.headers.get('content-type')?.includes('application/json')) {
          logger.debug('http_response_json_parse_failed', {
            url,
            status: response.status,
            body_preview: bodyText.substring(0, 200),
          })
        }
      }

      clearTimeout(requestTimeout)

      if (response.status >= 500 || response.status === 429) {
        throw new Error(`HTTP ${response.status}: ${url}`)
      }

      return {
        status: response.status,
        bodyText,
        json,
      }
    } catch (error: unknown) {
      clearTimeout(requestTimeout)

      if (isError(error) && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
        throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`)
      }

      throw error
    }
  }

  try {
    return await retry(executeRequest, {
      maxRetries: 3,
      initialDelayMs: 1000,
      retryable: (error) => {
        if (isError(error)) {
          const errorMessage = error.message
          if (errorMessage.includes('network') ||
              errorMessage.includes('timeout') ||
              errorMessage.includes('ECONNREFUSED') ||
              errorMessage.includes('ETIMEDOUT') ||
              errorMessage.includes('ENOTFOUND') ||
              errorMessage.includes('HTTP 5') ||
              errorMessage.includes('HTTP 429')) {
            return true
          }
        }
        return false
      },
    })
  } catch (error: unknown) {
    if (isError(error) && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      logger.warn('http_request_timeout', {
        url,
        timeout_ms: timeoutMs,
        proxy_tier: proxyTier,
        corridor_id: corridorId,
      })
      throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`)
    }

    const { message, stack } = formatError(error)
    const errorName = isError(error) ? error.name : 'Unknown'
    logger.error('http_request_failed', {
      url,
      method,
      proxy_tier: proxyTier,
      corridor_id: corridorId,
      error: message,
      error_name: errorName,
      stack,
    })
    throw error
  }
}
