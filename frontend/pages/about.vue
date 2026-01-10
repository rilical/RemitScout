<template>
  <div class="min-h-screen bg-white pb-24 md:pb-0">
    <CompareWidget />

    <!-- Hero -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
              About <span class="text-brand-600">Remit-Scout</span>
            </h1>

            <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
              Built by <span class="font-semibold text-neutral-900">expats</span> for <span class="font-semibold text-brand-600">expats</span>.
            </p>

            <p class="text-lg text-neutral-700 leading-relaxed mb-4 max-w-3xl">
              Remit-Scout is an <strong class="font-semibold text-neutral-900">independent comparison platform</strong> for international money transfers.
              We focus on the outcome that matters most: <span class="font-semibold text-brand-600">what your recipient should receive</span> after fees and FX markup.
            </p>

            <p class="text-base text-neutral-600 leading-relaxed mb-8 max-w-3xl">
              Developed at <a
                href="https://www.cmu.edu/swartz-center-for-entrepreneurship/"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-brand-600 underline decoration-brand-600/30 hover:text-brand-700 hover:decoration-brand-700"
              >Carnegie Mellon (Swartz Center for Entrepreneurship)</a>. Remit-Scout is an independent project and is not endorsed by Carnegie Mellon University.
            </p>

            <div class="mt-8">
              <p class="text-lg font-bold text-neutral-900 mb-3">
                How we stay transparent
              </p>
              <div class="flex items-center gap-x-6 flex-nowrap">
                <NuxtLink
                  to="/methodology"
                  class="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap"
                >
                  <ChartBarIcon class="h-4 w-4 text-current" />
                  Methodology
                  <span aria-hidden="true">→</span>
                </NuxtLink>
                <NuxtLink
                  to="/how-we-make-money"
                  class="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap"
                >
                  <DocumentTextIcon class="h-4 w-4 text-current" />
                  How we make money
                  <span aria-hidden="true">→</span>
                </NuxtLink>
                <NuxtLink
                  to="/contact"
                  class="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap"
                >
                  <ArrowPathIcon class="h-4 w-4 text-current" />
                  Corrections and feedback
                  <span aria-hidden="true">→</span>
                </NuxtLink>
              </div>
            </div>
          </div>

          <div class="lg:pl-8">
            <div class="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700 p-8 shadow-lg">
              <div class="relative pl-4 border-l-4 border-white/30">
                <p class="text-lg sm:text-xl font-semibold text-white leading-relaxed italic mb-4">
                  "You earned every dollar. Our job is to help more of it reach your family."
                </p>
                <p class="text-sm text-white/90">
                  — Omar Ghabayen, Founder
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Who We Are -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Who We Are
          </h2>
          <p class="mt-4 mb-10 leading-relaxed text-neutral-700">
            Remit-Scout is an independent comparison platform operated by <strong class="font-semibold text-neutral-900">Remit-Scout LLC</strong>.
            We do not move or hold your money. When you choose a provider, you complete the transfer on that provider’s licensed platform.
            We earn trust by making our data sources, ranking logic, and revenue model easy to inspect.
          </p>

          <div class="grid gap-6 sm:grid-cols-2 mb-12">
            <div
              v-for="item in whoWeArePrinciples"
              :key="item.title"
              class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <component :is="getIconForEmoji(item.emoji)" class="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 class="text-base font-semibold text-neutral-900">
                    {{ item.title }}
                  </h3>
                  <p class="mt-1 text-sm leading-relaxed text-neutral-600">
                    {{ item.body }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Our Mission -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-6">
            <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Our Mission
          </h2>
          <p class="text-lg leading-relaxed text-neutral-700 mb-4">
            We help <strong class="font-semibold text-neutral-900">migrants, expats, and international families</strong> make confident money transfer decisions by showing what matters most:
            <span class="font-semibold text-brand-600">fees, FX markup, payout options, delivery speed</span>, and the real outcome at the end: what the recipient should receive.
          </p>
          <p class="leading-relaxed text-neutral-600 mb-8">
            If you send once a year, you should still get a fair comparison. If you send every week, you should be able to save, track, and monitor what matters.
            That’s why the core product stays free, with optional tools available through Remit-Scout Plus.
          </p>

          <div class="rounded-3xl border border-blue-200 bg-white shadow-2xl overflow-hidden mb-8">
            <div class="border-b border-blue-100 bg-brand-600 px-6 py-4 text-center">
              <h3 class="text-lg font-bold text-white flex items-center justify-center gap-2">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Find Your Best Rate Now
              </h3>
              <p class="text-sm text-white/90 mt-1">
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
                  class="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  placeholder="500"
                >
              </div>

              <button
                type="submit"
                :disabled="isWaitingForQuotes"
                class="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-base font-bold text-white transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span v-if="isWaitingForQuotes">Checking...</span>
                <span v-else>Compare Rates</span>
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
              </button>

              <p
                v-if="formError"
                class="text-sm text-red-600"
                role="alert"
              >
                {{ formError }}
              </p>
              <p
                v-else-if="formInfo"
                class="text-sm text-slate-600"
                role="status"
              >
                {{ formInfo }}
              </p>
            </form>

            <div class="border-t border-blue-100 bg-blue-50 px-6 py-4">
              <p class="text-sm text-slate-600 leading-relaxed">
                Typical savings vs. banks: <strong class="font-semibold text-slate-900">3–9% per transfer</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Our History -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-6">
            <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Our History
          </h2>

          <div class="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <p class="leading-relaxed text-neutral-700">
                In 2023, founder <strong class="font-semibold text-neutral-900">Omar Ghabayen</strong> left Amman for Carnegie Mellon. Every time his family sent money from Jordan to the US, about <strong class="text-red-600">$30 quietly disappeared</strong>: half from the sending bank, half from the receiving bank.
              </p>
              <p class="mt-4 leading-relaxed text-neutral-600">
                The deeper we looked, the more confusing it got: “low fee” offers hiding FX markups, inconsistent delivery promises, and comparison sites that weren’t always aligned with user outcomes.
              </p>

              <div class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                <p class="text-sm font-semibold text-red-900">
                  What we wanted instead:
                </p>
                <ul class="mt-3 space-y-2 text-sm text-red-800">
                  <li class="flex items-start gap-3">
                    <svg class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Rank by what the recipient should receive, not a headline rate.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <svg class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Explain the “why” behind price differences (fees vs. FX markup).</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <svg class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Keep rankings independent: no pay-to-play placements.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <ol class="space-y-6 border-l-2 border-neutral-200 pl-6">
                <li
                  v-for="item in historyTimeline"
                  :key="item.title"
                  class="relative pl-8"
                >
                  <div class="absolute -left-[1.05rem] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-200 bg-white shadow-sm">
                    <component :is="getIconForEmoji(item.emoji)" class="w-4 h-4 text-brand-600" />
                  </div>
                  <h3 class="text-base font-semibold text-neutral-900">
                    {{ item.title }}
                  </h3>
                  <p class="mt-1 text-sm leading-relaxed text-neutral-600">
                    {{ item.body }}
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Our Leadership -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-6">
            <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Our Leadership
          </h2>
          <p class="leading-relaxed text-neutral-700 mb-8">
            Remit-Scout is founded by <strong class="font-semibold text-brand-600">Omar Ghabayen</strong> and supported by a <span class="font-semibold text-neutral-900">small editorial team</span>. We maintain <strong class="font-semibold text-neutral-900">clear standards</strong>, <span class="font-semibold text-brand-600">disclose partnerships</span>, and keep an <strong class="font-semibold text-neutral-900">open channel for corrections</strong>.
          </p>

          <div class="space-y-6">
            <div>
              <div class="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
                <div class="flex items-start gap-6 mb-6">
                  <div class="flex-shrink-0">
                    <div class="relative">
                      <div class="absolute inset-2 rounded-2xl bg-gradient-to-br from-brand-400 via-brand-300 to-emerald-400 blur-xl opacity-60" />
                      <img
                        :src="founderHeadshotUrl"
                        onerror="this.src='/images/about/omar-placeholder.jpg'; this.onerror=null;"
                        alt="Omar Ghabayen, Founder of Remit-Scout"
                        class="relative w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-2xl"
                      >
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="inline-flex items-center gap-1.5 mb-2 px-3 py-1 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Founder
                    </div>
                    <h3 class="text-xl font-bold text-neutral-900 mb-2">
                      Omar Ghabayen
                    </h3>
                    <div class="space-y-1 mb-3 text-sm text-neutral-600">
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Expat from Jordan
                      </div>
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14v9M4 9v5a3 3 0 003 3h10a3 3 0 003-3V9" />
                        </svg>
                        Carnegie Mellon University
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-4 mb-6">
                  <p class="leading-relaxed text-neutral-700">
                    I grew up in <strong class="font-semibold text-neutral-900">Amman, Jordan</strong>, where cross-border transfers were normal for families. When I moved to
                    <span class="font-semibold text-brand-600">Pittsburgh</span> in 2023 for Carnegie Mellon, I started receiving money from home and noticed the same pattern over and over:
                    the “low fee” story often didn’t match the final outcome.
                  </p>

                  <p class="leading-relaxed text-neutral-600">
                    My family would send <strong class="font-semibold text-neutral-900">$500</strong>, and I’d receive about <span class="font-semibold text-red-600">$470</span>.
                    Some fees were obvious, others were buried in FX markup. And most comparison pages made it worse by ranking providers on a headline rate instead of
                    <span class="font-semibold text-brand-600">what the recipient actually gets</span>.
                  </p>

                  <p class="leading-relaxed text-neutral-600">
                    I built Remit-Scout to answer one question with discipline: <strong class="font-semibold text-neutral-900">what’s the real delivered outcome?</strong>
                    We publish our methodology, disclose how we make money, and keep an open channel for corrections so the product stays useful and honest.
                  </p>
                </div>

                <div class="relative pl-4 border-l-4 border-brand-400 italic text-neutral-700 leading-relaxed text-sm mb-6">
                  <p>
                    "You earned every dollar. Our job is to help more of it reach your family."
                  </p>
                </div>

                <div class="flex flex-wrap gap-3 mb-6">
                  <NuxtLink
                    to="/contact"
                    class="inline-flex min-h-btn items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.25 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.25 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-9 3.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.25 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.25 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    Contact support
                  </NuxtLink>
                </div>

                <p class="text-xs text-neutral-500">
                  Reviewed: {{ lastReviewedLabel }}
                </p>
              </div>
            </div>

            <div>
              <div class="rounded-3xl border border-brand-700 bg-brand-600 p-6 sm:p-8 shadow-sm">
                <h3 class="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  How we keep it accurate
                </h3>
                <p class="text-sm text-white/90 mb-5">
                  The short version of our data checks and editorial standards.
                </p>
                <ul class="space-y-3 text-sm text-white/95 mb-6">
                  <li class="flex items-start gap-3">
                    <component :is="getIconForEmoji('🧪')" class="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                    <span><strong class="font-semibold">Run spot-check transfers</strong> on selected corridors when feasible.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span><strong class="font-semibold">Refresh data frequently</strong> for top corridors; long-tail corridors update less often.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <component :is="getIconForEmoji('🧾')" class="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                    <span><strong class="font-semibold">Disclose affiliate partnerships</strong> and keep ranking logic consistent.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span><strong class="font-semibold">Investigate reports fast</strong> and update content when we confirm issues.</span>
                  </li>
                </ul>

                <div class="mt-6 pt-6 border-t border-white/20">
                  <h4 class="text-sm font-semibold text-white mb-3">
                    Our commitment
                  </h4>
                  <p class="text-sm leading-relaxed text-white/90">
                    We're committed to <strong class="font-semibold text-white">editorial independence</strong>. Providers cannot pay to rank higher, and if we earn affiliate commissions, they're <span class="font-semibold text-white">fully disclosed</span> and never influence our rankings. Your trust is more valuable than any partnership.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- What We Do -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-6">
            <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            What We Do
          </h2>
          <div class="space-y-4 mb-8">
            <p class="text-lg leading-relaxed text-neutral-700">
              We combine <strong class="font-semibold text-neutral-900">live pricing signals</strong> with <span class="font-semibold text-brand-600">clear explanations</span>, so you can choose a provider based on cost, speed, and reliability.
            </p>

            <p class="text-base leading-relaxed text-neutral-600">
              Providers advertise different things: some highlight low fees, others promote a great exchange rate, and many wrap both in marketing language that’s hard to compare.
            </p>

            <p class="text-base leading-relaxed text-neutral-600">
              We pull live quotes from provider APIs, partner feeds, and public quote flows where available, then normalize fees and FX markup into one comparable number:
              <span class="font-semibold text-brand-600">recipient gets</span>. We show total cost upfront, explain what’s driving differences, and rank by outcome, not hype.
            </p>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            <NuxtLink
              v-for="card in whatWeDoCards"
              :key="card.title"
              :to="card.to"
              class="group flex flex-col h-full min-h-[200px] rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-brand-300 hover:shadow-lg"
            >
              <div class="flex items-start gap-3 flex-1">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <component :is="getIconForEmoji(card.emoji)" class="w-5 h-5 text-brand-600" />
                </div>
                <div class="min-w-0 flex-1 flex flex-col">
                  <h3 class="text-base font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors mb-2 leading-tight">
                    {{ card.title }}
                  </h3>
                  <p class="text-sm leading-relaxed text-neutral-600 flex-1">
                    {{ card.body }}
                  </p>
                </div>
              </div>
            </NuxtLink>
          </div>

          <div class="grid gap-8 lg:grid-cols-12 lg:items-stretch">
            <div class="lg:col-span-7 flex flex-col">
              <h3 class="text-xl font-bold text-neutral-900 mb-6">
                How comparisons work
              </h3>
              <ol class="space-y-6">
                <li class="flex gap-4">
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-brand-600">
                    <GlobeAltIcon class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-base font-semibold text-neutral-900">
                      1) Collect quotes
                    </p>
                    <p class="mt-1 text-sm leading-relaxed text-neutral-600">
                      We use <strong class="font-semibold text-neutral-900">provider APIs, partner feeds, and public quote flows</strong> where available. Coverage varies by corridor and payment method.
                    </p>
                  </div>
                </li>
                <li class="flex gap-4">
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-brand-600">
                    <CalculatorIcon class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-base font-semibold text-neutral-900">
                      2) Normalize total cost
                    </p>
                    <p class="mt-1 text-sm leading-relaxed text-neutral-600">
                      We translate <strong class="font-semibold text-neutral-900">fees + FX markup</strong> into comparable numbers so you can see <span class="font-semibold text-brand-600">what the recipient should receive</span>.
                    </p>
                  </div>
                </li>
                <li class="flex gap-4">
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-brand-600">
                    <EyeIcon class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-base font-semibold text-neutral-900">
                      3) Rank and explain
                    </p>
                    <p class="mt-1 text-sm leading-relaxed text-neutral-600">
                      We rank results by outcome and explain what’s driving the difference: so you can choose based on your priorities.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <div class="lg:col-span-5 flex">
              <div class="rounded-3xl border border-brand-700 bg-brand-600 p-6 sm:p-8 w-full flex flex-col">
                <div class="flex items-center gap-3 mb-3">
                  <ExclamationTriangleIcon class="h-6 w-6 text-white flex-shrink-0" />
                  <h3 class="text-base font-bold text-white">
                    Important note
                  </h3>
                </div>
                <p class="text-sm leading-relaxed text-white/90">
                  Rates can change between quote and checkout due to promos, KYC, payment method, and provider rules. Always confirm the final amount on the provider’s checkout screen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Deep Dive -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Take a deep dive
          </h2>
          <p class="mt-4 leading-relaxed text-neutral-700">
            Explore the research and guides we publish and update regularly. If you’re comparing for a big life moment, moving abroad, sending to family, or supporting someone back home, start here.
          </p>

          <div class="mt-8 grid gap-6 sm:grid-cols-2">
            <NuxtLink
              v-for="item in deepDiveLinks"
              :key="item.title"
              :to="item.to"
              class="group rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-brand-300 hover:shadow-lg"
            >
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <component :is="getIconForEmoji(item.emoji)" class="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 class="text-base font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors">
                    {{ item.title }}
                  </h3>
                  <p class="mt-1 text-sm leading-relaxed text-neutral-600">
                    {{ item.body }}
                  </p>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- What We Do - Blue Section -->
    <section class="py-16 lg:py-20 bg-gradient-to-br from-brand-600 via-blue-600 to-brand-700">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl text-center">
          <h2 class="text-3xl font-bold text-white flex items-center justify-center gap-3 mb-6">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            What we don’t compromise on
          </h2>
          <p class="text-lg leading-relaxed text-white/95 mb-8 max-w-3xl mx-auto">
            We built Remit-Scout for people who send money internationally and want a straight answer. That means transparent sources, outcome-first rankings,
            and clear disclosure when we earn revenue.
          </p>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-10">
            <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 text-white">
              <div class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                <CalculatorIcon class="h-6 w-6" />
              </div>
              <h3 class="text-lg font-bold mb-2">
                Outcome-first ranking
              </h3>
              <p class="text-sm text-white/90 leading-relaxed">
                We rank by <strong class="font-semibold">what the recipient should receive</strong>, not a headline rate.
              </p>
            </div>
            <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 text-white">
              <div class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                <ShieldCheckIcon class="h-6 w-6" />
              </div>
              <h3 class="text-lg font-bold mb-2">
                No pay-to-rank
              </h3>
              <p class="text-sm text-white/90 leading-relaxed">
                Providers <strong class="font-semibold">cannot buy placement</strong> in our organic results.
              </p>
            </div>
            <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 text-white">
              <div class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                <ChartBarIcon class="h-6 w-6" />
              </div>
              <h3 class="text-lg font-bold mb-2">
                Live, comparable data
              </h3>
              <p class="text-sm text-white/90 leading-relaxed">
                We track <strong class="font-semibold">{{ SITE_STATS.providers.display }} providers</strong> across {{ SITE_STATS.corridors.display }} corridors, normalized into a single outcome metric.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Coverage / stats -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-6">
            <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Coverage at a glance
          </h2>

          <div class="space-y-6 mb-10">
            <p class="text-lg leading-relaxed text-neutral-700">
              These numbers are <strong class="font-semibold text-neutral-900">directional</strong> and updated as we add providers and corridors. Coverage can vary by payment method and corridor rules.
            </p>

            <p class="leading-relaxed text-neutral-600">
              We focus on comparisons that help people make real decisions, not just lists. That means showing the total cost (fees plus FX markup) and the resulting outcome:
              <span class="font-semibold text-brand-600">what the recipient should receive</span>.
            </p>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div class="text-3xl font-bold text-brand-600">
                  {{ SITE_STATS.providers.display }}
                </div>
              </div>
              <div class="mt-1 text-sm font-semibold text-neutral-900">
                {{ SITE_STATS.providers.label }}
              </div>
              <div class="mt-2 text-xs text-neutral-600">
                Licensed services where available; availability varies by corridor.
              </div>
            </div>
            <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="text-3xl font-bold text-brand-600">
                  {{ SITE_STATS.corridors.display }}
                </div>
              </div>
              <div class="mt-1 text-sm font-semibold text-neutral-900">
                {{ SITE_STATS.corridors.label }}
              </div>
              <div class="mt-2 text-xs text-neutral-600">
                Country/currency pairs with recent comparison data.
              </div>
            </div>
            <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="text-3xl font-bold text-brand-600">
                  {{ SITE_STATS.totalSaved.display }}
                </div>
              </div>
              <div class="mt-1 text-sm font-semibold text-neutral-900">
                {{ SITE_STATS.totalSaved.label }}
              </div>
              <div class="mt-2 text-xs text-neutral-600">
                Typical savings depend on corridor, payment method, and amount.
              </div>
            </div>
            <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <div class="text-3xl font-bold text-brand-600">
                  {{ SITE_STATS.users.display }}
                </div>
              </div>
              <div class="mt-1 text-sm font-semibold text-neutral-900">
                {{ SITE_STATS.users.label }}
              </div>
              <div class="mt-2 text-xs text-neutral-600">
                Built for expats and international families.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Read More / Blogs -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-6">
            <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Read our guides
          </h2>
          <p class="leading-relaxed text-neutral-700 mb-4">
            Browse our <strong class="font-semibold text-neutral-900">expert guides</strong> on money transfers, banking abroad, and financial tips for <span class="font-semibold text-brand-600">expats and international families</span>.
          </p>

          <p class="leading-relaxed text-neutral-600 mb-8">
            Money across borders comes with a learning curve: foreign banking systems, FX rates and markups, compliance rules, and the practical realities of supporting family.
            We write clear guides that cut through jargon and stay current as providers and policies change.
          </p>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <NuxtLink
              v-for="guide in featuredGuides"
              :key="guide.slug"
              :to="guide.to"
              class="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
            >
              <div class="flex items-center gap-2 mb-3">
                <span class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                  {{ guide.category }}
                </span>
                <span class="text-xs text-neutral-500">
                  {{ guide.readTime }}
                </span>
              </div>
              <h3 class="text-lg font-bold text-neutral-900 group-hover:text-brand-600 transition-colors mb-2">
                {{ guide.title }}
              </h3>
              <p class="text-sm text-neutral-600 leading-relaxed flex-1">
                {{ guide.excerpt }}
              </p>
              <div class="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-600 group-hover:text-brand-700">
                Read more
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
              </div>
            </NuxtLink>
          </div>

          <div class="text-center">
            <NuxtLink
              to="/learn"
              class="inline-flex min-h-btn items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            >
              View all guides
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Partnership Section -->
    <section class="py-16 lg:py-20 bg-slate-900">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl text-center">
          <h2 class="text-3xl font-bold text-white mb-6 flex items-center justify-center gap-3">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Partner with Remit-Scout
          </h2>
          <p class="text-lg leading-relaxed text-slate-300 mb-6">
            If you’re a <strong class="font-semibold text-white">licensed money transfer provider</strong> (or you support one) and want accurate coverage on Remit-Scout, we’d like to hear from you.
          </p>
          <p class="text-base leading-relaxed text-slate-400 mb-10">
            Partnerships help us expand coverage, but they don’t buy ranking. We keep <strong class="font-semibold text-white">editorial independence</strong>, and any affiliate relationship is clearly disclosed.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <NuxtLink
              to="/contact"
              class="inline-flex min-h-btn items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <ChatBubbleLeftRightIcon class="h-5 w-5" />
              <span>Get in touch</span>
            </NuxtLink>
            <NuxtLink
              to="/partnerships"
              class="inline-flex min-h-btn items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-8 py-3 text-base font-semibold text-slate-900 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <EyeIcon class="h-5 w-5" />
              <span>Partnership details</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold text-neutral-900">
            Frequently asked questions
          </h2>
          <p class="mt-3 text-neutral-600">
            Quick answers about independence, data, and what we do.
          </p>
        </div>

        <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <FaqAccordion :faqs="faqs" />
        </div>

        <div class="mt-8 text-center">
          <NuxtLink
            to="/faq"
            class="inline-flex min-h-btn items-center justify-center rounded-xl border border-brand-600 bg-white px-6 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
          >
            View all FAQs
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 sm:py-20 bg-brand-600">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          Ready to compare?
        </h2>
        <p class="text-xl sm:text-2xl text-white/90 mb-8">
          Find the best delivered outcome for your corridor
        </p>
        <p class="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
          Compare fees and FX markup across providers, then confirm the final amount on the provider’s checkout.
        </p>
        <NuxtLink
          to="/send-money"
          class="inline-flex items-center gap-3 px-8 py-4 bg-white text-brand-600 font-bold text-lg rounded-xl hover:bg-neutral-50 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <span>Get Started</span>
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowPathIcon,
  CalculatorIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'
