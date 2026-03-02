<script setup lang="ts">
const props = defineProps<{
  value: number | null | undefined
  compact?: boolean
}>()

const barColor = computed(() => {
  const v = props.value
  if (v == null) return 'bg-neutral-200'
  if (v >= 0.8) return 'bg-green-500'
  if (v >= 0.5) return 'bg-amber-500'
  return 'bg-red-500'
})

const pct = computed(() => {
  if (props.value == null) return 0
  return Math.min(100, Math.max(0, props.value * 100))
})
</script>

<template>
  <div
class="flex items-center gap-2"
:class="compact ? 'w-16' : 'w-24'"
>
    <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
      <div
        class="absolute inset-y-0 left-0 rounded-full transition-all"
        :class="barColor"
        :style="{ width: `${pct}%` }"
      />
    </div>
    <span
v-if="value != null"
class="text-caption tabular-nums text-rs-muted"
>{{ (value * 100).toFixed(0) }}%</span>
    <span
v-else
class="text-caption text-rs-muted"
>&mdash;</span>
  </div>
</template>
