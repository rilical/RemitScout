import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createHash, randomUUID } from 'crypto'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAdmin } from '../plugins/auth-plugin'
import { buildRateLimitKey, checkRateLimit } from '../utils/rate-limit'

const logger = createLogger('plane-a.marketing')
const pool = getPool(config.db.planeAUrl)

const eventSchema = z.object({
  event_name: z.string().min(2).max(64),
  event_id: z.string().min(8).optional(),
  event_time: z.coerce.number().int().optional(),
  event_source_url: z.string().url().optional(),
  value: z.coerce.number().positive().optional(),
  currency: z.string().length(3).optional(),
  provider_id: z.string().optional(),
  corridor_id: z.string().optional(),
  source: z.string().optional(),
  page_path: z.string().optional(),
  utm: z.record(z.string()).optional(),
  fbclid: z.string().optional(),
  fbc: z.string().optional(),
  fbp: z.string().optional(),
  custom_data: z.record(z.unknown()).optional(),
})

const hashValue = (value?: string | null) => {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined
  return createHash('sha256').update(normalized).digest('hex')
}

const toTimestamp = (value?: number) => {
  if (!value || !Number.isFinite(value)) {
    return Math.floor(Date.now() / 1000)
  }
  const normalized = value > 1e12 ? value / 1000 : value
  return Math.floor(normalized)
}

const insertEvent = async (input: {
  event_name: string
  event_id: string
  event_time: number
  event_source_url?: string | null
  anon_session_id?: string | null
  user_id?: string | null
  provider_id?: string | null
  corridor_id?: string | null
  conversion_value?: number | null
  conversion_currency?: string | null
  source?: string | null
  page_path?: string | null
  utm?: Record<string, string> | null
  fbclid?: string | null
  fbc?: string | null
  fbp?: string | null
  client_ip?: string | null
  user_agent?: string | null
}) => {
  const result = await query(
    `INSERT INTO silver.telemetry_marketing_event (
       event_name,
       event_id,
       event_time,
       event_source_url,
       anon_session_id,
       user_id,
       provider_id,
       corridor_id,
       conversion_value,
       conversion_currency,
       source,
       page_path,
       utm,
       fbclid,
       fbc,
       fbp,
       client_ip,
       user_agent
     ) VALUES (
       $1, $2, to_timestamp($3), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18
     )
     ON CONFLICT (event_id) DO NOTHING`,
    [
      input.event_name,
      input.event_id,
      input.event_time,
      input.event_source_url ?? null,
      input.anon_session_id ?? null,
      input.user_id ?? null,
      input.provider_id ?? null,
      input.corridor_id ?? null,
      input.conversion_value ?? null,
      input.conversion_currency ?? null,
      input.source ?? null,
      input.page_path ?? null,
      input.utm ? JSON.stringify(input.utm) : null,
      input.fbclid ?? null,
      input.fbc ?? null,
      input.fbp ?? null,
      input.client_ip ?? null,
      input.user_agent ?? null,
    ],
    pool,
  )

  return result.rowCount ?? 0
}

const sendToMeta = async (payload: {
  event_name: string
  event_id: string
  event_time: number
  event_source_url?: string | null
  user_data: Record<string, string | undefined>
  custom_data?: Record<string, unknown>
}) => {
  const pixelId = config.marketing.meta.pixelId
  const accessToken = config.marketing.meta.accessToken
  if (!pixelId || !accessToken) {
    return { delivered: false, reason: 'meta_capi_disabled' }
  }

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: payload.event_name,
        event_time: payload.event_time,
        event_id: payload.event_id,
        event_source_url: payload.event_source_url ?? undefined,
        action_source: 'website',
        user_data: payload.user_data,
        custom_data: payload.custom_data ?? {},
      },
    ],
  }

  if (config.marketing.meta.testEventCode) {
    body.test_event_code = config.marketing.meta.testEventCode
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const text = await response.text()
      logger.warn('meta_capi_failed', {
        status: response.status,
        body: text,
      })
      return { delivered: false, reason: 'meta_capi_failed' }
    }
    return { delivered: true }
  } catch (error) {
    logger.warn('meta_capi_error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { delivered: false, reason: 'meta_capi_error' }
  }
}

export const marketingRoutes = async (app: FastifyInstance) => {
  app.post('/marketing/meta', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = eventSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const input = parsed.data
    const eventId = input.event_id || randomUUID()
    const eventTime = toTimestamp(input.event_time)
    const seed = `${request.ip || 'unknown'}:${input.event_name}`
    const rateKey = buildRateLimitKey('marketing:meta', seed)
    if (await checkRateLimit({ logger, key: rateKey, limit: 60, ttlSeconds: 60, component: 'marketing' })) {
      reply.code(429)
      return { error: 'rate_limited' }
    }
    const user = request.user
    const userAgent = typeof request.headers['user-agent'] === 'string'
      ? request.headers['user-agent']
      : undefined

    try {
      const inserted = await insertEvent({
        event_name: input.event_name,
        event_id: eventId,
        event_time: eventTime,
        event_source_url: input.event_source_url ?? null,
        anon_session_id: null,
        user_id: user?.user_id ?? null,
        provider_id: input.provider_id ?? null,
        corridor_id: input.corridor_id ?? null,
        conversion_value: input.value ?? null,
        conversion_currency: input.currency?.toUpperCase() ?? null,
        source: input.source ?? null,
        page_path: input.page_path ?? null,
        utm: input.utm ?? null,
        fbclid: input.fbclid ?? null,
        fbc: input.fbc ?? null,
        fbp: input.fbp ?? null,
        client_ip: request.ip,
        user_agent: userAgent,
      })

      if (!inserted) {
        return { success: true, deduped: true }
      }

      const userData: Record<string, string | undefined> = {
        client_ip_address: request.ip,
        client_user_agent: userAgent,
        fbc: input.fbc,
        fbp: input.fbp,
        em: hashValue(user?.email),
      }

      const customData = {
        value: input.value,
        currency: input.currency?.toUpperCase(),
        provider_id: input.provider_id,
        corridor_id: input.corridor_id,
        source: input.source,
        page_path: input.page_path,
        ...input.custom_data,
      }

      const meta = await sendToMeta({
        event_name: input.event_name,
        event_id: eventId,
        event_time: eventTime,
        event_source_url: input.event_source_url ?? null,
        user_data: userData,
        custom_data: customData,
      })

      return { success: true, delivered: meta.delivered, event_id: eventId }
    } catch (error) {
      logger.warn('marketing_event_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
