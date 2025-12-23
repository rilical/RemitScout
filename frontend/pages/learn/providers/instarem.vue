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
          <span class="font-medium text-white">Instarem Review</span>
        </nav>

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-4 mb-6">
              <div class="w-20 h-20 rounded-2xl bg-white p-3 shadow-xl">
                <div class="w-full h-full rounded-xl bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                  I
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
                  Instarem Review
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
                to="/send-money?provider=instarem"
                class="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-base font-semibold shadow-lg transition-all"
                style="background-color: rgba(255, 255, 255, 1); border-color: rgba(239, 246, 255, 1); color: rgba(0, 0, 0, 1);"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Compare Instarem Now
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
                      :stroke-dasharray="`${84 * 4.4} 440`"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-5xl font-bold text-black">8.4</span>
                    <span class="text-sm text-slate-500">/10</span>
                  </div>
                </div>
              </div>

              <!-- Quick Rating Bars -->
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between text-sm mb-1" style="color: rgba(0, 0, 0, 1);">
                    <span class="text-black">Delivered Value</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-400 rounded-full" style="width: 80%" />
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-black">Reliability</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-400 rounded-full" style="width: 78%" />
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-black">Speed</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-400 rounded-full" style="width: 82%" />
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-black">Support</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-400 rounded-full" style="width: 78%" />
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-black">Trust & Safety</span>
                    <span class="font-semibold text-black">Strong</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-400 rounded-full" style="width: 88%" />
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
            <div class="text-3xl font-bold text-slate-900">Asia</div>
            <div class="text-sm text-slate-600">Corridor Specialist</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">1-2 Days</div>
            <div class="text-sm text-slate-600">Typical Delivery</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">Bank Deposit</div>
            <div class="text-sm text-slate-600">Primary Method</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">50+</div>
            <div class="text-sm text-slate-600">Countries</div>
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
                  Instarem's 8.4/10 is driven first by Delivered Value (40%): it can deliver strong effective pricing (fees + FX spread) where it's focused, but its score ceiling is capped by breadth—it's not the most globally "universal" option for every sender/corridor/payout need.
                </p>
              </div>

              <div class="mb-12">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-gradient-to-b from-brand-600 to-blue-700 rounded-full"></div>
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200">
                  <p class="text-lg text-slate-800 leading-relaxed italic m-0">
                    "Instarem (8.4): Asia corridor specialist; value strong where focused; good speed; breadth limits score ceiling."
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
                  Here's how Instarem performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-blue-50/50 to-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                    8.4
                  </div>
                  <div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <img src="/logos/remit-scout.svg" alt="RemitScout" class="h-6 w-auto" />
                      Instarem
                    </h3>
                    <p class="text-sm text-black">remit-score</p>
                  </div>
                </div>
                <div class="grid sm:grid-cols-2 gap-4 mb-6">
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Delivered Value</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">40% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Strong in-core value potential, but you need to watch spread and especially card-related add-on fees. Cost can rise meaningfully with card funding.</div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Reliability</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">20% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Reliable where available, but breadth limits score ceiling. Supports sending from specific countries, which limits corridor breadth versus global generalists.</div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Friction & Speed</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">15% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Most transfers arrive within 1–2 business days, and some corridors can be faster (including instant e-wallet payouts after funds are received, where available).</div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Support & Refunds</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">15% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Refund timelines depend on funding method (24–72 business hours for bank-transfer refunds vs 5–7 business days for card refunds), and cancellations become harder once processing/conversion occurs.</div>
                  </div>
                  <div class="sm:col-span-2 p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Trust & Safety</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Strong</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">10% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Operated by Nium and publishes jurisdiction-by-jurisdiction licensing info; in Singapore, Nium is listed by MAS as a Major Payment Institution (license number published).</div>
                  </div>
                </div>
                <div class="mt-6 pt-6 border-t-2 border-brand-200 bg-white/40 rounded-xl p-4">
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="flex-1">
                      <div class="font-semibold text-slate-900 mb-1.5">Why 8.4 (not 9.0+):</div>
                      <div class="text-sm text-slate-700 leading-relaxed">Delivered Value is solid in-core, but the score ceiling is limited by breadth (availability depends on where you're sending from and which payout types are supported), and card-funding fees can materially weaken delivered value if you're not careful.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <!-- Best For / Not Ideal For -->
              <div class="grid md:grid-cols-2 gap-6 mb-12">
                <div class="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                  <h3 class="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Best for
                  </h3>
                  <ul class="space-y-3 text-slate-700">
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Asia-heavy corridors where Instarem is most commonly positioned (and where its pricing can be strong "in-core").</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>People who want bank-deposit transfers with a straightforward "enter details → fund transfer → payout" flow.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Senders who can fund via lower-cost bank rails (vs. card), to keep the all-in cost down.</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                  <h3 class="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Not ideal for
                  </h3>
                  <ul class="space-y-3 text-slate-700">
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Anyone looking for the widest global corridor coverage from any location (Instarem supports sending from a defined set of countries).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>People who want cash pickup everywhere (Instarem's own Canada page notes cash pickup is offered only in the Philippines).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Users who prefer not to monitor FX spread / rate markup at checkout (Instarem's fee model varies by corridor and payment method, and card funding can add material cost).</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Pros and Cons -->
              <div class="grid md:grid-cols-2 gap-6 mb-12">
                <div class="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                  <h3 class="text-xl font-bold text-slate-900 mb-4">Pros</h3>
                  <ul class="space-y-3 text-slate-700">
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong class="text-slate-900">Delivered Value:</strong> Instarem publishes low headline pricing (e.g., personal sending "from 0.4%") and says fees/rates vary by amount, currency, payment method and receiving country/method—good transparency inputs for comparing "recipient gets."</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong class="text-slate-900">Friction & Speed:</strong> Instarem states most transfers arrive within 1–2 business days, and some corridors can be faster (including instant e-wallet payouts after funds are received, where available).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong class="text-slate-900">Trust & Safety:</strong> Instarem is operated by Nium and publishes jurisdiction-by-jurisdiction licensing info; in Singapore, Nium is listed by MAS as a Major Payment Institution (license number published).</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                  <h3 class="text-xl font-bold text-slate-900 mb-4">Cons</h3>
                  <ul class="space-y-3 text-slate-700">
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span><strong class="text-slate-900">Delivered Value:</strong> Cost can rise meaningfully with card funding; Instarem's U.S. fees page says card payments may incur a 2%–3% payment method fee (plus possible issuer fees).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span><strong class="text-slate-900">Reliability & Success:</strong> Availability is not universal—Instarem supports sending from specific countries (e.g., Australia, Canada, Singapore, Hong Kong, Malaysia, Euro Zone countries, UK, India, US), which limits corridor breadth versus global generalists.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span><strong class="text-slate-900">Support & Refunds:</strong> Refund timelines depend on funding method (Instarem's FAQ says 24–72 business hours for bank-transfer refunds vs 5–7 business days for card refunds), and cancellations become harder once processing/conversion occurs.</span>
                    </li>
                  </ul>
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
                  Effective cost = fees + FX spread
                </p>
                <div class="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <p class="font-semibold text-slate-900 mb-3 text-base">
                    Instarem's effective cost comes from two moving parts:
                  </p>
                  <ul class="space-y-3 text-slate-700">
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                      <span><strong class="text-slate-900">Transaction fee:</strong> Instarem publishes that personal transfers are priced "from 0.4%" and explicitly notes that fees and exchange rates vary by sending amount, currency, payment method, and receiving country/method.</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                      <span><strong class="text-slate-900">FX spread (rate markup):</strong> Instarem encourages comparing quoted rates to the mid‑market rate, and frames its rates as close to mid‑market (i.e., implying a small markup).</span>
                    </li>
                  </ul>
                  <p class="text-slate-700 mt-4 mb-0">
                    The practical consumer takeaway: don't judge value by the "fee" alone—compare on the final recipient receives number for your corridor and funding method. Instarem also says it presents fees upfront and shows what the recipient will receive when setting up a transaction.
                  </p>
                </div>

                <div class="p-6 rounded-xl border-2 border-emerald-200">
                  <p class="font-semibold text-slate-900 mb-3">"How often is it cheapest?"</p>
                  <p class="text-slate-800 leading-relaxed mb-4">
                    We don't claim a universal "Instarem is cheapest X% of the time" (no such audit statistic was provided). What we can say—aligned with the auditor note—is:
                  </p>
                  <ul class="space-y-2 text-slate-700">
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Value can be strong where Instarem is focused (especially Asia-heavy routes and Instarem's supported sender countries).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>But your "best" provider can change by payment method. For example, Instarem's U.S. pricing notes that paying by card can add a 2%–3% fee, which can erase a seemingly good FX rate.</span>
                    </li>
                  </ul>
                </div>

                <div class="mt-6 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200">
                  <p class="font-semibold text-slate-900 mb-3 text-base">
                    Quote vs delivered accuracy
                  </p>
                  <p class="text-slate-800 leading-relaxed mb-3">
                    Instarem's own "quote integrity" signals include:
                  </p>
                  <ul class="space-y-2 text-slate-700 mb-3">
                    <li>• Upfront visibility of fees and the recipient amount in the setup flow.</li>
                    <li>• A defined cancellation rule that suggests there's a clear "conversion/execution" point: under its U.S. customer agreement, you can cancel for a full refund within 30 minutes of authorizing, or later if the transaction amount has not yet been converted.</li>
                  </ul>
                </div>
                <div class="mt-6 p-5 rounded-xl bg-slate-50 border-l-4 border-brand-600">
                  <p class="font-semibold text-slate-900 mb-2">Delivered Value verdict:</p>
                  <p class="text-slate-800 mb-0">
                    Strong in-core value potential, but you need to watch spread and especially card-related add-on fees. That's why this section pulls the score up, but not to top-of-market levels.
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
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Quote success / availability
                    </p>
                    <p class="text-slate-700 mb-3">
                      Reliability starts with whether the service can quote and support your corridor:
                    </p>
                    <ul class="space-y-2 text-slate-700">
                      <li>• Instarem lists supported sending countries (e.g., Australia, Canada, Singapore, Hong Kong, Malaysia, Euro Zone countries, UK, India, US).</li>
                      <li>• It also states you can send to 50+ / 60+ countries (counts vary by page, but the consistent message is "dozens," not "everywhere").</li>
                    </ul>
                    <p class="text-slate-700 mt-3 mb-0">
                      That supports the auditor's "breadth limits score ceiling" comment: the product can be reliable where available, but it won't be an option for every sender geography.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Pricing stability
                    </p>
                    <p class="text-slate-700 mb-0">
                      Instarem's pricing is "stable" in the sense that it discloses that fees/rates vary by corridor and payment method and shows the fees upfront—so you can verify before confirming.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Data freshness signals
                    </p>
                    <p class="text-slate-700 mb-0">
                      Instarem states its competitive rates are sourced from Reuters and encourages comparing to mid‑market rates—signals that its pricing is tied to current market data (though you still need to check the final quoted rate at the moment you send).
                    </p>
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
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      ETA / speed buckets
                    </p>
                    <p class="text-slate-700 mb-3">
                      Instarem's own timing guidance for receiving funds:
                    </p>
                    <ul class="space-y-2 text-slate-700">
                      <li>• "In most cases" delivery is within 1–2 business days, with some transfers completed faster.</li>
                      <li>• Separately, Instarem notes processing can take up to 2 business days from the time it receives funds, and that certain countries/payment methods can take longer.</li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Payout methods
                    </p>
                    <p class="text-slate-700 mb-3">Instarem positions its core flow as bank deposit (sending directly to the recipient's bank account in local currency).</p>
                    <p class="text-slate-700 mb-3">It also documents e-wallet payouts in at least some corridors, stating e-wallet transfers can be instant once funds are received (verification/provider constraints apply).</p>
                    <p class="text-slate-700 mb-0">For cash pickup, Instarem's Canada page notes cash pickup service is available only in the Philippines.</p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Typical delivery-speed behavior
                    </p>
                    <p class="text-slate-700 mb-0">
                      The main behavior pattern to expect is "fast once funded": Many delays come from how quickly Instarem receives your funding (bank transfer vs card vs local rails) and the recipient bank's posting windows.
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
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Support access
                    </p>
                    <p class="text-slate-700 mb-0">
                      Instarem's support hub states you can reach out via 24/7 chat or submit an enquiry through the help center.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Refund experience (documented expectations)
                    </p>
                    <p class="text-slate-700 mb-3">Instarem publishes a simple refund timing expectation:</p>
                    <ul class="space-y-2 text-slate-700">
                      <li>• 24–72 business hours for refunds of bank transfers</li>
                      <li>• 5–7 business days for refunds of debit/credit card transfers</li>
                    </ul>
                    <p class="text-slate-700 mt-3 mb-0">
                      It also provides corridor-specific refund guidance for some cases (e.g., India cancellations note refunds usually take 72 hours, but correspondent bank returns can take longer).
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Dispute handling and post-issue friction
                    </p>
                    <p class="text-slate-700 mb-3">
                      For U.S. users, Instarem publishes an Error Resolution Notice with a defined reporting window (no later than 60 days after the first statement/receipt showing the issue) and a phone/help-center path.
                    </p>
                    <p class="text-slate-700 mb-3">
                      For cancellations, Instarem's U.S. customer agreement provides a clear "30 minutes for full refund" framework and indicates cancellation becomes harder after conversion/execution.
                    </p>
                    <p class="text-slate-700 mb-0">
                      In other regions, Instarem publishes complaint-handling procedures (e.g., Australia and EU) with response timelines and documentation requirements.
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
                    We keep this "where available" and verifiable.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Public licensing / regulatory signals (where available)
                    </p>
                    <p class="text-slate-700 mb-3">
                      Instarem states it is a trading name/brand operated by Nium and lists regulators and license references by jurisdiction (e.g., MAS in Singapore, FCA in the UK, Bank of Lithuania in the EU, etc.).
                    </p>
                    <p class="text-slate-700 mb-3">
                      MAS' public register lists NIUM PTE. LTD. as a Major Payment Institution (consistent with Instarem's Singapore disclosure).
                    </p>
                    <p class="text-slate-700 mb-0">
                      Instarem also publishes scam-awareness guidance and encourages reporting suspected scams via its app support channels (a basic but useful consumer safety signal).
                    </p>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <!-- How to get the best rate -->
              <div class="mb-12 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                <h2 class="text-2xl font-bold text-slate-900 mb-4">
                  How to get the best rate with Instarem
                </h2>
                <ul class="space-y-3 text-slate-700">
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Compare bank vs card funding: card can be faster, but in the U.S. Instarem warns of a 2%–3% payment method fee for card payments (plus possible issuer fees).</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Always compare on "recipient receives", not headline "from" fees—Instarem fees/rates vary by corridor and payment method.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Check the offered rate against a mid‑market reference to sanity-check the spread.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Verify the payout method (bank deposit vs e-wallet vs limited cash pickup) and the recipient details before you confirm.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>If you might need to cancel, act quickly: U.S. terms describe a 30‑minute full-refund cancellation right (with conditions).</span>
                  </li>
                </ul>
              </div>

              <!-- Two alternatives -->
              <div class="mb-12">
                <h2 class="text-2xl font-bold text-slate-900 mb-6">
                  Two alternatives (from the Remit-Scout list) and when they beat Instarem
                </h2>
                <div class="space-y-6">
                  <div class="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200">
                    <h3 class="text-xl font-bold text-slate-900 mb-3">
                      1) Remitly (9.1)
                    </h3>
                    <p class="text-slate-700 mb-3">
                      Remitly tends to beat Instarem when you need broader corridor reach and more payout options at the destination. Remitly states it supports transfers to 170+ countries and territories, with receive methods like cash pickup, mobile money, home delivery, debit card deposit, or bank account (corridor dependent).
                    </p>
                    <p class="text-slate-700 mb-0">
                      It can also be a better choice when you want an explicit speed/value choice (Express vs Economy) in applicable corridors.
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200">
                    <h3 class="text-xl font-bold text-slate-900 mb-3">
                      2) Wise
                    </h3>
                    <p class="text-slate-700 mb-3">
                      Wise tends to beat Instarem when your priority is FX transparency and you mostly need bank-to-bank style delivery. Wise states it uses the mid‑market rate and shows fees upfront.
                    </p>
                    <p class="text-slate-700 mb-0">
                      If your corridor is supported by Wise and you don't need limited cash pickup options, Wise can be a stronger "rate-first" baseline for comparison.
                    </p>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <!-- Bottom line -->
              <div class="mb-12 p-8 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 border-2 border-slate-200">
                <h2 class="text-3xl font-bold text-slate-900 mb-4">
                  Bottom line
                </h2>
                <p class="text-lg text-slate-700 leading-relaxed mb-4">
                  Instarem's 8.4/10 fits the auditor description: it's an Asia corridor specialist with strong value where it's focused and generally good speed (often 1–2 business days in its own guidance, sometimes faster).
                </p>
                <p class="text-lg text-slate-700 leading-relaxed mb-4">
                  <strong class="text-slate-900">Who should use it:</strong> senders in Instarem's supported sending countries who want a straightforward bank-deposit (and sometimes e-wallet) transfer flow and are willing to compare funding methods to keep costs down.
                </p>
                <p class="text-lg text-slate-700 leading-relaxed mb-0">
                  <strong class="text-slate-900">Why the score is justified:</strong> Delivered Value is solid in-core, but the score ceiling is limited by breadth (availability depends on where you're sending from and which payout types are supported), and card-funding fees can materially weaken delivered value if you're not careful.
                </p>
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
                  See how Instarem stacks up for your specific corridor and amount.
                </p>
                <NuxtLink
                  to="/send-money?provider=instarem"
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
                    <dt class="text-slate-600">Founded</dt>
                    <dd class="font-semibold text-slate-900">2014</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Headquarters</dt>
                    <dd class="font-semibold text-slate-900">Singapore</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Countries</dt>
                    <dd class="font-semibold text-slate-900">50+</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Specialty</dt>
                    <dd class="font-semibold text-slate-900">Asia Corridors</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Speed</dt>
                    <dd class="font-semibold text-slate-900">1-2 Days</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Payout Methods</dt>
                    <dd class="font-semibold text-slate-900">Bank, E-wallet</dd>
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
                    <NuxtLink to="/learn/providers/wise" class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600">
                      <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">W</div>
                      <span>Wise Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink to="/learn/providers/remitly" class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600">
                      <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">R</div>
                      <span>Remitly Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink to="/learn/providers/xe-money" class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600">
                      <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">XE</div>
                      <span>XE Money Review</span>
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
  </div>
</template>

<script setup lang="ts">
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import CompareWidget from '~/components/shared/CompareWidget.vue'

definePageMeta({
  alias: ['/reviews/instarem'],
})

useHead({
  title: 'Instarem Review 2024 - Remit-Score 8.4/10 | Remit-Scout',
  meta: [
    {
      name: 'description',
      content: 'Independent Instarem review with Remit-Score 8.4/10. Asia corridor specialist with strong value where focused, good speed. Detailed breakdown of fees, speed, and delivered value.',
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: 'Instarem Review', path: '/learn/providers/instarem' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'Instarem Review 2024 - Remit-Score 8.4/10 | Remit-Scout',
  description: 'Independent Instarem review with Remit-Score 8.4/10. Asia corridor specialist with strong value where focused, good speed. Detailed breakdown of fees, speed, and delivered value.',
  canonical: `${siteUrl}/learn/providers/instarem`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Providers', url: `${siteUrl}/learn/providers` },
  { name: 'Instarem Review', url: `${siteUrl}/learn/providers/instarem` },
])
</script>



