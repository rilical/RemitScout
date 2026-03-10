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

export type GoldIndicesMethodologyRow = {
  provider_id: string
  provider_name: string
  weight: number
  quote_count: number | null
  window_days: number | null
  weight_confidence: number | null
  last_collected_at: Date | null
}

export interface IGoldIndicesRepository {
  getAvailability(input: {
    corridorId: string
    amountBucket: number
    methodProfile: string
  }): Promise<GoldIndicesAvailability>
  getIndicesSeries(input: {
    corridorId: string
    amountBucket: number
    methodProfile: string
    startDate: Date
    endDate: Date
  }): Promise<GoldIndicesRow[]>
  getIndicesLatest(input: {
    corridorId: string
    amountBucket: number
    methodProfile: string
  }): Promise<GoldIndicesRow | null>
  getMethodologyRows(input: {
    corridorId: string
    amountBucket: number
    methodProfile: string
    modelVersion: string
  }): Promise<GoldIndicesMethodologyRow[]>
  resolveCorridorId(input: ResolveCorridorInput): Promise<string | null>
}
