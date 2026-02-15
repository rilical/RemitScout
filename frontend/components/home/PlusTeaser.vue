<template>
  <section class="py-16 sm:py-20 bg-surface">
    <div class="container">
      <!-- Header -->
      <div class="text-center mb-12">
        <NuxtImg
          src="/png/SVG/FULL_LOGO_PLUS.svg"
          alt="Remit-Scout Plus"
          width="304"
          height="64"
          loading="lazy"
          class="h-12 sm:h-16 object-contain mx-auto mb-6"
        />
        <h2 class="text-h1 font-bold text-neutral-900 mb-4">
          Get More Out of <span class="text-brand-600">Remit-Scout</span>
        </h2>
        <p class="text-h4 text-neutral-600 max-w-3xl mx-auto leading-relaxed break-words">
          Unlock Pulse access, 16 smart alerts, 365-day history, data exports, and an ad-free experience. Perfect for frequent senders who want deeper insights and better control.
        </p>
      </div>

      <!-- What Plus Does -->
      <div class="bg-neutral-800 rounded-2xl border-2 border-neutral-700 p-8 sm:p-10 mb-10 shadow-lg">
        <h2 class="text-h2 font-bold text-white mb-6 text-center">
          What is Plus?
        </h2>
        <p class="text-body-lg text-neutral-300 mb-8 text-center max-w-3xl mx-auto leading-relaxed break-words">
          For people who send money repeatedly. Plus monitors the market 24/7 and notifies you when rates improve, giving you deeper insights and higher limits (up to 16 watchlist corridors and 16 alerts).
        </p>

        <!-- Free vs Plus Comparison -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 min-w-0">
          <!-- Free Account -->
          <div class="rounded-xl border-2 border-neutral-600 p-8 bg-neutral-900">
            <div class="flex items-center gap-3 mb-6">
              <svg
                class="w-7 h-7 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <h4 class="text-h3 font-bold text-white">
                Free Account
              </h4>
            </div>
            <ul class="space-y-4">
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    class="w-3.5 h-3.5 text-neutral-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span class="text-body text-neutral-300 leading-relaxed"><strong class="text-white">3 watchlist corridors</strong></span>
              </li>
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    class="w-3.5 h-3.5 text-neutral-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span class="text-body text-neutral-300 leading-relaxed"><strong class="text-white">1 alert</strong></span>
              </li>
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    class="w-3.5 h-3.5 text-neutral-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span class="text-body text-neutral-300 leading-relaxed"><strong class="text-white">30-day history</strong> for your transfer</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    class="w-3.5 h-3.5 text-neutral-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span class="text-body text-neutral-300 leading-relaxed">Compare 50+ providers</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    class="w-3.5 h-3.5 text-neutral-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span class="text-body text-neutral-300 leading-relaxed">Ads and sponsored placements</span>
              </li>
            </ul>
          </div>

          <!-- Plus Account -->
          <div class="rounded-xl border-2 border-brand-600 p-8 bg-brand-600 relative">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-9 h-9 rounded-lg bg-surface/20 flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="3"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h4 class="text-h3 font-bold text-white">
                Plus Account
              </h4>
            </div>
            <ul class="space-y-4">
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-surface/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    class="w-3.5 h-3.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span class="text-body text-white leading-relaxed"><strong>Up to 16 watchlist corridors</strong></span>
              </li>
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-surface/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    class="w-3.5 h-3.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span class="text-body text-white leading-relaxed"><strong>Up to 16 intelligent alerts</strong></span>
              </li>
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-surface/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    class="w-3.5 h-3.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span class="text-body text-white leading-relaxed"><strong>365-day history</strong> for your transfer</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-surface/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    class="w-3.5 h-3.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span class="text-body text-white leading-relaxed">Export data to CSV or PDF</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-surface/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    class="w-3.5 h-3.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <span class="text-body text-white leading-relaxed"><strong>Ad-free</strong> experience</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Key Features in Detail -->
      <div class="mb-12">
        <h3 class="text-h2 font-bold text-neutral-900 text-center mb-10">
          What You Get with Plus
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-0">
          <!-- Feature 1 -->
          <div class="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6 hover:border-brand-600 hover:shadow-lg transition-all flex flex-col">
            <div class="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center mb-4">
              <svg
                class="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h4 class="text-body-lg font-bold text-white mb-2">
              16 Intelligent Alerts
            </h4>
            <p class="text-body-sm text-neutral-300 leading-relaxed mb-4">
              Smart score alerts analyze rate patterns and volatility, scoring 0–100. Only triggers when score hits your threshold. Weekly smart alerts plus daily alerts for Plus.
            </p>
            <div class="text-body-sm text-rs-muted mt-auto">
              Free: 1 alert | Plus: 16 alerts
            </div>
          </div>

          <!-- Feature 2 -->
          <div class="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6 hover:border-brand-600 hover:shadow-lg transition-all flex flex-col">
            <div class="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center mb-4">
              <svg
                class="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 class="text-body-lg font-bold text-white mb-2">
              365-Day History for Your Transfer
            </h4>
            <p class="text-body-sm text-neutral-300 leading-relaxed mb-4">
              See how rates changed over the past year for your corridors. Track trends, spot volatility patterns, and time your transfers for better rates.
            </p>
            <div class="text-body-sm text-rs-muted mt-auto">
              Free: 30 days | Plus: 365 days
            </div>
          </div>

          <!-- Feature 3 -->
          <div class="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6 hover:border-brand-600 hover:shadow-lg transition-all flex flex-col">
            <div class="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center mb-4">
              <svg
                class="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h4 class="text-body-lg font-bold text-white mb-2">
              16 Watchlist Corridors
            </h4>
            <p class="text-body-sm text-neutral-300 leading-relaxed mb-4">
              Monitor up to 16 corridors you send to. Weekly digest emails show what changed so you never miss better rates.
            </p>
            <div class="text-body-sm text-rs-muted mt-auto">
              Free: 3 corridors | Plus: 16 corridors
            </div>
          </div>

          <!-- Feature 4 -->
          <div class="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6 hover:border-brand-600 hover:shadow-lg transition-all flex flex-col">
            <div class="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center mb-4">
              <svg
                class="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h4 class="text-body-lg font-bold text-white mb-2">
              Export Data
            </h4>
            <p class="text-body-sm text-neutral-300 leading-relaxed mb-4">
              Download transfer history and rate data as CSV or PDF. Ready for tax filing and expense tracking.
            </p>
            <div class="text-body-sm text-rs-muted mt-auto">
              Plus only
            </div>
          </div>

          <!-- Feature 5 -->
          <div class="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6 hover:border-brand-600 hover:shadow-lg transition-all flex flex-col">
            <div class="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center mb-4">
              <svg
                class="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h4 class="text-body-lg font-bold text-white mb-2">
              No Ads
            </h4>
            <p class="text-body-sm text-neutral-300 leading-relaxed mb-4">
              Zero distractions. No sponsor banners, no ads, no clutter. Just the rates and data you need to make decisions.
            </p>
            <div class="text-body-sm text-rs-muted mt-auto">
              Plus only
            </div>
          </div>

          <!-- Feature 6 -->
          <div class="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6 hover:border-brand-600 hover:shadow-lg transition-all flex flex-col">
            <div class="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center mb-4">
              <svg
                class="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h4 class="text-body-lg font-bold text-white mb-2">
              100% Independent
            </h4>
            <p class="text-body-sm text-neutral-300 leading-relaxed mb-4">
              Plus subscriptions fund our independence. Rankings stay data-driven. No pay-to-rank schemes—ever.
            </p>
            <div class="text-body-sm text-rs-muted mt-auto">
              Rankings stay the same
            </div>
          </div>
        </div>
      </div>

      <!-- Trust Message -->
      <div class="bg-neutral-800 border-2 border-neutral-700 rounded-xl p-8 mb-10 text-center">
        <div class="flex items-center justify-center gap-3 mb-3">
          <svg
            class="w-6 h-6 text-primary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h4 class="text-body-lg font-bold text-white">
            How Plus Fits Our Independence
          </h4>
        </div>
        <p class="text-body text-neutral-300 leading-relaxed max-w-3xl mx-auto break-words">
          Plus helps fund Remit-Scout without pay-to-rank sponsorships. Plus users see no ads, but <strong>scoring and rankings remain identical for everyone.</strong> Whether free or Plus, you see the same data-driven comparisons.
        </p>
      </div>

      <!-- CTA -->
      <div class="text-center">
        <NuxtLink
          to="/plus"
          class="inline-flex items-center gap-3 px-8 py-4 bg-brand-600 hover:bg-brand-700 rounded-xl text-white text-body-lg font-semibold shadow-xl hover:shadow-2xl transition-all group"
        >
          <span>See Full Features and Pricing</span>
          <svg
            class="w-6 h-6 group-hover:translate-x-1 transition-transform"
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
        <p class="mt-4 text-body-sm text-neutral-400">
          Start with a free account, upgrade anytime, cancel anytime
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>
