/**
 * Hardcoded sample / illustrative data for the public (non-Plus) Pulse preview page.
 * This is intentional marketing content — do not replace with live data.
 */

export const PREVIEW_SCREENER_ROWS = [
  {
    flag: '🇺🇸',
    corridor: 'USD → PHP',
    badge: 'Great',
    bestProvider: 'Wise',
    bestRate: '56.04',
    recipientGets: '₱55,811',
    spread: '38',
    providers: '7',
    updated: 'Preview only',
  },
  {
    flag: '🇬🇧',
    corridor: 'GBP → NGN',
    badge: 'Good',
    bestProvider: 'WorldRemit',
    bestRate: '1,892.50',
    recipientGets: '₦1,890,608',
    spread: '61',
    providers: '5',
    updated: 'Preview only',
  },
  {
    flag: '🇪🇺',
    corridor: 'EUR → INR',
    badge: 'Great',
    bestProvider: 'Wise',
    bestRate: '92.17',
    recipientGets: '₹91,249',
    spread: '29',
    providers: '8',
    updated: 'Preview only',
  },
  {
    flag: '🇺🇸',
    corridor: 'USD → MXN',
    badge: 'Fair',
    bestProvider: 'Remitly',
    bestRate: '17.38',
    recipientGets: 'MX$17,345',
    spread: '95',
    providers: '6',
    updated: 'Preview only',
  },
  {
    flag: '🇦🇺',
    corridor: 'AUD → PHP',
    badge: 'Good',
    bestProvider: 'Wise',
    bestRate: '37.82',
    recipientGets: '₱37,643',
    spread: '44',
    providers: '5',
    updated: 'Preview only',
  },
  {
    flag: '🇨🇦',
    corridor: 'CAD → INR',
    badge: 'Great',
    bestProvider: 'Remitly',
    bestRate: '61.45',
    recipientGets: '₹60,937',
    spread: '31',
    providers: '6',
    updated: 'Preview only',
  },
  {
    flag: '🇺🇸',
    corridor: 'USD → NGN',
    badge: 'Fair',
    bestProvider: 'WorldRemit',
    bestRate: '1,620.30',
    recipientGets: '₦1,616,080',
    spread: '112',
    providers: '4',
    updated: 'Preview only',
  },
  {
    flag: '🇪🇺',
    corridor: 'EUR → GHS',
    badge: 'Good',
    bestProvider: 'Wise',
    bestRate: '16.92',
    recipientGets: 'GH₵16,785',
    spread: '53',
    providers: '3',
    updated: 'Preview only',
  },
]

export const PREVIEW_SAMPLE_KPIS = [
  {
    id: 'best-rate',
    label: 'Best rate',
    value: '₱56.04',
    delta: '+0.12%',
    deltaType: 'positive',
    deltaClass: 'text-brand-600',
    deltaLabel: 'vs yesterday',
    icon: 'trending',
  },
  {
    id: 'avg-fee',
    label: 'Avg fee',
    value: '$1.59',
    delta: '-$0.20',
    deltaType: 'positive',
    deltaClass: 'text-brand-600',
    deltaLabel: 'vs 7d avg',
    icon: 'percent',
  },
  {
    id: 'provider-count',
    label: 'Providers live',
    value: '7',
    delta: '',
    deltaType: 'neutral',
    deltaClass: 'text-neutral-400',
    deltaLabel: 'reporting',
    icon: 'trophy',
  },
  {
    id: 'rci',
    label: 'RCI',
    value: '2.34%',
    delta: '-8 bps',
    deltaType: 'positive',
    deltaClass: 'text-brand-600',
    deltaLabel: 'vs 30d',
    icon: 'activity',
  },
]

export const PREVIEW_RATE_CHART_BOUNDS = {
  xStart: 55,
  xEnd: 770,
  yTop: 20,
  yBottom: 240,
} as const

export const PREVIEW_RATE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export const PREVIEW_BEST_RATES = [55.72, 55.85, 56.04, 55.91, 55.98, 56.12, 56.04] as const
export const PREVIEW_MID_MARKET_RATES = [55.8, 55.89, 56.01, 55.94, 56.0, 56.07, 56.0] as const

export const PROVIDER_SLUGS = [
  'wise',
  'remitly',
  'worldremit',
  'western-union',
  'xe-money',
  'ria',
  'pangea',
  'sendwave',
  'instarem',
  'xoom',
  'transfergo',
  'paysend',
  'orbitremit',
  'koronapay',
  'wirebarley',
  'intermex',
] as const

const sampleTs = Array.from({ length: 7 }, (_, i) => Date.now() - (6 - i) * 86400000)

