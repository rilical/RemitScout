<script setup lang="ts">
import DashboardSignedIn from './DashboardSignedIn.vue'

const { ensureAuthenticated, isAuthenticated: _isAuthenticated } = useAuth()
// DEV OVERRIDE – skip auth for local preview (remove before deploy)
const isReadyForDashboard = true
const isAuthenticated = computed(() => true)

// Force Enterprise entitlements for local preview
useState('entitlements:plan', () => 'enterprise')
useState('entitlements:stored-plan', () => 'enterprise')
useState('entitlements:plan-status', () => 'active')
useState('entitlements:plan-lifecycle', () => 'active')
useState('entitlements:limits', () => ({
  watchlistItems: 500,
  alerts: 100,
  exports: true,
  embedSlots: 25,
  pulse: 'full' as const,
  apiAccess: true,
  apiTier: 'enterprise' as const,
}))

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
