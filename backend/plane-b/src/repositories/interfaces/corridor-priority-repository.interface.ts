export type CorridorPriorityRecord = {
  proxy_tier: string | null
}

export interface ICorridorPriorityRepository {
  getProxyTier(corridorId: string): Promise<CorridorPriorityRecord | null>
}
