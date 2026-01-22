export type ProviderWeightModel = 'provider_volume' | 'equal'

// Heuristic volume weights (relative). Tune when we have observed volumes.
export const PROVIDER_VOLUME_WEIGHTS: Record<string, number> = {
  westernunion: 5,
  wise: 4,
  remitly: 4,
  ria: 3,
  worldremit: 3,
  xoom: 3,
  xe: 2,
  transfergo: 2,
  paysend: 2,
  sendwave: 2,
  mukuru: 2,
  wirebarley: 2,
  instarem: 2,
  intermex: 2,
  alansari: 1,
  bossmoney: 1,
  dahabshiil: 1,
  koronapay: 1,
  orbitremit: 1,
  pangea: 1,
  placid: 1,
  remitbee: 1,
  singx: 1,
  wellsfargo: 1,
}

export const DEFAULT_PROVIDER_WEIGHT = 1

export const getProviderVolumeWeight = (providerId?: string | null): number => {
  if (!providerId) return DEFAULT_PROVIDER_WEIGHT
  const key = providerId.trim().toLowerCase()
  return PROVIDER_VOLUME_WEIGHTS[key] ?? DEFAULT_PROVIDER_WEIGHT
}

export const getProviderWeightEntries = (): Array<[string, number]> => {
  return Object.entries(PROVIDER_VOLUME_WEIGHTS)
}

export const PROVIDER_WEIGHTING_MODEL: ProviderWeightModel = 'provider_volume'
