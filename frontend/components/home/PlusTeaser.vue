<template>
  <section class="py-16 sm:py-20 bg-slate-900">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full mb-6">
          <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span class="text-sm font-semibold text-blue-400">Remit-Scout Plus</span>
        </div>
        <h2 class="text-4xl sm:text-5xl font-bold text-white mb-4">
          Get More Out of Remit-Scout
        </h2>
        <p class="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed break-words">
          Unlock advanced features like unlimited alerts, extended history tracking, data exports, and an ad-free experience. Perfect for frequent senders who want deeper insights and better control.
        </p>
      </div>

      <!-- What Plus Does -->
      <div class="bg-slate-800 rounded-2xl border-2 border-slate-700 p-8 sm:p-10 mb-10 shadow-lg">
        <h2 class="text-3xl font-bold text-white mb-6 text-center">
          What is Plus?
        </h2>
        <p class="text-lg text-slate-300 mb-8 text-center max-w-3xl mx-auto leading-relaxed break-words">
          For people who send money repeatedly. Plus monitors the market 24/7 and notifies you when rates improve, giving you deeper insights and unlimited tracking capabilities.
        </p>
        
        <!-- Free vs Plus Comparison -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Free Account -->
          <div class="rounded-xl border-2 border-slate-600 p-6 bg-slate-900">
            <div class="flex items-center gap-2 mb-4">
              <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h4 class="text-xl font-bold text-white">Free Account</h4>
            </div>
            <ul class="space-y-3">
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-slate-300"><strong>3 watchlist corridors</strong></span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-slate-300"><strong>1 active alert</strong></span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-slate-300"><strong>30-day history</strong></span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-slate-300">Basic email alerts</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-slate-300">Ads and sponsored placements</span>
              </li>
            </ul>
          </div>

          <!-- Plus Account -->
          <div class="rounded-xl border-2 border-blue-600 p-6 bg-blue-600 relative">
            <div class="absolute -top-3 right-6 bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
              PLUS
            </div>
            <div class="flex items-center gap-2 mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <h4 class="text-xl font-bold text-white">Plus Account</h4>
            </div>
            <ul class="space-y-3">
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-white"><strong>Unlimited watchlist</strong></span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-white"><strong>Unlimited alerts</strong> with smart types</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-white"><strong>365-day history</strong> with volatility insights</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-white">Weekly watchlist digest emails</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-white">Export data to CSV or PDF for tax records and accounting</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-white"><strong>Ad-free</strong> experience</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Key Features in Detail -->
      <div class="mb-12">
        <h3 class="text-3xl font-bold text-white text-center mb-10">
          What You Get with Plus
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Feature 1 -->
          <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6 hover:border-blue-600 hover:shadow-lg transition-all">
            <div class="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h4 class="text-lg font-bold text-white mb-2">
              Smart Alerts
            </h4>
            <p class="text-sm text-slate-300 leading-relaxed mb-4">
              Get notified when rates hit your target, when the best provider changes, or when your recipient gets more money. Set it once, let it run.
            </p>
            <div class="text-xs text-slate-500">
              Free: 1 alert, Plus: Unlimited
            </div>
          </div>

          <!-- Feature 2 -->
          <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6 hover:border-blue-600 hover:shadow-lg transition-all">
            <div class="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 class="text-lg font-bold text-white mb-2">
              365-Day History
            </h4>
            <p class="text-sm text-slate-300 leading-relaxed mb-4">
              See complete rate history, volatility patterns, and best send windows. Know when rates typically improve so you can plan transfers better.
            </p>
            <div class="text-xs text-slate-500">
              Free: 30 days, Plus: 365 days
            </div>
          </div>

          <!-- Feature 3 -->
          <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6 hover:border-blue-600 hover:shadow-lg transition-all">
            <div class="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h4 class="text-lg font-bold text-white mb-2">
              Unlimited Watchlist
            </h4>
            <p class="text-sm text-slate-300 leading-relaxed mb-4">
              Track as many corridors as you need. Get weekly digest emails summarizing what changed across your entire watchlist.
            </p>
            <div class="text-xs text-slate-500">
              Free: 3 corridors, Plus: Unlimited
            </div>
          </div>

          <!-- Feature 4 -->
          <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6 hover:border-blue-600 hover:shadow-lg transition-all">
            <div class="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 class="text-lg font-bold text-white mb-2">
              Export Data
            </h4>
            <p class="text-sm text-slate-300 leading-relaxed mb-4">
              Download your complete transfer history and market data in CSV or PDF format. Perfect for tax records and accounting.
            </p>
            <div class="text-xs text-slate-500">
              Plus only
            </div>
          </div>

          <!-- Feature 5 -->
          <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6 hover:border-blue-600 hover:shadow-lg transition-all">
            <div class="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h4 class="text-lg font-bold text-white mb-2">
              No Ads
            </h4>
            <p class="text-sm text-slate-300 leading-relaxed mb-4">
              No sponsor banners, no display ads, no promotional clutter. Focus on finding the best rate for your transfer.
            </p>
            <div class="text-xs text-slate-500">
              Plus only
            </div>
          </div>

          <!-- Feature 6 -->
          <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6 hover:border-blue-600 hover:shadow-lg transition-all">
            <div class="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 class="text-lg font-bold text-white mb-2">
              100% Independent
            </h4>
            <p class="text-sm text-slate-300 leading-relaxed mb-4">
              Plus never changes rankings. All comparisons remain purely data-driven. Plus funds the platform without ads.
            </p>
            <div class="text-xs text-slate-500">
              Rankings stay the same
            </div>
          </div>
        </div>
      </div>

      <!-- Trust Message -->
      <div class="bg-slate-800 border-2 border-slate-700 rounded-xl p-8 mb-10 text-center">
        <div class="flex items-center justify-center gap-3 mb-3">
          <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4 class="text-lg font-bold text-white">How Plus Fits Our Independence</h4>
        </div>
        <p class="text-base text-slate-300 leading-relaxed max-w-3xl mx-auto break-words">
          Plus helps fund RemitScout without pay-to-rank sponsorships. Plus users see fewer ads, but <strong>scoring and rankings remain identical for everyone.</strong> Whether free or Plus, you see the same data-driven comparisons.
        </p>
      </div>

      <!-- CTA -->
      <div class="text-center">
        <NuxtLink
          to="/plus"
          class="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white text-lg font-semibold shadow-xl hover:shadow-2xl transition-all group"
        >
          <span>See Full Features and Pricing</span>
          <svg class="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
        <p class="mt-4 text-sm text-slate-400">
          Start with a free account, upgrade anytime, cancel anytime
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>






