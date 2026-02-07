<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <div class="border-b border-neutral-700 px-6 py-4">
      <div class="flex items-center gap-3 mb-2">
        <Icon
          name="chart-bar"
          :size="20"
          class="text-brand-600"
        />
        <h2 class="text-lg font-bold text-white">
          OPERATIONAL COVERAGE
        </h2>
        <span class="rounded-full bg-brand-600/20 border border-brand-600/30 px-2 py-0.5 text-xs font-semibold text-brand-600">Plus</span>
      </div>
      <p class="text-sm text-neutral-400">
        Quote success, freshness, and liquidity signals
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
      <!-- Quote Success Rate -->
      <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-white">
            Quote Success Rate
          </h3>
          <span class="rounded-full bg-brand-600/20 border border-brand-600/30 px-2 py-0.5 text-xs font-semibold text-brand-600">Plus</span>
        </div>
        <div class="mb-2">
          <div class="text-2xl font-bold text-white mb-1">
            {{ quoteSuccessRate !== null ? `${quoteSuccessRate.toFixed(1)}%` : 'n/a' }}
          </div>
          <div class="text-xs text-neutral-400">
            {{ quoteSuccessDelta }}
          </div>
        </div>
        <div class="h-32 rounded border border-neutral-700 bg-neutral-800 flex items-center justify-center">
          <PulseLineChart
            v-if="successSeries.length"
            :series="successSeries"
            unit="percent"
            :show-area="false"
          />
          <EmptyState
            v-else
            title="No data yet"
            description="No samples available for the selected range."
            variant="terminal"
            mode="inline"
          />
        </div>
        <div class="mt-3 flex gap-2">
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">
            View
          </button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">
            Share
          </button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">
            Embed
          </button>
        </div>
      </div>

      <!-- Provider Availability -->
      <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-white">
            Provider Availability
          </h3>
          <span class="rounded-full bg-brand-600/20 border border-brand-600/30 px-2 py-0.5 text-xs font-semibold text-brand-600">Plus</span>
        </div>
        <div class="mb-2">
          <div class="text-2xl font-bold text-white mb-1">
            Average availability {{ providerAvailability !== null ? providerAvailability.toFixed(1) : 'n/a' }} providers
          </div>
          <div class="text-xs text-neutral-400">
            Providers returning quotes per interval
          </div>
        </div>
        <div class="h-32 rounded border border-neutral-700 bg-neutral-800 flex items-center justify-center">
          <PulseLineChart
            v-if="availabilitySeries.length"
            :series="availabilitySeries"
            :show-area="false"
          />
          <EmptyState
            v-else
            title="No data yet"
            description="No samples available for the selected range."
            variant="terminal"
            mode="inline"
          />
        </div>
        <div class="mt-3 flex gap-2">
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">
            View
          </button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">
            Share
          </button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">
            Embed
          </button>
        </div>
      </div>

      <!-- Data Freshness -->
      <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-white">
            Data Freshness (p50/p95)
          </h3>
          <span class="rounded-full bg-brand-600/20 border border-brand-600/30 px-2 py-0.5 text-xs font-semibold text-brand-600">Plus</span>
        </div>
        <div class="mb-2">
          <div class="text-2xl font-bold text-white mb-1">
            p95 freshness {{ freshnessP95 !== null ? freshnessP95 : 'n/a' }} min
          </div>
          <div class="text-xs text-neutral-400">
            Quote age distribution in minutes
          </div>
        </div>
        <div class="h-32 rounded border border-neutral-700 bg-neutral-800 flex items-center justify-center">
          <PulseLineChart
            v-if="freshnessSeries.length"
            :series="freshnessSeries"
            :show-area="false"
          />
          <EmptyState
            v-else
            title="No data yet"
            description="No samples available for the selected range."
            variant="terminal"
            mode="inline"
          />
        </div>
        <div class="mt-3 flex gap-2">
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">
            View
          </button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">
            Share
          </button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">
            Embed
          </button>
        </div>
      </div>

      <!-- Corridor Liquidity Signal -->
      <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-white">
            Corridor Liquidity Signal
          </h3>
          <span class="rounded-full bg-brand-600/20 border border-brand-600/30 px-2 py-0.5 text-xs font-semibold text-brand-600">Plus</span>
        </div>
        <div class="mb-2">
          <div class="text-2xl font-bold text-white mb-1">
            Liquidity index {{ liquidityIndex !== null ? liquidityIndex : 'n/a' }}
          </div>
          <div class="text-xs text-neutral-400">
            Based on quote density and provider coverage
          </div>
        </div>
        <div class="h-32 rounded border border-neutral-700 bg-neutral-800 flex items-center justify-center">
          <PulseLineChart
            v-if="liquiditySeries.length"
            :series="liquiditySeries"
            :show-area="false"
          />
          <EmptyState
            v-else
            title="No data yet"
            description="No samples available for the selected range."
            variant="terminal"
            mode="inline"
          />
        </div>
        <div class="mt-3 flex gap-2">
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">
            View
          </button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">
            Share
          </button>
          <button class="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">
            Embed
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import { getChartData } from '~/lib/pulseApi'
import PulseLineChart from '~/components/pulse/PulseLineChart.vue'
import type { ChartSeries } from '~/types/pulse'
import { EmptyState, Icon } from '~/ui'

