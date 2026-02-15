import { unref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { paths } from '~/shared/lib/api/types'
import { useApi } from '~/composables/useApi'
import type { Method, ProviderQuote } from '~/types/remit'

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

type ProvidersQuery = NonNullable<paths['/providers']['get']['parameters']['query']>
type ProvidersResponse200 = paths['/providers']['get']['responses']['200']['content']['application/json']

export type ProvidersResponse = Omit<ProvidersResponse200, 'data'> & {
  data: ProviderQuote[]
}

type UseProvidersOptions = Record<string, any> & {
  key?: string
  live?: MaybeRef<boolean | undefined>
  fromCurrency?: MaybeRef<string | undefined>
  toCurrency?: MaybeRef<string | undefined>
  signal?: Ref<AbortSignal | undefined> | null
}

export const useProviders = (
  from?: MaybeRef<string | undefined>,
  to?: MaybeRef<string | undefined>,
  amount?: MaybeRef<number | undefined>,
  method?: MaybeRef<Method | string | undefined>,
  options: UseProvidersOptions = {},
) => {
  const { request } = useApi()
  const { live, fromCurrency, toCurrency, signal, ...restOptions } = options

  const key = options.key || `providers-${String(unref(from) || 'all')}-${String(unref(to) || 'all')}-${String(unref(amount) ?? 'any')}-${String(unref(method) || 'any')}-${unref(live) === true ? 'live' : 'cached'}`
  let lastSuccess: ProvidersResponse | null = null

  return useAsyncData(
    key,
    async () => {
      const query = {} as ProvidersQuery & Record<string, unknown>

      const fromValue = String(unref(from) || '').trim().toUpperCase()
      const toValue = String(unref(to) || '').trim().toUpperCase()
      const amountValue = unref(amount)
      const methodValue = String(unref(method) || '').trim()

      if (fromValue) query.from = fromValue
      if (toValue) query.to = toValue
      if (typeof amountValue === 'number') query.amount = amountValue
      if (methodValue) query.method = methodValue

      const fromCurrencyValue = String(unref(fromCurrency) || '').trim().toUpperCase()
      const toCurrencyValue = String(unref(toCurrency) || '').trim().toUpperCase()
      if (fromCurrencyValue) query.fromCurrency = fromCurrencyValue
      if (toCurrencyValue) query.toCurrency = toCurrencyValue

      if (unref(live) === true) query.live = true

      try {
        const response = await request<ProvidersResponse>('/providers', {
          query,
          signal: signal?.value,
        })
        lastSuccess = response
        return response
      }
      catch (error: any) {
        if (error?.name === 'AbortError') {
          return lastSuccess as ProvidersResponse
        }
        throw error
      }
    },
    { watch: [], ...restOptions },
  )
}
