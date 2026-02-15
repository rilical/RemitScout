<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'

definePageMeta({ middleware: 'auth' })

const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Alerts | Remit-Scout',
  description: 'Redirecting to your private Remit-Scout dashboard alerts.',
  canonical: `${siteUrl}/dashboard`,
  noindex: true,
})

await navigateTo({
  path: '/dashboard',
  query: { tab: 'alerts' },
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50 py-12">
    <div class="mx-auto w-full max-w-3xl px-page-x text-body-sm text-neutral-600">
      Redirecting…
    </div>
  </div>
</template>
