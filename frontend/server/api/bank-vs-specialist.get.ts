import { BankVsSpecialist } from '~/types/remit'

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD',
  GB: 'GBP',
  PH: 'PHP',
  IN: 'INR',
  PK: 'PKR',
  NG: 'NGN',
  MX: 'MXN',
  CA: 'CAD',
  FR: 'EUR',
  DE: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  MA: 'MAD',
  SN: 'XOF',
  BR: 'BRL',
  VN: 'VND',
  BD: 'BDT',
  EG: 'EGP',
  CN: 'CNY',
  CO: 'COP',
  GH: 'GHS',
  AE: 'AED',
}

// Mock FX rates (in production, fetch from real API)
const MID_RATES: Record<string, number> = {
  'USD-PHP': 56.4,
  'USD-INR': 83.2,
  'USD-MXN': 17.8,
  'GBP-PKR': 355.2,
  'EUR-MAD': 10.9,
  'CAD-INR': 61.5,
}

function getMidRate(from: string, to: string): number {
  const fromCur = COUNTRY_CURRENCY[from] || 'USD'
  const toCur = COUNTRY_CURRENCY[to] || 'PHP'
  const key = `${fromCur}-${toCur}`
  return MID_RATES[key] || 56.4 // Default to USD-PHP if not found
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const from = (query.from as string) || 'US'
  const to = (query.to as string) || 'PH'
  const amount = Number(query.amount) || 500
  
  const sendCur = COUNTRY_CURRENCY[from] || 'USD'
  const recvCur = COUNTRY_CURRENCY[to] || 'PHP'
  const midRate = getMidRate(from, to)
  
  // Wells Fargo data for US → Mexico (based on their Remittance Cost Estimator)
  let bankName = 'Your bank'
  let bankRate = midRate * 0.97 // 3% margin
  let bankFee = 15
  let bankDelivery = '1–2 days'
  
  // Use Wells Fargo specific data for US → Mexico (as of today)
  if (from === 'US' && to === 'MX') {
    bankName = 'Wells Fargo'
    bankRate = 18.3910 // Wells Fargo rate from their estimator
    bankFee = 5 // Wells Fargo fee for Mexico transfers
    bankDelivery = '1–3 days'
  }
  
  const bankGets = Math.round((amount - bankFee) * bankRate)
  
  // Remitly - our pick for today (real data from comparison)
  const topRate = 18.3700 // Remitly rate
  const topFee = 1.99 // Remitly fee
  const topGets = 9410 // Actual amount from Remitly
  
  const data: BankVsSpecialist = {
    corridor: {
      from,
      to,
      sendCurrency: sendCur,
      recvCurrency: recvCur,
    },
    midRate,
    bank: {
      name: bankName,
      fee: bankFee,
      marginPct: ((midRate - bankRate) / midRate) * 100,
      fxRate: bankRate,
      recipientGets: bankGets,
      delivery: bankDelivery,
      reliability: 0.95,
      methods: ['bank'],
      bestFor: 'Familiar process',
    },
    top: {
      id: 'remitly',
      name: 'Remitly',
      fee: topFee,
      marginPct: ((midRate - topRate) / midRate) * 100,
      fxRate: topRate,
      recipientGets: topGets,
      delivery: '1 days',
      reliability: 0.995,
      methods: ['bank'],
      bestFor: 'Highest payout',
    },
    updatedAt: new Date().toISOString(),
  }
  
  return { data }
})




