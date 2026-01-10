export type QuoteRefreshRequestInput = {
  providerId: string
  corridorId: string
  amountBucket: number
  payinMethod: string
  payoutMethod: string
}

export type QuoteRefreshStatusCount = {
  status: string
  count: number
}

export interface IQuoteRefreshRepository {
  enqueueRequest(input: QuoteRefreshRequestInput): Promise<string | null>
  listStatusCounts(requestIds: string[]): Promise<QuoteRefreshStatusCount[]>
}
