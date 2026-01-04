export type BronzeWriteInput = {
  providerId: string
  corridorId: string
  payload: unknown
  s3ObjectKey?: string | null
}

export interface IBronzeRepository {
  insertPayload(input: BronzeWriteInput): Promise<number | null>
}
