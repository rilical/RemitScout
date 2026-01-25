export type BronzeWriteInput = {
  providerId: string
  corridorId: string
  amountBucket?: number
  payinMethod?: string
  payoutMethod?: string
  payload: unknown
  s3ObjectKey?: string | null
}

export type FailedAttemptInput = {
  providerId: string
  corridorId: string
  amountBucket: number
  payinMethod: string
  payoutMethod: string
  reason: string
  attemptedAt: Date
}

export interface IBronzeRepository {
  insertPayload(input: BronzeWriteInput): Promise<number | null>
  recordFailedAttempt(input: FailedAttemptInput): Promise<void>
}
