import type { CorridorTier } from '../shared/corridor-tiers'
import type { MacroLane } from '../shared/macro-corridors'

export type NormalizeMacroLanesOptions = {
  tierSnapshot?: Map<string, CorridorTier> | null
  disableTier1: boolean
}

export type NormalizeMacroLanesResult = {
  lanes: MacroLane[]
  stats: {
    tierSnapshotOverrides: number
    lanesDemotedToTier2: number
  }
}

export const normalizeMacroLanesForSweep = (
  macroLanes: MacroLane[],
  options: NormalizeMacroLanesOptions,
): NormalizeMacroLanesResult => {
  let tierSnapshotOverrides = 0
  let lanesDemotedToTier2 = 0

  const lanes = macroLanes.map((lane) => {
    const snapshotTier = options.tierSnapshot?.get(lane.corridorId)
    const resolvedTier = snapshotTier ?? lane.tier

    if (snapshotTier && snapshotTier !== lane.tier) {
      tierSnapshotOverrides += 1
    }

    const normalizedTier =
      options.disableTier1 && resolvedTier === 'tier_1'
        ? 'tier_2'
        : resolvedTier

    if (options.disableTier1 && resolvedTier === 'tier_1') {
      lanesDemotedToTier2 += 1
    }

    if (normalizedTier === lane.tier) {
      return lane
    }

    return { ...lane, tier: normalizedTier }
  })

  return {
    lanes,
    stats: {
      tierSnapshotOverrides,
      lanesDemotedToTier2,
    },
  }
}
