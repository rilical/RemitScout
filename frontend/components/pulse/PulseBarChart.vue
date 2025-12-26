<template>
  <div class="relative">
    <!-- Chart Container -->
    <div ref="chartContainer" class="relative h-80 w-full">
      <svg
        class="h-full w-full"
        :viewBox="`0 0 ${width} ${height}`"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Grid lines -->
        <g class="grid-lines">
          <line
            v-for="(y, i) in gridLines"
            :key="`grid-${i}`"
            :x1="padding.left"
            :y1="y"
            :x2="width - padding.right"
            :y2="y"
            stroke="currentColor"
            stroke-opacity="0.1"
            stroke-dasharray="4"
          />
        </g>

        <!-- Y-axis labels -->
        <g class="y-axis" font-size="11">
          <text
            v-for="(label, i) in yAxisLabels"
            :key="`y-label-${i}`"
            :x="padding.left - 10"
            :y="label.y + 4"
            text-anchor="end"
            fill="currentColor"
            class="text-slate-500"
          >
            {{ label.text }}
          </text>
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

        <!-- Bars -->
        <g class="bars">
          <rect
            v-for="(bar, i) in bars"
            :key="`bar-${i}`"
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            :fill="bar.color"
            rx="2"
            class="transition-opacity duration-150"
            :opacity="hoveredIndex === null || hoveredIndex === i ? 1 : 0.4"
            @mouseenter="hoveredIndex = i"
            @mouseleave="hoveredIndex = null"
          />
        </g>

        <!-- Threshold line (optional) -->
        <line
          v-if="threshold !== null"
          :x1="padding.left"
          :y1="getYPosition(threshold)"
          :x2="width - padding.right"
          :y2="getYPosition(threshold)"
          stroke="#f59e0b"
          stroke-width="2"
          stroke-dasharray="6 4"
          class="opacity-60"
        />
      </svg>

      <!-- Tooltip -->
      <div
        v-if="hoveredIndex !== null && hoveredBar"
        class="absolute z-20 pointer-events-none rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 shadow-lg"
        :style="tooltipStyle"
      >
        <div class="mb-1 text-xs text-neutral-400">{{ hoveredBar.date }}</div>
        <div class="flex items-center gap-2 text-sm">
          <span
            class="h-2 w-2 rounded-full"
            :style="{ backgroundColor: hoveredBar.color }"
          />
          <span class="font-semibold text-white">{{ formatValue(hoveredBar.value) }}</span>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-400">
      <div class="flex items-center gap-2">
        <span class="h-3 w-3 rounded bg-brand-600" />
        <span>Daily volatility</span>
      </div>
      <div v-if="threshold !== null" class="flex items-center gap-2">
        <span class="h-0.5 w-6 bg-brand-600" style="border-top: 2px dashed" />
        <span>High volatility threshold</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ChartSeries } from '~/types/pulse'

interface Props {
  series: ChartSeries[]
  unit?: string
  unitLabel?: string
  threshold?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  unit: 'percent',
  unitLabel: '%',
  threshold: null,
})

const width = 800
const height = 320
const padding = { top: 20, right: 20, bottom: 50, left: 60 }

const hoveredIndex = ref<number | null>(null)

const chartWidth = width - padding.left - padding.right
const chartHeight = height - padding.top - padding.bottom

const points = computed(() => {
  if (props.series.length === 0) return []
  return props.series[0].points
})

const minVal = computed(() => 0)
const maxVal = computed(() => {
  const values = points.value.map(p => p.v)
  return Math.max(...values) * 1.1
})

const bars = computed(() => {
  if (points.value.length === 0) return []
  
  const barWidth = Math.max(4, (chartWidth / points.value.length) * 0.7)
  const gap = (chartWidth - barWidth * points.value.length) / (points.value.length + 1)
  
  return points.value.map((p, i) => {
    const normalizedHeight = ((p.v - minVal.value) / (maxVal.value - minVal.value)) * chartHeight
    const color = p.v > (props.threshold ?? Infinity) ? '#1D4ED8' : '#2563EB'
    
    return {
      x: padding.left + gap + i * (barWidth + gap),
      y: padding.top + chartHeight - normalizedHeight,
      width: barWidth,
      height: Math.max(2, normalizedHeight),
      value: p.v,
      timestamp: p.t,
      color,
      date: formatDate(p.t),
    }
  })
})

const hoveredBar = computed(() => {
  if (hoveredIndex.value === null) return null
  return bars.value[hoveredIndex.value]
})

const gridLines = computed(() => {
  const count = 5
  return Array.from({ length: count }, (_, i) =>
    padding.top + (i / (count - 1)) * chartHeight
  )
})

const yAxisLabels = computed(() => {
  const count = 5
  return Array.from({ length: count }, (_, i) => {
    const value = maxVal.value - (i / (count - 1)) * (maxVal.value - minVal.value)
    return {
      y: padding.top + (i / (count - 1)) * chartHeight,
      text: formatValue(value),
    }
  })
})

const xAxisLabels = computed(() => {
  if (bars.value.length === 0) return []
  const count = Math.min(8, bars.value.length)
  const step = Math.floor(bars.value.length / (count - 1))
  
  return Array.from({ length: count }, (_, i) => {
    const idx = Math.min(i * step, bars.value.length - 1)
    const bar = bars.value[idx]
    return {
      x: bar.x + bar.width / 2,
      text: formatDate(bar.timestamp),
    }
  })
})

const tooltipStyle = computed(() => {
  if (hoveredIndex.value === null || !hoveredBar.value) return {}
  const bar = hoveredBar.value
  const xPercent = ((bar.x + bar.width / 2) / width) * 100
  const yPercent = (bar.y / height) * 100

  return {
    left: `${Math.min(xPercent, 80)}%`,
    top: `${Math.max(yPercent - 10, 5)}%`,
    transform: 'translateX(-50%)',
  }
})

function getYPosition(value: number): number {
  return padding.top + chartHeight - ((value - minVal.value) / (maxVal.value - minVal.value)) * chartHeight
}

function formatValue(value: number): string {
  switch (props.unit) {
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'bps':
      return `${Math.round(value)} bps`
    case 'minutes':
      return `${Math.round(value)} min`
    case 'count':
    case 'index':
      return `${Math.round(value)}`
    default:
      return value.toFixed(2)
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
</script>




