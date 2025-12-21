<template>
  <div class="bg-gradient-to-b from-slate-50 to-white min-h-screen">
    <!-- Hero Section -->
    <section class="relative py-10 lg:py-12 overflow-hidden bg-slate-50">
      <div class="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        <div class="text-center mb-8">
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Stop <span class="text-brand-600">Overpaying</span> on International Transfers
          </h1>
          <p class="text-lg text-slate-600 max-w-3xl mx-auto break-words">
            Get the best rates for your international money transfer and see exactly how much your recipient will receive.
          </p>
        </div>

        <!-- Two Column Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Article Section -->
          <article class="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 flex flex-col">
            <h2 class="text-2xl font-bold text-slate-900 mb-4">
              Your Money Transfer Comparison Engine
            </h2>
            
            <div class="space-y-5 flex-1 flex flex-col">
              <p class="text-base text-slate-700 leading-relaxed">
                Compare rates from <NuxtLink to="/learn/providers" class="text-blue-600 hover:text-blue-700 font-medium">30+ licensed providers</NuxtLink> including
                <NuxtLink to="/learn/providers/wise" class="text-blue-600 hover:text-blue-700 font-medium">Wise</NuxtLink>,
                <NuxtLink to="/learn/providers/remitly" class="text-blue-600 hover:text-blue-700 font-medium">Remitly</NuxtLink>,
                <NuxtLink to="/learn/providers/western-union" class="text-blue-600 hover:text-blue-700 font-medium">Western Union</NuxtLink>,
                <NuxtLink to="/learn/providers/xe" class="text-blue-600 hover:text-blue-700 font-medium">XE</NuxtLink>, and many more.
                All providers are fully licensed and regulated in their respective jurisdictions.
              </p>

              <div>
                <h3 class="text-lg font-bold text-slate-900 mb-3">
                  How Our Comparison Works
                </h3>
                <p class="text-sm text-slate-700 mb-3 leading-relaxed">
                  We pull live exchange rates and fees directly from provider APIs every few minutes. When you enter your transfer details, we calculate the exact amount your recipient will receive after all fees and exchange rate markups. The best provider changes based on your specific corridor, amount, and transfer method.
                </p>
                <p class="text-sm text-slate-700 leading-relaxed">
                  Our rankings are 100% independent. Providers cannot pay for better placement. We rank purely on total cost (fees plus exchange rate markup), transfer speed, and reliability based on real user experiences.
                </p>
              </div>

              <div>
                <h3 class="text-lg font-bold text-slate-900 mb-3">
                  Why Rates Change
                </h3>
                <p class="text-sm text-slate-700 leading-relaxed">
                  Exchange rates fluctuate throughout the day based on global currency markets. Different providers update their rates at different intervals, and some may offer better rates for specific corridors or transfer amounts. That's why comparing multiple providers in real-time ensures you always get the best deal available at that moment.
                </p>
              </div>

              <div class="mt-auto pt-6 border-t border-slate-200">
                <NuxtLink
                  to="/learn"
                  class="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-6 py-3 transition-all shadow-md hover:shadow-lg"
                >
                  <span>Read More Money Transfer Guides on Our Blog</span>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </article>

            <!-- Extended Comparison Widget -->
            <div class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div class="border-b border-slate-100 bg-blue-600 px-6 py-5">
                <h3 class="text-xl font-bold text-white mb-1">
                  Find Your Best Rate Now
                </h3>
                <p class="text-sm text-white/90">
                  Compare live rates from 30+ providers
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
                    <p class="mt-2 text-xs text-slate-500">
                      Select your sending country to see the best rates.
                    </p>
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
                    <p class="mt-2 text-xs text-slate-500">
                      Choose where your recipient will receive the money.
                    </p>
                  </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      for="from-currency"
                      class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
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
                      class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
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
                    class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Amount to send
                  </label>
                  <input
                    id="amount"
                    v-model.number="moneyForm.amount"
                    type="number"
                    min="1"
                    step="1"
                    class="h-10 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 transition-colors focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    placeholder="500"
                  />
                </div>

                <div class="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0">
                      <svg class="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div class="text-sm text-blue-900">
                      <p class="font-semibold mb-1.5">Live Rate Comparison</p>
                      <p class="text-blue-700 text-xs mb-2">
                        Rates are updated in real-time directly from provider APIs. See the exact amount your recipient will receive before you send.
                      </p>
                      <ul class="space-y-1 text-blue-700 text-xs">
                        <li class="flex items-center gap-2">
                          <svg class="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>No hidden fees, total cost shown</span>
                        </li>
                        <li class="flex items-center gap-2">
                          <svg class="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>100% independent rankings</span>
                        </li>
                        <li class="flex items-center gap-2">
                          <svg class="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Exact recipient amounts shown</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  :disabled="!isFormValid"
                  class="w-full h-11 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
                >
                  <span>Compare Providers</span>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                <div class="pt-4 border-t border-slate-200">
                  <p class="text-center text-xs text-slate-500 mb-3">
                    Need help? Learn more about our comparison process
                  </p>
                  <div class="flex justify-center gap-4 flex-wrap">
                    <NuxtLink to="/methodology" class="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      How we compare
                    </NuxtLink>
                    <span class="text-slate-300">•</span>
                    <NuxtLink to="/faq" class="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      FAQ
                    </NuxtLink>
                    <span class="text-slate-300">•</span>
                    <NuxtLink to="/learn/providers" class="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      All Providers
                    </NuxtLink>
                  </div>
                </div>
              </form>
            </div>

            <!-- Trust & Independence Card - Spans both columns -->
            <div class="lg:col-span-2 bg-brand-600 rounded-2xl shadow-xl p-6 lg:p-8 text-white relative overflow-hidden">
              <div class="relative z-10">
                <div class="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                  <!-- Icon and Title -->
                  <div class="flex items-center gap-4 flex-shrink-0">
                    <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 class="text-xl lg:text-2xl font-bold">Trust & Independence</h3>
                  </div>

                  <!-- Main Description -->
                  <div class="flex-1">
                    <p class="text-white/95 leading-relaxed text-base lg:text-lg mb-4">
                      <strong class="text-white font-bold">100% independent rankings.</strong> Providers can't pay for better placement.
                    </p>
                    <p class="text-white/95 leading-relaxed text-base lg:text-lg mb-4">
                      Our methodology is fully transparent and publicly available. We update our data continuously to ensure accuracy.
                    </p>

                    <!-- Key Features - Horizontal -->
                    <div class="flex flex-wrap items-center gap-4 mb-4">
                      <div class="flex items-center gap-2">
                        <div class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span class="text-white text-sm font-medium">No paid placements</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span class="text-white text-sm font-medium">Real-time rate updates</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span class="text-white text-sm font-medium">Transparent methodology</span>
                      </div>
                    </div>
                  </div>

                  <!-- CTA Link -->
                  <div class="flex-shrink-0">
                    <NuxtLink
                      to="/methodology"
                      class="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white font-semibold text-sm transition-all hover:scale-105"
                    >
                      <span>Learn more</span>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </section>

    <!-- Countries by Region -->
    <section class="relative py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            Browse Money Transfer Routes by Country
          </h2>
          <p class="text-xl text-slate-600 max-w-3xl mx-auto mb-8 break-words">
            Select your destination country to see the best money transfer providers, exchange rates, and fees. 
            All providers are licensed and regulated for your security.
          </p>
        </div>

        <div class="space-y-20">
        <section>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center">
            Send Money To <span class="text-brand-600">South-Eastern Asia</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CountryCard
              v-for="country in regions.southEasternAsia"
              :key="country.code"
              :country="country"
              :routes="countryRoutesMap[country.code]"
            />
          </div>
        </section>

        <section>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center">
            Send Money to the <span class="text-brand-600">Middle East</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CountryCard
              v-for="country in regions.middleEast"
              :key="country.code"
              :country="country"
              :routes="countryRoutesMap[country.code]"
            />
          </div>
        </section>

        <section>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center">
            Send Money to <span class="text-brand-600">East Asia</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CountryCard
              v-for="country in regions.eastAsia"
              :key="country.code"
              :country="country"
              :routes="countryRoutesMap[country.code]"
            />
          </div>
        </section>

        <section>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center">
            Send Money to <span class="text-brand-600">South Asia</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CountryCard
              v-for="country in regions.southAsia"
              :key="country.code"
              :country="country"
              :routes="countryRoutesMap[country.code]"
            />
          </div>
        </section>

        <section>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center">
            Send Money to <span class="text-brand-600">Western Europe</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CountryCard
              v-for="country in regions.westernEurope"
              :key="country.code"
              :country="country"
              :routes="countryRoutesMap[country.code]"
            />
          </div>
        </section>

        <section>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center">
            Send Money to <span class="text-brand-600">Southern Europe</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CountryCard
              v-for="country in regions.southernEurope"
              :key="country.code"
              :country="country"
              :routes="countryRoutesMap[country.code]"
            />
          </div>
        </section>

        <section>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center">
            Send Money to <span class="text-brand-600">Eastern Europe</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CountryCard
              v-for="country in regions.easternEurope"
              :key="country.code"
              :country="country"
              :routes="countryRoutesMap[country.code]"
            />
          </div>
        </section>

        <section>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center">
            Send Money to <span class="text-brand-600">Northern Europe</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CountryCard
              v-for="country in regions.northernEurope"
              :key="country.code"
              :country="country"
              :routes="countryRoutesMap[country.code]"
            />
          </div>
        </section>

        <section>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center">
            Send Money to <span class="text-brand-600">North America</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CountryCard
              v-for="country in regions.northAmerica"
              :key="country.code"
              :country="country"
              :routes="countryRoutesMap[country.code]"
            />
          </div>
        </section>

        <section>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center">
            Send Money to <span class="text-brand-600">Central America & Caribbean</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CountryCard
              v-for="country in regions.centralAmericaCaribbean"
              :key="country.code"
              :country="country"
              :routes="countryRoutesMap[country.code]"
            />
          </div>
        </section>

        <section>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center">
            Send Money to <span class="text-brand-600">South America</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CountryCard
              v-for="country in regions.southAmerica"
              :key="country.code"
              :country="country"
              :routes="countryRoutesMap[country.code]"
            />
          </div>
        </section>

        <section>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center">
            Send Money to <span class="text-brand-600">Africa</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CountryCard
              v-for="country in regions.africa"
              :key="country.code"
              :country="country"
              :routes="countryRoutesMap[country.code]"
            />
          </div>
        </section>

        <section>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center">
            Overseas Money Transfers to <span class="text-brand-600">Oceania</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CountryCard
              v-for="country in regions.oceania"
              :key="country.code"
              :country="country"
              :routes="countryRoutesMap[country.code]"
            />
          </div>
        </section>
        </div>
      </div>
    </section>

    <!-- Components After Countries -->
    <CorridorsGridDynamic />

    <WhyTrustUs />

    <!-- Mini FAQ Section -->
    <section class="relative py-16 lg:py-20 bg-gradient-to-br from-slate-50 to-white">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">
            Quick answers to common questions about money transfers, fees, and our comparison platform.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <h3 class="text-lg font-bold text-slate-900 mb-3">
              How does international money transfer work?
            </h3>
            <p class="text-slate-700 mb-4">
              International money transfers allow you to send funds from your account to a recipient in another country. The provider converts your currency to the recipient's currency using an exchange rate, then delivers it to their bank account, mobile wallet, or for cash pickup.
            </p>
            <NuxtLink to="/faq" class="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Learn more about transfers →
            </NuxtLink>
          </div>

          <div class="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <h3 class="text-lg font-bold text-slate-900 mb-3">
              What's the difference between a transfer fee and an exchange rate markup?
            </h3>
            <p class="text-slate-700 mb-4">
              A <strong>transfer fee</strong> is the upfront charge you see (e.g., $5.99). An <strong>exchange rate markup</strong> is hidden in the rate they offer you versus the real "mid-market" rate. Always check "Total Received" to see the true cost.
            </p>
            <NuxtLink to="/faq" class="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Understand fees better →
            </NuxtLink>
          </div>

          <div class="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <h3 class="text-lg font-bold text-slate-900 mb-3">
              How long does an international transfer take?
            </h3>
            <p class="text-slate-700 mb-4">
              Speed varies by method: Instant (0-30 min) for debit card to mobile wallet, same day for many online providers to bank accounts, 1-3 days for bank transfers, and 3-5 days for traditional banks.
            </p>
            <NuxtLink to="/faq" class="text-blue-600 hover:text-blue-700 font-medium text-sm">
              See delivery times →
            </NuxtLink>
          </div>

          <div class="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <h3 class="text-lg font-bold text-slate-900 mb-3">
              Are there limits on how much I can send?
            </h3>
            <p class="text-slate-700 mb-4">
              Yes, limits vary by provider and your verification level. Unverified accounts typically allow $500-$1,000, while ID-verified accounts can send $10,000-$50,000+. Banks typically allow higher amounts but charge more.
            </p>
            <NuxtLink to="/faq" class="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Check transfer limits →
            </NuxtLink>
          </div>

          <div class="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <h3 class="text-lg font-bold text-slate-900 mb-3">
              Can I track my transfer?
            </h3>
            <p class="text-slate-700 mb-4">
              Yes! All modern providers offer tracking via app or website. You'll get updates when the transfer is initiated, funds are received by provider, currency is exchanged, and money is available to recipient.
            </p>
            <NuxtLink to="/faq" class="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Learn about tracking →
            </NuxtLink>
          </div>

          <div class="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <h3 class="text-lg font-bold text-slate-900 mb-3">
              Is it cheaper to send large amounts?
            </h3>
            <p class="text-slate-700 mb-4">
              Generally, yes. Many providers charge a percentage fee (e.g., 1%), so larger amounts cost more in absolute terms but the same percentage. Fixed fees ($5) are better for large amounts, and some providers offer better rates for $5,000+.
            </p>
            <NuxtLink to="/faq" class="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Compare large transfers →
            </NuxtLink>
          </div>
        </div>

        <div class="text-center">
          <NuxtLink
            to="/faq"
            class="inline-flex items-center gap-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg transition-all"
          >
            <span>View All FAQs</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Our Impact So Far Section -->
    <TrustMetricsStrip />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { COUNTRIES, type Country, getCountryByCode, getAvailableCurrencies } from '~/utils/countries-currencies'
