<template>
  <div class="h-9 bg-gradient-to-r from-neutral-100 via-white to-neutral-100 flex items-center justify-center px-4 border-b border-neutral-200/50 animate-fade-in" role="banner" aria-live="polite">
    <div class="flex items-center gap-2 text-xs sm:text-sm text-neutral-700">
      <NuxtLink 
        to="/methodology" 
        class="hover:text-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 rounded px-1"
      >
        Independent comparisons
      </NuxtLink>
      <span class="text-neutral-400">•</span>
      <NuxtLink 
        to="/methodology" 
        class="hover:text-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 rounded px-1"
      >
        Regulated providers
      </NuxtLink>
      <span class="text-neutral-400">•</span>
      <button
        @click="$emit('open-modal')"
        class="hover:text-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 rounded px-1"
        aria-label="Learn how we make money"
      >
        How we make money
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'open-modal': []
}>();
</script>


