<template>
  <div class="min-h-screen bg-white break-words [text-wrap:pretty] [overflow-wrap:anywhere] [hyphens:auto]">
    <!-- Reusable Compare Widget -->
    <CompareWidget />

    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-slate-50 to-white py-12 lg:py-16">
      <div class="container mx-auto px-4 max-w-7xl">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="grid lg:grid-cols-3 gap-8 lg:gap-12 mt-8">
          <!-- Main Content -->
          <div class="lg:col-span-2">
            <h1 class="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl [text-wrap:balance]">
              How We Compare Money Transfer Providers
            </h1>
            <p class="mx-auto max-w-3xl text-xl text-slate-600 sm:text-2xl font-medium mb-6">
              Transparent, data-driven methodology built by expats who got tired of losing money to hidden fees
            </p>
            <p class="text-lg text-slate-600 leading-relaxed max-w-3xl">
              We're like a travel comparison site, but for money transfers. Every comparison, every rating, every recommendation is backed by real transfers, verified data, and a commitment to showing you the actual "recipient gets" amount—not marketing fluff.
            </p>
          </div>

          <!-- Sidebar Widget -->
          <div class="lg:col-span-1">
            <div class="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 class="text-xl font-bold text-slate-900 mb-6">
                Find a better provider now
              </h3>

              <form
                class="space-y-4"
                @submit.prevent="handleCompare"
              >
                <div>
                  <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Country From
                  </label>
                  <CountrySelect
                    id="methodology-from"
                    v-model="compareForm.from"
                    label="From"
                    placeholder="United States"
                  />
                </div>

                <div>
                  <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Country To
                  </label>
                  <CountrySelect
                    id="methodology-to"
                    v-model="compareForm.to"
                    label="To"
                    placeholder="Select destination"
                  />
                </div>

                <div>
                  <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    You Send
                  </label>
                  <div class="flex gap-2">
                    <input
                      v-model.number="compareForm.amount"
                      type="number"
                      min="1"
                      step="1"
                      class="h-12 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="500"
                    >
                    <CurrencySelect
                      v-model="compareForm.fromCurrency"
                      :country-code="compareForm.from"
                      placeholder="USD"
                    />
                  </div>
                </div>

                <div>
                  <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    To
                  </label>
                  <CurrencySelect
                    v-model="compareForm.toCurrency"
                    :country-code="compareForm.to"
                    placeholder="Select currency"
                    :disabled="!compareForm.to"
                  />
                </div>

                <button
                  type="submit"
                  :disabled="!isCompareValid"
                  class="w-full h-12 rounded-lg bg-orange-500 px-6 text-base font-bold text-white hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  Compare
                </button>
              </form>

              <div class="mt-6 space-y-4 pt-6 border-t border-slate-200">
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 mt-0.5">
                    <svg
                      class="h-5 w-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <p class="text-sm text-slate-700 leading-relaxed">
                    Our comparison engine is trusted by more than <strong class="font-semibold text-slate-900">{{ SITE_STATS.users.display }} users</strong> worldwide
                  </p>
                </div>

                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 mt-0.5">
                    <svg
                      class="h-5 w-5 text-emerald-600"
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
                  <p class="text-sm text-slate-700 leading-relaxed">
                    We only recommend <strong class="font-semibold text-slate-900">regulated and secure companies</strong>
                  </p>
                </div>

                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 mt-0.5">
                    <svg
                      class="h-5 w-5 text-green-600"
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
                  <p class="text-sm text-slate-700 leading-relaxed">
                    Save up to <strong class="font-semibold text-slate-900">90% by switching</strong> to a cheaper provider today
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-12 max-w-6xl">
      <!-- Why You Need to Compare -->
      <section class="mb-16">
        <h2 class="mb-6 text-3xl font-bold text-slate-900">
          Why You Need to Compare Your Options Before Every Transfer
        </h2>
        <div class="space-y-4 text-lg leading-relaxed text-slate-700">
          <p>
            Just like you wouldn't book a flight or hotel without comparing prices, you shouldn't send money abroad without checking your options first. The difference between providers can be <strong class="font-semibold text-slate-900">hundreds of dollars</strong> on a single transfer—money that could go to your family instead of fees and hidden markups.
          </p>
          <p>
            Traditional banks and even some "low fee" providers hide their real costs in exchange rate markups. A provider might advertise "$0 fees" but charge you 3–5% more than the real exchange rate. That's why we show you the <strong class="font-semibold text-slate-900">actual amount your recipient will receive</strong>—the only number that actually matters.
          </p>
          <p>
            Remit-Scout helps you find the best deal by comparing live rates, total costs, and delivery speeds from {{ SITE_STATS.providers.display }} licensed providers. We test, verify, and explain every option so you can send with confidence.
          </p>
        </div>
      </section>

      <!-- How It Works - Step by Step -->
      <section class="mb-16">
        <h2 class="mb-8 text-3xl font-bold text-slate-900">
          How Our Comparison Works
        </h2>

        <!-- Step 1 -->
        <div class="mb-12 rounded-2xl border border-slate-200 bg-white p-8 lg:p-10 shadow-lg">
          <div class="flex items-start gap-6">
            <div class="flex-shrink-0">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 shadow-md">
                <span class="text-3xl">1️⃣</span>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="mb-4 text-2xl font-bold text-slate-900">
                Enter Your Transfer Details
              </h3>
              <p class="mb-4 text-lg leading-relaxed text-slate-700">
                Tell us where you're sending money from and to, plus how much. We'll instantly show you live quotes from {{ SITE_STATS.providers.display }} licensed providers.
              </p>
              <p class="text-base text-slate-600">
                Our comparison engine fetches current rates and fees in real-time, providing detailed results in 10–30 seconds. No sign-up required to see your options.
              </p>
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="mb-12 rounded-2xl border border-slate-200 bg-white p-8 lg:p-10 shadow-lg">
          <div class="flex items-start gap-6">
            <div class="flex-shrink-0">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 shadow-md">
                <span class="text-3xl">2️⃣</span>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="mb-4 text-2xl font-bold text-slate-900">
                Select the Best Provider for Your Transfer
              </h3>
              <p class="mb-4 text-lg leading-relaxed text-slate-700">
                Our comparison engine shows you results organized by transfer type (bank account, cash pick-up, mobile wallet) and ranked from cheapest to most expensive based on the total amount your recipient will receive.
              </p>
              <p class="mb-4 text-base text-slate-700">
                You can also sort by:
              </p>
              <ul class="mb-4 ml-6 space-y-2 text-slate-700">
                <li class="flex items-start gap-2">
                  <span class="text-emerald-600 font-bold mt-1">•</span>
                  <span><strong>Transfer speed</strong> – How fast your money arrives</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-emerald-600 font-bold mt-1">•</span>
                  <span><strong>Payment method</strong> – Bank transfer, debit card, credit card, etc.</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-emerald-600 font-bold mt-1">•</span>
                  <span><strong>Remit Score</strong> – Our independent rating (1–10) based on cost, speed, reliability, and safety</span>
                </li>
              </ul>
              <p class="text-base text-slate-600">
                Every result shows the exact amount your recipient will receive, including all fees and exchange rate markups. No surprises.
              </p>
            </div>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="mb-12 rounded-2xl border border-slate-200 bg-white p-8 lg:p-10 shadow-lg">
          <div class="flex items-start gap-6">
            <div class="flex-shrink-0">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 shadow-md">
                <span class="text-3xl">3️⃣</span>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="mb-4 text-2xl font-bold text-slate-900">
                Send Money and Save on Transfer Fees
              </h3>
              <p class="mb-4 text-lg leading-relaxed text-slate-700">
                After selecting a provider, you'll be redirected to their website to sign up and validate your account before making the transfer. The entire process typically takes 5–10 minutes for first-time users.
              </p>
              <p class="text-base text-slate-600">
                We're 100% independent—providers cannot pay to rank higher. We earn a small commission when you use our links, but this never affects our rankings. We show you the best deal based on total cost, speed, and reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- How We Test Providers -->
      <section class="mb-16">
        <div class="mb-8 flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 shadow-md">
              <span class="text-3xl">🧪</span>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-slate-900">
                How We Test & Verify Providers
              </h2>
              <p class="mt-1 text-slate-600">
                Real transfers, real receipts, real results
              </p>
            </div>
          </div>
        </div>

        <!-- Methodology Timeline Visual -->
        <div class="mb-8 hidden md:block">
          <div class="relative">
            <div class="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-emerald-200 via-purple-200 via-orange-200 to-slate-200" />
            <div class="relative flex justify-between items-start">
              <div
                class="flex flex-col items-center"
                style="width: 20%"
              >
                <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl shadow-lg mb-3 relative z-10">
                  📊
                </div>
                <div class="text-xs font-semibold text-center text-slate-700">
                  Data Collection
                </div>
              </div>
              <div
                class="flex flex-col items-center"
                style="width: 20%"
              >
                <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl shadow-lg mb-3 relative z-10">
                  💸
                </div>
                <div class="text-xs font-semibold text-center text-slate-700">
                  Real Testing
                </div>
              </div>
              <div
                class="flex flex-col items-center"
                style="width: 20%"
              >
                <div class="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl shadow-lg mb-3 relative z-10">
                  🧮
                </div>
                <div class="text-xs font-semibold text-center text-slate-700">
                  Cost Calculation
                </div>
              </div>
              <div
                class="flex flex-col items-center"
                style="width: 20%"
              >
                <div class="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl shadow-lg mb-3 relative z-10">
                  ⭐
                </div>
                <div class="text-xs font-semibold text-center text-slate-700">
                  Remit Score
                </div>
              </div>
              <div
                class="flex flex-col items-center"
                style="width: 20%"
              >
                <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl shadow-lg mb-3 relative z-10">
                  🔄
                </div>
                <div class="text-xs font-semibold text-center text-slate-700">
                  Ongoing Updates
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Data Collection -->
          <div class="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
                <span class="text-3xl">📊</span>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-slate-900 mb-3">
                  <span class="text-blue-600">1.</span> Data Collection & Verification
                </h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  We start with live exchange rates and fees from provider APIs and websites, then:
                </p>
                <ul class="ml-6 space-y-2 text-slate-700">
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600">→</span>
                    <span>Cross-check them with real transfers we've completed</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600">→</span>
                    <span>Verify licensing and regulation with authorities like the FCA (UK), FinCEN (US), ASIC (AU), and international peers</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600">→</span>
                    <span>Update rates multiple times per day to ensure accuracy</span>
                  </li>
                </ul>
                <p class="mt-4 font-medium text-slate-900">
                  If a provider can't prove it's legit, it doesn't appear. No exceptions.
                </p>
              </div>
            </div>
          </div>

          <!-- Real Transfer Testing -->
          <div class="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 flex-shrink-0">
                <span class="text-3xl">💸</span>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-slate-900 mb-3">
                  <span class="text-emerald-600">2.</span> Real Transfer Testing
                </h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  Whenever possible, we put our own money on the line across:
                </p>
                <ul class="ml-6 space-y-2 text-slate-700">
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600">→</span>
                    <span>Popular corridors like US→India, UK→Pakistan, Canada→Philippines, and more</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600">→</span>
                    <span>Different amounts (small, medium, large transfers)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600">→</span>
                    <span>Bank, cash pickup, and mobile wallet payouts</span>
                  </li>
                </ul>
                <p class="mt-4 text-slate-700">
                  We also test customer support: email, chat, and phone. How quickly do they fix an issue? What happens if a transfer needs to be canceled? Those receipts and screenshots go straight into our reviews.
                </p>
              </div>
            </div>
          </div>

          <!-- Total Cost Calculation -->
          <div class="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 flex-shrink-0">
                <span class="text-3xl">🧮</span>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-slate-900 mb-3">
                  <span class="text-purple-600">3.</span> Total Cost Calculation
                </h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  Most sites stop at the headline fee and ignore hidden FX markups. We don't.
                </p>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  We compare the real "recipient gets" amount to the mid‑market rate (the rate banks give each other). The difference is the hidden markup.
                </p>
                <div class="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-4">
                  <p class="text-sm font-semibold text-purple-900 mb-2">
                    Example:
                  </p>
                  <p class="text-sm text-slate-700 leading-relaxed">
                    If you send <strong>$1,000 USD to India</strong> when the real rate is <strong>83.00 INR</strong> but the provider pays <strong>81.50 INR</strong>, that's <strong class="text-purple-700">₹1,500 gone</strong>. We show:
                  </p>
                  <ul class="mt-3 ml-4 space-y-1 text-sm text-slate-700">
                    <li class="flex items-center gap-2">
                      <span class="text-purple-600">•</span>
                      <span><strong>Total Cost</strong> – Fees + exchange rate markup</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <span class="text-purple-600">•</span>
                      <span><strong>Amount Received</strong> – What your recipient actually gets</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <span class="text-purple-600">•</span>
                      <span><strong>vs Mid-Market Rate</strong> – How much you're losing to hidden markups</span>
                    </li>
                  </ul>
                  <p class="mt-3 text-sm text-slate-700">
                    So you can compare apples to apples.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Remit Score -->
          <div class="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 flex-shrink-0">
                <span class="text-3xl">⭐</span>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-slate-900 mb-3">
                  <span class="text-orange-600">4.</span> Remit Score Rating System
                </h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  We built Remit Score to compress all the messy details into a clear <strong>1–10 rating</strong>.
                </p>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  Each score is made of four equally weighted pillars:
                </p>
                <div class="grid gap-3 sm:grid-cols-2 mb-4">
                  <div class="bg-orange-50 rounded-lg p-4">
                    <p class="text-sm font-semibold text-orange-900 mb-1">
                      Cost (25%)
                    </p>
                    <p class="text-xs text-slate-700">
                      Fees + FX markup versus mid‑market
                    </p>
                  </div>
                  <div class="bg-orange-50 rounded-lg p-4">
                    <p class="text-sm font-semibold text-orange-900 mb-1">
                      Speed (25%)
                    </p>
                    <p class="text-xs text-slate-700">
                      Real delivery times from our test transfers
                    </p>
                  </div>
                  <div class="bg-orange-50 rounded-lg p-4">
                    <p class="text-sm font-semibold text-orange-900 mb-1">
                      Trust & Safety (25%)
                    </p>
                    <p class="text-xs text-slate-700">
                      Licensing, security practices, complaint history
                    </p>
                  </div>
                  <div class="bg-orange-50 rounded-lg p-4">
                    <p class="text-sm font-semibold text-orange-900 mb-1">
                      Customer Experience (25%)
                    </p>
                    <p class="text-xs text-slate-700">
                      Real user feedback, support quality, and product polish
                    </p>
                  </div>
                </div>
                <p class="font-medium text-slate-900">
                  It's not just "who's cheapest." It rewards providers that are fast, reliable, and human-friendly—because saving $2 isn't worth it if the transfer fails on payday.
                </p>
              </div>
            </div>
          </div>

          <!-- Ongoing Updates -->
          <div class="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 flex-shrink-0">
                <span class="text-3xl">🔄</span>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-slate-900 mb-3">
                  <span class="text-slate-600">5.</span> Ongoing Monitoring & Updates
                </h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  Rates move. Fees change. Rules evolve. So we:
                </p>
                <ul class="ml-6 space-y-2 text-slate-700">
                  <li class="flex items-start gap-2">
                    <span class="text-slate-600">→</span>
                    <span>Refresh provider data multiple times a day</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-slate-600">→</span>
                    <span>Revisit Remit Scores on a regular schedule</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-slate-600">→</span>
                    <span>Update reviews when users report slow deliveries, surprise fees, or support issues (and after we've verified with the provider)</span>
                  </li>
                </ul>
                <p class="mt-4 font-medium text-slate-900">
                  The goal: when you compare today, you're seeing today's reality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Why You Can Trust Us -->
      <section class="mb-16">
        <h2 class="mb-6 text-3xl font-bold text-slate-900">
          Why You Can Trust Us
        </h2>
        <div class="space-y-6 text-lg leading-relaxed text-slate-700">
          <p>
            You're probably all too familiar with the often <strong class="font-semibold text-slate-900">outrageous cost of sending money abroad</strong>. After facing this frustration themselves as expats, Remit-Scout's founder built a real-time comparison engine to compare the best money transfer services worldwide.
          </p>
          <p>
            Today, Remit-Scout's award-winning comparisons, reviews, and guides are <strong class="font-semibold text-slate-900">trusted by {{ SITE_STATS.users.display }} users</strong> each year. Our recommendations are backed by our comparison data and dozens of expert tests, allowing you to confidently make the savviest decisions.
          </p>
        </div>

        <div class="mt-8 grid gap-6 sm:grid-cols-3">
          <div class="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <svg
                class="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 class="mb-2 text-lg font-semibold text-slate-900">
              {{ SITE_STATS.users.display }} people across the globe trust Remit-Scout
            </h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              Join thousands of expats who use our platform to find the best rates and save money on every transfer.
            </p>
          </div>

          <div class="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <svg
                class="h-6 w-6 text-emerald-600"
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
            </div>
            <h3 class="mb-2 text-lg font-semibold text-slate-900">
              Remit-Scout's experts spend hours researching and testing services
            </h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              We run real transfers, verify licensing, and test customer support to ensure our recommendations are accurate.
            </p>
          </div>

          <div class="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <svg
                class="h-6 w-6 text-purple-600"
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
            <h3 class="mb-2 text-lg font-semibold text-slate-900">
              Commissions we may receive never impact our independence
            </h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              Providers cannot pay to rank higher. Our rankings are based purely on data: total cost, speed, reliability, and user experience.
            </p>
          </div>
        </div>
      </section>

      <!-- Independence Statement -->
      <section class="mb-16 rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 lg:p-12">
        <div class="flex items-center gap-4 mb-6">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <svg
              class="h-7 w-7"
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
          <h2 class="text-3xl font-bold text-slate-900">
            100% Independent & Transparent
          </h2>
        </div>

        <div class="space-y-4 text-base leading-relaxed text-slate-700">
          <p>
            <strong class="font-semibold text-slate-900">Rankings are never for sale.</strong> We earn affiliate commissions when you click through and complete a transfer, but these partnerships never influence our rankings or recommendations.
          </p>
          <p>
            Sponsored/Partner content is clearly labeled. Affiliate revenue does not influence our rankings or reviews. We're a comparison tool, not a bank and not your financial advisor. The final decision—and the actual transfer—always happens between you and the provider you choose.
          </p>
          <p class="font-medium text-slate-900">
            Our job is to make that choice as clear and fair as possible.
          </p>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 lg:p-12 text-center text-white shadow-2xl">
        <h2 class="mb-3 text-3xl font-bold lg:text-4xl">
          Ready to save on your next transfer?
        </h2>
        <p class="mx-auto mb-8 max-w-2xl text-lg text-blue-100 [text-wrap:pretty]">
          Compare live rates from {{ SITE_STATS.providers.display }} licensed providers in seconds. See exactly how much your recipient will get—no hidden fees, no marketing fluff.
        </p>
        <NuxtLink
          to="/send-money/us-to-in"
          class="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-xl"
        >
          Start Comparing Rates
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import { SITE_STATS } from '~/config/stats'

const router = useRouter()

const compareForm = ref({
  from: 'US',
  to: '',
  amount: 500,
  fromCurrency: 'USD',
  toCurrency: 'USD',
})

const isCompareValid = computed(() => {
  return compareForm.value.from
    && compareForm.value.to
    && compareForm.value.from !== compareForm.value.to
})

const handleCompare = () => {
  if (isCompareValid.value) {
    router.push(`/send-money/${compareForm.value.from.toLowerCase()}-to-${compareForm.value.to.toLowerCase()}`)
  }
}

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Legal', path: '/legal' },
  { name: 'Methodology', path: '/legal/methodology' },
]

const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Our Methodology | How We Compare Money Transfer Providers | Remit-Scout',
  description: 'Learn how Remit-Scout compares money transfer providers. Our transparent methodology uses real transfers, verified data, and independent testing to help you find the best rates.',
  canonical: `${siteUrl}/legal/methodology`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Legal', url: `${siteUrl}/legal` },
  { name: 'Methodology', url: `${siteUrl}/legal/methodology` },
])
</script>
