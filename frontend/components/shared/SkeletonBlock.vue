<template>
  <div
    class="inline-block animate-pulse"
    :class="[toneClass, roundedClass]"
    :style="{
      width: resolvedWidth === 'full' ? '100%' : resolvedWidth,
      height: resolvedHeightValue,
    }"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

type SkeletonTone = 'light' | 'dark'
type SkeletonRounded = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'

const props = withDefaults(defineProps<{
  width?: string
  height?: string
  rounded?: SkeletonRounded
  tone?: SkeletonTone
}>(), {
  width: 'full',
  height: '4',
  rounded: 'md',
  tone: 'light',
})

const resolvedWidth = computed(() => props.width || 'full')
const resolvedHeightValue = computed(() => {
  const height = props.height || '1rem'
  return /^\d+$/.test(height) ? `${height}px` : height
})

const roundedClass = computed(() => {
  switch (props.rounded) {
    case 'none':
      return 'rounded-none'
    case 'sm':
      return 'rounded-sm'
    case 'md':
      return 'rounded-md'
    case 'lg':
      return 'rounded-lg'
    case 'xl':
      return 'rounded-xl'
    case '2xl':
      return 'rounded-2xl'
    case '3xl':
      return 'rounded-3xl'
    case 'full':
      return 'rounded-full'
    default:
      return 'rounded-md'
  }
})
const toneClass = computed(() => (props.tone === 'dark' ? 'bg-neutral-700' : 'bg-neutral-200'))
</script>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  div {
    animation: none;
  }
}
</style>
