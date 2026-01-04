export type PulseCacheRecord = {
  key: string
  payload: unknown
  updated_at: string | Date | null
}

export interface IPulseCacheRepository {
  getEntry(key: string): Promise<PulseCacheRecord | null>
  getEntries(keys: string[]): Promise<PulseCacheRecord[]>
}
