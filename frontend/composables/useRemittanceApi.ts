import type { RecentSearch, CorridorPopularity, BankVsSpecialist, ProviderQuote, RatingWeights } from '~/types/remit'

// API composables for dynamic data fetching
export const useRemittanceApi = () => {
  
  // Recent searches
  const useRecentSearches = (limit = 12) => {
    return useFetch<{ data: RecentSearch[]; updatedAt: string }>('/api/recent-searches', {
      query: { limit },
      refresh: true,
      // Refresh every 15 seconds
      watch: false,
    })
  }
  
  // Popular corridors
  const usePopularCorridors = () => {
    return useFetch<{ data: CorridorPopularity[]; updatedAt: string }>('/api/popular-corridors', {
      refresh: true,
      // Refresh every 20 seconds
      watch: false,
    })
  }
  
  // Bank vs Specialist comparison
  const useBankVsSpecialist = (from = 'US', to = 'PH', amount = 500) => {
    return useFetch<{ data: BankVsSpecialist }>('/api/bank-vs-specialist', {
      query: { from, to, amount },
      // Cache for 1 day
      getCachedData(key) {
        const nuxtApp = useNuxtApp()
        const data = nuxtApp.payload.data[key] || nuxtApp.static.data[key]
        
        if (!data) {
          return
        }
        
        const expirationDate = new Date(data.fetchedAt)
        expirationDate.setTime(expirationDate.getTime() + 24 * 60 * 60 * 1000)
        const isExpired = expirationDate.getTime() < Date.now()
        if (isExpired) {
          return
        }
        
        return data
      },
    })
  }
  
  // Provider quotes
  const useProviders = (from = 'US', to = 'PH', amount = 500, method = 'bank') => {
    return useFetch<{ data: ProviderQuote[]; updatedAt: string; corridor: string; amount: number; method: string }>('/api/providers', {
      query: { from, to, amount, method },
      // Refresh every 2 minutes
      watch: false,
    })
  }
  
  // Post a new search
  const recordSearch = async (search: Partial<RecentSearch>) => {
    return await $fetch('/api/recent-searches', {
      method: 'POST',
      body: search,
    })
  }
  
  // Calculate provider ratings with weights
  const DEFAULT_WEIGHTS: RatingWeights = { 
    cost: 0.6, 
    speed: 0.25, 
    reliability: 0.1,
    coverage: 0.05
  }
  
  const attachRatings = (quotes: ProviderQuote[], weights = DEFAULT_WEIGHTS) => {
    if (quotes.length === 0) return []
    
    // Helper to convert delivery time to hours
    const etaToHours = (eta: string): number => {
      const t = eta.toLowerCase()
      if (t.includes('min')) {
        const mins = parseInt(t) || 30
        return mins / 60
      }
      if (t.includes('same day')) return 8
      if (t.includes('day')) {
        const days = parseInt(t) || 1
        return days * 24
      }
      return 24
    }
    
    const recMin = Math.min(...quotes.map(q => q.recipientGets))
    const recMax = Math.max(...quotes.map(q => q.recipientGets))
    const speedMin = Math.min(...quotes.map(q => etaToHours(q.delivery)))
    const speedMax = Math.max(...quotes.map(q => etaToHours(q.delivery)))
    
    return quotes.map(q => {
      // Cost score (higher recipient amount is better)
      const costScore = recMax === recMin ? 1 : (q.recipientGets - recMin) / (recMax - recMin)
      
      // Speed score (faster is better)
      const speedHrs = etaToHours(q.delivery)
      const speedScore = speedMax === speedMin ? 1 : (speedMax - speedHrs) / (speedMax - speedMin)
      
      // Reliability score
      const relScore = q.reliability
      
      // Coverage score (more methods is better)
      const coverageScore = q.methods.length / 3
      
      // Calculate weighted score
      const raw = weights.cost * costScore + 
                  weights.speed * speedScore + 
                  weights.reliability * relScore +
                  weights.coverage * coverageScore
      
      // Scale to 6.0–10.0 range
      const score = Math.round((6 + raw * 4) * 10) / 10
      
      return {
        ...q,
        score: Number(score.toFixed(1)),
        scoreBreakdown: {
          cost: costScore,
          speed: speedScore,
          reliability: relScore,
          coverage: coverageScore,
        }
      }
    })
  }
  
  // Format helpers
  const formatMoney = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  }
  
  const formatRate = (rate: number, from = 'USD', to = 'PHP') => {
    return `1 ${from} → ${rate.toFixed(4)} ${to}`
  }
  
  const getRelativeTime = (date: string) => {
    const now = Date.now()
    const then = new Date(date).getTime()
    const diff = now - then
    
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }
  
  return {
    useRecentSearches,
    usePopularCorridors,
    useBankVsSpecialist,
    useProviders,
    recordSearch,
    attachRatings,
    formatMoney,
    formatRate,
    getRelativeTime,
    DEFAULT_WEIGHTS,
  }
}








