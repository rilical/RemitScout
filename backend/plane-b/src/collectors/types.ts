import type { NormalizedQuote } from '../normalize/quote-normalizer'

export type FetchResult = {
  status: number
  bodyText: string
  payload: unknown
}

export type CollectorRequest = {
  provider_id: string
  corridor_id: string
  amount_bucket: number
  payin_method: string
  payout_method: string
  send_amount: number
  locale: string
}

export type CollectorStatus = 'success' | 'blocked' | 'error' | 'skipped'

export type CollectorResult = {
  status: CollectorStatus
  raw_payload?: unknown
  normalized_quote?: NormalizedQuote
  error_code?: string
  error_message?: string
  block_detected?: boolean
  locale: string
}
