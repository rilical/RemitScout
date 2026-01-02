export type FxProviderRateInput = {
  providerName: string
  baseCurrency: string
  quoteCurrency: string
  rate: number
  markupBps: number
  speed: string
}

export interface IFxProviderRateRepository {
  upsertRate(input: FxProviderRateInput): Promise<void>
}
