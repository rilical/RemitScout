export interface ProviderScore {
  id: string
  slug: string
  name: string
  remitScore: number
  scoreBreakdown?: {
    deliveredValue: number
    reliability: number
    frictionSpeed: number
    supportRefunds: number
    trustSafety: number
  }
}

export const PROVIDER_SCORES: Record<string, ProviderScore> = {
  wise: {
    id: 'wise',
    slug: 'wise',
    name: 'Wise',
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
    remitScore: 9.1,
    scoreBreakdown: {
      deliveredValue: 0.88,
      reliability: 0.88,
      frictionSpeed: 0.95,
      supportRefunds: 0.90,
      trustSafety: 0.88,
    },
  },
  sendwave: {
    id: 'sendwave',
    slug: 'sendwave',
    name: 'Sendwave',
    remitScore: 9.0,
    scoreBreakdown: {
      deliveredValue: 0.92,
      reliability: 0.90,
      frictionSpeed: 0.95,
      supportRefunds: 0.88,
      trustSafety: 0.88,
    },
  },
  'xe-money': {
    id: 'xe-money',
    slug: 'xe-money',
    name: 'XE Money',
    remitScore: 8.7,
    scoreBreakdown: {
      deliveredValue: 0.85,
      reliability: 0.88,
      frictionSpeed: 0.80,
      supportRefunds: 0.85,
      trustSafety: 0.88,
    },
  },
  xe: {
    id: 'xe',
    slug: 'xe-money',
    name: 'XE Money',
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
    remitScore: 8.6,
    scoreBreakdown: {
      deliveredValue: 0.85,
      reliability: 0.85,
      frictionSpeed: 0.88,
      supportRefunds: 0.85,
      trustSafety: 0.85,
    },
  },
  xoom: {
    id: 'xoom',
    slug: 'xoom',
    name: 'Xoom',
    remitScore: 8.5,
    scoreBreakdown: {
      deliveredValue: 0.82,
      reliability: 0.85,
      frictionSpeed: 0.85,
      supportRefunds: 0.85,
      trustSafety: 0.88,
    },
  },
  mukuru: {
    id: 'mukuru',
    slug: 'mukuru',
    name: 'Mukuru',
    remitScore: 8.4,
    scoreBreakdown: {
      deliveredValue: 0.80,
      reliability: 0.88,
      frictionSpeed: 0.85,
      supportRefunds: 0.82,
      trustSafety: 0.85,
    },
  },
  instarem: {
    id: 'instarem',
    slug: 'instarem',
    name: 'Instarem',
    remitScore: 8.4,
    scoreBreakdown: {
      deliveredValue: 0.82,
      reliability: 0.85,
      frictionSpeed: 0.85,
      supportRefunds: 0.82,
      trustSafety: 0.85,
    },
  },
  remitbee: {
    id: 'remitbee',
    slug: 'remitbee',
    name: 'RemitBee',
    remitScore: 8.3,
    scoreBreakdown: {
      deliveredValue: 0.80,
      reliability: 0.82,
      frictionSpeed: 0.78,
      supportRefunds: 0.80,
      trustSafety: 0.80,
    },
  },
  pangea: {
    id: 'pangea',
    slug: 'pangea',
    name: 'Pangea',
    remitScore: 8.3,
    scoreBreakdown: {
      deliveredValue: 0.80,
      reliability: 0.82,
      frictionSpeed: 0.82,
      supportRefunds: 0.80,
      trustSafety: 0.80,
    },
  },
  koronapay: {
    id: 'koronapay',
    slug: 'koronapay',
    name: 'KoronaPay',
    remitScore: 8.3,
    scoreBreakdown: {
      deliveredValue: 0.80,
      reliability: 0.82,
      frictionSpeed: 0.85,
      supportRefunds: 0.80,
      trustSafety: 0.80,
    },
  },
  'western-union': {
    id: 'western-union',
    slug: 'western-union',
    name: 'Western Union',
    remitScore: 8.2,
    scoreBreakdown: {
      deliveredValue: 0.78,
      reliability: 0.85,
      frictionSpeed: 0.85,
      supportRefunds: 0.80,
      trustSafety: 0.85,
    },
  },
  worldremit: {
    id: 'worldremit',
    slug: 'worldremit',
    name: 'WorldRemit',
    remitScore: 8.2,
    scoreBreakdown: {
      deliveredValue: 0.78,
      reliability: 0.82,
      frictionSpeed: 0.82,
      supportRefunds: 0.80,
      trustSafety: 0.82,
    },
  },
  ria: {
    id: 'ria',
    slug: 'ria',
    name: 'RIA',
    remitScore: 8.0,
    scoreBreakdown: {
      deliveredValue: 0.75,
      reliability: 0.81,
      frictionSpeed: 0.77,
      supportRefunds: 0.76,
      trustSafety: 0.79,
    },
  },
  singx: {
    id: 'singx',
    slug: 'singx',
    name: 'SingX',
    remitScore: 8.2,
    scoreBreakdown: {
      deliveredValue: 0.78,
      reliability: 0.80,
      frictionSpeed: 0.70,
      supportRefunds: 0.78,
      trustSafety: 0.82,
    },
  },
  wirebarley: {
    id: 'wirebarley',
    slug: 'wirebarley',
    name: 'WireBarley',
    remitScore: 8.2,
    scoreBreakdown: {
      deliveredValue: 0.78,
      reliability: 0.79,
      frictionSpeed: 0.78,
      supportRefunds: 0.78,
      trustSafety: 0.78,
    },
  },
  placid: {
    id: 'placid',
    slug: 'placid',
    name: 'Placid',
    remitScore: 8.2,
    scoreBreakdown: {
      deliveredValue: 0.78,
      reliability: 0.79,
      frictionSpeed: 0.78,
      supportRefunds: 0.78,
      trustSafety: 0.76,
    },
  },
  paysend: {
    id: 'paysend',
    slug: 'paysend',
    name: 'Paysend',
    remitScore: 8.1,
    scoreBreakdown: {
      deliveredValue: 0.77,
      reliability: 0.79,
      frictionSpeed: 0.78,
      supportRefunds: 0.78,
      trustSafety: 0.77,
    },
  },
  orbitremit: {
    id: 'orbitremit',
    slug: 'orbitremit',
    name: 'OrbitRemit',
    remitScore: 8.1,
    scoreBreakdown: {
      deliveredValue: 0.77,
      reliability: 0.79,
      frictionSpeed: 0.75,
      supportRefunds: 0.76,
      trustSafety: 0.78,
    },
  },
  'al-ansari-exchange': {
    id: 'al-ansari-exchange',
    slug: 'al-ansari-exchange',
    name: 'Al Ansari Exchange',
    remitScore: 7.9,
    scoreBreakdown: {
      deliveredValue: 0.73,
      reliability: 0.81,
      frictionSpeed: 0.73,
      supportRefunds: 0.76,
      trustSafety: 0.81,
    },
  },
}

export function getProviderScore(providerId: string): ProviderScore | null {
  return PROVIDER_SCORES[providerId.toLowerCase()] || null
}

export function getProviderScoreBySlug(slug: string): ProviderScore | null {
  const entry = Object.values(PROVIDER_SCORES).find(p => p.slug === slug)
  return entry || null
}

export function getAllProviderScores(): ProviderScore[] {
  return Object.values(PROVIDER_SCORES)
}
