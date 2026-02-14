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
          <span class="font-medium text-white">Pangea Review</span>
        </nav>

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-4 mb-6">
              <div class="w-20 h-20 rounded-2xl bg-surface p-3 shadow-xl">
                <div class="w-full h-full rounded-xl bg-primary-500 flex items-center justify-center text-white text-h3 font-bold">
                  P
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
                  Pangea Review
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
                to="/send-money?provider=pangea"
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
                Compare Pangea Now
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
              LatAm
            </div>
            <div class="text-body-sm text-neutral-600">
              Specialist
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-success-600">
              Minutes
            </div>
            <div class="text-body-sm text-neutral-600">
              Card Funding
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              24
            </div>
            <div class="text-body-sm text-neutral-600">
              Countries
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              U.S.
            </div>
            <div class="text-body-sm text-neutral-600">
              Origin
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
                  Remit-Scout scores providers using a weighted rubric focused on what actually happens to your money: <strong class="text-brand-600 font-bold">Delivered Value (40%)</strong>, then reliability, speed/friction, support/refunds, and trust/safety. For this review, the headline score is 8.3/10.
                </p>
              </div>

              <div class="mb-22">
                <h2 class="text-h2 font-bold text-rs-fg mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-gradient-to-b from-brand-600 to-brand-700 rounded-full" />
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-gradient-to-br from-neutral-50 to-primary-50 border-2 border-rs-border">
                  <p class="text-body-lg text-neutral-800 leading-relaxed italic m-0">
                    "Pangea (8.3): LatAm specialist; strong usability and speed in-region; add-on convenience can add cost; breadth caps score."
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
                  Here's how Pangea performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-primary-50/50 to-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-h3 shadow-md">
                    8.3
                  </div>
                  <div>
                    <h3 class="text-h3 font-bold text-rs-fg mb-2 flex items-center gap-2">
                      Pangea
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
                      Can be competitive on some LatAm routes, but fees vary by destination/payment method and rates vary by amount. Credit card convenience adds a 3% surcharge.
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
                      Exchange rate and "Total to Recipient" displayed before payment, and once confirmed they're maintained for that transaction.
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
                      Most card-funded transfers arrive within minutes. Bank account funding typically takes 3–4 business days but may offer better exchange.
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
                      Cancellation available through account or customer service. Refunds processed within 3 business days if canceled within 30 minutes, 10 calendar days after.
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
                      U.S.-based and state-licensed (Pangea USA, LLC licensed as Money Transmitter in specific jurisdictions). Uses encryption, PCI compliance, and multi-factor authentication.
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
                        Why 8.3 (not 9.0+):
                      </div>
                      <div class="text-body-sm text-neutral-700 leading-relaxed">
                        Pangea scores well on usability and speed in-region, and provides solid quote integrity mechanics. But Delivered Value (40%) is capped by corridor variance and convenience add-ons (notably the 3% credit card surcharge), and overall breadth is limited to a defined country list from U.S. sending.
                      </div>
                    </div>
                  </div>
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
                  This is a data-first, non-sponsored score explanation using Remit-Scout's weighted rubric. Because Delivered Value is 40%, the 8.3/10 hinges most on what you pay in practice: transfer fee + FX spread (and any card surcharge), and how predictable the quoted "recipient gets" amount is once you press send.
                </p>
                <div class="mb-6 p-5 rounded-xl bg-neutral-50 border border-rs-border">
                  <p class="font-semibold text-rs-fg mb-3 text-body">
                    Effective cost: fees + FX spread (+ card surcharge)
                  </p>
                  <p class="text-neutral-700 mb-3">
                    Pangea's own terms describe the cost components in plain language:
                  </p>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">1</span>
                      <span><strong class="text-rs-fg">Transfer fee:</strong> displayed prior to payment.</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">2</span>
                      <span><strong class="text-rs-fg">Exchange rate:</strong> a retail exchange rate may be applied when the payout currency isn't USD; the rate and Total to Recipient are displayed for confirmation before you pay.</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">3</span>
                      <span><strong class="text-rs-fg">Credit card surcharge:</strong> Pangea states a 3% surcharge applies whenever you use a credit card.</span>
                    </li>
                  </ul>
                  <p class="text-neutral-700 mt-3 mb-0">
                    This is why the auditor note calls out "add-on convenience can add cost." Paying with a credit card is convenient, but it's explicitly priced.
                  </p>
                </div>

                <div class="p-6 rounded-xl border-2 border-success-600">
                  <p class="font-semibold text-rs-fg mb-3">
                    "How often is it cheapest?"
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-4">
                    We don't publish a "win rate" here (no corridor-by-corridor price logs were provided). The data-first way to frame it:
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
                      <span>Pangea can be competitive on some LatAm routes—especially when you're comparing on the delivered amount and you're not stacking extra convenience costs (like credit card surcharges).</span>
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
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span>But because fees vary by destination/payment method and rates/quotes vary by amount and payment method, you should treat it as "often competitive in core lanes," not "always the cheapest."</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="not-prose my-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p class="text-body-sm text-primary-800 m-0">
                  <strong>Quote vs delivered accuracy (what "locks" and what doesn't):</strong> Pangea's terms give two important "quote integrity" signals: The exchange rate you see is only guaranteed for a limited time; if you pay outside that window, you'll need to confirm a new rate. Once you confirm and approve a transaction, the exchange rate and Total to Recipient are maintained for that specific transaction.
                </p>
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
                  <p>
                    This category is about whether the provider can consistently produce a usable quote and then successfully complete the transfer — without surprises like sudden unavailability, frequent recalculations, or failed deliveries.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Quote success / availability
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Pangea is primarily a U.S.-origin remittance product:
                    </p>
                    <ul class="space-y-2.5 text-neutral-700">
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Pangea states you can send money from all U.S. states except Massachusetts.</span>
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>It states it supports sending to 24 countries across Latin America, Asia, Africa, and Europe (and lists them).</span>
                      </li>
                    </ul>
                    <p class="text-neutral-700 mt-3 mb-0">
                      That supports the audit note's "breadth caps score": the product can be strong where it operates, but it's not designed to be a "send from anywhere to anywhere" platform.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Pricing stability and data freshness signals
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Pangea's documentation implies "fresh" pricing and a controlled lock:
                    </p>
                    <ul class="space-y-2.5 text-neutral-700">
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>It says exchange rates fluctuate and can vary based on payment method and amount, and directs users to an exchange rate calculator/app to check current rates.</span>
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Its terms explain rate locking for a limited time pre-payment, and then transaction-level lock once confirmed.</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-600">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Operational reliability caveats
                    </p>
                    <p class="text-neutral-700 mb-0">
                      Pangea notes transfers may be delayed if additional verification is needed or if there are issues at the receiving location/pickup point.
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
                  <p>
                    This measures how quickly funds arrive in practice and how much effort is required (setup, verification, payment steps, payout complexity).
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-success-600 to-success-50 border-2 border-success-600">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Speed buckets
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Pangea's help content provides a simple, user-relevant split:
                    </p>
                    <ul class="space-y-2.5 text-neutral-700">
                      <li class="flex items-start gap-2.5">
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span><strong class="text-rs-fg">Debit or credit card:</strong> "Most transfers arrive within minutes."</span>
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span><strong class="text-rs-fg">Bank account:</strong> "Transfers typically take 3–4 business days to process."</span>
                      </li>
                    </ul>
                    <p class="text-neutral-700 mt-3 mb-0">
                      Cash pickup adds a corridor-specific nuance: pickup times can vary by location.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Payout methods
                    </p>
                    <p class="text-neutral-700 mb-3">
                      For Latin America generally, Pangea emphasizes cash pickup and direct bank deposit.
                    </p>
                    <p class="text-neutral-700 mb-3">
                      For Mexico specifically, Pangea also markets debit card transfers as an additional receiving option alongside cash pickup and bank deposits.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-primary-50 to-neutral-50 border-2 border-primary-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Typical delivery behavior
                    </p>
                    <p class="text-neutral-800 leading-relaxed mb-0">
                      The common pattern is: Card funding → often fastest ("minutes"). Bank funding → slower but may improve value (Pangea notes bank funding can come with a "better exchange").
                    </p>
                  </div>
                </div>
              </div>

              <div class="not-prose my-6 p-4 bg-warning-600 rounded-lg border border-warning-600">
                <p class="text-body-sm text-warning-600 m-0">
                  <strong>Occasional friction points:</strong> Bank account funding takes 3–4 business days, which may not suit urgent needs. Credit card convenience comes with a 3% surcharge.
                </p>
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
                  <p>
                    This category is about what happens after something goes wrong: refunds, cancellations, dispute handling, and how hard it is to reach a human.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Cancellation and refunds (what's documented)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Pangea's terms explain how to cancel and the refund timelines:
                    </p>
                    <ul class="space-y-2.5 text-neutral-700">
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>You can cancel through your account receipt/history, or by contacting customer service.</span>
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>If canceled within 30 minutes of payment, the refund is processed within 3 business days; if canceled after 30 minutes, it's processed within 10 calendar days.</span>
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Pangea also states it will automatically cancel transfers not picked up within 90 days from when you paid.</span>
                      </li>
                      <li class="flex items-start gap-2.5">
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
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <span>One practical caveat for expectations: the terms say Pangea will consider a refund request and decide whether to approve a refund (in compliance with applicable regulations and compliance policies).</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Dispute handling / error resolution
                    </p>
                    <p class="text-neutral-700 mb-0">
                      Pangea provides an "Cancellation and Error Rights" notice stating you have the right to dispute errors and should contact them within 180 days if you think there's an error. This matters because, in remittance products, the "post-issue" experience often depends on whether you report quickly and whether funds have already been paid out.
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
                  <p>
                    We keep this conservative: verifiable, "where available," and without implying universal regulation in every jurisdiction.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Licensing and regulatory checks (where available)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Pangea's support/complaints page includes state regulator contact information and states that Pangea USA, LLC is licensed as a Money Transmitter in specific jurisdictions (example shown: New York).
                    </p>
                    <p class="text-neutral-700 mb-0">
                      California's DFPI directory lists Pangea USA, LLC as a money transmitter licensee (an external cross-check).
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Security posture (as stated)
                    </p>
                    <p class="text-neutral-700 mb-0">
                      Pangea states it uses encryption, PCI compliance, and multi-factor authentication, and provides real-time transfer updates. (These are provider claims—useful signals, but not a guarantee.)
                    </p>
                  </div>
                </div>
              </div>
              <div class="not-prose my-6 p-4 bg-warning-600 rounded-lg border border-warning-600">
                <p class="text-body-sm text-warning-600 m-0">
                  <strong>Important caveat:</strong> Licensing, permitted activities, and coverage can differ by country and product. You can usually verify the provider's regulatory presence in your sending country via official registries — but the exact legal entity and permissions vary by region.
                </p>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <h2 class="text-h2 font-bold text-rs-fg mb-8 flex items-center gap-3">
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
                <div class="rounded-xl border-2 border-success-600 bg-success-600 p-6">
                  <h3 class="flex items-center gap-2 text-h4 font-bold text-rs-fg mb-4 mt-0">
                    <svg
                      class="w-6 h-6 text-success-600"
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
                  <ul class="space-y-2 text-neutral-700 text-body">
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      <span><strong class="text-rs-fg">Friction & Speed:</strong> Pangea states most card-funded transfers arrive within minutes, which matches the "speed in-region" part of the audit note for common LatAm use cases.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      <span><strong class="text-rs-fg">Reliability & Success:</strong> Pangea's terms say the exchange rate and "Total to Recipient" you confirm are displayed before payment, and once confirmed they're maintained for that transaction.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      <span><strong class="text-rs-fg">Friction & Payout Options:</strong> For Latin America, Pangea highlights cash pickup and bank deposit, and for Mexico it also markets debit card transfers as a receiving option.</span>
                    </li>
                  </ul>
                </div>
                <div class="rounded-xl border-2 border-warning-600 bg-warning-600 p-6">
                  <h3 class="flex items-center gap-2 text-h4 font-bold text-rs-fg mb-4 mt-0">
                    <svg
                      class="w-6 h-6 text-warning-600"
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
                  <ul class="space-y-2 text-neutral-700 text-body">
                    <li class="flex items-start gap-2">
                      <span class="text-warning-600 font-bold">−</span>
                      <span><strong class="text-rs-fg">Delivered Value:</strong> Credit card convenience has a clear price: Pangea's terms state a 3% surcharge on the transaction amount when using a credit card.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-600 font-bold">−</span>
                      <span><strong class="text-rs-fg">Delivered Value / Breadth:</strong> Fees vary by destination and payment method, and exchange rates can vary by payment method and amount—so you can't assume it's "cheapest" without checking the exact quote.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-600 font-bold">−</span>
                      <span><strong class="text-rs-fg">Trust & Support breadth:</strong> Pangea is U.S.-based and state-licensed, but the product's practical breadth is still limited by where it operates (U.S. sending + a defined country list), which caps "one app for everything" upside.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="grid md:grid-cols-2 gap-8 mb-22">
                <div class="p-6 rounded-xl bg-gradient-to-br from-success-600 to-success-50 border-2 border-success-600">
                  <h2 class="text-h3 font-bold text-rs-fg mb-4 flex items-center gap-2">
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
                    Best For
                  </h2>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-2.5">
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
                      <span>Latin America corridors where you want a simple app flow and fast delivery, especially if you can use a debit card for speed.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
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
                      <span>Recipients who prefer cash pickup or direct bank deposit (two core "receiver-first" options Pangea emphasizes for LatAm).</span>
                    </li>
                    <li class="flex items-start gap-2.5">
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
                      <span>People who want upfront cost visibility (Pangea says it shows the applied exchange rate and any fees before you pay).</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-600">
                  <h2 class="text-h3 font-bold text-rs-fg mb-4 flex items-center gap-2">
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
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Not Ideal For
                  </h2>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-2.5">
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
                      <span>Rate-maximizers who don't want to watch spreads and surcharges—Pangea's own terms state a 3% surcharge applies when paying by credit card, and exchange rates can change if you don't pay within the quote window.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
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
                      <span>Anyone needing truly broad global coverage: Pangea states it supports sending from U.S. states except Massachusetts and to 24 countries.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
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
                      <span>Use cases where "extras" are tempting (credit card funding for convenience/urgency): those conveniences can materially raise the effective cost and cap Delivered Value.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="mb-20">
                <h2 class="text-h2 font-bold text-rs-fg mb-6 flex items-center gap-3">
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
                  How to Get the Best Rate with Pangea
                </h2>
                <p class="text-body-lg text-neutral-600 mb-6">
                  A short, practical checklist:
                </p>
                <div class="space-y-3">
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      1
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">Compare bank account vs card funding:</strong>
                      <span class="text-neutral-700">Pangea says bank account payments can offer a better exchange but are slower (3–4 business days).</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      2
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">Avoid credit card funding unless you truly need it:</strong>
                      <span class="text-neutral-700">Pangea states a 3% surcharge applies to credit card-funded transfers.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      3
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">Focus on "Total to Recipient," not just the fee:</strong>
                      <span class="text-neutral-700">Pangea displays the exchange rate and Total to Recipient before payment—use that as your comparison point.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      4
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">Complete checkout promptly:</strong>
                      <span class="text-neutral-700">The quoted exchange rate is only guaranteed for a limited time before payment.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      5
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">Verify payout method availability:</strong>
                      <span class="text-neutral-700">Choose cash pickup vs bank deposit (and debit card deposit where supported, like Mexico), based on what your recipient can actually use.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="mb-20">
                <h2 class="text-h2 font-bold text-rs-fg mb-6 flex items-center gap-3">
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
                  Two Alternatives (and When They Beat Pangea)
                </h2>

                <div class="space-y-6">
                  <div class="p-6 rounded-xl border-2 border-rs-border bg-surface hover:border-brand-300 transition-colors">
                    <h3 class="text-h4 font-bold text-rs-fg mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      Remitly (9.1)
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      <strong class="text-rs-fg">When it can beat Pangea:</strong> Remitly can beat Pangea when you need broader corridor coverage or more standardized delivery options across many destinations. Remitly states you can send to 170+ countries and territories.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      <strong class="text-rs-fg">Choose Remitly over Pangea when:</strong> Use Remitly over Pangea if your recipient country isn't in Pangea's supported list, or if you want a provider designed as a broader global generalist.
                    </p>
                  </div>

                  <div class="p-6 rounded-xl border-2 border-rs-border bg-surface hover:border-brand-300 transition-colors">
                    <h3 class="text-h4 font-bold text-rs-fg mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      Xoom (8.5)
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      <strong class="text-rs-fg">When it can beat Pangea:</strong> Xoom can beat Pangea when you want PayPal ecosystem convenience and a wide menu of payout methods (bank account, debit card, mobile wallet, cash pickup/home delivery depending on route).
                    </p>
                    <p class="text-neutral-700 mb-0">
                      <strong class="text-rs-fg">Choose Xoom over Pangea when:</strong> Use Xoom over Pangea if you already use PayPal heavily or you specifically need payout rails that are stronger in Xoom's network for your corridor.
                    </p>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="mb-20">
                <h2 class="text-h2 font-bold text-rs-fg mb-6 flex items-center gap-3">
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
                <div class="space-y-5 text-body-lg leading-relaxed text-neutral-700">
                  <div class="p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3">
                      Who should use Pangea?
                    </p>
                    <p class="text-neutral-800 mb-0">
                      U.S.-based senders who primarily send to Latin America and want a streamlined experience with fast delivery when card-funded, plus practical receiving options like cash pickup and bank deposit.
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-gradient-to-br from-success-600 to-success-50 border-2 border-success-600">
                    <p class="font-semibold text-rs-fg mb-3">
                      Why the 8.3/10 is justified:
                    </p>
                    <p class="text-neutral-800 mb-0">
                      Pangea scores well on usability and speed in-region, and it provides solid "quote integrity" mechanics (fee + rate + Total to Recipient shown upfront; transaction-level rate lock once confirmed). But Delivered Value (40%) is capped by corridor variance and by the fact that convenience add-ons can add real cost—most notably the 3% credit card surcharge—and overall breadth is limited to a defined country list from U.S. sending.
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
              <div class="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-primary-50 p-6">
                <h3 class="text-body-lg font-bold text-rs-fg mb-2">
                  Ready to Compare?
                </h3>
                <p class="text-body-sm text-neutral-600 mb-4">
                  See how Pangea stacks up for your specific corridor and amount.
                </p>
                <NuxtLink
                  to="/send-money?provider=pangea"
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
                      Specialty
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      LatAm Specialist
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Origin
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      U.S. (except MA)
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Countries
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      24
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Card Speed
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Minutes
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Bank Speed
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      3-4 Days
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Credit Card Fee
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      3% Surcharge
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
                      to="/learn/providers/remitbee"
                      class="flex items-center gap-3 text-body-sm text-neutral-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-body-sm font-bold text-brand-600">RB</div>
                      <span>RemitBee Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink
                      to="/learn/providers/xe-money"
                      class="flex items-center gap-3 text-body-sm text-neutral-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-body-sm font-bold text-primary-600">XE</div>
                      <span>XE Money Review</span>
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

    <!-- Final CTA -->
    <section
      class="py-16 bg-brand-600"
      style="background-color: rgba(37, 99, 235, 1);"
    >
      <div class="mx-auto max-w-4xl px-page-x text-center">
        <h2
          class="text-h2 font-bold mb-4"
          style="color: rgba(255, 255, 255, 1);"
        >
          Ready to See How Pangea Compares?
        </h2>
        <p
          class="text-body-lg mb-8"
          style="color: rgba(255, 255, 255, 1);"
        >
          Enter your transfer details to see real-time rates from Pangea and 30+ other providers.
        </p>
        <NuxtLink
          to="/send-money?provider=pangea"
          class="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-body-lg font-semibold shadow-lg transition-all"
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
import { getProviderLogoPath } from '~/composables/useProviderLogo'

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://remit-scout.com'

const score = 8.3

const providerName = 'Pangea'
const providerLogoUrl = `${siteUrl}${getProviderLogoPath('pangea')}`

defineOgImage({
  component: 'OgImageProvider',
  props: {
    providerName,
    remitScore: score,
    logoUrl: providerLogoUrl,
  },
})

setSeo({
  title: `Pangea Review ${new Date().getFullYear()} - Remit-Score 8.3/10 | Remit-Scout`,
  description: 'Independent Pangea review with Remit-Score 8.3/10. Fees, exchange rates, delivery speed, and key pros/cons to compare before you send.',
  canonical: `${siteUrl}/learn/providers/pangea`,
  ogImage: false,
})

const { addAggregateRatingSchema, addBreadcrumbSchema } = useStructuredData()

addAggregateRatingSchema({
  name: 'Pangea',
  ratingValue: score,
  bestRating: 10,
  worstRating: 1,
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: 'Pangea Review', path: '/learn/providers/pangea' },
]

addBreadcrumbSchema(
  breadcrumbItems.map(item => ({
    name: item.name,
    url: item.path === '/' ? `${siteUrl}/` : `${siteUrl}${item.path}`,
  })),
)
</script>
