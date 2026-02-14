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
          <span class="font-medium text-white">Boss Money Review</span>
        </nav>

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-6 mb-6">
              <!-- Large white box with Remit-Scout blue border for logo -->
              <div class="w-40 h-40 flex items-center justify-center bg-surface rounded-2xl border-4 border-brand-600 p-6 flex-shrink-0 shadow-2xl">
                <ProviderLogo
                  slug="boss-money"
                  alt="Boss Money"
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
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.922-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Provider Review
                </div>
                <h1 class="text-h1 font-bold text-white mb-2">
                  Boss Money Review
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
                to="/send-money?provider=boss-money"
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
                Compare Boss Money Now
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
                <div class="flex justify-center">
                  <RemitScoreRing :score="score" />
                </div>
              </div>

              <!-- Quick Rating Bars -->
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between text-body-sm mb-2">
                    <span class="text-black">Delivered Value</span>
                    <span class="font-semibold text-black">Strong</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full" />
                </div>
                <div>
                  <div class="flex justify-between text-body-sm mb-2">
                    <span class="text-black">Reliability</span>
                    <span class="font-semibold text-black">Elite</span>
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
                    <span class="font-semibold text-black">Elite</span>
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
              $10-$5,000
            </div>
            <div class="text-body-sm text-neutral-600">
              Transfer Limits
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              50+
            </div>
            <div class="text-body-sm text-neutral-600">
              Countries Supported
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-success-600">
              Fast
            </div>
            <div class="text-body-sm text-neutral-600">
              Cash Pickup Speed
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              Licensed
            </div>
            <div class="text-body-sm text-neutral-600">
              NMLS #935577
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
              <div class="relative mb-20 p-8 rounded-2xl bg-gradient-to-br from-neutral-50 via-primary-50/30 to-neutral-50 border-2 border-rs-border shadow-sm">
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
                  Remit-Scout scores providers using a weighted rubric focused on what actually happens to your money: <strong class="text-brand-600 font-bold">Delivered Value (40%)</strong>, then reliability, speed/friction, support/refunds, and trust/safety. For this review, the headline score is 8.8/10.
                </p>
              </div>

              <div class="mb-12">
                <h2 class="text-h2 font-bold text-rs-fg mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-gradient-to-b from-brand-600 to-brand-700 rounded-full" />
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-gradient-to-br from-neutral-50 to-primary-50 border-2 border-rs-border">
                  <p class="text-body-lg text-neutral-800 leading-relaxed italic m-0">
                    "Good mainstream remitter score; strong trust & compliance; transparent about FX spread; good payout flexibility; FX markup and credit card fee risks affect delivered value."
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
                  Here's how Boss Money performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-primary-50/50 to-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-h3 shadow-md">
                    8.8
                  </div>
                  <div>
                    <h3 class="text-h3 font-bold text-rs-fg mb-1 flex items-center gap-2">
                      Boss Money
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
                      <span class="px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 text-body-sm font-bold">Strong</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      40% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Fees can start at $1.99 with frequent $0 fee promos, but FX markup is real and disclosed. "Low fee" doesn't always mean "cheapest overall" — compare recipient gets.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Reliability
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-success-100 text-success-800 text-body-sm font-bold">Elite</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      20% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Licensed money transmitter (NMLS referenced), good payout flexibility, transparent about costs. Standard compliance checks may affect predictability.
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
                      Many payout rails: cash pickup (often within minutes), bank deposit, mobile wallet, home delivery, direct-to-debit. Availability varies by location.
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
                      Contact info and support entry points available. Tracking + notifications emphasized. Refund rules are generally fair but timing matters.
                    </div>
                  </div>
                  <div class="sm:col-span-2 p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Trust & Safety
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-success-100 text-success-800 text-body-sm font-bold">Elite</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      10% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      Licensed money transmitter with NMLS #935577. Publishes state complaint/disclosure info. Operating entities clearly disclosed (IDT Payment Services, including NY entity).
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
                      <div class="font-semibold text-rs-fg mb-1.5">
                        Why 8.8 (not 9.0-10):
                      </div>
                      <div class="text-body-sm text-neutral-700 leading-relaxed">
                        FX spread disclosure is good, but it's still a cost risk. Credit card funding may incur extra fees. Limit variability ($2,999 vs $5,000) affects predictability. Unclaimed cash pickup admin charges can add up.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    1
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Delivered Value (40%)
                  </h2>
                </div>
                <p class="text-body-lg text-neutral-700 leading-relaxed mb-6">
                  Delivered Value is primarily about effective cost: fees + FX spread, not marketing claims. The practical question is: How much of what you pay actually arrives — and how predictable is that outcome?
                </p>
                <div class="mb-6 p-5 rounded-xl bg-neutral-50 border border-rs-border">
                  <p class="font-semibold text-rs-fg mb-3 text-body">
                    Effective cost: fees + FX spread (the part most people miss)
                  </p>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">1</span>
                      <span><strong class="text-rs-fg">Upfront fees</strong> (advertised starting ~$1.99, with frequent $0 fee promos)</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">2</span>
                      <span><strong class="text-rs-fg">FX spread</strong> (explicitly disclosed — they may make money on the exchange rate)</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-primary-50 to-neutral-50 border-2 border-primary-200 mb-6">
                  <p class="text-neutral-800 leading-relaxed mb-4">
                    <strong class="text-rs-fg">What we can say from the audit notes:</strong> Boss Money explicitly states that fees vary and are shown before submission. The provider explicitly discloses that it may make money on the exchange rate (FX spread). However, FX spread means "low fee" doesn't always mean "cheapest overall" — senders should compare final amounts received across providers.
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-4">
                    <strong class="text-rs-fg">Cost considerations:</strong> Boss Money advertises fees starting at approximately $1.99 and frequently runs $0 fee promotions, which can provide great value when eligible. However, FX markup is present (though disclosed), which is often the biggest hidden cost in remittances. Unclaimed cash pickup transfers can incur fees: terms state that transfers not picked up within 90 days may incur a $2.50 per month administration charge (up to legal maximum).
                  </p>
                </div>

                <div class="p-6 rounded-xl border-2 border-warning-600">
                  <p class="font-semibold text-rs-fg mb-3">
                    Key cost considerations:
                  </p>
                  <ul class="space-y-2 text-neutral-700">
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
                      <span><strong>Credit card funding:</strong> Boss Money warns that paying with a credit card may incur additional fees from the card issuer (often cash advance coding). Debit cards are generally safer for remittance transactions.</span>
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
                      <span><strong>Unclaimed transfers:</strong> Transfers not picked up within 90 days may incur a $2.50 per month administration charge. Senders should treat 30 days as the practical deadline for cash pickup to avoid fees.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="not-prose my-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p class="text-body-sm text-primary-800 m-0">
                  <strong>Quote vs delivered accuracy:</strong> Fees and FX rates are shown before submission, which provides good transparency. However, rates can vary by corridor, funding method, and payout method — senders should capture a screenshot of the review screen for records.
                </p>
              </div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
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
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-success-50 to-success-600 border-2 border-success-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Trust & compliance score: 18/20
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>They present themselves as a licensed money transmitter (with NMLS referenced) and disclose the operating entities (IDT Payment Services, incl. NY entity).</span>
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>They publish state complaint/disclosure info (a good "trust signal" for a regulated transmitter).</span>
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
                        <span>Deduction: Standard "we can request docs / reject transactions" language (normal, but it affects predictability).</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Limits & flexibility score: 7/10
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Minimum $10 is clear. Max limits are a bit inconsistent across docs:
                    </p>
                    <ul class="space-y-2 text-neutral-700">
                      <li>• Terms (Mar 2023) mention app/website max up to $2,999 depending on destination/payer.</li>
                      <li>• Their current FAQ page claims up to $5,000 per transaction.</li>
                    </ul>
                    <p class="text-neutral-700 mt-3 mb-0">
                      That's not a red flag by itself (limits change by corridor + time), but it's a predictability knock for big sends.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
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
                      Delivery options & recipient access score: 13/15
                    </p>
                    <p class="text-neutral-700 mb-3">
                      <strong class="text-rs-fg">Big plus:</strong> they advertise a lot of payout rails:
                    </p>
                    <div class="flex flex-wrap gap-2 mb-3">
                      <span class="px-3 py-1 rounded-full bg-surface border border-rs-border text-body-sm text-neutral-700">Cash pickup</span>
                      <span class="px-3 py-1 rounded-full bg-surface border border-rs-border text-body-sm text-neutral-700">Bank deposit</span>
                      <span class="px-3 py-1 rounded-full bg-surface border border-rs-border text-body-sm text-neutral-700">Mobile wallet</span>
                      <span class="px-3 py-1 rounded-full bg-surface border border-rs-border text-body-sm text-neutral-700">Home delivery</span>
                      <span class="px-3 py-1 rounded-full bg-surface border border-rs-border text-body-sm text-neutral-700">Direct-to-debit</span>
                      <span class="px-3 py-1 rounded-full bg-surface border border-rs-border text-body-sm text-neutral-700">Boss Money Wallet</span>
                    </div>
                    <p class="text-neutral-700 mb-0">
                      <strong class="text-warning-600">Deduction:</strong> it's still corridor-dependent; "available" ≠ "available everywhere."
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Cash pickup timing expectations
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Boss Money states that funds can be available within a few minutes, and generally within approximately 30 minutes, though holidays, banking hours, and agent operating hours can affect delivery times.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      For bank deposits, "Paid" can mean the destination bank acknowledged receipt, not that the funds are already available — some banks take minutes, others take several business days.
                    </p>
                  </div>
                </div>
              </div>

              <div class="not-prose my-6 p-4 bg-warning-600 rounded-lg border border-warning-600">
                <p class="text-body-sm text-warning-600 m-0">
                  <strong>Name mismatch considerations:</strong> Cash pickup and bank deposits require exact name match with recipient ID or bank records. Recipient name can be edited only if the transfer hasn't been processed yet — otherwise, cancellation and resending a new transfer is required.
                </p>
              </div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
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
                      Support & UX signals score: 6/10
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
                        <span>They push tracking + notifications and show large app rating counts on-site.</span>
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
                        <span>They provide contact info and support entry points: moneyapp@idt.net and +1 (716) 281-2677.</span>
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
                        <span>Deduction: App ratings are useful indicators but are not weighted heavily in the support assessment, as they differ from actual dispute resolution outcomes.</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Refunds and cancellations: the practical rules
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
                        <span>Senders may cancel for a full refund of principal and fees if the funds have <strong>not</strong> been picked up, delivered, or deposited by the time IDT receives the cancellation request.</span>
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
                        <span>Refund requests must be made within 180 days. A transaction that stays unpaid after 30 days may be automatically canceled and refunded.</span>
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
                        <span>After confirming funds weren't paid out, eligible refunds are typically made within 3–7 business days after approval/confirmation.</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-4 rounded-lg bg-neutral-50 border-l-4 border-neutral-400">
                    <p class="m-0 text-neutral-800">
                      <strong class="text-rs-fg">Net:</strong> The refund rules are generally fair, but timing matters. For cash pickup, treat 30 days as the "don't wait" threshold — policies and fees kick in after that.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    5
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Trust & Safety (10%)
                  </h2>
                </div>
                <div class="space-y-4 text-body-lg leading-relaxed text-neutral-700">
                  <p>
                    This section is intentionally cautious: we reference public licensing/regulatory checks where available, without implying coverage in every jurisdiction.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-success-50 to-success-600 border-2 border-success-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Public regulatory signals (where available)
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
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        <span><strong class="text-rs-fg">U.S.:</strong> Licensed money transmitter with NMLS #935577. Operating entities: IDT Payment Services, Inc. and IDT Payment Services of New York LLC.</span>
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
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        <span><strong class="text-rs-fg">State availability:</strong> Money transmitter licenses in every U.S. state except Oklahoma, South Dakota, and Vermont.</span>
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
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        <span><strong class="text-rs-fg">Disclosure:</strong> They publish state complaint/disclosure info (a good "trust signal" for a regulated transmitter).</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="not-prose my-6 p-4 bg-warning-600 rounded-lg border border-warning-600">
                <p class="text-body-sm text-warning-600 m-0">
                  <strong>Important caveat:</strong> Licensing, permitted activities, and coverage can differ by country and product. Senders can typically verify the provider's regulatory presence in their sending country via official registries — but the exact legal entity and permissions vary by region.
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
                      Licensed and regulated (NMLS #935577) with clear operating entity disclosure
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      Good payout flexibility (cash pickup, bank, mobile wallet, home delivery, direct-to-debit)
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      Transparent about fees and FX spread disclosure
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      Frequent $0 fee promos can provide great value when eligible
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      Fast cash pickup (often within minutes to 30 minutes)
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
                      FX markup can be a significant hidden cost despite disclosure
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-600 font-bold">−</span>
                      Credit card funding may incur additional fees (cash-advance coding)
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-600 font-bold">−</span>
                      Limit variability ($2,999 vs $5,000) affects predictability
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-600 font-bold">−</span>
                      Unclaimed cash pickup admin charges ($2.50/month after 90 days)
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-600 font-bold">−</span>
                      Payout options vary by corridor (not available everywhere)
                    </li>
                  </ul>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="grid md:grid-cols-2 gap-8 mb-12">
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
                      <span>Cash pickup / mobile wallet recipients without bank access</span>
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
                      <span>Senders who want payout flexibility (when available in their corridor)</span>
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
                      <span>Those taking advantage of $0 fee promos when eligible</span>
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
                      <span>Senders optimizing purely for lowest FX spread (despite transparency)</span>
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
                      <span>Those planning to fund with credit cards (additional fees risk)</span>
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
                      <span>Big sends near the limit threshold (inconsistency between docs)</span>
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
                  How to Get the Best Rate with Boss Money
                </h2>
                <p class="text-body-lg text-neutral-600 mb-6">
                  Use this checklist as a quick "don't overpay" routine:
                </p>
                <div class="space-y-3">
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      1
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">Use debit card funding instead of credit:</strong>
                      <span class="text-neutral-700">Boss Money warns that credit card payments may incur additional fees from card issuers (often cash advance coding). Debit cards are generally safer for remittance transactions.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      2
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">For cash pickup: ensure collection within 30 days:</strong>
                      <span class="text-neutral-700">Terms allow cancellation for a full refund if funds haven't been picked up, delivered, or deposited. Unpaid transfers after 30 days may be automatically canceled and refunded. However, the 90-day administration charge policy means transfers should not remain uncollected.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      3
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">Compare the FX rate and final recipient amount:</strong>
                      <span class="text-neutral-700">Fees may be low or zero during promotions, but FX markup can significantly affect the final amount received. Always compare the total delivered amount across providers.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      4
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">Verify payout method availability for your corridor:</strong>
                      <span class="text-neutral-700">Payout options vary by destination. Verify that the recipient's preferred method (cash pickup, bank deposit, mobile wallet, etc.) is available before sending.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      5
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">Screenshot the review screen before confirming:</strong>
                      <span class="text-neutral-700">Capture fees, exchange rates, payout method, and recipient details for your records before completing the transfer.</span>
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
                  Bottom Line
                </h2>
                <div class="space-y-5 text-body-lg leading-relaxed text-neutral-700">
                  <div class="p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3">
                      Who should use Boss Money?
                    </p>
                    <p class="text-neutral-800 mb-0">
                      Boss Money is best suited for senders who need cash pickup, mobile wallet delivery, or recipients without bank access, especially when promotional offers apply. The service is a good fit for those who value payout flexibility and appreciate FX spread transparency. Optimal when using debit card funding (rather than credit) and when recipients can collect cash pickup within 30 days.
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-gradient-to-br from-success-600 to-success-50 border-2 border-success-600">
                    <p class="font-semibold text-rs-fg mb-3">
                      Why the 8.8/10 is justified:
                    </p>
                    <p class="text-neutral-800 mb-0">
                      The score aligns with the rubric weighting: Trust & Safety (10%) is elite with clear licensing and disclosure. Reliability (20%) is elite with good payout flexibility and transparency. Delivered Value (40%) is strong but FX markup and credit card fee surprises are real costs. Friction & Speed (15%) is strong with many payout options, though availability varies. Support & Refunds (15%) is good with fair rules but timing dependencies.
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
                  See how Boss Money stacks up for your specific corridor and amount.
                </p>
                <NuxtLink
                  to="/send-money"
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
                      Provider
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      IDT Payment Services
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      NMLS
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      #935577
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Transfer Limits
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      $10 - $5,000
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Minimum
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      $10
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Payout Methods
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      6+ options
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Support
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Email & Phone
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
                      to="/learn/providers/worldremit"
                      class="flex items-center gap-3 text-body-sm text-neutral-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center text-body-sm font-bold text-accent-600">W</div>
                      <span>WorldRemit Review</span>
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
          Ready to See How Boss Money Compares?
        </h2>
        <p
          class="text-body-lg mb-8"
          style="color: rgba(255, 255, 255, 1);"
        >
          Enter your transfer details to see real-time rates from Boss Money and 30+ other providers.
        </p>
        <NuxtLink
          to="/send-money"
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
import ProviderLogo from '~/components/shared/ProviderLogo.vue'
import { setSeo } from '~/composables/useSeo'
import { useStructuredData } from '~/composables/useStructuredData'
import { getProviderLogoPath } from '~/composables/useProviderLogo'

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://remit-scout.com'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: 'Boss Money Review', path: '/learn/providers/boss-money' },
]

const score = 8.8

const providerName = 'Boss Money'
const providerLogoUrl = `${siteUrl}${getProviderLogoPath('boss-money')}`

defineOgImage({
  component: 'OgImageProvider',
  props: {
    providerName,
    remitScore: score,
    logoUrl: providerLogoUrl,
  },
})

setSeo({
  title: `Boss Money Review ${new Date().getFullYear()} - Remit-Score 8.8/10 | Remit-Scout`,
  description: 'Independent Boss Money review with Remit-Score 8.8/10. Fees, exchange rates, delivery speed, and key pros/cons to compare before you send.',
  canonical: `${siteUrl}/learn/providers/boss-money`,
  ogImage: false,
})

const { addAggregateRatingSchema, addBreadcrumbSchema } = useStructuredData()

addAggregateRatingSchema({
  name: 'Boss Money',
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
