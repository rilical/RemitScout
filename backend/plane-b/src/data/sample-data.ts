export const rightsMatrix = [
  { providerId: 'wise', allowedCollect: true, allowedB2c: true, allowedB2b: true, notes: 'Primary aggregator source.' },
  { providerId: 'remitly', allowedCollect: true, allowedB2c: true, allowedB2b: false, notes: 'B2C only.' },
  { providerId: 'xoom', allowedCollect: true, allowedB2c: true, allowedB2b: false, notes: 'B2C only.' },
  { providerId: 'worldremit', allowedCollect: false, allowedB2c: false, allowedB2b: false, notes: 'Pending approval.' },
]

export const providers = [
  {
    id: 'wise',
    name: 'Wise',
    logoUrl: 'https://logo.clearbit.com/wise.com',
    reliability: 0.98,
    methods: ['bank', 'wallet', 'card'],
    bestFor: 'Best delivered value',
    homepageUrl: 'https://wise.com',
  },
  {
    id: 'remitly',
    name: 'Remitly',
    logoUrl: 'https://logo.clearbit.com/remitly.com',
    reliability: 0.96,
    methods: ['bank', 'wallet', 'cash', 'card'],
    bestFor: 'Fast delivery',
    homepageUrl: 'https://www.remitly.com',
  },
  {
    id: 'xoom',
    name: 'Xoom',
    logoUrl: 'https://logo.clearbit.com/xoom.com',
    reliability: 0.94,
    methods: ['bank', 'cash', 'card'],
    bestFor: 'Cash pickup coverage',
    homepageUrl: 'https://www.xoom.com',
  },
]

export const corridors = [
  {
    id: 'US-PH',
    fromCountry: 'US',
    toCountry: 'PH',
    sendCurrency: 'USD',
    recvCurrency: 'PHP',
    label: 'US to Philippines',
  },
  {
    id: 'US-MX',
    fromCountry: 'US',
    toCountry: 'MX',
    sendCurrency: 'USD',
    recvCurrency: 'MXN',
    label: 'US to Mexico',
  },
]

export const providerQuotes = [
  {
    providerId: 'wise',
    corridorId: 'US-PH',
    fee: 4.99,
    marginPct: 0.018,
    fxRate: 55.12,
    delivery: 'Same day',
    reliability: 0.98,
    methods: ['bank', 'wallet', 'card'],
    bestFor: 'Best delivered value',
  },
  {
    providerId: 'remitly',
    corridorId: 'US-PH',
    fee: 3.99,
    marginPct: 0.021,
    fxRate: 54.84,
    delivery: '15-30 min',
    reliability: 0.96,
    methods: ['bank', 'wallet', 'cash', 'card'],
    bestFor: 'Speed',
  },
  {
    providerId: 'xoom',
    corridorId: 'US-PH',
    fee: 5.99,
    marginPct: 0.026,
    fxRate: 54.2,
    delivery: 'Minutes',
    reliability: 0.94,
    methods: ['bank', 'cash', 'card'],
    bestFor: 'Cash pickup',
  },
  {
    providerId: 'wise',
    corridorId: 'US-MX',
    fee: 5.49,
    marginPct: 0.016,
    fxRate: 17.12,
    delivery: 'Same day',
    reliability: 0.98,
    methods: ['bank', 'wallet', 'card'],
    bestFor: 'Best delivered value',
  },
  {
    providerId: 'remitly',
    corridorId: 'US-MX',
    fee: 2.99,
    marginPct: 0.02,
    fxRate: 16.98,
    delivery: 'Same day',
    reliability: 0.96,
    methods: ['bank', 'wallet', 'cash', 'card'],
    bestFor: 'Speed',
  },
]

export const fxRates = [
  { base: 'USD', quote: 'PHP', rate: 55.9 },
  { base: 'USD', quote: 'MXN', rate: 17.4 },
]

export const fxProviderRates = [
  { providerName: 'Wise', base: 'USD', quote: 'PHP', rate: 55.12, markupBps: 180, speed: 'Same day' },
  { providerName: 'Remitly', base: 'USD', quote: 'PHP', rate: 54.84, markupBps: 210, speed: '15-30 min' },
  { providerName: 'Xoom', base: 'USD', quote: 'PHP', rate: 54.2, markupBps: 260, speed: 'Minutes' },
  { providerName: 'Wise', base: 'USD', quote: 'MXN', rate: 17.12, markupBps: 160, speed: 'Same day' },
  { providerName: 'Remitly', base: 'USD', quote: 'MXN', rate: 16.98, markupBps: 200, speed: 'Same day' },
]

export const popularCorridors = [
  {
    route: 'US->PH',
    count24h: 1280,
    topProvider: 'Wise',
    feeRange: '$3.99-$5.99',
    speedRange: '15 min - 2 days',
    bestFor: 'Balance of cost + speed',
  },
  {
    route: 'US->MX',
    count24h: 960,
    topProvider: 'Remitly',
    feeRange: '$2.99-$5.49',
    speedRange: 'Same day',
    bestFor: 'Fast delivery',
  },
]

export const countries = [
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'PH', name: 'Philippines', currency: 'PHP' },
  { code: 'MX', name: 'Mexico', currency: 'MXN' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN' },
]
