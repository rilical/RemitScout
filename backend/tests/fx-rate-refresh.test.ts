import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { FxRateRefreshStatus } from '../plane-b/src/repositories/types/fx-rate-refresh-status'

const mockReceiveMessages = vi.fn()
const mockDeleteMessages = vi.fn()
const mockSendToDLQ = vi.fn()
const mockGetQueueDepth = vi.fn().mockResolvedValue(0)
const mockFetchRate = vi.fn()
const mockRecordWorkerMetric = vi.fn()

const mockFxRepo = {
  markRequestStatus: vi.fn(),
  markRequestFailed: vi.fn(),
  markRequestClaimed: vi.fn(),
  claimPendingRequests: vi.fn(),
  claimRequestById: vi.fn(),
  getQueueDepth: vi.fn().mockResolvedValue(0),
}

vi.mock('../shared/db', () => ({
  createPool: vi.fn().mockReturnValue({ end: vi.fn().mockResolvedValue(undefined) }),
  query: vi.fn().mockResolvedValue({ rows: [] }),
}))

vi.mock('../shared/sqs', () => ({
  receiveJsonMessages: (...args: any[]) => mockReceiveMessages(...args),
  deleteMessages: (...args: any[]) => mockDeleteMessages(...args),
  sendToDLQ: (...args: any[]) => mockSendToDLQ(...args),
  getQueueDepth: (...args: any[]) => mockGetQueueDepth(...args),
}))

vi.mock('../shared/worker-metrics', () => ({
  recordWorkerMetric: (...args: any[]) => mockRecordWorkerMetric(...args),
}))

vi.mock('../shared/oanda-rate-fetcher', () => ({
  OandaRateFetcher: vi.fn().mockImplementation(() => ({
    fetchRate: (...args: any[]) => mockFetchRate(...args),
  })),
}))

vi.mock('../plane-b/src/repositories', () => ({
  FxRateRefreshRepository: vi.fn().mockImplementation(() => mockFxRepo),
}))

const loadModule = async (
  queueMode: 'queue' | 'shadow' | 'off',
  queueUrl = 'https://queue',
  stalenessEnabled = false,
  staleWindowMs = 1800000,
) => {
  vi.resetModules()
  vi.doMock('../shared/config', () => ({
    config: {
      db: { planeBUrl: 'postgres://localhost/test' },
      queues: {
        fxRateRefreshMode: queueMode,
        fxRateRefreshUrl: queueUrl,
        fxRateRefreshDlqUrl: 'https://dlq',
        fxRateRefreshDbFallback: false,
      },
      queueStaleness: {
        enforcementEnabled: stalenessEnabled,
        staleWindowFxRateRefreshMs: staleWindowMs,
        resumeGraceMs: 0,
      },
      fxRates: { dbFreshnessHours: 1 },
    },
  }))

  return await import('../plane-b/src/fx-rate-refresh')
}

