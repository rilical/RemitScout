import { describe, expect, it } from 'vitest'
import { mergePinnedCorridorIds } from '~/domains/pulse/application'
import type { CorridorOption } from '~/types/pulse'

describe('mergePinnedCorridorIds', () => {
  it('merges pulse pinned corridor ids with dashboard watchlist corridor ids', () => {
    const pulsePinnedCorridorIds = ['US-PH-USD-PHP', 'US-MX-USD-MXN']
    const watchlistCorridors: CorridorOption[] = [
      { value: 'usd-mxn', label: 'USD → MXN', fromFlag: '🇺🇸', toFlag: '🇲🇽', fromCode: 'USD', toCode: 'MXN', corridorId: 'US-MX-USD-MXN' },
      { value: 'usd-inr', label: 'USD → INR', fromFlag: '🇺🇸', toFlag: '🇮🇳', fromCode: 'USD', toCode: 'INR', corridorId: 'US-IN-USD-INR' },
    ]

    const result = mergePinnedCorridorIds(pulsePinnedCorridorIds, watchlistCorridors)
    expect(result).toEqual(['US-PH-USD-PHP', 'US-MX-USD-MXN', 'US-IN-USD-INR'])
  })

  it('is read-only and ignores watchlist rows without corridor ids', () => {
    const pulsePinnedCorridorIds = ['US-PH-USD-PHP']
    const watchlistCorridors: CorridorOption[] = [
      { value: 'usd-php', label: 'USD → PHP', fromFlag: '🇺🇸', toFlag: '🇵🇭', fromCode: 'USD', toCode: 'PHP', corridorId: 'US-PH-USD-PHP' },
      { value: 'usd-jpy', label: 'USD → JPY', fromFlag: '🇺🇸', toFlag: '🇯🇵', fromCode: 'USD', toCode: 'JPY' },
    ]

    const result = mergePinnedCorridorIds(pulsePinnedCorridorIds, watchlistCorridors)

    expect(result).toEqual(['US-PH-USD-PHP'])
    expect(pulsePinnedCorridorIds).toEqual(['US-PH-USD-PHP'])
    expect(watchlistCorridors[1]?.corridorId).toBeUndefined()
  })
})
