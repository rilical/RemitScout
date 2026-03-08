import type { Pool } from 'pg'
import type { JobContext, JobResult } from '../../../shared/types/job'
import { BaseJobHandler } from './base-job-handler'

/**
 * Parser job handler — validates and proposes parser fixes for modules
 * experiencing parse failures.
 *
 * Part of the self-healing pipeline: when a module's parse error rate exceeds
 * thresholds, the ParserHandler analyzes recent failure evidence and proposes
 * targeted parser corrections.
 */
export class ParserHandler extends BaseJobHandler {
  readonly handlerType = 'parser'

  protected async run(context: JobContext): Promise<JobResult> {
    const pool = context.pool as Pool
    const startedAt = Date.now()
    let itemsProcessed = 0
    let itemsFailed = 0

    // Load pending failure bundles with category='parse' for this module
    const { rows: bundles } = await pool.query<{
      bundle_id: string
      module_id: string
      provider_id: string
      collector_type: string
      severity: string
      error_message: string
      error_type: string
      dom_signature_hash: string | null
      previous_dom_signature_hash: string | null
      affected_corridors: string[]
      observation_ids: string[]
    }>(
      `SELECT bundle_id, module_id, provider_id, collector_type, severity,
              error_message, error_type, dom_signature_hash, previous_dom_signature_hash,
              affected_corridors, observation_ids
       FROM silver.failure_bundle
       WHERE module_id = $1 AND category = 'parse' AND repair_attempted = FALSE
       ORDER BY created_at DESC
       LIMIT 10`,
      [context.moduleId],
    )

    if (bundles.length === 0) {
      this.logger.info('parser_no_bundles', { moduleId: context.moduleId })
      return { success: true, itemsProcessed: 0, itemsFailed: 0, durationMs: Date.now() - startedAt }
    }

    for (const bundle of bundles) {
      try {
        // Load recent failure observations for evidence
        const { rows: observations } = await pool.query(
          `SELECT observation_id, payload, observed_at
           FROM silver.observation
           WHERE observation_id = ANY($1)
           ORDER BY observed_at DESC
           LIMIT 20`,
          [bundle.observation_ids],
        )

        // Analyze failure pattern
        const diagnosis = this.diagnoseParseFailure(bundle, observations)

        // Record the diagnosis as an agent action
        await pool.query(
          `INSERT INTO silver.agent_action
           (agent_id, module_id, action_type, description, status, requires_approval, result)
           VALUES ($1, $2, 'parse_diagnosis', $3, 'completed', FALSE, $4)`,
          [
            'parser-handler',
            bundle.module_id,
            `Diagnosed parse failure: ${diagnosis.summary}`,
            JSON.stringify(diagnosis),
          ],
        )

        // Mark the bundle as repair attempted with 'proposed' outcome
        await pool.query(
          `UPDATE silver.failure_bundle
           SET repair_attempted = TRUE, repair_outcome = 'proposed', updated_at = NOW()
           WHERE bundle_id = $1`,
          [bundle.bundle_id],
        )

        // Emit a diagnostic observation
        await this.emitObservation(pool, this.buildObservation(
          bundle.module_id,
          bundle.provider_id,
          'event',
          {
            eventType: 'parse_diagnosis',
            bundleId: bundle.bundle_id,
            diagnosis: diagnosis.summary,
            suggestedAction: diagnosis.suggestedAction,
          },
          { ingestionRunId: context.jobRunId },
        ))

        itemsProcessed++
      } catch (err) {
        itemsFailed++
        this.logger.error('parser_bundle_error', {
          bundleId: bundle.bundle_id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return {
      success: itemsFailed === 0,
      itemsProcessed,
      itemsFailed,
      durationMs: Date.now() - startedAt,
    }
  }

  /**
   * Analyzes failure patterns to diagnose the root cause of parse errors.
   */
  private diagnoseParseFailure(
    bundle: { error_message: string; error_type: string; dom_signature_hash: string | null; previous_dom_signature_hash: string | null },
    _observations: Array<{ observation_id: string; payload: unknown; observed_at: string }>,
  ): { summary: string; category: string; suggestedAction: string; confidence: string } {
    // DOM change detection
    if (bundle.dom_signature_hash && bundle.previous_dom_signature_hash
        && bundle.dom_signature_hash !== bundle.previous_dom_signature_hash) {
      return {
        summary: 'DOM structure changed — selector paths likely stale',
        category: 'dom_change',
        suggestedAction: 'regenerate_selectors',
        confidence: 'high',
      }
    }

    // Classify by error pattern
    if (bundle.error_type === 'TypeError' || bundle.error_message.includes('Cannot read properties')) {
      return {
        summary: 'Response structure changed — property access failed',
        category: 'schema_change',
        suggestedAction: 'update_response_mapping',
        confidence: 'high',
      }
    }

    if (bundle.error_message.includes('NaN') || bundle.error_message.includes('parse_error')) {
      return {
        summary: 'Numeric extraction failed — format or currency symbol change',
        category: 'format_change',
        suggestedAction: 'update_amount_parser',
        confidence: 'medium',
      }
    }

    return {
      summary: `Unknown parse failure: ${bundle.error_type}`,
      category: 'unknown',
      suggestedAction: 'manual_investigation',
      confidence: 'low',
    }
  }
}
