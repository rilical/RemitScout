import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  ILatestQuoteRepository,
  LatestQuoteByCorridorRecord,
  LatestQuoteByProviderRecord,
} from '../interfaces/latest-quote-repository.interface'

export class LatestQuoteRepository implements ILatestQuoteRepository {
  constructor(private readonly pool: Pool) {}

  async listLatestByCorridor(
    corridorId: string,
    amountBucket: number,
    payin: string,
    payout: string,
  ): Promise<LatestQuoteByCorridorRecord[]> {
    const result = await query<LatestQuoteByCorridorRecord>(
      `SELECT provider_id,
              corridor_id,
              amount_bucket,
              payin,
              payout,
              payin AS payin_method,
              payout AS payout_method,
              delivery_time_min_minutes,
              delivery_time_max_minutes,
              collected_at,
              send_amount,
              fee_amount,
              promotional_fee_amount,
              receive_amount,
              implied_fx_rate,
              promotional_rate,
              base_rate,
              promotional_cap_amount,
              quality_flags,
              updated_at
         FROM silver.latest_quote_by_provider
        WHERE corridor_id = $1
          AND amount_bucket = $2
          AND payin = $3
          AND payout = $4
        ORDER BY receive_amount DESC, fee_amount ASC`,
      [corridorId, amountBucket, payin, payout],
      this.pool,
    )
    return result.rows
  }

  async listLatestByProvider(
    providerId: string,
    corridorIds: string[],
  ): Promise<LatestQuoteByProviderRecord[]> {
    const result = await query<LatestQuoteByProviderRecord>(
      `SELECT DISTINCT ON (corridor_id)
         corridor_id,
         payin,
         payout,
         collected_at,
         send_amount,
         fee_amount,
         promotional_fee_amount,
         total_debit_amount,
         receive_amount,
         implied_fx_rate,
         promotional_rate,
         base_rate,
         promotional_cap_amount,
         delivery_time_min_minutes,
         delivery_time_max_minutes,
         quality_flags,
         updated_at
       FROM silver.latest_quote_by_provider
       WHERE provider_id = $1
         AND corridor_id = ANY($2::text[])
       ORDER BY corridor_id, collected_at DESC`,
      [providerId, corridorIds],
      this.pool,
    )
    return result.rows
  }
}
