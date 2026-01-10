export type CorridorCapabilityRecord = {
  provider_id: string
  payin_methods: string[] | null
  payout_methods: string[] | null
  is_supported: boolean
}

export interface ICorridorCapabilityRepository {
  listByCorridor(corridorId: string): Promise<CorridorCapabilityRecord[]>
  listSupportedProviderIds(
    corridorId: string,
    payinMethod: string,
    payoutMethod: string,
  ): Promise<string[]>
}
