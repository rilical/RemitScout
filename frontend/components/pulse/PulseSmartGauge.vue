<template>
  <div class="card-elevated overflow-hidden">
    <!-- Header -->
    <div class="border-b border-white/[0.08] px-6 py-4">
      <!-- Consumer Mode Header -->
      <template v-if="store.viewMode === 'sender'">
        <h2 class="text-body-lg font-bold text-white">
          Best Time to Send
        </h2>
        <p class="text-body-sm text-neutral-400">
          Rate trend signal for your corridor
        </p>
      </template>
      <!-- Analyst Mode Header -->
      <template v-else>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-body-lg font-bold text-white">
              Execution Signal
            </h2>
            <p class="text-body-sm text-neutral-400">
              FX Volatility & Timing Indicator
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-body-sm font-mono text-mono-value text-neutral-500">{{ store.corridor?.label }}</span>
            <span class="inline-flex items-center rounded bg-neutral-700 px-2 py-0.5 text-body-sm font-semibold text-neutral-300">
              {{ executionSignalBadge }}
            </span>
          </div>
        </div>
      </template>
    </div>

    <!-- Gauge -->
    <div class="p-6">
      <div
        v-if="loading"
        class="flex h-48 w-full items-center justify-center animate-pulse"
        role="status"
        aria-live="polite"
        aria-label="Loading chart"
      >
        <SkeletonBlock
          width="full"
          height="12rem"
          tone="dark"
        />
        <span class="sr-only">Loading chart</span>
      </div>

      <!-- No meaningful data state -->
      <div
        v-else-if="!hasRealData"
        class="flex flex-col items-center py-8"
      >
        <div class="h-48 w-full max-w-xs mx-auto flex items-center justify-center">
          <div class="text-center">
            <div class="text-4xl text-neutral-600 mb-3">—</div>
            <p class="text-body-sm font-semibold text-neutral-400">Collecting data</p>
            <p class="text-[11px] text-neutral-500 mt-1 max-w-[200px]">
              Rate signal will appear once enough provider data is available for this corridor.
            </p>
          </div>
        </div>
      </div>

      <div
        v-else
        class="flex flex-col items-center"
      >
        <!-- ECharts Gauge -->
        <div class="h-48 w-full max-w-xs mx-auto">
          <v-chart
            class="h-full w-full"
            :option="gaugeOption"
            autoresize
          />
        </div>
        <!-- Screen reader announcement -->
        <div
class="sr-only"
role="status"
aria-live="polite"
>
          {{ store.viewMode === 'sender' ? levelLabel : analystLevelLabel }}: score {{ data?.percentile ?? 0 }} out of 100.
          {{ store.viewMode === 'sender' ? data?.recommendation : analystRecommendation }}
        </div>

        <!-- Consumer Mode: Level Label -->
        <div
          v-if="store.viewMode === 'sender'"
          class="mt-2 rounded-full px-4 py-1.5 text-body-sm font-bold uppercase tracking-wide"
          :class="levelClasses"
        >
          {{ levelLabel }}
        </div>

        <!-- Analyst Mode: Execution Rating -->
        <div
          v-else
          class="mt-2 flex items-center gap-3"
        >
          <span
            class="rounded-full px-4 py-1.5 text-body-sm font-bold uppercase tracking-wide"
            :class="levelClasses"
          >
            {{ analystLevelLabel }}
          </span>
          <span class="text-body-sm font-mono text-mono-value text-neutral-400">
            {{ bpsDelta >= 0 ? '+' : '' }}{{ bpsDelta.toFixed(1) }}%
          </span>
        </div>

        <!-- Consumer Mode: Recommendation -->
        <p
          v-if="store.viewMode === 'sender'"
          class="mt-4 text-center text-body-sm text-neutral-300 max-w-xs"
        >
          {{ data?.recommendation }}
        </p>

        <!-- Analyst Mode: Actionable Insight -->
        <p
          v-else
          class="mt-4 text-center text-body-sm text-neutral-300 max-w-xs"
        >
          {{ analystRecommendation }}
        </p>

        <!-- Scoring explainer -->
        <p
