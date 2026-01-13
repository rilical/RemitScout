/**
 * Single source of truth for all site statistics
 * Update these values in one place to keep consistency across the entire site
 */

export const SITE_STATS = {
  // Total money saved by users in fees
  totalSaved: {
    value: 2500000, // in USD
    display: '$2.5M+',
    label: 'Saved',
  },

  // Total number of users who trust us
  users: {
    value: 80000,
    display: '80k+',
    label: 'Comparisons Executed',
  },

  // Number of providers we compare
  providers: {
    value: 30,
    display: '30+',
    label: 'Providers',
  },

  // Number of corridors covered
  corridors: {
    value: 150,
    display: '150+',
    label: 'Global Corridors',
  },

  // Licensed and regulated providers
  licensedProviders: {
    value: 30,
    display: '30+',
    label: 'All fully regulated & trusted',
  },
} as const

export type SiteStat = keyof typeof SITE_STATS
