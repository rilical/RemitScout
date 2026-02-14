<template>
  <PopularCorridorsPage
    :corridors-by-country="corridorsByCountry"
    :pending="pending"
    :error="error"
  />
</template>

<script setup lang="ts">
import { PopularCorridorsPage, usePopularCorridorsModel } from '~/domains/transfers'

const { corridorsByCountry, pending, error } = usePopularCorridorsModel()

const { public: { siteUrl } } = useRuntimeConfig()

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Popular Corridors',
    description: 'Explore the most searched international money transfer corridors and compare provider options.',
  },
})

useServerSeoMeta({
  title: 'Popular Money Transfer Corridors | Remit-Scout',
  description: 'Compare rates across the most popular international money transfer corridors. See provider coverage, fees, and delivered value for each lane in minutes.',
})

setSeo({
  title: 'Popular Money Transfer Corridors | Remit-Scout',
  description: 'Compare rates across the most popular international money transfer corridors. See provider coverage, fees, and delivered value for each lane in minutes.',
  canonical: `${siteUrl}/corridors`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Popular Corridors', url: `${siteUrl}/corridors` },
])
</script>
