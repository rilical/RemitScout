import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAdmin } from '../plugins/auth-plugin'

const logger = createLogger('plane-a.ads')
const pool = getPool(config.db.planeAUrl)

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
  target_url: z.string().optional(),
  is_affiliate: z.boolean().optional(),
})

const adSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  brandColor: z.string().min(1),
  url: z.string().min(1),
  ctaText: z.string().optional(),
  rating: z.number().optional(),
  reviewCount: z.string().optional(),
  logoLetter: z.string().optional(),
  weight: z.number().int().min(1).optional(),
  label: z.string().optional(),
  isAffiliate: z.boolean().optional(),
  providerId: z.string().optional(),
  kind: z.enum(['sponsored', 'house']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
})

const placementSchema = z.object({
  placement: z.string().min(1),
  layout: z.enum(['horizontal', 'vertical', 'compact']).optional(),
  priority: z.number().int().optional(),
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

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

const pickWeighted = <T extends { weight?: number }>(ads: T[], seed: string) => {
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

export const adsRoutes = async (app: FastifyInstance) => {
  app.get('/ads/placement', async (request, reply) => {
    const parsed = placementQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const input = parsed.data
    try {
      const result = await query<{
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
      }>(
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
        [input.placement],
        pool,
      )

      if (result.rows.length === 0) {
        return { ad: null }
      }

      const seed = input.session_id || input.anon_id || input.placement
      const picked = pickWeighted(result.rows, seed)

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
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const input = parsed.data
    try {
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

  app.get('/admin/ads', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = listSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
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

      return {
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

  app.post('/admin/ads', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = createAdSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
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

      return { id: adId }
    } catch (error) {
      logger.error('admin_ads_create_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.patch('/admin/ads/:id', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = updateAdSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const adId = request.params && typeof (request.params as { id?: string }).id === 'string'
      ? (request.params as { id?: string }).id
      : null
    if (!adId) {
      reply.code(400)
      return { error: 'missing_id' }
    }

    const adUpdates = parsed.data.ad ?? {}
    try {
      if (Object.keys(adUpdates).length > 0) {
        const updates: string[] = []
        const values: Array<string | number | boolean | null> = []
        let index = 2

        const setField = (field: string, value: unknown) => {
          updates.push(`${field} = $${index}`)
          values.push(value as any)
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
