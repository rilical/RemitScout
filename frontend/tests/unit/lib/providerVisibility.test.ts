// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { applyProviderSourceVisibility } from '~/lib/providerVisibility'
import type { ProviderQuote } from '~/types/remit'

const baseQuote = (overrides: Partial<ProviderQuote>): ProviderQuote => ({
  id: 'wise',
  name: 'Wise',
  fee: 1,
  marginPct: 0.5,
  fxRate: 1.1,
  recipientGets: 110,
  delivery: '1 day',
  reliability: 0.98,
  methods: ['bank'],
  bestFor: 'General',
  ...overrides,
})

describe('applyProviderSourceVisibility', () => {
  it('removes SingX when source country is not SG/HK/AU', () => {
    const response = {
      data: [
        baseQuote({ id: 'singx', providerId: 'singx', name: 'SingX' }),
        baseQuote({ id: 'wise', providerId: 'wise', name: 'Wise' }),
      ],
      availableMethodsByProvider: {
        singx: ['bank'],
        wise: ['bank'],
      },
      excludedProviders: [
        { provider: 'singx', reason: 'no_quotes' },
        { provider: 'wise', reason: 'no_quotes' },
      ],
      excludedProvidersDetailed: [
        { provider: 'singx', reason: 'no_quotes' },
        { provider: 'wise', reason: 'no_quotes' },
      ],
      refresh: {
        providers: ['singx', 'wise'],
        dedupedProviders: ['singx', 'wise'],
      },
    }

    const filtered = applyProviderSourceVisibility(response, 'US')

    expect(filtered.data).toHaveLength(1)
    expect(filtered.data[0]?.id).toBe('wise')
    expect(filtered.availableMethodsByProvider).toEqual({ wise: ['bank'] })
    expect(filtered.excludedProviders).toEqual([{ provider: 'wise', reason: 'no_quotes' }])
    expect(filtered.excludedProvidersDetailed).toEqual([{ provider: 'wise', reason: 'no_quotes' }])
    expect(filtered.refresh).toEqual({
      providers: ['wise'],
      dedupedProviders: ['wise'],
    })
  })

  it('keeps SingX when source country is SG', () => {
    const response = {
      data: [
        baseQuote({ id: 'singx', providerId: 'singx', name: 'SingX' }),
        baseQuote({ id: 'wise', providerId: 'wise', name: 'Wise' }),
      ],
    }

    const filtered = applyProviderSourceVisibility(response, 'SG')
    expect(filtered).toEqual(response)
  })

  it('keeps SingX when source country is HK or AU', () => {
    const response = {
      data: [
        baseQuote({ id: 'singx', providerId: 'singx', name: 'SingX' }),
        baseQuote({ id: 'wise', providerId: 'wise', name: 'Wise' }),
      ],
    }

    expect(applyProviderSourceVisibility(response, 'HK').data).toHaveLength(2)
    expect(applyProviderSourceVisibility(response, 'AU').data).toHaveLength(2)
  })
})
