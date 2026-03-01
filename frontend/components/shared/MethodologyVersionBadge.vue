<script setup lang="ts">
defineProps<{
  version: string | null | undefined
}>()
</script>

<template>
  <span
    v-if="version"
    class="inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 text-caption font-mono text-neutral-600"
  >
    {{ version }}
  </span>
</template>
