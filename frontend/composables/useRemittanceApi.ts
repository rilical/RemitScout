import type { RecentSearch, CorridorPopularity, BankVsSpecialist, ProviderQuote, RatingWeights } from '~/types/remit'
import type { Ref } from 'vue'
import { isRef, unref } from 'vue'
import { getProviderScore } from '~/lib/providerScores'
import { useApi } from '~/composables/useApi'
import { getCountryByCode } from '~/utils/countries-currencies'

// API composables for dynamic data fetching
export const useRemittanceApi = () => {
  const { request } = useApi()
  const fallbackUpdatedAt = () => new Date().toISOString()

  const useRecentSearches = (limit = 12, options: Record<string, any> = {}) => {
    const key = options.key || `recent-searches-${limit}`
    return useAsyncData(
      key,
      async () => {
        try {
          return await request<{ data: RecentSearch[], updatedAt: string }>('/recent-searches', { query: { limit } })
        } catch (error: any) {
          if (error?.statusCode === 401 || error?.statusCode === 403) {
            return { data: [], updatedAt: new Date().toISOString() }
          }
          throw error
        }
      },
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

  const useBankVsSpecialist = (from = 'US', to = 'MX', amount = 500, options: Record<string, any> = {}) => {
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
    from: string | Ref<string> = 'US',
    to: string | Ref<string> = 'PH',
    amount: number | Ref<number> = 500,
    method: string | Ref<string> = 'bank',
    options: Record<string, any> = {},
  ) => {
    const {
      watch: optionWatch,
      fromCurrency,
      toCurrency,
      live,
      ...restOptions
    } = options
    const resolveOption = (value: unknown) => (isRef(value) ? unref(value) : value)
    const resolvedLive = resolveOption(live) === true
    const key =
      options.key ||
      `providers-${unref(from)}-${unref(to)}-${resolveOption(fromCurrency) || 'auto'}-${resolveOption(toCurrency) || 'auto'}-${unref(amount)}-${unref(method)}-${resolvedLive ? 'live' : 'cached'}`
    const watchSources = [from, to, amount, method, fromCurrency, toCurrency, live].filter(isRef)
    const watch = Array.isArray(optionWatch)
      ? [...optionWatch, ...watchSources]
      : optionWatch === false
        ? false
        : (watchSources.length ? watchSources : undefined)
    return useAsyncData(
      key,
      async () => {
        try {
          const fromValue = String(unref(from) || '').trim().toUpperCase()
          const toValue = String(unref(to) || '').trim().toUpperCase()
          const resolvedFromCurrency = resolveOption(fromCurrency)
          const resolvedToCurrency = resolveOption(toCurrency)
          const fromValid = fromValue.length === 2 && !!getCountryByCode(fromValue)
          const toValid = toValue.length === 2 && !!getCountryByCode(toValue)
          if (!fromValid || !toValid) {
            return {
              data: [],
              updatedAt: fallbackUpdatedAt(),
              corridor: `${fromValue}-${toValue}`,
              amount: unref(amount),
              method: unref(method),
              error: {
                code: 'corridor_invalid',
                message: 'Invalid corridor. Please try another combination.',
              },
            }
          }
          return await request<{
            data: ProviderQuote[]
            updatedAt: string
            corridor: string
            amount: number
            method: string
            bucketUsed?: number
            approximate?: boolean
            midMarketRate?: number | null
            midMarketSource?: string | null
            midMarketUpdatedAt?: string | null
            availableMethods?: string[]
            indices?: {
              teer: number | null
              rvi: number | null
              rci: number | null
              providerCount: number
              amount: number
              midMarketRate: number | null
              weights: 'equal'
            }
            error?: { code: string; message: string }
          }>(
            '/providers',
            {
              query: {
                from: fromValue,
                to: toValue,
                amount: unref(amount),
                method: unref(method),
                fromCurrency: resolvedFromCurrency,
                toCurrency: resolvedToCurrency,
                ...(resolvedLive ? { live: true } : {}),
              },
            },
          )
        } catch (error: any) {
          if (import.meta.dev) {
            console.warn('[remittance] providers unavailable', error)
          }
          const errorData = error?.data
          const errorCode = errorData?.error || 'unavailable'
          const errorMessage = errorData?.details?.[0]?.message || errorData?.message || 'Provider data unavailable.'
          return {
            data: [],
            updatedAt: fallbackUpdatedAt(),
            corridor: `${unref(from)}-${unref(to)}`,
            amount: unref(amount),
            method: unref(method),
            error: {
              code: errorCode,
              message: errorMessage,
            },
          }
        }
      },
      { ...restOptions, ...(watch !== undefined ? { watch } : {}) },
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
    // Ensure currency is uppercase and valid
    const currencyCode = currency?.toUpperCase().trim() || 'USD'
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: 2,
      }).format(amount)
    } catch (error) {
      // Fallback for unsupported currency codes
      // Use the currency code directly with the amount
      return `${currencyCode} ${amount.toFixed(2)}`
    }
  }

  const formatRate = (rate: number, from = 'USD', to = 'PHP') => {
    return `1 ${from} -> ${rate.toFixed(2)} ${to}`
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

export const usePopularCorridors = (options: Record<string, any> = {}) => {
  return useRemittanceApi().usePopularCorridors(options)
}
