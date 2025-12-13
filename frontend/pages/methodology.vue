<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section with improved design -->
    <section class="relative bg-white py-16 lg:py-20">
      <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-10 grid gap-12 lg:grid-cols-2 lg:items-center">
          <!-- Left Column: Content -->
          <div class="space-y-8">
          <!-- Trust badges -->
          <div class="flex flex-wrap gap-3">
            <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-md ring-1 ring-blue-200/50">
                <span>🛡️</span>
              No pay-to-rank
            </div>
            <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-md ring-1 ring-emerald-200/50">
                <span>🧪</span>
              Spot-check testing
            </div>
            <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-md ring-1 ring-blue-200/50">
                <span>📊</span>
              Live pricing data
            </div>
          </div>

            <div>
              <h1 class="text-4xl font-bold leading-tight text-neutral-900 sm:text-5xl">
            How We Compare Money Transfer Providers
          </h1>

              <p class="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-600">
            Transparent, data-driven methodology built by expats who got tired of losing money to hidden fees
          </p>
            </div>

            <!-- Stats -->
          <div class="flex flex-wrap gap-4 pt-4">
            <div class="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <div class="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <span>🏦</span>
                <span>{{ SITE_STATS.providers.display }}</span>
              </div>
              <div class="text-sm text-neutral-600">
                Licensed Providers
              </div>
            </div>

            <div class="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
              <div class="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                <span>🌍</span>
                <span>{{ SITE_STATS.corridors.display }}</span>
              </div>
              <div class="text-sm text-neutral-600">
                Money Corridors
              </div>
            </div>

            <div class="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <div class="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <span>💰</span>
                <span>{{ SITE_STATS.totalSaved.display }}</span>
              </div>
              <div class="text-sm text-neutral-600">
                Saved by Users
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Compare Form -->
          <div>
            <div class="relative overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-2xl">
              <div class="border-b border-blue-100 bg-brand-600 px-6 py-4 text-center">
                <h3 class="text-lg font-bold text-white">
                  Find Your Best Rate Now
                </h3>
                <p class="text-sm text-white/90">
                  Compare live rates from {{ SITE_STATS.providers.display }} providers
                </p>
              </div>

              <form
                class="p-6 space-y-4"
                @submit.prevent="handleMoneySubmit"
              >
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      for="from-country"
                      class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Sending from
                    </label>
                    <CountrySelect
                      id="from-country"
                      v-model="moneyForm.from"
                      label="Sending from"
                      placeholder="United States"
                    />
                  </div>

                  <div>
                    <label
                      for="to-country"
                      class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Receiving in
                    </label>
                    <CountrySelect
                      id="to-country"
                      v-model="moneyForm.to"
                      label="Receiving in"
                      placeholder="Select country"
                    />
                  </div>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      for="from-currency"
                      class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      From currency
                    </label>
                    <CurrencySelect
                      id="from-currency"
                      v-model="moneyForm.fromCurrency"
                      :country-code="moneyForm.from"
                      placeholder="USD"
                    />
                  </div>

                  <div>
                    <label
                      for="to-currency"
                      class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      To currency
                    </label>
                    <CurrencySelect
                      id="to-currency"
                      v-model="moneyForm.toCurrency"
                      :country-code="moneyForm.to"
                      :placeholder="moneyForm.to ? 'Select currency' : 'Select country first'"
                      :disabled="!moneyForm.to"
                    />
                  </div>
                </div>

                <div>
                  <label
                    for="amount"
                    class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Amount to send
                  </label>
                  <input
                    id="amount"
                    v-model.number="moneyForm.amount"
                    type="number"
                    min="1"
                    step="1"
                    class="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 transition-colors focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    placeholder="500"
                  >
                </div>

                <button
                  type="submit"
                  class="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 shadow-lg hover:shadow-xl"
                >
                  Compare Rates
                </button>
              </form>

              <div class="border-t border-blue-100 bg-blue-50 px-6 py-4">
                <div class="text-sm text-slate-600">
                  <p class="leading-relaxed">
                    Typical savings vs. banks: <strong class="font-semibold text-slate-900">3–9% per transfer</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main content -->
    <div class="container mx-auto max-w-6xl px-4 py-20 space-y-24">
      <!-- Compare Providers Section -->
      <section
        id="providers"
        class="scroll-mt-20"
      >
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 rounded-full bg-brand-600/10 px-4 py-2 text-sm font-semibold text-brand-700 mb-6">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Our Comparison Engine
          </div>
          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-6">
            Compare Money Transfer Providers.<br>Find the Best Deal in Seconds.
          </h2>
          <p class="text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed mb-6">
            We analyze real-time exchange rates, transfer fees, delivery speeds, and reliability scores across <strong class="font-semibold text-neutral-900">{{ SITE_STATS.providers.display }} licensed providers</strong>. Our transparent rankings help you save money on every international transfer.
          </p>
          <p class="text-base text-neutral-600 max-w-3xl mx-auto">
            <NuxtLink
              to="/send-money"
              class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30 hover:decoration-brand-700"
            >See all of our supported countries and their corridors</NuxtLink>
          </p>
        </div>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div class="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
              <span class="text-3xl">📊</span>
            </div>
            <h3 class="text-xl font-bold text-neutral-900 mb-3">
              Real-Time Exchange Rates
            </h3>
            <p class="text-neutral-600 leading-relaxed mb-3 flex-grow">
              We compare live rates across all providers to show you the best value for your money. Our engine updates constantly so you always see current rates.
            </p>
            <NuxtLink
              to="/learn/how-exchange-rates-work"
              class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 mt-auto"
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

          <div class="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
              <span class="text-3xl">💸</span>
            </div>
            <h3 class="text-xl font-bold text-neutral-900 mb-3">
              Transfer Fees & Hidden Costs
            </h3>
            <p class="text-neutral-600 leading-relaxed mb-3 flex-grow">
              We show you the total cost—not just the headline fee, but also the hidden exchange rate markups that can cost you hundreds.
            </p>
            <NuxtLink
              to="/learn/how-to-avoid-hidden-fees"
              class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 mt-auto"
            >
              Learn about hidden fees
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

          <div class="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
              <span class="text-3xl">⚡</span>
            </div>
            <h3 class="text-xl font-bold text-neutral-900 mb-3">
              Delivery Speeds
            </h3>
            <p class="text-neutral-600 leading-relaxed mb-3 flex-grow">
              We track actual delivery times from real transfers, not marketing promises. See how fast your money actually arrives.
            </p>
            <NuxtLink
              to="/learn/fastest-way-to-send-money-internationally"
              class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 mt-auto"
            >
              Fastest transfer methods
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

          <div class="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
              <span class="text-3xl">✅</span>
            </div>
            <h3 class="text-xl font-bold text-neutral-900 mb-3">
              Availability & Quote Success
            </h3>
            <p class="text-neutral-600 leading-relaxed mb-3 flex-grow">
              We track quote success rate, data freshness, and pricing stability. Spot checks on selected corridors validate provider claims where feasible.
            </p>
            <NuxtLink
              to="/providers"
              class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 mt-auto"
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
      </section>

      <!-- Remit Score Section -->
      <section class="scroll-mt-20">
        <div class="bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-200 rounded-3xl p-8 lg:p-12">
          <div class="mb-8">
            <div class="flex items-start gap-4 mb-6">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center">
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
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
                  How We Score Providers
                </h2>
                <p class="text-base text-neutral-700 mb-3 max-w-3xl leading-relaxed">
                  Each provider gets a <span class="font-semibold">Remit-Score</span> (0-10 scale) based on real transfer data, not paid reviews.
                  Scores like <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-500 text-brand-600 font-bold text-sm mx-1">9.5</span>,
                  <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-500 text-brand-600 font-bold text-sm mx-1">8.4</span>, or
                  <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-500 text-brand-600 font-bold text-sm mx-1">7.2</span>
                  represent the overall quality and value you can expect from each provider for your specific transfer.
                </p>
                <p class="text-sm text-neutral-600 max-w-2xl">
                  See how top providers like
                  <NuxtLink
                    to="/providers/wise"
                    class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30"
                  >Wise</NuxtLink>,
                  <NuxtLink
                    to="/providers/remitly"
                    class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30"
                  >Remitly</NuxtLink>, and
                  <NuxtLink
                    to="/providers/western-union"
                    class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30"
                  >Western Union</NuxtLink> score.
                </p>
              </div>
            </div>
          </div>

          <div class="max-w-4xl mx-auto">
            <div class="space-y-4">
              <h3 class="text-xl font-bold text-neutral-900 mb-4 text-center">
                Rating Categories & Weights
              </h3>
              <div class="space-y-4">
                <div class="border border-neutral-200 rounded-lg bg-white p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-neutral-900">
                      Delivered Value
                    </h4>
                    <span class="text-brand-600 font-bold text-lg">40%</span>
                  </div>
                  <p class="text-sm text-neutral-600">
                    Effective cost (FX spread + fees), how often provider is cheapest, and quote vs. actual delivery accuracy
                  </p>
                  <div class="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full"
                      style="width: 40%"
                    />
                  </div>
                </div>

                <div class="border border-neutral-200 rounded-lg bg-white p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-neutral-900">
                      Reliability & Success
                    </h4>
                    <span class="text-brand-600 font-bold text-lg">20%</span>
                  </div>
                  <p class="text-sm text-neutral-600">
                    Quote success rate, data freshness, pricing stability (where available)
                  </p>
                  <div class="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full"
                      style="width: 20%"
                    />
                  </div>
                </div>

                <div class="border border-neutral-200 rounded-lg bg-white p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-neutral-900">
                      Friction & Speed
                    </h4>
                    <span class="text-brand-600 font-bold text-lg">15%</span>
                  </div>
                  <p class="text-sm text-neutral-600">
                    ETA where available, speed buckets, observed delivery times on selected corridors
                  </p>
                  <div class="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full"
                      style="width: 15%"
                    />
                  </div>
                </div>

                <div class="border border-neutral-200 rounded-lg bg-white p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-neutral-900">
                      Support & Refunds
                    </h4>
                    <span class="text-brand-600 font-bold text-lg">15%</span>
                  </div>
                  <p class="text-sm text-neutral-600">
                    Refund processing time, dispute resolution SLA, post-resolution satisfaction, and chargeback rate
                  </p>
                  <div class="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full"
                      style="width: 15%"
                    />
                  </div>
                </div>

                <div class="border border-neutral-200 rounded-lg bg-white p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-neutral-900">
                      Trust & Safety
                    </h4>
                    <span class="text-brand-600 font-bold text-lg">10%</span>
                  </div>
                  <p class="text-sm text-neutral-600">
                    Public licensing checks where available, regulatory register verification
                  </p>
                  <div class="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full"
                      style="width: 10%"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Why Compare Section -->
      <section class="scroll-mt-20">
        <div class="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-10 lg:p-14 shadow-lg">
          <div class="flex items-start gap-4 mb-8">
            <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 shadow-lg">
              <svg
                class="h-6 w-6 text-white"
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
            <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900">
              Why You Need to Compare Before Every Transfer
            </h2>
          </div>
          <div class="space-y-6 text-base leading-relaxed text-neutral-700">
            <p>
              Just like you wouldn't book a flight or hotel without comparing prices, you shouldn't send money abroad without checking your options first. The difference between providers can be <strong class="font-bold text-brand-600">hundreds of dollars</strong> on a single transfer—money that could go to your family instead of fees and hidden markups.
            </p>
            <p>
              Traditional banks and even some "low fee" providers hide their real costs in exchange rate markups. A provider might advertise "$0 fees" but charge you 3–5% more than the real exchange rate. That's why we show you the <strong class="font-bold text-neutral-900">actual amount your recipient will receive</strong>—the only number that actually matters.
            </p>
            <p>
              Remit-Scout helps you find the best deal by comparing live rates, total costs, and delivery speeds from <NuxtLink
                to="/providers"
                class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30"
              >{{ SITE_STATS.providers.display }} licensed providers</NuxtLink>. We test, verify, and explain every option so you can send with confidence. Learn more about us on our <NuxtLink
                to="/about"
                class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30"
              >about page</NuxtLink>.
            </p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="scroll-mt-20">
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-4 py-2 text-sm font-semibold text-emerald-700 mb-6">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Step by Step Process
          </div>
          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            How Our Comparison Works
          </h2>
          <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
            Three simple steps to find the best deal for your international transfer
          </p>
        </div>

        <div class="space-y-8">
          <div class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 shadow-lg transition-all hover:shadow-2xl">
            <div class="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-brand-600/10 blur-2xl" />
            <div class="relative flex items-start gap-8">
              <div class="flex-shrink-0">
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
                  <span class="text-3xl">📝</span>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-neutral-900 mb-3">
                  <span class="whitespace-nowrap">1. Enter your</span> <span class="whitespace-nowrap">transfer details</span>
                </h3>
                <p class="text-neutral-700 leading-relaxed mb-3">
                  Tell us where you're sending money from, where the money's going, and how much. We'll instantly show you live quotes from <NuxtLink
                    to="/providers"
                    class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30"
                  >{{ SITE_STATS.providers.display }} licensed providers</NuxtLink>.
                </p>
                <p class="text-sm text-neutral-600">
                  Our comparison engine fetches current rates and fees in real-time. <span class="whitespace-nowrap">Takes 30 seconds.</span>
                </p>
              </div>
            </div>
          </div>

          <div class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 shadow-lg transition-all hover:shadow-2xl">
            <div class="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-emerald-600/10 blur-2xl" />
            <div class="relative flex items-start gap-8">
              <div class="flex-shrink-0">
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
                  <span class="text-3xl">🔍</span>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-neutral-900 mb-3">
                  <span class="whitespace-nowrap">2. Compare & choose the</span> <span class="whitespace-nowrap">best provider</span>
                </h3>
                <p class="text-neutral-700 leading-relaxed mb-4">
                  Our comparison engine shows results organized by transfer type (bank account, cash pick-up, mobile wallet) and ranked from cheapest to most expensive based on what your recipient actually receives.
                </p>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="flex items-start gap-2 rounded-lg bg-brand-50 p-3">
                    <span class="text-base">⚡</span>
                    <span class="text-sm text-neutral-700"><strong class="font-semibold">Transfer speed</strong> – Minutes to days</span>
                  </div>
                  <div class="flex items-start gap-2 rounded-lg bg-brand-50 p-3">
                    <span class="text-base">💳</span>
                    <span class="text-sm text-neutral-700"><strong class="font-semibold">Payment method</strong> – Bank, card, etc.</span>
                  </div>
                  <div class="flex items-start gap-2 rounded-lg bg-brand-50 p-3">
                    <span class="text-base">⭐</span>
                    <span class="text-sm text-neutral-700"><strong class="font-semibold">Remit-Score</strong> – Independent rating</span>
                  </div>
                  <div class="flex items-start gap-2 rounded-lg bg-brand-50 p-3">
                    <span class="text-base">💰</span>
                    <span class="text-sm text-neutral-700"><strong class="font-semibold">Total cost</strong> – Fees + markup</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 shadow-lg transition-all hover:shadow-2xl">
            <div class="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-orange-600/10 blur-2xl" />
            <div class="relative flex items-start gap-8">
              <div class="flex-shrink-0">
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
                  <span class="text-3xl">✅</span>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-neutral-900 mb-3">
                  <span class="whitespace-nowrap">3. Send money and save</span>
                </h3>
                <p class="text-neutral-700 leading-relaxed mb-4">
                  After selecting a provider, you'll be redirected to their website to sign up and validate your account before making the transfer. <span class="whitespace-nowrap">Takes 5–10 minutes</span> for first-time users.
                </p>
                <div class="rounded-xl border border-brand-200 bg-brand-50 p-5">
                  <div class="flex items-start gap-3">
                    <svg
                      class="h-6 w-6 flex-shrink-0 text-brand-600 mt-0.5"
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
                    <p class="text-sm text-neutral-700 leading-relaxed">
                      <strong class="font-bold text-neutral-900"><span class="whitespace-nowrap">100% Independent</span> & Free:</strong> We earn a small commission when you use our links, but this never affects our rankings. <span class="whitespace-nowrap">We show you the best deal</span> based on total cost, speed, and reliability. Read more about <NuxtLink
                        to="/how-we-make-money"
                        class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30"
                      >how we make money</NuxtLink>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Testing Methodology -->
      <section class="scroll-mt-20">
        <div class="rounded-3xl border-2 border-slate-200 bg-white p-10 lg:p-16 shadow-xl">
          <div class="text-center mb-14">
            <div class="inline-flex items-center gap-2 rounded-full bg-purple-600/10 px-4 py-2 text-sm font-semibold text-purple-700 mb-6">
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
            <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              How We Test & Verify Providers
            </h2>
            <p class="text-lg text-neutral-600 max-w-3xl mx-auto">
              Spot-check validation on selected corridors and methods
            </p>
          </div>

          <div class="grid gap-8 lg:grid-cols-3">
            <div class="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 hover:shadow-lg transition-shadow">
              <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 shadow-md">
                <span class="text-3xl">📊</span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-4">
                Data Collection
              </h3>
            <p class="text-sm text-slate-600 leading-relaxed mb-4">
              We collect live <NuxtLink
                to="/exchange-rates"
                class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30"
              >exchange rates</NuxtLink> and fees from provider APIs, then validate with spot-check transfers on selected corridors.
            </p>
              <ul class="space-y-3 text-sm text-slate-600">
                <li class="flex items-start gap-3">
                <span>🧩</span>
                <span>We check publicly available regulatory registers where applicable</span>
                </li>
                <li class="flex items-start gap-3">
                  <span>🔄</span>
                  <span>Update rates multiple times daily</span>
                </li>
                <li class="flex items-start gap-3">
                  <span>✅</span>
                  <span>Cross-reference with actual transfers</span>
                </li>
              </ul>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 hover:shadow-lg transition-shadow">
              <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 shadow-md">
                <span class="text-3xl">🧪</span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-4">
                Verification
              </h3>
            <p class="text-sm text-slate-600 leading-relaxed mb-4">
              We run periodic test transfers on selected corridors to validate provider claims.
            </p>
              <ul class="space-y-3 text-sm text-slate-600">
                <li class="flex items-start gap-3">
                  <span>🌍</span>
                  <span>Common corridors (US, UK, EU, CA, AU)</span>
                </li>
                <li class="flex items-start gap-3">
                  <span>💵</span>
                  <span>Multiple transfer amounts ($100–$10,000)</span>
                </li>
                <li class="flex items-start gap-3">
                  <span>📱</span>
                  <span>Different payout methods (Bank, Cash, Mobile Money)</span>
                </li>
              </ul>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 hover:shadow-lg transition-shadow">
              <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 shadow-md">
                <span class="text-3xl">📡</span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-4">
                Ongoing Monitoring
              </h3>
              <p class="text-sm text-slate-600 leading-relaxed mb-4">
                We continuously monitor provider rates and reliability to ensure data accuracy.
              </p>
              <ul class="space-y-3 text-sm text-slate-600">
                <li class="flex items-start gap-3">
                  <span>🚨</span>
                  <span>Automated alerts for unusual rate changes</span>
                </li>
                <li class="flex items-start gap-3">
                  <span>⏱️</span>
                  <span>Track delivery time anomalies</span>
                </li>
                <li class="flex items-start gap-3">
                  <span>💬</span>
                  <span>User feedback incorporated weekly</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
	    </section>
	    </div>
	    <!-- Trust Section - E-E-A-T Focused -->
	    <section class="scroll-mt-20">
	      <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 lg:py-20 text-white">
	          <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-10">
              <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
                Why Trust Remit-Scout
              </h2>
              <p class="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
                Experience, Expertise, Authoritativeness, and Trustworthiness verified through real transfers and transparent methodology
              </p>
            </div>

            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
            <!-- Experience -->
            <div class="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                <span class="text-3xl">👥</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">
                Experience
              </h3>
              <p class="text-sm text-white/90 leading-relaxed mb-3">
                Built by expats who send money home regularly. <NuxtLink
                  to="/about"
                  class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                >Learn about our founder</NuxtLink> and spot-check testing across selected corridors.
              </p>
              <div class="text-xs text-white/70">
                {{ SITE_STATS.users.display }} users trust our comparisons
              </div>
            </div>

            <!-- Expertise -->
            <div class="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                <span class="text-3xl">🎓</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">
                Expertise
              </h3>
              <p class="text-sm text-white/90 leading-relaxed mb-3">
                Developed at Carnegie Mellon (Swartz Center for Entrepreneurship). We run spot-check testing across <NuxtLink
                  to="/about"
                  class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                >selected corridors</NuxtLink>. Not affiliated with or endorsed by Carnegie Mellon University.
              </p>
              <div class="text-xs text-white/70">
                Academic rigor applied to every test
              </div>
            </div>

            <!-- Authoritativeness -->
            <div class="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                <span class="text-3xl">✅</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">
                Authoritativeness
              </h3>
              <p class="text-sm text-white/90 leading-relaxed mb-3">
                We check publicly available regulatory registers where applicable and label provider coverage accordingly. See our <NuxtLink
                  to="/legal/disclosure"
                  class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                >affiliate disclosure</NuxtLink> and <NuxtLink
                  to="/legal/privacy"
                  class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                >privacy policy</NuxtLink>.
              </p>
              <div class="text-xs text-white/70">
                Only regulated providers included
              </div>
            </div>

            <!-- Trustworthiness -->
            <div class="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                <span class="text-3xl">🔒</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">
                Trustworthiness
              </h3>
              <p class="text-sm text-white/90 leading-relaxed mb-3">
                No pay-to-rank. <NuxtLink
                  to="/how-we-make-money"
                  class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                >Revenue disclosure</NuxtLink> transparent. Affiliate commissions never influence rankings.
              </p>
              <div class="text-xs text-white/70">
                {{ SITE_STATS.totalSaved.display }} saved by users
              </div>
            </div>
            </div>

            <div class="rounded-2xl border-2 border-white/20 bg-white/10 p-6 backdrop-blur mb-6 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div class="flex items-start gap-4">
                <svg
                  class="h-8 w-8 flex-shrink-0 text-white mt-1"
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
                <div>
                  <h3 class="text-xl font-bold mb-2">
                    Transparency & Verification
                  </h3>
                  <p class="text-sm text-white/90 leading-relaxed mb-3">
                    Every comparison is backed by spot-check transfer data. Methodology reviewed by <NuxtLink
                      to="/about"
                      class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                    >Omar Ghabayen</NuxtLink>. See our <NuxtLink
                      to="/legal/disclosure"
                      class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                    >affiliate disclosure</NuxtLink> and <NuxtLink
                      to="/legal/privacy"
                      class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                    >privacy policy</NuxtLink>.
                  </p>
                </div>
              </div>
            </div>

            <!-- Internal Links for E-E-A-T -->
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-center mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <NuxtLink
                to="/about"
                class="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                About the Founder
              </NuxtLink>
              <NuxtLink
                to="/how-we-make-money"
                class="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Revenue Model
              </NuxtLink>
              <NuxtLink
                to="/providers"
                class="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Verified Providers
              </NuxtLink>
              <NuxtLink
                to="/faq"
                class="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                FAQs
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

    <!-- Guides Section -->
    <div class="container mx-auto max-w-6xl px-4 py-20">
      <section class="scroll-mt-20">
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-700 mb-4">
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Learning Resources
          </div>
          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Check Out Our Guides & Save More
          </h2>
          <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
            Learn how to send money abroad smarter with our expert guides on exchange rates, fees, and choosing the right provider
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            to="/learn/how-to-avoid-hidden-fees"
            class="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all hover:shadow-2xl hover:border-brand-300"
          >
            <div class="aspect-video bg-gradient-to-br from-brand-600/20 to-blue-50 relative overflow-hidden">
              <div class="absolute inset-0 flex items-center justify-center">
                <svg
                  class="h-20 w-20 text-brand-600/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">
                How to Avoid Hidden Exchange Rate Fees
              </h3>
              <p class="text-sm text-slate-500 mb-3">November 2024 · Remit-Scout Team</p>
              <p class="text-sm text-slate-600 leading-relaxed">
                Learn how banks and providers hide fees in exchange rate markups and how to spot them before you send money abroad.
              </p>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/learn/fastest-way-to-send-money-internationally"
            class="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all hover:shadow-2xl hover:border-emerald-300"
          >
            <div class="aspect-video bg-gradient-to-br from-emerald-600/20 to-emerald-50 relative overflow-hidden">
              <div class="absolute inset-0 flex items-center justify-center">
                <svg
                  class="h-20 w-20 text-emerald-600/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                Fastest Way to Send Money Internationally
              </h3>
              <p class="text-sm text-slate-500 mb-3">November 2024 · Remit-Scout Team</p>
              <p class="text-sm text-slate-600 leading-relaxed">
                Need to send money urgently? Discover the fastest transfer methods and which providers deliver in minutes vs. days.
              </p>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/learn/bank-vs-money-transfer-service"
            class="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all hover:shadow-2xl hover:border-purple-300"
          >
            <div class="aspect-video bg-gradient-to-br from-purple-600/20 to-purple-50 relative overflow-hidden">
              <div class="absolute inset-0 flex items-center justify-center">
                <svg
                  class="h-20 w-20 text-purple-600/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                Bank vs. Money Transfer Service
              </h3>
              <p class="text-sm text-slate-500 mb-3">November 2024 · Remit-Scout Team</p>
              <p class="text-sm text-slate-600 leading-relaxed">
                Compare the real costs and speeds of traditional banks versus specialist money transfer services to find the best option.
              </p>
            </div>
          </NuxtLink>
        </div>

        <div class="mt-10 text-center">
          <NuxtLink
            to="/learn"
            class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-base font-bold text-white transition-all hover:bg-slate-800 shadow-lg hover:shadow-xl"
          >
            View All Guides
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
        </div>
      </section>
    </div>
  </div>

  <!-- Final CTA -->
  <section class="bg-gradient-to-r from-brand-600 via-blue-600 to-brand-700 py-16 lg:py-20">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 class="text-3xl font-bold mb-4 sm:text-4xl lg:text-5xl">
            Ready to Save on Your Next Transfer?
          </h2>
          <p class="mx-auto mb-8 max-w-2xl text-lg text-white/95 leading-relaxed">
            Compare live rates from {{ SITE_STATS.providers.display }} licensed providers in seconds. See exactly how much your recipient will get—no hidden fees, no marketing fluff.
          </p>
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-3 rounded-xl bg-white px-10 py-5 text-lg font-bold text-brand-600 transition-all hover:bg-slate-50 hover:scale-105 shadow-2xl"
          >
            Start Comparing Rates Now
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </NuxtLink>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'
import { useCompareForm } from '~/composables/useCompareForm'
import { useRemittanceApi } from '~/composables/useRemittanceApi'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import { SITE_STATS } from '~/config/stats'

const { form: moneyForm, validationError, submit: submitForm } = useCompareForm()
const formError = validationError
const { recordSearch } = useRemittanceApi()

const handleMoneySubmit = async () => {
  const { from, to, amount, method } = moneyForm.value

  try {
    await recordSearch({
      from_country: from,
      to_country: to,
      amount,
      method,
    } as any)
  }
  catch {
  }

  await submitForm()
}

const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Our Methodology | How We Compare Money Transfer Providers | Remit-Scout',
  description: 'Learn how Remit-Scout compares money transfer providers. Our transparent methodology uses real transfers, verified data, and independent testing to help you find the best rates.',
  canonical: `${siteUrl}/methodology`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Methodology', url: `${siteUrl}/methodology` },
])

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Methodology', path: '/methodology' },
]
</script>

<style scoped>
@keyframes drawPath {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
