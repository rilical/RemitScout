<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4">
    <div class="max-w-2xl w-full">
      <div class="bg-slate-800 rounded-2xl border-2 border-emerald-500 p-8 sm:p-12 text-center">
        <!-- Success Icon -->
        <div class="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-6">
          <svg
            class="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 class="text-4xl font-bold text-white mb-4">
          Welcome to Plus!
        </h1>
        <p class="text-xl text-slate-300 mb-8">
          Your subscription is now active. You have full access to all Plus features.
        </p>

        <!-- What's Next -->
        <div class="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-8 text-left">
          <h2 class="text-lg font-bold text-white mb-4 text-center">
            What's Next?
          </h2>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                1
              </div>
              <div>
                <h3 class="text-white font-semibold mb-1">
                  Set Up Your Alerts
                </h3>
                <p class="text-sm text-slate-400">
                  Create unlimited rate alerts for the corridors you use most
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                2
              </div>
              <div>
                <h3 class="text-white font-semibold mb-1">
                  Build Your Watchlist
                </h3>
                <p class="text-sm text-slate-400">
                  Track all your important corridors in one place
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                3
              </div>
              <div>
                <h3 class="text-white font-semibold mb-1">
                  Explore Your Dashboard
                </h3>
                <p class="text-sm text-slate-400">
                  See your personalized rate insights and market intelligence
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Confirmation Details -->
        <div class="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-8 text-left">
          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Plan</span>
              <span class="text-white font-semibold">Remit-Scout Plus</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Billing</span>
              <span class="text-white">$9/month</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Trial Period</span>
              <span class="text-white">14 days free</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Next Billing Date</span>
              <span class="text-white">{{ nextBillingDate }}</span>
            </div>
          </div>
        </div>

        <p class="text-sm text-slate-400 mb-8">
          A confirmation email has been sent to your inbox with all the details.
        </p>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink
            to="/dashboard"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
          >
            <span>Go to Dashboard</span>
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </NuxtLink>
          <NuxtLink
            :to="{ path: '/dashboard', query: { tab: 'alerts' } }"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-lg font-semibold border-2 border-slate-600 transition-all"
          >
            <span>Create Alert</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useApi } from '~/composables/useApi'

const route = useRoute()
const _sessionId = route.query.session_id as string | undefined
const { request } = useApi()

if (_sessionId) {
  try {
    await request('/stripe/verify-session', {
      method: 'POST',
      body: { sessionId: _sessionId },
    })
  } catch (error) {
    console.warn('Stripe verification failed:', error)
  }
}

const nextBillingDate = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

useHead({
  title: 'Success - Remit-Scout Plus',
  meta: [
    { name: 'description', content: 'Your Plus subscription is active' },
  ],
})
</script>







