/**
 * Structured API repair strategy — handles API/B2B collector failures.
 *
 * Diagnoses API contract changes (new fields, removed fields, schema drift,
 * authentication changes) and proposes parser/config updates.
 */

import type { FailureBundle } from '../../../../shared/types/failure-bundle'
import type { DiagnosticContext, DiagnosticEvidence, RepairAction, RepairProposal, RepairStrategy } from './types'

export class StructuredApiRepairStrategy implements RepairStrategy {
  readonly id = 'structured-api-repair'
  readonly name = 'Structured API Repair Strategy'
  readonly supportedSources = ['api' as const, 'http' as const]
  readonly supportedLayers = ['parse' as const, 'fetch' as const, 'validate' as const]

  canRepair(bundle: FailureBundle): boolean {
    return (
      this.supportedSources.includes(bundle.fetcherSource as 'api' | 'http')
      && bundle.category !== 'dom_change'
    )
  }

  async diagnose(bundle: FailureBundle): Promise<DiagnosticContext> {
    const start = Date.now()
    const evidence: DiagnosticEvidence[] = []
    const suggestedActions: RepairAction[] = []

    // Analyze HTTP status codes
    if (bundle.httpStatuses.length > 0) {
      const hasAuthErrors = bundle.httpStatuses.some((s: number) => s === 401 || s === 403)
      const hasServerErrors = bundle.httpStatuses.some((s: number) => s >= 500)
      const hasClientErrors = bundle.httpStatuses.some((s: number) => s >= 400 && s < 500 && s !== 401 && s !== 403)

      evidence.push({
        type: 'http_status_analysis',
        description: `Observed HTTP statuses: ${bundle.httpStatuses.join(', ')}`,
        data: { statuses: bundle.httpStatuses, hasAuthErrors, hasServerErrors, hasClientErrors },
      })

      if (hasAuthErrors) {
        suggestedActions.push({
          type: 'config_change',
          description: `Update authentication credentials or method for ${bundle.providerId}`,
          targetFile: `backend/plane-b/src/providers/${bundle.providerId}/config.ts`,
          estimatedLinesChanged: 5,
          priority: 1,
        })
      }

      if (hasClientErrors) {
        suggestedActions.push({
          type: 'endpoint_change',
          description: `API endpoint or request format may have changed for ${bundle.providerId}`,
          targetFile: `backend/plane-b/src/providers/${bundle.providerId}/fetch.ts`,
          estimatedLinesChanged: 15,
          priority: 2,
        })
      }
    }

    // Analyze parse failures
    if (bundle.category === 'parse' || bundle.failureLayer === 'parse') {
      evidence.push({
        type: 'parse_failure',
        description: 'API response structure may have changed',
        data: { errorType: bundle.errorType, errorMessage: bundle.errorMessage },
      })

      suggestedActions.push({
        type: 'schema_migration',
        description: `Update response parser for ${bundle.providerId} to handle new API schema`,
        targetFile: `backend/plane-b/src/providers/${bundle.providerId}/parse.ts`,
        estimatedLinesChanged: 20,
        priority: 1,
      })
    }

    // Analyze data integrity failures
    if (bundle.category === 'data_integrity' || bundle.failureLayer === 'validate') {
      evidence.push({
        type: 'data_integrity_failure',
        description: 'Parsed data fails validation checks',
        data: { qualityFlags: bundle.qualityFlags },
      })

      suggestedActions.push({
        type: 'parser_rewrite',
        description: `Fix data extraction logic in ${bundle.providerId} parser`,
        targetFile: `backend/plane-b/src/providers/${bundle.providerId}/parse.ts`,
        estimatedLinesChanged: 10,
        priority: 1,
      })
    }

    // Rate limit handling
    if (bundle.category === 'rate_limit') {
      evidence.push({
        type: 'rate_limit',
        description: 'Provider is rate-limiting requests',
        data: { httpStatuses: bundle.httpStatuses, consecutiveFailures: bundle.consecutiveFailures },
      })

      suggestedActions.push({
        type: 'config_change',
        description: `Reduce collection cadence for ${bundle.providerId} to stay within rate limits`,
        targetFile: `backend/plane-b/src/providers/${bundle.providerId}/config.ts`,
        estimatedLinesChanged: 3,
        priority: 1,
      })
    }

    const rootCause = this.inferRootCause(bundle, evidence)

    return {
      strategyId: this.id,
      bundleId: bundle.bundleId,
      rootCause,
      rootCauseConfidence: this.computeConfidence(evidence),
      evidence,
      suggestedActions,
      diagnosisMs: Date.now() - start,
    }
  }

  async propose(bundle: FailureBundle, diagnostic: DiagnosticContext): Promise<RepairProposal | null> {
    if (diagnostic.suggestedActions.length === 0) return null

    const hasAuthIssue = diagnostic.evidence.some(
      e => e.type === 'http_status_analysis' && (e.data as Record<string, unknown>).hasAuthErrors,
    )

    return {
      strategyId: this.id,
      bundleId: bundle.bundleId,
      diagnostic,
      patches: [], // Patches generated by LLM via tool-gateway at runtime
      requiresReview: hasAuthIssue,
      reviewReason: hasAuthIssue
        ? 'Authentication changes require manual credential rotation'
        : 'Schema migration can be auto-applied with contract test validation',
    }
  }

  private inferRootCause(bundle: FailureBundle, evidence: DiagnosticEvidence[]): string {
    if (bundle.category === 'auth') return 'API authentication credentials expired or revoked'
    if (bundle.category === 'rate_limit') return 'Collection cadence exceeds provider rate limits'
    if (bundle.category === 'parse') return 'API response schema changed, breaking existing parser'
    if (bundle.category === 'data_integrity') return 'Parsed data fails validation - possible field rename or type change'
    if (bundle.category === 'server_error') return 'Provider API experiencing server-side errors'
    if (evidence.some(e => e.type === 'http_status_analysis')) return 'API contract change detected via HTTP status codes'
    return 'Unknown API failure - requires manual investigation'
  }

  private computeConfidence(evidence: DiagnosticEvidence[]): number {
    if (evidence.length === 0) return 0.2
    if (evidence.length === 1) return 0.5
    return Math.min(0.9, 0.4 + evidence.length * 0.15)
  }
}
