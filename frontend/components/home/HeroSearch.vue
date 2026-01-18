<template>
  <section class="relative overflow-hidden bg-gradient-to-b from-primary-500 via-primary-600 to-primary-700">
    <div class="relative mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-20">
      <header class="max-w-4xl text-center text-white">
        <div class="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur">
          <span aria-hidden="true">💸</span>
          Trusted by 30,000+ global remitters
        </div>
        <h1 class="text-balance text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
          Compare international money transfers
          <span class="text-primary-200">and save</span>
        </h1>
        <p class="text-balance mt-4 text-lg text-white/90 md:text-xl">
          Pinpoint the best exchange rates, delivery speeds, and hidden fees before you hit send. <br class="hidden md:block">
          Our data covers 30+ licensed providers across 200+ corridors.
        </p>
      </header>

      <form
        class="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
        role="search"
        aria-label="Money transfer comparison form"
        @submit.prevent="handleSubmit"
      >
        <!-- Country Selection Row -->
        <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              for="from-country"
              class="mb-2 block text-sm font-semibold text-gray-700"
            >
              <span class="mr-2">🛫</span>Sending from
            </label>
            <CountrySelect
              id="from-country"
              v-model="from"
              label="Sending from"
              :exclude-country="to"
              :error="errors.from ? 'Select a country' : ''"
              :select-class="errors.from ? 'border-red-500' : 'border-gray-300'"
            />
          </div>

          <div>
            <label
              for="to-country"
              class="mb-2 block text-sm font-semibold text-gray-700"
            >
              <span class="mr-2">🛬</span>Receiving in
            </label>
            <CountrySelect
              id="to-country"
              v-model="to"
              label="Receiving in"
              :exclude-country="from"
              :error="errors.to ? 'Select a country' : ''"
              :select-class="errors.to ? 'border-red-500' : 'border-gray-300'"
            />
          </div>
        </div>

        <!-- Amount and Currency Row -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label
              for="amount"
              class="mb-2 block text-sm font-semibold text-gray-700"
            >
              <span class="mr-2">💰</span>You send
            </label>
            <AmountInput
              id="amount"
              v-model="amount"
              label="Amount"
              :from="from"
              :to="to"
              :currency-code="fromCurrency"
              :error="errors.amount ? 'Enter amount' : ''"
              :input-class="errors.amount ? 'border-red-500' : 'border-gray-300'"
            />
          </div>

          <div>
            <label
              for="from-currency"
              class="mb-2 block text-sm font-semibold text-gray-700"
            >From</label>
            <CurrencySelect
              id="from-currency"
              v-model="fromCurrency"
              label="From currency"
              :country-code="from"
              :error="errors.fromCurrency ? 'Select currency' : ''"
              :select-class="errors.fromCurrency ? 'border-red-500' : 'border-gray-300'"
            />
          </div>

          <div>
            <label
              for="to-currency"
              class="mb-2 block text-sm font-semibold text-gray-700"
            >To</label>
            <CurrencySelect
              id="to-currency"
              v-model="toCurrency"
              label="To currency"
              :country-code="to"
              :error="errors.toCurrency ? 'Select currency' : ''"
              :select-class="errors.toCurrency ? 'border-red-500' : 'border-gray-300'"
            />
          </div>

          <div class="flex items-end sm:col-span-2 md:col-span-1">
            <button
              type="submit"
              class="h-12 w-full rounded-lg bg-primary-600 font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">Searching...</span>
              <span v-else>Compare</span>
            </button>
          </div>
        </div>

        <p
          v-if="formError"
          class="mt-3 text-center text-sm text-red-500"
          role="status"
          aria-live="polite"
        >
          {{ formError }}
        </p>
      </form>

      <!-- Trust indicators -->
      <div class="mt-8 grid w-full max-w-4xl grid-cols-2 gap-x-4 gap-y-6 text-sm lg:grid-cols-4">
        <div class="flex items-start gap-3 text-white/90">
          <span class="text-2xl flex-shrink-0">🔒</span>
          <span class="font-medium leading-tight">Bank-level security across every provider</span>
        </div>
        <div class="flex items-start gap-3 text-white/90">
          <span class="text-2xl flex-shrink-0">🏛️</span>
          <span class="font-medium leading-tight">Licensed and regulated in the US, UK & Australia</span>
        </div>
        <div class="flex items-start gap-3 text-white/90">
          <span class="text-2xl flex-shrink-0">⚡</span>
          <span class="font-medium leading-tight">Fresh rates every 10 minutes from live market feeds</span>
        </div>
        <div class="flex items-start gap-3 text-white/90">
          <span class="text-2xl flex-shrink-0">📊</span>
          <span class="font-medium leading-tight">Savings insights for 200+ corridors worldwide</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import AmountInput from '~/components/shared/AmountInput.vue'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'
import { getCorridorUrl } from '~/utils/country-slugs'
import { getAvailableCurrencies } from '~/utils/countries-currencies'
import { getMaxAmount, getMinAmount, sanitizeAmount } from '~/utils/currency-limits'

interface Props {
  defaultFrom?: string
  defaultTo?: string
  defaultAmount?: number
}

const props = withDefaults(defineProps<Props>(), {
  defaultFrom: 'US',
  defaultTo: 'IN',
  defaultAmount: 1000,
})

interface FormErrors {
  from: boolean
  to: boolean
  amount: boolean
  fromCurrency: boolean
  toCurrency: boolean
}

const currencyFallback = 'USD'
const defaultCurrencyByCountry: Record<string, string> = {
  US: 'USD',
  UK: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  NZ: 'NZD',
  IN: 'INR',
  MX: 'MXN',
  PH: 'PHP',
  NG: 'NGN',
  BR: 'BRL',
  CN: 'CNY',
  PK: 'PKR',
  JP: 'JPY',
  EU: 'EUR',
}

