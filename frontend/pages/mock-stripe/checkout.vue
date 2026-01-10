<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
      <div class="mx-auto mb-6 h-14 w-14 rounded-full bg-blue-600/20 text-blue-300 flex items-center justify-center text-xl font-bold">
        RS
      </div>
      <h1 class="text-3xl font-bold text-white">Mock Stripe Checkout</h1>
      <p class="mt-2 text-sm text-slate-400">
        Local-only checkout flow. No payment details are collected here.
      </p>

      <div class="mt-6 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-left">
        <div class="text-xs uppercase tracking-wide text-slate-500">Session</div>
        <div class="mt-1 break-all text-sm text-slate-200">
          {{ sessionId || 'missing session_id' }}
        </div>
      </div>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          :href="successUrl"
          class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Complete checkout
        </a>
        <a
          :href="cancelUrl"
          class="inline-flex items-center justify-center rounded-lg border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          Cancel
        </a>
      </div>

      <p class="mt-6 text-xs text-slate-500">
        This page is only used when Stripe mock mode is enabled.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()

const sessionId = computed(() => {
  const value = route.query.session_id
  return typeof value === 'string' ? value : ''
})

const successUrl = computed(() => {
  const value = route.query.success_url
  if (typeof value === 'string' && value.length > 0) {
    return value
  }
  return sessionId.value
    ? `/plus/success?session_id=${encodeURIComponent(sessionId.value)}`
    : '/plus/success'
})

const cancelUrl = computed(() => {
  const value = route.query.cancel_url
  return typeof value === 'string' && value.length > 0 ? value : '/plus/failed'
})

useHead({
  title: 'Mock Stripe Checkout',
})
</script>
