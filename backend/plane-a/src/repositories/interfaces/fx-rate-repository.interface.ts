import type { FxRateHistoryRecord } from './fx-rate-history-repository.interface'

export type FxRateRecord = {
  base_currency: string
  quote_currency: string
  rate: number
  bid: number | null
  ask: number | null
  source: string | null
  last_updated: string | Date | null
  updated_at: string | Date | null
}

export type FxRateInput = {
  baseCurrency: string
  quoteCurrency: string
  rate: number
  bid?: number | null
  ask?: number | null
  source?: string | null
  lastUpdated?: Date
}

export type FxRateWithHistory = {
  current: FxRateRecord | null
  history: FxRateHistoryRecord[]
  cached: boolean
}

export interface IFxRateRepository {
  getRate(baseCurrency: string, quoteCurrency: string): Promise<number | null>
  getRateRecord(baseCurrency: string, quoteCurrency: string): Promise<FxRateRecord | null>
  getRateWithHistory(baseCurrency: string, quoteCurrency: string, days: number): Promise<FxRateWithHistory>
  upsertRate(input: FxRateInput): Promise<void>
}
