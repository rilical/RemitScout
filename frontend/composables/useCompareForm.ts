import { ref, computed } from 'vue'
import { getCorridorUrl } from '~/utils/country-slugs'
import { getCountryByCode } from '~/utils/countries-currencies'
import { useApi } from '~/composables/useApi'

export interface CompareFormState {
  from: string
  to: string
  amount: number
  method: 'bank' | 'cash' | 'wallet'
  fromCurrency: string
  toCurrency: string
}

export const DELIVERY_METHODS = [
  { value: 'bank', label: 'Bank Transfer', icon: '🏦' },
  { value: 'cash', label: 'Cash Pickup', icon: '💵' },
  { value: 'wallet', label: 'Mobile Wallet', icon: '📱' },
] as const

const globalForm = ref<CompareFormState>({
  from: 'US',
  to: '',
  amount: 500,
  method: 'bank',
  fromCurrency: 'USD',
  toCurrency: '',
})

let geoDefaultPromise: Promise<void> | null = null

export function useCompareForm() {
  const form = globalForm
  const validationError = ref<string>('')
  const { request } = useApi()

  const ensureGeoDefault = () => {
    if (!import.meta.client) return
    if (geoDefaultPromise) return

    geoDefaultPromise = (async () => {
      const current = form.value
      const isDefaultFrom =
        !current.from || (current.from === 'US' && current.fromCurrency === 'USD')

      if (!isDefaultFrom) {
        return
      }

      try {
        const data = await request<{ countryCode?: string, country_code?: string }>('/geo', {
          timeoutMs: 3000,
          retries: 0,
        })
        const rawCode = data.countryCode || data.country_code
        if (!rawCode) {
          return
        }

        const country = getCountryByCode(rawCode.toUpperCase())
        if (!country) {
          return
        }

        form.value.from = country.code
        form.value.fromCurrency = country.currency
      } catch {
        // Keep default values when geo lookup fails.
      }
    })()
  }

  ensureGeoDefault()

  const isValid = computed(() => {
    return (
      !!form.value.from
      && !!form.value.to
      && !!form.value.fromCurrency
      && !!form.value.toCurrency
      && form.value.amount > 0
    )
  })

  const compareUrl = computed(() => {
    const { from, to, amount, method, fromCurrency, toCurrency } = form.value

    if (!isValid.value) {
      return '/#hero-dual-tab'
    }

    const params = new URLSearchParams({
      from,
      to,
      amount: String(amount),
      method,
      fromCurrency,
      toCurrency,
    })

    return `/compare?${params.toString()}`
  })

  const sendMoneyUrl = computed(() => {
    const { from, to, amount, method } = form.value

    if (!from || !to) {
      return '/#hero-dual-tab'
    }

    const params = new URLSearchParams({
      amount: String(amount),
      method,
    })

    return `${getCorridorUrl(from, to)}?${params.toString()}`
  })

  function validate(): boolean {
    validationError.value = ''

    if (!form.value.from) {
      validationError.value = 'Please select a sending country'
      return false
    }

    if (!form.value.to) {
      validationError.value = 'Please select a receiving country'
      return false
    }

    if (!form.value.fromCurrency) {
      validationError.value = 'Please select a sending currency'
      return false
    }

    if (!form.value.toCurrency) {
      validationError.value = 'Please select a receiving currency'
      return false
    }

    if (!form.value.amount || form.value.amount <= 0) {
      validationError.value = 'Please enter a valid amount'
      return false
    }

    return true
  }

  async function submit() {
    if (!validate()) {
      return false
    }

    if (import.meta.client) {
      const history = useCompareHistory()
      history.record({
        from: form.value.from,
        to: form.value.to,
        method: form.value.method,
        amount: form.value.amount,
        path: sendMoneyUrl.value,
      })
    }

    await navigateTo(sendMoneyUrl.value)
    return true
  }

  function reset() {
    form.value = {
      from: 'US',
      to: '',
      amount: 500,
      method: 'bank',
      fromCurrency: 'USD',
      toCurrency: '',
    }
    validationError.value = ''
  }

  function prefill(data: Partial<CompareFormState>) {
    Object.assign(form.value, data)
  }

  return {
    form,
    validationError,
    isValid,
    compareUrl,
    sendMoneyUrl,
    validate,
    submit,
    reset,
    prefill,
    DELIVERY_METHODS,
  }
}
