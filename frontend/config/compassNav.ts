export interface NavChip {
  label: string
  href: string
}

export interface NavGuide {
  label: string
  href: string
}

export interface NavLocal {
  label: string
  href: string
  dynamic?: boolean
}

export interface NavTab {
  id: string
  label: string
  tagline: string
  primary: {
    label: string
    href: string
  }
  chips: NavChip[]
  guides: NavGuide[]
  local: NavLocal[]
  icon?: string
}

export const compassNav: NavTab[] = [
  {
    id: 'move-money',
    label: 'Move Money',
    tagline: 'Get the most pesos for your yuan.',
    icon: '💸',
    primary: {
      label: 'Compare providers',
      href: '/compare'
    },
    chips: [
      { label: 'US → PH', href: '/send-money/us-to-ph' },
      { label: 'US → IN', href: '/send-money/us-to-in' },
      { label: 'GB → PK', href: '/send-money/gb-to-pk' },
      { label: 'EU → MA', href: '/send-money/eu-to-ma' }
    ],
    guides: [
      { label: 'Beat the FX spread', href: '/guides/fees-vs-exchange-rate' },
      { label: 'When to use cash pickup', href: '/guides/cash-vs-bank' },
      { label: 'Wallet vs bank deposit', href: '/guides/mobile-wallets' },
      { label: 'Remit-Score decoded', href: '/about/methodology' },
      { label: 'Hidden fees to watch for', href: '/guides/hidden-fees' },
      { label: 'Best time to send money', href: '/guides/timing' }
    ],
    local: [
      { label: 'Best eSIMs for {{country}}', href: '/connect/esim/{{countrySlug}}', dynamic: true },
      { label: 'Expat health insurance in {{country}}', href: '/cover/{{countrySlug}}', dynamic: true },
      { label: 'Open an account from abroad', href: '/bank/open-from-abroad' }
    ]
  },
  {
    id: 'bank-smarter',
    label: 'Bank Smarter',
    tagline: 'Accounts that travel with you.',
    icon: '🏦',
    primary: {
      label: 'Compare neobanks',
      href: '/bank/compare'
    },
    chips: [
      { label: 'Multi-currency', href: '/bank/multi-currency' },
      { label: 'Cards & ATMs', href: '/bank/cards-atm' },
      { label: 'SEPA vs SWIFT', href: '/bank/sepa-vs-swift' },
      { label: 'Virtual IBANs', href: '/bank/virtual-ibans' }
    ],
    guides: [
      { label: 'Open from abroad (KYC)', href: '/guides/open-account-from-abroad' },
      { label: 'ATM fees abroad explained', href: '/guides/atm-fees' },
      { label: 'Virtual IBANs 101', href: '/guides/virtual-ibans' },
      { label: 'Salary routing for expats', href: '/guides/salary-routing' },
      { label: 'Currency cards compared', href: '/guides/currency-cards' }
    ],
    local: [
      { label: 'Banks friendly to {{country}} IDs', href: '/bank/{{countrySlug}}', dynamic: true },
      { label: 'Local payment methods', href: '/guides/local-payments' },
      { label: 'Tax implications by country', href: '/guides/tax-banking' }
    ]
  },
  {
    id: 'stay-connected',
    label: 'Stay Connected',
    tagline: 'Signal before suitcase.',
    icon: '📱',
    primary: {
      label: 'Find an eSIM',
      href: '/connect/esim/compare'
    },
    chips: [
      { label: 'Long-stay eSIMs', href: '/connect/esim/long-stay' },
      { label: 'Tourist eSIMs', href: '/connect/esim/tourist' },
      { label: 'Device compatibility', href: '/connect/esim/devices' },
      { label: 'Regional plans', href: '/connect/esim/regional' }
    ],
    guides: [
      { label: 'Tethering & fair use', href: '/guides/esim-fair-use' },
      { label: 'Hotspot legality by country', href: '/guides/hotspot' },
      { label: 'Data budgeting abroad', href: '/guides/data-budget' },
      { label: 'eSIM vs physical SIM', href: '/guides/esim-vs-sim' },
      { label: 'Device setup guides', href: '/guides/esim-setup' }
    ],
    local: [
      { label: 'Best eSIMs in {{country}}', href: '/connect/esim/{{countrySlug}}', dynamic: true },
      { label: 'Network coverage maps', href: '/connect/coverage' },
      { label: 'VPN legality in {{country}}', href: '/guides/vpn/{{countrySlug}}', dynamic: true }
    ]
  },
  {
    id: 'get-covered',
    label: 'Get Covered',
    tagline: 'Insurance that actually pays.',
    icon: '🛡️',
    primary: {
      label: 'Compare insurance',
      href: '/cover/compare'
    },
    chips: [
      { label: 'Expat health', href: '/cover/expat' },
      { label: 'Travel insurance', href: '/cover/travel' },
      { label: 'Visa letters', href: '/cover/visa-letters' },
      { label: 'Emergency coverage', href: '/cover/emergency' }
    ],
    guides: [
      { label: 'Deductible vs copay explained', href: '/guides/deductible-vs-copay' },
      { label: 'Pre-existing conditions', href: '/guides/preexisting' },
      { label: 'How claims get paid', href: '/guides/claims' },
      { label: 'Insurance for digital nomads', href: '/guides/nomad-insurance' },
      { label: 'Medical evacuation coverage', href: '/guides/evacuation' }
    ],
    local: [
      { label: 'Plans accepted in {{country}}', href: '/cover/{{countrySlug}}', dynamic: true },
      { label: 'Healthcare system in {{country}}', href: '/guides/healthcare/{{countrySlug}}', dynamic: true },
      { label: 'Emergency numbers worldwide', href: '/cover/emergency-numbers' }
    ]
  },
  {
    id: 'settle-in',
    label: 'Settle In',
    tagline: 'Real-life checklists for day 1, 30, 90.',
    icon: '🏡',
    primary: {
      label: 'Country playbooks',
      href: '/destinations'
    },
    chips: [
      { label: 'Arrival checklist', href: '/guides/checklists/arrival' },
      { label: 'Month-1 setup', href: '/guides/checklists/month-1' },
      { label: 'TV & VPN legality', href: '/guides/tv-vpn' },
      { label: 'Expat communities', href: '/community' }
    ],
    guides: [
      { label: 'Renting without credit history', href: '/guides/renting' },
      { label: 'Local payments (Pix, UPI, etc.)', href: '/guides/local-payments' },
      { label: 'Registering with authorities', href: '/guides/registration' },
      { label: 'Getting a local phone number', href: '/guides/phone-number' },
      { label: 'Language & cultural tips', href: '/guides/culture' }
    ],
    local: [
      { label: '{{country}} starter kit', href: '/destinations/{{countrySlug}}', dynamic: true },
      { label: 'Cost of living in {{country}}', href: '/guides/cost-of-living/{{countrySlug}}', dynamic: true },
      { label: 'Expat taxes in {{country}}', href: '/guides/taxes/{{countrySlug}}', dynamic: true }
    ]
  }
]

export const quickTools = [
  { label: 'Rate Alerts', href: '/tools/rate-alerts', icon: '🔔' },
  { label: 'FX Calculator', href: '/tools/calculator', icon: '🧮' },
  { label: 'Remit-Score', href: '/about/remit-score', icon: '⭐' },
  { label: 'ATM Map', href: '/tools/atm-map', icon: '🗺️' },
  { label: 'Provider Finder', href: '/tools/provider-finder', icon: '🔍' },
  { label: 'Coverage Checker', href: '/tools/coverage-checker', icon: '✅' }
]



