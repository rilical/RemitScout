<template>
  <div class="min-h-screen bg-white pb-24 md:pb-0">
    <CompareWidget />

    <!-- Hero -->
    <section class="relative overflow-hidden bg-gray-900 py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          :items="breadcrumbItems"
          :dark="true"
        />

        <div class="mt-12">
          <div>
            <h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6 leading-tight">
              Partner with <span class="text-brand-600">Remit-Scout</span>
            </h1>

            <p class="text-xl text-white sm:text-2xl font-medium mb-6 leading-relaxed">
              Reach users who compare international transfer options before they send
            </p>

            <p class="text-lg text-gray-300 leading-relaxed mb-4">
              Remit-Scout is an independent comparison platform for international money transfers. When users search corridors you serve, <strong class="font-semibold text-brand-600">you show up in results</strong>. If they choose you, they click through and complete the transfer on your checkout.
            </p>

            <p class="text-base text-gray-400 leading-relaxed mb-8">
              We rank providers by <strong class="font-semibold text-brand-600">what the recipient should receive</strong> after fees and FX markup, not marketing claims. If your pricing is competitive, you rank higher, whether or not we have an affiliate relationship.
            </p>

            <div class="mb-6">
              <NuxtLink
                to="/contact?type=partnership"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 mb-4"
              >
                Discuss partnership
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

            <p class="text-sm text-gray-400">
              Last updated: December 2025
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Providers We Compare -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
            <svg
              class="w-8 h-8 text-brand-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Providers We Compare
          </h2>
          <p class="text-lg leading-relaxed text-neutral-700 mb-4">
            Examples of providers you'll see in our comparison results. Some have affiliate or data partnerships with us; others don't. Either way, rankings follow the same rules and are driven by pricing and performance data.
          </p>
          <p class="text-base text-neutral-600 leading-relaxed">
            <strong class="font-semibold text-brand-600">We're still growing.</strong> If you're a licensed provider and want accurate coverage, reach out. We onboard new partners continuously.
          </p>
        </div>

        <div class="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 py-12 -mx-4 sm:-mx-6 lg:-mx-8">
          <div class="flex gap-8 animate-scroll-left px-6">
            <div
              v-for="(partner, index) in [...partners, ...partners, ...partners]"
              :key="`provider-${partner.slug}-${index}`"
              class="flex-shrink-0 w-56 h-36 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
            >
              <ProviderLogo
                :slug="partner.slug"
                :alt="partner.name"
                size="default"
              />
            </div>
          </div>
        </div>

        <div class="mt-8 text-center">
          <p class="text-sm text-neutral-600 mb-4">
            Interested in joining our partner network?
          </p>
          <NuxtLink
            to="/contact?type=provider"
            class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
          >
            Become a partner
            <svg
              class="ml-2 h-4 w-4"
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

    <!-- Partnership opportunities at a glance -->
    <section class="py-16 lg:py-20 bg-gradient-to-br from-brand-600 via-brand-700 to-blue-700 relative overflow-hidden">
      <div class="absolute inset-0 bg-brand-600/90" />
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-white mb-4 flex items-center gap-3">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Partnership opportunities at a glance
          </h2>
          <p class="text-lg leading-relaxed text-white/90 mb-4">
            We offer multiple ways to partner with Remit-Scout. Start with provider onboarding and affiliate placements,
            and use clearly labeled sponsorships for brand-safe visibility.
            <span v-if="enterpriseEnabled">Enterprise data licensing is available for select partners.</span>
          </p>
          <p class="text-base leading-relaxed text-white/80 mb-10">
            Partnerships never buy placement. Rankings, scores, and comparisons stay independent and are determined by data, pricing, and performance metrics.
          </p>

          <div class="space-y-6">
            <div class="rounded-2xl border-2 border-brand-700 bg-gray-900 p-8 hover:bg-gray-800 transition-all">
              <div class="flex items-start gap-4">
                <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <svg
                    class="w-7 h-7 text-white"
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
                <div class="flex-1">
                  <h3 class="text-2xl font-semibold text-white mb-3">
                    Affiliate Partnerships
                  </h3>
                  <p class="text-base leading-relaxed text-white/90 mb-4">
                    Get listed in our comparison results. When users click through and complete a transfer, we may earn a commission.
                  </p>
                  <div class="rounded-lg border border-white/20 bg-white/10 p-4 mb-4">
                    <p class="text-sm font-semibold text-white mb-1">
                      Does this affect rankings?
                    </p>
                    <p class="text-sm text-white/90">
                      No. Rankings are based on comparison data (recipient gets, total cost, speed, and trust signals).
                    </p>
                  </div>
                  <NuxtLink
                    to="/contact?type=provider&topic=onboarding"
                    class="inline-flex items-center text-sm font-semibold text-white hover:text-white/80 underline"
                  >
                    Provider onboarding →
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div
              v-if="enterpriseEnabled"
              class="rounded-2xl border-2 border-brand-700 bg-gray-900 p-8 hover:bg-gray-800 transition-all"
            >
              <div class="flex items-start gap-4">
                <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <svg
                    class="w-7 h-7 text-white"
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
                <div class="flex-1">
                  <h3 class="text-2xl font-semibold text-white mb-3">
                    Data & Widgets
                  </h3>
                  <p class="text-base leading-relaxed text-white/90 mb-4">
                    License our comparison data, market charts, or embed widgets on your site or app.
                  </p>
                  <div class="rounded-lg border border-white/20 bg-white/10 p-4 mb-4">
                    <p class="text-sm font-semibold text-white mb-1">
                      Does this affect rankings?
                    </p>
                    <p class="text-sm text-white/90">
                      No. Data licensing is separate from scoring and rankings.
                    </p>
                  </div>
                  <NuxtLink
                    to="/contact?type=media"
                    class="inline-flex items-center text-sm font-semibold text-white hover:text-white/80 underline"
                  >
                    Publisher/media inquiry →
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div
              v-if="enterpriseEnabled"
              class="rounded-2xl border-2 border-brand-700 bg-gray-900 p-8 hover:bg-gray-800 transition-all"
            >
              <div class="flex items-start gap-4">
                <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <svg
                    class="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-semibold text-white mb-3">
                    API Access
                  </h3>
                  <p class="text-base leading-relaxed text-white/90 mb-4">
                    Programmatic access to comparison data for platforms building remittance features or conducting research.
                  </p>
                  <div class="rounded-lg border border-white/20 bg-white/10 p-4 mb-4">
                    <p class="text-sm font-semibold text-white mb-1">
                      Does this affect rankings?
                    </p>
                    <p class="text-sm text-white/90">
                      No. API partnerships don't influence comparison results.
                    </p>
                  </div>
                  <NuxtLink
                    to="/contact?type=platform&topic=api"
                    class="inline-flex items-center text-sm font-semibold text-white hover:text-white/80 underline"
                  >
                    Platform/API inquiry →
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border-2 border-brand-700 bg-gray-900 p-8 hover:bg-gray-800 transition-all">
              <div class="flex items-start gap-4">
                <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <svg
                    class="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-semibold text-white mb-3">
                    Sponsorship
                  </h3>
                  <p class="text-base leading-relaxed text-white/90 mb-4">
                    Support independent research on remittance pricing and reach expats through clearly labeled sponsorships. Brand-safe and clearly labeled.
                  </p>
                  <div class="rounded-lg border border-white/20 bg-white/10 p-4 mb-4">
                    <p class="text-sm font-semibold text-white mb-1">
                      Does this affect rankings?
                    </p>
                    <p class="text-sm text-white/90">
                      No. Sponsorship never changes rankings, sorting, or Remit-Score.
                    </p>
                  </div>
                  <NuxtLink
                    to="/contact?type=sponsorship&topic=inquiry"
                    class="inline-flex items-center text-sm font-semibold text-white hover:text-white/80 underline"
                  >
                    Request sponsorship info →
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- More B2B Opportunities To Come -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-3xl text-center">
          <h2 class="text-3xl font-bold text-neutral-900 mb-4">
            More B2B Opportunities To Come
          </h2>
          <p class="text-lg leading-relaxed text-neutral-700 mb-6">
            We're continuously expanding our partnership offerings. Whether you're a financial institution, remittance provider, or technology platform, we're building new ways to collaborate.
          </p>
          <p class="text-base leading-relaxed text-neutral-600 mb-8">
            Interested in a partnership opportunity that's not listed above? Reach out to discuss custom solutions tailored to your needs.
          </p>
          <NuxtLink
            to="/contact?type=partnership"
            class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
          >
            Discuss partnership opportunities
            <svg
              class="ml-2 h-4 w-4"
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

    <!-- More Partnership Opportunities -->
    <section class="py-16 lg:py-20 bg-brand-600">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-3xl text-center">
          <h2 class="text-3xl font-bold text-white mb-4">
            More Partnership Opportunities Coming Soon
          </h2>
          <p class="text-lg leading-relaxed text-white/90 mb-6">
            We're actively developing additional partnership models to better serve our partners and the remittance community. Stay tuned for updates on new collaboration opportunities.
          </p>
          <p class="text-base leading-relaxed text-white/80 mb-8">
            Have ideas for partnership opportunities? We'd love to hear from you.
          </p>
          <NuxtLink
            to="/contact?type=partnership"
            class="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-semibold text-brand-600 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600"
          >
            Contact us about partnerships
            <svg
              class="ml-2 h-4 w-4"
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

    <!-- Why Partner - Provider Benefits -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-4">
            <svg
              class="w-8 h-8 text-brand-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            What You Get as a Provider Partner
          </h2>
          <p class="text-lg leading-relaxed text-neutral-700 mb-8">
            Partnering with Remit-Scout helps you reach users who compare providers before they send, and it helps us keep coverage accurate as your product changes.
          </p>

          <!-- Remit-Score Visual -->
          <div class="bg-gradient-to-r from-brand-50 to-blue-50 border-2 border-brand-200 rounded-3xl p-8 lg:p-12 mb-10">
            <div class="flex flex-col lg:flex-row items-center gap-8">
              <div class="flex-shrink-0">
                <div class="relative">
                  <div class="w-48 h-48 lg:w-64 lg:h-64 rounded-full border-4 border-brand-600 bg-white flex items-center justify-center shadow-xl">
                    <div class="text-center">
                      <div class="text-5xl lg:text-7xl font-bold text-brand-600 mb-2">
                        9.5
                      </div>
                      <div class="text-sm lg:text-base font-semibold text-neutral-700">
                        Remit-Score
                      </div>
                    </div>
                  </div>
                  <div class="absolute -top-4 -right-4 w-20 h-20 lg:w-24 lg:h-24 rounded-full border-4 border-emerald-500 bg-white flex items-center justify-center shadow-lg">
                    <div class="text-center">
                      <div class="text-2xl lg:text-3xl font-bold text-emerald-600">
                        8.4
                      </div>
                    </div>
                  </div>
                  <div class="absolute -bottom-4 -left-4 w-16 h-16 lg:w-20 lg:h-20 rounded-full border-4 border-blue-500 bg-white flex items-center justify-center shadow-lg">
                    <div class="text-center">
                      <div class="text-xl lg:text-2xl font-bold text-blue-600">
                        7.2
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
                  How Remit-Score Works
                </h3>
                <p class="text-base leading-relaxed text-neutral-700 mb-4">
                  Each provider gets a <strong class="font-semibold text-neutral-900">Remit-Score</strong> (0-10 scale) based on quote data and reliability signals, including delivered outcome, total cost, transfer speed, and coverage.
                </p>
                <p class="text-sm leading-relaxed text-neutral-600 mb-4">
                  Scores like <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-600 text-brand-600 font-bold text-sm mx-1">9.5</span>,
                  <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-emerald-500 text-emerald-600 font-bold text-sm mx-1">8.4</span>, or
                  <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-blue-500 text-blue-600 font-bold text-sm mx-1">7.2</span>
                  represent the overall quality and value users can expect from each provider.
                </p>
                <p class="text-sm font-semibold text-neutral-900 mb-4">
                  If your pricing is competitive, your Remit-Score reflects that — regardless of commercial relationships.
                </p>
                <div class="flex flex-wrap gap-4">
                  <NuxtLink
                    to="/methodology"
                    class="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Learn more about our methodology
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
                  <NuxtLink
                    to="/learn/providers"
                    class="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    See provider examples
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
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-2 mb-10">
            <div class="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 mb-4">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-neutral-900 mb-3">
                Qualified Traffic & New Customers
              </h3>
              <p class="text-sm leading-relaxed text-neutral-700 mb-3">
                When users compare corridors you serve, your listing appears alongside competitors. These are <strong class="font-semibold text-neutral-900">high-intent users</strong> actively comparing prices and payout options.
              </p>
              <p class="text-xs leading-relaxed text-neutral-600">
                Unlike generic ads, this is traffic from users already in a decision flow. If they choose you, they click through to complete checkout on your site.
              </p>
            </div>

            <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 mb-4">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-neutral-900 mb-3">
                Fair, Transparent Comparison
              </h3>
              <p class="text-sm leading-relaxed text-neutral-700 mb-3">
                We rank by what recipients actually receive. <strong class="font-semibold text-brand-600">If your pricing is competitive, you rank higher</strong> — regardless of affiliate relationships.
              </p>
              <p class="text-xs leading-relaxed text-neutral-600">
                Many sites charge for placement or prioritize partners. We don't. Our algorithm is transparent — better rates mean higher rankings, even if we earn zero commission.
              </p>
            </div>

            <div class="md:col-span-2 rounded-2xl border-2 border-neutral-200 bg-white p-6">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 mb-4">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-neutral-900 mb-3">
                Brand Visibility & Trust
              </h3>
              <p class="text-sm leading-relaxed text-neutral-700 mb-3">
                Appearing in comparison results gives you <strong class="font-semibold text-neutral-900">brand exposure</strong> to users actively searching for money transfer options. Every time your service appears in search results, you're building brand awareness among high-intent customers. Even without immediate clicks, seeing your brand name and logo builds recognition and positions you as a legitimate, trustworthy option in the remittance space.
              </p>
              <p class="text-xs leading-relaxed text-neutral-600 mb-3">
                For newer or smaller providers, comparison sites like Remit-Scout are often the first place potential customers discover your service. We level the playing field by letting quality and pricing drive visibility, not marketing budgets. This means emerging providers with competitive rates get the same exposure opportunities as established players.
              </p>
              <div class="rounded-lg border border-brand-100 bg-brand-50 p-3">
                <p class="text-xs font-semibold text-brand-900 mb-1">
                  Provider Reviews
                </p>
                <p class="text-xs leading-relaxed text-brand-800">
                  We can publish detailed provider reviews that explain fees, payout methods, supported corridors, and key user considerations. Clear reviews reduce friction and help users understand what to expect before they click through.
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border-2 border-brand-600 bg-brand-600 p-8 text-white">
            <h3 class="text-2xl font-bold mb-6">
              Ready to get started?
            </h3>

            <p class="text-lg text-white/95 leading-relaxed mb-6">
              Just contact us. We'll help you understand how we can work together and what information we need to get you listed on Remit-Scout.
            </p>

            <div class="flex flex-wrap gap-3">
              <NuxtLink
                to="/contact?type=partnership"
                class="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-semibold text-brand-600 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600"
              >
                Contact us
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- For Publishers/Media -->
    <section
      v-if="enterpriseEnabled"
      class="py-16 lg:py-20 bg-brand-600"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-white flex items-center gap-3 mb-6">
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
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            For Platforms, Publishers & Media
          </h2>
          <p class="text-lg leading-relaxed text-white/95 mb-10">
            Integrate comparison tools or market data into your product or content to help users make better transfer decisions.
          </p>

          <div class="rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm p-8">
            <div class="mb-6">
              <p class="text-base font-semibold text-white mb-4">
                Integration options:
              </p>
              <ul class="space-y-3 text-sm text-white/95">
                <li class="flex items-start gap-2">
                  <svg
                    class="w-5 h-5 text-white mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span><strong class="font-semibold text-white">Embed our comparison widget</strong> on your site (can be white-labeled)</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg
                    class="w-5 h-5 text-white mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span><strong class="font-semibold text-white">Use our rate charts and market trends</strong> in articles or reports</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg
                    class="w-5 h-5 text-white mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span><strong class="font-semibold text-white">Collaborate on research</strong> or co-create educational content</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg
                    class="w-5 h-5 text-white mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span><strong class="font-semibold text-white">Access our API</strong> for programmatic comparison data</span>
                </li>
              </ul>
            </div>

            <div class="rounded-lg border border-white/20 bg-white/5 p-4 mb-6">
              <p class="text-sm font-semibold text-white mb-2">
                White-label Compare Module
              </p>
              <p class="text-sm text-white/90 leading-relaxed">
                For apps and communities, we offer a white-label Compare module that lets users compare providers without leaving your site. You can embed a widget or integrate via API while we keep methodology and disclosure consistent.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <NuxtLink
                to="/contact?type=media&topic=publisher"
                class="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600"
              >
                Publisher/media inquiry
              </NuxtLink>
              <NuxtLink
                to="/contact?type=platform&topic=api"
                class="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-transparent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600"
              >
                Platform/API inquiry
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Enterprise Data & API Partnerships (Institutional) -->
    <section
      v-if="enterpriseEnabled"
      class="py-16 lg:py-20 bg-slate-900"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-12">
          <p class="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
            For Banks, MTOs & Research Teams
          </p>
          <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
            Enterprise Data & API Partnerships
          </h2>
          <p class="text-lg text-slate-400 max-w-3xl">
            Access institutional-grade pricing intelligence, market analytics, and compliance-ready data feeds for treasury operations, competitive analysis, and regulatory reporting.
          </p>
        </div>

        <div class="grid gap-6 lg:grid-cols-3 mb-12">
          <!-- Pricing Intelligence -->
          <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
                <svg
                  class="w-5 h-5 text-blue-400"
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
              <h3 class="text-lg font-semibold text-white">
                Pricing Intelligence
              </h3>
            </div>
            <p class="text-sm text-slate-400 mb-4">
              Real-time and historical corridor pricing across 33+ licensed providers. Benchmark your spreads against market averages and identify optimization opportunities.
            </p>
            <ul class="space-y-2 text-sm text-slate-300">
              <li class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-emerald-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Spread optimization analysis</span>
              </li>
              <li class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-emerald-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Competitor rate benchmarking</span>
              </li>
              <li class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-emerald-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Market insight reports</span>
              </li>
            </ul>
          </div>

          <!-- Execution & Latency -->
          <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20">
                <svg
                  class="w-5 h-5 text-emerald-400"
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
              </div>
              <h3 class="text-lg font-semibold text-white">
                Execution & Latency
              </h3>
            </div>
            <p class="text-sm text-slate-400 mb-4">
              Monitor operational reliability across providers. Track execution signals, latency metrics, and availability to optimize routing decisions.
            </p>
            <ul class="space-y-2 text-sm text-slate-300">
              <li class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-emerald-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Execution signal feeds</span>
              </li>
              <li class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-emerald-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Latency matrix by corridor</span>
              </li>
              <li class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-emerald-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Operational reliability scores</span>
              </li>
            </ul>
          </div>

          <!-- Compliance & Audit -->
          <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20">
                <svg
                  class="w-5 h-5 text-purple-400"
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
              </div>
              <h3 class="text-lg font-semibold text-white">
                Compliance & Audit
              </h3>
            </div>
            <p class="text-sm text-slate-400 mb-4">
              Audit-ready data exports with full provenance. Timestamped records, compliance logs, and regulatory documentation for best execution requirements.
            </p>
            <ul class="space-y-2 text-sm text-slate-300">
              <li class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-emerald-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Compliance log exports</span>
              </li>
              <li class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-emerald-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>SHA-256 data provenance</span>
              </li>
              <li class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-emerald-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Best execution documentation</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- API Access Details -->
        <div class="rounded-xl border border-slate-700 bg-slate-800/30 p-8">
          <div class="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 class="text-xl font-semibold text-white mb-4">
                API Integration Options
              </h3>
              <div class="space-y-4">
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 w-8 h-8 rounded bg-blue-600/20 flex items-center justify-center text-sm font-bold text-blue-400">
                    1
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">
                      REST API
                    </p>
                    <p class="text-xs text-slate-500">
                      Real-time quote endpoints, historical data, corridor metadata
                    </p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 w-8 h-8 rounded bg-blue-600/20 flex items-center justify-center text-sm font-bold text-blue-400">
                    2
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">
                      Webhooks
                    </p>
                    <p class="text-xs text-slate-500">
                      Price alerts, corridor changes, provider status updates
                    </p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 w-8 h-8 rounded bg-blue-600/20 flex items-center justify-center text-sm font-bold text-blue-400">
                    3
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">
                      Batch Exports
                    </p>
                    <p class="text-xs text-slate-500">
                      Scheduled CSV/JSON delivery for compliance and analytics
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-xl font-semibold text-white mb-4">
                Enterprise SLA
              </h3>
              <div class="grid gap-3 grid-cols-2">
                <div class="rounded-lg bg-slate-900 p-3">
                  <p class="text-xs text-slate-500">
                    Uptime
                  </p>
                  <p class="text-lg font-bold text-white">
                    99.9%
                  </p>
                </div>
                <div class="rounded-lg bg-slate-900 p-3">
                  <p class="text-xs text-slate-500">
                    Latency
                  </p>
                  <p class="text-lg font-bold text-white">
                    &lt;100ms
                  </p>
                </div>
                <div class="rounded-lg bg-slate-900 p-3">
                  <p class="text-xs text-slate-500">
                    Support
                  </p>
                  <p class="text-lg font-bold text-white">
                    24/7
                  </p>
                </div>
                <div class="rounded-lg bg-slate-900 p-3">
                  <p class="text-xs text-slate-500">
                    Data Retention
                  </p>
                  <p class="text-lg font-bold text-white">
                    365+ days
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4 text-sm text-slate-500">
              <div class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Synthetically verified</span>
              </div>
              <div class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>GDPR compliant</span>
              </div>
              <div class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Custom DPA available</span>
              </div>
            </div>

            <NuxtLink
              to="/contact?type=enterprise&topic=api"
              class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Request API access
              <svg
                class="w-4 h-4"
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

    <!-- Independence Rules (Dark Trust Band) -->
    <section class="py-16 lg:py-20 bg-gradient-to-br from-slate-900 to-slate-800">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-white mb-4">
            Our independence rules
          </h2>
          <p class="text-lg leading-relaxed text-white/90 mb-10 max-w-3xl">
            Independence is not a tagline. It's a set of rules we enforce so partners cannot influence what users see.
          </p>

          <div class="grid gap-6 md:grid-cols-2">
            <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div class="flex items-start gap-3 mb-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 flex-shrink-0">
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-white">
                  Rule 1: No pay-to-rank
                </h3>
              </div>
              <p class="text-sm text-white/80 leading-relaxed">
                Providers cannot pay to appear higher, improve a Remit-Score, or change how we sort results. Rankings are based on comparison data, not commercial relationships.
              </p>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div class="flex items-start gap-3 mb-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 flex-shrink-0">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-white">
                  Rule 2: Consistent scoring
                </h3>
              </div>
              <p class="text-sm text-white/80 leading-relaxed">
                Our Remit-Score is calculated using a consistent methodology designed to reflect sender value: delivered amount, total cost, reliability, speed, and trust signals.
              </p>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div class="flex items-start gap-3 mb-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 flex-shrink-0">
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-white">
                  Rule 3: Commercial separation
                </h3>
              </div>
              <p class="text-sm text-white/80 leading-relaxed">
                Affiliate relationships do not change score calculations. If a provider offers the best deal for a corridor, they rank highly — even if we earn nothing from them.
              </p>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div class="flex items-start gap-3 mb-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 flex-shrink-0">
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
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-white">
                  Rule 4: Clear labeling
                </h3>
              </div>
              <p class="text-sm text-white/80 leading-relaxed">
                Where commercial relationships exist, we label them clearly. Disclosures appear near affiliate links, and sponsorships are marked as "Sponsored" or "Ad."
              </p>
            </div>
          </div>

          <div class="mt-10 text-center">
            <NuxtLink
              to="/methodology"
              class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              Read full methodology
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

    <!-- Data Sourcing & Accuracy -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-6">
            <svg
              class="w-8 h-8 text-brand-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
            Data Sourcing & Accuracy
          </h2>
          <p class="text-lg leading-relaxed text-neutral-700 mb-4">
            How we collect and display comparison data
          </p>
          <p class="text-base leading-relaxed text-neutral-600 mb-8">
            We get pricing data three ways: <strong class="font-semibold text-neutral-900">direct provider feeds</strong> (most consistent when available), <strong class="font-semibold text-neutral-900">partner feeds</strong>, or <strong class="font-semibold text-neutral-900">public quote requests</strong>. We normalize everything into one comparable number: what the recipient should receive. Refresh cadence varies by corridor and payment method.
          </p>

          <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p class="text-base font-semibold text-neutral-900 mb-4">
              Important notes:
            </p>
            <ul class="space-y-3 text-sm text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-neutral-400 font-bold mt-0.5">•</span>
                <span><strong class="font-semibold text-neutral-900">Quotes can change at checkout.</strong> The final amount depends on payment method (bank transfer vs. card), promotional discounts, KYC verification, and provider-specific rules. Always verify the final amount on the provider's website before completing the transfer.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-neutral-400 font-bold mt-0.5">•</span>
                <span><strong class="font-semibold text-neutral-900">We fix errors quickly.</strong> Every quote shows a timestamp. If you notice incorrect pricing, fees, or availability, use our corrections form. We investigate and resolve confirmed issues within 48 hours.</span>
              </li>
            </ul>
            <div class="mt-6 flex flex-wrap gap-3">
              <NuxtLink
                to="/contact"
                class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
              >
                Report a problem
              </NuxtLink>
              <NuxtLink
                to="/corrections"
                class="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
              >
                Corrections policy
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl">
          <div class="text-center mb-10">
            <h2 class="text-3xl font-bold text-neutral-900 mb-3">
              Frequently asked questions
            </h2>
            <p class="text-lg text-neutral-600">
              Quick answers about partnerships, independence, and how we work
            </p>
          </div>

          <div class="rounded-2xl border-2 border-blue-700 bg-blue-700 p-6 shadow-sm">
            <div class="space-y-6">
              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between py-4 text-left font-semibold text-white hover:text-white/80 transition-colors">
                  <span class="text-base">Can providers pay to rank higher on Remit-Scout?</span>
                  <svg
                    class="h-5 w-5 flex-shrink-0 text-white/70 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div class="pb-4 pt-2 text-sm leading-relaxed text-white/90">
                  No. Providers cannot pay to change ranking order, Remit-Score, or sorting logic. Rankings are determined by comparison data (recipient gets, total cost, speed, trust signals) and our consistent methodology.
                </div>
              </details>

              <div class="border-t border-white/20" />

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between py-4 text-left font-semibold text-white hover:text-white/80 transition-colors">
                  <span class="text-base">How do affiliate partnerships work? Do I have to pay to be listed?</span>
                  <svg
                    class="h-5 w-5 flex-shrink-0 text-white/70 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div class="pb-4 pt-2 text-sm leading-relaxed text-white/90">
                  <p class="mb-3">
                    <strong class="font-semibold text-white">No upfront costs.</strong> There's no fee to be listed on Remit-Scout. If you share pricing documentation or allow quote capture from public pages, we'll list you for free.
                  </p>
                  <p class="mb-3">
                    Affiliate partnerships are optional. If we have an affiliate relationship, we only earn a commission when a user clicks through from Remit-Scout and completes a transfer with you. If you don't want an affiliate relationship, we'll still list you — you just won't pay any commissions.
                  </p>
                  <p>
                    Either way, your ranking is determined by pricing and service quality, not by whether we have an affiliate relationship. Users pay the same price whether they find you through Remit-Scout or directly — we earn commissions from providers, not users.
                  </p>
                </div>
              </details>

              <div class="border-t border-white/20" />

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between py-4 text-left font-semibold text-white hover:text-white/80 transition-colors">
                  <span class="text-base">What's the benefit to me if I don't want an affiliate relationship?</span>
                  <svg
                    class="h-5 w-5 flex-shrink-0 text-white/70 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div class="pb-4 pt-2 text-sm leading-relaxed text-white/90">
                  <p class="mb-3">
                    Even without an affiliate relationship, you still benefit from:
                  </p>
                  <ul class="space-y-2 ml-4 list-disc">
                    <li><strong class="font-semibold text-white">Free exposure:</strong> You appear in comparison results when users search your corridors, driving qualified traffic to your site at no cost.</li>
                    <li><strong class="font-semibold text-white">Fair ranking:</strong> If your pricing is competitive, you rank higher — you're not penalized for not having an affiliate relationship.</li>
                    <li><strong class="font-semibold text-white">Brand visibility:</strong> Users discover your service and build awareness, even if they don't click through immediately.</li>
                    <li><strong class="font-semibold text-white">New customer acquisition:</strong> Users who click through to your site become customers — you just don't pay us a commission.</li>
                  </ul>
                  <p class="mt-3">
                    Many providers start without affiliate relationships and add them later if the traffic volume justifies it. You can always opt in to affiliate tracking later.
                  </p>
                </div>
              </details>

              <div class="border-t border-white/20" />

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between py-4 text-left font-semibold text-white hover:text-white/80 transition-colors">
                  <span class="text-base">Can I improve my ranking by paying more or having a stronger affiliate relationship?</span>
                  <svg
                    class="h-5 w-5 flex-shrink-0 text-white/70 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div class="pb-4 pt-2 text-sm leading-relaxed text-white/90">
                  <p class="mb-3">
                    <strong class="font-semibold text-white">No.</strong> Our ranking algorithm is completely independent of commercial relationships. We don't offer "pay-to-rank" or "premium placement" options.
                  </p>
                  <p>
                    Rankings are determined solely by comparison data: what recipients receive (after fees and FX markup), total cost, transfer speed, and trust signals. Our scoring formula is public (see our methodology page). If you want to improve your ranking, improve your pricing and service quality — that's the only way.
                  </p>
                </div>
              </details>

              <div class="border-t border-white/20" />

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between py-4 text-left font-semibold text-white hover:text-white/80 transition-colors">
                  <span class="text-base">What if my pricing changes or I notice an error in how I'm listed?</span>
                  <svg
                    class="h-5 w-5 flex-shrink-0 text-white/70 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div class="pb-4 pt-2 text-sm leading-relaxed text-white/90">
                  <p class="mb-3">
                    <strong class="font-semibold text-white">We fix errors quickly.</strong> If you notice incorrect pricing, fees, or service details, contact your partnership contact or use our corrections form. We investigate and resolve confirmed issues within 48 hours.
                  </p>
                  <p>
                    For pricing changes: If we have direct data feeds, updates are automatic. If we pull quotes manually, just let us know when pricing changes and we'll update our system. For new corridors, promotions, or service changes, keep your partnership contact updated and we'll reflect changes on the site.
                  </p>
                </div>
              </details>

              <div class="border-t border-white/20" />

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between py-4 text-left font-semibold text-white hover:text-white/80 transition-colors">
                  <span class="text-base">How long does onboarding take? What's the process?</span>
                  <svg
                    class="h-5 w-5 flex-shrink-0 text-white/70 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div class="pb-4 pt-2 text-sm leading-relaxed text-white/90">
                  <p class="mb-3">
                    Most providers can be listed within <strong class="font-semibold text-white">1-2 weeks</strong> of initial contact. Here's the typical process:
                  </p>
                  <ol class="space-y-2 ml-4 list-decimal">
                    <li><strong class="font-semibold text-white">Initial contact:</strong> Fill out our provider inquiry form or email us with basic info about your service.</li>
                    <li><strong class="font-semibold text-white">Data sharing:</strong> Share pricing documentation, corridor details, or access to public quote flows.</li>
                    <li><strong class="font-semibold text-white">Integration:</strong> We integrate your data into our comparison system (usually 3-5 business days).</li>
                    <li><strong class="font-semibold text-white">Testing & verification:</strong> We test quotes across your corridors and verify accuracy.</li>
                    <li><strong class="font-semibold text-white">Go live:</strong> You appear in comparison results!</li>
                  </ol>
                  <p class="mt-3">
                    If you can provide structured data, the process is faster. If we need to pull quotes manually, it may take a bit longer. We'll keep you updated throughout the process.
                  </p>
                </div>
              </details>
            </div>
          </div>

          <div class="mt-8 text-center">
            <NuxtLink
              to="/faq"
              class="inline-flex items-center justify-center rounded-xl border border-brand-600 bg-white px-6 py-3 text-base font-semibold text-brand-600 transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            >
              View all FAQs
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="py-16 sm:py-20 bg-brand-600">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          Ready to get listed on Remit-Scout?
        </h2>
        <p class="text-xl text-white/90 mb-8">
          Get discovered by expats and international families actively comparing transfer options
        </p>
        <p class="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
          No upfront costs. No pay-to-rank. Just accurate, fair comparison that helps users find the best option — and helps you reach new customers when you offer competitive pricing.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4">
          <NuxtLink
            to="/contact?type=partnership"
            class="inline-flex items-center gap-3 px-8 py-4 bg-white text-brand-600 font-bold text-lg rounded-xl hover:bg-neutral-50 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <span>Discuss partnership</span>
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
            to="/methodology"
            class="inline-flex items-center gap-3 px-8 py-4 border-2 border-white/30 bg-transparent text-white font-bold text-lg rounded-xl hover:bg-white/10 transition-all duration-200"
          >
            <span>See how we compare</span>
          </NuxtLink>
        </div>
        <div class="mt-8 pt-8 border-t border-white/20">
          <p class="text-sm text-white/80 mb-3">
            More resources:
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <NuxtLink
              to="/legal/how-we-make-money"
              class="text-sm text-white/90 hover:text-white underline"
            >
              How we make money
            </NuxtLink>
            <span class="text-white/50">•</span>
            <NuxtLink
              to="/affiliate-disclosure"
              class="text-sm text-white/90 hover:text-white underline"
            >
              Affiliate disclosure
            </NuxtLink>
            <span class="text-white/50">•</span>
            <NuxtLink
              to="/corrections"
              class="text-sm text-white/90 hover:text-white underline"
            >
              Corrections policy
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
import ProviderLogo from '~/components/shared/ProviderLogo.vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import { useFeatureFlags } from '~/composables/useFeatureFlags'

