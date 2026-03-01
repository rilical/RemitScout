import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  AgentActionRow,
  FailureBundleRow,
  IAgentActionsRepository,
  SelfHealingMetricsRow,
} from '../interfaces/agent-actions-repository.interface'

export class AgentActionsRepository implements IAgentActionsRepository {
  constructor(private readonly pool: Pool) {}

  async getActions(input: {
    limit: number
    offset: number
    module_id?: string
    action_type?: string
  }): Promise<{ rows: AgentActionRow[]; total: number }> {
    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (input.module_id) {
      conditions.push(`module_id = $${idx++}`)
      params.push(input.module_id)
    }
    if (input.action_type) {
      conditions.push(`action_type = $${idx++}`)
      params.push(input.action_type)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM silver.agent_action ${where}`,
      params,
      this.pool,
    )

    const dataParams = [...params, input.limit, input.offset]
    const result = await query<AgentActionRow>(
      `SELECT action_id, action_type, agent_id, module_id,
              description, status, created_at, completed_at
         FROM silver.agent_action
         ${where}
        ORDER BY created_at DESC
        LIMIT $${idx++} OFFSET $${idx}`,
      dataParams,
      this.pool,
    )

    return {
      rows: result.rows,
      total: countResult.rows[0]?.total ?? 0,
    }
  }

  async getFailureBundles(input: {
    limit: number
    offset: number
    status?: string
    module_id?: string
  }): Promise<{ rows: FailureBundleRow[]; total: number }> {
    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (input.status) {
      conditions.push(`repair_outcome = $${idx++}`)
      params.push(input.status)
    }
    if (input.module_id) {
      conditions.push(`module_id = $${idx++}`)
      params.push(input.module_id)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM silver.failure_bundle ${where}`,
      params,
      this.pool,
    )

    const dataParams = [...params, input.limit, input.offset]
    const result = await query<FailureBundleRow>(
      `SELECT bundle_id, module_id, provider_id, category,
              error_message, severity, consecutive_failures,
              affected_corridors, created_at, repair_outcome,
              repair_pr_url
         FROM silver.failure_bundle
         ${where}
        ORDER BY created_at DESC
        LIMIT $${idx++} OFFSET $${idx}`,
      dataParams,
      this.pool,
    )

    return {
      rows: result.rows,
      total: countResult.rows[0]?.total ?? 0,
    }
  }

  async getMetrics(): Promise<SelfHealingMetricsRow> {
    const result = await query<SelfHealingMetricsRow>(
      `SELECT
         (SELECT AVG(EXTRACT(EPOCH FROM (created_at - first_failure_at)) / 60)
            FROM silver.failure_bundle
           WHERE first_failure_at IS NOT NULL
             AND created_at > NOW() - INTERVAL '7 days') AS mttd_minutes,
         (SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60)
            FROM silver.failure_bundle
           WHERE repair_outcome IN ('applied', 'rejected', 'failed')
             AND created_at > NOW() - INTERVAL '7 days') AS mttr_minutes,
         (SELECT CASE WHEN COUNT(*) = 0 THEN NULL
                      ELSE COUNT(*) FILTER (WHERE repair_outcome = 'applied')::float / COUNT(*)
                 END
            FROM silver.failure_bundle
           WHERE repair_outcome IS NOT NULL
             AND created_at > NOW() - INTERVAL '7 days') AS auto_heal_success_rate,
         (SELECT COUNT(*)::int FROM silver.failure_bundle WHERE repair_outcome = 'pending' OR (repair_attempted = FALSE AND repair_outcome IS NULL)) AS pending_bundles,
         (SELECT COUNT(*)::int FROM silver.failure_bundle WHERE repair_outcome = 'proposed') AS active_repairs,
         (SELECT COUNT(*)::int FROM silver.failure_bundle WHERE created_at > NOW() - INTERVAL '24 hours') AS total_bundles_24h,
         (SELECT COUNT(*)::int FROM silver.failure_bundle WHERE repair_outcome = 'applied' AND created_at > NOW() - INTERVAL '24 hours') AS successful_repairs_24h`,
      [],
      this.pool,
    )
    return result.rows[0] ?? {
      mttd_minutes: null,
      mttr_minutes: null,
      auto_heal_success_rate: null,
      pending_bundles: 0,
      active_repairs: 0,
      total_bundles_24h: 0,
      successful_repairs_24h: 0,
    }
  }
}
