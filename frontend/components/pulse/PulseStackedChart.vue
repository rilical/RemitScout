<template>
  <div class="relative">
    <!-- Chart Container -->
    <div ref="chartContainer" class="relative h-80 w-full">
      <svg
        class="h-full w-full"
        :viewBox="`0 0 ${width} ${height}`"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Y-axis labels -->
        <g class="y-axis" font-size="11">
          <text
            v-for="(provider, i) in providers"
            :key="`y-label-${i}`"
            :x="padding.left - 10"
            :y="getProviderY(i) + barHeight / 2 + 4"
            text-anchor="end"
            fill="currentColor"
            class="text-slate-400"
          >
            {{ provider }}
          </text>
        </g>

        <!-- Stacked bars for each day/provider -->
        <g class="bars">
          <rect
            v-for="(segment, i) in stackedSegments"
            :key="`segment-${i}`"
            :x="segment.x"
            :y="segment.y"
            :width="segment.width"
            :height="barHeight - 2"
            :fill="segment.color"
            rx="2"
            class="transition-all duration-150"
            :opacity="hoveredProvider === null || hoveredProvider === segment.provider ? 1 : 0.3"
            @mouseenter="handleHover(segment)"
            @mouseleave="clearHover"
          />
        </g>

        <!-- X-axis labels -->
        <g class="x-axis" font-size="10">
          <text
            v-for="(label, i) in xAxisLabels"
            :key="`x-label-${i}`"
            :x="label.x"
            :y="height - padding.bottom + 16"
            text-anchor="middle"
            fill="currentColor"
            class="text-slate-500"
          >
            {{ label.text }}
          </text>
        </g>
      </svg>

      <!-- Tooltip -->
      <div
        v-if="hoveredSegment"
        class="absolute z-20 pointer-events-none rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 shadow-lg"
        :style="tooltipStyle"
      >
        <div class="mb-1 text-xs text-neutral-400">{{ hoveredSegment.date }}</div>
        <div class="flex items-center gap-2 text-sm">
          <span
            class="h-2 w-2 rounded-full"
            :style="{ backgroundColor: hoveredSegment.color }"
          />
          <span class="text-neutral-300">{{ hoveredSegment.provider }}</span>
          <span class="font-semibold text-white">was #1</span>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-4 flex flex-wrap items-center justify-center gap-4">
      <button
        v-for="provider in providers"
        :key="`legend-${provider}`"
        class="flex items-center gap-2 rounded-full px-3 py-1 text-sm transition-opacity"
        :class="hoveredProvider === null || hoveredProvider === provider ? 'opacity-100' : 'opacity-40'"
        @mouseenter="hoveredProvider = provider"
        @mouseleave="hoveredProvider = null"
      >
        <span
          class="h-3 w-3 rounded-full"
          :style="{ backgroundColor: getProviderColor(provider) }"
        />
        <span class="text-neutral-300">{{ provider }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ChartSeries } from '~/types/pulse'
import { PROVIDER_COLORS } from '~/lib/pulseChartRegistry'

interface Props {
  series: ChartSeries[]
}

const props = defineProps<Props>()

const width = 800
const height = 320
const padding = { top: 20, right: 20, bottom: 50, left: 100 }
const barHeight = 30

const hoveredProvider = ref<string | null>(null)
const hoveredSegment = ref<{
  provider: string
  date: string
  color: string
  x: number
  y: number
} | null>(null)

const chartWidth = width - padding.left - padding.right

const providers = computed(() => {
  return props.series.map(s => s.label)
})

const stackedSegments = computed(() => {
  if (props.series.length === 0) return []
  
  const segments: Array<{
    x: number
    y: number
    width: number
    color: string
    provider: string
    date: string
    dayIndex: number
  }> = []
  
  const pointsPerProvider = props.series[0]?.points.length || 0
  const segmentWidth = Math.max(4, chartWidth / pointsPerProvider - 1)
  
  for (let dayIdx = 0; dayIdx < pointsPerProvider; dayIdx++) {
    let winnerProvider: string | null = null
    let maxValue = -Infinity
    
    for (const s of props.series) {
      const point = s.points[dayIdx]
      if (point && point.v > maxValue) {
        maxValue = point.v
        winnerProvider = s.label
      }
    }
    
    if (winnerProvider) {
      const providerIdx = providers.value.indexOf(winnerProvider)
      const timestamp = props.series[0].points[dayIdx]?.t ?? 0
      
      segments.push({
        x: padding.left + (dayIdx / pointsPerProvider) * chartWidth,
        y: getProviderY(providerIdx),
        width: segmentWidth,
        color: getProviderColor(winnerProvider),
        provider: winnerProvider,
        date: formatDate(timestamp),
        dayIndex: dayIdx,
      })
    }
  }
  
  return segments
})

const xAxisLabels = computed(() => {
  if (props.series.length === 0 || props.series[0].points.length === 0) return []
  
  const points = props.series[0].points
  const count = Math.min(8, points.length)
  const step = Math.floor(points.length / (count - 1))
  
  return Array.from({ length: count }, (_, i) => {
    const idx = Math.min(i * step, points.length - 1)
    return {
      x: padding.left + (idx / points.length) * chartWidth,
      text: formatDate(points[idx].t),
    }
  })
})

const tooltipStyle = computed(() => {
  if (!hoveredSegment.value) return {}
  const { x, y } = hoveredSegment.value
  const xPercent = (x / width) * 100
  const yPercent = (y / height) * 100

  return {
    left: `${Math.min(xPercent, 80)}%`,
    top: `${Math.max(yPercent - 5, 5)}%`,
    transform: 'translateX(-50%)',
  }
})

function getProviderY(index: number): number {
  const totalHeight = height - padding.top - padding.bottom
  const rowHeight = totalHeight / providers.value.length
  return padding.top + index * rowHeight + (rowHeight - barHeight) / 2
}

function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider.toLowerCase()] || '#64748b'
}

function handleHover(segment: typeof stackedSegments.value[0]) {
  hoveredProvider.value = segment.provider
  hoveredSegment.value = {
    provider: segment.provider,
    date: segment.date,
    color: segment.color,
    x: segment.x,
    y: segment.y,
  }
}

function clearHover() {
  hoveredProvider.value = null
  hoveredSegment.value = null
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

