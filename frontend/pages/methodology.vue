<template>
  <div class="min-h-screen bg-surface">
    <CompareWidget />

    <!-- Hero Section with improved design -->
    <section class="relative bg-neutral-900 py-16 lg:py-20">
      <div class="relative z-10 mx-auto max-w-page px-page-x">
        <Breadcrumbs
          :items="breadcrumbItems"
          dark
        />

        <div class="mt-10">
          <div class="space-y-8">
            <div>
              <h1 class="text-h1 font-bold leading-tight text-white">
                The <span class="text-brand-600">Evaluation Standard</span>
              </h1>

              <p class="mt-4 max-w-4xl text-body-lg leading-relaxed text-neutral-300">
                How we collect quotes, score providers, and calculate what your recipient actually receives.
              </p>
              <p class="mt-4 text-body-sm text-neutral-400">
                Last updated:
                <time :datetime="lastUpdatedIso">{{ lastUpdatedLabel }}</time>
              </p>
            </div>

            <ImpactStatsSection
              variant="compact"
              :wrap="false"
              :with-container="false"
              :show-heading="false"
              :show-cta="false"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Compare Providers Section -->
    <section
      id="providers"
      class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="text-center mb-12">
          <h2 class="text-h2 font-bold text-neutral-900 mb-6">
            The Data Engine
          </h2>
          <p class="text-body-lg text-neutral-600 leading-relaxed mb-6">
            We monitor <strong class="font-semibold text-brand-600">{{ SITE_STATS.providers.display }}</strong> licensed providers across <strong class="font-semibold text-brand-600">{{ SITE_STATS.corridors.display }}</strong> corridors. Live quotes are captured from provider APIs and partner feeds, then normalized into a single outcome metric: Net Delivered Value — the amount your recipient actually receives.
          </p>
          <p class="text-body text-neutral-600 max-w-3xl mx-auto">
            <NuxtLink
              to="/send-money"
              class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30 hover:decoration-brand-700"
            >See all supported corridors</NuxtLink>
          </p>
        </div>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div class="group flex flex-col rounded-2xl border border-rs-border bg-surface p-8 shadow-sm motion-safe:transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
              <svg
                class="w-8 h-8 text-brand-600"
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
            </div>
            <h3 class="text-h4 font-bold text-neutral-900 mb-3">
              Latency Minimization
            </h3>
            <p class="text-neutral-600 leading-relaxed mb-3 flex-grow">
              FX markets are volatile. Quotes are refreshed frequently for high-volume corridors to ensure the spread you see is the spread you book.
            </p>
            <NuxtLink
              to="/learn/best-time-to-send-money"
              class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700 mt-auto"
            >
              Learn how rates work
              <svg
                class="h-3 w-3"
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

          <div class="group flex flex-col rounded-2xl border border-rs-border bg-surface p-8 shadow-sm motion-safe:transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
              <svg
                class="w-8 h-8 text-brand-600"
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
            </div>
            <h3 class="text-h4 font-bold text-neutral-900 mb-3">
              Total Cost Analysis
            </h3>
            <p class="text-neutral-600 leading-relaxed mb-3 flex-grow">
              We treat the FX Spread as a fee. By combining the upfront charge with the spread differential, we expose the true cost of the transaction.
            </p>
            <NuxtLink
              to="/learn/hidden-exchange-rate-fees-explained"
              class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700 mt-auto"
            >
              Learn about FX spread
              <svg
                class="h-3 w-3"
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

          <div class="group flex flex-col rounded-2xl border border-rs-border bg-surface p-8 shadow-sm motion-safe:transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
              <svg
                class="w-8 h-8 text-brand-600"
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
            </div>
            <h3 class="text-h4 font-bold text-neutral-900 mb-3">
              Quote Integrity
            </h3>
            <p class="text-neutral-600 leading-relaxed mb-3 flex-grow">
              We track 'Quote-to-Book' ratios. Providers with high failure rates or pricing inconsistencies are algorithmically penalized in our rankings.
            </p>
            <NuxtLink
              to="/learn/providers"
              class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700 mt-auto"
            >
              Browse all providers
              <svg
                class="h-3 w-3"
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
        </div>

        <p class="mt-10 text-body-sm text-neutral-500 text-center max-w-2xl mx-auto">
          Exchange rates are benchmarked against mid-market rates at quote capture time. See our <NuxtLink
