import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAdmin, requireSuperAdmin } from '../plugins/auth-plugin'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { ensureUserPlan, getUserPlan } from '../services/user-plan'
import { ValidationError } from '../../../shared/errors'

const logger = createLogger('plane-a.ads')
const pool = getPool(config.db.planeAUrl)

const isPlanActiveStatus = (status?: string | null) => status === 'active' || status === 'trialing'

const placementQuerySchema = z.object({
  placement: z.string().min(1),
  session_id: z.string().optional(),
  anon_id: z.string().optional(),
  corridor_id: z.string().optional(),
  page_path: z.string().optional(),
})

const clickSchema = z.object({
  ad_id: z.string().uuid(),
  placement: z.string().min(1),
  session_id: z.string().optional(),
  anon_id: z.string().optional(),
  corridor_id: z.string().optional(),
  page_path: z.string().optional(),
  target_url: z.string().trim().max(2048).optional().refine((value) => {
    if (!value) return true
    try {
      const parsed = new URL(value)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    }
    catch {
      return false
    }
  }, { message: 'invalid_target_url' }),
  is_affiliate: z.boolean().optional(),
})

const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const httpUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine(isHttpUrl, { message: 'url_must_be_http_https' })

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, { message: 'invalid_hex_color' })

const optionalText = (max: number) => z.string().trim().min(1).max(max).optional()

const optionalDateTime = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'invalid_datetime' })
  .optional()

const adSchema = z.object({
  name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().min(1).max(180),
  brandColor: hexColorSchema,
  url: httpUrlSchema,
  ctaText: optionalText(80),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviewCount: optionalText(32),
  logoLetter: optionalText(4),
  weight: z.coerce.number().int().min(1).max(1000).optional(),
  label: optionalText(32),
  isAffiliate: z.boolean().optional(),
  providerId: z.string().uuid().optional(),
  kind: z.enum(['sponsored', 'house']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  startAt: optionalDateTime,
  endAt: optionalDateTime,
})

const placementSchema = z.object({
  placement: z.string().trim().min(1).max(64),
  layout: z.enum(['horizontal', 'vertical', 'compact']).optional(),
  priority: z.coerce.number().int().min(0).max(100).optional(),
})

const createAdSchema = z.object({
  ad: adSchema,
  placements: z.array(placementSchema).min(1),
})

const updateAdSchema = z.object({
  ad: adSchema.partial().optional(),
  placements: z.array(placementSchema).optional(),
})

const listSchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
})

const booleanishSchema = z.preprocess((value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'off'].includes(normalized)) return false
  }
  return value
}, z.boolean())

const previewSchema = z.object({
  placement: z.string().trim().min(1).max(64),
  seed: z.string().trim().min(1).max(128).default('admin-preview'),
  simulate_plan: z.enum(['free', 'plus', 'enterprise']).default('free'),
  marketing_consent: booleanishSchema.default(true),
  ignore_runtime_disabled: booleanishSchema.default(false),
})

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

const pickWeighted = <T extends { weight?: number | null }>(ads: T[], seed: string) => {
  const totalWeight = ads.reduce((sum, ad) => sum + (ad.weight ?? 1), 0)
  if (totalWeight <= 0) return ads[0]
  const target = hashString(seed) % totalWeight
  let cursor = 0
  for (const ad of ads) {
    cursor += ad.weight ?? 1
    if (target < cursor) return ad
  }
  return ads[0]
}

const parseBooleanEnv = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return fallback
}

const getAdsRuntimeState = () => {
  const envValue = (
    process.env.PLANE_A_PUBLIC_ADS_ENABLED
    ?? process.env.PUBLIC_ENABLE_ADS
    ?? process.env.PUBLIC_ADS_ENABLED
  )
  const enabled = parseBooleanEnv(envValue, false)
  return {
    runtime_enabled: enabled,
    source: envValue === undefined ? 'default_false' : 'env',
    mode: enabled ? 'live' : 'preview_only',
    reason: enabled
      ? 'Ads runtime is enabled for eligible free users.'
      : 'Ads runtime is disabled. Admin preview remains available for QA only.',
  }
}

