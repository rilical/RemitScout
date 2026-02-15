<template>
  <div class="flex items-center gap-3">
    <span class="w-32 text-body-sm font-medium text-neutral-700">{{ label }}</span>
    <div
      class="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden"
      role="progressbar"
      :aria-valuenow="value"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="h-full rounded-full bg-success-600 transition-all duration-300"
        :style="{ width: `${value}%` }"
        :aria-label="`${label}: ${value}%`"
      />
    </div>
    <span class="w-8 text-body-sm text-neutral-500 text-right">{{ value.toFixed(1) }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
  value: number
}

const props = defineProps<Props>()
</script>
