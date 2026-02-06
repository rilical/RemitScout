import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAuth, requireEntitlement } from '../plugins/auth-plugin'
import { getUserPlan } from '../services/user-plan'
import { getEntitlementsForPlan } from '../services/entitlements'
import { ComparisonHistoryRepository } from '../repositories'

const logger = createLogger('plane-a.history')
const planeAPool = getPool(config.db.planeAUrl)
const historyRepository = new ComparisonHistoryRepository(planeAPool)

const historyQuerySchema = z.object({
  corridor_id: z.string().min(3),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  granularity: z.enum(['daily', '4h', 'hourly']).optional(),
  amount_bucket: z.coerce.number().int().optional(),
  method_profile: z.string().optional(),
})

const historyCreateSchema = z.object({
  from_country: z.string().min(2),
  to_country: z.string().min(2),
  amount: z.coerce.number().positive(),
  method: z.string().min(1),
  path: z.string().optional(),
})

const parseDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const formatIso = (value?: Date | null) => {
  if (!value) return null
  return value.toISOString()
}

const resolveUserId = (request: FastifyRequest, reply: FastifyReply): string | null => {
  if (request.user) return request.user.user_id
  if (request.apiKey) return request.apiKey.user_id
  reply.code(401)
  reply.send({ error: 'unauthorized' })
  return null
}

export const historyRoutes = async (app: FastifyInstance) => {
  app.get('/history/corridor', { preHandler: requireEntitlement('history') }, async (request, reply) => {
    const parsed = historyQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const userId = resolveUserId(request, reply)
    if (!userId) return
    const plan = await getUserPlan(planeAPool, userId)
    const isPlanActive = plan?.status === 'active' || plan?.status === 'trialing'
    const effectivePlanCode = plan && isPlanActive ? plan.plan_code : 'free'
    const entitlements = getEntitlementsForPlan(effectivePlanCode)
    const maxDays = entitlements.history_max_days

    const corridorId = parsed.data.corridor_id
    const granularity = parsed.data.granularity ?? 'daily'
    if (granularity !== 'daily') {
      reply.code(400)
      return { error: 'granularity_not_supported', granularity }
    }

    const toDate = parseDate(parsed.data.to_date) ?? new Date()
    const fromDate =
      parseDate(parsed.data.from_date) ??
      new Date(toDate.getTime() - (maxDays ?? 30) * 24 * 60 * 60 * 1000)

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      reply.code(400)
      return { error: 'invalid_date_range' }
    }
    if (fromDate > toDate) {
      reply.code(400)
      return { error: 'invalid_date_range', message: 'from_date is after to_date' }
    }

    if (typeof maxDays === 'number') {
      const rangeMs = toDate.getTime() - fromDate.getTime()
      const rangeDays = rangeMs / (24 * 60 * 60 * 1000)
      if (rangeDays > maxDays) {
        reply.code(403)
        return { error: 'history_range_exceeded', maxDays }
      }
    }

    const conditions: string[] = ['corridor_id = $1', 'date >= $2', 'date <= $3']
    const params: Array<string | number | Date> = [corridorId, fromDate, toDate]
    let paramIndex = 4

    if (parsed.data.amount_bucket !== undefined) {
      conditions.push(`amount_bucket = $${paramIndex}`)
      params.push(parsed.data.amount_bucket)
      paramIndex += 1
    }
    if (parsed.data.method_profile) {
      conditions.push(`method_profile = $${paramIndex}`)
      params.push(parsed.data.method_profile)
      paramIndex += 1
    }

    try {
      const result = await query<{
        date: Date
        corridor_id: string
        amount_bucket: number
        method_profile: string
        rci_leader_bps: number | null
        rci_median_bps: number | null
        rci_p10_bps: number | null
        rci_p90_bps: number | null
        dispersion_bps: number | null
        leader_edge_bps: number | null
        volatility_7d: number | null
        provider_count_binned: number | null
        suppression_flag: boolean
        suppression_reason: string | null
        methodology_version: string | null
        pipeline_version: string | null
        created_at: Date
      }>(
        `SELECT date,
                corridor_id,
                amount_bucket,
                method_profile,
                rci_leader_bps::double precision AS rci_leader_bps,
                rci_median_bps::double precision AS rci_median_bps,
                rci_p10_bps::double precision AS rci_p10_bps,
                rci_p90_bps::double precision AS rci_p90_bps,
                dispersion_bps::double precision AS dispersion_bps,
                leader_edge_bps::double precision AS leader_edge_bps,
                volatility_7d::double precision AS volatility_7d,
                provider_count_binned,
                suppression_flag,
                suppression_reason,
                methodology_version,
                pipeline_version,
                created_at
         FROM gold_export.cdp_daily
         WHERE ${conditions.join(' AND ')}
         ORDER BY date ASC`,
        params,
        planeAPool,
      )

      const lastUpdated = result.rows.reduce<Date | null>((latest, row) => {
        if (!row.created_at) return latest
        if (!latest || row.created_at > latest) return row.created_at
        return latest
      }, null)

      return {
        corridorId,
        granularity,
        fromDate: formatIso(fromDate),
        toDate: formatIso(toDate),
        lastUpdated: formatIso(lastUpdated),
        data: result.rows.map((row) => ({
          date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
          corridorId: row.corridor_id,
          amountBucket: row.amount_bucket,
          methodProfile: row.method_profile,
          rciLeaderBps: row.rci_leader_bps,
          rciMedianBps: row.rci_median_bps,
          rciP10Bps: row.rci_p10_bps,
          rciP90Bps: row.rci_p90_bps,
          dispersionBps: row.dispersion_bps,
          leaderEdgeBps: row.leader_edge_bps,
          volatility7d: row.volatility_7d,
          providerCountBinned: row.provider_count_binned,
          suppressionFlag: row.suppression_flag,
          suppressionReason: row.suppression_reason,
          methodologyVersion: row.methodology_version,
          pipelineVersion: row.pipeline_version,
        })),
      }
    } catch (error) {
      logger.error('history_corridor_failed', {
        corridor_id: corridorId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/history', { preHandler: requireAuth() }, async (request, reply) => {
    const parsed = historyCreateSchema.safeParse(request.body)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const user = request.user!
    const input = parsed.data

    try {
      const record = await historyRepository.create({
        user_id: user.user_id,
        from_country: input.from_country.toUpperCase(),
        to_country: input.to_country.toUpperCase(),
        amount: input.amount,
        method: input.method,
        path: input.path,
      })

      return {
        success: true,
        record: {
          id: record.id,
          from_country: record.from_country,
          to_country: record.to_country,
          amount: record.amount,
          method: record.method,
          path: record.path,
          created_at: record.created_at.toISOString(),
        },
      }
    } catch (error) {
      logger.error('history_create_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
