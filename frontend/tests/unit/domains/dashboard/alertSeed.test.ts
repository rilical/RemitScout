import { describe, expect, it } from 'vitest'

import { resolveDashboardAlertSeed } from '~/domains/dashboard/application/alertSeed'

describe('resolveDashboardAlertSeed', () => {
  it('returns selected corridor when present', () => {
    const seed = resolveDashboardAlertSeed({
      selectedCorridor: {
        from: ' us ',
        to: 'ph',
      },
      watchlistCorridors: [
        {
          label: 'CA → IN',
          target: { type: 'corridor', from: 'CA', to: 'IN', method: 'cash' },
        },
      ],
      recentSearches: [{ from: 'gb', to: 'ng' }],
    })

    expect(seed).toEqual({
      target: { type: 'corridor', from: 'US', to: 'PH', method: 'bank' },
      label: 'US → PH',
    })
  })

  it('falls back to first watchlist corridor when selected corridor is missing', () => {
    const seed = resolveDashboardAlertSeed({
      selectedCorridor: null,
      watchlistCorridors: [
        {
          label: 'MX → CO',
          target: { type: 'corridor', from: 'mx', to: 'co', method: 'cash' },
        },
      ],
      recentSearches: [{ from: 'gb', to: 'ng' }],
    })

    expect(seed).toEqual({
      target: { type: 'corridor', from: 'MX', to: 'CO', method: 'cash' },
      label: 'MX → CO',
    })
  })

  it('falls back to first recent search when selected and watchlist are missing', () => {
    const seed = resolveDashboardAlertSeed({
      selectedCorridor: null,
      watchlistCorridors: [],
      recentSearches: [{ from: ' gb ', to: 'ng' }],
    })

    expect(seed).toEqual({
      target: { type: 'corridor', from: 'GB', to: 'NG', method: 'bank' },
      label: 'GB → NG',
    })
  })

  it('ignores invalid recent search values and falls through', () => {
    const seed = resolveDashboardAlertSeed({
      selectedCorridor: null,
      watchlistCorridors: [],
      recentSearches: [{ from: 'usa', to: 'ph' }],
    })

    expect(seed).toEqual({
      target: { type: 'corridor', from: 'US', to: 'PH', method: 'bank' },
      label: 'US → PH',
    })
  })

  it('returns default fallback when all sources are empty', () => {
    const seed = resolveDashboardAlertSeed({
      selectedCorridor: null,
      watchlistCorridors: [],
      recentSearches: [],
    })

    expect(seed).toEqual({
      target: { type: 'corridor', from: 'US', to: 'PH', method: 'bank' },
      label: 'US → PH',
    })
  })
})
