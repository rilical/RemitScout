<template>
  <div
    v-if="loading"
    class="grid grid-cols-2 gap-4 lg:grid-cols-4"
    aria-busy="true"
    aria-live="polite"
  >
    <div
      v-for="index in 4"
      :key="`headline-skeleton-${index}`"
      class="rounded-xl border border-neutral-700 bg-neutral-800 p-4"
    >
      <div class="mb-3 h-10 w-10 animate-pulse rounded-lg bg-neutral-700/80" />
      <div class="mb-2 h-4 w-24 animate-pulse rounded bg-neutral-700/70" />
      <div class="h-6 w-20 animate-pulse rounded bg-neutral-700/80" />
    </div>
  </div>

  <div
    v-else
    class="grid grid-cols-2 gap-4 lg:grid-cols-4"
  >
    <div
      v-for="tile in tiles"
      :key="tile.id"
      class="group relative cursor-pointer rounded-xl border border-neutral-700 bg-neutral-800 p-4 transition-all duration-200 hover:border-brand-600 hover:scale-[1.02]"
      role="button"
      tabindex="0"
      :aria-label="`${tile.label}: ${tile.value}`"
      @click="handleTileClick(tile)"
      @keydown.enter="handleTileClick(tile)"
      @keydown.space.prevent="handleTileClick(tile)"
    >
      <!-- Tooltip trigger -->
      <button
        type="button"
        class="absolute top-3 right-3 text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100"
        :title="tile.tooltip"
        :aria-label="tile.tooltip"
        @click.stop
      >
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      <!-- Icon -->
      <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
        <component
          :is="getIcon(tile.icon)"
          class="h-5 w-5 text-brand-600"
        />
      </div>

      <!-- Label -->
      <div class="mb-1 text-body-sm font-medium text-neutral-400">
        {{ tile.label }}
      </div>

      <!-- Value (with number tween) -->
      <div class="mb-2 text-h4 font-bold text-white tabular-nums">
        {{ tweenedValues[tile.id] ?? tile.value }}
      </div>

      <!-- Delta -->
      <div
        v-if="tile.delta"
        class="flex items-center gap-1.5"
      >
        <span
          class="flex items-center gap-0.5 text-body-sm font-semibold"
          :class="getDeltaClass(tile.deltaType)"
        >
          <svg
            v-if="tile.deltaType === 'positive'"
            class="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
          <svg
            v-else-if="tile.deltaType === 'negative'"
            class="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
          {{ tile.delta }}
        </span>
        <span
          v-if="tile.deltaLabel"
          class="text-body-sm text-neutral-500"
        >
          {{ tile.deltaLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, ref, reactive, watch } from 'vue'
import type { HeadlineTile } from '~/types/pulse'

interface Props {
  tiles: HeadlineTile[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Number tween animation
const tweenedValues = reactive<Record<string, string>>({})
const prevNumericValues = ref<Record<string, number>>({})

function parseNumeric(value: string): { prefix: string, num: number, suffix: string, decimals: number } | null {
  const match = value.match(/^([^0-9]*?)([\d,]+\.?\d*)(.*)$/)
  if (!match) return null
  const numStr = match[2].replace(/,/g, '')
  const num = parseFloat(numStr)
  if (!Number.isFinite(num)) return null
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0
  return { prefix: match[1], num, suffix: match[3], decimals }
}

function formatTweened(num: number, decimals: number): string {
  const fixed = num.toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decPart ? `${withCommas}.${decPart}` : withCommas
}

function tweenValue(tileId: string, from: number, to: number, prefix: string, suffix: string, decimals: number) {
  const duration = 400
  const start = performance.now()
  const ease = (t: number) => 1 - Math.pow(1 - t, 3) // ease-out cubic

  function step(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const current = from + (to - from) * ease(progress)
    tweenedValues[tileId] = `${prefix}${formatTweened(current, decimals)}${suffix}`
    if (progress < 1) {
      requestAnimationFrame(step)
    }
  }
  requestAnimationFrame(step)
}

watch(
  () => props.tiles,
  (newTiles) => {
    for (const tile of newTiles) {
      const parsed = parseNumeric(tile.value)
      if (!parsed) {
        tweenedValues[tile.id] = tile.value
        continue
      }
      const prev = prevNumericValues.value[tile.id]
      if (prev !== undefined && prev !== parsed.num) {
        tweenValue(tile.id, prev, parsed.num, parsed.prefix, parsed.suffix, parsed.decimals)
      }
 else {
        tweenedValues[tile.id] = tile.value
      }
      prevNumericValues.value[tile.id] = parsed.num
    }
  },
  { deep: true },
)

const emit = defineEmits<{
  'tile-click': [tile: HeadlineTile]
}>()

function handleTileClick(tile: HeadlineTile) {
  emit('tile-click', tile)
}

function getDeltaClass(deltaType?: 'positive' | 'negative' | 'neutral'): string {
  switch (deltaType) {
    case 'positive':
      return 'text-brand-600'
    case 'negative':
      return 'text-danger-600'
    default:
      return 'text-neutral-400'
  }
}

const PercentIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', 'd': 'M9 7H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6' }),
])

const TrendingIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', 'd': 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }),
])

const TrophyIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', 'd': 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' }),
])

const ActivityIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', 'd': 'M13 10V3L4 14h7v7l9-11h-7z' }),
])

const CheckIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', 'd': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }),
])

function getIcon(iconName: string) {
  switch (iconName) {
    case 'percent':
      return PercentIcon
    case 'trending':
      return TrendingIcon
    case 'trophy':
      return TrophyIcon
    case 'activity':
      return ActivityIcon
    case 'check':
      return CheckIcon
    default:
      return CheckIcon
  }
}
</script>
