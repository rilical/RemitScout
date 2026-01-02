export type LatestQuoteByCorridorRecord = {
  provider_id: string
  corridor_id: string
  amount_bucket: number
  payin: string
  payout: string
  payin_method: string
  payout_method: string
  delivery_time_min_minutes: number | null
  delivery_time_max_minutes: number | null
  collected_at: string | Date | null
  send_amount: number | null
  fee_amount: number | null
  promotional_fee_amount: number | null
  receive_amount: number | null
  implied_fx_rate: number | null
  promotional_rate: number | null
  base_rate: number | null
  promotional_cap_amount: number | null
  quality_flags: unknown
  updated_at: string | Date | null
}

export type LatestQuoteByProviderRecord = {
  corridor_id: string
  payin: string
  payout: string
  collected_at: string | Date | null
  send_amount: number | null
  fee_amount: number | null
  promotional_fee_amount: number | null
  total_debit_amount: number | null
  receive_amount: number | null
  implied_fx_rate: number | null
  promotional_rate: number | null
  base_rate: number | null
  promotional_cap_amount: number | null
  delivery_time_min_minutes: number | null
  delivery_time_max_minutes: number | null
  quality_flags: unknown
  updated_at: string | Date | null
}

export interface ILatestQuoteRepository {
  listLatestByCorridor(
    corridorId: string,
    amountBucket: number,
    payin: string,
    payout: string,
  ): Promise<LatestQuoteByCorridorRecord[]>

  listLatestByProvider(
    providerId: string,
    corridorIds: string[],
  ): Promise<LatestQuoteByProviderRecord[]>
}
