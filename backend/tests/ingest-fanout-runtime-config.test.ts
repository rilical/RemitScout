import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('ingest fanout runtime config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = {
      ...originalEnv,
      DOTENV_DISABLE: '1',
      NODE_ENV: 'production',
      ENVIRONMENT: 'staging',
      PLANE_B_INGEST_FANOUT_QUEUE_MODE: 'queue',
      PLANE_B_INGEST_FANOUT_QUEUE_URL: '',
      PLANE_B_INGEST_FANOUT_TIER1_QUEUE_URL: 'https://sqs.us-east-1.amazonaws.com/123/tier-1',
      PLANE_B_INGEST_FANOUT_TIER2_QUEUE_URL: 'https://sqs.us-east-1.amazonaws.com/123/tier-2',
    }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.resetModules()
  })

  it('accepts tiered-only ingest fanout queue wiring', async () => {
    const { assertRuntimeConfig } = await import('../shared/config')

    expect(() => assertRuntimeConfig({
      requireQueues: true,
      requireQuoteRefreshQueue: false,
      requireFxRateRefreshQueue: false,
      requireExportJobQueue: false,
      requireIngestFanoutQueue: true,
      requireNotificationsQueue: false,
      requireOpsAlertsQueue: false,
      requireGoldLiveQueue: false,
      requireAlertEvaluationQueue: false,
    })).not.toThrow()
  })

  it('rejects partial tiered ingest fanout queue wiring', async () => {
    vi.resetModules()
    process.env = {
      ...originalEnv,
      DOTENV_DISABLE: '1',
      NODE_ENV: 'production',
      ENVIRONMENT: 'staging',
      PLANE_B_INGEST_FANOUT_QUEUE_MODE: 'queue',
      PLANE_B_INGEST_FANOUT_QUEUE_URL: '',
      PLANE_B_INGEST_FANOUT_TIER1_QUEUE_URL: 'https://sqs.us-east-1.amazonaws.com/123/tier-1',
      PLANE_B_INGEST_FANOUT_TIER2_QUEUE_URL: '',
    }

    const { assertRuntimeConfig } = await import('../shared/config')

    expect(() => assertRuntimeConfig({
      requireQueues: true,
      requireQuoteRefreshQueue: false,
      requireFxRateRefreshQueue: false,
      requireExportJobQueue: false,
      requireIngestFanoutQueue: true,
      requireNotificationsQueue: false,
      requireOpsAlertsQueue: false,
      requireGoldLiveQueue: false,
      requireAlertEvaluationQueue: false,
    })).toThrow('PLANE_B_INGEST_FANOUT_TIER1_QUEUE_URL + PLANE_B_INGEST_FANOUT_TIER2_QUEUE_URL')
  })
})
