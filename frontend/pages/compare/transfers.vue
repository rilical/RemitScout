<script setup lang="ts">
// Redirect old /compare/transfers to new /send-money
definePageMeta({
  middleware: () => {
    return navigateTo('/send-money', { redirectCode: 301 })
  },
})
</script>

<template>
  <div>Redirecting...</div>
</template>
