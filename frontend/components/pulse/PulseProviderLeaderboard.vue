<template>
  <div class="card-surface overflow-hidden">
    <div class="border-b border-white/[0.08] px-6 py-4">
      <h2 class="text-body-lg font-bold text-white">
        Provider Leaderboard
      </h2>
      <p class="text-body-sm text-neutral-400">
        Ranked by delivered amount for {{ store.corridor?.label }} | {{ amountDisplay }}
      </p>
    </div>

    <div class="px-6 py-4">
      <div
        v-if="loading"
        class="flex h-32 items-center justify-center"
      >
        <div class="flex items-center gap-3 text-neutral-400">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
          Loading benchmark data...
        </div>
      </div>

      <div
        v-else-if="rows.length"
        class="overflow-x-auto"
      >
        <table class="min-w-full text-body-sm">
          <thead class="text-body-sm uppercase tracking-wider text-neutral-500">
            <tr>
              <th class="px-3 py-2 text-left">
                Rank
              </th>
              <th class="px-3 py-2 text-left">
                Provider
              </th>
              <th class="px-3 py-2 text-right">
                Delivered
              </th>
              <th class="px-3 py-2 text-right">
                Total Cost
              </th>
              <th class="px-3 py-2 text-right">
                Fee
              </th>
              <th class="px-3 py-2 text-right">
                FX Markup
              </th>
              <th class="px-3 py-2 text-left">
                Speed
              </th>
              <th class="px-3 py-2 text-right">
                Win Rate (7D)
              </th>
              <th class="px-3 py-2 text-right">
                Reliability
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-700">
            <tr
              v-for="(row, index) in rows"
              :key="row.provider"
              class="odd:bg-white/[0.02] transition-colors"
              :class="index === 0 ? 'bg-brand-600/10' : 'hover:bg-neutral-900'"
            >
              <td
                class="px-3 py-3 text-left"
                :class="[
                  index === 0 ? 'text-emerald-400 font-bold'
                  : index === 1 ? 'text-blue-400 font-semibold'
                  : index === 2 ? 'text-amber-400 font-semibold'
                  : 'text-neutral-500',
                ]"
              >
                #{{ index + 1 }}
              </td>
              <td class="px-3 py-3 text-left text-white">
                {{ row.provider }}
              </td>
              <td class="px-3 py-3 text-right font-semibold text-white text-mono-value">
                {{ deliveredMoney(row.deliveredAmount) }}
              </td>
              <td class="px-3 py-3 text-right">
                <div class="font-semibold text-white text-mono-value">
                  {{ sendMoney(row.totalCost) }}
                </div>
                <div class="text-body-sm text-neutral-500 text-mono-value">
                  {{ row.totalCostBps }} bps
                </div>
              </td>
              <td class="px-3 py-3 text-right text-neutral-300 text-mono-value">
                {{ sendMoney(row.fee) }}
              </td>
              <td class="px-3 py-3 text-right text-neutral-300 text-mono-value">
                {{ row.markupBps }} bps
              </td>
              <td class="px-3 py-3 text-left text-neutral-300">
                {{ row.speed }}
              </td>
              <td class="px-3 py-3 text-right text-neutral-300 text-mono-value">
                {{ formatPercent(row.winRate, { digits: 0 }) }}
              </td>
              <td class="px-3 py-3 text-right text-neutral-300 text-mono-value">
                {{ formatPercent(row.reliability, { digits: 1 }) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <svg
xmlns="http://www.w3.org/2000/svg"
class="mb-3 h-10 w-10 text-neutral-600"
fill="none"
viewBox="0 0 24 24"
stroke="currentColor"
stroke-width="1.5"
>
          <path
stroke-linecap="round"
stroke-linejoin="round"
d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"
/>
        </svg>
        <p class="text-body-sm font-medium text-neutral-400">No provider data available</p>
        <p class="mt-1 text-body-sm text-neutral-600">Select a corridor to see the leaderboard</p>
      </div>
    </div>

    <div class="border-t border-white/[0.08] px-6 py-3 text-body-sm text-neutral-500">
      Winner = highest delivered amount at the selected amount and method.
    </div>

    <PulseTrustStamp
      :last-updated="store.lastUpdated || null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import { getProviderBenchmarkingData } from '~/lib/pulseApi'
import type { PulseProviderBenchmarkRow } from '~/types/pulse'
import { formatMoney, formatPercent } from '~/shared/lib/format'

const store = usePulseStore()

const loading = ref(true)
const rows = ref<PulseProviderBenchmarkRow[]>([])

const sendCurrency = computed(() => store.corridor?.fromCode || 'USD')
const recvCurrency = computed(() => store.corridor?.toCode || 'USD')

const amountDisplay = computed(() => formatMoney(store.amount, { currency: sendCurrency.value, maximumFractionDigits: 0 }))
const sendMoney = (amount: number) => formatMoney(amount, { currency: sendCurrency.value })
const deliveredMoney = (amount: number) => formatMoney(amount, { currency: recvCurrency.value, maximumFractionDigits: 0 })

async function loadData() {
  loading.value = true
  try {
    rows.value = await getProviderBenchmarkingData(store.corridor, store.timeframe, store.amount)
  }
  catch (e) {
    useLogger('PulseProviderLeaderboard').error('Failed to load provider benchmarking data', e)
  }
  finally {
    loading.value = false
  }
}

watch(
  () => [store.corridor, store.timeframe, store.amount],
  () => loadData(),
  { deep: true },
)

onMounted(() => {
  loadData()
})
</script>
