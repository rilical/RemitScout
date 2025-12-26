<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <!-- Header -->
    <div class="border-b border-neutral-700 px-6 py-4">
      <!-- Consumer Mode Header -->
      <template v-if="store.viewMode === 'sender'">
        <h2 class="text-lg font-bold text-white">Best Time to Send</h2>
        <p class="text-sm text-neutral-400">Rate trend signal for your corridor</p>
      </template>
      <!-- Analyst Mode Header -->
      <template v-else>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-white">Execution Signal</h2>
            <p class="text-sm text-neutral-400">FX Volatility & Timing Indicator</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-neutral-500">{{ store.corridor.label }}</span>
            <span class="inline-flex items-center rounded bg-neutral-700 px-2 py-0.5 text-xs font-semibold text-neutral-300">
              {{ executionSignalBadge }}
            </span>
          </div>
        </div>
      </template>
    </div>

    <!-- Gauge -->
    <div class="p-6">
      <div v-if="loading" class="flex h-48 items-center justify-center">
        <div class="flex items-center gap-3 text-neutral-400">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </div>

      <div v-else class="flex flex-col items-center">
        <!-- ECharts Gauge -->
        <div class="h-48 w-64">
          <v-chart
            class="h-full w-full"
            :option="gaugeOption"
            autoresize
          />
        </div>

        <!-- Consumer Mode: Level Label -->
        <div
          v-if="store.viewMode === 'sender'"
          class="mt-2 rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wide"
          :class="levelClasses"
        >
          {{ levelLabel }}
        </div>

        <!-- Analyst Mode: Execution Rating -->
        <div v-else class="mt-2 flex items-center gap-3">
          <span
            class="rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wide"
            :class="levelClasses"
          >
            {{ analystLevelLabel }}
          </span>
          <span class="text-sm font-mono text-neutral-400">
            {{ bpsDelta >= 0 ? '+' : '' }}{{ bpsDelta.toFixed(1) }} bps
          </span>
        </div>

        <!-- Consumer Mode: Recommendation -->
        <p v-if="store.viewMode === 'sender'" class="mt-4 text-center text-sm text-neutral-300 max-w-xs">
          {{ data?.recommendation }}
        </p>

        <!-- Analyst Mode: Actionable Insight -->
        <p v-else class="mt-4 text-center text-sm text-neutral-300 max-w-xs">
          {{ analystRecommendation }}
        </p>

        <!-- Analyst Mode: Full Stats Panel -->
        <div v-if="store.viewMode === 'analyst' && data" class="mt-6 w-full space-y-4">
          <!-- Primary Metrics -->
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-xs text-neutral-500 uppercase tracking-wider">Spot Rate</div>
              <div class="text-lg font-bold font-mono text-white">{{ data.currentRate.toFixed(4) }}</div>
            </div>
            <div class="text-center">
              <div class="text-xs text-neutral-500 uppercase tracking-wider">30D VWAP</div>
              <div class="text-lg font-bold font-mono text-white">{{ data.avg30Day.toFixed(4) }}</div>
            </div>
            <div class="text-center">
              <div class="text-xs text-neutral-500 uppercase tracking-wider">Δ vs Avg</div>
              <div
                class="text-lg font-bold font-mono"
                :class="data.percentFromAvg >= 0 ? 'text-brand-600' : 'text-danger-600'"
              >
                {{ data.percentFromAvg >= 0 ? '+' : '' }}{{ data.percentFromAvg.toFixed(2) }}%
              </div>
            </div>
          </div>

          <!-- Secondary Metrics (Analyst Only) -->
          <div class="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-700">
            <div class="text-center">
              <div class="text-xs text-neutral-500 uppercase tracking-wider">Volatility (7D)</div>
              <div class="text-base font-bold font-mono text-white">{{ volatility7D.toFixed(2) }}%</div>
              <div class="text-xs text-neutral-500">σ = {{ stdDev.toFixed(4) }}</div>
            </div>
            <div class="text-center">
              <div class="text-xs text-neutral-500 uppercase tracking-wider">Spread Rank</div>
              <div class="text-base font-bold font-mono text-white">#{{ spreadRank }} of {{ totalProviders }}</div>
              <div class="text-xs text-neutral-500">{{ spreadBps }} bps avg</div>
            </div>
          </div>

          <!-- Confidence Bar -->
          <div class="pt-4 border-t border-neutral-700">
            <div class="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span class="uppercase tracking-wider">Signal Confidence</span>
              <span class="font-mono">{{ Math.round(data.confidence * 100) }}%</span>
            </div>
            <div class="h-2 rounded-full bg-neutral-700">
              <div
                class="h-full rounded-full bg-brand-600 transition-all duration-500"
                :style="{ width: `${data.confidence * 100}%` }"
              />
            </div>
          </div>

          <!-- Latency & Freshness -->
          <div class="flex items-center justify-between text-xs text-neutral-500 pt-2">
            <span>Data Latency: <span class="font-mono text-neutral-400">{{ dataLatency }}ms</span></span>
            <span>Last Tick: <span class="font-mono text-neutral-400">{{ lastTick }}</span></span>
          </div>
        </div>

        <!-- Consumer Mode: Basic Stats (hidden by default, shown on analyst) -->
        <div v-if="store.viewMode === 'sender' && data" class="mt-6 w-full">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-xs text-neutral-500">Current</div>
              <div class="text-sm font-semibold text-white">{{ data.currentRate.toFixed(2) }}</div>
            </div>
            <div>
              <div class="text-xs text-neutral-500">Average</div>
              <div class="text-sm font-semibold text-white">{{ data.avg30Day.toFixed(2) }}</div>
            </div>
            <div>
              <div class="text-xs text-neutral-500">Trend</div>
              <div
                class="text-sm font-semibold"
                :class="data.percentFromAvg >= 0 ? 'text-brand-600' : 'text-danger-600'"
              >
                {{ data.percentFromAvg >= 0 ? '↑' : '↓' }} {{ Math.abs(data.percentFromAvg).toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Trust Stamp -->
    <PulseTrustStamp v-if="data" :last-updated="data.lastUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GaugeChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { usePulseStore } from '~/stores/pulse'
import { getSmartSendData, type SmartSendData, type SmartSendLevel } from '~/lib/pulseMockApi'

use([CanvasRenderer, GaugeChart, TitleComponent, TooltipComponent])

const store = usePulseStore()

const loading = ref(true)
const data = ref<SmartSendData | null>(null)

const levelLabel = computed(() => {
  if (!data.value) return ''
  const labels: Record<SmartSendLevel, string> = {
    great: 'Great Time to Send',
    good: 'Good Rates',
    fair: 'Fair Rates',
    wait: 'Consider Waiting',
  }
  return labels[data.value.level]
})

const analystLevelLabel = computed(() => {
  if (!data.value) return ''
  const labels: Record<SmartSendLevel, string> = {
    great: 'Strong Buy',
    good: 'Buy',
    fair: 'Hold',
    wait: 'Wait',
  }
  return labels[data.value.level]
})

const executionSignalBadge = computed(() => {
  if (!data.value) return 'LOADING'
  const badges: Record<SmartSendLevel, string> = {
    great: 'EXECUTE',
    good: 'FAVORABLE',
    fair: 'NEUTRAL',
    wait: 'DEFER',
  }
  return badges[data.value.level]
})

const bpsDelta = computed(() => {
  if (!data.value) return 0
  return data.value.percentFromAvg * 100
})

const volatility7D = computed(() => {
  if (!data.value) return 0
  return Math.abs(data.value.percentFromAvg * 1.5) + 0.8
})

const stdDev = computed(() => {
  if (!data.value) return 0
  return data.value.currentRate * 0.0025
})

const spreadRank = computed(() => {
  if (!data.value) return 1
  return Math.max(1, Math.floor((100 - data.value.percentile) / 10))
})

const totalProviders = computed(() => 12)

const spreadBps = computed(() => {
  if (!data.value) return 0
  return Math.round(45 + (100 - data.value.percentile) * 0.5)
})

const dataLatency = computed(() => Math.round(Math.random() * 200 + 100))

const lastTick = computed(() => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
})

const analystRecommendation = computed(() => {
  if (!data.value) return ''
  const recs: Record<SmartSendLevel, string> = {
    great: `Execution window open. Current spread ${spreadBps.value}bps below 30D VWAP. Recommend immediate execution.`,
    good: `Favorable conditions. Spread compression detected. Consider phased execution over next 4-6 hours.`,
    fair: `Neutral signal. Spreads at historical average. No urgency to execute.`,
    wait: `Elevated spreads detected. Recommend deferring execution. Set alert for ${Math.round(data.value.percentile + 15)}th percentile.`,
  }
  return recs[data.value.level]
})

const levelClasses = computed(() => {
  if (!data.value) return ''
  const classes: Record<SmartSendLevel, string> = {
    great: 'bg-brand-600 text-white',
    good: 'bg-brand-600/20 text-brand-600',
    fair: 'bg-neutral-600/20 text-neutral-400',
    wait: 'bg-danger-600/20 text-danger-600',
  }
  return classes[data.value.level]
})

const gaugeOption = computed(() => {
  if (!data.value) return {}

  const percentile = data.value.percentile
  
  let color: string
  if (percentile >= 85) {
    color = '#2563EB'
  } else if (percentile >= 60) {
    color = '#3B82F6'
  } else if (percentile >= 35) {
    color = '#6B7280'
  } else {
    color = '#DC2626'
  }

  return {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 4,
        radius: '100%',
        center: ['50%', '75%'],
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [0.35, '#DC2626'],
              [0.6, '#6B7280'],
              [0.85, '#3B82F6'],
              [1, '#2563EB'],
            ],
          },
        },
        pointer: {
          icon: 'path://M12 2L4 14h16L12 2z',
          length: '60%',
          width: 12,
          offsetCenter: [0, '-10%'],
          itemStyle: {
            color: color,
          },
        },
        axisTick: {
          length: 8,
          lineStyle: {
            color: 'auto',
            width: 1,
          },
        },
        splitLine: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 2,
          },
        },
        axisLabel: {
          color: '#9CA3AF',
          fontSize: 10,
          distance: -45,
          formatter: (value: number) => {
            if (value === 0) return 'Wait'
            if (value === 50) return 'Fair'
            if (value === 100) return 'Great'
            return ''
          },
        },
        title: {
          show: false,
        },
        detail: {
          fontSize: 28,
          fontWeight: 'bold',
          offsetCenter: [0, '20%'],
          valueAnimation: true,
          formatter: (value: number) => `${Math.round(value)}`,
          color: color,
        },
        data: [
          {
            value: percentile,
          },
        ],
      },
    ],
  }
})

async function loadData() {
  loading.value = true
  try {
    data.value = await getSmartSendData(store.corridor, store.amount)
  } catch (e) {
    console.error('Failed to load smart send data:', e)
  } finally {
    loading.value = false
  }
}

watch(
  () => [store.corridor, store.amount],
  () => loadData(),
  { deep: true }
)

onMounted(() => {
  loadData()
})
</script>





