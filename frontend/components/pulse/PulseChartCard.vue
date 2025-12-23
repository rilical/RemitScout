<template>
  <div
    class="group relative rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden transition-all duration-200 hover:border-brand-600"
  >
    <!-- Lock indicator for Plus-gated charts -->
    <div
      v-if="isGated"
      class="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-brand-600/20 px-2 py-1 text-xs font-semibold text-brand-600"
    >
      <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      Plus
    </div>

    <!-- Main content -->
    <div class="p-5">
      <!-- Category badge -->
      <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {{ metadata.categoryLabel }}
      </div>

      <!-- Title -->
      <h3 class="mb-2 text-lg font-bold text-white group-hover:text-brand-600 transition-colors">
        {{ metadata.title }}
      </h3>

      <!-- Insight line -->
      <p class="mb-4 text-sm text-neutral-400">
        {{ insight }}
      </p>

      <!-- Sparkline -->
      <div class="mb-4 h-16 w-full">
        <svg
          v-if="sparklinePoints.length > 0"
          viewBox="0 0 200 60"
          class="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient :id="`gradient-${metadata.id}`" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" :style="`stop-color: ${sparklineColor}; stop-opacity: 0.3`" />
              <stop offset="100%" :style="`stop-color: ${sparklineColor}; stop-opacity: 0`" />
            </linearGradient>
          </defs>
          <path
            :d="areaPath"
            :fill="`url(#gradient-${metadata.id})`"
          />
          <polyline
            :points="sparklinePath"
            fill="none"
            :stroke="sparklineColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <div v-else class="flex h-full items-center justify-center text-xs text-slate-500">
          No data available
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between border-t border-neutral-700 px-5 py-3">
      <button
        class="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
        @click="$emit('view', metadata.id)"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View
      </button>
      <div class="flex items-center gap-3">
        <button
          class="text-sm text-neutral-400 hover:text-white transition-colors"
          @click="$emit('share', metadata.id)"
        >
          Share
        </button>
        <button
          class="text-sm text-neutral-400 hover:text-white transition-colors"
          @click="$emit('embed', metadata.id)"
        >
          Embed
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChartMetadata, ChartPoint } from '~/types/pulse'

interface Props {
  metadata: ChartMetadata
  insight: string
  sparklineData?: ChartPoint[]
  isGated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sparklineData: () => [],
  isGated: false,
})

defineEmits<{
  view: [chartId: string]
  share: [chartId: string]
  embed: [chartId: string]
}>()

const sparklineColor = computed(() => {
  return '#2563EB'
})

const sparklinePoints = computed(() => {
  if (props.sparklineData.length === 0) {
    return Array.from({ length: 30 }, (_, i) => ({
      t: i,
      v: 50 + Math.sin(i * 0.3) * 20 + Math.random() * 10,
    }))
  }
  return props.sparklineData
})

const normalizedPoints = computed(() => {
  const values = sparklinePoints.value.map(p => p.v)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  
  return sparklinePoints.value.map((p, i) => ({
    x: (i / (sparklinePoints.value.length - 1)) * 200,
    y: 55 - ((p.v - min) / range) * 50,
  }))
})

const sparklinePath = computed(() => {
  return normalizedPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})

const areaPath = computed(() => {
  if (normalizedPoints.value.length === 0) return ''
  const points = normalizedPoints.value
  const start = `M ${points[0].x},60`
  const line = points.map(p => `L ${p.x},${p.y}`).join(' ')
  const end = `L ${points[points.length - 1].x},60 Z`
  return `${start} ${line} ${end}`
})
</script>



