<script setup lang="ts">
defineProps<{
  level: 'normal' | 'elevated' | 'high' | 'critical' | null | undefined
  score?: number | null
  compact?: boolean
  showNormal?: boolean
}>()

const levelColor = (level: string | null | undefined) => {
  if (level === 'critical') return 'bg-red-100 text-red-700'
  if (level === 'high') return 'bg-orange-100 text-orange-700'
  if (level === 'elevated') return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}
</script>

<template>
  <span
    v-if="level && (showNormal || level !== 'normal')"
    class="text-caption inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium"
    :class="[levelColor(level), compact ? 'text-[10px]' : '']"
  >
    <span
v-if="score != null"
class="tabular-nums"
>{{ score.toFixed(1) }}</span>
    <span class="capitalize">{{ level }}</span>
  </span>
</template>
