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
            <div class="flex items-center gap-6 mb-6">
              <div class="flex h-40 w-40 items-center justify-center rounded-2xl bg-surface p-3 shadow-xl">
                <ProviderLogo
                  slug="intermex"
                  alt="Intermex"
                  size="xlarge"
                  class="object-contain max-w-full max-h-full"
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
                  Intermex Review
                </h1>
                <p class="text-h4 text-neutral-300">
                  Independent Remit-Scout Analysis
                </p>
              </div>
            </div>

            <p class="text-body-lg text-white/90 leading-relaxed mb-8">
              A data-driven review based on real transfer outcomes — not paid endorsements. We evaluate what matters most: <strong class="text-white">how much money actually arrives</strong>.
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
                <div class="flex justify-center">
                  <RemitScoreRing :score="score" />
                </div>
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
                    <span class="font-semibold text-black">Strong</span>
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
                <p class="text-body-sm text-neutral-900">
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
              17
            </div>
            <div class="text-body-sm text-neutral-600">
              Countries Served
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              100K+
            </div>
            <div class="text-body-sm text-neutral-600">
              Agent Locations
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-warning-600">
              Mid
            </div>
            <div class="text-body-sm text-neutral-600">
              Fee Structure
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              30+
            </div>
            <div class="text-body-sm text-neutral-600">
              Years Operating
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
              <div class="relative mb-12 p-8 rounded-2xl bg-neutral-50 border-2 border-rs-border shadow-sm">
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
                  Remit-Scout scores providers using a weighted rubric focused on what actually happens to your money: <strong class="text-brand-600 font-bold">Delivered Value (40%)</strong>, then reliability, speed/friction, support/refunds, and trust/safety. For this review, the headline score is 8.0/10.
                </p>
              </div>

              <div class="mb-12">
                <h2 class="text-h2 font-bold text-rs-fg mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-brand-600 rounded-full" />
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-neutral-50 border-2 border-rs-border">
                  <p class="text-body-lg text-neutral-800 leading-relaxed italic m-0">
                    "Strong Latin America cash-pickup network with deep agent penetration; delivered value is good but FX spreads are wider than digital-first competitors; reliability is strong with consistent execution on core corridors; speed is good for cash pickup but bank deposits can be slower; support is adequate for routine transfers; trust signals are good — publicly traded and licensed."
                  </p>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="mb-12">
                <h2 class="text-h2 font-bold text-rs-fg mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-brand-600 rounded-full" />
                  The Bottom Line
                </h2>
                <div class="space-y-4 text-body-lg leading-relaxed text-neutral-700">
                  <p>
                    Intermex earns a <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-warning-100 text-warning-700 font-bold text-body">8.0/10</span> because it fills a specific niche very well: sending money from the US to Latin America with reliable cash pickup. Its agent network across Mexico, Guatemala, Honduras, El Salvador, and the Dominican Republic is one of the deepest in the industry.
                  </p>
                  <p>
                    The tradeoff is that FX spreads tend to be wider than digital-first providers like Wise or Remitly, and the corridor range is narrow. If your recipient needs cash pickup in a Latin American country, Intermex is a serious contender. If you're sending digitally to Asia or Africa, look elsewhere.
                  </p>
                  <div class="mt-6 p-5 rounded-xl bg-neutral-50 border-l-4 border-brand-600">
                    <p class="m-0">
                      <strong class="text-rs-fg">Who should use it:</strong> Senders in the US who need reliable cash pickup for recipients in Mexico and Central America — especially those who value an extensive physical agent network over the lowest possible FX spread.
                    </p>
                  </div>
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
                  Auditor Notes
                </h2>
                <p class="text-body-lg text-neutral-600 mb-6">
                  Here's what our independent evaluation found across each category:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-h3 shadow-md">
                    8.0
                  </div>
                  <div>
                    <h3 class="text-h3 font-bold text-rs-fg mb-1 flex items-center gap-2">
                      Intermex
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
                      <span class="px-2.5 py-1 rounded-full bg-warning-100 text-warning-700 text-body-sm font-bold">Good</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      40% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Competitive for cash pickup corridors; FX spreads are wider than digital-first providers, which reduces the "money that arrives."
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Reliability
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 text-body-sm font-bold">Strong</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      20% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Consistent execution on core Latin American corridors with low failure rates and stable quoting.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Friction & Speed
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-warning-100 text-warning-700 text-body-sm font-bold">Good</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      15% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Cash pickup is often same-day or next-day; bank deposits take longer and the digital experience is more basic than competitors.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Support & Refunds
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-warning-100 text-warning-700 text-body-sm font-bold">Good</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      15% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Adequate for routine transfers; phone-based support is accessible but digital channels are limited.
                    </div>
                  </div>
                  <div class="sm:col-span-2 p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Trust & Safety
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-warning-100 text-warning-700 text-body-sm font-bold">Good</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      10% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Publicly traded on NASDAQ (IMXI), licensed as a money transmitter, and has been operating for over 30 years.
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
                      <div class="font-semibold text-rs-fg mb-1.5">
                        Why 8.0 (not 8.5-9.0):
                      </div>
                      <div class="text-body-sm text-neutral-700 leading-relaxed">
                        FX spreads are wider than digital-first competitors, corridor coverage is narrow (primarily US-to-LatAm), and the digital experience lags behind modern fintech providers.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    1
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Delivered Value (40%)
                  </h2>
                </div>
                <p class="text-body-lg text-neutral-700 leading-relaxed mb-6">
                  Intermex serves a specific market well, but wider FX spreads mean less money arrives compared to digital-first competitors.
                </p>
                <div class="mb-6 p-5 rounded-xl bg-neutral-50 border border-rs-border">
                  <p class="font-semibold text-rs-fg mb-3 text-body">
                    What "Delivered Value" means in our rubric:
                  </p>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">1</span>
                      <span><strong class="text-rs-fg">Effective cost</strong> = fees + FX spread, evaluated from the user's perspective (what leaves your account vs what arrives to the recipient).</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">2</span>
                      <span><strong class="text-rs-fg">How often it's cheapest</strong> across common user scenarios (corridor + funding method + payout method).</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">3</span>
                      <span><strong class="text-rs-fg">Quote vs delivered accuracy</strong> (how closely the quoted outcome matches what is actually delivered).</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-warning-50 border-2 border-warning-500">
                  <p class="text-neutral-800 leading-relaxed mb-0">
                    <strong class="text-rs-fg">Why Intermex rates "Good" here:</strong> Intermex is competitive when you specifically need cash pickup in Latin America — the convenience of over 100,000 agent locations offsets some of the FX cost. However, when compared head-to-head on "money that arrives," digital-first providers like Wise or Remitly typically deliver more to the recipient because their spreads are tighter.
                  </p>
                </div>
              </div>

              <div class="not-prose my-6 p-4 bg-warning-50 rounded-lg border-l-4 border-warning-600 text-warning-800">
                <p class="text-body-sm text-warning-800 m-0">
                  <strong>Why this isn't higher on value:</strong> FX spreads are consistently wider than digital-first competitors. If you're optimizing purely for "most money arrives," Intermex usually isn't the cheapest choice — but the cash pickup convenience factor can make the total cost-of-delivery worthwhile for recipients without bank accounts.
                </p>
              </div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    2
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Reliability & Success (20%)
                  </h2>
                </div>
                <div class="space-y-4 text-body-lg leading-relaxed text-neutral-700">
                  <p>
                    Reliability is about whether the transfer behaves the way the quote implies — consistently.
                  </p>
                  <p>
                    Intermex is "Strong" here because it has been running the same core corridors for over 30 years. The US-to-Mexico and US-to-Central America pipelines are battle-tested, with stable quoting and low "surprise delta" on cash pickup transactions. When Intermex quotes a pickup amount in pesos, recipients typically collect that exact amount.
                  </p>
                  <div class="mt-5 p-4 rounded-lg bg-primary-50 border-l-4 border-primary-500">
                    <p class="m-0 text-neutral-800">
                      <strong class="text-rs-fg">What this means for consumers:</strong> If you're sending to Mexico or Central America via cash pickup, you can budget around the quoted amount with confidence. The agent network is deep enough that "pickup unavailable" events are rare.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    3
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Friction & Speed (15%)
                  </h2>
                </div>
                <div class="space-y-4 text-body-lg leading-relaxed text-neutral-700">
                  <p>
                    Speed is not just "how fast in theory," but how often real transfers land quickly given the rails involved.
                  </p>
                  <p>
                    Intermex is "Good" on friction & speed: cash pickup transfers are typically available same-day or next-day, which is where Intermex shines. However, the digital experience — the app and website — is more basic than modern fintech competitors, adding friction to the send side.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-brand-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Practical speed buckets (behavioral, not promises):
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
                        <span>Cash pickup: often available within minutes to same-day in major corridors</span>
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span>Bank deposit: typically 1-3 business days depending on the receiving bank</span>
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span>Send-side friction: the app/website UX is functional but not as polished as Remitly or Wise</span>
                      </li>
                    </ul>
                  </div>
                  <p class="mt-4">
                    The cash pickup speed is Intermex's real advantage. Recipients can walk into an agent location and collect money quickly. The tradeoff is that the digital sending experience feels a generation behind the fintech leaders.
                  </p>
                </div>
              </div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    4
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Support & Refunds (15%)
                  </h2>
                </div>
                <div class="space-y-4 text-body-lg leading-relaxed text-neutral-700">
                  <p>
                    Support quality shows up when something goes wrong: cancellations, chargebacks, mistaken details, compliance checks, or recipient issues.
                  </p>
                  <p>
                    Intermex is rated "Good" here. Phone support is accessible and bilingual (English/Spanish), which matters for its core user base. However, digital support channels (chat, email) are limited compared to competitors, and resolution times for complex disputes can be longer.
                  </p>
                  <div class="mt-5 p-4 rounded-lg bg-warning-50 border-l-4 border-warning-600">
                    <p class="m-0 text-neutral-800">
                      <strong class="text-rs-fg">What to expect:</strong> For straightforward transfers and routine issues, support works fine. For complex disputes or refund escalations, expect a more traditional, phone-centric process that may require patience.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    5
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Trust & Safety (10%)
                  </h2>
                </div>
                <div class="space-y-4 text-body-lg leading-relaxed text-neutral-700">
                  <p>
                    We keep this category narrow and careful: it's about public checks and risk posture signals, not blanket claims.
                  </p>
                  <p>
                    Intermex is "Good" here. It's publicly traded on NASDAQ under ticker IMXI, which provides a layer of transparency through SEC filings and audited financials. The company holds money transmitter licenses across US states where required and has been operating since 1994 — longevity in this industry is itself a trust signal.
                  </p>
                </div>
              </div>
              <div class="not-prose my-6 p-4 bg-warning-50 rounded-lg border-l-4 border-warning-600 text-warning-800">
                <p class="text-body-sm text-warning-800 m-0">
                  <strong>Important caveat:</strong> Licensing, permitted activities, and coverage can differ by country and product. Treat this as a "do the basics check out?" signal — not a guarantee for every use case.
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
                      Deep cash pickup agent network across Latin America
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      30+ years of operation — battle-tested corridors
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      Publicly traded (NASDAQ: IMXI) with audited financials
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      Bilingual support (English/Spanish)
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      Fast cash pickup — often same-day availability
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
                      Wider FX spreads than digital-first competitors
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-800 font-bold">−</span>
                      Narrow corridor coverage (primarily US-to-LatAm)
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-800 font-bold">−</span>
                      App and website UX lag behind modern fintech
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-800 font-bold">−</span>
                      Limited digital support channels
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-800 font-bold">−</span>
                      Bank deposit delivery is slower than competitors
                    </li>
                  </ul>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="grid md:grid-cols-2 gap-8 mb-12">
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
><path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M5 13l4 4L19 7"
/></svg>
                      <span>US-based senders who need cash pickup in Mexico, Guatemala, Honduras, El Salvador, or the Dominican Republic.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg
