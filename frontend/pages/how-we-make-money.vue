<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
              How <span class="text-brand-600">Remit-Scout</span> Makes Money
            </h1>

            <p class="text-lg text-neutral-700 leading-relaxed mb-4">
              Remit-Scout is completely free to use. We earn revenue through transparent channels that <strong class="font-semibold text-brand-600">never influence rankings</strong>.
            </p>
            <p class="text-base text-neutral-600 leading-relaxed mb-6">
              This page explains exactly how we make money and how we ensure that revenue never affects which providers we show you or how we rank them.
            </p>

            <!-- Trust Chips -->
            <div class="flex flex-wrap gap-3">
              <div class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-neutral-700">
                <span>🛡️</span>
                No pay-to-rank
              </div>
              <div class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-neutral-700">
                <span>🔒</span>
                We don't move money
              </div>
              <div class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-neutral-700">
                <span>📋</span>
                Disclosures visible
              </div>
            </div>
          </div>

          <!-- Trust Panel -->
          <div class="lg:pl-8">
            <div class="rounded-3xl border-2 border-brand-200 bg-white p-8 shadow-lg">
              <h2 class="text-xl font-bold text-neutral-900 mb-4">
                Independence Guarantee
              </h2>
              <p class="text-sm leading-relaxed text-neutral-700 mb-6">
                Providers cannot pay to rank higher. Rankings are data-driven, disclosures are visible, and corrections matter. <strong class="font-semibold text-neutral-900">We don't move money</strong> — transfers happen on provider platforms.
              </p>

              <div class="space-y-3">
                <NuxtLink
                  to="/methodology"
                  class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  📊 Methodology
                </NuxtLink>
                <NuxtLink
                  to="/affiliate-disclosure"
                  class="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
                >
                  💼 Affiliate disclosure
                </NuxtLink>
                <NuxtLink
                  to="/contact?type=issue"
                  class="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
                >
                  📧 Report a rate issue
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Revenue at a Glance -->
    <section
      id="revenue-overview"
      class="py-20 lg:py-28 bg-neutral-50 scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-6xl">
          <div class="text-center mb-20">
            <h2 class="text-4xl sm:text-5xl font-bold text-neutral-900 mb-6 flex items-center justify-center gap-3">
              <span>💰</span>
              <span>How We Make Money</span>
            </h2>
            <p class="text-xl leading-relaxed text-neutral-700 max-w-3xl mx-auto">
              We keep comparisons free for everyone and monetize in ways that don't compromise trust.
            </p>
          </div>

          <div class="space-y-8">
            <!-- Affiliate Commissions -->
            <div class="rounded-3xl border-2 border-neutral-200 bg-white p-10 lg:p-12 shadow-sm hover:shadow-lg transition-shadow">
              <div class="flex flex-col lg:flex-row lg:items-start gap-8">
                <div class="flex-shrink-0">
                  <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100">
                    <span class="text-4xl">🔗</span>
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
                    Affiliate Commissions (Money Transfers)
                  </h3>
                  <p class="text-lg leading-relaxed text-neutral-700 mb-6">
                    When you click a provider link from our comparison results and complete a transfer, the provider may pay us a referral commission. This is standard in the industry — similar to how travel sites earn commissions when you book a hotel. <strong class="font-semibold text-neutral-900">This doesn't change your price</strong> — you pay exactly what the provider quotes, whether you use our link or go directly to their site. The commission comes from the provider's marketing budget, not your transfer.
                  </p>
                  <div class="rounded-xl border border-blue-100 bg-blue-50 p-6">
                    <p class="text-base font-semibold text-blue-900 mb-2">
                      Does this affect rankings?
                    </p>
                    <p class="text-base text-blue-800 leading-relaxed">
                      <strong>No</strong> — rankings are determined by the data we collect and our scoring methodology. If Provider A ranks higher than Provider B, it's because Provider A offers better value for your specific transfer, not because we earn more from Provider A.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Guides & Partner Offers -->
            <div class="rounded-3xl border-2 border-neutral-200 bg-white p-10 lg:p-12 shadow-sm hover:shadow-lg transition-shadow">
              <div class="flex flex-col lg:flex-row lg:items-start gap-8">
                <div class="flex-shrink-0">
                  <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-100">
                    <span class="text-4xl">📚</span>
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
                    Guides & Partner Offers (Affiliate Links)
                  </h3>
                  <p class="text-lg leading-relaxed text-neutral-700 mb-6">
                    In some of our guides and expat resources, we may include links to partners or display ads. If you choose to buy through those links or interact with ads, we may earn a commission. These affiliate relationships and ad placements are clearly disclosed, and the guides themselves remain independent and editorial — we only recommend products we believe are genuinely useful for expats and international families.
                  </p>
                  <div class="rounded-xl border border-purple-100 bg-purple-50 p-6">
                    <p class="text-base font-semibold text-purple-900 mb-2">
                      Does this affect rankings?
                    </p>
                    <p class="text-base text-purple-800 leading-relaxed">
                      <strong>No</strong> — this applies only to guide content and never changes Remit‑Score or comparison sorting. Money transfer rankings remain completely independent.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Remit-Scout Plus -->
            <div class="rounded-3xl border-2 border-brand-500 bg-white p-10 lg:p-12 shadow-lg hover:shadow-xl transition-shadow">
              <div class="flex flex-col lg:flex-row lg:items-start gap-8">
                <div class="flex-shrink-0">
                  <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100">
                    <span class="text-4xl">✨</span>
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
                    Remit‑Scout Plus
                  </h3>
                  <p class="text-lg leading-relaxed text-neutral-700 mb-4">
                    Optional subscription for repeat senders who want better tools and an ad‑free experience. Plus includes rate alerts (get notified when rates hit your target), watchlists (save corridors you care about), exchange rate history (see trends over time), and an <strong class="font-semibold text-neutral-900">ad‑free experience</strong>. This is how you can support Remit-Scout directly while getting premium features — without seeing any advertising.
                  </p>
                  <p class="text-base leading-relaxed text-neutral-600 mb-6">
                    <strong class="font-semibold text-neutral-900">Plus may include tiers or add‑ons</strong> (for example, more alerts slots, extended historical depth, CSV exports, or family plans). All users still see the same rankings, regardless of Plus tier or add-ons.
                  </p>
                  <div class="rounded-xl border border-brand-200 bg-brand-50 p-6">
                    <p class="text-base font-semibold text-brand-900 mb-2">
                      Does this affect rankings?
                    </p>
                    <p class="text-base text-brand-800 leading-relaxed">
                      <strong>No</strong> — everyone sees the exact same comparison results, rankings, and Remit‑Scores, whether on the free plan or Plus. Plus is a feature upgrade, not a different comparison engine.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Data Licensing -->
            <div class="rounded-3xl border-2 border-neutral-200 bg-white p-10 lg:p-12 shadow-sm hover:shadow-lg transition-shadow">
              <div class="flex flex-col lg:flex-row lg:items-start gap-8">
                <div class="flex-shrink-0">
                  <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100">
                    <span class="text-4xl">📊</span>
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
                    Data Licensing & B2B Products
                  </h3>
                  <p class="text-lg leading-relaxed text-neutral-700 mb-6">
                    We offer several B2B products that help publishers, platforms, and businesses access our aggregated market data and comparison tools. We only share anonymized, aggregated data — never your personal information. These products are completely separate from how we rank providers for consumers.
                  </p>

                  <div class="space-y-4 mb-6">
                    <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                      <div class="flex items-start gap-3 mb-2">
                        <span class="text-2xl">📊</span>
                        <div class="flex-1">
                          <h4 class="font-semibold text-neutral-900 mb-1">Pulse Data & Market Reports</h4>
                          <p class="text-sm text-neutral-700 leading-relaxed">
                            Aggregated corridor trends, spreads, fees, speed benchmarks, "best provider" frequency, and market analysis reports. Useful for journalists, researchers, and financial platforms.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                      <div class="flex items-start gap-3 mb-2">
                        <span class="text-2xl">🧩</span>
                        <div class="flex-1">
                          <h4 class="font-semibold text-neutral-900 mb-1">Widgets & White‑Label Embeds</h4>
                          <p class="text-sm text-neutral-700 leading-relaxed">
                            A hosted comparison module that partners can embed on their site or app. Optionally white‑labeled. Helps publishers offer comparison tools without building their own engine.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                      <div class="flex items-start gap-3 mb-2">
                        <span class="text-2xl">🔌</span>
                        <div class="flex-1">
                          <h4 class="font-semibold text-neutral-900 mb-1">API & Data Exports</h4>
                          <p class="text-sm text-neutral-700 leading-relaxed">
                            Programmatic access (REST API), bulk exports, historical datasets, with SLA and support. For platforms building remittance features or conducting research.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-3 mb-6">
                    <NuxtLink
                      to="/contact?type=platform&topic=api"
                      class="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
                    >
                      View API & data pricing →
                    </NuxtLink>
                    <NuxtLink
                      to="/contact?type=media&topic=widget"
                      class="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
                    >
                      Request widget access →
                    </NuxtLink>
                    <NuxtLink
                      to="/contact?type=media&topic=pulse"
                      class="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
                    >
                      Get Pulse licensing →
                    </NuxtLink>
                  </div>

                  <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-6">
                    <p class="text-base font-semibold text-emerald-900 mb-2">
                      Does this affect rankings?
                    </p>
                    <p class="text-base text-emerald-800 leading-relaxed">
                      <strong>No</strong> — licensing buys access to data and tools, not placement. Consumer rankings remain completely independent.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Provider Insights & Research -->
            <div class="rounded-3xl border-2 border-neutral-200 bg-white p-10 lg:p-12 shadow-sm hover:shadow-lg transition-shadow">
              <div class="flex flex-col lg:flex-row lg:items-start gap-8">
                <div class="flex-shrink-0">
                  <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100">
                    <span class="text-4xl">🏢</span>
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
                    Provider Insights & Research Reports
                  </h3>
                  <p class="text-lg leading-relaxed text-neutral-700 mb-4">
                    <strong class="font-semibold text-neutral-900">Provider Insights (B2B):</strong> We may offer paid dashboards or reports that help providers understand corridor competitiveness (rank frequency, fee/FX positioning, speed benchmarks) using aggregated, anonymized data. This helps providers see how they compare and identify opportunities — but it never changes their ranking.
                  </p>
                  <p class="text-lg leading-relaxed text-neutral-700 mb-6">
                    <strong class="font-semibold text-neutral-900">Research & Custom Analysis:</strong> We may produce custom corridor reports, benchmarking studies, or datasets for journalists, NGOs, academics, and fintechs. These are independent research projects using aggregated data.
                  </p>
                  <div class="flex flex-wrap gap-3 mb-6">
                    <NuxtLink
                      to="/contact?type=provider&topic=insights"
                      class="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 transition-colors"
                    >
                      Request provider insights →
                    </NuxtLink>
                    <NuxtLink
                      to="/contact?type=media&topic=research"
                      class="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 transition-colors"
                    >
                      Request a research report →
                    </NuxtLink>
                  </div>
                  <div class="rounded-xl border border-indigo-100 bg-indigo-50 p-6">
                    <p class="text-base font-semibold text-indigo-900 mb-2">
                      Does this affect rankings?
                    </p>
                    <p class="text-base text-indigo-800 leading-relaxed">
                      <strong>No</strong> — providers can't pay to improve their Remit‑Score. Insights and research are separate from scoring and rankings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sponsorships -->
            <div class="rounded-3xl border-2 border-neutral-200 bg-white p-10 lg:p-12 shadow-sm hover:shadow-lg transition-shadow">
              <div class="flex flex-col lg:flex-row lg:items-start gap-8">
                <div class="flex-shrink-0">
                  <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-100">
                    <span class="text-4xl">🧾</span>
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
                    Sponsorships
                  </h3>
                  <p class="text-lg leading-relaxed text-neutral-700 mb-4">
                    We may offer clearly labeled sponsorship placements in specific content areas. All sponsorships are clearly marked and <strong class="font-semibold text-neutral-900">never appear in rankings or comparison results</strong>.
                  </p>
                  <div class="rounded-xl border border-orange-100 bg-orange-50 p-5 mb-6">
                    <p class="text-sm font-semibold text-orange-900 mb-3">
                      Where sponsorships may appear (clearly labeled):
                    </p>
                    <ul class="space-y-2 text-sm text-orange-800">
                      <li class="flex items-start gap-2">
                        <span>•</span>
                        <span>Newsletter sponsor (top/bottom of Pulse newsletter)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span>•</span>
                        <span>Pulse sponsor block (separate from rankings)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span>•</span>
                        <span>Partner spotlight section on Guides (clearly labeled)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span>•</span>
                        <span>Podcast/YouTube sponsor (if we produce content)</span>
                      </li>
                    </ul>
                    <p class="text-sm font-semibold text-orange-900 mt-4 mb-2">
                      Never: sponsored ranking positions, sponsored sort order, sponsored "best deal"
                    </p>
                  </div>
                  <p class="text-base leading-relaxed text-neutral-600 mb-6">
                    <strong class="font-semibold text-neutral-900">Plus subscribers get an ad‑free experience</strong>, which removes any sponsored modules entirely. You still see all the same comparison results and rankings — just without any ads or sponsored content.
                  </p>
                  <div class="rounded-xl border border-orange-100 bg-orange-50 p-6">
                    <p class="text-base font-semibold text-orange-900 mb-2">
                      Does this affect rankings?
                    </p>
                    <p class="text-base text-orange-800 leading-relaxed">
                      <strong>No</strong> — sponsorships are clearly labeled and never appear in comparison results or rankings. They would only appear in separate content areas like newsletters or Pulse pages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Revenue Map -->
          <div class="mt-16 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-10 lg:p-12">
            <div class="text-center mb-10">
              <h3 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
                Revenue Map
              </h3>
              <p class="text-lg text-neutral-700 max-w-2xl mx-auto">
                A simple breakdown of who pays us, what they get, and what they don't get
              </p>
            </div>
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div class="rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-sm">
                <div class="text-center mb-4">
                  <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 mb-3">
                    <span class="text-4xl">🔗</span>
                  </div>
                  <h4 class="text-lg font-bold text-neutral-900 mb-4">Affiliate Commissions</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Who pays us?</p>
                    <p class="text-sm font-medium text-neutral-900">Providers</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">What they get?</p>
                    <p class="text-sm text-neutral-700">Referrals when users complete transfers</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">What they don't get?</p>
                    <p class="text-sm text-neutral-700">Ranking influence, score influence, sorting influence</p>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <div class="text-center mb-4">
                  <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 mb-3">
                    <span class="text-4xl">✨</span>
                  </div>
                  <h4 class="text-lg font-bold text-neutral-900 mb-4">Remit-Scout Plus</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Who pays us?</p>
                    <p class="text-sm font-medium text-neutral-900">Users</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">What they get?</p>
                    <p class="text-sm text-neutral-700">Features: alerts, history, watchlist, no ads</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">What they don't get?</p>
                    <p class="text-sm text-neutral-700">Different rankings, better scores, priority placement</p>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-sm">
                <div class="text-center mb-4">
                  <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 mb-3">
                    <span class="text-4xl">📊</span>
                  </div>
                  <h4 class="text-lg font-bold text-neutral-900 mb-4">Data Licensing</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Who pays us?</p>
                    <p class="text-sm font-medium text-neutral-900">Businesses</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">What they get?</p>
                    <p class="text-sm text-neutral-700">Access to aggregated data, widgets, API</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">What they don't get?</p>
                    <p class="text-sm text-neutral-700">Score influence, sorting influence, ranking placement</p>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border-2 border-orange-200 bg-white p-6 shadow-sm">
                <div class="text-center mb-4">
                  <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 mb-3">
                    <span class="text-4xl">🧾</span>
                  </div>
                  <h4 class="text-lg font-bold text-neutral-900 mb-4">Sponsorships</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Who pays us?</p>
                    <p class="text-sm font-medium text-neutral-900">Sponsors</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">What they get?</p>
                    <p class="text-sm text-neutral-700">Brand placement in newsletters, Pulse, guides</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">What they don't get?</p>
                    <p class="text-sm text-neutral-700">Ranking influence, score influence, comparison placement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Ads vs Disclosures -->
    <section class="py-16 lg:py-20 bg-white scroll-mt-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="text-center mb-12">
            <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Ads vs Disclosures
            </h2>
            <p class="text-lg leading-relaxed text-neutral-700 max-w-3xl mx-auto">
              It's important to understand the difference between advertising and transparency disclosures.
            </p>
          </div>

          <div class="grid gap-6 md:grid-cols-2">
            <div class="rounded-2xl border-2 border-orange-200 bg-orange-50 p-8">
              <h3 class="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <span>📢</span>
                Ads / Sponsorships
              </h3>
              <p class="text-base leading-relaxed text-neutral-700 mb-4">
                <strong class="font-semibold text-neutral-900">Paid placements</strong> that appear in specific content areas (newsletters, Pulse pages, guides). These are clearly labeled with a "Sponsored" badge and are completely separate from comparison results.
              </p>
              <p class="text-sm leading-relaxed text-neutral-600">
                <strong class="font-semibold text-neutral-900">Plus removes ads:</strong> If you subscribe to Remit-Scout Plus, you get an ad‑free experience. This removes advertising placements and sponsored modules, keeping your experience clean and focused.
              </p>
            </div>

            <div class="rounded-2xl border-2 border-blue-200 bg-blue-50 p-8">
              <h3 class="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <span>📋</span>
                Disclosures
              </h3>
              <p class="text-base leading-relaxed text-neutral-700 mb-4">
                <strong class="font-semibold text-neutral-900">Transparency labels</strong> that tell you about potential affiliate relationships. These appear near provider links and confirm that rankings are independent.
              </p>
              <p class="text-sm leading-relaxed text-neutral-600">
                <strong class="font-semibold text-neutral-900">Disclosures always remain:</strong> Even on Plus, you'll still see disclosure badges (like "We may earn a commission" or "Rankings are independent"). Disclosure is part of trust — we want you to know when we might earn a commission, even if you don't see ads.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How Affiliate Commissions Work -->
    <section
      id="affiliate-commissions"
      class="py-16 lg:py-20 bg-white scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="text-center mb-12">
            <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              How Affiliate Commissions Work
            </h2>
            <p class="text-lg leading-relaxed text-neutral-700 max-w-3xl mx-auto">
              This is our primary revenue stream. Here's how it works:
            </p>
          </div>

          <!-- Stepper Diagram -->
          <div class="grid gap-6 md:grid-cols-4 mb-10">
            <div class="text-center">
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 mb-3">
                <div class="flex items-center justify-center h-12 w-12 rounded-full bg-brand-600 mx-auto mb-3">
                  <span class="text-2xl">🔍</span>
                </div>
                <h3 class="text-sm font-semibold text-neutral-900 mb-2">1. You compare</h3>
                <p class="text-xs text-neutral-600 leading-relaxed">See live quotes from multiple providers</p>
              </div>
            </div>

            <div class="text-center">
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 mb-3">
                <div class="flex items-center justify-center h-12 w-12 rounded-full bg-brand-600 mx-auto mb-3">
                  <span class="text-2xl">👆</span>
                </div>
                <h3 class="text-sm font-semibold text-neutral-900 mb-2">2. You click</h3>
                <p class="text-xs text-neutral-600 leading-relaxed">Choose a provider and click through</p>
              </div>
            </div>

            <div class="text-center">
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 mb-3">
                <div class="flex items-center justify-center h-12 w-12 rounded-full bg-brand-600 mx-auto mb-3">
                  <span class="text-2xl">💸</span>
                </div>
                <h3 class="text-sm font-semibold text-neutral-900 mb-2">3. You transfer</h3>
                <p class="text-xs text-neutral-600 leading-relaxed">Complete transfer on provider's platform</p>
              </div>
            </div>

            <div class="text-center">
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 mb-3">
                <div class="flex items-center justify-center h-12 w-12 rounded-full bg-brand-600 mx-auto mb-3">
                  <span class="text-2xl">💰</span>
                </div>
                <h3 class="text-sm font-semibold text-neutral-900 mb-2">4. We may earn</h3>
                <p class="text-xs text-neutral-600 leading-relaxed">Provider pays referral fee (you don't pay extra)</p>
              </div>
            </div>
          </div>

          <!-- Important Callouts -->
          <div class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">✅</span>
                  <div>
                    <p class="text-sm font-semibold text-emerald-900 mb-1">
                      You don't pay extra
                    </p>
                    <p class="text-xs text-emerald-800 leading-relaxed">
                      The commission comes from the provider's marketing budget, not your transfer.
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">🔒</span>
                  <div>
                    <p class="text-sm font-semibold text-emerald-900 mb-1">
                      Prices don't change
                    </p>
                    <p class="text-xs text-emerald-800 leading-relaxed">
                      You pay exactly what the provider quotes, whether you use our link or go directly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-xl border-2 border-neutral-200 bg-neutral-50 p-5">
              <div class="flex items-start gap-3">
                <span class="text-2xl">💰</span>
                <div>
                  <p class="text-sm font-semibold text-neutral-900 mb-1">
                    We never touch your money
                  </p>
                  <p class="text-xs text-neutral-700 leading-relaxed">
                    Transfers happen <strong class="font-semibold text-neutral-900">completely</strong> on the provider's platform. Remit-Scout is a comparison tool, not a money transfer provider. We don't hold, move, or store funds — your transfer happens entirely on the provider's licensed platform, under their security and compliance rules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- What We Don't Do -->
    <section
      id="what-we-dont-do"
      class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="text-center mb-12">
            <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              What We Don't Do
            </h2>
            <p class="text-lg leading-relaxed text-neutral-700 max-w-3xl mx-auto">
              Trust starts with clarity. Here's what we explicitly avoid:
            </p>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <div class="flex items-start gap-4 rounded-2xl border-2 border-red-200 bg-red-50 p-6">
              <div class="flex-shrink-0">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600">
                  <span class="text-2xl text-white">✗</span>
                </div>
              </div>
              <div>
                <h3 class="font-semibold text-neutral-900 mb-2 text-lg">
                  Sell rankings
                </h3>
                <p class="text-sm text-neutral-700 leading-relaxed">
                  Providers cannot pay to appear higher or improve Remit‑Score.
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4 rounded-2xl border-2 border-red-200 bg-red-50 p-6">
              <div class="flex-shrink-0">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600">
                  <span class="text-2xl text-white">✗</span>
                </div>
              </div>
              <div>
                <h3 class="font-semibold text-neutral-900 mb-2 text-lg">
                  Accept payment to change scores
                </h3>
                <p class="text-sm text-neutral-700 leading-relaxed">
                  Scoring is calculated using consistent methodology, not payments.
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4 rounded-2xl border-2 border-red-200 bg-red-50 p-6">
              <div class="flex-shrink-0">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600">
                  <span class="text-2xl text-white">✗</span>
                </div>
              </div>
              <div>
                <h3 class="font-semibold text-neutral-900 mb-2 text-lg">
                  Run "sponsored" results in rankings
                </h3>
                <p class="text-sm text-neutral-700 leading-relaxed">
                  Any sponsorship is clearly labeled and separated from comparisons.
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4 rounded-2xl border-2 border-red-200 bg-red-50 p-6">
              <div class="flex-shrink-0">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600">
                  <span class="text-2xl text-white">✗</span>
                </div>
              </div>
              <div>
                <h3 class="font-semibold text-neutral-900 mb-2 text-lg">
                  Handle your money
                </h3>
                <p class="text-sm text-neutral-700 leading-relaxed">
                  We don't hold, move, or transmit funds. Transfers happen on provider platforms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Remit-Scout Plus -->
    <section
      id="plus-plan"
      class="py-16 lg:py-20 bg-white scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="text-center mb-12">
            <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Remit‑Scout Plus
            </h2>
            <p class="text-lg leading-relaxed text-neutral-700 max-w-3xl mx-auto">
              An optional subscription for repeat senders who want better tools and an ad‑free experience.
            </p>
          </div>

          <div class="rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-8 lg:p-10">
            <div class="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h3 class="text-2xl font-bold text-neutral-900 mb-6">
                  What's included
                </h3>
                <ul class="space-y-4">
                  <li class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                        <span class="text-brand-600 text-xl">✓</span>
                      </div>
                    </div>
                    <div>
                      <p class="font-semibold text-neutral-900 mb-1">Rate alerts</p>
                      <p class="text-sm text-neutral-600">Get notified when rates hit your target</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                        <span class="text-brand-600 text-xl">✓</span>
                      </div>
                    </div>
                    <div>
                      <p class="font-semibold text-neutral-900 mb-1">Exchange rate history</p>
                      <p class="text-sm text-neutral-600">See trends over time</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                        <span class="text-brand-600 text-xl">✓</span>
                      </div>
                    </div>
                    <div>
                      <p class="font-semibold text-neutral-900 mb-1">Watchlist</p>
                      <p class="text-sm text-neutral-600">Save corridors you care about</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                        <span class="text-brand-600 text-xl">✓</span>
                      </div>
                    </div>
                    <div>
                      <p class="font-semibold text-neutral-900 mb-1">No ads</p>
                      <p class="text-sm text-neutral-600">Cleaner, distraction‑free experience</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div class="rounded-2xl border-2 border-brand-300 bg-white p-6">
                <h4 class="font-semibold text-neutral-900 mb-3 text-lg">
                  Does Plus change rankings?
                </h4>
                <p class="text-sm text-neutral-700 leading-relaxed mb-4">
                  <strong class="font-semibold text-neutral-900">No.</strong> Everyone sees the exact same comparison results, rankings, and Remit‑Scores, whether on the free plan or Plus. Plus is a feature upgrade, not a different comparison engine.
                </p>
                <div class="rounded-lg bg-brand-50 p-4">
                  <p class="text-xs text-neutral-700 leading-relaxed">
                    <strong class="font-semibold text-neutral-900">If Plus is "no ads," will I still see disclosures?</strong><br>
                    Yes. "No ads" means we remove advertising placements — but disclosures remain, because disclosure is part of trust.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Independence Rules -->
    <section
      id="independence-rules"
      class="py-16 lg:py-20 bg-slate-900 scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="text-center mb-12">
            <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
              Our Independence Rules
            </h2>
            <p class="text-lg leading-relaxed text-white/90 max-w-3xl mx-auto">
              We built Remit-Scout to be completely independent. These four rules ensure rankings are based on data, not payments.
            </p>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 mb-8">
            <div class="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
              <div class="flex items-start gap-3">
                <span class="text-emerald-400 text-2xl">✓</span>
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">
                    No pay-to-rank
                  </h3>
                  <p class="text-sm text-white/80 leading-relaxed">
                    Providers cannot pay to appear higher, improve a score, or change how we sort results.
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
              <div class="flex items-start gap-3">
                <span class="text-emerald-400 text-2xl">✓</span>
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">
                    Consistent scoring
                  </h3>
                  <p class="text-sm text-white/80 leading-relaxed">
                    Our Remit-Score is calculated using a consistent methodology. <NuxtLink to="/methodology" class="text-emerald-400 hover:text-emerald-300 underline font-semibold">See methodology</NuxtLink>.
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
              <div class="flex items-start gap-3">
                <span class="text-emerald-400 text-2xl">✓</span>
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">
                    Commercial separation
                  </h3>
                  <p class="text-sm text-white/80 leading-relaxed">
                    Affiliate relationships do not change score calculations. If a provider is the best option, they'll rank highly — even if we earn nothing from them.
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
              <div class="flex items-start gap-3">
                <span class="text-emerald-400 text-2xl">✓</span>
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">
                    Clear labeling
                  </h3>
                  <p class="text-sm text-white/80 leading-relaxed">
                    Where commercial relationships exist, we label them clearly near outbound links and partnership pages.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
            <p class="text-base font-semibold text-white mb-2">
              Our editorial firewall
            </p>
            <p class="text-sm text-white/80 leading-relaxed">
              Editorial decisions (scoring, ranking, content) are made separately from business relationships. Revenue opportunities never override data-driven rankings. We regularly audit our results to ensure commercial relationships haven't influenced outcomes.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How Disclosures Look -->
    <section
      id="disclosure-examples"
      class="py-16 lg:py-20 bg-white scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="text-center mb-12">
            <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              How Disclosures Look in Product
            </h2>
            <p class="text-lg leading-relaxed text-neutral-700 max-w-3xl mx-auto">
              Here's exactly what you'll see when you compare providers:
            </p>
          </div>

          <!-- Mock Provider Card -->
          <div class="rounded-2xl border-2 border-neutral-200 bg-white p-8 shadow-lg mb-8">
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-4">
                <div class="h-14 w-14 rounded-xl bg-brand-100 flex items-center justify-center">
                  <span class="text-3xl">🏦</span>
                </div>
                <div>
                  <h3 class="font-bold text-neutral-900 text-lg">
                    Provider Name
                  </h3>
                  <p class="text-sm text-neutral-600">
                    Bank transfer • 1-2 days
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-3xl font-bold text-neutral-900">
                  700 JOD
                </p>
                <p class="text-xs text-neutral-500">
                  Recipient gets
                </p>
              </div>
            </div>

            <div class="space-y-3 pt-6 border-t border-neutral-200 mb-6">
              <div class="flex items-center justify-between">
                <span class="text-sm text-neutral-600">Transfer fee</span>
                <span class="text-sm font-semibold text-neutral-900">$1.99</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-neutral-600">Exchange rate</span>
                <span class="text-sm font-semibold text-neutral-900">0.71</span>
              </div>
            </div>

            <div class="pt-6 border-t border-neutral-200">
              <div class="flex items-center gap-2 mb-4">
                <span class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 ring-1 ring-blue-200">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  We may earn a commission
                </span>
                <span class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Rankings are independent
                </span>
              </div>
              <button class="w-full rounded-xl bg-brand-600 px-6 py-4 text-base font-semibold text-white hover:bg-brand-700 transition-colors">
                Continue to Provider
              </button>
            </div>
          </div>

          <!-- Badge Explanations -->
          <div class="grid gap-6 sm:grid-cols-2">
            <div class="rounded-2xl border border-neutral-200 bg-white p-6">
              <div class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 ring-1 ring-blue-200 mb-4">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                We may earn a commission
              </div>
              <p class="text-sm leading-relaxed text-neutral-700">
                Indicates an affiliate relationship may exist for that provider link. This appears near outbound links to providers we have partnerships with.
              </p>
            </div>

            <div class="rounded-2xl border border-neutral-200 bg-white p-6">
              <div class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200 mb-4">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Rankings are independent
              </div>
              <p class="text-sm leading-relaxed text-neutral-700">
                Indicates that sorting and scoring is not influenced by paid placement. This appears on comparison pages and methodology documentation.
              </p>
            </div>

            <div class="rounded-2xl border border-neutral-200 bg-white p-6">
              <div class="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-800 ring-1 ring-purple-200 mb-4">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Official Data Feed
              </div>
              <p class="text-sm leading-relaxed text-neutral-700">
                Indicates the provider supplies direct structured data via API for real-time quotes. This improves accuracy and reduces the chance of stale pricing.
              </p>
            </div>

            <div class="rounded-2xl border border-neutral-200 bg-white p-6">
              <div class="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800 ring-1 ring-orange-200 mb-4">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                Sponsored
              </div>
              <p class="text-sm leading-relaxed text-neutral-700">
                Reserved for clearly labeled sponsorship placements (if we offer them). Sponsored content never influences organic rankings or Remit-Scores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section
      id="faq"
      class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl">
          <div class="text-center mb-12">
            <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
              Quick answers about how we make money and maintain independence
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <FaqAccordion :faqs="faqs" />
          </div>

          <div class="mt-8 text-center">
            <NuxtLink
              to="/faq"
              class="text-sm font-semibold text-brand-600 hover:text-brand-700 underline"
            >
              View all FAQs →
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="py-16 lg:py-20 bg-brand-600">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl text-center">
          <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
            Still have questions?
          </h2>
          <p class="text-lg text-white/90 leading-relaxed mb-8 max-w-2xl mx-auto">
            Transparency matters. If you're a user, send us a report. If you're a provider or publisher, see partnerships.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-4">
            <NuxtLink
              to="/methodology"
              class="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-600 font-bold text-lg rounded-xl hover:bg-neutral-50 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <span>Read Methodology</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
            <NuxtLink
              to="/contact?type=issue"
              class="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 bg-transparent text-white font-bold text-lg rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              <span>Report an issue</span>
            </NuxtLink>
            <NuxtLink
              to="/partnerships"
              class="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 bg-transparent text-white font-bold text-lg rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              <span>Partnerships</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'How We Make Money', path: '/how-we-make-money' },
]

