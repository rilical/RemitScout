export type FxRateRefreshRequestInput = {
  baseCurrency: string
  quoteCurrency: string
}

export type FxRateRefreshStatusCount = {
  status: string
  count: number
}

export type FxRateRefreshRequestState = {
  requestId: string
  status: string
  retryCount: number
  processedAt: string | Date | null
  lastRequestedAt: string | Date | null
  errorMessage: string | null
}

export interface IFxRateRefreshRepository {
  enqueueRequest(input: FxRateRefreshRequestInput): Promise<string | null>
  listStatusCounts(requestIds: string[]): Promise<FxRateRefreshStatusCount[]>
  getLatestRequestByPair(
    baseCurrency: string,
    quoteCurrency: string,
  ): Promise<FxRateRefreshRequestState | null>
}
