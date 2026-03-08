<template>
  <div class="min-h-screen bg-surface">
    <!-- Hero -->
    <section class="relative overflow-hidden bg-neutral-900 py-16 lg:py-24">
      <div class="mx-auto max-w-page px-page-x">
        <Breadcrumbs :items="breadcrumbItems" :dark="true" />

        <div class="mt-12 max-w-4xl">
          <h1
            class="text-hero mb-6 font-bold leading-tight tracking-tight text-white [text-wrap:balance]"
          >
            Partner with Remit-Scout
          </h1>

          <p class="text-h4 mb-6 font-medium leading-relaxed text-white [text-wrap:balance]">
            Reach users who compare international transfer options before they send.
          </p>

          <p
            class="text-body-lg mb-4 max-w-3xl leading-relaxed text-neutral-300 [text-wrap:pretty]"
          >
            Remit-Scout is an independent comparison platform for international money transfers.
            When users search corridors you serve, you show up in results. If they choose you, they
            click through and complete the transfer on your checkout.
          </p>

          <p class="text-body mb-8 max-w-3xl leading-relaxed text-neutral-400 [text-wrap:pretty]">
            We rank providers by what the recipient actually receives — after fees and FX markup —
            not marketing claims. Competitive pricing means a higher ranking, regardless of whether
            we have a commercial relationship.
          </p>

          <NuxtLink
            to="/contact?type=partnership"
            class="text-body inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 motion-safe:transition-colors"
          >
            Get in touch
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    <!-- Providers We Compare -->
    <section v-reveal class="bg-surface py-16 lg:py-20">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-8">
          <h2 class="text-h2 mb-4 font-bold text-neutral-900">Providers we compare</h2>
          <p
            class="text-body-lg mb-3 max-w-3xl leading-relaxed text-neutral-700 [text-wrap:pretty]"
          >
            Some of the providers in our comparison results. Some have affiliate or data
            partnerships with us; others don't. Either way, rankings follow the same rules — driven
            by pricing and performance data.
          </p>
          <p class="text-body leading-relaxed text-neutral-600">
            <strong class="font-semibold text-neutral-900">We're still growing.</strong> If you're a
            licensed provider and want accurate coverage, reach out. We onboard new providers
            continuously.
          </p>
        </div>

        <div
          class="relative -mx-page-x overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 py-12"
        >
          <div class="animate-scroll-left flex gap-8 px-6">
            <div
              v-for="(partner, index) in [...partners, ...partners, ...partners]"
              :key="`provider-${partner.slug}-${index}`"
              class="flex h-36 w-56 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-surface p-6 shadow-sm hover:shadow-md motion-safe:transition-shadow"
            >
              <ProviderLogo :slug="partner.slug" :alt="partner.name" size="default" />
            </div>
          </div>
        </div>

        <div class="mt-8 text-center">
          <p class="text-body-sm mb-4 text-neutral-600">
            Interested in joining our partner network?
          </p>
          <NuxtLink
            to="/contact?type=provider"
            class="text-body inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 motion-safe:transition-colors"
          >
            Become a partner
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    <!-- Partnership Types -->
    <section v-reveal.slide-left class="bg-neutral-50 py-16 lg:py-20">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-10">
          <p class="text-body-sm mb-3 font-semibold uppercase tracking-wide text-brand-600">
            Partnership opportunities
          </p>
          <h2 class="text-h2 mb-4 font-bold text-neutral-900 [text-wrap:balance]">
            Multiple ways to work with us
          </h2>
          <p class="text-body-lg max-w-3xl leading-relaxed text-neutral-700 [text-wrap:pretty]">
            From provider onboarding to data licensing — partnerships never buy placement. Rankings,
            scores, and comparisons stay independent.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <!-- Affiliate -->
          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
              <svg
                class="h-6 w-6 text-brand-600"
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
            <h3 class="text-h4 mb-2 font-bold text-neutral-900">Affiliate partnerships</h3>
            <p class="text-body-sm mb-4 leading-relaxed text-neutral-700 [text-wrap:pretty]">
              Get listed in our comparison results. When a user clicks through and completes a
              transfer, we may earn a commission — at no cost to the sender. No upfront fee to be
              listed.
            </p>
            <NuxtLink
              to="/contact?type=provider&topic=onboarding"
              class="text-body-sm inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
            >
              Provider onboarding
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </NuxtLink>
          </div>

          <!-- Sponsorship -->
          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
              <svg
                class="h-6 w-6 text-brand-600"
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
            <h3 class="text-h4 mb-2 font-bold text-neutral-900">Sponsorship</h3>
            <p class="text-body-sm mb-4 leading-relaxed text-neutral-700 [text-wrap:pretty]">
              Support independent remittance research and reach expats through clearly labeled
              sponsorships. All sponsorships are disclosed and never affect rankings, sorting, or
              Remit-Score.
            </p>
            <NuxtLink
              to="/contact?type=sponsorship&topic=inquiry"
              class="text-body-sm inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
            >
              Sponsorship enquiry
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </NuxtLink>
          </div>

          <!-- Data & Widgets -->
          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
              <svg
                class="h-6 w-6 text-brand-600"
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
            <h3 class="text-h4 mb-2 font-bold text-neutral-900">Data & widgets</h3>
            <p class="text-body-sm mb-4 leading-relaxed text-neutral-700 [text-wrap:pretty]">
              License comparison data, embed static market charts, or scope a managed white-label
              compare widget on your site or app. Available to publishers, fintechs, and platforms
              serving the remittance market.
            </p>
            <NuxtLink
              to="/contact?type=media&topic=publisher"
              class="text-body-sm inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
            >
              Publisher & media inquiry
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </NuxtLink>
          </div>

          <!-- Institutional (gated) -->
          <div
            v-if="enterpriseEnabled"
            class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm"
          >
            <div class="mb-4 flex items-start justify-between">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                <svg
                  class="h-6 w-6 text-brand-600"
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
              <span
                class="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-600"
                >NDA required</span
              >
            </div>
            <h3 class="text-h4 mb-2 font-bold text-neutral-900">Institutional data access</h3>
            <p class="text-body-sm mb-4 leading-relaxed text-neutral-700 [text-wrap:pretty]">
              Real-time corridor pricing, proprietary cost and volatility indices, and historical
              datasets for research teams and risk desks. Engagements proceed under NDA.
            </p>
            <NuxtLink
              to="/contact?type=enterprise&topic=data"
              class="text-body-sm inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
            >
              Request access
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </NuxtLink>
          </div>

          <!-- Fallback: non-gated institutional placeholder -->
          <div v-else class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
              <svg
                class="h-6 w-6 text-brand-600"
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
            </div>
            <h3 class="text-h4 mb-2 font-bold text-neutral-900">Institutional access</h3>
            <p class="text-body-sm mb-4 leading-relaxed text-neutral-700 [text-wrap:pretty]">
              Corridor pricing data, proprietary indices, and structured data access are available
              to qualified research teams and risk desks. Engagements proceed under NDA.
            </p>
            <NuxtLink
              to="/contact?type=enterprise&topic=data"
              class="text-body-sm inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
            >
              Get in touch
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    <!-- Provider Benefits -->
    <section v-reveal.slide-right class="bg-neutral-900 py-16 lg:py-20">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-10">
          <p class="text-body-sm mb-3 font-semibold uppercase tracking-wide text-brand-400">
            Why partner
          </p>
          <h2 class="text-h2 mb-4 font-bold text-white [text-wrap:balance]">
            What you get as a provider partner
          </h2>
          <p class="text-body-lg max-w-3xl leading-relaxed text-neutral-300 [text-wrap:pretty]">
            Partnering with Remit-Scout helps you reach users who compare providers before they send
            — and it keeps your coverage accurate as your product evolves.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div class="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/20">
              <svg
                class="h-5 w-5 text-brand-400"
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
            <h3 class="text-body-lg font-bold text-white">Qualified traffic</h3>
            <p class="text-body-sm leading-relaxed text-white/60 [text-wrap:pretty]">
              Users on Remit-Scout are actively comparing prices and payout options — not browsing.
              When they choose your service, they click through already in a decision flow.
            </p>
          </div>

          <div class="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/20">
              <svg
                class="h-5 w-5 text-brand-400"
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
            <h3 class="text-body-lg font-bold text-white">Fair, data-driven ranking</h3>
            <p class="text-body-sm leading-relaxed text-white/60 [text-wrap:pretty]">
              We rank by what recipients actually receive. If your pricing is competitive, you rank
              higher — regardless of affiliate relationships. Better rates mean better placement.
            </p>
          </div>

          <div class="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/20">
              <svg
                class="h-5 w-5 text-brand-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <h3 class="text-body-lg font-bold text-white">Brand visibility</h3>
            <p class="text-body-sm leading-relaxed text-white/60 [text-wrap:pretty]">
              Appearing in results gives you consistent exposure to high-intent users. For newer
              providers, comparison platforms are often the first point of discovery — quality
              drives visibility, not marketing spend.
            </p>
          </div>
        </div>

        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink
            to="/contact?type=provider&topic=onboarding"
            class="text-body-sm inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 motion-safe:transition-colors"
          >
            Start onboarding
          </NuxtLink>
          <NuxtLink
            to="/methodology"
            class="text-body-sm inline-flex items-center gap-2 rounded-xl border border-white/20 bg-transparent px-6 py-3 font-semibold text-white hover:bg-white/5 motion-safe:transition-colors"
          >
            How we rank providers
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- How Remit-Score Works -->
    <section v-reveal class="bg-surface py-16 lg:py-20">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-5xl">
          <div class="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p class="text-body-sm mb-3 font-semibold uppercase tracking-wide text-brand-600">
                How rankings work
              </p>
              <h2 class="text-h2 mb-4 font-bold text-neutral-900 [text-wrap:balance]">
                Remit-Score: the number behind every ranking
              </h2>
              <p class="text-body-lg mb-4 leading-relaxed text-neutral-700 [text-wrap:pretty]">
                Every provider on Remit-Scout receives a
                <strong class="font-semibold text-neutral-900">Remit-Score</strong> — a composite
                0–10 rating computed from live quote data. The score answers one question: how much
                value does this provider actually deliver to the recipient?
              </p>
              <p class="text-body mb-6 leading-relaxed text-neutral-600 [text-wrap:pretty]">
                Remit-Score is not a review. It is not an opinion. It is a quantitative calculation
                — providers cannot pay to improve it. If your pricing is competitive, your score
                reflects that.
              </p>
              <NuxtLink
                to="/methodology#how-we-rate"
                class="text-body-sm inline-flex items-center gap-2 font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
              >
                See full scoring methodology
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </NuxtLink>
            </div>

            <div class="flex items-center justify-center py-8">
              <div class="relative">
                <div
                  class="flex h-48 w-48 items-center justify-center rounded-full border-4 border-brand-600 bg-surface shadow-xl lg:h-56 lg:w-56"
                >
                  <div class="text-center">
                    <div class="text-hero mb-1 font-bold text-brand-600">9.5</div>
                    <div class="text-body-sm font-semibold text-neutral-600">Remit-Score</div>
                  </div>
                </div>
                <div
                  class="absolute -right-3 -top-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-brand-400 bg-surface shadow-lg lg:h-24 lg:w-24"
                >
                  <div class="text-center">
                    <div class="text-h3 font-bold text-brand-500">8.4</div>
                  </div>
                </div>
                <div
                  class="absolute -bottom-3 -left-3 flex h-16 w-16 items-center justify-center rounded-full border-4 border-neutral-300 bg-surface shadow-lg lg:h-20 lg:w-20"
                >
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
    <section v-reveal.slide-left class="bg-neutral-50 py-16 lg:py-20">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-10">
          <p class="text-body-sm mb-3 font-semibold uppercase tracking-wide text-brand-600">
            Editorial independence
          </p>
          <h2 class="text-h2 mb-4 font-bold text-neutral-900 [text-wrap:balance]">
            Our independence rules
          </h2>
          <p class="text-body-lg max-w-3xl leading-relaxed text-neutral-700 [text-wrap:pretty]">
            Independence is not a tagline. It's a set of rules we enforce so partners cannot
            influence what users see.
          </p>
        </div>

        <div class="mb-10 grid gap-6 md:grid-cols-2">
          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="mb-4 flex items-center gap-3">
              <div
                class="text-body-sm flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white"
              >
                1
              </div>
              <h3 class="text-body-lg font-bold text-neutral-900">No pay-to-rank</h3>
            </div>
            <p class="text-body-sm leading-relaxed text-neutral-600 [text-wrap:pretty]">
              Providers cannot pay to appear higher, improve a Remit-Score, or change how we sort
              results. Rankings are based on comparison data, not commercial relationships.
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="mb-4 flex items-center gap-3">
              <div
                class="text-body-sm flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white"
              >
                2
              </div>
              <h3 class="text-body-lg font-bold text-neutral-900">Consistent scoring</h3>
            </div>
            <p class="text-body-sm leading-relaxed text-neutral-600 [text-wrap:pretty]">
              Every provider's Remit-Score is calculated using the same methodology: delivered
              amount, total cost, reliability, speed, and trust signals. No exceptions.
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="mb-4 flex items-center gap-3">
              <div
                class="text-body-sm flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white"
              >
                3
              </div>
              <h3 class="text-body-lg font-bold text-neutral-900">Commercial separation</h3>
            </div>
            <p class="text-body-sm leading-relaxed text-neutral-600 [text-wrap:pretty]">
              Affiliate relationships do not change score calculations. If a provider offers the
              best deal for a corridor, they rank highly, even if we earn nothing from them.
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
            <div class="mb-4 flex items-center gap-3">
              <div
                class="text-body-sm flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white"
              >
                4
              </div>
              <h3 class="text-body-lg font-bold text-neutral-900">Clear labeling</h3>
            </div>
            <p class="text-body-sm leading-relaxed text-neutral-600 [text-wrap:pretty]">
              Where commercial relationships exist, we label them clearly. Disclosures appear near
              affiliate links, and sponsorships are marked as sponsored.
            </p>
          </div>
        </div>

        <div class="text-center">
          <NuxtLink
            to="/methodology"
            class="text-body-sm inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-surface px-6 py-3 font-semibold text-neutral-900 hover:bg-neutral-50 motion-safe:transition-colors"
          >
            Read the full methodology
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    <!-- Data Sourcing & Accuracy -->
    <section v-reveal class="bg-brand-600 py-16 lg:py-20">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-h2 mb-4 font-bold text-white">Data sourcing & accuracy</h2>
          <p class="text-body-lg mb-3 leading-relaxed text-white/90 [text-wrap:pretty]">
            We collect pricing data through direct provider feeds (most consistent when available),
            partner feeds, or live quote requests. Everything is normalized into one comparable
            number: what the recipient should receive after all fees and FX markup.
          </p>
          <p class="text-body mb-8 leading-relaxed text-white/70 [text-wrap:pretty]">
            Refresh cadence varies by corridor and payment method. Timestamps on every quote show
            when data was last collected.
          </p>

          <div class="rounded-2xl border border-white/20 bg-white/10 p-6">
            <p class="text-body mb-4 font-semibold text-white">Important notes</p>
            <ul class="text-body-sm space-y-3 text-white/80">
              <li class="flex items-start gap-3">
                <span class="mt-0.5 font-bold text-white/40">•</span>
                <span
                  ><strong class="font-semibold text-white">Quotes can change at checkout.</strong>
                  The final amount depends on payment method, promotional discounts, KYC
                  verification, and provider-specific rules. Always verify the final amount on the
                  provider's site before completing a transfer.</span
                >
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 font-bold text-white/40">•</span>
                <span
                  ><strong class="font-semibold text-white">We fix errors quickly.</strong> If you
                  notice incorrect pricing, fees, or availability, use our corrections form. We
                  investigate and resolve confirmed issues within 48 hours.</span
                >
              </li>
            </ul>
            <div class="mt-6 flex flex-wrap gap-3">
              <NuxtLink
                to="/contact"
                class="text-body-sm inline-flex items-center justify-center rounded-xl bg-surface px-5 py-2.5 font-semibold text-brand-600 hover:bg-neutral-50 motion-safe:transition-colors"
              >
                Report a problem
              </NuxtLink>
              <NuxtLink
                to="/corrections"
                class="text-body-sm inline-flex items-center justify-center rounded-xl border border-white/30 bg-transparent px-5 py-2.5 font-semibold text-white hover:bg-white/10 motion-safe:transition-colors"
              >
                Corrections policy
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section v-reveal class="bg-surface py-16 lg:py-20">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-3xl">
          <div class="mb-10 text-center">
            <h2 class="text-h2 mb-3 font-bold text-neutral-900">Frequently asked questions</h2>
            <p class="text-body-lg text-neutral-600">
              Quick answers about partnerships, independence, and how we work
            </p>
          </div>

          <FaqAccordion :faqs="partnershipFaqs" />

          <div class="mt-8 text-center">
            <NuxtLink
              to="/faq"
              class="text-body-sm inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-surface px-6 py-3 font-semibold text-neutral-900 hover:bg-neutral-50 motion-safe:transition-colors"
            >
              View all FAQs
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section v-reveal.scale-in class="bg-brand-600 py-16 sm:py-20">
      <div class="mx-auto max-w-3xl px-page-x text-center">
        <h2 class="text-h1 mb-4 font-bold text-white [text-wrap:balance]">Ready to get listed?</h2>
        <p class="text-h4 mb-10 leading-relaxed text-white/80 [text-wrap:balance]">
          No upfront costs. No pay-to-rank. Just fair comparison that helps users find the best
          option — and helps you reach new customers when your pricing is competitive.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4">
          <NuxtLink
            to="/contact?type=partnership"
            class="text-body inline-flex items-center gap-2 rounded-xl bg-surface px-8 py-4 font-bold text-brand-600 hover:bg-neutral-50 motion-safe:transition-colors"
          >
            Get in touch
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            class="text-body inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-transparent px-8 py-4 font-bold text-white hover:bg-white/10 motion-safe:transition-colors"
          >
            Read our methodology
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue';
import FaqAccordion from '~/components/shared/FaqAccordion.vue';
import ProviderLogo from '~/components/shared/ProviderLogo.vue';
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo';
import { useFeatureFlags } from '~/composables/useFeatureFlags';

