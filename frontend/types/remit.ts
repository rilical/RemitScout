export type Method = 'bank' | 'cash' | 'wallet' | 'airtime' | 'home' | 'card'

export type Corridor = {
  from: string // ISO alpha-2
  to: string // ISO alpha-2
  sendCurrency: string
  recvCurrency: string
}

export type ProviderQuote = {
  id: string
  providerId?: string
  name: string
  logoUrl?: string
  fee: number // in sendCurrency
  feeAmount?: number // optional alias for fee
  marginPct: number // exchange margin vs mid
  fxRate: number // send->recv
  recipientGets: number // in recvCurrency for given amount
  delivery: string // "15–30 min", "1–2 days"
  speed?: string
  reliability: number // 0..1 (success rate last 30d)
  methods: Method[]
  bestFor: string
  limits?: string // e.g., ">$1,000 requires ID"
  corridorPros?: string[] // Corridor-specific pros
  corridorCons?: string[] // Corridor-specific cons
  whyThisRanking?: string // Explanation for ranking
  affiliateUrl?: string | null
  outboundUrl?: string | null
  isAffiliate?: boolean
  hasPromo?: boolean
  isStale?: boolean
  staleAgeSeconds?: number | null
  staleMaxAgeSeconds?: number
  staleGraceSeconds?: number
  promoInfo?: {
    fee: number
    rate: number
    headline: string
    details: string[]
    newCustomersOnly: boolean
  } | null
  score?: number
  scoreBreakdown?: {
    cost: number
    speed: number
    reliability: number
    coverage: number
  }
}

export type BankVsSpecialist = {
  corridor: Corridor
  midRate: number
  bank: Omit<ProviderQuote, 'id'> & { name: string }
  top: ProviderQuote
  updatedAt: string // ISO
  savings?: {
    amount: number
    recipientGetsDifference: number
    percentage: number
  }
}

export type RecentSearch = {
  id: string
  from: string
  to: string
  amount: number
  method: Method
  bestProvider?: { name: string, recipientGets: number }
  createdAt: string // ISO
}

export type CorridorPopularity = {
  route: string // "US→PH"
  count24h: number
  topProvider?: string
  feeRange?: string
  speedRange?: string
  bestFor?: string
}

export type RatingWeights = {
  cost: number
  speed: number
  reliability: number
  coverage: number
}

export type TrueCostBreakdown = {
  upfrontFee: number
  hiddenMarkup: number
  hiddenMarkupPercent: number
  totalCost: number
  totalCostPercent: number
  deltaFromBest: number
  deltaPercent: number
  midMarketRate: number
  providerRate: number
  spreadBps: number
}

export type ProviderWithTrueCost = ProviderQuote & {
  trueCost: TrueCostBreakdown
}

export type MarketDepth = {
  bestRate: number
  bestProvider: string
  secondBestRate: number
  secondBestProvider: string
  medianRate: number
  worstRate: number
  worstProvider: string
  spreadRange: number
  spreadRangeBps: number
  providerCount: number
}

export type ArbitrageOpportunity = {
  provider: string
  currentRate: number
  averageRate: number
  savingsPercent: number
  percentile: number
  isSignificant: boolean
  recommendation: string
}

export type CostTrendData = {
  date: string
  averageHiddenFee: number
  bestProvider: string
  bestProviderCost: number
  marketLeaderDays: number
}

export type BankComparisonData = {
  bankMarkup: number
  bankFee: number
  bankTotalCost: number
  bestSpecialistMarkup: number
  bestSpecialistFee: number
  bestSpecialistTotalCost: number
  bestSpecialistName: string
  savings: number
  savingsPercent: number
}
