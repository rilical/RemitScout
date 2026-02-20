<template>
  <div class="min-h-screen bg-surface">

    <!-- Hero -->
    <section class="relative overflow-hidden bg-neutral-900 py-16 lg:py-24">
      <div class="mx-auto max-w-page px-page-x">
        <Breadcrumbs
          :items="breadcrumbItems"
          :dark="true"
        />

        <div class="mt-12 max-w-4xl">
          <h1 class="text-hero font-bold tracking-tight text-white mb-6 leading-tight [text-wrap:balance]">
            Partner with Remit-Scout
          </h1>

          <p class="text-h4 text-white font-medium mb-6 leading-relaxed [text-wrap:balance]">
            Reach users who compare international transfer options before they send.
          </p>

          <p class="text-body-lg text-neutral-300 leading-relaxed mb-4 max-w-3xl [text-wrap:pretty]">
            Remit-Scout is an independent comparison platform for international money transfers. When users search corridors you serve, you show up in results. If they choose you, they click through and complete the transfer on your checkout.
          </p>

          <p class="text-body text-neutral-400 leading-relaxed mb-8 max-w-3xl [text-wrap:pretty]">
            We rank providers by what the recipient actually receives — after fees and FX markup — not marketing claims. Competitive pricing means a higher ranking, regardless of whether we have a commercial relationship.
          </p>

          <NuxtLink
            to="/contact?type=partnership"
            class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-body font-semibold text-white motion-safe:transition-colors hover:bg-brand-700"
          >
            Get in touch
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Providers We Compare -->
    <section class="py-16 lg:py-20 bg-surface">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-8">
          <h2 class="text-h2 font-bold text-neutral-900 mb-4">
            Providers we compare
          </h2>
          <p class="text-body-lg leading-relaxed text-neutral-700 mb-3 max-w-3xl [text-wrap:pretty]">
            Some of the providers in our comparison results. Some have affiliate or data partnerships with us; others don't. Either way, rankings follow the same rules — driven by pricing and performance data.
          </p>
          <p class="text-body text-neutral-600 leading-relaxed">
            <strong class="font-semibold text-neutral-900">We're still growing.</strong> If you're a licensed provider and want accurate coverage, reach out. We onboard new providers continuously.
          </p>
        </div>

        <div class="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 py-12 -mx-page-x">
          <div class="flex gap-8 animate-scroll-left px-6">
            <div
              v-for="(partner, index) in [...partners, ...partners, ...partners]"
              :key="`provider-${partner.slug}-${index}`"
              class="flex-shrink-0 w-56 h-36 rounded-xl border border-neutral-200 bg-surface p-6 shadow-sm flex items-center justify-center hover:shadow-md motion-safe:transition-shadow"
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
          <p class="text-body-sm text-neutral-600 mb-4">
            Interested in joining our partner network?
          </p>
          <NuxtLink
            to="/contact?type=provider"
            class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-body font-semibold text-white motion-safe:transition-colors hover:bg-brand-700"
          >
            Become a partner
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Partnership Types -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-10">
          <p class="text-body-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">
            Partnership opportunities
          </p>
          <h2 class="text-h2 font-bold text-neutral-900 mb-4 [text-wrap:balance]">
            Multiple ways to work with us
          </h2>
          <p class="text-body-lg text-neutral-700 leading-relaxed max-w-3xl [text-wrap:pretty]">
            From provider onboarding to data licensing — partnerships never buy placement. Rankings, scores, and comparisons stay independent.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <!-- Affiliate -->
          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 mb-4">
              <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 class="text-h4 font-bold text-neutral-900 mb-2">
              Affiliate partnerships
            </h3>
            <p class="text-body-sm text-neutral-700 leading-relaxed mb-4 [text-wrap:pretty]">
              Get listed in our comparison results. When a user clicks through and completes a transfer, we may earn a commission — at no cost to the sender. No upfront fee to be listed.
            </p>
            <NuxtLink
              to="/contact?type=provider&topic=onboarding"
              class="inline-flex items-center gap-1.5 text-body-sm font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
            >
              Provider onboarding
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>

          <!-- Sponsorship -->
          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 mb-4">
              <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-h4 font-bold text-neutral-900 mb-2">
              Sponsorship
            </h3>
            <p class="text-body-sm text-neutral-700 leading-relaxed mb-4 [text-wrap:pretty]">
              Support independent remittance research and reach expats through clearly labeled sponsorships. All sponsorships are disclosed and never affect rankings, sorting, or Remit-Score.
            </p>
            <NuxtLink
              to="/contact?type=sponsorship&topic=inquiry"
              class="inline-flex items-center gap-1.5 text-body-sm font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
            >
              Sponsorship enquiry
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>

          <!-- Data & Widgets -->
          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 mb-4">
              <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-h4 font-bold text-neutral-900 mb-2">
              Data & widgets
            </h3>
            <p class="text-body-sm text-neutral-700 leading-relaxed mb-4 [text-wrap:pretty]">
              License comparison data, embed market charts, or integrate a white-label compare widget on your site or app. Available to publishers, fintechs, and platforms serving the remittance market.
            </p>
            <NuxtLink
              to="/contact?type=media&topic=publisher"
              class="inline-flex items-center gap-1.5 text-body-sm font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
            >
              Publisher & media inquiry
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>

          <!-- Institutional (gated) -->
          <div
            v-if="enterpriseEnabled"
            class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span class="text-[10px] font-bold uppercase tracking-wide bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">NDA required</span>
            </div>
            <h3 class="text-h4 font-bold text-neutral-900 mb-2">
              Institutional data access
            </h3>
            <p class="text-body-sm text-neutral-700 leading-relaxed mb-4 [text-wrap:pretty]">
              Real-time corridor pricing, proprietary cost and volatility indices, and historical datasets for research teams and risk desks. Engagements proceed under NDA.
            </p>
            <NuxtLink
              to="/contact?type=enterprise&topic=data"
              class="inline-flex items-center gap-1.5 text-body-sm font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
            >
              Request access
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>

          <!-- Fallback: non-gated institutional placeholder -->
          <div
            v-else
            class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 mb-4">
              <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 class="text-h4 font-bold text-neutral-900 mb-2">
              Institutional access
            </h3>
            <p class="text-body-sm text-neutral-700 leading-relaxed mb-4 [text-wrap:pretty]">
              Corridor pricing data, proprietary indices, and structured data access are available to qualified research teams and risk desks. Engagements proceed under NDA.
            </p>
            <NuxtLink
              to="/contact?type=enterprise&topic=data"
              class="inline-flex items-center gap-1.5 text-body-sm font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
            >
              Get in touch
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Provider Benefits -->
    <section class="py-16 lg:py-20 bg-neutral-900">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-10">
          <p class="text-body-sm font-semibold text-brand-400 uppercase tracking-wide mb-3">
            Why partner
          </p>
          <h2 class="text-h2 font-bold text-white mb-4 [text-wrap:balance]">
            What you get as a provider partner
          </h2>
          <p class="text-body-lg text-neutral-300 leading-relaxed max-w-3xl [text-wrap:pretty]">
            Partnering with Remit-Scout helps you reach users who compare providers before they send — and it keeps your coverage accurate as your product evolves.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div class="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div class="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-body-lg font-bold text-white">
              Qualified traffic
            </h3>
            <p class="text-body-sm text-white/60 leading-relaxed [text-wrap:pretty]">
              Users on Remit-Scout are actively comparing prices and payout options — not browsing. When they choose your service, they click through already in a decision flow.
            </p>
          </div>

          <div class="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div class="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-body-lg font-bold text-white">
              Fair, data-driven ranking
            </h3>
            <p class="text-body-sm text-white/60 leading-relaxed [text-wrap:pretty]">
              We rank by what recipients actually receive. If your pricing is competitive, you rank higher — regardless of affiliate relationships. Better rates mean better placement.
            </p>
          </div>

          <div class="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div class="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 class="text-body-lg font-bold text-white">
              Brand visibility
            </h3>
            <p class="text-body-sm text-white/60 leading-relaxed [text-wrap:pretty]">
              Appearing in results gives you consistent exposure to high-intent users. For newer providers, comparison platforms are often the first point of discovery — quality drives visibility, not marketing spend.
            </p>
          </div>
        </div>

        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink
            to="/contact?type=provider&topic=onboarding"
            class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-body-sm font-semibold text-white hover:bg-brand-700 motion-safe:transition-colors"
          >
            Start onboarding
          </NuxtLink>
          <NuxtLink
            to="/methodology"
            class="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-transparent px-6 py-3 text-body-sm font-semibold text-white hover:bg-white/5 motion-safe:transition-colors"
          >
            How we rank providers
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- How Remit-Score Works -->
    <section class="py-16 lg:py-20 bg-surface">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-5xl">
          <div class="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p class="text-body-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">
                How rankings work
              </p>
              <h2 class="text-h2 font-bold text-neutral-900 mb-4 [text-wrap:balance]">
                Remit-Score: the number behind every ranking
              </h2>
              <p class="text-body-lg text-neutral-700 leading-relaxed mb-4 [text-wrap:pretty]">
                Every provider on Remit-Scout receives a <strong class="font-semibold text-neutral-900">Remit-Score</strong> — a composite 0–10 rating computed from live quote data. The score answers one question: how much value does this provider actually deliver to the recipient?
              </p>
              <p class="text-body text-neutral-600 leading-relaxed mb-6 [text-wrap:pretty]">
                Remit-Score is not a review. It is not an opinion. It is a quantitative calculation — providers cannot pay to improve it. If your pricing is competitive, your score reflects that.
              </p>
              <NuxtLink
                to="/methodology#how-we-rate"
                class="inline-flex items-center gap-2 text-body-sm font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
              >
                See full scoring methodology
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </NuxtLink>
            </div>

            <div class="flex items-center justify-center py-8">
              <div class="relative">
                <div class="w-48 h-48 lg:w-56 lg:h-56 rounded-full border-4 border-brand-600 bg-surface flex items-center justify-center shadow-xl">
                  <div class="text-center">
                    <div class="text-hero font-bold text-brand-600 mb-1">9.5</div>
                    <div class="text-body-sm font-semibold text-neutral-600">Remit-Score</div>
                  </div>
                </div>
                <div class="absolute -top-3 -right-3 w-20 h-20 lg:w-24 lg:h-24 rounded-full border-4 border-brand-400 bg-surface flex items-center justify-center shadow-lg">
                  <div class="text-center">
                    <div class="text-h3 font-bold text-brand-500">8.4</div>
                  </div>
                </div>
                <div class="absolute -bottom-3 -left-3 w-16 h-16 lg:w-20 lg:h-20 rounded-full border-4 border-neutral-300 bg-surface flex items-center justify-center shadow-lg">
                  <div class="text-center">
                    <div class="text-h4 font-bold text-neutral-500">7.2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Independence Rules -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-10">
          <p class="text-body-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">
            Editorial independence
          </p>
          <h2 class="text-h2 font-bold text-neutral-900 mb-4 [text-wrap:balance]">
            Our independence rules
          </h2>
          <p class="text-body-lg text-neutral-700 leading-relaxed max-w-3xl [text-wrap:pretty]">
            Independence is not a tagline. It's a set of rules we enforce so partners cannot influence what users see.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 mb-10">
          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-body-sm font-bold">
                1
              </div>
              <h3 class="text-body-lg font-bold text-neutral-900">
                No pay-to-rank
              </h3>
            </div>
            <p class="text-body-sm text-neutral-600 leading-relaxed [text-wrap:pretty]">
              Providers cannot pay to appear higher, improve a Remit-Score, or change how we sort results. Rankings are based on comparison data, not commercial relationships.
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-body-sm font-bold">
                2
              </div>
              <h3 class="text-body-lg font-bold text-neutral-900">
                Consistent scoring
              </h3>
            </div>
            <p class="text-body-sm text-neutral-600 leading-relaxed [text-wrap:pretty]">
              Every provider's Remit-Score is calculated using the same methodology: delivered amount, total cost, reliability, speed, and trust signals. No exceptions.
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-body-sm font-bold">
                3
              </div>
              <h3 class="text-body-lg font-bold text-neutral-900">
                Commercial separation
              </h3>
            </div>
            <p class="text-body-sm text-neutral-600 leading-relaxed [text-wrap:pretty]">
              Affiliate relationships do not change score calculations. If a provider offers the best deal for a corridor, they rank highly, even if we earn nothing from them.
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-body-sm font-bold">
                4
              </div>
              <h3 class="text-body-lg font-bold text-neutral-900">
                Clear labeling
              </h3>
            </div>
            <p class="text-body-sm text-neutral-600 leading-relaxed [text-wrap:pretty]">
              Where commercial relationships exist, we label them clearly. Disclosures appear near affiliate links, and sponsorships are marked as sponsored.
            </p>
          </div>
        </div>

        <div class="text-center">
          <NuxtLink
            to="/methodology"
            class="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-surface px-6 py-3 text-body-sm font-semibold text-neutral-900 hover:bg-neutral-50 motion-safe:transition-colors"
          >
            Read the full methodology
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Data Sourcing & Accuracy -->
    <section class="py-16 lg:py-20 bg-brand-600">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-h2 font-bold text-white mb-4">
            Data sourcing & accuracy
          </h2>
          <p class="text-body-lg leading-relaxed text-white/90 mb-3 [text-wrap:pretty]">
            We collect pricing data through direct provider feeds (most consistent when available), partner feeds, or live quote requests. Everything is normalized into one comparable number: what the recipient should receive after all fees and FX markup.
          </p>
          <p class="text-body text-white/70 leading-relaxed mb-8 [text-wrap:pretty]">
            Refresh cadence varies by corridor and payment method. Timestamps on every quote show when data was last collected.
          </p>

          <div class="rounded-2xl border border-white/20 bg-white/10 p-6">
            <p class="text-body font-semibold text-white mb-4">
              Important notes
            </p>
            <ul class="space-y-3 text-body-sm text-white/80">
              <li class="flex items-start gap-3">
                <span class="text-white/40 font-bold mt-0.5">•</span>
                <span><strong class="font-semibold text-white">Quotes can change at checkout.</strong> The final amount depends on payment method, promotional discounts, KYC verification, and provider-specific rules. Always verify the final amount on the provider's site before completing a transfer.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-white/40 font-bold mt-0.5">•</span>
                <span><strong class="font-semibold text-white">We fix errors quickly.</strong> If you notice incorrect pricing, fees, or availability, use our corrections form. We investigate and resolve confirmed issues within 48 hours.</span>
              </li>
            </ul>
            <div class="mt-6 flex flex-wrap gap-3">
              <NuxtLink
                to="/contact"
                class="inline-flex items-center justify-center rounded-xl bg-surface px-5 py-2.5 text-body-sm font-semibold text-brand-600 motion-safe:transition-colors hover:bg-neutral-50"
              >
                Report a problem
              </NuxtLink>
              <NuxtLink
                to="/corrections"
                class="inline-flex items-center justify-center rounded-xl border border-white/30 bg-transparent px-5 py-2.5 text-body-sm font-semibold text-white motion-safe:transition-colors hover:bg-white/10"
              >
                Corrections policy
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 lg:py-20 bg-surface">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-3xl">
          <div class="text-center mb-10">
            <h2 class="text-h2 font-bold text-neutral-900 mb-3">
              Frequently asked questions
            </h2>
            <p class="text-body-lg text-neutral-600">
              Quick answers about partnerships, independence, and how we work
            </p>
          </div>

          <FaqAccordion :faqs="partnershipFaqs" />

          <div class="mt-8 text-center">
            <NuxtLink
              to="/faq"
              class="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-surface px-6 py-3 text-body-sm font-semibold text-neutral-900 hover:bg-neutral-50 motion-safe:transition-colors"
            >
              View all FAQs
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="py-16 sm:py-20 bg-brand-600">
      <div class="mx-auto max-w-3xl px-page-x text-center">
        <h2 class="text-h1 font-bold text-white mb-4 [text-wrap:balance]">
          Ready to get listed?
        </h2>
        <p class="text-h4 text-white/80 mb-10 leading-relaxed [text-wrap:balance]">
          No upfront costs. No pay-to-rank. Just fair comparison that helps users find the best option — and helps you reach new customers when your pricing is competitive.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4">
          <NuxtLink
            to="/contact?type=partnership"
            class="inline-flex items-center gap-2 px-8 py-4 bg-surface text-brand-600 font-bold text-body rounded-xl hover:bg-neutral-50 motion-safe:transition-colors"
          >
            Get in touch
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
          <NuxtLink
            to="/methodology"
            class="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 bg-transparent text-white font-bold text-body rounded-xl hover:bg-white/10 motion-safe:transition-colors"
          >
            Read our methodology
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
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
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://remit-scout.com'
const canonicalUrl = `${siteUrl}/partnerships`

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Partnerships',
    description: 'Work with Remit-Scout. Transparent comparison, market data, and enterprise data access.',
  },
})

