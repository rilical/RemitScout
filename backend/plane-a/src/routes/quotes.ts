import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createPool } from '../../shared/db'
import { config } from '../../shared/config'

const planeAPool = createPool(config.db.planeAUrl)

const querySchema = z.object({
  corridor_id: z.string().min(1),
  amount_bucket: z.coerce.number().int(),
  payin: z.string().min(1),
  payout: z.string().min(1),
})

export const quotesRoutes = async (app: FastifyInstance) => {
  app.get('/api/quotes/current', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const { corridor_id, amount_bucket, payin, payout } = parsed.data
    const result = await planeAPool.query(
      `SELECT provider_id,
              corridor_id,
              amount_bucket,
              payin,
              payout,
              collected_at,
              send_amount,
              fee_amount,
              receive_amount,
              implied_fx_rate,
              quality_flags,
              updated_at
         FROM silver.latest_quote_by_provider
        WHERE corridor_id = $1
          AND amount_bucket = $2
          AND payin = $3
          AND payout = $4
        ORDER BY receive_amount DESC, fee_amount ASC`,
      [corridor_id, amount_bucket, payin, payout],
    )

    return {
      success: true,
      timestamp: new Date().toISOString(),
      count: result.rowCount,
      quotes: result.rows,
    }
  })
}
