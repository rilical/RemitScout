type RightsMatrixEntry = {
  providerId: string
  allowedCollect: boolean
  allowedB2c: boolean
  allowedB2b: boolean
  notes: string
}

type ProviderSeed = {
  id: string
  name: string
  logoUrl: string
  reliability: number
  methods: string[]
  bestFor: string
  homepageUrl: string
}

type CountrySeed = {
  code: string
  name: string
  currency: string
}

type CorridorSeed = {
  id: string
  fromCountry: string
  toCountry: string
  sendCurrency: string
  recvCurrency: string
  label: string
}

type ProviderQuoteSeed = {
  providerId: string
  corridorId: string
  fee: number
  marginPct: number
  fxRate: number
  delivery: string
  reliability: number
  methods: string[]
  bestFor: string
  payinMethod?: string
  payoutMethod?: string
  promotionalRate?: number | null
  baseRate?: number | null
  promotionalCapAmount?: number | null
}

type FxRateSeed = {
  base: string
  quote: string
  rate: number
}

type FxProviderRateSeed = {
  providerName: string
  base: string
  quote: string
  rate: number
  markupBps: number
  speed: string
}

type PopularCorridorSeed = {
  route: string
  count24h: number
  topProvider: string
  feeRange: string
  speedRange: string
  bestFor: string
}

