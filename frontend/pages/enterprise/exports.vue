<script setup lang="ts">
// Legacy route: keep for backwards compatibility, but make Dashboard canonical.
useHead({
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
})

await navigateTo(
  {
    path: '/dashboard',
    query: {
      openExport: '1',
      tab: 'account',
      section: 'exports',
    },
  },
  { redirectCode: 302 },
)
</script>

<template>
  <div class="min-h-screen bg-neutral-50" />
</template>
