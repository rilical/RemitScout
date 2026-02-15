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
          <span class="font-medium text-white">KoronaPay Review</span>
        </nav>

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-4 mb-6">
              <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface p-3 shadow-xl">
                <ProviderLogo
                  slug="koronapay"
                  alt="KoronaPay"
                  size="small"
                />
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
                  KoronaPay Review
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
                to="/send-money?provider=koronapay"
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
                Compare KoronaPay Now
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
                    <span class="font-semibold text-black">Strong</span>
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
              50+
            </div>
            <div class="text-body-sm text-neutral-600">
              Countries
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-success-600">
              Instant
            </div>
            <div class="text-body-sm text-neutral-600">
              Card Transfers
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              Cash Pickup
            </div>
            <div class="text-body-sm text-neutral-600">
              Large Network
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              EU/UK
            </div>
            <div class="text-body-sm text-neutral-600">
              Primary Markets
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
                  KoronaPay's 8.3/10 is driven first by Delivered Value (40%): it can price very competitively on some corridors because fees are often simple and low, but the effective cost still depends heavily on FX spread and corridor-specific conditions—so it's not a universal "cheapest" pick. KoronaPay's bigger strengths show up when you actually need its rails (especially cash pickup and fast card delivery), while the score is capped by support/trust breadth and corridor variance.
                </p>
              </div>

              <div class="mb-22">
                <h2 class="text-h2 font-bold text-rs-fg mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-gradient-to-b from-brand-600 to-brand-700 rounded-full" />
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-gradient-to-br from-neutral-50 to-primary-50 border-2 border-rs-border">
                  <p class="text-body-lg text-neutral-800 leading-relaxed italic m-0">
                    "Cash pickup strength; good speed; delivered value varies by corridor; support/trust breadth caps upside."
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
                  Here's how KoronaPay performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-primary-50/50 to-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-h3 shadow-md">
                    8.3
                  </div>
                  <div>
                    <h3 class="text-h3 font-bold text-rs-fg mb-2 flex items-center gap-2">
                      KoronaPay
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
                      Can price very competitively on some corridors with simple, low fees, but effective cost depends heavily on FX spread and corridor-specific conditions. Delivered value varies by corridor.
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
                      Corridor availability can be fluid with partner/bank interruptions. Reliability is partially partner- and corridor-dependent, which limits the upside.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Friction & Speed
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 text-body-sm font-bold">Strong</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      15% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Cash pickup can be available immediately after sending. Most card transfers are instant. Fast delivery options are a key strength.
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
                      24/7 call center support. Refund/cancellation friction: you can cancel only before payout, and transaction fees aren't refunded.
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
                      KoronaPay Europe Limited is an EMI regulated by the Central Bank of Cyprus (license 115.1.3.30). Licensed EU entity where applicable.
                    </div>
                  </div>
                </div>
                <div class="mt-6 pt-6 border-t-2 border-brand-200 bg-surface/40 rounded-xl p-4">
                  <div class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 text-warning-800 mt-0.5 flex-shrink-0"
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
                        Why 8.3 (not 9.0+):
                      </div>
                      <div class="text-body-sm text-neutral-700 leading-relaxed">
                        Delivered Value is strong but inconsistent by corridor (spread and rate timing matter), while Reliability, Support, and Trust are solid in the EU-licensed context yet capped by the reality of a partner-based network and corridor volatility.
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
                      <span>Cash pickup recipients who prefer collecting in-person rather than relying on bank deposits (KoronaPay advertises a large partner pickup network).</span>
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
                      <span>Fast card-to-card / cash-available transfers in corridors where KoronaPay is active and stable.</span>
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
                      <span>Senders in EU/UK/EEA/Norway/Switzerland routes where KoronaPay is supported and you can compare the total delivered amount inside the app before paying.</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-200">
                  <h3 class="text-h4 font-bold text-rs-fg mb-4 flex items-center gap-2">
                    <svg
                      class="w-6 h-6 text-warning-800"
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
                        class="w-5 h-5 text-warning-800 mt-0.5 flex-shrink-0"
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
                      <span>"Set-and-forget cheapest" shoppers who don't want to monitor spreads by corridor—KoronaPay's value can vary depending on route and rate movement.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-warning-800 mt-0.5 flex-shrink-0"
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
                      <span>Euro-to-euro transfers where you don't need cash pickup—KoronaPay charges 1.9% on EUR→EUR, which can be hard to justify versus other bank-like options.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-warning-800 mt-0.5 flex-shrink-0"
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
                      <span>Users who want maximum regulatory simplicity / consistency across markets (KoronaPay's ecosystem involves multiple partners/entities depending on where the transfer runs).</span>
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
                      <span><strong class="text-rs-fg">Fast delivery options:</strong> cash pickup can be available immediately after sending, and many card transfers are instant.</span>
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
                      <span><strong class="text-rs-fg">Clear, published fee logic (EU flow):</strong> cross-currency transfers show a fixed fee (e.g., 0.95 EUR or local equivalent), and EUR→EUR shows a percentage fee.</span>
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
                      <span><strong class="text-rs-fg">Licensed EU entity (where applicable):</strong> KoronaPay Europe Limited states it's an EMI regulated by the Central Bank of Cyprus (license 115.1.3.30).</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-200">
                  <h3 class="text-h4 font-bold text-rs-fg mb-4">
                    Cons
                  </h3>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-warning-800 mt-0.5 flex-shrink-0"
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
                      <span><strong class="text-rs-fg">Delivered value varies by corridor</strong> because FX is service-set and updates frequently; spread can dominate total cost.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-warning-800 mt-0.5 flex-shrink-0"
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
                      <span><strong class="text-rs-fg">Corridor availability can be fluid</strong> (partner/bank interruptions or restrictions have occurred in parts of the broader "Zolotaya Korona / KoronaPay" ecosystem).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-warning-800 mt-0.5 flex-shrink-0"
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
                      <span><strong class="text-rs-fg">Refund/cancellation friction + fee stickiness:</strong> you can cancel only before payout, and transaction fees aren't refunded.</span>
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
                  Effective cost = fees + FX spread (and sometimes external bank fees)
                </p>
                <div class="mb-6 p-5 rounded-xl bg-neutral-50 border border-rs-border">
                  <p class="font-semibold text-rs-fg mb-3 text-body">
                    In KoronaPay Europe's published fee schedule:
                  </p>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">1</span>
                      <span>If the sending and receiving currencies differ (e.g., EUR→KZT), the app uses a <strong class="text-rs-fg">fixed fee of 0.95 EUR</strong> (or equivalent in the sender currency list shown).</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">2</span>
                      <span>For <strong class="text-rs-fg">EUR→EUR</strong>, KoronaPay applies a <strong class="text-rs-fg">1.9% fee</strong>.</span>
                    </li>
                  </ul>
                  <p class="text-neutral-700 mt-4 mb-0">
                    That fee is only half the story. On cross-currency transfers, KoronaPay sets the conversion rate internally and explicitly notes that money transfers involve converting the send currency into the receive currency at a rate "set by the money transfer service itself." They also state the rate can change "dozens of times a day," which is a practical reminder that spread (and timing) can materially change the delivered amount even if the fee stays fixed.
                  </p>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-200 mb-6">
                  <p class="font-semibold text-rs-fg mb-3">
                    One extra "gotcha" worth flagging:
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-0">
                    When a transfer is credited to a card, KoronaPay notes that card-crediting is processed outside the service and banks may charge a commission. That can reduce delivered value versus the quote in edge cases, depending on the recipient bank/card product.
                  </p>
                </div>

                <div class="p-6 rounded-xl border-2 border-success-600">
                  <p class="font-semibold text-rs-fg mb-3">
                    "How often is KoronaPay the cheapest?"
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-4">
                    We don't publish a single "KoronaPay is always cheapest" claim—because it isn't supported by the auditor note ("delivered value varies by corridor") and KoronaPay itself describes a rate that's dynamic and corridor-specific.
                  </p>
                  <p class="text-neutral-700 mb-3">
                    What we can say in a data-first way:
                  </p>
                  <ul class="space-y-2 text-neutral-700">
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
                      <span>KoronaPay is most likely to win on effective cost when the corridor has (a) strong KoronaPay rails, and (b) competitors charging higher fixed fees or slower payout methods—but you still need to compare the actual delivered amount at checkout.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg
                        class="w-5 h-5 text-warning-800 mt-0.5 flex-shrink-0"
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
                      <span>KoronaPay is less likely to win on simple EUR→EUR transfers because the 1.9% fee is structurally expensive for a same-currency flow.</span>
                    </li>
                  </ul>
                </div>

                <div class="mt-6 p-5 rounded-xl bg-gradient-to-br from-primary-50 to-neutral-50 border-2 border-primary-200">
                  <p class="font-semibold text-rs-fg mb-3 text-body">
                    Quote vs delivered accuracy
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-3">
                    KoronaPay provides tools that help users verify "quote → delivery":
                  </p>
                  <ul class="space-y-2 text-neutral-700 mb-3">
                    <li>• You can check the current exchange rate on their site/app, and rates refresh frequently.</li>
                    <li>• The app supports transfer status tracking and notifications (e.g., sent, received, refunded), which helps reconcile whether "delivered" matched expectations.</li>
                  </ul>
                  <p class="text-neutral-800 leading-relaxed mb-3">
                    Where mismatches can happen:
                  </p>
                  <ul class="space-y-2 text-neutral-700">
                    <li>• Recipient bank/card commissions (outside KoronaPay's control) may apply for card-crediting.</li>
                    <li>• If you cancel a transfer that involved currency conversion, KoronaPay's terms say the refund is calculated at the rate valid at the moment of refund (with caps), which introduces potential slippage versus what you originally saw.</li>
                  </ul>
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
                      Quote success / availability (what you can actually do when you open the app)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      KoronaPay's own help content describes sending from EU countries, the UK, Norway and others to 50+ countries in Europe and Asia, with receiving methods including card or cash (depending on destination).
                    </p>
                    <p class="text-neutral-700 mb-0">
                      A practical limitation: KoronaPay Europe's Terms specify users must be 18+ and not a "US Person." So "availability" isn't just corridor-based; it can be user-eligibility-based too.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Pricing stability & data freshness signals
                    </p>
                    <p class="text-neutral-700 mb-3">
                      KoronaPay's exchange-rate page explicitly says:
                    </p>
                    <ul class="space-y-2 text-neutral-700">
                      <li>• Their rate is service-calculated, and</li>
                      <li>• It changes "dozens of times a day."</li>
                    </ul>
                    <p class="text-neutral-700 mt-3 mb-0">
                      That's a data freshness signal (rates aren't stale), but it's also a price stability tradeoff: if you're trying to time a transfer around volatility, the "right" moment matters more than with providers that lock rates longer.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Corridor volatility (why the score isn't higher)
                    </p>
                    <p class="text-neutral-700 mb-0">
                      KoronaPay's broader ecosystem (often discussed under the "Zolotaya Korona" brand) has seen bank/partner interruptions in some regions tied to sanctions compliance and operational decisions—for example, reporting on Moldovan banks blocking the service in 2024, and separate reporting on banks resuming service in Georgia after suspension. This is not a statement that KoronaPay "doesn't work"—it's a reminder that reliability is partially partner- and corridor-dependent, which limits the upside in this rubric bucket.
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
                      Speed buckets (what to expect)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Based on KoronaPay's own corridor pages and help documentation:
                    </p>
                    <ul class="space-y-2 text-neutral-700">
                      <li>• <strong class="text-rs-fg">Instant / minutes:</strong> "Most card transfers are instant," and for cash pickup the money can be available immediately after sending (subject to partner point processing hours).</li>
                      <li>• <strong class="text-rs-fg">Within ~1 hour after funds arrive:</strong> if you fund from a bank account, KoronaPay states they will send the transfer to the recipient within an hour after receiving the funds.</li>
                      <li>• <strong class="text-rs-fg">Bank-timed (for funding):</strong> if your bank funding uses SEPA, typical SEPA timing is commonly ~24–48 business hours (issuer-dependent).</li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Payout methods
                    </p>
                    <p class="text-neutral-700 mb-3">
                      KoronaPay commonly presents two main receiving rails:
                    </p>
                    <ul class="space-y-2 text-neutral-700">
                      <li>• Cash pickup at partner locations (recipient needs ID and the transfer number).</li>
                      <li>• Card credit (availability depends on country).</li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      "Friction" gotchas
                    </p>
                    <p class="text-neutral-700 mb-3">
                      If you want to send cash, KoronaPay's help page says cash sending is currently only available from Cyprus, via a partner (Intel Express), and only for certain destinations—so most users should expect digital funding (card/bank) rather than walk-in cash sending.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      Some flows may require verification, which can add steps before first transfer or higher limits (even if the transfer itself is fast once approved).
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
                      Support access
                    </p>
                    <p class="text-neutral-700 mb-0">
                      KoronaPay's support center states the call center operates 24/7, with operators in Russian and English, plus German during business hours, and provides country-specific phone numbers. They also provide email support (help@koronapay.eu) and a help form that says they'll look into questions within 24 hours.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Refunds & cancellations (what's fair to expect)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      KoronaPay's terms and help content are relatively clear:
                    </p>
                    <ul class="space-y-2 text-neutral-700">
                      <li>• You can cancel/rescind as long as the transfer hasn't been paid out/credited.</li>
                      <li>• Transaction fees are not refunded, even if the transfer is cancelled.</li>
                      <li>• Refund timing can vary: help content says the money is returned to the original card/account within ~5 business days (bank-dependent). Terms add that card-to-cash refunds can take up to 10 working days.</li>
                      <li>• Complaints: the terms say they aim to provide a final response within 15 business days of receiving a complaint.</li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Post-issue friction
                    </p>
                    <p class="text-neutral-700 mb-0">
                      Refund initiation requires an SMS code confirmation in-app (a reasonable security step, but still friction).
                    </p>
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
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Where publicly checkable, KoronaPay Europe positions itself as a regulated EMI:
                    </p>
                    <p class="text-neutral-700 mb-3">
                      KoronaPay Europe Limited states it's licensed and regulated by the Central Bank of Cyprus (license 115.1.3.30).
                    </p>
                    <p class="text-neutral-700 mb-3">
                      A regulator registry page (Latvijas Banka) lists KoronaPay Europe Limited with that registration/license number under "freedom to provide services," which is a useful external cross-check when available.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      On compliance posture, KoronaPay's privacy policy notes it's subject to European and Cyprus AML legislation and must collect/verify data about senders and recipients.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      One nuance that matters for "trust breadth":
                    </p>
                    <p class="text-neutral-700 mb-0">
                      KoronaPay's privacy policy also describes situations where it acts as a joint controller with a separate entity ("Payment Center") for transfers through the broader partner network, and as sole controller for certain EU-only transfer scenarios. That's normal in complex remittance networks, but it does mean the operational stack isn't always one single entity end-to-end.
                    </p>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <!-- How to get the best rate -->
              <div class="mb-22 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                <h2 class="text-h3 font-bold text-rs-fg mb-4">
                  How to get the best rate (quick checklist)
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
                    <span>Always compare the delivered amount, not just the fee: cross-currency transfers have a fixed fee, so spread is usually the real cost driver.</span>
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
                    <span>Check the rate right before paying—KoronaPay says rates change many times per day.</span>
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
                    <span>Compare funding methods (card vs bank account). Bank-account funding may add bank-timed delay, while card funding is often the fastest.</span>
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
                    <span>If delivering to a bank card, ask the recipient whether their bank/card charges incoming commissions (KoronaPay warns this can happen).</span>
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
                    <span>Pick the payout method the recipient will actually use (cash pickup vs card). The "best" quote is wasted if the recipient can't access that rail conveniently.</span>
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
                    <span>If you might need to cancel, remember: fees aren't refunded, and FX-converted refunds can be calculated at the refund-time rate.</span>
                  </li>
                </ul>
              </div>

              <!-- Two alternatives -->
              <div class="mb-22">
                <h2 class="text-h3 font-bold text-rs-fg mb-6">
                  2 alternatives (and when they beat KoronaPay)
                </h2>
                <div class="space-y-6">
                  <div class="p-6 rounded-xl bg-gradient-to-br from-neutral-50 to-primary-50 border-2 border-rs-border">
                    <h3 class="text-h4 font-bold text-rs-fg mb-3">
                      Remitly (9.1)
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      Remitly tends to beat KoronaPay when you want broader corridor coverage and a more uniform support-and-delivery experience across many markets: Remitly markets transfers to 170+ countries/territories and offers multiple delivery options depending on corridor.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      It's also a good alternative when you value strong support and predictable execution more than cash-pickup-centric rails.
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-gradient-to-br from-neutral-50 to-primary-50 border-2 border-rs-border">
                    <h3 class="text-h4 font-bold text-rs-fg mb-3">
                      Xoom (8.5)
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      Xoom can beat KoronaPay when you want PayPal ecosystem convenience and broad payout choices (bank account, debit card, mobile wallet, cash pickup/home delivery depending on country).
                    </p>
                    <p class="text-neutral-700 mb-0">
                      It's often a better fit if you already use PayPal and want fewer new logins/accounts—while accepting that delivered value can vary due to fees/spread.
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
                  KoronaPay is worth using when your corridor supports it well and you specifically need fast delivery and/or cash pickup. That's where the product's strengths show up: simple fees on many cross-currency routes, rapid availability in many corridors, and a large pickup network.
                </p>
                <p class="text-body-lg text-neutral-700 leading-relaxed mb-0">
                  The 8.3/10 score is justified because Delivered Value is strong but inconsistent by corridor (spread and rate timing matter), while Reliability, Support, and Trust are solid in the EU-licensed context yet capped by the reality of a partner-based network and corridor volatility.
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
                  See how KoronaPay stacks up for your specific corridor and amount.
                </p>
                <NuxtLink
                  to="/send-money?provider=koronapay"
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
                      2003
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Headquarters
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Cyprus
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Countries
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      50+
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Specialty
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Cash Pickup
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Speed
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Instant - 1 Hour
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Payout Methods
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Cash, Card
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
  { name: 'KoronaPay Review', path: '/learn/providers/koronapay' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://remit-scout.com'

const score = 8.3

const providerName = 'KoronaPay'
const providerLogoUrl = `${siteUrl}${getProviderLogoPath('koronapay')}`

defineOgImage({
  component: 'OgImageProvider',
  props: {
    providerName,
    remitScore: score,
    logoUrl: providerLogoUrl,
  },
})

setSeo({
  title: `KoronaPay Review ${new Date().getFullYear()} - Remit-Score 8.3/10 | Remit-Scout`,
  description: 'Independent KoronaPay review with Remit-Score 8.3/10. Fees, exchange rates, delivery speed, and key pros/cons to compare before you send.',
  canonical: `${siteUrl}/learn/providers/koronapay`,
  ogImage: false,
})

const { addAggregateRatingSchema } = useStructuredData()

addAggregateRatingSchema({
  name: 'KoronaPay',
  ratingValue: score,
  bestRating: 10,
  worstRating: 1,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Providers', url: `${siteUrl}/learn/providers` },
  { name: 'KoronaPay Review', url: `${siteUrl}/learn/providers/koronapay` },
])
</script>
