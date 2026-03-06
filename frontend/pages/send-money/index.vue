<template>
  <div class="min-h-screen bg-neutral-50">
    <!-- Hero Section -->
    <section class="bg-gradient-to-b from-white via-neutral-50 to-neutral-50 py-8 lg:py-10">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-6 text-center lg:mb-8">
          <span
            class="text-body-sm inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 font-semibold text-neutral-700 shadow-sm"
          >
            Independent live comparison
          </span>
          <h1 class="text-h2 mb-3 mt-4 font-bold text-rs-fg">
            Find the best rate for your transfer
          </h1>
          <p class="text-body-lg mx-auto max-w-xl text-neutral-600 [text-wrap:balance]">
            Compare live quotes from 30+ licensed providers and see exactly what your recipient will
            receive.
          </p>
        </div>

        <!-- Two Column Layout -->
        <div class="grid grid-cols-1 gap-5 lg:grid-cols-[1.02fr_1fr]">
          <!-- Article Section -->
          <article
            class="flex flex-col rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-sm"
          >
            <span
              class="text-body-sm inline-flex w-fit items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-700"
            >
              How we compare
            </span>
            <h2 class="text-h3 mt-4 font-bold text-rs-fg">Transparent rankings in one screen</h2>
            <p class="text-body mt-3 max-w-2xl leading-relaxed text-neutral-700">
              We compare delivered value, transfer fees, and FX markup together so you can make a
              faster decision with fewer surprises at checkout.
            </p>

            <div class="mt-6 grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100">
                  <svg
                    class="h-4 w-4 text-brand-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p class="text-body-sm mt-3 font-semibold text-neutral-900">No pay-to-rank</p>
                <p class="text-body-sm mt-1 leading-relaxed text-neutral-600">
                  Providers cannot buy better placement. Rankings are based on delivered value.
                </p>
              </div>
              <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100">
                  <svg
                    class="h-4 w-4 text-brand-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M4 7h16M4 12h10M4 17h7"
                    />
                  </svg>
                </div>
                <p class="text-body-sm mt-3 font-semibold text-neutral-900">True total cost</p>
                <p class="text-body-sm mt-1 leading-relaxed text-neutral-600">
                  Fees and hidden FX markup are shown together so every quote is comparable.
                </p>
              </div>
              <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100">
                  <svg
                    class="h-4 w-4 text-brand-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <p class="text-body-sm mt-3 font-semibold text-neutral-900">Licensed coverage</p>
                <p class="text-body-sm mt-1 leading-relaxed text-neutral-600">
                  See live comparisons across 30+ licensed providers, including Wise, Remitly, and
                  Western Union.
                </p>
              </div>
            </div>

            <div class="mt-auto pt-6">
              <div class="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p class="text-body-sm text-neutral-600">
                    Live quotes from licensed providers. Methodology and coverage are always
                    visible.
                  </p>
                  <NuxtLink
                    to="/learn"
                    class="text-body-sm inline-flex items-center gap-2 font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Explore guides
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
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </article>

          <!-- Comparison Form -->
          <div
            class="flex flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
          >
            <div class="border-b border-white/10 bg-neutral-900 px-6 py-5 text-white">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p
                    class="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60"
                  >
                    Compare providers
                  </p>
                  <h3 class="text-h4 font-bold text-white">Live quotes for your corridor</h3>
                  <p class="text-body-sm mt-1 text-white/70">
                    Enter your route, currencies, and amount to compare delivered value.
                  </p>
                </div>
                <div class="text-body-sm hidden text-right text-white/60 sm:block">
                  <div>No pay-to-rank</div>
                  <div>Fresh provider data</div>
                </div>
              </div>
            </div>

            <form
