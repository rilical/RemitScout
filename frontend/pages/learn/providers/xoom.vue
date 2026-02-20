<template>
  <div class="min-h-screen bg-surface">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative bg-neutral-900 py-16 lg:py-24 overflow-hidden">
      <div class="mx-auto max-w-page px-page-x relative">
        <nav class="mb-8 flex items-center space-x-2 text-body-sm text-white/70 relative z-10">
          <NuxtLink
            to="/"
            class="hover:text-white motion-safe:transition-colors cursor-pointer underline-offset-2 hover:underline relative z-10"
          >Home</NuxtLink>
          <span class="text-white/50">›</span>
          <NuxtLink
            to="/learn"
            class="hover:text-white motion-safe:transition-colors cursor-pointer underline-offset-2 hover:underline relative z-10"
          >Learn</NuxtLink>
          <span class="text-white/50">›</span>
          <NuxtLink
            to="/learn/providers"
            class="hover:text-white motion-safe:transition-colors cursor-pointer underline-offset-2 hover:underline relative z-10"
          >Providers</NuxtLink>
          <span class="text-white/50">›</span>
          <span class="font-medium text-white">Xoom Review</span>
        </nav>

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-4 mb-6">
              <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface p-3 shadow-xl">
                <ProviderLogo
                  slug="xoom"
                  alt="Xoom"
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
                  Xoom Review
                </h1>
                <p class="text-h4 text-neutral-300">
                  Independent Remit-Scout Analysis
                </p>
                <p class="text-body-sm text-neutral-400 mt-1">
                  (a PayPal service)
                </p>
              </div>
            </div>

            <p class="text-body-lg text-white/90 leading-relaxed mb-8">
              A data-driven review based on real transfer outcomes - not paid endorsements. We evaluate what matters most: <strong class="text-white">how much money actually arrives</strong>.
            </p>

            <div class="flex flex-wrap gap-4">
              <NuxtLink
                to="/send-money?provider=xoom"
                class="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-body font-semibold shadow-lg motion-safe:transition-all"
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
                Compare Xoom Now
              </NuxtLink>
              <a
                href="#review"
                class="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-body font-semibold text-white motion-safe:transition-all"
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
                    <span class="font-semibold text-black">Strong</span>
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
                    <span class="font-semibold text-black">Strong</span>
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
              PayPal
            </div>
            <div class="text-body-sm text-neutral-600">
              Ecosystem
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-success-600">
              Minutes
            </div>
            <div class="text-body-sm text-neutral-600">
              Fast Delivery
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              Multiple
            </div>
            <div class="text-body-sm text-neutral-600">
              Payout Options
            </div>
          </div>
          <div class="text-center">
            <div class="text-h2 font-bold text-rs-fg">
              Reliable
            </div>
            <div class="text-body-sm text-neutral-600">
              Execution
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
              <div class="relative mb-12 p-8 rounded-2xl bg-gradient-to-br from-neutral-50 via-primary-50/30 to-neutral-50 border-2 border-rs-border shadow-sm">
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
                  This is a data-first, non-sponsored score explanation using Remit-Scout's weighted rubric. Because Delivered Value is 40%, the 8.5/10 starts with what you really pay: fees + FX spread, and how closely the quoted outcome matches what gets delivered.
                </p>
              </div>

              <div class="mb-12">
                <h2 class="text-h2 font-bold text-rs-fg mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-gradient-to-b from-brand-600 to-brand-700 rounded-full" />
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-gradient-to-br from-neutral-50 to-primary-50 border-2 border-rs-border">
                  <p class="text-body-lg text-neutral-800 leading-relaxed italic m-0">
                    "Xoom (8.5): Convenience + PayPal ecosystem; reliable; strong payout options; delivered value can be weaker due to fees/spread."
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
                  Here's how Xoom performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-primary-50/50 to-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-h3 shadow-md">
                    8.5
                  </div>
                  <div>
                    <h3 class="text-h3 font-bold text-rs-fg mb-1 flex items-center gap-2">
                      Xoom
                    </h3>
                    <p class="text-body-sm text-black">
                      Remit-Score
                    </p>
                    <p class="text-body-sm text-rs-muted mt-1">
                      (a PayPal service)
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
                      Can be weaker due to fees/spread. Xoom charges transaction fees and earns via currency conversion. Often not the cheapest when comparing "recipient gets".
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
                      Clear delivery expectations. Funds delivered by date on receipt, often within minutes. Explicit about factors that can cause delays.
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
                      Multiple payout rails with fast "minutes" behavior in many cases. Strong payout options: bank, debit card, mobile wallet, cash pickup, home delivery.
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
                      Refund/cancellation is time-sensitive (30-minute window for full refund; after that, refunds are limited). Becomes hard once funds are picked up/deposited.
                    </div>
                  </div>
                  <div class="sm:col-span-2 p-4 rounded-xl bg-surface/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-rs-fg text-body-sm">
                        Trust & Safety
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 text-body-sm font-bold">Strong</span>
                    </div>
                    <div class="text-body-sm text-rs-muted mb-2">
                      10% weight
                    </div>
                    <div class="text-body-sm text-neutral-700 leading-relaxed">
                      U.S. money transmission by PayPal, Inc. (NMLS ID). UK/EEA regulatory context published. Strong institutional trust signals via PayPal-linked licensing.
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
                        Why 8.5 (not 9.0+):
                      </div>
                      <div class="text-body-sm text-neutral-700 leading-relaxed">
                        Delivered Value (40%) is held back because Xoom discloses both transaction fees and that it earns money on currency conversion, which means effective cost can be higher than more rate-focused alternatives.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="my-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    1
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Delivered Value (40%)
                  </h2>
                </div>
                <p class="text-body-lg text-neutral-700 leading-relaxed mb-6">
                  Effective cost: fees + FX spread
                </p>
                <div class="mb-6 p-5 rounded-xl bg-neutral-50 border border-rs-border">
                  <p class="font-semibold text-rs-fg mb-3 text-body">
                    Xoom is unusually direct about the two main cost components:
                  </p>
                  <ul class="space-y-3 text-neutral-700">
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">1</span>
                      <span><strong class="text-rs-fg">Transaction fees:</strong> it charges transaction fees (which vary by country, feature, limits, and other factors).</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-body-sm font-bold mt-0.5">2</span>
                      <span><strong class="text-rs-fg">FX spread / currency conversion margin:</strong> Xoom states that, in addition to transaction fees, it earns money when converting your send currency into a different currency.</span>
                    </li>
                  </ul>
                  <p class="text-neutral-700 mt-4 mb-0">
                    That's the core reason the score isn't higher: delivered value can be weaker when compared to providers that push tighter FX rates and lower overall effective cost.
                  </p>
                </div>

                <div class="p-6 rounded-xl border-2 border-success-600">
                  <p class="font-semibold text-rs-fg mb-3">
                    "How often is it the cheapest?"
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-4">
                    We don't publish "Xoom wins X%" type stats here (none were provided in your auditor notes). The most accurate framing is:
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
                      <span>Xoom can be a rational choice when its payout convenience (cash pickup/home delivery/debit card deposit) saves time and hassle.</span>
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
                      <span>But if your top priority is lowest all-in price, Xoom is often not the first place you'd expect to win because it has both fees and spread in the mix.</span>
                    </li>
                  </ul>
                </div>

                <div class="mt-6 p-5 rounded-xl bg-gradient-to-br from-primary-50 to-neutral-50 border-2 border-primary-200">
                  <p class="font-semibold text-rs-fg mb-3 text-body">
                    Quote vs delivered accuracy
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-3">
                    Xoom highlights quote clarity: it says you'll see the exact fee and the amount the recipient will receive before you hit send.
                  </p>
                  <p class="text-neutral-800 leading-relaxed mb-3">
                    On the delivery side, it also states funds will be delivered by the date on your receipt, often within minutes, but lists concrete factors that can cause delays (good-funds availability, compliance reviews, partner hours/time zones, holidays).
                  </p>
                  <p class="text-neutral-700 mt-4 mb-0 text-body-sm">
                    A practical nuance: Xoom's User Agreement defines "Payout Amount" and notes that local taxes/charges in the destination may be levied and deducted (destination-dependent).
                  </p>
                </div>
                <div class="mt-6 p-5 rounded-xl bg-neutral-50 border-l-4 border-brand-600">
                  <p class="font-semibold text-rs-fg mb-2">
                    Delivered Value takeaway:
                  </p>
                  <p class="text-neutral-800 mb-0">
                    Xoom's pricing model is straightforward (fees + FX conversion margin), but that often means you're paying a convenience premium.
                  </p>
                </div>
              </div>

              <div class="mb-10">
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-body-lg shadow-lg">
                    2
                  </div>
                  <h2 class="text-h2 font-bold text-rs-fg">
                    Reliability & Success (20%)
                  </h2>
                </div>
                <div class="space-y-4 text-body-lg leading-relaxed text-neutral-700">
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-600">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Quote success / availability
                    </p>
                    <p class="text-neutral-700 mb-0">
                      Xoom's footprint and features vary by country and product (send money vs reload vs bill pay), and it explicitly notes service availability and fees vary based on country, selected features, and other factors. So "reliability" here is less about uptime and more about whether your specific corridor/payout option is supported.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Pricing stability
                    </p>
                    <p class="text-neutral-700 mb-0">
                      Xoom states exchange rates change regularly based on financial markets or local partner rates. The stability signal to look for is that you get an upfront quote (fee + recipient amount), and you should treat the final checkout screen + receipt as the authoritative version.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Data freshness signals (what's "current")
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Two useful freshness cues Xoom provides:
                    </p>
                    <ul class="space-y-2 text-neutral-700">
                      <li>• A receipt-based delivery date promise ("delivered by the date listed on your receipt").</li>
                      <li>• A live "partner locations" locator (helpful for cash pickup) and corridor-specific pages with typical availability times.</li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-neutral-50 border-l-4 border-brand-600">
                    <p class="font-semibold text-rs-fg mb-2">
                      Reliability takeaway:
                    </p>
                    <p class="text-neutral-800 mb-0">
                      Xoom is typically dependable for supported corridors, and it's explicit about the real-world factors that can introduce variability.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-10">
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
                      ETA / speed buckets
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Xoom's own messaging on timing is consistent:
                    </p>
                    <p class="text-neutral-700 mb-0">
                      Frequently within minutes, but some transfers can take longer than minutes due to good-funds availability, compliance checks, partner hours/time zones, and local holidays. A help-center summary also says most transfers are available in minutes, while some can take up to a few days.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Payout methods (strong point)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Xoom's supported "receive" methods are a big reason it scores well on convenience:
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
                        <span>Bank account, debit card, mobile wallet</span>
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
                        <span>Cash pickup or home delivery</span>
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
                        <span>Pay international bills</span>
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
                        <span>Reload prepaid mobile phones</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Typical delivery behavior (examples Xoom publishes)
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Because timing is corridor-specific, Xoom publishes typical availability by route/type. For example:
                    </p>
                    <ul class="space-y-2 text-neutral-700">
                      <li>• <strong class="text-rs-fg">To the U.S.:</strong> debit card deposit and cash pickup are shown as typically available in minutes; bank deposit "within 2 days" on the U.S. flow page.</li>
                      <li>• <strong class="text-rs-fg">To Mexico:</strong> Xoom's Mexico page describes cash pickup typically available in minutes, mobile wallet transfers typically completed in minutes, and bank deposit typically available within 1 hour during recipient bank processing hours.</li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-neutral-50 border-l-4 border-brand-600">
                    <p class="font-semibold text-rs-fg mb-2">
                      Friction & Speed takeaway:
                    </p>
                    <p class="text-neutral-800 mb-0">
                      Xoom is often fast and low-friction when the corridor is well-supported, and it gives you a realistic "why delays happen" list.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-10">
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
                      Refunds and cancellation: the key rules
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Xoom's User Agreement says:
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
                        <span>You can cancel for a full refund within 30 minutes of authorizing the transaction, unless funds/reload/bill pay have already been paid out.</span>
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
                        <span>If eligible (funds not picked up or deposited), Xoom states it will refund your money within 4 business days of your cancellation request.</span>
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
                        <span>After 30 minutes, refunds are generally not provided except in limited circumstances.</span>
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
                        <span>Refunds go back to the same payment method and are in the same send currency (not adjusted for currency value changes).</span>
                      </li>
                    </ul>
                    <p class="text-neutral-700 mt-4 mb-0 text-body-sm">
                      A help-center snippet also states you can typically cancel if the money has not yet reached your recipient.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-600">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Dispute handling and post-issue friction
                    </p>
                    <p class="text-neutral-700 mb-3">
                      Two practical friction points show up in Xoom's own disclosures:
                    </p>
                    <ul class="space-y-2 text-neutral-700">
                      <li>• Transactions may be delayed/cancelled for identity verification, fraud/AML review, or compliance with law.</li>
                      <li>• The faster the payout method (cash pickup / instant wallet), the smaller your real-world window to cancel.</li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-neutral-50 border-l-4 border-brand-600">
                    <p class="font-semibold text-rs-fg mb-2">
                      Support & Refunds takeaway:
                    </p>
                    <p class="text-neutral-800 mb-0">
                      Xoom's policy is documented and clear, but cancellation is time-sensitive and becomes difficult once payout happens.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-10">
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
                    We keep this section conservative and verifiable: public licensing and regulatory checks where available, without implying a single global regulator.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3 text-body">
                      Public licensing/regulatory signals (where available)
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
                        <span><strong class="text-rs-fg">United States:</strong> Xoom's legal page states that all U.S. money transmission is provided by PayPal, Inc. (NMLS ID 910457) pursuant to PayPal's licenses, and links to state licensing disclosures.</span>
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
                        <span><strong class="text-rs-fg">UK/EEA:</strong> Xoom's legal page states PayPal (Europe) is licensed as a Luxembourg credit institution and under CSSF supervision, and references FCA temporary permissions regime context.</span>
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
                        <span><strong class="text-rs-fg">Australia:</strong> Xoom's fees page states the service is provided by PayPal Australia Pty Limited, which holds an Australian Financial Services Licence (AFSL).</span>
                      </li>
                    </ul>
                    <p class="text-neutral-700 mt-4 mb-0 text-body-sm">
                      (These statements don't replace your own checks; they point you to where to verify the entity for your region.)
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-neutral-50 border-l-4 border-brand-600">
                    <p class="font-semibold text-rs-fg mb-2">
                      Trust & Safety takeaway:
                    </p>
                    <p class="text-neutral-800 mb-0">
                      Strong "institutional" trust signals via PayPal-linked licensing disclosures, plus jurisdiction-specific regulatory statements.
                    </p>
                  </div>
                </div>
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
                      Friction & Speed: Multiple payout rails with fast "minutes" behavior in many cases (corridor-dependent).
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      Reliability & Success: Clear delivery expectations: Xoom states funds will be delivered by the date on your receipt, often within minutes, with explicit reasons delays can happen.
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-success-600 font-bold">+</span>
                      Trust & Safety: U.S. money transmission is stated to be provided by PayPal, Inc. with an NMLS ID and licensing disclosures, and UK/EEA regulatory context is published on Xoom's legal page.
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
                      Delivered Value: Xoom's own disclosures note transaction fees and that it makes money when converting currencies (spread/markup), which can weaken delivered value versus "rate-first" providers.
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-800 font-bold">−</span>
                      Delivered Value / Quote competitiveness: It's often not the cheapest once you compare "recipient gets" across providers—especially for cost-sensitive corridors.
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-warning-800 font-bold">−</span>
                      Support & Refunds: Refund/cancellation is time-sensitive (30-minute window for full refund; after that, refunds are limited), and it becomes hard once funds are picked up/deposited.
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
                      <span>People who value convenience (especially if you already live in the PayPal ecosystem) and want a familiar checkout experience.</span>
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
                      <span>Senders who need strong payout options (bank deposit, debit card deposit, mobile wallets, cash pickup/home delivery depending on corridor).</span>
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
                      <span>Transfers where reliability and predictable execution matter more than squeezing every last basis point of FX cost.</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-warning-600 to-warning-50 border-2 border-warning-600">
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
                      <span>Rate-maximizers who want the lowest all-in cost most of the time (Xoom charges transaction fees and also earns via currency conversion).</span>
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
                      <span>Large transfers where FX spread can dominate total cost (because spread scales with amount, even when the fee looks small).</span>
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
                      <span>Users outside Xoom's supported send/receive footprint for their corridor or payout type (availability and fees vary by country and feature).</span>
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
                  How to Get the Best Rate with Xoom
                </h2>
                <p class="text-body-lg text-neutral-600 mb-6">
                  Use this checklist as a quick "don't overpay" routine:
                </p>
                <div class="space-y-3">
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      1
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">Compare the total outcome ("recipient gets"), not just the fee line:</strong>
                      <span class="text-neutral-700">Xoom's cost can be in both fees + FX conversion margin.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      2
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">Test funding methods (bank vs debit/credit vs PayPal balance where available):</strong>
                      <span class="text-neutral-700">Fees can vary by payment method and corridor.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      3
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">Use the fee / exchange-rate calculator (or corridor flow page) right before sending:</strong>
                      <span class="text-neutral-700">Xoom notes rates can change.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      4
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">Pick payout method intentionally:</strong>
                      <span class="text-neutral-700">Cash pickup/debit card deposit/mobile wallet can be fast, but also reduces your ability to cancel if you spot an error late.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200 hover:border-brand-300 motion-safe:transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-body shadow-md">
                      5
                    </div>
                    <div class="flex-1">
                      <strong class="text-rs-fg block mb-1.5 text-body">If you might need to cancel, act immediately:</strong>
                      <span class="text-neutral-700">The agreement describes a 30-minute cancellation window for full refund (if not already paid out).</span>
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
                  Two Alternatives (and When They Beat Xoom)
                </h2>

                <div class="space-y-6">
                  <div class="p-6 rounded-xl border-2 border-rs-border bg-surface hover:border-brand-300 motion-safe:transition-colors">
                    <h3 class="text-h4 font-bold text-rs-fg mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      1) Wise
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      Wise tends to beat Xoom when your priority is lowest FX cost transparency: Wise positions itself around using the mid-market rate and showing fees upfront, which can outperform fee+spread models on many bank-deposit corridors.
                    </p>
                    <p class="text-neutral-700 mb-0">
                      <strong class="text-rs-fg">Choose Wise over Xoom when:</strong> You don't need cash pickup/home delivery, and you want to minimize hidden FX markup risk (spread).
                    </p>
                  </div>

                  <div class="p-6 rounded-xl border-2 border-rs-border bg-surface hover:border-brand-300 motion-safe:transition-colors">
                    <h3 class="text-h4 font-bold text-rs-fg mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      2) Remitly
                    </h3>
                    <p class="text-neutral-700 mb-3">
                      Remitly tends to beat Xoom when you want a remittance-first provider with broad corridor coverage and options tuned to major remittance routes (Remitly markets transfers to 170+ countries and territories).
                    </p>
                    <p class="text-neutral-700 mb-0">
                      <strong class="text-rs-fg">Choose Remitly over Xoom when:</strong> Your corridor is a core remittance route and you want providers built around those corridors, or you want to compare remittance-optimized delivery options and pricing in-app for your exact route.
                    </p>
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Bottom Line
                </h2>
                <div class="space-y-5 text-body-lg leading-relaxed text-neutral-700">
                  <div class="p-6 rounded-xl bg-gradient-to-br from-brand-50 to-primary-50 border-2 border-brand-200">
                    <p class="font-semibold text-rs-fg mb-3">
                      Who should use Xoom?
                    </p>
                    <p class="text-neutral-800 mb-0">
                      If you want convenience, you already trust the PayPal ecosystem, and you care about strong payout options (cash pickup/home delivery/mobile wallets/debit card deposit where available), Xoom is a solid, reliable choice.
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-gradient-to-br from-success-600 to-success-50 border-2 border-success-600">
                    <p class="font-semibold text-rs-fg mb-3">
                      Why the 8.5/10 is justified:
                    </p>
                    <p class="text-neutral-800 mb-0">
                      Xoom scores well on Reliability and Friction & Speed because it's explicit about delivery expectations and offers flexible payout methods. But the score is held back by Delivered Value (40%): Xoom discloses both transaction fees and that it earns money on currency conversion, which means the effective cost can be higher than more rate-focused alternatives.
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
                  See how Xoom stacks up for your specific corridor and amount.
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
                      Operator
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      PayPal
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Platform
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Web & App
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Speed
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Minutes
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Payout Options
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      Multiple
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Cancellation
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      30 Min Window
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-600">
                      Regulation
                    </dt>
                    <dd class="font-semibold text-rs-fg">
                      PayPal Licensed
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
                      <div class="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center text-body-sm font-bold text-success-700">W</div>
                      <span>Wise Review</span>
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
          Ready to See How Xoom Compares?
        </h2>
        <p
          class="text-body-lg mb-8"
          style="color: rgba(255, 255, 255, 1);"
        >
          Enter your transfer details to see real-time rates from Xoom and 30+ other providers.
        </p>
        <NuxtLink
          to="/send-money"
          class="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-body-lg font-semibold shadow-lg motion-safe:transition-all"
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

const score = 8.5

const providerName = 'Xoom'
const providerLogoUrl = `${siteUrl}${getProviderLogoPath('xoom')}`

defineOgImage({
  component: 'OgImageProvider',
  props: {
    providerName,
    remitScore: score,
    logoUrl: providerLogoUrl,
  },
})

setSeo({
  title: `Xoom Review ${new Date().getFullYear()} - Remit-Score 8.5/10 | Remit-Scout`,
  description: 'Independent Xoom review with Remit-Score 8.5/10. Fees, exchange rates, delivery speed, and key pros/cons to compare before you send.',
  canonical: `${siteUrl}/learn/providers/xoom`,
  ogImage: false,
})

const { addAggregateRatingSchema, addBreadcrumbSchema } = useStructuredData()

addAggregateRatingSchema({
  name: 'Xoom',
  ratingValue: score,
  bestRating: 10,
  worstRating: 1,
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: 'Xoom Review', path: '/learn/providers/xoom' },
]

addBreadcrumbSchema(
  breadcrumbItems.map(item => ({
    name: item.name,
    url: item.path === '/' ? `${siteUrl}/` : `${siteUrl}${item.path}`,
  })),
)
</script>
