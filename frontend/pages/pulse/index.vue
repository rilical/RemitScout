<script setup lang="ts">
import { PulsePage } from '~/domains/pulse'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

const { public: { siteUrl } } = useRuntimeConfig()

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Pulse',
    description: 'Live remittance market snapshots, corridor trends, and provider dispersion insights.',
  },
})

setSeo({
  title: 'Pulse | Live Remittance Market Data | Remit-Scout',
  description: 'Pulse shows live remittance snapshots, provider dispersion, and corridor trends so you can track how rates move and where fees spike over time.',
  canonical: `${siteUrl}/pulse`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Pulse', url: `${siteUrl}/pulse` },
])
</script>

<template>
  <PulsePage />
</template>
