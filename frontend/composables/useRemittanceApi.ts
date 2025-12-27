import type { RecentSearch, CorridorPopularity, BankVsSpecialist, ProviderQuote, RatingWeights } from '~/types/remit'
import { getProviderScore } from '~/lib/providerScores'
import { useApi } from '~/composables/useApi'

// API composables for dynamic data fetching
export const useRemittanceApi = () => {
  const { request } = useApi()

  const useRecentSearches = (limit = 12, options: Record<string, any> = {}) => {
    const key = options.key || `recent-searches-${limit}`
    return useAsyncData(
      key,
      () => request<{ data: RecentSearch[], updatedAt: string }>('/recent-searches', { query: { limit } }),
      { watch: false, ...options },
    )
  }

  const usePopularCorridors = (options: Record<string, any> = {}) => {
    const key = options.key || 'popular-corridors'
    return useAsyncData(
      key,
      () => request<{ data: CorridorPopularity[], updatedAt: string }>('/popular-corridors'),
      { watch: false, ...options },
    )
  }

  const useBankVsSpecialist = (from = 'US', to = 'PH', amount = 500, options: Record<string, any> = {}) => {
    const key = options.key || `bank-vs-specialist-${from}-${to}-${amount}`
    return useAsyncData(
      key,
      () => request<{ data: BankVsSpecialist }>('/bank-vs-specialist', {
        query: { from, to, amount },
      }),
      {
        getCachedData(key) {
          const nuxtApp = useNuxtApp()
          const data = nuxtApp.payload.data[key] || nuxtApp.static.data[key]

          if (!data) {
            return
          }

          const timestamp = data.updatedAt || data.fetchedAt
          if (!timestamp) return
          const expirationDate = new Date(timestamp)
          expirationDate.setTime(expirationDate.getTime() + 24 * 60 * 60 * 1000)
          const isExpired = expirationDate.getTime() < Date.now()
          if (isExpired) {
            return
          }

          return data
        },
        ...options,
      },
    )
  }

  const useProviders = (
    from = 'US',
    to = 'PH',
    amount = 500,
    method: string = 'bank',
    options: Record<string, any> = {},
  ) => {
    const key = options.key || `providers-${from}-${to}-${amount}-${method}`
    return useAsyncData(
      key,
      () => request<{ data: ProviderQuote[], updatedAt: string, corridor: string, amount: number, method: string }>(
        '/providers',
        { query: { from, to, amount, method } },
      ),
      { watch: false, ...options },
    )
  }

  const recordSearch = async (search: Partial<RecentSearch>) => {
    return await request('/recent-searches', {
      method: 'POST',
      body: search,
    })
  }

  const DEFAULT_WEIGHTS: RatingWeights = {
    cost: 0.6,
    speed: 0.25,
    reliability: 0.1,
    coverage: 0.05,
  }

  const attachRatings = (quotes: ProviderQuote[], weights = DEFAULT_WEIGHTS) => {
    if (quotes.length === 0) return []

    const etaToHours = (eta: string): number => {
      const t = eta.toLowerCase()
      if (t.includes('min')) {
        const mins = Number.parseInt(t) || 30
        return mins / 60
      }
      if (t.includes('same day')) return 8
      if (t.includes('day')) {
        const days = Number.parseInt(t) || 1
        return days * 24
      }
      return 24
    }

    const recMin = Math.min(...quotes.map(q => q.recipientGets))
    const recMax = Math.max(...quotes.map(q => q.recipientGets))
    const speedMin = Math.min(...quotes.map(q => etaToHours(q.delivery)))
    const speedMax = Math.max(...quotes.map(q => etaToHours(q.delivery)))

    return quotes.map((q) => {
      const providerScoreData = getProviderScore(q.id)

      if (providerScoreData && providerScoreData.scoreBreakdown) {
        return {
          ...q,
          score: providerScoreData.remitScore,
          scoreBreakdown: {
            cost: providerScoreData.scoreBreakdown.deliveredValue,
            speed: providerScoreData.scoreBreakdown.frictionSpeed,
            reliability: providerScoreData.scoreBreakdown.reliability,
            coverage: providerScoreData.scoreBreakdown.supportRefunds,
          },
        }
      }

      const costScore = recMax === recMin ? 1 : (q.recipientGets - recMin) / (recMax - recMin)
      const speedHrs = etaToHours(q.delivery)
      const speedScore = speedMax === speedMin ? 1 : (speedMax - speedHrs) / (speedMax - speedMin)
      const relScore = q.reliability
      const coverageScore = q.methods.length / 3
      const raw = weights.cost * costScore
        + weights.speed * speedScore
        + weights.reliability * relScore
        + weights.coverage * coverageScore
      const score = Math.round((6 + raw * 4) * 10) / 10

      return {
        ...q,
        score: Number(score.toFixed(1)),
        scoreBreakdown: {
          cost: costScore,
          speed: speedScore,
          reliability: relScore,
          coverage: coverageScore,
        },
      }
    })
  }

  const formatMoney = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatRate = (rate: number, from = 'USD', to = 'PHP') => {
    return `1 ${from} -> ${rate.toFixed(4)} ${to}`
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
