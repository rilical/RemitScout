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
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                No pay-to-rank
              </div>
              <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-md ring-1 ring-emerald-200/50">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Spot-check testing
              </div>
              <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-md ring-1 ring-blue-200/50">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Live pricing data
              </div>
            </div>

            <div>
              <h1 class="text-4xl font-bold leading-tight text-neutral-900 sm:text-5xl">
                How We Compare Money Transfer Providers
              </h1>

              <p class="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-600">
                A transparent methodology for comparing fees, FX markup, delivery options, and the outcome that matters: what your recipient should receive.
              </p>
              <p class="mt-4 text-sm text-neutral-600">
                Last updated:
                <time :datetime="lastUpdatedIso">{{ lastUpdatedLabel }}</time>
              </p>
            </div>

            <!-- Stats -->
            <div class="flex flex-wrap gap-4 pt-4">
              <div class="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
                <div class="flex items-center gap-2 text-2xl font-bold text-blue-600">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{{ SITE_STATS.providers.display }}</span>
                </div>
                <div class="text-sm text-neutral-600">
                  Licensed Providers
                </div>
              </div>

              <div class="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
                <div class="flex items-center gap-2 text-2xl font-bold text-brand-600">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ SITE_STATS.corridors.display }}</span>
                </div>
                <div class="text-sm text-neutral-600">
                  Money Corridors
                </div>
              </div>

              <div class="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
                <div class="flex items-center gap-2 text-2xl font-bold text-blue-600">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
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

    <!-- Compare Providers Section -->
    <section
      id="providers"
      class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
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
            Our comparison engine
          </h2>
          <p class="text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed mb-6">
            We collect live quotes, normalize total cost (fees + FX markup), and rank providers by the delivered outcome: <strong class="font-semibold text-neutral-900">recipient gets</strong>.
            We cover <strong class="font-semibold text-neutral-900">{{ SITE_STATS.providers.display }}</strong> providers across <strong class="font-semibold text-neutral-900">{{ SITE_STATS.corridors.display }}</strong> corridors, with data freshness that varies by corridor and payment method.
          </p>
          <p class="text-base text-neutral-600 max-w-3xl mx-auto">
            <NuxtLink
              to="/send-money"
              class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30 hover:decoration-brand-700"
            >See all of our supported countries and their corridors</NuxtLink>
          </p>
        </div>

        <div class="mx-auto max-w-5xl mt-10">
          <p class="mt-4 mb-10 leading-relaxed text-neutral-700">
            Remit-Scout is an independent comparison platform. We don’t move or hold your money. Transfers happen directly with the licensed provider you choose.
            We earn trust by publishing how we source quotes, how we rank results, and how we handle corrections.
          </p>
        </div>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div class="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
              <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-neutral-900 mb-3">
              Real-Time Exchange Rates
            </h3>
            <p class="text-neutral-600 leading-relaxed mb-3 flex-grow">
              We capture quotes frequently on top corridors, and less frequently on long-tail corridors. Every quote is timestamped so you can judge freshness.
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
              <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-neutral-900 mb-3">
              Transfer Fees & Hidden Costs
            </h3>
            <p class="text-neutral-600 leading-relaxed mb-3 flex-grow">
              We show total cost, not just the headline fee. That includes FX markup, which can quietly outweigh a “low fee” claim.
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
              <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-neutral-900 mb-3">
              Availability & Quote Success
            </h3>
            <p class="text-neutral-600 leading-relaxed mb-3 flex-grow">
              We track quote success rate, data freshness, and pricing stability. When feasible, we run spot-check transfers on selected corridors to validate what we see in quotes.
            </p>
            <NuxtLink
              to="/learn/providers"
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
      </div>
    </section>

    <!-- Remit Score Section -->
    <section class="py-16 lg:py-20 bg-white scroll-mt-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="bg-gradient-to-r from-brand-50 to-blue-50 border-2 border-brand-200 rounded-3xl p-8 lg:p-12">
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
                  Each provider gets a <span class="font-semibold">Remit-Score</span> (0–10 scale) based on quote data and reliability signals, not paid reviews.
                  Scores like <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-500 text-brand-600 font-bold text-sm mx-1">9.5</span>,
                  <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-500 text-brand-600 font-bold text-sm mx-1">8.4</span>, or
                  <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-500 text-brand-600 font-bold text-sm mx-1">7.2</span>
                  represent the overall quality and value you can expect from each provider for your specific transfer.
                </p>
                <p class="text-sm text-neutral-600 max-w-2xl">
                  See how top providers like
                  <NuxtLink
                    to="/learn/providers/wise"
                    class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30"
                  >Wise</NuxtLink>,
                  <NuxtLink
                    to="/learn/providers/remitly"
                    class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30"
                  >Remitly</NuxtLink>, and
                  <NuxtLink
                    to="/learn/providers/western-union"
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
                    Total cost (fees + FX markup) and how often a provider delivers the best outcome for the scenario shown.
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
                    Quote success rate, data freshness, and pricing stability (where available).
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
                    ETA where available, speed buckets, and observed delivery times on selected corridors (when tested).
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
                    Published policies, support availability, and refund experience signals (where available).
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
                    Public licensing checks where available and basic compliance and safety signals.
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
      </div>
    </section>

    <!-- Show Your Work Section -->
    <section class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-brand-600 shadow-lg mb-6">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 class="text-4xl sm:text-5xl font-bold text-neutral-900 mb-6">
            Show Your Work
          </h2>
          <p class="text-xl leading-relaxed text-neutral-700 max-w-4xl mx-auto [text-wrap:pretty]">
            No black box. This is what we measure, how we calculate “recipient gets,” how we handle freshness, and what can change at checkout.
          </p>
        </div>

        <!-- Editorial & Independence -->
        <div class="mb-12">
          <div class="rounded-3xl border-2 border-brand-200 bg-white p-10 lg:p-12 shadow-lg">
            <div class="flex items-start gap-6 mb-8">
              <div class="flex-shrink-0">
                <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100">
                  <svg class="w-9 h-9 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
                  Editorial &amp; Independence
                </h3>
                <p class="text-lg leading-relaxed text-neutral-700 mb-6">
                  Rankings are driven by data, not payments. Providers can’t buy placement, and affiliate commissions never change ranking logic.
                </p>
                <div class="grid gap-4 sm:grid-cols-3 mb-8">
                  <div class="rounded-xl border border-brand-200 bg-brand-50 p-5">
                    <div class="flex items-center gap-3 mb-2">
                      <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 class="font-semibold text-neutral-900">
                        No pay-to-rank
                      </h4>
                    </div>
                    <p class="text-sm text-neutral-700 leading-relaxed">
                      Providers cannot pay to appear higher or improve Remit‑Score.
                    </p>
                  </div>
                  <div class="rounded-xl border border-brand-200 bg-brand-50 p-5">
                    <div class="flex items-center gap-3 mb-2">
                      <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 class="font-semibold text-neutral-900">
                        Affiliate transparency
                      </h4>
                    </div>
                    <p class="text-sm text-neutral-700 leading-relaxed">
                      We may earn commissions, but they never affect ranking or Remit-Score.
                    </p>
                  </div>
                  <div class="rounded-xl border border-brand-200 bg-brand-50 p-5">
                    <div class="flex items-center gap-3 mb-2">
                      <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 class="font-semibold text-neutral-900">
                        We don't move money
                      </h4>
                    </div>
                    <p class="text-sm text-neutral-700 leading-relaxed">
                      Transfers happen on provider websites/apps, not through us.
                    </p>
                  </div>
                </div>
                <div class="flex flex-wrap gap-4">
                  <NuxtLink
                    to="/how-we-make-money"
                    class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    <BanknotesIcon class="h-5 w-5" />
                    How we make money
                  </NuxtLink>
                  <NuxtLink
                    to="/affiliate-disclosure"
                    class="inline-flex items-center gap-2 rounded-xl border-2 border-brand-200 bg-white px-6 py-3 text-base font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                  >
                    <DocumentTextIcon class="h-5 w-5" />
                    Affiliate disclosure
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="mb-12">
          <div class="rounded-3xl border-2 border-neutral-200 bg-white p-10 lg:p-12 shadow-lg">
            <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-8 text-center">
              Frequently Asked Questions
            </h3>
            <div class="relative z-10">
              <FaqAccordion :faqs="showYourWorkFaqs" />
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NuxtLink
            to="/pulse"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-brand-300 hover:shadow-lg hover:-translate-y-1"
          >
            <div class="mb-3">
              <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 class="font-semibold text-neutral-900 mb-2">Explore Pulse</h4>
            <p class="text-sm text-neutral-600">Market trends and insights</p>
          </NuxtLink>
          <NuxtLink
            to="/providers"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-brand-300 hover:shadow-lg hover:-translate-y-1"
          >
            <div class="mb-3">
              <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h4 class="font-semibold text-neutral-900 mb-2">Verified Providers</h4>
            <p class="text-sm text-neutral-600">See all licensed providers</p>
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-brand-300 hover:shadow-lg hover:-translate-y-1"
          >
            <div class="mb-3">
              <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h4 class="font-semibold text-neutral-900 mb-2">About the Founder</h4>
            <p class="text-sm text-neutral-600">Our story and mission</p>
          </NuxtLink>
          <NuxtLink
            to="/contact"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-brand-300 hover:shadow-lg hover:-translate-y-1"
          >
            <div class="mb-3">
              <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 class="font-semibold text-neutral-900 mb-2">Report a problem</h4>
            <p class="text-sm text-neutral-600">Help us improve accuracy</p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Educational Example Section -->
    <section class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <BankVsSpecialistDynamic />
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-16 lg:py-20 bg-white scroll-mt-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
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
            Three steps to compare a corridor
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-3">
          <div class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-lg transition-all hover:shadow-2xl">
            <div class="flex flex-col h-full">
              <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
                <svg class="w-9 h-9 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-neutral-900 mb-3">
                1. Enter your transfer details
              </h3>
              <p class="text-neutral-700 leading-relaxed mb-3 flex-1">
                Tell us where you’re sending from, where you’re sending to, and how much. We’ll show the latest available quotes from <NuxtLink
                  to="/learn/providers"
                  class="font-semibold text-brand-600 hover:text-brand-700 underline decoration-brand-600/30"
                >{{ SITE_STATS.providers.display }} licensed providers</NuxtLink>.
              </p>
              <p class="text-sm text-neutral-600">
                Quote availability and freshness vary by corridor, provider, and payment method.
              </p>
            </div>
          </div>

          <div class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-lg transition-all hover:shadow-2xl">
            <div class="flex flex-col h-full">
              <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
                <svg class="w-9 h-9 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-neutral-900 mb-3">
                2. Compare and choose
              </h3>
              <p class="text-neutral-700 leading-relaxed mb-4 flex-1">
                Results are grouped by payout method and ranked by delivered outcome (recipient gets), with context on fees, FX markup, speed, and reliability.
              </p>
              <div class="grid gap-2 sm:grid-cols-2">
                <div class="flex items-start gap-2 rounded-lg bg-brand-50 p-2.5">
                  <svg class="w-4 h-4 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span class="text-xs text-neutral-700"><strong class="font-semibold">Transfer speed</strong></span>
                </div>
                <div class="flex items-start gap-2 rounded-lg bg-brand-50 p-2.5">
                  <svg class="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span class="text-xs text-neutral-700"><strong class="font-semibold">Payment method</strong></span>
                </div>
                <div class="flex items-start gap-2 rounded-lg bg-brand-50 p-2.5">
                  <svg class="w-4 h-4 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span class="text-xs text-neutral-700"><strong class="font-semibold">Remit-Score</strong></span>
                </div>
                <div class="flex items-start gap-2 rounded-lg bg-brand-50 p-2.5">
                  <svg class="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span class="text-xs text-neutral-700"><strong class="font-semibold">Total cost</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-lg transition-all hover:shadow-2xl">
            <div class="flex flex-col h-full">
              <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
                <svg class="w-9 h-9 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-neutral-900 mb-3">
                3. Complete the transfer
              </h3>
              <p class="text-neutral-700 leading-relaxed mb-4 flex-1">
                You’ll be redirected to the provider to sign in, verify identity if required, and complete checkout. Always confirm the final amount on the provider’s checkout screen.
              </p>
              <div class="rounded-xl border border-brand-200 bg-brand-50 p-4">
                <div class="flex items-start gap-2">
                  <svg
                    class="h-5 w-5 flex-shrink-0 text-brand-600 mt-0.5"
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
                  <p class="text-xs text-neutral-700 leading-relaxed">
                    <strong class="font-bold text-neutral-900">Independent comparisons:</strong> we may earn a commission when you use our links, but it never affects rankings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testing Methodology -->
    <section class="py-16 lg:py-20 bg-white scroll-mt-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
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
          <div class="rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 shadow-md">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
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
                <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>We check publicly available regulatory registers where applicable</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh frequently on top corridors (cadence varies)</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Spot-check on selected corridors when feasible</span>
              </li>
            </ul>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 shadow-md">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-4">
              Verification
            </h3>
            <p class="text-sm text-slate-600 leading-relaxed mb-4">
              We run periodic spot-check transfers on selected corridors to validate provider claims when feasible.
            </p>
            <ul class="space-y-3 text-sm text-slate-600">
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Selected corridors based on coverage and user demand</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Multiple send amounts (where testable)</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Different payout methods where supported</span>
              </li>
            </ul>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 shadow-md">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-4">
              Ongoing Monitoring
            </h3>
            <p class="text-sm text-slate-600 leading-relaxed mb-4">
              We continuously monitor provider rates and reliability to ensure data accuracy.
            </p>
            <ul class="space-y-3 text-sm text-slate-600">
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Automated alerts for unusual rate changes</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Track delivery time anomalies</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.25 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.25 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-9 3.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.25 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.25 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span>User feedback is reviewed and triaged continuously</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Guides Section -->
    <section class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
      </div>
    </section>

    <!-- Final CTA -->
    <section class="bg-gradient-to-r from-brand-600 via-blue-600 to-brand-700 py-16 lg:py-20">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center text-white">
        <h2 class="text-3xl font-bold mb-4 sm:text-4xl lg:text-5xl">
          Ready to Save on Your Next Transfer?
        </h2>
        <p class="mx-auto mb-8 max-w-2xl text-lg text-white/95 leading-relaxed">
          Compare live quotes from {{ SITE_STATS.providers.display }} providers. See what your recipient should receive, then confirm the final amount at checkout.
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
import CountrySelect from '~/components/shared/CountrySelect.vue'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
import BankVsSpecialistDynamic from '~/components/home/BankVsSpecialistDynamic.vue'
import { useCompareForm } from '~/composables/useCompareForm'
import { useRemittanceApi } from '~/composables/useRemittanceApi'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import { SITE_STATS } from '~/config/stats'

