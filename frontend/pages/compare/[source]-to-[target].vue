<script setup lang="ts">
definePageMeta({
  middleware: (to) => {
    const source = to.params.source as string
    const target = to.params.target as string
    return navigateTo(`/send-money/${source}-to-${target}`, { redirectCode: 301 })
  },
})
</script>

<template>
  <div>Redirecting...</div>
</template>
