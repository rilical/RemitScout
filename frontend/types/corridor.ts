/**
 * Corridor Comparison API Response Types
 * 
 * These types match the server response for /api/compare endpoints.
 * See: frontend/mocks/corridor-comparison.json for example data.
 */

// Provider types
export type ProviderType = 'ONLINE_MTO' | 'HYBRID_MTO' | 'BANK' | 'CRYPTO'
export type PaymentMethod = 'BANK' | 'CARD' | 'CASH' | 'MOBILE_WALLET' | 'CRYPTO'
export type KycLevel = 'BASIC' | 'STANDARD' | 'ENHANCED' | 'BANK_CUSTOMER'
export type MessageType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
export type PromoType = 'FEE_WAIVER' | 'FEE_DISCOUNT' | 'RATE_BOOST' | 'CASHBACK'
export type RecommendationType = 'BEST_RATED' | 'CHEAPEST' | 'FASTEST' | 'BEST_VALUE' | 'AVOID'
export type SourceType = 'primary' | 'secondary'

// Provider licensing
export interface ProviderLicense {
  country: string
  authority: string
  registrationNumber?: string
}

// Provider score breakdown
export interface ScoreCategory {
  name: 'trust' | 'service' | 'pricing' | 'customer'
  value: number
}

export interface ProviderScore {
  value: number
  categories: ScoreCategory[]
}

// Provider logo
export interface ProviderLogo {
  sm: string
  ico: string
  lg?: string
}

// Language support
export interface Language {
  code: string
  label: string
}

// Provider definition
export interface Provider {
  slug: string
  name: string
  type: ProviderType
  url: string
  affiliateUrl: string | null
  isAffiliate: boolean
  isQuoteRequestLink: boolean
  logo: ProviderLogo
  languages: Language[]
  score: ProviderScore
  licensing: ProviderLicense[]
}

// Transfer time
export interface TransferTime {
  minHrs: number
  maxHrs: number
  label: string
}

// Fee breakdown
export interface FeeBreakdown {
  transfer: number
  externalPayin: number
  externalPayout: number
  payin: number
  payout: number
  total: number
  promoApplied: boolean
}

// Best flags for a quote
export interface BestFlags {
  cheapest: boolean
  fastest: boolean
  topRated: boolean
  bestValue: boolean
}

// Promo/promotion
export interface Promo {
  code: string
  description: string
  discount: number
  type: PromoType
}

// Message (info, warning, etc.)
export interface QuoteMessage {
  type: MessageType
  text: string
}

// Transfer limits
export interface TransferLimits {
  min: number
  max: number
  currency: string
}

// Availability info
export interface Availability {
  isAvailable: boolean
  requiresKyc: boolean
  kycLevel: KycLevel
  geoRestrictions: string[]
  limits: TransferLimits
}

// Individual quote from a provider
export interface Quote {
  quoteId: string
  payin: PaymentMethod
  payinLabel: string
  payout: PaymentMethod
  payoutLabel: string
  transferTime: TransferTime
  receivedAmount: number
  rate: number
  fee: FeeBreakdown
  fxMarkupBps: number
  fxMarkupPercent: string
  totalCostUsd: number
  totalCostPercent: string
  deltaVsMidMarket: string
  rank: number
  bestFlags: BestFlags
  slaLabel: string
  promos: Promo[]
  promoExpiry: string | null
  valueProps: string[]
  messages: QuoteMessage[]
  warnings: QuoteMessage[]
  availability: Availability
}

// Provider with their quotes
export interface ProviderQuote {
  provider: Provider
  quotes: Quote[]
}

// Corridor info
export interface CorridorInfo {
  fromCountry: string
  toCountry: string
  fromCountryCode: string
  toCountryCode: string
  fromCountryFlag: string
  toCountryFlag: string
  fromCountryName: string
  toCountryName: string
  sendCurrency: string
  receiveCurrency: string
  sendAmount: number
  sendAmountUsd: number
}

// Mid-market rate info
export interface MidMarketRate {
  rate: number
  timestamp: string
  source: string
  changes: {
    '7d': string
    '30d': string
    '60d': string
  }
}

// Insights
export interface CorridorInsights {
  providersChecked: number
  quotesReturned: number
  mostOftenCheapest: {
    provider: string
    frequency: string
    period: string
  }
  avgLowestCost: {
    percent: string
    amount: number
  }
  highestCost: {
    percent: string
    provider: string
  }
  fastestRoute: {
    provider: string
    method: string
    time: string
  }
  bestForLargeTransfers: {
    providers: string[]
    threshold: number
    reason: string
  }
}

// Recommendation
export interface Recommendation {
  type: RecommendationType
  provider: string
  score?: number
  reason: string
}

// FAQ
export interface FAQ {
  question: string
  answer: string
}

// Mini guide
export interface MiniGuide {
  slug: string
  title: string
  excerpt: string
  readTime: string
  link: string
}

// Sort config
export interface SortConfig {
  by: 'receivedAmount' | 'totalCost' | 'speed' | 'score'
  order: 'asc' | 'desc'
}

// Filter option
export interface FilterOption {
  value: string
  label: string
  count: number
}

// Filter
export interface Filter {
  key: string
  label: string
  options: FilterOption[]
}

