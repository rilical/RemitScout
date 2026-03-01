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

/**
 * Summary of a full ablation study across all layers.
 */
export interface AblationStudySummary {
  /** All results, sorted by marginal contribution (highest first) */
  results: AblationResult[]
  /** Layer names with 'none' contribution — candidates for removal */
  redundantLayers: string[]
  /** Layer names with 'high' contribution — critical dependencies */
  criticalLayers: string[]
}

const CONTRIBUTION_RANK: Record<AblationResult['marginalContribution'], number> = {
  high: 3,
  moderate: 2,
  low: 1,
  none: 0,
}

/**
 * Summarize ablation results: sort by impact, identify redundant and critical layers.
 */
export function summarizeAblationStudy(results: AblationResult[]): AblationStudySummary {
  const sorted = [...results].sort((a, b) =>
    CONTRIBUTION_RANK[b.marginalContribution] - CONTRIBUTION_RANK[a.marginalContribution]
    || b.teerDeltaPct - a.teerDeltaPct
  )

  const redundantLayers = sorted
    .filter((r) => r.marginalContribution === 'none')
    .map((r) => r.layerName)

  const criticalLayers = sorted
    .filter((r) => r.marginalContribution === 'high')
    .map((r) => r.layerName)

  if (redundantLayers.length > 0) {
    logger.warn('ablation_redundant_layers_detected', {
      count: redundantLayers.length,
      layers: redundantLayers,
    })
  }

  return { results: sorted, redundantLayers, criticalLayers }
}

/**
 * Signal layers available for ablation.
 *
 * Source weights (from SignalCombiner):
 * - direct: 0.5 — Direct TEER from gold indices
 * - triangulated: 0.2 — Synthetic triangulated TEER via intermediary currencies
 * - factor: 0.3 — External factor signals (FX, economic, regulatory)
 *
 * Stress signal types (from TriangulationEngine):
 * - rate_deviation (0.25), provider_dropout (0.18), failure_surge (0.15),
 *   rci_spike (0.12), freshness_breach (0.10), volume_drop (0.08),
 *   external_fx (0.07), volume_spike (0.05)
 */
export const ABLATION_LAYERS = [
  'direct',
  'triangulated',
  'factor',
  'rate_deviation',
  'provider_dropout',
  'failure_surge',
  'rci_spike',
  'freshness_breach',
  'volume_drop',
  'external_fx',
  'volume_spike',
] as const

export type AblationLayer = typeof ABLATION_LAYERS[number]