const { enterpriseEnabled } = useFeatureFlags()

const partners = ref([
  { name: 'Wise', slug: 'wise' },
  { name: 'Remitly', slug: 'remitly' },
  { name: 'WorldRemit', slug: 'worldremit' },
  { name: 'Western Union', slug: 'western-union' },
  { name: 'SendWave', slug: 'sendwave' },
  { name: 'XE Money', slug: 'xe-money' },
])

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'
const canonicalUrl = `${siteUrl}/partnerships`
const lastReviewedIso = '2025-12-01'

setSeo({
  title: 'Partnerships | Remit-Scout',
  description: 'Work with Remit-Scout — an independent remittance comparison and market data platform built for transparency, with no pay-to-rank.',
  canonical: canonicalUrl,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Partnerships', url: canonicalUrl },
])

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'Remit-Scout',
  'url': siteUrl,
  'logo': `${siteUrl}/logos/remit-scout.svg`,
  'contactPoint': [
    {
      '@type': 'ContactPoint',
      'contactType': 'partnerships',
      'email': `partnership@remit-scout.com`,
      'url': `${siteUrl}/contact`,
    },
  ],
}

useHead({
  meta: [
    { name: 'author', content: 'Remit-Scout' },
    { property: 'article:modified_time', content: lastReviewedIso },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(organizationSchema),
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Partnerships', path: '/partnerships' },
]
</script>

<style scoped>
@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.animate-scroll-left {
  animation: scroll-left 50s linear infinite;
  width: fit-content;
}

.animate-scroll-left:hover {
  animation-play-state: paused;
}
</style>

<style>
* {
  -webkit-hyphens: none !important;
  -moz-hyphens: none !important;
  -ms-hyphens: none !important;
  hyphens: none !important;
  word-break: normal !important;
  overflow-wrap: normal !important;
}

p, span, div, h1, h2, h3, h4, h5, h6, a, li, td, th {
  -webkit-hyphens: none !important;
  -moz-hyphens: none !important;
  -ms-hyphens: none !important;
  hyphens: none !important;
}
</style>
const { enterpriseEnabled } = useFeatureFlags()
