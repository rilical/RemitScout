<template>
  <div
    class="relative inline-flex items-center justify-center"
    :class="sizeClass"
  >
    <svg
      class="h-full w-full -rotate-90"
      viewBox="0 0 160 160"
      role="img"
      :aria-label="`Remit-Score: ${displayScore} out of 10`"
    >
      <circle
        cx="80"
        cy="80"
        :r="radius"
        fill="none"
        stroke="#e2e8f0"
        :stroke-width="strokeWidth"
      />
      <circle
        cx="80"
        cy="80"
        :r="radius"
        fill="none"
        :stroke="ringColor"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="dashArray"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <span class="text-5xl font-bold text-black">{{ displayScore }}</span>
      <span class="text-sm text-slate-500">/10</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  score: number
  sizeClass?: string
  strokeWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  sizeClass: 'w-40 h-40',
  strokeWidth: 12,
})

const radius = 70
const circumference = 2 * Math.PI * radius

const normalizedScore = computed(() => {
  const value = Number(props.score)
  if (!Number.isFinite(value)) return 0
  return Math.min(10, Math.max(0, value))
})

const displayScore = computed(() => normalizedScore.value.toFixed(1))

const dashArray = computed(() => {
  const dash = (normalizedScore.value / 10) * circumference
  return `${dash} ${circumference}`
})

const ringColor = computed(() => {
  const score = normalizedScore.value
  if (score >= 9.0) return '#10b981'
  if (score >= 8.0) return '#2563eb'
  if (score >= 7.0) return '#eab308'
  return '#6b7280'
})
</script>
