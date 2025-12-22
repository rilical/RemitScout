<template>
  <div
    class="min-h-screen"
    :class="isDark ? 'bg-neutral-900' : 'bg-white'"
  >
    <!-- Compact Header -->
    <div
      class="border-b px-4 py-3"
      :class="isDark ? 'border-neutral-700 bg-neutral-800' : 'border-gray-200 bg-gray-50'"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ corridorData?.fromFlag }}</span>
            <svg
              class="h-3 w-3"
              :class="isDark ? 'text-neutral-500' : 'text-gray-400'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span class="text-xl">{{ corridorData?.toFlag }}</span>
          </div>
          <div>
            <div
              class="text-sm font-semibold"
              :class="isDark ? 'text-white' : 'text-gray-900'"
            >
              {{ corridorData?.label || 'Loading...' }}
            </div>
            <div
              class="text-xs"
              :class="isDark ? 'text-neutral-400' : 'text-gray-500'"
            >
              True Cost vs Mid-Market
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-600 opacity-75" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
          </span>
          <span
            class="text-xs"
            :class="isDark ? 'text-neutral-400' : 'text-gray-500'"
          >
            Live
          </span>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="p-4">
      <div v-if="loading" class="flex h-64 items-center justify-center">
        <div
          class="flex items-center gap-3"
          :class="isDark ? 'text-neutral-400' : 'text-gray-500'"
        >
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </div>

      <div v-else class="h-64">
        <v-chart
          class="h-full w-full"
          :option="chartOption"
          autoresize
        />
      </div>

      <!-- Key Stats -->
      <div
        class="mt-4 grid grid-cols-3 gap-4 border-t pt-4"
        :class="isDark ? 'border-neutral-700' : 'border-gray-200'"
      >
        <div>
          <div
            class="text-xs"
            :class="isDark ? 'text-neutral-500' : 'text-gray-500'"
          >
            Current Spread
          </div>
          <div class="text-lg font-bold text-brand-600">
            {{ heroData?.currentSpreadPercent.toFixed(2) }}%
          </div>
        </div>
        <div>
          <div
            class="text-xs"
            :class="isDark ? 'text-neutral-500' : 'text-gray-500'"
          >
            Best Provider
          </div>
          <div
            class="text-lg font-bold"
            :class="isDark ? 'text-white' : 'text-gray-900'"
          >
            {{ heroData?.bestProvider }}
          </div>
        </div>
        <div>
          <div
            class="text-xs"
            :class="isDark ? 'text-neutral-500' : 'text-gray-500'"
          >
            You Save
          </div>
          <div class="text-lg font-bold text-brand-600">
            ${{ heroData?.lossOn1000.toFixed(2) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Attribution Footer -->
    <div
      class="border-t px-4 py-3"
      :class="isDark ? 'border-neutral-700 bg-neutral-800/50' : 'border-gray-200 bg-gray-50'"
    >
      <div class="flex items-center justify-between">
        <div
          class="text-xs"
          :class="isDark ? 'text-neutral-400' : 'text-gray-500'"
        >
          Data sourced {{ relativeTime }}
        </div>
        <a
          href="https://remitscout.com/pulse"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          <span>Powered by</span>
          <span class="font-bold">Remit-Scout</span>
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getHeroChartData, type HeroChartData } from '~/lib/pulseMockApi'
import { POPULAR_CORRIDORS, type PulseCorridor, type PulseTimeframe } from '~/stores/pulse'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const route = useRoute()

const loading = ref(true)
const heroData = ref<HeroChartData | null>(null)

const isDark = computed(() => {
  return route.query.theme !== 'light'
})

const corridorSlug = computed(() => {
  return route.params.corridor as string
})

const timeframe = computed<PulseTimeframe>(() => {
  const tf = route.query.timeframe as string
  if (['24H', '7D', '30D', '1Y', 'MAX'].includes(tf)) {
    return tf as PulseTimeframe
  }
  return '7D'
})

const corridorData = computed<PulseCorridor | undefined>(() => {
  return POPULAR_CORRIDORS.find(c => c.slug === corridorSlug.value)
})

const relativeTime = computed(() => {
  if (!heroData.value?.lastUpdated) return 'recently'
  const diff = Date.now() - new Date(heroData.value.lastUpdated).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1 min ago'
  if (minutes < 60) return `${minutes} mins ago`
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return '1 hour ago'
  return `${hours} hours ago`
})

const chartOption = computed(() => {
  if (!heroData.value) return {}

  const points = heroData.value.points
  const times = points.map(p => new Date(p.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
  }))

  const midMarketData = points.map(p => p.midMarketRate)
  const bestProviderData = points.map(p => p.bestProviderRate)

  const minRate = Math.min(...bestProviderData) * 0.998
  const maxRate = Math.max(...midMarketData) * 1.002

  const textColor = isDark.value ? '#9ca3af' : '#6b7280'
  const gridColor = isDark.value ? '#404040' : '#e5e7eb'

  return {
    backgroundColor: 'transparent',
    grid: {
      left: 50,
      right: 15,
      top: 15,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: { lineStyle: { color: gridColor } },
      axisLabel: { color: textColor, fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: minRate,
      max: maxRate,
      axisLine: { show: false },
      axisLabel: {
        color: textColor,
        fontSize: 10,
        formatter: (value: number) => value.toFixed(2),
      },
      splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
      textStyle: { color: isDark.value ? '#ffffff' : '#111827' },
    },
    series: [
      {
        name: 'Mid-Market',
        type: 'line',
        data: midMarketData,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#9ca3af', width: 1.5, type: 'dashed' },
      },
      {
        name: 'Best Provider',
        type: 'line',
        data: bestProviderData,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#2563EB', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.2)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0)' },
            ],
          },
        },
      },
    ],
  }
})

async function loadData() {
  loading.value = true
  try {
    const corridor = corridorData.value
    if (corridor) {
      heroData.value = await getHeroChartData(corridor, timeframe.value, 1000)
    }
  } catch (e) {
    console.error('Failed to load embed data:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

definePageMeta({
  layout: false,
})

useHead({
  title: `${corridorData.value?.label || 'Transfer'} Rates | Remit-Scout Pulse`,
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
})
</script>

