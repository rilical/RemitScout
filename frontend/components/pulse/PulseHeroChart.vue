<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
      <div>
        <h2 class="text-lg font-bold text-white">True Cost vs. Mid-Market</h2>
        <p class="text-sm text-neutral-400">See what you're really paying for your transfer</p>
      </div>
      <div class="flex items-center gap-4">
        <!-- Spread Indicator -->
        <div class="text-right">
          <div class="text-sm text-neutral-400">Current Spread</div>
          <div class="text-xl font-bold text-brand-600">
            {{ data?.currentSpreadPercent.toFixed(2) }}%
          </div>
        </div>
        <div class="h-10 w-px bg-neutral-700" />
        <!-- Loss Indicator -->
        <div class="text-right">
          <div class="text-sm text-neutral-400">You lose on ${{ store.amount.toLocaleString() }}</div>
          <div class="text-xl font-bold text-danger-600">
            ${{ data?.lossOn1000.toFixed(2) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="relative p-4">
      <div v-if="loading" class="flex h-80 items-center justify-center">
        <div class="flex items-center gap-3 text-neutral-400">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading chart data...
        </div>
      </div>
      <div v-else class="h-80">
        <v-chart
          ref="chartRef"
          class="h-full w-full"
          :option="chartOption"
          autoresize
          @mousemove="handleMouseMove"
        />
      </div>

      <!-- Hover Tooltip -->
      <div
        v-if="tooltipData && !loading"
        class="absolute z-20 pointer-events-none rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 shadow-xl"
        :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }"
      >
        <div class="mb-2 text-xs font-medium text-neutral-400">{{ tooltipData.timestamp }}</div>
        <div class="space-y-1.5">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-neutral-500" />
              <span class="text-sm text-neutral-300">Mid-Market</span>
            </div>
            <span class="text-sm font-semibold text-white">{{ tooltipData.midMarket }}</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-brand-600" />
              <span class="text-sm text-neutral-300">{{ tooltipData.bestProvider }}</span>
            </div>
            <span class="text-sm font-semibold text-brand-600">{{ tooltipData.bestRate }}</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-danger-600" />
              <span class="text-sm text-neutral-300">Bank Average</span>
            </div>
            <span class="text-sm font-semibold text-danger-600">{{ tooltipData.bankRate }}</span>
          </div>
        </div>
        <div class="mt-2 border-t border-neutral-700 pt-2">
          <div class="text-xs text-neutral-500">
            Spread: <span class="text-white">{{ tooltipData.spread }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-center gap-6 border-t border-neutral-700 px-6 py-3">
      <div class="flex items-center gap-2">
        <span class="h-0.5 w-6 border-t-2 border-dashed border-neutral-400" />
        <span class="text-sm text-neutral-400">Mid-Market Rate</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="h-0.5 w-6 bg-brand-600" />
        <span class="text-sm text-neutral-400">Best Provider</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="h-0.5 w-6 bg-danger-600" />
        <span class="text-sm text-neutral-400">Bank Average</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="h-4 w-6 rounded bg-brand-600/20" />
        <span class="text-sm text-neutral-400">Your Savings</span>
      </div>
    </div>

    <!-- Trust Stamp -->
    <PulseTrustStamp v-if="data" :last-updated="data.lastUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, shallowRef } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { usePulseStore } from '~/stores/pulse'
import { getHeroChartData, type HeroChartData } from '~/lib/pulseMockApi'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
])

const store = usePulseStore()
const chartRef = ref<InstanceType<typeof VChart> | null>(null)

const loading = ref(true)
const data = ref<HeroChartData | null>(null)

const tooltipData = ref<{
  timestamp: string
  midMarket: string
  bestRate: string
  bestProvider: string
  bankRate: string
  spread: string
} | null>(null)

const tooltipPosition = ref({ x: 0, y: 0 })

const chartOption = computed(() => {
  if (!data.value) return {}

  const points = data.value.points
  const times = points.map(p => new Date(p.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
  }))

  const midMarketData = points.map(p => p.midMarketRate)
  const bestProviderData = points.map(p => p.bestProviderRate)
  const bankData = points.map(p => p.bankAverageRate)

  const minRate = Math.min(...bankData) * 0.995
  const maxRate = Math.max(...midMarketData) * 1.005

  return {
    backgroundColor: 'transparent',
    grid: {
      left: 60,
      right: 20,
      top: 20,
      bottom: 40,
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: { lineStyle: { color: '#404040' } },
      axisLabel: { color: '#9ca3af', fontSize: 11 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: minRate,
      max: maxRate,
      axisLine: { show: false },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        formatter: (value: number) => value.toFixed(2),
      },
      splitLine: { lineStyle: { color: '#404040', type: 'dashed' } },
    },
    tooltip: {
      trigger: 'none',
    },
    series: [
      {
        name: 'Mid-Market Rate',
        type: 'line',
        data: midMarketData,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#9ca3af',
          width: 2,
          type: 'dashed',
        },
        z: 1,
      },
      {
        name: 'Spread Area',
        type: 'line',
        data: midMarketData,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 0 },
        areaStyle: {
          color: 'transparent',
        },
        z: 0,
      },
      {
        name: 'Best Provider',
        type: 'line',
        data: bestProviderData,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#2563EB',
          width: 3,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.3)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0)' },
            ],
          },
        },
        z: 2,
      },
      {
        name: 'Bank Average',
        type: 'line',
        data: bankData,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#DC2626',
          width: 2,
        },
        z: 1,
      },
    ],
  }
})

function handleMouseMove(params: { event?: { offsetX?: number; offsetY?: number }; dataIndex?: number }) {
  if (!data.value || !params.event || params.dataIndex === undefined) {
    tooltipData.value = null
    return
  }

  const point = data.value.points[params.dataIndex]
  if (!point) {
    tooltipData.value = null
    return
  }

  tooltipData.value = {
    timestamp: new Date(point.timestamp).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    midMarket: point.midMarketRate.toFixed(4),
    bestRate: point.bestProviderRate.toFixed(4),
    bestProvider: point.bestProvider,
    bankRate: point.bankAverageRate.toFixed(4),
    spread: `${point.spreadPercent.toFixed(2)}%`,
  }

  tooltipPosition.value = {
    x: Math.min((params.event.offsetX || 0) + 10, 400),
    y: Math.max((params.event.offsetY || 0) - 100, 10),
  }
}

async function loadData() {
  loading.value = true
  try {
    data.value = await getHeroChartData(store.corridor, store.timeframe, store.amount)
  } catch (e) {
    console.error('Failed to load hero chart data:', e)
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
