export type AgentActionRow = {
  action_id: string
  action_type: string
  agent_id: string
  module_id: string | null
  description: string
  status: string
  created_at: Date
  completed_at: Date | null
}

export type FailureBundleRow = {
  bundle_id: string
  module_id: string
  provider_id: string
  category: string
  error_message: string
  severity: string
  consecutive_failures: number
  affected_corridors: string[]
  created_at: Date
  repair_outcome: string | null
  repair_pr_url: string | null
}

export type SelfHealingMetricsRow = {
  mttd_minutes: number | null
  mttr_minutes: number | null
  auto_heal_success_rate: number | null
  pending_bundles: number
  active_repairs: number
  total_bundles_24h: number
  successful_repairs_24h: number
}

export interface IAgentActionsRepository {
  getActions(input: { limit: number; offset: number; module_id?: string; action_type?: string }): Promise<{ rows: AgentActionRow[]; total: number }>
  getFailureBundles(input: { limit: number; offset: number; status?: string; module_id?: string }): Promise<{ rows: FailureBundleRow[]; total: number }>
  getMetrics(): Promise<SelfHealingMetricsRow>
}
