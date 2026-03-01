/**
 * Signal Layer Ablation Study (P4)
 *
 * Measures the marginal contribution of each signal layer to index stability.
 * For each layer, computes indices with and without that layer, then quantifies
 * the impact on TEER, RCI, and RVI.
 *
 * Implements Validation Agenda trial E2: "Remove each signal layer and quantify
 * degradation in explanatory power and forecast performance."
 */

import { createLogger } from '../shared/logger'

const logger = createLogger('script.ablation-study')

/**
 * Snapshot of index values for a corridor on a given date.
 */
export interface IndexSnapshot {
  teer: number
  rci_median_bps: number
  rvi_bps: number
}

/**
 * Result of ablating (removing) a single signal layer.
 */
export interface AblationResult {
  layerName: string
  teerDeltaPct: number
  rciDeltaBps: number
  rviDeltaBps: number
  marginalContribution: 'none' | 'low' | 'moderate' | 'high'
}

/**
 * Compute the impact of removing a signal layer by comparing baseline vs ablated indices.
 *
 * Thresholds:
 * - high: TEER changes > 1% OR RCI changes > 50 bps
 * - moderate: TEER changes > 0.3% OR RCI changes > 15 bps
 * - low: TEER changes > 0.05% OR RCI changes > 3 bps
 * - none: below all thresholds
 */
export function computeAblationImpact(
  layerName: string,
  baseline: IndexSnapshot,
  ablated: IndexSnapshot,
): AblationResult {
  const teerDeltaPct = baseline.teer > 0
    ? Math.abs(baseline.teer - ablated.teer) / baseline.teer * 100
    : 0

  const rciDeltaBps = Math.abs(baseline.rci_median_bps - ablated.rci_median_bps)
  const rviDeltaBps = Math.abs(baseline.rvi_bps - ablated.rvi_bps)

  let marginalContribution: AblationResult['marginalContribution'] = 'none'
  if (teerDeltaPct > 1.0 || rciDeltaBps > 50) {
    marginalContribution = 'high'
  } else if (teerDeltaPct > 0.3 || rciDeltaBps > 15) {
    marginalContribution = 'moderate'
  } else if (teerDeltaPct > 0.05 || rciDeltaBps > 3) {
    marginalContribution = 'low'
  }

  logger.debug('ablation_impact_computed', {
    layerName,
    teerDeltaPct: teerDeltaPct.toFixed(4),
    rciDeltaBps,
    rviDeltaBps,
    marginalContribution,
  })

  return { layerName, teerDeltaPct, rciDeltaBps, rviDeltaBps, marginalContribution }
}
