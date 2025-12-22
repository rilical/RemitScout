<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <div class="border-b border-neutral-700 px-6 py-4">
      <div class="flex items-center gap-3 mb-2">
        <svg class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2 class="text-lg font-bold text-white">OPERATIONAL COVERAGE</h2>
        <span class="rounded-full bg-brand-600/20 border border-brand-600/30 px-2 py-0.5 text-xs font-semibold text-brand-600">Plus</span>
      </div>
      <p class="text-sm text-neutral-400">Quote success, freshness, and liquidity signals</p>
    </div>

    <div class="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
      <!-- Quote Success Rate -->
      <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-white">Quote Success Rate</h3>
          <span class="rounded-full bg-brand-600/20 border border-brand-600/30 px-2 py-0.5 text-xs font-semibold text-brand-600">Plus</span>
        </div>
        <div class="mb-2">
          <div class="text-2xl font-bold text-white mb-1">{{ quoteSuccessRate.toFixed(1) }}%</div>
          <div class="text-xs text-neutral-400">{{ quoteSuccessDelta }}</div>
        </div>
        <div class="h-32 rounded border border-neutral-700 bg-neutral-800 flex items-center justify-center">
          <div class="text-xs text-neutral-500">Chart placeholder</div>
        </div>
        <div class="mt-3 flex gap-2">
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">View</button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">Share</button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">Embed</button>
        </div>
      </div>

      <!-- Provider Availability -->
      <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-white">Provider Availability</h3>
          <span class="rounded-full bg-brand-600/20 border border-brand-600/30 px-2 py-0.5 text-xs font-semibold text-brand-600">Plus</span>
        </div>
        <div class="mb-2">
          <div class="text-2xl font-bold text-white mb-1">Average availability {{ providerAvailability.toFixed(1) }} providers</div>
          <div class="text-xs text-neutral-400">Providers returning quotes per interval</div>
        </div>
        <div class="h-32 rounded border border-neutral-700 bg-neutral-800 flex items-center justify-center">
          <div class="text-xs text-neutral-500">Chart placeholder</div>
        </div>
        <div class="mt-3 flex gap-2">
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">View</button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">Share</button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">Embed</button>
        </div>
      </div>

      <!-- Data Freshness -->
      <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-white">Data Freshness (p50/p95)</h3>
          <span class="rounded-full bg-brand-600/20 border border-brand-600/30 px-2 py-0.5 text-xs font-semibold text-brand-600">Plus</span>
        </div>
        <div class="mb-2">
          <div class="text-2xl font-bold text-white mb-1">p95 freshness {{ freshnessP95 }} min</div>
          <div class="text-xs text-neutral-400">Quote age distribution in minutes</div>
        </div>
        <div class="h-32 rounded border border-neutral-700 bg-neutral-800 flex items-center justify-center">
          <div class="text-xs text-neutral-500">Chart placeholder</div>
        </div>
        <div class="mt-3 flex gap-2">
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">View</button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">Share</button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">Embed</button>
        </div>
      </div>

      <!-- Corridor Liquidity Signal -->
      <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-white">Corridor Liquidity Signal</h3>
          <span class="rounded-full bg-brand-600/20 border border-brand-600/30 px-2 py-0.5 text-xs font-semibold text-brand-600">Plus</span>
        </div>
        <div class="mb-2">
          <div class="text-2xl font-bold text-white mb-1">Liquidity index {{ liquidityIndex }}</div>
          <div class="text-xs text-neutral-400">Based on quote density and provider coverage</div>
        </div>
        <div class="h-32 rounded border border-neutral-700 bg-neutral-800 flex items-center justify-center">
          <div class="text-xs text-neutral-500">Chart placeholder</div>
        </div>
        <div class="mt-3 flex gap-2">
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">View</button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">Share</button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">Embed</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import { getChartData } from '~/lib/pulseMockApi'

const store = usePulseStore()

const quoteSuccessRate = ref(98.4)
const quoteSuccessDelta = ref('+0.3% vs 7d avg')
const providerAvailability = ref(5.0)
const freshnessP95 = ref(9)
const liquidityIndex = ref(59)

async function loadData() {
  try {
    const [successData, availabilityData, freshnessData, liquidityData] = await Promise.all([
      getChartData('quote-success', store.filtersForApi),
      getChartData('provider-availability', store.filtersForApi),
      getChartData('data-freshness', store.filtersForApi),
      getChartData('corridor-liquidity', store.filtersForApi),
    ])

    if (successData?.series) {
      const lastValues = successData.series.map(s => s.points[s.points.length - 1]?.v || 0) || []
      const average = lastValues.length ? lastValues.reduce((sum, v) => sum + v, 0) / lastValues.length : 98.4
      quoteSuccessRate.value = average
      const delta = (Math.random() - 0.5) * 1
      quoteSuccessDelta.value = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs 7d avg`
    }

    if (availabilityData?.series) {
      const lastValues = availabilityData.series.map(s => s.points[s.points.length - 1]?.v || 0) || []
      const average = lastValues.length ? lastValues.reduce((sum, v) => sum + v, 0) / lastValues.length : 5.0
      providerAvailability.value = average
    }

    if (freshnessData?.series) {
      const lastValues = freshnessData.series.map(s => s.points[s.points.length - 1]?.v || 0) || []
      const p95 = lastValues.length ? Math.max(...lastValues) : 9
      freshnessP95.value = Math.round(p95)
    }

    if (liquidityData?.series) {
      const lastValues = liquidityData.series.map(s => s.points[s.points.length - 1]?.v || 0) || []
      const average = lastValues.length ? lastValues.reduce((sum, v) => sum + v, 0) / lastValues.length : 59
      liquidityIndex.value = Math.round(average)
    }
  } catch (e) {
    console.error('Failed to load operational coverage data:', e)
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

