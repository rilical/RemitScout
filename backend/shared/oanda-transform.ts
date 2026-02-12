export const toBoolean = (value: string | undefined): boolean => {
  return value === 'true' || value === '1' || value === 'yes'
}

export type { OandaFetchResult, OandaHistoricalRate, OandaRateData } from './oanda-client'
