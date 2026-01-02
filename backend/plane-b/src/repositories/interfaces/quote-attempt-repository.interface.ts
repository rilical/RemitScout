export type QuoteAttemptInput = {
  providerId: string
  corridorId: string
  amountBucket: number
  payinMethod: string
  payoutMethod: string
  success: boolean
  errorType: string | null
  httpStatus: number | null
  errorMessage: string | null
  bronzeObjectKey: string | null
  requestFingerprint: string
}

export interface IQuoteAttemptRepository {
  insertAttempt(input: QuoteAttemptInput): Promise<void>
}
