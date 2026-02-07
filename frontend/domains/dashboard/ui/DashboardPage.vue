<script setup lang="ts">
import DashboardSignedIn from './DashboardSignedIn.vue'
import DashboardSignedOut from './DashboardSignedOut.vue'

const { ensureHydrated, isAuthenticated } = useAuth()
await ensureHydrated()

useHead({
  title: 'Dashboard | Remit-Scout',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <DashboardSignedOut v-if="!isAuthenticated" />
  <DashboardSignedIn v-else />
</template>
