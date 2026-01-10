<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
      <div class="mx-auto mb-6 h-14 w-14 rounded-full bg-emerald-600/20 text-emerald-300 flex items-center justify-center text-xl font-bold">
        RS
      </div>
      <h1 class="text-3xl font-bold text-white">Mock Billing Portal</h1>
      <p class="mt-2 text-sm text-slate-400">
        Local-only portal page. Manage billing in Stripe when live.
      </p>

      <div class="mt-6 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-left">
        <div class="text-xs uppercase tracking-wide text-slate-500">Return URL</div>
        <div class="mt-1 break-all text-sm text-slate-200">
          {{ returnUrl }}
        </div>
      </div>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          :href="returnUrl"
          class="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Back to account
        </a>
        <a
          href="/dashboard?tab=account"
          class="inline-flex items-center justify-center rounded-lg border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          Open dashboard
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

const returnUrl = computed(() => {
  const value = route.query.return_url
  return typeof value === 'string' && value.length > 0
    ? value
    : '/dashboard?tab=account'
})

useHead({
  title: 'Mock Stripe Portal',
})
</script>