type EligibleAdRow = {
  id: string
  name: string
  tagline: string
  brand_color: string
  url: string
  cta_text: string | null
  rating: number | null
  review_count: string | null
  logo_letter: string | null
  weight: number | null
  label: string | null
  is_affiliate: boolean | null
  provider_id: string | null
  kind: string
  placement: string
  layout: string | null
}

const fetchEligibleAdsForPlacement = async (placement: string) =>
  await query<EligibleAdRow>(
    `SELECT ai.id,
            ai.name,
            ai.tagline,
            ai.brand_color,
            ai.url,
            ai.cta_text,
            ai.rating,
            ai.review_count,
            ai.logo_letter,
            ai.weight,
            ai.label,
            ai.is_affiliate,
            ai.provider_id,
            ai.kind,
            ap.placement,
            ap.layout
     FROM silver.ad_inventory ai
     JOIN silver.ad_placement ap ON ap.ad_id = ai.id
     WHERE ap.placement = $1
       AND ai.status = 'active'
       AND (ai.start_at IS NULL OR ai.start_at <= NOW())
       AND (ai.end_at IS NULL OR ai.end_at >= NOW())
     ORDER BY ap.priority DESC, ai.created_at DESC`,
    [placement],
    pool,
  )

const selectEligibleAd = async (
  placement: string,
  seed: string,
) => {
  const result = await fetchEligibleAdsForPlacement(placement)
  if (result.rows.length === 0) {
    return { picked: null, eligibleCount: 0 }
  }

  return {
    picked: pickWeighted(result.rows, seed),
    eligibleCount: result.rows.length,
  }
}

type AdminAdSnapshot = {
  id: string
  name: string
  tagline: string
  brandColor: string
  url: string
  ctaText: string | null
  rating: number | null
  reviewCount: string | null
  logoLetter: string | null
  weight: number | null
  label: string | null
  isAffiliate: boolean | null
  providerId: string | null
  kind: string | null
  status: string | null
  startAt: string | null
  endAt: string | null
  placements: Array<{ placement: string; layout: string | null; priority: number }>
}

const fetchAdminAdSnapshot = async (adId: string): Promise<AdminAdSnapshot | null> => {
  const adResult = await query<{
    id: string
    name: string
    tagline: string
    brand_color: string
    url: string
    cta_text: string | null
    rating: number | null
    review_count: string | null
    logo_letter: string | null
    weight: number | null
    label: string | null
    is_affiliate: boolean | null
    provider_id: string | null
    kind: string | null
    status: string | null
    start_at: string | null
    end_at: string | null
  }>(
    `SELECT
       id,
       name,
       tagline,
       brand_color,
       url,
       cta_text,
       rating,
       review_count,
       logo_letter,
       weight,
       label,
       is_affiliate,
       provider_id,
       kind,
       status,
       start_at::text AS start_at,
       end_at::text AS end_at
     FROM silver.ad_inventory
     WHERE id = $1`,
    [adId],
    pool,
  )

  const adRow = adResult.rows[0]
  if (!adRow) return null

  const placementsResult = await query<{ placement: string; layout: string | null; priority: number }>(
    `SELECT placement, layout, priority
     FROM silver.ad_placement
     WHERE ad_id = $1
     ORDER BY priority DESC`,
    [adId],
    pool,
  )

  return {
    id: adRow.id,
    name: adRow.name,
    tagline: adRow.tagline,
    brandColor: adRow.brand_color,
    url: adRow.url,
    ctaText: adRow.cta_text,
    rating: adRow.rating,
    reviewCount: adRow.review_count,
    logoLetter: adRow.logo_letter,
    weight: adRow.weight,
    label: adRow.label,
    isAffiliate: adRow.is_affiliate,
    providerId: adRow.provider_id,
    kind: adRow.kind,
    status: adRow.status,
    startAt: adRow.start_at,
    endAt: adRow.end_at,
    placements: placementsResult.rows.map((row) => ({
      placement: row.placement,
      layout: row.layout,
      priority: row.priority,
    })),
  }
}

