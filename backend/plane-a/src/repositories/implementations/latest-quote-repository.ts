import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  ILatestQuoteRepository,
  LatestQuoteByCorridorRecord,
  LatestQuoteByProviderRecord,
  LatestQuoteByCurrencyPairRecord,
} from '../interfaces/latest-quote-repository.interface'

export class LatestQuoteRepository implements ILatestQuoteRepository {
  constructor(private readonly pool: Pool) {}

  async listLatestByCorridor(
    corridorId: string,
    amountBucket: number,
    payin: string,
    payout: string,
    maxAgeSeconds?: number,
  ): Promise<LatestQuoteByCorridorRecord[]> {
    const maxAge = Number.isFinite(maxAgeSeconds ?? Number.NaN) && (maxAgeSeconds ?? 0) > 0
      ? Math.floor(maxAgeSeconds ?? 0)
      : null
    const ageClause = maxAge ? 'AND collected_at >= NOW() - ($5 * INTERVAL \'1 second\')' : ''
    const params = maxAge
      ? [corridorId, amountBucket, payin, payout, maxAge]
      : [corridorId, amountBucket, payin, payout]
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
              send_amount::double precision AS send_amount,
              fee_amount::double precision AS fee_amount,
              promotional_fee_amount::double precision AS promotional_fee_amount,
              receive_amount::double precision AS receive_amount,
              implied_fx_rate::double precision AS implied_fx_rate,
              promotional_rate::double precision AS promotional_rate,
              base_rate::double precision AS base_rate,
              promotional_cap_amount::double precision AS promotional_cap_amount,
              quality_flags,
              updated_at
         FROM silver.latest_quote_by_provider
        WHERE corridor_id = $1
          AND amount_bucket = $2
          AND payin = $3
          AND payout = $4
          ${ageClause}
        ORDER BY receive_amount DESC, fee_amount ASC`,
      params,
      this.pool,
    )
    return result.rows
  }

  async listLatestByCorridorPayins(
    corridorId: string,
    amountBucket: number,
    payins: string[],
    payout: string,
    maxAgeSeconds?: number,
  ): Promise<LatestQuoteByCorridorRecord[]> {
    if (!payins.length) {
      return []
    }
    const maxAge = Number.isFinite(maxAgeSeconds ?? Number.NaN) && (maxAgeSeconds ?? 0) > 0
      ? Math.floor(maxAgeSeconds ?? 0)
      : null
    const ageClause = maxAge ? 'AND collected_at >= NOW() - ($5 * INTERVAL \'1 second\')' : ''
    const params = maxAge
      ? [corridorId, amountBucket, payins, payout, maxAge]
      : [corridorId, amountBucket, payins, payout]
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
              send_amount::double precision AS send_amount,
              fee_amount::double precision AS fee_amount,
              promotional_fee_amount::double precision AS promotional_fee_amount,
              receive_amount::double precision AS receive_amount,
              implied_fx_rate::double precision AS implied_fx_rate,
              promotional_rate::double precision AS promotional_rate,
              base_rate::double precision AS base_rate,
              promotional_cap_amount::double precision AS promotional_cap_amount,
              quality_flags,
              updated_at
         FROM silver.latest_quote_by_provider
        WHERE corridor_id = $1
          AND amount_bucket = $2
          AND payin = ANY($3::text[])
          AND payout = $4
          ${ageClause}
        ORDER BY receive_amount DESC, fee_amount ASC`,
      params,
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
         send_amount::double precision AS send_amount,
         fee_amount::double precision AS fee_amount,
         promotional_fee_amount::double precision AS promotional_fee_amount,
         total_debit_amount::double precision AS total_debit_amount,
         receive_amount::double precision AS receive_amount,
         implied_fx_rate::double precision AS implied_fx_rate,
         promotional_rate::double precision AS promotional_rate,
         base_rate::double precision AS base_rate,
         promotional_cap_amount::double precision AS promotional_cap_amount,
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

  async listLatestByCurrencyPair(
    baseCurrency: string,
    quoteCurrency: string,
    maxAgeHours: number = 24,
  ): Promise<LatestQuoteByCurrencyPairRecord[]> {
    const interval = `${Math.max(1, Math.floor(maxAgeHours))} hours`
    const result = await query<LatestQuoteByCurrencyPairRecord>(
      `SELECT DISTINCT ON (lqp.provider_id)
         lqp.provider_id,
         p.display_name AS provider_name,
         lqp.corridor_id,
         lqp.implied_fx_rate::double precision AS implied_fx_rate,
         lqp.delivery_time_min_minutes,
         lqp.delivery_time_max_minutes,
         lqp.collected_at
       FROM silver.latest_quote_by_provider lqp
       JOIN silver.corridor c ON c.corridor_id = lqp.corridor_id
       JOIN silver.provider p ON p.provider_id = lqp.provider_id
       WHERE lqp.status = 'ok'
         AND UPPER(c.source_currency) = UPPER($1)
         AND UPPER(c.dest_currency) = UPPER($2)
         AND lqp.collected_at >= NOW() - $3::interval
       ORDER BY lqp.provider_id, lqp.collected_at DESC`,
      [baseCurrency, quoteCurrency, interval],
      this.pool,
    )
    return result.rows
  }
}