import { h } from 'vue'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'
import { SITE_STATS } from '~/config/stats'
import { setSeo, jsonLdBreadcrumb, jsonLdOrganization } from '~/composables/useSeo'
import { useCompareForm } from '~/composables/useCompareForm'
import { useRemittanceApi } from '~/composables/useRemittanceApi'

const { form: moneyForm, validationError, submit: submitForm, statusMessage, isWaitingForQuotes } = useCompareForm()
const formError = validationError
const formInfo = statusMessage
const { recordSearch } = useRemittanceApi()

const handleMoneySubmit = async () => {
  const { from, to, amount, method, fromCurrency, toCurrency } = moneyForm.value
  if (!from || !to || !fromCurrency || !toCurrency || !amount || amount <= 0) {
    formError.value = 'Please complete all fields.'
    return
  }
  formError.value = ''
  await recordSearch({ from, to, amount, method })
  await submitForm()
}

const founderHeadshotUrl = '/images/about/omar-ghabayen-headshot.webp'
const lastReviewedLabel = 'December 14, 2025'
const lastReviewedIso = '2025-12-14'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'About Us', path: '/about' },
]

const faqs = [
  {
    question: 'How does Remit-Scout make money?',
    answer: `
      <p>We may earn an affiliate commission when you click a provider link and complete a purchase. These partnerships never influence rankings: providers cannot pay to rank higher.</p>
      <p>Read our <a href="/how-we-make-money" class="font-semibold text-brand-600 hover:text-brand-700 underline">revenue disclosure</a>.</p>
    `,
  },
  {
    question: 'Do you hold or move my money?',
    answer: `<p>No. Remit-Scout is a comparison tool. The transfer happens directly between you and the licensed provider you choose. We never touch your funds.</p>`,
  },
  {
    question: 'What does "recipient gets" mean?',
    answer: `<p>The amount your recipient should receive after fees and FX markup. It's the real-world outcome, not a headline rate.</p>`,
  },
  {
    question: 'How do you verify provider claims?',
    answer: `<p>We combine provider APIs, partner feeds, public quote flows, and periodic spot-check transfers on selected corridors. If users report discrepancies, we investigate and correct quickly.</p>`,
  },
  {
    question: 'How often are rates updated?',
    answer: `<p>Top corridors refresh frequently; long-tail corridors refresh less often. Rates can change between quote and checkout due to promos, KYC, payment method, and provider rules.</p>`,
  },
]