class="space-y-4 p-6"
@submit.prevent="handleMoneySubmit"
>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    for="from-country"
                    class="text-body-sm mb-1.5 block font-semibold uppercase tracking-wide text-neutral-600"
                  >
                    Sending from
                  </label>
                  <CountrySelect
                    id="from-country"
                    v-model="moneyForm.from"
                    label="Sending from"
                    :exclude-country="moneyForm.to"
                    placeholder="United States"
                  />
                </div>

                <div>
                  <label
                    for="to-country"
                    class="text-body-sm mb-1.5 block font-semibold uppercase tracking-wide text-neutral-600"
                  >
                    Receiving in
                  </label>
                  <CountrySelect
                    id="to-country"
                    v-model="moneyForm.to"
                    label="Receiving in"
                    :exclude-country="moneyForm.from"
                    placeholder="Select country"
                  />
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    for="from-currency"
                    class="text-body-sm mb-1.5 block font-semibold uppercase tracking-wide text-neutral-600"
                  >
                    From currency
                  </label>
                  <CurrencySelect
                    id="from-currency"
                    v-model="moneyForm.fromCurrency"
                    :country-code="moneyForm.from"
                    :exclude-currency="moneyForm.toCurrency"
                    placeholder="USD"
                  />
                </div>

                <div>
                  <label
                    for="to-currency"
                    class="text-body-sm mb-1.5 block font-semibold uppercase tracking-wide text-neutral-600"
                  >
                    To currency
                  </label>
                  <CurrencySelect
                    id="to-currency"
                    v-model="moneyForm.toCurrency"
                    :country-code="moneyForm.to"
                    :exclude-currency="moneyForm.fromCurrency"
                    :placeholder="moneyForm.to ? 'Select currency' : 'Select country first'"
                    :disabled="!moneyForm.to"
                  />
                </div>
              </div>

              <div>
                <label
                  for="amount"
                  class="text-body-sm mb-1.5 block font-semibold uppercase tracking-wide text-neutral-600"
                >
                  Amount to send
                </label>
                <input
                  id="amount"
                  v-model.number="moneyForm.amount"
                  type="number"
                  min="1"
                  step="1"
                  class="h-10 w-full rounded-lg border border-neutral-300 bg-surface px-4 text-rs-fg focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 motion-safe:transition-colors"
                  placeholder="500"
                >
              </div>

              <button
                type="submit"
                :disabled="!isFormValid || isWaitingForQuotes"
                class="text-body-sm flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-neutral-300 motion-safe:transition-colors"
              >
                <span v-if="isWaitingForQuotes">Checking live quotes…</span>
                <span v-else>Compare providers</span>
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
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>

              <p
v-if="formError"
class="text-body-sm text-danger-600"
role="alert"
>
                {{ formError }}
              </p>
              <p
