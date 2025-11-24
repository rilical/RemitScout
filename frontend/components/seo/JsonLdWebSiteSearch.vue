<template>
  <div
    class="hidden"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { useStructuredData } from '~/composables/useStructuredData'

const { addWebSiteSearchSchema } = useStructuredData()

// Add WebSite search schema
addWebSiteSearchSchema()
</script>

