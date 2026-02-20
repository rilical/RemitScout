<template>
  <div class="min-h-screen bg-surface">


    <!-- Hero Section -->
    <section class="relative bg-neutral-900 py-16 lg:py-24 overflow-hidden">
      <div class="mx-auto max-w-page px-page-x relative">
        <Breadcrumbs :items="breadcrumbItems" :dark="true" />

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-4 mb-6">
              <div class="w-20 h-20 rounded-2xl bg-surface p-3 shadow-xl">
                <div class="w-full h-full rounded-xl bg-primary-500 flex items-center justify-center text-white text-h3 font-bold">
                  SX
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
                  SingX Review
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
                to="/send-money?provider=singx"
                class="inline-flex items-center gap-2 rounded-xl border border-neutral-100 bg-surface text-neutral-900 px-6 py-3 text-body font-semibold shadow-lg motion-safe:transition-all"
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
                Compare SingX Now
              </NuxtLink>
              <a
                href="#review"
                class="inline-flex items-center gap-2 rounded-xl border border-brand-500 bg-brand-600 text-white px-6 py-3 text-body font-semibold motion-safe:transition-all"
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
                    <span class="font-semibold text-black">Moderate</span>
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
                  class="text-body-sm text-neutral-900"
                >
                  Based on our independent methodology.<br>
                  <NuxtLink
                    to="/methodology"
                    class="font-semibold text-brand-600 hover:text-brand-700"
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
              Singapore
            </div>
            <div class="text-body-sm text-neutral-600">
              Primary Market
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              Bank Transfer
            </div>
            <div class="text-body-sm text-neutral-600">
              Core Model
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-brand-600">
              MAS Licensed
            </div>
            <div class="text-body-sm text-neutral-600">
              Regulatory Status
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              3 Markets
            </div>
            <div class="text-body-sm text-neutral-600">
              Send From
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
              <div class="relative mb-22 p-8 rounded-2xl bg-neutral-50 border-2 border-rs-border shadow-sm">
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
                  SingX earns its 8.2/10 primarily on Delivered Value (40%): it's built around bank-transfer rails and tends to price in a "transparent fee + (often) strong FX rate" style that can be competitive versus providers that embed more cost in the exchange rate. The ceiling on the score comes from what you'd expect in this model: speed is usually "bank-timed" rather than instant, and availability/breadth depends a lot on where you're sending from and the specific corridor.
                </p>
              </div>

              <div class="mb-22">
                <h2 class="text-h2 font-bold text-rs-fg mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-brand-600 rounded-full" />
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-neutral-50 border-2 border-rs-border">
                  <p class="text-body-lg text-neutral-800 leading-relaxed italic m-0">
                    "SingX (8.2): Good bank-transfer value; moderate speed; narrower breadth vs global leaders."
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
                  Here's how SingX performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-h3 shadow-md">
                    8.2
                  </div>
                  <div>
                    <h3 class="text-h3 font-bold text-rs-fg mb-2 flex items-center gap-2">
                      SingX
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
                      Clear fee framing with transparent pricing. Fees/spreads can vary by currency pair and FX mark-up may apply in some cases.
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
                      Clear "funding → processing" logic with pre-funded transactions processing at confirmed rate. Limited send-from markets constrain breadth.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Friction & Speed
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-warning-100 text-warning-700 text-body-sm font-bold">Moderate</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      15% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Bank-driven funding and delivery typically "hours to next business day" rather than instant. Processing depends on bank cutoffs.
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
                      Email, live chat, and hotline support available. Refunds net of fees and third-party charges. Formal dispute resolution in Australia.
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
                      MAS Major Payment Institution (Singapore), Money Service Operator license (Hong Kong), AFSL (Australia). Not a bank - deposit insurance doesn't apply.
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
                        Why 8.2 (not 9.0+):
                      </div>
                      <div class="text-body-sm text-neutral-700 leading-relaxed">
                        SingX earns its score on Delivered Value with transparent, fee-led pricing that can be competitive for bank-to-bank transfers. The score is held back by moderate speed (bank-timed processing), narrower breadth versus global leaders (limited send-from markets: Singapore/Australia/Hong Kong), and variability in fees/spreads depending on currency pair.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    1
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Delivered Value (40%)
                  </h2>
                </div>
                <p class="text-body-lg text-neutral-700 leading-relaxed mb-6">
                  Remit-Scout's scoring starts with what you actually pay, not just the headline fee. A widely used framework (including the World Bank's Remittance Prices Worldwide work) is that total remittance cost is typically the transfer fee + exchange-rate margin (spread) + any recipient-side fees where they exist.
                </p>
                <div class="mb-6 p-5 rounded-xl bg-neutral-50 border border-rs-border">
                  <p class="font-semibold text-rs-fg mb-3 text-body">
                    Effective cost: fees + FX spread (what matters most)
                  </p>
                  <p class="text-neutral-700 mb-3">
                    SingX's consumer messaging is built around explicit fees rather than hiding cost entirely in the exchange rate. The Singapore-facing FAQ describes a small fee (roughly 0.25%–1%) applied against the mid-market rate, with stable currencies closer to ~0.5%.
                  </p>
                  <p class="text-neutral-700 mb-3">
                    Where this gets more nuanced (and why the score isn't higher): SingX's Australia disclosure docs are explicit that:
                  </p>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">1</span>
                      <span><strong class="text-rs-fg">Transaction fees can be materially higher for less-traded currencies</strong> (up to 5% is cited in the Australia materials).</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">2</span>
                      <span><strong class="text-rs-fg">An FX spread/mark-up can apply in some instances</strong>, and they note they won't usually be able to tell you what that spread is—so comparison shopping remains important.</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">3</span>
                      <span><strong class="text-rs-fg">Third-party bank/intermediary fees can be deducted</strong> in some cases, which can reduce the delivered amount (even if SingX itself isn't charging those fees).</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl border-2 border-success-600">
                  <p class="font-semibold text-rs-fg mb-3">
                    "How often is it cheapest?"
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-4">
                    We don't claim SingX is "always cheapest" (that would be corridor- and timing-dependent). The practical takeaway from the available disclosures is:
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
                      <span>It can be very competitive in bank-to-bank lanes where competitors rely heavily on FX spread.</span>
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
                      <span>It can lose when (a) the currency pair attracts a higher fee, (b) an FX mark-up is applied, or (c) intermediary/receiving bank fees hit the transaction.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="not-prose my-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p class="text-body-sm text-primary-800 m-0">
                  <strong>Quote vs delivered accuracy:</strong> SingX's Terms describe an important mechanic: If you pre-fund, payments process at the exchange rate confirmed when you create the transaction. If you don't pre-fund, the transaction can queue until funds arrive—and if it's not funded in time it can lapse as "Validity Expired." They also note that if a transaction is cancelled/fails, refunds are net of fees and certain charges.
                </p>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
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
                  <div class="mt-5 p-5 rounded-xl bg-brand-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Quote success / availability
                    </p>
                    <p class="text-neutral-700 mb-3">
                      SingX's consumer FAQ indicates availability depends on residency/origin market (e.g., Singapore residents can sign up, and transfers are offered from Singapore/Australia/Hong Kong).
                    </p>
                    <p class="text-neutral-700 mb-0">
                      That constraint matters: even if payout coverage is broad, your ability to get a quote and execute a transfer is limited if you can't use the service from your country.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-brand-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Pricing stability & "data freshness" signals
                    </p>
                    <p class="text-neutral-700 mb-3">
                      A positive reliability signal is that SingX publishes operational detail like:
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
                        <span>The pre-funding vs queued execution flow (and expiry behavior) in Terms of Use.</span>
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
                        <span>Transfer cut-offs and processing windows by destination.</span>
                      </li>
                    </ul>
                    <p class="text-neutral-700 mt-3 mb-0">
                      A cautionary signal is that the Australia disclosures explicitly acknowledge variability (fee variability, occasional FX mark-up, and unpredictable third-party deductions).
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-warning-50 border-2 border-warning-500">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Failure modes you should expect (and plan around)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      From the Terms:
                    </p>
                    <ul class="space-y-2.5 text-neutral-700">
                      <li class="flex items-start gap-2.5">
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
                        <span>Compliance checks can delay or cancel a transaction; SingX can withhold credits until AML/CTF checks complete.</span>
                      </li>
                      <li class="flex items-start gap-2.5">
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
                        <span>If a transaction is cancelled/fails, the refund can be net of fees and other costs.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
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
                  <div class="mt-5 p-5 rounded-xl bg-brand-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Friction (setup + paying)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      On the Singapore flow, SingX describes two common "pay-in" paths:
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
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span><strong class="text-rs-fg">Wallet</strong> (top up first; then transfers can be deducted from wallet balance)</span>
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
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        <span><strong class="text-rs-fg">Bank transfer</strong> (send the amount + SingX fee from your bank account)</span>
                      </li>
                    </ul>
                    <p class="text-neutral-700 mt-3 mb-0">
                      Wallet details: Wallet top-ups are described as via PayNow or online bank transfer, with a SGD 5,000 wallet cap in the FAQ page we reviewed, and top-ups can take 1–4 hours.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-warning-50 border-2 border-warning-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Speed buckets (what delivery tends to look like)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      SingX publishes destination-level processing guidance. Typical patterns:
                    </p>
                    <ul class="space-y-2.5 text-neutral-700">
                      <li class="flex items-start gap-2.5">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Within a few hours / 1–2 hours for some local-rail/wallet options and when sent before cutoffs</span>
                      </li>
                      <li class="flex items-start gap-2.5">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Same day if created and funded before the stated cutoff time</span>
                      </li>
                      <li class="flex items-start gap-2.5">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Next business day or 1–2 business days depending on the country/rail and cutoffs</span>
                      </li>
                    </ul>
                    <p class="text-neutral-700 mt-3 mb-0">
                      And it explicitly notes the caveat most users eventually hit: turnaround depends on the banks involved (and SingX can't fully control intermediary/receiver-bank timing).
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-brand-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Payout methods
                    </p>
                    <p class="text-neutral-700 mb-0">
                      SingX supports bank payouts as the baseline, and its Terms also describe cash payouts for certain countries (with ID/PIN requirements and pickup-window rules).
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
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
                  <div class="mt-5 p-5 rounded-xl bg-brand-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Support access (how you'll actually get help)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      SingX's Singapore FAQ lists:
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
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span>Email support (help@singx.co)</span>
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
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        <span>Live chat</span>
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
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span>Hotline (+65-3158-4669) during 9am–6pm, Monday–Friday, with offline messages outside hours</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-warning-50 border-2 border-warning-500">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Refunds & post-issue friction
                    </p>
                    <p class="text-neutral-700 mb-3">
                      The key refund-related terms to understand upfront:
                    </p>
                    <ul class="space-y-2.5 text-neutral-700">
                      <li class="flex items-start gap-2.5">
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
                        <span>If a transaction is cancelled or fails, refunded funds are credited back net of SingX fees, third-party charges, bank fees, and any FX losses incurred.</span>
                      </li>
                      <li class="flex items-start gap-2.5">
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
                        <span>For cash payouts: if cash isn't picked up within 28 business days, the transaction is reversed and refunded after SingX recovers funds from the payout partner and deducts relevant charges.</span>
                      </li>
                    </ul>
                    <p class="text-neutral-700 mt-3 mb-0">
                      If you're in Australia, the Financial Services Guide also outlines a formal dispute path: Internal dispute resolution aiming to resolve within 7 days (or longer if needed), with escalation to AFCA if unresolved.
                    </p>
                    <p class="text-neutral-700 mt-3 mb-0">
                      <strong class="text-rs-fg">Practical implication:</strong> support is present and the processes are defined, but refund outcomes are not "free of friction"—fees and third-party costs can be deducted, and some cases can take time.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-20">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
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
                  <div class="mt-5 p-5 rounded-xl bg-brand-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Licensing / regulatory checks (where available)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      SingX's public documentation and regulator listings show:
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
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        <span><strong class="text-rs-fg">In Singapore,</strong> SingX Singapore Pte. Ltd. is listed in MAS's Financial Institutions Directory as a Major Payment Institution, with payment services such as cross-border money transfer listed on the entry.</span>
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
                        <span>SingX's Terms of Use also list license numbers across Singapore (MAS), Hong Kong (Money Service Operator license), and Australia (AFSL).</span>
                      </li>
                    </ul>
                    <p class="text-neutral-700 mt-3 mb-0">
                      If you're evaluating trust: it's reasonable to cross-check license claims in public regulator registers (like MAS's directory) where those registers exist and are searchable.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-warning-50 border-2 border-warning-500">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Safety caveat to keep in mind
                    </p>
                    <p class="text-neutral-700 mb-0">
                      SingX explicitly notes in its Terms that it's not a bank and deposit insurance schemes that cover bank accounts do not apply. That's normal for payment/remittance providers, but it's worth being clear-eyed about what protections do and don't apply.
                    </p>
                  </div>
                </div>
              </div>
              <div class="not-prose my-6 p-4 bg-warning-50 rounded-lg border-l-4 border-warning-600 text-warning-800">
                <p class="text-body-sm text-warning-800 m-0">
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
                <div class="rounded-xl border-2 border-success-500 bg-success-50 p-6">
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
                      <span><strong>Delivered Value:</strong> Clear fee framing (e.g., SingX's Singapore FAQ states ~0.25%–1% of the mid-market rate, with stable currencies closer to ~0.5%).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      <span><strong>Reliability & Success:</strong> Clear "funding → processing" logic (pre-funded transactions process at the confirmed rate; unfunded ones can queue and later expire).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      <span><strong>Trust & Safety:</strong> The Singapore entity is listed by MAS as a Major Payment Institution (with regulated payment services listed in the MAS directory entry).</span>
                    </li>
                  </ul>
                </div>
                <div class="rounded-xl border-2 border-warning-500 bg-warning-50 p-6">
                  <h3 class="flex items-center gap-2 text-h4 font-bold text-rs-fg mb-4 mt-0">
                    <svg
                      class="w-6 h-6 text-warning-800"
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
                      <span class="text-warning-800 font-bold">−</span>
                      <span><strong>Delivered Value:</strong> Fees/spreads can still vary—SingX's Australian disclosures describe transaction fees that can be higher for less-traded currencies, and note that an FX spread/mark-up may apply in some instances.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-800 font-bold">−</span>
                      <span><strong>Friction & Speed:</strong> Funding is fundamentally bank-driven (wallet top-ups via PayNow/bank transfer where available; bank transfer funding otherwise), and delivery is commonly "hours to next business day," not universal instant.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-800 font-bold">−</span>
                      <span><strong>Reliability & Success / Breadth:</strong> SingX's own FAQ positions transfers from Singapore/Australia/Hong Kong—if you're outside these origins, it may not be an option at all (which caps corridor breadth vs global leaders).</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="grid md:grid-cols-2 gap-8 mb-22">
                <div class="p-6 rounded-xl bg-success-50 border-2 border-success-200">
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
                      <span>Bank-transfer senders who prefer a clearly stated fee and are okay with bank cut-offs and "hours to next-day" delivery patterns.</span>
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
                      <span>Senders in SingX's supported origin markets (notably Singapore/Australia/Hong Kong) who want a repeatable workflow (including wallet funding where available).</span>
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
                      <span>Bank account (and some wallet) payouts where published processing windows are available and you can plan around them.</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-warning-50 border-2 border-warning-200">
                  <h2 class="text-h3 font-bold text-rs-fg mb-4 flex items-center gap-2">
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
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Not Ideal For
                  </h2>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-2.5">
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
                      <span>Anyone who needs broad "send-from anywhere" coverage (SingX's own FAQ describes transfers from Singapore, Australia, and Hong Kong).</span>
                    </li>
                    <li class="flex items-start gap-2.5">
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
                      <span>Recipients who need cash pickup or instant mobile money as the default (SingX does support cash payouts in some countries, but it's not the core experience).</span>
                    </li>
                    <li class="flex items-start gap-2.5">
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
                      <span>Users who need guaranteed instant delivery—processing is explicitly dependent on banks/intermediaries in many lanes.</span>
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
                  How to Get the Best Rate with SingX
                </h2>
                <p class="text-body-lg text-neutral-600 mb-6">
                  A short, practical checklist:
                </p>
                <div class="space-y-3">
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      1
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">Compare the total cost, not just the headline FX rate:</strong>
                      <span class="text-neutral-700">look at the explicit SingX fee and any spread/mark-up that may apply.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      2
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">Watch for third-party deductions:</strong>
                      <span class="text-neutral-700">(intermediary/receiving bank fees) if you need the recipient to receive an exact amount.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      3
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">Use wallet funding strategically (where available):</strong>
                      <span class="text-neutral-700">topping up ahead of time can reduce "queue time," but note wallet limits and top-up timing.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      4
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">Send before cutoffs when you care about same-day processing.</strong>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      5
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">Double-check recipient details:</strong>
                      <span class="text-neutral-700">Terms indicate you're responsible for accuracy and recovery may involve fees and isn't guaranteed.</span>
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
                  Two Alternatives (and When They Beat SingX)
                </h2>

                <div class="space-y-6">
                  <div class="p-6 rounded-xl border-2 border-rs-border bg-surface hover:border-brand-300 motion-safe:transition-colors">
                    <h3 class="text-h4 font-bold text-rs-fg mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      XE Money (8.7)
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      <strong class="text-rs-fg">When it can beat SingX:</strong> Pick XE Money when you want a broader all-rounder footprint—XE markets sending to 190+ countries, which can matter if SingX isn't available from your location.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      <strong class="text-rs-fg">Choose XE Money over SingX when:</strong> XE can beat SingX when the corridor you need is outside SingX's practical "send-from" reach, or when you prefer a more globally positioned provider (with the tradeoff that value may be competitive but not always the cheapest).
                    </p>
                  </div>

                  <div class="p-6 rounded-xl border-2 border-rs-border bg-surface hover:border-brand-300 motion-safe:transition-colors">
                    <h3 class="text-h4 font-bold text-rs-fg mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      Remitly (9.1)
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      <strong class="text-rs-fg">When it can beat SingX:</strong> Pick Remitly when speed and payout options are the priority—Remitly markets Express vs Economy speed choices and offers cash pickup in supported corridors.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      <strong class="text-rs-fg">Choose Remitly over SingX when:</strong> Remitly can beat SingX when the recipient needs cash pickup/mobile-style delivery or when you need a more "remittance-first" experience—while keeping in mind that Express convenience can cost more.
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
                  <div class="p-6 rounded-xl bg-brand-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3">
                      Who should use SingX?
                    </p>
                    <p class="text-neutral-800 mb-0">
                      SingX is a strong choice for bank-transfer remittances when you're in its supported origin markets and you value transparent, fee-led pricing. That's the core reason it earns an 8.2/10: the delivered value is often solid for bank-to-bank lanes, and SingX publishes meaningful operational detail (fees, cutoffs, and the funding/expiry workflow) that supports predictability.
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-success-50 border-2 border-success-200">
                    <p class="font-semibold text-rs-fg mb-3">
                      Why the 8.2/10 is justified:
                    </p>
                    <p class="text-neutral-800 mb-0">
                      SingX earns its score on Delivered Value with transparent, fee-led pricing that can be competitive for bank-to-bank transfers. The score is held back by exactly what the auditor notes say: moderate speed (bank-timed) and narrower breadth versus global leaders—plus the real-world caveat that spreads/third-party fees can still show up depending on currency pair and route.
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
              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
                <h3 class="text-body-lg font-bold text-rs-fg mb-2">
                  Ready to Compare?
                </h3>
                <p class="text-body-sm text-neutral-600 mb-4">
                  See how SingX stacks up for your specific corridor and amount.
                </p>
                <NuxtLink
                  to="/send-money"
                  class="block w-full rounded-xl bg-brand-600 px-4 py-3 text-center text-body-sm font-semibold text-white hover:bg-brand-700 motion-safe:transition-colors"
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
                      Primary Markets
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Singapore, Australia, Hong Kong
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Core Model
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Bank Transfer
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Singapore License
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      MAS Major Payment Institution
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Typical Speed
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Hours to Next Day
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Support
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Email, Chat, Hotline
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
                      to="/learn/providers/wise"
                      class="flex items-center gap-3 text-body-sm text-neutral-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-body-sm font-bold text-brand-600">W</div>
                      <span>Wise Review</span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink
                      to="/learn/providers/xe-money"
                      class="flex items-center gap-3 text-body-sm text-neutral-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-body-sm font-bold text-brand-600">XE</div>
                      <span>XE Money Review</span>
                    </NuxtLink>
                  </li>
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
    >
      <div class="mx-auto max-w-4xl px-page-x text-center">
        <h2
          class="text-h2 font-bold mb-4 text-white"
        >
          Ready to See How SingX Compares?
        </h2>
        <p
          class="text-body-lg mb-8 text-white/90"
        >
          Enter your transfer details to see real-time rates from SingX and 30+ other providers.
        </p>
        <NuxtLink
          to="/send-money"
          class="inline-flex items-center gap-2 rounded-xl bg-surface text-neutral-900 px-8 py-4 text-body-lg font-semibold shadow-lg hover:bg-neutral-50 motion-safe:transition-all"
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

const score = 8.2

const providerName = 'SingX'
const providerLogoUrl = `${siteUrl}${getProviderLogoPath('singx')}`

defineOgImage({
  component: 'OgImageProvider',
  props: {
    providerName,
    remitScore: score,
    logoUrl: providerLogoUrl,
  },
})

setSeo({
  title: `SingX Review ${new Date().getFullYear()} - Remit-Score 8.2/10 | Remit-Scout`,
  description: 'Independent SingX review with Remit-Score 8.2/10. Fees, exchange rates, delivery speed, and key pros/cons to compare before you send.',
  canonical: `${siteUrl}/learn/providers/singx`,
  ogImage: false,
})

const { addAggregateRatingSchema, addBreadcrumbSchema } = useStructuredData()

addAggregateRatingSchema({
  name: 'SingX',
  ratingValue: score,
  bestRating: 10,
  worstRating: 1,
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: 'SingX Review', path: '/learn/providers/singx' },
]

addBreadcrumbSchema(
  breadcrumbItems.map(item => ({
    name: item.name,
    url: item.path === '/' ? `${siteUrl}/` : `${siteUrl}${item.path}`,
  })),
)
</script>
