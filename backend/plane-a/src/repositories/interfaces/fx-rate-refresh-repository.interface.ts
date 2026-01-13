export type FxRateRefreshRequestInput = {
  baseCurrency: string
  quoteCurrency: string
}

export type FxRateRefreshStatusCount = {
  status: string
  count: number
}

export interface IFxRateRefreshRepository {
  enqueueRequest(input: FxRateRefreshRequestInput): Promise<string | null>
  listStatusCounts(requestIds: string[]): Promise<FxRateRefreshStatusCount[]>
}
