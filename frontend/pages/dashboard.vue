<template>
  <div class="min-h-screen bg-white">
    <!-- Signed-out state -->
    <div v-if="!isAuthenticated">
      <!-- Hero Section with Dashboard Preview -->
      <div class="bg-blue-600 py-8 sm:py-12">
        <div class="max-w-7xl mx-auto px-4">
          <!-- Text Content at Top -->
          <div class="text-center mb-8">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full mb-6">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span class="text-sm font-semibold text-white">100% Free to Start</span>
            </div>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">Your Personal Transfer Dashboard</h1>
            <p class="text-xl text-blue-100 max-w-3xl mx-auto mb-6 leading-relaxed">
              Stop overpaying on international transfers. Track exchange rates, set smart alerts, and find the best provider every time you send money abroad.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
              <NuxtLink
                to="/sign-up"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Free Account
              </NuxtLink>
              <NuxtLink
                to="/sign-in"
                class="inline-flex items-center justify-center rounded-xl border-2 border-white/50 bg-transparent px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Sign In
              </NuxtLink>
            </div>
            <p class="text-blue-200 text-sm mt-4">No credit card required • Takes 30 seconds</p>
          </div>

          <!-- Large Dashboard Preview Image -->
          <div class="relative">
            <div class="absolute -inset-8 bg-blue-500/30 rounded-3xl blur-3xl" />
            <div class="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/30 bg-white">
              <img
                src="/images/dashboard-preview.png"
                alt="RemitScout Dashboard Preview"
                class="w-full h-auto block"
                onerror="this.parentElement.innerHTML='<div class=\'bg-white p-8\'><div class=\'space-y-4\'><div class=\'flex items-center justify-between\'><div class=\'text-lg font-bold text-slate-900\'>Welcome back, User</div><div class=\'text-xs bg-blue-600 text-white px-3 py-1 rounded-full\'>Plus</div></div><div class=\'grid grid-cols-4 gap-3\'><div class=\'bg-slate-50 rounded-lg p-3\'><div class=\'text-xs text-slate-500 mb-1\'>Watchlist</div><div class=\'text-xl font-bold text-slate-900\'>2</div></div><div class=\'bg-slate-50 rounded-lg p-3\'><div class=\'text-xs text-slate-500 mb-1\'>Alerts</div><div class=\'text-xl font-bold text-slate-900\'>1</div></div><div class=\'bg-slate-50 rounded-lg p-3\'><div class=\'text-xs text-slate-500 mb-1\'>History</div><div class=\'text-xl font-bold text-slate-900\'>365d</div></div><div class=\'bg-slate-50 rounded-lg p-3\'><div class=\'text-xs text-slate-500 mb-1\'>Best Rate</div><div class=\'text-xl font-bold text-emerald-600\'>56.82</div></div></div><div class=\'bg-slate-50 rounded-lg p-4\'><div class=\'flex items-center justify-between mb-3\'><div class=\'font-semibold text-slate-900\'>Rate Checker</div><div class=\'flex items-center gap-1 text-sm\'><span>🇺🇸</span><span>→</span><span>🇵🇭</span></div></div><div class=\'flex items-baseline gap-2 mb-2\'><span class=\'text-3xl font-bold text-slate-900\'>56.82</span><span class=\'text-emerald-600 text-sm font-medium\'>↑ +2.3%</span></div><div class=\'h-16 bg-gradient-to-t from-blue-100 to-transparent rounded\'></div></div></div></div>'"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="max-w-6xl mx-auto px-4 py-16">
        <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-4">Everything You Need to Save on Transfers</h2>
        <p class="text-slate-600 text-center max-w-2xl mx-auto mb-12">Join thousands of smart senders who use RemitScout to find the best rates.</p>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          <div class="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 class="font-semibold text-slate-900 mb-2">Corridor Watchlist</h3>
            <p class="text-sm text-slate-600 mb-3">Save your frequently used corridors and track rates without searching again. See rate trends at a glance.</p>
            <div class="text-xs text-slate-400">Free: 3 corridors • Plus: Unlimited</div>
          </div>
          <div class="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 class="font-semibold text-slate-900 mb-2">Smart Rate Alerts</h3>
            <p class="text-sm text-slate-600 mb-3">Get notified when rates hit your target. Set alerts for exchange rates, fees, or total recipient amount.</p>
            <div class="text-xs text-slate-400">Free: 1 alert • Plus: Unlimited</div>
          </div>
          <div class="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="font-semibold text-slate-900 mb-2">Rate History</h3>
            <p class="text-sm text-slate-600 mb-3">See how rates have changed over time. Identify patterns and find the best time to send.</p>
            <div class="text-xs text-slate-400">Free: 30 days • Plus: 365 days</div>
          </div>
          <div class="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 class="font-semibold text-slate-900 mb-2">Rate Comparison</h3>
            <p class="text-sm text-slate-600 mb-3">Compare 50+ providers instantly. See exact fees, exchange rates, and how much your recipient gets.</p>
            <div class="text-xs text-slate-400">Always free</div>
          </div>
          <div class="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="font-semibold text-slate-900 mb-2">Data Export</h3>
            <p class="text-sm text-slate-600 mb-3">Download your transfer history in CSV or PDF format. Perfect for tax records and accounting.</p>
            <div class="text-xs text-slate-400">Plus only</div>
          </div>
          <div class="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 class="font-semibold text-slate-900 mb-2">Ad-Free Experience</h3>
            <p class="text-sm text-slate-600 mb-3">Remove all ads and sponsored placements. Focus purely on finding the best transfer option.</p>
            <div class="text-xs text-slate-400">Plus only</div>
          </div>
        </div>
      </div>

      <!-- Trust Strip -->
      <HomeTrustMetricsStrip bg-class="bg-blue-600" />

      <!-- Plus Comparison -->
      <div class="bg-slate-100 py-16">
        <div class="max-w-4xl mx-auto px-4">
          <div class="text-center mb-10">
            <h2 class="text-3xl font-bold text-slate-900 mb-4">Choose Your Plan</h2>
            <p class="text-slate-600 max-w-2xl mx-auto">Start with our free account to track corridors and set alerts. When you need more power, upgrade to Plus for unlimited features and an ad-free experience.</p>
          </div>
          <div class="grid md:grid-cols-2 gap-6">
            <!-- Free -->
            <div class="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-slate-900">Free Account</h3>
                  <p class="text-sm text-slate-500">Perfect for getting started</p>
                </div>
              </div>
              <ul class="space-y-3 mb-6">
                <li class="flex items-center gap-2 text-slate-700">
                  <svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  3 watchlist corridors
                </li>
                <li class="flex items-center gap-2 text-slate-700">
                  <svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  1 active alert
                </li>
                <li class="flex items-center gap-2 text-slate-700">
                  <svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  30-day history
                </li>
                <li class="flex items-center gap-2 text-slate-700">
                  <svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  Compare 50+ providers
                </li>
              </ul>
              <NuxtLink to="/sign-up" class="block w-full text-center rounded-xl border-2 border-slate-300 py-3 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-colors">
                Get Started Free
              </NuxtLink>
            </div>
            <!-- Plus -->
            <div class="bg-blue-600 rounded-2xl p-6 shadow-lg">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-white">Plus Account</h3>
                  <p class="text-sm text-blue-100">For power users</p>
                </div>
              </div>
              <ul class="space-y-3 mb-6">
                <li class="flex items-center gap-2 text-white">
                  <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  <strong>Unlimited</strong> watchlist corridors
                </li>
                <li class="flex items-center gap-2 text-white">
                  <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  <strong>Unlimited</strong> alerts
                </li>
                <li class="flex items-center gap-2 text-white">
                  <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  <strong>365-day</strong> history
                </li>
                <li class="flex items-center gap-2 text-white">
                  <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  <strong>Ad-free</strong> + data export
                </li>
              </ul>
              <NuxtLink to="/plus" class="block w-full text-center rounded-xl bg-white py-3 text-blue-600 font-semibold hover:bg-blue-50 transition-colors">
                See Plus Pricing
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Final CTA -->
      <div class="bg-blue-600 py-16">
        <div class="max-w-2xl mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold text-white mb-4">Ready to Stop Overpaying?</h2>
          <p class="text-blue-100 mb-8 text-lg">Create your free account in seconds and start saving on every transfer. No credit card required.</p>
          <NuxtLink
            to="/sign-up"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
          >
            Create Free Account
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Signed-in dashboard -->
    <div v-else>
      <!-- Ad Banner for Free Users -->
      <div v-if="!isPlus" class="bg-blue-600 text-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div class="flex items-center justify-center gap-3 text-sm">
            <span><strong>Upgrade to Plus</strong> — Unlimited alerts, 90-day history, export, and ad-free experience</span>
            <NuxtLink to="/plus" class="inline-flex items-center gap-1 font-semibold text-white hover:text-blue-100 underline underline-offset-2">
              Learn more <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Header -->
      <header class="border-b border-slate-200 bg-white sticky top-16 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Main Header Row -->
          <div class="flex items-center justify-between py-6">
            <div>
              <h1 class="text-2xl font-bold text-slate-900">
                Welcome back, <span class="text-blue-600">{{ user?.name || 'User' }}</span>
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">Manage your watchlist, alerts, and transfer history</p>
            </div>
            <div class="flex items-center gap-4">
              <!-- Plan Badge -->
              <div
                v-if="isPlus"
                class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span class="font-semibold">Plus Member</span>
              </div>
              <NuxtLink
                v-else
                to="/plus"
                class="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Upgrade to Plus
              </NuxtLink>
            </div>
          </div>

          <!-- Usage Stats for Free Users -->
          <div v-if="!isPlus" class="pb-4 flex items-center gap-6 text-sm">
            <div class="flex items-center gap-2">
              <span class="text-slate-500">Watchlist:</span>
              <span class="font-medium" :class="watchlistLimitPercent >= 100 ? 'text-brand-600' : 'text-slate-900'">{{ watchlistCount }}/{{ limits.watchlistItems }}</span>
              <div class="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :class="watchlistLimitPercent >= 100 ? 'bg-brand-600' : 'bg-blue-500'"
                  :style="{ width: `${Math.min(watchlistLimitPercent, 100)}%` }"
                />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-500">Alerts:</span>
              <span class="font-medium" :class="alertsLimitPercent >= 100 ? 'text-brand-600' : 'text-slate-900'">{{ alertsCount }}/{{ limits.alerts }}</span>
              <div class="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :class="alertsLimitPercent >= 100 ? 'bg-brand-600' : 'bg-blue-500'"
                  :style="{ width: `${Math.min(alertsLimitPercent, 100)}%` }"
                />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-500">History:</span>
              <span class="font-medium text-slate-900">{{ limits.historyDays }} days</span>
            </div>
          </div>

          <!-- Tabs -->
          <nav class="flex gap-8 -mb-px">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              class="py-4 text-sm font-medium border-b-2 transition-colors"
              :class="activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
              @click="setTab(tab.id)"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'">
          <!-- Stats Row with Limits -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <!-- Watchlist Stat -->
            <div class="bg-brand-600 rounded-xl border border-brand-700 p-5">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-white/90">Watchlist</span>
                <span v-if="!isPlus" class="text-xs text-white/70">{{ watchlistCount }}/{{ limits.watchlistItems }}</span>
                <span v-else class="text-xs text-white">∞</span>
              </div>
              <div class="text-2xl font-semibold text-white">{{ watchlistCount }}</div>
              <div v-if="!isPlus" class="mt-2">
                <div class="h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all bg-white"
                    :style="{ width: `${Math.min(watchlistLimitPercent, 100)}%` }"
                  />
                </div>
                <NuxtLink
                  v-if="watchlistLimitPercent >= 100"
                  to="/plus"
                  class="text-xs text-white hover:text-white/80 font-medium mt-1 inline-block"
                >
                  Upgrade for unlimited →
                </NuxtLink>
              </div>
            </div>

            <!-- Alerts Stat -->
            <div class="bg-brand-600 rounded-xl border border-brand-700 p-5">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-white/90">Active Alerts</span>
                <span v-if="!isPlus" class="text-xs text-white/70">{{ alertsCount }}/{{ limits.alerts }}</span>
                <span v-else class="text-xs text-white">∞</span>
              </div>
              <div class="text-2xl font-semibold text-white">{{ alertsCount }}</div>
              <div v-if="!isPlus" class="mt-2">
                <div class="h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all bg-white"
                    :style="{ width: `${Math.min(alertsLimitPercent, 100)}%` }"
                  />
                </div>
                <NuxtLink
                  v-if="alertsLimitPercent >= 100"
                  to="/plus"
                  class="text-xs text-white hover:text-white/80 font-medium mt-1 inline-block"
                >
                  Upgrade for unlimited →
                </NuxtLink>
              </div>
            </div>

            <!-- History Stat -->
            <div class="bg-brand-600 rounded-xl border border-brand-700 p-5">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-white/90">History</span>
                <span v-if="!isPlus" class="text-xs text-white/70">{{ limits.historyDays }} days</span>
                <span v-else class="text-xs text-white">365 days</span>
              </div>
              <div class="text-2xl font-semibold text-white">{{ compareCount }}</div>
              <div v-if="!isPlus" class="mt-2">
                <div class="flex items-center gap-1 text-xs text-white/70">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Limited to last 30 days
                </div>
              </div>
            </div>

            <!-- Best Rate Stat -->
            <div class="bg-brand-600 rounded-xl border border-brand-700 p-5">
              <div class="text-sm text-white/90 mb-1">Best Rate Today</div>
              <div class="text-2xl font-semibold text-white">
                {{ currentRate.rate }}
                <span class="text-sm text-white/80">{{ getCurrencyCode(selectedCorridor.to) }}</span>
              </div>
              <div class="mt-2">
                <span v-if="currentRate.change !== null" class="inline-flex items-center gap-1 text-xs font-medium text-white">
                  <svg
                    class="w-3 h-3"
                    :class="currentRate.change >= 0 ? '' : 'rotate-180'"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  {{ formatPercentValue(currentRate.change) }} vs previous
                </span>
                <span v-else class="text-xs text-white/70">No rate history yet</span>
              </div>
            </div>
          </div>

          <!-- Upgrade Banner for Free Users -->
          <div
            v-if="!isPlus && (watchlistLimitPercent >= 66 || alertsLimitPercent >= 66)"
            class="mb-8 bg-gradient-to-r from-gray-900 to-slate-900 rounded-xl p-6 text-white"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 class="font-semibold text-lg">You're approaching your limits</h3>
                <p class="text-white/90 text-sm mt-1">Upgrade to Plus for unlimited watchlist items, alerts, extended history, and export.</p>
              </div>
              <NuxtLink
                to="/plus"
                class="inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                Upgrade to Plus
              </NuxtLink>
            </div>
          </div>

          <!-- Two Column Layout -->
          <div class="grid lg:grid-cols-3 gap-8">
            <!-- Left Column (2/3) -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Enhanced Rate Checker -->
              <div class="bg-white rounded-xl border border-slate-200">
                <!-- Header with Corridor Selector -->
                <div class="p-6 border-b border-slate-100">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <h2 class="text-lg font-semibold text-slate-900">Rate Checker</h2>
                      <div class="relative">
                        <button
                          type="button"
                          class="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                          @click="showCorridorSelector = !showCorridorSelector"
                        >
                          <span>{{ getFlag(selectedCorridor.from) }}</span>
                          <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                          <span>{{ getFlag(selectedCorridor.to) }}</span>
                          <span class="text-slate-500">{{ selectedCorridor.from }}/{{ selectedCorridor.to }}</span>
                          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <!-- Corridor Dropdown -->
                        <div
                          v-if="showCorridorSelector"
                          class="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-4"
                        >
                          <div class="space-y-3">
                            <div>
                              <label class="block text-xs font-medium text-slate-700 mb-1.5">From</label>
                              <UniversalDropdown
                                v-model="customCorridor.from"
                                :options="inlineFromOptions"
                                placeholder="Select country"
                                button-class="h-10 text-sm"
                              />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-slate-700 mb-1.5">To</label>
                              <UniversalDropdown
                                v-model="customCorridor.to"
                                :options="inlineToOptions"
                                placeholder="Select country"
                                button-class="h-10 text-sm"
                              />
                            </div>
                            <button
                              type="button"
                              class="w-full px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors"
                              @click="selectCorridor(customCorridor.from, customCorridor.to)"
                            >
                              Select Corridor
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Timeframe Selector -->
                    <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                      <button
                        v-for="period in timeframePeriods"
                        :key="period.value"
                        type="button"
                        class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                        :class="[
                          graphTimeframe === period.value
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900',
                          isTimeframeLocked(period.value) ? 'opacity-50 cursor-not-allowed' : '',
                        ]"
                        :disabled="isTimeframeLocked(period.value)"
                        :title="isTimeframeLocked(period.value) ? 'Plus required' : undefined"
                        @click="graphTimeframe = period.value"
                      >
                        {{ period.label }}
                        <span v-if="period.plusOnly && !isPlus" class="ml-1 text-[10px] text-slate-400">Plus</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Rate Display -->
                <div class="p-6">
                  <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-2xl">{{ getFlag(selectedCorridor.from) }}</span>
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span class="text-2xl">{{ getFlag(selectedCorridor.to) }}</span>
                        <span class="text-sm text-slate-500 ml-1">{{ selectedCorridor.from }} to {{ selectedCorridor.to }}</span>
                      </div>
                      <div class="flex items-baseline gap-3">
                        <span class="text-4xl font-semibold text-slate-900">{{ currentRate.rate }}</span>
                        <span class="text-lg text-slate-500">{{ getCurrencyCode(selectedCorridor.to) }}</span>
                        <span
                          v-if="currentRate.change !== null"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium"
                          :class="currentRate.change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
                        >
                          <svg
                            class="w-3 h-3"
                            :class="currentRate.change >= 0 ? 'rotate-0' : 'rotate-180'"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          {{ formatPercentValue(currentRate.change) }}
                        </span>
                      </div>
                      <div class="text-xs text-slate-400 mt-1">
                        <span v-if="selectedHistoryLoading">Loading rate history...</span>
                        <span v-else-if="!currentRate.isAvailable">No rate history yet</span>
                        <span v-else>Last updated: {{ currentRate.lastUpdated }}</span>
                      </div>
                    </div>

                    <!-- Rate Stats -->
                    <div class="flex gap-6">
                      <div class="text-center">
                        <div class="text-xs text-slate-400 mb-0.5">High</div>
                        <div class="text-sm font-semibold text-emerald-600">{{ rateStats.high }}</div>
                      </div>
                      <div class="text-center">
                        <div class="text-xs text-slate-400 mb-0.5">Low</div>
                        <div class="text-sm font-semibold text-red-600">{{ rateStats.low }}</div>
                      </div>
                      <div class="text-center">
                        <div class="text-xs text-slate-400 mb-0.5">Average</div>
                        <div class="text-sm font-semibold text-slate-700">{{ rateStats.average }}</div>
                      </div>
                      <div class="text-center">
                        <div class="text-xs text-slate-400 mb-0.5">Volatility</div>
                        <div class="text-sm font-semibold text-slate-700">{{ rateStats.volatility }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Chart -->
                  <div class="h-56 relative">
                    <div v-if="selectedHistoryLoading" class="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                      Loading rate history...
                    </div>
                    <div v-else-if="graphData.length === 0" class="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                      No rate history yet
                    </div>
                    <svg v-else class="w-full h-full" viewBox="0 0 400 180" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style="stop-color:#2563eb;stop-opacity:0.15" />
                          <stop offset="100%" style="stop-color:#2563eb;stop-opacity:0" />
                        </linearGradient>
                      </defs>
                      <!-- Grid lines -->
                      <line x1="0" y1="45" x2="400" y2="45" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4" />
                      <line x1="0" y1="90" x2="400" y2="90" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4" />
                      <line x1="0" y1="135" x2="400" y2="135" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4" />
                      <!-- Area fill -->
                      <polygon :points="`0,180 ${graphPoints} 400,180`" fill="url(#chartGradient)" />
                      <!-- Line -->
                      <polyline
                        :points="graphPoints"
                        fill="none"
                        stroke="#2563eb"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <!-- Current point indicator -->
                      <circle :cx="graphData[graphData.length - 1]?.x || 400" :cy="graphData[graphData.length - 1]?.y || 90" r="5" fill="#2563eb" />
                      <circle :cx="graphData[graphData.length - 1]?.x || 400" :cy="graphData[graphData.length - 1]?.y || 90" r="8" fill="#2563eb" fill-opacity="0.2" />
                    </svg>
                    <!-- Y-axis labels -->
                    <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-400 py-2">
                      <span>{{ rateStats.high }}</span>
                      <span>{{ rateStats.average }}</span>
                      <span>{{ rateStats.low }}</span>
                    </div>
                  </div>

                  <!-- X-axis labels -->
                  <div class="flex justify-between text-xs text-slate-400 mt-2 px-6">
                    <span>{{ getTimeframeStartLabel() }}</span>
                    <span>Today</span>
                  </div>
                </div>

                <!-- Action Bar -->
                <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                      :class="watchlistLimitReached ? 'opacity-50 cursor-not-allowed hover:bg-slate-100 hover:text-slate-700' : ''"
                      :disabled="watchlistLimitReached"
                      @click="handleAddToWatchlist"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add to Watchlist
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                      :class="alertsLimitReached ? 'opacity-50 cursor-not-allowed hover:bg-slate-100 hover:text-slate-700' : ''"
                      :disabled="alertsLimitReached"
                      @click="handleSetAlert"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Set Alert
                    </button>
                    <button
                      v-if="isPlus"
                      type="button"
                      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                      @click="showExportModal = true"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export
                    </button>
                  </div>
                  <button
                    type="button"
                    :disabled="comparingSelectedCorridor"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-75 disabled:cursor-wait"
                    @click="handleCompareSelectedCorridor"
                  >
                    <svg
                      v-if="comparingSelectedCorridor"
                      class="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <svg
                      v-else
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    {{ comparingSelectedCorridor ? 'Loading...' : 'Compare Corridor' }}
                  </button>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="grid sm:grid-cols-3 gap-4">
                <NuxtLink
                  to="/send-money"
                  class="flex items-center gap-4 bg-white rounded-xl border-2 border-slate-200 p-4 hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                    <svg class="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-slate-900">Compare</div>
                    <div class="text-xs text-slate-500">Find best rates</div>
                  </div>
                </NuxtLink>
                <button
                  type="button"
                  class="flex items-center gap-4 bg-white rounded-xl border-2 border-slate-200 p-4 hover:border-blue-500 hover:shadow-md transition-all text-left group"
                  :class="alertsLimitReached ? 'opacity-50 cursor-not-allowed hover:border-slate-200 hover:shadow-none' : ''"
                  :disabled="alertsLimitReached"
                  @click="openCreateAlert"
                >
                  <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                    <svg class="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-slate-900">New Alert</div>
                    <div class="text-xs text-slate-500">Set rate target</div>
                  </div>
                </button>
                <NuxtLink
                  to="/learn"
                  class="flex items-center gap-4 bg-white rounded-xl border-2 border-slate-200 p-4 hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                    <svg class="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-slate-900">Guides</div>
                    <div class="text-xs text-slate-500">Learn more</div>
                  </div>
                </NuxtLink>
              </div>

              <!-- Watchlist Preview -->
              <div class="bg-white rounded-xl border border-slate-200">
                <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h2 class="font-semibold text-slate-900">Your Watchlist</h2>
                  <button
                    type="button"
                    class="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    @click="setTab('watchlist')"
                  >
                    View all
                  </button>
                </div>
                <div v-if="watchlistItems.length === 0" class="px-6 py-12 text-center">
                  <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p class="text-sm text-slate-500 mb-4">No corridors saved yet</p>
                  <NuxtLink
                    to="/send-money"
                    class="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Compare rates to add one →
                  </NuxtLink>
                </div>
                <div v-else class="divide-y divide-slate-100">
                  <div
                    v-for="item in watchlistItems.slice(0, 3)"
                    :key="item.id"
                    class="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div class="flex items-center gap-3">
                      <div class="flex items-center gap-1">
                        <span class="text-lg">{{ getFlag(item.target.from) }}</span>
                        <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                        <span class="text-lg">{{ getFlag(item.target.to) }}</span>
                      </div>
                      <span class="text-sm font-medium text-slate-900">{{ item.label }}</span>
                    </div>
                    <button
                      type="button"
                      class="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      @click="openAlert(item)"
                    >
                      Set alert
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column (1/3) -->
            <div class="space-y-6">
              <!-- Recent Searches -->
              <div class="bg-white rounded-xl border border-slate-200 p-6">
                <h3 class="font-semibold text-slate-900 mb-4">Recent Searches</h3>
                <div
                  v-if="recentSearchesPending"
                  class="text-sm text-slate-500"
                >
                  Loading...
                </div>
                <div
                  v-else-if="recentSearches.length === 0"
                  class="text-center py-4"
                >
                  <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p class="text-sm text-slate-500 mb-2">No searches yet</p>
                  <NuxtLink to="/send-money" class="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Compare rates →
                  </NuxtLink>
                </div>
                <div v-else class="space-y-3">
                  <NuxtLink
                    v-for="(search, idx) in recentSearches.slice(0, 5)"
                    :key="idx"
                    :to="getCorridorUrl(search.from, search.to)"
                    class="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div class="flex items-center gap-1.5">
                      <span class="text-lg">{{ getFlag(search.from) }}</span>
                      <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span class="text-lg">{{ getFlag(search.to) }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900">
                        {{ getCountryName(search.from) }} → {{ getCountryName(search.to) }}
                      </p>
                      <p class="text-sm text-slate-500 font-medium">
                        ${{ search.amount?.toLocaleString() || '500' }} • {{ formatMethod(search.method) }}
                      </p>
                    </div>
                  </NuxtLink>
                </div>
              </div>

              <!-- Top Movers from Watchlist -->
              <div class="bg-white rounded-xl border border-slate-200 p-6">
                <h3 class="font-semibold text-slate-900 mb-4">Top Movers Today</h3>
                <div
                  v-if="!watchlistHydrated"
                  class="text-sm text-slate-500"
                >
                  Loading...
                </div>
                <div
                  v-else-if="watchlistItems.length === 0"
                  class="text-center py-4"
                >
                  <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <p class="text-sm text-slate-500 mb-2">No corridors tracked</p>
                  <p class="text-xs text-slate-400">Add corridors to your watchlist to see their daily movements</p>
                </div>
                <div v-else-if="topMoversLoading" class="text-sm text-slate-500">
                  Loading rate history...
                </div>
                <div v-else-if="topMoversFromWatchlist.length === 0" class="text-center py-4">
                  <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <p class="text-sm text-slate-500 mb-2">No rate history yet</p>
                  <p class="text-xs text-slate-400">Once history is available, movers will appear here.</p>
                </div>
                <div v-else class="space-y-3">
                  <NuxtLink
                    v-for="item in topMoversFromWatchlist"
                    :key="item.id"
                    :to="getCorridorUrl(item.target.from, item.target.to)"
                    class="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-lg">{{ getFlag(item.target.from) }}</span>
                      <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span class="text-lg">{{ getFlag(item.target.to) }}</span>
                      <span class="text-sm text-slate-700">{{ item.target.from }}/{{ item.target.to }}</span>
                    </div>
                    <span
                      class="text-sm font-medium"
                      :class="(item.change ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'"
                    >
                      {{ formatPercentValue(item.change) }}
                    </span>
                  </NuxtLink>
                  <div v-if="watchlistItems.length > topMoversLimit" class="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      class="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                      @click="setTab('watchlist')"
                    >
                      View all {{ watchlistItems.length }} corridors →
                    </button>
                  </div>
                </div>
              </div>

              <!-- Contact Support -->
              <div class="bg-brand-600 rounded-xl border border-brand-700 p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-white mb-2">Need Help?</h3>
                    <p class="text-sm text-white/90 mb-4">
                      Have questions or found an issue? Our support team is here to help.
                    </p>
                    <NuxtLink
                      to="/contact"
                      class="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-white/90 transition-colors"
                    >
                      Contact Support
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <!-- Ad: Upgrade to Plus (Free users only) -->
              <div v-if="!isPlus" class="bg-blue-600 rounded-xl p-5 text-white">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-sm mb-1">Remove Ads with Plus</h4>
                    <p class="text-xs text-white/90 mb-3">Get unlimited alerts, 90-day history, and an ad-free experience.</p>
                    <NuxtLink to="/plus" class="inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-blue-100">
                      Learn more <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Watchlist Tab -->
        <div v-else-if="activeTab === 'watchlist'">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-lg font-semibold text-slate-900">Watchlist</h2>
                <span
                  v-if="!isPlus"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="watchlistLimitPercent >= 100 ? 'bg-brand-100 text-brand-700' : watchlistLimitPercent >= 66 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ watchlistCount }}/{{ limits.watchlistItems }} used
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                >
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  Unlimited
                </span>
              </div>
              <p class="text-sm text-slate-500 mt-1">{{ watchlistCount }} saved corridor{{ watchlistCount !== 1 ? 's' : '' }}</p>
            </div>
            <div class="flex items-center gap-3">
              <NuxtLink
                v-if="!isPlus && watchlistLimitPercent >= 66"
                to="/plus"
                class="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Upgrade
              </NuxtLink>
              <button
                v-if="watchlistCount > 0"
                type="button"
                class="text-sm text-red-600 hover:text-red-700 font-medium"
                @click="watchlistReset"
              >
                Clear all
              </button>
            </div>
          </div>

          <!-- Limit Warning Banner -->
          <div
            v-if="!isPlus && watchlistLimitPercent >= 100"
            class="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"
          >
            <svg class="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <div class="flex-1">
              <h4 class="text-sm font-medium text-brand-600">Watchlist limit reached</h4>
              <p class="text-sm text-brand-700 mt-0.5">You've reached your limit of {{ limits.watchlistItems }} watchlist items. Upgrade to Plus for unlimited watchlist items.</p>
            </div>
            <NuxtLink
              to="/plus"
              class="flex-shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Upgrade
            </NuxtLink>
          </div>

          <!-- Quick Add Corridor Form -->
          <div
            v-if="!isPlus ? watchlistLimitPercent < 100 : true"
            class="bg-white rounded-xl border border-slate-200 p-4 mb-6"
          >
            <form class="flex flex-col sm:flex-row gap-3" @submit.prevent="handleAddWatchlist">
              <div class="flex-1 flex gap-2">
                <div class="flex-1">
                  <label class="sr-only">From</label>
                  <UniversalDropdown
                    v-model="newWatchlist.from"
                    :options="inlineFromOptions"
                    placeholder="Select country"
                  />
                </div>
                <div class="flex items-center text-slate-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <div class="flex-1">
                  <label class="sr-only">To</label>
                  <UniversalDropdown
                    v-model="newWatchlist.to"
                    :options="inlineToOptions"
                    placeholder="Select country"
                  />
                </div>
              </div>
              <button
                type="submit"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Corridor
              </button>
            </form>
          </div>

          <div v-if="!watchlistHydrated" class="text-center py-12 text-slate-500">
            Loading...
          </div>
          <div v-else-if="watchlistItems.length === 0" class="text-center py-16 bg-white rounded-xl border border-slate-200">
            <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">No corridors saved yet</h3>
            <p class="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Add your first corridor above to start tracking exchange rates.</p>
          </div>

          <!-- Enhanced Watchlist Cards -->
          <div v-else class="grid gap-6 sm:grid-cols-2">
            <div
              v-for="item in watchlistItems"
              :key="item.id"
              class="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all group"
            >
              <!-- Card Header -->
              <div class="p-5 border-b border-slate-100">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2">
                      <span class="text-2xl">{{ getFlag(item.target.from) }}</span>
                      <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span class="text-2xl">{{ getFlag(item.target.to) }}</span>
                    </div>
                    <div>
                      <h3 class="font-semibold text-slate-900 text-base">{{ item.target.from }}→{{ item.target.to }}</h3>
                      <p class="text-sm text-slate-500 font-medium">{{ formatMethod(item.target.method) }}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                    @click="watchlistRemove(item.id)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <!-- Current Rate -->
                <div class="flex items-baseline justify-between">
                  <div>
                    <div class="text-3xl font-bold text-slate-900">{{ getWatchlistSnapshot(item.id).rateLabel }}</div>
                    <div class="text-sm text-slate-500 mt-0.5">
                      {{ getCurrencyCode(item.target.to) }} per {{ getCurrencyCode(item.target.from) }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold"
                      :class="getWatchlistSnapshot(item.id).change === null
                        ? 'bg-slate-100 text-slate-500'
                        : (getWatchlistSnapshot(item.id).change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')"
                    >
                      <svg
                        class="w-4 h-4"
                        :class="getWatchlistSnapshot(item.id).change !== null && getWatchlistSnapshot(item.id).change < 0 ? 'rotate-180' : ''"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      {{ formatPercentValue(getWatchlistSnapshot(item.id).change) }}
                    </div>
                    <div class="text-xs text-slate-500 mt-1">1d change</div>
                  </div>
                </div>
              </div>

              <!-- Chart Section -->
              <div class="px-5 py-4 bg-gradient-to-b from-slate-50 to-white">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-slate-600">Last 7 days</span>
                  <span
                    v-if="getWatchlistAlertCount(item.id) > 0"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                  >
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    {{ getWatchlistAlertCount(item.id) }} alert{{ getWatchlistAlertCount(item.id) !== 1 ? 's' : '' }}
                  </span>
                </div>
                
                <!-- Enhanced Chart -->
                <div class="relative h-32 mb-3">
                  <div
                    v-if="isWatchlistHistoryLoading(item.id)"
                    class="absolute inset-0 flex items-center justify-center text-xs text-slate-400"
                  >
                    Loading rate history...
                  </div>
                  <div
                    v-else-if="getWatchlistSnapshot(item.id).history.length < 2"
                    class="absolute inset-0 flex items-center justify-center text-xs text-slate-400"
                  >
                    No rate history yet
                  </div>
                  <svg v-else class="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient :id="`chartGradient-${item.id}`" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:rgb(59, 130, 246);stop-opacity:0.2" />
                        <stop offset="100%" style="stop-color:rgb(59, 130, 246);stop-opacity:0" />
                      </linearGradient>
                    </defs>
                    
                    <!-- Grid lines -->
                    <line x1="0" y1="30" x2="400" y2="30" stroke="#e2e8f0" stroke-width="1" />
                    <line x1="0" y1="60" x2="400" y2="60" stroke="#e2e8f0" stroke-width="1" />
                    <line x1="0" y1="90" x2="400" y2="90" stroke="#e2e8f0" stroke-width="1" />
                    
                    <!-- Area fill -->
                    <path
                      :d="getWatchlistChartPath(item.id)"
                      :fill="`url(#chartGradient-${item.id})`"
                    />
                    
                    <!-- Line -->
                    <polyline
                      :points="getWatchlistChartPoints(item.id)"
                      fill="none"
                      stroke="#3b82f6"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    
                    <!-- Current point indicator -->
                    <circle
                      :cx="380"
                      :cy="getWatchlistChartCurrentY(item.id)"
                      r="4"
                      fill="#3b82f6"
                      stroke="white"
                      stroke-width="2"
                    />
                  </svg>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200">
                  <div>
                    <div class="text-xs text-slate-500 mb-0.5">High (7d)</div>
                    <div class="text-sm font-semibold text-slate-900">{{ getWatchlistStats(item.id).high }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500 mb-0.5">Low (7d)</div>
                    <div class="text-sm font-semibold text-slate-900">{{ getWatchlistStats(item.id).low }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500 mb-0.5">Avg (7d)</div>
                    <div class="text-sm font-semibold text-slate-900">{{ getWatchlistStats(item.id).avg }}</div>
                  </div>
                </div>
              </div>

              <!-- Best Provider Section -->
              <div class="px-5 py-4 border-t border-slate-200 bg-white">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span class="text-xs font-semibold text-slate-700 uppercase tracking-wide">Best Provider (Latest)</span>
                  </div>
                </div>
                <div v-if="getBestProviderForItem(item.id)" class="flex items-center gap-3">
                  <div class="flex h-10 w-24 items-center justify-center flex-shrink-0">
                    <ProviderLogo
                      :slug="getBestProviderForItem(item.id)?.slug || ''"
                      :alt="getBestProviderForItem(item.id)?.name"
                      size="small"
                      class="object-contain"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-slate-900 text-sm">{{ getBestProviderForItem(item.id)?.name }}</h4>
                  </div>
                  <NuxtLink
                    :to="`/learn/providers/${getBestProviderForItem(item.id)?.slug}`"
                    class="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                  >
                    Learn more
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </NuxtLink>
                </div>
                <div v-else-if="isProviderRatesLoadingForItem(item.id)" class="text-sm text-slate-500">
                  Loading provider quotes...
                </div>
                <div v-else class="text-sm text-slate-500">
                  No provider quotes yet.
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                <button
                  type="button"
                  :disabled="comparingCorridor === item.id"
                  class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-75 disabled:cursor-wait"
                  @click="handleCompareClick(item)"
                >
                  <svg
                    v-if="comparingCorridor === item.id"
                    class="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <svg
                    v-else
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {{ comparingCorridor === item.id ? 'Loading...' : 'Compare' }}
                </button>
                <button
                  type="button"
                  class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                  @click="openAlert(item)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Set Alert
                </button>
              </div>
            </div>
          </div>

          <!-- Ad: Sponsored Provider (Free users only) -->
          <div v-if="!isPlus" class="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-slate-400 uppercase tracking-wide">Sponsored</span>
              <NuxtLink to="/plus" class="text-xs text-blue-600 hover:text-blue-700">Remove ads</NuxtLink>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">W</div>
              <div class="flex-1">
                <h4 class="font-semibold text-slate-900 text-sm">Wise - Send Money Abroad</h4>
                <p class="text-xs text-slate-500">Low fees, real exchange rate. Trusted by 16M+ people.</p>
              </div>
              <a href="#" class="flex-shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                Compare
              </a>
            </div>
          </div>
        </div>

        <!-- Alerts Tab -->
        <div v-else-if="activeTab === 'alerts'">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-lg font-semibold text-slate-900">Rate Alerts</h2>
                <span
                  v-if="!isPlus"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="alertsLimitPercent >= 100 ? 'bg-brand-100 text-brand-700' : alertsLimitPercent >= 66 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ alertsCount }}/{{ limits.alerts }} used
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                >
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  Unlimited
                </span>
              </div>
              <p class="text-sm text-slate-500 mt-1">{{ alertsCount }} alert{{ alertsCount !== 1 ? 's' : '' }}</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!isPlus && alertsLimitPercent >= 100"
                @click="openCreateAlert"
              >
                New Alert
              </button>
              <NuxtLink
                v-if="!isPlus && alertsLimitPercent >= 66"
                to="/plus"
                class="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Upgrade
              </NuxtLink>
              <button
                v-if="alertsCount > 0"
                type="button"
                class="text-sm text-red-600 hover:text-red-700 font-medium"
                @click="alertsReset"
              >
                Clear all
              </button>
            </div>
          </div>

          <!-- Limit Warning Banner -->
          <div
            v-if="!isPlus && alertsLimitPercent >= 100"
            class="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"
          >
            <svg class="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <div class="flex-1">
              <h4 class="text-sm font-medium text-brand-600">Alert limit reached</h4>
              <p class="text-sm text-brand-700 mt-0.5">You've reached your limit of {{ limits.alerts }} alert. Upgrade to Plus for unlimited alerts.</p>
            </div>
            <NuxtLink
              to="/plus"
              class="flex-shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Upgrade
            </NuxtLink>
          </div>

          <div v-if="!alertsHydrated" class="text-center py-12 text-slate-500">
            Loading...
          </div>
          <div v-else-if="alertItems.length === 0" class="text-center py-16 bg-white rounded-xl border border-slate-200">
            <div class="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">No alerts set yet</h3>
            <p class="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Get notified when exchange rates hit your target. Create your first alert to get started.</p>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              :disabled="!isPlus && alertsLimitPercent >= 100"
              @click="openCreateAlert"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Alert
            </button>
          </div>

          <!-- Enhanced Alerts Cards -->
          <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="alert in alertItems"
              :key="alert.id"
              class="bg-white rounded-xl border overflow-hidden transition-all"
              :class="alert.enabled ? 'border-emerald-200 hover:border-emerald-300 hover:shadow-md' : 'border-slate-200 opacity-75'"
            >
              <!-- Card Header with Status -->
              <div class="p-4 border-b" :class="alert.enabled ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-slate-50'">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center"
                      :class="alert.enabled ? 'bg-emerald-100' : 'bg-slate-200'"
                    >
                      <svg
                        class="w-4 h-4"
                        :class="alert.enabled ? 'text-emerald-600' : 'text-slate-400'"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="alert.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'"
                    >
                      {{ alert.enabled ? 'Active' : 'Paused' }}
                    </span>
                  </div>
                  <!-- Toggle Switch -->
                  <button
                    type="button"
                    class="relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                    :class="alert.enabled ? 'bg-emerald-500 focus:ring-emerald-500' : 'bg-slate-300 focus:ring-slate-500'"
                    @click="alertsToggleEnabled(alert.id)"
                  >
                    <span
                      class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                      :class="alert.enabled ? 'translate-x-5' : 'translate-x-0'"
                    />
                  </button>
                </div>
              </div>

              <!-- Alert Details -->
              <div class="p-4">
                <!-- Corridor with Flags -->
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex items-center">
                    <span class="text-2xl">{{ getFlag(getAlertCorridor(alert).from) }}</span>
                    <div class="mx-2 flex flex-col items-center">
                      <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                    <span class="text-2xl">{{ getFlag(getAlertCorridor(alert).to) }}</span>
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-slate-900">{{ getAlertCorridor(alert).from }}/{{ getAlertCorridor(alert).to }}</div>
                    <div class="text-xs text-slate-500">{{ watchlistFindById(alert.watchlistItemId)?.label || 'Alert' }}</div>
                  </div>
                </div>

                <!-- Currency Pair Badge -->
                <div class="flex items-center gap-2 mb-3">
                  <span class="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                    {{ getAlertCorridor(alert).from }} → {{ getAlertCorridor(alert).to }}
                  </span>
                  <span v-if="alert.rule.currency" class="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                    {{ alert.rule.currency }}
                  </span>
                </div>

                <!-- Alert Condition -->
                <div class="bg-slate-50 rounded-lg p-3 mb-3">
                  <div class="text-xs text-slate-500 mb-1">Notify me when</div>
                  <div class="flex items-center flex-wrap gap-2">
                    <span class="text-sm font-semibold text-slate-900">{{ formatMetricLabel(alert.rule.metric) }}</span>
                    <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                      {{ formatComparator(alert.rule.comparator) }}
                    </span>
                    <span class="text-sm font-semibold text-slate-900">
                      {{ alert.rule.value }}
                      <span class="text-slate-500 font-normal">{{ alert.rule.currency || getAlertCorridor(alert).to }}</span>
                    </span>
                  </div>
                </div>

                <!-- Current Rate vs Target -->
                <div class="flex items-center justify-between text-sm mb-3 p-2 bg-slate-50 rounded-lg">
                  <div class="text-center flex-1">
                    <div class="text-xs text-slate-400 mb-0.5">Current</div>
                    <div class="font-semibold text-slate-900">{{ getAlertSnapshot(alert).rateLabel }}</div>
                    <div class="text-xs text-slate-500">{{ getCurrencyCode(getAlertCorridor(alert).to) }}</div>
                  </div>
                  <div class="px-3">
                    <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div class="text-center flex-1">
                    <div class="text-xs text-slate-400 mb-0.5">Target</div>
                    <div class="font-semibold" :class="getAlertProgress(alert) >= 100 ? 'text-emerald-600' : 'text-blue-600'">{{ alert.rule.value }}</div>
                    <div class="text-xs text-slate-500">{{ alert.rule.currency || getCurrencyCode(getAlertCorridor(alert).to) }}</div>
                  </div>
                </div>

                <!-- Progress to Target -->
                <div class="mb-3">
                  <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="getAlertProgress(alert) >= 100 ? 'bg-emerald-500' : 'bg-blue-500'"
                      :style="{ width: `${Math.min(getAlertProgress(alert), 100)}%` }"
                    />
                  </div>
                  <div class="text-xs text-slate-500 mt-1">
                    {{ getAlertProgress(alert) >= 100 ? 'Target reached!' : `${getAlertProgress(alert).toFixed(0)}% to target` }}
                  </div>
                </div>

                <!-- Frequency Badge -->
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-xs text-slate-500">{{ formatFrequency(alert.frequency) }}</span>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="px-4 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                <NuxtLink
                  :to="getCorridorUrl(getAlertCorridor(alert).from, getAlertCorridor(alert).to)"
                  class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Compare
                </NuxtLink>
                <button
                  type="button"
                  class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  @click="editAlert(alert)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-2 py-2 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                  @click="alertsRemove(alert.id)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Ad: Plus Features (Free users only) -->
          <div v-if="!isPlus" class="mt-6 bg-slate-900 rounded-xl p-6 text-white">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h4 class="font-semibold mb-1">Need More Alerts?</h4>
                  <p class="text-sm text-slate-300">Free accounts are limited to 1 alert. Upgrade to Plus for unlimited smart alerts with real-time notifications.</p>
                </div>
              </div>
              <NuxtLink to="/plus" class="flex-shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                Upgrade to Plus
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- History Tab -->
        <div v-else-if="activeTab === 'history'">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Comparison History</h2>
              <p class="text-sm text-slate-500">{{ compareCount }} comparison{{ compareCount !== 1 ? 's' : '' }}</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                @click="showExportModal = true"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Data
              </button>
              <button
                v-if="compareCount > 0"
                type="button"
                class="text-sm text-red-600 hover:text-red-700 font-medium"
                @click="compareReset"
              >
                Clear all
              </button>
            </div>
          </div>

          <!-- Export Modal -->
          <div
            v-if="showExportModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div class="absolute inset-0 bg-black/50" @click="showExportModal = false" />
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-slate-900">Export Data</h3>
                <button
                  type="button"
                  class="text-slate-400 hover:text-slate-600"
                  @click="showExportModal = false"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Plus-only gate -->
              <div v-if="!isPlus" class="text-center py-6">
                <div class="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <svg class="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h4 class="text-base font-semibold text-slate-900 mb-2">Plus Feature</h4>
                <p class="text-sm text-slate-500 mb-6">
                  Export your comparison history and watchlist data to CSV or PDF with Plus.
                </p>
                <NuxtLink
                  to="/plus"
                  class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Plus
                </NuxtLink>
              </div>

              <!-- Export form for Plus users -->
              <div v-else class="space-y-6">
                <div>
                  <label class="block text-sm font-semibold text-slate-900 mb-3">Data to Export</label>
                  <div class="space-y-2.5">
                    <label class="flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all" :class="exportSettings.dataType === 'history' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'">
                      <input
                        v-model="exportSettings.dataType"
                        type="radio"
                        value="history"
                        class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <div class="flex-1">
                        <div class="text-sm font-semibold text-slate-900">Comparison History</div>
                        <div class="text-xs text-slate-500 mt-0.5">All your rate comparisons</div>
                      </div>
                    </label>
                    <label class="flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all" :class="exportSettings.dataType === 'watchlist' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'">
                      <input
                        v-model="exportSettings.dataType"
                        type="radio"
                        value="watchlist"
                        class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <div class="flex-1">
                        <div class="text-sm font-semibold text-slate-900">Watchlist</div>
                        <div class="text-xs text-slate-500 mt-0.5">Saved corridors and rates</div>
                      </div>
                    </label>
                    <label class="flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all" :class="exportSettings.dataType === 'alerts' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'">
                      <input
                        v-model="exportSettings.dataType"
                        type="radio"
                        value="alerts"
                        class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <div class="flex-1">
                        <div class="text-sm font-semibold text-slate-900">Alerts</div>
                        <div class="text-xs text-slate-500 mt-0.5">Alert rules and history</div>
                      </div>
                    </label>
                    <label class="flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all" :class="exportSettings.dataType === 'all' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'">
                      <input
                        v-model="exportSettings.dataType"
                        type="radio"
                        value="all"
                        class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <div class="flex-1">
                        <div class="text-sm font-semibold text-slate-900">All Data</div>
                        <div class="text-xs text-slate-500 mt-0.5">Complete export of all your data</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-900 mb-3">Time Period</label>
                  <select
                    v-model="exportSettings.dateRange"
                    class="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all hover:border-slate-400"
                    @change="setExportDateRange(exportSettings.dateRange)"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-900 mb-3">Export Format</label>
                  <div class="grid grid-cols-2 gap-3">
                    <label
                      class="flex items-center justify-center gap-2 p-3.5 border-2 rounded-xl cursor-pointer transition-all"
                      :class="exportSettings.format === 'csv' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'"
                    >
                      <input
                        v-model="exportSettings.format"
                        type="radio"
                        value="csv"
                        class="sr-only"
                      />
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span class="text-sm font-semibold">CSV</span>
                    </label>
                    <label
                      class="flex items-center justify-center gap-2 p-3.5 border-2 rounded-xl cursor-pointer transition-all"
                      :class="exportSettings.format === 'pdf' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'"
                    >
                      <input
                        v-model="exportSettings.format"
                        type="radio"
                        value="pdf"
                        class="sr-only"
                      />
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span class="text-sm font-semibold">PDF</span>
                    </label>
                  </div>
                </div>

                <div v-if="exportStatusMessage || exportErrorMessage" class="text-sm">
                  <p v-if="exportErrorMessage" class="text-red-600">
                    {{ exportErrorMessage }}
                  </p>
                  <p v-else class="text-slate-600">
                    {{ exportStatusMessage }}
                  </p>
                </div>

                <div class="flex gap-3 pt-2">
                  <button
                    type="button"
                    class="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    @click="showExportModal = false"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    :disabled="isExporting"
                    @click="handleExport"
                  >
                    <svg v-if="isExporting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {{ isExporting ? 'Exporting...' : 'Export' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Delete Account Modal -->
          <div
            v-if="showDeleteAccountModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div class="absolute inset-0 bg-black/50" @click="closeDeleteAccountModal" />
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-slate-900">Delete Account</h3>
                <button
                  type="button"
                  class="text-slate-400 hover:text-slate-600"
                  :disabled="accountApi.deleting"
                  @click="closeDeleteAccountModal"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="space-y-4 text-sm text-slate-600">
                <p>
                  This will permanently delete your account and remove your personal data.
                  Export your data before continuing if you need a copy.
                </p>
                <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                  This action is irreversible.
                </div>
              </div>

              <div class="mt-4 space-y-3">
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    v-model="deleteAccountConfirmed"
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  I understand this action cannot be undone.
                </label>
                <input
                  v-model="deleteAccountConfirmText"
                  type="text"
                  placeholder="Type DELETE to confirm"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
                <p v-if="deleteAccountError" class="text-xs text-red-600">
                  {{ deleteAccountError }}
                </p>
                <p v-else-if="deleteAccountWarning" class="text-xs text-amber-700">
                  {{ deleteAccountWarning }}
                </p>
              </div>

              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  class="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  :disabled="accountApi.deleting"
                  @click="closeDeleteAccountModal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                  :disabled="!deleteAccountReady || accountApi.deleting"
                  @click="handleDeleteAccount"
                >
                  <svg v-if="accountApi.deleting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {{ accountApi.deleting ? 'Deleting...' : 'Delete Account' }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="!compareHydrated" class="text-center py-12 text-slate-500">
            Loading...
          </div>
          <div v-else-if="compareRuns.length === 0" class="text-center py-16">
            <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">No comparisons yet</h3>
            <p class="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Your comparison history will appear here.</p>
            <NuxtLink
              to="/send-money"
              class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Compare Rates
            </NuxtLink>
          </div>
          <div v-else class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            <div
              v-for="run in compareRuns"
              :key="run.id"
              class="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-center gap-4 flex-1">
                <input
                  v-model="selectedExportItems"
                  type="checkbox"
                  :value="run.id"
                  class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                />
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-xl">{{ getFlag(run.from) }}</span>
                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span class="text-xl">{{ getFlag(run.to) }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-semibold text-slate-900">{{ run.from }}/{{ run.to }}</span>
                      <span class="text-slate-400">•</span>
                      <span class="text-sm text-emerald-600 font-medium">Sent {{ formatCurrency(run.amount, run.from) }}</span>
                      <span class="text-slate-400">•</span>
                      <span class="text-sm text-blue-600 capitalize font-medium">{{ run.method }}</span>
                    </div>
                    <div class="text-xs text-slate-500 mt-0.5">{{ new Date(run.createdAt).toLocaleDateString() }}</div>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 flex-shrink-0 ml-4">
                <NuxtLink
                  v-if="run.path"
                  :to="run.path"
                  class="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  View
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Ad: Extended History (Free users only) -->
          <div v-if="!isPlus" class="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <h4 class="font-semibold text-brand-600 text-sm mb-1">Limited to 30-Day History</h4>
                <p class="text-sm text-brand-700 mb-2">Free accounts can only view the last 30 days. Upgrade to Plus for 90-day history and export.</p>
                <NuxtLink to="/plus" class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Upgrade to Plus <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Export selected items bar -->
          <div
            v-if="selectedExportItems.length > 0 && isPlus"
            class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-full px-6 py-3 shadow-lg flex items-center gap-4"
          >
            <span class="text-sm">{{ selectedExportItems.length }} item{{ selectedExportItems.length !== 1 ? 's' : '' }} selected</span>
            <button
              type="button"
              class="text-sm font-medium text-blue-400 hover:text-blue-300"
              @click="handleExportSelected"
            >
              Export Selected
            </button>
            <button
              type="button"
              class="text-slate-400 hover:text-white"
              @click="selectedExportItems = []"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Ops Tab -->
        <div v-else-if="activeTab === 'ops'">
          <div class="flex flex-col gap-4 mb-6">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">Ops Health</h2>
                <p class="text-sm text-slate-500">Admin-only health probes for provider pipelines.</p>
              </div>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                :disabled="opsRefreshing"
                @click="refreshAllOps"
              >
                {{ opsRefreshing ? 'Refreshing...' : 'Refresh All' }}
              </button>
            </div>
          </div>

          <div class="space-y-6">
            <div v-for="provider in opsProviders" :key="provider.id" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-slate-100">
                <div>
                  <div class="flex items-center gap-2">
                    <div class="text-sm font-semibold text-slate-900">{{ provider.label }}</div>
                    <span
                      v-if="opsState[provider.id]?.affiliate === true"
                      class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                    >
                      Affiliate
                    </span>
                    <span
                      v-else-if="opsState[provider.id]?.affiliate === false"
                      class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                    >
                      No affiliate
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                    >
                      Unknown
                    </span>
                  </div>
                  <div class="text-xs text-slate-500">Last update: {{ formatOpsTimestamp(opsState[provider.id]?.timestamp) }}</div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-xs text-slate-500">
                    Stale {{ opsState[provider.id]?.summary?.stale_count ?? 0 }} / {{ opsState[provider.id]?.summary?.corridor_count ?? 0 }}
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
                    :disabled="opsLoading[provider.id]"
                    @click="loadOpsHealth(provider.id)"
                  >
                    {{ opsLoading[provider.id] ? 'Refreshing...' : 'Refresh' }}
                  </button>
                </div>
              </div>

              <div v-if="opsLoading[provider.id]" class="px-6 py-6 text-sm text-slate-500">
                Loading health data...
              </div>
              <div v-else-if="opsErrors[provider.id]" class="px-6 py-6 text-sm text-amber-800 bg-amber-50">
                {{ opsErrors[provider.id] }}
              </div>
              <div v-else-if="!opsState[provider.id]" class="px-6 py-6 text-sm text-slate-500">
                No health data loaded yet.
              </div>
              <div v-else>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4 border-b border-slate-100 text-sm">
                  <div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">Corridors</div>
                    <div class="font-semibold text-slate-900">{{ opsState[provider.id]?.summary?.corridor_count ?? 0 }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">Stale</div>
                    <div class="font-semibold text-slate-900">{{ opsState[provider.id]?.summary?.stale_count ?? 0 }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">Fresh window (min)</div>
                    <div class="font-semibold text-slate-900">{{ opsState[provider.id]?.summary?.fresh_window_minutes ?? 0 }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">Snapshot</div>
                    <div class="font-semibold text-slate-900">{{ formatOpsTimestamp(opsState[provider.id]?.timestamp) }}</div>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="min-w-full text-sm">
                    <thead class="bg-slate-50 text-slate-600">
                      <tr>
                        <th class="px-4 py-3 text-left font-semibold">Corridor</th>
                        <th class="px-4 py-3 text-left font-semibold">Attempt</th>
                        <th class="px-4 py-3 text-left font-semibold">Quote age (min)</th>
                        <th class="px-4 py-3 text-left font-semibold">Payin</th>
                        <th class="px-4 py-3 text-left font-semibold">Payout</th>
                        <th class="px-4 py-3 text-left font-semibold">Send</th>
                        <th class="px-4 py-3 text-left font-semibold">Fee</th>
                        <th class="px-4 py-3 text-left font-semibold">Promo fee</th>
                        <th class="px-4 py-3 text-left font-semibold">Rate</th>
                        <th class="px-4 py-3 text-left font-semibold">Delivery (min)</th>
                        <th class="px-4 py-3 text-left font-semibold">Flags</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="corridor in opsState[provider.id]?.corridors" :key="corridor.corridor_id" class="border-t border-slate-100">
                        <td class="px-4 py-3 font-medium text-slate-900">{{ corridor.corridor_id }}</td>
                        <td class="px-4 py-3">
                          <div class="font-medium" :class="attemptStatusClass(corridor.last_attempt_success)">
                            {{ formatAttemptStatus(corridor.last_attempt_success) }}
                          </div>
                          <div class="text-xs text-slate-400">
                            age {{ corridor.last_attempt_age_minutes ?? 'n/a' }} | http {{ corridor.last_attempt_http_status ?? 'n/a' }}
                          </div>
                        </td>
                        <td class="px-4 py-3">{{ corridor.last_quote_age_minutes ?? 'n/a' }}</td>
                        <td class="px-4 py-3">{{ corridor.payin ?? 'n/a' }}</td>
                        <td class="px-4 py-3">{{ corridor.payout ?? 'n/a' }}</td>
                        <td class="px-4 py-3">{{ formatOpsNumber(corridor.send_amount) }}</td>
                        <td class="px-4 py-3">{{ formatOpsNumber(corridor.fee_amount) }}</td>
                        <td class="px-4 py-3">{{ formatOpsNumber(corridor.promotional_fee_amount) }}</td>
                        <td class="px-4 py-3">{{ formatOpsNumber(corridor.implied_fx_rate, 6) }}</td>
                        <td class="px-4 py-3">
                          {{ corridor.delivery_time_min_minutes ?? 'n/a' }} - {{ corridor.delivery_time_max_minutes ?? 'n/a' }}
                        </td>
                        <td class="px-4 py-3 text-xs text-slate-500">
                          {{ formatOpsFlags(corridor.quality_flags) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-10 space-y-6">
            <div class="grid gap-6 lg:grid-cols-3">
              <div class="bg-white rounded-xl border border-slate-200 p-6">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-base font-semibold text-slate-900">Admin Tools</h3>
                    <p class="text-xs text-slate-500">Quick links to backend admin consoles.</p>
                  </div>
                </div>
                <div class="mt-4 space-y-3">
                  <NuxtLink
                    v-for="link in opsAdminLinks"
                    :key="link.label"
                    :to="link.to"
                    class="group flex items-start justify-between gap-4 rounded-lg border border-slate-100 px-3 py-2 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    <div>
                      <div class="text-sm font-semibold text-slate-900 group-hover:text-blue-700">{{ link.label }}</div>
                      <div class="text-xs text-slate-500">{{ link.description }}</div>
                    </div>
                    <svg class="w-4 h-4 text-slate-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </NuxtLink>
                </div>
                <div class="mt-4 text-xs text-slate-400">
                  Admin endpoints: /analytics/*, /audit/*, /telemetry/analytics, /ops/*
                </div>
              </div>

              <div class="bg-white rounded-xl border border-slate-200 p-6 lg:col-span-2">
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 class="text-base font-semibold text-slate-900">Telemetry Analytics</h3>
                    <p class="text-xs text-slate-500">Aggregated telemetry metrics from silver.telemetry_analytics_aggregate.</p>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                    :disabled="telemetryLoading"
                    @click="loadTelemetryAnalytics"
                  >
                    {{ telemetryLoading ? 'Refreshing...' : 'Refresh' }}
                  </button>
                </div>
                <div class="mt-4 flex flex-wrap items-end gap-3">
                  <label class="text-xs text-slate-500">
                    Metric
                    <select v-model="telemetryMetric" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <option v-for="metric in telemetryMetricOptions" :key="metric.id" :value="metric.id">{{ metric.label }}</option>
                    </select>
                  </label>
                  <label class="text-xs text-slate-500">
                    Window (hours)
                    <select v-model.number="telemetryHours" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <option v-for="option in telemetryHourOptions" :key="option" :value="option">{{ option }}</option>
                    </select>
                  </label>
                </div>
                <p v-if="telemetryError" class="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  {{ telemetryError }}
                </p>
                <div v-else class="mt-4">
                  <div v-if="telemetryLoading" class="text-sm text-slate-500">Loading telemetry analytics…</div>
                  <div v-else-if="!telemetryLatest" class="text-sm text-slate-500">No telemetry aggregates yet.</div>
                  <div v-else class="space-y-3">
                    <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Bucket: {{ formatOpsTimestamp(telemetryLatest.time_bucket) }}</span>
                      <span v-if="telemetryWindowHours">Window: {{ telemetryWindowHours }}h</span>
                      <span>Computed: {{ formatOpsTimestamp(telemetryLatest.computed_at) }}</span>
                    </div>
                    <div v-if="telemetryMetric === 'engagement'" class="grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
                      <div class="rounded-lg border border-slate-100 p-3">
                        <div class="text-xs text-slate-400 uppercase tracking-wide">Avg engagement</div>
                        <div class="text-lg font-semibold text-slate-900">{{ formatOpsNumber(telemetryEngagement?.avg_engagement, 2) }}</div>
                      </div>
                      <div class="rounded-lg border border-slate-100 p-3">
                        <div class="text-xs text-slate-400 uppercase tracking-wide">Sessions</div>
                        <div class="text-lg font-semibold text-slate-900">{{ formatOpsNumber(telemetryEngagement?.session_count, 0) }}</div>
                      </div>
                    </div>
                    <div v-else class="overflow-auto">
                      <table class="min-w-full text-sm">
                        <thead class="text-xs uppercase text-slate-400">
                          <tr>
                            <th v-if="telemetryMetric === 'heatmap'" class="py-2 text-left">From</th>
                            <th v-if="telemetryMetric === 'heatmap'" class="py-2 text-left">To</th>
                            <th v-if="telemetryMetric === 'popular_corridors'" class="py-2 text-left">Corridor</th>
                            <th v-if="telemetryMetric === 'provider_favorites'" class="py-2 text-left">Provider</th>
                            <th v-if="telemetryMetric === 'provider_favorites'" class="py-2 text-left">Corridor</th>
                            <th class="py-2 text-right">{{ telemetryMetric === 'provider_favorites' ? 'Clicks' : 'Searches' }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="row in telemetryListRows" :key="row.key" class="border-t border-slate-100">
                            <td v-if="telemetryMetric === 'heatmap'" class="py-2 text-slate-700">{{ row.from || '—' }}</td>
                            <td v-if="telemetryMetric === 'heatmap'" class="py-2 text-slate-700">{{ row.to || '—' }}</td>
                            <td v-if="telemetryMetric === 'popular_corridors'" class="py-2 text-slate-700">{{ row.corridor || '—' }}</td>
                            <td v-if="telemetryMetric === 'provider_favorites'" class="py-2 text-slate-700">{{ row.provider || '—' }}</td>
                            <td v-if="telemetryMetric === 'provider_favorites'" class="py-2 text-slate-700">{{ row.corridor || '—' }}</td>
                            <td class="py-2 text-right text-slate-600">{{ formatOpsNumber(row.count, 0) }}</td>
                          </tr>
                          <tr v-if="telemetryListRows.length === 0">
                            <td class="py-3 text-center text-xs text-slate-400" :colspan="telemetryMetric === 'heatmap' ? 3 : telemetryMetric === 'provider_favorites' ? 3 : 2">
                              No telemetry rows yet.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
              <div class="bg-white rounded-xl border border-slate-200 p-6">
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 class="text-base font-semibold text-slate-900">Analytics Snapshot</h3>
                    <p class="text-xs text-slate-500">Top corridors and providers (last 7 days).</p>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                    :disabled="opsAnalyticsLoading"
                    @click="loadOpsAnalytics"
                  >
                    {{ opsAnalyticsLoading ? 'Refreshing...' : 'Refresh' }}
                  </button>
                </div>
                <p v-if="opsAnalyticsError" class="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  {{ opsAnalyticsError }}
                </p>
                <div v-else class="mt-4 grid gap-6 md:grid-cols-2 text-sm">
                  <div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">Popular corridors</div>
                    <ul class="mt-3 space-y-2">
                      <li v-for="row in opsPopularCorridors" :key="row.corridor_id" class="flex items-center justify-between gap-4">
                        <span class="text-slate-700">{{ row.from_country }} → {{ row.to_country }}</span>
                        <span class="text-xs text-slate-500">{{ row.search_count }} searches</span>
                      </li>
                      <li v-if="!opsAnalyticsLoading && opsPopularCorridors.length === 0" class="text-xs text-slate-400">No corridor data yet.</li>
                    </ul>
                  </div>
                  <div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">Top providers</div>
                    <ul class="mt-3 space-y-2">
                      <li v-for="row in opsFavoriteProviders" :key="row.provider_id" class="flex items-center justify-between gap-4">
                        <span class="text-slate-700">{{ row.provider_name || row.provider_id }}</span>
                        <span class="text-xs text-slate-500">{{ row.click_through_rate }}% CTR</span>
                      </li>
                      <li v-if="!opsAnalyticsLoading && opsFavoriteProviders.length === 0" class="text-xs text-slate-400">No provider data yet.</li>
                    </ul>
                  </div>
                </div>
                <div class="mt-4 text-xs text-slate-500">
                  <NuxtLink to="/admin/analytics" class="font-semibold text-blue-600 hover:text-blue-700">Open analytics console →</NuxtLink>
                </div>
              </div>

              <div class="bg-white rounded-xl border border-slate-200 p-6">
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 class="text-base font-semibold text-slate-900">Audit Log Snapshot</h3>
                    <p class="text-xs text-slate-500">Recent admin/security events (last 7 days).</p>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                    :disabled="opsAuditLoading"
                    @click="loadOpsAudit"
                  >
                    {{ opsAuditLoading ? 'Refreshing...' : 'Refresh' }}
                  </button>
                </div>
                <p v-if="opsAuditError" class="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  {{ opsAuditError }}
                </p>
                <div v-else class="mt-4 overflow-auto">
                  <table class="min-w-full text-sm">
                    <thead class="text-xs uppercase text-slate-400">
                      <tr>
                        <th class="py-2 text-left">Time</th>
                        <th class="py-2 text-left">Action</th>
                        <th class="py-2 text-left">Actor</th>
                        <th class="py-2 text-left">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="log in opsAuditLogs" :key="log.event_id" class="border-t border-slate-100">
                        <td class="py-2 text-slate-600">{{ formatOpsTimestamp(log.created_at) }}</td>
                        <td class="py-2 text-slate-700">{{ log.action }}</td>
                        <td class="py-2 text-slate-600">{{ log.actor_id }}</td>
                        <td class="py-2 text-slate-600">{{ log.severity || 'info' }}</td>
                      </tr>
                      <tr v-if="!opsAuditLoading && opsAuditLogs.length === 0">
                        <td colspan="4" class="py-3 text-center text-xs text-slate-400">No audit events found.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="mt-4 text-xs text-slate-500">
                  <NuxtLink to="/admin/audit" class="font-semibold text-blue-600 hover:text-blue-700">Open audit console →</NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Account Tab -->
        <div v-else-if="activeTab === 'account'">
          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Account Sub-Navigation -->
            <aside class="lg:w-56 flex-shrink-0">
              <nav class="bg-white rounded-xl border border-slate-200 p-2 lg:sticky lg:top-36">
                <button
                  v-for="section in accountSections"
                  :key="section.id"
                  type="button"
                  class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
                  :class="activeAccountSection === section.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
                  @click="activeAccountSection = section.id"
                >
                  <component :is="section.icon" class="w-4 h-4" />
                  {{ section.label }}
                </button>
              </nav>
            </aside>

            <!-- Account Content -->
            <div class="flex-1 max-w-2xl">
              <!-- Profile Section -->
              <div v-if="activeAccountSection === 'profile'" class="space-y-6">
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Profile</h2>
                  <p class="text-sm text-slate-500">Manage your personal information</p>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <div class="mb-6">
                    <h3 class="font-medium text-slate-900">{{ user?.name || 'User' }}</h3>
                    <p class="text-sm text-slate-500">{{ user?.email }}</p>
                    <span
                      class="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="isPlus ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'"
                    >
                      {{ isPlus ? 'Plus Member' : 'Free Plan' }}
                    </span>
                  </div>

                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">Display Name</label>
                      <input
                        v-model="profileName"
                        type="text"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        :value="user?.email"
                        disabled
                        class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                      />
                      <p class="text-xs text-slate-400 mt-1">Contact support to change your email</p>
                    </div>
                  </div>

                  <div class="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div v-if="profileSaved" class="flex items-center gap-2 text-sm text-emerald-600">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      Changes saved!
                    </div>
                    <div v-else />
                    <button
                      type="button"
                      class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                      @click="saveProfile"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              <!-- Billing Section -->
              <div v-else-if="activeAccountSection === 'billing'" class="space-y-6">
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Billing</h2>
                  <p class="text-sm text-slate-500">Manage your subscription and payment methods</p>
                </div>
                <div
                  v-if="checkoutNotice === 'success'"
                  class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                  Subscription updated successfully. Your entitlements have been refreshed.
                </div>
                <div
                  v-else-if="checkoutNotice === 'cancel'"
                  class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
                >
                  Checkout canceled. No changes were made to your subscription.
                </div>
                <div
                  v-if="billingActionMessage"
                  class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {{ billingActionMessage }}
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <div class="flex items-center justify-between mb-6">
                    <div>
                      <h3 class="font-medium text-slate-900">Current Plan</h3>
                      <p class="text-sm text-slate-500">{{ isPlus ? 'Billed monthly' : 'Free forever' }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <div
                        class="px-3 py-1.5 rounded-full text-sm font-semibold"
                        :class="isPlus ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'"
                      >
                        {{ isPlus ? 'Plus' : 'Free' }}
                      </div>
                      <div
                        v-if="isPlus"
                        class="px-3 py-1.5 rounded-full text-xs font-semibold"
                        :class="billingStatusBadge.classes"
                      >
                        {{ billingStatusBadge.label }}
                      </div>
                    </div>
                  </div>

                  <div class="bg-slate-50 rounded-lg p-4 mb-6">
                    <div class="flex items-baseline justify-between mb-2">
                      <span class="text-sm text-slate-600">{{ isPlus ? 'Next billing date' : 'Plan type' }}</span>
                      <span class="text-sm font-medium text-slate-900">{{ isPlus ? formatBillingDate(billingSummary?.next_billing_date) : 'No billing' }}</span>
                    </div>
                    <div v-if="isPlus" class="flex items-baseline justify-between">
                      <span class="text-sm text-slate-600">Amount</span>
                      <span class="text-sm font-medium text-slate-900">
                        {{ formatBillingAmount(billingSummary?.amount, billingSummary?.currency) }}
                      </span>
                    </div>
                  </div>

                  <div v-if="!isPlus" class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div class="flex-1">
                        <h4 class="text-sm font-semibold text-slate-900">Upgrade to Plus</h4>
                        <p class="text-xs text-slate-600 mt-0.5">Unlimited alerts, extended history, and export</p>
                      </div>
                      <button
                        type="button"
                        class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:bg-slate-300"
                        :disabled="billingActions.checkoutLoading"
                        @click="startCheckout"
                      >
                        {{ billingActions.checkoutLoading ? 'Starting…' : 'Upgrade' }}
                      </button>
                    </div>
                  </div>

                  <div v-if="isPlus" class="flex gap-3">
                    <button
                      type="button"
                      @click="openBillingPortal"
                      class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                      :disabled="billingActions.portalLoading"
                    >
                      {{ billingActions.portalLoading ? 'Opening…' : 'Manage Subscription' }}
                    </button>
                  </div>
                </div>

                <div v-if="isPlus" class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Payment Method</h3>
                  <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                        <span class="text-white text-[10px] font-bold uppercase">
                          {{ billingSummary?.payment_method?.brand || 'Card' }}
                        </span>
                      </div>
                      <div>
                        <div class="text-sm font-medium text-slate-900">
                          <span v-if="billingSummary?.payment_method?.last4">•••• •••• •••• {{ billingSummary?.payment_method?.last4 }}</span>
                          <span v-else>No payment method on file</span>
                        </div>
                        <div class="text-xs text-slate-500" v-if="billingSummary?.payment_method?.exp_month && billingSummary?.payment_method?.exp_year">
                          Expires {{ billingSummary?.payment_method?.exp_month }}/{{ billingSummary?.payment_method?.exp_year }}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      @click="openBillingPortal"
                      class="text-sm font-medium text-blue-600 hover:text-blue-700"
                      :disabled="billingActions.portalLoading"
                    >
                      Update
                    </button>
                  </div>
                </div>

                <div v-if="isPlus" class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Billing History</h3>
                  <div v-if="billingHistoryLoading" class="text-sm text-slate-500">
                    Loading billing history…
                  </div>
                  <div v-else-if="billingHistoryError" class="text-sm text-red-600">
                    {{ billingHistoryError }}
                  </div>
                  <div v-else-if="billingHistory.length === 0" class="text-sm text-slate-500">
                    No invoices yet.
                  </div>
                  <div v-else class="space-y-3">
                    <div
                      v-for="(invoice, index) in billingHistory"
                      :key="invoice.id"
                      class="flex items-center justify-between py-2"
                      :class="index > 0 ? 'border-t border-slate-100' : ''"
                    >
                      <div>
                        <div class="text-sm font-medium text-slate-900">
                          {{ invoice.date ? new Date(invoice.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'Invoice' }}
                        </div>
                        <div class="text-xs text-slate-500">{{ invoice.status || 'paid' }}</div>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-sm font-medium text-slate-900">
                          {{ formatBillingAmount(invoice.amount, invoice.currency) }}
                        </span>
                        <a
                          v-if="invoice.invoice_url"
                          :href="invoice.invoice_url"
                          target="_blank"
                          rel="noreferrer"
                          class="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Invoice
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Notifications Section -->
              <div v-else-if="activeAccountSection === 'notifications'" class="space-y-6">
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Notifications</h2>
                  <p class="text-sm text-slate-500">Choose how you want to be notified</p>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Email Notifications</h3>
                  <div class="space-y-4">
                    <label class="flex items-center justify-between cursor-pointer">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Rate Alerts</div>
                        <div class="text-xs text-slate-500">Get notified when rates hit your target</div>
                      </div>
                      <input
                        v-model="notificationSettings.rateAlerts"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                    <label class="flex items-center justify-between cursor-pointer border-t border-slate-100 pt-4">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Weekly Summary</div>
                        <div class="text-xs text-slate-500">Weekly digest of rate movements</div>
                      </div>
                      <input
                        v-model="notificationSettings.weeklySummary"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                    <label class="flex items-center justify-between cursor-pointer border-t border-slate-100 pt-4">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Market Updates</div>
                        <div class="text-xs text-slate-500">Important market news and changes</div>
                      </div>
                      <input
                        v-model="notificationSettings.marketUpdates"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                    <label class="flex items-center justify-between cursor-pointer border-t border-slate-100 pt-4">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Product Updates</div>
                        <div class="text-xs text-slate-500">New features and improvements</div>
                      </div>
                      <input
                        v-model="notificationSettings.productUpdates"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                    <label class="flex items-center justify-between cursor-pointer border-t border-slate-100 pt-4">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Promotional Emails</div>
                        <div class="text-xs text-slate-500">Special offers and discounts from providers</div>
                      </div>
                      <input
                        v-model="notificationSettings.promotional"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Push Notifications</h3>
                  <label class="flex items-center justify-between cursor-pointer">
                    <div>
                      <div class="text-sm font-medium text-slate-900">Browser Notifications</div>
                      <div class="text-xs text-slate-500">Receive real-time alerts in your browser</div>
                    </div>
                    <input
                      v-model="notificationSettings.pushEnabled"
                      type="checkbox"
                      class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div class="flex justify-end">
                  <button
                    type="button"
                    class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>

              <!-- Security Section -->
              <div v-else-if="activeAccountSection === 'security'" class="space-y-6">
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Security</h2>
                  <p class="text-sm text-slate-500">Manage your account security settings</p>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Password</h3>
                  <p class="text-sm text-slate-500 mb-4">Last changed 30 days ago</p>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                      <input
                        v-model="securitySettings.currentPassword"
                        type="password"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                      <input
                        v-model="securitySettings.newPassword"
                        type="password"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                      <input
                        v-model="securitySettings.confirmPassword"
                        type="password"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div v-if="passwordUpdateError" class="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {{ passwordUpdateError }}
                  </div>
                  <div v-else-if="passwordUpdateSuccess" class="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Password updated successfully.
                  </div>
                  <div class="mt-4">
                    <button
                      type="button"
                      :disabled="passwordUpdateLoading"
                      @click="handlePasswordUpdate"
                      class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                      {{ passwordUpdateLoading ? 'Updating...' : 'Update Password' }}
                    </button>
                  </div>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <div class="flex items-center justify-between mb-4">
                    <div>
                      <h3 class="font-medium text-slate-900">Two-Factor Authentication</h3>
                      <p class="text-sm text-slate-500">Add an extra layer of security</p>
                    </div>
                    <span class="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      Not enabled
                    </span>
                  </div>
                  <button
                    type="button"
                    class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Enable 2FA
                  </button>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Active Sessions</h3>
                  <div v-if="sessionsLoading" class="text-sm text-slate-500">Loading sessions...</div>
                  <div v-else-if="sessionsError" class="text-sm text-rose-600">{{ sessionsError }}</div>
                  <div v-else-if="sessions.length === 0" class="text-sm text-slate-500">
                    No active sessions found.
                  </div>
                  <div v-else class="space-y-3">
                    <div
                      v-for="session in sessions"
                      :key="session.id"
                      class="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class="w-8 h-8 rounded-full flex items-center justify-center"
                          :class="session.is_current ? 'bg-emerald-100' : 'bg-slate-100'"
                        >
                          <svg
                            class="w-4 h-4"
                            :class="session.is_current ? 'text-emerald-600' : 'text-slate-600'"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <div class="text-sm font-medium text-slate-900">
                            {{ session.is_current ? 'Current Session' : 'Session' }}
                          </div>
                          <div class="text-xs text-slate-500">
                            {{ sessionMeta(session) }} • {{ session.ip_address || 'IP hidden' }}
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <span
                          class="text-xs font-medium"
                          :class="session.is_current ? 'text-emerald-600' : 'text-slate-500'"
                        >
                          {{ formatSessionActivity(session.last_activity) }}
                        </span>
                        <button
                          v-if="!session.is_current"
                          type="button"
                          class="text-xs font-medium text-slate-500 hover:text-rose-600"
                          @click="handleRevokeSession(session.session_id)"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="mt-4 text-sm font-medium text-red-600 hover:text-red-700"
                    @click="handleRevokeAllSessions"
                  >
                    Sign out all other sessions
                  </button>
                </div>
              </div>

              <!-- Privacy Section -->
              <div v-else-if="activeAccountSection === 'privacy'" class="space-y-6">
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Privacy</h2>
                  <p class="text-sm text-slate-500">Control your data and privacy settings</p>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Data Collection</h3>
                  <div class="space-y-4">
                    <label class="flex items-center justify-between cursor-pointer">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Usage Analytics</div>
                        <div class="text-xs text-slate-500">Help us improve by sharing anonymous usage data</div>
                      </div>
                      <input
                        v-model="privacySettings.analytics"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                    <label class="flex items-center justify-between cursor-pointer border-t border-slate-100 pt-4">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Personalized Recommendations</div>
                        <div class="text-xs text-slate-500">Get corridor suggestions based on your activity</div>
                      </div>
                      <input
                        v-model="privacySettings.personalization"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Your Data</h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Download Your Data</div>
                        <div class="text-xs text-slate-500">Get a copy of all your data</div>
                      </div>
                      <button
                        type="button"
                        class="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                        @click="requestGdprExport"
                      >
                        Request Download
                      </button>
                    </div>
                    <p v-if="gdprExportStatus" class="text-xs text-emerald-700">
                      {{ gdprExportStatus }}
                    </p>
                    <p v-else-if="gdprExportError" class="text-xs text-red-600">
                      {{ gdprExportError }}
                    </p>
                    <div class="flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Delete Account</div>
                        <div class="text-xs text-slate-500">Permanently delete your account and data</div>
                      </div>
                      <button
                        type="button"
                        class="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                        @click="openDeleteAccountModal"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end">
                  <button
                    type="button"
                    class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>

              <!-- Compliance Section -->
              <div v-else-if="activeAccountSection === 'compliance'" class="space-y-6">
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Compliance</h2>
                  <p class="text-sm text-slate-500">Regulatory information and data rights</p>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Data Protection Rights (GDPR)</h3>
                  <p class="text-sm text-slate-600 mb-4">
                    Under GDPR, you have several rights regarding your personal data. We are committed to respecting and fulfilling these rights.
                  </p>
                  <div class="space-y-3">
                    <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div class="text-sm font-medium text-slate-900">Right to Access</div>
                        <div class="text-xs text-slate-500">Request a copy of your personal data</div>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div class="text-sm font-medium text-slate-900">Right to Rectification</div>
                        <div class="text-xs text-slate-500">Request correction of inaccurate data</div>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div class="text-sm font-medium text-slate-900">Right to Erasure</div>
                        <div class="text-xs text-slate-500">Request deletion of your personal data</div>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div class="text-sm font-medium text-slate-900">Right to Data Portability</div>
                        <div class="text-xs text-slate-500">Receive your data in a machine-readable format</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Legal Documents</h3>
                  <div class="space-y-3">
                    <NuxtLink
                      to="/privacy"
                      class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span class="text-sm font-medium text-slate-900">Privacy Policy</span>
                      </div>
                      <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </NuxtLink>
                    <NuxtLink
                      to="/terms"
                      class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span class="text-sm font-medium text-slate-900">Terms of Service</span>
                      </div>
                      <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </NuxtLink>
                    <NuxtLink
                      to="/cookies"
                      class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span class="text-sm font-medium text-slate-900">Cookie Policy</span>
                      </div>
                      <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </NuxtLink>
                  </div>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-2">Submit a Data Request</h3>
                  <p class="text-sm text-slate-500 mb-4">
                    For any data-related requests or questions about your privacy rights, please contact our Data Protection Officer.
                  </p>
                  <NuxtLink
                    to="/contact?subject=data-request"
                    class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Contact DPO
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import type { AlertRule, WatchTarget, WatchlistItem } from '~/types/tracking'
import UniversalDropdown from '~/components/shared/UniversalDropdown.vue'
import ProviderLogo from '~/components/shared/ProviderLogo.vue'
import { getCorridorUrl } from '~/utils/country-slugs'
import { COUNTRIES } from '~/utils/countries-currencies'

const { ensureHydrated } = useAuth()
await ensureHydrated()

type DashboardTab = 'overview' | 'watchlist' | 'alerts' | 'history' | 'ops' | 'account'
type AccountSection = 'profile' | 'billing' | 'notifications' | 'security' | 'privacy' | 'compliance'

const tabs: { id: DashboardTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'history', label: 'History' },
  { id: 'ops', label: 'Ops' },
  { id: 'account', label: 'Account' },
]

const IconUser = defineComponent({
  render: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' })
  ])
})

const IconCreditCard = defineComponent({
  render: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' })
  ])
})

const IconBell = defineComponent({
  render: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' })
  ])
})

const IconShield = defineComponent({
  render: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' })
  ])
})

const IconEye = defineComponent({
  render: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' }),
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' })
  ])
})

const IconDocument = defineComponent({
  render: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
  ])
})

const accountSections: { id: AccountSection; label: string; icon: ReturnType<typeof defineComponent> }[] = [
  { id: 'profile', label: 'Profile', icon: IconUser },
  { id: 'billing', label: 'Billing', icon: IconCreditCard },
  { id: 'notifications', label: 'Notifications', icon: IconBell },
  { id: 'security', label: 'Security', icon: IconShield },
  { id: 'privacy', label: 'Privacy', icon: IconEye },
  { id: 'compliance', label: 'Compliance', icon: IconDocument },
]

const route = useRoute()
const { user, isAuthenticated, updatePasswordWithCurrent } = useAuth()
const {
  sessions,
  loading: sessionsLoading,
  error: sessionsError,
  fetchSessions,
  revokeSession,
  revokeAllSessions,
} = useSessions()
const { updateProfile } = useMe()
const { isPlus, limits, billing, refreshPlan } = useEntitlements()
const billingActions = useBilling()
const exportsApi = useExports()
const dataExportApi = useDataExport()
const accountApi = useAccount()
const modal = useSaveAlertModal()
const { request } = useApi()
const { data: recentSearchesData, pending: recentSearchesPending } = useRecentSearches(10, { watch: false })

const {
  items: watchlistItems,
  hydrated: watchlistHydrated,
  count: watchlistCount,
  remove: watchlistRemove,
  reset: watchlistReset,
  save: watchlistSave,
} = useWatchlist()

const {
  alerts: alertItems,
  hydrated: alertsHydrated,
  count: alertsCount,
  toggleEnabled: alertsToggleEnabled,
  remove: alertsRemove,
  reset: alertsReset,
  findById: alertsFindById,
  update: alertsUpdate,
} = useAlerts()

const {
  runs: compareRuns,
  hydrated: compareHydrated,
  count: compareCount,
  remove: compareRemove,
  reset: compareReset,
} = useCompareHistory()

const recentSearches = computed(() => recentSearchesData.value?.data ?? [])

type RateHistoryEntry = {
  date: string
  rate: number
  bid?: number | null
  ask?: number | null
  source?: string | null
}

type RateHistoryResponse = {
  base: string
  quote: string
  history: RateHistoryEntry[]
  lastUpdated: string | null
}

type ProviderRateEntry = {
  name: string
  rate: number
  markupBps?: number
  speed?: string
  lastUpdated?: string | null
}

type ProviderRatesResponse = {
  base: string
  quote: string
  midMarketRate: number | null
  data: ProviderRateEntry[]
}

type RateSnapshot = {
  rateLabel: string
  rateValue: number | null
  change: number | null
  lastUpdated: string | null
  history: RateHistoryEntry[]
}

type BestProviderSnapshot = ProviderRateEntry & {
  slug: string
}

const historyDaysByTimeframe: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '180d': 180,
  '365d': 365,
}

const watchlistHistoryDays = 7

const rateHistoryCache = ref<Record<string, RateHistoryResponse>>({})
const rateHistoryLoading = ref<Record<string, boolean>>({})
const rateHistoryErrors = ref<Record<string, string | null>>({})
const providerRatesCache = ref<Record<string, ProviderRatesResponse>>({})
const providerRatesLoading = ref<Record<string, boolean>>({})
const providerRatesErrors = ref<Record<string, string | null>>({})

const formatRateValue = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

const formatPercentValue = (value: number | null | undefined, includeSign = true) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const sign = value > 0 && includeSign ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

const formatUpdatedTime = (value: string | null | undefined) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatDateLabel = (value: string | null | undefined) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const countryOverrides: Record<string, { name: string; code: string; flag: string; currency: string }> = {
  EU: { name: 'Eurozone', code: 'EU', flag: '🇪🇺', currency: 'EUR' },
  UK: { name: 'United Kingdom', code: 'UK', flag: '🇬🇧', currency: 'GBP' },
}

const countryMap = [...COUNTRIES, ...Object.values(countryOverrides)].reduce((acc, c) => {
  acc[c.code] = c
  return acc
}, {} as Record<string, typeof COUNTRIES[0]>)

const getFlag = (code: string) => countryMap[code.toUpperCase()]?.flag || '🏳️'
const getCountryName = (code: string) => countryMap[code.toUpperCase()]?.name || code
const getCurrencyForCountry = (code: string) => countryMap[code.toUpperCase()]?.currency || null
const getCurrencyCode = (code: string) => getCurrencyForCountry(code) || code.toUpperCase()

const buildHistoryKey = (base: string, quote: string, days: number) => `${base}-${quote}-${days}`
const buildProviderKey = (base: string, quote: string) => `${base}-${quote}`

const getPairForCorridor = (from: string, to: string) => {
  const base = getCurrencyForCountry(from.toUpperCase())
  const quote = getCurrencyForCountry(to.toUpperCase())
  if (!base || !quote) return null
  return { base, quote }
}

const getPairForTarget = (target: WatchTarget) => {
  if (target.type === 'corridor') {
    return getPairForCorridor(target.from, target.to)
  }
  if (target.type === 'fxPair') {
    return { base: target.base.toUpperCase(), quote: target.quote.toUpperCase() }
  }
  return null
}

const getRateHistory = (base: string, quote: string, days: number) => {
  return rateHistoryCache.value[buildHistoryKey(base, quote, days)]?.history ?? []
}

const getRateHistoryMeta = (base: string, quote: string, days: number) => {
  return rateHistoryCache.value[buildHistoryKey(base, quote, days)] ?? null
}

const loadRateHistory = async (base: string, quote: string, days: number) => {
  const key = buildHistoryKey(base, quote, days)
  if (rateHistoryLoading.value[key] || rateHistoryCache.value[key]) return
  rateHistoryLoading.value[key] = true
  rateHistoryErrors.value[key] = null
  try {
    const response = await request<RateHistoryResponse>('/rates/history', {
      query: { base, quote, days },
    })
    rateHistoryCache.value = { ...rateHistoryCache.value, [key]: response }
  } catch (error: any) {
    rateHistoryErrors.value[key] = error?.message || 'Unable to load rate history.'
    rateHistoryCache.value = {
      ...rateHistoryCache.value,
      [key]: { base, quote, history: [], lastUpdated: null },
    }
  } finally {
    rateHistoryLoading.value[key] = false
  }
}

const loadProviderRates = async (base: string, quote: string) => {
  const key = buildProviderKey(base, quote)
  if (providerRatesLoading.value[key] || providerRatesCache.value[key]) return
  providerRatesLoading.value[key] = true
  providerRatesErrors.value[key] = null
  try {
    const response = await request<ProviderRatesResponse>('/rates/providers', {
      query: { base, quote },
    })
    providerRatesCache.value = { ...providerRatesCache.value, [key]: response }
  } catch (error: any) {
    providerRatesErrors.value[key] = error?.message || 'Unable to load provider rates.'
    providerRatesCache.value = {
      ...providerRatesCache.value,
      [key]: { base, quote, midMarketRate: null, data: [] },
    }
  } finally {
    providerRatesLoading.value[key] = false
  }
}

const watchlistFindById = (id: string) => watchlistItems.value.find(i => i.id === id) ?? null

const watchlistLimitPercent = computed(() => {
  if (limits.value.watchlistItems === 'unlimited') return 0
  return (watchlistCount.value / (limits.value.watchlistItems as number)) * 100
})

const alertsLimitPercent = computed(() => {
  if (limits.value.alerts === 'unlimited') return 0
  return (alertsCount.value / (limits.value.alerts as number)) * 100
})

const watchlistLimitReached = computed(() => !isPlus.value && watchlistLimitPercent.value >= 100)
const alertsLimitReached = computed(() => !isPlus.value && alertsLimitPercent.value >= 100)

const activeTab = computed<DashboardTab>(() => {
  const raw = route.query.tab
  const tab = Array.isArray(raw) ? raw[0] : raw
  if (tab === 'watchlist' || tab === 'alerts' || tab === 'history' || tab === 'ops' || tab === 'account') return tab
  return 'overview'
})

function setTab(tab: DashboardTab) {
  const nextQuery = { ...route.query } as Record<string, unknown>
  if (tab === 'overview') {
    delete nextQuery.tab
  } else {
    nextQuery.tab = tab
  }
  void navigateTo({ path: route.path, query: nextQuery })
}

async function openBillingPortal() {
  billingActionMessage.value = null
  const result = await billingActions.openBillingPortal()
  if (!result.ok) {
    billingActionMessage.value = result.error || 'Unable to open billing portal.'
  }
}

async function startCheckout() {
  billingActionMessage.value = null
  const result = await billingActions.createCheckoutSession('plus')
  if (!result.ok || !result.url) {
    billingActionMessage.value = result.error || 'Unable to start checkout.'
    return
  }
  if (process.client) {
    window.location.href = result.url
  }
}

type OpsProviderId = 'remitly' | 'westernunion' | 'worldremit' | 'xe' | 'wise'

type OpsHealthCorridor = {
  corridor_id: string
  last_attempt_at: string | null
  last_attempt_age_minutes: number | null
  last_attempt_success: boolean | null
  last_attempt_http_status: number | null
  last_attempt_error_type: string | null
  last_attempt_error_message: string | null
  last_attempt_request: string | null
  last_quote_at: string | null
  last_quote_age_minutes: number | null
  payin: string | null
  payout: string | null
  send_amount: number | null
  fee_amount: number | null
  promotional_fee_amount: number | null
  total_debit_amount: number | null
  receive_amount: number | null
  implied_fx_rate: number | null
  promotional_rate: number | null
  base_rate: number | null
  promotional_cap_amount: number | null
  delivery_time_min_minutes: number | null
  delivery_time_max_minutes: number | null
  quality_flags: unknown
  updated_at: string | null
}

type OpsHealthResponse = {
  success: boolean
  provider_id: string
  affiliate: boolean
  affiliate_url: string | null
  outbound_url: string | null
  timestamp: string
  corridors: OpsHealthCorridor[]
  summary: {
    corridor_count: number
    stale_count: number
    fresh_window_minutes: number
  }
}

type TelemetryAggregateRow = {
  metric: string
  value: unknown
  time_bucket: string
  dimensions: Record<string, unknown> | null
  computed_at: string
}

type TelemetryListRow = {
  key: string
  from?: string
  to?: string
  provider?: string
  corridor?: string
  count: number
}

type OpsAnalyticsCorridor = {
  corridor_id: string
  from_country: string
  to_country: string
  search_count: number
  click_count?: number
  trend?: string
  trend_percentage?: number
}

type OpsAnalyticsProvider = {
  provider_id: string
  provider_name?: string | null
  click_count?: number
  click_through_rate: number
}

type OpsAuditLog = {
  event_id: string
  created_at: string
  action: string
  actor_id: string
  severity?: string | null
}

type BillingInvoice = {
  id: string
  date: string | null
  amount: number | null
  currency: string | null
  status: string | null
  invoice_url: string | null
}

const opsProviders = [
  { id: 'remitly', label: 'Remitly', endpoint: '/ops/remitly/health' },
  { id: 'westernunion', label: 'Western Union', endpoint: '/ops/westernunion/health' },
  { id: 'worldremit', label: 'WorldRemit', endpoint: '/ops/worldremit/health' },
  { id: 'xe', label: 'XE', endpoint: '/ops/xe/health' },
  { id: 'wise', label: 'Wise', endpoint: '/ops/wise/health' },
] as const

const opsAdminLinks = [
  {
    label: 'Analytics Console',
    description: 'Traffic, corridor demand, provider CTR, and savings metrics.',
    to: '/admin/analytics',
  },
  {
    label: 'Audit Log Console',
    description: 'Security, compliance, and admin event trails.',
    to: '/admin/audit',
  },
] as const

const opsState = ref<Record<OpsProviderId, OpsHealthResponse | null>>({
  remitly: null,
  westernunion: null,
  worldremit: null,
  xe: null,
  wise: null,
})
const opsLoading = ref<Record<OpsProviderId, boolean>>({
  remitly: false,
  westernunion: false,
  worldremit: false,
  xe: false,
  wise: false,
})
const opsErrors = ref<Record<OpsProviderId, string | null>>({
  remitly: null,
  westernunion: null,
  worldremit: null,
  xe: null,
  wise: null,
})
const opsHasLoaded = ref(false)

const telemetryMetricOptions = [
  { id: 'popular_corridors', label: 'Popular Corridors' },
  { id: 'provider_favorites', label: 'Provider Favorites' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'engagement', label: 'Engagement' },
] as const

const telemetryHourOptions = [6, 24, 72, 168, 720] as const

const telemetryMetric = ref<(typeof telemetryMetricOptions)[number]['id']>('popular_corridors')
const telemetryHours = ref<number>(24)
const telemetryRows = ref<TelemetryAggregateRow[]>([])
const telemetryLoading = ref(false)
const telemetryError = ref<string | null>(null)
const telemetryHasLoaded = ref(false)

const opsAnalyticsLoading = ref(false)
const opsAnalyticsError = ref<string | null>(null)
const opsPopularCorridors = ref<OpsAnalyticsCorridor[]>([])
const opsFavoriteProviders = ref<OpsAnalyticsProvider[]>([])
const opsAnalyticsHasLoaded = ref(false)

const opsAuditLoading = ref(false)
const opsAuditError = ref<string | null>(null)
const opsAuditLogs = ref<OpsAuditLog[]>([])
const opsAuditHasLoaded = ref(false)

const opsRefreshing = computed(() => opsProviders.some(provider => opsLoading.value[provider.id]))

const opsAutoRefreshMs = 60_000
const opsInsightsRefreshMs = 300_000
let opsAutoRefreshTimer: ReturnType<typeof setInterval> | null = null
let opsInsightsRefreshTimer: ReturnType<typeof setInterval> | null = null

const startOpsAutoRefresh = () => {
  if (opsAutoRefreshTimer || opsInsightsRefreshTimer) return
  opsAutoRefreshTimer = setInterval(() => {
    if (activeTab.value !== 'ops') return
    void refreshAllOps()
  }, opsAutoRefreshMs)
  opsInsightsRefreshTimer = setInterval(() => {
    if (activeTab.value !== 'ops') return
    void loadTelemetryAnalytics()
    void loadOpsAnalytics()
    void loadOpsAudit()
  }, opsInsightsRefreshMs)
}

const stopOpsAutoRefresh = () => {
  if (opsAutoRefreshTimer) {
    clearInterval(opsAutoRefreshTimer)
    opsAutoRefreshTimer = null
  }
  if (opsInsightsRefreshTimer) {
    clearInterval(opsInsightsRefreshTimer)
    opsInsightsRefreshTimer = null
  }
}

const formatOpsTimestamp = (value: string | null | undefined) => {
  if (!value) return 'n/a'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'n/a'
  return parsed.toLocaleString()
}

const formatOpsNumber = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined) return 'n/a'
  const number = Number(value)
  if (!Number.isFinite(number)) return 'n/a'
  return number.toLocaleString(undefined, { maximumFractionDigits: digits })
}

const formatOpsFlags = (value: unknown) => {
  if (!value) return 'none'
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'none'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return 'unknown'
  }
}

const formatAttemptStatus = (success: boolean | null) => {
  if (success === true) return 'ok'
  if (success === false) return 'fail'
  return 'n/a'
}

const attemptStatusClass = (success: boolean | null) => {
  if (success === true) return 'text-emerald-600'
  if (success === false) return 'text-red-600'
  return 'text-slate-400'
}

const toOpsErrorMessage = (error: unknown) => {
  const candidate = error as { statusCode?: number; status?: number; message?: string; data?: { message?: string } }
  const status = candidate?.statusCode ?? candidate?.status
  if (status === 401 || status === 403) {
    return 'Admin access required to view ops data.'
  }
  return candidate?.data?.message ?? candidate?.message ?? 'Unable to load ops data.'
}

const telemetryLatest = computed(() => {
  if (!telemetryRows.value.length) return null
  return [...telemetryRows.value].sort((a, b) => new Date(b.time_bucket).getTime() - new Date(a.time_bucket).getTime())[0]
})

const telemetryWindowHours = computed(() => {
  const dimensions = telemetryLatest.value?.dimensions
  if (!dimensions || typeof dimensions !== 'object') return null
  const value = (dimensions as Record<string, unknown>).window_hours
  return typeof value === 'number' ? value : null
})

const telemetryEngagement = computed(() => {
  if (telemetryMetric.value !== 'engagement') return null
  const payload = telemetryLatest.value?.value
  if (!payload || typeof payload !== 'object') return null
  return payload as { avg_engagement?: number; session_count?: number }
})

const telemetryListRows = computed<TelemetryListRow[]>(() => {
  if (!telemetryLatest.value) return []
  const payload = telemetryLatest.value.value
  if (!Array.isArray(payload)) return []
  if (telemetryMetric.value === 'popular_corridors') {
    return payload.slice(0, 12).map((row: any, index: number) => ({
      key: `${row.corridor_id ?? 'corridor'}-${index}`,
      corridor: row.corridor_id,
      count: Number(row.search_count) || 0,
    }))
  }
  if (telemetryMetric.value === 'provider_favorites') {
    return payload.slice(0, 12).map((row: any, index: number) => ({
      key: `${row.provider_id ?? 'provider'}-${index}`,
      provider: row.provider_id,
      corridor: row.corridor_id,
      count: Number(row.click_count) || 0,
    }))
  }
  if (telemetryMetric.value === 'heatmap') {
    return payload.slice(0, 12).map((row: any, index: number) => ({
      key: `${row.from_country ?? 'from'}-${row.to_country ?? 'to'}-${index}`,
      from: row.from_country,
      to: row.to_country,
      count: Number(row.search_count) || 0,
    }))
  }
  return []
})

const loadOpsHealth = async (providerId: OpsProviderId) => {
  const provider = opsProviders.find(item => item.id === providerId)
  if (!provider) return
  if (opsLoading.value[providerId]) return
  opsLoading.value[providerId] = true
  opsErrors.value[providerId] = null
  try {
    const response = await request<OpsHealthResponse>(provider.endpoint)
    opsState.value[providerId] = response
  } catch (error) {
    opsErrors.value[providerId] = toOpsErrorMessage(error)
  } finally {
    opsLoading.value[providerId] = false
  }
}

const refreshAllOps = async () => {
  opsHasLoaded.value = true
  await Promise.all(opsProviders.map(provider => loadOpsHealth(provider.id)))
}

const buildOpsDateRange = (days: number) => {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return { start_date: start.toISOString(), end_date: end.toISOString() }
}

const loadTelemetryAnalytics = async () => {
  if (telemetryLoading.value) return
  telemetryHasLoaded.value = true
  telemetryLoading.value = true
  telemetryError.value = null
  try {
    const response = await request<{ data: TelemetryAggregateRow[] }>('/telemetry/analytics', {
      query: {
        metric: telemetryMetric.value,
        hours: telemetryHours.value,
      },
    })
    telemetryRows.value = response?.data ?? []
  } catch (error) {
    telemetryError.value = toOpsErrorMessage(error)
    telemetryRows.value = []
  } finally {
    telemetryLoading.value = false
  }
}

const loadOpsAnalytics = async () => {
  if (opsAnalyticsLoading.value) return
  opsAnalyticsHasLoaded.value = true
  opsAnalyticsLoading.value = true
  opsAnalyticsError.value = null
  const range = buildOpsDateRange(7)
  try {
    const [corridors, providers] = await Promise.all([
      request<{ corridors: OpsAnalyticsCorridor[] }>('/analytics/corridors', {
        query: { ...range, limit: 6 },
      }),
      request<{ providers: OpsAnalyticsProvider[] }>('/analytics/providers', {
        query: { ...range, limit: 6 },
      }),
    ])
    opsPopularCorridors.value = corridors?.corridors ?? []
    opsFavoriteProviders.value = providers?.providers ?? []
  } catch (error) {
    opsAnalyticsError.value = toOpsErrorMessage(error)
    opsPopularCorridors.value = []
    opsFavoriteProviders.value = []
  } finally {
    opsAnalyticsLoading.value = false
  }
}

const loadOpsAudit = async () => {
  if (opsAuditLoading.value) return
  opsAuditHasLoaded.value = true
  opsAuditLoading.value = true
  opsAuditError.value = null
  const range = buildOpsDateRange(7)
  try {
    const response = await request<{ logs: OpsAuditLog[] }>('/audit/logs', {
      query: { ...range, limit: 8, offset: 0 },
    })
    opsAuditLogs.value = response?.logs ?? []
  } catch (error) {
    opsAuditError.value = toOpsErrorMessage(error)
    opsAuditLogs.value = []
  } finally {
    opsAuditLoading.value = false
  }
}

watch(() => activeTab.value, (tab) => {
  if (tab === 'ops') {
    startOpsAutoRefresh()
  } else {
    stopOpsAutoRefresh()
  }
  if (tab === 'ops' && !opsHasLoaded.value) {
    void refreshAllOps()
  }
  if (tab === 'ops' && !telemetryHasLoaded.value) {
    void loadTelemetryAnalytics()
  }
  if (tab === 'ops' && !opsAnalyticsHasLoaded.value) {
    void loadOpsAnalytics()
  }
  if (tab === 'ops' && !opsAuditHasLoaded.value) {
    void loadOpsAudit()
  }
})

watch([() => telemetryMetric.value, () => telemetryHours.value], () => {
  if (activeTab.value !== 'ops') return
  void loadTelemetryAnalytics()
})

// Form state
const newWatchlist = ref({ from: 'US', to: 'PH' })
const graphTimeframe = ref('7d')

// Rate Checker state
const showCorridorSelector = ref(false)
const selectedCorridor = ref({ from: 'US', to: 'PH' })
const customCorridor = ref({ from: 'US', to: 'PH' })

const timeframePeriods = [
  { label: '7D', value: '7d' },
  { label: '1M', value: '30d' },
  { label: '3M', value: '90d', plusOnly: true },
  { label: '6M', value: '180d', plusOnly: true },
  { label: '1Y', value: '365d', plusOnly: true },
]

const isTimeframeLocked = (value: string) => {
  if (isPlus.value) return false
  return value === '90d' || value === '180d' || value === '365d'
}

const countryOptions = computed(() => {
  return Object.values(countryMap)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({
      label: `${getFlag(c.code)} ${c.code} - ${c.name}`,
      value: c.code,
      code: c.code,
      flag: getFlag(c.code),
      name: c.name,
    }))
})

const inlineFromOptions = computed(() => countryOptions.value)
const inlineToOptions = computed(() => countryOptions.value)


const selectedHistoryDays = computed(() => historyDaysByTimeframe[graphTimeframe.value] ?? 30)

const selectedPair = computed(() => {
  return getPairForCorridor(selectedCorridor.value.from, selectedCorridor.value.to)
})

const selectedSnapshot = computed<RateSnapshot>(() => {
  const pair = selectedPair.value
  if (!pair) {
    return { rateLabel: '—', rateValue: null, change: null, lastUpdated: null, history: [] }
  }
  const history = getRateHistory(pair.base, pair.quote, selectedHistoryDays.value)
  if (!history.length) {
    return { rateLabel: '—', rateValue: null, change: null, lastUpdated: null, history }
  }
  const latest = history[history.length - 1]
  const previous = history.length > 1 ? history[history.length - 2] : null
  const change = previous && previous.rate > 0
    ? ((latest.rate - previous.rate) / previous.rate) * 100
    : null
  const meta = getRateHistoryMeta(pair.base, pair.quote, selectedHistoryDays.value)
  return {
    rateLabel: formatRateValue(latest.rate),
    rateValue: latest.rate,
    change,
    lastUpdated: meta?.lastUpdated ?? latest.date,
    history,
  }
})

const selectedHistoryLoading = computed(() => {
  const pair = selectedPair.value
  if (!pair) return false
  const key = buildHistoryKey(pair.base, pair.quote, selectedHistoryDays.value)
  return Boolean(rateHistoryLoading.value[key])
})

const currentRate = computed(() => {
  return {
    rate: selectedSnapshot.value.rateLabel,
    change: selectedSnapshot.value.change,
    lastUpdated: formatUpdatedTime(selectedSnapshot.value.lastUpdated),
    isAvailable: selectedSnapshot.value.rateValue !== null,
  }
})

const rateStats = computed(() => {
  const history = selectedSnapshot.value.history
  if (!history.length) {
    return { high: '—', low: '—', average: '—', volatility: '—', hasData: false }
  }
  const values = history.map(point => point.rate).filter(Number.isFinite)
  if (!values.length) {
    return { high: '—', low: '—', average: '—', volatility: '—', hasData: false }
  }
  const high = Math.max(...values)
  const low = Math.min(...values)
  const average = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / values.length
  const volatility = average > 0 ? (Math.sqrt(variance) / average) * 100 : 0
  return {
    high: formatRateValue(high),
    low: formatRateValue(low),
    average: formatRateValue(average),
    volatility: formatPercentValue(volatility, false),
    hasData: true,
  }
})

watch([selectedPair, selectedHistoryDays], ([pair, days]) => {
  if (!pair) return
  void loadRateHistory(pair.base, pair.quote, days)
}, { immediate: true })

watch(() => isPlus.value, (value) => {
  if (!value && isTimeframeLocked(graphTimeframe.value)) {
    graphTimeframe.value = '30d'
  }
})

function selectCorridor(from: string, to: string) {
  selectedCorridor.value = { from, to }
  showCorridorSelector.value = false
}

function getTimeframeStartLabel() {
  if (selectedSnapshot.value.history.length > 0) {
    return formatDateLabel(selectedSnapshot.value.history[0].date)
  }
  const days = selectedHistoryDays.value
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const watchlistPairs = computed(() => {
  const pairs = new Map<string, { base: string; quote: string }>()
  watchlistItems.value.forEach((item) => {
    const pair = getPairForTarget(item.target)
    if (!pair) return
    pairs.set(buildProviderKey(pair.base, pair.quote), pair)
  })
  return Array.from(pairs.values())
})

watch(watchlistPairs, (pairs) => {
  pairs.forEach((pair) => {
    void loadRateHistory(pair.base, pair.quote, watchlistHistoryDays)
    void loadProviderRates(pair.base, pair.quote)
  })
}, { immediate: true })

const watchlistSnapshots = computed<Record<string, RateSnapshot>>(() => {
  const map: Record<string, RateSnapshot> = {}
  watchlistItems.value.forEach((item) => {
    const pair = getPairForTarget(item.target)
    if (!pair) return
    const history = getRateHistory(pair.base, pair.quote, watchlistHistoryDays)
    if (!history.length) {
      map[item.id] = { rateLabel: '—', rateValue: null, change: null, lastUpdated: null, history }
      return
    }
    const latest = history[history.length - 1]
    const previous = history.length > 1 ? history[history.length - 2] : null
    const change = previous && previous.rate > 0
      ? ((latest.rate - previous.rate) / previous.rate) * 100
      : null
    const meta = getRateHistoryMeta(pair.base, pair.quote, watchlistHistoryDays)
    map[item.id] = {
      rateLabel: formatRateValue(latest.rate),
      rateValue: latest.rate,
      change,
      lastUpdated: meta?.lastUpdated ?? latest.date,
      history,
    }
  })
  return map
})

const getWatchlistSnapshot = (itemId: string) => {
  return watchlistSnapshots.value[itemId] ?? {
    rateLabel: '—',
    rateValue: null,
    change: null,
    lastUpdated: null,
    history: [],
  }
}

const isWatchlistHistoryLoading = (itemId: string) => {
  const item = watchlistItems.value.find(candidate => candidate.id === itemId)
  if (!item) return false
  const pair = getPairForTarget(item.target)
  if (!pair) return false
  const key = buildHistoryKey(pair.base, pair.quote, watchlistHistoryDays)
  return Boolean(rateHistoryLoading.value[key])
}

const providerSlugOverrides: Record<string, string> = {
  'western union': 'western-union',
  'worldremit': 'worldremit',
  'remitly': 'remitly',
  'wise': 'wise',
  'xe': 'xe-money',
  'xe money': 'xe-money',
  'xoom': 'xoom',
  'moneygram': 'moneygram',
  'ria': 'ria',
}

const slugifyProvider = (name: string) => {
  const normalized = name.trim().toLowerCase()
  if (providerSlugOverrides[normalized]) return providerSlugOverrides[normalized]
  return normalized.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const bestProviderByItemId = computed<Record<string, BestProviderSnapshot>>(() => {
  const map: Record<string, BestProviderSnapshot> = {}
  watchlistItems.value.forEach((item) => {
    const pair = getPairForTarget(item.target)
    if (!pair) return
    const key = buildProviderKey(pair.base, pair.quote)
    const data = providerRatesCache.value[key]?.data ?? []
    if (!data.length) return
    const best = data.reduce((top, next) => (next.rate > top.rate ? next : top))
    map[item.id] = { ...best, slug: slugifyProvider(best.name) }
  })
  return map
})

const getBestProviderForItem = (itemId: string) => {
  return bestProviderByItemId.value[itemId] ?? null
}

const isProviderRatesLoadingForItem = (itemId: string) => {
  const item = watchlistItems.value.find(candidate => candidate.id === itemId)
  if (!item) return false
  const pair = getPairForTarget(item.target)
  if (!pair) return false
  const key = buildProviderKey(pair.base, pair.quote)
  return Boolean(providerRatesLoading.value[key])
}

async function handleAddToWatchlist() {
  if (watchlistLimitReached.value) {
    alert('Watchlist limit reached. Upgrade to Plus for unlimited corridors.')
    return
  }
  const target: WatchTarget = {
    type: 'corridor',
    from: selectedCorridor.value.from,
    to: selectedCorridor.value.to,
    method: 'bank',
  }
  const label = `${selectedCorridor.value.from} → ${selectedCorridor.value.to}`
  const result = await watchlistSave(target, { label })
  
  if (result.status === 'limit_reached' || result.status === 'error') {
    alert(result.message)
  }
}

function handleSetAlert() {
  if (alertsLimitReached.value) {
    alert('Alert limit reached. Upgrade to Plus for unlimited alerts.')
    return
  }
  const target: WatchTarget = {
    type: 'corridor',
    from: selectedCorridor.value.from,
    to: selectedCorridor.value.to,
    method: 'bank',
  }
  const label = `${selectedCorridor.value.from} → ${selectedCorridor.value.to}`
  modal.open({ target, label, source: 'dashboard' })
}

// Account section state
const activeAccountSection = ref<AccountSection>('profile')
const checkoutNotice = ref<'success' | 'cancel' | null>(null)

const billingHistory = ref<BillingInvoice[]>([])
const billingHistoryLoading = ref(false)
const billingHistoryError = ref<string | null>(null)
const billingActionMessage = ref<string | null>(null)

const billingSummary = computed(() => billing.value)
const billingStatus = computed(() => billingSummary.value?.status ?? (isPlus.value ? 'active' : 'free'))

const formatBillingDate = (value: string | null | undefined) => {
  if (!value) return 'Unavailable'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unavailable'
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatBillingAmount = (amount: number | null | undefined, currency: string | null | undefined) => {
  if (amount === null || amount === undefined || !currency) return '—'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`
  }
}

const billingStatusBadge = computed(() => {
  const status = billingStatus.value
  if (status === 'active' || status === 'trialing') {
    return { label: 'Active', classes: 'bg-emerald-100 text-emerald-700' }
  }
  if (status === 'past_due') {
    return { label: 'Past due', classes: 'bg-amber-100 text-amber-700' }
  }
  if (status === 'canceled' || status === 'incomplete_expired') {
    return { label: 'Canceled', classes: 'bg-slate-100 text-slate-600' }
  }
  return { label: status ? status.replace(/_/g, ' ') : 'Free', classes: 'bg-slate-100 text-slate-600' }
})

const notificationSettings = ref({
  rateAlerts: true,
  weeklySummary: true,
  marketUpdates: false,
  productUpdates: true,
  promotional: false,
  pushEnabled: false,
})

const securitySettings = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordUpdateLoading = ref(false)
const passwordUpdateError = ref<string | null>(null)
const passwordUpdateSuccess = ref(false)

const privacySettings = ref({
  analytics: true,
  personalization: true,
})

// Profile editing
const profileName = ref('')
const profileSaved = ref(false)

watch(() => user.value?.name, (name) => {
  if (name) profileName.value = name
}, { immediate: true })

watch(
  () => route.query.checkout,
  (value) => {
    void handleCheckoutNotice(value)
  },
  { immediate: true },
)

watch(
  () => activeAccountSection.value,
  (section) => {
    if (section === 'billing' && isPlus.value) {
      void fetchBillingHistory()
    }
    if (section === 'security' && isAuthenticated.value) {
      void fetchSessions()
    }
  },
)

watch(
  () => isPlus.value,
  (value) => {
    if (value && activeAccountSection.value === 'billing') {
      void fetchBillingHistory(true)
    }
  },
)

async function saveProfile() {
  const trimmed = profileName.value.trim()
  if (!trimmed) return

  try {
    await updateProfile({ name: trimmed })
    profileSaved.value = true
    setTimeout(() => {
      profileSaved.value = false
    }, 3000)
  } catch (error) {
    console.warn('Profile update failed', error)
  }
}

async function handlePasswordUpdate() {
  passwordUpdateError.value = null
  passwordUpdateSuccess.value = false

  const currentPassword = securitySettings.value.currentPassword.trim()
  const newPassword = securitySettings.value.newPassword.trim()
  const confirmPassword = securitySettings.value.confirmPassword.trim()

  if (!currentPassword) {
    passwordUpdateError.value = 'Enter your current password.'
    return
  }

  if (newPassword.length < 8) {
    passwordUpdateError.value = 'New password must be at least 8 characters.'
    return
  }

  if (newPassword !== confirmPassword) {
    passwordUpdateError.value = 'Passwords do not match.'
    return
  }

  passwordUpdateLoading.value = true
  try {
    const result = await updatePasswordWithCurrent(currentPassword, newPassword)
    if (!result.ok) {
      passwordUpdateError.value = result.error || 'Unable to update password.'
      return
    }
    securitySettings.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
    passwordUpdateSuccess.value = true
    setTimeout(() => {
      passwordUpdateSuccess.value = false
    }, 3000)
  } catch (error) {
    passwordUpdateError.value =
      error instanceof Error ? error.message : 'Unable to update password.'
  } finally {
    passwordUpdateLoading.value = false
  }
}

const formatSessionActivity = (timestamp: string) => {
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) return 'Recently active'
  const diffMs = Date.now() - parsed.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 5) return 'Active now'
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hours ago`
  return parsed.toLocaleDateString()
}

const sessionMeta = (session: { device_type: string | null; location: string | null }) => {
  const device = session.device_type
    ? session.device_type.charAt(0).toUpperCase() + session.device_type.slice(1)
    : 'Unknown device'
  const location = session.location || 'Unknown location'
  return `${device} • ${location}`
}

const handleRevokeSession = async (sessionId: string) => {
  try {
    await revokeSession(sessionId)
  } catch (error) {
    console.warn('Failed to revoke session', error)
  }
}

const handleRevokeAllSessions = async () => {
  const current = sessions.value.find((session) => session.is_current)
  try {
    await revokeAllSessions(current?.session_id)
  } catch (error) {
    console.warn('Failed to revoke sessions', error)
  }
}

const fetchBillingHistory = async (force = false) => {
  if (!isPlus.value) return
  if (billingHistoryLoading.value) return
  if (billingHistory.value.length > 0 && !force) return

  billingHistoryLoading.value = true
  billingHistoryError.value = null

  try {
    const response = await request<{ invoices: BillingInvoice[] }>('/billing/history')
    billingHistory.value = Array.isArray(response.invoices) ? response.invoices : []
  } catch (error: any) {
    billingHistoryError.value = error?.message || 'Unable to load billing history.'
  } finally {
    billingHistoryLoading.value = false
  }
}

async function handleCheckoutNotice(value: unknown) {
  if (value === 'success') {
    checkoutNotice.value = 'success'
    await refreshPlan()
    await fetchBillingHistory(true)
  } else if (value === 'cancel') {
    checkoutNotice.value = 'cancel'
  } else {
    checkoutNotice.value = null
    return
  }

  const nextQuery = { ...route.query } as Record<string, unknown>
  delete nextQuery.checkout
  void navigateTo({ path: route.path, query: nextQuery, replace: true })
}

// Export functionality
const showExportModal = ref(false)
const isExporting = ref(false)
const selectedExportItems = ref<string[]>([])

const getDefaultDateFrom = () => {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date.toISOString().split('T')[0]
}

const exportSettings = ref({
  dataType: 'history' as 'history' | 'watchlist' | 'alerts' | 'all',
  dateRange: '30d' as '7d' | '30d' | '90d',
  dateFrom: getDefaultDateFrom(),
  dateTo: new Date().toISOString().split('T')[0],
  format: 'csv' as 'csv' | 'pdf',
})

const exportStatusMessage = ref<string | null>(null)
const exportErrorMessage = ref<string | null>(null)
const exportJobId = ref<string | null>(null)
let exportPollTimer: ReturnType<typeof setInterval> | null = null

const clearExportPolling = () => {
  if (exportPollTimer) {
    clearInterval(exportPollTimer)
    exportPollTimer = null
  }
}

onBeforeUnmount(() => {
  clearExportPolling()
  stopOpsAutoRefresh()
})

const triggerDownload = (url: string) => {
  if (import.meta.client) {
    window.open(url, '_blank', 'noopener')
  }
}

const pollExportStatus = async (jobId: string) => {
  clearExportPolling()
  exportPollTimer = setInterval(async () => {
    try {
      const response = await exportsApi.getExportStatus(jobId)
      const status = response.job.status
      if (status === 'failed') {
        exportErrorMessage.value = response.job.error || 'Export failed. Please try again.'
        isExporting.value = false
        clearExportPolling()
        return
      }
      if (status === 'done') {
        const download = await exportsApi.getExportDownloadUrl(jobId)
        exportStatusMessage.value = 'Export ready. Downloading...'
        triggerDownload(download.url)
        isExporting.value = false
        clearExportPolling()
      } else {
        exportStatusMessage.value = 'Export in progress...'
      }
    } catch (error: any) {
      exportErrorMessage.value = error?.message || 'Failed to check export status.'
      isExporting.value = false
      clearExportPolling()
    }
  }, 2000)
}

function setExportDateRange(range: '7d' | '30d' | '90d') {
  const today = new Date()
  exportSettings.value.dateTo = today.toISOString().split('T')[0]
  
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)
  exportSettings.value.dateFrom = fromDate.toISOString().split('T')[0]
  exportSettings.value.dateRange = range
}

// Initialize date range when modal opens
watch(() => showExportModal.value, (isOpen) => {
  if (isOpen) {
    setExportDateRange(exportSettings.value.dateRange || '30d')
  }
})

async function handleExport() {
  exportErrorMessage.value = null
  exportStatusMessage.value = null
  isExporting.value = true

  try {
    const response = await exportsApi.createExport({
      dataType: exportSettings.value.dataType,
      format: exportSettings.value.format,
      dateFrom: exportSettings.value.dateFrom,
      dateTo: exportSettings.value.dateTo,
      itemIds: selectedExportItems.value.length > 0 ? selectedExportItems.value : undefined,
    })

    exportJobId.value = response.job.id
    exportStatusMessage.value = 'Export queued. We will start processing shortly.'
    await pollExportStatus(response.job.id)
  } catch (error: any) {
    exportErrorMessage.value = error?.message || 'Failed to start export.'
    isExporting.value = false
  }
}

function handleExportSelected() {
  showExportModal.value = true
}

const gdprExportStatus = ref<string | null>(null)
const gdprExportError = ref<string | null>(null)
const showDeleteAccountModal = ref(false)
const deleteAccountConfirmText = ref('')
const deleteAccountConfirmed = ref(false)
const deleteAccountError = ref<string | null>(null)
const deleteAccountWarning = ref<string | null>(null)

const deleteAccountReady = computed(() => {
  return deleteAccountConfirmed.value && deleteAccountConfirmText.value.trim().toUpperCase() === 'DELETE'
})

const requestGdprExport = async () => {
  gdprExportStatus.value = null
  gdprExportError.value = null
  try {
    const response = await dataExportApi.requestExport()
    gdprExportStatus.value = `Export requested (job ${response.job.id}). We'll notify you when it's ready.`
  } catch (error: any) {
    gdprExportError.value = error?.message || 'Failed to request GDPR export.'
  }
}

const openDeleteAccountModal = () => {
  showDeleteAccountModal.value = true
  deleteAccountConfirmText.value = ''
  deleteAccountConfirmed.value = false
  deleteAccountError.value = null
  deleteAccountWarning.value = null
}

const closeDeleteAccountModal = () => {
  if (accountApi.deleting.value) return
  showDeleteAccountModal.value = false
  deleteAccountConfirmText.value = ''
  deleteAccountConfirmed.value = false
  deleteAccountError.value = null
  deleteAccountWarning.value = null
}

const handleDeleteAccount = async () => {
  deleteAccountError.value = null
  deleteAccountWarning.value = null

  if (!deleteAccountReady.value) {
    deleteAccountError.value = 'Please confirm account deletion.'
    return
  }

  const result = await accountApi.deleteAccount()
  if (!result.ok) {
    deleteAccountError.value = result.error || 'Account deletion failed.'
    return
  }

  if (result.result?.warnings?.length) {
    deleteAccountWarning.value = result.result.warnings.join(', ')
  }
}

// Graph data
const graphData = computed(() => {
  const history = selectedSnapshot.value.history
  if (!history.length) return []
  const series = history.slice(-120)
  const values = series.map(point => point.rate).filter(Number.isFinite)
  if (!values.length) return []
  const minRate = Math.min(...values)
  const maxRate = Math.max(...values)
  const range = maxRate - minRate || 1
  return series.map((point, index) => {
    const x = series.length === 1 ? 400 : (index / (series.length - 1)) * 400
    const normalized = (point.rate - minRate) / range
    const y = 170 - (normalized * 160)
    return { x, y: Math.max(10, Math.min(170, y)) }
  })
})

const graphPoints = computed(() => graphData.value.map(d => `${d.x},${d.y}`).join(' '))

// Top Movers from Watchlist
const topMoversLimit = computed(() => isPlus.value ? 5 : 3)
const topMoversFromWatchlist = computed(() => {
  if (!watchlistItems.value.length) return []
  
  // Deduplicate by corridor (from-to pair) to prevent showing the same corridor multiple times
  const seen = new Set<string>()
  const uniqueItems = watchlistItems.value.filter((item) => {
    if (item.target.type !== 'corridor') return false
    const key = `${item.target.from}-${item.target.to}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  
  return uniqueItems
    .map((item) => {
      const snapshot = getWatchlistSnapshot(item.id)
      if (snapshot.change === null || snapshot.change === undefined) return null
      return { ...item, change: snapshot.change }
    })
    .filter((item): item is WatchlistItem & { change: number } => Boolean(item) && Number.isFinite(item.change))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, topMoversLimit.value)
})

const topMoversLoading = computed(() => {
  return watchlistItems.value.some(item => isWatchlistHistoryLoading(item.id))
})

async function handleAddWatchlist() {
  if (watchlistLimitReached.value) {
    alert('Watchlist limit reached. Upgrade to Plus for unlimited corridors.')
    return
  }
  const target: WatchTarget = {
    type: 'corridor',
    from: newWatchlist.value.from,
    to: newWatchlist.value.to,
    method: 'bank',
  }
  const label = `${newWatchlist.value.from} → ${newWatchlist.value.to}`
  const result = await watchlistSave(target, { label })
  
  if (result.status === 'saved') {
    newWatchlist.value = { from: 'US', to: 'PH' }
  } else if (result.status === 'already_saved') {
    // Already in watchlist, just reset the form
    newWatchlist.value = { from: 'US', to: 'PH' }
  } else if (result.status === 'limit_reached' || result.status === 'error') {
    alert(result.message)
  }
}

const comparingCorridor = ref<string | null>(null)
const comparingSelectedCorridor = ref(false)

async function handleCompareClick(item: WatchlistItem) {
  if (comparingCorridor.value === item.id) return
  
  comparingCorridor.value = item.id
  
  const url = getCorridorUrl(item.target.from, item.target.to)
  
  try {
    await navigateTo(url)
  } finally {
    comparingCorridor.value = null
  }
}

async function handleCompareSelectedCorridor() {
  if (comparingSelectedCorridor.value) return
  
  comparingSelectedCorridor.value = true
  
  const url = getCorridorUrl(selectedCorridor.from, selectedCorridor.to)
  
  try {
    await navigateTo(url)
  } finally {
    comparingSelectedCorridor.value = false
  }
}

function openAlert(item: WatchlistItem) {
  modal.open({ target: item.target, label: item.label, source: 'dashboard' })
}

function openCreateAlert() {
  if (alertsLimitReached.value) {
    alert('Alert limit reached. Upgrade to Plus for unlimited alerts.')
    return
  }
  const first = watchlistItems.value[0]
  const fallbackTarget: WatchTarget = { type: 'corridor', from: 'US', to: 'PH', method: 'bank' }
  modal.open({
    target: first?.target ?? fallbackTarget,
    label: first?.label ?? 'US → PH',
    source: 'dashboard',
  })
}

function formatMethod(method: string | null | undefined): string {
  if (!method) return 'Bank'
  const methodMap: Record<string, string> = {
    bank: 'Bank',
    cash: 'Cash Pickup',
    wallet: 'Mobile Wallet',
    card: 'Card',
    bank_deposit: 'Bank',
    cash_pickup: 'Cash Pickup',
    mobile_wallet: 'Mobile Wallet',
  }
  return methodMap[method.toLowerCase()] || method.charAt(0).toUpperCase() + method.slice(1).replace(/_/g, ' ')
}

function formatTarget(target: WatchTarget) {
  if (target.type === 'corridor') return `${target.from} → ${target.to} • ${formatMethod(target.method)}`
  if (target.type === 'fxPair') return `${target.base}/${target.quote}`
  return ''
}

function formatRule(rule: AlertRule) {
  const op = rule.comparator === 'gte' ? '≥' : rule.comparator === 'lte' ? '≤' : rule.comparator === 'gt' ? '>' : '<'
  const currency = rule.metric === 'sendScore' ? '' : (rule.currency ? ` ${rule.currency}` : '')
  return `${rule.metric} ${op} ${rule.value}${currency}`
}

function formatComparator(comparator: string) {
  switch (comparator) {
    case 'gte': return '≥'
    case 'lte': return '≤'
    case 'gt': return '>'
    case 'lt': return '<'
    default: return comparator
  }
}

function formatFrequency(frequency: string) {
  switch (frequency) {
    case 'once': return 'Notify once'
    case 'daily': return 'Daily digest'
    case 'realtime': return 'Real-time alerts'
    default: return frequency
  }
}

function formatCurrency(amount: number, countryCode: string): string {
  const currency = getCurrencyForCountry(countryCode.toUpperCase()) || 'USD'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

function formatMetricLabel(metric: string) {
  switch (metric) {
    case 'recipientGets': return 'Recipient gets'
    case 'totalCost': return 'Total cost'
    case 'fee': return 'Fee'
    case 'rate': return 'Exchange rate'
    case 'midMarketRate': return 'Mid-market rate'
    case 'sendScore': return 'Intelligent Alert'
    case 'index': return 'Index'
    default: return metric
  }
}

function getWatchlistAlertCount(watchlistItemId: string) {
  return alertItems.value.filter(a => a.watchlistItemId === watchlistItemId).length
}

function getAlertSnapshot(alert: { watchlistItemId: string }) {
  return getWatchlistSnapshot(alert.watchlistItemId)
}

function getWatchlistChartData(itemId: string) {
  return getWatchlistSnapshot(itemId).history.map(point => point.rate)
}

function getWatchlistChartPoints(itemId: string) {
  const data = getWatchlistChartData(itemId)
  if (data.length < 2) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const width = 400
  const height = 120
  const padding = 15
  
  const points = data.map((rate, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
    const normalized = (rate - min) / range
    const y = height - padding - (normalized * (height - 2 * padding))
    return `${x},${y}`
  })
  
  return points.join(' ')
}

function getWatchlistChartPath(itemId: string) {
  const data = getWatchlistChartData(itemId)
  if (data.length < 2) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const width = 400
  const height = 120
  const padding = 15
  
  let path = ''
  data.forEach((rate, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
    const normalized = (rate - min) / range
    const y = height - padding - (normalized * (height - 2 * padding))
    if (i === 0) {
      path = `M ${x},${y}`
    } else {
      path += ` L ${x},${y}`
    }
  })
  
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding)
  const firstX = padding
  path += ` L ${lastX},${height} L ${firstX},${height} Z`
  
  return path
}

function getWatchlistChartCurrentY(itemId: string) {
  const data = getWatchlistChartData(itemId)
  if (data.length < 1) return 60
  const lastRate = data[data.length - 1]
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const height = 120
  const padding = 15
  const normalized = (lastRate - min) / range
  return height - padding - (normalized * (height - 2 * padding))
}

function getWatchlistStats(itemId: string) {
  const data = getWatchlistChartData(itemId)
  if (!data.length) {
    return {
      high: '—',
      low: '—',
      avg: '—',
    }
  }
  const min = Math.min(...data)
  const max = Math.max(...data)
  const avg = data.reduce((a, b) => a + b, 0) / data.length

  return {
    high: formatRateValue(max),
    low: formatRateValue(min),
    avg: formatRateValue(avg),
  }
}

function getAlertCorridor(alert: { watchlistItemId: string }) {
  const item = watchlistFindById(alert.watchlistItemId)
  if (item?.target?.type === 'corridor') {
    return { from: item.target.from, to: item.target.to }
  }
  return { from: 'US', to: 'PH' }
}

function getAlertProgress(alert: { rule: AlertRule; watchlistItemId: string }) {
  const snapshot = getAlertSnapshot(alert)
  const current = snapshot.rateValue
  const target = alert.rule.value
  if (!current || !Number.isFinite(current) || !Number.isFinite(target) || target <= 0) {
    return 0
  }
  if (alert.rule.comparator === 'gte' || alert.rule.comparator === 'gt') {
    return (current / target) * 100
  }
  return (target / current) * 100
}

function editAlert(alert: { id: string; watchlistItemId: string }) {
  const existingAlert = alertsFindById(alert.id)
  const item = watchlistFindById(alert.watchlistItemId)
  if (item && existingAlert) {
    modal.open({ 
      target: item.target, 
      label: item.label, 
      source: 'dashboard',
      alertId: alert.id,
    })
  }
}

useHead({
  title: 'Dashboard | Remit-Scout',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
