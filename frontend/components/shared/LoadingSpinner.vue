<script setup lang="ts">
import { computed } from 'vue'

type SpinnerSize = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  size?: SpinnerSize
  label?: string
}>(), {
  size: 'sm',
  label: 'Loading',
})

const sizePx = computed(() => {
  if (props.size === 'lg') return 24
  if (props.size === 'md') return 20
  return 16
})
</script>

<template>
  <span
    class="inline-flex items-center text-brand-600"
    role="status"
    aria-live="polite"
  >
    <svg
      class="animate-spin"
      :width="sizePx"
      :height="sizePx"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <span class="sr-only">{{ props.label }}</span>
  </span>
</template>
