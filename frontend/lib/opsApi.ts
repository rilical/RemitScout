import { useApi } from '~/composables/useApi'
import type { ModuleRegistryResponse, ModuleDetailResponse } from '~/types/modules'
import type { AgentActionsResponse, FailureBundlesResponse, FailureTrendsResponse, SelfHealingMetrics } from '~/types/agents'
import type { CorridorStressOverviewResponse } from '~/types/stress'
import type { TotalCollectionErrorResponse, MttdMttrResponse, CorrectionLedgerResponse } from '~/types/data-quality'

export interface ServiceHealthEntry {
  service_id: string
  display_name: string
  status: 'healthy' | 'degraded' | 'offline' | 'unknown'
  last_active_at: string | null
  message: string | null
}

export interface ServiceHealthResponse {
  services: ServiceHealthEntry[]
  updatedAt: string | null
  unavailable?: boolean
}

export async function getServiceHealth(): Promise<ServiceHealthResponse> {
  const { request } = useApi()
  try {
    return await request<ServiceHealthResponse>('/ops/services/health')
  }
  catch (e: unknown) {
    const err = e as { statusCode?: number }
    if (err?.statusCode === 404) {
      return { services: [], updatedAt: null, unavailable: true }
    }
    throw e
  }
}

export async function getModuleHealth(): Promise<ModuleRegistryResponse> {
  const { request } = useApi()
  return await request<ModuleRegistryResponse>('/ops/modules/health')
}

export async function getModuleDetail(moduleId: string): Promise<ModuleDetailResponse> {
  const { request } = useApi()
  return await request<ModuleDetailResponse>(`/ops/modules/${encodeURIComponent(moduleId)}`)
}

export async function getAgentActions(options?: {
  limit?: number
  offset?: number
  module_id?: string
  action_type?: string
}): Promise<AgentActionsResponse> {
  const { request } = useApi()
  return await request<AgentActionsResponse>('/ops/agents/actions', { query: options })
}

export async function getFailureBundles(options?: {
  limit?: number
  offset?: number
  status?: string
  module_id?: string
}): Promise<FailureBundlesResponse> {
  const { request } = useApi()
  return await request<FailureBundlesResponse>('/ops/agents/failure-bundles', { query: options })
}

export async function getSelfHealingMetrics(): Promise<SelfHealingMetrics> {
  const { request } = useApi()
  return await request<SelfHealingMetrics>('/ops/agents/metrics')
}

export async function getFailureTrends(params?: { days?: number }): Promise<FailureTrendsResponse> {
  const { request } = useApi()
  return await request<FailureTrendsResponse>('/ops/agents/failure-trends', { query: params })
}

export async function getCorridorStressOverview(): Promise<CorridorStressOverviewResponse> {
  const { request } = useApi()
  return await request<CorridorStressOverviewResponse>('/ops/stress/corridors')
}

export async function getTotalCollectionError(): Promise<TotalCollectionErrorResponse> {
  const { request } = useApi()
  return await request<TotalCollectionErrorResponse>('/ops/quality/tce')
}

export async function getMttdMttr(): Promise<MttdMttrResponse> {
  const { request } = useApi()
  return await request<MttdMttrResponse>('/ops/quality/mttd-mttr')
}

export async function getCorrectionLedger(options?: {
  limit?: number
  offset?: number
  corridor_id?: string
  field_name?: string
}): Promise<CorrectionLedgerResponse> {
  const { request } = useApi()
  return await request<CorrectionLedgerResponse>('/ops/gold/corrections', { query: options })
}

export async function pauseAdaptiveProbing(paused: boolean): Promise<void> {
  const { request } = useApi()
  await request<void>('/ops/stress/pause-probing', { method: 'POST', body: { paused } })
}

export async function applyStressOverride(corridorId: string, level: string, durationHours: number): Promise<void> {
  const { request } = useApi()
  await request<void>('/ops/stress/override', { method: 'POST', body: { corridorId, level, durationHours } })
}

export async function activateStressKillSwitch(): Promise<void> {
  const { request } = useApi()
  await request<void>('/ops/stress/kill-switch', { method: 'POST' })
}
