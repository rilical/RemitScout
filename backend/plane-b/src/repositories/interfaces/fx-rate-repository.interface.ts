export type FxRateInput = {
  baseCurrency: string
  quoteCurrency: string
  rate: number
}

export interface IFxRateRepository {
  upsertRate(input: FxRateInput): Promise<void>
}
