/**
 * Single source of truth for all site statistics
 * Update these values in one place to keep consistency across the entire site
 */

export const SITE_STATS = {
  // Estimated money saved by users (fees + FX spread), in USD.
  totalSaved: {
    value: 2500000, // in USD
    display: '$2.5M+',
    label: 'Saved',
  },

  // Total number of comparisons executed across the platform.
  users: {
    value: 80000,
    display: '80k+',
    label: 'Comparisons Executed',
  },

  // Number of providers we compare (where available).
  providers: {
    value: 30,
    display: '30+',
    label: 'Providers',
  },

  // Number of licensed/regulator-supervised providers (where we can verify).
  // Note: today this matches `providers`, but keep this separate so we can diverge later without refactors.
  licensedProviders: {
    value: 30,
    display: '30+',
    label: 'Licensed Providers',
  },

  // Number of corridors covered (origin -> destination pairs) with recent comparison data.
  corridors: {
    value: 150,
    display: '150+',
    label: 'Global Corridors',
  },
} as const

export type SiteStat = keyof typeof SITE_STATS
