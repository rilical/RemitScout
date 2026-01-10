<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="py-16 sm:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <div class="flex justify-center mb-8">
            <img
              src="/png/SVG/FULL_LOGO_PLUS.svg"
              alt="Remit-Scout Plus"
              class="h-20 sm:h-24 object-contain"
            />
          </div>
          <h1 class="text-5xl sm:text-6xl font-bold text-slate-900 mb-6">
            Never Miss the Perfect Rate
          </h1>
          <p class="text-xl text-slate-700 max-w-4xl mx-auto mb-4 leading-relaxed">
            Plus tracks your corridors 24/7, sends instant alerts when rates improve, and keeps your complete transfer history. 
            Set your target rate once and let Plus monitor the market for you. When rates hit your target, we notify you immediately so you can transfer at the perfect moment.
          </p>
          <p class="text-lg text-slate-600 max-w-3xl mx-auto">
            Save time and money by letting Plus do the watching while you focus on what matters.
          </p>

          <!-- Auth Status Display -->
          <div v-if="isAuthenticated" class="inline-flex items-center gap-3 px-6 py-3 bg-slate-800 border border-slate-700 rounded-lg mt-8">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-emerald-400" />
              <span class="text-sm text-slate-300">Signed in</span>
            </div>
            <span class="text-slate-600">•</span>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold" :class="isPlus ? 'text-blue-400' : 'text-slate-400'">
                {{ isPlus ? 'Plus Member' : 'Free Plan' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Comparison -->
    <section class="py-16 sm:py-20 bg-slate-900">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h2>
          <p class="text-lg text-slate-300">
            Get the best rates automatically. Plus saves you time and money on every transfer.
          </p>
        </div>

        <!-- Billing Toggle -->
        <div class="flex items-center justify-center gap-4 mb-8">
          <span class="text-sm font-medium text-white">Monthly</span>
          <button
            @click="billingInterval = billingInterval === 'month' ? 'year' : 'month'"
            :class="['relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-900', billingInterval === 'year' ? 'bg-blue-600' : 'bg-blue-700']"
            role="switch"
            :aria-checked="billingInterval === 'year'"
          >
            <span
              :class="['inline-block h-5 w-5 transform rounded-full bg-white transition-transform', billingInterval === 'year' ? 'translate-x-8' : 'translate-x-1']"
            />
          </button>
          <span class="text-sm font-medium text-white">Annual</span>
          <span v-if="billingInterval === 'year'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Save 56%
          </span>
        </div>

        <div :class="['grid grid-cols-1 gap-8 max-w-6xl mx-auto', FEATURE_FLAGS.PULE_ENABLED ? 'lg:grid-cols-3' : 'lg:grid-cols-2']">
          <!-- Free Plan -->
          <div class="bg-white rounded-3xl border-4 border-slate-300 p-8 flex flex-col shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full">
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-slate-900 mb-2">Free</h3>
              <p class="text-slate-600 mb-4">For occasional senders</p>
              <div class="text-5xl font-bold text-slate-900 mb-1">$0</div>
              <div class="text-sm text-slate-500 font-medium">forever</div>
            </div>

            <ul class="space-y-4 mb-8 flex-grow">
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-slate-700 font-medium">3 watchlist corridors</span>
                  <p class="text-xs text-slate-500 mt-1">Save your most-used routes</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-slate-700 font-medium">1 active alert</span>
                  <p class="text-xs text-slate-500 mt-1">Get notified when rates change</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-slate-700 font-medium">30-day rate history</span>
                  <p class="text-xs text-slate-500 mt-1">See recent trends</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-slate-700 font-medium">Basic email alerts</span>
                  <p class="text-xs text-slate-500 mt-1">Daily updates</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <span class="text-slate-400 line-through">Export data</span>
                  <p class="text-xs text-slate-400 mt-1">Plus only</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <span class="text-slate-400 line-through">Ad-free experience</span>
                  <p class="text-xs text-slate-400 mt-1">Plus only</p>
                </div>
              </li>
            </ul>

            <button
              v-if="!isAuthenticated"
              @click="navigateTo('/sign-up')"
              class="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all mt-auto shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started Free
            </button>
            <div v-else-if="!isPlus" class="w-full py-3.5 bg-slate-100 text-slate-600 rounded-xl font-semibold text-center mt-auto border-2 border-slate-200">
              Current Plan
            </div>
            <button
              v-else
              disabled
              class="w-full py-3.5 bg-slate-100 text-slate-400 rounded-xl font-semibold cursor-not-allowed mt-auto border-2 border-slate-200"
            >
              Not Available
            </button>
          </div>

          <!-- Plus Plan -->
          <div class="bg-blue-600 rounded-3xl border-4 border-blue-400 p-8 relative flex flex-col shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full">
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2">Plus</h3>
              <p class="text-white/90 mb-4">For regular senders</p>
              <div class="text-5xl font-bold text-white mb-1">{{ billingInterval === 'month' ? '$6' : '$32' }}</div>
              <div class="text-sm text-white/80 font-medium">{{ billingInterval === 'month' ? 'per month' : 'per year' }}</div>
            </div>

            <ul class="space-y-4 mb-8 flex-grow">
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-white font-semibold">Unlimited watchlist</span>
                  <p class="text-xs text-white/80 mt-1">Track as many corridors as you need</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-white font-semibold">Unlimited alerts</span>
                  <p class="text-xs text-white/80 mt-1">Set alerts for every corridor you use</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-white font-semibold">365-day rate history</span>
                  <p class="text-xs text-white/80 mt-1">Full year of data</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-white font-semibold">Real-time alerts</span>
                  <p class="text-xs text-white/80 mt-1">Instant notifications</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-white font-semibold">Export data</span>
                  <p class="text-xs text-white/80 mt-1">CSV and PDF formats</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-white font-semibold">Ad-free experience</span>
                  <p class="text-xs text-white/80 mt-1">No banners or ads</p>
                </div>
              </li>
            </ul>

            <button
              v-if="!isAuthenticated"
              @click="navigateTo('/sign-up')"
              class="w-full py-3.5 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] mt-auto"
            >
              Get Started
            </button>
            <button
              v-else-if="!isPlus"
              @click="handleUpgrade"
              class="w-full py-3.5 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] mt-auto disabled:cursor-not-allowed disabled:opacity-70"
              :disabled="billingActions.checkoutLoading || billingActions.portalLoading"
            >
              {{ billingActions.checkoutLoading ? 'Starting…' : 'Upgrade to Plus' }}
            </button>
            <div v-else class="w-full py-3.5 bg-white/20 border-2 border-white/40 text-white rounded-xl font-bold text-center mt-auto">
              Current Plan
            </div>
          </div>

          <!-- Enterprise Plan -->
          <div v-if="FEATURE_FLAGS.PULE_ENABLED" class="bg-slate-900 rounded-3xl border-4 border-slate-600 p-8 flex flex-col shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2">Enterprise</h3>
              <p class="text-slate-300 mb-4">For businesses</p>
              <div class="text-5xl font-bold text-white mb-1">Let's talk</div>
            </div>

            <ul class="space-y-4 mb-8 flex-grow">
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-white font-semibold">Everything in Plus</span>
                  <p class="text-xs text-slate-400 mt-1">All Plus features included</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-white font-semibold">Custom reports</span>
                  <p class="text-xs text-slate-400 mt-1">Tailored to your business needs</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-white font-semibold">Extended rate history</span>
                  <p class="text-xs text-slate-400 mt-1">Access historical data beyond 365 days for deeper analysis and trend identification</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-white font-semibold">Priority support</span>
                  <p class="text-xs text-slate-400 mt-1">Dedicated account manager</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-white font-semibold">API access</span>
                  <p class="text-xs text-slate-400 mt-1">Integrate with your systems</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span class="text-white font-semibold">And more</span>
                </div>
              </li>
            </ul>

            <NuxtLink
              to="/contact"
              class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all text-center block mt-auto shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Contact Sales
            </NuxtLink>
          </div>
        </div>

        <p class="text-center text-sm text-slate-300 mt-8">
          All plans include access to compare 30+ providers across 150+ corridors • Cancel anytime
        </p>
      </div>
    </section>

    <!-- Our Impact -->
    <TrustMetricsStrip bg-class="bg-blue-600" />

    <!-- Features Breakdown -->
    <section class="py-16 bg-slate-900">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-white mb-4">
            Everything You Get with Plus
          </h2>
          <p class="text-lg text-slate-300">
            Built for people who send money regularly
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6">
            <div class="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Smart Rate Alerts</h3>
            <p class="text-sm text-slate-300">
              Set target rates and get notified instantly when the market hits your price. Never miss a good rate again.
            </p>
          </div>

          <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6">
            <div class="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Full Year History</h3>
            <p class="text-sm text-slate-300">
              Access 365 days of rate data. See volatility patterns and identify the best times to transfer money.
            </p>
          </div>

          <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6">
            <div class="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Export Your Data</h3>
            <p class="text-sm text-slate-300">
              Download your transfer history and market data in CSV or PDF format. Perfect for tax records and accounting.
            </p>
          </div>

          <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6">
            <div class="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Unlimited Watchlist</h3>
            <p class="text-sm text-slate-300">
              Track as many corridors as you need. Get weekly digest emails summarizing what changed across your entire watchlist.
            </p>
          </div>

          <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6">
            <div class="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Ad-Free Experience</h3>
            <p class="text-sm text-slate-300">
              No sponsor banners, no display ads, no promotional clutter. Focus on finding the best rate for your transfer.
            </p>
          </div>

          <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6">
            <div class="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Still 100% Independent</h3>
            <p class="text-sm text-slate-300">
              Plus never changes rankings. All comparisons remain purely data-driven. Rankings stay identical for everyone.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 bg-slate-50">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-slate-900 text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div class="space-y-4">
          <details class="bg-white rounded-lg border border-slate-200 p-6 group">
            <summary class="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>How do I cancel my subscription?</span>
              <svg class="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p class="mt-4 text-slate-600 text-sm">
              You can cancel anytime from your account settings. Your Plus features will remain active until the end of your billing period.
            </p>
          </details>

          <details class="bg-white rounded-lg border border-slate-200 p-6 group">
            <summary class="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>Does Plus change how rates are ranked?</span>
              <svg class="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p class="mt-4 text-slate-600 text-sm">
              No. Plus is purely a subscription for enhanced features. All rankings and comparisons remain 100% data-driven and identical for free and Plus users.
            </p>
          </details>

          <details class="bg-white rounded-lg border border-slate-200 p-6 group">
            <summary class="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>What payment methods do you accept?</span>
              <svg class="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p class="mt-4 text-slate-600 text-sm">
              We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through Stripe.
            </p>
          </details>

          <details class="bg-white rounded-lg border border-slate-200 p-6 group">
            <summary class="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>Can I switch between plans?</span>
              <svg class="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p class="mt-4 text-slate-600 text-sm">
              Yes! You can upgrade to Plus anytime. If you downgrade to Free, you'll keep Plus features until the end of your billing period.
            </p>
          </details>
        </div>
      </div>
    </section>

    <!-- Get Started CTA -->
    <section v-if="!isAuthenticated" class="py-16 bg-slate-900">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-2xl border-2 border-slate-700 p-8 sm:p-12 text-center">
          <h2 class="text-3xl font-bold text-slate-900 mb-4">
            Get Started with Remit-Scout
          </h2>
          <p class="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Create a free account to start tracking rates and setting alerts. Upgrade to Plus anytime for unlimited access.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink
              to="/sign-up"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
            >
              <span>Create Free Account</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </NuxtLink>
            <NuxtLink
              to="/sign-in"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-lg font-semibold transition-all"
            >
              <span>Sign In</span>
            </NuxtLink>
          </div>
          <p class="mt-6 text-sm text-slate-500">
            No credit card required for free account
          </p>
        </div>
      </div>
    </section>

    <!-- Got Questions CTA -->
    <section class="py-16 bg-blue-600">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-4xl font-bold text-white mb-4">
          Got Any Questions?
        </h2>
        <p class="text-xl text-white/90 mb-8">
          Our team is here to help you get the most out of Remit-Scout
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink
            to="/send-money"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-blue-50 text-blue-600 rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Compare Now</span>
          </NuxtLink>
          <NuxtLink
            to="/contact"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-blue-50 text-blue-600 rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Contact Us</span>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { FEATURE_FLAGS } from '~/utils/constants'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'

const { isAuthenticated } = useAuth()
const { plan, isPlus } = useEntitlements()
const billingActions = useBilling()
const runtimeConfig = useRuntimeConfig()

const billingInterval = useState<'month' | 'year'>('billingInterval', () => 'month')
const devAutoUpgrade = computed(() => Boolean(runtimeConfig.public.devAuthEnabled) || import.meta.dev)

async function handleUpgrade() {
  if (!isAuthenticated.value) {
    await navigateTo({ path: '/sign-in', query: { redirect: '/plus' } })
    return
  }

  if (isPlus.value) {
    const portalResult = await billingActions.openBillingPortal()
    if (!portalResult.ok) {
      alert(portalResult.error || 'Unable to open billing portal.')
    }
    return
  }

  const checkoutResult = await billingActions.createCheckoutSession('plus', billingInterval.value)
  if (checkoutResult.ok) {
    if (devAutoUpgrade.value && checkoutResult.sessionId) {
      const verifyResult = await billingActions.verifyCheckoutSession(checkoutResult.sessionId)
      if (verifyResult.ok) {
        await navigateTo('/plus/success')
        return
      }
    }

    if (checkoutResult.url && process.client) {
      window.location.href = checkoutResult.url
      return
    }
  }

  alert(checkoutResult.error || 'Unable to start checkout.')
}

useHead({
  title: 'Plus - Never Miss the Perfect Rate | Remit-Scout',
  meta: [
    { 
      name: 'description', 
      content: 'Upgrade to Remit-Scout Plus for unlimited rate alerts, 365-day history, data exports, and ad-free experience. Track rates automatically 24/7.' 
    },
  ],
})
</script>
