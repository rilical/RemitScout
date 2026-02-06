<template>
  <div class="min-h-screen bg-white pb-20 md:pb-0 break-words [text-wrap:pretty] [overflow-wrap:anywhere] [hyphens:auto]">
    <CompareWidget />

    <!-- Hero Section with Founder Photo -->
    <section class="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 grid gap-12 lg:grid-cols-12 lg:items-center">
          <!-- Left: Content -->
          <div class="lg:col-span-7">
            <div class="flex flex-wrap items-center gap-3 mb-6">
              <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-md ring-1 ring-brand-200/60">
                <span>🎯</span>
                No pay-to-rank
              </div>
              <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-md ring-1 ring-emerald-200/60">
                <span>✅</span>
                Verified sampling
              </div>
            </div>

            <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl [text-wrap:balance] mb-6">
              About <span class="text-brand-600">Remit-Scout</span>
            </h1>

            <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
              Built by expats. Designed for accuracy.
            </p>

            <p class="text-lg text-neutral-700 leading-relaxed mb-8">
              Remit-Scout is an independent research product that measures real-world remittance pricing so you can see what your recipient receives after fees and FX markup.
            </p>

            <p class="text-base text-neutral-600 leading-relaxed mb-8">
              Developed at <button
                class="font-medium text-brand-600 underline decoration-brand-600/30 hover:text-brand-700 hover:decoration-brand-700"
                @click="handleExternalLink('https://www.cmu.edu/swartz-center-for-entrepreneurship/')"
              >
                Carnegie Mellon (Swartz Center for Entrepreneurship)
              </button>. Remit-Scout is an independent project and is not endorsed by Carnegie Mellon University.
            </p>
          </div>

          <!-- Right: Founder Card -->
          <div class="lg:col-span-5">
            <div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
              <div class="flex flex-col items-center text-center">
                <div class="relative mb-6">
                  <div class="absolute inset-2 rounded-2xl bg-gradient-to-br from-brand-400 via-brand-300 to-emerald-400 blur-xl opacity-60" />
                  <img
                    :src="founderHeadshotUrl"
                    onerror="this.src='/images/about/omar-placeholder.jpg'; this.onerror=null;"
                    alt="Omar Ghabayen, Founder of Remit-Scout"
                    class="relative w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-2xl"
                  >
                </div>
                <div class="inline-block mb-3 px-3 py-1 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                  Founder
                </div>
                <h3 class="text-2xl font-bold text-neutral-900 mb-2">
                  Omar Ghabayen
                </h3>
                <div class="space-y-1 mb-4 text-sm text-neutral-600">
                  <div>🌍 Expat from Jordan</div>
                  <div>💼 Former Payments Analytics, American Express</div>
                  <div>🎓 Carnegie Mellon University</div>
                </div>
                <div class="mb-4">
                  <a
                    href="mailto:omar@remit-scout.com"
                    class="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Contact
                  </a>
                </div>
                <div class="relative pl-4 border-l-4 border-brand-400 italic text-neutral-700 leading-relaxed text-sm">
                  <p>
                    "You earned every dollar. Our job is to show you the deal that gets the most money to your recipient."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Our Impact So Far (Blue Horizontal Section) -->
    <TrustMetricsStrip />

    <!-- Main Content - Condensed -->
    <article class="py-16 lg:py-20">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="prose prose-lg prose-slate max-w-none">
          <!-- Our Story -->
          <section class="mb-12">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span class="text-xl">✈️</span>
              </div>
              <h2 class="text-2xl font-bold text-neutral-900 m-0">
                Our Story
              </h2>
            </div>

            <div class="space-y-4 text-base leading-relaxed text-neutral-700">
              <p>
                In 2023, <strong class="font-semibold text-neutral-900">Omar Ghabayen</strong> left Amman for Carnegie Mellon. Every time his family sent money from Jordan to the US, about <strong class="text-red-600">$30 quietly disappeared</strong>—half from the sending bank, half from the receiving bank.
              </p>

              <p>
                For a student, that's two weeks of food or a required textbook, gone to fine print.
              </p>

              <div class="not-prose my-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <p class="font-medium text-red-900 mb-2 text-sm">
                  The problem got worse:
                </p>
                <ul class="space-y-1 text-red-800 text-sm">
                  <li>• "Low fee" offers hiding high FX markups</li>
                  <li>• Comparison sites rearranged by sponsorships</li>
                  <li>• No one showing the only number that matters: recipient receives</li>
                </ul>
              </div>

              <p class="font-semibold text-neutral-900">
                <span class="text-brand-600">Remit-Scout</span> is our answer—a platform built on real transfers, honest comparisons, and zero pay-to-play rankings.
              </p>
            </div>
          </section>

          <!-- Our Mission -->
          <section class="mb-12">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span class="text-xl">🌍</span>
              </div>
              <h2 class="text-2xl font-bold text-neutral-900 m-0">
                Our Mission
              </h2>
            </div>

            <div class="space-y-4 text-base leading-relaxed text-neutral-700">
              <p class="font-medium text-neutral-800">
                Remit-Scout exists so you always know the landing number:
              </p>

              <ul class="space-y-2 ml-0 list-none">
                <li class="flex items-start gap-2">
                  <span class="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>What your recipient will actually receive</strong> — the full amount after all fees and markups</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>How long it will take</strong> — realistic delivery times based on real transfers</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>What every fee is paying for</strong> — transparent breakdowns, no hidden costs</span>
                </li>
              </ul>

              <p class="text-lg font-semibold text-neutral-900 mt-6">
                We operate on four pillars:
              </p>

              <div class="grid gap-4 sm:grid-cols-2 my-6">
                <div class="rounded-xl border border-slate-200 bg-white p-4">
                  <div class="flex items-start gap-2 mb-2">
                    <span class="text-xl">👀</span>
                    <h3 class="text-base font-semibold text-neutral-900">
                      Transparency
                    </h3>
                  </div>
                  <p class="text-sm text-neutral-700">
                    Clear "recipient gets" amounts and plain-language explanations.
                  </p>
                </div>

                <div class="rounded-xl border border-slate-200 bg-white p-4">
                  <div class="flex items-start gap-2 mb-2">
                    <span class="text-xl">🛡️</span>
                    <h3 class="text-base font-semibold text-neutral-900">
                      Independence
                    </h3>
                  </div>
                  <p class="text-sm text-neutral-700">
                    No paid rankings. Revenue separated from recommendations.
                  </p>
                </div>

                <div class="rounded-xl border border-slate-200 bg-white p-4">
                  <div class="flex items-start gap-2 mb-2">
                    <span class="text-xl">✅</span>
                    <h3 class="text-base font-semibold text-neutral-900">
                      Accuracy
                    </h3>
                  </div>
                  <p class="text-sm text-neutral-700">
                    Real transfers, real receipts, real delivery times.
                  </p>
                </div>

                <div class="rounded-xl border border-slate-200 bg-white p-4">
                  <div class="flex items-start gap-2 mb-2">
                    <span class="text-xl">🤝</span>
                    <h3 class="text-base font-semibold text-neutral-900">
                      Community
                    </h3>
                  </div>
                  <p class="text-sm text-neutral-700">
                    Built by expats, for expats, with constant feedback.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- What Makes Us Different -->
          <section class="mb-12">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span class="text-xl">⭐</span>
              </div>
              <h2 class="text-2xl font-bold text-neutral-900 m-0">
                What Makes Us Different
              </h2>
            </div>

            <div class="space-y-6">
              <div class="rounded-xl border border-slate-200 bg-white p-6">
                <div class="flex items-start gap-3 mb-3">
                  <span class="text-2xl">👀</span>
                  <h3 class="text-lg font-semibold text-neutral-900">
                    Radical Transparency
                  </h3>
                </div>
                <p class="text-sm text-neutral-700 leading-relaxed">
                  We show the total amount your recipient will receive, including transfer fees, exchange rate markups, delivery speed, and payout methods. No guessing, no surprise deductions.
                </p>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white p-6">
                <div class="flex items-start gap-3 mb-3">
                  <span class="text-2xl">🛡️</span>
                  <h3 class="text-lg font-semibold text-neutral-900">
                    Complete Independence
                  </h3>
                </div>
                <p class="text-sm text-neutral-700 leading-relaxed">
                  <strong class="font-semibold text-neutral-900">Providers cannot pay to rank higher—full stop.</strong> Our rankings are driven by data: total cost, delivery speed, reliability, and user experience. Affiliate partnerships never influence rankings.
                </p>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white p-6">
                <div class="flex items-start gap-3 mb-3">
                  <span class="text-2xl">✅</span>
                  <h3 class="text-lg font-semibold text-neutral-900">
                    Human-Verified Accuracy
                  </h3>
                </div>
                <p class="text-sm text-neutral-700 leading-relaxed">
                  We open accounts, run test transfers, time every step, and collect receipts. Recommendations are based on actual experience, not brochures.
                </p>
              </div>
            </div>
          </section>

          <!-- How We Work (Condensed) -->
          <section class="mb-12">
            <div class="mb-6 flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-xl">🧪</span>
                </div>
                <div>
                  <h2 class="text-2xl font-bold text-neutral-900 m-0">
                    How We Work
                  </h2>
                  <p class="mt-1 text-sm text-neutral-600">
                    Test, verify, explain
                  </p>
                </div>
              </div>
              <NuxtLink
                to="/methodology"
                class="hidden sm:flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
              >
                Read More
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
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </NuxtLink>
            </div>

            <div class="space-y-4">
              <div class="rounded-xl border border-slate-200 bg-white p-5">
                <h3 class="text-base font-semibold text-neutral-900 mb-2">
                  <span class="text-blue-600">1.</span> Data Collection & Verification
                </h3>
                <p class="text-sm text-neutral-700">
                  We start with live rates from provider APIs, cross-check with real transfers, and verify licensing with regulators like FCA, FinCEN, and ASIC.
                </p>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white p-5">
                <h3 class="text-base font-semibold text-neutral-900 mb-2">
                  <span class="text-emerald-600">2.</span> Real Transfer Testing
                </h3>
                <p class="text-sm text-neutral-700">
                  We put our own money on the line across different corridors, amounts, and payout methods. We also test customer support response times.
                </p>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white p-5">
                <h3 class="text-base font-semibold text-neutral-900 mb-2">
                  <span class="text-purple-600">3.</span> Total Cost Calculation
                </h3>
                <p class="text-sm text-neutral-700">
                  We compare the real "recipient gets" amount to the mid-market rate. The difference is the hidden markup—we show it all.
                </p>
              </div>

              <div class="bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-200 rounded-xl p-5">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                    <svg
                      class="w-5 h-5 text-white"
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
                  <div class="flex-1">
                    <h3 class="text-base font-bold text-neutral-900 mb-1">
                      <span class="text-orange-600">4.</span> Remit Score Rating System
                    </h3>
                    <p class="text-sm text-neutral-700 mb-2">
                      Each provider gets a <span class="font-semibold">Remit-Score</span> (0-10) based on real transfer data. Scores reflect actual value, speed, reliability, and safety.
                    </p>
                    <button
                      class="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                      @click="showRemitScoreModal = true"
                    >
                      Learn how we calculate Remit-Score →
                    </button>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white p-5">
                <h3 class="text-base font-semibold text-neutral-900 mb-2">
                  <span class="text-slate-600">5.</span> Ongoing Monitoring
                </h3>
                <p class="text-sm text-neutral-700">
                  We refresh provider data multiple times a day, revisit Remit Scores regularly, and update reviews when users report issues.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </article>

    <!-- Ready to Save Form (From Home Screen) -->
    <section class="py-16 lg:py-20 bg-gradient-to-br from-brand-50 to-blue-50">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
            Ready to save on your next transfer?
          </h2>
          <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
            Compare live rates from <span v-text="providersDisplay" /> licensed providers in seconds. See exactly how much your recipient will get - no hidden fees, no marketing fluff.
          </p>
        </div>

        <div class="rounded-3xl border border-brand-200 bg-white p-6 sm:p-8 shadow-xl">
          <form
            class="space-y-4"
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
                  :exclude-country="moneyForm.to"
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
                  :exclude-country="moneyForm.from"
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
              class="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-base font-bold text-white transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 shadow-lg hover:shadow-xl"
            >
              Compare Rates
            </button>
          </form>
        </div>
      </div>
    </section>

    <!-- CTA Banner -->
    <CtaBanner />

    <!-- Partnerships Section -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold text-neutral-900 mb-3">
            Partnerships 🤝
          </h2>
          <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
            Work with us to bring transparency to cross-border payments
          </p>
        </div>

        <div class="rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 lg:p-12">
          <div class="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            <div class="flex flex-col space-y-6">
              <h3 class="text-2xl font-bold text-neutral-900">
                For Money Transfer Providers
              </h3>
              <p class="text-base leading-relaxed text-neutral-700 flex-grow">
                If you're a licensed money transfer provider, we'd love to include you in our comparisons. Our platform helps users find the best rates while driving qualified customers to services that genuinely offer value.
              </p>
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <span class="text-emerald-600 font-bold mt-1">✓</span>
                  <span class="text-neutral-700">Fair, data-driven rankings based on cost, speed, and reliability</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-emerald-600 font-bold mt-1">✓</span>
                  <span class="text-neutral-700">Exposure to 80k+ users comparing rates monthly</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-emerald-600 font-bold mt-1">✓</span>
                  <span class="text-neutral-700">Transparent affiliate partnerships—no pay-to-rank schemes</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col space-y-6">
              <h3 class="text-2xl font-bold text-neutral-900">
                For Organizations & Media
              </h3>
              <p class="text-base leading-relaxed text-neutral-700 flex-grow">
                We partner with universities, expat communities, financial education platforms, and media outlets to bring transparent money transfer information to wider audiences.
              </p>
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <span class="text-blue-600 font-bold mt-1">✓</span>
                  <span class="text-neutral-700">Educational content partnerships and co-branded resources</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-blue-600 font-bold mt-1">✓</span>
                  <span class="text-neutral-700">API access for real-time rate comparisons</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-blue-600 font-bold mt-1">✓</span>
                  <span class="text-neutral-700">White-label solutions for your community</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-10 pt-8 border-t border-slate-200 text-center">
            <p class="text-neutral-700 mb-6">
              Interested in partnering with Remit-Scout? Let's talk about how we can work together.
            </p>
            <NuxtLink
              to="/contact"
              class="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-8 py-4 text-lg font-semibold text-white hover:bg-slate-800 transition-colors shadow-lg"
            >
              Discuss Partnership
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
      </div>
    </section>

    <!-- Trust & Safety FAQ -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <div class="flex items-center justify-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <span class="text-xl">🔒</span>
            </div>
            <h2 class="text-2xl font-bold text-neutral-900 m-0">
              Trust & Safety
            </h2>
          </div>
          <p class="text-base text-neutral-600 max-w-2xl mx-auto">
            Quick answers to common questions
          </p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <FaqAccordion :faqs="faqs" />
        </div>

        <div class="mt-6 text-center">
          <NuxtLink
            to="/faq"
            class="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            View all FAQs
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Quick Links -->
    <section class="py-12 bg-neutral-50">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              🔗
            </div>
            <h3 class="text-lg font-semibold text-neutral-900 m-0">
              See how we work
            </h3>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <NuxtLink
              to="/methodology"
              class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:border-brand-300 hover:text-brand-700 transition-colors font-semibold"
            >
              <span>🧪</span><span>Methodology</span>
            </NuxtLink>
            <NuxtLink
              to="/faq"
              class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:border-brand-300 hover:text-brand-700 transition-colors font-semibold"
            >
              <span>❓</span><span>FAQs</span>
            </NuxtLink>
            <NuxtLink
              to="/how-we-make-money"
              class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:border-brand-300 hover:text-brand-700 transition-colors font-semibold"
            >
              <span>📜</span><span>How we make money</span>
            </NuxtLink>
            <NuxtLink
              to="/contact"
              class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:border-brand-300 hover:text-brand-700 transition-colors font-semibold"
            >
              <span>💬</span><span>Contact</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <RemitScoreModal
      :is-open="showRemitScoreModal"
      @update:is-open="showRemitScoreModal = $event"
    />

    <Teleport to="body">
      <div
        v-if="showExternalLinkModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click="closeExternalLinkModal"
      >
        <div
          class="relative max-w-md w-full rounded-2xl bg-white p-8 shadow-2xl"
          @click.stop
        >
          <button
            class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
            @click="closeExternalLinkModal"
          >
            <svg
              class="h-6 w-6"
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
          </button>

          <div class="text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <svg
                class="h-8 w-8 text-yellow-600"
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
            </div>

            <h3 class="mb-3 text-2xl font-bold text-slate-900">
              You are leaving Remit-Scout
            </h3>
            <p class="mb-6 text-slate-600 leading-relaxed">
              You're about to visit an external website. Remit-Scout is not responsible for the content or privacy practices of external sites.
            </p>

            <div class="flex gap-3">
              <button
                class="flex-1 rounded-lg border-2 border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                @click="closeExternalLinkModal"
              >
                Cancel
              </button>
              <button
                class="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
                @click="confirmExternalLink"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import CtaBanner from '~/components/home/CtaBanner.vue'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
