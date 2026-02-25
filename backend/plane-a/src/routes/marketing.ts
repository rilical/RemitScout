import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createHash, randomUUID } from 'crypto'
import { query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { AppError, RateLimitError, ValidationError } from '../../../shared/errors'
import { buildRateLimitKey, checkRateLimit } from '../utils/rate-limit'
import { anonymizeIpAddress, extractBrowserFamily } from '../services/privacy-utils'

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
  ttp: z.string().optional(),
  li_fat_id: z.string().optional(),
  fbc: z.string().optional(),
  fbp: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  external_id: z.string().optional(),
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

const compactObject = <T extends Record<string, unknown>>(input: T) => {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Partial<T>
}

const hashPhone = (value?: string | null) => {
  if (!value) return undefined
  const normalized = value.replace(/[^\d+]/g, '')
  if (!normalized) return undefined
  return createHash('sha256').update(normalized).digest('hex')
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
  client_ip_hash?: string | null
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
       client_ip_hash,
       user_agent
     ) VALUES (
       $1, $2, to_timestamp($3), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
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
      input.client_ip_hash ?? null,
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
    const response = await fetch(`https://graph.facebook.com/v17.0/${pixelId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
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

const sendToTikTok = async (payload: {
  event_name: string
  event_id: string
  event_time: number
  event_source_url?: string | null
  value?: number
  currency?: string
  provider_id?: string | null
  corridor_id?: string | null
  page_path?: string | null
  ttclid?: string | null
  ttp?: string | null
  email?: string | null
  phone?: string | null
  external_id?: string | null
  client_ip_hash?: string | null
  user_agent_family?: string | null
  custom_data?: Record<string, unknown>
}) => {
  const pixelId = config.marketing.tiktok.pixelId
  const accessToken = config.marketing.tiktok.accessToken
  if (!pixelId || !accessToken) {
    return { delivered: false, reason: 'tiktok_events_disabled' }
  }

  const eventName = payload.event_name
  const currency = payload.currency?.toUpperCase()
  const inferredContentId = payload.provider_id || payload.corridor_id
  const inferredContentType = payload.provider_id
    ? 'provider'
    : payload.corridor_id
      ? 'corridor'
      : 'page'
  const inferredContentName = payload.page_path || eventName

  const user = compactObject({
    email: hashValue(payload.email),
    phone_number: hashPhone(payload.phone),
    external_id: hashValue(payload.external_id),
    ip: payload.client_ip_hash ?? undefined,
    user_agent: payload.user_agent_family ?? undefined,
    ttclid: payload.ttclid ?? undefined,
    ttp: payload.ttp ?? undefined,
  })

  const properties = compactObject({
    value: payload.value,
    currency,
    content_id: inferredContentId,
    content_type: inferredContentType,
    content_name: inferredContentName,
    event_id: payload.event_id,
    event_time: payload.event_time,
    url: payload.event_source_url ?? undefined,
    ...payload.custom_data,
  })

  const body: Record<string, unknown> = {
    event_source: 'web',
    event_source_id: pixelId,
    data: [
      {
        event: eventName,
        event_id: payload.event_id,
        event_time: payload.event_time,
        context: compactObject({
          page: payload.event_source_url ? { url: payload.event_source_url } : undefined,
          user: Object.keys(user).length > 0 ? user : undefined,
        }),
        properties,
      },
    ],
  }

  if (config.marketing.tiktok.testEventCode) {
    body.test_event_code = config.marketing.tiktok.testEventCode
  }

  try {
    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': accessToken,
      },
      body: JSON.stringify(body),
    })
    const parsed = await response.json().catch(() => null) as { code?: number; message?: string } | null
    const accepted = response.ok && (parsed?.code === undefined || parsed.code === 0)
    if (!accepted) {
      logger.warn('tiktok_events_api_failed', {
        status: response.status,
        code: parsed?.code,
        message: parsed?.message,
      })
      return { delivered: false, reason: 'tiktok_events_api_failed' }
    }
    return { delivered: true }
  }
  catch (error) {
    logger.warn('tiktok_events_api_error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { delivered: false, reason: 'tiktok_events_api_error' }
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

const getClientPrivacyContext = (request: {
  ip?: string
  headers: Record<string, unknown>
}) => {
  const rawUserAgent = typeof request.headers['user-agent'] === 'string'
    ? request.headers['user-agent']
    : null
  const anonymizedIp = anonymizeIpAddress(request.ip)
  return {
    clientIp: anonymizedIp.truncatedIp,
    clientIpHash: anonymizedIp.ipHash,
    userAgentFamily: extractBrowserFamily(rawUserAgent),
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
    const privacyContext = getClientPrivacyContext({
      ip: request.ip,
      headers: request.headers as Record<string, unknown>,
    })
    const seed = `${privacyContext.clientIpHash || privacyContext.clientIp || 'unknown'}:${input.event_name}`
    const rateKey = buildRateLimitKey('marketing:meta', seed)
    if (await checkRateLimit({ logger, key: rateKey, limit: 60, ttlSeconds: 60, component: 'marketing' })) {
      throw new RateLimitError()
    }
    const user = request.user

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
        client_ip: null,
        client_ip_hash: privacyContext.clientIpHash ?? null,
        user_agent: privacyContext.userAgentFamily ?? null,
      })

      if (!inserted) {
        return { success: true, deduped: true }
      }

      const userData: Record<string, string | undefined> = {
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

  app.post('/marketing/tiktok', async (request, _reply) => {
    const parsed = eventSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', { details: parsed.error.issues })
    }
    const input = parsed.data
    const eventId = input.event_id || randomUUID()
    const eventTime = toTimestamp(input.event_time)
    const privacyContext = getClientPrivacyContext({
      ip: request.ip,
      headers: request.headers as Record<string, unknown>,
    })
    const seed = `${privacyContext.clientIpHash || privacyContext.clientIp || 'unknown'}:${input.event_name}`
    const rateKey = buildRateLimitKey('marketing:tiktok', seed)
    if (await checkRateLimit({ logger, key: rateKey, limit: 60, ttlSeconds: 60, component: 'marketing' })) {
      throw new RateLimitError()
    }

    try {
      if (await shouldSkipMarketing(userAccountRepository, request.user?.user_id)) {
        return { success: true, skipped: 'opt_out' }
      }

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
        client_ip: null,
        client_ip_hash: privacyContext.clientIpHash ?? null,
        user_agent: privacyContext.userAgentFamily ?? null,
      })

      if (!inserted) {
        return { success: true, deduped: true }
      }

      const tiktok = await sendToTikTok({
        event_name: input.event_name,
        event_id: eventId,
        event_time: eventTime,
        event_source_url: input.event_source_url ?? null,
        value: input.value,
        currency: input.currency,
        provider_id: input.provider_id ?? null,
        corridor_id: input.corridor_id ?? null,
        page_path: input.page_path ?? null,
        ttclid: input.ttclid ?? null,
        ttp: input.ttp ?? null,
        email: request.user?.email ?? input.email ?? null,
        phone: input.phone ?? null,
        external_id: request.user?.user_id ?? input.external_id ?? null,
        client_ip_hash: privacyContext.clientIpHash ?? null,
        user_agent_family: privacyContext.userAgentFamily ?? null,
        custom_data: input.custom_data,
      })

      return {
        success: true,
        delivered: tiktok.delivered,
        event_id: eventId,
      }
    }
    catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      logger.warn('tiktok_marketing_event_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw new AppError('TikTok marketing event failed', {
        statusCode: 500,
        code: 'internal_error',
        cause: error,
      })
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
    const privacyContext = getClientPrivacyContext({
      ip: request.ip,
      headers: request.headers as Record<string, unknown>,
    })

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
      client_ip: privacyContext.clientIp ?? null,
      client_ip_hash: privacyContext.clientIpHash ?? null,
      user_agent: privacyContext.userAgentFamily ?? null,
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
    const privacyContext = getClientPrivacyContext({
      ip: request.ip,
      headers: request.headers as Record<string, unknown>,
    })

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
      client_ip: privacyContext.clientIp ?? null,
      client_ip_hash: privacyContext.clientIpHash ?? null,
      user_agent: privacyContext.userAgentFamily ?? null,
    })

    return {
      success: true,
      deduped: !inserted,
      delivered: false,
      reason: 'google_ads_offline_disabled',
    }
  })
}