export const adsRoutes = async (app: FastifyInstance) => {
  app.get('/ads/placement', async (request, reply) => {
    const parsed = placementQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    // Plus/Enterprise should be truly ad-free. Enforce server-side, not just in UI.
    if (request.user?.user_id) {
      try {
        await ensureUserPlan(pool, request.user.user_id)
        const plan = await getUserPlan(pool, request.user.user_id)
        const effectivePlanCode =
          plan && isPlanActiveStatus(plan.status) ? plan.plan_code : 'free'
        if (effectivePlanCode === 'plus' || effectivePlanCode === 'enterprise') {
          return { ad: null }
        }
      } catch (error: unknown) {
        logger.warn('ad_entitlement_check_failed', {
          user_id: request.user.user_id,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const input = parsed.data
    try {
      const runtime = getAdsRuntimeState()
      if (!runtime.runtime_enabled) {
        return { ad: null, runtime }
      }

      const selection = await selectEligibleAd(
        input.placement,
        input.session_id || input.anon_id || input.placement,
      )

      if (!selection.picked) {
        return { ad: null }
      }
      const picked = selection.picked

      if (!isHttpUrl(picked.url)) {
        logger.warn('ad_invalid_url_blocked', {
          ad_id: picked.id,
          placement: input.placement,
          url: picked.url,
        })
        return { ad: null }
      }

      if (input.session_id || input.anon_id) {
        await query(
          `INSERT INTO silver.ad_impression (
             ad_id,
             placement,
             session_id,
             anon_id,
             user_id,
             corridor_id,
             page_path,
             served_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            picked.id,
            picked.placement,
            input.session_id ?? null,
            input.anon_id ?? null,
            request.user?.user_id ?? null,
            input.corridor_id ?? null,
            input.page_path ?? null,
          ],
          pool,
        )
      }

      return {
        ad: {
          id: picked.id,
          name: picked.name,
          tagline: picked.tagline,
          brandColor: picked.brand_color,
          url: picked.url,
          ctaText: picked.cta_text ?? undefined,
          rating: picked.rating ?? undefined,
          reviewCount: picked.review_count ?? undefined,
          logoLetter: picked.logo_letter ?? undefined,
          label: picked.label ?? undefined,
          isAffiliate: picked.is_affiliate ?? false,
          providerId: picked.provider_id ?? undefined,
          kind: picked.kind,
          placement: picked.placement,
          layout: picked.layout ?? undefined,
        },
      }
    } catch (error) {
      logger.error('ad_placement_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/ads/click', async (request, reply) => {
    const parsed = clickSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const input = parsed.data
    try {
      if (!input.session_id && !input.anon_id) {
        return { success: true, skipped: 'missing_ids' }
      }

      await query(
        `INSERT INTO silver.ad_click (
           ad_id,
           placement,
           session_id,
           anon_id,
           user_id,
           corridor_id,
           page_path,
           target_url,
           is_affiliate,
           clicked_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          input.ad_id,
          input.placement,
          input.session_id ?? null,
          input.anon_id ?? null,
          request.user?.user_id ?? null,
          input.corridor_id ?? null,
          input.page_path ?? null,
          input.target_url ?? null,
          input.is_affiliate ?? false,
        ],
        pool,
      )

      return { success: true }
    } catch (error) {
      logger.error('ad_click_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/admin/ads/preview', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = previewSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const runtime = getAdsRuntimeState()
    const input = parsed.data
    const simulatePaidPlan = input.simulate_plan === 'plus' || input.simulate_plan === 'enterprise'

    if (!input.marketing_consent) {
      return {
        ad: null,
        eligible_count: 0,
        runtime,
        simulation: input,
        reason: 'marketing_consent_disabled',
      }
    }

    if (simulatePaidPlan) {
      return {
        ad: null,
        eligible_count: 0,
        runtime,
        simulation: input,
        reason: 'paid_plan_is_ad_free',
      }
    }

    if (!runtime.runtime_enabled && !input.ignore_runtime_disabled) {
      return {
        ad: null,
        eligible_count: 0,
        runtime,
        simulation: input,
        reason: 'runtime_disabled',
      }
    }

    try {
      const selection = await selectEligibleAd(input.placement, input.seed)
      if (!selection.picked) {
        return {
          ad: null,
          eligible_count: 0,
          runtime,
          simulation: input,
          reason: 'no_inventory',
        }
      }

      const picked = selection.picked
      return {
        runtime,
        simulation: input,
        eligible_count: selection.eligibleCount,
        reason: input.ignore_runtime_disabled && !runtime.runtime_enabled ? 'preview_override' : 'eligible',
        ad: {
          id: picked.id,
          name: picked.name,
          tagline: picked.tagline,
          brandColor: picked.brand_color,
          url: picked.url,
          ctaText: picked.cta_text ?? undefined,
          rating: picked.rating ?? undefined,
          reviewCount: picked.review_count ?? undefined,
          logoLetter: picked.logo_letter ?? undefined,
          label: picked.label ?? undefined,
          isAffiliate: picked.is_affiliate ?? false,
          providerId: picked.provider_id ?? undefined,
          kind: picked.kind,
          placement: picked.placement,
          layout: picked.layout ?? undefined,
        },
      }
    } catch (error) {
      logger.error('admin_ads_preview_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/admin/ads', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = listSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    try {
      const params: Array<string> = []
      const conditions: string[] = []
      if (parsed.data.status) {
        params.push(parsed.data.status)
        conditions.push(`ai.status = $${params.length}`)
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      const adsResult = await query<{
        id: string
        name: string
        tagline: string
        brand_color: string
        url: string
        cta_text: string | null
        rating: number | null
        review_count: string | null
        logo_letter: string | null
        weight: number
        label: string | null
        is_affiliate: boolean
        provider_id: string | null
        kind: string
        status: string
        start_at: string | null
        end_at: string | null
        created_at: string
        updated_at: string
        impression_count: number
        click_count: number
      }>(
        `SELECT ai.*,
                COALESCE(impressions.count, 0)::int AS impression_count,
                COALESCE(clicks.count, 0)::int AS click_count
         FROM silver.ad_inventory ai
         LEFT JOIN (
           SELECT ad_id, COUNT(*)::int AS count
           FROM silver.ad_impression
           WHERE served_at >= NOW() - INTERVAL '30 days'
           GROUP BY ad_id
         ) impressions ON impressions.ad_id = ai.id
         LEFT JOIN (
           SELECT ad_id, COUNT(*)::int AS count
           FROM silver.ad_click
           WHERE clicked_at >= NOW() - INTERVAL '30 days'
           GROUP BY ad_id
         ) clicks ON clicks.ad_id = ai.id
         ${whereClause}
         ORDER BY ai.created_at DESC`,
        params,
        pool,
      )

      const adIds = adsResult.rows.map((row) => row.id)
      const placementsResult = adIds.length
        ? await query<{ ad_id: string; placement: string; layout: string | null; priority: number }>(
            `SELECT ad_id, placement, layout, priority
             FROM silver.ad_placement
             WHERE ad_id = ANY($1::uuid[])
             ORDER BY priority DESC`,
            [adIds],
            pool,
          )
        : { rows: [] as Array<{ ad_id: string; placement: string; layout: string | null; priority: number }> }

      const placementMap = new Map<string, Array<{ placement: string; layout: string | null; priority: number }>>()
      for (const row of placementsResult.rows) {
        if (!placementMap.has(row.ad_id)) {
          placementMap.set(row.ad_id, [])
        }
        placementMap.get(row.ad_id)!.push({
          placement: row.placement,
          layout: row.layout,
          priority: row.priority,
        })
      }

      const runtime = getAdsRuntimeState()
      const activeCount = adsResult.rows.filter((row) => row.status === 'active').length
      const inactiveCount = adsResult.rows.length - activeCount

      return {
        runtime,
        summary: {
          total: adsResult.rows.length,
          active: activeCount,
          inactive: inactiveCount,
          impressions_30d: adsResult.rows.reduce((sum, row) => sum + row.impression_count, 0),
          clicks_30d: adsResult.rows.reduce((sum, row) => sum + row.click_count, 0),
        },
        ads: adsResult.rows.map((row) => ({
          id: row.id,
          name: row.name,
          tagline: row.tagline,
          brandColor: row.brand_color,
          url: row.url,
          ctaText: row.cta_text,
          rating: row.rating,
          reviewCount: row.review_count,
          logoLetter: row.logo_letter,
          weight: row.weight,
          label: row.label,
          isAffiliate: row.is_affiliate,
          providerId: row.provider_id,
          kind: row.kind,
          status: row.status,
          startAt: row.start_at,
          endAt: row.end_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          impressionCount: row.impression_count,
          clickCount: row.click_count,
          placements: placementMap.get(row.id) ?? [],
        })),
      }
    } catch (error) {
      logger.error('admin_ads_fetch_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/admin/ads', { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const parsed = createAdSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const { ad, placements } = parsed.data
    try {
      const result = await query<{ id: string }>(
        `INSERT INTO silver.ad_inventory (
           name,
           tagline,
           brand_color,
           url,
           cta_text,
           rating,
           review_count,
           logo_letter,
           weight,
           label,
           is_affiliate,
           provider_id,
           kind,
           status,
           start_at,
           end_at,
           created_at,
           updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
         )
         RETURNING id`,
        [
          ad.name,
          ad.tagline,
          ad.brandColor,
          ad.url,
          ad.ctaText ?? null,
          ad.rating ?? null,
          ad.reviewCount ?? null,
          ad.logoLetter ?? null,
          ad.weight ?? 1,
          ad.label ?? null,
          ad.isAffiliate ?? false,
          ad.providerId ?? null,
          ad.kind ?? 'sponsored',
          ad.status ?? 'active',
          ad.startAt ?? null,
          ad.endAt ?? null,
        ],
        pool,
      )

      const adId = result.rows[0]?.id
      if (!adId) {
        reply.code(500)
        return { error: 'create_failed' }
      }

      for (const placement of placements) {
        await query(
          `INSERT INTO silver.ad_placement (ad_id, placement, layout, priority, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [adId, placement.placement, placement.layout ?? null, placement.priority ?? 0],
          pool,
        )
      }

      const afterSnapshot = await fetchAdminAdSnapshot(adId)
      try {
        await logAuditEvent(pool, {
          actorId: request.user?.user_id ?? 'unknown',
          actorType: 'admin',
          actorRole: request.user?.role ?? undefined,
          action: 'admin.ads.create',
          entityType: 'ad_inventory',
          entityId: adId,
          category: 'admin',
          severity: 'warning',
          reason: 'admin_create',
          afterSnapshot: afterSnapshot ?? {
            id: adId,
            ...ad,
            placements,
          },
          metadata: {
            placements_count: placements.length,
          },
          ...getRequestContext(request),
        })
      } catch (auditError) {
        logger.warn('admin_ads_create_audit_failed', {
          error: auditError instanceof Error ? auditError.message : String(auditError),
        })
      }

      return { id: adId }
    } catch (error) {
      logger.error('admin_ads_create_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.patch('/admin/ads/:id', { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const parsed = updateAdSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const adId = request.params && typeof (request.params as { id?: string }).id === 'string'
      ? (request.params as { id?: string }).id
      : null
    if (!adId) {
            throw new ValidationError('Invalid request', { details: { error: 'missing_id' } })
    }

    const adUpdates = parsed.data.ad ?? {}
    try {
      const beforeSnapshot = await fetchAdminAdSnapshot(adId)
      if (!beforeSnapshot) {
        reply.code(404)
        return { error: 'not_found' }
      }

      if (Object.keys(adUpdates).length > 0) {
        const updates: string[] = []
        const values: Array<string | number | boolean | null> = []
        let index = 2

        const setField = (field: string, value: string | number | boolean | null) => {
          updates.push(`${field} = $${index}`)
          values.push(value)
          index += 1
        }

        if (adUpdates.name !== undefined) setField('name', adUpdates.name)
        if (adUpdates.tagline !== undefined) setField('tagline', adUpdates.tagline)
        if (adUpdates.brandColor !== undefined) setField('brand_color', adUpdates.brandColor)
        if (adUpdates.url !== undefined) setField('url', adUpdates.url)
        if (adUpdates.ctaText !== undefined) setField('cta_text', adUpdates.ctaText ?? null)
        if (adUpdates.rating !== undefined) setField('rating', adUpdates.rating ?? null)
        if (adUpdates.reviewCount !== undefined) setField('review_count', adUpdates.reviewCount ?? null)
        if (adUpdates.logoLetter !== undefined) setField('logo_letter', adUpdates.logoLetter ?? null)
        if (adUpdates.weight !== undefined) setField('weight', adUpdates.weight ?? 1)
        if (adUpdates.label !== undefined) setField('label', adUpdates.label ?? null)
        if (adUpdates.isAffiliate !== undefined) setField('is_affiliate', adUpdates.isAffiliate ?? false)
        if (adUpdates.providerId !== undefined) setField('provider_id', adUpdates.providerId ?? null)
        if (adUpdates.kind !== undefined) setField('kind', adUpdates.kind ?? 'sponsored')
        if (adUpdates.status !== undefined) setField('status', adUpdates.status ?? 'active')
        if (adUpdates.startAt !== undefined) setField('start_at', adUpdates.startAt ?? null)
        if (adUpdates.endAt !== undefined) setField('end_at', adUpdates.endAt ?? null)

        if (updates.length > 0) {
          updates.push('updated_at = NOW()')
          await query(
            `UPDATE silver.ad_inventory
             SET ${updates.join(', ')}
             WHERE id = $1`,
            [adId, ...values],
            pool,
          )
        }
      }

      if (parsed.data.placements) {
        await query(
          `DELETE FROM silver.ad_placement WHERE ad_id = $1`,
          [adId],
          pool,
        )
        for (const placement of parsed.data.placements) {
          await query(
            `INSERT INTO silver.ad_placement (ad_id, placement, layout, priority, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [adId, placement.placement, placement.layout ?? null, placement.priority ?? 0],
            pool,
          )
        }
      }

      const afterSnapshot = await fetchAdminAdSnapshot(adId)
      try {
        await logAuditEvent(pool, {
          actorId: request.user?.user_id ?? 'unknown',
          actorType: 'admin',
          actorRole: request.user?.role ?? undefined,
          action: 'admin.ads.update',
          entityType: 'ad_inventory',
          entityId: adId,
          category: 'admin',
          severity: 'warning',
          reason: 'admin_update',
          beforeSnapshot,
          afterSnapshot: afterSnapshot ?? null,
          metadata: {
            updated_fields: Object.keys(adUpdates),
            placements_updated: Boolean(parsed.data.placements),
          },
          ...getRequestContext(request),
        })
      } catch (auditError) {
        logger.warn('admin_ads_update_audit_failed', {
          error: auditError instanceof Error ? auditError.message : String(auditError),
        })
      }

      return { success: true }
    } catch (error) {
      logger.error('admin_ads_update_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