const resolveCurrency = (country?: string) => defaultCurrencyByCountry[country || ''] || currencyFallback
const normalizeCurrency = (value: string) => value.trim().toUpperCase()

const resolveAllowedCurrency = (countryCode: string, candidate: string, fallback: string) => {
  const allowed = getAvailableCurrencies(countryCode).map(normalizeCurrency)
  const normalizedCandidate = normalizeCurrency(candidate || fallback)
  if (allowed.length === 0) {
    return normalizedCandidate
  }
  if (allowed.includes(normalizedCandidate)) {
    return normalizedCandidate
  }
  const normalizedFallback = normalizeCurrency(fallback)
  if (allowed.includes(normalizedFallback)) {
    return normalizedFallback
  }
  return allowed[0]
}

const from = ref(props.defaultFrom)
const to = ref(props.defaultTo)
const amount = ref(props.defaultAmount)
const fromCurrency = ref(resolveCurrency(from.value))
const toCurrency = ref(resolveCurrency(to.value))
const isSubmitting = ref(false)
const formError = ref('')

const errors = ref<FormErrors>({
  from: false,
  to: false,
  amount: false,
  fromCurrency: false,
  toCurrency: false,
})

const updateFormError = () => {
  formError.value = Object.values(errors.value).some(Boolean)
    ? 'Please complete the highlighted fields.'
    : ''
}

const setError = (key: keyof FormErrors, value: boolean) => {
  errors.value[key] = value
  updateFormError()
}

const amountLimits = computed(() => {
  const currency = normalizeCurrency(fromCurrency.value || resolveCurrency(from.value))
  return {
    minAmount: getMinAmount(currency),
    maxAmount: getMaxAmount(currency),
  }
})

const clampAmount = () => {
  const currency = normalizeCurrency(fromCurrency.value || resolveCurrency(from.value))
  const sanitized = sanitizeAmount(amount.value, currency, {
    minAmount: amountLimits.value.minAmount,
    maxAmount: amountLimits.value.maxAmount,
    strict: true,
  })
  if (sanitized !== amount.value) {
    amount.value = sanitized
  }
  setError('amount', !sanitized || sanitized <= 0)
}

watch(
  () => props.defaultFrom,
  (value) => {
    if (value) {
      from.value = value
    }
  },
)

watch(
  () => props.defaultTo,
  (value) => {
    if (value) {
      to.value = value
    }
  },
)

watch(
  () => props.defaultAmount,
  (value) => {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      amount.value = value
      clampAmount()
    }
  },
)

watch(
  from,
  (newCountry, previousCountry) => {
    setError('from', !newCountry)

    if (!newCountry) {
      return
    }

    const previousDefaultCurrency = resolveCurrency(previousCountry)
    const nextDefaultCurrency = resolveCurrency(newCountry)

    if (!fromCurrency.value || normalizeCurrency(fromCurrency.value) === normalizeCurrency(previousDefaultCurrency)) {
      fromCurrency.value = resolveAllowedCurrency(newCountry, nextDefaultCurrency, nextDefaultCurrency)
    } else {
      fromCurrency.value = resolveAllowedCurrency(newCountry, fromCurrency.value, nextDefaultCurrency)
    }
    clampAmount()
  },
)

watch(
  to,
  (newCountry, previousCountry) => {
    setError('to', !newCountry)

    if (!newCountry) {
      return
    }

    const previousDefaultCurrency = resolveCurrency(previousCountry)
    const nextDefaultCurrency = resolveCurrency(newCountry)

    if (!toCurrency.value || normalizeCurrency(toCurrency.value) === normalizeCurrency(previousDefaultCurrency)) {
      toCurrency.value = resolveAllowedCurrency(newCountry, nextDefaultCurrency, nextDefaultCurrency)
    } else {
      toCurrency.value = resolveAllowedCurrency(newCountry, toCurrency.value, nextDefaultCurrency)
    }
  },
)

watch(amount, () => {
  clampAmount()
})

watch(fromCurrency, (value) => {
  if (!from.value) {
    setError('fromCurrency', !value)
    return
  }
  const fallback = resolveCurrency(from.value)
  const next = resolveAllowedCurrency(from.value, value || fallback, fallback)
  if (normalizeCurrency(value || '') !== next) {
    fromCurrency.value = next
  }
  setError('fromCurrency', !next)
  clampAmount()
})

watch(toCurrency, (value) => {
  if (!to.value) {
    setError('toCurrency', !value)
    return
  }
  const fallback = resolveCurrency(to.value)
  const next = resolveAllowedCurrency(to.value, value || fallback, fallback)
  if (normalizeCurrency(value || '') !== next) {
    toCurrency.value = next
  }
  setError('toCurrency', !next)
})

clampAmount()

const validateForm = () => {
  setError('from', !from.value)
  setError('to', !to.value)
  clampAmount()
  setError('fromCurrency', !fromCurrency.value)
  setError('toCurrency', !toCurrency.value)

  const hasErrors = Object.values(errors.value).some(Boolean)
  return !hasErrors
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    const corridorUrl = getCorridorUrl(from.value, to.value)
    const safeFromCurrency = normalizeCurrency(fromCurrency.value || resolveCurrency(from.value))
    const safeToCurrency = normalizeCurrency(toCurrency.value || resolveCurrency(to.value))
    clampAmount()
    await navigateTo(
      `${corridorUrl}?amount=${amount.value}&fromCurrency=${safeFromCurrency}&toCurrency=${safeToCurrency}`,
    )
  }
  catch (error) {
    console.error('Navigation error:', error)
  }
  finally {
    isSubmitting.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !isSubmitting.value) {
    handleSubmit()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
