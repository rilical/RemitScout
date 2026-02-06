<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero -->
    <section class="relative overflow-hidden bg-gray-900 py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          :items="breadcrumbItems"
          :dark="true"
        />

        <div class="mt-12 grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
              How <span class="text-brand-600">Remit-Scout</span> Makes Money
            </h1>

            <p class="text-lg text-white leading-relaxed mb-4">
              Remit-Scout is free to use. We fund it through a small number of transparent revenue streams that
              <strong class="font-semibold text-white">never influence rankings</strong>.
            </p>
            <p class="text-base text-neutral-200 leading-relaxed mb-6">
              This page explains what we earn money from, what we do not accept, and the controls we use to protect independence.
            </p>

            <!-- Trust Chips -->
            <div class="flex flex-wrap gap-3">
              <div class="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white">
                <ShieldCheckIcon class="h-4 w-4 text-white" />
                No pay-to-rank
              </div>
              <div class="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white">
                <LockClosedIcon class="h-4 w-4 text-white" />
                We do not move money
              </div>
              <div class="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white">
                <DocumentTextIcon class="h-4 w-4 text-white" />
                Clear disclosures
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
                Providers cannot pay to rank higher. Comparison results are based on quote data and our methodology. We disclose
                commercial relationships, and we correct errors when we confirm them. Transfers happen on provider platforms, not ours.
              </p>

              <div class="space-y-3">
                <NuxtLink
                  to="/methodology"
                  class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  Methodology
                </NuxtLink>
                <NuxtLink
                  to="/affiliate-disclosure"
                  class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  Affiliate disclosure
                </NuxtLink>
                <NuxtLink
                  to="/contact"
                  class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  Report a rate issue
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
            <h2 class="text-4xl sm:text-5xl font-bold text-neutral-900 mb-6">
              How We Make Money
            </h2>
            <p class="text-xl leading-relaxed text-neutral-700 max-w-3xl mx-auto">
              We keep comparisons free and monetize without selling placement or distorting results. We earn money only in ways that
              preserve independence, and we draw a hard line between commercial relationships and ranking decisions.
            </p>
          </div>

          <div class="space-y-8">
            <!-- Affiliate Commissions -->
            <div class="rounded-3xl border-2 border-neutral-200 bg-white p-10 lg:p-12 shadow-sm hover:shadow-lg transition-shadow">
              <div class="flex flex-col lg:flex-row lg:items-start gap-8">
                <div class="flex-shrink-0">
                  <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600">
                    <svg
                      class="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
                    Affiliate Commissions (Money Transfers)
                  </h3>
                  <p class="text-lg leading-relaxed text-neutral-700 mb-6">
                    When you click a provider link from our comparison results and complete a transfer, the provider may pay us a referral
                    commission. <strong class="font-semibold text-neutral-900">You do not pay extra</strong>. The commission comes from the
                    provider's marketing budget, not your transfer amount.
                  </p>
                  <div class="rounded-xl border border-brand-600 bg-brand-600 p-6">
                    <p class="text-base font-semibold text-white mb-2">
                      Does this affect rankings?
                    </p>
                    <p class="text-base text-white/90 leading-relaxed">
                      <strong>No.</strong> Rankings are determined by data and our scoring methodology. If Provider A ranks higher than
                      Provider B, it is because Provider A offers better value for your specific transfer, not because we earn more from
                      Provider A.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Guides & Partner Offers -->
            <div class="rounded-3xl border-2 border-neutral-200 bg-white p-10 lg:p-12 shadow-sm hover:shadow-lg transition-shadow">
              <div class="flex flex-col lg:flex-row lg:items-start gap-8">
                <div class="flex-shrink-0">
                  <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600">
                    <svg
                      class="w-10 h-10 text-white"
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
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
                    Guides & Partner Offers (Affiliate Links)
                  </h3>
                  <p class="text-lg leading-relaxed text-neutral-700 mb-6">
                    In some guides and expat resources, we may include partner links or clearly labeled ads. If you choose to buy through
                    those links, we may earn a commission. These relationships are disclosed. Editorial content and comparisons remain
                    independent.
                  </p>
                  <div class="rounded-xl border border-brand-600 bg-brand-600 p-6">
                    <p class="text-base font-semibold text-white mb-2">
                      Does this affect rankings?
                    </p>
                    <p class="text-base text-white/90 leading-relaxed">
                      <strong>No.</strong> This applies only to guide content and never changes Remit-Score or comparison sorting. Money transfer
                      rankings remain independent.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Remit-Scout Plus -->
            <div class="rounded-3xl border-2 border-brand-500 bg-white p-10 lg:p-12 shadow-lg hover:shadow-xl transition-shadow">
              <div class="flex flex-col lg:flex-row lg:items-start gap-8">
                <div class="flex-shrink-0">
                  <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600">
                    <span class="text-4xl font-bold text-white">+</span>
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
                    Remit-Scout Plus
                  </h3>
                  <p class="text-lg leading-relaxed text-neutral-700 mb-4">
                    Plus is an optional membership for people who send money repeatedly and want the product to remember what matters. It
                    unlocks monitoring tools like alerts, watchlists, and deeper history, and it can remove advertising placements for a
                    cleaner experience.
                  </p>
                  <p class="text-base leading-relaxed text-neutral-600 mb-6">
                    Plus is a feature upgrade, not a different comparison engine. Every user sees the same provider set, the same
                    rankings, and the same scoring rules.
                  </p>
                  <div class="rounded-xl border border-brand-600 bg-brand-600 p-6">
                    <p class="text-base font-semibold text-white mb-2">
                      Does this affect rankings?
                    </p>
                    <p class="text-base text-white/90 leading-relaxed">
                      <strong>No.</strong> Everyone sees the same comparison results, rankings, and Remit-Scores. Plus changes what you can
                      save and monitor, not what we show or how we rank it.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Data Licensing -->
            <div
              v-if="enterpriseEnabled"
              class="rounded-3xl border-2 border-neutral-200 bg-white p-10 lg:p-12 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div class="flex flex-col lg:flex-row lg:items-start gap-8">
                <div class="flex-shrink-0">
                  <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100">
                    <svg
                      class="w-10 h-10 text-emerald-600"
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
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
                    Data Licensing & B2B Products
                  </h3>
                  <p class="text-lg leading-relaxed text-neutral-700 mb-6">
                    We offer B2B products that help publishers and platforms use our aggregated market data and comparison tools. We only
                    share anonymized, aggregated insights, not personal data. B2B offerings are separate from consumer rankings.
                  </p>

                  <div class="space-y-4 mb-6">
                    <div
                      v-if="pulseEnabled"
                      class="rounded-xl border border-emerald-100 bg-emerald-50 p-5"
                    >
                      <div class="flex items-start gap-3 mb-2">
                        <ChartBarIcon class="h-6 w-6 text-emerald-700" />
                        <div class="flex-1">
                          <h4 class="font-semibold text-neutral-900 mb-1">
                            Pulse Data & Market Reports
                          </h4>
                          <p class="text-sm text-neutral-700 leading-relaxed">
                            Aggregated corridor trends, spreads, fees, and benchmarks. Useful for researchers, publishers, and financial platforms.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                      <div class="flex items-start gap-3 mb-2">
                        <CursorArrowRaysIcon class="h-6 w-6 text-emerald-700" />
                        <div class="flex-1">
                          <h4 class="font-semibold text-neutral-900 mb-1">
                            Widgets & White Label Embeds
                          </h4>
                          <p class="text-sm text-neutral-700 leading-relaxed">
                            A hosted comparison module that partners can embed on their site or app. Helps publishers offer comparisons without
                            building the infrastructure.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                      <div class="flex items-start gap-3 mb-2">
                        <LinkIcon class="h-6 w-6 text-emerald-700" />
                        <div class="flex-1">
                          <h4 class="font-semibold text-neutral-900 mb-1">
                            API & Data Exports
                          </h4>
                          <p class="text-sm text-neutral-700 leading-relaxed">
                            Programmatic access, bulk exports, and historical datasets for platforms building remittance features or doing research.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-3 mb-6">
                    <NuxtLink
                      to="/contact?type=media&topic=widget"
                      class="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
                    >
                      Request widget access →
                    </NuxtLink>
                    <NuxtLink
                      v-if="pulseEnabled"
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
                      <strong>No.</strong> Licensing buys access to data and tools, not placement. Consumer rankings remain independent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Revenue Map -->
          <div class="mt-16 rounded-3xl border-2 border-brand-700 bg-brand-600 p-10 lg:p-12">
            <div class="text-center mb-10">
              <h3 class="text-3xl lg:text-4xl font-bold text-white mb-4">
                Revenue Map
              </h3>
              <p class="text-lg text-white/90 max-w-2xl mx-auto">
                A simple breakdown of who pays us, what they get, and what they do not get
              </p>
            </div>
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div class="rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-sm">
                <div class="text-center mb-4">
                  <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 mb-3">
                    <svg
                      class="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <h4 class="text-lg font-bold text-neutral-900 mb-4">
                    Affiliate Commissions
                  </h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                      Who pays us?
                    </p>
                    <p class="text-sm font-medium text-neutral-900">
                      Providers
                    </p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                      What they get?
                    </p>
                    <p class="text-sm text-neutral-700">
                      Referrals when users complete transfers
                    </p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                      What they don't get?
                    </p>
                    <p class="text-sm text-neutral-700">
                      Ranking influence, score influence, sorting influence
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <div class="text-center mb-4">
                  <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 mb-3">
                    <svg
                      class="w-8 h-8 text-white"
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
                  </div>
                  <h4 class="text-lg font-bold text-neutral-900 mb-4">
                    Guides & Partner Offers
                  </h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                      Who pays us?
                    </p>
                    <p class="text-sm font-medium text-neutral-900">
                      Partners
                    </p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                      What they get?
                    </p>
                    <p class="text-sm text-neutral-700">
                      Referral attribution on disclosed links
                    </p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                      What they don't get?
                    </p>
                    <p class="text-sm text-neutral-700">
                      Ranking influence, score influence, sorting influence
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <div class="text-center mb-4">
                  <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 mb-3">
                    <span class="text-3xl font-bold text-white">+</span>
                  </div>
                  <h4 class="text-lg font-bold text-neutral-900 mb-4">
                    Remit-Scout Plus
                  </h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                      Who pays us?
                    </p>
                    <p class="text-sm font-medium text-neutral-900">
                      Users
                    </p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                      What they get?
                    </p>
                    <p class="text-sm text-neutral-700">
                      Features: alerts, history, watchlist, no ads
                    </p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                      What they don't get?
                    </p>
                    <p class="text-sm text-neutral-700">
                      Different rankings, better scores, priority placement
                    </p>
                  </div>
                </div>
              </div>

              <div
                v-if="enterpriseEnabled"
                class="rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-sm"
              >
                <div class="text-center mb-4">
                  <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 mb-3">
                    <svg
                      class="w-8 h-8 text-emerald-600"
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
                  </div>
                  <h4 class="text-lg font-bold text-neutral-900 mb-4">
                    Data Licensing
                  </h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                      Who pays us?
                    </p>
                    <p class="text-sm font-medium text-neutral-900">
                      Businesses
                    </p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                      What they get?
                    </p>
                    <p class="text-sm text-neutral-700">
                      Access to aggregated data, widgets, API
                    </p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                      What they don't get?
                    </p>
                    <p class="text-sm text-neutral-700">
                      Score influence, sorting influence, ranking placement
                    </p>
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
            <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-8">
              <h3 class="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <MegaphoneIcon class="h-5 w-5 text-brand-700" />
                Ads and sponsorships
              </h3>
              <p class="text-base leading-relaxed text-neutral-700 mb-4">
                <strong class="font-semibold text-neutral-900">Paid placements</strong> can appear in specific content areas such as newsletters,
                guides<span v-if="pulseEnabled">, or Pulse pages</span>. These placements are labeled and are separate from comparison results.
              </p>
              <p class="text-sm leading-relaxed text-neutral-600">
                <strong class="font-semibold text-neutral-900">Plus removes ads:</strong> Plus can remove advertising placements and sponsored
                modules, keeping the experience focused. Disclosures remain.
              </p>
            </div>

            <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-8">
              <h3 class="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <DocumentTextIcon class="h-5 w-5 text-brand-700" />
                Disclosures
              </h3>
              <p class="text-base leading-relaxed text-neutral-700 mb-4">
                <strong class="font-semibold text-neutral-900">Transparency labels</strong> explain potential affiliate relationships. They appear
                near outbound links so you know when we may earn a commission.
              </p>
              <p class="text-sm leading-relaxed text-neutral-600">
                <strong class="font-semibold text-neutral-900">Disclosures always remain:</strong> Even on Plus, you will still see disclosure
                badges. Disclosure is part of trust.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How Affiliate Commissions Work -->
    <section
      id="affiliate-commissions"
      class="py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-blue-700 scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="text-center mb-12">
            <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
              How Affiliate Commissions Work
            </h2>
            <p class="text-lg leading-relaxed text-white/90 max-w-3xl mx-auto">
              This is our primary revenue stream. Here's how it works:
            </p>
          </div>

          <!-- Stepper Diagram -->
          <div class="grid gap-6 md:grid-cols-4 mb-10">
            <div class="text-center">
              <div class="rounded-xl border-2 border-brand-600 bg-brand-600 p-6 mb-3">
                <div class="flex items-center justify-center h-12 w-12 rounded-full bg-white mx-auto mb-3">
                  <MagnifyingGlassIcon class="h-6 w-6 text-brand-600" />
                </div>
                <h3 class="text-sm font-semibold text-white mb-2">
                  1. You compare
                </h3>
                <p class="text-xs text-white/90 leading-relaxed">
                  See live quotes from multiple providers
                </p>
              </div>
            </div>

            <div class="text-center">
              <div class="rounded-xl border-2 border-brand-600 bg-brand-600 p-6 mb-3">
                <div class="flex items-center justify-center h-12 w-12 rounded-full bg-white mx-auto mb-3">
                  <CursorArrowRaysIcon class="h-6 w-6 text-brand-600" />
                </div>
                <h3 class="text-sm font-semibold text-white mb-2">
                  2. You click
                </h3>
                <p class="text-xs text-white/90 leading-relaxed">
                  Choose a provider and click through
                </p>
              </div>
            </div>

            <div class="text-center">
              <div class="rounded-xl border-2 border-brand-600 bg-brand-600 p-6 mb-3">
                <div class="flex items-center justify-center h-12 w-12 rounded-full bg-white mx-auto mb-3">
                  <BanknotesIcon class="h-6 w-6 text-brand-600" />
                </div>
                <h3 class="text-sm font-semibold text-white mb-2">
                  3. You transfer
                </h3>
                <p class="text-xs text-white/90 leading-relaxed">
                  Complete transfer on provider's platform
                </p>
              </div>
            </div>

            <div class="text-center">
              <div class="rounded-xl border-2 border-brand-600 bg-brand-600 p-6 mb-3">
                <div class="flex items-center justify-center h-12 w-12 rounded-full bg-white mx-auto mb-3">
                  <CurrencyDollarIcon class="h-6 w-6 text-brand-600" />
                </div>
                <h3 class="text-sm font-semibold text-white mb-2">
                  4. We may earn
                </h3>
                <p class="text-xs text-white/90 leading-relaxed">
                  Provider pays referral fee (you don't pay extra)
                </p>
              </div>
            </div>
          </div>

          <!-- Important Callouts -->
          <div class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
                <div class="flex items-start gap-3">
                  <CheckCircleIcon class="h-6 w-6 text-emerald-700" />
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
                  <LockClosedIcon class="h-6 w-6 text-emerald-700" />
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
                <BanknotesIcon class="h-6 w-6 text-neutral-700" />
                <div>
                  <p class="text-sm font-semibold text-neutral-900 mb-1">
                    We never touch your money
                  </p>
                  <p class="text-xs text-neutral-700 leading-relaxed">
                    Transfers happen on the provider's platform. Remit-Scout is a comparison tool, not a money transfer provider. We do not
                    hold, move, or store funds. Your transfer happens on the provider's licensed platform, under their security and compliance
                    rules.
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
                  Providers cannot pay to appear higher or improve Remit-Score.
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
      class="py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-blue-700 scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="text-center mb-12">
            <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
              Remit-Scout Plus
            </h2>
            <p class="text-lg leading-relaxed text-white/90 max-w-3xl mx-auto">
              An optional subscription for repeat senders who want better tools and an ad free experience.
            </p>
          </div>

          <div class="rounded-3xl border-2 border-gray-900/20 bg-gray-900 p-8 lg:p-10">
            <div class="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h3 class="text-2xl font-bold text-white mb-6">
                  What's included
                </h3>
                <ul class="space-y-4">
                  <li class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                        <span class="text-brand-600 text-xl">✓</span>
                      </div>
                    </div>
                    <div>
                      <p class="font-semibold text-white mb-1">
                        Rate alerts
                      </p>
                      <p class="text-sm text-white/80">
                        Get notified when rates hit your target
                      </p>
                    </div>
                  </li>
                  <li class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                        <span class="text-brand-600 text-xl">✓</span>
                      </div>
                    </div>
                    <div>
                      <p class="font-semibold text-white mb-1">
                        Exchange rate history
                      </p>
                      <p class="text-sm text-white/80">
                        See trends over time
                      </p>
                    </div>
                  </li>
                  <li class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                        <span class="text-brand-600 text-xl">✓</span>
                      </div>
                    </div>
                    <div>
                      <p class="font-semibold text-white mb-1">
                        Watchlist
                      </p>
                      <p class="text-sm text-white/80">
                        Save corridors you care about
                      </p>
                    </div>
                  </li>
                  <li class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                        <span class="text-brand-600 text-xl">✓</span>
                      </div>
                    </div>
                    <div>
                      <p class="font-semibold text-white mb-1">
                        No ads
                      </p>
                      <p class="text-sm text-white/80">
                        Cleaner, distraction free experience
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div class="rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm p-6">
                <h4 class="font-semibold text-white mb-3 text-lg">
                  Does Plus change rankings?
                </h4>
                <p class="text-sm text-white/90 leading-relaxed mb-4">
                  <strong class="font-semibold text-white">No.</strong> Everyone sees the exact same comparison results, rankings, and Remit-Scores, whether on the free plan or Plus. Plus is a feature upgrade, not a different comparison engine.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Independence Rules -->
    <section
      id="independence-rules"
      class="py-16 lg:py-20 bg-gray-900 scroll-mt-20"
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
                    Our Remit-Score is calculated using a consistent methodology. <NuxtLink
                      to="/methodology"
                      class="text-emerald-400 hover:text-emerald-300 underline font-semibold"
                    >See methodology</NuxtLink>.
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
                    Affiliate relationships do not change score calculations. If a provider is the best option, it ranks highly, even if we
                    earn nothing from that provider.
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

    <!-- FAQ -->
    <FaqSection
      id="faq"
      title="Frequently Asked Questions"
      subtitle="Quick answers about how we make money and maintain independence"
      :faqs="faqs"
      section-class="bg-neutral-50"
    />

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
            <NuxtLink
              to="/contact"
              class="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 bg-transparent text-white font-bold text-lg rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              <span>Report a problem</span>
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
import {
  BanknotesIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CursorArrowRaysIcon,
  DocumentTextIcon,
  LinkIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import FaqSection from '~/components/shared/FaqSection.vue'
import { useFeatureFlags } from '~/composables/useFeatureFlags'

const { pulseEnabled, enterpriseEnabled } = useFeatureFlags()

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'How We Make Money', path: '/how-we-make-money' },
]

