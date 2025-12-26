<template>
  <div
    class="min-h-screen p-4"
    :class="theme === 'dark' ? 'bg-neutral-900' : 'bg-white'"
  >
    <!-- Chart Container -->
    <div
      class="rounded-xl overflow-hidden"
      :class="theme === 'dark' ? 'border border-neutral-700 bg-neutral-800' : 'border border-gray-200 bg-gray-50'"
    >
      <!-- Header -->
      <div
        class="px-4 py-3 border-b"
        :class="theme === 'dark' ? 'border-neutral-700' : 'border-gray-200'"
      >
        <div class="flex items-center justify-between">
          <div>
            <h1
              class="text-lg font-bold"
              :class="theme === 'dark' ? 'text-white' : 'text-gray-900'"
            >
              {{ chartMeta?.title }}
            </h1>
            <p
              v-if="insight"
              class="text-sm"
              :class="theme === 'dark' ? 'text-neutral-400' : 'text-gray-600'"
            >
              {{ insight }}
            </p>
          </div>
          <div
            class="text-xs"
            :class="theme === 'dark' ? 'text-neutral-500' : 'text-gray-500'"
          >
            {{ corridorLabel }} · ${{ filters.amount }}
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="p-4">
        <div v-if="loading" class="flex h-64 items-center justify-center">
          <div
            class="flex items-center gap-2"
            :class="theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'"
          >
            <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </div>
        </div>
        <component
          v-else-if="chartComponent && chartData"
          :is="chartComponent"
          :series="chartData.series"
          :unit="chartData.metadata.unit"
          :unit-label="chartData.metadata.unitLabel"
          :rows="matrixRows"
        />
      </div>

      <!-- Footer Attribution -->
      <div
        class="flex items-center justify-between px-4 py-3 border-t"
        :class="theme === 'dark' ? 'border-neutral-700 bg-neutral-800' : 'border-gray-200 bg-gray-100'"
      >
        <div
          class="flex items-center gap-2 text-xs"
          :class="theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'"
        >
          <span>Updated {{ formatLastUpdated(lastUpdated) }}</span>
        </div>
        <a
          :href="fullChartUrl"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-1.5 text-xs font-medium transition-colors"
          :class="theme === 'dark' ? 'text-brand-600 hover:text-brand-700' : 'text-brand-600 hover:text-brand-700'"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          Powered by Remit-Scout
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from 'vue'
import { useRoute } from 'vue-router'
import type { ChartData, PulseFilters, TimeRange, MethodCoverageRow } from '~/types/pulse'
import { getChartById } from '~/lib/pulseChartRegistry'
import { getChartData, getMethodCoverage, getCorridorBySlug } from '~/lib/pulseMockApi'
import PulseLineChart from '~/components/pulse/PulseLineChart.vue'
import PulseBarChart from '~/components/pulse/PulseBarChart.vue'
import PulseStackedChart from '~/components/pulse/PulseStackedChart.vue'
import PulseScatterChart from '~/components/pulse/PulseScatterChart.vue'
import PulseMatrixTable from '~/components/pulse/PulseMatrixTable.vue'

definePageMeta({
  layout: false,
})

const route = useRoute()
const config = useRuntimeConfig()

const chartId = computed(() => route.params.chartId as string)
const theme = computed(() => (route.query.theme as 'dark' | 'light') || 'dark')
const range = computed(() => (route.query.range as TimeRange) || '30d')

const filters = ref<PulseFilters>({
  corridor: (route.query.corridor as string) || 'global',
  amount: parseInt(route.query.amount as string) || 200,
  fundingMethod: (route.query.fund as 'bank' | 'card' | 'cash') || 'bank',
  payoutMethod: (route.query.pay as 'bank' | 'cash' | 'wallet') || 'bank',
})

const loading = ref(true)
const chartData = ref<ChartData | null>(null)
const matrixRows = ref<MethodCoverageRow[]>([])
const lastUpdated = ref('')
const insight = ref('')

const chartMeta = computed(() => getChartById(chartId.value))

const corridorLabel = computed(() => {
  if (filters.value.corridor === 'global') return 'Global'
  const corridorInfo = getCorridorBySlug(filters.value.corridor)
  return corridorInfo?.label || filters.value.corridor
})

const fullChartUrl = computed(() => {
  const params = new URLSearchParams()
  if (filters.value.corridor !== 'global') params.set('corridor', filters.value.corridor)
  if (filters.value.amount !== 200) params.set('amount', String(filters.value.amount))
  const queryStr = params.toString()
  return `/pulse/charts/${chartId.value}${queryStr ? '?' + queryStr : ''}`
})

const chartComponent = computed(() => {
  if (!chartMeta.value) return null
  
  switch (chartMeta.value.type) {
    case 'line':
      return markRaw(PulseLineChart)
    case 'bar':
      return markRaw(PulseBarChart)
    case 'stacked':
      return markRaw(PulseStackedChart)
    case 'scatter':
      return markRaw(PulseScatterChart)
    case 'matrix':
      return markRaw(PulseMatrixTable)
    default:
      return markRaw(PulseLineChart)
  }
})

function formatLastUpdated(timestamp: string): string {
  if (!timestamp) return ''
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString()
}

onMounted(async () => {
  try {
    if (chartMeta.value?.type === 'matrix') {
      matrixRows.value = await getMethodCoverage(filters.value)
    }
    chartData.value = await getChartData(chartId.value, filters.value, range.value)
    if (chartData.value) {
      lastUpdated.value = chartData.value.metadata.lastUpdated
      insight.value = chartData.value.insight
    }
  } catch (e) {
    console.error('Failed to load embed chart:', e)
  } finally {
    loading.value = false
  }
})

useHead({
  title: computed(() => chartMeta.value ? `${chartMeta.value.title} | Remit-Scout` : 'Chart Embed'),
  bodyAttrs: {
    style: 'margin: 0; padding: 0;',
  },
})
</script>




