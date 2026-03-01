/**
 * Repair strategy types for the self-healing agent pipeline.
 *
 * A RepairStrategy encapsulates the diagnostic and fix-generation logic
 * for a specific failure class (DOM scraper breakage, structured API contract
 * changes, document extraction failures).
 */

import type { FailureBundle, FailureLayer, FetcherSource } from '../../../../shared/types/failure-bundle'

/**
 * Diagnostic context assembled by a repair strategy before proposing a fix.
 */
export type DiagnosticContext = {
  /** Strategy that produced this diagnostic */
  strategyId: string
  /** The failure bundle being diagnosed */
  bundleId: string
  /** Root cause hypothesis */
  rootCause: string
  /** Confidence in the root cause hypothesis (0-1) */
  rootCauseConfidence: number
  /** Evidence supporting the hypothesis */
  evidence: DiagnosticEvidence[]
  /** Suggested repair actions in priority order */
  suggestedActions: RepairAction[]
  /** Time spent diagnosing in ms */
  diagnosisMs: number
}

export type DiagnosticEvidence = {
  /** Evidence type identifier */
  type: string
  /** Human-readable description */
  description: string
  /** Raw evidence data */
  data: Record<string, unknown>
}

export type RepairAction = {
  /** Action type */
  type: 'selector_update' | 'schema_migration' | 'endpoint_change' | 'parser_rewrite' | 'config_change'
  /** Human-readable description of the action */
  description: string
  /** Target file path (relative to repo root) */
  targetFile: string
  /** Estimated complexity: lines of change */
  estimatedLinesChanged: number
  /** Priority (lower = higher priority) */
  priority: number
}

/**
 * Repair proposal output from a strategy.
 */
export type RepairProposal = {
  /** Strategy that produced this proposal */
  strategyId: string
  /** The failure bundle being repaired */
  bundleId: string
  /** Diagnostic context used to generate the proposal */
  diagnostic: DiagnosticContext
  /** Proposed code changes as unified diff patches */
  patches: RepairPatch[]
  /** Whether the proposal requires human review (vs. auto-apply) */
  requiresReview: boolean
  /** Reason for requiring/not requiring review */
  reviewReason: string
}

export type RepairPatch = {
  /** File path relative to repo root */
  filePath: string
  /** Unified diff content */
  diff: string
  /** Description of what this patch does */
  description: string
}

/**
 * RepairStrategy interface - each strategy handles a specific failure class.
 */
export interface RepairStrategy {
  readonly id: string
  readonly name: string
  /** Fetcher sources this strategy can repair */
  readonly supportedSources: FetcherSource[]
  /** Failure layers this strategy can repair */
  readonly supportedLayers: FailureLayer[]

  /**
   * Check whether this strategy can handle the given failure bundle.
   */
  canRepair(bundle: FailureBundle): boolean

  /**
   * Assemble diagnostic context by analyzing the failure bundle and
   * any relevant code/DOM/API artifacts.
   */
  diagnose(bundle: FailureBundle): Promise<DiagnosticContext>

  /**
   * Generate a repair proposal based on the diagnostic context.
   * Returns null if no viable repair can be proposed.
   */
  propose(bundle: FailureBundle, diagnostic: DiagnosticContext): Promise<RepairProposal | null>
}
