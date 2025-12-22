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
          <span class="font-medium text-white">RemitBee Review</span>
        </nav>

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-4 mb-6">
              <div class="w-20 h-20 rounded-2xl bg-white p-3 shadow-xl">
                <div class="w-full h-full rounded-xl bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                  RB
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
                  RemitBee Review
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
                to="/send-money?provider=remitbee"
                class="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-base font-semibold shadow-lg transition-all"
                style="background-color: rgba(255, 255, 255, 1); border-color: rgba(239, 246, 255, 1); color: rgba(0, 0, 0, 1);"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Compare RemitBee Now
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
                      :stroke-dasharray="`${83 * 4.4} 440`"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-5xl font-bold text-black">8.3</span>
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
                    <div class="h-full bg-blue-400 rounded-full" style="width: 82%" />
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-black">Speed</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-400 rounded-full" style="width: 78%" />
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-black">Support</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-400 rounded-full" style="width: 80%" />
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-black">Trust & Safety</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-400 rounded-full" style="width: 80%" />
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
            <div class="text-3xl font-bold text-slate-900">Canada</div>
            <div class="text-sm text-slate-600">Focused</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">$0 Fee</div>
            <div class="text-sm text-slate-600">$500+ CAD</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">0.3-0.8%</div>
            <div class="text-sm text-slate-600">FX Margin</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">Bank Deposit</div>
            <div class="text-sm text-slate-600">Primary Method</div>
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
                  RemitBee's 8.3 is driven first and foremost by Delivered Value (40%): the pricing structure can be genuinely competitive when you use the "low-fee" funding rails (e‑Transfer / EFT / bill payment), especially for $500+ CAD transfers where the transfer fee can drop to $0, and RemitBee says it takes a 0.3%–0.8% FX margin (varies by receiving country).
                </p>
              </div>

              <div class="mb-12">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-gradient-to-b from-brand-600 to-blue-700 rounded-full"></div>
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200">
                  <p class="text-lg text-slate-800 leading-relaxed italic m-0">
                    "RemitBee (8.3): Canada-focused; competitive value in core lanes; bank speed dependencies; solid reliability."
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
                  Here's how RemitBee performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-blue-50/50 to-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                    8.3
                  </div>
                  <div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <img src="/logos/remit-scout.svg" alt="RemitScout" class="h-6 w-auto" />
                      RemitBee
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
                    <div class="text-sm text-slate-700 leading-relaxed">Pricing structure can be genuinely competitive with low-fee funding rails, especially $500+ CAD where transfer fee can drop to $0. FX margin 0.3%–0.8% varies by receiving country.</div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Reliability</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">20% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">In-app status tracking + step-by-step notifications reduce "where is my transfer?" uncertainty. Solid reliability signals with published delay reasons.</div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Friction & Speed</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">15% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Bank speed dependencies show up with funding methods like bill payment (and some EFT flows), which can shift delivery from "minutes" to "business days."</div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Support & Refunds</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">15% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Published "money back guarantee" if funds don't reach recipient, plus documented refund timelines. Cancellation/refunds can be constrained once transfer is processed.</div>
                  </div>
                  <div class="sm:col-span-2 p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Trust & Safety</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">10% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Registered with FINTRAC as a Money Services Business and references compliance with Canada's AML framework. Also complies with provincial/territorial requirements including Quebec's MSB licensing regime.</div>
                  </div>
                </div>
                <div class="mt-6 pt-6 border-t-2 border-brand-200 bg-white/40 rounded-xl p-4">
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="flex-1">
                      <div class="font-semibold text-slate-900 mb-1.5">Why 8.3 (not 9.0+):</div>
                      <div class="text-sm text-slate-700 leading-relaxed">RemitBee earns most of its score on Delivered Value because the fee structure can be low (including fee waivers above $500 on eligible rails) and the disclosed FX margin range is relatively tight—but the total cost can rise with debit-card funding and corridor variance, and speed is partly constrained by bank-timed funding methods.</div>
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
                      <span>Canada-based senders who can fund via e‑Transfer / EFT / bill payment and want to minimize explicit fees (especially when sending $500+ CAD).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Recipients in countries where bank deposit is available and convenient (often the simplest receiving method).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>People who value upfront fee tables + tracking/status updates rather than "surprise" pricing at checkout.</span>
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
                      <span>Anyone who needs to fund a money transfer with a credit card (RemitBee says credit cards aren't accepted for money transfers or currency exchange).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>People who need a provider that works well outside Canada (RemitBee says it accepts cards issued by Canadian banks/credit unions and does not accept cards issued outside Canada).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Senders who want bank-like predictability on speed across every payment method: some funding rails are inherently bank-timed (e.g., bill payment).</span>
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
                      <span><strong class="text-slate-900">Delivered Value:</strong> Clear low-fee path for $500+ CAD via bank-style funding methods; RemitBee also discloses a 0.3%–0.8% FX margin range (corridor-dependent).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong class="text-slate-900">Reliability & Success:</strong> In-app status tracking + step-by-step notifications reduce "where is my transfer?" uncertainty.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong class="text-slate-900">Support & Refunds:</strong> A published "money back guarantee" if funds don't reach the recipient, plus documented refund timelines.</span>
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
                      <span><strong class="text-slate-900">Delivered Value:</strong> Total cost still depends on FX margin + funding method; debit-card-funded transfers can get meaningfully pricier (especially for $500+).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span><strong class="text-slate-900">Friction & Speed:</strong> Bank speed dependencies show up with funding methods like bill payment (and some EFT flows), which can shift delivery from "minutes" to "business days."</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span><strong class="text-slate-900">Support & Refunds:</strong> Cancellation/refunds can be constrained once a transfer is processed; debit card transfers may process quickly, reducing cancellation window, and self-cancel is limited to three per year per RemitBee.</span>
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
                  Remit-Scout's scoring starts with what you actually pay, not just the headline fee. A widely used framework (including the World Bank's Remittance Prices Worldwide work) is that total remittance cost is typically the transfer fee + exchange-rate margin (spread) + any recipient-side fees where they exist.
                </p>
                <div class="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <p class="font-semibold text-slate-900 mb-3 text-base">
                    Effective cost: fees + FX spread
                  </p>
                  <p class="text-slate-700 mb-3">
                    RemitBee is unusually explicit about two key pricing components:
                  </p>
                  <p class="text-slate-700 mb-3"><strong class="text-slate-900">Transfer fees vary by funding method and amount.</strong> RemitBee's fee table shows (examples):</p>
                  <ul class="space-y-2 text-slate-700 mb-3">
                    <li>• <strong class="text-slate-900">e‑Transfer / EFT / Bill Payment:</strong> $2.99 CAD under $500, FREE over $500</li>
                    <li>• <strong class="text-slate-900">Interac Online:</strong> $2.99 CAD (both under and above $500)</li>
                    <li>• <strong class="text-slate-900">Debit card:</strong> $2.99–$6.99 under $500, and $8.99+ over $500</li>
                  </ul>
                  <p class="text-slate-700 mb-0">
                    <strong class="text-slate-900">FX margin (spread):</strong> RemitBee says it takes a 0.3%–0.8% margin on the exchange rate, and that the exact margin varies by receiving country.
                  </p>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200 mb-6">
                  <p class="font-semibold text-slate-900 mb-3 text-base">
                    A practical way to think about this:
                  </p>
                  <p class="text-slate-800 leading-relaxed mb-0">
                    If you send $1,000 CAD, a 0.3%–0.8% FX margin would roughly correspond to $3–$8 CAD of value "lost" in the exchange rate, before considering the transfer fee (which could be $0 if you're above $500 on an eligible funding method). (That's just the math of the stated range, not a claim about any specific corridor.)
                  </p>
                </div>

                <div class="p-6 rounded-xl border-2 border-emerald-200">
                  <p class="font-semibold text-slate-900 mb-3">"How often is it cheapest?"</p>
                  <p class="text-slate-800 leading-relaxed mb-4">
                    We're not going to invent a "% of times cheapest" statistic here. What we can say, consistent with the auditor note, is:
                  </p>
                  <ul class="space-y-2 text-slate-700">
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>RemitBee's structure is most competitive in its core use case: Canadian senders using low-fee funding rails (especially over the $500 threshold).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>It becomes less compelling when you prioritize convenience funding (debit card) or if your corridor sits at the higher end of the stated FX margin range.</span>
                    </li>
                  </ul>
                </div>

                <div class="mt-6 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200">
                  <p class="font-semibold text-slate-900 mb-3 text-base">
                    Quote vs delivered accuracy
                  </p>
                  <p class="text-slate-800 leading-relaxed mb-3">Two things matter for "quote accuracy":</p>
                  <ul class="space-y-2 text-slate-700 mb-3">
                    <li>• For standard transfers, RemitBee says you get an estimate of arrival time when you initiate a transfer.</li>
                    <li>• For scheduled transfers, RemitBee's terms say exchange rates are not locked at scheduling and are confirmed/booked 24 hours prior to execution—meaning the eventual applied rate can differ from what you saw when scheduling.</li>
                  </ul>
                  <p class="text-slate-700 mt-3 mb-0 text-sm">
                    That scheduled-transfer behavior isn't "good" or "bad" by itself—but it does mean you shouldn't treat an early scheduled quote as final.
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
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Success signals & transparency
                    </p>
                    <p class="text-slate-700 mb-3">RemitBee provides:</p>
                    <ul class="space-y-2 text-slate-700">
                      <li>• Transaction history with clear status labels (in progress / release / completed / hold / refund in progress / refunded), and it says you'll receive notifications as the transfer processes.</li>
                      <li>• An "expected completion date" concept, plus a list of common delay reasons (incorrect recipient details, technical issues, bank holidays, unsuccessful payment).</li>
                      <li>• RemitBee also claims "99%" of transfers arrive on time; we treat that as a provider statement, not an independently verified benchmark.</li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Pricing stability & freshness signals
                    </p>
                    <p class="text-slate-700 mb-3">Two useful "freshness" cues appear in RemitBee's own materials:</p>
                    <ul class="space-y-2 text-slate-700">
                      <li>• It says exchange rates are updated "every few seconds."</li>
                      <li>• It documents that scheduled-transfer rates are booked 24 hours prior, which implies rate application is time-bound and policy-driven rather than arbitrary.</li>
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
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Funding methods (sender-side friction)
                    </p>
                    <p class="text-slate-700 mb-3">
                      RemitBee lists multiple funding options, including debit card, Interac Online, e‑Transfer, EFT, and bill payment.
                    </p>
                    <p class="text-slate-700 mb-3">
                      But for money transfers and currency exchange, it states credit cards aren't accepted.
                    </p>
                    <p class="text-slate-700 mb-0">
                      It also says it accepts cards issued by Canadian banks/credit unions and does not accept cards issued outside Canada—helpful clarity, but it constrains who can use the card rail.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Speed buckets (what to expect)
                    </p>
                    <p class="text-slate-700 mb-3">RemitBee's own help content frames overall delivery like this:</p>
                    <p class="text-slate-700 mb-3">
                      Transfers can take from a few minutes up to two business days, depending on destination country (and, in practice, often the funding/receiving rail too).
                    </p>
                    <p class="text-slate-700 mb-3">On the funding side:</p>
                    <ul class="space-y-2 text-slate-700">
                      <li>• e‑Transfer deposits to RemitBee "typically" post within ~15 minutes.</li>
                      <li>• Bill payments typically take one business day if sent before 3pm (with later cutoff timing and weekends potentially extending this).</li>
                    </ul>
                    <p class="text-slate-700 mt-3 mb-0">
                      That matches the auditor note about bank speed dependencies: if you choose bank-timed funding, you're opting into bank-timed processing.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Payout methods (recipient-side)
                    </p>
                    <p class="text-slate-700 mb-3">Receiving options vary by country. RemitBee describes common receiving methods as:</p>
                    <ul class="space-y-2 text-slate-700">
                      <li>• Bank deposit, cash pickup, and (in some locations) cash delivery.</li>
                      <li>• It also publishes a country-by-country table showing where bank deposit vs cash pickup vs RemitBee Balance are available.</li>
                    </ul>
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
                      Refund and cancellation experience (as documented)
                    </p>
                    <p class="text-slate-700 mb-3">RemitBee's help content is fairly explicit about limits:</p>
                    <ul class="space-y-2 text-slate-700">
                      <li>• If a transaction hasn't been processed, you can cancel from the transaction details screen and funds are refunded; if it has been processed, it says it cannot be cancelled/refunded.</li>
                      <li>• Refund timelines: a refund is typically 2–4 business days, with confirmation in 1–2 business days and then processing time depending on payment method.</li>
                      <li>• Important caveat: for debit card payments, RemitBee notes the payment is instant and the transfer may process in minutes, making cancellations/refunds "not possible" in many cases.</li>
                      <li>• Cancellation limit: RemitBee states you can cancel up to three transactions annually yourself; beyond that, you need to request a refund for manual review and repeated cancellations may risk restrictions.</li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      "Money-back guarantee"
                    </p>
                    <p class="text-slate-700 mb-0">
                      RemitBee publishes a guarantee that if the money doesn't reach the recipient, it will provide a full refund including fees (again: this is a policy statement, not an external guarantee).
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
                    We treat "trust" as: can you verify who regulates them, and do policies exist that reduce consumer risk—without assuming perfection.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Regulatory / licensing checks (where available)
                    </p>
                    <p class="text-slate-700 mb-3">
                      RemitBee's terms state it is registered with FINTRAC as a Money Services Business and references compliance with Canada's AML framework; it also says it complies with provincial/territorial requirements including Quebec's MSB licensing regime.
                    </p>
                    <p class="text-slate-700 mb-0">
                      FINTRAC maintains a public Money Services Business Registry and explicitly notes that registration does not mean FINTRAC endorses or licenses a business—so it's still on you (or the consumer) to verify details like name, status, and registration number.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      If you're doing a trust check:
                    </p>
                    <p class="text-slate-700 mb-0">
                      Use that registry and confirm the legal/operating name matches what you're using.
                    </p>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <!-- How to get the best rate -->
              <div class="mb-12 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                <h2 class="text-2xl font-bold text-slate-900 mb-4">
                  How to get the best rate with RemitBee
                </h2>
                <ul class="space-y-3 text-slate-700">
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Choose the funding method first. If you can, use e‑Transfer / EFT / bill payment and send $500+ CAD to avoid transfer fees (where eligible).</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Avoid debit card for larger sends unless you're paying for speed/convenience—fees can be $8.99+ for $500+ transfers.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Sanity-check the FX rate. RemitBee says its FX margin ranges 0.3%–0.8% depending on country—compare the quoted rate to a mid-market reference to understand the spread.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Pick the right receiving method (bank deposit vs cash pickup vs mobile-style methods where available) based on the recipient's constraints—speed and availability can vary by method and country.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Double-check recipient details to reduce avoidable delays and reprocessing.</span>
                  </li>
                </ul>
              </div>

              <!-- Two alternatives -->
              <div class="mb-12">
                <h2 class="text-2xl font-bold text-slate-900 mb-6">
                  Two alternatives (and when they beat RemitBee)
                </h2>
                <div class="space-y-6">
                  <div class="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200">
                    <h3 class="text-xl font-bold text-slate-900 mb-3">
                      XE Money (8.7)
                    </h3>
                    <p class="text-slate-700 mb-3">
                      Strong all-rounder; reliable quotes; value competitive but not always cheapest; speed often bank-timed; trust strong.
                    </p>
                    <p class="text-slate-700 mb-0">
                      <strong class="text-slate-900">When XE beats RemitBee:</strong> if you want a more "global generalist" experience (broader coverage / fewer Canada-specific constraints), and you're okay with bank-timed delivery.
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200">
                    <h3 class="text-xl font-bold text-slate-900 mb-3">
                      Remitly (9.1)
                    </h3>
                    <p class="text-slate-700 mb-3">
                      Very fast (express) + strong support; value strong but express can cost more; reliable execution; trust strong.
                    </p>
                    <p class="text-slate-700 mb-0">
                      <strong class="text-slate-900">When Remitly beats RemitBee:</strong> if you need express speed or want a provider that tends to excel on support and high-urgency delivery, even if that sometimes costs more.
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
                  <strong class="text-slate-900">Who should use RemitBee:</strong> Canadian senders who can use bank-style funding rails (especially $500+ CAD e‑Transfer/EFT/bill payment) and want a service that's price-competitive in core lanes with transparent fee tables and usable transfer tracking.
                </p>
                <p class="text-lg text-slate-700 leading-relaxed mb-0">
                  <strong class="text-slate-900">Why the 8.3/10 is justified:</strong> RemitBee earns most of its score on Delivered Value (40%) because the fee structure can be low (including fee waivers above $500 on eligible rails) and the disclosed FX margin range is relatively tight—but the total cost can rise with debit-card funding and corridor variance, and speed is partly constrained by bank-timed funding methods. Add in solid reliability signals (status tracking, published delay reasons) and clear refund mechanics (with some limits), and 8.3 lands as a strong Canada-centric option rather than a universal "best for everyone."
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
                  See how RemitBee stacks up for your specific corridor and amount.
                </p>
                <NuxtLink
                  to="/send-money?provider=remitbee"
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
                    <dd class="font-semibold text-slate-900">2015</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Headquarters</dt>
                    <dd class="font-semibold text-slate-900">Canada</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Specialty</dt>
                    <dd class="font-semibold text-slate-900">Canada-Focused</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Speed</dt>
                    <dd class="font-semibold text-slate-900">Minutes - 2 Days</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">FX Margin</dt>
                    <dd class="font-semibold text-slate-900">0.3% - 0.8%</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Free Over</dt>
                    <dd class="font-semibold text-slate-900">$500 CAD</dd>
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
  alias: ['/reviews/remitbee'],
})

useHead({
  title: 'RemitBee Review 2024 - Remit-Score 8.3/10 | Remit-Scout',
  meta: [
    {
      name: 'description',
      content: 'Independent RemitBee review with Remit-Score 8.3/10. Canada-focused with competitive value in core lanes, bank speed dependencies, solid reliability. Detailed breakdown of fees, speed, and delivered value.',
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: 'RemitBee Review', path: '/learn/providers/remitbee' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'RemitBee Review 2024 - Remit-Score 8.3/10 | Remit-Scout',
  description: 'Independent RemitBee review with Remit-Score 8.3/10. Canada-focused with competitive value in core lanes, bank speed dependencies, solid reliability. Detailed breakdown of fees, speed, and delivered value.',
  canonical: `${siteUrl}/learn/providers/remitbee`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Providers', url: `${siteUrl}/learn/providers` },
  { name: 'RemitBee Review', url: `${siteUrl}/learn/providers/remitbee` },
])
</script>
