import {
  CheckCircleIcon,
  ClockIcon,
  ScaleIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  EnvelopeIcon,
  ChartBarIcon,
  BuildingLibraryIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline'

export type MarketingTile = {
  id: string
  title: string
  body: string
  icon: any
}

export const TRANSPARENCY_TILES: readonly MarketingTile[] = [
  {
    id: 'recipient-gets',
    title: 'Recipient gets',
    body: 'We show the delivered amount after fees and FX markup, not just a headline rate.',
    icon: CheckCircleIcon,
  },
  {
    id: 'timestamped-quotes',
    title: 'Timestamped quotes',
    body: 'Every quote includes a capture time. Refresh cadence varies by provider and corridor.',
    icon: ClockIcon,
  },
  {
    id: 'apples-to-apples',
    title: 'Apples-to-apples',
    body: 'We standardize fees, FX rate, and delivery method so results are comparable.',
    icon: ScaleIcon,
  },
] as const

export const TRUST_BADGES = {
  noPayToRank: { label: 'No pay-to-rank', icon: ShieldCheckIcon },
  quotesTimestamped: { label: 'Timestamped quotes', icon: ClockIcon },
  weDontMoveMoney: { label: "We don't move money", icon: LockClosedIcon },
  reportAProblem: { label: 'Report a problem', icon: EnvelopeIcon },
} as const

export const QUICK_LINKS = {
  pulse: { title: 'Explore Pulse', description: 'Market trends and insights', icon: ChartBarIcon, to: '/pulse' },
  providers: { title: 'Verified providers', description: 'See all licensed providers', icon: BuildingLibraryIcon, to: '/providers' },
  founder: { title: 'About the founder', description: 'Our story and mission', icon: UserCircleIcon, to: '/about' },
  report: { title: 'Report a problem', description: 'Help us improve accuracy', icon: EnvelopeIcon, to: '/contact' },
} as const