const store = usePulseStore()

const quoteSuccessRate = ref<number | null>(null)
const quoteSuccessDelta = ref('n/a')
const providerAvailability = ref<number | null>(null)
const freshnessP95 = ref<number | null>(null)
const liquidityIndex = ref<number | null>(null)
const successSeries = ref<ChartSeries[]>([])
const availabilitySeries = ref<ChartSeries[]>([])
const freshnessSeries = ref<ChartSeries[]>([])
const liquiditySeries = ref<ChartSeries[]>([])

async function loadData() {
  try {
    const [successData, availabilityData, freshnessData, liquidityData] = await Promise.all([
      getChartData('quote-success', store.filtersForApi),
      getChartData('provider-availability', store.filtersForApi),
      getChartData('data-freshness', store.filtersForApi),
      getChartData('corridor-liquidity', store.filtersForApi),
    ])

    successSeries.value = successData?.series || []
    availabilitySeries.value = availabilityData?.series || []
    freshnessSeries.value = freshnessData?.series || []
    liquiditySeries.value = liquidityData?.series || []

    const successLast = successSeries.value
      .map(s => s.points[s.points.length - 1]?.v)
      .filter((value): value is number => typeof value === 'number')
    const successFirst = successSeries.value
      .map(s => s.points[0]?.v)
      .filter((value): value is number => typeof value === 'number')
    if (successLast.length > 0) {
      const average = successLast.reduce((sum, v) => sum + v, 0) / successLast.length
      quoteSuccessRate.value = average
      if (successFirst.length > 0) {
        const firstAvg = successFirst.reduce((sum, v) => sum + v, 0) / successFirst.length
        const delta = average - firstAvg
        quoteSuccessDelta.value = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs window start`
      }
      else {
        quoteSuccessDelta.value = 'n/a'
      }
    }
    else {
      quoteSuccessRate.value = null
      quoteSuccessDelta.value = 'n/a'
    }

    const availabilityLast = availabilitySeries.value
      .map(s => s.points[s.points.length - 1]?.v)
      .filter((value): value is number => typeof value === 'number')
    providerAvailability.value = availabilityLast.length
      ? availabilityLast.reduce((sum, v) => sum + v, 0) / availabilityLast.length
      : null

    const freshnessValues = freshnessSeries.value
      .flatMap(s => s.points.map(p => p.v))
      .filter((value): value is number => typeof value === 'number')
    if (freshnessValues.length > 0) {
      const sorted = [...freshnessValues].sort((a, b) => a - b)
      const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))
      freshnessP95.value = Math.round(sorted[p95Index])
    }
    else {
      freshnessP95.value = null
    }

    const liquidityLast = liquiditySeries.value
      .map(s => s.points[s.points.length - 1]?.v)
      .filter((value): value is number => typeof value === 'number')
    liquidityIndex.value = liquidityLast.length
      ? Math.round(liquidityLast.reduce((sum, v) => sum + v, 0) / liquidityLast.length)
      : null
  }
  catch (e) {
    console.error('Failed to load operational coverage data:', e)
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
