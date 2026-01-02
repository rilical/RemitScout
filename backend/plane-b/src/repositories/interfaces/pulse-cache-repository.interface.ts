export type PulseCacheEntryInput = {
  key: string
  payload: string
}

export interface IPulseCacheRepository {
  upsertEntry(input: PulseCacheEntryInput): Promise<void>
}