const faqs = [
  {
    question: 'Do providers pay to rank higher?',
    answer: '<p><strong>No.</strong> Providers cannot pay to change ranking order, Remit-Score, or sorting logic. Rankings are determined by the comparison data and our methodology.</p>',
  },
  {
    question: 'Does using your link change the price I get?',
    answer: '<p><strong>No.</strong> Using our link never adds fees. We aim to show the best available quote at the time we capture it, but checkout can vary due to payment method, promotions, verification status, and provider rules. Always confirm the final amount at checkout.</p>',
  },
  {
    question: 'Why might your quote differ from the provider checkout?',
    answer: '<p>Rates can change throughout the day, and some fees/promotions depend on payment method, KYC status, or payout method. Every quote is timestamped, and we refresh frequently. The provider\'s checkout is always the final source of truth.</p>',
  },
  {
    question: 'Does Plus change rankings or give "better" results?',
    answer: '<p><strong>No.</strong> Plus does not change rankings, Remit‑Score calculations, or which providers appear. Plus is a feature upgrade (alerts/history/watchlist/no ads), not a different comparison engine.</p>',
  },
  {
    question: 'If Plus is "no ads," will I still see disclosures?',
    answer: '<p>Yes. "No ads" means we remove advertising placements and keep the experience clean — but disclosures remain, because disclosure is part of trust. If a link may generate a commission, we will still label it clearly.</p>',
  },
  {
    question: 'Do you sell user data to providers?',
    answer: '<p>We do not sell personally identifying information to providers. We use data to improve the product, not to sell personal profiles. See our <a href="/legal/privacy" class="text-brand-600 hover:text-brand-700 underline font-semibold">privacy policy</a> for details.</p>',
  },
  {
    question: 'How do I report an issue?',
    answer: '<p>If something looks off (fees, availability, or delivered amount), report it here: <a href="/contact?type=issue" class="text-brand-600 hover:text-brand-700 underline font-semibold">Report an issue</a>. We investigate and correct confirmed issues.</p>',
  },
  {
    question: 'What if a provider with an affiliate link ranks higher than one without?',
    answer: '<p>Our rankings are based solely on data: recipient amount, total cost, speed, and trust signals. If Provider A (with affiliate link) ranks higher than Provider B (without), it\'s because Provider A offers better value for that specific transfer — not because of the affiliate relationship.</p>',
  },
]

useHead({
  title: 'How We Make Money | Remit-Scout - Complete Revenue Transparency',
  meta: [
    {
      name: 'description',
      content: 'Complete transparency about how Remit-Scout earns revenue through affiliate commissions, Plus subscriptions, data licensing, and partnerships. Revenue never influences our rankings.',
    },
    {
      property: 'og:title',
      content: 'How We Make Money | Remit-Scout - Complete Revenue Transparency',
    },
    {
      property: 'og:description',
      content: 'Learn how Remit-Scout earns revenue while maintaining complete editorial independence. Your best interests come first.',
    },
  ],
})
</script>
