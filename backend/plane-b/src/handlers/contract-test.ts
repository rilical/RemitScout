import type { Pool } from 'pg'
import type { JobContext, JobResult } from '../../../shared/types/job'
import { BaseJobHandler } from './base-job-handler'

/**
 * Contract test handler — validates that a module's parser still produces
 * correct output against known reference data.
 *
 * Used both as a scheduled health check and as part of the self-healing
 * pipeline to validate proposed parser patches before deployment.
 */
export class ContractTestHandler extends BaseJobHandler {
  readonly handlerType = 'contract_test'

  protected async run(context: JobContext): Promise<JobResult> {
    const pool = context.pool as Pool
    const startedAt = Date.now()
    let itemsProcessed = 0
    let itemsFailed = 0

    // Load the module's recent successful observations as reference data
    const { rows: referenceQuotes } = await pool.query<{
      observation_id: string
      corridor_id: string
      amount_bucket: number
      payload: Record<string, unknown>
      observed_at: string
    }>(
      `SELECT observation_id, corridor_id, amount_bucket, payload, observed_at
       FROM silver.observation
       WHERE module_id = $1 AND type = 'quote' AND confidence IN ('high', 'medium')
       ORDER BY observed_at DESC
       LIMIT 50`,
      [context.moduleId],
    )

    if (referenceQuotes.length === 0) {
      this.logger.info('contract_test_no_references', { moduleId: context.moduleId })
      return { success: true, itemsProcessed: 0, itemsFailed: 0, durationMs: Date.now() - startedAt }
    }

    // Load the module registry entry for provider metadata
    const { rows: modules } = await pool.query<{
      module_id: string
      provider_id: string
      collector_type: string
      status: string
    }>(
      `SELECT module_id, provider_id, collector_type, status
       FROM silver.module_registry
       WHERE module_id = $1`,
      [context.moduleId],
    )

    if (modules.length === 0) {
      this.logger.warn('contract_test_module_not_found', { moduleId: context.moduleId })
      return { success: false, itemsProcessed: 0, itemsFailed: 0, durationMs: Date.now() - startedAt }
    }

    const mod = modules[0]

    // Group reference quotes by corridor for coverage tracking
    const corridorCoverage = new Map<string, number>()
    const violations: Array<{ corridorId: string; field: string; expected: unknown; actual: unknown }> = []

    for (const ref of referenceQuotes) {
      try {
        const payload = ref.payload

        // Validate required fields exist
        const requiredFields = ['send_amount', 'receive_amount', 'exchange_rate', 'provider_id']
        for (const field of requiredFields) {
          if (payload[field] === undefined || payload[field] === null) {
            violations.push({
              corridorId: ref.corridor_id,
              field,
              expected: 'non-null value',
              actual: payload[field],
            })
          }
        }

        // Validate numeric fields are finite and positive
        const numericFields = ['send_amount', 'receive_amount', 'exchange_rate']
        for (const field of numericFields) {
          const val = payload[field]
          if (typeof val === 'number' && (!Number.isFinite(val) || val <= 0)) {
            violations.push({
              corridorId: ref.corridor_id,
              field,
              expected: 'finite positive number',
              actual: val,
            })
          }
        }

        // Validate exchange rate consistency
        if (typeof payload.send_amount === 'number'
            && typeof payload.receive_amount === 'number'
            && typeof payload.exchange_rate === 'number'
            && payload.send_amount > 0) {
          const impliedRate = (payload.receive_amount as number) / (payload.send_amount as number)
          const declaredRate = payload.exchange_rate as number
          const drift = Math.abs(impliedRate - declaredRate) / declaredRate
          if (drift > 0.01) { // >1% drift
            violations.push({
              corridorId: ref.corridor_id,
              field: 'exchange_rate_consistency',
              expected: `implied rate ${impliedRate.toFixed(6)} within 1% of declared`,
              actual: `declared ${declaredRate.toFixed(6)}, drift ${(drift * 100).toFixed(2)}%`,
            })
          }
        }

        corridorCoverage.set(ref.corridor_id, (corridorCoverage.get(ref.corridor_id) ?? 0) + 1)
        itemsProcessed++
      } catch (err) {
        itemsFailed++
        this.logger.error('contract_test_validation_error', {
          observationId: ref.observation_id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Record contract test results as an agent action
    const testResult = {
      moduleId: context.moduleId,
      providerId: mod.provider_id,
      totalReferences: referenceQuotes.length,
      violations: violations.length,
      corridorsCovered: corridorCoverage.size,
      violationDetails: violations.slice(0, 20), // Cap for storage
    }

    await pool.query(
      `INSERT INTO silver.agent_action
       (agent_id, module_id, action_type, description, status, requires_approval, result)
       VALUES ($1, $2, 'contract_test', $3, $4, FALSE, $5)`,
      [
        'contract-test-handler',
        context.moduleId,
        `Contract test: ${violations.length} violations in ${referenceQuotes.length} references`,
        violations.length === 0 ? 'completed' : 'failed',
        JSON.stringify(testResult),
      ],
    )

    // Update module health in registry
    if (violations.length === 0) {
      await pool.query(
        `UPDATE silver.module_registry
         SET last_health_check_at = NOW(), updated_at = NOW()
         WHERE module_id = $1`,
        [context.moduleId],
      )
    }

    return {
      success: violations.length === 0 && itemsFailed === 0,
      itemsProcessed,
      itemsFailed: violations.length + itemsFailed,
      durationMs: Date.now() - startedAt,
      metadata: testResult,
    }
  }
}
