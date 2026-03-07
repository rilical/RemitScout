<script setup lang="ts">
import { PlusPage } from '~/domains/plus'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

const { public: { siteUrl } } = useRuntimeConfig()

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Remit-Scout Plus',
    description: 'Rate alerts, watchlists, and exportable history for frequent money transfer senders.',
  },
})

setSeo({
  title: 'Remit-Scout Plus | Rate Alerts and Watchlists',
  description: 'Remit-Scout Plus unlocks rate alerts, watchlists, and exportable history so you can track corridors over time without changing provider rankings.',
  canonical: `${siteUrl}/plus`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Plus', url: `${siteUrl}/plus` },
])
</script>

<template>
  <PlusPage />
</template>
