import {
  BanknotesIcon,
  ClockIcon,
  GlobeAltIcon,
  BuildingLibraryIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline'

import type { SiteStat } from '~/config/stats'

export const IMPACT_COPY = {
  title: 'Our Impact So Far',
  lead: 'Real-time comparisons across providers and global corridors. Providers cannot pay to rank higher. We rank by what your recipient gets.',
  ctaLabel: 'Learn about our methodology',
  ctaTo: '/methodology',
  headerIcon: ClockIcon,
} as const

export type ImpactStatItem = {
  statKey: SiteStat
  icon: any
  description: string
}

export const IMPACT_STATS: readonly ImpactStatItem[] = [
  {
    statKey: 'users',
    icon: UserGroupIcon,
    description: 'Comparisons executed across providers, corridors, and payment methods.',
  },
  {
    statKey: 'totalSaved',
    icon: BanknotesIcon,
    description: 'Estimated savings based on lower fees and tighter FX spreads.',
  },
  {
    statKey: 'providers',
    icon: BuildingLibraryIcon,
    description: 'Licensed providers tracked where available; coverage varies by corridor.',
  },
  {
    statKey: 'corridors',
    icon: GlobeAltIcon,
    description: 'Origin and destination pairs with recent comparison data.',
  },
] as const