const whoWeArePrinciples = [
  {
    emoji: '🧾',
    title: 'No pay-to-rank',
    body: 'Providers cannot pay to rank higher. If we earn affiliate commissions, it’s disclosed and does not change the ranking logic.',
  },
  {
    emoji: '🧪',
    title: 'Verified sampling',
    body: 'We run spot-check testing on selected corridors to validate provider claims when feasible.',
  },
  {
    emoji: '🔎',
    title: 'Outcome-first comparisons',
    body: 'We emphasize “recipient gets” and total cost so you can compare real outcomes, not marketing rates.',
  },
  {
    emoji: '🛡️',
    title: 'Clear corrections path',
    body: 'If you spot an error in pricing, fees, or content, reach out. When we confirm an issue, we typically update within 48 hours.',
  },
]

const historyTimeline = [
  {
    emoji: '💸',
    title: 'The fee problem',
    body: 'Bank transfers were expensive and unclear, especially once sending + receiving bank fees stacked up.',
  },
  {
    emoji: '🧠',
    title: 'Build the comparison engine',
    body: 'We started collecting live pricing signals and documenting a transparent ranking approach.',
  },
  {
    emoji: '📈',
    title: 'Publish, verify, repeat',
    body: `We expand coverage and keep updating: now tracking ${SITE_STATS.providers.display} providers across ${SITE_STATS.corridors.display} corridors.`,
  },
]

