import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createHash, randomUUID } from 'crypto'
import { query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { AppError, RateLimitError, ValidationError } from '../../../shared/errors'
import { buildRateLimitKey, checkRateLimit } from '../utils/rate-limit'

const logger = createLogger('plane-a.marketing')

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
  gclid: z.string().optional(),
  fbclid: z.string().optional(),
  msclkid: z.string().optional(),
  ttclid: z.string().optional(),
  li_fat_id: z.string().optional(),
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

const insertEvent = async (
  pool: FastifyInstance['container']['pool'],
  input: {
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
  gclid?: string | null
  fbclid?: string | null
  msclkid?: string | null
  ttclid?: string | null
  li_fat_id?: string | null
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
       gclid,
       fbclid,
       msclkid,
       ttclid,
       li_fat_id,
       fbc,
       fbp,
       client_ip,
       user_agent
     ) VALUES (
       $1, $2, to_timestamp($3), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18, $19, $20, $21, $22
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
      input.gclid ?? null,
      input.fbclid ?? null,
      input.msclkid ?? null,
      input.ttclid ?? null,
      input.li_fat_id ?? null,
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

const shouldSkipMarketing = async (
  userAccountRepository: FastifyInstance['container']['repositories']['userAccount'],
  userId?: string | null,
): Promise<boolean> => {
  if (!userId) return false
  try {
    const settings = await userAccountRepository.getPrivacySettings(userId)
    if (!settings?.updated_at) return true
    return settings.marketing_enabled === false
  } catch (error) {
    logger.warn('marketing_privacy_lookup_failed', {
      user_id: userId,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

export const marketingRoutes = async (app: FastifyInstance) => {
  const pool = app.container.pool
  const userAccountRepository = app.container.repositories.userAccount

  app.post('/marketing/meta', async (request, _reply) => {
    const parsed = eventSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', { details: parsed.error.issues })
    }

    const input = parsed.data
    const eventId = input.event_id || randomUUID()
    const eventTime = toTimestamp(input.event_time)
    const seed = `${request.ip || 'unknown'}:${input.event_name}`
    const rateKey = buildRateLimitKey('marketing:meta', seed)
    if (await checkRateLimit({ logger, key: rateKey, limit: 60, ttlSeconds: 60, component: 'marketing' })) {
      throw new RateLimitError()
    }
    const user = request.user
    const userAgent = typeof request.headers['user-agent'] === 'string'
      ? request.headers['user-agent']
      : undefined

    try {
      if (await shouldSkipMarketing(userAccountRepository, user?.user_id)) {
        return { success: true, skipped: 'opt_out' }
      }

     const inserted = await insertEvent(pool, {
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
        gclid: input.gclid ?? null,
        fbclid: input.fbclid ?? null,
        msclkid: input.msclkid ?? null,
        ttclid: input.ttclid ?? null,
        li_fat_id: input.li_fat_id ?? null,
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
      if (error instanceof AppError) {
        throw error
      }
      logger.warn('marketing_event_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw new AppError('Marketing event failed', {
        statusCode: 500,
        code: 'internal_error',
        cause: error,
      })
    }
  })

  // NOTE: We intentionally do not attempt to send events to other networks until you provide the real secrets/IDs.
  // These endpoints exist so clients can send reason-coded payloads and we can persist attribution in Silver today.

  app.post('/marketing/tiktok', async (request, _reply) => {
    const parsed = eventSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', { details: parsed.error.issues })
    }
    const input = parsed.data
    const eventId = input.event_id || randomUUID()
    const eventTime = toTimestamp(input.event_time)

    const inserted = await insertEvent(pool, {
      event_name: input.event_name,
      event_id: eventId,
      event_time: eventTime,
      event_source_url: input.event_source_url ?? null,
      anon_session_id: null,
      user_id: request.user?.user_id ?? null,
      provider_id: input.provider_id ?? null,
      corridor_id: input.corridor_id ?? null,
      conversion_value: input.value ?? null,
      conversion_currency: input.currency?.toUpperCase() ?? null,
      source: input.source ?? null,
      page_path: input.page_path ?? null,
      utm: input.utm ?? null,
      gclid: input.gclid ?? null,
      fbclid: input.fbclid ?? null,
      msclkid: input.msclkid ?? null,
      ttclid: input.ttclid ?? null,
      li_fat_id: input.li_fat_id ?? null,
      fbc: input.fbc ?? null,
      fbp: input.fbp ?? null,
      client_ip: request.ip,
      user_agent: typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : undefined,
    })

    return {
      success: true,
      deduped: !inserted,
      delivered: false,
      reason: 'tiktok_events_disabled',
    }
  })

  app.post('/marketing/linkedin', async (request, _reply) => {
    const parsed = eventSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', { details: parsed.error.issues })
    }
    const input = parsed.data
    const eventId = input.event_id || randomUUID()
    const eventTime = toTimestamp(input.event_time)

    const inserted = await insertEvent(pool, {
      event_name: input.event_name,
      event_id: eventId,
      event_time: eventTime,
      event_source_url: input.event_source_url ?? null,
      anon_session_id: null,
      user_id: request.user?.user_id ?? null,
      provider_id: input.provider_id ?? null,
      corridor_id: input.corridor_id ?? null,
      conversion_value: input.value ?? null,
      conversion_currency: input.currency?.toUpperCase() ?? null,
      source: input.source ?? null,
      page_path: input.page_path ?? null,
      utm: input.utm ?? null,
      gclid: input.gclid ?? null,
      fbclid: input.fbclid ?? null,
      msclkid: input.msclkid ?? null,
      ttclid: input.ttclid ?? null,
      li_fat_id: input.li_fat_id ?? null,
      fbc: input.fbc ?? null,
      fbp: input.fbp ?? null,
      client_ip: request.ip,
      user_agent: typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : undefined,
    })

    return {
      success: true,
      deduped: !inserted,
      delivered: false,
      reason: 'linkedin_conversions_disabled',
    }
  })

  app.post('/marketing/google', async (request, _reply) => {
    const parsed = eventSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', { details: parsed.error.issues })
    }
    const input = parsed.data
    const eventId = input.event_id || randomUUID()
    const eventTime = toTimestamp(input.event_time)

    const inserted = await insertEvent(pool, {
      event_name: input.event_name,
      event_id: eventId,
      event_time: eventTime,
      event_source_url: input.event_source_url ?? null,
      anon_session_id: null,
      user_id: request.user?.user_id ?? null,
      provider_id: input.provider_id ?? null,
      corridor_id: input.corridor_id ?? null,
      conversion_value: input.value ?? null,
      conversion_currency: input.currency?.toUpperCase() ?? null,
      source: input.source ?? null,
      page_path: input.page_path ?? null,
      utm: input.utm ?? null,
      gclid: input.gclid ?? null,
      fbclid: input.fbclid ?? null,
      msclkid: input.msclkid ?? null,
      ttclid: input.ttclid ?? null,
      li_fat_id: input.li_fat_id ?? null,
      fbc: input.fbc ?? null,
      fbp: input.fbp ?? null,
      client_ip: request.ip,
      user_agent: typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : undefined,
    })

    return {
      success: true,
      deduped: !inserted,
      delivered: false,
      reason: 'google_ads_offline_disabled',
    }
  })
}
