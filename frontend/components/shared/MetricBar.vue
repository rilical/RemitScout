<template>
  <div class="flex items-center gap-3">
    <span class="w-32 text-sm font-medium text-gray-700">{{ label }}</span>
    <div
      class="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden"
      role="progressbar"
      :aria-valuenow="value"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="h-full rounded-full bg-emerald-500 transition-all duration-300"
        :style="{ width: `${value}%` }"
        :aria-label="`${label}: ${value}%`"
      />
    </div>
    <span class="w-8 text-xs text-gray-500 text-right">{{ value.toFixed(1) }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
  value: number
}

const props = defineProps<Props>()
</script>
