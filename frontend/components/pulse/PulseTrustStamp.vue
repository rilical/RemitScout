<template>
  <div class="flex items-center justify-between border-t border-neutral-700 bg-neutral-900/50 px-4 py-2 text-xs">
    <div class="flex items-center gap-3 text-neutral-500">
      <div class="flex items-center gap-1.5">
        <Icon
          name="clock"
          :size="16"
          class="text-current"
        />
        <span>Data sourced {{ relativeTime }}</span>
      </div>
      <span class="text-neutral-600">•</span>
      <div class="flex items-center gap-1.5">
        <Icon
          name="shield-check"
          :size="16"
          class="text-current"
        />
        <span>Verified by Remit-Scout</span>
      </div>
    </div>
    <NuxtLink
      to="/methodology"
      class="text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
    >
      <span>Methodology</span>
      <Icon
        name="arrow-top-right"
        :size="16"
        class="text-current"
      />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '~/ui'
import { formatRelativeTime } from '~/shared/lib/format'

interface Props {
  lastUpdated?: string | null
}

const props = defineProps<Props>()

const relativeTime = computed(() => {
  if (!props.lastUpdated) return '—'
  return formatRelativeTime(props.lastUpdated)
})
</script>
