import { computeBucketSelection } from './amount-bucket'
import {
  CanonicalPayinMethod,
  CanonicalPayoutMethod,
  toCanonicalPayinMethod,
  toCanonicalPayoutMethod,
} from './canonical'
import { deriveMethodProfile, MethodProfile } from './method-profile'
import { qualityFlags, QualityFlag } from './quality-flags'

export type NormalizeQuoteInput = {
  provider_id: string
  corridor_id: string
  send_amount: number
  fee_amount: number
  fee_currency?: string | null
  total_debit_amount?: number | null
  receive_amount: number
  payin_method?: string | null
  payout_method?: string | null
  promotional_fee_amount?: number | null
  delivery_time_min_minutes?: number | null
  delivery_time_max_minutes?: number | null
  promotional_rate?: number | null
  base_rate?: number | null
  promotional_cap_amount?: number | null
  collected_at: string | Date
  ingestion_run_id: string
  bronze_object_key: string
  parser_version?: string | null
}

export type NormalizedQuote = {
  provider_id: string
  corridor_id: string
  amount_bucket: number
  bucket_used: number
  fee_bucket_used: number
  approximate: boolean
  payin: CanonicalPayinMethod
  payout: CanonicalPayoutMethod
  send_amount: number
  fee_amount: number
  fee_currency?: string | null
  total_debit_amount: number
  receive_amount: number
  implied_fx_rate: number
  promotional_fee_amount: number | null
  delivery_time_min_minutes?: number | null
  delivery_time_max_minutes?: number | null
  promotional_rate: number | null
  base_rate: number | null
  promotional_cap_amount: number | null
  collected_at: string
  ingested_at: string
  ingestion_run_id: string
  bronze_object_key: string
  parser_version?: string | null
  quality_flags: QualityFlag[]
  method_profile: MethodProfile | null
}

const isFiniteNumber = (value: number) => Number.isFinite(value)

export const normalizeQuote = (input: NormalizeQuoteInput): NormalizedQuote => {
  const flags: QualityFlag[] = []
  const payin = toCanonicalPayinMethod(input.payin_method)
  const payout = toCanonicalPayoutMethod(input.payout_method)

  if (payin === 'other' || payout === 'other') {
    flags.push(qualityFlags.unknown_method)
  }

  const bucketSelection = computeBucketSelection(input.send_amount)
  if (bucketSelection.approximate) {
    flags.push(qualityFlags.bucket_approx)
  }

  const promotionalRate = isFiniteNumber(input.promotional_rate ?? Number.NaN)
    ? Number(input.promotional_rate)
    : null
  const promotionalFeeAmount = isFiniteNumber(input.promotional_fee_amount ?? Number.NaN)
    ? Number(input.promotional_fee_amount)
    : null
  const baseRate = isFiniteNumber(input.base_rate ?? Number.NaN) ? Number(input.base_rate) : null
  const promotionalCapAmount = isFiniteNumber(input.promotional_cap_amount ?? Number.NaN)
    ? Number(input.promotional_cap_amount)
    : null
  const totalDebit =
    input.total_debit_amount && isFiniteNumber(input.total_debit_amount)
      ? input.total_debit_amount
      : isFiniteNumber(input.send_amount) && isFiniteNumber(input.fee_amount)
        ? input.send_amount + (promotionalFeeAmount ?? input.fee_amount)
        : 0

  if (!isFiniteNumber(input.send_amount) || !isFiniteNumber(input.receive_amount)) {
    flags.push(qualityFlags.parse_error)
  }

  const impliedFxRate =
    input.send_amount > 0 && isFiniteNumber(input.receive_amount)
      ? input.receive_amount / input.send_amount
      : 0

  const collectedAt =
    input.collected_at instanceof Date
      ? input.collected_at.toISOString()
      : new Date(input.collected_at).toISOString()

  if (!input.provider_id || !input.corridor_id || !input.bronze_object_key || !input.ingestion_run_id) {
    flags.push(qualityFlags.partial_data)
  }

  const methodProfile = deriveMethodProfile(payin, payout)

  return {
    provider_id: input.provider_id,
    corridor_id: input.corridor_id,
    amount_bucket: bucketSelection.bucket_used,
    bucket_used: bucketSelection.bucket_used,
    fee_bucket_used: bucketSelection.fee_bucket_used,
    approximate: bucketSelection.approximate,
    payin,
    payout,
    send_amount: input.send_amount,
    fee_amount: input.fee_amount,
    fee_currency: input.fee_currency ?? null,
    total_debit_amount: totalDebit,
    receive_amount: input.receive_amount,
    implied_fx_rate: impliedFxRate,
    promotional_fee_amount: promotionalFeeAmount,
    delivery_time_min_minutes: input.delivery_time_min_minutes ?? null,
    delivery_time_max_minutes: input.delivery_time_max_minutes ?? null,
    promotional_rate: promotionalRate,
    base_rate: baseRate,
    promotional_cap_amount: promotionalCapAmount,
    collected_at: collectedAt,
    ingested_at: new Date().toISOString(),
    ingestion_run_id: input.ingestion_run_id,
    bronze_object_key: input.bronze_object_key,
    parser_version: input.parser_version ?? null,
    quality_flags: flags,
    method_profile: methodProfile,
  }
}
