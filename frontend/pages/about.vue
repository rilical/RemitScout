<template>
  <div class="min-h-screen bg-white pb-24 md:pb-0">
    <CompareWidget />

    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12">
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            About <span class="text-brand-600">Remit-Scout</span>
          </h1>

          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed max-w-4xl">
            Built by <span class="font-semibold text-neutral-900">expats</span>. Designed for <span class="font-semibold text-brand-600">accuracy</span>.
          </p>

          <p class="text-lg text-neutral-700 leading-relaxed mb-4 max-w-4xl">
            Remit-Scout is an <strong class="font-semibold text-neutral-900">independent comparison platform</strong> for international money transfers.
            We focus on the number that matters most: <span class="font-semibold text-brand-600">what your recipient gets</span>
            after fees and FX markup.
          </p>

          <p class="text-base text-neutral-600 leading-relaxed mb-8 max-w-4xl">
            Developed at <a
              href="https://www.cmu.edu/swartz-center-for-entrepreneurship/"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-brand-600 underline decoration-brand-600/30 hover:text-brand-700 hover:decoration-brand-700"
            >Carnegie Mellon (Swartz Center for Entrepreneurship)</a>. Remit-Scout is an independent project and is not endorsed by Carnegie Mellon University.
          </p>

          <div class="flex flex-wrap items-center gap-4">
            <NuxtLink
              to="/send-money"
              class="inline-flex min-h-btn items-center justify-center rounded-xl bg-brand-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            >
              💸 Compare rates
            </NuxtLink>
            <NuxtLink
              to="/methodology"
              class="inline-flex min-h-btn items-center justify-center rounded-xl border-2 border-brand-600 bg-white px-8 py-3 text-base font-semibold text-brand-600 shadow-sm transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            >
              📊 Read methodology
            </NuxtLink>
            <NuxtLink
              to="/contact"
              class="inline-flex min-h-btn items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            >
              📧 Contact
            </NuxtLink>
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
            Our mission is to guide <strong class="font-semibold text-neutral-900">migrants, expats, and international families</strong> through their financial journey abroad, starting with the moment that matters most: <span class="font-semibold text-brand-600">sending money home</span>.
          </p>
          <p class="leading-relaxed text-neutral-600 mb-8">
            We help you compare <strong class="font-semibold text-neutral-900">live fees, FX markup, payout options, and delivery speed</strong> so you can choose based on <span class="font-semibold text-brand-600">outcomes (not marketing)</span>. In plain terms: we try to help <strong class="font-semibold text-neutral-900">more of your money reach your family</strong>.
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
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
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

    <!-- Who We Are -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
              <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                <span class="text-2xl">👋</span>
                Who We Are
              </h2>
              <p class="mt-4 leading-relaxed text-neutral-700">
                Remit-Scout is an independent comparison platform. We don’t move or hold your money:transfers happen directly with the licensed provider you choose. We aim to earn trust by being transparent about how we collect data, how we rank, and how we make money.
              </p>

          <div class="grid gap-6 sm:grid-cols-2 mb-8">
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

          <div class="flex flex-wrap gap-3">
            <NuxtLink
              to="/methodology"
              class="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Methodology →
            </NuxtLink>
            <NuxtLink
              to="/how-we-make-money"
              class="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Revenue disclosure →
            </NuxtLink>
            <NuxtLink
              to="/contact"
              class="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Corrections & feedback →
            </NuxtLink>
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
                    I grew up in <strong class="font-semibold text-neutral-900">Amman, Jordan</strong>, where sending money abroad was a regular part of family life. When I moved to <span class="font-semibold text-brand-600">Pittsburgh</span> in 2023 as a <strong class="font-semibold text-neutral-900">computer engineering student</strong> at Carnegie Mellon, I experienced the other side of that equation: receiving money from home. That's when I noticed something frustrating: every transfer seemed to lose money in ways that weren't clearly explained.
                  </p>
                  
                  <p class="leading-relaxed text-neutral-600">
                    My family would send <strong class="font-semibold text-neutral-900">$500</strong>, but I'd only receive about <span class="font-semibold text-red-600">$470</span>. The breakdown was confusing: some fees were visible, others were hidden in the exchange rate markup. When I tried to compare providers, I found comparison sites that ranked by <strong class="font-semibold text-neutral-900">headline rates</strong> rather than <span class="font-semibold text-brand-600">actual recipient outcomes</span>.
                  </p>
                  
                  <p class="leading-relaxed text-neutral-600">
                    As a <strong class="font-semibold text-neutral-900">computer engineering student</strong>, I started building tools to <strong class="font-semibold text-neutral-900">normalize and compare</strong> real-world transfer costs. I realized that what expats and international families needed wasn't another marketing-heavy comparison site: they needed <span class="font-semibold text-brand-600">transparency</span> and <strong class="font-semibold text-neutral-900">outcome-based rankings</strong>.
                  </p>
                  
                  <p class="leading-relaxed text-neutral-600">
                    Today, Remit-Scout helps thousands of people make <strong class="font-semibold text-neutral-900">better financial decisions</strong> by showing exactly what recipients will receive. I still review key pages regularly, prioritize <span class="font-semibold text-brand-600">clarity over hype</span>, and keep an open channel for feedback. Because this platform exists to serve the community that inspired it: expats, migrants, and international families navigating the complexities of cross-border finance.
                  </p>
                </div>

                <div class="relative pl-4 border-l-4 border-brand-400 italic text-neutral-700 leading-relaxed text-sm mb-6">
                  <p>
                    "You earned every dollar. Our job is to help more of it reach your family."
                  </p>
                </div>

                <div class="flex flex-wrap gap-3 mb-6">
                  <a
                    href="mailto:omar@remit-scout.com"
                    class="inline-flex min-h-btn items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
                  >
                    📩 Email Omar
                  </a>
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
              <div class="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
                <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <span>🔍</span>
                  How we keep it accurate
                </h3>
                <ul class="space-y-3 text-sm text-neutral-700 mb-6">
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
                
                <div class="mt-6 pt-6 border-t border-neutral-200">
                  <h4 class="text-sm font-semibold text-neutral-900 mb-3">
                    Our commitment
                  </h4>
                  <p class="text-sm leading-relaxed text-neutral-600">
                    We're committed to <strong class="font-semibold text-neutral-900">editorial independence</strong>. Providers cannot pay to rank higher, and if we earn affiliate commissions, they're <span class="font-semibold text-brand-600">fully disclosed</span> and never influence our rankings. Your trust is more valuable than any partnership.
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
          <p class="leading-relaxed text-neutral-700 mb-4">
            We combine <strong class="font-semibold text-neutral-900">live pricing signals</strong> with <span class="font-semibold text-brand-600">clear explanations</span>, so you can choose a provider based on <strong class="font-semibold text-neutral-900">cost, speed, and reliability</strong>.
          </p>
          
          <p class="leading-relaxed text-neutral-600 mb-4">
            Every money transfer comparison starts with a simple question: <strong class="font-semibold text-neutral-900">"How much will my recipient actually get?"</strong> But answering that question isn't always straightforward. Providers advertise different things: some highlight <span class="font-semibold text-brand-600">low fees</span>, others promote <strong class="font-semibold text-neutral-900">great exchange rates</strong>, and many use marketing language that makes direct comparison difficult.
          </p>
          
          <p class="leading-relaxed text-neutral-600 mb-8">
            That's where we come in. We pull <strong class="font-semibold text-neutral-900">live quotes</strong> from provider APIs and partner feeds, then normalize everything into a single, comparable metric: <span class="font-semibold text-brand-600">recipient amount</span>. We show you the total cost (fees + FX markup) upfront, explain what's driving price differences, and rank results by outcome, not marketing claims. Because when you're sending money to family, you deserve to know exactly what they'll receive.
          </p>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                <NuxtLink
                  v-for="card in whatWeDoCards"
                  :key="card.title"
                  :to="card.to"
                  class="group rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-brand-300 hover:shadow-lg"
                >
                  <div class="flex items-start gap-3">
                    <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                      <span class="text-xl">{{ card.emoji }}</span>
                    </div>
                    <div>
                      <h3 class="text-base font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors">
                        {{ card.title }}
                      </h3>
                      <p class="mt-1 text-sm leading-relaxed text-neutral-600">
                        {{ card.body }}
                      </p>
                    </div>
                  </div>
                </NuxtLink>
              </div>

          <div class="grid gap-8 lg:grid-cols-12 lg:items-start">
            <div class="lg:col-span-7">
              <h3 class="text-xl font-bold text-neutral-900 mb-6">
                How comparisons work
              </h3>
              <ol class="space-y-6">
                    <li class="flex gap-4">
                      <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white">
                        <span class="text-lg">🌐</span>
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
                      <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white">
                        <span class="text-lg">🧮</span>
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
                      <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white">
                        <span class="text-lg">🏁</span>
                      </div>
                      <div>
                        <p class="text-base font-semibold text-neutral-900">
                          3) Rank and explain
                        </p>
                        <p class="mt-1 text-sm leading-relaxed text-neutral-600">
                          We rank results by outcome and explain what’s driving the difference:so you can choose based on your priorities.
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div class="lg:col-span-5">
                  <div class="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
                    <h3 class="text-sm font-semibold text-neutral-900">
                      Important note
                    </h3>
                    <p class="mt-2 text-sm leading-relaxed text-neutral-600">
                      Rates can change between quote and checkout due to promos, KYC, payment method, and provider rules. Always confirm the final amount on the provider’s checkout screen.
                    </p>
                    <div class="mt-6 flex flex-wrap gap-3">
                      <NuxtLink
                        to="/methodology"
                        class="text-sm font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Methodology →
                      </NuxtLink>
                      <NuxtLink
                        to="/faq"
                        class="text-sm font-semibold text-brand-600 hover:text-brand-700"
                      >
                        FAQs →
                      </NuxtLink>
                    </div>
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
                Explore the research and guides we publish and update regularly. If you’re comparing for a big life moment:moving abroad, sending to family, or supporting someone back home:start here.
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
            Why Remit-Scout Stands Out
          </h2>
          <p class="text-lg leading-relaxed text-white/95 mb-4 max-w-3xl mx-auto">
            We're not just another comparison site. We're <strong class="font-semibold text-white">built by expats, for expats</strong>, with a focus on <span class="font-semibold text-white">real outcomes</span>, not marketing fluff.
          </p>
          
          <p class="text-base leading-relaxed text-white/90 mb-4 max-w-3xl mx-auto">
            Most comparison sites are built by companies that have never sent money abroad themselves. They focus on <strong class="font-semibold text-white">click-through rates</strong> and <span class="font-semibold text-white">affiliate commissions</span>, not whether their rankings actually help people save money. We took a different approach.
          </p>
          
          <p class="text-base leading-relaxed text-white/90 mb-8 max-w-3xl mx-auto">
            Remit-Scout was born from a real problem: <strong class="font-semibold text-white">opaque fees and confusing pricing</strong> that made it nearly impossible to compare providers fairly. We built the platform we wish existed when we were first navigating international money transfers: one that prioritizes <span class="font-semibold text-white">transparency</span>, <strong class="font-semibold text-white">outcome-based rankings</strong>, and <span class="font-semibold text-white">genuine independence</span> from provider influence.
          </p>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-10">
            <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 text-white">
              <div class="text-3xl mb-3">🎯</div>
              <h3 class="text-lg font-bold mb-2">Outcome-First</h3>
              <p class="text-sm text-white/90 leading-relaxed">
                We rank by <strong class="font-semibold">what your recipient gets</strong>, not headline rates.
              </p>
            </div>
            <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 text-white">
              <div class="text-3xl mb-3">🔒</div>
              <h3 class="text-lg font-bold mb-2">No Pay-to-Rank</h3>
              <p class="text-sm text-white/90 leading-relaxed">
                Providers <strong class="font-semibold">cannot buy placement</strong> in our organic results.
              </p>
            </div>
            <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 text-white">
              <div class="text-3xl mb-3">📊</div>
              <h3 class="text-lg font-bold mb-2">Live Data</h3>
              <p class="text-sm text-white/90 leading-relaxed">
                Real-time quotes from <strong class="font-semibold">{{ SITE_STATS.providers.display }} providers</strong> across {{ SITE_STATS.corridors.display }} corridors.
              </p>
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
            Read More About Money Transfers
          </h2>
          <p class="leading-relaxed text-neutral-700 mb-4">
            Browse our <strong class="font-semibold text-neutral-900">expert guides</strong> on money transfers, banking abroad, and financial tips for <span class="font-semibold text-brand-600">expats and international families</span>.
          </p>
          
          <p class="leading-relaxed text-neutral-600 mb-4">
            Moving abroad or sending money internationally comes with a steep learning curve. We've been there: navigating <strong class="font-semibold text-neutral-900">foreign banking systems</strong>, understanding <span class="font-semibold text-brand-600">FX rates and markups</span>, and figuring out the best ways to stay connected with family back home. That's why we write practical, no-nonsense guides that cut through the jargon.
          </p>
          
          <p class="leading-relaxed text-neutral-600 mb-8">
            Our guides cover everything from <strong class="font-semibold text-neutral-900">opening bank accounts overseas</strong> to <span class="font-semibold text-brand-600">choosing the right eSIM</span> for international travel. We explain complex topics in plain language, share real-world examples, and update content regularly as regulations and best practices change. Because financial literacy shouldn't be a luxury: it should be accessible to everyone, regardless of where you're from or where you're going.
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
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </NuxtLink>
          </div>

          <div class="text-center">
            <NuxtLink
              to="/learn"
              class="inline-flex min-h-btn items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            >
              📚 View All Guides
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Coverage / stats -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-6">
            <span class="text-2xl">📊</span>
            Coverage at a glance
          </h2>
          
          <div class="space-y-6 mb-10">
            <p class="text-lg leading-relaxed text-neutral-700">
              Numbers are <strong class="font-semibold text-neutral-900">directional and updated regularly</strong> as we add providers and corridors. We're constantly expanding our coverage to help more expats and international families make <span class="font-semibold text-brand-600">better financial decisions</span>.
            </p>
            
            <p class="leading-relaxed text-neutral-600">
              When we started, we focused on <strong class="font-semibold text-neutral-900">high-volume corridors</strong> like US to Mexico, UK to India, and Australia to the Philippines. These routes see millions of transfers each year, and even small fee differences can add up to <span class="font-semibold text-brand-600">hundreds of dollars saved</span> per family annually.
            </p>
            
            <p class="leading-relaxed text-neutral-600">
              Today, we track <strong class="font-semibold text-neutral-900">{{ SITE_STATS.providers.display }} providers</strong> across <span class="font-semibold text-neutral-900">{{ SITE_STATS.corridors.display }} corridors</span>, from major remittance companies to digital-first startups. Each provider brings different strengths: some excel at <span class="font-semibold text-brand-600">speed</span>, others at <strong class="font-semibold text-neutral-900">low fees</strong>, and some offer unique payout methods like mobile wallets or cash pickup networks.
            </p>
            
            <p class="leading-relaxed text-neutral-600">
              Our goal isn't just to list providers: it's to show you <strong class="font-semibold text-neutral-900">real outcomes</strong>. That means factoring in both the upfront fee and the FX markup, so you can see exactly <span class="font-semibold text-brand-600">what your recipient will receive</span>. Because at the end of the day, that's the number that matters most.
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

    <!-- Partnership Section -->
    <section class="py-16 lg:py-20 bg-slate-900">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl text-center">
          <h2 class="text-3xl font-bold text-white mb-6">
            🤝 Partner with Remit-Scout
          </h2>
          <p class="text-lg leading-relaxed text-slate-300 mb-6">
            Are you a <strong class="font-semibold text-white">licensed money transfer provider</strong> looking to reach expats and international families? We're always interested in <span class="font-semibold text-white">expanding our coverage</span> and helping more people make informed financial decisions.
          </p>
          <p class="text-base leading-relaxed text-slate-400 mb-4">
            We work with providers who share our commitment to <strong class="font-semibold text-white">transparency</strong> and <span class="font-semibold text-white">outcome-based comparisons</span>. Whether you're a major remittance company or a digital-first startup, we're open to partnerships that help users make better choices.
          </p>
          <p class="text-base leading-relaxed text-slate-400 mb-10">
            We maintain <strong class="font-semibold text-white">editorial independence</strong> in all partnerships. Providers cannot pay to rank higher, and all affiliate relationships are <span class="font-semibold text-white">fully disclosed</span> to our users. Your trust is more valuable than any partnership.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <NuxtLink
              to="/contact"
              class="inline-flex min-h-btn items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <span>📧</span>
              <span>Get in touch</span>
            </NuxtLink>
            <NuxtLink
              to="/how-we-make-money"
              class="inline-flex min-h-btn items-center justify-center gap-2 rounded-xl border-2 border-slate-600 bg-transparent px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <span>💼</span>
              <span>Learn about our partnerships</span>
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

    <!-- What are you waiting for CTA -->
    <section class="py-16 sm:py-20 bg-brand-600">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          What are you waiting for?
        </h2>
        <p class="text-xl sm:text-2xl text-white/90 mb-8">
          <span class="font-semibold">Save today</span> on your next transfer
        </p>
        <p class="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
          Compare rates and send money with confidence in just a few clicks
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
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'
import { SITE_STATS } from '~/config/stats'
import { setSeo, jsonLdBreadcrumb, jsonLdOrganization } from '~/composables/useSeo'
import { useCompareForm } from '~/composables/useCompareForm'
import { useRemittanceApi } from '~/composables/useRemittanceApi'
import {
  ArrowPathIcon,
  BeakerIcon,
  CalculatorIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'

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
  await recordSearch({ from, to, amount, method, fromCurrency, toCurrency })
  await submitForm()
}

