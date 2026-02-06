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
          <span class="font-medium text-white">Ria Review</span>
        </nav>

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-4 mb-6">
              <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-3 shadow-xl">
                <ProviderLogo
                  slug="ria"
                  alt="Ria"
                  size="small"
                />
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
                  Ria Review
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
                to="/send-money?provider=ria"
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
                Compare Ria Now
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
                    <span class="font-semibold text-black">Good</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full" />
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-black">Support</span>
                    <span class="font-semibold text-black">Moderate</span>
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
              500k+
            </div>
            <div class="text-sm text-slate-600">
              Cash Locations
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">
              160+
            </div>
            <div class="text-sm text-slate-600">
              Countries
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">
              Minutes
            </div>
            <div class="text-sm text-slate-600">
              Cash Pickup Speed
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">
              Cash First
            </div>
            <div class="text-sm text-slate-600">
              Core Strength
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
                  Ria's 8.0/10 is best explained by starting with Delivered Value (40%). Ria is often chosen for its cash pickup reach and availability, not because it reliably wins on the absolute lowest all‑in price. In practice, your "real cost" is the combination of transfer fees + FX spread (the markup hidden in the exchange rate), and that's where Ria can be inconsistent depending on corridor, payout method, and funding type.
                </p>
              </div>

              <div class="mb-22">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-gradient-to-b from-brand-600 to-blue-700 rounded-full" />
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200">
                  <p class="text-lg text-slate-800 leading-relaxed italic m-0">
                    "RIA (8.0): Very large cash network; reliable; speed good for cash pickup; delivered value varies; support can be uneven."
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
                  Here's how Ria performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-blue-50/50 to-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                    8.0
                  </div>
                  <div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                      Ria
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
                      Fees + FX spread can make the effective cost higher than "rate-first" apps; value varies by corridor.
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
                      Strong "it actually works" profile for cash pickup use cases, supported by a very large payout network.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">
                        Friction & Speed
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">
                      15% weight
                    </div>
                    <div class="text-sm text-slate-700 leading-relaxed">
                      Good speed behavior for cash pickup in many corridors (often the fastest way to get funds into a recipient's hands). Non-cash payout methods can behave more like bank rails.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">
                        Support & Refunds
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Moderate</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">
                      15% weight
                    </div>
                    <div class="text-sm text-slate-700 leading-relaxed">
                      Post‑issue handling can feel inconsistent (especially when multiple partners/agents are involved in the payout chain).
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
                      Operates in regulated environments where required; you can often verify licensing/registration where available in your sending country.
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
                        Why 8.0 (not 9.0+):
                      </div>
                      <div class="text-sm text-slate-700 leading-relaxed">
                        Ria earns points for very large cash network reach, strong reliability, and good cash pickup speed—but the score is capped by Delivered Value (40%) being inconsistent (fees + FX spread can be higher than leaner, digital-first competitors), and by support variability when something goes wrong.
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
                  Effective cost: fees + FX spread
                </p>
                <p class="text-lg text-slate-700 leading-relaxed mb-6">
                  When users compare money transfer providers, the trap is focusing on only the fee. With Ria (and most remittance services), the exchange rate you're offered can carry a margin. Two quotes can look identical on fees but produce different "recipient gets" outcomes because of FX spread.
                </p>
                <div class="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200 mb-6">
                  <p class="font-semibold text-slate-900 mb-3 text-base">
                    What to do instead (data-first)
                  </p>
                  <ul class="space-y-2.5 text-slate-700">
                    <li class="flex items-start gap-2.5">
                      <svg
                        class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
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
                      <span>Compare providers using the same send amount, funding method, and payout method, then look at recipient receives.</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <svg
                        class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
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
                      <span>If the fee is low but the rate looks weak versus a neutral reference (mid‑market/Google), the spread may be the real cost.</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl border-2 border-emerald-200 mb-6">
                  <p class="font-semibold text-slate-900 mb-3">
                    "How often is Ria the cheapest?"
                  </p>
                  <p class="text-slate-800 leading-relaxed mb-4">
                    We don't claim a universal "Ria wins X% of the time" (no such stats were provided). Based on the auditor note "delivered value varies," treat Ria as:
                  </p>
                  <ul class="space-y-2.5 text-slate-800">
                    <li class="flex items-start gap-2.5">
                      <span class="text-emerald-600 font-bold mt-0.5">•</span>
                      <span>Sometimes competitive (especially in corridors where its cash network is strong), but</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <span class="text-emerald-600 font-bold mt-0.5">•</span>
                      <span>Not consistently the cheapest once you include spread and corridor-specific pricing.</span>
                    </li>
                  </ul>
                  <p class="text-slate-800 leading-relaxed mt-4 mb-0">
                    Ria's best "value" cases often come from situations where cash pickup is the only practical rail—because the alternative may be "cheaper on paper" but not usable or not successful.
                  </p>
                </div>

                <div class="not-prose my-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p class="text-sm text-blue-800 m-0">
                    <strong>Quote vs delivered accuracy:</strong> For cash pickup, quote accuracy often depends on whether the recipient name matches ID (a common reason for pickup friction), the selected payout location / partner availability, and any corridor-specific compliance requirements. The practical takeaway: with cash pickup, execution reliability is often better than "bank deposit everywhere," but the experience becomes sensitive to small data-entry mistakes.
                  </p>
                </div>

                <div class="not-prose my-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p class="text-sm text-amber-800 m-0">
                    <strong>Delivered Value verdict:</strong> This is the main reason the score is 8.0 rather than higher. Ria can be the most practical option, but the effective cost is not consistently best-in-market.
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
                    Ria scores well here because it's built around a large cash network and tends to be reliable for the use case it's known for.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Quote success / availability
                    </p>
                    <p class="text-slate-700 mb-0">
                      A large cash network generally improves the chance a corridor is supported, the chance the recipient can access the payout without needing a bank account, and the chance there's a nearby pickup option.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Pricing stability
                    </p>
                    <p class="text-slate-700 mb-0">
                      Pricing stability is typically corridor-driven: fees and rates can change depending on payment method (bank vs card), payout method (cash vs bank), and time (FX moves). "Stable" in this context means you should expect the checkout quote to be the authoritative one, not a rate you saw earlier.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Data freshness signals
                    </p>
                    <p class="text-slate-700 mb-0">
                      The "freshness" signal users can actually act on is simple: re-check the quote right before sending and compare "recipient receives" across providers for that exact transfer.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-emerald-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Reliability verdict
                    </p>
                    <p class="text-slate-700 mb-0">
                      Strong in-core reliability, especially for cash pickup.
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
                    Ria's speed profile is best understood by payout method.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      ETA / speed buckets
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
                        <span><strong class="text-slate-900">Cash pickup (fast):</strong> Often the quickest path once payment is confirmed and the transfer is made available for pickup.</span>
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
                        <span><strong class="text-slate-900">Bank deposit (moderate):</strong> Often behaves like bank timing—can range from same day to a few business days depending on corridor and bank rails.</span>
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
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <span><strong class="text-slate-900">Edge-case delays:</strong> Verification, payout partner hours, holidays, or data mismatches can slow down even a typically fast corridor.</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Payout methods
                    </p>
                    <p class="text-slate-700 mb-0">
                      Ria's headline strength is cash pickup, but it may also support other payout methods in some corridors (availability varies).
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Typical delivery-speed behavior
                    </p>
                    <p class="text-slate-700 mb-0">
                      If you're choosing Ria specifically for speed: cash pickup is the "best bet" for fast receipt, while bank deposit is usually less predictable than cash pickup.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-emerald-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Friction & Speed verdict
                    </p>
                    <p class="text-slate-700 mb-0">
                      Strong for cash pickup; more average when you leave the cash rail.
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
                    This is where the auditor note flags the downside: support can be uneven.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Refund experience (what tends to matter)
                    </p>
                    <p class="text-slate-700 mb-3">
                      Refunds and cancellations usually depend on whether:
                    </p>
                    <ul class="space-y-2.5 text-slate-700">
                      <li class="flex items-start gap-2.5">
                        <span class="text-amber-600 font-bold mt-0.5">•</span>
                        <span>The funds have already been paid out / picked up,</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <span class="text-amber-600 font-bold mt-0.5">•</span>
                        <span>The transfer is still "pending,"</span>
                      </li>
                      <li class="flex items-start gap-2.5">
                        <span class="text-amber-600 font-bold mt-0.5">•</span>
                        <span>The issue is a sender error (wrong details) versus a processing error.</span>
                      </li>
                    </ul>
                    <p class="text-slate-700 mt-3 mb-0">
                      In cash pickup networks, refund workflows can require more back-and-forth because the provider may need to confirm payout status with a partner/agent.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Dispute handling and post-issue friction
                    </p>
                    <p class="text-slate-700 mb-3">
                      To reduce friction if something goes wrong:
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Keep the transaction receipt/reference number handy,</span>
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
                        <span>Contact support quickly (the earlier you do, the more options exist),</span>
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
                        <span>Be ready to confirm sender identity and transfer details.</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Support & Refunds verdict
                    </p>
                    <p class="text-slate-700 mb-0">
                      Clear enough in straightforward cases, but uneven when edge cases arise—partly because cash networks involve multiple parties.
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
                    We keep this conservative and verifiable where available.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      What you can do as a consumer
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
                        <span>Check whether the provider is listed/registered as a money transfer or money services business in your sending country (register availability varies by jurisdiction).</span>
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
                        <span>Prefer providers that give clear receipts, tracking, and a documented dispute path.</span>
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
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <span>Be cautious about scams: cash pickup is convenient, but also easier for fraud if you're sending to someone you don't know.</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-emerald-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Trust & Safety verdict
                    </p>
                    <p class="text-slate-700 mb-0">
                      Generally strong baseline for a major, widely used remittance network—without claiming universal licensing everywhere.
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
                      <span><strong>Reliability & Success:</strong> Strong "it actually works" profile for cash pickup use cases, supported by a very large payout network.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-emerald-600 font-bold">+</span>
                      <span><strong>Friction & Speed:</strong> Good speed behavior for cash pickup in many corridors (often the fastest way to get funds into a recipient's hands).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-emerald-600 font-bold">+</span>
                      <span><strong>Trust & Safety:</strong> Operates in regulated environments where required; you can often verify licensing/registration where available in your sending country.</span>
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
                      <span><strong>Delivered Value:</strong> Fees + FX spread can make the effective cost higher than "rate-first" apps; value varies by corridor.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-amber-600 font-bold">−</span>
                      <span><strong>Support & Refunds:</strong> Post‑issue handling can feel inconsistent (especially when multiple partners/agents are involved in the payout chain).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-amber-600 font-bold">−</span>
                      <span><strong>Friction & Speed:</strong> Non-cash payout methods (like bank deposit) can behave more like bank rails—timing and reliability are more variable than cash pickup.</span>
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
                      <span>Cash pickup recipients who need a physical location network and want money available quickly once processed.</span>
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
                      <span>Situations where reliability matters more than optimizing price (e.g., you'd rather pay a bit more than risk a failed payout method).</span>
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
                      <span>Recipients without easy access to bank accounts (or where bank deposits are less dependable than cash pickup).</span>
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
                      <span>Cost-first senders trying to maximize the delivered amount every single time (Ria's effective cost can vary by route).</span>
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
                      <span>Large transfers where FX spread dominates total cost (even small rate differences can add up).</span>
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
                      <span>Anyone who expects a perfect, uniform support experience across all corridors and partners (support can be uneven).</span>
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
                  How to Get the Best Rate with Ria
                </h2>
                <p class="text-lg text-slate-600 mb-6">
                  Quick checklist to maximize delivered value:
                </p>
                <div class="space-y-3">
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      1
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Compare "recipient receives":</strong>
                      <span class="text-slate-700">across at least one alternative before sending (that captures fees + spread).</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      2
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Test funding methods:</strong>
                      <span class="text-slate-700">bank vs card—card is convenient but often costs more overall.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      3
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Choose payout method intentionally:</strong>
                      <span class="text-slate-700">cash pickup is often fastest; bank deposit may be cheaper sometimes but can be slower/less predictable.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      4
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Send the right amount:</strong>
                      <span class="text-slate-700">pricing can be tiered; a slightly larger/smaller send amount can change the effective fee/spread outcome.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      5
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Verify recipient details exactly:</strong>
                      <span class="text-slate-700">name spelling + ID match to avoid pickup failures and support loops.</span>
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
                  Two Alternatives (and When They Beat Ria)
                </h2>

                <div class="space-y-6">
                  <div class="p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-brand-300 transition-colors">
                    <h3 class="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      Western Union (8.2)
                    </h3>
                    <p class="text-slate-700 mb-3">
                      <strong class="text-slate-900">When Western Union beats Ria:</strong> If your top priority is maximum cash pickup reach and "it must work today," Western Union can be stronger in the most time-sensitive cash pickup scenarios. You may still pay a premium in effective cost, but the tradeoff is reach and execution.
                    </p>
                  </div>

                  <div class="p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-brand-300 transition-colors">
                    <h3 class="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      Remitly (9.1)
                    </h3>
                    <p class="text-slate-700 mb-3">
                      <strong class="text-slate-900">When Remitly beats Ria:</strong> If the recipient can accept non-cash rails and you want a better value + support balance, Remitly can outperform—especially when you can use a slower, cheaper option (and only pay for "Express" when you truly need speed).
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
                      Who should use Ria:
                    </p>
                    <p class="text-slate-800 mb-0">
                      People sending to recipients who need cash pickup, especially when reliability and access matter more than squeezing the lowest possible fee/spread.
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3">
                      Why the 8.0/10 is justified:
                    </p>
                    <p class="text-slate-800 mb-0">
                      Ria earns points for very large cash network reach, strong reliability, and good cash pickup speed—but the score is capped by Delivered Value (40%) being inconsistent (fees + FX spread can be higher than leaner, digital-first competitors), and by support variability when something goes wrong.
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
                  See how Ria stacks up for your specific corridor and amount.
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
                      Cash Network
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      500k+ Locations
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">
                      Countries
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      160+
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">
                      Core Strength
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      Cash Pickup
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">
                      Cash Speed
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      Minutes
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">
                      Bank Speed
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      1–3 Days
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
                      to="/learn/providers/western-union"
                      class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">WU</div>
                      <span>Western Union Review</span>
                    </NuxtLink>
                  </li>
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
                      to="/learn/providers/orbitremit"
                      class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">OR</div>
                      <span>OrbitRemit Review</span>
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
          Ready to See How Ria Compares?
        </h2>
        <p
          class="text-lg mb-8"
          style="color: rgba(255, 255, 255, 1);"
        >
          Enter your transfer details to see real-time rates from Ria and 30+ other providers.
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

const score = 8.0

setSeo({
  title: 'Ria Review 2024 - Remit-Score 8.0/10 | Remit-Scout',
  description: 'Independent Ria review with Remit-Score 8.0/10. Very large cash network; reliable; speed good for cash pickup; delivered value varies; support can be uneven. Detailed breakdown of fees, speed, and delivered value.',
  canonical: `${siteUrl}/learn/providers/ria`,
  ogImage: `${siteUrl}/og-images/provider-ria.jpg`,
})

const { addReviewSchema } = useStructuredData()
const reviewBody = `RIA earns a Remit-Score of 8.0/10 based on our independent analysis. The provider offers a very large cash network with reliable execution. Speed is good for cash pickup, though delivered value varies and support can be uneven. Detailed breakdown of fees, speed, and delivered value based on real transfer data.`

addReviewSchema({
  itemReviewed: 'RIA',
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
  { name: 'Ria Review', path: '/learn/providers/ria' },
]
</script>
