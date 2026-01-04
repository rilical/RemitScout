<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTelemetry } from '~/composables/useTelemetry'

// Global app setup
useHead({
  htmlAttrs: {
    lang: 'en',
  },
})

const { initSession } = useTelemetry()

onMounted(() => {
  void initSession()
})
</script>