class="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
><path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M5 13l4 4L19 7"
/></svg>
                      <span>Recipients without bank accounts who rely on physical agent locations to collect money.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg
class="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
><path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M5 13l4 4L19 7"
/></svg>
                      <span>Senders who value an established, publicly traded company with decades of track record.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg
class="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
><path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M5 13l4 4L19 7"
/></svg>
                      <span>Spanish-speaking senders who prefer bilingual phone support.</span>
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
><path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M6 18L18 6M6 6l12 12"
/></svg>
                      <span>Anyone sending to Asia, Africa, Europe, or outside Latin America — corridor coverage is narrow.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg
class="w-5 h-5 text-warning-800 mt-0.5 flex-shrink-0"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
><path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M6 18L18 6M6 6l12 12"
/></svg>
                      <span>Cost-optimizers who want the absolute tightest FX spreads — digital-first providers usually win on raw delivered value.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg
class="w-5 h-5 text-warning-800 mt-0.5 flex-shrink-0"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
><path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M6 18L18 6M6 6l12 12"
/></svg>
                      <span>Users who expect a modern, app-first experience with real-time chat support.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg
class="w-5 h-5 text-warning-800 mt-0.5 flex-shrink-0"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
><path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M6 18L18 6M6 6l12 12"
/></svg>
                      <span>Senders who prefer bank-to-bank transfers — Intermex's strength is cash pickup, not digital delivery.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="mb-10">
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
                  How to Get the Best Rate with Intermex
                </h2>
                <p class="text-body-lg text-neutral-600 mb-6">
                  Use this checklist to maximize delivered value without guessing:
                </p>
                <div class="space-y-3">
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      1
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">Compare against digital alternatives first:</strong>
                      <span class="text-neutral-700">Check Wise or Remitly for the same corridor — the FX spread difference can be significant.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      2
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">Confirm recipient's pickup location:</strong>
                      <span class="text-neutral-700">Verify the nearest agent location in the recipient's area before sending — availability varies by region.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      3
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">Check the total cost, not just the fee:</strong>
                      <span class="text-neutral-700">Intermex may advertise low fees, but the FX markup is where the real cost lives. Always compare "money that arrives."</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      4
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">Consider the recipient's banking situation:</strong>
                      <span class="text-neutral-700">If they don't have a bank account, Intermex's cash pickup network is a genuine advantage over bank-only providers.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-brand-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-body shadow-md">
                      5
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">Send during business hours when possible:</strong>
                      <span class="text-neutral-700">Cash pickup availability and agent hours vary — sending during business hours improves the recipient's collection experience.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="mb-10">
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
                  Two Alternatives (and When They Can Beat Intermex)
                </h2>
                <p class="text-body-lg text-neutral-600 mb-8">
                  Intermex is strong on Latin American cash pickup, but these alternatives can beat it on cost or coverage:
                </p>

                <div class="space-y-6">
                  <div class="p-6 rounded-xl border-2 border-rs-border bg-surface hover:border-brand-300 motion-safe:transition-colors">
                    <h3 class="text-h4 font-bold text-rs-fg mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      Remitly
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      <strong class="text-rs-fg">When it can beat Intermex:</strong> On most Latin American corridors, Remitly typically delivers more money to the recipient thanks to tighter FX spreads. It also offers cash pickup in many of the same countries plus a much broader global network.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      <strong class="text-rs-fg">Tradeoff to watch:</strong> Remitly's agent network in rural Central American areas may be thinner than Intermex's deeply established local partnerships.
                    </p>
                  </div>

                  <div class="p-6 rounded-xl border-2 border-rs-border bg-surface hover:border-brand-300 motion-safe:transition-colors">
                    <h3 class="text-h4 font-bold text-rs-fg mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      Wise
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      <strong class="text-rs-fg">When it can beat Intermex:</strong> If the recipient has a bank account, Wise almost always delivers more money thanks to transparent fees and tight spreads. The digital experience is significantly better.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      <strong class="text-rs-fg">Tradeoff to watch:</strong> Wise doesn't offer cash pickup at all — so if the recipient needs physical cash, it's not an option.
                    </p>
                  </div>
                </div>

                <p class="mt-6 text-body-sm text-rs-muted italic p-4 rounded-lg bg-neutral-50 border border-rs-border">
                  (We frame alternatives this way because the audit explicitly calls out that Intermex's strength is its agent network, not its FX pricing — so the best alternatives are the ones that beat it on cost when cash pickup isn't essential.)
                </p>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="mb-10">
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
                  Final Verdict
                </h2>
                <div class="space-y-5 text-body-lg leading-relaxed text-neutral-700">
                  <p>
                    Intermex earns its <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-warning-100 text-warning-700 font-bold text-body">8.0/10 Remit-Score</span> by doing one thing very well: getting cash into recipients' hands across Latin America through a deep, established agent network. For senders in the US who need reliable cash pickup in Mexico or Central America, it's a proven choice backed by 30+ years of operation and a public listing.
                  </p>
                  <p>
                    It's not the cheapest — wider FX spreads mean less money arrives compared to digital-first providers. The app is functional but dated, corridor coverage is narrow, and digital support is limited. But for its core use case — US-to-LatAm cash pickup — Intermex is a solid, reliable option that fills a real gap in the market.
                  </p>
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
                  See how Intermex stacks up for your specific corridor and amount.
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
                      Founded
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      1994
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Headquarters
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Miami, FL
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Stock Ticker
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      NASDAQ: IMXI
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Countries
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      17
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Agent Locations
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      100K+
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Specialty
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      LatAm Cash Pickup
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
    <section class="py-16 bg-brand-600">
      <div class="mx-auto max-w-4xl px-page-x text-center">
        <h2 class="text-h2 font-bold mb-4 text-white">
          Ready to See How Intermex Compares?
        </h2>
        <p class="text-body-lg mb-8 text-white/90">
          Enter your transfer details to see real-time rates from Intermex and 30+ other providers.
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

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: 'Intermex Review', path: '/learn/providers/intermex' },
]

const score = 8.0

const providerName = 'Intermex'
const providerLogoUrl = `${siteUrl}${getProviderLogoPath('intermex')}`

defineOgImage({
  component: 'OgImageProvider',
  props: {
    providerName,
    remitScore: score,
    logoUrl: providerLogoUrl,
  },
})

setSeo({
  title: `Intermex Review ${new Date().getFullYear()} — Remit-Score 8.0/10 | Remit-Scout`,
  description: 'Independent Intermex review with Remit-Score 8.0/10. Detailed breakdown of fees, speed, reliability, and delivered value for US-to-Latin America cash pickup transfers.',
  canonical: `${siteUrl}/learn/providers/intermex`,
  ogImage: false,
})

const { addAggregateRatingSchema, addBreadcrumbSchema } = useStructuredData()

addAggregateRatingSchema({
  name: 'Intermex',
  ratingValue: score,
  bestRating: 10,
  worstRating: 1,
})

addBreadcrumbSchema(
  breadcrumbItems.map(item => ({
    name: item.name,
    url: item.path === '/' ? `${siteUrl}/` : `${siteUrl}${item.path}`,
  })),
)
</script>
