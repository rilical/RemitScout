<template>
  <!-- Desktop: Top sticky -->
  <div class="hidden md:block sticky top-16 z-40 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800 shadow-lg">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
      <form
        class="flex items-center justify-center gap-4"
        @submit.prevent="handleCompare"
      >
        <div class="flex-1 max-w-xs">
          <CountrySelect
            id="compare-from"
            v-model="form.from"
            label="From"
            placeholder="United States"
          />
        </div>

        <div class="flex items-center justify-center px-3 text-white/70">
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>

        <div class="flex-1 max-w-xs">
          <CountrySelect
            id="compare-to"
            v-model="form.to"
            label="To"
            :placeholder="toPlaceholder"
          />
        </div>

        <button
          type="submit"
          :disabled="!isValid"
          class="h-12 flex items-center justify-center gap-2 rounded-lg bg-white px-8 text-sm font-bold text-blue-700 hover:bg-blue-50 hover:shadow-lg shadow-md transition-all disabled:bg-white/40 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none whitespace-nowrap"
        >
          <span>Compare Rates</span>
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </form>
    </div>
  </div>

  <!-- Mobile: Bottom sticky -->
  <div class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 border-t border-blue-800 shadow-2xl">
    <div class="px-4 py-4 pb-safe">
      <form
        class="space-y-3"
        @submit.prevent="handleCompare"
      >
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <CountrySelect
              id="compare-from-mobile"
              v-model="form.from"
              label="From"
              placeholder="United States"
            />
          </div>

          <div class="flex items-center justify-center px-1 text-white/70">
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>

          <div class="flex-1">
            <CountrySelect
              id="compare-to-mobile"
              v-model="form.to"
              label="To"
              :placeholder="toPlaceholder"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="!isValid"
          class="w-full h-12 flex items-center justify-center gap-2 rounded-lg bg-white px-6 text-base font-bold text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all disabled:bg-white/40 disabled:text-blue-300 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <span>Compare Rates</span>
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import { getCorridorUrl } from '~/utils/country-slugs'
import { getAvailableCurrencies, getCountryByCode } from '~/utils/countries-currencies'
import { getMaxAmount, getMinAmount, sanitizeAmount } from '~/utils/currency-limits'

const router = useRouter()

const toPlaceholder = '📍 Select Destination'

const form = ref({
  from: 'US', // Default to US, can be replaced with geolocation
  to: '',
  amount: 200, // Default $200 equivalent
  fromCurrency: 'USD',
  toCurrency: '', // Will be updated based on destination
})

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

const clampAmount = () => {
  const currency = normalizeCurrency(form.value.fromCurrency || resolveCurrency(form.value.from))
  const sanitized = sanitizeAmount(form.value.amount, currency, {
    minAmount: getMinAmount(currency),
    maxAmount: getMaxAmount(currency),
    strict: true,
  })
  if (sanitized !== form.value.amount) {
    form.value.amount = sanitized
  }
}

// Auto-set currencies when countries change
watch(() => form.value.from, (newFrom) => {
  if (!newFrom) return
  form.value.fromCurrency = resolveAllowedCurrency(newFrom, form.value.fromCurrency || resolveCurrency(newFrom))
  clampAmount()
})

watch(() => form.value.to, (newTo) => {
  if (!newTo) return
  form.value.toCurrency = resolveAllowedCurrency(newTo, form.value.toCurrency || resolveCurrency(newTo))
})

watch(() => form.value.fromCurrency, (value) => {
  if (!form.value.from) return
  const next = resolveAllowedCurrency(form.value.from, value || resolveCurrency(form.value.from))
  if (normalizeCurrency(value || '') !== next) {
    form.value.fromCurrency = next
  }
  clampAmount()
})

watch(() => form.value.toCurrency, (value) => {
  if (!form.value.to) return
  const next = resolveAllowedCurrency(form.value.to, value || resolveCurrency(form.value.to))
  if (normalizeCurrency(value || '') !== next) {
    form.value.toCurrency = next
  }
})

watch(() => form.value.amount, () => {
  clampAmount()
})

form.value.fromCurrency = resolveAllowedCurrency(form.value.from, form.value.fromCurrency || resolveCurrency(form.value.from))
if (form.value.to) {
  form.value.toCurrency = resolveAllowedCurrency(form.value.to, form.value.toCurrency || resolveCurrency(form.value.to))
}
clampAmount()

// Form validation
const isValid = computed(() => {
  return (
    form.value.from
    && form.value.to
    && form.value.from !== form.value.to // Prevent same country transfers
  )
})

const handleCompare = () => {
  if (isValid.value) {
    clampAmount()
    // Redirect to send-money page with full-name slugs and default amount
    const corridorUrl = getCorridorUrl(form.value.from, form.value.to)
    const params = new URLSearchParams({
      amount: String(form.value.amount),
      fromCurrency: form.value.fromCurrency,
      toCurrency: form.value.toCurrency,
    })
    router.push(`${corridorUrl}?${params.toString()}`)
  }
}
</script>

<style scoped>
/* Safe area padding for mobile bottom bar */
.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
</style>
