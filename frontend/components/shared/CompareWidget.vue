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
          class="h-12 flex items-center justify-center gap-2 rounded-lg bg-white px-8 text-sm font-bold text-blue-700 hover:bg-blue-50 hover:shadow-lg shadow-md transition-all disabled:bg-white/40 disabled:text-blue-300 disabled:cursor-not-allowed disabled:shadow-none whitespace-nowrap"
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import { getCorridorUrl } from '~/utils/country-slugs'

const router = useRouter()

const toPlaceholder = '📍 Select Destination'

const form = ref({
  from: 'US', // Default to US, can be replaced with geolocation
  to: '',
  amount: 200, // Default $200 equivalent
  fromCurrency: 'USD',
  toCurrency: '', // Will be updated based on destination
})

// Currency mapping for auto-detection
const defaultCurrencyByCountry: Record<string, string> = {
  US: 'USD', UK: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD',
  IN: 'INR', MX: 'MXN', PH: 'PHP', NG: 'NGN', KE: 'KES',
  GB: 'GBP', IE: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR',
  ES: 'EUR', PT: 'EUR', BR: 'BRL', CN: 'CNY', JP: 'JPY',
  PK: 'PKR', BD: 'BDT', VN: 'VND', TH: 'THB', MY: 'MYR',
  ID: 'IDR', ZA: 'ZAR', EG: 'EGP', JO: 'JOD', AE: 'AED',
  KW: 'KWD', SA: 'SAR', QA: 'QAR', BH: 'BHD', OM: 'OMR',
}

// Auto-set currencies when countries change
watch(() => form.value.from, (newFrom) => {
  form.value.fromCurrency = defaultCurrencyByCountry[newFrom] || 'USD'
})

watch(() => form.value.to, (newTo) => {
  if (newTo) {
    form.value.toCurrency = defaultCurrencyByCountry[newTo] || 'USD'
  }
})

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
    // Redirect to send-money page with full-name slugs and default amount
    const corridorUrl = getCorridorUrl(form.value.from, form.value.to)
    router.push(`${corridorUrl}?amount=${form.value.amount}`)
  }
}
</script>

<style scoped>
/* Safe area padding for mobile bottom bar */
.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
</style>
