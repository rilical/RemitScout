<template>
  <div class="relative">
    <!-- Chart Container -->
    <div
      ref="chartContainer"
      class="relative h-80 w-full"
    >
      <svg
        class="h-full w-full"
        :viewBox="`0 0 ${width} ${height}`"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient
            v-for="s in series"
            :id="`area-gradient-${s.id}`"
            :key="`gradient-${s.id}`"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              :style="`stop-color: ${s.color}; stop-opacity: 0.2`"
            />
            <stop
              offset="100%"
              :style="`stop-color: ${s.color}; stop-opacity: 0`"
            />
          </linearGradient>
        </defs>

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
        <g
          class="y-axis text-neutral-400"
          font-size="11"
        >
          <text
            v-for="(label, i) in yAxisLabels"
            :key="`y-label-${i}`"
            :x="padding.left - 10"
            :y="label.y + 4"
            text-anchor="end"
            fill="currentColor"
            class="text-rs-muted"
          >
            {{ label.text }}
          </text>
        </g>

        <!-- X-axis labels -->
        <g
          class="x-axis text-neutral-400"
          font-size="11"
        >
          <text
            v-for="(label, i) in xAxisLabels"
            :key="`x-label-${i}`"
            :x="label.x"
            :y="height - padding.bottom + 20"
            text-anchor="middle"
            fill="currentColor"
            class="text-rs-muted"
          >
            {{ label.text }}
          </text>
        </g>

        <!-- Area fills -->
        <g
          v-if="showArea"
          class="areas"
        >
          <path
            v-for="s in renderedSeries"
            :key="`area-${s.id}`"
            :d="getAreaPath(s.normalizedPoints)"
            :fill="`url(#area-gradient-${s.id})`"
          />
        </g>

        <!-- Lines -->
        <g class="lines">
          <polyline
            v-for="s in renderedSeries"
            :key="`line-${s.id}`"
            :points="getLinePath(s.normalizedPoints)"
            fill="none"
            :stroke="s.color"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>

        <!-- Dots on hover -->
        <g
          v-if="hoveredIndex !== null"
          class="hover-dots"
        >
          <circle
            v-for="s in renderedSeries"
            :key="`dot-${s.id}`"
            :cx="s.normalizedPoints[hoveredIndex]?.x"
            :cy="s.normalizedPoints[hoveredIndex]?.y"
            r="4"
            :fill="s.color"
            stroke="white"
            stroke-width="2"
          />
        </g>

        <!-- Hover line -->
        <line
          v-if="hoveredIndex !== null && renderedSeries[0]?.normalizedPoints[hoveredIndex]"
          :x1="renderedSeries[0].normalizedPoints[hoveredIndex].x"
          :y1="padding.top"
          :x2="renderedSeries[0].normalizedPoints[hoveredIndex].x"
          :y2="height - padding.bottom"
          stroke="currentColor"
          stroke-opacity="0.3"
          stroke-dasharray="4"
        />

        <!-- Invisible hover areas -->
        <rect
          v-for="(_, i) in hoverAreas"
          :key="`hover-${i}`"
          :x="hoverAreas[i].x"
          :y="padding.top"
          :width="hoverAreas[i].width"
          :height="height - padding.top - padding.bottom"
          fill="transparent"
          @mouseenter="hoveredIndex = i"
          @mouseleave="hoveredIndex = null"
        />
      </svg>

      <!-- Tooltip -->
      <div
        v-if="hoveredIndex !== null && tooltipData"
        class="absolute z-20 pointer-events-none rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 shadow-lg"
        :style="tooltipStyle"
      >
        <div class="mb-1 text-body-sm text-neutral-400">
          {{ tooltipData.date }}
        </div>
        <div
          v-for="item in tooltipData.values"
          :key="item.label"
          class="flex items-center gap-2 text-body-sm"
        >
          <span
            class="h-2 w-2 rounded-full"
            :style="{ backgroundColor: item.color }"
          />
          <span class="text-neutral-300">{{ item.label }}:</span>
          <span class="font-semibold text-white">{{ item.value }}</span>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-4 flex flex-wrap items-center justify-center gap-4">
      <button
        v-for="s in series"
        :key="`legend-${s.id}`"
        class="flex items-center gap-2 rounded-full px-3 py-1 text-body-sm transition-opacity"
        :class="visibleSeries.has(s.id) ? 'opacity-100' : 'opacity-40'"
        @click="toggleSeries(s.id)"
      >
        <span
          class="h-3 w-3 rounded-full"
          :style="{ backgroundColor: s.color }"
        />
        <span class="text-neutral-300">{{ s.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import type { ChartSeries, ChartPoint } from '~/types/pulse'
import { formatDate as formatFullDate, formatMonthDay, formatNumber } from '~/shared/lib/format'

interface Props {
  series: ChartSeries[]
  unit?: string
  unitLabel?: string
  showArea?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  unit: 'number',
  unitLabel: '',
  showArea: true,
})

const width = 800
const height = 320
const padding = { top: 20, right: 20, bottom: 40, left: 60 }

const hoveredIndex = ref<number | null>(null)
const visibleSeries = reactive(new Set<string>(props.series.map(s => s.id)))

const chartWidth = width - padding.left - padding.right
const chartHeight = height - padding.top - padding.bottom

function toggleSeries(id: string) {
  if (visibleSeries.has(id)) {
    if (visibleSeries.size > 1) visibleSeries.delete(id)
  }
  else {
    visibleSeries.add(id)
  }
}

const renderedSeries = computed(() => {
  if (props.series.length === 0) return []
  const allValues = props.series
    .filter(x => visibleSeries.has(x.id))
    .flatMap(x => x.points.map(p => p.v))
  if (allValues.length === 0) return []
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const range = maxVal - minVal || 1

  return props.series
    .filter(s => visibleSeries.has(s.id))
    .map((s) => {
      const denom = Math.max(1, s.points.length - 1)
      const normalizedPoints = s.points.map((p, i) => ({
        x: padding.left + (i / denom) * chartWidth,
        y: padding.top + chartHeight - ((p.v - minVal) / range) * chartHeight,
        value: p.v,
        timestamp: p.t,
      }))

      return { ...s, normalizedPoints }
    })
})

watch(
  () => props.series,
  (next) => {
    visibleSeries.clear()
    next.forEach(series => visibleSeries.add(series.id))
  },
  { deep: true },
)

const gridLines = computed(() => {
  const count = 5
  return Array.from({ length: count }, (_, i) =>
    padding.top + (i / (count - 1)) * chartHeight,
  )
})

const yAxisLabels = computed(() => {
  if (renderedSeries.value.length === 0) return []
  const allValues = props.series
    .filter(s => visibleSeries.has(s.id))
    .flatMap(s => s.points.map(p => p.v))
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const count = 5

  return Array.from({ length: count }, (_, i) => {
    const value = maxVal - (i / (count - 1)) * (maxVal - minVal)
    return {
      y: padding.top + (i / (count - 1)) * chartHeight,
      text: formatValue(value),
    }
  })
})

const xAxisLabels = computed(() => {
  if (renderedSeries.value.length === 0 || renderedSeries.value[0].normalizedPoints.length === 0) {
    return []
  }
  const points = renderedSeries.value[0].normalizedPoints
  const count = Math.min(6, points.length)
  const step = Math.floor(points.length / (count - 1))

  return Array.from({ length: count }, (_, i) => {
    const idx = Math.min(i * step, points.length - 1)
    const point = points[idx]
    return {
      x: point.x,
      text: formatAxisDate(point.timestamp),
    }
  })
})

const hoverAreas = computed(() => {
  if (renderedSeries.value.length === 0) return []
  const points = renderedSeries.value[0].normalizedPoints
  const areaWidth = chartWidth / points.length

  return points.map((p, i) => ({
    x: p.x - areaWidth / 2,
    width: areaWidth,
  }))
})

const tooltipData = computed(() => {
  if (hoveredIndex.value === null || renderedSeries.value.length === 0) return null
  const idx = hoveredIndex.value
  const point = renderedSeries.value[0]?.normalizedPoints[idx]
  if (!point) return null

  return {
    date: formatFullDate(new Date(point.timestamp)),
    values: renderedSeries.value.map(s => ({
      label: s.label,
      color: s.color,
      value: formatValue(s.normalizedPoints[idx]?.value ?? 0),
    })),
  }
})

const tooltipStyle = computed(() => {
  if (hoveredIndex.value === null || renderedSeries.value.length === 0) return {}
  const point = renderedSeries.value[0]?.normalizedPoints[hoveredIndex.value]
  if (!point) return {}

  const xPercent = (point.x / width) * 100
  const left = xPercent > 70 ? `${xPercent - 20}%` : `${xPercent + 5}%`
  const top = `${(point.y / height) * 100}%`

  return { left, top }
})

function formatValue(value: number): string {
  switch (props.unit) {
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'bps':
      return `${Math.round(value)} bps`
    case 'currency':
      return formatNumber(value, { maximumFractionDigits: 0 })
    case 'rate':
      return value.toFixed(4)
    case 'minutes':
      return `${Math.round(value)} min`
    case 'count':
    case 'index':
      return `${Math.round(value)}`
    default:
      return value.toFixed(2)
  }
}

function formatAxisDate(timestamp: number): string {
  return formatMonthDay(new Date(timestamp))
}

function getLinePath(points: { x: number, y: number }[]): string {
  return points.map(p => `${p.x},${p.y}`).join(' ')
}

function getAreaPath(points: { x: number, y: number }[]): string {
  if (points.length === 0) return ''
  const start = `M ${points[0].x},${height - padding.bottom}`
  const line = points.map(p => `L ${p.x},${p.y}`).join(' ')
  const end = `L ${points[points.length - 1].x},${height - padding.bottom} Z`
  return `${start} ${line} ${end}`
}
</script>
