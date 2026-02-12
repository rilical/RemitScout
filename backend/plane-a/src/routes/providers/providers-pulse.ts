import type { FastifyInstance } from 'fastify'
import { parseCorridorId } from '../../../../shared/corridor'
import { DEFAULT_AMOUNT_BUCKET } from '../../../../shared/constants'
import { ValidationError } from '../../../../shared/errors'

export const providersPulseRoutes = async (app: FastifyInstance) => {
  app.get('/providers/pulse/:corridorId', async (request) => {
    const corridorId = String((request.params as { corridorId?: string }).corridorId ?? '').toUpperCase()
    if (!parseCorridorId(corridorId)) {
      throw new ValidationError('Invalid corridor id', {
        details: [{ message: 'invalid_corridor_id' }],
      })
    }

    const query = request.query as {
      amount_bucket?: string | number
      method_profile?: string
    }
    const amountBucket = Number(query.amount_bucket ?? DEFAULT_AMOUNT_BUCKET)
    const methodProfile =
      typeof query.method_profile === 'string' && query.method_profile.trim()
        ? query.method_profile.trim()
        : 'standard_bank'

    const latest = await app.container.repositories.goldIndices.getIndicesLatest({
      corridorId,
      amountBucket,
      methodProfile,
    })

    return {
      success: true,
      corridorId,
      amountBucket,
      methodProfile,
      latest: latest
        ? {
            date: latest.date.toISOString(),
            teerRate: latest.teer_rate,
            rciRatio: latest.rci_ratio,
            rviBps: latest.rvi_bps,
            providerCount: latest.provider_count,
            suppressionFlag: latest.suppression_flag,
            suppressionReason: latest.suppression_reason,
            weightConfidence: latest.weight_confidence,
            weightWindowDays: latest.weight_window_days,
            updatedAt: latest.created_at.toISOString(),
          }
        : null,
    }
  })
}