const { enterpriseEnabled } = useFeatureFlags();

const partners = ref([
  { name: 'Wise', slug: 'wise' },
  { name: 'Remitly', slug: 'remitly' },
  { name: 'WorldRemit', slug: 'worldremit' },
  { name: 'Western Union', slug: 'western-union' },
  { name: 'SendWave', slug: 'sendwave' },
  { name: 'XE Money', slug: 'xe-money' },
]);

const runtimeConfig = useRuntimeConfig();
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://remit-scout.com';
const canonicalUrl = `${siteUrl}/partnerships`;

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Partnerships',
    description:
      'Work with Remit-Scout. Transparent comparison, market data, and enterprise data access.',
  },
});

setSeo({
  title: 'Partnerships & Integrations | Remit-Scout',
  description:
    'Work with Remit-Scout — an independent remittance comparison and market data platform built for transparency, with no pay-to-rank.',
  canonical: canonicalUrl,
  ogImage: false,
});

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Partnerships', url: canonicalUrl },
]);

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Remit-Scout',
        url: siteUrl,
        logo: `${siteUrl}/logos/remit-scout.svg`,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'partnerships',
            url: `${siteUrl}/contact`,
          },
        ],
      }),
    },
  ],
});

const partnershipFaqs = [
  {
    question: 'Can providers pay to rank higher on Remit-Scout?',
    answer:
      'No. Providers cannot pay to change ranking order, Remit-Score, or sorting logic. Rankings are determined by comparison data — recipient gets, total cost, speed, and trust signals — and our consistent methodology.',
  },
  {
    question: 'How do affiliate partnerships work? Do I have to pay to be listed?',
    answer:
      "<p><strong>No upfront costs.</strong> There's no fee to be listed on Remit-Scout. If you share pricing documentation or allow quote capture from public pages, we'll list you for free.</p><p class=\"mt-3\">Affiliate partnerships are optional. If we have an affiliate relationship, we only earn a commission when a user clicks through and completes a transfer with you. If you don't want an affiliate relationship, we'll still list you — you just won't pay any commissions. Either way, your ranking is determined by pricing and service quality.</p>",
  },
  {
    question: "What's the benefit to me if I don't want an affiliate relationship?",
    answer:
      '<p>Even without an affiliate relationship, you still benefit from: free exposure in comparison results, fair ranking driven by your pricing, brand visibility with high-intent users, and new customer acquisition when users click through to complete a transfer on your site. Many providers start without affiliate relationships and add them later if the traffic volume justifies it.</p>',
  },
  {
    question:
      'Can I improve my ranking by paying more or having a stronger affiliate relationship?',
    answer:
      "<p><strong>No.</strong> Our ranking algorithm is completely independent of commercial relationships. Rankings are determined solely by comparison data: what recipients receive after fees and FX markup, total cost, transfer speed, and trust signals. If you want to improve your ranking, improve your pricing and service quality — that's the only lever.</p>",
  },
  {
    question: "What if my pricing changes or I notice an error in how I'm listed?",
    answer:
      '<p><strong>We fix errors quickly.</strong> If you notice incorrect pricing, fees, or service details, contact your partnership contact or use our corrections form. We investigate and resolve confirmed issues within 48 hours.</p><p class="mt-3">For pricing changes: if we have direct data feeds, updates are automatic. If we collect quotes manually, just notify us and we\'ll update our system.</p>',
  },
  {
    question: "How long does onboarding take? What's the process?",
    answer:
      '<p>Most providers can be listed within <strong>1–2 weeks</strong> of initial contact. The typical process: initial contact and documentation sharing, integration into our comparison system (3–5 business days), testing and accuracy verification, then go-live. If you can provide structured data or a feed, the process is faster.</p>',
  },
];

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Partnerships', path: '/partnerships' },
];
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
