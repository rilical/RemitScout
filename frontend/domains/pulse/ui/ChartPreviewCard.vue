<template>
  <div
    class="group relative card-interactive overflow-hidden hover:border-brand-600"
  >
    <div
      v-if="daysAvailable > 0 && daysAvailable < 7 && !isGated"
      class="absolute top-3 right-3 z-10 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2 py-1 text-label text-amber-300"
    >
      Warming up ({{ daysAvailable }} days)
    </div>
    <div
      v-else-if="daysAvailable >= 7 && daysAvailable < 30 && !isGated"
      class="absolute top-3 right-3 z-10 rounded-lg border border-blue-500/40 bg-blue-500/15 px-2 py-1 text-label text-blue-300"
    >
      Early data
    </div>
    <div
      v-else-if="isGated"
      class="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-brand-600/20 px-2 py-1 text-body-sm font-semibold text-brand-600"
    >
      <Icon
        name="lock"
        :size="16"
        class="text-current"
      />
      {{ resolvedGateLabel }}
    </div>

    <div class="p-5">
      <div class="mb-3 text-label text-neutral-500">
        {{ metadata.categoryLabel }}
      </div>

      <div class="mb-2 flex items-center justify-between gap-3">
        <h3 class="text-body-lg font-bold text-white group-hover:text-brand-600 transition-colors">
          {{ metadata.title }}
        </h3>
        <ConfidenceIndicator
          v-if="chartConfidence != null"
          :value="chartConfidence"
          :compact="true"
        />
      </div>

      <div
        v-if="isGated && !isTeaserLocked"
        class="mb-4 rounded-lg border border-neutral-700 bg-neutral-900/40 p-3"
      >
        <div class="text-body-sm font-semibold text-neutral-200">
          {{ resolvedGateLabel }} chart
        </div>
        <div class="mt-1 text-body-sm text-neutral-400">
          {{ metadata.description }}
        </div>
        <NuxtLink
          :to="resolvedCtaTo"
          class="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-body-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          {{ resolvedCtaLabel }}
          <Icon
            name="arrow-right"
            :size="16"
            class="text-current"
          />
        </NuxtLink>
      </div>

      <div
        v-else-if="isTeaserLocked"
        class="mb-4 rounded-lg border border-neutral-700 bg-neutral-900/40 p-3"
      >
        <div class="text-body-sm font-semibold text-neutral-200">
          Preview unlocked for 7 days
        </div>
        <div class="mt-1 text-body-sm text-neutral-400">
          Live data is shown for the last 7 days. Unlock full history for complete trend analysis.
        </div>
        <NuxtLink
          :to="resolvedCtaTo"
          class="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-body-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          {{ resolvedCtaLabel }}
          <Icon
            name="arrow-right"
            :size="16"
            class="text-current"
          />
        </NuxtLink>
      </div>

      <div
        v-else-if="calloutCurrentLabel"
        class="mb-4 flex items-end justify-between gap-4"
      >
        <div>
          <div class="text-label text-neutral-500">
            Now
          </div>
          <div class="text-h4 font-bold text-white text-mono-value">
            {{ calloutCurrentLabel }}
          </div>
          <p
            v-if="insight"
            class="mt-2 text-body-sm text-neutral-400"
          >
            {{ insight }}
          </p>
        </div>
        <div
          v-if="calloutDeltaLabel"
          class="text-right"
        >
          <div class="text-label text-neutral-500">
            Δ
          </div>
          <div
            class="text-body-sm font-semibold text-mono-value"
            :class="deltaClass"
          >
            {{ calloutDeltaLabel }}
          </div>
        </div>
      </div>

      <p
        v-else-if="displayInsight"
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
        v-if="!isGated && updatedAtLabel"
        class="mb-3 text-label text-neutral-500"
      >
        {{ updatedAtLabel }}
      </p>

      <div class="relative mb-4 h-16 w-full">
        <div
          v-if="isGated && !isTeaserLocked"
          class="h-full w-full rounded-lg border border-neutral-700 bg-neutral-900/30"
        />
        <svg
          v-else-if="sparklinePoints.length >= 2"
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
                :style="`stop-color: ${sparklineColor}; stop-opacity: ${CHART_STYLE.gradient.topOpacity}`"
              />
              <stop
                offset="100%"
                :style="`stop-color: ${sparklineColor}; stop-opacity: ${CHART_STYLE.gradient.bottomOpacity}`"
              />
            </linearGradient>
          </defs>
          <rect
            v-if="chartConfidence != null"
            x="0"
            y="0"
            width="200"
            height="60"
            :fill="confidenceBandColor"
            fill-opacity="0.08"
          />
          <path
            :d="areaPath"
            :fill="`url(#gradient-${metadata.id})`"
          />
          <polyline
            :points="sparklinePath"
            fill="none"
            :stroke="sparklineColor"
            :stroke-width="CHART_STYLE.line.strokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <div
          v-if="isTeaserLocked && sparklinePoints.length >= 2"
          class="pointer-events-none absolute inset-y-0 right-0 w-[38%] border-l border-neutral-700/90 bg-gradient-to-r from-transparent via-neutral-900/65 to-neutral-900/95"
        >
          <div class="flex h-full items-center justify-center px-2 text-center text-label text-neutral-300">
            Unlock full history
          </div>
        </div>
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
      <template v-if="resolvedDisableActions">
        <NuxtLink
          :to="resolvedCtaTo"
          class="text-body-sm font-semibold text-brand-600 hover:text-brand-500 transition-colors inline-flex items-center gap-1.5"
        >
          {{ resolvedCtaLabel }}
          <Icon
            name="arrow-right"
            :size="16"
            class="text-current"
          />
        </NuxtLink>
      </template>
      <template v-else>
        <button
          class="focus-ring-dark text-body-sm font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
          @click="handleView"
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
            v-if="canEmbed"
            class="focus-ring-dark text-body-sm text-neutral-400 hover:text-white transition-colors"
            @click="handleEmbed"
          >
            Embed
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChartMetadata, ChartPoint } from '~/types/pulse'
import { Icon, EmptyState } from '~/ui'
import ConfidenceIndicator from '~/components/shared/ConfidenceIndicator.vue'
import { formatUpdatedLabel } from '~/shared/lib/format'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'
import { getCategoryAccent, CHART_STYLE } from '~/lib/pulseChartStyle'

