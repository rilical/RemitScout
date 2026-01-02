export type ProviderRateConfigInput = {
  providerId: string
  rpm: number
  perCorridorRpm: number
}

export type ProviderRateConfigRecord = {
  provider_id: string
  rpm: number | null
  per_corridor_rpm: number | null
}

export interface IProviderRateRepository {
  getRates(providerId: string): Promise<ProviderRateConfigRecord | null>
  upsertRates(input: ProviderRateConfigInput): Promise<void>
}