v-else-if="formInfo"
class="text-body-sm text-neutral-600"
role="status"
>
                {{ formInfo }}
              </p>

              <div
                class="flex flex-wrap items-center justify-center gap-4 border-t border-rs-border pt-3"
              >
                <NuxtLink
                  to="/methodology"
                  class="text-body-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Methodology
                </NuxtLink>
                <span class="text-neutral-300">·</span>
                <NuxtLink
                  to="/faq"
                  class="text-body-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  FAQ
                </NuxtLink>
                <span class="text-neutral-300">·</span>
                <NuxtLink
                  to="/learn/providers"
                  class="text-body-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  All providers
                </NuxtLink>
              </div>
            </form>
          </div>

          <!-- Trust strip — spans both columns -->
          <div
            class="rounded-2xl border border-neutral-200 bg-white px-6 py-4 shadow-sm lg:col-span-2"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2">
                <span class="text-body-sm flex items-center gap-2 font-semibold text-neutral-700">
                  <svg
                    class="h-4 w-4 flex-shrink-0 text-brand-500"
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
                  No pay-to-rank
                </span>
                <span class="text-body-sm flex items-center gap-2 font-semibold text-neutral-700">
                  <svg
                    class="h-4 w-4 flex-shrink-0 text-brand-500"
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
                  Live quotes
                </span>
                <span class="text-body-sm flex items-center gap-2 font-semibold text-neutral-700">
                  <svg
                    class="h-4 w-4 flex-shrink-0 text-brand-500"
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
                  Affiliate transparency
                </span>
                <span class="text-body-sm flex items-center gap-2 font-semibold text-neutral-700">
                  <svg
                    class="h-4 w-4 flex-shrink-0 text-brand-500"
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
                  Algorithmic rankings
                </span>
              </div>
              <NuxtLink
                to="/methodology"
                class="text-body-sm group inline-flex flex-shrink-0 items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
              >
                Read our methodology
                <svg
                  class="h-4 w-4 group-hover:translate-x-0.5 motion-safe:transition-transform"
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
    </section>

    <!-- Countries by Region -->
    <section class="relative bg-surface py-16 lg:py-20">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-16 text-center">
          <h2 class="text-h1 mb-6 font-bold text-rs-fg">Browse Money Transfer Routes by Country</h2>
          <p class="text-h4 mx-auto mb-8 max-w-3xl break-words text-neutral-600">
            Select your destination country to see the best money transfer providers, exchange
            rates, and fees. All providers are licensed and regulated for your security.
          </p>
        </div>

        <div class="space-y-20">
          <section>
            <h2 class="text-h2 mb-10 text-center font-bold text-rs-fg">
              Send Money To <span class="text-brand-600">South-Eastern Asia</span>
            </h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CountryCard
                v-for="country in regions.southEasternAsia"
                :key="country.code"
                :country="country"
                :routes="countryRoutesMap[country.code]"
              />
            </div>
          </section>

          <section>
            <h2 class="text-h2 mb-10 text-center font-bold text-rs-fg">
              Send Money to the <span class="text-brand-600">Middle East</span>
            </h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CountryCard
                v-for="country in regions.middleEast"
                :key="country.code"
                :country="country"
                :routes="countryRoutesMap[country.code]"
              />
            </div>
          </section>

          <section>
            <h2 class="text-h2 mb-10 text-center font-bold text-rs-fg">
              Send Money to <span class="text-brand-600">East Asia</span>
            </h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CountryCard
                v-for="country in regions.eastAsia"
                :key="country.code"
                :country="country"
                :routes="countryRoutesMap[country.code]"
              />
            </div>
          </section>

          <section>
            <h2 class="text-h2 mb-10 text-center font-bold text-rs-fg">
              Send Money to <span class="text-brand-600">South Asia</span>
            </h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CountryCard
                v-for="country in regions.southAsia"
                :key="country.code"
                :country="country"
                :routes="countryRoutesMap[country.code]"
              />
            </div>
          </section>

          <section>
            <h2 class="text-h2 mb-10 text-center font-bold text-rs-fg">
              Send Money to <span class="text-brand-600">Western Europe</span>
            </h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CountryCard
                v-for="country in regions.westernEurope"
                :key="country.code"
                :country="country"
                :routes="countryRoutesMap[country.code]"
              />
            </div>
          </section>

          <section>
            <h2 class="text-h2 mb-10 text-center font-bold text-rs-fg">
              Send Money to <span class="text-brand-600">Southern Europe</span>
            </h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CountryCard
                v-for="country in regions.southernEurope"
                :key="country.code"
                :country="country"
                :routes="countryRoutesMap[country.code]"
              />
            </div>
          </section>

          <section>
            <h2 class="text-h2 mb-10 text-center font-bold text-rs-fg">
              Send Money to <span class="text-brand-600">Eastern Europe</span>
            </h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CountryCard
                v-for="country in regions.easternEurope"
                :key="country.code"
                :country="country"
                :routes="countryRoutesMap[country.code]"
              />
            </div>
          </section>

          <section>
            <h2 class="text-h2 mb-10 text-center font-bold text-rs-fg">
              Send Money to <span class="text-brand-600">Northern Europe</span>
            </h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CountryCard
                v-for="country in regions.northernEurope"
                :key="country.code"
                :country="country"
                :routes="countryRoutesMap[country.code]"
              />
            </div>
          </section>

          <section>
            <h2 class="text-h2 mb-10 text-center font-bold text-rs-fg">
              Send Money to <span class="text-brand-600">North America</span>
            </h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CountryCard
                v-for="country in regions.northAmerica"
                :key="country.code"
                :country="country"
                :routes="countryRoutesMap[country.code]"
              />
            </div>
          </section>

          <section>
            <h2 class="text-h2 mb-10 text-center font-bold text-rs-fg">
              Send Money to <span class="text-brand-600">Central America & Caribbean</span>
            </h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CountryCard
                v-for="country in regions.centralAmericaCaribbean"
                :key="country.code"
                :country="country"
                :routes="countryRoutesMap[country.code]"
              />
            </div>
          </section>

          <section>
            <h2 class="text-h2 mb-10 text-center font-bold text-rs-fg">
              Send Money to <span class="text-brand-600">South America</span>
            </h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CountryCard
                v-for="country in regions.southAmerica"
                :key="country.code"
                :country="country"
                :routes="countryRoutesMap[country.code]"
              />
            </div>
          </section>

          <section>
            <h2 class="text-h2 mb-10 text-center font-bold text-rs-fg">
              Send Money to <span class="text-brand-600">Africa</span>
            </h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CountryCard
                v-for="country in regions.africa"
                :key="country.code"
                :country="country"
                :routes="countryRoutesMap[country.code]"
              />
            </div>
          </section>

          <section>
            <h2 class="text-h2 mb-10 text-center font-bold text-rs-fg">
              Overseas Money Transfers to <span class="text-brand-600">Oceania</span>
            </h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    <CorridorsGridDynamic dark />

    <WhyTrustUs />

    <!-- Mini FAQ Section -->
    <section class="relative bg-gradient-to-br from-neutral-50 to-white py-16 lg:py-20">
      <div class="mx-auto max-w-6xl px-page-x">
        <div class="mb-12 text-center">
          <h2 class="text-h2 mb-4 font-bold text-rs-fg">Frequently Asked Questions</h2>
          <p class="text-body-lg mx-auto max-w-2xl text-neutral-600">
            Quick answers to common questions about money transfers, fees, and our comparison
            platform.
          </p>
        </div>

        <div class="mb-8 grid gap-6 md:grid-cols-2">
          <div class="rounded-xl border border-rs-border bg-surface p-6 shadow-md">
            <h3 class="text-body-lg mb-3 font-bold text-rs-fg">
              How does international money transfer work?
            </h3>
            <p class="mb-4 text-neutral-700">
              International money transfers allow you to send funds from your account to a recipient
              in another country. The provider converts your currency to the recipient's currency
              using an exchange rate, then delivers it to their bank account, mobile wallet, or for
              cash pickup.
            </p>
            <NuxtLink
              to="/faq"
              class="text-body-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Learn more about transfers →
            </NuxtLink>
          </div>

          <div class="rounded-xl border border-rs-border bg-surface p-6 shadow-md">
            <h3 class="text-body-lg mb-3 font-bold text-rs-fg">
              What's the difference between a transfer fee and an exchange rate markup?
            </h3>
            <p class="mb-4 text-neutral-700">
              A <strong>transfer fee</strong> is the upfront charge you see (e.g., $5.99). An
              <strong>exchange rate markup</strong> is hidden in the rate they offer you versus the
              real "mid-market" rate. Always check "Total Received" to see the true cost.
            </p>
            <NuxtLink
              to="/faq"
              class="text-body-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Understand fees better →
            </NuxtLink>
          </div>

          <div class="rounded-xl border border-rs-border bg-surface p-6 shadow-md">
            <h3 class="text-body-lg mb-3 font-bold text-rs-fg">
              How long does an international transfer take?
            </h3>
            <p class="mb-4 text-neutral-700">
              Speed varies by method: Instant (0-30 min) for debit card to mobile wallet, same day
              for many online providers to bank accounts, 1-3 days for bank transfers, and 3-5 days
              for traditional banks.
            </p>
            <NuxtLink
              to="/faq"
              class="text-body-sm font-medium text-brand-600 hover:text-brand-700"
            >
              See delivery times →
            </NuxtLink>
          </div>

          <div class="rounded-xl border border-rs-border bg-surface p-6 shadow-md">
            <h3 class="text-body-lg mb-3 font-bold text-rs-fg">
              Are there limits on how much I can send?
            </h3>
            <p class="mb-4 text-neutral-700">
              Yes, limits vary by provider and your verification level. Unverified accounts
              typically allow $500-$1,000, while ID-verified accounts can send $10,000-$50,000+.
              Banks typically allow higher amounts but charge more.
            </p>
            <NuxtLink
              to="/faq"
              class="text-body-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Check transfer limits →
            </NuxtLink>
          </div>

          <div class="rounded-xl border border-rs-border bg-surface p-6 shadow-md">
            <h3 class="text-body-lg mb-3 font-bold text-rs-fg">Can I track my transfer?</h3>
            <p class="mb-4 text-neutral-700">
              Yes! All modern providers offer tracking via app or website. You'll get updates when
              the transfer is initiated, funds are received by provider, currency is exchanged, and
              money is available to recipient.
            </p>
            <NuxtLink
              to="/faq"
              class="text-body-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Learn about tracking →
            </NuxtLink>
          </div>

          <div class="rounded-xl border border-rs-border bg-surface p-6 shadow-md">
            <h3 class="text-body-lg mb-3 font-bold text-rs-fg">
              Is it cheaper to send large amounts?
            </h3>
            <p class="mb-4 text-neutral-700">
              Generally, yes. Many providers charge a percentage fee (e.g., 1%), so larger amounts
              cost more in absolute terms but the same percentage. Fixed fees ($5) are better for
              large amounts, and some providers offer better rates for $5,000+.
            </p>
            <NuxtLink
              to="/faq"
              class="text-body-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Compare large transfers →
            </NuxtLink>
          </div>
        </div>

        <div class="text-center">
          <NuxtLink
            to="/faq"
            class="text-body-lg inline-flex items-center gap-3 rounded-xl bg-brand-600 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:bg-brand-700"
          >
            <span>View All FAQs</span>
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

    <!-- Our Impact So Far Section -->
    <TrustMetricsStrip />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import {
  COUNTRIES,
  type Country,
  getCountryByCode,
  getAvailableCurrencies,
} from '~/utils/countries-currencies'
import { getCorridorUrl } from '~/utils/country-slugs'
import CorridorsGridDynamic from '~/components/home/CorridorsGridDynamic.vue'
import WhyTrustUs from '~/components/home/WhyTrustUs.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'
import { useCompareForm } from '~/composables/useCompareForm'
import { useRemittanceApi } from '~/composables/useRemittanceApi'
import { useTelemetry } from '~/composables/useTelemetry'
import { useMarketingAnalytics } from '~/composables/useMarketingAnalytics'
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import { setSeo } from '~/composables/useSeo'