interface Props {
  metadata: ChartMetadata
  insight: string
  sparklineData?: ChartPoint[]
  isGated?: boolean
  teaserMode?: boolean
  updatedAt?: string | Date | null
  gateLabel?: string
  ctaTo?: string
  ctaLabel?: string
  disableActions?: boolean
  daysAvailable?: number
  canEmbed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sparklineData: () => [],
  isGated: false,
  teaserMode: false,
  updatedAt: null,
  gateLabel: undefined,
  ctaTo: undefined,
  ctaLabel: undefined,
  disableActions: undefined,
  daysAvailable: 0,
  canEmbed: false,
})

const emit = defineEmits<{
  view: [chartId: string]
  embed: [chartId: string]
}>()

const resolvedGateLabel = computed(() => {
  return props.gateLabel || 'Pro'
})

const resolvedCtaTo = computed(() => {
  if (props.ctaTo) return props.ctaTo
  if (resolvedGateLabel.value === 'Plus') return '/plus'
  return '/contact?type=enterprise&topic=pulse'
})

const resolvedCtaLabel = computed(() => {
  if (props.ctaLabel) return props.ctaLabel
  if (resolvedGateLabel.value === 'Plus') return 'Upgrade to Plus'
  return 'Contact sales'
})

const resolvedDisableActions = computed(() => {
  return props.disableActions ?? props.isGated
})

const isTeaserLocked = computed(() => props.isGated && props.teaserMode)

const updatedAtLabel = computed(() => {
  if (!props.updatedAt) return null
  return formatUpdatedLabel(props.updatedAt)
})

const sparklineColor = computed(() => {
  return getCategoryAccent(props.metadata.category)
})

const chartConfidence = computed(() => {
  const points = props.sparklineData
  if (!points || points.length === 0) return null
  const last = points[points.length - 1]
  const c = (last as { confidence?: number })?.confidence
  if (c != null && c >= 0 && c <= 1) return c
  if (props.metadata.id === 'indices-confidence' && last && Number.isFinite(last.v)) {
    const v = last.v / 100
    return Math.min(1, Math.max(0, v))
  }
  return null
})

const confidenceBandColor = computed(() => {
  const c = chartConfidence.value
  if (c == null) return 'transparent'
  if (c >= 0.8) return '#22c55e'
  if (c >= 0.5) return '#f59e0b'
  return '#ef4444'
})

const sparklinePoints = computed(() => {
  const points = props.sparklineData
  if (!isTeaserLocked.value || points.length < 3) return points

  const latestTs = points[points.length - 1]?.t
  if (!Number.isFinite(latestTs)) return points
  const cutoff = Number(latestTs) - 7 * 24 * 60 * 60 * 1000
  const trimmed = points.filter(point => Number(point.t) >= cutoff)
  return trimmed.length >= 2 ? trimmed : points.slice(-2)
})

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

function handleView() {
  if (resolvedDisableActions.value) return
  emit('view', props.metadata.id)
}

function handleEmbed() {
  if (resolvedDisableActions.value) return
  emit('embed', props.metadata.id)
}
</script>