to="/indices-methodology"
class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30"
>indices methodology</NuxtLink> for how this reference rate feeds TEER, RCI, and RVI.
        </p>

        <p class="mt-8 text-body text-neutral-500 text-center max-w-2xl mx-auto italic">
          Raw quotes tell you what each provider offers. But which provider is actually best? That requires scoring.
        </p>
      </div>
    </section>

    <!-- How We Rate Providers -->
    <section
      id="how-we-rate"
      class="py-16 lg:py-20 bg-surface scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-12 text-center">
          <p class="text-body-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">
            From raw quotes to a single number
          </p>
          <h2 class="text-h2 font-bold text-neutral-900 mb-6">
            How we rate providers
          </h2>
          <div class="max-w-4xl mx-auto space-y-4">
            <p class="text-body-lg text-neutral-700 leading-relaxed">
              Every provider on Remit-Scout receives a <strong class="font-semibold text-brand-600">Remit-Score</strong> — a composite 0–10 rating derived from live quote data. The score answers one question: how much value does this provider actually deliver to the recipient?
            </p>
            <p class="text-body-lg text-neutral-700 leading-relaxed">
              Remit-Score is not a review. It is not an opinion. It is a quantitative assessment computed from our quote dataset, weighted across five categories. Providers cannot pay to rank higher, and affiliate relationships do not influence score calculation.
            </p>
          </div>
        </div>

        <!-- Remit-Score Details -->
        <div class="bg-brand-50 border-2 border-brand-200 rounded-3xl p-8 lg:p-12">
          <div class="mb-8">
            <h2 class="text-h3 font-bold text-neutral-900 mb-4">
              Score components
            </h2>
            <p class="text-body text-neutral-700 mb-4 leading-relaxed">
              Each provider receives a <span class="font-semibold text-brand-600">Remit-Score (0–10)</span> across five weighted categories. Scores like <span class="font-semibold">9.5</span>, <span class="font-semibold">8.4</span>, or <span class="font-semibold">7.2</span> reflect actual delivery performance — not advertising claims.
            </p>
          </div>

          <!-- Rating Categories & Weights -->
          <div class="mb-10">
            <h3 class="text-h3 font-bold text-neutral-900 mb-8 text-center">
              Rating Categories & Weights
            </h3>

            <div class="space-y-4 w-full">
              <!-- Delivered Value - 40% -->
              <div class="flex w-full border-2 border-neutral-200 rounded-2xl bg-surface overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div class="bg-surface p-4 flex items-center justify-center flex-shrink-0 w-20">
                  <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                  <h4 class="font-bold text-neutral-900 text-body-lg mb-2">
                    Delivered Value
                  </h4>
                  <p class="text-body-sm text-neutral-600 leading-relaxed">
                    Effective cost (FX spread + fees), how often provider is cheapest, quote vs. actual delivery accuracy
                  </p>
                </div>
                <div class="bg-brand-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                  <div class="text-h1 font-bold text-white mb-1">
                    40%
                  </div>
                  <div class="text-body-sm text-white/90 uppercase tracking-wider font-semibold">
                    Weight
                  </div>
                </div>
              </div>

              <!-- Reliability & Success - 20% -->
              <div class="flex w-full border-2 border-neutral-200 rounded-2xl bg-surface overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div class="bg-surface p-4 flex items-center justify-center flex-shrink-0 w-20">
                  <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
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
                </div>
                <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                  <h4 class="font-bold text-neutral-900 text-body-lg mb-2">
                    Reliability & Success
                  </h4>
                  <p class="text-body-sm text-neutral-600 leading-relaxed">
                    Quote success rate, data freshness, pricing stability (where available)
                  </p>
                </div>
                <div class="bg-brand-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                  <div class="text-h1 font-bold text-white mb-1">
                    20%
                  </div>
                  <div class="text-body-sm text-white/90 uppercase tracking-wider font-semibold">
                    Weight
                  </div>
                </div>
              </div>

              <!-- Friction & Speed - 15% -->
              <div class="flex w-full border-2 border-neutral-200 rounded-2xl bg-surface overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div class="bg-surface p-4 flex items-center justify-center flex-shrink-0 w-20">
                  <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                  <h4 class="font-bold text-neutral-900 text-body-lg mb-2">
                    Friction & Speed
                  </h4>
                  <p class="text-body-sm text-neutral-600 leading-relaxed">
                    ETA where available, speed buckets, observed delivery times on selected corridors
                  </p>
                </div>
                <div class="bg-brand-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                  <div class="text-h1 font-bold text-white mb-1">
                    15%
                  </div>
                  <div class="text-body-sm text-white/90 uppercase tracking-wider font-semibold">
                    Weight
                  </div>
                </div>
              </div>

              <!-- Support & Refunds - 15% -->
              <div class="flex w-full border-2 border-neutral-200 rounded-2xl bg-surface overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div class="bg-surface p-4 flex items-center justify-center flex-shrink-0 w-20">
                  <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
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
                </div>
                <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                  <h4 class="font-bold text-neutral-900 text-body-lg mb-2">
                    Support & Refunds
                  </h4>
                  <p class="text-body-sm text-neutral-600 leading-relaxed">
                    Refund processing time, dispute resolution SLA, post-resolution satisfaction, chargeback rate
                  </p>
                </div>
                <div class="bg-brand-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                  <div class="text-h1 font-bold text-white mb-1">
                    15%
                  </div>
                  <div class="text-body-sm text-white/90 uppercase tracking-wider font-semibold">
                    Weight
                  </div>
                </div>
              </div>

              <!-- Trust & Safety - 10% -->
              <div class="flex w-full border-2 border-neutral-200 rounded-2xl bg-surface overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div class="bg-surface p-4 flex items-center justify-center flex-shrink-0 w-20">
                  <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>
                <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                  <h4 class="font-bold text-neutral-900 text-body-lg mb-2">
                    Trust & Safety
                  </h4>
                  <p class="text-body-sm text-neutral-600 leading-relaxed">
                    Public licensing checks where available, regulatory register verification
                  </p>
                </div>
                <div class="bg-brand-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                  <div class="text-h1 font-bold text-white mb-1">
                    10%
                  </div>
                  <div class="text-body-sm text-white/90 uppercase tracking-wider font-semibold">
                    Weight
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Text -->
          <div class="border-t-2 border-brand-200 pt-6">
            <p class="text-body text-neutral-600 leading-relaxed">
              Scores are computed from our quote dataset—fees, implied FX rate vs a mid-market reference, and delivered amount. We also factor in measurable signals like stated ETA, payment method support, and quote availability. Providers cannot pay to rank higher, and affiliate relationships do not influence score calculation.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Show Your Work Section -->
    <section
      id="show-your-work"
      class="py-16 lg:py-20 bg-neutral-900 scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="text-center mb-16">
          <h2 class="text-h1 font-bold text-white mb-6">
            Show Your Work
          </h2>
          <p
            class="text-h4 leading-relaxed max-w-4xl mx-auto [text-wrap:pretty] text-white/70"
          >
            No black box. This is what we measure, how we calculate Net Delivered Value, how we manage Data Latency, and what can change at checkout.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12 max-w-5xl mx-auto">
          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <h3 class="text-body font-semibold text-brand-600 mb-2">
              Data Sources
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              Mix of direct feeds from providers and public observation. We track when each quote was captured and store it for accuracy checks.
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <h3 class="text-body font-semibold text-brand-600 mb-2">
              Normalization
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              We decompose execution fees and FX Spread to compute Effective Exchange Rate and Net Delivered Value.
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <h3 class="text-body font-semibold text-brand-600 mb-2">
              Latency Controls
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              Corridor-specific refresh cadence with visible timestamps. Data Latency is surfaced with each quote.
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <h3 class="text-body font-semibold text-brand-600 mb-2">
              Audit Trail
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              Corrections are logged and discrepancies reviewed against checkout deltas or market movement.
            </p>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="mb-12 max-w-5xl mx-auto">
          <div class="bg-surface rounded-2xl p-8 lg:p-10">
            <div class="text-center mb-10">
              <h3 class="text-h3 font-bold text-neutral-900 mb-3">
                Frequently Asked Questions
              </h3>
              <p class="text-body text-neutral-600 max-w-2xl mx-auto">
                Common questions about how we collect data, calculate metrics, and ensure accuracy
              </p>
            </div>
            <div class="relative z-10 max-w-4xl mx-auto">
              <div class="space-y-3">
                <FaqAccordion :faqs="showYourWorkFaqs" />
              </div>
            </div>
          </div>
        </div>