describe('fx-rate-refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchRate.mockResolvedValue({ success: true, data: { rate: 1.1 } })
    mockFxRepo.claimRequestById.mockResolvedValue(null)
  })

  it('sends invalid SQS payloads to DLQ and deletes messages', async () => {
    const { processFxRateRefreshQueue } = await loadModule('queue')

    mockReceiveMessages.mockResolvedValue({
      messages: [
        {
          messageId: 'msg-1',
          receiptHandle: 'rh-1',
          payload: null,
          attributes: { ApproximateReceiveCount: '1' },
        },
      ],
    })
    mockDeleteMessages.mockResolvedValue({ succeeded: ['rh-1'], failed: [] })

    await processFxRateRefreshQueue({ pool: {} as Pool })

    expect(mockSendToDLQ).toHaveBeenCalledTimes(1)
    expect(mockDeleteMessages).toHaveBeenCalledWith('https://queue', ['rh-1'])
  })

  it('sends max-retry items to DLQ', async () => {
    const { processFxRateRefreshQueue } = await loadModule('queue')

    mockReceiveMessages.mockResolvedValue({
      messages: [
        {
          messageId: 'msg-2',
          receiptHandle: 'rh-2',
          payload: {
            requestId: 'req-2',
            baseCurrency: 'USD',
            quoteCurrency: 'EUR',
          },
          attributes: { ApproximateReceiveCount: '4' },
        },
      ],
    })
    mockDeleteMessages.mockResolvedValue({ succeeded: ['rh-2'], failed: [] })

    await processFxRateRefreshQueue({ pool: {} as Pool })

    expect(mockSendToDLQ).toHaveBeenCalledTimes(1)
    expect(mockDeleteMessages).toHaveBeenCalledWith('https://queue', ['rh-2'])
  })

  it('drops stale envelope messages and marks requests as skipped', async () => {
    const { processFxRateRefreshQueue } = await loadModule('queue', 'https://queue', true, 1000)

    mockFxRepo.claimRequestById.mockResolvedValue({
      request_id: 'req-stale',
      base_currency: 'USD',
      quote_currency: 'EUR',
      retry_count: 0,
    })

    mockReceiveMessages.mockResolvedValue({
      messages: [
        {
          messageId: 'msg-stale',
          receiptHandle: 'rh-stale',
          payload: {
            envelopeVersion: 1,
            queueClass: 'fx-rate-refresh',
            producedAtIso: new Date(Date.now() - 60_000).toISOString(),
            payload: {
              requestId: 'req-stale',
              baseCurrency: 'USD',
              quoteCurrency: 'EUR',
            },
          },
          attributes: { ApproximateReceiveCount: '1', SentTimestamp: String(Date.now() - 60_000) },
        },
      ],
    })
    mockDeleteMessages.mockResolvedValue({ succeeded: ['rh-stale'], failed: [] })

    await processFxRateRefreshQueue({ pool: {} as Pool })

    expect(mockFxRepo.markRequestStatus).toHaveBeenCalledWith(
      'req-stale',
      FxRateRefreshStatus.SKIPPED,
      'stale_message',
    )
    expect(mockSendToDLQ).not.toHaveBeenCalled()
    expect(mockDeleteMessages).toHaveBeenCalledWith('https://queue', ['rh-stale'])
  })

  it('routes queue-class mismatches to DLQ', async () => {
    const { processFxRateRefreshQueue } = await loadModule('queue')

    mockReceiveMessages.mockResolvedValue({
      messages: [
        {
          messageId: 'msg-mismatch',
          receiptHandle: 'rh-mismatch',
          payload: {
            envelopeVersion: 1,
            queueClass: 'quote-refresh',
            producedAtIso: new Date().toISOString(),
            payload: {
              requestId: 'req-1',
              baseCurrency: 'USD',
              quoteCurrency: 'EUR',
            },
          },
          attributes: { ApproximateReceiveCount: '1' },
        },
      ],
    })
    mockDeleteMessages.mockResolvedValue({ succeeded: ['rh-mismatch'], failed: [] })

    await processFxRateRefreshQueue({ pool: {} as Pool })

    expect(mockSendToDLQ).toHaveBeenCalledTimes(1)
    expect(mockSendToDLQ.mock.calls[0][3]).toMatchObject({ reason: 'queue_class_mismatch' })
    expect(mockDeleteMessages).toHaveBeenCalledWith('https://queue', ['rh-mismatch'])
  })

  it('processes claimed requests when queue is off', async () => {
    const { processFxRateRefreshQueue } = await loadModule('off', '')

    mockFxRepo.claimPendingRequests.mockResolvedValue([
      {
        request_id: 'req-3',
        base_currency: 'USD',
        quote_currency: 'EUR',
        retry_count: 0,
      },
    ])

    const processed = await processFxRateRefreshQueue({ pool: {} as Pool })

    expect(processed).toBe(1)
    expect(mockFxRepo.markRequestStatus).toHaveBeenCalledWith(
      'req-3',
      FxRateRefreshStatus.COMPLETED,
      null,
    )
  })
})
