/**
 * Document extractor repair strategy — handles failures in document-based
 * data extraction (PDF fee schedules, HTML tables, structured documents).
 *
 * Diagnoses extraction pipeline failures where the raw document format
 * or layout changed, requiring template or extraction rule updates.
 */

import type { FailureBundle } from '../../../../shared/types/failure-bundle'
import type { DiagnosticContext, DiagnosticEvidence, RepairAction, RepairProposal, RepairStrategy } from './types'

export class DocumentExtractorRepairStrategy implements RepairStrategy {
  readonly id = 'document-extractor-repair'
  readonly name = 'Document Extractor Repair Strategy'
  readonly supportedSources = ['http' as const, 'playwright' as const, 'hybrid' as const]
  readonly supportedLayers = ['parse' as const, 'transform' as const]

  canRepair(bundle: FailureBundle): boolean {
    // Handles parse/transform failures that aren't pure DOM selector issues
    const isParseOrTransform = bundle.failureLayer === 'parse' || bundle.failureLayer === 'transform'
    const hasDocumentSignals =
      bundle.errorMessage.toLowerCase().includes('table') ||
      bundle.errorMessage.toLowerCase().includes('column') ||
      bundle.errorMessage.toLowerCase().includes('header') ||
      bundle.errorMessage.toLowerCase().includes('row') ||
      bundle.errorMessage.toLowerCase().includes('cell') ||
      bundle.errorMessage.toLowerCase().includes('pdf') ||
      bundle.qualityFlags.some((f: string) => f.includes('parse_error') || f.includes('missing_field'))

    return isParseOrTransform && hasDocumentSignals
  }

  async diagnose(bundle: FailureBundle): Promise<DiagnosticContext> {
    const start = Date.now()
    const evidence: DiagnosticEvidence[] = []
    const suggestedActions: RepairAction[] = []

    // Analyze error patterns for document structure changes
    const errorLower = bundle.errorMessage.toLowerCase()

    if (errorLower.includes('table') || errorLower.includes('column') || errorLower.includes('header')) {
      evidence.push({
        type: 'table_structure_change',
        description: 'HTML table or document table structure appears to have changed',
        data: { errorMessage: bundle.errorMessage, errorType: bundle.errorType },
      })

      suggestedActions.push({
        type: 'parser_rewrite',
        description: `Update table extraction logic for ${bundle.providerId} to handle new column layout`,
        targetFile: `backend/plane-b/src/providers/${bundle.providerId}/parse.ts`,
        estimatedLinesChanged: 25,
        priority: 1,
      })
    }

    if (errorLower.includes('pdf') || errorLower.includes('document')) {
      evidence.push({
        type: 'document_format_change',
        description: 'PDF or document format may have changed',
        data: { errorMessage: bundle.errorMessage },
      })

      suggestedActions.push({
        type: 'parser_rewrite',
        description: `Update document extraction template for ${bundle.providerId}`,
        targetFile: `backend/plane-b/src/providers/${bundle.providerId}/parse.ts`,
        estimatedLinesChanged: 30,
        priority: 1,
      })
    }

    // Quality flag analysis
    const relevantFlags = bundle.qualityFlags.filter(
      (f: string) => f.includes('parse_error') || f.includes('missing_field') || f.includes('type_mismatch'),
    )
    if (relevantFlags.length > 0) {
      evidence.push({
        type: 'quality_flag_analysis',
        description: `Quality flags indicate extraction issues: ${relevantFlags.join(', ')}`,
        data: { flags: relevantFlags },
      })
    }

    // Transform layer failures
    if (bundle.failureLayer === 'transform') {
      evidence.push({
        type: 'transform_failure',
        description: 'Data was parsed but normalization/transformation failed',
        data: { errorType: bundle.errorType },
      })

      suggestedActions.push({
        type: 'schema_migration',
        description: `Update normalization mapping for ${bundle.providerId} to handle changed data shape`,
        targetFile: `backend/plane-b/src/providers/${bundle.providerId}/parse.ts`,
        estimatedLinesChanged: 15,
        priority: 2,
      })
    }

    // Default action if nothing specific matched
    if (suggestedActions.length === 0) {
      suggestedActions.push({
        type: 'parser_rewrite',
        description: `Review and update document extraction for ${bundle.providerId}`,
        targetFile: `backend/plane-b/src/providers/${bundle.providerId}/parse.ts`,
        estimatedLinesChanged: 20,
        priority: 1,
      })
    }

    return {
      strategyId: this.id,
      bundleId: bundle.bundleId,
      rootCause: this.inferRootCause(evidence),
      rootCauseConfidence: Math.min(0.85, 0.3 + evidence.length * 0.2),
      evidence,
      suggestedActions,
      diagnosisMs: Date.now() - start,
    }
  }

  async propose(bundle: FailureBundle, diagnostic: DiagnosticContext): Promise<RepairProposal | null> {
    if (diagnostic.suggestedActions.length === 0) return null

    const hasComplexChanges = diagnostic.suggestedActions.some(a => a.estimatedLinesChanged > 20)

    return {
      strategyId: this.id,
      bundleId: bundle.bundleId,
      diagnostic,
      patches: [], // Patches generated by LLM via tool-gateway at runtime
      requiresReview: hasComplexChanges,
      reviewReason: hasComplexChanges
        ? 'Document extraction changes are complex and require visual verification'
        : 'Minor extraction rule update can be auto-applied with contract test validation',
    }
  }

  private inferRootCause(evidence: DiagnosticEvidence[]): string {
    if (evidence.some(e => e.type === 'table_structure_change')) {
      return 'Document table structure changed - column order, headers, or layout modified'
    }
    if (evidence.some(e => e.type === 'document_format_change')) {
      return 'Document format changed - PDF layout or HTML document structure modified'
    }
    if (evidence.some(e => e.type === 'transform_failure')) {
      return 'Document parsed successfully but data shape changed, breaking normalization'
    }
    return 'Document extraction failure - source document structure may have changed'
  }
}
