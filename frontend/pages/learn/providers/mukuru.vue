<template>
  <div class="min-h-screen bg-surface">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative bg-neutral-900 py-16 lg:py-24 overflow-hidden">
      <div class="mx-auto max-w-page px-page-x relative">
        <nav class="mb-8 flex items-center space-x-2 text-body-sm text-white/70 relative z-10">
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
          <span class="font-medium text-white">Mukuru Review</span>
        </nav>

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-4 mb-6">
              <div class="w-20 h-20 rounded-2xl bg-surface p-3 shadow-xl">
                <div class="w-full h-full rounded-xl bg-primary-500 flex items-center justify-center text-white text-h4 font-bold">
                  M
                </div>
              </div>
              <div>
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface/10 text-white text-body-sm font-medium mb-2">
                  <svg
                    class="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Provider Review
                </div>
                <h1 class="text-h1 font-bold text-white mb-2">
                  Mukuru Review
                </h1>
                <p class="text-h4 text-neutral-300">
                  Independent Remit-Scout Analysis
                </p>
              </div>
            </div>

            <p class="text-body-lg text-white/90 leading-relaxed mb-8">
              A data-driven review based on real transfer outcomes - not paid endorsements. We evaluate what matters most: <strong class="text-white">how much money actually arrives</strong>.
            </p>

            <div class="flex flex-wrap gap-4">
              <NuxtLink
                to="/send-money?provider=mukuru"
                class="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-body font-semibold shadow-lg transition-all"
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
                Compare Mukuru Now
              </NuxtLink>
              <a
                href="#review"
                class="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-body font-semibold text-white transition-all"
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
            <div class="bg-surface rounded-3xl p-8 shadow-2xl max-w-sm w-full">
              <div class="text-center mb-6">
                <div class="text-body-sm font-semibold text-rs-muted uppercase tracking-wider mb-2">
                  REMIT-SCOUT SCORE
                </div>
                <RemitScoreRing :score="score" />
              </div>

              <!-- Quick Rating Bars -->
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between text-body-sm mb-2">
                    <span class="text-black">Delivered Value</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full" />
                </div>
                <div>
                  <div class="flex justify-between text-body-sm mb-2">
                    <span class="text-black">Reliability</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full" />
                </div>
                <div>
                  <div class="flex justify-between text-body-sm mb-2">
                    <span class="text-black">Speed</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full" />
                </div>
                <div>
                  <div class="flex justify-between text-body-sm mb-2">
                    <span class="text-black">Support</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full" />
                </div>
                <div>
                  <div class="flex justify-between text-body-sm mb-2">
                    <span class="text-black">Trust & Safety</span>
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full" />
                </div>
              </div>

              <div class="mt-6 pt-6 border-t border-rs-border text-center">
                <p
                  class="text-body-sm"
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
    <section class="bg-neutral-50 border-y border-rs-border py-6">
      <div class="mx-auto max-w-page px-page-x">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              Africa
            </div>
            <div class="text-body-sm text-neutral-600">
              Focused Rails
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-success-600">
              Instant
            </div>
            <div class="text-body-sm text-neutral-600">
              Cash Collection
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              Multi-Channel
            </div>
            <div class="text-body-sm text-neutral-600">
              Access Options
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              Large
            </div>
            <div class="text-body-sm text-neutral-600">
              Payout Network
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section
      id="review"
      class="py-16 bg-surface"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="grid lg:grid-cols-3 gap-12">
          <!-- Main Content Column -->
          <div class="lg:col-span-2">
            <article class="max-w-none">
              <!-- Introduction -->
              <div class="relative mb-22 p-8 rounded-2xl bg-gradient-to-br from-neutral-50 via-primary-50/30 to-neutral-50 border-2 border-rs-border shadow-sm">
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
                <p class="text-h4 text-neutral-800 leading-relaxed relative z-10 font-medium">
                  Mukuru's 8.4/10 sits in the "strong specialist" range: it tends to perform best when you're sending into cash pick-up and mobile-money-style rails in Africa, where reach and on-the-ground payout options matter as much as pure price. The score is held back mainly by Delivered Value (40% of the rubric) being more variable than the very top providers—because the effective cost can swing meaningfully by corridor, funding method, and payout method.
                </p>
              </div>

              <div class="mb-22">
                <h2 class="text-h2 font-bold text-rs-fg mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-gradient-to-b from-brand-600 to-brand-700 rounded-full" />
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-gradient-to-br from-neutral-50 to-primary-50 border-2 border-rs-border">
                  <p class="text-body-lg text-neutral-800 leading-relaxed italic m-0">
                    "Mukuru (8.4): Africa-focused rails; strong in-core reliability; good for cash/mobile money use cases; breadth/variance caps score."
                  </p>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="mb-8">
                <h2 class="text-h2 font-bold text-rs-fg mb-4 flex items-center gap-3">
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
                <p class="text-body-lg text-neutral-600 mb-6">
                  Here's how Mukuru performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-primary-50/50 to-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-h3 shadow-md">
                    8.4
                  </div>
                  <div>
                    <h3 class="text-h3 font-bold text-rs-fg mb-2 flex items-center gap-2">
                      Mukuru
                    </h3>
                    <p class="text-body-sm text-black">
                      Remit-Score
                    </p>
                  </div>
                </div>
                <div class="grid sm:grid-cols-2 gap-4 mb-6">
                  <div class="p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Delivered Value
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 text-body-sm font-bold">Good</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      40% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Effective cost is a mix of fees + exchange-rate margin, and it can be method/corridor dependent—so it's not safe to assume it's the cheapest without comparing. Value can be inconsistent outside its strongest lanes.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Reliability
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 text-body-sm font-bold">Good</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      20% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Large pay-in/payout footprint supports in-core availability where cash collection is necessary. Multiple channels (WhatsApp, USSD, call center, app, branches) reduce single-point-of-failure risk.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Friction & Speed
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 text-body-sm font-bold">Good</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      15% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Instant cash collection at branches/partners for some routes. Transfers processed instantly once payment is confirmed. Multiple payout methods: cash collection, bank account, mobile wallet.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Support & Refunds
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 text-body-sm font-bold">Good</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      15% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Clear cancellation pathways exist (different steps for unpaid vs paid orders). Refunds may be time-bound and can require documentation; fees/"delivery fees" may be non-refundable in some cases.
                    </div>
                  </div>
                  <div class="sm:col-span-2 p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Trust & Safety
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 text-body-sm font-bold">Good</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      10% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Remitix Limited (operating as Mukuru) is a regulated Authorised Payment Institution registered with the UK FCA. Mukuru Africa holds an Authorised Dealer in Foreign Exchange licence from the South African Reserve Bank.
                    </div>
                  </div>
                </div>
                <div class="mt-6 pt-6 border-t-2 border-brand-200 bg-surface/40 rounded-xl p-4">
                  <div class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0"
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
                      <div class="font-semibold text-rs-fg mb-2.5">
                        Why 8.4 (not 9.0+):
                      </div>
                      <div class="text-body-sm text-neutral-700 leading-relaxed">
                        Mukuru is reliably strong in-core and well-suited to cash/mobile use cases, but Delivered Value is more variable than the top-tier leaders: the all-in cost depends on fees + FX margin, and that mix can change by corridor, access point, and amount.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <!-- Best For / Not Ideal For -->
              <div class="grid md:grid-cols-2 gap-6 mb-22">
                <div class="p-6 rounded-xl bg-gradient-to-br from-success-600 to-success-50 border-2 border-success-600">
                  <h3 class="text-h4 font-bold text-rs-fg mb-4 flex items-center gap-2">
                    <svg
                      class="w-6 h-6 text-success-600"
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
                    Best for
                  </h3>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0"
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
                      <span>Cash pick-up / agent payout use cases in Mukuru's strongest African corridors (when the recipient needs physical collection points).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0"
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
                      <span>Senders who prefer assisted or low-tech channels (WhatsApp, USSD, call center, branches) rather than app-only flows.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0"
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
                      <span>Time-sensitive "bank deposit" corridors where Mukuru publishes fast ETAs (corridor-dependent).</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-600">
                  <h3 class="text-h4 font-bold text-rs-fg mb-4 flex items-center gap-2">
                    <svg
                      class="w-6 h-6 text-warning-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Not ideal for
                  </h3>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0"
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
                      <span>People optimizing purely for cheapest possible total cost every time (because fees vs FX margin vary by route and method, and Mukuru won't reliably win everywhere).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0"
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
                      <span>Senders needing truly broad global coverage with consistent product parity across many regions (Mukuru is strong in-core but "breadth/variance" limits the ceiling).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0"
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
                      <span>Anyone who wants "cancel anytime, fee-free" style flexibility—refund rules can be strict once funds are collected and some fees may not come back.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Pros and Cons -->
              <div class="grid md:grid-cols-2 gap-6 mb-22">
                <div class="p-6 rounded-xl bg-gradient-to-br from-success-600 to-success-50 border-2 border-success-600">
                  <h3 class="text-h4 font-bold text-rs-fg mb-4">
                    Pros
                  </h3>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0"
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
                      <span><strong class="text-rs-fg">Friction & Speed:</strong> Multiple ways to start a transfer (app, WhatsApp, USSD, call center, branches) reduces onboarding and "I can't use the app" failure modes.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0"
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
                      <span><strong class="text-rs-fg">Reliability & Success:</strong> Large pay-in/payout footprint (as reported by Mukuru) supports in-core availability where cash collection is necessary.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0"
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
                      <span><strong class="text-rs-fg">Support & Refunds:</strong> Clear cancellation pathways exist (different steps for unpaid vs paid orders).</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-600">
                  <h3 class="text-h4 font-bold text-rs-fg mb-4">
                    Cons
                  </h3>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0"
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
                      <span><strong class="text-rs-fg">Delivered Value:</strong> Effective cost is a mix of fees + exchange-rate margin, and it can be method/corridor dependent—so it's not safe to assume it's the cheapest without comparing.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0"
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
                      <span><strong class="text-rs-fg">Support & Refunds:</strong> Refunds may be time-bound and can require you to provide documentation; fees/"delivery fees" may be non‑refundable in some cases.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0"
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
                      <span><strong class="text-rs-fg">Trust & Safety / Reliability:</strong> Like most remittance flows, transfers may be delayed/cancelled due to compliance checks, business hours, or currency availability—important if you're on a deadline.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    1
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Delivered Value (40%)
                  </h2>
                </div>
                <p class="text-body-lg text-neutral-700 leading-relaxed mb-6">
                  Delivered Value is the biggest driver of the score. With Mukuru, the "price" you pay is best understood as two components:
                </p>
                <div class="mb-6 p-5 rounded-xl bg-neutral-50 border border-rs-border">
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">1</span>
                      <span><strong class="text-rs-fg">Explicit fees</strong> (what Mukuru calls the "Mukuru Money Transfer Service Fee").</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">2</span>
                      <span><strong class="text-rs-fg">FX spread / exchange-rate margin</strong> (the difference between the market reference rate and the rate applied). Public datasets like the World Bank's Remittance Prices Worldwide explicitly define total cost as fee + exchange rate margin.</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-primary-50 to-neutral-50 border-2 border-primary-200 mb-6">
                  <p class="font-semibold text-rs-fg mb-3 text-body">
                    What that means in practice
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-3">
                    Mukuru can look "cheap" on FX but still be expensive overall if the fee is the bigger component on your route. Conversely, a zero-fee competitor might make more of its money via a wider spread. The only way to know is to compare the final received amount for the same send amount and payout method.
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-0">
                    Mukuru's own terms define the Receive Amount as: the sender-designated amount minus the Mukuru fee, and then converted using the exchange rate quoted to the sender. That's the right mental model for "all‑in value": don't stop at "no fee" or "great rate" in isolation.
                  </p>
                </div>

                <div class="p-6 rounded-xl border-2 border-success-600">
                  <p class="font-semibold text-rs-fg mb-3">
                    "How often is it the cheapest?"
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-4">
                    We're not going to invent a "win rate" without corridor-by-corridor pricing logs. What we can say, data-first:
                  </p>
                  <p class="text-neutral-700 mb-0">
                    In at least one public corridor snapshot (World Bank Remittance Prices Worldwide for South Africa → Zimbabwe, data collected Jan 16–Mar 10, 2025), Mukuru appears with a non‑zero fee and a small quoted exchange‑rate margin for a standard send amount—illustrating that Mukuru's all‑in cost can be fee-heavy depending on access point and amount.
                  </p>
                  <p class="text-neutral-700 mt-3 mb-0">
                    That kind of structure is compatible with the auditor note "breadth/variance caps score": Mukuru can be excellent in-core, but value can be inconsistent outside its strongest lanes.
                  </p>
                </div>

                <div class="mt-6 p-5 rounded-xl bg-gradient-to-br from-primary-50 to-neutral-50 border-2 border-primary-200">
                  <p class="font-semibold text-rs-fg mb-3 text-body">
                    Quote vs delivered accuracy
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-3">
                    We don't claim perfection without post-transfer reconciliation data. What we look for are structural signals:
                  </p>
                  <ul class="space-y-2 text-neutral-700 mb-3">
                    <li>• Mukuru's terms explicitly define how the receive amount is computed (fee subtraction + conversion at quoted rate).</li>
                    <li>• Their FAQ language also reminds you rates are variable and subject to change—so treat the quote at checkout as the anchor, not a "typical rate you saw earlier."</li>
                  </ul>
                </div>
                <div class="mt-6 p-5 rounded-xl bg-neutral-50 border-l-4 border-brand-600">
                  <p class="font-semibold text-rs-fg mb-2">
                    Why this supports an 8.4/10 (not a 9+):
                  </p>
                  <p class="text-neutral-800 mb-0">
                    Mukuru's value proposition is strong when it fits the corridor/use case, but the effective cost can be less predictable than the top, consistently price-leading apps.
                  </p>
                </div>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    2
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Reliability & Success (20%)
                  </h2>
                </div>
                <div class="space-y-4 text-body-lg leading-relaxed text-neutral-700">
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Quote success / availability signals
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Mukuru supports placing orders via WhatsApp, USSD, call center, app, and branches (country-dependent), which reduces single‑point‑of‑failure risk for customers who can't (or don't want to) transact purely in-app.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      Mukuru reports a large pay‑in/payout footprint (hundreds of thousands of locations) and multi‑region presence, which typically correlates with better "recipient can actually get paid" outcomes in cash-based corridors.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-600">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Pricing stability + "data freshness" signals
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Publicly, you should assume prices move with FX markets and can differ by corridor; the World Bank dataset itself updates by collection periods and shows that costs vary by provider, amount, and method.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      Mukuru also discloses that transfers can be delayed/cancelled due to identity verification, compliance, business hours, or currency availability—important context if you're sending close to a deadline.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    3
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Friction & Speed (15%)
                  </h2>
                </div>
                <div class="space-y-4 text-body-lg leading-relaxed text-neutral-700">
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-success-600 to-success-50 border-2 border-success-600">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      ETA / speed buckets (what users can expect)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Mukuru markets instant cash collection at branches/partners for some routes, and it publishes corridor-specific claims like "bank transfers within an hour" for South Africa (note the asterisk—treat this as conditional, not guaranteed).
                    </p>
                    <p class="text-neutral-700 mb-0">
                      For Zimbabwe, Mukuru's FAQ states transfers are "processed instantly once payment is confirmed," which is a useful distinction: payment confirmation can be the gating factor if you pay via bank transfer/cash partner.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Payout methods (typical)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Across corridors (availability varies), Mukuru supports combinations of:
                    </p>
                    <ul class="space-y-2 text-neutral-700">
                      <li>• Cash collection at branches/booths/partners</li>
                      <li>• Bank account credit</li>
                      <li>• Mobile wallet / mobile money (where available and permitted)</li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-600">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      A "friction" detail that matters
                    </p>
                    <p class="text-neutral-700 mb-0">
                      In South Africa, Mukuru's terms describe a wiCode option for smaller remittances (&le; R2,999) with a 7‑day validity window, which is great for retail redemption but adds a "don't wait too long" constraint.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    4
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Support & Refunds (15%)
                  </h2>
                </div>
                <div class="space-y-4 text-body-lg leading-relaxed text-neutral-700">
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      What the documented refund/cancel experience looks like
                    </p>
                    <ul class="space-y-2 text-neutral-700 mb-3">
                      <li>• <strong class="text-rs-fg">Unpaid orders:</strong> can be cancelled via WhatsApp or USSD (flow documented in Mukuru's support article).</li>
                      <li>• <strong class="text-rs-fg">Paid orders:</strong> you may need to email proof of payment and bank details (again per Mukuru's support article).</li>
                      <li>• <strong class="text-rs-fg">Once collected:</strong> cancellations may not be possible (South Africa terms: once the recipient collects, the transaction is final and can't be reversed).</li>
                      <li>• <strong class="text-rs-fg">Refund timing:</strong> South Africa terms describe paying you back within 7 days of receiving funds back from the partner; another SA legal page similarly references refunds being available within 7 calendar days after the refund is received from the pay-out partner.</li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-600">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Friction after an issue
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Two practical takeaways:
                    </p>
                    <ul class="space-y-2 text-neutral-700">
                      <li>• Keep your receipt/proof of payment and ensure your refund bank details are accurate (support flow explicitly asks for these).</li>
                      <li>• If you selected add‑on delivery, note that some "delivery fee" types may be non‑refundable (where applicable).</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    5
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Trust & Safety (10%)
                  </h2>
                </div>
                <div class="space-y-4 text-body-lg leading-relaxed text-neutral-700">
                  <p>
                    We don't over-claim "regulated everywhere." We check what's publicly stated where available, and encourage users to verify based on their sending country.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Licensing / regulatory signals (where available)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Mukuru's general money transfer terms state that Remitix Limited (operating the service under the Mukuru brand where available) is a regulated Authorised Payment Institution registered with the UK Financial Conduct Authority (FCA), including an FCA registration number.
                    </p>
                    <p class="text-neutral-700 mb-3">
                      For South Africa, Mukuru's local terms state that Mukuru Africa holds an Authorised Dealer in Foreign Exchange with Limited Authority (Category 2) licence from the South African Reserve Bank, which is directly relevant to remittance operations there.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Safety behaviors Mukuru itself emphasizes
                    </p>
                    <ul class="space-y-2 text-neutral-700">
                      <li>• Their terms recommend sending money only to people you know and trust (standard, but still a useful reminder).</li>
                      <li>• Expect KYC/identity requirements depending on corridor and limits.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <!-- How to get the best rate -->
              <div class="mb-22 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                <h2 class="text-h3 font-bold text-rs-fg mb-4">
                  How to get the best rate with Mukuru
                </h2>
                <ul class="space-y-3 text-neutral-700">
                  <li class="flex items-start gap-2">
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span>Compare the final "recipient gets" number, not just the fee or headline rate (your effective cost is fee + spread).</span>
                  </li>
                  <li class="flex items-start gap-2">
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span>Test multiple payout methods (cash pick‑up vs bank vs wallet) because the fee/spread mix can change by method.</span>
                  </li>
                  <li class="flex items-start gap-2">
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span>Try different send amounts—fees can be flat or tiered, so the cheapest option at $50 might not be cheapest at $300.</span>
                  </li>
                  <li class="flex items-start gap-2">
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span>Confirm speed claims at checkout (especially when it matters), and plan around payment confirmation timing.</span>
                  </li>
                  <li class="flex items-start gap-2">
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span>Keep proof of payment in case you need to cancel/refund a paid order.</span>
                  </li>
                </ul>
              </div>

              <!-- Two alternatives -->
              <div class="mb-22">
                <h2 class="text-h3 font-bold text-rs-fg mb-6">
                  Two alternatives (and when they beat Mukuru)
                </h2>
                <div class="space-y-6">
                  <div class="p-6 rounded-xl bg-gradient-to-br from-neutral-50 to-primary-50 border-2 border-rs-border">
                    <h3 class="text-h4 font-bold text-rs-fg mb-3">
                      Sendwave (9.0)
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      Very low friction + instant mobile money in supported corridors; delivered value strong but watch spread; corridor breadth narrower.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      <strong class="text-rs-fg">Choose Sendwave over Mukuru when</strong> your corridor is supported and the recipient wants instant mobile money with minimal steps.
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-gradient-to-br from-neutral-50 to-primary-50 border-2 border-rs-border">
                    <h3 class="text-h4 font-bold text-rs-fg mb-3">
                      Remitly (9.1)
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      Very fast (express) + strong support; value strong but express can cost more; reliable execution; trust strong.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      <strong class="text-rs-fg">Choose Remitly over Mukuru when</strong> you want broader corridor options or you're prioritizing express delivery + strong support, and you're willing to pay more for express when needed.
                    </p>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <!-- Bottom line -->
              <div class="mb-22 p-8 rounded-2xl bg-gradient-to-br from-neutral-50 via-primary-50/30 to-neutral-50 border-2 border-rs-border">
                <h2 class="text-h2 font-bold text-rs-fg mb-4">
                  Bottom line
                </h2>
                <p class="text-body-lg text-neutral-700 leading-relaxed mb-4">
                  Use Mukuru if you're sending into its strongest Africa-focused corridors and your recipient benefits from cash pick-up or mobile-money-style payout rails, especially when you value availability and on-the-ground reach as much as pure price. Mukuru's multi-channel access (WhatsApp/USSD/call center/branches) also makes it a pragmatic choice for users who aren't app‑only.
                </p>
                <p class="text-body-lg text-neutral-700 leading-relaxed mb-0">
                  The 8.4/10 is justified because Mukuru is reliably strong in-core and well-suited to cash/mobile use cases, but Delivered Value is more variable than the top-tier leaders: the all‑in cost depends on fees + FX margin, and that mix can change by corridor, access point, and amount—so you should expect to compare before you commit.
                </p>
              </div>
            </article>
          </div>

          <!-- Sidebar -->
          <div class="lg:col-span-1">
            <div class="sticky top-40 space-y-6">
              <!-- Compare CTA -->
              <div class="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-primary-50 p-6">
                <h3 class="text-body-lg font-bold text-rs-fg mb-2">
                  Ready to Compare?
                </h3>
                <p class="text-body-sm text-neutral-600 mb-4">
                  See how Mukuru stacks up for your specific corridor and amount.
                </p>
                <NuxtLink
                  to="/send-money?provider=mukuru"
                  class="block w-full rounded-xl bg-brand-600 px-4 py-3 text-center text-body-sm font-semibold text-white hover:bg-brand-700 transition-colors"
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
              <div class="rounded-2xl border border-rs-border bg-surface p-6">
                <h3 class="text-body-lg font-bold text-rs-fg mb-4">
                  Quick Facts
                </h3>
                <dl class="space-y-3 text-body-sm">
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Founded
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      2004
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Headquarters
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      South Africa
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Specialty
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Africa Corridors
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Speed
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Instant - 2 Days
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Payout Methods
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Cash, Bank, Mobile
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Channels
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      App, WhatsApp, USSD
                    </dd>
                  </div>
                </dl>
              </div>

              <!-- Why Trust Us -->
              <div class="rounded-2xl border border-rs-border bg-surface p-6">
                <h3 class="text-body-lg font-bold text-rs-fg mb-4">
                  Why Trust This Review?
                </h3>
                <ul class="space-y-3 text-body-sm text-neutral-700">
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
                    <span>100% independent. Providers cannot pay to rank higher.</span>
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
                  class="mt-4 inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700"
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
              <div class="rounded-2xl border border-rs-border bg-surface p-6">
                <h3 class="text-body-lg font-bold text-rs-fg mb-4">
                  More Provider Reviews
                </h3>
                <ul class="space-y-3">
                  <li>
                    <NuxtLink
                      to="/learn/providers/remitly"
                      class="flex items-center gap-3 text-body-sm text-neutral-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-body-sm font-bold text-brand-600">R</div>
                      <span>Remitly Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink
                      to="/learn/providers/wise"
                      class="flex items-center gap-3 text-body-sm text-neutral-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-success-600 flex items-center justify-center text-body-sm font-bold text-success-600">W</div>
                      <span>Wise Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink
                      to="/learn/providers/instarem"
                      class="flex items-center gap-3 text-body-sm text-neutral-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-body-sm font-bold text-brand-600">I</div>
                      <span>Instarem Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink
                      to="/learn/providers"
                      class="flex items-center gap-3 text-body-sm font-semibold text-brand-600 hover:text-brand-700"
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
  </div>
</template>

<script setup lang="ts">
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import { useStructuredData } from '~/composables/useStructuredData'
import { getProviderLogoPath } from '~/composables/useProviderLogo'
import CompareWidget from '~/components/shared/CompareWidget.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: 'Mukuru Review', path: '/learn/providers/mukuru' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://remit-scout.com'

const score = 8.4

const providerName = 'Mukuru'
const providerLogoUrl = `${siteUrl}${getProviderLogoPath('mukuru')}`

defineOgImage({
  component: 'OgImageProvider',
  props: {
    providerName,
    remitScore: score,
    logoUrl: providerLogoUrl,
  },
})

setSeo({
  title: `Mukuru Review ${new Date().getFullYear()} - Remit-Score 8.4/10 | Remit-Scout`,
  description: 'Independent Mukuru review with Remit-Score 8.4/10. Fees, exchange rates, delivery speed, and key pros/cons to compare before you send.',
  canonical: `${siteUrl}/learn/providers/mukuru`,
  ogImage: false,
})

const { addAggregateRatingSchema } = useStructuredData()

addAggregateRatingSchema({
  name: 'Mukuru',
  ratingValue: score,
  bestRating: 10,
  worstRating: 1,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Providers', url: `${siteUrl}/learn/providers` },
  { name: 'Mukuru Review', url: `${siteUrl}/learn/providers/mukuru` },
])
</script>
