export type ProviderMetadata = {
  id: string
  slug: string
  name: string
  displayName: string
  type: 'ONLINE_MTO' | 'HYBRID_MTO' | 'BANK' | 'CRYPTO'
  url: string
  affiliateUrl: string | null
  isAffiliate: boolean
  logo: {
    sm: string
    ico: string
  }
  remitScore: number
  scoreBreakdown?: {
    deliveredValue: number
    reliability: number
    frictionSpeed: number
    supportRefunds: number
    trustSafety: number
  }
}

const PROVIDER_METADATA: Record<string, ProviderMetadata> = {
  wise: {
    id: 'wise',
    slug: 'wise',
    name: 'Wise',
    displayName: 'Wise',
    type: 'ONLINE_MTO',
    url: 'https://wise.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/wise.svg',
      ico: '/logos/wise.svg',
    },
    remitScore: 9.3,
    scoreBreakdown: {
      deliveredValue: 0.95,
      reliability: 0.95,
      frictionSpeed: 0.90,
      supportRefunds: 0.90,
      trustSafety: 0.95,
    },
  },
  remitly: {
    id: 'remitly',
    slug: 'remitly',
    name: 'Remitly',
    displayName: 'Remitly',
    type: 'ONLINE_MTO',
    url: 'https://www.remitly.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/remitly.svg',
      ico: '/logos/remitly.svg',
    },
    remitScore: 9.1,
    scoreBreakdown: {
      deliveredValue: 0.88,
      reliability: 0.88,
      frictionSpeed: 0.95,
      supportRefunds: 0.90,
      trustSafety: 0.88,
    },
  },
  worldremit: {
    id: 'worldremit',
    slug: 'worldremit',
    name: 'WorldRemit',
    displayName: 'WorldRemit',
    type: 'ONLINE_MTO',
    url: 'https://www.worldremit.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/worldremit.svg',
      ico: '/logos/worldremit.svg',
    },
    remitScore: 8.2,
    scoreBreakdown: {
      deliveredValue: 0.78,
      reliability: 0.82,
      frictionSpeed: 0.82,
      supportRefunds: 0.80,
      trustSafety: 0.82,
    },
  },
  westernunion: {
    id: 'westernunion',
    slug: 'western-union',
    name: 'Western Union',
    displayName: 'Western Union',
    type: 'HYBRID_MTO',
    url: 'https://www.westernunion.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/western-union.svg',
      ico: '/logos/western-union.svg',
    },
    remitScore: 8.2,
    scoreBreakdown: {
      deliveredValue: 0.78,
      reliability: 0.85,
      frictionSpeed: 0.85,
      supportRefunds: 0.80,
      trustSafety: 0.85,
    },
  },
  xe: {
    id: 'xe',
    slug: 'xe-money',
    name: 'XE Money',
    displayName: 'XE Money',
    type: 'ONLINE_MTO',
    url: 'https://www.xe.com/money-transfer',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/xe-money.svg',
      ico: '/logos/xe-money.svg',
    },
    remitScore: 8.7,
    scoreBreakdown: {
      deliveredValue: 0.85,
      reliability: 0.88,
      frictionSpeed: 0.80,
      supportRefunds: 0.85,
      trustSafety: 0.88,
    },
  },
  ria: {
    id: 'ria',
    slug: 'ria',
    name: 'RIA',
    displayName: 'RIA',
    type: 'HYBRID_MTO',
    url: 'https://www.riamoneytransfer.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/ria.svg',
      ico: '/logos/ria.svg',
    },
    remitScore: 8.0,
    scoreBreakdown: {
      deliveredValue: 0.75,
      reliability: 0.81,
      frictionSpeed: 0.77,
      supportRefunds: 0.76,
      trustSafety: 0.79,
    },
  },
  moneygram: {
    id: 'moneygram',
    slug: 'moneygram',
    name: 'MoneyGram',
    displayName: 'MoneyGram',
    type: 'HYBRID_MTO',
    url: 'https://www.moneygram.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/moneygram.svg',
      ico: '/logos/moneygram.svg',
    },
    remitScore: 8.4,
    scoreBreakdown: {
      deliveredValue: 0.80,
      reliability: 0.85,
      frictionSpeed: 0.85,
      supportRefunds: 0.80,
      trustSafety: 0.85,
    },
  },
}

export function getProviderMetadata(providerId: string): ProviderMetadata | null {
  const normalizedId = providerId.toLowerCase()
  return PROVIDER_METADATA[normalizedId] || null
}

export function getAllProviderMetadata(): ProviderMetadata[] {
  return Object.values(PROVIDER_METADATA)
}

export function getProviderMetadataBySlug(slug: string): ProviderMetadata | null {
  const entry = Object.values(PROVIDER_METADATA).find(p => p.slug === slug)
  return entry || null
}

