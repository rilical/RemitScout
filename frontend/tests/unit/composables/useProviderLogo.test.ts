import { describe, expect, it } from 'vitest'
import { getProviderLogoPath, getProviderLogoSources } from '~/composables/useProviderLogo'

describe('useProviderLogo', () => {
  it('maps spaced Western Union names to the canonical asset path', () => {
    expect(getProviderLogoPath('Western Union')).toBe('/logos/western-union.svg')
    expect(getProviderLogoSources('Western Union')).toContain('/png/SVG/PROVIDERS/WESTERN_UNION_LOGO.svg')
  })
})
