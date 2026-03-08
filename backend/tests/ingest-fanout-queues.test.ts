import { describe, expect, it } from 'vitest'

import { resolveIngestFanoutQueueState } from '../shared/ingest-fanout-queues'

describe('ingest fanout queue state', () => {
  it('enables queue producers in tiered-only deployments', () => {
    const state = resolveIngestFanoutQueueState({
      mode: 'queue',
      tier1Url: 'https://sqs.us-east-1.amazonaws.com/123/tier-1',
      tier2Url: 'https://sqs.us-east-1.amazonaws.com/123/tier-2',
    })

    expect(state.tieredConfigured).toBe(true)
    expect(state.enabled).toBe(true)
    expect(state.enabledForQueueProducer).toBe(true)
  })

  it('flags partial tier configuration as misconfigured', () => {
    const state = resolveIngestFanoutQueueState({
      mode: 'queue',
      tier1Url: 'https://sqs.us-east-1.amazonaws.com/123/tier-1',
    })

    expect(state.tierMisconfigured).toBe(true)
    expect(state.enabledForQueueProducer).toBe(false)
  })
})