class="mt-2 text-center text-[11px] text-neutral-500 max-w-xs"
title="Score is a 0-100 percentile based on the current effective rate relative to 30-day history for this corridor."
>
          Score reflects where the current rate sits within 30-day price history (0 = worst, 100 = best).
        </p>

        <!-- Analyst Mode: Full Stats Panel -->
        <div
          v-if="store.viewMode === 'analyst' && data"
          class="mt-6 w-full space-y-4"
        >
          <!-- Primary Metrics -->
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-label text-neutral-500">
                Spot Rate
              </div>
              <div class="text-body-lg font-bold font-mono text-mono-value text-white">
                {{ data.currentRate.toFixed(4) }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-label text-neutral-500">
                30D VWAP
              </div>
              <div class="text-body-lg font-bold font-mono text-mono-value text-white">
                {{ data.avg30Day.toFixed(4) }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-label text-neutral-500">
                Δ vs Avg
              </div>
              <div
                class="text-body-lg font-bold font-mono text-mono-value"
                :class="data.percentFromAvg >= 0 ? 'text-brand-600' : 'text-danger-600'"
              >
                {{ data.percentFromAvg >= 0 ? '+' : '' }}{{ data.percentFromAvg.toFixed(2) }}%
              </div>
            </div>
          </div>

          <!-- Confidence Bar -->
          <div class="pt-4 border-t border-white/[0.08]">
            <div class="flex items-center justify-between text-body-sm text-neutral-500 mb-1">
              <span class="text-label uppercase tracking-wider">Signal Confidence</span>
              <span class="font-mono text-mono-value">{{ Math.round(data.confidence * 100) }}%</span>
            </div>
            <div class="h-2 rounded-full bg-neutral-700">
              <div
                class="h-full rounded-full bg-brand-600 transition-all duration-500"
                :style="{ width: `${data.confidence * 100}%` }"
              />
            </div>
          </div>

          <!-- Latency & Freshness -->
          <div class="flex items-center justify-between text-body-sm text-neutral-500 pt-2">
            <span>Data Latency: <span class="font-mono text-mono-value text-neutral-400">{{ dataLatency }}ms</span></span>
            <span>Last Tick: <span class="font-mono text-mono-value text-neutral-400">{{ lastTick }}</span></span>
          </div>
        </div>

        <!-- Consumer Mode: Basic Stats (hidden by default, shown on analyst) -->
        <div
          v-if="store.viewMode === 'sender' && data"
          class="mt-6 w-full"
        >
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-body-sm text-neutral-500">
                Current
              </div>
              <div class="text-body-sm font-semibold text-white">
                {{ data.currentRate.toFixed(2) }}
              </div>
            </div>
            <div>
              <div class="text-body-sm text-neutral-500">
                Average
              </div>
              <div class="text-body-sm font-semibold text-white">
                {{ data.avg30Day.toFixed(2) }}
              </div>
            </div>
            <div>
              <div class="text-body-sm text-neutral-500">
                Trend
              </div>
              <div
                class="text-body-sm font-semibold"
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
    <PulseTrustStamp
      v-if="data && hasRealData"
      :last-updated="data.lastUpdated"
    />
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
import { getSmartSendData, type SmartSendData, type SmartSendLevel } from '~/lib/pulseApi'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'

use([CanvasRenderer, GaugeChart, TitleComponent, TooltipComponent])

const store = usePulseStore()

const loading = ref(true)
type SmartSendNormalized = SmartSendData & {
  recommendation: string
  currentRate: number
  avg30Day: number
  percentFromAvg: number
  confidence: number
  percentile: number
}

const data = ref<SmartSendNormalized | null>(null)

const hasRealData = computed(() => {
  if (!data.value) return false
  // Consider data "real" if we have non-zero rates or a non-default source
  return (data.value.currentRate > 0 || data.value.avg30Day > 0 || (data.value as any).source === 'gold_export')
})

const normalizeSmartSend = (payload: SmartSendData): SmartSendNormalized => {
  return {
    ...payload,
    recommendation: payload.recommendation ?? payload.message ?? '',
    currentRate: payload.currentRate ?? 0,
    avg30Day: payload.avg30Day ?? 0,
    percentFromAvg: payload.percentFromAvg ?? 0,
    confidence: payload.confidence ?? 0,
    percentile: payload.percentile ?? 50,
  }
}

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

const dataLatency = computed(() => {
  if (!data.value?.lastUpdated) return 0
  const updatedAt = new Date(data.value.lastUpdated).getTime()
  return Math.max(0, Math.round(Date.now() - updatedAt))
})

const lastTick = computed(() => {
  if (!data.value?.lastUpdated) return 'n/a'
  const updatedAt = new Date(data.value.lastUpdated)
  return `${updatedAt.getHours().toString().padStart(2, '0')}:${updatedAt.getMinutes().toString().padStart(2, '0')}:${updatedAt.getSeconds().toString().padStart(2, '0')}`
})

const analystRecommendation = computed(() => {
  if (!data.value) return ''
  const recs: Record<SmartSendLevel, string> = {
    great: `Execution window open. Rate is ${Math.abs(data.value.percentFromAvg).toFixed(2)}% above 30D VWAP. Recommend immediate execution.`,
    good: `Favorable conditions. Rate above average. Consider phased execution over next 4-6 hours.`,
    fair: `Neutral signal. Rate near 30-day average. No urgency to execute.`,
    wait: `Below-average rate detected. Recommend deferring execution. Set alert for ${Math.round(data.value.percentile + 15)}th percentile.`,
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
  }
  else if (percentile >= 60) {
    color = '#3B82F6'
  }
  else if (percentile >= 35) {
    color = '#6B7280'
  }
  else {
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
    const payload = await getSmartSendData(store.corridor, store.timeframe, store.amount)
    data.value = normalizeSmartSend(payload)
  }
  catch (e) {
    useLogger('PulseSmartGauge').error('Failed to load smart send data', e)
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