const { pulseEnabled } = useFeatureFlags()

const {
  form: moneyForm,
  validationError,
  submit: submitForm,
  statusMessage,
  isWaitingForQuotes,
} = useCompareForm()
const formError = validationError
const formInfo = statusMessage
const { recordSearch } = useRemittanceApi()
const { trackSearch } = useTelemetry()
const { trackSendMoneyView } = useMarketingAnalytics()
const route = useRoute()

// Watch for country changes and reset currency if needed
watch(
  () => moneyForm.value.to,
  (newCountry) => {
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
  },
)

watch(
  () => moneyForm.value.from,
  (newCountry) => {
    if (!newCountry) {
      moneyForm.value.fromCurrency = ''
      return
    }

    const country = getCountryByCode(newCountry)
    if (!country) return

    const availableCurrencies = getAvailableCurrencies(newCountry)

    // If current currency is not available for the new country, reset to country's default currency
    if (
      !moneyForm.value.fromCurrency
      || !availableCurrencies.includes(moneyForm.value.fromCurrency)
    ) {
      moneyForm.value.fromCurrency = country.currency
    }
  },
)

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
  const { from, to, amount, method, fromCurrency, toCurrency } = moneyForm.value
  const corridorId = `${from}-${to}-${fromCurrency}-${toCurrency}`

  void trackSearch({
    corridor_id: corridorId,
    amount,
    payin: 'bank',
    payout: method,
  })
  void recordSearch({
    from_country: from,
    to_country: to,
    amount,
    method,
  } as any)

  await submitForm()
}