import { getCorridorUrl } from '~/utils/country-slugs'
import CorridorsGridDynamic from '~/components/home/CorridorsGridDynamic.vue'
import WhyTrustUs from '~/components/home/WhyTrustUs.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'
import { useCompareForm } from '~/composables/useCompareForm'
import { useRemittanceApi } from '~/composables/useRemittanceApi'

const { form: moneyForm, validationError, submit: submitForm } = useCompareForm()
const formError = validationError
const { recordSearch } = useRemittanceApi()

// Watch for country changes and reset currency if needed
watch(() => moneyForm.value.to, (newCountry) => {
  if (!newCountry) {
    moneyForm.value.toCurrency = ''
    return
  }

  const country = getCountryByCode(newCountry)
  if (!country) return

  const availableCurrencies = getAvailableCurrencies(newCountry)
  
  // If current currency is not available for the new country, reset to country's default currency
  if (!moneyForm.value.toCurrency || !availableCurrencies.includes(moneyForm.value.toCurrency)) {
    moneyForm.value.toCurrency = country.currency
  }
})

watch(() => moneyForm.value.from, (newCountry) => {
  if (!newCountry) {
    moneyForm.value.fromCurrency = ''
    return
  }

  const country = getCountryByCode(newCountry)
  if (!country) return

  const availableCurrencies = getAvailableCurrencies(newCountry)
  
  // If current currency is not available for the new country, reset to country's default currency
  if (!moneyForm.value.fromCurrency || !availableCurrencies.includes(moneyForm.value.fromCurrency)) {
    moneyForm.value.fromCurrency = country.currency
  }
})

