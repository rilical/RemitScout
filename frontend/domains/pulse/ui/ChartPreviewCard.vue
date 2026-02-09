<template>
  <div
    class="group relative rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden transition-all duration-200 hover:border-brand-600"
  >
    <div
      v-if="isGated"
      class="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-brand-600/20 px-2 py-1 text-xs font-semibold text-brand-600"
    >
      <Icon
        name="lock"
        :size="16"
        class="text-current"
      />
      Plus
    </div>

    <div class="p-5">
      <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {{ metadata.categoryLabel }}
      </div>

      <h3 class="mb-2 text-lg font-bold text-white group-hover:text-brand-600 transition-colors">
        {{ metadata.title }}
      </h3>

      <p class="mb-4 text-sm text-neutral-400">
        {{ insight }}
      </p>

      <p
        v-if="updatedAtLabel"
        class="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
      >
        {{ updatedAtLabel }}
      </p>

      <div class="mb-4 h-16 w-full">
        <svg
          v-if="sparklinePoints.length >= 2"
          viewBox="0 0 200 60"
          class="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              :id="`gradient-${metadata.id}`"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                :style="`stop-color: ${sparklineColor}; stop-opacity: 0.3`"
              />
              <stop
                offset="100%"
                :style="`stop-color: ${sparklineColor}; stop-opacity: 0`"
              />
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
        <div
          v-else
          class="flex h-full items-center justify-center"
        >
          <EmptyState
            mode="inline"
            variant="terminal"
            title="No data yet"
          >
            <template #icon>
              <Icon
                name="info"
                :size="16"
                class="text-neutral-500"
              />
            </template>
          </EmptyState>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between border-t border-neutral-700 px-5 py-3">
      <button
        class="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
        @click="$emit('view', metadata.id)"
      >
        <Icon
          name="eye"
          :size="16"
          class="text-current"
        />
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
import { Icon, EmptyState } from '~/ui'
import { formatUpdatedLabel } from '~/shared/lib/format'

interface Props {
  metadata: ChartMetadata
  insight: string
  sparklineData?: ChartPoint[]
  isGated?: boolean
  updatedAt?: string | Date | null
}

const props = withDefaults(defineProps<Props>(), {
  sparklineData: () => [],
  isGated: false,
  updatedAt: null,
})

defineEmits<{
  view: [chartId: string]
  share: [chartId: string]
  embed: [chartId: string]
}>()

const updatedAtLabel = computed(() => {
  if (!props.updatedAt) return null
  return formatUpdatedLabel(props.updatedAt)
})

const sparklineColor = computed(() => {
  return '#2563EB'
})

const sparklinePoints = computed(() => props.sparklineData)

const normalizedPoints = computed(() => {
  if (sparklinePoints.value.length === 0) return []
  const values = sparklinePoints.value.map(p => p.v)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const denom = Math.max(1, sparklinePoints.value.length - 1)
  return sparklinePoints.value.map((p, i) => ({
    x: (i / denom) * 200,
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
