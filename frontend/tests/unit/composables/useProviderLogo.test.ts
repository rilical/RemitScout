import { describe, expect, it } from 'vitest'
import { getProviderLogoPath, getProviderLogoSources } from '~/composables/useProviderLogo'

describe('useProviderLogo', () => {
  it('prioritizes preferred source and deduplicates candidate paths', () => {
    const sources = getProviderLogoSources('wirebarley', '/logos/wirebarley.png')

    expect(sources[0]).toBe('/logos/wirebarley.png')
    expect(sources).toContain('/png/SVG/PROVIDERS/WIREBARLEY_LOGO.png')
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('resolves known aliases to canonical logo paths', () => {
    expect(getProviderLogoPath('westernunion')).toBe('/logos/western-union.svg')
    expect(getProviderLogoPath('xe')).toBe('/logos/xe-money.svg')
    expect(getProviderLogoPath('alansari')).toBe('/logos/alansari.png')
    expect(getProviderLogoPath('bossmoney')).toBe('/logos/boss-money.svg')
    expect(getProviderLogoPath('wellsfargo')).toBe('/logos/wellsfargo.svg')
  })

  it('includes computed fallback paths for unknown providers', () => {
    const sources = getProviderLogoSources('new-provider')

    expect(sources).toContain('/png/SVG/PROVIDERS/NEW_PROVIDER_LOGO.svg')
    expect(sources).toContain('/png/SVG/PROVIDERS/NEW_PROVIDER_LOGO.png')
  })
})
