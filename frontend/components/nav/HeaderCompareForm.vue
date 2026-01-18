<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCompareForm } from '~/composables/useCompareForm'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import { getMaxAmount, getMinAmount, sanitizeAmount } from '~/utils/currency-limits'

const { form, validationError, submit, DELIVERY_METHODS, statusMessage, isWaitingForQuotes } = useCompareForm()

const defaultCurrencyByCountry: Record<string, string> = {
  US: 'USD', UK: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD',
  IN: 'INR', MX: 'MXN', PH: 'PHP', NG: 'NGN', KE: 'KES',
  GB: 'GBP', IE: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR',
  ES: 'EUR', PT: 'EUR', BR: 'BRL', CN: 'CNY', JP: 'JPY',
}

const resolveCurrency = (countryCode: string): string => {
  return defaultCurrencyByCountry[countryCode] || 'USD'
}

const availableFromCurrencies = computed(() => {
  const homeCurrency = resolveCurrency(form.value.from)
  const baseCurrencies = ['USD', 'EUR', 'GBP']
  const currencies = new Set([homeCurrency, ...baseCurrencies])

  return Array.from(currencies)
    .map(code => ({ value: code, label: code }))
    .sort((a, b) => {
      if (a.value === homeCurrency) return -1
      if (b.value === homeCurrency) return 1
      return a.label.localeCompare(b.label)
    })
})

const availableToCurrencies = computed(() => {
  if (!form.value.to) return []

  const homeCurrency = resolveCurrency(form.value.to)
  const baseCurrencies = ['USD', 'EUR', 'GBP']
  const currencies = new Set([homeCurrency, ...baseCurrencies])

  return Array.from(currencies)
    .map(code => ({ value: code, label: code }))
    .sort((a, b) => {
      if (a.value === homeCurrency) return -1
      if (b.value === homeCurrency) return 1
      return a.label.localeCompare(b.label)
    })
})

const amountLimits = computed(() => {
  const currency = (form.value.fromCurrency || resolveCurrency(form.value.from)).toUpperCase()
  return {
    minAmount: getMinAmount(currency),
    maxAmount: getMaxAmount(currency),
  }
})

const clampAmount = () => {
  const currency = (form.value.fromCurrency || resolveCurrency(form.value.from)).toUpperCase()
  const sanitized = sanitizeAmount(form.value.amount, currency, {
    minAmount: amountLimits.value.minAmount,
    maxAmount: amountLimits.value.maxAmount,
    strict: true,
  })
  if (sanitized !== form.value.amount) {
    form.value.amount = sanitized
  }
}

watch(() => form.value.from, (newCountry) => {
  if (newCountry) {
    const newCurrency = resolveCurrency(newCountry)
    if (!form.value.fromCurrency || !availableFromCurrencies.value.find(c => c.value === form.value.fromCurrency)) {
      form.value.fromCurrency = newCurrency
    }
  }
  clampAmount()
})

watch(() => form.value.to, (newCountry) => {
  if (newCountry) {
    const newCurrency = resolveCurrency(newCountry)
    if (!form.value.toCurrency || !availableToCurrencies.value.find(c => c.value === form.value.toCurrency)) {
      form.value.toCurrency = newCurrency
    }
  }
  else {
    form.value.toCurrency = ''
  }
})

watch(() => form.value.fromCurrency, () => {
  clampAmount()
})

watch(() => form.value.amount, () => {
  clampAmount()
})

clampAmount()

const handleSubmit = async () => {
  await submit()
}
</script>

<template>
  <div class="bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
      <form
        class="flex flex-wrap items-end gap-3"
        @submit.prevent="handleSubmit"
      >
        <div class="flex-1 min-w-[140px]">
          <label
            for="header-from"
            class="block text-xs font-medium text-slate-700 mb-1"
          >
            From
          </label>
          <CountrySelect
            id="header-from"
            v-model="form.from"
            label="Sending from"
            :exclude-country="form.to"
            placeholder="United States"
          />
        </div>

        <div class="flex-1 min-w-[140px]">
          <label
            for="header-to"
            class="block text-xs font-medium text-slate-700 mb-1"
          >
            To
          </label>
          <CountrySelect
            id="header-to"
            v-model="form.to"
            label="Receiving in"
            :exclude-country="form.from"
            placeholder="Country"
          />
        </div>

        <div class="flex-1 min-w-[120px]">
          <label
            for="header-amount"
            class="block text-xs font-medium text-slate-700 mb-1"
          >
            Amount
          </label>
          <input
            id="header-amount"
            v-model.number="form.amount"
            type="number"
            :min="amountLimits.minAmount"
            :max="amountLimits.maxAmount"
            step="0.01"
            class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            placeholder="500"
          >
        </div>

        <div class="flex items-center gap-2">
          <button
            v-for="method in DELIVERY_METHODS"
            :key="method.value"
            type="button"
            :class="[
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all',
              form.method === method.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-300 hover:border-blue-600',
            ]"
            :aria-pressed="form.method === method.value"
            @click="form.method = method.value"
          >
            <span>{{ method.icon }}</span>
            <span class="hidden lg:inline">{{ method.label }}</span>
          </button>
        </div>

        <button
          type="submit"
          :disabled="isWaitingForQuotes"
          class="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span v-if="isWaitingForQuotes">Checking...</span>
          <span v-else>Compare</span>
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
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </form>

      <div
        v-if="validationError"
        role="alert"
        aria-live="polite"
        class="mt-3 text-sm text-red-600"
      >
        {{ validationError }}
      </div>

      <div
        v-else-if="statusMessage"
        role="status"
        aria-live="polite"
        class="mt-3 text-sm text-slate-600"
      >
        {{ statusMessage }}
      </div>
    </div>
  </div>
</template>