const whatWeDoCards = [
  {
    emoji: '💸',
    title: 'Transfer Comparison',
    body: 'Compare fees, FX markup, payout methods, and speed across providers.',
    to: '/send-money',
  },
  {
    emoji: '⭐️',
    title: 'Provider Reviews',
    body: 'Independent notes on coverage, payout options, and trust signals.',
    to: '/providers',
  },
  {
    emoji: '📈',
    title: 'Exchange Rate Tools',
    body: 'Track rates and learn what “mid-market” means in practice.',
    to: '/exchange-rates',
  },
  {
    emoji: '📚',
    title: 'Expat Guides',
    body: 'Practical articles on saving money across borders.',
    to: '/learn',
  },
]

const deepDiveLinks = [
  {
    emoji: '🧪',
    title: 'Our methodology',
    body: 'How we collect quotes, normalize costs, and verify coverage.',
    to: '/methodology',
  },
  {
    emoji: '🧾',
    title: 'How we make money',
    body: 'Affiliate disclosure and how we stay independent.',
    to: '/how-we-make-money',
  },
  {
    emoji: '🤝',
    title: 'Partnerships',
    body: 'What partnerships mean and what they don’t.',
    to: '/partnerships',
  },
  {
    emoji: '❓',
    title: 'FAQs',
    body: 'Quick answers about accuracy, rankings, and updates.',
    to: '/faq',
  },
]

