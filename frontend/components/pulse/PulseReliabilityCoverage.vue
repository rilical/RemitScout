<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <div class="border-b border-neutral-700 px-6 py-4">
      <h2 class="text-lg font-bold text-white">
        Reliability & Coverage
      </h2>
      <p class="text-sm text-neutral-400">
        Quote success, method availability, and data freshness
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
      <div class="space-y-4 lg:col-span-4 flex flex-col">
        <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-6 flex-1 flex flex-col justify-center">
          <div class="text-xs text-neutral-500 mb-2">
            Quote Success Rate
          </div>
          <div class="text-3xl font-bold text-white mb-1">
            {{ quoteSuccessRate !== null ? `${quoteSuccessRate.toFixed(1)}%` : 'n/a' }}
          </div>
          <div class="text-xs text-neutral-400">
            {{ quoteSuccessDelta }}
          </div>
        </div>

        <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-6 flex-1 flex flex-col justify-center">
          <div class="text-xs text-neutral-500 mb-2">
            Data Freshness
          </div>
          <div class="text-3xl font-bold text-white mb-1">
            {{ freshnessMedian !== null ? `${freshnessMedian}m median` : 'n/a' }}
          </div>
          <div class="text-xs text-neutral-400">
            p95 {{ freshnessP95 !== null ? `${freshnessP95}m` : 'n/a' }} | updated {{ store.lastUpdatedRelative }}
          </div>
        </div>

        <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-6 flex-1 flex flex-col justify-center">
          <div class="text-xs text-neutral-500 mb-2">
            Coverage
          </div>
          <div class="text-3xl font-bold text-white mb-1">
            {{ coverage.providersIncluded }} providers
          </div>
          <div class="text-xs text-neutral-400">
            Methods: {{ coverage.methodsIncluded.length ? coverage.methodsIncluded.join(', ') : 'n/a' }}
          </div>
        </div>
      </div>

      <div class="lg:col-span-8">
        <div
          v-if="loading"
          class="flex h-48 items-center justify-center"
        >
          <div class="flex items-center gap-3 text-neutral-400">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-neutral-500 border-t-transparent" />
            Loading coverage...
          </div>
        </div>
        <PulseMatrixTable
          v-else
          :rows="matrixRows"
        />
      </div>
    </div>

    <PulseTrustStamp
      v-if="coverage.lastUpdated"
      :last-updated="coverage.lastUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import { getMethodCoverage, getChartData, getPulseCoverageSummary } from '~/lib/pulseApi'
import type { MethodCoverageRow, PulseCoverageSummary } from '~/types/pulse'

const store = usePulseStore()

const loading = ref(true)
const matrixRows = ref<MethodCoverageRow[]>([])
const coverage = ref<PulseCoverageSummary>({
  quotesInRange: 0,
  providersIncluded: 0,
  methodsIncluded: [],
  lastUpdated: '',
})

const quoteSuccessRate = ref<number | null>(null)
const quoteSuccessDelta = ref('n/a')
const freshnessMedian = ref<number | null>(null)
const freshnessP95 = ref<number | null>(null)

async function loadData() {
  loading.value = true
  try {
    const [rows, successData, freshnessData, summary] = await Promise.all([
      getMethodCoverage(store.filtersForApi),
      getChartData('quote-success', store.filtersForApi),
      getChartData('data-freshness', store.filtersForApi),
      getPulseCoverageSummary(store.corridor, store.timeframe),
    ])

    matrixRows.value = rows
    coverage.value = summary

    const lastValues = successData?.series
      .map(s => s.points[s.points.length - 1]?.v)
      .filter((value): value is number => typeof value === 'number') || []
    const firstValues = successData?.series
      .map(s => s.points[0]?.v)
      .filter((value): value is number => typeof value === 'number') || []

    if (lastValues.length > 0) {
      const average = lastValues.reduce((sum, v) => sum + v, 0) / lastValues.length
      quoteSuccessRate.value = average
      if (firstValues.length > 0) {
        const firstAvg = firstValues.reduce((sum, v) => sum + v, 0) / firstValues.length
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

    const freshnessValues = freshnessData?.series
      .flatMap(s => s.points.map(p => p.v))
      .filter((value): value is number => typeof value === 'number') || []
    if (freshnessValues.length > 0) {
      const sorted = [...freshnessValues].sort((a, b) => a - b)
      const medianIndex = Math.floor(sorted.length / 2)
      const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))
      freshnessMedian.value = Math.round(sorted[medianIndex])
      freshnessP95.value = Math.round(sorted[p95Index])
    }
    else {
      freshnessMedian.value = null
      freshnessP95.value = null
    }
  }
  catch (e) {
    console.error('Failed to load reliability data:', e)
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
