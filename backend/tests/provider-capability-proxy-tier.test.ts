import { afterEach, describe, expect, it } from 'vitest'

import { resolveCapabilityProbeProxyTier } from '../plane-b/src/services/capability-proxy-tier'

const originalProxyTier = process.env.CAPABILITY_PROBE_PROXY_TIER

describe('resolveCapabilityProbeProxyTier', () => {
  afterEach(() => {
    if (originalProxyTier === undefined) {
      delete process.env.CAPABILITY_PROBE_PROXY_TIER
      return
    }
    process.env.CAPABILITY_PROBE_PROXY_TIER = originalProxyTier
  })

  it('defaults to NONE when env var is missing', () => {
    delete process.env.CAPABILITY_PROBE_PROXY_TIER
    expect(resolveCapabilityProbeProxyTier()).toBe('NONE')
  })

  it('accepts DATACENTER_ROTATING', () => {
    process.env.CAPABILITY_PROBE_PROXY_TIER = 'DATACENTER_ROTATING'
    expect(resolveCapabilityProbeProxyTier()).toBe('DATACENTER_ROTATING')
  })

  it('accepts lowercase value for RESIDENTIAL_PREMIUM', () => {
    process.env.CAPABILITY_PROBE_PROXY_TIER = 'residential_premium'
    expect(resolveCapabilityProbeProxyTier()).toBe('RESIDENTIAL_PREMIUM')
  })

  it('falls back to NONE for invalid values', () => {
    process.env.CAPABILITY_PROBE_PROXY_TIER = 'INVALID_TIER'
    expect(resolveCapabilityProbeProxyTier()).toBe('NONE')
  })
})