import RemitScoreModal from '~/components/shared/RemitScoreModal.vue'
import { setSeo, jsonLdBreadcrumb, jsonLdOrganization } from '~/composables/useSeo'
import { SITE_STATS } from '~/config/stats'
import { useCompareForm } from '~/composables/useCompareForm'
import { getCorridorUrl } from '~/utils/country-slugs'

// Legacy page kept for backward compatibility. Canonical page is `/about`.
if (import.meta.server) {
  await navigateTo('/about', { redirectCode: 301 })
}
else {
  await navigateTo('/about')
}

const founderHeadshotUrl = '/images/about/omar-ghabayen-headshot.webp'

const { form: moneyForm, submit: submitForm } = useCompareForm()

const handleMoneySubmit = async () => {
  await submitForm()
}

const usersDisplay = SITE_STATS.users.display
const totalSavedDisplay = SITE_STATS.totalSaved.display
const providersDisplay = SITE_STATS.providers.display
const corridorsDisplay = SITE_STATS.corridors.display

const faqs = [
  {
    question: 'How does Remit-Scout make money?',
    answer: '<p>We may earn affiliate commissions when you click a provider link and complete a transfer. These partnerships never influence rankings - providers cannot pay to rank higher.</p><p>If you want the full breakdown, read <a href="/how-we-make-money">How we make money</a>.</p>',
  },
  {
    question: 'Can providers pay to rank higher?',
    answer: '<p>No. Rankings are driven by data: total cost (fees + FX markup), delivery speed, reliability, and user experience. Sponsored placements are kept separate from rankings.</p>',
  },
  {
    question: 'Do you hold or move my money?',
    answer: '<p>No. Remit-Scout is a comparison tool. The transfer happens between you and the licensed provider you choose.</p>',
  },
  {
    question: 'What does recipient gets mean?',
    answer: '<p>It is the amount your recipient actually receives after fees, exchange rate markup, and deductions. It is the number we optimize for because it reflects the real outcome.</p>',
  },
  {
    question: 'How do you verify what providers claim?',
    answer: '<p>We run real transfers, time delivery, and cross-check quotes with outcomes. You can read more on our <a href="/methodology">methodology</a> page.</p>',
  },
]

const showRemitScoreModal = ref(false)
const showExternalLinkModal = ref(false)
const pendingExternalUrl = ref('')

const handleExternalLink = (url: string) => {
  pendingExternalUrl.value = url
  showExternalLinkModal.value = true
}

const confirmExternalLink = () => {
  if (pendingExternalUrl.value) {
    window.open(pendingExternalUrl.value, '_blank', 'noopener,noreferrer')
    closeExternalLinkModal()
  }
}

const closeExternalLinkModal = () => {
  showExternalLinkModal.value = false
  pendingExternalUrl.value = ''
}

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'About Us', path: '/about' },
]

const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'About Us | Remit-Scout - Transparent Money Transfer Comparisons',
  description: 'Built by expats who got tired of losing grocery money to bank fees. Backed by the Carnegie Mellon Swartz Entrepreneurship Program, we run real transfers and fight hidden markups so your family keeps every possible dollar.',
  canonical: siteUrl + '/about',
})

const homeUrl = siteUrl + '/'
const aboutUrl = siteUrl + '/about'
jsonLdBreadcrumb([
  { name: 'Home', url: homeUrl },
  { name: 'About Us', url: aboutUrl },
])

jsonLdOrganization(siteUrl)
</script>

<style scoped>
</style>
