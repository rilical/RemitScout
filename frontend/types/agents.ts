export type AgentActionStatus = 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'rejected'

export type RepairOutcome = 'pending' | 'proposed' | 'applied' | 'rejected' | 'failed'

export interface AgentActionEntry {
  action_id: string
  action_type: string
  agent_id: string
  module_id: string | null
  description: string
  status: AgentActionStatus
  created_at: string
  completed_at: string | null
}

export interface AgentActionsResponse {
  actions: AgentActionEntry[]
  total: number
  limit: number
  offset: number
}

export interface FailureBundleSummary {
  bundle_id: string
  module_id: string
  provider_id: string
  category: string
  error_message: string
  severity: string
  consecutive_failures: number
  affected_corridors: string[]
  created_at: string
  repair_outcome: RepairOutcome | null
  repair_pr_url: string | null
}

export interface FailureBundlesResponse {
  bundles: FailureBundleSummary[]
  total: number
  limit: number
  offset: number
}

export interface SelfHealingMetrics {
  mttd_minutes: number | null
  mttr_minutes: number | null
  auto_heal_success_rate: number | null
  pending_bundles: number
  active_repairs: number
  total_bundles_24h: number
  successful_repairs_24h: number
  period: string
}

export interface FailureTrendPoint {
  date: string
  total_bundles: number
  applied: number
  failed: number
  pending: number
}

export interface FailureTrendsResponse {
  points: FailureTrendPoint[]
  period: string
}
