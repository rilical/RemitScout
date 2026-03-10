<script setup lang="ts">
import { computed } from 'vue'

type SkeletonShape = 'chart-line' | 'chart-bar' | 'stat-card' | 'table-rows' | 'text-block' | 'gauge'
type HeightVariant = 'sparkline' | 'compact' | 'standard' | 'tall'
type Variant = 'terminal' | 'consumer'

const props = withDefaults(
  defineProps<{
    shape: SkeletonShape
    count?: number
    height?: HeightVariant
    variant?: Variant
  }>(),
  {
    count: 5,
    height: 'standard',
    variant: 'terminal',
  },
)

const HEIGHT_MAP: Record<HeightVariant, string> = {
  sparkline: 'h-16',
  compact: 'h-[200px]',
  standard: 'h-[320px]',
  tall: 'h-[480px]',
}

const heightClass = computed(() => HEIGHT_MAP[props.height])

const skeletonBg = computed(() =>
  props.variant === 'terminal' ? 'bg-neutral-700/30' : 'bg-neutral-200',
)

// Bar heights for chart-bar shape (as percentages of container)
const BAR_HEIGHTS = ['40%', '70%', '55%', '85%', '60%']
</script>

<template>
  <!-- chart-line skeleton -->
  <div
    v-if="shape === 'chart-line'"
    class="relative w-full animate-pulse overflow-hidden rounded-lg"
    :class="[heightClass, skeletonBg]"
    role="status"
    aria-label="Loading chart"
  >
    <!-- Horizontal line hints -->
    <div
      class="absolute left-0 right-0 h-px opacity-30"
      :class="skeletonBg"
      style="top: 10%"
    />
    <div
      class="absolute left-0 right-0 h-px opacity-30"
      :class="skeletonBg"
      style="top: 50%"
    />
    <!-- Wavy path hint at center (SVG) -->
    <svg
      class="absolute inset-0 h-full w-full opacity-20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points="0,60% 15,45% 30,55% 45,35% 60,50% 75,30% 90,45% 100,40%"
        stroke="currentColor"
        stroke-width="2"
        fill="none"
        class="text-neutral-400"
      />
    </svg>
  </div>

  <!-- chart-bar skeleton -->
  <div
    v-else-if="shape === 'chart-bar'"
    class="relative w-full animate-pulse overflow-hidden rounded-lg"
    :class="[heightClass, skeletonBg]"
    role="status"
    aria-label="Loading chart"
  >
    <div class="absolute inset-x-4 bottom-4 flex items-end justify-around gap-2 h-4/5">
      <div
        v-for="(barH, i) in BAR_HEIGHTS"
        :key="i"
        class="flex-1 rounded-t opacity-40"
        :class="skeletonBg"
        :style="{ height: barH }"
      />
    </div>
  </div>

  <!-- stat-card skeleton -->
  <template v-else-if="shape === 'stat-card'">
    <div
      v-for="n in count"
      :key="n"
      class="animate-pulse space-y-2"
      role="status"
      aria-label="Loading stat"
    >
      <div :class="[skeletonBg, 'h-3 w-24 rounded']" />
      <div :class="[skeletonBg, 'mt-2 h-6 w-32 rounded']" />
      <div :class="[skeletonBg, 'mt-1 h-3 w-20 rounded']" />
    </div>
  </template>

  <!-- table-rows skeleton -->
  <div
    v-else-if="shape === 'table-rows'"
    class="animate-pulse space-y-3 w-full"
    role="status"
    aria-label="Loading table"
  >
    <div
      v-for="n in count"
      :key="n"
      class="flex items-center gap-4"
    >
      <div :class="[skeletonBg, 'h-4 w-1/4 rounded']" />
      <div :class="[skeletonBg, 'h-4 w-1/5 rounded']" />
      <div :class="[skeletonBg, 'h-4 w-1/3 rounded']" />
      <div :class="[skeletonBg, 'h-4 w-1/6 rounded']" />
    </div>
  </div>

  <!-- text-block skeleton -->
  <div
    v-else-if="shape === 'text-block'"
    class="animate-pulse space-y-2 w-full"
    role="status"
    aria-label="Loading text"
  >
    <div :class="[skeletonBg, 'h-3 w-full rounded']" />
    <div :class="[skeletonBg, 'h-3 w-4/5 rounded']" />
    <div :class="[skeletonBg, 'h-3 w-3/5 rounded']" />
  </div>

  <!-- gauge skeleton -->
  <div
    v-else-if="shape === 'gauge'"
    class="animate-pulse flex items-center justify-center"
    role="status"
    aria-label="Loading gauge"
  >
    <svg
      width="120"
      height="60"
      viewBox="0 0 120 60"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M 10 58 A 50 50 0 0 1 110 58"
        :stroke="variant === 'terminal' ? '#404040' : '#e5e7eb'"
        stroke-width="10"
        stroke-linecap="round"
        fill="none"
      />
    </svg>
  </div>
</template>
