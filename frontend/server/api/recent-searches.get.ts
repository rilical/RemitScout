import { RecentSearch } from '~/types/remit'

// In-memory store (replace with Redis/DB in production)
const RECENT_SEARCHES: RecentSearch[] = []

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Number(query.limit) || 12
  
  // Get most recent searches
  const data = RECENT_SEARCHES.slice(-limit).reverse()
  
  // Add mock data for demo
  if (data.length === 0) {
    const mockData: RecentSearch[] = [
      {
        id: '1',
        from: 'US',
        to: 'PH',
        amount: 500,
        method: 'bank',
        bestProvider: { name: 'Wise', recipientGets: 28150 },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '2',
        from: 'GB',
        to: 'IN',
        amount: 1000,
        method: 'bank',
        bestProvider: { name: 'Remitly', recipientGets: 82500 },
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: '3',
        from: 'CA',
        to: 'MX',
        amount: 750,
        method: 'cash',
        bestProvider: { name: 'Xoom', recipientGets: 13500 },
        createdAt: new Date(Date.now() - 10800000).toISOString(),
      },
    ]
    return { data: mockData, updatedAt: new Date().toISOString() }
  }
  
  return {
    data,
    updatedAt: new Date().toISOString(),
  }
})








