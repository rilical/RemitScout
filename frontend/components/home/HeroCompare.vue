<template>
  <section
    id="hero-compare"
    class="relative overflow-hidden bg-gradient-to-b from-brand-600/5 to-white"
  >
    <div class="container py-12 sm:py-20">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
        <div class="lg:col-span-3">
          <h1 class="text-hero font-bold text-neutral-900 leading-tight mb-4">
            {{ STR.hero.h1 }}
          </h1>
          <p class="text-body-lg text-neutral-600 mb-8 leading-relaxed">
            {{ STR.hero.sub }}
          </p>

          <div class="bg-surface rounded-2xl border border-neutral-200 p-6 shadow-xl">
            <form
              role="search"
              aria-label="Money transfer comparison form"
              @submit.prevent="handleSubmit"
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    for="from-country"
                    class="block text-body-sm font-semibold text-neutral-700 mb-2"
                  >
                    Sending from
                  </label>
                  <CountrySelect
                    id="from-country"
                    v-model="from"
                    label="Sending from"
                    :exclude-country="to"
                    :error="errors.from ? 'Select a country' : ''"
                    :select-class="errors.from ? 'border-danger-600' : 'border-neutral-300'"
                  />
                </div>

                <div>
                  <label
                    for="to-country"
                    class="block text-body-sm font-semibold text-neutral-700 mb-2"
                  >
                    Receiving in
                  </label>
                  <CountrySelect
                    id="to-country"
                    v-model="to"
                    label="Receiving in"
                    :exclude-country="from"
                    :error="errors.to ? 'Select a country' : ''"
                    :select-class="errors.to ? 'border-danger-600' : 'border-neutral-300'"
                  />
                </div>
              </div>

              <div class="mb-4">
                <label
                  for="amount"
                  class="block text-body-sm font-semibold text-neutral-700 mb-2"
                >
                  You send
                </label>
                <AmountInput
                  id="amount"
                  v-model="amount"
                  label="Amount"
                  :from="from"
                  :to="to"
                  :currency-code="fromCurrency"
                  :error="errors.amount ? 'Enter amount' : ''"
                  :input-class="errors.amount ? 'border-danger-600' : 'border-neutral-300'"
                />
              </div>

              <div class="mb-6">
                <label class="block text-body-sm font-semibold text-neutral-700 mb-2">
                  Delivery method
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="method in deliveryMethods"
                    :key="method.value"
                    type="button"
                    class="flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-brand-600"
                    :class="selectedMethod === method.value
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-neutral-200 bg-surface text-neutral-700 hover:border-brand-300'"
                    @click="selectedMethod = method.value"
                  >
                    <span class="text-h3 mb-1">{{ method.icon }}</span>
                    <span class="text-body-sm font-semibold text-center">{{ method.label }}</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                :disabled="isSubmitting"
                class="w-full min-h-btn bg-brand-600 text-white font-semibold rounded-btn hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50"
              >
                {{ isSubmitting ? 'Searching...' : STR.hero.cta }}
              </button>

              <p
                v-if="formError"
                class="mt-3 text-center text-body-sm text-danger-600"
                role="status"
                aria-live="polite"
              >
                {{ formError }}
              </p>
            </form>

            <div class="mt-6 pt-6 border-t border-neutral-100">
              <p class="text-body-sm text-neutral-600 mb-3">
                {{ STR.hero.pill }}
              </p>
              <div class="flex items-center gap-2 text-body-sm text-neutral-500">
                <svg
                  class="h-4 w-4 text-success-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span>{{ STR.hero.micro }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 hidden lg:block">
          <div class="relative">
            <div class="aspect-square bg-gradient-to-br from-brand-100 to-brand-50 rounded-3xl flex items-center justify-center">
              <div class="text-center">
                <div class="text-7xl mb-4">
                  🌍
                </div>
                <div class="flex items-center justify-center gap-3 text-h1">
                  <span>🇺🇸</span>
                  <svg
                    class="h-8 w-8 text-brand-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                  <span>🇵🇭</span>
                </div>
                <p class="mt-6 text-body-sm text-neutral-600 max-w-xs mx-auto">
                  Most popular routes for expats near you
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DELIVERY_METHODS } from '~/composables/useCompareForm'
import { getCorridorUrl } from '~/utils/country-slugs'
import { getAvailableCurrencies, getCountryByCode } from '~/utils/countries-currencies'
import { getMaxAmount, getMinAmount, sanitizeAmount } from '~/utils/currency-limits'

const { STR } = useStrings()

interface Props {
  defaultFrom?: string
  defaultTo?: string
  defaultAmount?: number
  defaultMethod?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultFrom: 'US',
  defaultTo: 'PH',
  defaultAmount: 500,
  defaultMethod: 'bank',
})

interface FormErrors {
  from: boolean
  to: boolean
  amount: boolean
}

const from = ref(props.defaultFrom)
const to = ref(props.defaultTo)
const amount = ref(props.defaultAmount)
const fromCurrency = ref('')
const toCurrency = ref('')
const selectedMethod = ref(props.defaultMethod)
const isSubmitting = ref(false)
const formError = ref('')
const deliveryMethods = DELIVERY_METHODS

const errors = ref<FormErrors>({
  from: false,
  to: false,
  amount: false,
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

const normalizeCurrency = (value: string) => value.trim().toUpperCase()

const resolveCurrency = (countryCode: string) => {
  const country = getCountryByCode(countryCode.toUpperCase())
  return country?.currency?.toUpperCase() || 'USD'
}

const resolveAllowedCurrency = (countryCode: string, candidate: string) => {
  const allowed = getAvailableCurrencies(countryCode).map(normalizeCurrency)
  const normalizedCandidate = normalizeCurrency(candidate || resolveCurrency(countryCode))
  if (allowed.length === 0) {
    return normalizedCandidate
  }
  if (allowed.includes(normalizedCandidate)) {
    return normalizedCandidate
  }
  const fallback = resolveCurrency(countryCode)
  if (allowed.includes(fallback)) {
    return fallback
  }
  return allowed[0]
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

fromCurrency.value = resolveAllowedCurrency(from.value, fromCurrency.value || resolveCurrency(from.value))
toCurrency.value = resolveAllowedCurrency(to.value, toCurrency.value || resolveCurrency(to.value))
clampAmount()

watch(from, (newVal) => {
  setError('from', !newVal)
  if (!newVal) return
  fromCurrency.value = resolveAllowedCurrency(newVal, fromCurrency.value || resolveCurrency(newVal))
  clampAmount()
})

watch(to, (newVal) => {
  setError('to', !newVal)
  if (!newVal) return
  toCurrency.value = resolveAllowedCurrency(newVal, toCurrency.value || resolveCurrency(newVal))
})

watch(amount, () => {
  clampAmount()
})

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

const validateForm = () => {
  setError('from', !from.value)
  setError('to', !to.value)
  clampAmount()

  return !Object.values(errors.value).some(Boolean)
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
      `${corridorUrl}?amount=${amount.value}&method=${selectedMethod.value}&fromCurrency=${safeFromCurrency}&toCurrency=${safeToCurrency}`,
    )
  }
  catch (error) {
    useLogger('HeroCompare').error('Navigation error', error)
  }
  finally {
    isSubmitting.value = false
  }
}

defineExpose({
  prefillForm: (data: { from?: string, to?: string, amount?: number, method?: string }) => {
    if (data.from) from.value = data.from
    if (data.to) to.value = data.to
    if (data.amount) amount.value = data.amount
    if (data.method) selectedMethod.value = data.method
  },
})
</script>