const founderHeadshotUrl = '/images/about/omar-ghabayen-headshot.webp'
const lastReviewedLabel = 'December 2025'
const lastReviewedIso = '2025-12-13'

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
    body: 'If you spot an error in pricing, fees, or content, reach out: we investigate and update quickly when confirmed.',
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
    title: 'Live money transfer comparisons',
    body: 'Compare fees, FX markup, payout method, and speed across providers.',
    to: '/send-money',
  },
  {
    emoji: '⭐️',
    title: 'Provider reviews',
    body: 'Independent notes on coverage, payout options, and trust signals.',
    to: '/providers',
  },
  {
    emoji: '📈',
    title: 'Exchange-rate tools',
    body: 'Track rates and learn what “mid-market” means in practice.',
    to: '/exchange-rates',
  },
  {
    emoji: '📚',
    title: 'Guides for expats',
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
    title: 'Affiliate partnerships',
    body: 'What partnerships mean and what they don’t.',
    to: '/affiliate-partnerships',
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
        name: 'About Remit-Scout',
        url: canonicalUrl,
        description: 'Learn who we are, how we compare providers, and how we stay independent.',
        dateModified: lastReviewedIso,
        publisher: {
          '@type': 'Organization',
          name: 'Remit-Scout',
          url: siteUrl,
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Omar Ghabayen',
        jobTitle: 'Founder',
        affiliation: {
          '@type': 'Organization',
          name: 'Remit-Scout',
        },
        alumniOf: {
          '@type': 'EducationalOrganization',
          name: 'Carnegie Mellon University',
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer.replace(/<[^>]*>/g, '').trim(),
          },
        })),
      }),
    },
  ],
})
</script>
