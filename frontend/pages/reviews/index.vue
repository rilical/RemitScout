<template>
  <div />
</template>

<script setup lang="ts">
const route = useRoute()

await navigateTo(
  {
    path: '/learn/providers',
    query: route.query,
  },
  { redirectCode: 301 },
)
</script>
