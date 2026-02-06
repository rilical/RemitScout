<template>
  <div />
</template>

<script setup lang="ts">
const route = useRoute()

const raw = route.params.slug
const slug = Array.isArray(raw) ? raw[0] : raw

await navigateTo(
  {
    path: `/learn/providers/${encodeURIComponent(String(slug || ''))}`,
    query: route.query,
  },
  { redirectCode: 301 },
)
</script>
