<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

await navigateTo({
  path: '/dashboard',
  query: { tab: 'alerts' },
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-12">
    <div class="mx-auto w-full max-w-3xl px-4 text-sm text-slate-600">
      Redirecting…
    </div>
  </div>
</template>
