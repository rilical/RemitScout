import { ref, computed } from 'vue'
import type { Component } from 'vue'
import type { Method } from '~/types/remit'
import { getCorridorUrl } from '~/utils/country-slugs'
import { getAvailableCurrencies, getCountryByCode } from '~/utils/countries-currencies'
import { useApi } from '~/composables/useApi'
import { useTelemetry } from '~/composables/useTelemetry'
import { formatCurrency, getMaxAmount, getMinAmount, sanitizeAmount } from '~/utils/currency-limits'
import {
  BuildingLibraryIcon,
  BanknotesIcon,
  WalletIcon,
  SignalIcon,
  HomeIcon,
  CreditCardIcon,
} from '@heroicons/vue/24/solid'

export interface CompareFormState {
  from: string
  to: string
  amount: number
  method: Method
  fromCurrency: string
  toCurrency: string
}

export const DELIVERY_METHODS: ReadonlyArray<{ value: Method; label: string; icon: Component }> = [
  { value: 'bank', label: 'Bank Transfer', icon: BuildingLibraryIcon },
  { value: 'cash', label: 'Cash Pickup', icon: BanknotesIcon },
  { value: 'wallet', label: 'Mobile Wallet', icon: WalletIcon },
  { value: 'airtime', label: 'Airtime', icon: SignalIcon },
  { value: 'home', label: 'Home Delivery', icon: HomeIcon },
  { value: 'card', label: 'Card Delivery', icon: CreditCardIcon },
]

export function useCompareForm() {
  const form = useState<CompareFormState>('compare:form', () => ({
    from: 'US',
    to: '',
    amount: 500,
    method: 'bank',
    fromCurrency: 'USD',
    toCurrency: '',
  }))
  const geoDefaultPromise = useState<Promise<void> | null>('compare:geo-default-promise', () => null)
  const validationError = ref<string>('')
  const statusMessage = ref<string>('')
  const isWaitingForQuotes = ref(false)
  const { request } = useApi()
  const { trackSearch } = useTelemetry()

  const ensureGeoDefault = () => {
    if (!import.meta.client) return
    if (geoDefaultPromise.value) return

    geoDefaultPromise.value = (async () => {
      const current = form.value
      const isDefaultFrom
        = !current.from || (current.from === 'US' && current.fromCurrency === 'USD')

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
      }
      catch {
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
    const { from, to, amount, method, fromCurrency, toCurrency } = form.value
    const fromCountry = getCountryByCode(from.toUpperCase())
    const toCountry = getCountryByCode(to.toUpperCase())

    if (!from || !to || !fromCountry || !toCountry) {
      return '/#hero-dual-tab'
    }

    const params = new URLSearchParams({
      amount: String(amount),
      method,
      fromCurrency,
      toCurrency,
    })

    return `${getCorridorUrl(from, to)}?${params.toString()}`
  })

  const mapMethodToTelemetry = (method: CompareFormState['method']) => {
    if (method === 'cash') {
      return { payin: 'bank_transfer', payout: 'cash_pickup' }
    }
    if (method === 'wallet') {
      return { payin: 'bank_transfer', payout: 'mobile_wallet' }
    }
    if (method === 'airtime') {
      return { payin: 'bank_transfer', payout: 'airtime' }
    }
    if (method === 'home') {
      return { payin: 'bank_transfer', payout: 'home_delivery' }
    }
    if (method === 'card') {
      return { payin: 'debit_card', payout: 'debit_card' }
    }
    return { payin: 'bank_transfer', payout: 'bank_deposit' }
  }

  const normalizeCurrency = (value: string) => value.trim().toUpperCase()

  const sanitizeCurrencies = () => {
    const fromCountry = getCountryByCode(form.value.from.toUpperCase())
    const toCountry = getCountryByCode(form.value.to.toUpperCase())

    if (!fromCountry || !toCountry) return

    const allowedFrom = getAvailableCurrencies(fromCountry.code).map(code => code.toUpperCase())
    const allowedTo = getAvailableCurrencies(toCountry.code).map(code => code.toUpperCase())
    const normalizedFrom = normalizeCurrency(form.value.fromCurrency || fromCountry.currency)
    const normalizedTo = normalizeCurrency(form.value.toCurrency || toCountry.currency)

    const nextFrom = allowedFrom.includes(normalizedFrom) ? normalizedFrom : fromCountry.currency
    const nextTo = allowedTo.includes(normalizedTo) ? normalizedTo : toCountry.currency

    form.value.fromCurrency = nextFrom
    form.value.toCurrency = nextTo
  }

  const sanitizeAmountValue = () => {
    const currency = normalizeCurrency(form.value.fromCurrency || 'USD')
    const sanitized = sanitizeAmount(form.value.amount, currency, {
      minAmount: getMinAmount(currency),
      maxAmount: getMaxAmount(currency),
      strict: true,
    })
    if (sanitized !== form.value.amount) {
      form.value.amount = sanitized
      statusMessage.value = `Amount adjusted to ${formatCurrency(sanitized, currency)}.`
    }
  }

  function validate(): boolean {
    validationError.value = ''
    statusMessage.value = ''

    if (!form.value.from) {
      validationError.value = 'Please select a sending country'
      return false
    }

    if (!form.value.to) {
      validationError.value = 'Please select a receiving country'
      return false
    }

    const fromCountry = getCountryByCode(form.value.from.toUpperCase())
    if (!fromCountry) {
      validationError.value = 'Please select a valid sending country'
      return false
    }

    const toCountry = getCountryByCode(form.value.to.toUpperCase())
    if (!toCountry) {
      validationError.value = 'Please select a valid receiving country'
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

    sanitizeCurrencies()

    if (!form.value.amount || form.value.amount <= 0) {
      validationError.value = 'Please enter a valid amount'
      return false
    }

    sanitizeAmountValue()

    return true
  }

  async function submit() {
    if (isWaitingForQuotes.value) return false
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

      const corridorId = `${form.value.from.toUpperCase()}-${form.value.to.toUpperCase()}-${form.value.fromCurrency.toUpperCase()}-${form.value.toCurrency.toUpperCase()}`
      const methods = mapMethodToTelemetry(form.value.method)
      void trackSearch({
        corridor_id: corridorId,
        amount: form.value.amount,
        payin: methods.payin,
        payout: methods.payout,
      })
    }

    // Navigate immediately - no waiting for quotes
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
    statusMessage,
    isWaitingForQuotes,
  }
}
