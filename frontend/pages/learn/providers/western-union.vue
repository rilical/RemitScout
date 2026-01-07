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
          <span class="font-medium text-white">Western Union Review</span>
        </nav>

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-4 mb-6">
              <div class="w-40 h-40 rounded-2xl bg-white p-3 shadow-xl">
                <img
                  src="/logos/western-union.svg"
                  alt="Western Union logo"
                  class="w-full h-full object-contain"
                  onerror="this.parentElement.innerHTML='<div class=\'w-full h-full rounded-xl bg-blue-500 flex items-center justify-center text-white text-2xl font-bold\'>WU</div>'"
                >
              </div>
              <div>
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium mb-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Provider Review
                </div>
                <h1 class="text-4xl sm:text-5xl font-bold text-white mb-2">
                  Western Union Review
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
                to="/send-money?provider=western-union"
                class="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-base font-semibold shadow-lg transition-all"
                style="background-color: rgba(255, 255, 255, 1); border-color: rgba(239, 246, 255, 1); color: rgba(0, 0, 0, 1);"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Compare Western Union Now
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
                <div class="flex justify-center">
                  <div
                    class="relative flex h-40 w-40 items-center justify-center rounded-full border-4 bg-white shadow-lg"
                    :style="{ borderColor: scoreColor }"
                  >
                    <div class="text-center">
                      <span :class="[scoreTextClass, 'text-5xl font-bold leading-none']">8.2</span>
                      <span class="text-sm text-slate-500">/10</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Rating Bars -->
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-black">Delivered Value</span>
                    <span class="font-semibold text-black">Inconsistent</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full"></div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-black">Reliability</span>
                    <span class="font-semibold text-black">Elite</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full"></div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-black">Speed</span>
                    <span class="font-semibold text-black">Elite</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full"></div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-black">Support</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full"></div>
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-black">Trust & Safety</span>
                    <span class="font-semibold text-black">Strong</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full"></div>
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
            <div class="text-3xl font-bold text-slate-900">200+</div>
            <div class="text-sm text-slate-600">Countries Supported</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">500k+</div>
            <div class="text-sm text-slate-600">Agent Locations</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">Minutes</div>
            <div class="text-sm text-slate-600">Cash Pickup</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">150+ Years</div>
            <div class="text-sm text-slate-600">Established</div>
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
              <div class="relative mb-22 p-8 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 border-2 border-slate-200 shadow-sm">
                <div class="absolute top-4 right-4">
                  <svg class="w-12 h-12 text-brand-600/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p class="text-xl text-slate-800 leading-relaxed relative z-10 font-medium">
                  Western Union's 8.2/10 is a classic "reach and reliability vs. price" tradeoff. The score starts with Delivered Value (40%): Western Union is often not the cheapest way to move money if you measure the effective cost (fees plus FX spread). Western Union itself discloses that it makes money from currency exchange and that its exchange rates are based on interbank rates plus a margin, meaning the FX rate can be meaningfully different from mid‑market.
                </p>
              </div>

              <div class="mb-22">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-gradient-to-b from-brand-600 to-blue-700 rounded-full"></div>
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200">
                  <p class="text-lg text-slate-800 leading-relaxed italic m-0">
                    "Western Union (8.2): Elite reliability + instant cash pickup reach; delivered value inconsistent due to higher effective cost."
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
                  Here's how Western Union performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-blue-50/50 to-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                    8.2
                  </div>
                  <div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <img src="/logos/remit-scout.svg" alt="RemitScout" class="h-6 w-auto" />
                      Western Union
                    </h3>
                    <p class="text-sm text-black">remit-score</p>
                  </div>
                </div>
                <div class="grid sm:grid-cols-2 gap-4 mb-6">
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Delivered Value</div>
                      <span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Inconsistent</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">40% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Western Union's FX rate is interbank + margin, and fees/spreads vary by channel/location/payment method. Higher effective cost versus price-leading digital specialists.</div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Reliability</div>
                      <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Elite</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">20% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Extremely broad physical payout reach—around 500k+ agent locations across 200+ countries and territories. Tends to be available when other rails aren't.</div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Friction & Speed</div>
                      <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Elite</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">15% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">"Cash pickup in minutes" is a core offering. For many corridors, recipients can collect quickly once the transfer is processed.</div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Support & Refunds</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">15% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Cancellations/refunds are time- and status-dependent (e.g., in the US you have a 30‑minute cancellation right; after payout, refunds typically aren't possible).</div>
                  </div>
                  <div class="sm:col-span-2 p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">Trust & Safety</div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Strong</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">10% weight</div>
                    <div class="text-sm text-slate-700 leading-relaxed">Strong "checkability"—Western Union's online services are offered by regulated entities (e.g., WUPSIL regulated by Central Bank of Ireland in EEA; WUPSGL authorized by UK FCA).</div>
                  </div>
                </div>
                <div class="mt-6 pt-6 border-t-2 border-brand-200 bg-white/40 rounded-xl p-4">
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="flex-1">
                      <div class="font-semibold text-slate-900 mb-2.5">Why 8.2 (not 9.0+):</div>
                      <div class="text-sm text-slate-700 leading-relaxed">Western Union is "elite" on Reliability & Success and Friction & Speed for cash pickup, but Delivered Value (40%) is held back by higher effective cost—fees plus an exchange rate that is explicitly interbank + margin, with prices varying by channel and corridor. You're often paying a premium for reach and immediacy.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    1
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">Delivered Value (40%)</h2>
                </div>
                <p class="text-lg text-slate-700 leading-relaxed mb-6">
                  Delivered Value is the main reason Western Union isn't higher than 8.2 despite its reach.
                </p>
                <div class="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <p class="font-semibold text-slate-900 mb-3 text-base">
                    Effective cost = transfer fees + FX spread (and sometimes third‑party deductions)
                  </p>
                  <p class="text-slate-700 mb-3">
                    Western Union is unusually explicit about how it earns revenue:
                  </p>
                  <ul class="space-y-3 text-slate-700">
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                      <span>It makes money from currency exchange and urges customers to compare both fees and exchange rates.</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                      <span>It calculates exchange rates using commercially available interbank rates plus a margin, and it adjusts rates several times daily.</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                      <span>It also states that its exchange rate may be less favorable than publicly reported commercial exchange rates used between banks/financial institutions.</span>
                    </li>
                  </ul>
                  <p class="text-slate-700 mt-3 mb-0">What that means practically: Western Union's fee might look small (or sometimes discounted), but the FX margin can be the bigger cost driver—especially for common corridors where bank-rail competitors compete aggressively on FX.</p>
                </div>

                <div class="p-6 rounded-xl border-2 border-emerald-200">
                  <p class="font-semibold text-slate-900 mb-3">"How often is it the cheapest?"</p>
                  <p class="text-slate-800 leading-relaxed mb-4">
                    We're not going to invent a "win rate" (no corridor-by-corridor pricing stats were provided). The evidence-based framing is:
                  </p>
                  <ul class="space-y-2 text-slate-700">
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Western Union is less likely to be cheapest on "standard" bank-deposit transfers where you don't need cash pickup, because many alternatives compete primarily on FX tightness. Western Union's own disclosures acknowledge the "interbank + margin" model and variable fees/rates.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Western Union can still be the best value overall when "value" includes successful immediate payout (e.g., emergencies, limited banking access). In those cases, you're paying a convenience/reliability premium for instant cash reach.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="not-prose my-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p class="text-sm text-blue-800 m-0">
                  <strong>Quote vs delivered accuracy (what can change):</strong> Western Union provides the rate/fees during the quoting flow, but two caveats matter: In some countries, due to local regulations, the rate shown is only an estimate and the actual rate is determined at payout time. If the receiver chooses to receive funds in a different currency than the sender selected, Western Union (or the agent/account provider) may collect additional money when converting.
                </p>
              </div>

              <div class="not-prose my-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p class="text-sm text-amber-800 m-0">
                  <strong>Delivered Value verdict:</strong> Western Union is transparent that it charges both fees and FX margin, and those together make delivered value inconsistent versus price-leading digital specialists. That is the core reason the score lands at 8.2, not 9+.
                </p>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    2
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">Reliability & Success (20%)</h2>
                </div>
                <div class="space-y-4 text-lg leading-relaxed text-slate-700">
                  <p>
                    Western Union scores "elite" here because it tends to be available and executable when other rails aren't.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Quote success / availability
                    </p>
                    <ul class="space-y-2.5 text-slate-700">
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Western Union positions itself as supporting transfers to 200+ countries/territories, and it highlights both online/app and in‑person access.</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Western Union also describes a very large agent network (around 500k+ locations depending on the page).</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Pricing stability & data freshness signals
                    </p>
                    <p class="text-slate-700 mb-3">Exchange rates are adjusted several times daily (fresh pricing, but not "stable").</p>
                    <p class="text-slate-700 mb-0">Western Union also flags that fees/rates can vary by channel and location and are subject to change without notice—so the "best" price can shift depending on whether you pay in-store vs online, card vs bank, etc.</p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Reliability caveat: compliance holds can happen
                    </p>
                    <p class="text-slate-700 mb-0">Western Union states it screens transactions against sanctions lists and may require additional information, which can delay transfers. Its FAQs also describe "on hold" scenarios and additional documentation requests.</p>
                  </div>
                </div>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    3
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">Friction & Speed (15%)</h2>
                </div>
                <div class="space-y-4 text-lg leading-relaxed text-slate-700">
                  <p>
                    This measures how quickly funds arrive in practice and how much effort is required (setup, verification, payment steps, payout complexity).
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      ETA / speed buckets
                    </p>
                    <p class="text-slate-700 mb-3">Western Union's practical speed breaks into a few buckets:</p>
                    <ul class="space-y-2.5 text-slate-700">
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span><strong class="text-slate-900">Minutes:</strong> Cash pickup can be available within minutes for many services/corridors.</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span><strong class="text-slate-900">Same day to a few business days:</strong> Depending on the delivery and payment method, Western Union notes transfers can be available within minutes or within a few working days.</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span><strong class="text-slate-900">Bank deposit variability:</strong> Western Union's US "receive money" page says funds can arrive in minutes in some cases, but can take up to four business days in others.</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Payout methods (what recipients can use)
                    </p>
                    <p class="text-slate-700 mb-3">Western Union commonly supports:</p>
                    <div class="flex flex-wrap gap-2 mb-3">
                      <span class="px-3 py-1 rounded-full bg-white border border-slate-200 text-sm text-slate-700">Cash pickup at agent locations</span>
                      <span class="px-3 py-1 rounded-full bg-white border border-slate-200 text-sm text-slate-700">Bank account deposit</span>
                      <span class="px-3 py-1 rounded-full bg-white border border-slate-200 text-sm text-slate-700">Mobile wallet</span>
                    </div>
                    <p class="text-slate-700 mb-0">Mobile wallet in some corridors ("where available").</p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Typical delivery-speed behavior
                    </p>
                    <p class="text-slate-700 mb-0">The fastest experience is usually cash pickup or certain wallet/card rails, while bank deposit is more dependent on banking partners, local rules, and timing. Western Union explicitly notes delays can occur due to factors like destination, currency availability, regulations, ID requirements, and partner system availability.</p>
                  </div>
                </div>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    4
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">Support & Refunds (15%)</h2>
                </div>
                <div class="space-y-4 text-lg leading-relaxed text-slate-700">
                  <p>
                    This category is about what happens after something goes wrong: refunds, cancellations, dispute handling, and how hard it is to reach a human.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Support access
                    </p>
                    <p class="text-slate-700 mb-0">Western Union offers customer support via its help center and contact channels (chat/contact pages vary by country).</p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Refund and cancellation experience (what to expect)
                    </p>
                    <p class="text-slate-700 mb-3">Refund rules depend on jurisdiction and whether funds have already been paid out. Two concrete, documented examples:</p>
                    <ul class="space-y-2.5 text-slate-700">
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span><strong class="text-slate-900">United States (remittance transfers):</strong> Western Union's "Error Resolution and Cancellation Disclosures" state you can cancel within 30 minutes of payment (if funds have not been picked up/deposited) and Western Union will refund within three business days of the request.</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span><strong class="text-slate-900">EEA (WUPSIL terms):</strong> You may cancel up to the time the receiver picks up the money, but the transfer fee may be deducted, and refunds "typically take up to 10 business days" (as described in WUPSIL terms).</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Dispute handling and post-issue friction
                    </p>
                    <p class="text-slate-700 mb-0">In the US disclosure, Western Union says you must contact them within 180 days of the promised availability date to report an error; they determine whether an error occurred within 90 days and provide results within three business days after completing the investigation.</p>
                    <p class="text-slate-700 mt-3 mb-0"><strong class="text-slate-900">Practical implication:</strong> Western Union has structured processes, but your ability to get a clean resolution depends heavily on when you report and whether the money has already been paid out.</p>
                  </div>
                </div>
              </div>

              <div class="mb-20">
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
                      Public licensing / regulatory checks (examples)
                    </p>
                    <ul class="space-y-2.5 text-slate-700">
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span><strong class="text-slate-900">EEA:</strong> Western Union Payment Services Ireland Limited (WUPSIL) is stated as regulated by the Central Bank of Ireland in its terms; the Central Bank register provides a public firm profile for WUPSIL.</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span><strong class="text-slate-900">UK:</strong> Western Union's UK online service is offered by Western Union Payment Services GB Limited (WUPSGL), stated as authorized by the Financial Conduct Authority (FCA).</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <svg class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span><strong class="text-slate-900">United States:</strong> Western Union publishes state licensing information (money transmitter / sale of checks / etc.) by state in its licensing PDFs.</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Safety behavior and compliance friction (real-world)
                    </p>
                    <p class="text-slate-700 mb-0">Western Union states it screens transactions against sanctions lists and may request additional identity information, which can delay transfers. This is a trust-and-safety positive, but it can also add friction in borderline cases.</p>
                  </div>
                </div>
              </div>
              <div class="not-prose my-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p class="text-sm text-amber-800 m-0">
                  <strong>Important caveat:</strong> Licensing, permitted activities, and coverage can differ by country and product. You can usually verify the provider's regulatory presence in your sending country via official registries — but the exact legal entity and permissions vary by region.
                </p>
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
                      <span><strong>Reliability & Success:</strong> Extremely broad physical payout reach — Western Union cites ~500,000+ agent locations across 200+ countries and territories.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-emerald-600 font-bold">+</span>
                      <span><strong>Friction & Speed:</strong> "Cash pickup in minutes" is a core offering; for many corridors, recipients can collect quickly once the transfer is processed.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-emerald-600 font-bold">+</span>
                      <span><strong>Trust & Safety:</strong> Strong "checkability" — Western Union's online services are offered by regulated entities depending on jurisdiction (e.g., WUPSIL regulated by the Central Bank of Ireland in the EEA; WUPSGL authorized by the UK FCA in the UK).</span>
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
                      <span><strong>Delivered Value:</strong> Western Union's FX rate is interbank + margin, and any difference between the customer rate and what Western Union receives is kept by Western Union (sometimes also agents/wallet providers) — this is often where higher effective cost shows up.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-amber-600 font-bold">−</span>
                      <span><strong>Delivered Value / Accuracy:</strong> Fees and FX rates vary by brand/channel/location/payment method, and in some countries the rate shown can be only an estimate until payout (regulatory constraints).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-amber-600 font-bold">−</span>
                      <span><strong>Support & Refunds:</strong> Cancellations/refunds are time- and status-dependent (e.g., in the US you have a 30‑minute cancellation right for remittance transfers; after payout, refunds typically aren't possible).</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <div class="grid md:grid-cols-2 gap-8 mb-22">
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
                      <span>Emergency cash pickup when the receiver needs money today and you want the highest likelihood of "they can collect it nearby." Western Union advertises "pickup in minutes" in many corridors and has a very large agent network.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Hard-to-serve destinations where smaller app-only providers don't have payout coverage or where bank rails are unreliable. (This is where Western Union's footprint tends to matter most.)</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Senders who value availability and execution over minimizing fees/spread (e.g., time-sensitive family support, travel, urgent bills).</span>
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
                      <span>Cost-first shoppers sending repeat transfers where the recipient can accept bank deposit or wallet payments—Western Union's effective cost can be higher due to fees + FX margin.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>People who want predictable "exact amount received" delivery: rates can change multiple times daily, and in some countries the displayed rate can be an estimate until payout (local rules).</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Users who are likely to trigger additional verification / compliance holds, because that can add friction and delay even if the corridor is normally fast.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <div class="mb-20">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <svg class="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  How to Get the Best Rate with Western Union
                </h2>
                <p class="text-lg text-slate-600 mb-6">
                  A quick checklist that usually saves money:
                </p>
                <div class="space-y-3">
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">1</div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Compare payout methods:</strong>
                      <span class="text-slate-700">Cash pickup is convenient, but bank deposit or wallet (where available) can sometimes reduce the effective cost—check "receiver gets" before paying.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">2</div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Compare funding methods:</strong>
                      <span class="text-slate-700">Card funding is convenient but can be pricier; check the final quote for both bank and card if you have the option.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">3</div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Focus on the exchange rate, not just fees:</strong>
                      <span class="text-slate-700">Western Union rates are interbank + margin; the margin is often the biggest cost driver.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">4</div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Move quickly once you're happy with the quote:</strong>
                      <span class="text-slate-700">rates update several times daily; in some corridors the rate shown may be an estimate until payout.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">5</div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">If you made a mistake, cancel fast:</strong>
                      <span class="text-slate-700">in the US there's a 30‑minute cancellation window with a 3‑business‑day refund requirement (if funds haven't been picked up/deposited).</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <div class="mb-20">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <svg class="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Two Alternatives (and When They Beat Western Union)
                </h2>

                <div class="space-y-6">
                  <div class="p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-brand-300 transition-colors">
                    <h3 class="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600"></span>
                      Remitly (9.1)
                    </h3>
                    <p class="text-slate-700 mb-3">
                      <strong class="text-slate-900">When Remitly beats Western Union:</strong> if you don't specifically need instant cash pickup reach and you're optimizing for a better price/speed balance, Remitly's "Express vs Economy" style options can be a better fit (with the known tradeoff that Express can cost more).
                    </p>
                    <p class="text-slate-700 mb-0">
                      <strong class="text-slate-900">Choose Remitly over Western Union when:</strong> This is especially true when the recipient can accept bank deposit or other digital rails.
                    </p>
                  </div>

                  <div class="p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-brand-300 transition-colors">
                    <h3 class="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600"></span>
                      Sendwave (9.0)
                    </h3>
                    <p class="text-slate-700 mb-3">
                      <strong class="text-slate-900">When Sendwave beats Western Union:</strong> if your corridor is supported and the recipient wants instant mobile money with minimal friction, Sendwave can beat Western Union on convenience and (often) delivered value—while you still keep an eye on FX spread as the key cost driver.
                    </p>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

              <div class="mb-20">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <svg class="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Bottom Line
                </h2>
                <div class="space-y-5 text-lg leading-relaxed text-slate-700">
                  <div class="p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3">Use Western Union if:</p>
                    <p class="text-slate-800 mb-0">
                      You prioritize reliability, availability, and instant cash pickup reach—especially for urgent situations or destinations where bank/wallet rails aren't dependable. Western Union's scale (around 500k+ agent locations across 200+ countries/territories) is the core differentiator that justifies a strong overall score.
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3">Why the 8.2/10 is justified:</p>
                    <p class="text-slate-800 mb-0">
                      Western Union is "elite" on Reliability & Success and Friction & Speed for cash pickup, but Delivered Value (40%) is held back by higher effective cost—fees plus an exchange rate that is explicitly interbank + margin, with prices varying by channel and corridor. In other words: you're often paying a premium for reach and immediacy.
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
                  See how Western Union stacks up for your specific corridor and amount.
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
                    <dt class="text-slate-600">Founded</dt>
                    <dd class="font-semibold text-slate-900">1851</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Countries</dt>
                    <dd class="font-semibold text-slate-900">200+</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Agent Locations</dt>
                    <dd class="font-semibold text-slate-900">500k+</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Cash Pickup</dt>
                    <dd class="font-semibold text-slate-900">Minutes</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">Headquarters</dt>
                    <dd class="font-semibold text-slate-900">Denver, USA</dd>
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
                    <NuxtLink to="/learn/providers/sendwave" class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600">
                      <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-xs font-bold text-green-600">SW</div>
                      <span>Sendwave Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink to="/learn/providers/wise" class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600">
                      <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">W</div>
                      <span>Wise Review</span>
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
          Ready to See How Western Union Compares?
        </h2>
        <p class="text-lg mb-8" style="color: rgba(255, 255, 255, 1);">
          Enter your transfer details to see real-time rates from Western Union and 30+ other providers.
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
import { computed } from 'vue'
definePageMeta({
  alias: ['/reviews/western-union'],
})

useHead({
  title: 'Western Union Review 2024 - Remit-Score 8.2/10 | Remit-Scout',
  meta: [
    {
      name: 'description',
      content: 'Independent Western Union review with Remit-Score 8.2/10. Elite reliability + instant cash pickup reach; delivered value inconsistent due to higher effective cost. Detailed breakdown of fees, speed, and delivered value.',
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: 'Western Union Review', path: '/learn/providers/western-union' },
]
const score = 8.2

const scoreColor = computed(() => {
  if (score >= 9.0) return '#10b981'
  if (score >= 8.0) return '#2563eb'
  if (score >= 7.0) return '#eab308'
  return '#6b7280'
})

const scoreTextClass = computed(() => {
  if (score >= 9.0) return 'text-green-600'
  if (score >= 8.0) return 'text-brand-600'
  if (score >= 7.0) return 'text-yellow-600'
  return 'text-neutral-600'
})
</script>
