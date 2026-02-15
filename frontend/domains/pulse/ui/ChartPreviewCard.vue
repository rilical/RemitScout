<template>
  <div
    class="group relative rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden transition-all duration-200 hover:border-brand-600"
  >
    <div
      v-if="isGated"
      class="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-brand-600/20 px-2 py-1 text-body-sm font-semibold text-brand-600"
    >
      <Icon
        name="lock"
        :size="16"
        class="text-current"
      />
      Plus
    </div>

    <div class="p-5">
      <div class="mb-3 text-body-sm font-semibold uppercase tracking-wider text-neutral-500">
        {{ metadata.categoryLabel }}
      </div>

      <h3 class="mb-2 text-body-lg font-bold text-white group-hover:text-brand-600 transition-colors">
        {{ metadata.title }}
      </h3>

      <div
        v-if="calloutCurrentLabel"
        class="mb-4 flex items-end justify-between gap-4"
      >
        <div>
          <div class="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Now
          </div>
          <div class="text-h4 font-bold text-white">
            {{ calloutCurrentLabel }}
          </div>
        </div>
        <div
          v-if="calloutDeltaLabel"
          class="text-right"
        >
          <div class="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Δ
          </div>
          <div
            class="text-body-sm font-semibold"
            :class="deltaClass"
          >
            {{ calloutDeltaLabel }}
          </div>
        </div>
      </div>

      <p
        v-if="displayInsight"
        class="mb-4 text-body-sm text-neutral-400"
      >
        {{ displayInsight }}
      </p>
      <div
        v-else
        class="mb-4"
        role="status"
        aria-live="polite"
        aria-label="Loading chart"
      >
        <div class="space-y-2">
          <SkeletonBlock
            width="90%"
            height="0.875rem"
            tone="dark"
          />
          <SkeletonBlock
            width="75%"
            height="0.875rem"
            tone="dark"
          />
        </div>
        <span class="sr-only">Loading chart</span>
      </div>

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
          v-else-if="!displayInsight"
          class="flex h-full w-full items-center"
          role="status"
          aria-live="polite"
          aria-label="Loading chart"
        >
          <SkeletonBlock
            width="full"
            height="4rem"
            tone="dark"
          />
          <span class="sr-only">Loading chart</span>
        </div>
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
        class="text-body-sm font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
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
          class="text-body-sm text-neutral-400 hover:text-white transition-colors"
          @click="$emit('share', metadata.id)"
        >
          Share
        </button>
        <button
          class="text-body-sm text-neutral-400 hover:text-white transition-colors"
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
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'

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

const isNumericUnit = computed(() => {
  const unit = String(props.metadata.unit || '').toLowerCase()
  if (unit === 'provider') return false
  return ['percent', 'bps', 'minutes', 'count', 'index', 'deviation', 'flag'].includes(unit)
})

const latestPoint = computed(() => {
  if (!isNumericUnit.value) return null
  const points = sparklinePoints.value
  if (!points || points.length === 0) return null
  const last = points[points.length - 1]
  return last && Number.isFinite(last.v) ? last : null
})

const prevPoint = computed(() => {
  if (!isNumericUnit.value) return null
  const points = sparklinePoints.value
  if (!points || points.length < 2) return null
  const prev = points[points.length - 2]
  return prev && Number.isFinite(prev.v) ? prev : null
})

const formatScalar = (value: number): string => {
  const unit = String(props.metadata.unit || '').toLowerCase()
  const unitLabel = String(props.metadata.unitLabel || '').trim()

  if (unit === 'flag') return value >= 0.5 ? 'Suppressed' : 'Available'
  if (unit === 'bps') return `${Math.round(value)}${unitLabel ? ` ${unitLabel}` : ' bps'}`
  if (unit === 'minutes') return `${Math.round(value)}${unitLabel ? ` ${unitLabel}` : ' min'}`
  if (unit === 'count') return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
  if (unit === 'percent') return `${value.toFixed(2)}${unitLabel || '%'}`
  return `${value.toFixed(2)}${unitLabel ? ` ${unitLabel}` : ''}`.trim()
}

const calloutCurrentLabel = computed(() => {
  if (!latestPoint.value) return null
  return formatScalar(latestPoint.value.v)
})

const deltaValue = computed(() => {
  if (!latestPoint.value || !prevPoint.value) return null
  const unit = String(props.metadata.unit || '').toLowerCase()
  if (unit === 'flag') return null
  return latestPoint.value.v - prevPoint.value.v
})

const calloutDeltaLabel = computed(() => {
  if (deltaValue.value === null || !Number.isFinite(deltaValue.value)) return null
  const sign = deltaValue.value > 0 ? '+' : ''
  return `${sign}${formatScalar(deltaValue.value)}`
})

const deltaClass = computed(() => {
  if (deltaValue.value === null || !Number.isFinite(deltaValue.value)) return 'text-neutral-400'
  if (deltaValue.value > 0) return 'text-success-600'
  if (deltaValue.value < 0) return 'text-danger-600'
  return 'text-neutral-400'
})

const displayInsight = computed(() => {
  const raw = (props.insight || '').trim()
  if (raw) return raw
  if (calloutCurrentLabel.value && calloutDeltaLabel.value) {
    return `Now ${calloutCurrentLabel.value} (${calloutDeltaLabel.value})`
  }
  if (calloutCurrentLabel.value) {
    return `Now ${calloutCurrentLabel.value}`
  }
  return ''
})

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
