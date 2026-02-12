import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { QuoteRefreshStatus } from '../plane-b/src/repositories/types/quote-refresh-status'

const mockReceiveMessages = vi.fn()
const mockDeleteMessages = vi.fn()
const mockSendMessage = vi.fn()
const mockGetQueueDepth = vi.fn().mockResolvedValue(0)
const mockGetProvider = vi.fn()
const mockResolveSupport = vi.fn()
const mockGetLatestCollectedAt = vi.fn()
const mockGetTtl = vi.fn()

const mockQuoteRefreshRepo = {
  markRequestStatus: vi.fn(),
  markRequestFailed: vi.fn(),
  claimPendingRequests: vi.fn(),
  getQueueDepth: vi.fn().mockResolvedValue(0),
}

vi.mock('../shared/db', () => ({
  createPool: vi.fn().mockReturnValue({ end: vi.fn().mockResolvedValue(undefined) }),
}))

vi.mock('../shared/sqs', () => ({
  receiveJsonMessages: (...args: any[]) => mockReceiveMessages(...args),
  deleteMessages: (...args: any[]) => mockDeleteMessages(...args),
  sendJsonMessage: (...args: any[]) => mockSendMessage(...args),
  getQueueDepth: (...args: any[]) => mockGetQueueDepth(...args),
}))

vi.mock('../plane-b/src/providers', () => ({
  getProvider: (...args: any[]) => mockGetProvider(...args),
}))

vi.mock('../plane-b/src/repositories', () => ({
  QuoteRefreshRepository: vi.fn().mockImplementation(() => mockQuoteRefreshRepo),
  LatestQuoteRepository: vi.fn().mockImplementation(() => ({
    getLatestCollectedAt: (...args: any[]) => mockGetLatestCollectedAt(...args),
  })),
}))

vi.mock('../plane-b/src/services/provider-capability', () => ({
  resolveProviderSupport: (...args: any[]) => mockResolveSupport(...args),
}))

vi.mock('../plane-b/src/services/volatility-service', () => ({
  VolatilityService: vi.fn().mockImplementation(() => ({
    getCacheTtlForCorridor: (...args: any[]) => mockGetTtl(...args),
  })),
}))

const loadModule = async (queueMode: 'queue' | 'shadow' | 'off', queueUrl = 'https://queue') => {
  vi.resetModules()
  vi.doMock('../shared/config', () => ({
    config: {
      db: { planeBUrl: 'postgres://localhost/test' },
      queues: {
        quoteRefreshMode: queueMode,
        quoteRefreshUrl: queueUrl,
        quoteRefreshDlqUrl: 'https://dlq',
      },
      planeB: {
        b2cRefreshBatchLimit: 5,
        b2cRefreshMaxRetries: 2,
        b2cRefreshConcurrency: 1,
      },
    },
  }))

  return await import('../plane-b/src/quote-refresh')
}

describe('quote-refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetLatestCollectedAt.mockResolvedValue(null)
    mockGetTtl.mockResolvedValue({ ttlSeconds: 60 })
    mockResolveSupport.mockResolvedValue({ supported: true, reason: null, source: 'cache' })
    mockGetProvider.mockReturnValue({ run: vi.fn().mockResolvedValue(true) })
  })

  it('deletes invalid SQS messages', async () => {
    const { processQuoteRefreshQueue } = await loadModule('queue')

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

    await processQuoteRefreshQueue({ pool: {} as Pool })

    expect(mockDeleteMessages).toHaveBeenCalledWith('https://queue', ['rh-1'])
  })

  it('sends max-retry items to DLQ', async () => {
    const { processQuoteRefreshQueue } = await loadModule('queue')

    mockReceiveMessages.mockResolvedValue({
      messages: [
        {
          messageId: 'msg-2',
          receiptHandle: 'rh-2',
          payload: {
            requestId: 'req-2',
            providerId: 'wise',
            corridorId: 'US-MX-USD-MXN',
            amountBucket: 500,
            payinMethod: 'bank',
            payoutMethod: 'bank',
          },
          attributes: { ApproximateReceiveCount: '3' },
        },
      ],
    })
    mockDeleteMessages.mockResolvedValue({ succeeded: ['rh-2'], failed: [] })

    await processQuoteRefreshQueue({ pool: {} as Pool })

    expect(mockSendMessage).toHaveBeenCalledWith(
      'https://dlq',
      expect.objectContaining({ requestId: 'req-2', failureReason: 'max_retries_exceeded' }),
    )
    expect(mockDeleteMessages).toHaveBeenCalledWith('https://queue', ['rh-2'])
  })

  it('processes claimed requests when queue is off', async () => {
    const { processQuoteRefreshQueue } = await loadModule('off', '')

    mockQuoteRefreshRepo.claimPendingRequests.mockResolvedValue([
      {
        request_id: 'req-3',
        provider_id: 'wise',
        corridor_id: 'US-MX-USD-MXN',
        amount_bucket: 500,
        payin_method: 'bank',
        payout_method: 'bank',
        retry_count: 0,
      },
    ])

    const processed = await processQuoteRefreshQueue({ pool: {} as Pool })

    expect(processed).toBe(1)
    expect(mockQuoteRefreshRepo.markRequestStatus).toHaveBeenCalledWith(
      'req-3',
      QuoteRefreshStatus.COMPLETED,
      null,
    )
  })
})
