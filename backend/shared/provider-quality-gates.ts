export type ProviderQualityGates = {
  minProvidersForRvi: number
  minProvidersForRci: number
  minProvidersForTeer: number
  minProvidersForSellableRvi: number
}

export const PROVIDER_QUALITY_GATES: ProviderQualityGates = {
  minProvidersForRvi: 3,
  minProvidersForRci: 3,
  minProvidersForTeer: 3,
  minProvidersForSellableRvi: 5,
}
