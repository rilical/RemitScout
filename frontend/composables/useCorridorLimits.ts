import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useApi } from '~/composables/useApi'

export type CorridorLimits = {
  corridorId: string
  from: string
  to: string
  fromCurrency: string
  toCurrency: string
  minAmount: number | null
  maxAmount: number | null
  source: 'observed' | 'observed_single' | 'fixed' | 'fx' | 'none'
  strict: boolean
}

type CorridorLimitsStatus = 'idle' | 'loading' | 'ready' | 'error'

export const useCorridorLimits = (
  from: Ref<string>,
  to: Ref<string>,
  fromCurrency: Ref<string>,
  toCurrency: Ref<string>,
) => {
  const { request } = useApi()
  const data = ref<CorridorLimits | null>(null)
  const status = ref<CorridorLimitsStatus>('idle')
  const error = ref<string | null>(null)
  let requestId = 0

  const load = async () => {
    const fromValue = (from.value || '').trim().toUpperCase()
    const toValue = (to.value || '').trim().toUpperCase()
    const fromCurrencyValue = (fromCurrency.value || '').trim().toUpperCase()
    const toCurrencyValue = (toCurrency.value || '').trim().toUpperCase()

    if (!fromValue || !toValue || !fromCurrencyValue || !toCurrencyValue) {
      data.value = null
      status.value = 'idle'
      error.value = null
      return
    }

    status.value = 'loading'
    error.value = null
    const currentRequest = ++requestId

    try {
      const response = await request<CorridorLimits>('/corridor-limits', {
        method: 'GET',
        query: {
          from: fromValue,
          to: toValue,
          fromCurrency: fromCurrencyValue,
          toCurrency: toCurrencyValue,
        },
        retries: 1,
      })

      if (currentRequest !== requestId) return
      data.value = response
      status.value = 'ready'
    }
    catch (err: any) {
      if (currentRequest !== requestId) return
      data.value = null
      status.value = 'error'
      error.value = err?.message || 'Failed to load corridor limits.'
    }
  }

  watch([from, to, fromCurrency, toCurrency], () => {
    void load()
  }, { immediate: true })

  return {
    data,
    status,
    error,
    refresh: load,
  }
}
