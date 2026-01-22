export type CorridorTierList = {
  version: string
  tier1: string[]
  tier2: string[]
  tier3: string[]
}

const normalizeVersion = (value?: string) => value?.trim().toLowerCase() || ''

const normalizeCorridors = (corridors: string[]) =>
  corridors
    .map((corridorId) => corridorId.trim().toUpperCase())
    .filter(Boolean)

export const CORRIDOR_TIER_V0: CorridorTierList = {
  version: 'v0',
  tier1: [],
  tier2: [],
  tier3: [],
}

const tierListsByVersion: Record<string, CorridorTierList> = {
  [CORRIDOR_TIER_V0.version]: CORRIDOR_TIER_V0,
}

export const getTierListForVersion = (version?: string): CorridorTierList | null => {
  const key = normalizeVersion(version)
  if (!key) return null
  const list = tierListsByVersion[key]
  if (!list) return null
  return {
    version: list.version,
    tier1: normalizeCorridors(list.tier1),
    tier2: normalizeCorridors(list.tier2),
    tier3: normalizeCorridors(list.tier3),
  }
}

export const buildPriorityTierMapFromList = (list: CorridorTierList) => {
  const map = new Map<string, string>()
  const add = (corridors: string[], tierLabel: string) => {
    for (const corridorId of corridors) {
      if (!corridorId) continue
      if (map.has(corridorId)) continue
      map.set(corridorId, tierLabel)
    }
  }

  add(list.tier1, 'tier_1_alpha')
  add(list.tier2, 'tier_2_reference')
  add(list.tier3, 'tier_3_discovery')

  return map
}

export const getTierSettingsForVersion = (version?: string) => {
  const list = getTierListForVersion(version)
  if (!list) return null
  return new Map<string, { intervalSeconds: number; sloMinutes: number }>([
    ['tier_1_alpha', { intervalSeconds: 120, sloMinutes: 2 }],
    ['tier_2_reference', { intervalSeconds: 21600, sloMinutes: 360 }],
    ['tier_3_discovery', { intervalSeconds: 86400, sloMinutes: 1440 }],
  ])
}