const isFormValid = computed(() => {
  return (
    moneyForm.value.from
    && moneyForm.value.to
    && moneyForm.value.from !== moneyForm.value.to
    && moneyForm.value.amount
    && moneyForm.value.amount > 0
  )
})

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

type RouteLink = {
  label: string
  to: string
}

type CountryRoutes = {
  guide?: RouteLink[]
  sources?: RouteLink[]
  inbound?: RouteLink[]
  outbound?: RouteLink[]
}

const sourceRoutes: Record<string, string[]> = {
  BN: ['ID', 'PH', 'BD', 'IN', 'MY'],
  ID: ['MY', 'SA', 'SG', 'HK', 'TW'],
  KH: ['TH', 'KR', 'JP', 'MY', 'US'],
  LA: ['TH', 'US', 'FR', 'CA', 'AU'],
  MM: ['TH', 'MY', 'CN', 'BD', 'SG'],
  MY: ['ID', 'BD', 'NP', 'PH', 'MM'],
  PH: ['US', 'SG', 'SA', 'JP', 'GB'],
  SG: ['MY', 'IN', 'BD', 'PH', 'ID'],
  TH: ['MM', 'KH', 'LA', 'JP', 'KR'],
  VN: ['US', 'CA', 'AU', 'JP', 'KR'],
  TL: ['AU', 'PT', 'KR', 'GB', 'ID'],

  AE: ['IN', 'PK', 'BD', 'PH', 'NP'],
  AM: ['RU', 'US', 'FR', 'DE', 'UA'],
  AZ: ['RU', 'TR', 'GE', 'KZ', 'UA'],
  BH: ['IN', 'BD', 'PK', 'PH', 'NP'],
  CY: ['GB', 'GR', 'AU', 'RU', 'DE'],
  GE: ['RU', 'TR', 'GR', 'IT', 'US'],
  IL: ['US', 'FR', 'GB', 'CA', 'RU'],
  IQ: ['JO', 'TR', 'US', 'GB', 'DE'],
  JO: ['SA', 'AE', 'QA', 'KW', 'US'],
  KW: ['IN', 'EG', 'BD', 'PH', 'PK'],
  LB: ['SA', 'US', 'FR', 'CA', 'AE'],
  OM: ['IN', 'BD', 'PK', 'PH', 'NP'],
  PS: ['IL', 'JO', 'SA', 'AE', 'QA'],
  QA: ['IN', 'NP', 'BD', 'PH', 'PK'],
  SA: ['IN', 'PK', 'BD', 'PH', 'EG'],
  SY: ['TR', 'LB', 'JO', 'DE', 'SA'],
  TR: ['DE', 'FR', 'NL', 'AT', 'GB'],
  YE: ['SA', 'AE', 'QA', 'US', 'GB'],

  CN: ['US', 'HK', 'JP', 'CA', 'AU'],
  HK: ['CN', 'PH', 'ID', 'GB', 'CA'],
  JP: ['US', 'BR', 'CN', 'PH', 'VN'],
  KR: ['US', 'CN', 'JP', 'VN', 'PH'],
  MO: ['CN', 'PH', 'VN', 'ID', 'HK'],
  MN: ['KR', 'JP', 'CN', 'RU', 'US'],
  TW: ['US', 'JP', 'ID', 'VN', 'PH'],

  AF: ['IR', 'PK', 'DE', 'TR', 'US'],
  BD: ['SA', 'AE', 'KW', 'OM', 'MY'],
  BT: ['IN', 'AU', 'US', 'CA', 'TH'],
  IN: ['US', 'AE', 'GB', 'SA', 'SG'],
  LK: ['SA', 'AE', 'QA', 'KW', 'IT'],
  MV: ['IN', 'LK', 'GB', 'AU', 'AE'],
  NP: ['IN', 'QA', 'SA', 'AE', 'MY'],
  PK: ['SA', 'AE', 'GB', 'US', 'QA'],

  AT: ['DE', 'TR', 'BA', 'RS', 'RO'],
  BE: ['FR', 'MA', 'NL', 'IT', 'CD'],
  CH: ['DE', 'IT', 'FR', 'PT', 'ES'],
  DE: ['TR', 'PL', 'RO', 'IT', 'GR'],
  FR: ['DZ', 'MA', 'TN', 'SN', 'PT'],
  LI: ['CH', 'AT', 'DE', 'IT', 'FR'],
  LU: ['FR', 'DE', 'BE', 'PT', 'IT'],
  MC: ['FR', 'IT', 'GB', 'CH', 'US'],
  NL: ['DE', 'BE', 'TR', 'MA', 'SR'],

  AD: ['ES', 'FR', 'PT', 'GB', 'RU'],
  AL: ['IT', 'GR', 'DE', 'CH', 'GB'],
  BA: ['DE', 'AT', 'HR', 'SI', 'CH'],
  ES: ['MA', 'RO', 'EC', 'CO', 'FR'],
  GI: ['GB', 'ES', 'PT', 'MT', 'MA'],
  GR: ['DE', 'AL', 'US', 'GB', 'AU'],
  HR: ['DE', 'AT', 'BA', 'SI', 'CH'],
  IT: ['RO', 'AL', 'MA', 'PH', 'DE'],
  ME: ['RS', 'DE', 'CH', 'AT', 'BA'],
  MK: ['DE', 'CH', 'IT', 'AT', 'GR'],
  MT: ['GB', 'IT', 'AU', 'CA', 'LY'],
  PT: ['FR', 'CH', 'LU', 'AO', 'BR'],
  RS: ['DE', 'AT', 'CH', 'BA', 'ME'],
  SI: ['DE', 'AT', 'IT', 'HR', 'CH'],
  SM: ['IT', 'CH', 'DE', 'FR', 'US'],
  VA: ['IT', 'US', 'ES', 'BR', 'PH'],

  BG: ['DE', 'ES', 'GR', 'GB', 'IT'],
  BY: ['RU', 'PL', 'LT', 'UA', 'DE'],
  CZ: ['SK', 'DE', 'UA', 'PL', 'GB'],
  HU: ['DE', 'AT', 'RO', 'GB', 'SK'],
  MD: ['RU', 'IT', 'RO', 'IL', 'FR'],
  PL: ['DE', 'GB', 'NL', 'IE', 'US'],
  RO: ['IT', 'ES', 'DE', 'GB', 'FR'],
  RU: ['UA', 'KZ', 'UZ', 'BY', 'DE'],
  SK: ['CZ', 'DE', 'AT', 'GB', 'HU'],
  UA: ['PL', 'RU', 'DE', 'IT', 'CZ'],

  DK: ['SE', 'NO', 'DE', 'GB', 'PL'],
  FI: ['SE', 'RU', 'EE', 'NO', 'DE'],
  EE: ['FI', 'LV', 'LT', 'SE', 'DE'],
  GB: ['IN', 'PK', 'NG', 'PL', 'IE'],
  IE: ['GB', 'US', 'AU', 'CA', 'PL'],
  IS: ['DK', 'NO', 'SE', 'PL', 'US'],
  LT: ['GB', 'IE', 'NO', 'DE', 'PL'],
  LV: ['GB', 'IE', 'DE', 'SE', 'NO'],
  NO: ['SE', 'DK', 'PL', 'US', 'GB'],
  SE: ['FI', 'NO', 'DK', 'DE', 'GB'],

  CA: ['IN', 'CN', 'PH', 'US', 'GB'],
  US: ['MX', 'IN', 'CN', 'PH', 'GT'],
  MX: ['US', 'CA', 'GT', 'CO', 'EC'],
  GL: ['DK', 'IS', 'NO', 'CA', 'US'],

  AG: ['US', 'CA', 'GB', 'BB', 'TT'],
  AI: ['GB', 'US', 'CA', 'KN', 'BB'],
  AW: ['NL', 'US', 'CO', 'VE', 'CW'],
  BB: ['US', 'GB', 'CA', 'TT', 'GY'],
  BM: ['US', 'GB', 'CA', 'BS', 'JM'],
  BS: ['US', 'GB', 'CA', 'JM', 'HT'],
  BZ: ['US', 'GB', 'MX', 'GT', 'CA'],
  CR: ['US', 'NI', 'PA', 'ES', 'MX'],
  CU: ['US', 'ES', 'IT', 'MX', 'CA'],
  CW: ['NL', 'US', 'VE', 'CO', 'AW'],
  DM: ['GB', 'US', 'CA', 'FR', 'TT'],
  DO: ['US', 'ES', 'IT', 'PR', 'CH'],
  GD: ['US', 'GB', 'CA', 'TT', 'BB'],
  GT: ['US', 'MX', 'CA', 'SV', 'ES'],
  HN: ['US', 'ES', 'MX', 'GT', 'SV'],
  HT: ['US', 'CA', 'FR', 'DO', 'CL'],
  JM: ['US', 'GB', 'CA', 'KY', 'BS'],
  KN: ['US', 'GB', 'CA', 'AG', 'LC'],
  KY: ['GB', 'US', 'JM', 'HN', 'CA'],
  LC: ['US', 'GB', 'CA', 'TT', 'BB'],
  MS: ['GB', 'US', 'CA', 'AG', 'KN'],
  NI: ['US', 'CR', 'ES', 'PA', 'SV'],
  PA: ['US', 'CO', 'CR', 'VE', 'ES'],
  PR: ['US', 'DO', 'ES', 'MX', 'CA'],
  SV: ['US', 'CA', 'GT', 'HN', 'ES'],
  TT: ['US', 'CA', 'GB', 'GY', 'BB'],
  VC: ['GB', 'US', 'CA', 'TT', 'BB'],
  VG: ['GB', 'US', 'PR', 'JM', 'CA'],

  AR: ['ES', 'IT', 'US', 'CL', 'MX'],
  BO: ['AR', 'ES', 'BR', 'CL', 'US'],
  BR: ['US', 'PT', 'JP', 'DE', 'ES'],
  CL: ['US', 'AR', 'PE', 'ES', 'BO'],
  CO: ['US', 'ES', 'EC', 'VE', 'CL'],
  EC: ['US', 'ES', 'IT', 'CL', 'CO'],
  GF: ['FR', 'BR', 'SR', 'HT', 'GY'],
  GY: ['US', 'CA', 'GB', 'TT', 'SR'],
  PE: ['US', 'ES', 'CL', 'AR', 'IT'],
  PY: ['AR', 'BR', 'ES', 'US', 'CL'],
  SR: ['NL', 'GY', 'GF', 'US', 'TT'],
  UY: ['AR', 'ES', 'US', 'BR', 'IT'],
  VE: ['CO', 'US', 'ES', 'CL', 'PE'],

  AO: ['PT', 'BR', 'ZA', 'NA', 'CD'],
  BF: ['CI', 'ML', 'GH', 'FR', 'IT'],
  BI: ['TZ', 'RW', 'CD', 'BE', 'US'],
  BJ: ['NG', 'CI', 'FR', 'GH', 'NE'],
  BW: ['ZA', 'ZW', 'NA', 'ZM', 'GB'],
  CD: ['BE', 'FR', 'ZA', 'RW', 'UG'],
  CF: ['CM', 'TD', 'CD', 'FR', 'SD'],
  CG: ['FR', 'CD', 'GA', 'BE', 'AO'],
  CI: ['BF', 'ML', 'GN', 'FR', 'IT'],
  CM: ['FR', 'NG', 'DE', 'US', 'GA'],
  CV: ['PT', 'US', 'NL', 'FR', 'AO'],
  DJ: ['FR', 'ET', 'SO', 'YE', 'SA'],
  DZ: ['FR', 'ES', 'IT', 'CA', 'GB'],
  EG: ['SA', 'KW', 'AE', 'US', 'JO'],
  ER: ['SD', 'ET', 'SA', 'US', 'IT'],
  ET: ['US', 'SA', 'AE', 'IL', 'SD'],
  GA: ['FR', 'CM', 'GQ', 'CG', 'BJ'],
  GH: ['US', 'GB', 'NG', 'DE', 'IT'],
  GM: ['ES', 'IT', 'GB', 'SN', 'US'],
  GN: ['FR', 'SN', 'CI', 'US', 'ES'],
  GQ: ['ES', 'CM', 'GA', 'NG', 'PT'],
  GW: ['PT', 'SN', 'CV', 'ES', 'FR'],
  KE: ['GB', 'US', 'AE', 'TZ', 'UG'],
  KM: ['FR', 'MG', 'TZ', 'AE', 'MZ'],
  LR: ['US', 'SL', 'GH', 'GN', 'GB'],
  LS: ['ZA', 'GB', 'BW', 'NA', 'SZ'],
  LY: ['TN', 'EG', 'NE', 'TD', 'IT'],
  MA: ['FR', 'ES', 'IT', 'BE', 'NL'],
  MG: ['FR', 'MU', 'ZA', 'IT', 'US'],
  ML: ['CI', 'FR', 'SN', 'ES', 'DZ'],
  MR: ['SN', 'FR', 'ES', 'ML', 'MA'],
  MU: ['FR', 'GB', 'AU', 'ZA', 'CA'],
  MW: ['ZA', 'ZM', 'ZW', 'GB', 'MZ'],
  MZ: ['ZA', 'PT', 'SZ', 'MW', 'ZW'],
  NA: ['ZA', 'AO', 'BW', 'DE', 'ZM'],
  NE: ['NG', 'LY', 'DZ', 'FR', 'CI'],
  NG: ['US', 'GB', 'ZA', 'AE', 'GH'],
  RW: ['UG', 'CD', 'BE', 'FR', 'GB'],
  SC: ['GB', 'FR', 'MU', 'ZA', 'IN'],
  SD: ['SA', 'EG', 'AE', 'GB', 'QA'],
  SL: ['US', 'GB', 'GN', 'LR', 'GM'],
  SN: ['FR', 'IT', 'ES', 'US', 'GM'],
  SO: ['US', 'GB', 'SE', 'KE', 'SA'],
  ST: ['PT', 'AO', 'GA', 'GQ', 'BR'],
  SZ: ['ZA', 'MZ', 'LS', 'GB', 'BW'],
  TD: ['SD', 'LY', 'CM', 'CF', 'FR'],
  TG: ['GH', 'NG', 'FR', 'DE', 'BJ'],
  TN: ['FR', 'IT', 'DE', 'LY', 'SA'],
  TZ: ['KE', 'UG', 'GB', 'US', 'ZA'],
  UG: ['KE', 'GB', 'US', 'RW', 'AE'],
  ZA: ['ZW', 'MZ', 'LS', 'GB', 'AU'],
  ZM: ['ZA', 'GB', 'ZW', 'BW', 'MW'],
  ZW: ['ZA', 'GB', 'BW', 'ZM', 'US'],

  AS: ['US', 'WS', 'NZ', 'AU', 'TO'],
  AU: ['GB', 'NZ', 'CN', 'IN', 'PH'],
  FJ: ['AU', 'NZ', 'US', 'CA', 'GB'],
  FM: ['US', 'GU', 'PW', 'MH', 'AU'],
  GU: ['US', 'PH', 'JP', 'KR', 'FM'],
  KI: ['NZ', 'AU', 'FJ', 'US', 'TV'],
  MH: ['US', 'FM', 'GU', 'PW', 'AU'],
  NC: ['FR', 'AU', 'NZ', 'VU', 'WF'],
  NR: ['AU', 'NZ', 'FJ', 'KI', 'TW'],
  NZ: ['AU', 'GB', 'WS', 'TO', 'CN'],
  PF: ['FR', 'NZ', 'US', 'NC', 'CL'],
  PG: ['AU', 'NZ', 'ID', 'PH', 'FJ'],
  PW: ['US', 'FM', 'GU', 'PH', 'JP'],
  TO: ['NZ', 'AU', 'US', 'FJ', 'WS'],
  TV: ['NZ', 'AU', 'FJ', 'KI', 'WS'],
  VU: ['AU', 'NC', 'NZ', 'FJ', 'PG'],
  WF: ['FR', 'NC', 'NZ', 'FJ', 'WS'],
  WS: ['NZ', 'AU', 'US', 'AS', 'FJ'],
}

