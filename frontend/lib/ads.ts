export type AdPlacement =
  | 'compare_inline'
  | 'compare_sidebar'
  | 'dashboard_inline'
  | 'blog_sidebar'
  | 'blog_inline'
  | 'blog_banner'

export type AdLayout = 'horizontal' | 'vertical' | 'compact'

export type AdCreative = {
  id: string
  name: string
  tagline: string
  brandColor: string
  url: string
  ctaText?: string
  rating?: number
  reviewCount?: string
  logoLetter?: string
  placements: AdPlacement[]
  weight?: number
  isAffiliate?: boolean
  label?: string
  kind?: 'sponsored' | 'house'
  startAt?: string
  endAt?: string
  providerId?: string
}

export type PlacementConfig = {
  layout: AdLayout
  containerClass?: string
  label?: string
  showRemoveLink?: boolean
}

const PLACEMENT_CONFIG: Record<AdPlacement, PlacementConfig> = {
  compare_inline: {
    layout: 'horizontal',
    containerClass: 'shadow-sm',
    showRemoveLink: true,
  },
  compare_sidebar: {
    layout: 'vertical',
    containerClass: 'shadow-sm',
    showRemoveLink: true,
  },
  dashboard_inline: {
    layout: 'horizontal',
    containerClass: 'shadow-sm',
    showRemoveLink: true,
  },
  blog_sidebar: {
    layout: 'vertical',
    containerClass: 'shadow-sm',
    showRemoveLink: false,
  },
  blog_inline: {
    layout: 'horizontal',
    containerClass: 'shadow-sm',
    showRemoveLink: false,
  },
  blog_banner: {
    layout: 'horizontal',
    containerClass: 'shadow-sm',
    showRemoveLink: false,
  },
}

// Add paid sponsor creatives here when available.
const PAID_ADS: AdCreative[] = []

const HOUSE_ADS: AdCreative[] = [
  {
    id: 'rs-plus',
    name: 'Remit-Scout Plus',
    tagline: 'Ad-free comparisons, unlimited alerts, and longer history windows.',
    brandColor: '#2563EB',
    url: '/plus',
    ctaText: 'Upgrade',
    logoLetter: 'R',
    placements: [
      'compare_inline',
      'compare_sidebar',
      'dashboard_inline',
      'blog_sidebar',
      'blog_inline',
      'blog_banner',
    ],
    kind: 'house',
    weight: 1,
    isAffiliate: false,
  },
]

const isWithinWindow = (ad: AdCreative, now: Date) => {
  const start = ad.startAt ? new Date(ad.startAt) : null
  const end = ad.endAt ? new Date(ad.endAt) : null
  if (start && now < start) return false
  if (end && now > end) return false
  return true
}

const filterByPlacement = (ads: AdCreative[], placement: AdPlacement, now: Date) => {
  return ads.filter((ad) => ad.placements.includes(placement) && isWithinWindow(ad, now))
}

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

const pickWeighted = (ads: AdCreative[], seed: string) => {
  const totalWeight = ads.reduce((sum, ad) => sum + (ad.weight ?? 1), 0)
  if (totalWeight <= 0) {
    return ads[0]
  }
  const target = hashString(seed) % totalWeight
  let cursor = 0
  for (const ad of ads) {
    cursor += ad.weight ?? 1
    if (target < cursor) {
      return ad
    }
  }
  return ads[0]
}

export const getPlacementConfig = (placement: AdPlacement): PlacementConfig => {
  return PLACEMENT_CONFIG[placement]
}

export const pickAdForPlacement = (
  placement: AdPlacement,
  seed: string,
  options?: { allowHouseAds?: boolean },
): AdCreative | null => {
  const now = new Date()
  let candidates = filterByPlacement(PAID_ADS, placement, now)
  if (!candidates.length && options?.allowHouseAds !== false) {
    candidates = filterByPlacement(HOUSE_ADS, placement, now)
  }
  if (!candidates.length) return null
  return pickWeighted(candidates, seed || placement)
}
