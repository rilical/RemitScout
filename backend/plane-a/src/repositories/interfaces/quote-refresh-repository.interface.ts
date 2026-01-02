export type QuoteRefreshRequestInput = {
  providerId: string
  corridorId: string
  amountBucket: number
  payinMethod: string
  payoutMethod: string
}

export interface IQuoteRefreshRepository {
  enqueueRequest(input: QuoteRefreshRequestInput): Promise<string | null>
}