const faqs = [
  {
    question: 'Do providers pay to rank higher?',
    answer: '<p><strong>No.</strong> Providers cannot pay to change ranking order, Remit-Score, or sorting logic. Rankings are determined by comparison data and our methodology.</p>',
  },
  {
    question: 'Does using your link change the price I get?',
    answer: '<p><strong>No.</strong> Using our link never adds fees. We aim to show the best available quote at the time we capture it, but checkout can vary due to payment method, promotions, verification status, and provider rules. Always confirm the final amount at checkout.</p>',
  },
  {
    question: 'Why might your quote differ from the provider checkout?',
    answer: '<p>Rates can change throughout the day, and some fees or promotions depend on payment method, verification status, or payout method. Every quote is timestamped, and we refresh frequently. Provider checkout is the final source of truth.</p>',
  },
  {
    question: 'Does Plus change rankings or give "better" results?',
    answer: '<p><strong>No.</strong> Plus does not change rankings, Remit-Score calculations, or which providers appear. Plus adds features like alerts, watchlists, deeper history, and an ad free experience. It is not a different comparison engine.</p>',
  },
  {
    question: 'If Plus removes ads, will I still see disclosures?',
    answer: '<p>Yes. Plus can remove advertising placements, but disclosures remain. If a link may generate a commission, we label it clearly.</p>',
  },
  {
    question: 'Do you sell user data to providers?',
    answer: '<p>We do not sell personally identifying information to providers. We use data to improve the product, not to sell personal profiles. See our <a href="/legal/privacy" class="text-brand-600 hover:text-brand-700 underline font-semibold">privacy policy</a> for details.</p>',
  },
  {
    question: 'How do I report an issue?',
    answer: '<p>If something looks off (fees, availability, or delivered amount), report it here: <a href="/contact" class="text-brand-600 hover:text-brand-700 underline font-semibold">Report a problem</a>. We investigate and correct confirmed issues.</p>',
  },
  {
    question: 'What if a provider with an affiliate link ranks higher than one without?',
    answer: '<p>Our rankings are based on data such as delivered amount, total cost, speed, and trust signals. If Provider A (with an affiliate link) ranks higher than Provider B (without one), it is because Provider A offers better value for that specific transfer, not because of the affiliate relationship.</p>',
  },
]

useHead({
  title: 'How Remit-Scout Makes Money | Revenue and Independence',
  meta: [
    {
      name: 'description',
      content: 'How Remit-Scout earns revenue through affiliate commissions, Remit-Scout Plus, and partnerships, and the safeguards that keep rankings independent.',
    },
    {
      property: 'og:title',
      content: 'How Remit-Scout Makes Money | Revenue and Independence',
    },
    {
      property: 'og:description',
      content: 'A clear explanation of how Remit-Scout earns revenue and what we do to keep comparisons and rankings independent.',
    },
  ],
})
</script>
