import { describe, expect, it } from 'vitest'

import { evaluateProviderProbe } from '../scripts/ci/integration-smoke'

describe('integration smoke provider hydration', () => {
  it('keeps retrying transient 503 quotes_unavailable responses', () => {
    expect(evaluateProviderProbe(503, 0, 'quotes_unavailable')).toEqual({
      ok: false,
      note: 'collecting (quotes_unavailable)',
      retryableHydration: true,
    })
  })

  it('keeps retrying refresh_pending responses', () => {
    expect(evaluateProviderProbe(503, 0, 'refresh_pending')).toEqual({
      ok: false,
      note: 'collecting (refresh_pending)',
      retryableHydration: true,
    })
  })

  it('does not retry hard 5xx failures without a hydration signal', () => {
    expect(evaluateProviderProbe(503, 0, 'internal_error')).toEqual({
      ok: false,
      note: 'providers=0 (internal_error)',
      retryableHydration: false,
    })
  })

  it('retries empty non-5xx payloads while the corridor warms', () => {
    expect(evaluateProviderProbe(200, 0, null)).toEqual({
      ok: false,
      note: 'providers=0',
      retryableHydration: true,
    })
  })

  it('accepts successful hydrated provider responses', () => {
    expect(evaluateProviderProbe(200, 3, null)).toEqual({
      ok: true,
      note: 'providers=3',
      retryableHydration: false,
    })
  })
})
