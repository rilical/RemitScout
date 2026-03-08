<template>
  <div
:class="CHART_STYLE.card"
class="overflow-hidden"
data-chart-export-root
>
    <!-- Header -->
    <div class="border-b border-neutral-700 p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <!-- Chart Info -->
        <div>
          <div class="text-body-sm mb-1 font-semibold uppercase tracking-wider text-neutral-500">
            {{ chartData?.metadata.categoryLabel || chartMeta?.categoryLabel }}
          </div>
          <h2 class="text-h3 font-bold text-white">
            {{ chartData?.metadata.title || chartMeta?.title }}
          </h2>
          <p
v-if="chartData?.insight"
class="mt-1 text-neutral-400"
>
            {{ chartData.insight }}
          </p>
        </div>

        <!-- Controls -->
        <div
v-if="!isGated"
class="flex flex-wrap items-center gap-3"
>
          <!-- Range Selector -->
          <div class="flex items-center gap-1 rounded-lg bg-neutral-900 p-1">
            <button
              v-for="r in ranges"
              :key="r.value"
              class="text-body-sm relative flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors"
              :class="[
                selectedRange === r.value
                  ? 'bg-brand-600 text-white'
                  : r.isGated && !isPlus
                    ? 'cursor-not-allowed text-neutral-500'
                    : 'text-neutral-400 hover:bg-neutral-700 hover:text-white',
              ]"
              :disabled="r.isGated && !isPlus"
              @click="selectRange(r)"
            >
              {{ r.label }}
              <svg
                v-if="r.isGated && !isPlus"
                class="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </button>
          </div>

          <!-- View Toggle -->
          <div class="flex items-center gap-1 rounded-lg bg-neutral-900 p-1">
            <button
              class="text-body-sm flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors"
              :class="
                viewMode === 'chart'
                  ? 'bg-brand-600 text-white'
                  : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'
              "
              @click="viewMode = 'chart'"
            >
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
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
              Chart
            </button>
            <button
              class="text-body-sm flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors"
              :class="
                viewMode === 'table'
                  ? 'bg-brand-600 text-white'
                  : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'
              "
              @click="viewMode = 'table'"
            >
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
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Table
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Chart / Table Content -->
    <div class="p-6">
      <div v-if="isGated">
        <PulsePlusGate
          :is-gated="true"
          tier="enterprise"
          :title="gatedTitle"
          description="Enterprise feature. Contact sales for access to Pulse charts."
        >
          <template #preview>
            <div class="h-80 rounded-lg border border-neutral-700 bg-neutral-900/30" />
          </template>
        </PulsePlusGate>
      </div>

      <!-- Loading -->
      <div
v-else-if="loading"
class="flex h-80 items-center justify-center"
>
        <div class="flex items-center gap-3 text-neutral-400">
          <svg
class="h-5 w-5 animate-spin"
fill="none"
viewBox="0 0 24 24"
>
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading chart data...
        </div>
      </div>

      <!-- Chart View -->
      <div
v-else-if="viewMode === 'chart'"
class="min-h-[320px]"
>
        <div
          v-if="chartData && !chartHasRenderableSeries"
          class="flex h-80 items-center justify-center text-center text-neutral-300"
        >
          <div class="max-w-sm">
            <p class="text-body font-semibold text-white">
              {{ chartEmptyTitle }}
            </p>
            <p class="text-body-sm mt-2 text-neutral-400">
              {{ chartEmptyMessage }}
            </p>
          </div>
        </div>
        <AsyncErrorBoundary
v-else-if="chartComponent && chartData"
skeleton-height="320"
>
          <component
            :is="chartComponent"
            :series="chartData.series"
            :unit="chartData.metadata.unit"
            :unit-label="chartData.metadata.unitLabel"
            :rows="matrixRows"
          />
        </AsyncErrorBoundary>
        <div
v-else
class="flex h-80 items-center justify-center text-neutral-400"
>
          No data available
        </div>
      </div>

      <!-- Table View -->
      <div v-else>
        <AsyncErrorBoundary skeleton-height="240">
          <PulseTableView
            :chart-id="chartId"
            :filters="filters"
            :range="selectedRange"
            :is-plus="isPlus"
          />
        </AsyncErrorBoundary>
      </div>
    </div>

    <!-- Footer -->
    <div
      v-if="!isGated"
      class="text-body-sm flex items-center justify-between border-t border-neutral-700 px-6 py-4"
    >
      <div class="flex items-center gap-4 text-neutral-400">
        <span v-if="chartData?.metadata.lastUpdated">
          Updated {{ formatLastUpdated(chartData.metadata.lastUpdated) }}
        </span>
        <button
          class="flex items-center gap-1 transition-colors hover:text-white"
          :title="chartData?.metadata.sourceNotes"
        >
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Data source
        </button>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="canEmbed"
          class="flex items-center gap-1.5 text-neutral-400 transition-colors hover:text-white"
          @click="$emit('embed')"
        >
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
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          Embed
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, markRaw, defineAsyncComponent } from 'vue'
import AsyncErrorBoundary from '~/components/shared/AsyncErrorBoundary.vue'
import { getChartData, getMethodCoverage } from '~/lib/pulseApi'
import { getChartById, isRangeGated } from '~/lib/pulseChartRegistry'
import { formatDate } from '~/shared/lib/format'
import { CHART_STYLE } from '~/lib/pulseChartStyle'
import type { PulseLevel } from '~/composables/useEntitlements'
import type { ChartData, PulseFilters, TimeRange, MethodCoverageRow } from '~/types/pulse'

