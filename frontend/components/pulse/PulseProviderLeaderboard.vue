<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <div class="border-b border-neutral-700 px-6 py-4">
      <h2 class="text-lg font-bold text-white">Provider Leaderboard</h2>
      <p class="text-sm text-neutral-400">
        Ranked by delivered amount for {{ store.corridor.label }} | {{ store.amount.toLocaleString() }} {{ store.corridor.fromCode }}
      </p>
    </div>

    <div class="px-6 py-4">
      <div v-if="loading" class="flex h-32 items-center justify-center">
        <div class="flex items-center gap-3 text-neutral-400">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading benchmark data...
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th class="px-3 py-2 text-left">Rank</th>
              <th class="px-3 py-2 text-left">Provider</th>
              <th class="px-3 py-2 text-right">Delivered</th>
              <th class="px-3 py-2 text-right">Total Cost</th>
              <th class="px-3 py-2 text-right">Fee</th>
              <th class="px-3 py-2 text-right">FX Markup</th>
              <th class="px-3 py-2 text-left">Speed</th>
              <th class="px-3 py-2 text-right">Win Rate (7D)</th>
              <th class="px-3 py-2 text-right">Reliability</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-700">
            <tr
              v-for="(row, index) in rows"
              :key="row.provider"
              class="transition-colors"
              :class="index === 0 ? 'bg-brand-600/10' : 'hover:bg-neutral-900'"
            >
              <td class="px-3 py-3 text-left font-semibold text-white">#{{ index + 1 }}</td>
              <td class="px-3 py-3 text-left text-white">{{ row.provider }}</td>
              <td class="px-3 py-3 text-right font-semibold text-white">
                {{ currencySymbol }}{{ formatNumber(row.deliveredAmount) }}
              </td>
              <td class="px-3 py-3 text-right">
                <div class="font-semibold text-white">${{ row.totalCost.toFixed(2) }}</div>
                <div class="text-xs text-neutral-500">{{ row.totalCostBps }} bps</div>
              </td>
              <td class="px-3 py-3 text-right text-neutral-300">${{ row.fee.toFixed(2) }}</td>
              <td class="px-3 py-3 text-right text-neutral-300">{{ row.markupBps }} bps</td>
              <td class="px-3 py-3 text-left text-neutral-300">{{ row.speed }}</td>
              <td class="px-3 py-3 text-right text-neutral-300">{{ row.winRate }}%</td>
              <td class="px-3 py-3 text-right text-neutral-300">{{ row.reliability.toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="border-t border-neutral-700 px-6 py-3 text-xs text-neutral-500">
      Winner = highest delivered amount at the selected amount and method.
    </div>

    <PulseTrustStamp v-if="lastUpdated" :last-updated="lastUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import { getProviderBenchmarkingData, getCurrencySymbol } from '~/lib/pulseApi'
import type { PulseProviderBenchmarkRow } from '~/types/pulse'

const store = usePulseStore()

const loading = ref(true)
const rows = ref<PulseProviderBenchmarkRow[]>([])
const lastUpdated = ref<string | null>(null)

const currencySymbol = computed(() => getCurrencySymbol(store.corridor.toCode))

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

async function loadData() {
  loading.value = true
  try {
    rows.value = await getProviderBenchmarkingData(store.corridor, store.timeframe, store.amount)
    lastUpdated.value = new Date().toISOString()
  } catch (e) {
    console.error('Failed to load provider benchmarking data:', e)
  } finally {
    loading.value = false
  }
}

watch(
  () => [store.corridor, store.timeframe, store.amount],
  () => loadData(),
  { deep: true }
)

onMounted(() => {
  loadData()
})
</script>
