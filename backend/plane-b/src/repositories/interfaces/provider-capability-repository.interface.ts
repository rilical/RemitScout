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

export type ProviderUnsupportedCorridorRecord = {
  corridor_id: string | null
  last_verified_at: Date | null
}

export type ProviderCorridorPriorityRecord = {
  corridor_id: string | null
  priority_tier: string | null
}

export type ProviderCapabilityRecord = {
  provider_id: string
  corridor_id: string
  payin_methods: string[] | null
  payout_methods: string[] | null
  is_supported: boolean
  last_verified_at: Date | null
  source: string
}

export interface IProviderCapabilityRepository {
  getCapability(providerId: string, corridorId: string): Promise<ProviderCapabilityRecord | null>
  getCapabilitiesForCorridor(corridorId: string): Promise<ProviderCapabilityRecord[]>
  loadAllSupportedCapabilities(): Promise<ProviderCapabilityRecord[]>
  loadObservedCorridors(providerId: string): Promise<ProviderCorridorRecord[]>
  loadUnsupportedCorridors(providerId: string): Promise<ProviderCorridorRecord[]>
  loadUnsupportedCorridorsWithAge(providerId: string): Promise<ProviderUnsupportedCorridorRecord[]>
  upsertCapability(input: ProviderCapabilityInput): Promise<void>
  markCorridorUnsupported(
    providerId: string,
    corridorId: string,
    source: string,
  ): Promise<void>
  loadCoverageCorridors(minProviders: number): Promise<ProviderCorridorRecord[]>
  loadPriorityCorridors(
    providerId: string,
    tierVersion?: string,
  ): Promise<ProviderCorridorPriorityRecord[]>
}