// Filter config
export interface FilterConfig {
  applied: string[]
  available: Filter[]
}

// Disclosure
export interface Disclosure {
  text: string
  affiliateNeutrality: boolean
  dataAccuracy: string
  lastVerified: string
}

// EEAT author
export interface EEATAuthor {
  name: string
  title: string
  bio: string
  profileUrl: string
  imageUrl?: string
}

// EEAT source
export interface EEATSource {
  name: string
  url: string
  type: SourceType
}

// EEAT methodology
export interface EEATMethodology {
  url: string
  summary: string
}

// EEAT data
export interface EEATData {
  author: EEATAuthor
  lastUpdated: string
  lastReviewed: string
  methodology: EEATMethodology
  sources: EEATSource[]
  credentials: string[]
}

// Breadcrumb
export interface Breadcrumb {
  name: string
  url: string
}

// Related corridor
export interface RelatedCorridor {
  from: string
  to: string
  label: string
}

// SEO meta
export interface SEOMeta {
  title: string
  description: string
  canonical: string
}

// Corridor meta
export interface CorridorMeta {
  seo: SEOMeta
  breadcrumbs: Breadcrumb[]
  relatedCorridors: RelatedCorridor[]
}

/**
 * Main API Response
 * 
 * This is the complete response from:
 * GET /api/compare?from={fromCountry}&to={toCountry}&amount={amount}
 */
export interface CorridorComparisonResponse {
  comparisonId: string
  startedAt: string
  corridor: CorridorInfo
  midMarket: MidMarketRate
  providerQuotes: ProviderQuote[]
  insights: CorridorInsights
  recommendations: Recommendation[]
  faqs: FAQ[]
  miniGuides: MiniGuide[]
  sort: SortConfig
  filters: FilterConfig
  disclosure: Disclosure
  eeat: EEATData
  meta: CorridorMeta
  lastUpdated: string
}

/**
 * API Request params
 */
export interface CorridorComparisonRequest {
  from: string           // Country slug or code (e.g., 'united-states' or 'US')
  to: string             // Country slug or code (e.g., 'jordan' or 'JO')
  amount?: number        // Send amount (default: 200)
  currency?: string      // Send currency (default: from country's currency)
  payinMethod?: PaymentMethod
  payoutMethod?: PaymentMethod
  sortBy?: SortConfig['by']
  sortOrder?: SortConfig['order']
}

/**
 * Flattened quote for table display
 * Combines provider + quote data for easy rendering
 */
export interface FlattenedQuote {
  // Provider info
  providerSlug: string
  providerName: string
  providerType: ProviderType
  providerUrl: string
  affiliateUrl: string | null
  isAffiliate: boolean
  providerScore: number
  providerLogo: string
  
  // Quote info
  quoteId: string
  payinMethod: PaymentMethod
  payinLabel: string
  payoutMethod: PaymentMethod
  payoutLabel: string
  
  // Amounts
  receivedAmount: number
  rate: number
  fee: number
  fxMarkupBps: number
  totalCostUsd: number
  totalCostPercent: string
  
  // Speed
  transferTimeLabel: string
  transferTimeHrs: number
  
  // Ranking
  rank: number
  isCheapest: boolean
  isFastest: boolean
  isTopRated: boolean
  isBestValue: boolean
  
  // Extras
  hasPromo: boolean
  promoLabel?: string
  warnings: string[]
  valueProps: string[]
}

/**
 * Helper to flatten provider quotes for table display
 */
export function flattenQuotes(providerQuotes: ProviderQuote[]): FlattenedQuote[] {
  const flattened: FlattenedQuote[] = []
  
  for (const pq of providerQuotes) {
    for (const quote of pq.quotes) {
      flattened.push({
        providerSlug: pq.provider.slug,
        providerName: pq.provider.name,
        providerType: pq.provider.type,
        providerUrl: pq.provider.url,
        affiliateUrl: pq.provider.affiliateUrl,
        isAffiliate: pq.provider.isAffiliate,
        providerScore: pq.provider.score.value,
        providerLogo: pq.provider.logo.sm,
        
        quoteId: quote.quoteId,
        payinMethod: quote.payin,
        payinLabel: quote.payinLabel,
        payoutMethod: quote.payout,
        payoutLabel: quote.payoutLabel,
        
        receivedAmount: quote.receivedAmount,
        rate: quote.rate,
        fee: quote.fee.total,
        fxMarkupBps: quote.fxMarkupBps,
        totalCostUsd: quote.totalCostUsd,
        totalCostPercent: quote.totalCostPercent,
        
        transferTimeLabel: quote.transferTime.label,
        transferTimeHrs: quote.transferTime.maxHrs,
        
        rank: quote.rank,
        isCheapest: quote.bestFlags.cheapest,
        isFastest: quote.bestFlags.fastest,
        isTopRated: quote.bestFlags.topRated,
        isBestValue: quote.bestFlags.bestValue,
        
        hasPromo: quote.promos.length > 0,
        promoLabel: quote.promos[0]?.description,
        warnings: quote.warnings.map(w => w.text),
        valueProps: quote.valueProps,
      })
    }
  }
  
  return flattened.sort((a, b) => a.rank - b.rank)
}


