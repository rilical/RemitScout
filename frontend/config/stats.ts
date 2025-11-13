/**
 * Single source of truth for all site statistics
 * Update these values in one place to keep consistency across the entire site
 */

export const SITE_STATS = {
  // Total money saved by users in fees
  totalSaved: {
    value: 2500000, // in USD
    display: '$2.5M+',
    label: 'Saved in fees',
  },
  
  // Total number of users who trust us
  users: {
    value: 80000,
    display: '80k+',
    label: 'Users trust us',
  },
  
  // Number of providers we compare
  providers: {
    value: 30,
    display: '30+',
    label: 'Providers compared',
  },
  
  // Number of corridors covered
  corridors: {
    value: 150,
    display: '150+',
    label: 'Corridors covered',
  },
  
  // Licensed and regulated providers
  licensedProviders: {
    value: 30,
    display: '30+',
    label: 'All fully regulated & trusted',
  },
} as const;

export type SiteStat = keyof typeof SITE_STATS;

