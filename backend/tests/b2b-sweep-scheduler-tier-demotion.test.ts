import { describe, expect, it } from 'vitest'

import type { MacroLane } from '../shared/macro-corridors'
import { normalizeMacroLanesForSweep } from '../scripts/b2b-sweep-scheduler'

const buildLane = (overrides: Partial<MacroLane>): MacroLane => ({
  laneId: 'US-MX-USD-MXN:bank_deposit',
  corridorId: 'US-MX-USD-MXN',
  payoutMethod: 'bank_deposit',
  sourceCountry: 'US',
  destCountry: 'MX',
  sourceCurrency: 'USD',
  destCurrency: 'MXN',
  isHardCurrencyLane: false,
  tier: 'tier_1',
  ...overrides,
})

describe('normalizeMacroLanesForSweep', () => {
  it('keeps tier_1 lanes unchanged when tier1 is enabled', () => {
    const lane = buildLane({ tier: 'tier_1' })
    const normalized = normalizeMacroLanesForSweep([lane], {
      disableTier1: false,
    })

    expect(normalized.lanes[0].tier).toBe('tier_1')
    expect(normalized.stats.lanesDemotedToTier2).toBe(0)
  })

  it('demotes tier_1 lanes to tier_2 when tier1 is disabled', () => {
    const lane = buildLane({ tier: 'tier_1' })
    const normalized = normalizeMacroLanesForSweep([lane], {
      disableTier1: true,
    })

    expect(normalized.lanes[0].tier).toBe('tier_2')
    expect(normalized.stats.lanesDemotedToTier2).toBe(1)
  })

  it('applies snapshot override then demotes to tier_2 when tier1 is disabled', () => {
    const lane = buildLane({ corridorId: 'CA-MX-CAD-MXN', tier: 'tier_2' })
    const snapshot = new Map<string, 'tier_1' | 'tier_2'>([['CA-MX-CAD-MXN', 'tier_1']])
    const normalized = normalizeMacroLanesForSweep([lane], {
      disableTier1: true,
      tierSnapshot: snapshot,
    })

    expect(normalized.lanes[0].tier).toBe('tier_2')
    expect(normalized.stats.tierSnapshotOverrides).toBe(1)
    expect(normalized.stats.lanesDemotedToTier2).toBe(1)
  })
})