</div>
    </section>

    <!-- Editorial & Independence -->
    <section
      id="editorial"
      class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-h2 font-bold text-neutral-900 mb-4">
            Editorial &amp; Independence
          </h2>
          <p class="text-body-lg leading-relaxed text-neutral-700 mb-8">
            Rankings are driven by data, not payments. Providers cannot buy placement, and affiliate commissions never change ranking logic.
          </p>
          <div class="grid gap-4 sm:grid-cols-3 mb-10">
            <div class="rounded-xl border border-brand-200 bg-surface p-5">
              <div class="flex items-center gap-3 mb-2">
                <svg
                  class="w-6 h-6 text-brand-600"
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
                <h4 class="font-semibold text-neutral-900">
                  No pay-to-rank
                </h4>
              </div>
              <p class="text-body-sm text-neutral-700 leading-relaxed">
                Providers cannot pay to appear higher or improve Remit‑Score.
              </p>
            </div>
            <div class="rounded-xl border border-brand-200 bg-surface p-5">
              <div class="flex items-center gap-3 mb-2">
                <svg
                  class="w-6 h-6 text-brand-600"
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
                <h4 class="font-semibold text-neutral-900">
                  Affiliate transparency
                </h4>
              </div>
              <p class="text-body-sm text-neutral-700 leading-relaxed">
                We may earn commissions, but they never affect ranking or Remit-Score.
              </p>
            </div>
            <div class="rounded-xl border border-brand-200 bg-surface p-5">
              <div class="flex items-center gap-3 mb-2">
                <svg
                  class="w-6 h-6 text-brand-600"
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
                <h4 class="font-semibold text-neutral-900">
                  We don't move money
                </h4>
              </div>
              <p class="text-body-sm text-neutral-700 leading-relaxed">
                Transfers happen on provider websites/apps, not through us.
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-4">
            <NuxtLink
              to="/legal/how-we-make-money"
              class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-body font-semibold text-white motion-safe:transition-colors hover:bg-brand-700"
            >
              <BanknotesIcon class="h-5 w-5" />
              How we make money
            </NuxtLink>
            <NuxtLink
              to="/affiliate-disclosure"
              class="inline-flex items-center gap-2 rounded-xl border-2 border-brand-200 bg-surface px-6 py-3 text-body font-semibold text-brand-700 motion-safe:transition-colors hover:bg-brand-50"
            >
              <DocumentTextIcon class="h-5 w-5" />
              Affiliate disclosure
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Educational Example Section -->
    <section class="py-16 lg:py-20 bg-surface scroll-mt-20">
      <BankVsSpecialistDynamic />
    </section>

    <!-- Testing Methodology -->
    <section
      id="testing-methodology"
      class="py-16 lg:py-20 bg-brand-600 scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 rounded-full bg-surface/20 px-4 py-2 text-body-sm font-semibold text-white mb-6">
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Our Testing Process
          </div>
          <h2 class="text-h2 font-bold text-white mb-4">
            How We Test & Verify Providers
          </h2>
          <p class="text-body-lg text-white/90 max-w-3xl mx-auto">
            Spot-check validation on selected corridors and methods
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-3">
          <div class="rounded-2xl border border-rs-border bg-surface p-8 hover:shadow-lg transition-shadow">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100">
              <svg
                class="w-8 h-8 text-brand-600"
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
            </div>
            <h3 class="text-h4 font-bold text-rs-fg mb-4">
              Data Collection
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed mb-4">
              We collect live <NuxtLink
                to="/exchange-rates"
                class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30"
              >exchange rates</NuxtLink> and fees from provider APIs and partner feeds, then validate with spot-check transfers on selected corridors.
            </p>
            <ul class="space-y-3 text-body-sm text-neutral-600">
              <li class="flex items-start gap-3">
                <svg
                  class="w-5 h-5 text-brand-600 flex-shrink-0"
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
                <span>We check publicly available regulatory registers where applicable</span>
              </li>
              <li class="flex items-start gap-3">
                <svg
                  class="w-5 h-5 text-brand-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Refresh frequently on top corridors (cadence varies)</span>
              </li>
              <li class="flex items-start gap-3">
                <svg
                  class="w-5 h-5 text-brand-600 flex-shrink-0"
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
                <span>Spot-check on selected corridors when feasible</span>
              </li>
            </ul>
          </div>

          <div class="rounded-2xl border border-rs-border bg-surface p-8 hover:shadow-lg transition-shadow">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100">
              <svg
                class="w-8 h-8 text-brand-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <h3 class="text-h4 font-bold text-rs-fg mb-4">
              Verification
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed mb-4">
              We run periodic spot-check transfers on selected corridors to validate provider claims when feasible.
            </p>
            <ul class="space-y-3 text-body-sm text-neutral-600">
              <li class="flex items-start gap-3">
                <svg
                  class="w-5 h-5 text-brand-600 flex-shrink-0"
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
                <span>Selected corridors based on coverage and user demand</span>
              </li>
              <li class="flex items-start gap-3">
                <svg
                  class="w-5 h-5 text-brand-600 flex-shrink-0"
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
                <span>Multiple send amounts (where testable)</span>
              </li>
              <li class="flex items-start gap-3">
                <svg
                  class="w-5 h-5 text-brand-600 flex-shrink-0"
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
                <span>Different payout methods where supported</span>
              </li>
            </ul>
          </div>

          <div class="rounded-2xl border border-rs-border bg-surface p-8 hover:shadow-lg transition-shadow">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100">
              <svg
                class="w-8 h-8 text-brand-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                />
              </svg>
            </div>
            <h3 class="text-h4 font-bold text-rs-fg mb-4">
              Ongoing Monitoring
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed mb-4">
              We continuously monitor provider rates and reliability to ensure data accuracy.
            </p>
            <ul class="space-y-3 text-body-sm text-neutral-600">
              <li class="flex items-start gap-3">
                <svg
                  class="w-5 h-5 text-brand-600 flex-shrink-0"
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
                <span>Automated alerts for unusual rate changes</span>
              </li>
              <li class="flex items-start gap-3">
                <svg
                  class="w-5 h-5 text-brand-600 flex-shrink-0"
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
                <span>Track delivery time anomalies</span>
              </li>
              <li class="flex items-start gap-3">
                <svg
                  class="w-5 h-5 text-brand-600 flex-shrink-0"
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
                <span>User feedback is reviewed and triaged continuously</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Proprietary Indices Section -->
    <section
      id="proprietary-indices"
      class="py-16 lg:py-20 bg-neutral-900 scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="text-center mb-12">
          <h2 class="text-h2 font-bold text-white mb-6">
            Proprietary Indices
          </h2>
          <p class="text-body-lg text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            Remit-Scout has developed three trademarked indices to quantify cross-border payment efficiency. A methodology overview and citation requirements live in our
            <NuxtLink
              to="/indices-methodology"
              class="text-brand-400 hover:text-brand-300 underline decoration-brand-400/40 hover:decoration-brand-300/60 font-semibold"
            >indices methodology</NuxtLink>.
            Full technical documentation is available to institutional clients under NDA.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          <NuxtLink
            to="/indices-methodology#teer"
            class="group flex flex-col rounded-2xl border border-white/20 bg-surface/10 backdrop-blur-sm p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-surface/15 hover:-translate-y-1"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 motion-safe:transition-colors">
              TEER™
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              True Effective Exchange Rate — the net rate recipients receive after all fees and FX markup. The single metric that tells you what actually arrives.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-white group-hover:gap-2 motion-safe:transition-all">
              Read methodology
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
            </span>
          </NuxtLink>

          <NuxtLink
            to="/indices-methodology#rvi"
            class="group flex flex-col rounded-2xl border border-white/20 bg-surface/10 backdrop-blur-sm p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-surface/15 hover:-translate-y-1"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 motion-safe:transition-colors">
              RVI™
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Remittance Volatility Index — how widely providers disagree on pricing in a corridor. High RVI means significant savings are available for those who compare.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-white group-hover:gap-2 motion-safe:transition-all">
              Read methodology
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
            </span>
          </NuxtLink>

          <NuxtLink
            to="/indices-methodology#rci"
            class="group flex flex-col rounded-2xl border border-white/20 bg-surface/10 backdrop-blur-sm p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-surface/15 hover:-translate-y-1"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 motion-safe:transition-colors">
              RCI™
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Remittance Cost Index — total transfer cost as a percentage of the send amount. Combines explicit fees and hidden FX spread into one comparable figure.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-white group-hover:gap-2 motion-safe:transition-all">
              Read methodology
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
            </span>
          </NuxtLink>
        </div>

        <div class="mt-10 text-center">
          <p class="text-body-sm text-neutral-400">
            TEER™, RVI™, and RCI™ are trademarks of Remit-Scout. See the
            <NuxtLink
              to="/indices-methodology"
              class="text-brand-400 hover:text-brand-300 underline decoration-brand-400/40 hover:decoration-brand-300/60 font-semibold"
            >indices methodology</NuxtLink>
            for methodology overview and citation requirements.
          </p>
          </div>
        </div>
      </section>

    <!-- Technical Appendix (Institutional) -->
    <section
      v-if="enterpriseEnabled"
      id="technical-appendix"
      class="py-16 lg:py-20 bg-neutral-900 scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-12">
          <p class="text-body-sm font-semibold text-primary-400 uppercase tracking-wide mb-3">
            For Compliance & Research Teams
          </p>
          <h2 class="text-h2 font-bold text-white mb-4">
            Technical Appendix
          </h2>
          <p class="text-body-lg text-neutral-400 max-w-3xl">
            Detailed technical documentation for enterprise audits, compliance reviews, and integration planning.
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-2">
          <!-- Synthetic Verification Process -->
          <div class="rounded-xl border border-neutral-700 bg-neutral-800/50 p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success-600/20">
                <svg
                  class="w-5 h-5 text-success-600"
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
              <h3 class="text-body-lg font-semibold text-white">
                Synthetic Verification Process
              </h3>
            </div>

            <p class="text-body-sm text-neutral-400 mb-4">
              We validate pricing data through automated transaction simulations on selected corridors.
            </p>

            <div class="space-y-4">
              <div class="flex gap-3">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-body-sm font-bold text-white">
                  1
                </div>
                <div>
                  <p class="text-body-sm font-medium text-white">
                    Quote Capture
                  </p>
                  <p class="text-body-sm text-rs-muted">
                    Quotes are captured from provider APIs and partner feeds
                  </p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-body-sm font-bold text-white">
                  2
                </div>
                <div>
                  <p class="text-body-sm font-medium text-white">
                    Transaction Simulation
                  </p>
                  <p class="text-body-sm text-rs-muted">
                    Synthetic transfers initiated to checkout (not completed) to verify pricing
                  </p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-body-sm font-bold text-white">
                  3
                </div>
                <div>
                  <p class="text-body-sm font-medium text-white">
                    Delta Analysis
                  </p>
                  <p class="text-body-sm text-rs-muted">
                    Quote vs. checkout amounts compared; deviations &gt;2% flagged for review
                  </p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-body-sm font-bold text-white">
                  4
                </div>
                <div>
                  <p class="text-body-sm font-medium text-white">
                    Live Validation
                  </p>
                  <p class="text-body-sm text-rs-muted">
                    Periodic real transfers on selected corridors to confirm end-to-end accuracy
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-neutral-700">
              <div class="flex items-center gap-2 text-body-sm text-success-600">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Current validation coverage: 85% of top 50 corridors</span>
              </div>
            </div>
          </div>

          <!-- Data Pipeline Architecture -->
          <div class="rounded-xl border border-neutral-700 bg-neutral-800/50 p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-600/20">
                <svg
                  class="w-5 h-5 text-accent-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
              </div>
              <h3 class="text-body-lg font-semibold text-white">
                Data Pipeline Architecture
              </h3>
            </div>

            <p class="text-body-sm text-neutral-400 mb-4">
              Our data collection and processing infrastructure ensures accuracy and auditability.
            </p>

            <div class="space-y-3">
              <div class="rounded-lg bg-neutral-900 p-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-body-sm font-medium text-white">Data Sources</span>
                  <span class="text-body-sm text-rs-muted">33+ providers</span>
                </div>
                <p class="text-body-sm text-rs-muted">
                  Provider APIs, partner feeds, affiliate integrations
                </p>
              </div>
              <div class="rounded-lg bg-neutral-900 p-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-body-sm font-medium text-white">Collection Frequency</span>
                  <span class="text-body-sm text-rs-muted">Variable</span>
                </div>
                <p class="text-body-sm text-rs-muted">
                  Frequent (top corridors) to periodic (long-tail)
                </p>
              </div>
              <div class="rounded-lg bg-neutral-900 p-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-body-sm font-medium text-white">Mid-Market Benchmark</span>
                  <span class="text-body-sm text-rs-muted">XE, ECB</span>
                </div>
                <p class="text-body-sm text-rs-muted">
                  Timestamped reference rates for markup calculation
                </p>
              </div>
              <div class="rounded-lg bg-neutral-900 p-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-body-sm font-medium text-white">Storage & Retention</span>
                  <span class="text-body-sm text-rs-muted">365+ days</span>
                </div>
                <p class="text-body-sm text-rs-muted">
                  Immutable quote records with cryptographic hashes
                </p>
              </div>
            </div>
          </div>

          <!-- Audit Trail & Provenance -->
          <div class="rounded-xl border border-neutral-700 bg-neutral-800/50 p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-600/20">
                <svg
                  class="w-5 h-5 text-warning-600"
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
              </div>
              <h3 class="text-body-lg font-semibold text-white">
                Audit Trail & Provenance
              </h3>
            </div>

            <p class="text-body-sm text-neutral-400 mb-4">
              Every data point is traceable from source to publication with cryptographic verification.
            </p>

            <div class="space-y-3 text-body-sm">
              <div class="flex items-start gap-2 text-neutral-300">
                <svg
                  class="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0"
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
                <span><strong class="text-white">SHA-256 hashes</strong> for all quote records</span>
              </div>
              <div class="flex items-start gap-2 text-neutral-300">
                <svg
                  class="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0"
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
                <span><strong class="text-white">UTC timestamps</strong> with millisecond precision</span>
              </div>
              <div class="flex items-start gap-2 text-neutral-300">
                <svg
                  class="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0"
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
                <span><strong class="text-white">Source attribution</strong> for every data point</span>
              </div>
              <div class="flex items-start gap-2 text-neutral-300">
                <svg
                  class="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0"
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
                <span><strong class="text-white">Immutable logs</strong> for compliance exports</span>
              </div>
            </div>

            <div class="mt-4 p-3 rounded-lg bg-neutral-900 border border-neutral-700">
              <p class="text-body-sm text-rs-muted font-mono">
                Example hash: <span class="text-neutral-400">a3f2c8e1...</span>
              </p>
              <p class="text-body-sm text-rs-muted font-mono">
                Timestamp: <span class="text-neutral-400">2026-02-19T10:14:22.391Z</span>
              </p>
            </div>
          </div>

          <!-- API & Integration -->
          <div class="rounded-xl border border-neutral-700 bg-neutral-800/50 p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
                <svg
                  class="w-5 h-5 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h3 class="text-body-lg font-semibold text-white">
                API & Integration
              </h3>
            </div>

            <p class="text-body-sm text-neutral-400 mb-4">
              Enterprise API access for programmatic data retrieval and system integration.
            </p>

            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 rounded-lg bg-neutral-900">
                <span class="text-body-sm text-white">REST API</span>
                <span class="text-body-sm px-2 py-1 rounded bg-success-600/20 text-success-600">Available</span>
              </div>
              <div class="flex items-center justify-between p-3 rounded-lg bg-neutral-900">
                <span class="text-body-sm text-white">GraphQL</span>
                <span class="text-body-sm px-2 py-1 rounded bg-primary-500/20 text-primary-400">Coming Q3 2026</span>
              </div>
              <div class="flex items-center justify-between p-3 rounded-lg bg-neutral-900">
                <span class="text-body-sm text-white">Webhooks</span>
                <span class="text-body-sm px-2 py-1 rounded bg-success-600/20 text-success-600">Available</span>
              </div>
              <div class="flex items-center justify-between p-3 rounded-lg bg-neutral-900">
                <span class="text-body-sm text-white">Bulk Export (CSV/JSON)</span>
                <span class="text-body-sm px-2 py-1 rounded bg-success-600/20 text-success-600">Available</span>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-neutral-700">
              <NuxtLink
                to="/enterprise"
                class="inline-flex items-center gap-2 text-body-sm font-medium text-primary-400 hover:text-primary-300 motion-safe:transition-colors"
              >
                <span>Request API access</span>
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
          </div>
        </div>

        <div class="mt-10 pt-8 border-t border-neutral-700">
          <div class="flex flex-wrap items-center gap-6 text-body-sm text-rs-muted">
            <div class="flex items-center gap-2">
              <svg
                class="w-4 h-4 text-success-600"
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
              <span>Synthetically verified v2.5.0</span>
            </div>
            <div class="flex items-center gap-2">
              <svg
                class="w-4 h-4 text-success-600"
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
              <span>Last audit: February 2026</span>
            </div>
            <div class="flex items-center gap-2">
              <svg
                class="w-4 h-4 text-success-600"
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
              <span>Compliance documentation available on request</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="py-16 sm:py-20 bg-brand-600">
      <div class="mx-auto max-w-4xl px-page-x text-center">
        <h2 class="text-h2 font-bold text-white mb-4">
          See the methodology in action
        </h2>
        <p class="text-body-lg text-white/80 mb-10 max-w-2xl mx-auto">
          Every comparison on Remit-Scout is built on the framework described here — live quotes, normalized costs, and outcome-first rankings.
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-3 px-8 py-4 bg-surface text-brand-600 font-bold text-body-lg rounded-xl hover:bg-surface/90 hover:shadow-xl transform hover:-translate-y-0.5 motion-safe:transition-all duration-200"
          >
            <span>Compare rates now</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </NuxtLink>
          <NuxtLink
            to="/indices-methodology"
            class="inline-flex items-center gap-3 px-8 py-4 border-2 border-white/30 text-white font-bold text-body-lg rounded-xl hover:bg-white/10 motion-safe:transition-all duration-200"
          >
            Read the indices methodology
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  BanknotesIcon,
  DocumentTextIcon,
} from '@heroicons/vue/24/outline'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import BankVsSpecialistDynamic from '~/components/home/BankVsSpecialistDynamic.vue'
import ImpactStatsSection from '~/components/home/ImpactStatsSection.vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import { SITE_STATS } from '~/config/stats'
import { useFeatureFlags } from '~/composables/useFeatureFlags'

