import type { Ref } from 'vue'
import { computed, isRef, unref } from 'vue'
import type { RecentSearch, CorridorPopularity, BankVsSpecialist, ProviderQuote, RatingWeights } from '~/types/remit'
import type { paths } from '~/shared/lib/api/types'
import { getProviderScore } from '~/lib/providerScores'
import { useApi } from '~/composables/useApi'
import { getCountryByCode } from '~/utils/countries-currencies'

type ProviderIndices = {
  teer: number | null
  rvi_bps: number | null
  rci: number | null
  providerCount: number
  amount: number
  midMarketRate: number | null
  weights: string
  weightConfidence?: number | null
  weightWindowDays?: number | null
  source?: 'gold'
  updatedAt?: string | null
  indicesBucket?: number
  methodProfile?: string
  suppressionFlag?: boolean
  suppressionReason?: string | null
}

type ProvidersResponse = {
  comparisonId?: string
  start?: string
  updatedAt: string | null
  corridor: string
  amount: number
  method?: string | null
  bucketUsed?: number
  approximate?: boolean
  bucketDeltaPct?: number | null
  midMarketRate?: number | null
  midMarketSource?: string | null
  midMarketUpdatedAt?: string | null
  cache?: {
    ttl_seconds: number
    age_seconds: number
    fresh: boolean
  }
  availableMethods?: string[]
  indicesReason?: string | null
  message?: string
  data: ProviderQuote[]
  providerQuotes?: ProviderQuote[]
  indices?: ProviderIndices
  error?: { code: string, message: string }
}

type RecentSearchesResponse = paths['/recent-searches']['get']['responses']['200'] extends { content: { 'application/json': infer R } }
  ? R
  : { data: RecentSearch[], updatedAt: string }

type PopularCorridorsResponse = paths['/popular-corridors']['get']['responses']['200'] extends { content: { 'application/json': infer R } }
  ? R
  : { data: CorridorPopularity[], updatedAt: string }

type BankVsSpecialistResponse = paths['/bank-vs-specialist']['get']['responses']['200'] extends { content: { 'application/json': infer R } }
  ? R
  : { data: BankVsSpecialist }

// API composables for dynamic data fetching
export const useRemittanceApi = () => {
  const { request } = useApi()
  const fallbackUpdatedAt = () => new Date().toISOString()
  const providersSuccessCache = new Map<string, ProvidersResponse>()

  const getStatusCode = (error: unknown): number | undefined => {
    if (!error || typeof error !== 'object') return undefined
    const code = (error as Record<string, unknown>).statusCode
    return typeof code === 'number' ? code : undefined
  }

  const getErrorData = (error: unknown): Record<string, unknown> | undefined => {
    if (!error || typeof error !== 'object') return undefined
    const data = (error as Record<string, unknown>).data
    if (!data || typeof data !== 'object') return undefined
    return data as Record<string, unknown>
  }

  const useRecentSearches = (limit = 12, options: Record<string, unknown> = {}) => {
    const key = typeof options.key === 'string' ? options.key : `recent-searches-${limit}`
    const { key: _ignoredKey, ...asyncOptions } = options
    return useAsyncData(
      key,
      async () => {
        try {
          return await request<RecentSearchesResponse>('/recent-searches', { query: { limit } })
        }
        catch (error: unknown) {
          const statusCode = getStatusCode(error)
          if (statusCode === 401 || statusCode === 403) {
            return { data: [], updatedAt: new Date().toISOString() }
          }
          throw error
        }
      },
      { watch: [], ...(asyncOptions as any) },
    )
  }

  const usePopularCorridors = (options: Record<string, unknown> = {}) => {
    const key = typeof options.key === 'string' ? options.key : 'popular-corridors'
    const { key: _ignoredKey, ...asyncOptions } = options
    return useAsyncData(
      key,
      async () => {
        try {
          return await request<PopularCorridorsResponse>('/popular-corridors')
        }
        catch (error: unknown) {
          const statusCode = getStatusCode(error)
          if (statusCode === 401 || statusCode === 403 || statusCode === 500) {
            return { data: [], updatedAt: fallbackUpdatedAt() }
          }
          throw error
        }
      },
      { watch: [], ...(asyncOptions as any) },
    )
  }

  const useBankVsSpecialist = (from = 'US', to = 'MX', amount = 500, options: Record<string, unknown> = {}) => {
    const key = typeof options.key === 'string' ? options.key : `bank-vs-specialist-${from}-${to}-${amount}`
    const { key: _ignoredKey, ...asyncOptions } = options
    return useAsyncData(
      key,
      () => request<BankVsSpecialistResponse>('/bank-vs-specialist', {
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
        ...(asyncOptions as any),
      },
    )
  }

  const useProviders = (
    from: string | Ref<string> = 'US',
    to: string | Ref<string> = 'PH',
    amount: number | Ref<number> = 500,
    method: string | Ref<string> = 'bank',
    options: Record<string, unknown> = {},
  ) => {
    const {
      key: optionKey,
      watch: optionWatch,
      fromCurrency,
      toCurrency,
      live,
      ...restOptions
    } = options
    const resolveOption = (value: unknown) => (isRef(value) ? unref(value) : value)
    const resolvedLive = computed(() => resolveOption(live) === true)
    const key = typeof optionKey === 'string'
      ? optionKey
      : computed(() => (
      `providers-${unref(from)}-${unref(to)}-${resolveOption(fromCurrency) || 'auto'}-${resolveOption(toCurrency) || 'auto'}-${unref(amount)}-${resolvedLive.value ? 'live' : 'cached'}`
    ))
    const resolvedKey = computed(() => String(unref(key)))
    const watchSources = [from, to, amount, fromCurrency, toCurrency, live].filter(isRef)
    const watch = Array.isArray(optionWatch)
      ? [...optionWatch, ...watchSources]
      : optionWatch === false
        ? []
        : (watchSources.length ? watchSources : undefined)
    return useAsyncData<ProvidersResponse>(
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
          const isLive = resolvedLive.value
          const response = await request<ProvidersResponse>(
            '/providers',
            {
              query: {
                from: fromValue,
                to: toValue,
                amount: unref(amount),
                method: unref(method),
                fromCurrency: resolvedFromCurrency,
                toCurrency: resolvedToCurrency,
                ...(isLive ? { live: true } : {}),
              },
            },
          )
          providersSuccessCache.set(resolvedKey.value, response)
          return response
        }
        catch (error: unknown) {
          if (import.meta.dev) useLogger('remittance').warn('providers unavailable', error)
          const errorData = getErrorData(error)
          const errorCode = typeof errorData?.error === 'string' ? errorData.error : 'unavailable'
          const details = errorData?.details
          const firstDetail = Array.isArray(details) && details[0] && typeof details[0] === 'object'
            ? details[0] as Record<string, unknown>
            : undefined
          const detailMessage = typeof firstDetail?.message === 'string' ? firstDetail.message : undefined
          const errorMessage = detailMessage
            || (typeof errorData?.message === 'string' ? errorData.message : undefined)
            || 'Provider data unavailable.'
          const cached = providersSuccessCache.get(resolvedKey.value)
          if (cached) {
            return {
              ...cached,
              error: {
                code: errorCode,
                message: errorMessage,
              },
            }
          }
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
    try {
      return await request('/recent-searches', {
        method: 'POST',
        body: search,
        retries: 0,
        timeoutMs: 3000,
      })
    }
    catch {
      return null
    }
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
    }
    catch (error) {
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

export const usePopularCorridors = (options: Record<string, unknown> = {}) => {
  return useRemittanceApi().usePopularCorridors(options)
}
