import type { LatestQuoteUpsertInput } from './latest-quote-repository.interface'

export type QuoteRecordInsertInput = {
  providerId: string
  corridorId: string
  amountBucket: number
  payin: string
  payout: string
  sendAmount: number
  feeAmount: number
  promotionalFeeAmount: number | null
  totalDebitAmount: number
  receiveAmount: number
  impliedFxRate: number
  promotionalRate: number | null
  baseRate: number | null
  promotionalCapAmount: number | null
  deliveryTimeMinMinutes: number | null
  deliveryTimeMaxMinutes: number | null
  status: string
  errorCode: string | null
  errorMessage: string | null
  collectedAt: string | Date
  ingestedAt: string | Date
  ingestionRunId: string
  bronzeObjectKey: string
}

export type QuoteRecordPersistInput = QuoteRecordInsertInput & {
  feeCurrency: string | null
  parserVersion: string
  qualityFlags: string
}

export type QuoteBaselineRecord = {
  avg_rate: number | null
  stddev_rate: number | null
  sample_count: number | null
}

export interface IQuoteRecordRepository {
  insertQuoteRecord(input: QuoteRecordInsertInput): Promise<void>
  insertQuoteAndUpsertLatest(input: {
    quote: QuoteRecordPersistInput
    latest: LatestQuoteUpsertInput
  }): Promise<void>
  /**
   * Retrieves 24-hour baseline statistics for anomaly detection.
   * 
   * Calculates statistical baseline from recent successful quotes:
   * - avg_rate: Mean implied FX rate over 24h window
   * - stddev_rate: Standard deviation of rates (measures volatility)
   * - sample_count: Number of quotes used in calculation
   * 
   * Only includes quotes with status='ok' to ensure data quality.
   * Returns null if no historical data exists for the corridor/provider pair.
   * 
   * @param corridorId - Remittance corridor identifier
   * @param providerId - Provider identifier
   * @returns Baseline statistics or null if insufficient data
   */
  getBaselineStats(corridorId: string, providerId: string): Promise<QuoteBaselineRecord | null>
}
