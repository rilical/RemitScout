import { toNumber } from './config-helpers'

export type ProviderQualityGates = {
  minProvidersForRvi: number
  minProvidersForRci: number
  minProvidersForTeer: number
  minProvidersForSellableRvi: number
  corridorOverrides: Record<string, number>
}

const parseCorridorOverrides = (value: string | undefined): Record<string, number> => {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const normalized: Record<string, number> = {}
    for (const [key, raw] of Object.entries(parsed)) {
      const corridorId = String(key || '').trim().toUpperCase()
      if (!corridorId) continue
      const numeric = typeof raw === 'number' ? raw : Number(raw)
      if (!Number.isFinite(numeric) || numeric < 0) continue
      normalized[corridorId] = Math.floor(numeric)
    }
    return normalized
  } catch {
    return {}
  }
}

export const PROVIDER_QUALITY_GATES: ProviderQualityGates = {
  minProvidersForRvi: toNumber(process.env.PROVIDER_MIN_PROVIDERS_RVI, 3),
  minProvidersForRci: toNumber(process.env.PROVIDER_MIN_PROVIDERS_RCI, 3),
  minProvidersForTeer: toNumber(process.env.PROVIDER_MIN_PROVIDERS_TEER, 3),
  minProvidersForSellableRvi: toNumber(process.env.PROVIDER_MIN_PROVIDERS_SELLABLE_RVI, 5),
  corridorOverrides: parseCorridorOverrides(process.env.PROVIDER_MIN_PROVIDERS_CORRIDOR_OVERRIDES),
}
