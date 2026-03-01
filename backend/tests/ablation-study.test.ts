import { describe, it, expect } from 'vitest'
import { computeAblationImpact, summarizeAblationStudy, type IndexSnapshot, type AblationStudySummary } from '../scripts/ablation-study'

describe('computeAblationImpact', () => {
  const baseline: IndexSnapshot = {
    teer: 83.5,
    rci_median_bps: 150,
    rvi_bps: 20,
  }

  it('returns "none" when removing a layer changes nothing', () => {
    const ablated: IndexSnapshot = { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }
    const result = computeAblationImpact('zero_impact_layer', baseline, ablated)

    expect(result.layerName).toBe('zero_impact_layer')
    expect(result.teerDeltaPct).toBeCloseTo(0, 4)
    expect(result.rciDeltaBps).toBeCloseTo(0, 4)
    expect(result.rviDeltaBps).toBeCloseTo(0, 4)
    expect(result.marginalContribution).toBe('none')
  })

  it('returns "high" when TEER changes > 1%', () => {
    const ablated: IndexSnapshot = { teer: 80.0, rci_median_bps: 300, rvi_bps: 50 }
    const result = computeAblationImpact('critical_layer', baseline, ablated)

    expect(result.teerDeltaPct).toBeGreaterThan(1.0)
    expect(result.rciDeltaBps).toBe(150) // |150 - 300|
    expect(result.marginalContribution).toBe('high')
  })

  it('returns "high" when RCI changes > 50 bps even if TEER is stable', () => {
    const ablated: IndexSnapshot = { teer: 83.4, rci_median_bps: 210, rvi_bps: 22 }
    const result = computeAblationImpact('rci_critical', baseline, ablated)

    expect(result.rciDeltaBps).toBe(60) // |150 - 210|
    expect(result.marginalContribution).toBe('high')
  })

  it('returns "moderate" for intermediate TEER changes (0.3% - 1%)', () => {
    // 0.6% TEER change: |83.5 - 83.0| / 83.5 * 100 = 0.5988%
    const ablated: IndexSnapshot = { teer: 83.0, rci_median_bps: 155, rvi_bps: 21 }
    const result = computeAblationImpact('moderate_layer', baseline, ablated)

    expect(result.teerDeltaPct).toBeGreaterThan(0.3)
    expect(result.teerDeltaPct).toBeLessThan(1.0)
    expect(result.marginalContribution).toBe('moderate')
  })

  it('returns "moderate" for intermediate RCI changes (15 - 50 bps)', () => {
    const ablated: IndexSnapshot = { teer: 83.48, rci_median_bps: 170, rvi_bps: 21 }
    const result = computeAblationImpact('rci_moderate', baseline, ablated)

    expect(result.rciDeltaBps).toBe(20) // |150 - 170|
    expect(result.marginalContribution).toBe('moderate')
  })

  it('returns "low" for small but non-zero TEER changes (0.05% - 0.3%)', () => {
    // 0.12% TEER change: |83.5 - 83.4| / 83.5 * 100 = 0.1198%
    const ablated: IndexSnapshot = { teer: 83.4, rci_median_bps: 153, rvi_bps: 20 }
    const result = computeAblationImpact('low_layer', baseline, ablated)

    expect(result.teerDeltaPct).toBeGreaterThan(0.05)
    expect(result.teerDeltaPct).toBeLessThan(0.3)
    expect(result.marginalContribution).toBe('low')
  })

  it('handles zero baseline TEER gracefully', () => {
    const zeroBaseline: IndexSnapshot = { teer: 0, rci_median_bps: 150, rvi_bps: 20 }
    const ablated: IndexSnapshot = { teer: 80.0, rci_median_bps: 300, rvi_bps: 50 }
    const result = computeAblationImpact('zero_teer', zeroBaseline, ablated)

    expect(result.teerDeltaPct).toBe(0)
    expect(result.rciDeltaBps).toBe(150)
    expect(result.marginalContribution).toBe('high') // RCI delta > 50
  })
})

describe('summarizeAblationStudy', () => {
  it('sorts results by marginal contribution descending', () => {
    const results = [
      computeAblationImpact('low_layer', { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }, { teer: 83.4, rci_median_bps: 153, rvi_bps: 20 }),
      computeAblationImpact('high_layer', { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }, { teer: 80.0, rci_median_bps: 300, rvi_bps: 50 }),
      computeAblationImpact('none_layer', { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }, { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }),
    ]

    const summary = summarizeAblationStudy(results)

    expect(summary.results[0].layerName).toBe('high_layer')
    expect(summary.results[1].layerName).toBe('low_layer')
    expect(summary.results[2].layerName).toBe('none_layer')
  })

  it('identifies redundant layers (contribution = none)', () => {
    const results = [
      computeAblationImpact('useful', { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }, { teer: 80.0, rci_median_bps: 300, rvi_bps: 50 }),
      computeAblationImpact('redundant_a', { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }, { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }),
      computeAblationImpact('redundant_b', { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }, { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }),
    ]

    const summary = summarizeAblationStudy(results)

    expect(summary.redundantLayers).toEqual(['redundant_a', 'redundant_b'])
    expect(summary.criticalLayers).toEqual(['useful'])
  })

  it('handles empty results', () => {
    const summary = summarizeAblationStudy([])

    expect(summary.results).toEqual([])
    expect(summary.redundantLayers).toEqual([])
    expect(summary.criticalLayers).toEqual([])
  })
})
