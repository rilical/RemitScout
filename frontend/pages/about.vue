<template>
  <div class="min-h-screen bg-white pb-24 md:pb-0">
    <CompareWidget />

    <!-- Hero -->
    <section class="relative overflow-hidden bg-gray-900 py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6 whitespace-nowrap">
            Remittance Intelligence.
          </h1>

          <p class="text-xl text-white sm:text-2xl font-medium mb-6 leading-relaxed">
            Banks profit from <span class="text-blue-600">confusion</span>.<br>We profit from <span class="text-blue-600">clarity</span>.
          </p>

          <p class="text-lg text-slate-200 leading-relaxed mb-4 max-w-3xl">
            Remit-Scout is a <strong class="font-semibold text-white">quantitative comparison engine</strong> for cross border capital. We aggregate real time FX data to expose the true cost of international transfers, stripping away hidden spreads to reveal the only metric that matters: <span class="font-semibold text-brand-400">Net Delivered Value</span>.
          </p>

          <p class="text-base text-slate-300 leading-relaxed mb-8 max-w-3xl">
            Incubated at the <a
              href="https://www.cmu.edu/swartz-center-for-entrepreneurship/"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-brand-400 underline decoration-brand-400/30 hover:text-brand-300 hover:decoration-brand-300"
            >Swartz Center for Entrepreneurship, CMU</a>.
          </p>
        </div>
      </div>
    </section>

    <!-- Who We Are -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-6">
                <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Who We Are
              </h2>
              <div class="space-y-6">
                <p class="text-lg sm:text-xl leading-relaxed text-neutral-700">
                  <strong class="font-semibold text-brand-600">Remit-Scout</strong> is an independent comparison platform operated by <strong class="font-semibold text-neutral-900">Remit-Scout LLC</strong>. 
                  We are committed to providing transparent, accurate, and unbiased information to help you make informed decisions about international money transfers.
                </p>
                
                <p class="text-lg sm:text-xl leading-relaxed text-neutral-700">
                  Trust is earned through transparency. That's why we make our data sources, ranking logic, and revenue model easy to inspect. 
                  We publish detailed methodology, disclose affiliate relationships, and maintain editorial independence in our rankings. 
                  Our goal is to help you save money and make better decisions, not to promote any particular provider.
                </p>
              </div>
            </div>

            <div>
              <div class="grid gap-6 sm:grid-cols-1">
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
        </div>
      </div>
    </section>

    <!-- Our Story -->
    <section class="py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-blue-700">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold text-white flex items-center justify-center gap-3 mb-3">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Our Story
          </h2>
          <p class="text-lg text-white/90 max-w-2xl mx-auto">
            How frustration with hidden fees became a mission for transparency
          </p>
        </div>

        <div class="max-w-5xl mx-auto">
          <div class="grid gap-8 lg:grid-cols-3">
            <div class="relative">
              <div class="rounded-3xl bg-gray-900 p-8 h-full flex flex-col outline-none shadow-none ring-0">
                <div class="flex items-center justify-center w-16 h-16 rounded-full bg-brand-500 mb-6 mx-auto">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div class="text-center mb-4">
                  <span class="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500 text-white text-sm font-semibold rounded-full">
                    <span>2022</span>
                  </span>
                </div>
                <h3 class="text-xl font-bold text-white mb-4 text-center">The Discovery</h3>
                <p class="text-base leading-relaxed text-white/90 text-center flex-1">
                  When Omar first came to Carnegie Mellon, he realized that every time his family sent money from Jordan to the US, about <strong class="font-semibold text-white">$30 quietly disappeared</strong>: half from the sending bank, half from the receiving bank.
                </p>
              </div>
            </div>

            <div class="relative">
              <div class="rounded-3xl bg-gray-900 p-8 h-full flex flex-col outline-none shadow-none ring-0">
                <div class="flex items-center justify-center w-16 h-16 rounded-full bg-brand-500 mb-6 mx-auto">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div class="text-center mb-4">
                  <span class="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500 text-white text-sm font-semibold rounded-full">
                    <span>The Realization</span>
                  </span>
                </div>
                <h3 class="text-xl font-bold text-white mb-4 text-center">A Wider Problem</h3>
                <p class="text-base leading-relaxed text-white/90 text-center flex-1">
                  Omar noticed that this hidden fee problem impacts countless families who depend on remittances for essentials. For those sending money regularly, these fees add up to hundreds or even thousands of dollars each year.
                </p>
              </div>
            </div>

            <div class="relative">
              <div class="rounded-3xl bg-gray-900 p-8 h-full flex flex-col outline-none shadow-none ring-0">
                <div class="flex items-center justify-center w-16 h-16 rounded-full bg-brand-500 mb-6 mx-auto">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div class="text-center mb-4">
                  <span class="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500 text-white text-sm font-semibold rounded-full">
                    <span>2025-2026</span>
                  </span>
                </div>
                <h3 class="text-xl font-bold text-white mb-4 text-center">Building the Solution</h3>
                <p class="text-base leading-relaxed text-white/90 text-center flex-1">
                  Omar built an MVP in 2025 and launched it for about a year. Now, with this new version launching in 2026, he and the team hope to solve the fee problem and help people keep more of their hard earned money where it belongs with their families.
                </p>
              </div>
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
          <p class="leading-relaxed text-neutral-700 mb-8 text-lg">
            Remit-Scout was founded to solve a data problem, not just a money problem.<br>We treat remittance fees as a bug in the financial system. Our algorithm is the patch.
          </p>

          <div class="space-y-6">
            <div>
              <div class="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
                <div class="grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-start">
                  <div class="flex flex-col items-center lg:items-start">
                    <div class="relative mb-6">
                      <a
                        href="https://www.linkedin.com/in/ghabayeno/"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="block"
                      >
                        <div class="absolute inset-2 rounded-3xl bg-gradient-to-br from-brand-400 via-brand-300 to-emerald-400 blur-xl opacity-60" />
                        <img
                          :src="founderHeadshotUrl"
                          onerror="this.src='/images/about/omar-placeholder.jpg'; this.onerror=null;"
                          alt="Omar Ghabayen, Founder of Remit-Scout"
                          class="relative w-48 h-48 lg:w-56 lg:h-56 rounded-3xl object-cover border-4 border-white shadow-2xl hover:opacity-90 transition-opacity cursor-pointer"
                        >
                      </a>
                    </div>
                    <div class="text-center lg:text-left w-full">
                      <div class="flex items-center gap-3 mb-2 flex-wrap justify-center lg:justify-start">
                        <h3 class="text-2xl font-bold text-neutral-900">
                          Omar Ghabayen
                        </h3>
                        <a
                          href="https://www.linkedin.com/in/ghabayeno/"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-neutral-700 hover:text-neutral-900 transition-colors"
                          aria-label="LinkedIn"
                        >
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                        </a>
                      </div>
                      <h4 class="inline-block mb-3 px-4 py-1.5 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                        Founder of Remit-Scout
                      </h4>
                      <div class="space-y-3 text-sm text-neutral-600">
                        <div class="flex items-center gap-3 justify-center lg:justify-start">
                          <svg class="w-5 h-5 text-brand-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                          <span class="font-medium">Carnegie Mellon University</span>
                        </div>
                        <div class="flex items-center gap-3 justify-center lg:justify-start">
                          <svg class="w-5 h-5 text-brand-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21s-7-6.35-7-12a7 7 0 1114 0c0 5.65-7 12-7 12z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                          <span class="font-medium">Based in Pittsburgh, PA</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-6">
                    <div class="space-y-4">
                      <h3 class="text-xl font-bold text-brand-600 mb-3">
                        The Arbitrage Opportunity
                      </h3>
                      <p class="text-lg leading-relaxed text-neutral-700">
                        "During my time at Carnegie Mellon, I kept noticing something that didn't add up. When I'd check the rates for sending money between the US and Jordan, what they advertised almost never matched what actually landed in the recipient's account.
                      </p>

                      <p class="text-lg leading-relaxed text-neutral-700">
                        I dug deeper and found that intermediaries were quietly taking a cut through hidden FX markups—and the comparison sites everyone was using completely missed it. That's when it hit me: the whole 'low fee' pitch was a red herring. The real cost was always in the spread, hiding in plain sight.
                      </p>

                      <p class="text-lg leading-relaxed text-neutral-700">
                        So I built Remit-Scout to cut through the noise and answer one straightforward question: what's actually going to arrive? We're here to close that gap between what you send and what actually gets delivered."
                      </p>
                    </div>

                    <p class="text-lg leading-relaxed text-brand-600 mb-6 font-medium">
                      "I believe global finance is complex as is. The decision shouldn't be."
                    </p>

                    <p class="text-xs text-neutral-500">
                      Reviewed: {{ lastReviewedLabel }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div class="rounded-3xl border border-brand-700 bg-brand-600 p-6 sm:p-8 shadow-sm">
                <h3 class="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Data Integrity Protocol
                </h3>
                <p class="text-sm text-white/90 mb-5">
                  Our verification standards are absolute.
                </p>
                <ul class="space-y-3 text-sm text-white/95 mb-6">
                  <li class="flex items-start gap-3">
                    <component :is="getIconForEmoji('🧪')" class="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                    <span><strong class="font-semibold">Synthetic Transaction Audits:</strong> We execute real-money transfers to validate settlement times and fee structures against api claims.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span><strong class="font-semibold">High-Frequency Polling:</strong> Rates are updated dynamically. High-volume corridors are indexed every 60 seconds.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <component :is="getIconForEmoji('🧾')" class="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                    <span><strong class="font-semibold">Revenue Transparency:</strong> Commercial relationships are fully disclosed and strictly firewalled from the ranking algorithm.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span><strong class="font-semibold">Rapid Dispute Resolution:</strong> Discrepancies reported by users are investigated and patched within 24 hours.</span>
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

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
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
                      We gather real-time quotes from multiple sources to compare providers side by side. Coverage varies by corridor and payment method.
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
                <p class="text-sm leading-relaxed text-white/90 flex-1">
                  Rates can change between quote and checkout due to promotional offers, verification requirements, payment method selection, and provider-specific rules. The final amount displayed during checkout may differ from the initial quote due to these factors. Always confirm the final amount on the provider's checkout screen before completing your transfer to ensure you're comfortable with the total cost and exchange rate applied.
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
            What we don't compromise on
          </h2>
          <p class="text-lg leading-relaxed text-white/95 mb-8 max-w-3xl mx-auto">
            We built Remit-Scout for people who send money internationally and want a straight answer. That means transparent sources, outcome-first rankings,
            and clear disclosure when we earn revenue.
          </p>

          <div class="grid gap-8 lg:grid-cols-3 mt-10">
            <div class="relative">
              <div class="rounded-3xl bg-gray-900 p-8 h-full flex flex-col outline-none shadow-none ring-0">
                <div class="flex items-center justify-center w-16 h-16 rounded-full bg-brand-500 mb-6 mx-auto">
                  <CalculatorIcon class="w-8 h-8 text-white" />
                </div>
                <h3 class="text-xl font-bold text-white mb-4 text-center">
                  Outcome-first ranking
                </h3>
                <p class="text-base leading-relaxed text-white/90 text-center flex-1">
                  We rank by <strong class="font-semibold text-white">what the recipient should receive</strong>, not a headline rate.
                </p>
              </div>
            </div>
            <div class="relative">
              <div class="rounded-3xl bg-gray-900 p-8 h-full flex flex-col outline-none shadow-none ring-0">
                <div class="flex items-center justify-center w-16 h-16 rounded-full bg-brand-500 mb-6 mx-auto">
                  <ShieldCheckIcon class="w-8 h-8 text-white" />
                </div>
                <h3 class="text-xl font-bold text-white mb-4 text-center">
                  No pay-to-rank
                </h3>
                <p class="text-base leading-relaxed text-white/90 text-center flex-1">
                  Providers <strong class="font-semibold text-white">cannot buy placement</strong> in our organic results.
                </p>
              </div>
            </div>
            <div class="relative">
              <div class="rounded-3xl bg-gray-900 p-8 h-full flex flex-col outline-none shadow-none ring-0">
                <div class="flex items-center justify-center w-16 h-16 rounded-full bg-brand-500 mb-6 mx-auto">
                  <ChartBarIcon class="w-8 h-8 text-white" />
                </div>
                <h3 class="text-xl font-bold text-white mb-4 text-center">
                  Live, comparable data
                </h3>
                <p class="text-base leading-relaxed text-white/90 text-center flex-1">
                  We track <strong class="font-semibold text-white">{{ SITE_STATS.providers.display }} providers</strong> across {{ SITE_STATS.corridors.display }} corridors, normalized into a single outcome metric.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Read More / Blogs -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-6">
            <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Market Intelligence
          </h2>
          <p class="leading-relaxed text-neutral-700 mb-8">
            Operational playbooks for cross-border capital. We decode regulatory frameworks, banking infrastructure, and FX mechanisms to help you navigate the global financial grid.
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
              to="/learn/money-transfer"
              class="inline-flex min-h-btn items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            >
              Access the Library
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
            <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            Platform Reach
          </h2>

          <div class="space-y-6 mb-10">
            <p class="text-lg leading-relaxed text-neutral-700">
              We index the global remittance economy in real-time. Data is normalized across 150+ corridors to ensure an apples-to-apples comparison of landed capital.
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


    <!-- Partnership Section -->
    <section class="py-16 lg:py-20 bg-slate-900">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl text-center">
          <h2 class="text-3xl font-bold text-white mb-6 flex items-center justify-center gap-3">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Provider Partnership
          </h2>
          <p class="text-lg leading-relaxed text-slate-300 mb-6">
            For licensed Money Service Businesses (MSBs) seeking high-intent volume.<br>Partner with Remit-Scout and beyond to access a qualified audience actively searching for liquidity.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <NuxtLink
              to="/partnerships"
              class="inline-flex min-h-btn items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <span>Partnership Details</span>
            </NuxtLink>
          </div>
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
          See exactly what your recipient will receive after all fees and exchange rates are applied. Start comparing now to find the best option for your transfer.
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
import { SITE_STATS } from '~/config/stats'
import { setSeo, jsonLdBreadcrumb, jsonLdOrganization } from '~/composables/useSeo'

const founderHeadshotUrl = '/webpacks/IMG_4439.webp'
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
    title: 'Algorithmic Neutrality',
    body: 'Rankings are determined purely by mathematical outcome. Marketing budgets cannot buy position; our sort order is immutable.',
  },
  {
    emoji: '🔎',
    title: 'Net-Value Indexing',
    body: 'We ignore "headline rates." Our engine calculates the final settlement amount, factoring in upfront fees and the hidden FX spread markup.',
  },
  {
    emoji: '🛡️',
    title: 'Open Data Protocol',
    body: 'Trust requires verification. We maintain an open channel for data correction—if a provider updates their pricing logic, our system adapts within 24 hours.',
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
  ogType: 'article',
  publishedTime: lastReviewedIso,
  modifiedTime: lastReviewedIso,
  author: 'Remit-Scout Editorial Team',
  tags: ['about', 'remittances', 'transparency'],
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