const { pulseEnabled, enterpriseEnabled } = useFeatureFlags()

const lastUpdatedIso = '2026-02-19'
const lastUpdatedLabel = computed(() => {
  return new Date(lastUpdatedIso).toLocaleDateString('en-US', {
    day: 'numeric',
    year: 'numeric',
    month: 'long',
  })
})

const quickLinks = [
  { label: 'Comparison engine', href: '#providers' },
  { label: 'Remit-Score', href: '#remit-score' },
  { label: 'Show your work', href: '#show-your-work' },
  { label: 'Testing', href: '#testing-methodology' },
  { label: 'Proprietary Indices', href: '#proprietary-indices' },
  ...(enterpriseEnabled.value ? [{ label: 'Data pipeline', href: '#technical-appendix' }] : []),
]

const pulseCallout = pulseEnabled.value
  ? '<p>These records enable us to track pricing trends over time and power features like <a href="/pulse" class="text-brand-600 hover:text-brand-700 underline font-semibold">Pulse</a>, which shows rate movements and helps you time your transfers.</p>'
  : '<p>These records enable us to track pricing trends over time and publish guidance on timing, volatility, and pricing patterns.</p>'

const showYourWorkFaqs = [
  {
    question: 'What we measure',
    answer: `
      <p>We capture standardized snapshots of provider quotes called <strong>Quote Records</strong>. Each record represents what a provider would offer at a specific moment for a given transfer scenario.</p>
      <p>For example: sending $500 USD from the United States to Albania, funded via debit card, delivered to a bank account.</p>
      <p><strong>Data points we capture:</strong></p>
      <ul>
        <li>Timestamp of capture (UTC)</li>
        <li>Transfer corridor (sending and receiving countries, currency pair)</li>
        <li>Transfer amount</li>
        <li>Payment method (card, bank transfer) and delivery method (bank account, cash pickup, mobile wallet)</li>
        <li>Provider fees (fixed and variable)</li>
        <li>Exchange rate offered</li>
        <li>Net Delivered Value (destination amount)</li>
        <li>Estimated delivery time</li>
      </ul>
      ${pulseCallout}
    `,
  },
  {
    question: 'How we calculate Net Delivered Value',
    answer: `
      <p>Net Delivered Value represents the funds delivered to the destination account after all fees and FX Spread adjustments are applied.</p>
      <p><strong>Calculation formula:</strong></p>
      <div class="mt-2 rounded-lg border border-rs-border bg-neutral-50 px-4 py-3 overflow-x-auto">
        <span>\\[\\text{NDV} = (S - F) \\times r_{\\text{provider}}\\]</span>
      </div>
      <p class="mt-2 text-body-sm text-neutral-600">
        <strong>Where:</strong> \\(S\\) is the send amount, \\(F\\) is total fees, and \\(r_{\\text{provider}}\\) is the provider exchange rate.
      </p>
      <p><strong>Example calculation:</strong></p>
      <ul>
        <li>Send amount: $500 USD</li>
        <li>Mid-market rate: 18.50 MXN per USD</li>
        <li>Provider A: $5.00 fee, 18.00 rate → Net Delivered Value: <strong>8,910 MXN</strong></li>
        <li>Provider B: $1.99 fee, 18.45 rate → Net Delivered Value: <strong>9,188 MXN</strong></li>
      </ul>
      <p>Provider B delivers <strong>278 MXN more</strong> despite similar execution fees. The exchange rate difference accounts for the variation.</p>
      <p><strong>Important note:</strong> Final checkout amounts may differ from our quotes due to promotional offers, identity verification requirements, payment method variations, or exchange rate movements between quote capture and transaction completion.</p>
    `,
  },
  {
    question: 'How we estimate FX Spread',
    answer: `
      <p>Many providers generate revenue by offering exchange rates below the mid-market rate. This difference, known as <strong>FX Spread</strong>, represents an embedded cost to the sender.</p>
      <p>We calculate FX Spread by comparing the provider's quoted rate to the mid-market reference rate at the <strong>exact same timestamp</strong>. Exchange rates fluctuate throughout the day, so accurate timing is essential for fair comparison.</p>
      <p><strong>Calculation formula:</strong></p>
      <div class="mt-2 rounded-lg border border-rs-border bg-neutral-50 px-4 py-3 overflow-x-auto">
        <span>\\[\\text{FX Spread} = \\frac{r_{\\text{mid}} - r_{\\text{provider}}}{r_{\\text{mid}}}\\]</span>
      </div>
      <p class="mt-2 text-body-sm text-neutral-600">
        <strong>Where:</strong> \\(r_{\\text{mid}}\\) is the mid-market reference rate at capture time, and \\(r_{\\text{provider}}\\) is the provider quoted rate at the same time.
      </p>
      <p>When reliable timestamp alignment or data quality cannot be confirmed, we prioritize transparency and clearly indicate reduced confidence levels rather than making assumptions.</p>
    `,
  },
  {
    question: 'Data freshness and reliability',
    answer: `
      <p>We update provider quotes regularly, with update frequency varying by transfer corridor and provider availability. High-volume routes receive more frequent updates.</p>
      <p><strong>Quality metrics we monitor:</strong></p>
      <ul>
        <li>Quote capture timestamps</li>
        <li>Provider quote success rates</li>
        <li>Accuracy of quotes versus actual checkout amounts</li>
      </ul>
      <p><strong>Data sources (in order of reliability):</strong></p>
      <ul>
        <li>Provider APIs and partner feeds (highest accuracy)</li>
        <li>Affiliate and distribution integrations</li>
        <li>Real transfer tests on selected corridors</li>
      </ul>
      <p>We continuously work to expand direct API integrations to improve data freshness and reliability across all corridors.</p>
    `,
  },
  {
    question: 'What can change at checkout?',
    answer: `
      <p>Several factors may cause the final checkout amount to differ from our quoted amount:</p>
      <ul>
        <li><strong>Promotional offers:</strong> First-time user bonuses or limited-time promotions</li>
        <li><strong>Identity verification:</strong> KYC requirements may affect transfer speed and applicable fees</li>
        <li><strong>Bank fees:</strong> Intermediary banks may charge separate fees not included in provider quotes</li>
        <li><strong>Exchange rate movements:</strong> Rates fluctuate continuously throughout trading hours</li>
        <li><strong>Payment method differences:</strong> Card-based transfers typically incur higher fees than bank transfers</li>
      </ul>
      <p>If you notice a discrepancy between our quote and the provider's checkout amount, please report it with the following details: transfer corridor, amount, quote timestamp, provider name, and a screenshot if available. We address confirmed issues within 48 hours.</p>
      <p><a href="/contact" class="text-brand-600 hover:text-brand-700 underline font-semibold">Report a problem</a> | <a href="/corrections" class="text-brand-600 hover:text-brand-700 underline font-semibold">View corrections policy</a></p>
    `,
  },
]

const { public: { siteUrl } } = useRuntimeConfig()

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Methodology',
    description: 'How we collect pricing, measure delivered value, and compute indices like TEER, RCI, and RVI.',
  },
})

setSeo({
  title: 'The Evaluation Standard | Remit-Scout Methodology',
  description: 'A framework for comparing money transfers. Learn how we collect pricing, score providers, and compute TEER, RCI, and RVI to calculate net value delivered.',
  canonical: `${siteUrl}/methodology`,
  ogImage: false,
  ogType: 'article',
  publishedTime: lastUpdatedIso,
  modifiedTime: lastUpdatedIso,
  author: 'Remit-Scout Editorial Team',
  tags: ['methodology', 'remittances', 'comparison', 'proprietary indices'],
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Methodology', url: `${siteUrl}/methodology` },
])

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'The Evaluation Standard',
        'url': `${siteUrl}/methodology`,
        'datePublished': lastUpdatedIso,
        'dateModified': lastUpdatedIso,
        'author': {
          '@type': 'Organization',
          'name': 'Remit-Scout Editorial Team',
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Remit-Scout',
          'url': siteUrl,
        },
      }),
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Methodology', path: '/methodology' },
]
</script>

<style scoped>
</style>
