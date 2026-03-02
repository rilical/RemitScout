<template>
  <div class="min-h-screen bg-surface">
<!-- Hero Section -->
    <section class="relative bg-neutral-900 py-16 lg:py-24 overflow-hidden">
      <div class="mx-auto max-w-page px-page-x relative">
        <Breadcrumbs
:items="breadcrumbItems"
:dark="true"
/>

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-4 mb-6">
              <div class="flex h-40 w-40 items-center justify-center rounded-2xl bg-surface p-3 shadow-xl">
                <ProviderLogo
                  slug="wirebarley"
                  alt="WireBarley"
                  size="xlarge"
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
                  WireBarley Review
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
              40
            </div>
            <div class="text-body-sm text-neutral-600">
              Receiving Countries
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              5 Markets
            </div>
            <div class="text-body-sm text-neutral-600">
              Send From
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-brand-600">
              Korea-Focused
            </div>
            <div class="text-body-sm text-neutral-600">
              Core Strength
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              30 Min
            </div>
            <div class="text-body-sm text-neutral-600">
              Rate Guarantee
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
                  WireBarley's 8.2/10 is driven first by Delivered Value (40%): in its core use case—Korea-linked corridors—WireBarley can be cost-effective because fees are clearly tiered (in some markets) and the "effective cost" often comes down to how tight the FX rate is plus whether you avoid higher-fee payout paths. The score doesn't push higher mainly because corridor footprint is narrower than the global leaders, especially on the "send-from" side, so it's not always an option even if the receiving country is supported.
                </p>
              </div>

              <div class="mb-22">
                <h2 class="text-h2 font-bold text-rs-fg mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-brand-600 rounded-full" />
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-neutral-50 border-2 border-rs-border">
                  <p class="text-body-lg text-neutral-800 leading-relaxed italic m-0">
                    "WireBarley (8.2): Korea-corridor strength; good value/speed in-core; narrower corridor footprint."
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
                  Here's how WireBarley performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-h3 shadow-md">
                    8.2
                  </div>
                  <div>
                    <h3 class="text-h3 font-bold text-rs-fg mb-2 flex items-center gap-2">
                      WireBarley
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
                      In South Korea sending, WireBarley publishes low, tiered transfer fees (and can be free above certain thresholds), which can keep total cost competitive in-core.
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
                      FX quotes are time-bound (rate guarantee window), so if you delay funding/confirmation you may need to re-quote and accept a different rate.
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
                      WireBarley's stated delivery range includes "minutes" on some corridors/methods, which is meaningful for Korea-linked use cases where speed matters.
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
                      Customer center contacts, hours, and supported languages are clearly posted across multiple regions.
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
                      Small overseas remittance business registered corporation approved by Korea's Ministry of Strategy and Finance. Australia subsidiary has IRD license from AUSTRAC. US transfers through Community Federal Savings Bank with FinCEN eligibility.
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
                        WireBarley's 8.2/10 is driven first by Delivered Value because in its core use case—Korea-linked corridors—WireBarley can be cost-effective with clearly tiered fees. The score doesn't push higher mainly because corridor footprint is narrower than the global leaders, especially on the "send-from" side, so it's not always an option even if the receiving country is supported.
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
                    Effective cost = fees + FX spread + "surprises" (most important)
                  </p>
                  <p class="text-neutral-700 mb-3">
                    WireBarley's value story is easiest to evaluate when there's a published fee schedule. For sending from South Korea, WireBarley lists:
                  </p>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">1</span>
                      <span><strong class="text-rs-fg">Per-transaction limit:</strong> minimum 100,000 KRW up to 1 billion KRW (per transaction).</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">2</span>
                      <span><strong class="text-rs-fg">SWIFT SHA fees:</strong> Under 3,000,000 KRW: 3,000 KRW; 3,000,000–5,000,000 KRW: 2,000 KRW; Over 5,000,000 KRW: free</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">3</span>
                      <span><strong class="text-rs-fg">SWIFT OUR fees:</strong> &lt; 5,000,000 KRW: 15,000 KRW; ≥ 5,000,000 KRW: 5,000 KRW</span>
                    </li>
                  </ul>
                  <p class="text-neutral-700 mt-3 mb-0">
                    That said, WireBarley also warns that the final received amount can change due to intermediary bank fees (important if you're trying to deliver an exact amount).
                  </p>
                </div>

                <div class="p-6 rounded-xl bg-neutral-50 border-2 border-primary-200 mb-6">
                  <p class="text-neutral-800 leading-relaxed mb-4">
                    <strong class="text-rs-fg">On FX:</strong> like most remittance providers, WireBarley can earn money via both transaction fees and the difference between the FX rate it obtains and the rate it offers you (i.e., spread). The practical implication is that "low fee" doesn't automatically mean "lowest effective cost" if the exchange rate is less favorable at the moment you send.
                  </p>
                </div>

                <div class="p-6 rounded-xl border-2 border-success-600">
                  <p class="font-semibold text-rs-fg mb-3">
                    "How often is it cheapest?"
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-4">
                    Remit-Scout isn't claiming WireBarley is "always cheapest." What the data signals support is:
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
                      <span>It can be very competitive in Korea-linked lanes where published fees are small and the delivery method is efficient.</span>
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
                      <span>It can lose when the effective cost is driven by FX spread, intermediary deductions, or when you choose a more expensive delivery option (WireBarley notes home delivery costs more than cash pickup and takes longer in at least one corridor).</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="not-prose my-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p class="text-body-sm text-primary-800 m-0">
                  <strong>Quote vs delivered accuracy:</strong> Two things matter here: WireBarley says the exchange rate is held for 30 minutes during the application/confirmation flow; after that you must start again. That's good transparency, but it also means delays can change your final "deal." For SWIFT transfers, WireBarley explicitly flags that intermediary fees can affect what arrives.
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
                      WireBarley's help center lists the following as places you can initiate transfers from: Australia, Hong Kong, New Zealand, South Korea, and the USA.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      It also lists 40 receiving countries (as of the referenced help article). This is the "footprint constraint" behind the score: even if the receiving country is supported, you still need WireBarley to support your sending country and funding flow.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-brand-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Pricing stability & data freshness signals
                    </p>
                    <p class="text-neutral-700 mb-0">
                      WireBarley provides a clear "freshness" signal via its exchange rate guarantee period (30 minutes). That implies quotes aren't open-ended, and it sets a predictable expectation for how long a price is valid.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-brand-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Operational status transparency
                    </p>
                    <p class="text-neutral-700 mb-0">
                      WireBarley states it will notify you when remittance is complete via a message to your registered mobile number. This doesn't prove success rates, but it does indicate a defined completion signal.
                    </p>
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
                      ETA / speed buckets (what WireBarley says to expect)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      WireBarley's help center sets a broad but useful range:
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span><strong class="text-rs-fg">Fast lanes:</strong> "a few minutes" (corridor- and payment-method dependent)</span>
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
                        <span><strong class="text-rs-fg">Typical slow end:</strong> up to 2 business days</span>
                      </li>
                    </ul>
                    <p class="text-neutral-700 mt-3 mb-0">
                      That aligns with the auditor note: good speed in-core, but not universal instant.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-brand-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Payout methods (what recipients can use)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Payout types vary by destination. For example, for Nepal WireBarley lists:
                    </p>
                    <div class="flex flex-wrap gap-2 mb-3">
                      <span class="px-3 py-1 rounded-full bg-surface border border-rs-border text-body-sm text-neutral-700">Bank deposit</span>
                      <span class="px-3 py-1 rounded-full bg-surface border border-rs-border text-body-sm text-neutral-700">Mobile wallet</span>
                      <span class="px-3 py-1 rounded-full bg-surface border border-rs-border text-body-sm text-neutral-700">Cash pickup</span>
                    </div>
                    <p class="text-neutral-700 mb-0">
                      And WireBarley notes (in Vietnam guidance) that home delivery costs more and takes longer than cash pickup.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-warning-50 border-2 border-warning-500">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Typical delivery-speed behavior (what to watch)
                    </p>
                    <p class="text-neutral-700 mb-0">
                      Because the experience depends on payout method and local processing, the same provider can feel "instant" in one lane and "bank-timed" in another. WireBarley explicitly tells users to check the delivery estimate at the "final confirmation" step.
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
                      Support access (hours + languages)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      WireBarley publishes regional support windows and languages—for example:
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
                        <span><strong class="text-rs-fg">Korea:</strong> weekdays 10:00–19:00 KST, multiple languages including Korean/English/Chinese/Vietnamese/Thai/Filipino</span>
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
                        <span><strong class="text-rs-fg">US/Canada:</strong> weekdays 10:00–20:00 EST, English/Korean/Thai/Chinese</span>
                      </li>
                    </ul>
                    <p class="text-neutral-700 mt-3 mb-0">
                      …and similar coverage for other regions. This matters post-issue: you can at least know where to go and when.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-warning-50 border-2 border-warning-500">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Refunds & dispute handling (what the rules imply for consumers)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      WireBarley's help center draws a hard line that users should understand:
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
                        <span>If you cancel before the remittance instruction is delivered to the recipient-side payment institution, a refund is possible (with an estimated 1–3 business days).</span>
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
                        <span>If it's already been sent to the recipient-side institution or already received, refunds are not possible.</span>
                      </li>
                    </ul>
                    <p class="text-neutral-700 mt-3 mb-3">
                      On refund amounts: If the issue is customer-caused (e.g., incorrect recipient info), WireBarley states it may refund excluding the fee; if not customer-caused (e.g., delay in payment), it states fees are included.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      On timing: WireBarley states bank transfer refunds are typically processed within 7 business days (though it may be faster depending on factors).
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
                    WireBarley provides several "trust hooks" you can verify where available:
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-brand-50 border-2 border-brand-200">
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
                        <span>It states it is a small overseas remittance business registered corporation approved by Korea's Ministry of Strategy and Finance (with a registration number referenced).</span>
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
                        <span>It states its Australia subsidiary has an Independent Remittance Dealer (IRD) license from AUSTRAC.</span>
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
                        <span>It states it partners with Community Federal Savings Bank for US money transfers and is "eligible for international remittance" with FinCEN.</span>
                      </li>
                    </ul>
                    <p class="text-neutral-700 mt-3 mb-0">
                      Practical guidance: treat these as checkpoints, not guarantees. If you're making a decision based on licensing, look up the relevant regulator's public register (when one exists) and confirm the entity name and license status.
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
                      <span><strong>Delivered Value:</strong> In South Korea sending, WireBarley publishes low, tiered transfer fees (and can be free above certain thresholds), which can keep total cost competitive in-core.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      <span><strong>Friction & Speed:</strong> WireBarley's stated delivery range includes "minutes" on some corridors/methods, which is meaningful for Korea-linked use cases where speed matters.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      <span><strong>Support & Refunds:</strong> Customer center contacts, hours, and supported languages are clearly posted across multiple regions.</span>
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
                      <span><strong>Delivered Value:</strong> Even with low headline fees, the delivered amount can still be affected by intermediary bank fees (WireBarley flags this directly for SWIFT transfers).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-800 font-bold">−</span>
                      <span><strong>Reliability & Success:</strong> FX quotes are time-bound (rate guarantee window), so if you delay funding/confirmation you may need to re-quote and accept a different rate.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-800 font-bold">−</span>
                      <span><strong>Trust & Safety / Coverage:</strong> Coverage breadth is the ceiling—WireBarley itself notes a limited set of sending countries (expansion "planned"), which can make it a non-starter outside its core footprint.</span>
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
                      <span>Sending from / to South Korea when you want a straightforward bank-style remittance flow and are comparing costs across providers.</span>
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
                      <span>Users who can fund and confirm within the quote window (WireBarley says the exchange rate is guaranteed for a limited time).</span>
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
                      <span>Recipients who can use bank deposit, cash pickup, or mobile wallet depending on the corridor (WireBarley lists multiple payout types in certain countries).</span>
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
                      <span>If you need "send-from anywhere" coverage: WireBarley's help center lists only a handful of sending countries (and coverage varies by product/region).</span>
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
                      <span>If you need guaranteed instant delivery: WireBarley frames delivery as anywhere from minutes up to 2 business days depending on country and payout method.</span>
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
                      <span>If you need easy reversals after payout has started/completed: WireBarley states refunds aren't possible once the instruction has been delivered to the recipient-side institution or the funds are received.</span>
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
                  How to Get the Best Rate with WireBarley
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
                      <strong class="text-rs-fg block mb-2.5 text-body">Compare "effective cost," not the headline fee:</strong>
                      <span class="text-neutral-700">check the send fee and the FX rate you're being offered.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      2
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">Move within the quote window:</strong>
                      <span class="text-neutral-700">WireBarley says the rate is guaranteed for 30 minutes during the application flow.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      3
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">Choose payout method carefully:</strong>
                      <span class="text-neutral-700">cash pickup vs home delivery can change both cost and speed (home delivery can be more expensive and slower, depending on corridor).</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      4
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">If sending SWIFT, expect possible intermediary deductions:</strong>
                      <span class="text-neutral-700">WireBarley flags this directly; don't assume "fee = total cost."</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      5
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-2.5 text-body">If you might need a refund, cancel early:</strong>
                      <span class="text-neutral-700">refunds become impossible once the instruction is delivered/received.</span>
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
                  Two Alternatives (and When They Beat WireBarley)
                </h2>

                <div class="space-y-6">
                  <div class="p-6 rounded-xl border-2 border-rs-border bg-surface hover:border-brand-300 motion-safe:transition-colors">
                    <h3 class="text-h4 font-bold text-rs-fg mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      Remitly (9.1)
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      <strong class="text-rs-fg">When it can beat WireBarley:</strong> Use Remitly instead when you need more global coverage and more delivery-style flexibility (and you're willing to compare price carefully—your auditor note flags that "Express" speed can cost more).
                    </p>
                    <p class="text-neutral-700 mb-0">
                      <strong class="text-rs-fg">Choose Remitly over WireBarley when:</strong> This is most relevant if WireBarley isn't available in your sending country or the recipient needs a different payout path.
                    </p>
                  </div>

                  <div class="p-6 rounded-xl border-2 border-rs-border bg-surface hover:border-brand-300 motion-safe:transition-colors">
                    <h3 class="text-h4 font-bold text-rs-fg mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      XE Money (8.7)
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      <strong class="text-rs-fg">When it can beat WireBarley:</strong> Use XE Money instead when you want a strong all-rounder and don't want to be constrained by a narrower corridor footprint.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      <strong class="text-rs-fg">Choose XE Money over WireBarley when:</strong> Per your auditor note, it can be competitive and reliable, but often runs "bank-timed," so it's a good choice when breadth and consistency matter more than ultra-fast delivery.
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
                      Who should use WireBarley?
                    </p>
                    <p class="text-neutral-800 mb-0">
                      WireBarley is a good fit if you're using it for what it scores best at: Korea-corridor transfers where WireBarley's fee structure and delivery behavior are competitive, and you're willing to treat the exchange rate (and potential intermediary deductions) as part of the real price.
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-success-50 border-2 border-success-200">
                    <p class="font-semibold text-rs-fg mb-3">
                      Why the 8.2/10 is justified:
                    </p>
                    <p class="text-neutral-800 mb-0">
                      The 8.2/10 is justified because Delivered Value is strong in-core and speed can be good—while the overall ceiling is set by narrower corridor/sending-country footprint compared with global leaders.
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
                  See how WireBarley stacks up for your specific corridor and amount.
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
                      Primary Market
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Korea
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Send From
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      5 Markets
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Receiving Countries
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      40
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Rate Guarantee
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      30 Minutes
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Typical Speed
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Minutes - 2 Days
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
          Ready to See How WireBarley Compares?
        </h2>
        <p
          class="text-body-lg mb-8 text-white/90"
        >
          Enter your transfer details to see real-time rates from WireBarley and 30+ other providers.
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

const providerName = 'WireBarley'
const providerLogoUrl = `${siteUrl}${getProviderLogoPath('wirebarley')}`

defineOgImage({
  component: 'OgImageProvider',
  props: {
    providerName,
    remitScore: score,
    logoUrl: providerLogoUrl,
  },
})

setSeo({
  title: `WireBarley Review ${new Date().getFullYear()} - Remit-Score 8.2/10 | Remit-Scout`,
  description: 'Independent WireBarley review with Remit-Score 8.2/10. Fees, exchange rates, delivery speed, and key pros/cons to compare before you send.',
  canonical: `${siteUrl}/learn/providers/wirebarley`,
  ogImage: false,
})

const { addAggregateRatingSchema, addBreadcrumbSchema } = useStructuredData()

addAggregateRatingSchema({
  name: 'WireBarley',
  ratingValue: score,
  bestRating: 10,
  worstRating: 1,
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: 'WireBarley Review', path: '/learn/providers/wirebarley' },
]

addBreadcrumbSchema(
  breadcrumbItems.map(item => ({
    name: item.name,
    url: item.path === '/' ? `${siteUrl}/` : `${siteUrl}${item.path}`,
  })),
)
</script>
