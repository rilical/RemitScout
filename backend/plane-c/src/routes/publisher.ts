import type { FastifyInstance } from 'fastify'
import { evaluatePublisherGates } from '../services/publisher-gates'
import { getPool, query } from '../../shared/db'
import { config } from '../../shared/config'
import { createLogger } from '../../shared/logger'

const logger = createLogger('plane-c.publisher')
const pool = getPool(config.db.planeCUrl)

const loadContributorCount = async (corridorId: string) => {
  const result = await query<{ contributor_count: number }>(
    `SELECT COUNT(DISTINCT provider_id)::int AS contributor_count
       FROM silver.provider_corridor_capability
      WHERE corridor_id = $1
        AND is_supported = true`,
    [corridorId],
    pool,
  )
  return result.rows[0]?.contributor_count ?? 0
}

export const publisherRoutes = async (app: FastifyInstance) => {
  app.post('/internal/publisher/validate', async (request) => {
    const body = (request.body ?? {}) as Record<string, unknown>
    const corridorId = typeof body.corridor_id === 'string' ? body.corridor_id : undefined
    let contributorCount = typeof body.contributor_count === 'number'
      ? body.contributor_count
      : undefined
    if (corridorId) {
      contributorCount = await loadContributorCount(corridorId)
    }
    const result = evaluatePublisherGates({
      contributor_count: contributorCount,
      top_provider_share: typeof body.top_provider_share === 'number' ? body.top_provider_share : undefined,
      top_two_share: typeof body.top_two_share === 'number' ? body.top_two_share : undefined,
    })
    if (corridorId && result.reasons.includes('insufficient_contributors')) {
      logger.info('b2b_publish_gate_skipped', {
        corridor_id: corridorId,
        contributor_count: contributorCount ?? null,
        min_provider_count: 3,
      })
    }

    return {
      success: result.allowed,
      allowed: result.allowed,
      reasons: result.reasons,
      contributor_count: contributorCount,
    }
  })
}
