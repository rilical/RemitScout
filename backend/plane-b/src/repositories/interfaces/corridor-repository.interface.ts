export type CorridorInput = {
  corridorId: string
  sourceCountry: string
  destCountry: string
  sourceCurrency: string
  destCurrency: string
}

export interface ICorridorRepository {
  insertIfMissing(input: CorridorInput): Promise<void>
  upsertCorridor(input: CorridorInput): Promise<void>
}
