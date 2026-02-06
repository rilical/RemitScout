<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative bg-gray-900 py-16 lg:py-24 overflow-hidden">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <nav class="mb-8 flex items-center space-x-2 text-sm text-white/70 relative z-10">
          <NuxtLink
            to="/"
            class="hover:text-white transition-colors cursor-pointer underline-offset-2 hover:underline relative z-10"
          >Home</NuxtLink>
          <span class="text-white/50">›</span>
          <NuxtLink
            to="/learn"
            class="hover:text-white transition-colors cursor-pointer underline-offset-2 hover:underline relative z-10"
          >Learn</NuxtLink>
          <span class="text-white/50">›</span>
          <NuxtLink
            to="/learn/providers"
            class="hover:text-white transition-colors cursor-pointer underline-offset-2 hover:underline relative z-10"
          >Providers</NuxtLink>
          <span class="text-white/50">›</span>
          <span class="font-medium text-white">Al Ansari Exchange Review</span>
        </nav>

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-4 mb-6">
              <div class="w-20 h-20 rounded-2xl bg-white p-3 shadow-xl">
                <div class="w-full h-full rounded-xl bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                  AAE
                </div>
              </div>
              <div>
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium mb-2">
                  <svg
                    class="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Provider Review
                </div>
                <h1 class="text-4xl sm:text-5xl font-bold text-white mb-2">
                  Al Ansari Exchange Review
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
                to="/send-money?provider=al-ansari-exchange"
                class="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-base font-semibold shadow-lg transition-all"
                style="background-color: rgba(255, 255, 255, 1); border-color: rgba(239, 246, 255, 1); color: rgba(0, 0, 0, 1);"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Compare Al Ansari Exchange Now
              </NuxtLink>
              <a
                href="#review"
                class="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-base font-semibold text-white transition-all"
                style="background-color: rgba(37, 99, 235, 1); border-color: rgba(239, 246, 255, 0.01);"
              >
                Read Full Review
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </a>
            </div>
          </div>

          <!-- Right: Score Card -->
          <div class="flex justify-center lg:justify-end">
            <div class="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full">
              <div class="text-center mb-6">
                <div class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  REMIT-SCOUT SCORE
                </div>
                <RemitScoreRing :score="score" />
              </div>

              <!-- Quick Rating Bars -->
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-black">Delivered Value</span>
                    <span class="font-semibold text-black">Moderate</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full" />
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-black">Reliability</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full" />
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-black">Speed</span>
                    <span class="font-semibold text-black">Moderate</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full" />
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-black">Support</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full" />
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-black">Trust & Safety</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full" />
                </div>
              </div>

              <div class="mt-6 pt-6 border-t border-slate-200 text-center">
                <p
                  class="text-xs"
                  style="color: rgba(17, 24, 39, 1);"
                >
                  Based on our independent methodology.<br>
                  <NuxtLink
                    to="/methodology"
                    class="font-semibold hover:text-brand-700"
                    style="color: rgba(37, 99, 235, 1);"
                  >Learn how we score →</NuxtLink>
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
            <div class="text-3xl font-bold text-slate-900">
              Branch-Based
            </div>
            <div class="text-sm text-slate-600">
              Service Model
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">
              200+
            </div>
            <div class="text-sm text-slate-600">
              Countries
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">
              Trust Focus
            </div>
            <div class="text-sm text-slate-600">
              Core Strength
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">
              In-Person
            </div>
            <div class="text-sm text-slate-600">
              Support Available
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section
      id="review"
      class="py-16 bg-white"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-3 gap-12">
          <!-- Main Content Column -->
          <div class="lg:col-span-2">
            <article class="max-w-none">
              <!-- Introduction -->
              <div class="relative mb-22 p-8 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 border-2 border-slate-200 shadow-sm">
                <div class="absolute top-4 right-4">
                  <svg
                    class="w-12 h-12 text-brand-600/20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <p class="text-xl text-slate-800 leading-relaxed relative z-10 font-medium">
                  This score explanation is rubric-driven and non-sponsored. With Delivered Value weighted at 40%, the "why" behind 7.9/10 starts with the real-world price you pay: fees + FX spread (the margin baked into the exchange rate). Al Ansari Exchange scores well on trust/reliability, but its delivered value is typically less competitive than app-first leaders, and the experience can involve more friction due to branch workflows.
                </p>
              </div>

              <div class="mb-22">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-gradient-to-b from-brand-600 to-blue-700 rounded-full" />
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200">
                  <p class="text-lg text-slate-800 leading-relaxed italic m-0">
                    "Al Ansari Exchange (7.9): Trust/reliability strong; more friction (branch workflows) and less competitive delivered value vs app-first leaders."
                  </p>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

              <div class="mb-8">
                <h2 class="text-3xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <svg
                    class="w-7 h-7 text-brand-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Score Breakdown
                </h2>
                <p class="text-lg text-slate-600 mb-6">
                  Here's how Al Ansari Exchange performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-blue-50/50 to-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                    7.9
                  </div>
                  <div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                      Al Ansari Exchange
                    </h3>
                    <p class="text-sm text-black">
                      Remit-Score
                    </p>
                  </div>
                </div>
                <div class="grid sm:grid-cols-2 gap-4 mb-6">
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">
                        Delivered Value
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Moderate</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">
                      40% weight
                    </div>
                    <div class="text-sm text-slate-700 leading-relaxed">
                      Less competitive delivered value versus app-first leaders. The effective cost typically comes from explicit fees and FX spread.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">
                        Reliability
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">
                      20% weight
                    </div>
                    <div class="text-sm text-slate-700 leading-relaxed">
                      Strong "works when you need it" profile. Trust/reliability is a strength with standardized, repeatable processes.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">
                        Friction & Speed
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Moderate</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">
                      15% weight
                    </div>
                    <div class="text-sm text-slate-700 leading-relaxed">
                      More friction due to branch workflows, including travel/time and potential paperwork. Operational constraints can add delays.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">
                        Support & Refunds
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">
                      15% weight
                    </div>
                    <div class="text-sm text-slate-700 leading-relaxed">
                      In-person support can be helpful when something goes wrong (human-guided resolution vs app-only tickets), but still process-heavy.
                    </div>
                  </div>
                  <div class="sm:col-span-2 p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">
                        Trust & Safety
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">
                      10% weight
                    </div>
                    <div class="text-sm text-slate-700 leading-relaxed">
                      Generally aligns with expectations people have of established exchange-house style providers (with verifiable licensing checks where available).
                    </div>
                  </div>
                </div>
                <div class="mt-6 pt-6 border-t-2 border-brand-200 bg-white/40 rounded-xl p-4">
                  <div class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
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
                    <div class="flex-1">
                      <div class="font-semibold text-slate-900 mb-2.5">
                        Why 7.9 (not 8.5+):
                      </div>
                      <div class="text-sm text-slate-700 leading-relaxed">
                        The provider scores well on Reliability & Success and Trust & Safety, but the score is capped because Delivered Value (40%) is less competitive vs app-first leaders and the experience has more friction due to branch-based workflows—exactly as the auditor notes state.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    1
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">
                    Delivered Value (40%)
                  </h2>
                </div>
                <p class="text-lg text-slate-700 leading-relaxed mb-6">
                  Effective cost = fees + FX spread
                </p>
                <p class="text-lg text-slate-700 leading-relaxed mb-6">
                  For branch-heavy exchange/remittance providers, the effective cost typically comes from an explicit fee (often shown as a service charge), and FX spread (the difference between a mid-market reference rate and the rate you're offered).
                </p>
                <p class="text-lg text-slate-700 leading-relaxed mb-6">
                  Per the auditor notes, Al Ansari Exchange's delivered value is less competitive vs app-first leaders. In practical terms, that usually shows up as a rate that is not as tight, or an all-in outcome where the recipient receives less than what top price-leading apps would deliver for the same send amount and payout method.
                </p>

                <div class="p-6 rounded-xl border-2 border-emerald-200 mb-6">
                  <p class="font-semibold text-slate-900 mb-3">
                    "How often is it the cheapest?"
                  </p>
                  <p class="text-slate-800 leading-relaxed mb-4">
                    We're not claiming a universal "cheapest %" because no corridor-by-corridor win rate was provided. The safe, consumer-usable guidance is:
                  </p>
                  <ul class="space-y-2.5 text-slate-800">
                    <li class="flex items-start gap-2.5">
                      <span class="text-emerald-600 font-bold mt-0.5">•</span>
                      <span>Assume it won't be the cheapest by default if you compare against app-first leaders built to compete primarily on price.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <span class="text-emerald-600 font-bold mt-0.5">•</span>
                      <span>Treat Al Ansari Exchange as "competitive enough when the convenience/reliability tradeoff is worth it," not "price leader."</span>
                    </li>
                  </ul>
                </div>

                <div class="not-prose my-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p class="text-sm text-blue-800 m-0">
                    <strong>Quote vs delivered accuracy:</strong> Branch workflows can have one advantage: you often get a clear quote at the time you initiate, and once you agree and pay, the transaction is executed without the "quote drift" that can happen in long app checkout flows. Where surprises can still occur: different totals depending on payout method (bank vs cash vs wallet), and downstream partner constraints that affect timing or deductions in some corridors.
                  </p>
                </div>

                <div class="not-prose my-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p class="text-sm text-amber-800 m-0">
                    <strong>Delivered Value takeaway:</strong> This is the main reason the score is 7.9 rather than 8.5+. If you're willing to compare app-first options, you'll often find a better delivered amount.
                  </p>
                </div>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    2
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">
                    Reliability & Success (20%)
                  </h2>
                </div>
                <div class="space-y-4 text-lg leading-relaxed text-slate-700">
                  <p>
                    This is where Al Ansari Exchange scores strongly.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Quote success / availability
                    </p>
                    <p class="text-slate-700 mb-0">
                      Per the auditor note, trust/reliability is a strength. In real usage, that tends to mean the provider is dependable for completing common transfers, and processes are standardized and repeatable.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Pricing stability
                    </p>
                    <p class="text-slate-700 mb-0">
                      Even if the price isn't always best-in-market, the "branch model" often produces a clear quote at the moment you transact, and less ambiguity about what you agreed to (receipt/confirmation at the time of payment).
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Data freshness signals
                    </p>
                    <p class="text-slate-700 mb-0">
                      For consumers, a practical "freshness" signal is whether you can get a current rate quote immediately before sending, and confirm the final "recipient receives" at the point of transaction.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-emerald-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Reliability takeaway
                    </p>
                    <p class="text-slate-700 mb-0">
                      Strong—one of the main reasons people choose branch-based exchanges in the first place.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    3
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">
                    Friction & Speed (15%)
                  </h2>
                </div>
                <div class="space-y-4 text-lg leading-relaxed text-slate-700">
                  <p>
                    Because the auditor note highlights branch workflows, speed is typically best thought of in buckets.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      ETA / speed buckets (what to expect conceptually)
                    </p>
                    <ul class="space-y-2.5 text-slate-700">
                      <li class="flex items-start gap-2.5">
                        <svg
                          class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span><strong class="text-slate-900">Immediate / same-session:</strong> initiation and confirmation can be fast once you're in-branch and verified</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <svg
                          class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
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
                        <span><strong class="text-slate-900">Same-day to next-day:</strong> common for many bank-integrated corridors</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <svg
                          class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
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
                        <span><strong class="text-slate-900">Bank-timed:</strong> if the transfer relies on bank processing windows, weekends/holidays can stretch timelines</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Payout methods
                    </p>
                    <p class="text-slate-700 mb-0">
                      We're not asserting specific payout methods without corridor-level data here. The key user action is: choose the payout method that matches your recipient's reality (bank account vs cash-like access), then compare providers on the same method.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Typical delivery-speed behavior
                    </p>
                    <p class="text-slate-700 mb-0">
                      Even when delivery can be fast, "more friction" often comes from branch hours and travel time, additional steps for compliance/verification, and manual intervention if something doesn't match (name/ID/details).
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Friction & Speed takeaway
                    </p>
                    <p class="text-slate-700 mb-0">
                      Often "fast enough," but not the lowest-friction model versus app-first competitors.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    4
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">
                    Support & Refunds (15%)
                  </h2>
                </div>
                <div class="space-y-4 text-lg leading-relaxed text-slate-700">
                  <p>
                    In-person providers can be a mixed bag.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Refund experience
                    </p>
                    <p class="text-slate-700 mb-3">
                      <strong class="text-slate-900">Positive:</strong> you can speak to a person and resolve straightforward issues faster
                    </p>
                    <p class="text-slate-700 mb-0">
                      <strong class="text-slate-900">Negative:</strong> refunds/changes can require returning to a branch, providing documentation, and waiting on reversals (especially if funds have already moved)
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Dispute handling and post-issue friction
                    </p>
                    <p class="text-slate-700 mb-0">
                      Post-issue friction is usually driven by whether the transfer has already been paid out, whether downstream partners need to confirm status, and how quickly you report the issue.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Support & Refunds takeaway
                    </p>
                    <p class="text-slate-700 mb-0">
                      Potentially strong human support, but still process-heavy—especially once funds have progressed.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    5
                  </div>
                  <h2 class="text-3xl font-bold text-slate-900">
                    Trust & Safety (10%)
                  </h2>
                </div>
                <div class="space-y-4 text-lg leading-relaxed text-slate-700">
                  <p>
                    The auditor note says trust/reliability strong, and this category focuses on what you can verify without over-claiming.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Public licensing/regulatory checks "where available"
                    </p>
                    <p class="text-slate-700 mb-3">
                      If trust is a deciding factor, do a quick check of:
                    </p>
                    <ul class="space-y-2.5 text-slate-700">
                      <li class="flex items-start gap-2.5">
                        <svg
                          class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0"
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
                        <span>The provider's licensing/registration with your relevant regulator (e.g., central bank/financial authority in the sending country), where public registries exist</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <svg
                          class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0"
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
                        <span>Whether receipts show clear provider identity, fees, and applied rate</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-emerald-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Trust & Safety takeaway
                    </p>
                    <p class="text-slate-700 mb-0">
                      Strong relative to many smaller niche apps, and generally aligned with established exchange-house expectations—while still encouraging verification where public records exist.
                    </p>
                  </div>
                </div>
              </div>
              <div class="not-prose my-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p class="text-sm text-amber-800 m-0">
                  <strong>Important caveat:</strong> Licensing, permitted activities, and coverage can differ by country and product. You can usually verify the provider's regulatory presence in your sending country via official registries — but the exact legal entity and permissions vary by region.
                </p>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

              <h2 class="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <svg
                  class="w-7 h-7 text-brand-600"
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
                Pros and Cons
              </h2>

              <div class="not-prose grid md:grid-cols-2 gap-6 my-8">
                <div class="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6">
                  <h3 class="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4 mt-0">
                    <svg
                      class="w-6 h-6 text-emerald-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Pros
                  </h3>
                  <ul class="space-y-2 text-slate-700 text-base">
                    <li class="flex items-start gap-2">
                      <span class="text-emerald-600 font-bold">+</span>
                      <span><strong>Reliability & Success:</strong> Strong "works when you need it" profile (auditor note: trust/reliability strong).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-emerald-600 font-bold">+</span>
                      <span><strong>Support & Refunds:</strong> In-person support can be helpful when something goes wrong (human-guided resolution vs app-only tickets).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-emerald-600 font-bold">+</span>
                      <span><strong>Trust & Safety:</strong> Generally aligns with expectations people have of established exchange-house style providers (with verifiable licensing checks where available).</span>
                    </li>
                  </ul>
                </div>
                <div class="rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
                  <h3 class="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4 mt-0">
                    <svg
                      class="w-6 h-6 text-amber-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Cons
                  </h3>
                  <ul class="space-y-2 text-slate-700 text-base">
                    <li class="flex items-start gap-2">
                      <span class="text-amber-600 font-bold">−</span>
                      <span><strong>Delivered Value:</strong> Less competitive delivered value versus app-first leaders (auditor note).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-amber-600 font-bold">−</span>
                      <span><strong>Friction & Speed:</strong> More friction due to branch workflows (auditor note), including travel/time and potential paperwork.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-amber-600 font-bold">−</span>
                      <span><strong>Friction & Speed / Support:</strong> Operational constraints (branch hours, processing windows, downstream partner rules) can add delays or follow-ups versus pure app-first flows.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

              <div class="grid md:grid-cols-2 gap-8 mb-22">
                <div class="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                  <h2 class="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg
                      class="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Best For
                  </h2>
                  <ul class="space-y-3 text-slate-700">
                    <li class="flex items-start gap-2.5">
                      <svg
                        class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>People who prioritize trust and reliable execution over getting the absolute cheapest all-in price every time.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg
                        class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Senders who prefer in-person workflows (or need them) and want a structured, familiar process.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg
                        class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Corridors where the practical constraint is access (e.g., the recipient needs a method that's easier through a branch-based provider).</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                  <h2 class="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg
                      class="w-6 h-6 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Not Ideal For
                  </h2>
                  <ul class="space-y-3 text-slate-700">
                    <li class="flex items-start gap-2.5">
                      <svg
                        class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span>Price-maximizers who want the best "recipient gets" amount and are willing to compare app-first providers each time.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg
                        class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span>Anyone who needs a fully digital, low-friction experience end-to-end (branch workflows add steps).</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg
                        class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span>Users who need always-fast, instant delivery behavior across many corridors and methods (branch + bank rails can be more variable).</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

              <div class="mb-20">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <svg
                    class="w-7 h-7 text-brand-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  How to Get the Best Rate with Al Ansari Exchange
                </h2>
                <p class="text-lg text-slate-600 mb-6">
                  A short, practical checklist:
                </p>
                <div class="space-y-3">
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      1
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Ask for the all-in outcome:</strong>
                      <span class="text-slate-700">"How much will the recipient receive?" (not just the fee).</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      2
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Compare one app-first quote:</strong>
                      <span class="text-slate-700">for the same send amount + payout method before committing (spread is often the real cost driver).</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      3
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Check whether the rate differs by channel:</strong>
                      <span class="text-slate-700">branch vs any digital option, if available.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      4
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Avoid unnecessary convenience add-ons:</strong>
                      <span class="text-slate-700">if they increase fees or worsen the rate.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      5
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Verify payout method + recipient details:</strong>
                      <span class="text-slate-700">name spelling, bank details/ID requirements to reduce delays and refund friction.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

              <div class="mb-20">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <svg
                    class="w-7 h-7 text-brand-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Two Alternatives (and When They Beat Al Ansari Exchange)
                </h2>

                <div class="space-y-6">
                  <div class="p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-brand-300 transition-colors">
                    <h3 class="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      Remitly (9.1)
                    </h3>
                    <p class="text-slate-700 mb-3">
                      <strong class="text-slate-900">When Remitly beats Al Ansari Exchange:</strong> If you want an app-first experience with strong execution and you're comparing "recipient gets" outcomes, Remitly will often win on convenience and can be more competitive on delivered value—especially when you don't need a branch workflow.
                    </p>
                  </div>

                  <div class="p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-brand-300 transition-colors">
                    <h3 class="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      XE Money (8.7)
                    </h3>
                    <p class="text-slate-700 mb-3">
                      <strong class="text-slate-900">When XE Money beats Al Ansari Exchange:</strong> If you want a solid all-rounder with reliable quotes and a more digital flow, XE can be a better fit—particularly when you're okay with bank-timed delivery and you want to avoid branch friction.
                    </p>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

              <div class="mb-20">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <svg
                    class="w-7 h-7 text-brand-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Bottom Line
                </h2>
                <div class="space-y-5 text-lg leading-relaxed text-slate-700">
                  <div class="p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3">
                      Who should use Al Ansari Exchange:
                    </p>
                    <p class="text-slate-800 mb-0">
                      People who value trust and reliable execution and are comfortable with branch workflows, especially when the practical goal is "get it done correctly" rather than "always get the absolute best rate."
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3">
                      Why the 7.9/10 is justified:
                    </p>
                    <p class="text-slate-800 mb-0">
                      The provider scores well on Reliability & Success and Trust & Safety, but the score is capped because Delivered Value (40%) is less competitive vs app-first leaders and the experience has more friction due to branch-based workflows—exactly as the auditor notes state.
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
                <h3 class="text-lg font-bold text-slate-900 mb-2">
                  Ready to Compare?
                </h3>
                <p class="text-sm text-slate-600 mb-4">
                  See how Al Ansari Exchange stacks up for your specific corridor and amount.
                </p>
                <NuxtLink
                  to="/send-money"
                  class="block w-full rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  Compare Rates Now
                </NuxtLink>
              </div>

              <AdPlacement
                placement="blog_sidebar"
                layout="vertical"
                wrapper-class="rounded-xl"
                min-height="160px"
              />
              <!-- Quick Facts -->
              <div class="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-4">
                  Quick Facts
                </h3>
                <dl class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-slate-600">
                      Service Model
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      Branch-Based
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">
                      Countries
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      200+
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">
                      Core Strength
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      Trust & Reliability
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">
                      Support
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      In-Person
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">
                      Typical Speed
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      Same-Day to Next-Day
                    </dd>
                  </div>
                </dl>
              </div>

              <!-- Why Trust Us -->
              <div class="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-4">
                  Why Trust This Review?
                </h3>
                <ul class="space-y-3 text-sm text-slate-700">
                  <li class="flex items-start gap-2">
                    <svg
                      class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>100% independent - providers can't pay to rank higher</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg
                      class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Based on real transfer data</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg
                      class="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Transparent methodology</span>
                  </li>
                </ul>
                <NuxtLink
                  to="/methodology"
                  class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  See our methodology
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </NuxtLink>
              </div>

              <!-- More Providers -->
              <div class="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-4">
                  More Provider Reviews
                </h3>
                <ul class="space-y-3">
                  <li>
                    <NuxtLink
                      to="/learn/providers/remitly"
                      class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">R</div>
                      <span>Remitly Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink
                      to="/learn/providers/xe-money"
                      class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">XE</div>
                      <span>XE Money Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink
                      to="/learn/providers/ria"
                      class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">RIA</div>
                      <span>Ria Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink
                      to="/learn/providers"
                      class="flex items-center gap-3 text-sm font-semibold text-brand-600 hover:text-brand-700"
                    >
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
    <section
      class="py-16 bg-blue-600"
      style="background-color: rgba(37, 99, 235, 1);"
    >
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2
          class="text-3xl font-bold mb-4"
          style="color: rgba(255, 255, 255, 1);"
        >
          Ready to See How Al Ansari Exchange Compares?
        </h2>
        <p
          class="text-lg mb-8"
          style="color: rgba(255, 255, 255, 1);"
        >
          Enter your transfer details to see real-time rates from Al Ansari Exchange and 30+ other providers.
        </p>
        <NuxtLink
          to="/send-money"
          class="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold shadow-lg transition-all"
          style="background-color: rgba(255, 255, 255, 1); border: 1px solid rgba(239, 246, 255, 0.1); color: rgba(0, 0, 0, 1);"
        >
          Compare Rates Now
          <svg
            class="w-5 h-5"
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
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'
import { useStructuredData } from '~/composables/useStructuredData'

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://remit-scout.com'

const score = 7.9

setSeo({
  title: 'Al Ansari Exchange Review 2024 - Remit-Score 7.9/10 | Remit-Scout',
  description: 'Independent Al Ansari Exchange review with Remit-Score 7.9/10. Trust/reliability strong; more friction (branch workflows) and less competitive delivered value vs app-first leaders. Detailed breakdown of fees, speed, and delivered value.',
  canonical: `${siteUrl}/learn/providers/al-ansari-exchange`,
  ogImage: `${siteUrl}/og-images/provider-al-ansari-exchange.jpg`,
})

const { addReviewSchema } = useStructuredData()
const reviewBody = `Al Ansari Exchange earns a Remit-Score of 7.9/10 based on our independent analysis. The provider shows strong trust and reliability, though with more friction due to branch workflows and less competitive delivered value compared to app-first leaders. Detailed breakdown of fees, speed, and delivered value based on real transfer data.`

addReviewSchema({
  itemReviewed: 'Al Ansari Exchange',
  reviewBody,
  author: 'Remit-Scout Editorial Team',
  ratingValue: score,
  bestRating: 10,
  worstRating: 1,
  datePublished: '2024-01-01',
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: 'Al Ansari Exchange Review', path: '/learn/providers/al-ansari-exchange' },
]
</script>
