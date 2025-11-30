<template>
  <div class="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 p-6 shadow-xl">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="text-white max-w-xl">
        <p class="text-sm font-semibold uppercase tracking-wide text-brand-50">
          Compare now
        </p>
        <h3 class="text-2xl font-bold leading-tight">
          Find the cheapest way to send money
        </h3>
        <p class="text-brand-50 text-sm mt-1">
          Live fees, FX markups, and delivery speed across bank, cash, and wallet payouts.
        </p>
      </div>
      <div class="w-full max-w-xl rounded-xl bg-white p-4 shadow-lg">
        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <label class="text-xs font-semibold text-gray-700 mb-1 block">From</label>
            <CountrySelect
              v-model="from"
              label="From country"
              placeholder="United States"
              select-class="h-11"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-700 mb-1 block">To</label>
            <CountrySelect
              v-model="to"
              label="To country"
              placeholder="India"
              select-class="h-11"
            />
          </div>
        </div>
        <div class="mt-3 grid gap-3 md:grid-cols-3">
          <div class="md:col-span-2">
            <label class="text-xs font-semibold text-gray-700 mb-1 block">Amount</label>
            <div class="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-3">
              <input
                v-model.number="amount"
                type="number"
                min="1"
                class="h-10 w-full bg-transparent text-gray-900 focus:outline-none"
                placeholder="e.g. 500"
              >
              <span class="text-sm font-semibold text-gray-600 ml-2">{{ fromCurrency }}</span>
            </div>
          </div>
          <div class="flex items-end">
            <button
              class="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-white font-semibold shadow hover:bg-brand-700 transition"
              @click="handleCompare"
            >
              Compare
            </button>
          </div>
        </div>
        <div class="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label class="text-xs font-semibold text-gray-700 mb-1 block">Send currency</label>
            <CurrencySelect
              v-model="fromCurrency"
              label="Send currency"
              select-class="h-11"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-700 mb-1 block">Receive currency</label>
            <CurrencySelect
              v-model="toCurrency"
              label="Receive currency"
              select-class="h-11"
            />
          </div>
        </div>
        <p class="mt-3 text-xs text-gray-500">
          We rank by total cost (fees + FX), speed, and payout options. No pay-to-play.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCorridorUrl } from '~/utils/country-slugs'

const from = ref('US')
const to = ref('IN')
const amount = ref(500)
const fromCurrency = ref('USD')
const toCurrency = ref('INR')

const router = useRouter()

const handleCompare = () => {
  if (!from.value || !to.value) return
  router.push({
    path: getCorridorUrl(from.value, to.value),
    query: { amount: amount.value, fromCurrency: fromCurrency.value, toCurrency: toCurrency.value },
  })
}
</script>
