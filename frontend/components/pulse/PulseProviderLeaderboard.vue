<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <div class="border-b border-neutral-700 px-6 py-4">
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
        v-else
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
              class="transition-colors"
              :class="index === 0 ? 'bg-brand-600/10' : 'hover:bg-neutral-900'"
            >
              <td class="px-3 py-3 text-left font-semibold text-white">
                #{{ index + 1 }}
              </td>
              <td class="px-3 py-3 text-left text-white">
                {{ row.provider }}
              </td>
              <td class="px-3 py-3 text-right font-semibold text-white">
                {{ deliveredMoney(row.deliveredAmount) }}
              </td>
              <td class="px-3 py-3 text-right">
                <div class="font-semibold text-white">
                  {{ sendMoney(row.totalCost) }}
                </div>
                <div class="text-body-sm text-neutral-500">
                  {{ row.totalCostBps }} bps
                </div>
              </td>
              <td class="px-3 py-3 text-right text-neutral-300">
                {{ sendMoney(row.fee) }}
              </td>
              <td class="px-3 py-3 text-right text-neutral-300">
                {{ row.markupBps }} bps
              </td>
              <td class="px-3 py-3 text-left text-neutral-300">
                {{ row.speed }}
              </td>
              <td class="px-3 py-3 text-right text-neutral-300">
                {{ formatPercent(row.winRate, { digits: 0 }) }}
              </td>
              <td class="px-3 py-3 text-right text-neutral-300">
                {{ formatPercent(row.reliability, { digits: 1 }) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="border-t border-neutral-700 px-6 py-3 text-body-sm text-neutral-500">
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
