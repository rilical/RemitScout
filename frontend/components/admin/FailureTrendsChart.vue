<script setup lang="ts">
import type { FailureTrendPoint } from '~/types/agents'

const props = defineProps<{
  points: FailureTrendPoint[]
}>()

const width = 600
const height = 200
const padding = { top: 16, right: 16, bottom: 32, left: 40 }
const chartWidth = width - padding.left - padding.right
const chartHeight = height - padding.top - padding.bottom

const COLORS = {
  total: '#f59e0b',
  applied: '#22c55e',
}

const chartData = computed(() => {
  const pts = props.points
  if (!pts.length) return null
  const totalVals = pts.map(p => p.total_bundles)
  const appliedVals = pts.map(p => p.applied)
  const allVals = [...totalVals, ...appliedVals]
  const maxVal = Math.max(...allVals, 1)
  const minVal = 0
  const range = maxVal - minVal || 1
  const denom = Math.max(1, pts.length - 1)

  const totalPath = pts
    .map((p, i) => {
      const x = padding.left + (i / denom) * chartWidth
      const y = padding.top + chartHeight - ((p.total_bundles - minVal) / range) * chartHeight
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`
    })
    .join(' ')

  const appliedPath = pts
    .map((p, i) => {
      const x = padding.left + (i / denom) * chartWidth
      const y = padding.top + chartHeight - ((p.applied - minVal) / range) * chartHeight
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`
    })
    .join(' ')

  const xLabels = pts.map((p, i) => ({
    x: padding.left + (i / denom) * chartWidth,
    text: formatShortDate(p.date),
  }))

  const yLabels = [
    { y: padding.top + chartHeight, text: '0' },
    { y: padding.top + chartHeight / 2, text: String(Math.round(maxVal / 2)) },
    { y: padding.top, text: String(Math.round(maxVal)) },
  ]

  return { totalPath, appliedPath, xLabels, yLabels }
})

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="w-full">
    <svg
      :viewBox="`0 0 ${width} ${height}`"
      class="w-full max-w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <g v-if="chartData" class="chart">
        <g class="y-axis">
          <text
            v-for="(label, i) in chartData.yLabels"
            :key="`y-${i}`"
            :x="padding.left - 8"
            :y="label.y + 4"
            text-anchor="end"
            fill="currentColor"
            class="text-caption text-rs-muted"
          >
            {{ label.text }}
          </text>
        </g>
        <g class="x-axis">
          <text
            v-for="(label, i) in chartData.xLabels"
            :key="`x-${i}`"
            :x="label.x"
            :y="height - padding.bottom + 16"
            text-anchor="middle"
            fill="currentColor"
            class="text-caption text-rs-muted"
          >
            {{ label.text }}
          </text>
        </g>
        <path
          :d="chartData.totalPath"
          fill="none"
          :stroke="COLORS.total"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          :d="chartData.appliedPath"
          fill="none"
          :stroke="COLORS.applied"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>
    <div class="mt-3 flex flex-wrap items-center justify-center gap-4">
      <span class="flex items-center gap-2 text-body-sm text-rs-muted">
        <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: COLORS.total }" />
        Total bundles
      </span>
      <span class="flex items-center gap-2 text-body-sm text-rs-muted">
        <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: COLORS.applied }" />
        Applied repairs
      </span>
    </div>
  </div>
</template>
