export type ProviderScoreBreakdown = {
  deliveredValue: number
  reliability: number
  frictionSpeed: number
  supportRefunds: number
  trustSafety: number
}

export type ProviderMetadata = {
  id: string
  slug: string
  name: string
  displayName?: string
  type: string
  url: string
  affiliateUrl?: string | null
  isAffiliate?: boolean
  logo?: { sm: string, ico: string }
  remitScore?: number
  scoreBreakdown?: ProviderScoreBreakdown
  rating?: number
  countries?: number
  speed?: string
  score?: number
  features?: string[]
}
