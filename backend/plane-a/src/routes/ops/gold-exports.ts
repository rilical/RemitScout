import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { requireAdmin } from '../../plugins/auth-plugin'
import { ValidationError } from '../../../../shared/errors'
import { getErrorMessage } from '../../types/errors'

const logger = createLogger('plane-a.ops.gold-exports')
const pool = getPool(config.db.planeAUrl)

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

const listQuerySchema = z.object({
  amount_bucket: z.coerce.number().int().positive().default(500),
  method_profile: z.enum(['standard_bank', 'standard_card', 'cash_pickup']).default('standard_bank'),
  date: z.string().optional(),
  q: z.string().trim().min(1).max(64).optional(),
  send_currencies: z.string().optional(),
  suppressed: z.enum(['0', '1']).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(200),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
})

const parseSendCurrencies = (raw?: string): string[] => {
  if (!raw) return []
  return raw
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean)
}

const escapeCsv = (value: string) => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const resolveLatestDate = async (
  amountBucket: number,
  methodProfile: string,
): Promise<string | null> => {
  const res = await query<{ max_date: string | null }>(
    `SELECT MAX(date)::text AS max_date
       FROM gold_export.cdp_daily
      WHERE amount_bucket = $1
        AND method_profile = $2`,
    [amountBucket, methodProfile],
    pool,
  )
  return res.rows[0]?.max_date ?? null
}

type SliceFilters = {
  date: string
  amountBucket: number
  methodProfile: string
  q?: string
  sendCurrencies: string[]
  suppressed?: '0' | '1'
}

const buildWhere = (filters: SliceFilters) => {
  const conditions: string[] = [
    'date = $1',
    'amount_bucket = $2',
    'method_profile = $3',
  ]
  const values: Array<string | number | boolean | string[]> = [
    filters.date,
    filters.amountBucket,
    filters.methodProfile,
  ]

  if (filters.q) {
    values.push(`%${filters.q}%`)
    conditions.push(`corridor_id ILIKE $${values.length}`)
  }

  if (filters.sendCurrencies.length > 0) {
    values.push(filters.sendCurrencies)
    conditions.push(`split_part(corridor_id, '-', 3) = ANY($${values.length}::text[])`)
  }

  if (filters.suppressed === '0' || filters.suppressed === '1') {
    values.push(filters.suppressed === '1')
    conditions.push(`suppression_flag = $${values.length}`)
  }

  return { whereClause: conditions.join(' AND '), values }
}

