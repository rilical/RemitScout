<script setup lang="ts">
import DashboardSignedIn from './DashboardSignedIn.vue'

const { ensureAuthenticated, isAuthenticated } = useAuth()
const isReadyForDashboard = await ensureAuthenticated()

if (import.meta.client && !isReadyForDashboard) {
  await navigateTo({
    path: '/sign-in',
    query: { redirect: '/dashboard' },
  })
}

useHead({
  title: 'Dashboard | Remit-Scout',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <DashboardSignedIn v-if="isAuthenticated" />
  <div
    v-else
    class="min-h-screen bg-surface"
  />
</template>