setSeo({
  title: 'Partnerships & Integrations | Remit-Scout',
  description: 'Work with Remit-Scout — an independent remittance comparison and market data platform built for transparency, with no pay-to-rank.',
  canonical: canonicalUrl,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Partnerships', url: canonicalUrl },
])

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Remit-Scout',
        'url': siteUrl,
        'logo': `${siteUrl}/logos/remit-scout.svg`,
        'contactPoint': [
          {
            '@type': 'ContactPoint',
            'contactType': 'partnerships',
            'url': `${siteUrl}/contact`,
          },
        ],
      }),
    },
  ],
})

const partnershipFaqs = [
  {
    question: 'Can providers pay to rank higher on Remit-Scout?',
    answer: 'No. Providers cannot pay to change ranking order, Remit-Score, or sorting logic. Rankings are determined by comparison data — recipient gets, total cost, speed, and trust signals — and our consistent methodology.',
  },
  {
    question: 'How do affiliate partnerships work? Do I have to pay to be listed?',
    answer: '<p><strong>No upfront costs.</strong> There\'s no fee to be listed on Remit-Scout. If you share pricing documentation or allow quote capture from public pages, we\'ll list you for free.</p><p class="mt-3">Affiliate partnerships are optional. If we have an affiliate relationship, we only earn a commission when a user clicks through and completes a transfer with you. If you don\'t want an affiliate relationship, we\'ll still list you — you just won\'t pay any commissions. Either way, your ranking is determined by pricing and service quality.</p>',
  },
  {
    question: 'What\'s the benefit to me if I don\'t want an affiliate relationship?',
    answer: '<p>Even without an affiliate relationship, you still benefit from: free exposure in comparison results, fair ranking driven by your pricing, brand visibility with high-intent users, and new customer acquisition when users click through to complete a transfer on your site. Many providers start without affiliate relationships and add them later if the traffic volume justifies it.</p>',
  },
  {
    question: 'Can I improve my ranking by paying more or having a stronger affiliate relationship?',
    answer: '<p><strong>No.</strong> Our ranking algorithm is completely independent of commercial relationships. Rankings are determined solely by comparison data: what recipients receive after fees and FX markup, total cost, transfer speed, and trust signals. If you want to improve your ranking, improve your pricing and service quality — that\'s the only lever.</p>',
  },
  {
    question: 'What if my pricing changes or I notice an error in how I\'m listed?',
    answer: '<p><strong>We fix errors quickly.</strong> If you notice incorrect pricing, fees, or service details, contact your partnership contact or use our corrections form. We investigate and resolve confirmed issues within 48 hours.</p><p class="mt-3">For pricing changes: if we have direct data feeds, updates are automatic. If we collect quotes manually, just notify us and we\'ll update our system.</p>',
  },
  {
    question: 'How long does onboarding take? What\'s the process?',
    answer: '<p>Most providers can be listed within <strong>1–2 weeks</strong> of initial contact. The typical process: initial contact and documentation sharing, integration into our comparison system (3–5 business days), testing and accuracy verification, then go-live. If you can provide structured data or a feed, the process is faster.</p>',
  },
]

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Partnerships', path: '/partnerships' },
]
</script>

<style scoped>
@keyframes scroll-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-scroll-left {
  animation: scroll-left 50s linear infinite;
  width: fit-content;
}

.animate-scroll-left:hover {
  animation-play-state: paused;
}
</style>
