<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'terminal' | 'consumer'
type Size = 'sm' | 'md' | 'lg'
type DeltaType = 'positive' | 'negative' | 'neutral'

const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    delta?: string | number | null
    deltaType?: DeltaType
    deltaLabel?: string
    sparkline?: number[]
    sparklineColor?: string
    icon?: string
    variant?: Variant
    size?: Size
    loading?: boolean
    tooltip?: string
    clickable?: boolean
  }>(),
  {
    delta: undefined,
    deltaType: 'neutral',
    deltaLabel: undefined,
    sparkline: undefined,
    sparklineColor: '#2563EB',
    icon: undefined,
    variant: 'terminal',
    size: 'md',
    loading: false,
    tooltip: undefined,
    clickable: false,
  },
)

const emit = defineEmits<{
  click: []
}>()

const isEmDash = computed(() => props.value === '—' || props.value === '\u2014')

const cardClass = computed(() => {
  const base = 'relative overflow-hidden rounded-xl transition-all duration-150'
  const terminal = 'bg-neutral-800/50 border border-neutral-700/50'
  const consumer = 'bg-white border border-neutral-200 shadow-sm'
  const clickable = props.clickable ? 'cursor-pointer hover:border-blue-500/40' : ''
  return [base, props.variant === 'terminal' ? terminal : consumer, clickable].filter(Boolean).join(' ')
})

const paddingClass = computed(() => {
  if (props.size === 'sm') return 'px-3 py-2'
  if (props.size === 'lg') return 'px-5 py-4'
  return 'px-4 py-3'
})

const labelClass = computed(() => {
  const base = 'text-xs font-medium uppercase tracking-wider'
  return props.variant === 'terminal'
    ? `${base} text-neutral-400`
    : `${base} text-neutral-500`
})

const valueClass = computed(() => {
  if (isEmDash.value) {
    return props.variant === 'terminal'
      ? 'font-semibold text-neutral-500'
      : 'font-semibold text-neutral-300'
  }
  const color = props.variant === 'terminal' ? 'text-white' : 'text-neutral-900'
  if (props.size === 'lg') return `text-3xl font-semibold ${color}`
  if (props.size === 'sm') return `text-base font-semibold ${color}`
  return `text-2xl font-semibold ${color}`
})

const deltaClass = computed(() => {
  const base = 'text-xs font-medium'
  if (props.variant === 'terminal') {
    if (props.deltaType === 'positive') return `${base} text-emerald-400`
    if (props.deltaType === 'negative') return `${base} text-red-400`
    return `${base} text-neutral-500`
  }
  if (props.deltaType === 'positive') return `${base} text-emerald-600`
  if (props.deltaType === 'negative') return `${base} text-red-600`
  return `${base} text-neutral-400`
})

const skeletonBg = computed(() =>
  props.variant === 'terminal' ? 'bg-neutral-700/30' : 'bg-neutral-200',
)

// Sparkline SVG
const sparklinePath = computed(() => {
  const data = props.sparkline
  if (!data || data.length < 2) return null

  const width = 60
  const height = 24
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return points.join(' ')
})
</script>

<template>
  <div
    :class="[cardClass, paddingClass]"
    :title="tooltip"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="clickable && emit('click')"
    @keydown.enter="clickable && emit('click')"
    @keydown.space.prevent="clickable && emit('click')"
  >
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="animate-pulse space-y-2">
        <div :class="[skeletonBg, 'h-3 w-2/5 rounded']" />
        <div :class="[skeletonBg, 'h-6 w-3/5 rounded']" />
        <div :class="[skeletonBg, 'h-3 w-[30%] rounded']" />
      </div>
    </template>

    <!-- sm: single row layout -->
    <template v-else-if="size === 'sm'">
      <div class="flex items-center justify-between gap-2">
        <span :class="labelClass">{{ label }}</span>
        <slot name="value">
          <span :class="valueClass">{{ value }}</span>
        </slot>
      </div>
    </template>

    <!-- md / lg: stacked layout -->
    <template v-else>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <slot name="icon">
              <span v-if="icon" class="text-base">{{ icon }}</span>
            </slot>
            <span :class="labelClass">{{ label }}</span>
          </div>

          <div class="mt-1">
            <slot name="value">
              <span :class="valueClass">{{ value }}</span>
            </slot>
          </div>

          <div
            v-if="delta !== undefined && delta !== null"
            class="mt-1 flex items-center gap-1.5"
          >
            <span :class="deltaClass">{{ delta }}</span>
            <span
              v-if="deltaLabel"
              class="text-xs"
              :class="variant === 'terminal' ? 'text-neutral-600' : 'text-neutral-400'"
            >
              {{ deltaLabel }}
            </span>
          </div>
        </div>

        <!-- Sparkline -->
        <div
          v-if="sparkline && sparkline.length >= 2"
          class="shrink-0 self-end"
        >
          <slot name="sparkline">
            <svg
              width="60"
              height="24"
              viewBox="0 0 60 24"
              fill="none"
              aria-hidden="true"
            >
              <polyline
                :points="sparklinePath ?? ''"
                :stroke="sparklineColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
              />
            </svg>
          </slot>
        </div>
      </div>
    </template>
  </div>
</template>
