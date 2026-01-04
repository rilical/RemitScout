import { beforeEach, describe, expect, it, vi } from 'vitest'

process.env.VITEST = '1'

const mockReceiveJsonMessages = vi.fn()
const mockDeleteMessages = vi.fn()
const mockSendToDlq = vi.fn()
const mockGetQueueDepth = vi.fn().mockResolvedValue(3)

const mockRecordQueueDepthMetric = vi.fn()
const mockRecordWorkerMetric = vi.fn()

const mockEvaluateAlertsForFrequency = vi.fn().mockResolvedValue(0)

const mockAcquire = vi.fn().mockResolvedValue(true)
const mockExtend = vi.fn().mockResolvedValue(true)
const mockRelease = vi.fn().mockResolvedValue(undefined)

vi.mock('../shared/config', () => ({
  config: {
    alerts: {
      evaluation: {
        enabled: true,
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/alert-evaluation',
        batchSize: 5,
        concurrency: 5,
      },
    },
    db: {
      planeAUrl: 'postgres://localhost/test',
    },
  },
}))

vi.mock('../shared/db', () => ({
  createPool: vi.fn().mockReturnValue({ end: vi.fn().mockResolvedValue(undefined) }),
}))

vi.mock('../shared/sqs', () => ({
  createVisibilityTimeoutExtender: () => () => Promise.resolve(),
  deleteMessages: mockDeleteMessages,
  getQueueDepth: mockGetQueueDepth,
  receiveJsonMessages: mockReceiveJsonMessages,
  sendToDLQ: mockSendToDlq,
}))

vi.mock('../plane-b/src/lib/worker-lock', () => ({
  WorkerLock: vi.fn().mockImplementation(() => ({
    acquire: mockAcquire,
    extend: mockExtend,
    release: mockRelease,
  })),
}))

vi.mock('../shared/worker-metrics', () => ({
  recordQueueDepthMetric: mockRecordQueueDepthMetric,
  recordWorkerMetric: mockRecordWorkerMetric,
}))

vi.mock('../plane-a/src/services/alert-evaluator', () => ({
  evaluateAlertsForFrequency: mockEvaluateAlertsForFrequency,
}))

vi.mock('../shared/shutdown', () => ({
  createShutdownHandler: () => ({
    isShutdownRequested: () => false,
  }),
}))

describe('alert-evaluation-worker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('processes a message and deletes it', async () => {
    mockReceiveJsonMessages.mockResolvedValue([
      {
        messageId: 'msg-1',
        receiptHandle: 'receipt-1',
        payload: { frequency: 'hourly' },
        attributes: {},
        raw: {},
      },
    ])

    const { runAlertEvaluationWorker } = await import('../scripts/alert-evaluation-worker')
    await runAlertEvaluationWorker({ once: true })

    expect(mockGetQueueDepth).toHaveBeenCalled()
    expect(mockEvaluateAlertsForFrequency).toHaveBeenCalledWith(
      expect.any(Object),
      'hourly',
      undefined,
    )
    expect(mockDeleteMessages).toHaveBeenCalledWith(
      'https://sqs.us-east-1.amazonaws.com/123/alert-evaluation',
      ['receipt-1'],
    )
  })
})
