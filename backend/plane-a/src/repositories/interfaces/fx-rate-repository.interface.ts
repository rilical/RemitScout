export interface IFxRateRepository {
  getRate(baseCurrency: string, quoteCurrency: string): Promise<number | null>
}
