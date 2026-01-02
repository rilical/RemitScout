export type BronzeWriteInput = {
  providerId: string
  corridorId: string
  payload: unknown
}

export interface IBronzeRepository {
  insertPayload(input: BronzeWriteInput): Promise<number | null>
}
