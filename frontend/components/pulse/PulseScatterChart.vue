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
        <!-- Grid -->
        <g class="grid">
          <!-- Vertical center line -->
          <line
            :x1="centerX"
            :y1="padding.top"
            :x2="centerX"
            :y2="height - padding.bottom"
            stroke="currentColor"
            stroke-opacity="0.1"
          />
          <!-- Horizontal center line -->
          <line
            :x1="padding.left"
            :y1="centerY"
            :x2="width - padding.right"
            :y2="centerY"
            stroke="currentColor"
            stroke-opacity="0.1"
          />
          <!-- Concentric circles for deviation zones -->
          <circle
            v-for="(r, i) in deviationCircles"
            :key="`circle-${i}`"
            :cx="centerX"
            :cy="centerY"
            :r="r"
            fill="none"
            stroke="currentColor"
            :stroke-opacity="0.05 + i * 0.02"
            stroke-dasharray="4"
          />
        </g>

        <!-- Zone labels -->
        <g
          class="labels"
          font-size="10"
        >
          <text
            :x="centerX + deviationCircles[0] + 5"
            :y="centerY - 5"
            fill="currentColor"
            class="text-slate-500"
          >
            1σ
          </text>
          <text
            :x="centerX + deviationCircles[1] + 5"
            :y="centerY - 5"
            fill="currentColor"
            class="text-slate-500"
          >
            2σ
          </text>
          <text
            :x="centerX + deviationCircles[2] + 5"
            :y="centerY - 5"
            fill="currentColor"
            class="text-amber-500"
          >
            3σ (anomaly)
          </text>
        </g>

        <!-- Axis labels -->
        <g font-size="11">
          <text
            :x="width / 2"
            :y="height - 10"
            text-anchor="middle"
            fill="currentColor"
            class="text-slate-400"
          >
            Price deviation →
          </text>
          <text
            :x="15"
            :y="height / 2"
            text-anchor="middle"
            fill="currentColor"
            class="text-slate-400"
            transform="rotate(-90, 15, 160)"
          >
            Time deviation →
          </text>
        </g>

        <!-- Data points -->
        <g class="points">
          <circle
            v-for="(point, i) in scatterPoints"
            :key="`point-${i}`"
            :cx="point.x"
            :cy="point.y"
            :r="point.isAnomaly ? 8 : 5"
            :fill="point.color"
            :stroke="point.isAnomaly ? '#fbbf24' : 'transparent'"
            :stroke-width="point.isAnomaly ? 2 : 0"
            :opacity="hoveredProvider === null || hoveredProvider === point.provider ? 0.8 : 0.2"
            class="transition-all duration-150 cursor-pointer"
            @mouseenter="handlePointHover(point, $event)"
            @mouseleave="clearHover"
          />
        </g>

        <!-- Anomaly indicator arrows -->
        <g class="anomaly-markers">
          <g
            v-for="(point, i) in anomalyPoints"
            :key="`anomaly-${i}`"
          >
            <circle
              :cx="point.x"
              :cy="point.y"
              r="12"
              fill="none"
              stroke="#fbbf24"
              stroke-width="1"
              stroke-dasharray="4"
              class="animate-pulse"
            />
          </g>
        </g>
      </svg>

      <!-- Tooltip -->
      <div
        v-if="hoveredPoint"
        class="absolute z-20 pointer-events-none rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 shadow-lg"
        :style="tooltipStyle"
      >
        <div class="flex items-center gap-2 mb-1">
          <span
            class="h-2 w-2 rounded-full"
            :style="{ backgroundColor: hoveredPoint.color }"
          />
          <span class="text-sm font-semibold text-white">{{ hoveredPoint.provider }}</span>
          <span
            v-if="hoveredPoint.isAnomaly"
            class="text-xs px-1.5 py-0.5 rounded bg-brand-600/20 text-brand-600"
          >
            Anomaly
          </span>
        </div>
        <div class="text-xs text-neutral-400">
          Deviation: {{ hoveredPoint.deviationX.toFixed(1) }}σ / {{ hoveredPoint.deviationY.toFixed(1) }}σ
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-4 flex flex-wrap items-center justify-center gap-4">
      <button
        v-for="s in series"
        :key="`legend-${s.id}`"
        class="flex items-center gap-2 rounded-full px-3 py-1 text-sm transition-opacity"
        :class="hoveredProvider === null || hoveredProvider === s.label ? 'opacity-100' : 'opacity-40'"
        @mouseenter="hoveredProvider = s.label"
        @mouseleave="hoveredProvider = null"
      >
        <span
          class="h-3 w-3 rounded-full"
          :style="{ backgroundColor: s.color }"
        />
        <span class="text-neutral-300">{{ s.label }}</span>
      </button>
    </div>

    <!-- Anomaly summary -->
    <div
      v-if="anomalyPoints.length > 0"
      class="mt-4 rounded-lg border border-brand-600/30 bg-brand-600/10 p-4"
    >
      <div class="flex items-center gap-2 text-brand-600">
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span class="font-semibold">{{ anomalyPoints.length }} anomalies detected</span>
      </div>
      <p class="mt-1 text-sm text-neutral-400">
        These quotes deviate significantly from the provider's baseline. Could be errors or temporary promos.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ChartSeries } from '~/types/pulse'

interface Props {
  series: ChartSeries[]
}

const props = defineProps<Props>()

const width = 800
const height = 320
const padding = { top: 20, right: 20, bottom: 50, left: 50 }

const hoveredProvider = ref<string | null>(null)
const hoveredPoint = ref<{
  provider: string
  color: string
  deviationX: number
  deviationY: number
  isAnomaly: boolean
} | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })

const chartWidth = width - padding.left - padding.right
const chartHeight = height - padding.top - padding.bottom
const centerX = padding.left + chartWidth / 2
const centerY = padding.top + chartHeight / 2
const maxRadius = Math.min(chartWidth, chartHeight) / 2 - 20

const deviationCircles = computed(() => [
  maxRadius / 3,
  (maxRadius * 2) / 3,
  maxRadius,
])

const scatterPoints = computed(() => {
  const points: Array<{
    x: number
    y: number
    provider: string
    color: string
    deviationX: number
    deviationY: number
    isAnomaly: boolean
  }> = []

  for (const s of props.series) {
    for (const p of s.points) {
      const deviationX = p.t
      const deviationY = p.v
      const distance = Math.sqrt(deviationX ** 2 + deviationY ** 2)
      const isAnomaly = distance > 2.5

      points.push({
        x: centerX + (deviationX / 4) * maxRadius,
        y: centerY - (deviationY / 4) * maxRadius,
        provider: s.label,
        color: s.color,
        deviationX,
        deviationY,
        isAnomaly,
      })
    }
  }

  return points
})

const anomalyPoints = computed(() => {
  return scatterPoints.value.filter(p => p.isAnomaly)
})

const tooltipStyle = computed(() => {
  return {
    left: `${tooltipPosition.value.x}px`,
    top: `${tooltipPosition.value.y}px`,
    transform: 'translate(-50%, -100%) translateY(-10px)',
  }
})

function handlePointHover(point: typeof scatterPoints.value[0], event: MouseEvent) {
  hoveredProvider.value = point.provider
  hoveredPoint.value = point

  const rect = (event.target as Element).closest('svg')?.getBoundingClientRect()
  if (rect) {
    tooltipPosition.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }
}

function clearHover() {
  hoveredProvider.value = null
  hoveredPoint.value = null
}
</script>
