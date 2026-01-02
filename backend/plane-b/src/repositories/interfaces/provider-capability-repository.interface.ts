export type ProviderCapabilityInput = {
  providerId: string
  corridorId: string
  payinMethods: string[] | null
  payoutMethods: string[] | null
  isSupported: boolean
  source: string
}

export type ProviderCorridorRecord = {
  corridor_id: string | null
}

export type ProviderCorridorPriorityRecord = {
  corridor_id: string | null
  priority_tier: string | null
}

export interface IProviderCapabilityRepository {
  loadObservedCorridors(providerId: string): Promise<ProviderCorridorRecord[]>
  loadUnsupportedCorridors(providerId: string): Promise<ProviderCorridorRecord[]>
  upsertCapability(input: ProviderCapabilityInput): Promise<void>
  markCorridorUnsupported(
    providerId: string,
    corridorId: string,
    source: string,
  ): Promise<void>
  loadCoverageCorridors(minProviders: number): Promise<ProviderCorridorRecord[]>
  loadPriorityCorridors(providerId: string): Promise<ProviderCorridorPriorityRecord[]>
}
