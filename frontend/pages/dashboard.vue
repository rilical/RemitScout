<script setup lang="ts">
import { DashboardPage } from '~/domains/dashboard'
import { setSeo } from '~/composables/useSeo'

const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Dashboard | Remit-Scout',
  description: 'Your private Remit-Scout dashboard for saved corridors, watchlists, and rate alerts.',
  canonical: `${siteUrl}/dashboard`,
  noindex: true,
})
</script>

<template>
  <DashboardPage />
</template>
