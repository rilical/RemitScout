import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

const mockApproveDiscoveryReview = vi.hoisted(() => vi.fn())
const mockApplyDiscoveryReview = vi.hoisted(() => vi.fn())
const mockDismissDiscoveryReview = vi.hoisted(() => vi.fn())
const mockGetDiscoveryCertificationRun = vi.hoisted(() => vi.fn())
const mockGetDiscoveryScan = vi.hoisted(() => vi.fn())
const mockListDiscoveryCertificationRuns = vi.hoisted(() => vi.fn())
const mockListDiscoveryScans = vi.hoisted(() => vi.fn())
const mockListPendingDiscoveryReviews = vi.hoisted(() => vi.fn())
const mockTriggerDiscoveryCertification = vi.hoisted(() => vi.fn())

vi.mock('~/lib/opsApi', () => ({
  approveDiscoveryReview: (...args: unknown[]) => mockApproveDiscoveryReview(...args),
  applyDiscoveryReview: (...args: unknown[]) => mockApplyDiscoveryReview(...args),
  dismissDiscoveryReview: (...args: unknown[]) => mockDismissDiscoveryReview(...args),
  getDiscoveryCertificationRun: (...args: unknown[]) => mockGetDiscoveryCertificationRun(...args),
  getDiscoveryScan: (...args: unknown[]) => mockGetDiscoveryScan(...args),
  listDiscoveryCertificationRuns: (...args: unknown[]) =>
    mockListDiscoveryCertificationRuns(...args),
  listDiscoveryScans: (...args: unknown[]) => mockListDiscoveryScans(...args),
  listPendingDiscoveryReviews: (...args: unknown[]) => mockListPendingDiscoveryReviews(...args),
  triggerDiscoveryCertification: (...args: unknown[]) => mockTriggerDiscoveryCertification(...args),
}))

const mountDiscoveryPage = async () => {
  const DiscoveryPage = (await import('~/pages/admin/discovery.vue')).default
  return mount(DiscoveryPage, {
    global: {
      stubs: {
        AdminPageShell: {
          props: ['title', 'subtitle', 'loading', 'error', 'meta'],
          template: '<div><div v-if="error">{{ error }}</div><slot /><slot name="actions" /></div>',
        },
      },
    },
  })
}

describe('admin discovery page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const scanSummary = {
      id: 42,
      provider_id: 'remitly',
      scan_type: 'full',
      status: 'completed',
      corridors_discovered: 3,
      delivery_methods_discovered: 2,
      promotions_detected: 1,
      errors_count: 0,
      duration_ms: 2100,
      triggered_by: 'manual',
      correlation_id: 'corr-1',
      review_status: 'pending_review',
      approved_by: null,
      approved_at: null,
      apply_status: 'not_requested',
      applied_at: null,
      apply_errors_json: null,
      started_at: '2026-03-07T09:00:00.000Z',
      completed_at: '2026-03-07T09:01:00.000Z',
      created_at: '2026-03-07T09:00:00.000Z',
    }

    mockListPendingDiscoveryReviews.mockRejectedValue(
      new Error('Pending review queue is unavailable right now.'),
    )
    mockListDiscoveryScans.mockResolvedValue({ scans: [scanSummary] })
    mockListDiscoveryCertificationRuns.mockResolvedValue({
      runs: [
        {
          run_id: 'cert-run-1',
          environment: 'staging',
          status: 'partial',
          triggered_by: 'manual',
          requested_by: 'ops@remit-scout.com',
          catalog_count: 24,
          provider_count: 24,
          certified_count: 20,
          degraded_count: 3,
          blocked_count: 1,
          review_only: true,
          notes: null,
          created_at: '2026-03-07T10:00:00.000Z',
          completed_at: '2026-03-07T10:05:00.000Z',
        },
      ],
    })
    mockGetDiscoveryScan.mockResolvedValue({
      scan: {
        ...scanSummary,
        diff_json: { providerId: 'remitly' },
        result_json: { providerId: 'remitly', corridors: ['US-AL'] },
        apply_result_json: null,
      },
    })
    mockGetDiscoveryCertificationRun.mockResolvedValue({
      run: {
        run_id: 'cert-run-1',
        environment: 'staging',
        status: 'partial',
        triggered_by: 'manual',
        requested_by: 'ops@remit-scout.com',
        catalog_count: 24,
        provider_count: 24,
        certified_count: 20,
        degraded_count: 3,
        blocked_count: 1,
        review_only: true,
        notes: null,
        created_at: '2026-03-07T10:00:00.000Z',
        completed_at: '2026-03-07T10:05:00.000Z',
      },
      results: [
        {
          provider_id: 'remitly',
          status: 'degraded',
          evidence_confidence: 'hybrid',
          evidence_lane: 'hybrid',
          summary: 'drift detected',
          drift_reasons: ['static_fallback_only'],
          artifact_pointers_json: null,
          evidence_json: null,
          discovery_scan_id: 42,
          created_at: '2026-03-07T10:05:00.000Z',
        },
      ],
    })
    mockApproveDiscoveryReview.mockResolvedValue({ approved: true, scan: null })
    mockApplyDiscoveryReview.mockResolvedValue({
      applied: true,
      idempotent: false,
      result: null,
      scan: null,
      errors: [],
    })
    mockDismissDiscoveryReview.mockResolvedValue({ dismissed: true, scan: null })
    mockTriggerDiscoveryCertification.mockResolvedValue({
      run_id: 'cert-run-1',
      status: 'partial',
      results: [],
    })

    vi.stubGlobal('definePageMeta', vi.fn())
    vi.stubGlobal('useAdminPage', vi.fn())
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('reactive', reactive)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('watch', watch)
    vi.stubGlobal('onMounted', onMounted)
    vi.stubGlobal('onUnmounted', onUnmounted)
    vi.stubGlobal('useAdminFormat', () => ({
      formatDateTime: (value: string | null) => value || '—',
      formatDuration: (value: number | null | undefined) => (value == null ? '—' : `${value}s`),
      formatNumber: (value: number | null | undefined) => (value == null ? '—' : String(value)),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the control plane visible when one dataset fails to load', async () => {
    const wrapper = await mountDiscoveryPage()

    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain('Pending review queue is unavailable right now.')
    expect(wrapper.text()).not.toContain('Failed to load provider control plane.')
    expect(wrapper.text()).toContain('Operator brief')
    expect(wrapper.text()).toContain('cert-run-1')
    expect(wrapper.text()).toContain('remitly')
  })
})
