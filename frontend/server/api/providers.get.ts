import type { ProviderQuote } from '~/types/remit'

function getCorridorSpecificProviders(from: string, to: string, amount: number): ProviderQuote[] {
  // Base provider data
  const baseProviders: ProviderQuote[] = [
    {
      id: 'wise',
      name: 'Wise',
      logoUrl: '/logos/wise.svg',
      fee: 2.99,
      marginPct: 0.35,
      fxRate: 56.4,
      recipientGets: 28150,
      delivery: '15 min – same day',
      reliability: 0.995,
      methods: ['bank'],
      bestFor: 'Highest bank payout',
      limits: 'Up to $1M per transfer',
    },
    {
      id: 'remitly',
      name: 'Remitly',
      logoUrl: '/logos/remitly.svg',
      fee: 3.99,
      marginPct: 0.65,
      fxRate: 56.2,
      recipientGets: 27980,
      delivery: '15–30 min',
      reliability: 0.992,
      methods: ['bank', 'cash', 'wallet'],
      bestFor: 'Fast cash pickup',
      limits: 'First transfer promo available',
    },
    {
      id: 'worldremit',
      name: 'WorldRemit',
      fee: 2.99,
      marginPct: 0.8,
      fxRate: 56.1,
      recipientGets: 27920,
      delivery: 'Minutes–hours',
      reliability: 0.989,
      methods: ['bank', 'cash', 'wallet'],
      bestFor: 'Mobile wallet options',
      limits: 'Up to $5,000 per transfer',
    },
    {
      id: 'xoom',
      name: 'Xoom',
      fee: 4.99,
      marginPct: 1.2,
      fxRate: 55.9,
      recipientGets: 27750,
      delivery: 'Minutes–same day',
      reliability: 0.985,
      methods: ['bank', 'cash'],
      bestFor: 'Wide cash network',
      limits: 'PayPal integration',
    },
    {
      id: 'ria',
      name: 'Ria',
      fee: 5.0,
      marginPct: 1.0,
      fxRate: 56.0,
      recipientGets: 27780,
      delivery: 'Minutes–1 day',
      reliability: 0.982,
      methods: ['bank', 'cash'],
      bestFor: 'Agent locations',
      limits: 'Track with SMS',
    },
    {
      id: 'western-union',
      name: 'Western Union',
      logoUrl: '/logos/western-union.svg',
      fee: 7.99,
      marginPct: 1.5,
      fxRate: 55.7,
      recipientGets: 27620,
      delivery: 'Minutes–1 day',
      reliability: 0.98,
      methods: ['bank', 'cash'],
      bestFor: 'Global reach',
      limits: 'Available in 200+ countries',
    },
  ]

  // Add corridor-specific pros/cons and ranking explanations
  const corridor = `${from}→${to}`

  return baseProviders.map((provider) => {
    // Corridor-specific customization
    switch (corridor) {
      case 'US→PH':
        if (provider.id === 'wise') {
          provider.corridorPros = ['Best PHP exchange rate', 'Direct to BPI/BDO', 'No receiving fee']
          provider.corridorCons = ['No cash pickup', 'Bank transfers only']
          provider.whyThisRanking = 'Ranked #1: Best total value for bank deposits in Philippines'
        }
        else if (provider.id === 'remitly') {
          provider.corridorPros = ['Cash pickup at M Lhuillier', 'GCash supported', 'Express option']
          provider.corridorCons = ['Higher fee for cash', 'Rate varies by amount']
          provider.whyThisRanking = 'Ranked #2: Fastest for cash pickup in provinces'
        }
        break

      case 'US→IN':
        if (provider.id === 'wise') {
          provider.corridorPros = ['Direct to all major banks', 'UPI supported', 'Best INR rate']
          provider.corridorCons = ['No doorstep delivery']
          provider.whyThisRanking = 'Ranked #1: Consistently highest INR payout'
        }
        break

      case 'GB→PK':
        if (provider.id === 'wise') {
          provider.corridorPros = ['Fast to HBL/MCB', 'Low fee from UK', 'Great for tuition']
          provider.corridorCons = ['Limited rural coverage']
          provider.whyThisRanking = 'Ranked #1: Best for education payments'
        }
        break

      default:
        provider.corridorPros = ['Licensed provider', 'Multiple delivery options']
        provider.corridorCons = ['Fees vary by method']
        provider.whyThisRanking = `Competitive option for ${from} to ${to} transfers`
    }

    // Adjust recipient amount based on actual exchange calculation
    const actualAmount = amount - provider.fee
    provider.recipientGets = Math.round(actualAmount * provider.fxRate)

    return provider
  })
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const from = (query.from as string) || 'US'
  const to = (query.to as string) || 'PH'
  const amount = Number(query.amount) || 500
  const method = (query.method as string) || 'bank'

  const allProviders = getCorridorSpecificProviders(from, to, amount)

  // Filter by delivery method
  const filtered = allProviders.filter(p =>
    p.methods.includes(method as any),
  )

  return {
    data: filtered,
    updatedAt: new Date().toISOString(),
    corridor: `${from}→${to}`,
    amount,
    method,
  }
})

