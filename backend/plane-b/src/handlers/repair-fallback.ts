import type { Pool } from 'pg'
import type { JobContext, JobResult } from '../../../shared/types/job'
import { BaseJobHandler } from './base-job-handler'

const toTrimmedString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : ''

export class RepairFallbackHandler extends BaseJobHandler {
  readonly handlerType = 'repair_fallback'

  constructor() {
    super('plane-b.handlers.repair-fallback')
  }

  protected async run(context: JobContext): Promise<JobResult> {
    const pool = context.pool as Pool
    const startedAt = Date.now()
    const bundleId = toTrimmedString(context.params.bundleId)
    const category = toTrimmedString(context.params.category) || 'unknown'
    const severity = toTrimmedString(context.params.severity) || 'degraded'
    const providerId = toTrimmedString(context.params.providerId)
    const route = toTrimmedString(context.params.route)
    const fetcherSource = toTrimmedString(context.params.fetcherSource)
    const failureLayer = toTrimmedString(context.params.failureLayer)
    const consecutiveFailures = Number(context.params.consecutiveFailures || 0)

    const result = {
      bundleId,
      moduleId: context.moduleId,
      providerId,
      route,
      category,
      severity,
      fetcherSource,
      failureLayer,
      consecutiveFailures,
      escalation: 'manual_investigation',
    }

    await pool.query(
      `INSERT INTO silver.agent_action
       (agent_id, module_id, action_type, description, status, requires_approval, result)
       VALUES ($1, $2, 'manual_investigation', $3, 'pending', TRUE, $4)`,
      [
        'repair-fallback-handler',
        context.moduleId,
        `Manual investigation required for ${category} failure on ${providerId || context.moduleId}`,
        JSON.stringify(result),
      ],
    )

    if (bundleId) {
      await pool.query(
        `UPDATE silver.failure_bundle
         SET repair_attempted = TRUE, repair_outcome = 'rejected', updated_at = NOW()
         WHERE bundle_id = $1`,
        [bundleId],
      )
    }

    return {
      success: true,
      itemsProcessed: 1,
      itemsFailed: 0,
      durationMs: Date.now() - startedAt,
      metadata: result,
    }
  }
}
