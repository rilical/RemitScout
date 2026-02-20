import { describe, expect, it } from 'vitest'
import { listProviders } from '../shared/provider-catalog'
import { getProvider, getProviderIds, providerRegistry } from '../plane-b/src/providers'

describe('provider registry wiring', () => {
  it('matches provider catalog IDs exactly', () => {
    const registryIds = getProviderIds().sort()
    const catalogIds = listProviders().slice().sort()
    expect(registryIds).toEqual(catalogIds)
  })

  it('exposes a runnable collector for every provider', () => {
    expect(providerRegistry.length).toBeGreaterThan(0)
    for (const provider of providerRegistry) {
      expect(provider.providerId).toBeTruthy()
      expect(typeof provider.run).toBe('function')
      expect(getProvider(provider.providerId)).toBeDefined()
    }
  })
})
