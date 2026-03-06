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

export interface AdminDiscoveryScanSummary {
  id: number
  provider_id: string
  scan_type: string
  status: string
  corridors_discovered: number | null
  delivery_methods_discovered: number | null
  promotions_detected: number | null
  errors_count: number | null
  duration_ms: number | null
  triggered_by: string | null
  correlation_id: string | null
  review_status: string
  approved_by: string | null
  approved_at: string | null
  apply_status: string
  applied_at: string | null
  apply_errors_json: Array<Record<string, unknown>> | null
  started_at: string | null
  completed_at: string | null
  created_at: string | null
  diff_json?: Record<string, unknown> | null
}

export interface AdminDiscoveryScanDetail extends AdminDiscoveryScanSummary {
  result_json: Record<string, unknown> | null
  diff_json: Record<string, unknown> | null
  apply_result_json: Record<string, unknown> | null
}

export interface AdminDiscoveryCertificationRun {
  run_id: string
  environment: string
  status: string
  triggered_by: string
  requested_by: string | null
  catalog_count: number
  provider_count: number
  certified_count: number
  degraded_count: number
  blocked_count: number
  review_only: boolean
  notes: string | null
  created_at: string | null
  completed_at: string | null
}

export interface AdminDiscoveryCertificationResult {
  provider_id: string
  status: string
  evidence_confidence: string
  evidence_lane: string
  summary: string
  drift_reasons: string[]
  artifact_pointers_json: Array<Record<string, unknown>> | null
  evidence_json: Record<string, unknown> | null
  discovery_scan_id: number | null
  created_at: string | null
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
  await request<undefined>('/ops/stress/pause-probing', { method: 'POST', body: { paused } })
}

export async function applyStressOverride(corridorId: string, level: string, durationHours: number): Promise<void> {
  const { request } = useApi()
  await request<undefined>('/ops/stress/override', { method: 'POST', body: { corridorId, level, durationHours } })
}

export async function activateStressKillSwitch(): Promise<void> {
  const { request } = useApi()
  await request<undefined>('/ops/stress/kill-switch', { method: 'POST' })
}

export async function listDiscoveryScans(options?: {
  limit?: number
  providerId?: string
  status?: string
  reviewStatus?: string
  applyStatus?: string
}): Promise<{ scans: AdminDiscoveryScanSummary[] }> {
  const { request } = useApi()
  return await request<{ scans: AdminDiscoveryScanSummary[] }>('/admin/discovery/scans', { query: options })
}

export async function getDiscoveryScan(scanId: number): Promise<{ scan: AdminDiscoveryScanDetail }> {
  const { request } = useApi()
  return await request<{ scan: AdminDiscoveryScanDetail }>(`/admin/discovery/scans/${encodeURIComponent(String(scanId))}`)
}

export async function listPendingDiscoveryReviews(limit = 50): Promise<{ scans: AdminDiscoveryScanSummary[] }> {
  const { request } = useApi()
  return await request<{ scans: AdminDiscoveryScanSummary[] }>('/admin/discovery/pending-reviews', { query: { limit } })
}

export async function approveDiscoveryReview(scanId: number): Promise<{ approved: boolean; scan: AdminDiscoveryScanDetail }> {
  const { request } = useApi()
  return await request<{ approved: boolean; scan: AdminDiscoveryScanDetail }>(`/admin/discovery/scans/${encodeURIComponent(String(scanId))}/approve`, {
    method: 'POST',
    body: { mode: 'operator' },
  })
}

export async function applyDiscoveryReview(scanId: number): Promise<{
  applied: boolean
  idempotent: boolean
  result: Record<string, unknown> | null
  scan: AdminDiscoveryScanDetail
  errors: Array<Record<string, unknown>>
}> {
  const { request } = useApi()
  return await request<{
    applied: boolean
    idempotent: boolean
    result: Record<string, unknown> | null
    scan: AdminDiscoveryScanDetail
    errors: Array<Record<string, unknown>>
  }>(`/admin/discovery/scans/${encodeURIComponent(String(scanId))}/apply`, {
    method: 'POST',
  })
}

export async function dismissDiscoveryReview(scanId: number): Promise<{ dismissed: boolean; scan: AdminDiscoveryScanDetail }> {
  const { request } = useApi()
  return await request<{ dismissed: boolean; scan: AdminDiscoveryScanDetail }>(`/admin/discovery/scans/${encodeURIComponent(String(scanId))}/dismiss`, {
    method: 'POST',
  })
}

export async function listDiscoveryCertificationRuns(limit = 20): Promise<{ runs: AdminDiscoveryCertificationRun[] }> {
  const { request } = useApi()
  return await request<{ runs: AdminDiscoveryCertificationRun[] }>('/admin/discovery/certifications/runs', { query: { limit } })
}

export async function getDiscoveryCertificationRun(runId: string): Promise<{
  run: AdminDiscoveryCertificationRun & {
    artifact_manifest_json?: Record<string, unknown> | null
    error_json?: Record<string, unknown> | null
  }
  results: AdminDiscoveryCertificationResult[]
}> {
  const { request } = useApi()
  return await request<{
    run: AdminDiscoveryCertificationRun & {
      artifact_manifest_json?: Record<string, unknown> | null
      error_json?: Record<string, unknown> | null
    }
    results: AdminDiscoveryCertificationResult[]
  }>(`/admin/discovery/certifications/runs/${encodeURIComponent(runId)}`)
}

export async function triggerDiscoveryCertification(input?: {
  providerIds?: string[]
  planeABaseUrl?: string
  method?: 'bank' | 'cash' | 'wallet' | 'airtime' | 'home' | 'card'
  amount?: number
  windowHours?: number
  reviewOnly?: boolean
  notes?: string
}): Promise<AdminDiscoveryCertificationRun & { results: AdminDiscoveryCertificationResult[] }> {
  const { request } = useApi()
  return await request<AdminDiscoveryCertificationRun & { results: AdminDiscoveryCertificationResult[] }>('/admin/discovery/certifications/runs', {
    method: 'POST',
    body: input,
  })
}
