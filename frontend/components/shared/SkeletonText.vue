<template>
  <div class="space-y-2">
    <SkeletonBlock
      v-for="(lineWidth, index) in resolvedWidths"
      :key="`${lineWidth}-${index}`"
      :width="lineWidth"
      :height="height"
      :rounded="rounded"
      :tone="tone"
    />
  </div>
</template>

<script setup lang="ts">
import SkeletonBlock from './SkeletonBlock.vue'

type SkeletonRounded = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
type SkeletonTone = 'light' | 'dark'

const props = withDefaults(defineProps<{
  lines?: number
  width?: string[] | string
  height?: string
  rounded?: SkeletonRounded
  tone?: SkeletonTone
}>(), {
  lines: 3,
  width: () => ['100%', '95%', '85%'],
  height: '0.875rem',
  rounded: 'md',
  tone: 'light',
})

const fallbackWidths = ['100%', '95%', '85%']

const resolvedLines = props.lines || 3

const resolvedWidths = Array.isArray(props.width)
  ? props.width
  : [props.width, ...Array.from({ length: Math.max(resolvedLines - 1, 0) }, (_, index) => fallbackWidths[index % fallbackWidths.length])]

const height = props.height
const rounded = props.rounded
const tone = props.tone
</script>
