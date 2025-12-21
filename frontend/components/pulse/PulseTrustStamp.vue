<template>
  <div class="flex items-center justify-between border-t border-neutral-700 bg-neutral-900/50 px-4 py-2 text-xs">
    <div class="flex items-center gap-3 text-neutral-500">
      <div class="flex items-center gap-1.5">
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Data sourced {{ relativeTime }}</span>
      </div>
      <span class="text-neutral-600">•</span>
      <div class="flex items-center gap-1.5">
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>Verified by Remit-Scout</span>
      </div>
    </div>
    <NuxtLink
      to="/methodology"
      class="text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
    >
      <span>Methodology</span>
      <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  lastUpdated: string
}

const props = defineProps<Props>()

const relativeTime = computed(() => {
  if (!props.lastUpdated) return 'recently'
  const diff = Date.now() - new Date(props.lastUpdated).getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1 min ago'
  if (minutes < 60) return `${minutes} mins ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  
  return new Date(props.lastUpdated).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
})
</script>