const featuredGuides = [
  {
    slug: 'how-to-send-money-abroad',
    title: 'How to Send Money Abroad: Complete Guide',
    excerpt: 'Everything you need to know about international money transfers, from choosing a provider to understanding fees.',
    category: 'Basics',
    readTime: '8 min read',
    to: '/learn/how-to-send-money-abroad',
  },
  {
    slug: 'understanding-fx-rates',
    title: 'Understanding FX Rates and Markups',
    excerpt: 'Learn how exchange rates work, what mid-market means, and how providers add markups.',
    category: 'FX Basics',
    readTime: '6 min read',
    to: '/learn/understanding-fx-rates',
  },
  {
    slug: 'banking-abroad-guide',
    title: 'Banking Abroad: Opening Accounts Overseas',
    excerpt: 'Practical tips for opening bank accounts, managing money, and staying compliant when living abroad.',
    category: 'Banking',
    readTime: '10 min read',
    to: '/learn/banking-abroad-guide',
  },
]

const getIconForEmoji = (emoji: string) => {
  const iconMap: Record<string, any> = {
    '🧾': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
    ]),
    '🧪': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' })
    ]),
    '🔎': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' })
    ]),
    '🛡️': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' })
    ]),
    '💸': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
    ]),
    '🧠': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' })
    ]),
    '📈': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' })
    ]),
    '⭐️': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' })
    ]),
    '📚': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' })
    ]),
    '🤝': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' })
    ]),
    '❓': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
    ]),
  }
  return iconMap[emoji] || (() => h('span', { class: 'text-xl' }, emoji))
}

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'
const canonicalUrl = `${siteUrl}/about`

