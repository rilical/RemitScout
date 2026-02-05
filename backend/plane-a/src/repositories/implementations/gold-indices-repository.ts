import type { Pool } from 'pg'

import { query } from '../../../../shared/db'

export type GoldIndicesRow = {
  date: Date
  corridor_id: string
  amount_bucket: number
  method_profile: string
  teer_rate: number | null
  rci_ratio: number | null
  rvi_bps: number | null
  provider_count_binned: number | null
  provider_count: number | null
  suppression_flag: boolean
  suppression_reason: string | null
  weighting_model: string | null
  methodology_version: string | null
  mid_market_rate: number | null
  weight_confidence: number | null
  weight_window_days: number | null
  created_at: Date
}

export type GoldIndicesAvailability = {
  min_date: Date | null
  max_date: Date | null
  total_count: number
}

export type ResolveCorridorInput = {
  sourceCountry?: string | null
  destCountry?: string | null
  sourceCurrency?: string | null
  destCurrency?: string | null
}

export class GoldIndicesRepository {
  constructor(private readonly pool: Pool) {}

  async getAvailability(input: {
    corridorId: string
    amountBucket: number
    methodProfile: string
  }): Promise<GoldIndicesAvailability> {
    const result = await query<GoldIndicesAvailability>(
      `SELECT MIN(date) AS min_date,
              MAX(date) AS max_date,
              COUNT(*)::int AS total_count
         FROM gold_export.cdp_daily
        WHERE corridor_id = $1
          AND amount_bucket = $2
          AND method_profile = $3`,
      [input.corridorId, input.amountBucket, input.methodProfile],
      this.pool,
    )

    return result.rows[0] ?? { min_date: null, max_date: null, total_count: 0 }
  }

  async getIndicesSeries(input: {
    corridorId: string
    amountBucket: number
    methodProfile: string
    startDate: Date
    endDate: Date
  }): Promise<GoldIndicesRow[]> {
    const result = await query<GoldIndicesRow>(
      `SELECT date,
              corridor_id,
              amount_bucket,
              method_profile,
              teer_rate::double precision AS teer_rate,
              rci_ratio::double precision AS rci_ratio,
              rvi_bps::double precision AS rvi_bps,
              provider_count_binned,
              provider_count,
              suppression_flag,
              suppression_reason,
              weighting_model,
              methodology_version,
              mid_market_rate::double precision AS mid_market_rate,
              weight_confidence::double precision AS weight_confidence,
              weight_window_days,
              created_at
         FROM gold_export.cdp_daily
        WHERE corridor_id = $1
          AND amount_bucket = $2
          AND method_profile = $3
          AND date >= $4
          AND date <= $5
        ORDER BY date ASC`,
      [
        input.corridorId,
        input.amountBucket,
        input.methodProfile,
        input.startDate,
        input.endDate,
      ],
      this.pool,
    )

    return result.rows
  }

  async getIndicesLatest(input: {
    corridorId: string
    amountBucket: number
    methodProfile: string
  }): Promise<GoldIndicesRow | null> {
    const result = await query<GoldIndicesRow>(
      `SELECT date,
              corridor_id,
              amount_bucket,
              method_profile,
              teer_rate::double precision AS teer_rate,
              rci_ratio::double precision AS rci_ratio,
              rvi_bps::double precision AS rvi_bps,
              provider_count_binned,
              provider_count,
              suppression_flag,
              suppression_reason,
              weighting_model,
              methodology_version,
              mid_market_rate::double precision AS mid_market_rate,
              weight_confidence::double precision AS weight_confidence,
              weight_window_days,
              created_at
         FROM gold_export.cdp_daily
        WHERE corridor_id = $1
          AND amount_bucket = $2
          AND method_profile = $3
        ORDER BY date DESC, created_at DESC
        LIMIT 1`,
      [input.corridorId, input.amountBucket, input.methodProfile],
      this.pool,
    )

    return result.rows[0] ?? null
  }

  async resolveCorridorId(input: ResolveCorridorInput): Promise<string | null> {
    const sourceCountry = input.sourceCountry?.toUpperCase() ?? null
    const destCountry = input.destCountry?.toUpperCase() ?? null
    const sourceCurrency = input.sourceCurrency?.toUpperCase() ?? null
    const destCurrency = input.destCurrency?.toUpperCase() ?? null

    if (sourceCountry && destCountry && sourceCurrency && destCurrency) {
      const result = await query<{ corridor_id: string }>(
        `SELECT corridor_id
           FROM silver.corridor
          WHERE source_country = $1
            AND dest_country = $2
            AND source_currency = $3
            AND dest_currency = $4
          LIMIT 1`,
        [sourceCountry, destCountry, sourceCurrency, destCurrency],
        this.pool,
      )

      return result.rows[0]?.corridor_id ?? null
    }

    if (sourceCurrency && destCurrency) {
      const result = await query<{ corridor_id: string }>(
        `SELECT corridor_id
           FROM silver.corridor
          WHERE source_currency = $1
            AND dest_currency = $2
          ORDER BY (source_country = 'US') DESC, corridor_id ASC
          LIMIT 1`,
        [sourceCurrency, destCurrency],
        this.pool,
      )

      return result.rows[0]?.corridor_id ?? null
    }

    return null
  }
}
