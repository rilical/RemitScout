import { expect, it } from 'vitest'

import { getPool } from '../shared/db'
import { describeDbIntegration, withTestTransaction } from './helpers/test-db'

const planeBUrl = process.env.DATABASE_URL_PLANE_B || process.env.DATABASE_URL || 'postgres://remit:remit@localhost:5432/remit'

describeDbIntegration('quote_record conformance', () => {
  it('does not allow nulls in required fields', async () => {
    const pool = getPool(planeBUrl)
    try {
      await withTestTransaction(pool, async () => {
        const result = await pool.query<{ null_count: number }>(
          `SELECT COUNT(*)::int AS null_count
             FROM silver.quote_record
            WHERE provider_id IS NULL
               OR corridor_id IS NULL
               OR amount_bucket IS NULL
               OR payin IS NULL
               OR payout IS NULL
               OR send_amount IS NULL
               OR fee_amount IS NULL
               OR total_debit_amount IS NULL
               OR receive_amount IS NULL
               OR implied_fx_rate IS NULL
               OR status IS NULL
               OR collected_at IS NULL
               OR ingested_at IS NULL
               OR ingestion_run_id IS NULL
               OR bronze_object_key IS NULL`,
        )

        expect(result.rows[0]?.null_count ?? 0).toBe(0)
      })
    } catch (error) {
      const aggregateError = error as AggregateError & {
        code?: string
        errors?: Array<{ code?: string }>
      }
      if (
        aggregateError?.code === 'ECONNREFUSED'
        || aggregateError?.errors?.some((entry) => entry?.code === 'ECONNREFUSED')
      ) {
        return
      }
      throw error
    }
  })
})
