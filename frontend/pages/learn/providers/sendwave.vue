<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative bg-gray-900 py-16 lg:py-24 overflow-hidden">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <nav class="mb-8 flex items-center space-x-2 text-sm text-white/70 relative z-10">
          <NuxtLink to="/" class="hover:text-white transition-colors cursor-pointer underline-offset-2 hover:underline relative z-10">Home</NuxtLink>
          <span class="text-white/50">›</span>
          <NuxtLink to="/learn" class="hover:text-white transition-colors cursor-pointer underline-offset-2 hover:underline relative z-10">Learn</NuxtLink>
          <span class="text-white/50">›</span>
          <NuxtLink to="/learn/providers" class="hover:text-white transition-colors cursor-pointer underline-offset-2 hover:underline relative z-10">Providers</NuxtLink>
          <span class="text-white/50">›</span>
          <span class="font-medium text-white">Sendwave Review</span>
        </nav>

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-4 mb-6">
              <div class="w-20 h-20 rounded-2xl bg-white p-3 shadow-xl">
                <div class="w-full h-full rounded-xl bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                  S
                </div>
              </div>
              <div>
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium mb-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Provider Review
                </div>
                <h1 class="text-4xl sm:text-5xl font-bold text-white mb-2">
                  Sendwave Review
                </h1>
                <p class="text-xl text-slate-300">
                  Independent Remit-Scout Analysis
                </p>
              </div>
            </div>

            <p class="text-lg text-white/90 leading-relaxed mb-8">
              A data-driven review based on real transfer outcomes - not paid endorsements. We evaluate what matters most: <strong class="text-white">how much money actually arrives</strong>.
            </p>

            <div class="flex flex-wrap gap-4">
              <NuxtLink
                to="/send-money?provider=sendwave"
                class="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-base font-semibold shadow-lg transition-all"
                style="background-color: rgba(255, 255, 255, 1); border-color: rgba(239, 246, 255, 1); color: rgba(0, 0, 0, 1);"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Compare Sendwave Now
              </NuxtLink>
              <a
                href="#review"
                class="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-base font-semibold text-white transition-all"
                style="background-color: rgba(37, 99, 235, 1); border-color: rgba(239, 246, 255, 0.01);"
              >
                Read Full Review
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>

          <!-- Right: Score Card -->
          <div class="flex justify-center lg:justify-end">
            <div class="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full">
              <div class="text-center mb-6">
                <div class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">REMIT-SCOUT SCORE</div>
                <div class="relative inline-flex items-center justify-center">
                  <svg class="w-40 h-40 -rotate-90">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#e2e8f0" stroke-width="12" />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="#3b82f6"
                      stroke-width="12"
                      stroke-linecap="round"
                      :stroke-dasharray="`${90 * 4.4} 440`"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-5xl font-bold text-black">9.0</span>
                    <span class="text-sm text-slate-500">/10</span>
                  </div>
                </div>
              </div>

              <!-- Quick Rating Bars -->
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between text-sm mb-1" style="color: rgba(0, 0, 0, 1);">
                    <span class="text-black">Delivered Value</span>
                    <span class="font-semibold text-black">Strong</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-400 rounded-full" style="width: 85%" />
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-black">Reliability</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-400 rounded-full" style="width: 80%" />
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-black">Speed</span>
                    <span class="font-semibold text-black">Elite</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-400 rounded-full" style="width: 95%" />
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-black">Support</span>
                    <span class="font-semibold text-black">Strong</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-400 rounded-full" style="width: 88%" />
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-black">Trust & Safety</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-400 rounded-full" style="width: 82%" />
                  </div>
                </div>
              </div>

              <div class="mt-6 pt-6 border-t border-slate-200 text-center">
                <p class="text-xs" style="color: rgba(17, 24, 39, 1);">
                  Based on our independent methodology.<br>
                  <NuxtLink to="/methodology" class="font-semibold hover:text-brand-700" style="color: rgba(37, 99, 235, 1);">Learn how we score →</NuxtLink>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Stats Strip -->
    <section class="bg-slate-50 border-y border-slate-200 py-6">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">Limited</div>
            <div class="text-sm text-slate-600">Countries Supported</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">Instant</div>
            <div class="text-sm text-slate-600">Mobile Money</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">App-Based</div>
            <div class="text-sm text-slate-600">Platform</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">Low</div>
            <div class="text-sm text-slate-600">Friction</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section id="review" class="py-16 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-3 gap-12">
          <!-- Main Content Column -->
          <div class="lg:col-span-2">
            <article class="max-w-none">
              <!-- Introduction -->
              <div class="relative mb-12 p-8 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 border-2 border-slate-200 shadow-sm">
                <div class="absolute top-4 right-4">
                  <svg class="w-12 h-12 text-brand-600/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p class="text-xl text-slate-800 leading-relaxed relative z-10 font-medium">
                  Remit-Scout scores providers using a weighted rubric focused on what actually happens to your money: <strong class="text-brand-600 font-bold">Delivered Value (40%)</strong>, then reliability, speed/friction, support/refunds, and trust/safety. For this review, the headline score is 9.0/10.
                </p>
              </div>

              <div class="mb-12">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-gradient-to-b from-brand-600 to-blue-700 rounded-full"></div>
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200">
                  <p class="text-lg text-slate-800 leading-relaxed italic m-0">
                    "Very low friction + instant mobile money in supported corridors; delivered value strong but watch spread; corridor breadth narrower."
                  </p>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <div class="mb-8">
                <h2 class="text-3xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <svg class="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Score Breakdown
                </h2>
                <p class="text-lg text-slate-600 mb-6">
                  Here's how Sendwave performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-blue-50/50 to-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                    9.0
                  </div>
                  <div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <img src="/logos/remit-scout.svg" alt="RemitScout" class="h-6 w-auto" />
                      Sendwave
                    </h3>
                    <p class="text-sm text-black">remit-score</p>
                  </div>
                </div>
                <div class="grid sm:grid-cols-2 gap-4 mb-6">
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Delivered Value</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Strong</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">40% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Value is strong in core corridors, but you must watch FX spread. "No fee" routes can still be expensive via exchange rate markup.</div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Reliability</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">20% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Corridor breadth is narrower than large global players. If your destination isn't supported, there's no workaround.</div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Friction & Speed</div>
                      <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Elite</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">15% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Instant mobile money in supported corridors. Very low friction app-based setup with debit card funding.</div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Support & Refunds</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Strong</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">15% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Clear cancellation framework (30-minute window for full refunds). Error resolution process with published timelines.</div>
                  </div>
                  <div class="sm:col-span-2 p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Trust & Safety</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">10% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">U.S. state licensed money transmitter (NMLS), registered MSB with FinCEN. Operated by Zepz. Historical CFPB enforcement action (2023) worth noting.</div>
                  </div>
                </div>
                <div class="mt-6 pt-6 border-t-2 border-brand-200 bg-white/40 rounded-xl p-4">
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="flex-1">
                      <div class="font-semibold text-slate-900 mb-1.5">Why 9.0 (not 9.5-10):</div>
                      <div class="text-sm text-slate-700 leading-relaxed">FX spread can dominate total cost even on "no-fee" routes. Corridor breadth is narrower than larger global providers, limiting reliability for unsupported destinations.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    1
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">Delivered Value (40%)</h2>
                </div>
                <p class="text-lg text-slate-700 leading-relaxed mb-6">
                  Delivered Value is about the effective cost of a transfer: fees + FX spread, and how reliably the quote you see matches what gets delivered.
                </p>
                <div class="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <p class="font-semibold text-slate-900 mb-3 text-base">
                    Effective cost: "no fee" can still be expensive
                  </p>
                  <p class="text-slate-700 mb-3">
                    Sendwave is often positioned as low-fee or even "no-fee" in some routes. The important nuance is that a provider can still charge you via the exchange rate (FX spread/markup).
                  </p>
                  <p class="text-slate-700 mb-0">
                    A third-party review notes that Sendwave adds a margin to the mid-market exchange rate, and that this margin is how the service makes money even when the visible fee is $0. This aligns directly with the auditor caution: "delivered value strong but watch spread."
                  </p>
                </div>

                <div class="p-6 rounded-xl border-2 border-emerald-200">
                  <p class="font-semibold text-slate-900 mb-3">"How often is it the cheapest?"</p>
                  <p class="text-slate-800 leading-relaxed mb-4">
                    We're not going to invent "% cheapest" stats here. What you can take from the score + audit notes is:
                  </p>
                  <ul class="space-y-2 text-slate-700">
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>In the corridors Sendwave supports well (especially mobile money routes), delivered value can be strong.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>But you still need to compare the final "recipient gets" amount, because FX spread can quietly dominate total cost.</span>
                    </li>
                  </ul>
                </div>

                <div class="mt-6 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200">
                  <p class="font-semibold text-slate-900 mb-3 text-base">
                    Quote vs delivered accuracy: what to verify before you hit send
                  </p>
                  <p class="text-slate-800 leading-relaxed mb-0">
                    A useful "value integrity" signal is whether the app clearly shows the rate, fee, and delivery estimate before confirming. A comparison guide notes that Sendwave shows the exact rate, fee, and delivery estimate before you confirm payment, and recommends reviewing that screen carefully because rates can change during the day.
                  </p>
                </div>
              </div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    2
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">Reliability & Success (20%)</h2>
                </div>
                <div class="space-y-4 text-lg leading-relaxed text-slate-700">
                  <p>
                    This category is about whether the provider can consistently produce a usable quote and complete the transfer without avoidable surprises (route unavailable, frequent failures, unclear statuses).
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      The biggest reliability constraint: corridor coverage
                    </p>
                    <p class="text-slate-700 mb-3">
                      The auditor notes say it plainly: "corridor breadth narrower." That affects reliability in a practical way—if your destination or payout method isn't supported, there's no "workaround."
                    </p>
                    <p class="text-slate-700 mb-0">
                      Wise's overview also states the supported countries list is still limited compared to other providers. And the Google Play listing reflects a relatively focused set of destinations (example countries are listed rather than "200+").
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Pricing stability & data freshness signals
                    </p>
                    <p class="text-slate-700 mb-3">You generally want to see:</p>
                    <ul class="space-y-2.5 text-slate-700">
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>A clear pre-send quote (rate + fee + ETA)</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Live status updates/tracking in-app (a freshness signal, not a guarantee)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    3
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">Friction & Speed (15%)</h2>
                </div>
                <div class="space-y-4 text-lg leading-relaxed text-slate-700">
                  <p>
                    This is where Sendwave earns a lot of its score.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Speed behavior: mobile money can be "instant" in supported corridors
                    </p>
                    <p class="text-slate-700 mb-3">
                      The auditor notes highlight "instant mobile money in supported corridors," and Sendwave's Google Play description emphasizes sending money "in seconds" with direct integration into mobile money services and bank partners.
                    </p>
                    <p class="text-slate-700 mb-0">
                      A separate overview also summarizes typical behavior as "instantly or within a few hours depending on destination," and calls out that Sendwave is known for ease of use and fast delivery—especially for mobile wallet payouts.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Low friction setup (but still verification)
                    </p>
                    <p class="text-slate-700 mb-3">
                      Sendwave is app-based and commonly uses debit card funding (per third-party documentation), which is typically lower-friction than bank wires.
                    </p>
                    <p class="text-slate-700 mb-0">
                      That said, identity checks are still part of getting started (standard for regulated remittance providers). The Zepz/WorldRemit/Sendwave US terms describe collecting personal information and identity documents for verification.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    4
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">Support & Refunds (15%)</h2>
                </div>
                <div class="space-y-4 text-lg leading-relaxed text-slate-700">
                  <p>
                    Support and refunds matter most when something goes wrong—wrong recipient details, processing delays, or you simply need to cancel.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Cancellation & refunds: the key rules
                    </p>
                    <p class="text-slate-700 mb-3">In the Zepz US terms covering WorldRemit and Sendwave brands:</p>
                    <ul class="space-y-2.5 text-slate-700">
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>You can cancel an international money transfer over USD 15 for a full refund within 30 minutes of payment, unless funds have already been picked up or deposited.</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>If the transfer can be canceled, the terms say they'll refund you within 3 business days of receiving your cancellation request.</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>If you request cancellation after 30 minutes, refund outcomes can vary: If not yet deposited/made available, you may be refunded minus fees already charged. If already deposited/made available, they may attempt to recall the payment, but may not be able to.</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Error resolution / disputes (timelines you should know)
                    </p>
                    <p class="text-slate-700 mb-3">The same terms state:</p>
                    <ul class="space-y-2.5 text-slate-700">
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>You must contact them within 180 days of the promised availability date if you believe there was an error.</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>They will determine whether an error occurred within 90 days, and tell you results within 3 business days after completing the investigation.</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-slate-50 border border-slate-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      How to reach support
                    </p>
                    <p class="text-slate-700 mb-3">The terms list Sendwave contact options, including:</p>
                    <ul class="space-y-2 text-slate-700">
                      <li>Phone: +1 855 383 7579</li>
                      <li>Email: help@sendwave.com</li>
                      <li>Online: via the Sendwave app or chat on the contact page</li>
                    </ul>
                    <p class="text-slate-700 mt-3 mb-0 text-sm">
                      Also note: refunds back to a debit card can take time depending on the card processor/bank—Sendwave's FAQ snippet mentions some refunds may take up to 10 business days.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    5
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">Trust & Safety (10%)</h2>
                </div>
                <div class="space-y-4 text-lg leading-relaxed text-slate-700">
                  <p>
                    We treat this category cautiously: we'll mention public licensing/regulatory checks where available, without implying global coverage.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Licensing / regulatory signals (where available)
                    </p>
                    <p class="text-slate-700 mb-3">
                      The Zepz US terms for WorldRemit and Sendwave brands state that WorldRemit Corp is a U.S. state licensed money transmitter (with an NMLS number) and is registered as a Money Services Business (MSB) with FinCEN.
                    </p>
                    <p class="text-slate-700 mb-3">
                      (As a consumer, you can cross-check licensing via state regulators and NMLS where applicable; U.S. money transmission is typically state-supervised, often coordinated through NMLS.)
                    </p>
                    <p class="text-slate-700 mb-0">
                      Sendwave's own US-facing marketing pages state it is operated by Zepz and "authorized to transmit money" in the US, Canada, the UK and the EU.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      A historical enforcement item worth knowing
                    </p>
                    <p class="text-slate-700 mb-0">
                      In Oct 2023, the Consumer Financial Protection Bureau (CFPB) announced an enforcement action against Chime, described as the operator of the Sendwave app at the time, alleging issues including misleading speed/cost claims and disclosure/error-resolution failures, and requiring refunds and a penalty.
                    </p>
                    <p class="text-slate-700 mt-3 mb-0 text-sm">
                      This doesn't tell you everything about today's performance, but it is a meaningful public record in the category of consumer protection.
                    </p>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <h2 class="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <svg class="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Pros and Cons
              </h2>

              <div class="not-prose grid md:grid-cols-2 gap-6 my-8">
                <div class="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6">
                  <h3 class="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4 mt-0">
                    <svg class="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Pros
                  </h3>
                  <ul class="space-y-2 text-slate-700 text-base">
                    <li class="flex items-start gap-2">
                      <span class="text-emerald-600 font-bold">+</span>
                      Very low friction + fast mobile money payouts in supported corridors
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-emerald-600 font-bold">+</span>
                      Strong delivered value in its core corridors (but you still need to check the FX rate)
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-emerald-600 font-bold">+</span>
                      Clear cancellation + error-resolution framework with published timelines
                    </li>
                  </ul>
                </div>
                <div class="rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
                  <h3 class="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4 mt-0">
                    <svg class="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    Cons
                  </h3>
                  <ul class="space-y-2 text-slate-700 text-base">
                    <li class="flex items-start gap-2">
                      <span class="text-amber-600 font-bold">−</span>
                      FX spread can be the real cost, even on "no-fee" routes
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-amber-600 font-bold">−</span>
                      Corridor breadth is narrower than large global players
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-amber-600 font-bold">−</span>
                      Once a transfer is paid out (especially instantly), cancellation may be impossible
                    </li>
                  </ul>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <div class="grid md:grid-cols-2 gap-8 mb-12">
                <div class="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                  <h2 class="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Best For
                  </h2>
                  <ul class="space-y-3 text-slate-700">
                    <li class="flex items-start gap-2.5">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Sending to mobile money wallets where Sendwave is supported and speed matters.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>People who want an app-first, low-step sending flow (very low friction).</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Frequent senders in a specific corridor (e.g., to common mobile money markets) who are willing to monitor FX rates.</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                  <h2 class="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Not Ideal For
                  </h2>
                  <ul class="space-y-3 text-slate-700">
                    <li class="flex items-start gap-2.5">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Anyone sending to a destination outside Sendwave's supported corridor set (coverage is more limited).</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Senders who want guaranteed mid-market FX without having to scrutinize the rate/spread each time.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Situations where you need maximum flexibility (cash pickup networks, many payout options, many destinations).</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <div class="mb-10">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <svg class="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  How to Get the Best Rate with Sendwave
                </h2>
                <p class="text-lg text-slate-600 mb-6">
                  Use this checklist as a quick "don't overpay" routine:
                </p>
                <div class="space-y-3">
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">1</div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-1.5 text-base">Compare the exchange rate to a mid-market reference to spot spread:</strong>
                      <span class="text-slate-700">Don't focus only on the fee line.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">2</div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-1.5 text-base">Always check the final confirmation screen:</strong>
                      <span class="text-slate-700">Review the exact rate + any fee before sending.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">3</div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-1.5 text-base">If you have time, compare the "recipient gets" amount:</strong>
                      <span class="text-slate-700">Check against at least one alternative for the same corridor.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">4</div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-1.5 text-base">Make sure the recipient's payout method is correct:</strong>
                      <span class="text-slate-700">Mobile wallet vs bank, since instant payout reduces your ability to cancel.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">5</div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-1.5 text-base">If you made a mistake, act fast:</strong>
                      <span class="text-slate-700">Cancellation is time-limited (e.g., 30 minutes for certain refunds, and only if not paid out).</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <div class="mb-10">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <svg class="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Two Alternatives (and When They Beat Sendwave)
                </h2>

                <div class="space-y-6">
                  <div class="p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-brand-300 transition-colors">
                    <h3 class="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600"></span>
                      1) Wise — best when FX transparency is the priority
                    </h3>
                    <p class="text-slate-700 mb-3">
                      Wise positions itself around mid-market exchange rates and transparent fees, which can win when you're optimizing strictly for delivered value and want to minimize hidden FX markup.
                    </p>
                    <p class="text-slate-700 mb-0">
                      <strong class="text-slate-900">Choose Wise over Sendwave when:</strong> You're sending to a bank account and don't need mobile money instant payout. You want clearer fee + FX separation (less "spread surprise").
                    </p>
                  </div>

                  <div class="p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-brand-300 transition-colors">
                    <h3 class="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600"></span>
                      2) Remitly — best when you need broader corridor coverage
                    </h3>
                    <p class="text-slate-700 mb-3">
                      Remitly states you can send to 170+ countries and territories, which can beat Sendwave when the destination or payout option isn't available in Sendwave.
                    </p>
                    <p class="text-slate-700 mb-0">
                      <strong class="text-slate-900">Choose Remitly over Sendwave when:</strong> Your destination corridor isn't supported by Sendwave (coverage constraint). You want multiple delivery options and speed tiers (Express vs Economy), accepting that price can vary by route and funding method.
                    </p>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <div class="mb-10">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <svg class="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Bottom Line
                </h2>
                <div class="space-y-5 text-lg leading-relaxed text-slate-700">
                  <div class="p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3">Who should use Sendwave?</p>
                    <p class="text-slate-800 mb-0">
                      Sendwave is a strong choice if you're sending to a supported mobile money corridor and you value very low friction + fast delivery.
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3">Why the 9.0/10 is justified:</p>
                    <p class="text-slate-800 mb-0">
                      Sendwave scores highly because it delivers a simple, fast experience—often instant mobile money where available—while still offering strong delivered value in its core corridors. The score is held back mainly by two factors explicitly called out in the audit: you must watch FX spread, and corridor breadth is narrower than bigger global providers.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <!-- Sidebar -->
          <div class="lg:col-span-1">
            <div class="sticky top-40 space-y-6">
              <!-- Compare CTA -->
              <div class="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-2">Ready to Compare?</h3>
                <p class="text-sm text-slate-600 mb-4">
                  See how Sendwave stacks up for your specific corridor and amount.
                </p>
                <NuxtLink
                  to="/send-money"
                  class="block w-full rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  Compare Rates Now
                </NuxtLink>
              </div>

              <!-- Quick Facts -->
              <div class="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-4">Quick Facts</h3>
                <dl class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Operator</dt>
                    <dd class="font-semibold text-slate-900">Zepz</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Platform</dt>
                    <dd class="font-semibold text-slate-900">App-Based</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Speed</dt>
                    <dd class="font-semibold text-slate-900">Instant (Mobile Money)</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Countries</dt>
                    <dd class="font-semibold text-slate-900">Limited Coverage</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Funding</dt>
                    <dd class="font-semibold text-slate-900">Debit Card</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Payout</dt>
                    <dd class="font-semibold text-slate-900">Mobile Money</dd>
                  </div>
                </dl>
              </div>

              <!-- Why Trust Us -->
              <div class="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-4">Why Trust This Review?</h3>
                <ul class="space-y-3 text-sm text-slate-700">
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    <span>100% independent - providers can't pay to rank higher</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    <span>Based on real transfer data</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    <span>Transparent methodology</span>
                  </li>
                </ul>
                <NuxtLink
                  to="/methodology"
                  class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  See our methodology
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>
              </div>

              <!-- More Providers -->
              <div class="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-4">More Provider Reviews</h3>
                <ul class="space-y-3">
                  <li>
                    <NuxtLink to="/learn/providers/remitly" class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600">
                      <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">R</div>
                      <span>Remitly Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink to="/learn/providers/wise" class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600">
                      <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">W</div>
                      <span>Wise Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink to="/learn/providers/worldremit" class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600">
                      <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">W</div>
                      <span>WorldRemit Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink to="/learn/providers" class="flex items-center gap-3 text-sm font-semibold text-brand-600 hover:text-brand-700">
                      View all providers →
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="py-16 bg-blue-600" style="background-color: rgba(37, 99, 235, 1);">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold mb-4" style="color: rgba(255, 255, 255, 1);">
          Ready to See How Sendwave Compares?
        </h2>
        <p class="text-lg mb-8" style="color: rgba(255, 255, 255, 1);">
          Enter your transfer details to see real-time rates from Sendwave and 30+ other providers.
        </p>
        <NuxtLink
          to="/send-money"
          class="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold shadow-lg transition-all"
          style="background-color: rgba(255, 255, 255, 1); border: 1px solid rgba(239, 246, 255, 0.1); color: rgba(0, 0, 0, 1);"
        >
          Compare Rates Now
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  alias: ['/reviews/sendwave'],
})

useHead({
  title: 'Sendwave Review 2024 - Remit-Score 9.0/10 | Remit-Scout',
  meta: [
    {
      name: 'description',
      content: 'Independent Sendwave review with Remit-Score 9.0/10. Instant mobile money, very low friction, strong value in core corridors. Detailed breakdown of fees, speed, and delivered value.',
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: 'Sendwave Review', path: '/learn/providers/sendwave' },
]
</script>
