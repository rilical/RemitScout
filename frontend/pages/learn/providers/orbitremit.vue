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
          <span class="font-medium text-white">OrbitRemit Review</span>
        </nav>

        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Provider Info -->
          <div>
            <div class="flex items-center gap-4 mb-6">
              <div class="w-20 h-20 rounded-2xl bg-white p-3 shadow-xl">
                <div class="w-full h-full rounded-xl bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                  OR
                </div>
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
                  OrbitRemit Review
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
                to="/send-money?provider=orbitremit"
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
                Compare OrbitRemit Now
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
                    <span class="font-semibold text-black">Good</span>
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
                    <span class="font-semibold text-black">Moderate</span>
                  </div>
                  <div class="h-0.5 bg-brand-600 w-full" />
                </div>
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-black">Support</span>
                    <span class="font-semibold text-black">Good</span>
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
              AU/NZ
            </div>
            <div class="text-sm text-slate-600">
              Send From
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">
              Fixed Fees
            </div>
            <div class="text-sm text-slate-600">
              Pricing Model
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">
              1–2 Days
            </div>
            <div class="text-sm text-slate-600">
              Typical Speed
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">
              Free Over $10k
            </div>
            <div class="text-sm text-slate-600">
              Fee Waiver
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
                  OrbitRemit earns an 8.1/10 largely on Delivered Value (40%): it's built around fixed, easy-to-understand fees that can work out very well in its core Australia/New Zealand send lanes—but the effective cost still comes down to the FX spread in the rate you're quoted, plus any payment-method surcharges if you fund by card instead of bank transfer.
                </p>
              </div>

              <div class="mb-22">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div class="w-1 h-8 bg-gradient-to-b from-brand-600 to-blue-700 rounded-full" />
                  Auditor Notes (Verbatim)
                </h2>
                <div class="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200">
                  <p class="text-lg text-slate-800 leading-relaxed italic m-0">
                    "OrbitRemit (8.1): AU/NZ specialist; fixed-fee value good in-core; speed often bank-timed; narrower reach."
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
                  Here's how OrbitRemit performs across each category in our rubric:
                </p>
              </div>

              <div class="not-prose my-8 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-blue-50/50 to-brand-50 p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-6">
                  <div class="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                    8.1
                  </div>
                  <div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                      OrbitRemit
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
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">
                      40% weight
                    </div>
                    <div class="text-sm text-slate-700 leading-relaxed">
                      Fixed-fee structure can be strong in AU/NZ core lanes; fee waivers exist in some cases (e.g., large-transfer thresholds, first-transfer free). The all-in cost can still be reduced by FX spread (and card surcharges).
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
                      OrbitRemit provides a published list of supported receiving currencies/countries. Locking in the rate at transfer creation (by purchasing currency immediately) reduces mid-transfer surprises, but only if you fund promptly.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">
                        Friction & Speed
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Moderate</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">
                      15% weight
                    </div>
                    <div class="text-sm text-slate-700 leading-relaxed">
                      Lots of "1 working day" corridor ETAs once funded (with some corridors listed as 1–2 working days). "Fast" is often bank-timed—your delivery clock effectively starts after OrbitRemit receives your funds.
                    </div>
                  </div>
                  <div class="p-4 rounded-xl bg-white/60 border border-brand-100">
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-semibold text-slate-900 text-sm">
                        Support & Refunds
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Good</span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">
                      15% weight
                    </div>
                    <div class="text-sm text-slate-700 leading-relaxed">
                      Cancellation/refunds can require tickets and documentation, and some outcomes may not refund the fee (e.g., invalid recipient account scenarios).
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
                      Clear public-facing regulatory disclosures for AU/NZ (e.g., ASIC/AFSL + AUSTRAC in Australia; DIA + FSP + FSCL in New Zealand).
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
                        Why 8.1 (not 9.0+):
                      </div>
                      <div class="text-sm text-slate-700 leading-relaxed">
                        OrbitRemit's predictable fee structure does real work for Delivered Value, but the FX spread + funding method and corridor variance keep it below the very top tier. Speed can be very good once OrbitRemit has the funds, but the experience is frequently constrained by bank processing.
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
                  What you actually pay = transfer fee + FX spread (+ any funding surcharges). OrbitRemit's main value story is fixed-fee pricing—clearer than percentage-based fees—plus fee-free thresholds on larger transfers.
                </p>
                <div class="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <p class="font-semibold text-slate-900 mb-3 text-base">
                    Fees (predictable, often fixed)
                  </p>
                  <ul class="space-y-3 text-slate-700">
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                      <span><strong class="text-slate-900">From Australia (AUD):</strong> OrbitRemit states transfers under $10,000 carry a $4 fee per transfer, and over $10,000 are free.</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                      <span><strong class="text-slate-900">From New Zealand (NZD):</strong> transfers over NZD $10,000 are listed as completely free, while under NZD $10,000 the fee varies by destination and is shown during setup.</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                      <span>OrbitRemit also notes more generally that sending 10,000+ units of the send currency can be fee-free, and that new customers receive a first-transfer fee-free promo.</span>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                      <span>Corridor-specific examples exist (e.g., a published $4 fee for certain AUD→PHP / NZD→PHP cases; and a very low fixed fee for some currencies like CNY after first transfer).</span>
                    </li>
                  </ul>
                </div>

                <div class="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200 mb-6">
                  <p class="font-semibold text-slate-900 mb-3 text-base">
                    FX spread (the part many people miss)
                  </p>
                  <p class="text-slate-800 leading-relaxed mb-0">
                    OrbitRemit shows its quoted rate alongside reference context like a "historic mid-market rate" chart on some currency pages, which is a useful prompt to compare the quoted rate to a mid-market reference. Even with a low fixed fee, a wider spread can make the effective cost less competitive—especially on bigger amounts where the spread dominates.
                  </p>
                </div>

                <div class="p-6 rounded-xl border-2 border-emerald-200">
                  <p class="font-semibold text-slate-900 mb-3">
                    "How often is it cheapest?"
                  </p>
                  <p class="text-slate-800 leading-relaxed mb-4">
                    Based on the auditor framing ("fixed-fee value good in-core"), OrbitRemit tends to be most competitive when you're sending from AU/NZ in its core corridors.
                  </p>
                  <p class="text-slate-800 leading-relaxed mb-0">
                    Outside those core lanes—and once you factor in FX spread and funding method (card vs bank)—it's less consistent as the outright cheapest option.
                  </p>
                </div>
              </div>

              <div class="not-prose my-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p class="text-sm text-blue-800 m-0">
                  <strong>Quote vs delivered accuracy:</strong> OrbitRemit indicates it purchases currency immediately when you create a transfer to secure the exchange rate, which supports "quote-to-delivered" alignment if you fund promptly. There's an important catch: if payment isn't received promptly, a transfer can be marked Void, and OrbitRemit says they require payment immediately after transfer creation (and cancelled transfers can't be reinstated). That means a "great quote" can evaporate if you wait too long to pay.
                </p>
              </div>

              <div class="not-prose my-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p class="text-sm text-amber-800 m-0">
                  <strong>Why this drives the 8.1:</strong> OrbitRemit's predictable fee structure does real work for Delivered Value, but the FX spread + funding method and corridor variance keep it below the very top tier.
                </p>
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
                    Reliability here is about getting a usable quote when you need it and the transfer behaving as expected.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Quote availability & corridor clarity
                    </p>
                    <p class="text-slate-700 mb-0">
                      OrbitRemit provides a published list of supported receiving currencies/countries and points users to the calculator for the most up-to-date pricing.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Pricing stability signals
                    </p>
                    <p class="text-slate-700 mb-0">
                      Locking in the rate at transfer creation (by purchasing currency immediately) reduces mid-transfer surprises, but only if you fund promptly to avoid voiding.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Data freshness signals
                    </p>
                    <p class="text-slate-700 mb-0">
                      OrbitRemit's currency pages reference comparison data that is "updated on an approximate hourly basis," and OrbitRemit offers rate alerts, which are both "freshness" hints for shoppers.
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
                    This measures how quickly funds arrive in practice and how much effort is required (setup, verification, payment steps, payout complexity).
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Speed buckets (typical behavior)
                    </p>
                    <div class="mb-4">
                      <p class="font-semibold text-slate-900 mb-2">
                        <strong>Funding time (the hidden delay)</strong>
                      </p>
                      <ul class="space-y-2.5 text-slate-700">
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
                          <span><strong class="text-slate-900">From NZ:</strong> OrbitRemit says it usually receives payments to its NZ bank account within around 4 hours, with cut-off timing affecting whether it lands the next morning vs afternoon.</span>
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
                          <span><strong class="text-slate-900">From AU:</strong> OrbitRemit notes a standard bank payment before cut-off is typically received the following working day, while PayID/OSKO can reflect within an hour during business hours.</span>
                        </li>
                      </ul>
                    </div>
                    <div class="mt-4 pt-4 border-t border-amber-200">
                      <p class="font-semibold text-slate-900 mb-2">
                        <strong>Delivery time after funding</strong>
                      </p>
                      <p class="text-slate-700 mb-2">
                        OrbitRemit's settlement guidelines explicitly start after your payment reaches their account and the transfer hits "Awaiting Settlement."
                      </p>
                      <p class="text-slate-700 mb-0">
                        Many corridors are listed as 1 working day, while some are 1–2 working days. For PHP, it's even split by amount (up to 50,000 PHP vs over 50,000 PHP).
                      </p>
                    </div>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Payout methods
                    </p>
                    <p class="text-slate-700 mb-3">
                      Predominantly bank deposit, with mobile wallets and cash pickup in specific corridors.
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
                        <span>Example: GCash (Philippines) is supported, with corridor-specific fee disclosures on OrbitRemit's help pages.</span>
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
                        <span>Cash pickup is available for some destinations (e.g., Philippines) and comes with recipient-detail strictness (name match, ID requirements) that can add friction if entered incorrectly.</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Why this drives the 8.1
                    </p>
                    <p class="text-slate-700 mb-0">
                      Speed can be very good once OrbitRemit has the funds, but the experience is frequently constrained by bank processing (and sometimes by recipient-detail requirements on cash pickup).
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
                    This category is about what happens when something goes wrong: cancellations, refunds, disputes, and the friction after an issue.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Contactability
                    </p>
                    <p class="text-slate-700 mb-0">
                      OrbitRemit lists email support (response "within 1 business day") and in-app live chat with set hours.
                    </p>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Refund & cancellation mechanics
                    </p>
                    <ul class="space-y-2.5 text-slate-700">
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
                        <span>Completed transfers generally can't be cancelled/reversed; pending transfers in "Awaiting Payment" or "Awaiting Update" can be cancelled with a refund process.</span>
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
                        <span>Refund requests can require documentation (proof of payment thresholds) and may not return the fee in some invalid-account scenarios.</span>
                      </li>
                    </ul>
                  </div>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Complaints/disputes
                    </p>
                    <p class="text-slate-700 mb-0">
                      OrbitRemit outlines a formal complaint workflow including acknowledgment timing and a resolution window (up to 20 working days), with escalation options (e.g., FSCL in NZ).
                    </p>
                    <p class="text-slate-700 mt-3 mb-0">
                      <strong class="text-slate-900">Practical takeaway:</strong> Support is reachable, but the refund/cancellation path is process-heavy—especially once a transfer is underway.
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
                    Remit-Scout treats "Trust & Safety" as public verifiability plus sensible user safeguards—not marketing claims.
                  </p>
                  <div class="mt-5 p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200">
                    <p class="font-semibold text-slate-900 mb-3 text-base">
                      Regulatory disclosures (where available)
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
                        <span><strong class="text-slate-900">Australia:</strong> OrbitRemit states it's regulated by ASIC, holds an AFSL (470646), and is registered with AUSTRAC as a money remitter (registration number listed).</span>
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
                        <span><strong class="text-slate-900">New Zealand:</strong> OrbitRemit states it is supervised by the Department of Internal Affairs (DIA) as a money remitter, is an FSCL member, and is registered as a Financial Service Provider (FSP 7721).</span>
                      </li>
                    </ul>
                    <p class="text-slate-700 mt-3 mb-0">
                      Where available, you can cross-check these identifiers on the relevant public registers; where not available, we don't over-claim.
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
                      <span><strong>Delivered Value:</strong> Fixed-fee structure can be strong in AU/NZ core lanes; fee waivers exist in some cases (e.g., large-transfer thresholds, first-transfer free).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-emerald-600 font-bold">+</span>
                      <span><strong>Friction & Speed:</strong> Lots of "1 working day" corridor ETAs once funded (with some corridors listed as 1–2 working days).</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-emerald-600 font-bold">+</span>
                      <span><strong>Trust & Safety:</strong> Clear public-facing regulatory disclosures for AU/NZ (e.g., ASIC/AFSL + AUSTRAC in Australia; DIA + FSP + FSCL in New Zealand).</span>
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
                      <span><strong>Delivered Value:</strong> The all-in cost can still be reduced by FX spread (and card surcharges), so it won't always be the cheapest even with a low fixed fee.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-amber-600 font-bold">−</span>
                      <span><strong>Friction & Speed:</strong> "Fast" is often bank-timed—your delivery clock effectively starts after OrbitRemit receives your funds.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-amber-600 font-bold">−</span>
                      <span><strong>Support & Refunds:</strong> Cancellation/refunds can require tickets and documentation, and some outcomes may not refund the fee (e.g., invalid recipient account scenarios).</span>
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
                      <span>Senders in Australia or New Zealand who want a straightforward, fixed-fee experience.</span>
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
                      <span>Larger bank-funded transfers, where fee waivers can improve the all-in value (e.g., fee-free thresholds).</span>
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
                      <span>Philippines use cases that benefit from multiple receive options (bank, mobile wallet, cash pickup), where available.</span>
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
                      <span>Anyone sending from outside AU/NZ, since OrbitRemit currently supports sending from Australia and New Zealand.</span>
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
                      <span>People who need globally broad corridor coverage across many send countries (the "narrower reach" cap).</span>
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
                      <span>Users who want easy cancellation after booking (OrbitRemit may be unable to cancel once processing is underway/completed).</span>
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
                  How to Get the Best Rate on OrbitRemit
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
                      <strong class="text-slate-900 block mb-2.5 text-base">Compare funding methods:</strong>
                      <span class="text-slate-700">bank transfer vs card/Apple Pay/Google Pay—cards can add surcharges that change the "real" cost.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      2
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Watch the FX spread:</strong>
                      <span class="text-slate-700">sanity-check the quote against a mid-market reference; the spread is part of the cost.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      3
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Pay promptly after booking:</strong>
                      <span class="text-slate-700">OrbitRemit may void transfers if payment isn't made immediately after creation, which can force a re-quote.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      4
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Choose the right payout method:</strong>
                      <span class="text-slate-700">bank deposit vs wallet vs cash pickup (if available), and triple-check recipient details for cash pickup to avoid delays.</span>
                    </div>
                  </div>
                  <div class="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-brand-200 hover:border-brand-300 transition-colors shadow-sm">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                      5
                    </div>
                    <div class="flex-1">
                      <strong class="text-slate-900 block mb-2.5 text-base">Time it around banking cut-offs/weekends:</strong>
                      <span class="text-slate-700">because speed is often bank-timed, paying before cut-off can reduce next-day slippage.</span>
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
                  Two Alternatives (and When They Beat OrbitRemit)
                </h2>

                <div class="space-y-6">
                  <div class="p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-brand-300 transition-colors">
                    <h3 class="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      XE Money (8.7)
                    </h3>
                    <p class="text-slate-700 mb-3">
                      <strong class="text-slate-900">When XE beats OrbitRemit:</strong> when you need a broader global footprint (more flexible "all-rounder" positioning) or you want strong quote reliability across many routes.
                    </p>
                    <p class="text-slate-700 mb-0">
                      <strong class="text-slate-900">Choose XE Money over OrbitRemit when:</strong> Strong all-rounder; reliable quotes; value competitive but not always cheapest; speed often bank-timed; trust strong.
                    </p>
                  </div>

                  <div class="p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-brand-300 transition-colors">
                    <h3 class="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand-600" />
                      Remitly (9.1)
                    </h3>
                    <p class="text-slate-700 mb-3">
                      <strong class="text-slate-900">When Remitly beats OrbitRemit:</strong> when you care most about speed tiers (including express) or need more payout-style flexibility and strong support for time-sensitive sends.
                    </p>
                    <p class="text-slate-700 mb-0">
                      <strong class="text-slate-900">Choose Remitly over OrbitRemit when:</strong> Very fast (express) + strong support; value strong but express can cost more; reliable execution; trust strong.
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
                      Use OrbitRemit if:
                    </p>
                    <p class="text-slate-800 mb-0">
                      You're sending from Australia or New Zealand and want predictable fees and solid, bank-led delivery times in its core corridors.
                    </p>
                  </div>
                  <div class="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                    <p class="font-semibold text-slate-900 mb-3">
                      Why the 8.1/10 is justified:
                    </p>
                    <p class="text-slate-800 mb-0">
                      That's the heart of the 8.1/10: Delivered Value is strong in-core thanks to fixed-fee economics and fee-free thresholds, but FX spread, bank-timed funding, and narrower reach keep it from the very top tier.
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
                  See how OrbitRemit stacks up for your specific corridor and amount.
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
                      Send From
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      AU/NZ
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">
                      Pricing
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      Fixed Fees
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">
                      Fee-Free
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      Over $10k
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">
                      Typical Speed
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      1–2 Days
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-600">
                      AU License
                    </dt>
                    <dd class="font-semibold text-slate-900">
                      ASIC/AUSTRAC
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
                      to="/learn/providers/xe-money"
                      class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">XE</div>
                      <span>XE Money Review</span>
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
                      to="/learn/providers/paysend"
                      class="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600"
                    >
                      <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">PS</div>
                      <span>Paysend Review</span>
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
          Ready to See How OrbitRemit Compares?
        </h2>
        <p
          class="text-lg mb-8"
          style="color: rgba(255, 255, 255, 1);"
        >
          Enter your transfer details to see real-time rates from OrbitRemit and 30+ other providers.
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

const score = 8.1

setSeo({
  title: 'OrbitRemit Review 2024 - Remit-Score 8.1/10 | Remit-Scout',
  description: 'Independent OrbitRemit review with Remit-Score 8.1/10. AU/NZ specialist; fixed-fee value good in-core; speed often bank-timed; narrower reach. Detailed breakdown of fees, speed, and delivered value.',
  canonical: `${siteUrl}/learn/providers/orbitremit`,
  ogImage: `${siteUrl}/og-images/provider-orbitremit.jpg`,
})

const { addReviewSchema } = useStructuredData()
const reviewBody = `OrbitRemit earns a Remit-Score of 8.1/10 based on our independent analysis. The provider is an AU/NZ specialist with good fixed-fee value in core corridors, though speed is often bank-timed and reach is narrower. Detailed breakdown of fees, speed, and delivered value based on real transfer data.`

addReviewSchema({
  itemReviewed: 'OrbitRemit',
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
  { name: 'OrbitRemit Review', path: '/learn/providers/orbitremit' },
]
</script>
