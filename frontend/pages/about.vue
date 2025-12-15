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
            <span class="text-2xl">👋</span>
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
                  <span class="text-xl">{{ item.emoji }}</span>
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
            <span class="text-2xl">🎯</span>
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
                <span>💸</span>
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
                class="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-base font-bold text-white transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 shadow-lg hover:shadow-xl"
              >
                Compare Rates
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
            <span class="text-2xl">🕰️</span>
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
                    <span class="mt-0.5">✅</span>
                    <span>Rank by what the recipient should receive, not a headline rate.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="mt-0.5">✅</span>
                    <span>Explain the “why” behind price differences (fees vs. FX markup).</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="mt-0.5">✅</span>
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
                    <span class="text-base">{{ item.emoji }}</span>
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
            <span class="text-2xl">🧑‍💼</span>
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
                    <div class="inline-block mb-2 px-3 py-1 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                      👤 Founder
                    </div>
                    <h3 class="text-xl font-bold text-neutral-900 mb-2">
                      Omar Ghabayen
                    </h3>
                    <div class="space-y-1 mb-3 text-sm text-neutral-600">
                      <div>🌍 Expat from Jordan</div>
                      <div>🎓 Carnegie Mellon University</div>
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
                    💬 Contact support
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
                  <span>🔍</span>
                  How we keep it accurate
                </h3>
                <p class="text-sm text-white/90 mb-5">
                  The short version of our data checks and editorial standards.
                </p>
                <ul class="space-y-3 text-sm text-white/95 mb-6">
                  <li class="flex items-start gap-3">
                    <span class="mt-0.5 text-lg">🧪</span>
                    <span><strong class="font-semibold">Run spot-check transfers</strong> on selected corridors when feasible.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="mt-0.5 text-lg">🔁</span>
                    <span><strong class="font-semibold">Refresh data frequently</strong> for top corridors; long-tail corridors update less often.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="mt-0.5 text-lg">🧾</span>
                    <span><strong class="font-semibold">Disclose affiliate partnerships</strong> and keep ranking logic consistent.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="mt-0.5 text-lg">🛠️</span>
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
            <span class="text-2xl">🧭</span>
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
                  <span class="text-xl">{{ card.emoji }}</span>
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
            <span class="text-2xl">📚</span>
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
                  <span class="text-xl">{{ item.emoji }}</span>
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
            <span class="text-2xl">💎</span>
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
            <span class="text-2xl">📊</span>
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
                <span class="text-2xl">🏢</span>
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
                <span class="text-2xl">🌍</span>
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
                <span class="text-2xl">💰</span>
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
                <span class="text-2xl">👥</span>
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
            <span class="text-2xl">📖</span>
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
          <h2 class="text-3xl font-bold text-white mb-6">
            🤝 Partner with Remit-Scout
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
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'
import { SITE_STATS } from '~/config/stats'
import { setSeo, jsonLdBreadcrumb, jsonLdOrganization } from '~/composables/useSeo'
import { useCompareForm } from '~/composables/useCompareForm'
import { useRemittanceApi } from '~/composables/useRemittanceApi'

const { form: moneyForm, validationError, submit: submitForm } = useCompareForm()
const formError = validationError
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
