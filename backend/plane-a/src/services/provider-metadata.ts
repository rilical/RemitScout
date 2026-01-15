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
    affiliateUrl: 'https://wise.prf.hn/click/camref:1110ldhTx/[p_id:1110l11228]',
    isAffiliate: true,
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
    affiliateUrl: 'https://remitly.tod8mp.net/3J6JYM',
    isAffiliate: true,
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
    affiliateUrl: 'https://worldremit.sjv.io/EErZ52',
    isAffiliate: true,
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
    affiliateUrl: 'https://xe-money-transfer.sjv.io/yqJqW3',
    isAffiliate: true,
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
  transfergo: {
    id: 'transfergo',
    slug: 'transfergo',
    name: 'TransferGo',
    displayName: 'TransferGo',
    type: 'ONLINE_MTO',
    url: 'https://www.transfergo.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/transfergo.svg',
      ico: '/logos/transfergo.svg',
    },
    remitScore: 8.6,
    scoreBreakdown: {
      deliveredValue: 0.85,
      reliability: 0.85,
      frictionSpeed: 0.88,
      supportRefunds: 0.85,
      trustSafety: 0.85,
    },
  },
  paysend: {
    id: 'paysend',
    slug: 'paysend',
    name: 'Paysend',
    displayName: 'Paysend',
    type: 'ONLINE_MTO',
    url: 'https://paysend.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/paysend.svg',
      ico: '/logos/paysend.svg',
    },
    remitScore: 8.1,
    scoreBreakdown: {
      deliveredValue: 0.77,
      reliability: 0.79,
      frictionSpeed: 0.78,
      supportRefunds: 0.78,
      trustSafety: 0.77,
    },
  },
  pangea: {
    id: 'pangea',
    slug: 'pangea',
    name: 'Pangea',
    displayName: 'Pangea',
    type: 'ONLINE_MTO',
    url: 'https://pangeamoneytransfer.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/png/SVG/PROVIDERS/PANGEA_LOGO.webp',
      ico: '/png/SVG/PROVIDERS/PANGEA_LOGO.webp',
    },
    remitScore: 8.3,
    scoreBreakdown: {
      deliveredValue: 0.80,
      reliability: 0.82,
      frictionSpeed: 0.82,
      supportRefunds: 0.80,
      trustSafety: 0.80,
    },
  },
  orbitremit: {
    id: 'orbitremit',
    slug: 'orbitremit',
    name: 'OrbitRemit',
    displayName: 'OrbitRemit',
    type: 'ONLINE_MTO',
    url: 'https://www.orbitremit.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/orbitremit.png',
      ico: '/logos/orbitremit.png',
    },
    remitScore: 8.1,
    scoreBreakdown: {
      deliveredValue: 0.77,
      reliability: 0.79,
      frictionSpeed: 0.75,
      supportRefunds: 0.76,
      trustSafety: 0.78,
    },
  },
  instarem: {
    id: 'instarem',
    slug: 'instarem',
    name: 'Instarem',
    displayName: 'Instarem',
    type: 'ONLINE_MTO',
    url: 'https://www.instarem.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/instarem.png',
      ico: '/logos/instarem.png',
    },
    remitScore: 8.4,
    scoreBreakdown: {
      deliveredValue: 0.82,
      reliability: 0.85,
      frictionSpeed: 0.85,
      supportRefunds: 0.82,
      trustSafety: 0.85,
    },
  },
  wirebarley: {
    id: 'wirebarley',
    slug: 'wirebarley',
    name: 'WireBarley',
    displayName: 'WireBarley',
    type: 'ONLINE_MTO',
    url: 'https://www.wirebarley.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/WIREBARELY_LOGO.PNG',
      ico: '/logos/WIREBARELY_LOGO.PNG',
    },
    remitScore: 8.2,
    scoreBreakdown: {
      deliveredValue: 0.78,
      reliability: 0.79,
      frictionSpeed: 0.78,
      supportRefunds: 0.78,
      trustSafety: 0.78,
    },
  },
  alansari: {
    id: 'alansari',
    slug: 'al-ansari-exchange',
    name: 'Al Ansari Exchange',
    displayName: 'Al Ansari Exchange',
    type: 'HYBRID_MTO',
    url: 'https://alansariexchange.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/alansari.png',
      ico: '/logos/alansari.png',
    },
    remitScore: 7.9,
    scoreBreakdown: {
      deliveredValue: 0.73,
      reliability: 0.81,
      frictionSpeed: 0.73,
      supportRefunds: 0.76,
      trustSafety: 0.81,
    },
  },
  intermex: {
    id: 'intermex',
    slug: 'intermex',
    name: 'Intermex',
    displayName: 'Intermex',
    type: 'HYBRID_MTO',
    url: 'https://www.intermexonline.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/intermex.svg',
      ico: '/logos/intermex.svg',
    },
    remitScore: 8.0,
    scoreBreakdown: {
      deliveredValue: 0.75,
      reliability: 0.80,
      frictionSpeed: 0.77,
      supportRefunds: 0.76,
      trustSafety: 0.79,
    },
  },
  koronapay: {
    id: 'koronapay',
    slug: 'koronapay',
    name: 'KoronaPay',
    displayName: 'KoronaPay',
    type: 'ONLINE_MTO',
    url: 'https://koronapay.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/koronapay.svg',
      ico: '/logos/koronapay.svg',
    },
    remitScore: 8.3,
    scoreBreakdown: {
      deliveredValue: 0.80,
      reliability: 0.82,
      frictionSpeed: 0.85,
      supportRefunds: 0.80,
      trustSafety: 0.80,
    },
  },
  remitbee: {
    id: 'remitbee',
    slug: 'remitbee',
    name: 'RemitBee',
    displayName: 'RemitBee',
    type: 'ONLINE_MTO',
    url: 'https://www.remitbee.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/remitbee.svg',
      ico: '/logos/remitbee.svg',
    },
    remitScore: 8.3,
    scoreBreakdown: {
      deliveredValue: 0.80,
      reliability: 0.82,
      frictionSpeed: 0.78,
      supportRefunds: 0.80,
      trustSafety: 0.80,
    },
  },
  singx: {
    id: 'singx',
    slug: 'singx',
    name: 'SingX',
    displayName: 'SingX',
    type: 'ONLINE_MTO',
    url: 'https://www.singx.co',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/png/SVG/PROVIDERS/SINGX_LOGO.png',
      ico: '/png/SVG/PROVIDERS/SINGX_LOGO.png',
    },
    remitScore: 8.2,
    scoreBreakdown: {
      deliveredValue: 0.78,
      reliability: 0.80,
      frictionSpeed: 0.70,
      supportRefunds: 0.78,
      trustSafety: 0.82,
    },
  },
  placid: {
    id: 'placid',
    slug: 'placid',
    name: 'Placid',
    displayName: 'Placid',
    type: 'ONLINE_MTO',
    url: 'https://www.placid.net',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/png/SVG/PROVIDERS/PLACID_LOGO.png',
      ico: '/png/SVG/PROVIDERS/PLACID_LOGO.png',
    },
    remitScore: 8.2,
    scoreBreakdown: {
      deliveredValue: 0.78,
      reliability: 0.79,
      frictionSpeed: 0.78,
      supportRefunds: 0.78,
      trustSafety: 0.76,
    },
  },
  xoom: {
    id: 'xoom',
    slug: 'xoom',
    name: 'Xoom',
    displayName: 'Xoom',
    type: 'ONLINE_MTO',
    url: 'https://www.xoom.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/xoom.svg',
      ico: '/logos/xoom.svg',
    },
    remitScore: 8.5,
    scoreBreakdown: {
      deliveredValue: 0.82,
      reliability: 0.85,
      frictionSpeed: 0.85,
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
  dahabshiil: {
    id: 'dahabshiil',
    slug: 'dahabshiil',
    name: 'Dahabshiil',
    displayName: 'Dahabshiil',
    type: 'HYBRID_MTO',
    url: 'https://www.dahabshiil.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/dahabshiil.svg',
      ico: '/logos/dahabshiil.svg',
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
  bossmoney: {
    id: 'bossmoney',
    slug: 'boss-money',
    name: 'Boss Money',
    displayName: 'Boss Money',
    type: 'ONLINE_MTO',
    url: 'https://www.bossmoney.com',
    affiliateUrl: 'https://www.awin1.com/cread.php?awinmid=119771&awinaffid=2726736',
    isAffiliate: true,
    logo: {
      sm: '/logos/boss-money.svg',
      ico: '/logos/boss-money.svg',
    },
    remitScore: 8.0,
  },
  sendwave: {
    id: 'sendwave',
    slug: 'sendwave',
    name: 'Sendwave',
    displayName: 'Sendwave',
    type: 'ONLINE_MTO',
    url: 'https://www.sendwave.com',
    affiliateUrl: 'https://sendwave.pxf.io/MAGAgq',
    isAffiliate: true,
    logo: {
      sm: '/logos/sendwave.svg',
      ico: '/logos/sendwave.svg',
    },
    remitScore: 8.8,
    scoreBreakdown: {
      deliveredValue: 0.9,
      reliability: 0.85,
      frictionSpeed: 0.9,
      supportRefunds: 0.8,
      trustSafety: 0.85,
    },
  },
  mukuru: {
    id: 'mukuru',
    slug: 'mukuru',
    name: 'Mukuru',
    displayName: 'Mukuru',
    type: 'HYBRID_MTO',
    url: 'https://www.mukuru.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/MUKURU_LOGO.PNG',
      ico: '/logos/MUKURU_LOGO.PNG',
    },
    remitScore: 8.1,
    scoreBreakdown: {
      deliveredValue: 0.78,
      reliability: 0.8,
      frictionSpeed: 0.77,
      supportRefunds: 0.77,
      trustSafety: 0.79,
    },
  },
  wellsfargo: {
    id: 'wellsfargo',
    slug: 'wells-fargo',
    name: 'Wells Fargo',
    displayName: 'Wells Fargo',
    type: 'HYBRID_MTO',
    url: 'https://www.wellsfargo.com/international-remittances/',
    affiliateUrl: null,
    isAffiliate: false,
    logo: {
      sm: '/logos/wellsfargo.svg',
      ico: '/logos/wellsfargo.svg',
    },
    remitScore: 7.6,
    scoreBreakdown: {
      deliveredValue: 0.7,
      reliability: 0.82,
      frictionSpeed: 0.7,
      supportRefunds: 0.72,
      trustSafety: 0.85,
    },
  },
}

