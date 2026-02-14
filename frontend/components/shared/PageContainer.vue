<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  narrow?: boolean
  wide?: boolean
  noPadY?: boolean
}>(), {
  narrow: false,
  wide: false,
  noPadY: false,
})

const classes = computed(() => {
  const widthClass = props.wide
    ? 'max-w-full'
    : props.narrow
      ? 'max-w-4xl'
      : 'max-w-[var(--rs-page-max-width)]'

  return [
    'mx-auto',
    widthClass,
    'px-page-x',
    ...(props.noPadY ? [] : ['py-page-y']),
  ]
})
</script>