export const SAMPLE_CHART_SERIES: Record<string, import('~/types/pulse').ChartSeries[]> = {
  'all-in-cost': [
    {
      id: 'best',
      label: 'Best Rate',
      color: '#2563EB',
      points: sampleTs.map((t, i) => ({
        t,
        v: [55.42, 55.67, 55.91, 55.78, 56.02, 55.89, 56.04][i],
      })),
    },
    {
      id: 'avg',
      label: 'Average',
      color: '#94A3B8',
      points: sampleTs.map((t, i) => ({
        t,
        v: [55.1, 55.28, 55.52, 55.38, 55.61, 55.48, 55.65][i],
      })),
    },
  ],
  'fx-markup': [
    {
      id: 'wise',
      label: 'Wise',
      color: '#10B981',
      points: sampleTs.map((t, i) => ({ t, v: [38, 42, 40, 36, 44, 39, 42][i] })),
    },
    {
      id: 'remitly',
      label: 'Remitly',
      color: '#2563EB',
      points: sampleTs.map((t, i) => ({ t, v: [72, 78, 75, 80, 74, 76, 78][i] })),
    },
    {
      id: 'worldremit',
      label: 'WorldRemit',
      color: '#F59E0B',
      points: sampleTs.map((t, i) => ({ t, v: [105, 110, 108, 112, 106, 115, 110][i] })),
    },
  ],
  'leader-edge': [
    {
      id: 'edge',
      label: 'Leader Edge',
      color: '#6366F1',
      points: sampleTs.map((t, i) => ({ t, v: [12, 18, 5, 15, 8, 22, 14][i] })),
    },
  ],
  'volatility-pulse': [
    {
      id: 'rvi',
      label: 'RVI',
      color: '#818CF8',
      points: sampleTs.map((t, i) => ({ t, v: [28, 35, 22, 42, 31, 19, 32][i] })),
    },
  ],
  'quote-success': [
    {
      id: 'wise',
      label: 'Wise',
      color: '#10B981',
      points: sampleTs.map((t, i) => ({ t, v: [99.2, 99.5, 98.8, 99.1, 99.6, 99.3, 99.4][i] })),
    },
    {
      id: 'remitly',
      label: 'Remitly',
      color: '#2563EB',
      points: sampleTs.map((t, i) => ({ t, v: [97.1, 96.8, 97.5, 96.2, 97.8, 97.0, 97.4][i] })),
    },
    {
      id: 'worldremit',
      label: 'WorldRemit',
      color: '#F59E0B',
      points: sampleTs.map((t, i) => ({ t, v: [94.5, 95.2, 93.8, 95.0, 94.1, 95.5, 94.8][i] })),
    },
  ],
  'indices-confidence': [
    {
      id: 'confidence',
      label: 'Confidence Score',
      color: '#3B82F6',
      points: sampleTs.map((t, i) => ({ t, v: [82, 85, 88, 86, 91, 89, 92][i] })),
    },
  ],
}

export const PREVIEW_CHART_CARDS = [
  {
    id: 'all-in-cost',
    title: 'All-in Cost Index (RCI)',
    category: 'Pricing & Margin',
    accent: '#2563EB',
    description: 'Effective exchange rate including all fees and FX markup',
    type: 'line' as const,
    unit: 'rate',
    showArea: true,
  },
  {
    id: 'fx-markup',
    title: 'FX Markup by Provider',
    category: 'Pricing & Margin',
    accent: '#2563EB',
    description: 'Markup over mid-market rate in basis points',
    type: 'line' as const,
    unit: 'bps',
    showArea: false,
  },
  {
    id: 'leader-edge',
    title: 'Leader Edge vs #2',
    category: 'Competitive Dynamics',
    accent: '#6366F1',
    description: 'Pricing edge of the leader over the runner-up',
    type: 'line' as const,
    unit: 'bps',
    showArea: true,
  },
  {
    id: 'volatility-pulse',
    title: 'Volatility Pulse (RVI)',
    category: 'Volatility & Risk',
    accent: '#818CF8',
    description: 'Remittance Volatility Index in basis points',
    type: 'bar' as const,
    unit: 'bps',
    threshold: 35,
  },
  {
    id: 'quote-success',
    title: 'Quote Success Rate',
    category: 'Operational Coverage',
    accent: '#3B82F6',
    description: 'Percentage of successful quote fetches by provider',
    type: 'line' as const,
    unit: 'percent',
    showArea: false,
  },
  {
    id: 'indices-confidence',
    title: 'Indices Confidence',
    category: 'Operational Coverage',
    accent: '#3B82F6',
    description: 'Confidence score used by Gold indices weighting',
    type: 'line' as const,
    unit: 'percent',
    showArea: true,
  },
]
