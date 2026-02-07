<template>
  <ChartCard
    variant="terminal"
    :title="chartTitle"
    :subtitle="chartSubtitle"
    :range-label="rangeLabel"
    :updated-at="updatedAt"
    :loading="loading"
    :error="error"
    :data-available="dataAvailable"
    :empty="{ title: 'No chart data', message: 'No data available for this filter yet.' }"
  >
    <template #actions>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <div class="text-xs text-neutral-400">
            Current markup
          </div>
          <div class="text-lg font-bold text-brand-600">
            {{ formatNumber(currentSpreadBps, { maximumFractionDigits: 0 }) }} bps
          </div>
        </div>
        <div class="h-10 w-px bg-neutral-700" />
        <div class="text-right">
          <div class="text-xs text-neutral-400">
            Markup cost for {{ amountLabel }}
          </div>
          <div class="text-lg font-bold text-danger-600">
            {{ lossDisplay }}
          </div>
        </div>
      </div>
    </template>

    <template #chart>
      <div class="relative h-[500px]">
        <v-chart
          class="h-full w-full"
          :option="chartOption"
          autoresize
          @mousemove="handleMouseMove"
        />

        <div
          v-if="tooltipData"
          class="absolute z-20 pointer-events-none rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 shadow-xl"
          :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }"
        >
          <div class="mb-2 text-xs font-medium text-neutral-400">
            {{ tooltipData.timestamp }}
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-neutral-500" />
                <span class="text-sm text-neutral-300">{{ midLabel }}</span>
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
                <span class="text-sm text-neutral-300">Bank average</span>
              </div>
              <span class="text-sm font-semibold text-danger-600">{{ tooltipData.bankRate }}</span>
            </div>
          </div>
          <div class="mt-2 border-t border-neutral-700 pt-2">
            <div class="text-xs text-neutral-500">
              Markup: <span class="text-white">{{ tooltipData.spread }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-6 border-t border-neutral-700 pt-4">
        <div class="flex items-center gap-2">
          <span class="h-0.5 w-6 border-t-2 border-dashed border-neutral-400" />
          <span class="text-sm text-neutral-400">{{ midLabel }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="h-0.5 w-6 bg-brand-600" />
          <span class="text-sm text-neutral-400">{{ leaderLabel }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="h-0.5 w-6 bg-danger-600" />
          <span class="text-sm text-neutral-400">{{ bankLabel }}</span>
        </div>
      </div>
    </template>

    <template #footer>
      <NuxtLink
        to="/methodology"
        class="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
      >
        <span>Methodology</span>
        <Icon
          name="arrow-top-right"
          :size="16"
          class="text-current"
        />
      </NuxtLink>
    </template>
  </ChartCard>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
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
import { getHeroChartData, type HeroChartData } from '~/lib/pulseApi'
import { ChartCard, Icon } from '~/shared/ui'
import { formatDateTime, formatMoney, formatNumber } from '~/shared/lib/format'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
])

interface Props {
  metric?: 'rate' | 'markup'
}

const props = withDefaults(defineProps<Props>(), {
  metric: 'rate',
})

const store = usePulseStore()
const loading = ref(true)
const data = ref<HeroChartData | null>(null)
const error = ref<{ title?: string, message: string } | null>(null)

const tooltipData = ref<{
  timestamp: string
  midMarket: string
  bestRate: string
  bestProvider: string
  bankRate: string
  spread: string
} | null>(null)

const tooltipPosition = ref({ x: 0, y: 0 })

const currentSpreadBps = computed(() => {
  if (!data.value) return 0
  return Math.round(data.value.currentSpreadPercent * 100)
})

const currencyCode = computed(() => data.value?.currency || store.corridor.fromCode)
const amountLabel = computed(() => formatMoney(store.amount, { currency: currencyCode.value, maximumFractionDigits: 0 }))
const lossDisplay = computed(() => {
  if (!data.value) return '—'
  return formatMoney(data.value.lossOn1000, { currency: currencyCode.value, maximumFractionDigits: 2 })
})

const updatedAt = computed(() => data.value?.lastUpdated || store.lastUpdated || null)

const dataAvailable = computed(() => (data.value?.points?.length ?? 0) >= 2)

const rangeLabel = computed(() => {
  switch (store.timeframe) {
    case '24H':
      return 'Last 24 hours'
    case '7D':
      return 'Last 7 days'
    case '30D':
      return 'Last 30 days'
    case '1Y':
      return 'Last 1 year'
    default:
      return 'Max'
  }
})

const midLabel = computed(() => (props.metric === 'markup' ? 'Baseline (0 bps)' : 'Mid-Market Rate'))
const leaderLabel = computed(() => (props.metric === 'markup' ? 'Leader Markup' : 'Market Leader'))
const bankLabel = computed(() => (props.metric === 'markup' ? 'Bank Markup' : 'Bank Average'))

const chartTitle = computed(() => {
  return props.metric === 'markup' ? 'FX Markup vs Mid-Market' : 'Effective Rate vs Mid-Market'
})

const chartSubtitle = computed(() => {
  if (props.metric === 'markup') {
    return `Markup dispersion for ${store.corridor.label} • ${amountLabel.value}`
  }
  return `Mid-market vs leader vs bank benchmark • ${store.corridor.label}`
})

const chartOption = computed(() => {
  if (!data.value) return {}

  const points = data.value.points
  const times = points.map(p => formatDateTime(new Date(p.timestamp)))

  if (props.metric === 'markup') {
    const bestMarkup = points.map(p => ((p.midMarketRate - p.bestProviderRate) / p.midMarketRate) * 10000)
    const bankMarkup = points.map(p => ((p.midMarketRate - p.bankAverageRate) / p.midMarketRate) * 10000)
    const baseline = points.map(() => 0)

    const maxMarkup = Math.max(...bankMarkup, 50)

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
        min: 0,
        max: maxMarkup * 1.1,
        axisLine: { show: false },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11,
          formatter: (value: number) => `${Math.round(value)} bps`,
        },
        splitLine: { lineStyle: { color: '#404040', type: 'dashed' } },
      },
      tooltip: {
        trigger: 'none',
      },
      series: [
        {
          name: 'Baseline',
          type: 'line',
          data: baseline,
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
          name: 'Market Leader',
          type: 'line',
          data: bestMarkup,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#2563EB',
            width: 3,
          },
          z: 2,
        },
        {
          name: 'Bank Average',
          type: 'line',
          data: bankMarkup,
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
  }

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
          formatter: (value: number) => formatNumber(value, { maximumFractionDigits: 4 }),
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

function handleMouseMove(params: { event?: { offsetX?: number, offsetY?: number }, dataIndex?: number }) {
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
    timestamp: formatDateTime(new Date(point.timestamp)),
    midMarket: props.metric === 'markup' ? '0 bps' : formatNumber(point.midMarketRate, { maximumFractionDigits: 4 }),
    bestRate: props.metric === 'markup'
      ? `${formatNumber(Math.round(((point.midMarketRate - point.bestProviderRate) / point.midMarketRate) * 10000), { maximumFractionDigits: 0 })} bps`
      : formatNumber(point.bestProviderRate, { maximumFractionDigits: 4 }),
    bestProvider: point.bestProvider,
    bankRate: props.metric === 'markup'
      ? `${formatNumber(Math.round(((point.midMarketRate - point.bankAverageRate) / point.midMarketRate) * 10000), { maximumFractionDigits: 0 })} bps`
      : formatNumber(point.bankAverageRate, { maximumFractionDigits: 4 }),
    spread: `${formatNumber(Math.round(point.spreadPercent * 100), { maximumFractionDigits: 0 })} bps`,
  }

  tooltipPosition.value = {
    x: Math.min((params.event.offsetX || 0) + 10, 400),
    y: Math.max((params.event.offsetY || 0) - 100, 10),
  }
}

async function loadData() {
  loading.value = true
  error.value = null
  try {
    data.value = await getHeroChartData(store.corridor, store.timeframe, store.amount)
  }
  catch (e) {
    console.error('Failed to load hero chart data:', e)
    data.value = null
    error.value = {
      title: 'Could not load',
      message: 'We could not load this chart yet. Please try again.',
    }
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