const normalizeProviderKey = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '')

const PROVIDER_METADATA_BY_NORMALIZED_ID: Record<string, ProviderMetadata> = {}
const PROVIDER_METADATA_BY_NORMALIZED_SLUG: Record<string, ProviderMetadata> = {}

for (const metadata of Object.values(PROVIDER_METADATA)) {
  const normalizedId = normalizeProviderKey(metadata.id)
  if (normalizedId && !PROVIDER_METADATA_BY_NORMALIZED_ID[normalizedId]) {
    PROVIDER_METADATA_BY_NORMALIZED_ID[normalizedId] = metadata
  }

  const normalizedSlug = normalizeProviderKey(metadata.slug)
  if (normalizedSlug && !PROVIDER_METADATA_BY_NORMALIZED_SLUG[normalizedSlug]) {
    PROVIDER_METADATA_BY_NORMALIZED_SLUG[normalizedSlug] = metadata
  }
}

export function getProviderMetadata(providerId: string): ProviderMetadata | null {
  const normalizedRaw = providerId.toLowerCase()
  if (PROVIDER_METADATA[normalizedRaw]) {
    return PROVIDER_METADATA[normalizedRaw]
  }

  const normalizedKey = normalizeProviderKey(providerId)
  return PROVIDER_METADATA_BY_NORMALIZED_ID[normalizedKey]
    || PROVIDER_METADATA_BY_NORMALIZED_SLUG[normalizedKey]
    || null
}

export function getAllProviderMetadata(): ProviderMetadata[] {
  return Object.values(PROVIDER_METADATA)
}

export function getProviderMetadataBySlug(slug: string): ProviderMetadata | null {
  const normalizedKey = normalizeProviderKey(slug)
  return PROVIDER_METADATA_BY_NORMALIZED_SLUG[normalizedKey] || null
}