onMounted(() => {
  void trackSendMoneyView({ pagePath: route.fullPath })
})

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

const countryLookup = COUNTRIES.reduce(
  (acc, country) => {
    acc[country.code] = country
    return acc
  },
  {} as Record<string, Country>,
)

const buildRoutes = (country: Country): CountryRoutes => {
  const sources = sourceRoutes[country.code] || []
  const uniqueSources = Array.from(new Set(['US', ...sources]))

  const inboundLinks = uniqueSources
    .map((code) => {
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
  COUNTRIES.forEach((country) => {
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
  southEasternAsia: getCountriesByCodes([
    'BN',
    'ID',
    'KH',
    'LA',
    'MM',
    'MY',
    'PH',
    'SG',
    'TH',
    'VN',
    'TL',
  ]),
  middleEast: getCountriesByCodes([
    'AE',
    'AM',
    'AZ',
    'BH',
    'CY',
    'GE',
    'IL',
    'IQ',
    'JO',
    'KW',
    'LB',
    'OM',
    'PS',
    'QA',
    'SA',
    'SY',
    'TR',
    'YE',
  ]),
  eastAsia: getCountriesByCodes(['CN', 'HK', 'JP', 'KR', 'MO', 'MN', 'TW']),
  southAsia: getCountriesByCodes(['AF', 'BD', 'BT', 'IN', 'LK', 'MV', 'NP', 'PK']),
  westernEurope: getCountriesByCodes(['AT', 'BE', 'CH', 'DE', 'FR', 'LI', 'LU', 'MC', 'NL']),
  southernEurope: getCountriesByCodes([
    'AD',
    'AL',
    'BA',
    'ES',
    'GI',
    'GR',
    'HR',
    'IT',
    'ME',
    'MK',
    'MT',
    'PT',
    'RS',
    'SI',
    'SM',
    'VA',
  ]),
  easternEurope: getCountriesByCodes(['BG', 'BY', 'CZ', 'HU', 'MD', 'PL', 'RO', 'RU', 'SK', 'UA']),
  northernEurope: getCountriesByCodes(['DK', 'EE', 'FI', 'GB', 'IE', 'IS', 'LT', 'LV', 'NO', 'SE']),
  northAmerica: getCountriesByCodes(['CA', 'US', 'MX', 'GL']),
  centralAmericaCaribbean: getCountriesByCodes([
    'AG',
    'AI',
    'AW',
    'BB',
    'BM',
    'BS',
    'BZ',
    'CR',
    'CU',
    'CW',
    'DM',
    'DO',
    'GD',
    'GT',
    'HN',
    'HT',
    'JM',
    'KN',
    'KY',
    'LC',
    'MS',
    'NI',
    'PA',
    'PR',
    'SV',
    'TT',
    'VC',
    'VG',
  ]),
  southAmerica: getCountriesByCodes([
    'AR',
    'BO',
    'BR',
    'CL',
    'CO',
    'EC',
    'GF',
    'GY',
    'PE',
    'PY',
    'SR',
    'UY',
    'VE',
  ]),
  africa: getCountriesByCodes([
    'AO',
    'BF',
    'BI',
    'BJ',
    'BW',
    'CD',
    'CF',
    'CG',
    'CI',
    'CM',
    'CV',
    'DJ',
    'DZ',
    'EG',
    'ER',
    'ET',
    'GA',
    'GH',
    'GM',
    'GN',
    'GQ',
    'GW',
    'KE',
    'KM',
    'LR',
    'LS',
    'LY',
    'MA',
    'MG',
    'ML',
    'MR',
    'MU',
    'MW',
    'MZ',
    'NA',
    'NE',
    'NG',
    'RW',
    'SC',
    'SD',
    'SL',
    'SN',
    'SO',
    'ST',
    'SZ',
    'TD',
    'TG',
    'TN',
    'TZ',
    'UG',
    'ZA',
    'ZM',
    'ZW',
  ]),
  oceania: getCountriesByCodes([
    'AS',
    'AU',
    'FJ',
    'FM',
    'GU',
    'KI',
    'MH',
    'NC',
    'NR',
    'NZ',
    'PF',
    'PG',
    'PW',
    'TO',
    'TV',
    'VU',
    'WF',
    'WS',
  ]),
}

const {
  public: { siteUrl },
} = useRuntimeConfig()

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Send Money Abroad',
    description:
      'Compare live rates, fees, and delivery times across 30+ licensed money transfer providers.',
  },
})

setSeo({
  title: 'Send Money Abroad - Compare 30+ Providers | RemitScout',
  description:
    'Compare the best money transfer services to send money abroad. Live exchange rates, transparent fees, and trusted providers across 200+ countries.',
  canonical: `${siteUrl}/send-money`,
  ogImage: false,
})
</script>

<style scoped>
section {
  scroll-margin-top: 100px;
}
</style>
