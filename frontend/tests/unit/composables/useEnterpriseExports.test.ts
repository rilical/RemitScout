// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRequest = vi.hoisted(() => vi.fn())
const limitsRef = vi.hoisted(() => ({
  value: {
    watchlistItems: 16 as number | 'unlimited',
    alerts: 16 as number | 'unlimited',
    historyDays: 90 as number | 'unlimited',
    exports: true,
    exportsMaxDays: 365 as number | 'unlimited',
  },
}))
const indicesExportsEnabledRef = vi.hoisted(() => ({ value: true }))

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    request: mockRequest,
  }),
}))

vi.mock('~/composables/useEntitlements', () => ({
  useEntitlements: () => ({
    limits: limitsRef,
    indicesExportsEnabled: indicesExportsEnabledRef,
  }),
}))

describe('useEnterpriseExports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    indicesExportsEnabledRef.value = true
    limitsRef.value.exportsMaxDays = 365
  })

  it('includes corridorIds when creating TEER / RCI / RVI exports', async () => {
    mockRequest
      .mockResolvedValueOnce({
        success: true,
        job: {
          id: 'job-1',
          status: 'queued',
          jobType: 'indices_csv',
          createdAt: '2026-03-05T00:00:00.000Z',
        },
      })
      .mockResolvedValueOnce({ success: true, jobs: [] })

    const { useEnterpriseExports } = await import('~/composables/useEnterpriseExports')
    const exportsApi = useEnterpriseExports()
    exportsApi.jobType.value = 'indices'
    exportsApi.format.value = 'csv'
    exportsApi.dateFrom.value = '2026-01-01'
    exportsApi.dateTo.value = '2026-01-31'
    exportsApi.corridorIdsText.value = 'US-PH-USD-PHP\nUS-MX-USD-MXN'

    await exportsApi.createJob()

    expect(mockRequest).toHaveBeenNthCalledWith(1, '/exports', {
      method: 'POST',
      body: {
        dataType: 'indices',
        format: 'csv',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        corridorIds: ['US-PH-USD-PHP', 'US-MX-USD-MXN'],
      },
    })
  })

  it('fails fast when indices exports are missing corridor IDs', async () => {
    const { useEnterpriseExports } = await import('~/composables/useEnterpriseExports')
    const exportsApi = useEnterpriseExports()
    exportsApi.jobType.value = 'indices'
    exportsApi.dateFrom.value = '2026-01-01'
    exportsApi.dateTo.value = '2026-01-31'
    exportsApi.corridorIdsText.value = '   '

    await exportsApi.createJob()

    expect(mockRequest).not.toHaveBeenCalled()
    expect(exportsApi.error.value).toBe(
      'Choose at least one country pair for TEER / RCI / RVI exports.',
    )
  })

  it('passes through parquet exports for enterprise jobs', async () => {
    mockRequest
      .mockResolvedValueOnce({
        success: true,
        job: {
          id: 'job-2',
          status: 'queued',
          jobType: 'history_parquet',
          createdAt: '2026-03-05T00:00:00.000Z',
        },
      })
      .mockResolvedValueOnce({ success: true, jobs: [] })

    const { useEnterpriseExports } = await import('~/composables/useEnterpriseExports')
    const exportsApi = useEnterpriseExports()
    exportsApi.jobType.value = 'history'
    exportsApi.format.value = 'parquet'
    exportsApi.dateFrom.value = '2026-01-01'
    exportsApi.dateTo.value = '2026-01-31'

    await exportsApi.createJob()

    expect(mockRequest).toHaveBeenNthCalledWith(1, '/exports', {
      method: 'POST',
      body: {
        dataType: 'history',
        format: 'parquet',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      },
    })
  })

  it('deduplicates corridor IDs before creating indices exports', async () => {
    mockRequest
      .mockResolvedValueOnce({
        success: true,
        job: {
          id: 'job-3',
          status: 'queued',
          jobType: 'indices_csv',
          createdAt: '2026-03-05T00:00:00.000Z',
        },
      })
      .mockResolvedValueOnce({ success: true, jobs: [] })

    const { useEnterpriseExports } = await import('~/composables/useEnterpriseExports')
    const exportsApi = useEnterpriseExports()
    exportsApi.jobType.value = 'indices'
    exportsApi.format.value = 'csv'
    exportsApi.dateFrom.value = '2026-01-01'
    exportsApi.dateTo.value = '2026-01-31'
    exportsApi.corridorIdsText.value = 'US-PH-USD-PHP\nUS-PH-USD-PHP,US-MX-USD-MXN'

    await exportsApi.createJob()

    expect(mockRequest).toHaveBeenNthCalledWith(1, '/exports', {
      method: 'POST',
      body: {
        dataType: 'indices',
        format: 'csv',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        corridorIds: ['US-PH-USD-PHP', 'US-MX-USD-MXN'],
      },
    })
  })
})
