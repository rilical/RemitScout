<script setup lang="ts">
const STATUS_URL = 'https://status.remit-scout.com'
const { public: { e2eMockApi } } = useRuntimeConfig()
const isE2e = Boolean(e2eMockApi)

useHead({
  title: 'Status | Remit-Scout',
  meta: [
    ...(isE2e ? [] : [{ 'http-equiv': 'refresh', 'content': `0; url=${STATUS_URL}` }]),
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

if (import.meta.client && !isE2e) {
  // Static hosting friendly: render a page that immediately redirects when JS is available.
  navigateTo(STATUS_URL, { external: true })
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
    <div class="max-w-md text-center">
      <h1 class="text-h2 font-bold text-rs-fg">
        Redirecting...
      </h1>
      <p class="mt-4 text-body text-neutral-700">
        If you are not redirected automatically, open
        <a
          :href="STATUS_URL"
          class="font-semibold text-brand-700 underline underline-offset-2"
          rel="noopener noreferrer"
        >status.remit-scout.com</a>.
      </p>
    </div>
  </div>
</template>
