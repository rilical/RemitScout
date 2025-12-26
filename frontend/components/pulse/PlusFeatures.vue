<template>
  <div>
    <!-- Hero Banner -->
    <div class="mb-8 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-8 lg:p-12 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      
      <div class="relative">
        <div class="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 mb-6">
          <svg class="h-5 w-5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span class="text-sm font-semibold text-white">Pro Features</span>
        </div>
        
        <h1 class="mb-4 text-4xl lg:text-5xl font-bold text-white">
          Remit-Scout <span class="text-blue-300">Plus</span>
        </h1>
        <p class="mb-8 text-xl text-blue-100 max-w-2xl">
          Professional market monitoring tools for serious senders. Get alerts, track history, and never miss a good rate.
        </p>
        <div class="flex flex-wrap gap-4">
          <button class="group rounded-xl bg-white px-8 py-4 font-bold text-blue-700 shadow-lg shadow-black/20 transition-all hover:shadow-xl hover:scale-[1.02]">
            <span class="flex items-center gap-2">
              Start 14-day free trial
              <svg class="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
          <button class="rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
            Learn more
          </button>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div class="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-800/40 p-6 transition-all hover:border-emerald-500/30">
        <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20">
          <svg class="h-7 w-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <h3 class="mb-3 text-lg font-bold text-white">
          Rate Alerts
        </h3>
        <p class="text-sm text-slate-400 leading-relaxed">
          Get notified via email or SMS when rates hit your target. Set multiple alerts for different corridors and never miss a good deal.
        </p>
      </div>

      <div class="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-800/40 p-6 transition-all hover:border-blue-500/30">
        <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20">
          <svg class="h-7 w-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h3 class="mb-3 text-lg font-bold text-white">
          Watchlist
        </h3>
        <p class="text-sm text-slate-400 leading-relaxed">
          Save your most-used corridors and see live updates in one place. Quick access to trends and changes at a glance.
        </p>
      </div>

      <div class="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-800/40 p-6 transition-all hover:border-purple-500/30">
        <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20">
          <svg class="h-7 w-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 class="mb-3 text-lg font-bold text-white">
          Extended History
        </h3>
        <p class="text-sm text-slate-400 leading-relaxed">
          Access up to 1 year of historical rate data. Export CSV for your own analysis and record-keeping.
        </p>
      </div>
    </div>

    <!-- Pricing Section -->
    <div class="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-800/40 p-8">
      <h2 class="mb-8 text-2xl font-bold text-white text-center">
        Simple, Transparent Pricing
      </h2>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <!-- Free Plan -->
        <div class="rounded-2xl border border-white/10 bg-white/5 p-8">
          <div class="mb-6">
            <h3 class="mb-2 text-xl font-bold text-white">Free</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-bold text-white">$0</span>
              <span class="text-slate-400">/forever</span>
            </div>
          </div>
          <ul class="mb-8 space-y-4">
            <li v-for="feature in freeFeatures" :key="feature" class="flex items-start gap-3 text-sm text-slate-300">
              <svg class="h-5 w-5 flex-shrink-0 text-emerald-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ feature }}</span>
            </li>
          </ul>
          <button class="w-full rounded-xl border border-white/20 bg-white/5 py-4 font-semibold text-slate-300 transition-all hover:bg-white/10">
            Current plan
          </button>
        </div>

        <!-- Plus Plan -->
        <div class="rounded-2xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-8 relative">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2">
            <span class="inline-flex items-center gap-1 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25">
              <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              POPULAR
            </span>
          </div>
          
          <div class="mb-6 mt-2">
            <h3 class="mb-2 text-xl font-bold text-white">Plus</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-bold text-white">$9</span>
              <span class="text-slate-400">/month</span>
            </div>
          </div>
          <ul class="mb-8 space-y-4">
            <li class="flex items-start gap-3 text-sm text-white font-medium">
              <svg class="h-5 w-5 flex-shrink-0 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Everything in Free</span>
            </li>
            <li v-for="feature in plusFeatures" :key="feature" class="flex items-start gap-3 text-sm text-slate-300">
              <svg class="h-5 w-5 flex-shrink-0 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ feature }}</span>
            </li>
          </ul>
          <button class="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02]">
            Start 14-day free trial
          </button>
          <p class="mt-4 text-center text-xs text-slate-400">
            No credit card required • Cancel anytime
          </p>
        </div>
      </div>

      <!-- Trust Notice -->
      <div class="mt-8 rounded-xl bg-white/5 border border-white/10 p-5">
        <div class="flex items-start gap-3">
          <svg class="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p class="text-sm text-slate-300">
            <strong class="text-white">Independence guaranteed:</strong> Plus unlocks tools only. Rankings and provider ordering remain identical for all users—we never bias results based on subscription status.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const freeFeatures = [
  'Live market data',
  'Provider comparisons',
  '7-day history',
  'Market insights',
]

const plusFeatures = [
  'Rate alerts (email + SMS)',
  'Watchlist (save corridors)',
  '1-year history + CSV export',
  'Ad-free experience',
  'Priority support',
]
</script>