const { form: moneyForm, submit: submitForm } = useCompareForm()
const { recordSearch } = useRemittanceApi()

const lastUpdatedIso = '2025-12-14'
const lastUpdatedLabel = computed(() => {
  return new Date(lastUpdatedIso).toLocaleDateString('en-US', {
    day: 'numeric',
    year: 'numeric',
    month: 'long',
  })
})

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
        <li>Final amount recipient receives</li>
        <li>Estimated delivery time</li>
      </ul>
      <p>These records enable us to track pricing trends over time and power features like <a href="/pulse" class="text-brand-600 hover:text-brand-700 underline font-semibold">Pulse</a>, which shows rate movements and helps you time your transfers.</p>
    `,
  },
  {
    question: 'How we calculate "recipient gets"',
    answer: `
      <p>The "recipient gets" amount represents the actual funds your recipient will receive after all fees and exchange rate adjustments are applied.</p>
      <p><strong>Calculation formula:</strong></p>
      <p><code class="bg-slate-100 px-2 py-1 rounded">(send amount - fees) × provider exchange rate</code></p>
      <p><strong>Example calculation:</strong></p>
      <ul>
        <li>Send amount: $500 USD</li>
        <li>Mid-market rate: 18.50 MXN per USD</li>
        <li>Provider A: $5.00 fee, 18.00 rate → recipient receives <strong>8,910 MXN</strong></li>
        <li>Provider B: $1.99 fee, 18.45 rate → recipient receives <strong>9,188 MXN</strong></li>
      </ul>
      <p>Provider B delivers <strong>278 MXN more</strong> despite both providers advertising low fees. The exchange rate difference accounts for the variation.</p>
      <p><strong>Important note:</strong> Final checkout amounts may differ from our quotes due to promotional offers, identity verification requirements, payment method variations, or exchange rate movements between quote capture and transaction completion.</p>
    `,
  },
  {
    question: 'How we estimate FX markup',
    answer: `
      <p>Many providers generate revenue by offering exchange rates below the mid-market rate. This difference, known as <strong>FX markup</strong>, represents a hidden cost to consumers.</p>
      <p>We calculate markup by comparing the provider's quoted rate to the mid-market reference rate at the <strong>exact same timestamp</strong>. Exchange rates fluctuate throughout the day, so accurate timing is essential for fair comparison.</p>
      <p><strong>Calculation formula:</strong></p>
      <p><code class="bg-slate-100 px-2 py-1 rounded">FX markup = (mid-market rate - provider rate) ÷ mid-market rate</code></p>
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
        <li>Public quote page captures</li>
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
      <p><a href="/contact" class="text-brand-600 hover:text-brand-700 underline font-semibold">Report an issue</a> | <a href="/corrections" class="text-brand-600 hover:text-brand-700 underline font-semibold">View corrections policy</a></p>
    `,
  },
]

const handleMoneySubmit = async () => {
  const { from, to, amount, method } = moneyForm.value

  if (from && to && amount && amount > 0 && method) {
    await recordSearch({ from, to, amount, method }).catch(() => undefined)
  }

  await submitForm()
}

const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Our Methodology | How We Compare Money Transfer Providers | Remit-Scout',
  description: 'Learn how Remit-Scout collects quotes, estimates fees and FX markup, and ranks money transfer providers by delivered outcome with an independent, transparent methodology.',
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
</style>
