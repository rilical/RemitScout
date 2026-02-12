import type { FastifyInstance } from 'fastify'
import { createHash } from 'crypto'

import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { createTtlCache } from '../../../shared/cache'
import { DEFAULT_FALLBACK_TTL_SECONDS } from '../../../shared/constants'
import { COUNTRIES } from '../../../shared/countries-currencies'

const logger = createLogger('plane-a.geo')

const DEFAULT_COUNTRY = {
  code: 'US',
  name: 'United States',
  currency: 'USD',
}

const geoCache = createTtlCache<GeoResponse>({ namespace: 'plane_a:geo' })
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

type GeoResponse = {
  countryCode: string
  country: string
  currency: string
  timezone?: string | null
  source: string
}

const normalizeHeaderValue = (value: string | string[] | undefined): string | null => {
  if (!value) return null
  if (Array.isArray(value)) return value[0]?.trim() || null
  return value.trim()
}

const resolveCountryFromHeaders = (
  headers: Record<string, string | string[] | undefined>,
): { code: string | null; source: string } => {
  const configuredHeader = config.geo.countryHeader?.toLowerCase() || ''
  const candidates: Array<{ header: string; source: string }> = [
    { header: configuredHeader, source: configuredHeader || 'config' },
    { header: 'cloudfront-viewer-country', source: 'cloudfront' },
    { header: 'cf-ipcountry', source: 'cloudflare' },
    { header: 'x-country-code', source: 'header' },
    { header: 'x-geo-country', source: 'header' },
  ]

  for (const candidate of candidates) {
    if (!candidate.header) continue
    const raw = normalizeHeaderValue(headers[candidate.header])
    if (!raw) continue
    const code = raw.toUpperCase()
    if (code.length === 2) {
      return { code, source: candidate.source }
    }
  }

  return { code: null, source: 'default' }
}

export const geoRoutes = async (app: FastifyInstance) => {
  app.get('/geo', async (request, reply) => {
    const ip = request.ip || ''
    const cacheKey = ip
      ? createHash('sha256').update(ip).digest('hex')
      : null

    if (cacheKey) {
      const cached = await geoCache.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    const { code, source } = resolveCountryFromHeaders(request.headers)
    const resolved = code
      ? COUNTRIES.find(c => c.code === code) || DEFAULT_COUNTRY
      : DEFAULT_COUNTRY

    const response: GeoResponse = {
      countryCode: resolved.code,
      country: resolved.name,
      currency: resolved.currency,
      timezone: null,
      source,
    }

    if (cacheKey) {
      try {
        await geoCache.set(cacheKey, response, CACHE_TTL_MS)
      } catch (error) {
        logger.warn('geo_cache_set_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    reply.header(
      'Cache-Control',
      `public, max-age=${DEFAULT_FALLBACK_TTL_SECONDS}, stale-while-revalidate=86400`,
    )
    return response
  })
}