const PulseLineChart = defineAsyncComponent(() => import('./PulseLineChart.vue'))
const PulseBarChart = defineAsyncComponent(() => import('./PulseBarChart.vue'))
const PulseStackedChart = defineAsyncComponent(() => import('./PulseStackedChart.vue'))
const PulseScatterChart = defineAsyncComponent(() => import('./PulseScatterChart.vue'))
const PulseMatrixTable = defineAsyncComponent(() => import('./PulseMatrixTable.vue'))
const PulseTableView = defineAsyncComponent(() => import('./PulseTableView.vue'))

interface Props {
  chartId: string
  filters: PulseFilters
  pulseLevel?: PulseLevel
  canEmbed?: boolean
  initialRange?: TimeRange
}

const props = withDefaults(defineProps<Props>(), {
  pulseLevel: 'none',
  canEmbed: true,
  initialRange: '30d',
})

const emit = defineEmits<{
  'embed': []
  'range-change': [range: TimeRange]
}>()

const loading = ref(true)
const chartData = ref<ChartData | null>(null)
const matrixRows = ref<MethodCoverageRow[]>([])
const selectedRange = ref<TimeRange>(props.initialRange)
const viewMode = ref<'chart' | 'table'>('chart')

const chartMeta = computed(() => getChartById(props.chartId))

const isPlus = computed(() => props.pulseLevel !== 'none')
const isFullAccess = computed(() => props.pulseLevel === 'full')
const isPro = computed(() => props.pulseLevel === 'full')
const canEmbed = computed(() => props.canEmbed)
const isGated = computed(() => !isPro.value)

const gatedTitle = computed(() => {
  const title = chartMeta.value?.title
  return title ? `${title} (Enterprise)` : 'Pulse (Enterprise)'
})

const ranges = computed(() => {
  const baseRanges = [
    { value: '7d' as TimeRange, label: '7D', isGated: false },
    { value: '30d' as TimeRange, label: '30D', isGated: false },
    {
      value: '90d' as TimeRange,
      label: '90D',
      isGated: isRangeGated(props.chartId, '90d', isFullAccess.value),
    },
  ]

  if (isFullAccess.value) {
    baseRanges.push({
      value: '365d' as TimeRange,
      label: '1Y',
      isGated: isRangeGated(props.chartId, '365d', isFullAccess.value),
    })
  }

  return baseRanges
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

const chartHasRenderableSeries = computed(() => {
  if (!chartData.value || !Array.isArray(chartData.value.series)) return false
  return chartData.value.series.some(
    series => Array.isArray(series.points) && series.points.length > 0,
  )
})

const chartEmptyTitle = computed(() => {
  if (chartData.value?.dataAvailable === false || !chartData.value?.updatedAt) {
    return 'Data pending'
  }
  return 'No data available'
})

const chartEmptyMessage = computed(() => {
  if (chartData.value?.dataAvailable === false || !chartData.value?.updatedAt) {
    return 'Data is being prepared for this corridor. Check back shortly.'
  }
  return 'No chart points are available for the selected filters.'
})

async function loadData() {
  if (isGated.value) {
    // Enterprise charts are enterprise-only; don't mount or fetch anything when gated.
    chartData.value = null
    matrixRows.value = []
    loading.value = false
    return
  }
  loading.value = true
  try {
    if (chartMeta.value?.type === 'matrix') {
      matrixRows.value = await getMethodCoverage(props.filters)
      chartData.value = await getChartData(props.chartId, props.filters, selectedRange.value)
    }
 else {
      chartData.value = await getChartData(props.chartId, props.filters, selectedRange.value)
    }
  }
 catch (e) {
    useLogger('PulseChartFull').error('Failed to load chart data', e)
  }
 finally {
    loading.value = false
  }
}

function selectRange(range: { value: TimeRange, isGated: boolean }) {
  if (range.isGated && !isFullAccess.value) return
  selectedRange.value = range.value
  emit('range-change', range.value)
  loadData()
}

function formatLastUpdated(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return formatDate(timestamp)
}

watch(() => props.filters, loadData, { deep: true })
watch(() => props.chartId, loadData)
watch(() => props.pulseLevel, loadData)

onMounted(loadData)
</script>