export const goldExportsRoutes = (app: FastifyInstance) => {
  app.get('/ops/gold/exports/cdp-daily', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const amountBucket = parsed.data.amount_bucket
    const methodProfile = parsed.data.method_profile
    const q = parsed.data.q
    const sendCurrencies = parseSendCurrencies(parsed.data.send_currencies)
    const suppressed = parsed.data.suppressed
    const limit = parsed.data.limit
    const offset = parsed.data.offset

    if (sendCurrencies.some((currency) => currency.length !== 3)) {
      throw new ValidationError('Invalid request', {
        details: { error: 'invalid_send_currencies' },
      })
    }

    const requestedDate = parsed.data.date?.trim()
    if (requestedDate && !DATE_ONLY_RE.test(requestedDate)) {
      throw new ValidationError('Invalid request', {
        details: { error: 'invalid_date', message: 'date must be YYYY-MM-DD' },
      })
    }

    const date = requestedDate || (await resolveLatestDate(amountBucket, methodProfile))
    if (!date) {
      return {
        success: true,
        message: 'Gold export table is empty (warming up).',
        meta: {
          date: null,
          amount_bucket: amountBucket,
          method_profile: methodProfile,
          last_updated_at: null,
        },
        summary: {
          corridors_total: 0,
          available: 0,
          suppressed: 0,
          available_ratio: 0,
          suppressed_ratio: 0,
          min_provider_count: null,
          weight_confidence_p10: null,
        },
        pagination: { total: 0, limit, offset },
        rows: [],
      }
    }

    const sliceFilters: SliceFilters = {
      date,
      amountBucket,
      methodProfile,
      q,
      sendCurrencies,
      suppressed,
    }
    const { whereClause, values } = buildWhere(sliceFilters)

    try {
      const summaryResult = await query<{
        total: number | null
        available: number | null
        suppressed: number | null
        min_provider_count: number | null
        weight_confidence_p10: number | null
        last_updated_at: Date | null
      }>(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE suppression_flag IS FALSE)::int AS available,
           COUNT(*) FILTER (WHERE suppression_flag IS TRUE)::int AS suppressed,
           MIN(provider_count)::int AS min_provider_count,
           percentile_cont(0.1) WITHIN GROUP (ORDER BY weight_confidence)::double precision
             AS weight_confidence_p10,
           MAX(created_at) AS last_updated_at
         FROM gold_export.cdp_daily
         WHERE ${whereClause}`,
        values,
        pool,
      )

      const summaryRow = summaryResult.rows[0]
      const total = Number(summaryRow?.total ?? 0)
      const available = Number(summaryRow?.available ?? 0)
      const suppressedCount = Number(summaryRow?.suppressed ?? 0)
      const availableRatio = total > 0 ? available / total : 0
      const suppressedRatio = total > 0 ? suppressedCount / total : 0

      const rowsResult = await query<{
        date: string
        corridor_id: string
        from_country: string
        to_country: string
        from_currency: string
        to_currency: string
        amount_bucket: number
        method_profile: string
        teer_rate: number | null
        rci_ratio: number | null
        rvi_bps: number | null
        mid_market_rate: number | null
        provider_count: number | null
        provider_count_binned: number | null
        rci_median_bps: number | null
        rci_p10_bps: number | null
        rci_p90_bps: number | null
        dispersion_bps: number | null
        volatility_7d: number | null
        weight_confidence: number | null
        weight_window_days: number | null
        weighting_model: string | null
        methodology_version: string | null
        pipeline_version: string | null
        suppression_flag: boolean
        suppression_reason: string | null
        created_at: Date
      }>(
        `SELECT
           date::text AS date,
           corridor_id,
           split_part(corridor_id, '-', 1) AS from_country,
           split_part(corridor_id, '-', 2) AS to_country,
           split_part(corridor_id, '-', 3) AS from_currency,
           split_part(corridor_id, '-', 4) AS to_currency,
           amount_bucket,
           method_profile,
           teer_rate::double precision AS teer_rate,
           rci_ratio::double precision AS rci_ratio,
           rvi_bps::double precision AS rvi_bps,
           mid_market_rate::double precision AS mid_market_rate,
           provider_count,
           provider_count_binned,
           rci_median_bps::double precision AS rci_median_bps,
           rci_p10_bps::double precision AS rci_p10_bps,
           rci_p90_bps::double precision AS rci_p90_bps,
           dispersion_bps::double precision AS dispersion_bps,
           volatility_7d::double precision AS volatility_7d,
           weight_confidence::double precision AS weight_confidence,
           weight_window_days,
           weighting_model,
           methodology_version,
           pipeline_version,
           suppression_flag,
           suppression_reason,
           created_at
         FROM gold_export.cdp_daily
         WHERE ${whereClause}
         ORDER BY corridor_id ASC
         LIMIT $${values.length + 1}
         OFFSET $${values.length + 2}`,
        [...values, limit, offset],
        pool,
      )

      return {
        success: true,
        meta: {
          date,
          amount_bucket: amountBucket,
          method_profile: methodProfile,
          last_updated_at: summaryRow?.last_updated_at ? summaryRow.last_updated_at.toISOString() : null,
        },
        summary: {
          corridors_total: total,
          available,
          suppressed: suppressedCount,
          available_ratio: availableRatio,
          suppressed_ratio: suppressedRatio,
          min_provider_count: summaryRow?.min_provider_count ?? null,
          weight_confidence_p10: summaryRow?.weight_confidence_p10 ?? null,
        },
        pagination: {
          total,
          limit,
          offset,
        },
        rows: rowsResult.rows.map((row) => ({
          ...row,
          created_at: row.created_at.toISOString(),
        })),
      }
    } catch (error) {
      logger.error('gold_exports_list_failed', {
        error: getErrorMessage(error),
      })
      reply.code(500)
      return { success: false, error: 'internal_error' }
    }
  })

  app.get('/ops/gold/exports/cdp-daily/export', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const amountBucket = parsed.data.amount_bucket
    const methodProfile = parsed.data.method_profile
    const q = parsed.data.q
    const sendCurrencies = parseSendCurrencies(parsed.data.send_currencies)
    const suppressed = parsed.data.suppressed

    if (sendCurrencies.some((currency) => currency.length !== 3)) {
      throw new ValidationError('Invalid request', {
        details: { error: 'invalid_send_currencies' },
      })
    }

    const requestedDate = parsed.data.date?.trim()
    if (requestedDate && !DATE_ONLY_RE.test(requestedDate)) {
      throw new ValidationError('Invalid request', {
        details: { error: 'invalid_date', message: 'date must be YYYY-MM-DD' },
      })
    }

    const date = requestedDate || (await resolveLatestDate(amountBucket, methodProfile))
    const headers = [
      'date',
      'corridor_id',
      'from_country',
      'to_country',
      'from_currency',
      'to_currency',
      'amount_bucket',
      'method_profile',
      'teer_rate',
      'rci_ratio',
      'rvi_bps',
      'mid_market_rate',
      'provider_count',
      'provider_count_binned',
      'rci_median_bps',
      'rci_p10_bps',
      'rci_p90_bps',
      'dispersion_bps',
      'volatility_7d',
      'weight_confidence',
      'weight_window_days',
      'weighting_model',
      'methodology_version',
      'pipeline_version',
      'suppression_flag',
      'suppression_reason',
      'created_at',
    ]

    if (!date) {
      reply.header('Content-Type', 'text/csv')
      return headers.join(',') + '\n'
    }

    const sliceFilters: SliceFilters = {
      date,
      amountBucket,
      methodProfile,
      q,
      sendCurrencies,
      suppressed,
    }
    const { whereClause, values } = buildWhere(sliceFilters)

    try {
      const countResult = await query<{ total: number }>(
        `SELECT COUNT(*)::int AS total
           FROM gold_export.cdp_daily
          WHERE ${whereClause}`,
        values,
        pool,
      )
      const total = Number(countResult.rows[0]?.total ?? 0)
      const maxRows = 10_000
      if (total > maxRows) {
        reply.code(413)
        return {
          error: 'export_too_large',
          message: `Export too large (${total} rows). Narrow filters to <= ${maxRows} rows.`,
        }
      }

      const rowsResult = await query<Record<string, any>>(
        `SELECT
           date::text AS date,
           corridor_id,
           split_part(corridor_id, '-', 1) AS from_country,
           split_part(corridor_id, '-', 2) AS to_country,
           split_part(corridor_id, '-', 3) AS from_currency,
           split_part(corridor_id, '-', 4) AS to_currency,
           amount_bucket,
           method_profile,
           teer_rate::double precision AS teer_rate,
           rci_ratio::double precision AS rci_ratio,
           rvi_bps::double precision AS rvi_bps,
           mid_market_rate::double precision AS mid_market_rate,
           provider_count,
           provider_count_binned,
           rci_median_bps::double precision AS rci_median_bps,
           rci_p10_bps::double precision AS rci_p10_bps,
           rci_p90_bps::double precision AS rci_p90_bps,
           dispersion_bps::double precision AS dispersion_bps,
           volatility_7d::double precision AS volatility_7d,
           weight_confidence::double precision AS weight_confidence,
           weight_window_days,
           weighting_model,
           methodology_version,
           pipeline_version,
           suppression_flag,
           suppression_reason,
           created_at
         FROM gold_export.cdp_daily
         WHERE ${whereClause}
         ORDER BY corridor_id ASC
         LIMIT ${maxRows}`,
        values,
        pool,
      )

      const lines = rowsResult.rows.map((row) => {
        const payload: Record<string, unknown> = {
          ...(row as Record<string, unknown>),
          created_at: row.created_at instanceof Date
            ? row.created_at.toISOString()
            : String(row.created_at ?? ''),
        }
        return headers
          .map((key) => {
            const value = payload[key]
            if (value === null || value === undefined) return ''
            return escapeCsv(String(value))
          })
          .join(',')
      })

      reply.header('Content-Type', 'text/csv')
      return [headers.join(','), ...lines].join('\n')
    } catch (error) {
      logger.error('gold_exports_export_failed', {
        error: getErrorMessage(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
