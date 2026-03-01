<script setup lang="ts">
import type { PublicationStatus } from '~/types/indices'

defineProps<{
  status: PublicationStatus | null | undefined
}>()

const badgeClass = (s: PublicationStatus | null | undefined) => {
  if (s === 'final') return 'bg-green-100 text-green-700'
  if (s === 'provisional') return 'bg-amber-100 text-amber-700'
  return 'bg-neutral-100 text-neutral-500'
}
</script>

<template>
  <span
    v-if="status"
    class="inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium capitalize"
    :class="badgeClass(status)"
  >
    {{ status }}
  </span>
</template>