const countryCatalog: Record<string, CountrySeed> = {
  US: { code: 'US', name: 'United States', currency: 'USD' },
  PH: { code: 'PH', name: 'Philippines', currency: 'PHP' },
  MX: { code: 'MX', name: 'Mexico', currency: 'MXN' },
  IN: { code: 'IN', name: 'India', currency: 'INR' },
  NG: { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  GB: { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  CA: { code: 'CA', name: 'Canada', currency: 'CAD' },
  AU: { code: 'AU', name: 'Australia', currency: 'AUD' },
  SG: { code: 'SG', name: 'Singapore', currency: 'SGD' },
}

type CountryCode = keyof typeof countryCatalog

const buildCorridor = (from: CountryCode, to: CountryCode): CorridorSeed => {
  const fromCountry = countryCatalog[from]
  const toCountry = countryCatalog[to]
  return {
    id: `${from}-${to}-${fromCountry.currency}-${toCountry.currency}`,
    fromCountry: from,
    toCountry: to,
    sendCurrency: fromCountry.currency,
    recvCurrency: toCountry.currency,
    label: `${fromCountry.name} to ${toCountry.name}`,
  }
}

export const corridors: CorridorSeed[] = [
  buildCorridor('US', 'PH'),
  buildCorridor('US', 'MX'),
  buildCorridor('US', 'IN'),
  buildCorridor('US', 'NG'),
  buildCorridor('GB', 'IN'),
  buildCorridor('GB', 'NG'),
  buildCorridor('CA', 'IN'),
  buildCorridor('CA', 'PH'),
  buildCorridor('AU', 'IN'),
  buildCorridor('SG', 'IN'),
]

export const providers: ProviderSeed[] = [
  {
    id: 'wise',
    name: 'Wise',
    logoUrl: 'https://logo.clearbit.com/wise.com',
    reliability: 0.98,
    methods: ['bank_transfer', 'debit_card', 'credit_card'],
    bestFor: 'Best delivered value',
    homepageUrl: 'https://wise.com',
  },
  {
    id: 'remitly',
    name: 'Remitly',
    logoUrl: 'https://logo.clearbit.com/remitly.com',
    reliability: 0.96,
    methods: ['bank_transfer', 'debit_card', 'credit_card', 'cash_pickup', 'mobile_wallet'],
    bestFor: 'Fast delivery',
    homepageUrl: 'https://www.remitly.com',
  },
  {
    id: 'westernunion',
    name: 'Western Union',
    logoUrl: 'https://logo.clearbit.com/westernunion.com',
    reliability: 0.95,
    methods: ['cash_pickup', 'bank_transfer', 'debit_card', 'credit_card'],
    bestFor: 'Cash pickup reach',
    homepageUrl: 'https://www.westernunion.com',
  },
  {
    id: 'worldremit',
    name: 'WorldRemit',
    logoUrl: 'https://logo.clearbit.com/worldremit.com',
    reliability: 0.94,
    methods: ['bank_transfer', 'debit_card', 'cash_pickup', 'mobile_wallet'],
    bestFor: 'Global corridors',
    homepageUrl: 'https://www.worldremit.com',
  },
  {
    id: 'xe',
    name: 'Xe',
    logoUrl: 'https://logo.clearbit.com/xe.com',
    reliability: 0.97,
    methods: ['bank_transfer'],
    bestFor: 'B2B rate depth',
    homepageUrl: 'https://www.xe.com',
  },
]

export const rightsMatrix: RightsMatrixEntry[] = [
  { providerId: 'wise', allowedCollect: true, allowedB2c: true, allowedB2b: true, notes: 'Seed S3.0 defaults.' },
  { providerId: 'remitly', allowedCollect: true, allowedB2c: true, allowedB2b: true, notes: 'Seed S3.0 defaults.' },
  { providerId: 'westernunion', allowedCollect: true, allowedB2c: true, allowedB2b: true, notes: 'Seed S3.0 defaults.' },
  { providerId: 'worldremit', allowedCollect: true, allowedB2c: true, allowedB2b: true, notes: 'Seed S3.0 defaults.' },
  { providerId: 'xe', allowedCollect: true, allowedB2c: true, allowedB2b: true, notes: 'Seed S3.0 defaults.' },
]

const midRates: Record<string, number> = {
  'USD-PHP': 56.2,
  'USD-MXN': 17.3,
  'USD-INR': 83.0,
  'USD-NGN': 1500,
  'GBP-INR': 105.5,
  'GBP-NGN': 1900,
  'CAD-INR': 61.0,
  'CAD-PHP': 41.5,
  'AUD-INR': 55.5,
  'SGD-INR': 62.0,
}

const providerById: Record<string, ProviderSeed> = Object.fromEntries(
  providers.map(provider => [provider.id, provider]),
)
const corridorById: Record<string, CorridorSeed> = Object.fromEntries(
  corridors.map(corridor => [corridor.id, corridor]),
)

const computeMarginPct = (corridorId: string, providerRate: number) => {
  const corridor = corridorById[corridorId]
  if (!corridor) return 0
  const midRate = midRates[`${corridor.sendCurrency}-${corridor.recvCurrency}`]
  if (!midRate) return 0
  return Number(((midRate - providerRate) / midRate).toFixed(4))
}

const buildQuote = (input: {
  providerId: string
  corridorId: string
  fee: number
  fxRate: number
  delivery: string
  payinMethod: string
  payoutMethod: string
  methods?: string[]
  reliability?: number
  bestFor?: string
  promotionalRate?: number
  baseRate?: number
  promotionalCapAmount?: number
}): ProviderQuoteSeed => {
  const provider = providerById[input.providerId]
  const marginPct = computeMarginPct(input.corridorId, input.fxRate)
  return {
    providerId: input.providerId,
    corridorId: input.corridorId,
    fee: input.fee,
    marginPct,
    fxRate: input.fxRate,
    delivery: input.delivery,
    reliability: input.reliability ?? provider?.reliability ?? 0.9,
    methods: input.methods ?? provider?.methods ?? [],
    bestFor: input.bestFor ?? provider?.bestFor ?? '',
    payinMethod: input.payinMethod,
    payoutMethod: input.payoutMethod,
    promotionalRate: input.promotionalRate ?? null,
    baseRate: input.baseRate ?? (input.promotionalRate ? input.fxRate : null),
    promotionalCapAmount: input.promotionalCapAmount ?? null,
  }
}

export const providerQuotes: ProviderQuoteSeed[] = [
  buildQuote({
    providerId: 'remitly',
    corridorId: 'US-PH-USD-PHP',
    fee: 3.99,
    fxRate: 55.0,
    delivery: '15-30 min',
    payinMethod: 'debit_card',
    payoutMethod: 'cash_pickup',
    promotionalRate: 56.3,
    promotionalCapAmount: 1000,
  }),
  buildQuote({
    providerId: 'wise',
    corridorId: 'US-PH-USD-PHP',
    fee: 2.99,
    fxRate: 55.6,
    delivery: 'Same day',
    payinMethod: 'bank_transfer',
    payoutMethod: 'bank_deposit',
  }),
  buildQuote({
    providerId: 'westernunion',
    corridorId: 'US-PH-USD-PHP',
    fee: 4.99,
    fxRate: 54.4,
    delivery: 'Minutes',
    payinMethod: 'debit_card',
    payoutMethod: 'cash_pickup',
  }),
  buildQuote({
    providerId: 'worldremit',
    corridorId: 'US-PH-USD-PHP',
    fee: 3.49,
    fxRate: 54.8,
    delivery: 'Minutes',
    payinMethod: 'debit_card',
    payoutMethod: 'mobile_wallet',
  }),
  buildQuote({
    providerId: 'remitly',
    corridorId: 'US-MX-USD-MXN',
    fee: 2.99,
    fxRate: 16.95,
    delivery: 'Same day',
    payinMethod: 'bank_transfer',
    payoutMethod: 'bank_deposit',
    promotionalRate: 17.2,
    promotionalCapAmount: 1000,
  }),
  buildQuote({
    providerId: 'wise',
    corridorId: 'US-MX-USD-MXN',
    fee: 2.49,
    fxRate: 17.08,
    delivery: 'Same day',
    payinMethod: 'bank_transfer',
    payoutMethod: 'bank_deposit',
  }),
  buildQuote({
    providerId: 'westernunion',
    corridorId: 'US-MX-USD-MXN',
    fee: 5.49,
    fxRate: 16.75,
    delivery: 'Minutes',
    payinMethod: 'debit_card',
    payoutMethod: 'cash_pickup',
  }),
  buildQuote({
    providerId: 'remitly',
    corridorId: 'US-IN-USD-INR',
    fee: 3.49,
    fxRate: 81.2,
    delivery: 'Same day',
    payinMethod: 'debit_card',
    payoutMethod: 'bank_deposit',
    promotionalRate: 82.5,
    promotionalCapAmount: 1000,
  }),
  buildQuote({
    providerId: 'wise',
    corridorId: 'US-IN-USD-INR',
    fee: 2.99,
    fxRate: 82.1,
    delivery: 'Same day',
    payinMethod: 'bank_transfer',
    payoutMethod: 'bank_deposit',
  }),
  buildQuote({
    providerId: 'xe',
    corridorId: 'US-IN-USD-INR',
    fee: 0,
    fxRate: 82.4,
    delivery: 'Same day',
    payinMethod: 'bank_transfer',
    payoutMethod: 'bank_deposit',
  }),
  buildQuote({
    providerId: 'remitly',
    corridorId: 'US-NG-USD-NGN',
    fee: 3.99,
    fxRate: 1465,
    delivery: 'Minutes',
    payinMethod: 'debit_card',
    payoutMethod: 'cash_pickup',
  }),
  buildQuote({
    providerId: 'westernunion',
    corridorId: 'US-NG-USD-NGN',
    fee: 6.49,
    fxRate: 1435,
    delivery: 'Minutes',
    payinMethod: 'debit_card',
    payoutMethod: 'cash_pickup',
  }),
  buildQuote({
    providerId: 'worldremit',
    corridorId: 'US-NG-USD-NGN',
    fee: 4.99,
    fxRate: 1450,
    delivery: 'Minutes',
    payinMethod: 'debit_card',
    payoutMethod: 'mobile_wallet',
  }),
  buildQuote({
    providerId: 'remitly',
    corridorId: 'GB-IN-GBP-INR',
    fee: 2.99,
    fxRate: 103.0,
    delivery: 'Same day',
    payinMethod: 'debit_card',
    payoutMethod: 'bank_deposit',
    promotionalRate: 104.4,
    promotionalCapAmount: 750,
  }),
  buildQuote({
    providerId: 'wise',
    corridorId: 'GB-IN-GBP-INR',
    fee: 2.49,
    fxRate: 104.2,
    delivery: 'Same day',
    payinMethod: 'bank_transfer',
    payoutMethod: 'bank_deposit',
  }),
  buildQuote({
    providerId: 'xe',
    corridorId: 'GB-IN-GBP-INR',
    fee: 0,
    fxRate: 104.6,
    delivery: 'Same day',
    payinMethod: 'bank_transfer',
    payoutMethod: 'bank_deposit',
  }),
  buildQuote({
    providerId: 'remitly',
    corridorId: 'GB-NG-GBP-NGN',
    fee: 3.49,
    fxRate: 1855,
    delivery: 'Minutes',
    payinMethod: 'debit_card',
    payoutMethod: 'cash_pickup',
  }),
  buildQuote({
    providerId: 'westernunion',
    corridorId: 'GB-NG-GBP-NGN',
    fee: 6.99,
    fxRate: 1805,
    delivery: 'Minutes',
    payinMethod: 'debit_card',
    payoutMethod: 'cash_pickup',
  }),
  buildQuote({
    providerId: 'remitly',
    corridorId: 'CA-IN-CAD-INR',
    fee: 3.49,
    fxRate: 59.6,
    delivery: 'Same day',
    payinMethod: 'debit_card',
    payoutMethod: 'bank_deposit',
    promotionalRate: 60.4,
    promotionalCapAmount: 700,
  }),
  buildQuote({
    providerId: 'wise',
    corridorId: 'CA-IN-CAD-INR',
    fee: 2.99,
    fxRate: 60.3,
    delivery: 'Same day',
    payinMethod: 'bank_transfer',
    payoutMethod: 'bank_deposit',
  }),
  buildQuote({
    providerId: 'xe',
    corridorId: 'CA-IN-CAD-INR',
    fee: 0,
    fxRate: 60.5,
    delivery: 'Same day',
    payinMethod: 'bank_transfer',
    payoutMethod: 'bank_deposit',
  }),
  buildQuote({
    providerId: 'remitly',
    corridorId: 'CA-PH-CAD-PHP',
    fee: 3.99,
    fxRate: 40.6,
    delivery: 'Minutes',
    payinMethod: 'debit_card',
    payoutMethod: 'mobile_wallet',
    promotionalRate: 41.2,
    promotionalCapAmount: 600,
  }),
  buildQuote({
    providerId: 'worldremit',
    corridorId: 'CA-PH-CAD-PHP',
    fee: 4.49,
    fxRate: 40.1,
    delivery: 'Minutes',
    payinMethod: 'debit_card',
    payoutMethod: 'cash_pickup',
  }),
  buildQuote({
    providerId: 'remitly',
    corridorId: 'AU-IN-AUD-INR',
    fee: 2.99,
    fxRate: 54.3,
    delivery: 'Same day',
    payinMethod: 'debit_card',
    payoutMethod: 'bank_deposit',
  }),
  buildQuote({
    providerId: 'xe',
    corridorId: 'AU-IN-AUD-INR',
    fee: 0,
    fxRate: 54.9,
    delivery: 'Same day',
    payinMethod: 'bank_transfer',
    payoutMethod: 'bank_deposit',
  }),
  buildQuote({
    providerId: 'remitly',
    corridorId: 'SG-IN-SGD-INR',
    fee: 2.49,
    fxRate: 60.9,
    delivery: 'Same day',
    payinMethod: 'debit_card',
    payoutMethod: 'bank_deposit',
  }),
  buildQuote({
    providerId: 'xe',
    corridorId: 'SG-IN-SGD-INR',
    fee: 0,
    fxRate: 61.5,
    delivery: 'Same day',
    payinMethod: 'bank_transfer',
    payoutMethod: 'bank_deposit',
  }),
]

export const fxRates: FxRateSeed[] = Object.entries(midRates).map(([pair, rate]) => {
  const [base, quote] = pair.split('-')
  return { base, quote, rate }
})

export const fxProviderRates: FxProviderRateSeed[] = providerQuotes.map(quote => {
  const corridor = corridorById[quote.corridorId]
  const provider = providerById[quote.providerId]
  const markupBps = Math.round(quote.marginPct * 10000)
  return {
    providerName: provider?.name ?? quote.providerId,
    base: corridor?.sendCurrency ?? '',
    quote: corridor?.recvCurrency ?? '',
    rate: quote.fxRate,
    markupBps,
    speed: quote.delivery,
  }
})

export const popularCorridors: PopularCorridorSeed[] = [
  {
    route: 'US->PH',
    count24h: 1820,
    topProvider: 'Remitly',
    feeRange: '$2.99-$4.99',
    speedRange: '15 min - Same day',
    bestFor: 'Speed with promo rates',
  },
  {
    route: 'US->MX',
    count24h: 1500,
    topProvider: 'Wise',
    feeRange: '$2.49-$5.49',
    speedRange: 'Minutes - Same day',
    bestFor: 'Best delivered value',
  },
  {
    route: 'GB->IN',
    count24h: 940,
    topProvider: 'Wise',
    feeRange: '$2.49-$2.99',
    speedRange: 'Same day',
    bestFor: 'Lower markup',
  },
  {
    route: 'US->NG',
    count24h: 720,
    topProvider: 'Remitly',
    feeRange: '$3.99-$6.49',
    speedRange: 'Minutes',
    bestFor: 'Cash pickup coverage',
  },
  {
    route: 'CA->IN',
    count24h: 520,
    topProvider: 'Wise',
    feeRange: '$2.99-$3.49',
    speedRange: 'Same day',
    bestFor: 'Consistency',
  },
]

export const countries: CountrySeed[] = Object.values(countryCatalog)