setSeo({
  title: 'About Remit-Scout | Independent Money Transfer Comparisons',
  description: 'Meet Remit-Scout: an independent platform built by expats to help migrants and international families compare money transfer costs, speed, and outcomes with transparent methodology.',
  canonical: canonicalUrl,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'About Us', url: canonicalUrl },
])

jsonLdOrganization(siteUrl)

useHead({
  meta: [
    { name: 'author', content: 'Remit-Scout Editorial Team' },
    { property: 'article:modified_time', content: lastReviewedIso },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        'name': 'About Remit-Scout',
        'url': canonicalUrl,
        'description': 'Learn who we are, how we compare providers, and how we stay independent.',
        'dateModified': lastReviewedIso,
        'publisher': {
          '@type': 'Organization',
          'name': 'Remit-Scout',
          'url': siteUrl,
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': 'Omar Ghabayen',
        'jobTitle': 'Founder',
        'affiliation': {
          '@type': 'Organization',
          'name': 'Remit-Scout',
        },
        'alumniOf': {
          '@type': 'EducationalOrganization',
          'name': 'Carnegie Mellon University',
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqs.map(faq => ({
          '@type': 'Question',
          'name': faq.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.answer.replace(/<[^>]*>/g, '').trim(),
          },
        })),
      }),
    },
  ],
})
</script>