const countryLookup = COUNTRIES.reduce((acc, country) => {
  acc[country.code] = country
  return acc
}, {} as Record<string, Country>)

const buildRoutes = (country: Country): CountryRoutes => {
  const sources = sourceRoutes[country.code] || []
  const uniqueSources = Array.from(new Set(['US', ...sources]))

  const inboundLinks = uniqueSources
    .map(code => {
      const src = countryLookup[code]
      if (!src) return null
      return {
        label: `${src.name} → ${country.name}`,
        to: getCorridorUrl(code, country.code),
      }
    })
    .filter((link): link is RouteLink => Boolean(link))

  return {
    sources: inboundLinks,
    inbound: inboundLinks,
    outbound: [],
  }
}

const countryRoutesMap = computed(() => {
  const map: Record<string, CountryRoutes> = {}
  COUNTRIES.forEach(country => {
    map[country.code] = buildRoutes(country)
  })
  return map
})

const getCountriesByCodes = (codes: string[]) => {
  return codes
    .map(code => COUNTRIES.find(c => c.code === code))
    .filter((country): country is Country => country !== undefined)
}

const regions = {
  southEasternAsia: getCountriesByCodes(['BN', 'ID', 'KH', 'LA', 'MM', 'MY', 'PH', 'SG', 'TH', 'VN', 'TL']),
  middleEast: getCountriesByCodes(['AE', 'AM', 'AZ', 'BH', 'CY', 'GE', 'IL', 'IQ', 'JO', 'KW', 'LB', 'OM', 'PS', 'QA', 'SA', 'SY', 'TR', 'YE']),
  eastAsia: getCountriesByCodes(['CN', 'HK', 'JP', 'KR', 'MO', 'MN', 'TW']),
  southAsia: getCountriesByCodes(['AF', 'BD', 'BT', 'IN', 'LK', 'MV', 'NP', 'PK']),
  westernEurope: getCountriesByCodes(['AT', 'BE', 'CH', 'DE', 'FR', 'LI', 'LU', 'MC', 'NL']),
  southernEurope: getCountriesByCodes(['AD', 'AL', 'BA', 'ES', 'GI', 'GR', 'HR', 'IT', 'ME', 'MK', 'MT', 'PT', 'RS', 'SI', 'SM', 'VA']),
  easternEurope: getCountriesByCodes(['BG', 'BY', 'CZ', 'HU', 'MD', 'PL', 'RO', 'RU', 'SK', 'UA']),
  northernEurope: getCountriesByCodes(['DK', 'EE', 'FI', 'GB', 'IE', 'IS', 'LT', 'LV', 'NO', 'SE']),
  northAmerica: getCountriesByCodes(['CA', 'US', 'MX', 'GL']),
  centralAmericaCaribbean: getCountriesByCodes(['AG', 'AI', 'AW', 'BB', 'BM', 'BS', 'BZ', 'CR', 'CU', 'CW', 'DM', 'DO', 'GD', 'GT', 'HN', 'HT', 'JM', 'KN', 'KY', 'LC', 'MS', 'NI', 'PA', 'PR', 'SV', 'TT', 'VC', 'VG']),
  southAmerica: getCountriesByCodes(['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GF', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE']),
  africa: getCountriesByCodes(['AO', 'BF', 'BI', 'BJ', 'BW', 'CD', 'CF', 'CG', 'CI', 'CM', 'CV', 'DJ', 'DZ', 'EG', 'ER', 'ET', 'GA', 'GH', 'GM', 'GN', 'GQ', 'GW', 'KE', 'KM', 'LR', 'LS', 'LY', 'MA', 'MG', 'ML', 'MR', 'MU', 'MW', 'MZ', 'NA', 'NE', 'NG', 'RW', 'SC', 'SD', 'SL', 'SN', 'SO', 'ST', 'SZ', 'TD', 'TG', 'TN', 'TZ', 'UG', 'ZA', 'ZM', 'ZW']),
  oceania: getCountriesByCodes(['AS', 'AU', 'FJ', 'FM', 'GU', 'KI', 'MH', 'NC', 'NR', 'NZ', 'PF', 'PG', 'PW', 'TO', 'TV', 'VU', 'WF', 'WS']),
}

useSeoMeta({
  title: 'Send Money Abroad - Compare 30+ Providers | RemitScout',
  description: 'Compare the best money transfer services to send money abroad. Live exchange rates, transparent fees, and trusted providers across 200+ countries.',
  ogTitle: 'Send Money Abroad - Compare 30+ Providers',
  ogDescription: 'Compare 30+ money transfer providers and find the best rates to send money internationally.',
  ogImage: '/og-image.jpg',
})
</script>

<style scoped>
section {
  scroll-margin-top: 100px;
}
</style>
