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

setSeo({
  title: 'Popular Money Transfer Corridors | Compare Rates | Remit-Scout',
  description: 'Compare rates across the most popular international money transfer corridors. Real-time data from 30+ providers.',
  canonical: `${siteUrl}/corridors`,
  ogImage: `${siteUrl}/og-image.jpg`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Popular Corridors', url: `${siteUrl}/corridors` },
])
</script>
