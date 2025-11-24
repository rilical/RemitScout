export interface EsimPlan {
  id: string
  country: string
  countryCode: string
  provider: string
  dataAmount: string
  dataGB: number
  duration: number // in days
  price: number
  currency: string
  features: string[]
  coverage: string[]
  activationTime: string
  validity: string
}

export interface TravelTool {
  id: string
  name: string
  description: string
  icon: string
  link: string
  category: 'connectivity' | 'finance' | 'planning'
}

export interface AtmFeeData {
  country: string
  countryCode: string
  averageFee: number
  currency: string
  majorBanks: {
    name: string
    fee: number
    fxMarkup: number
  }[]
  tips: string[]
}

export const esimPlans: EsimPlan[] = [
  {
    id: 'us-5gb-7days',
    country: 'United States',
    countryCode: 'US',
    provider: 'Airalo',
    dataAmount: '5GB',
    dataGB: 5,
    duration: 7,
    price: 15,
    currency: 'USD',
    features: ['4G/5G speeds', 'Hotspot allowed', 'No daily limit'],
    coverage: ['AT&T', 'T-Mobile'],
    activationTime: 'Instant',
    validity: '7 days from activation',
  },
  {
    id: 'ph-10gb-30days',
    country: 'Philippines',
    countryCode: 'PH',
    provider: 'Holafly',
    dataAmount: '10GB',
    dataGB: 10,
    duration: 30,
    price: 35,
    currency: 'USD',
    features: ['4G/LTE speeds', 'Unlimited hotspot', 'WhatsApp included'],
    coverage: ['Globe', 'Smart'],
    activationTime: 'Instant',
    validity: '30 days from activation',
  },
  {
    id: 'in-3gb-7days',
    country: 'India',
    countryCode: 'IN',
    provider: 'Nomad',
    dataAmount: '3GB',
    dataGB: 3,
    duration: 7,
    price: 8,
    currency: 'USD',
    features: ['4G speeds', 'SMS included', 'No registration required'],
    coverage: ['Airtel', 'Jio'],
    activationTime: 'Within 5 minutes',
    validity: '7 days from activation',
  },
  {
    id: 'uk-20gb-30days',
    country: 'United Kingdom',
    countryCode: 'GB',
    provider: 'GigSky',
    dataAmount: '20GB',
    dataGB: 20,
    duration: 30,
    price: 45,
    currency: 'USD',
    features: ['5G where available', 'EU roaming included', 'Hotspot allowed'],
    coverage: ['EE', 'O2', 'Vodafone'],
    activationTime: 'Instant',
    validity: '30 days from activation',
  },
  {
    id: 'mx-unlimited-15days',
    country: 'Mexico',
    countryCode: 'MX',
    provider: 'Holafly',
    dataAmount: 'Unlimited',
    dataGB: 999,
    duration: 15,
    price: 42,
    currency: 'USD',
    features: ['Unlimited data', '4G/LTE speeds', 'Hotspot allowed'],
    coverage: ['Telcel', 'Movistar'],
    activationTime: 'Instant',
    validity: '15 days from activation',
  },
  {
    id: 'jp-10gb-14days',
    country: 'Japan',
    countryCode: 'JP',
    provider: 'Ubigi',
    dataAmount: '10GB',
    dataGB: 10,
    duration: 14,
    price: 28,
    currency: 'USD',
    features: ['High-speed 4G/LTE', 'No speed throttling', 'Works nationwide'],
    coverage: ['NTT Docomo', 'SoftBank'],
    activationTime: 'Instant',
    validity: '14 days from activation',
  },
]

export const travelTools: TravelTool[] = [
  {
    id: 'esim-finder',
    name: 'eSIM Quick Finder',
    description: 'Compare prepaid data plans by country, activation in minutes, no roaming shock',
    icon: '📱',
    link: '/esim',
    category: 'connectivity',
  },
  {
    id: 'atm-fees',
    name: 'ATM Fee & FX Guide',
    description: 'Know what the ATM really costs in any country',
    icon: '💳',
    link: '/tools/atm-fees',
    category: 'finance',
  },
  {
    id: 'cost-calculator',
    name: 'Cost of Living Calculator',
    description: 'See how far your salary goes abroad',
    icon: '💰',
    link: '/tools/cost-of-living',
    category: 'planning',
  },
]

export const atmFeeData: Record<string, AtmFeeData> = {
  PH: {
    country: 'Philippines',
    countryCode: 'PH',
    averageFee: 250,
    currency: 'PHP',
    majorBanks: [
      { name: 'BDO', fee: 250, fxMarkup: 2.5 },
      { name: 'BPI', fee: 200, fxMarkup: 2.0 },
      { name: 'Metrobank', fee: 200, fxMarkup: 2.5 },
      { name: 'UnionBank', fee: 250, fxMarkup: 2.0 },
    ],
    tips: [
      'BPI has lower fees for international cards',
      'Maximum withdrawal is usually PHP 10,000-20,000 per transaction',
      'HSBC ATMs offer higher limits but limited locations',
    ],
  },
  IN: {
    country: 'India',
    countryCode: 'IN',
    averageFee: 200,
    currency: 'INR',
    majorBanks: [
      { name: 'State Bank of India', fee: 175, fxMarkup: 3.0 },
      { name: 'HDFC Bank', fee: 150, fxMarkup: 2.5 },
      { name: 'ICICI Bank', fee: 200, fxMarkup: 2.5 },
      { name: 'Axis Bank', fee: 200, fxMarkup: 3.0 },
    ],
    tips: [
      'HDFC has the lowest fees for international cards',
      'Maximum withdrawal is INR 10,000-25,000 per transaction',
      'Avoid independent ATMs which charge higher fees',
    ],
  },
  MX: {
    country: 'Mexico',
    countryCode: 'MX',
    averageFee: 100,
    currency: 'MXN',
    majorBanks: [
      { name: 'BBVA', fee: 85, fxMarkup: 3.0 },
      { name: 'Santander', fee: 90, fxMarkup: 2.8 },
      { name: 'Banamex', fee: 100, fxMarkup: 3.5 },
      { name: 'HSBC', fee: 0, fxMarkup: 2.5 },
    ],
    tips: [
      'HSBC offers free withdrawals for Premier account holders',
      'Maximum withdrawal is MXN 6,000-9,000 per transaction',
      'ATMs in tourist areas often have higher fees',
    ],
  },
}

export const getEsimPlansByCountry = (countryCode: string): EsimPlan[] => {
  return esimPlans.filter(plan => plan.countryCode === countryCode)
}

export const getCheapestEsimPlan = (countryCode: string, minDays: number): EsimPlan | undefined => {
  const countryPlans = esimPlans
    .filter(plan => plan.countryCode === countryCode && plan.duration >= minDays)
    .sort((a, b) => (a.price / a.duration) - (b.price / b.duration))

  return countryPlans[0]
}

export const getAtmFees = (countryCode: string): AtmFeeData | undefined => {
  return atmFeeData[countryCode]
}
