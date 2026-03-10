import type { Pool } from 'pg'
import type { JobContext, JobResult } from '../../../shared/types/job'
import type { FailureBundle, FailureCategory } from '../../../shared/types/failure-bundle'
import { BaseJobHandler } from './base-job-handler'
import { PatchProposer, type PatchProposal } from '../agents/patch-proposer'
import { PatchValidator } from '../agents/patch-validator'
import { PatchDeployer } from '../agents/patch-deployer'

const PATCH_CATEGORIES: FailureCategory[] = ['parse', 'dom_change', 'data_integrity']

type BundleRow = {
  bundle_id: string
  module_id: string
  provider_id: string
  collector_type: string
  category: FailureCategory
  severity: string
  error_message: string
  error_type: string
  dom_signature_hash: string | null
  previous_dom_signature_hash: string | null
  affected_corridors: string[]
  observation_ids: string[]
  consecutive_failures: number
  first_failure_at: string
  last_failure_at: string
  created_at: string
  http_statuses: number[]
  quality_flags: string[]
  fetcher_source: string
  failure_layer: string
}

type Diagnosis = {
  summary: string
  category: string
  suggestedAction: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Patch pipeline handler — two-tier repair strategy.
 *
 * Tier 1 (fast path): rule-based diagnosis for `parse` bundles.
 * Tier 2 (LLM escalation): PatchProposer -> PatchValidator -> PatchDeployer
 * for `dom_change`, `data_integrity`, or low-confidence parse diagnoses.
 */
export class PatchPipelineHandler extends BaseJobHandler {
  readonly handlerType = 'patch-pipeline'

  constructor() {
    super('plane-b.handlers.patch-pipeline')
  }

  protected async run(context: JobContext): Promise<JobResult> {
    const pool = context.pool as Pool
    const startedAt = Date.now()
    let itemsProcessed = 0
    let itemsFailed = 0

    const { rows: bundles } = await pool.query<BundleRow>(
      `SELECT bundle_id, module_id, provider_id, collector_type, category, severity,
              error_message, error_type, dom_signature_hash, previous_dom_signature_hash,
              affected_corridors, observation_ids, consecutive_failures,
              first_failure_at, last_failure_at, created_at,
              http_statuses, quality_flags, fetcher_source, failure_layer
       FROM silver.failure_bundle
       WHERE module_id = $1 AND category = ANY($2) AND repair_attempted = FALSE
       ORDER BY created_at DESC
       LIMIT 10`,
      [context.moduleId, PATCH_CATEGORIES],
    )

    if (bundles.length === 0) {
      this.logger.info('patch_pipeline_no_bundles', { moduleId: context.moduleId })
      return { success: true, itemsProcessed: 0, itemsFailed: 0, durationMs: Date.now() - startedAt }
    }

    const proposer = new PatchProposer(pool)
    const validator = new PatchValidator(pool)
    const deployer = new PatchDeployer(pool)

    for (const row of bundles) {
      try {
        const bundle = this.rowToBundle(row)

        if (row.category === 'parse') {
          const diagnosis = await this.fastPathDiagnosis(pool, row, context.jobRunId)
          if (diagnosis.confidence !== 'low' && diagnosis.suggestedAction !== 'manual_investigation') {
            itemsProcessed++
            continue
          }
        }

        const proposal = await proposer.propose(bundle)
        if (!proposal) {
          await this.recordAction(pool, row.module_id, 'patch_pipeline_no_proposal', `No proposal generated for ${row.category} bundle`, row.bundle_id)
          await this.markBundleAttempted(pool, row.bundle_id, 'rejected')
          itemsProcessed++
          continue
        }

        const validation = await validator.validate(proposal)
        await this.recordAction(pool, row.module_id, 'patch_pipeline_validated', `Validation ${validation.valid ? 'passed' : 'failed'}: ${validation.summary}`, row.bundle_id)

        if (!validation.valid) {
          await this.markBundleAttempted(pool, row.bundle_id, 'rejected')
          itemsProcessed++
          continue
        }

        const deployResult = await deployer.deploy(proposal, validation)
        const outcome = deployResult.deployed ? 'proposed' : 'rejected'
        await this.markBundleAttempted(pool, row.bundle_id, outcome, deployResult.prUrl)
        await this.recordAction(pool, row.module_id, 'patch_pipeline_deployed', `Deploy ${deployResult.method}: ${deployResult.reason}`, row.bundle_id)

        await this.emitObservation(pool, this.buildObservation(
          row.module_id,
          row.provider_id,
          'event',
          {
            eventType: 'patch_pipeline_complete',
            bundleId: row.bundle_id,
            category: row.category,
            deployMethod: deployResult.method,
            deployed: deployResult.deployed,
            prUrl: deployResult.prUrl,
          },
          { ingestionRunId: context.jobRunId },
        ))

        itemsProcessed++
      } catch (err) {
        itemsFailed++
        this.logger.error('patch_pipeline_bundle_error', {
          bundleId: row.bundle_id,
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
   * Tier 1: rule-based diagnosis for parse bundles. Records result and marks
   * the bundle as repair-attempted if the diagnosis is confident enough.
   */
  private async fastPathDiagnosis(
    pool: Pool,
    row: BundleRow,
    jobRunId: string,
  ): Promise<Diagnosis> {
    const { rows: observations } = await pool.query(
      `SELECT observation_id, payload, observed_at
       FROM silver.observation
       WHERE observation_id = ANY($1)
       ORDER BY observed_at DESC
       LIMIT 20`,
      [row.observation_ids],
    )

    const diagnosis = this.diagnoseParseFailure(row, observations)

    await this.recordAction(pool, row.module_id, 'parse_diagnosis', `Diagnosed parse failure: ${diagnosis.summary}`, row.bundle_id)
    await this.markBundleAttempted(pool, row.bundle_id, 'proposed')

    await this.emitObservation(pool, this.buildObservation(
      row.module_id,
      row.provider_id,
      'event',
      {
        eventType: 'parse_diagnosis',
        bundleId: row.bundle_id,
        diagnosis: diagnosis.summary,
        suggestedAction: diagnosis.suggestedAction,
      },
      { ingestionRunId: jobRunId },
    ))

    return diagnosis
  }

  private diagnoseParseFailure(
    bundle: Pick<BundleRow, 'error_message' | 'error_type' | 'dom_signature_hash' | 'previous_dom_signature_hash'>,
    _observations: Array<{ observation_id: string; payload: unknown; observed_at: string }>,
  ): Diagnosis {
    if (bundle.dom_signature_hash && bundle.previous_dom_signature_hash
        && bundle.dom_signature_hash !== bundle.previous_dom_signature_hash) {
      return { summary: 'DOM structure changed — selector paths likely stale', category: 'dom_change', suggestedAction: 'regenerate_selectors', confidence: 'high' }
    }

    if (bundle.error_type === 'TypeError' || bundle.error_message.includes('Cannot read properties')) {
      return { summary: 'Response structure changed — property access failed', category: 'schema_change', suggestedAction: 'update_response_mapping', confidence: 'high' }
    }

    if (bundle.error_message.includes('NaN') || bundle.error_message.includes('parse_error')) {
      return { summary: 'Numeric extraction failed — format or currency symbol change', category: 'format_change', suggestedAction: 'update_amount_parser', confidence: 'medium' }
    }

    return { summary: `Unknown parse failure: ${bundle.error_type}`, category: 'unknown', suggestedAction: 'manual_investigation', confidence: 'low' }
  }

  private rowToBundle(row: BundleRow): FailureBundle {
    return {
      bundleId: row.bundle_id,
      moduleId: row.module_id,
      providerId: row.provider_id,
      collectorType: row.collector_type,
      severity: row.severity as FailureBundle['severity'],
      category: row.category,
      consecutiveFailures: row.consecutive_failures,
      firstFailureAt: row.first_failure_at,
      lastFailureAt: row.last_failure_at,
      createdAt: row.created_at,
      errorMessage: row.error_message,
      errorType: row.error_type,
      httpStatuses: row.http_statuses ?? [],
      affectedCorridors: row.affected_corridors ?? [],
      domSignatureHash: row.dom_signature_hash,
      previousDomSignatureHash: row.previous_dom_signature_hash,
      observationIds: row.observation_ids ?? [],
      qualityFlags: row.quality_flags ?? [],
      repairAttempted: false,
      repairOutcome: null,
      repairPrUrl: null,
      fetcherSource: (row.fetcher_source as FailureBundle['fetcherSource']) ?? 'unknown',
      failureLayer: (row.failure_layer as FailureBundle['failureLayer']) ?? 'parse',
    }
  }

  private async recordAction(
    pool: Pool,
    moduleId: string,
    actionType: string,
    description: string,
    bundleId: string,
  ): Promise<void> {
    await pool.query(
      `INSERT INTO silver.agent_action
       (agent_id, module_id, action_type, description, status, requires_approval, result)
       VALUES ($1, $2, $3, $4, 'completed', FALSE, $5)`,
      ['patch-pipeline', moduleId, actionType, description, JSON.stringify({ bundleId })],
    )
  }

  private async markBundleAttempted(
    pool: Pool,
    bundleId: string,
    outcome: string,
    prUrl: string | null = null,
  ): Promise<void> {
    await pool.query(
      `UPDATE silver.failure_bundle
       SET repair_attempted = TRUE, repair_outcome = $2, repair_pr_url = $3, updated_at = NOW()
       WHERE bundle_id = $1`,
      [bundleId, outcome, prUrl],
    )
  }
}
