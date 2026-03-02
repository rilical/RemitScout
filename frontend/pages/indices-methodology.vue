<template>
  <div class="min-h-screen bg-surface">
    <CompareWidget />

      <!-- Hero -->
      <section class="relative bg-neutral-900 py-16 lg:py-24">
        <div class="relative z-10 mx-auto max-w-page px-page-x">
          <Breadcrumbs
            :items="breadcrumbItems"
            dark
          />

          <div class="mt-10 max-w-4xl">
            <h1 class="text-h1 font-bold leading-tight text-white">
              Indices Methodology
            </h1>
            <p class="mt-5 text-body-lg leading-relaxed text-neutral-300 max-w-3xl">
              A high-level overview of what TEER, RCI, and RVI measure and how to interpret them across corridors.
            </p>
            <div class="mt-6 max-w-3xl rounded-2xl border border-white/15 bg-white/5 p-5">
              <p class="text-body-sm text-neutral-200 leading-relaxed">
                Full mathematical specifications (formulas, parameters, weighting, and blending logic) are proprietary and available to institutional clients under NDA.
                <NuxtLink
                  to="/contact"
                  class="ml-1 font-semibold text-white underline decoration-white/30 hover:decoration-white/60"
                >Contact sales</NuxtLink>.
              </p>
            </div>
            <p class="mt-4 text-body-sm text-neutral-400">
              Last updated:
              <time :datetime="lastUpdatedIso">{{ lastUpdatedLabel }}</time>
            </p>
          </div>
        </div>
      </section>

    <!-- Synthetic Weighting -->
    <section
      id="weighting"
      class="py-16 lg:py-20 bg-surface scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
          <div class="max-w-4xl mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-4">
              Synthetic Volume Weighting
            </h2>
            <p class="text-body-lg text-neutral-600 leading-relaxed">
              We don't see provider transaction volume directly. Instead, we infer relative provider importance
              from observable quote-quality and availability signals. Those proprietary signals are used to create synthetic weights for aggregation.
            </p>
          </div>

          <div class="grid gap-8 lg:grid-cols-2">
            <div class="rounded-2xl border border-neutral-200 bg-surface p-6">
              <h3 class="text-body-lg font-semibold text-neutral-900 mb-4">
                What synthetic weighting does
              </h3>
              <ul class="space-y-3 text-body-sm text-neutral-700 leading-relaxed">
                <li>Approximates relative provider importance when true transaction volume is not observable.</li>
                <li>Uses proprietary signals derived from quoting behavior and quote quality to avoid easy gaming.</li>
                <li>Produces normalized weights that are applied consistently when aggregating corridor-level indices.</li>
              </ul>
            </div>

            <div class="rounded-2xl border border-neutral-200 bg-neutral-900 p-6 text-white">
              <h3 class="text-body-lg font-semibold text-white mb-4">
                What we publish (and what we don't)
              </h3>
              <ul class="space-y-3 text-body-sm text-neutral-300 leading-relaxed">
                <li>We publish index values plus a confidence score (0-1) and suppression behavior when coverage is insufficient.</li>
                <li>We do not publish the underlying formulas or weighting parameters on this public page.</li>
              </ul>
              <div class="mt-6 flex flex-wrap gap-3">
                <NuxtLink
                  to="/contact"
                  class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-body-sm font-bold text-white hover:bg-brand-700 motion-safe:transition-colors"
                >
                  Request full methodology (NDA)
                </NuxtLink>
                <NuxtLink
                  to="/methodology"
                  class="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-body-sm font-bold text-white hover:bg-white/10 motion-safe:transition-colors"
                >
                  General methodology
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </section>

    <!-- TEER -->
    <section
      id="teer"
      class="py-16 lg:py-20 bg-brand-600 scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="grid gap-10 lg:grid-cols-[1.2fr,0.8fr] items-start">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-body-sm font-semibold text-white mb-6">
              Index 01
            </div>
            <h2 class="text-h2 font-bold text-white mb-4">
              TEER &mdash; Total Effective Exchange Rate
            </h2>
              <p class="text-body-lg text-white/80 leading-relaxed mb-8">
                TEER represents the net rate recipients effectively receive after fees and FX markup.
                It is calculated from the weighted cost ratio and the mid-market reference rate.
              </p>
              <div class="rounded-2xl bg-neutral-900 border border-white/10 p-6 text-white">
                <h3 class="text-body-lg font-semibold text-white mb-3">
                  Definition (overview)
                </h3>
                <p class="text-body-sm text-neutral-300 leading-relaxed">
                  TEER is an effective exchange rate that reflects the all-in outcome after fees and FX costs, benchmarked against a mid-market reference rate.
                  We aggregate eligible provider quotes using proprietary synthetic volume weights to publish a corridor-level rate.
                </p>
                <div class="mt-5 grid gap-4 sm:grid-cols-2">
                  <div class="rounded-xl bg-white/5 p-4">
                    <p class="text-body-sm font-semibold text-white">Inputs</p>
                    <p class="mt-1 text-body-sm text-neutral-300">
                      Eligible provider quotes (fees and quoted FX rate), rights-matrix eligibility filters, and the mid-market reference.
                    </p>
                  </div>
                  <div class="rounded-xl bg-white/5 p-4">
                    <p class="text-body-sm font-semibold text-white">Output</p>
                    <p class="mt-1 text-body-sm text-neutral-300">
                      A corridor-level effective exchange rate, plus confidence and suppression metadata for auditability.
                    </p>
                  </div>
                </div>
                <p class="mt-5 text-body-sm text-white/70">
                  Full mathematical specifications are available to institutional clients under NDA.
                </p>
              </div>
            </div>

          <div class="rounded-2xl bg-white/10 border border-white/20 p-6 lg:mt-16">
            <h3 class="text-body-lg font-semibold text-white mb-4">
              Interpretation
            </h3>
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-white" />
                <p class="text-body-sm text-white/90"><strong class="text-white">Higher TEER</strong> means a better effective rate for the recipient.</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-white" />
                <p class="text-body-sm text-white/90"><strong class="text-white">Lower TEER</strong> signals higher friction in the corridor.</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-white" />
                <p class="text-body-sm text-white/90">Promotional rates are excluded to avoid teaser-rate distortion.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- RCI -->
    <section
      id="rci"
      class="py-16 lg:py-20 bg-surface scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="grid gap-10 lg:grid-cols-[1.2fr,0.8fr] items-start">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-body-sm font-semibold text-brand-600 mb-6">
              Index 02
            </div>
            <h2 class="text-h2 font-bold text-neutral-900 mb-4">
              RCI &mdash; Remittance Cost Index
            </h2>
              <p class="text-body-lg text-neutral-600 leading-relaxed mb-8">
                RCI is the weighted total cost of sending money as a percent of the send amount.
                It captures both explicit fees and hidden FX markup.
              </p>
              <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
                <h3 class="text-body-lg font-semibold text-neutral-900 mb-3">
                  Definition (overview)
                </h3>
                <p class="text-body-sm text-neutral-700 leading-relaxed">
                  RCI represents total corridor cost as a share of the send amount, combining explicit fees and implied FX costs.
                  We compute a corridor-level value by aggregating eligible provider quotes using proprietary synthetic volume weights.
                </p>
                <div class="mt-5 grid gap-4 sm:grid-cols-2">
                  <div class="rounded-xl bg-white p-4 border border-neutral-200">
                    <p class="text-body-sm font-semibold text-neutral-900">Inputs</p>
                    <p class="mt-1 text-body-sm text-neutral-600">
                      Eligible provider quotes (fees and quoted FX rate) and rights-matrix eligibility filters.
                    </p>
                  </div>
                  <div class="rounded-xl bg-white p-4 border border-neutral-200">
                    <p class="text-body-sm font-semibold text-neutral-900">Output</p>
                    <p class="mt-1 text-body-sm text-neutral-600">
                      A ratio that can be expressed as a percent, plus confidence and suppression metadata.
                    </p>
                  </div>
                </div>
                <p class="mt-5 text-body-sm text-neutral-600">
                  Full mathematical specifications are available to institutional clients under NDA.
                </p>
              </div>
            </div>

          <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 lg:mt-16">
            <h3 class="text-body-lg font-semibold text-neutral-900 mb-4">
              Interpretation
            </h3>
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-brand-600" />
                <p class="text-body-sm text-neutral-700"><strong class="text-neutral-900">Higher RCI</strong> means more friction (fees + spread).</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-brand-400" />
                <p class="text-body-sm text-neutral-700"><strong class="text-neutral-900">Lower RCI</strong> means a more efficient corridor.</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-brand-200" />
                <p class="text-body-sm text-neutral-700">Reported as a ratio (0-1). API clients can express it in percent.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- RVI -->
    <section
      id="rvi"
      class="py-16 lg:py-20 bg-neutral-900 scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="grid gap-10 lg:grid-cols-[1.2fr,0.8fr] items-start">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-body-sm font-semibold text-white mb-6">
              Index 03
            </div>
            <h2 class="text-h2 font-bold text-white mb-4">
              RVI &mdash; Remittance Volatility Index
            </h2>
              <p class="text-body-lg text-neutral-300 leading-relaxed mb-8">
                RVI measures the weighted dispersion of effective rates across providers.
                We also publish RVI_bps for standardized comparison.
              </p>
              <div class="rounded-2xl bg-neutral-950 border border-white/10 p-6 text-white">
                <h3 class="text-body-lg font-semibold text-white mb-3">
                  Definition (overview)
                </h3>
                <p class="text-body-sm text-neutral-300 leading-relaxed">
                  RVI captures how widely providers disagree on effective pricing in a corridor.
                  We aggregate eligible provider quotes using proprietary synthetic volume weights and publish a dispersion value alongside a basis-points variant for standardized comparison.
                </p>
                <div class="mt-5 grid gap-4 sm:grid-cols-2">
                  <div class="rounded-xl bg-white/5 p-4">
                    <p class="text-body-sm font-semibold text-white">Inputs</p>
                    <p class="mt-1 text-body-sm text-neutral-300">
                      Eligible provider quotes (fees and quoted FX rate) and rights-matrix eligibility filters.
                    </p>
                  </div>
                  <div class="rounded-xl bg-white/5 p-4">
                    <p class="text-body-sm font-semibold text-white">Output</p>
                    <p class="mt-1 text-body-sm text-neutral-300">
                      A corridor-level dispersion metric plus a basis-points variant, with confidence and suppression metadata.
                    </p>
                  </div>
                </div>
                <p class="mt-5 text-body-sm text-white/70">
                  Full mathematical specifications are available to institutional clients under NDA.
                </p>
              </div>
            </div>

          <div class="rounded-2xl bg-white/5 border border-white/10 p-6 lg:mt-16">
            <h3 class="text-body-lg font-semibold text-white mb-4">
              Interpretation
            </h3>
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-white" />
                <p class="text-body-sm text-neutral-300"><strong class="text-white">Higher RVI</strong> means providers disagree more on pricing.</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-white" />
                <p class="text-body-sm text-neutral-300"><strong class="text-white">Lower RVI</strong> means tighter market consensus.</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-white" />
                <p class="text-body-sm text-neutral-300">RVI_bps standardizes volatility relative to TEER.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Inputs & Controls -->
    <section
      id="inputs"
      class="py-16 lg:py-20 bg-brand-50 scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="max-w-3xl mb-12">
          <h2 class="text-h2 font-bold text-neutral-900 mb-4">
            Data Inputs &amp; Controls
          </h2>
          <p class="text-body-lg text-neutral-600 leading-relaxed">
            Every index point is governed by the same filtering rules. Providers must pass the rights matrix, promotional pricing is stripped, and minimum coverage thresholds apply.
          </p>
        </div>

        <div class="grid gap-6 lg:grid-cols-3">
          <div class="rounded-2xl border border-brand-200 bg-surface p-6">
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <svg
class="w-5 h-5 text-brand-600"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
>
                <path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
/>
              </svg>
            </div>
            <h3 class="text-body-lg font-semibold text-neutral-900 mb-3">
              Rights Matrix
            </h3>
            <ul class="space-y-2 text-body-sm text-neutral-600">
              <li>Each index has its own provider allowlist</li>
              <li>Only active, licensed providers are included</li>
              <li>Promotional rates are excluded</li>
            </ul>
          </div>

          <div class="rounded-2xl border border-brand-200 bg-surface p-6">
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <svg
class="w-5 h-5 text-brand-600"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
>
                <path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
/>
              </svg>
            </div>
            <h3 class="text-body-lg font-semibold text-neutral-900 mb-3">
              Mid-Market Reference
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              We use daily mid-market rates as the benchmark, with automatic fallback to the most recent available rate when daily data is unavailable.
            </p>
          </div>

          <div class="rounded-2xl border border-brand-200 bg-surface p-6">
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <svg
class="w-5 h-5 text-brand-600"
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
              <h3 class="text-body-lg font-semibold text-neutral-900 mb-3">
                Confidence &amp; Suppression
              </h3>
              <p class="text-body-sm text-neutral-600 leading-relaxed">
                Minimum coverage thresholds apply. When coverage is insufficient, index points are suppressed. A confidence score (0-1) is published with every data point.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="py-16 sm:py-20 bg-brand-600">
        <div class="mx-auto max-w-4xl px-page-x text-center">
          <h2 class="text-h2 font-bold text-white mb-4">
            Need the indices or the full technical methodology?
          </h2>
          <p class="text-body-lg text-white/80 mb-10">
            Enterprise customers can access TEER, RCI, and RVI via API and scheduled exports. Full mathematical documentation is available under NDA.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <NuxtLink
              to="/contact"
            class="inline-flex items-center gap-3 px-8 py-4 bg-white text-brand-600 font-bold text-body-lg rounded-xl hover:bg-white/90 hover:shadow-xl motion-safe:transition-all duration-200"
          >
            Contact sales
          </NuxtLink>
          <NuxtLink
            to="/methodology"
            class="inline-flex items-center gap-3 px-8 py-4 border-2 border-white/30 text-white font-bold text-body-lg rounded-xl hover:bg-white/10 motion-safe:transition-all duration-200"
          >
            View general methodology
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
  </template>

  <script setup lang="ts">
  import { computed } from 'vue'
  import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
  import CompareWidget from '~/components/shared/CompareWidget.vue'
  import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

  const lastUpdatedIso = '2026-02-16'
  const lastUpdatedLabel = computed(() => {
    return new Date(lastUpdatedIso).toLocaleDateString('en-US', {
      day: 'numeric',
      year: 'numeric',
      month: 'long',
    })
  })

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Methodology', path: '/methodology' },
    { name: 'Indices Methodology', path: '/indices-methodology' },
  ]

  const { public: { siteUrl } } = useRuntimeConfig()

  defineOgImage({
    component: 'OgImageDefault',
    props: {
      title: 'Indices',
      description: 'What TEER, RCI, and RVI measure and how to interpret them.',
    },
  })

  setSeo({
    title: 'Indices Methodology | Remit-Scout',
    description: 'Overview of what TEER, RCI, and RVI measure, data inputs, and interpretation. Full technical methodology is available under NDA.',
    canonical: `${siteUrl}/indices-methodology`,
    ogImage: false,
    ogType: 'article',
    publishedTime: lastUpdatedIso,
  modifiedTime: lastUpdatedIso,
  author: 'Remit-Scout Research Desk',
  tags: ['indices', 'methodology', 'teer', 'rci', 'rvi'],
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Methodology', url: `${siteUrl}/methodology` },
  { name: 'Indices Methodology', url: `${siteUrl}/indices-methodology` },
])

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'Indices Methodology',
        'url': `${siteUrl}/indices-methodology`,
        'datePublished': lastUpdatedIso,
        'dateModified': lastUpdatedIso,
        'author': {
          '@type': 'Organization',
          'name': 'Remit-Scout Research Desk',
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Remit-Scout',
          'url': siteUrl,
        },
      }),
    },
  ],
})
</script>
