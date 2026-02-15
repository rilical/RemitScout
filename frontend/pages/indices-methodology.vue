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
            A transparent, auditable description of how TEER, RCI, and RVI are calculated.
            These indices are <strong class="text-white">synthetic volume-weighted</strong> using
            quote frequency, spread stability, and recency.
          </p>
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
            We don't see provider transaction volume directly. Instead, we infer relative dominance
            from observable signals: how often a provider quotes, how stable their spread is, and how recently they've been active.
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-2">
          <!-- Formula panel -->
          <div class="space-y-6">
            <div class="rounded-2xl border border-neutral-200 bg-neutral-900 p-6 overflow-x-auto text-white">
              <p class="text-body-sm font-mono uppercase tracking-wide text-neutral-400 mb-4">Raw weight</p>
              <AsyncErrorBoundary skeleton-height="120">
                <LaTeXFormula
                  :formula="formulaWeightingRaw"
                  display
                />
              </AsyncErrorBoundary>
              <p class="mt-4 text-body-sm text-neutral-400">
                <code class="text-white/80">F</code> = quote frequency,
                <code class="text-white/80">S</code> = spread stability,
                <code class="text-white/80">R</code> = recency,
                <code class="text-white/80">m_tier</code> = persistence multiplier.
              </p>
            </div>

            <div class="rounded-2xl border border-neutral-200 bg-neutral-900 p-6 overflow-x-auto text-white">
              <p class="text-body-sm font-mono uppercase tracking-wide text-neutral-400 mb-4">Blended weight</p>
              <AsyncErrorBoundary skeleton-height="120">
                <LaTeXFormula
                  :formula="formulaWeightingBlend"
                  display
                />
              </AsyncErrorBoundary>
              <p class="mt-4 text-body-sm text-neutral-400">
                <code class="text-white/80">d</code> = window days,
                <code class="text-white/80">n</code> = quote count,
                <code class="text-white/80">n_min</code> = minimum quotes for full confidence.
              </p>
            </div>
          </div>

          <!-- Parameters & persistence -->
          <div class="space-y-6">
            <div class="rounded-2xl border border-neutral-200 bg-surface p-6">
              <h3 class="text-body-lg font-semibold text-neutral-900 mb-4">
                Default parameters
              </h3>
              <div class="grid grid-cols-2 gap-3">
                <div
                  v-for="param in weightParams"
                  :key="param.label"
                  class="rounded-xl bg-neutral-50 p-3"
                >
                  <p class="text-body-sm text-neutral-500">{{ param.label }}</p>
                  <p class="text-body font-mono font-semibold text-neutral-900">{{ param.value }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-neutral-200 bg-surface p-6">
              <h3 class="text-body-lg font-semibold text-neutral-900 mb-4">
                Persistence bands
              </h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between rounded-xl bg-brand-50 p-3">
                  <span class="text-body-sm font-semibold text-neutral-900">High persistence</span>
                  <span class="font-mono text-body-sm text-brand-600">&ge; 0.9 &rarr; 1.5&times;</span>
                </div>
                <div class="flex items-center justify-between rounded-xl bg-neutral-50 p-3">
                  <span class="text-body-sm font-semibold text-neutral-900">Medium persistence</span>
                  <span class="font-mono text-body-sm text-neutral-600">&ge; 0.6 &rarr; 1.0&times;</span>
                </div>
                <div class="flex items-center justify-between rounded-xl bg-neutral-50 p-3">
                  <span class="text-body-sm font-semibold text-neutral-900">Low persistence</span>
                  <span class="font-mono text-body-sm text-neutral-600">&lt; 0.6 &rarr; 0.5&times;</span>
                </div>
              </div>
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
            <div class="rounded-2xl bg-neutral-900 p-6 overflow-x-auto text-white">
              <AsyncErrorBoundary skeleton-height="120">
                <LaTeXFormula
                  :formula="formulaTeer"
                  display
                />
              </AsyncErrorBoundary>
              <p class="mt-4 text-body-sm text-neutral-400">
                <code class="text-white/80">S</code> = send amount,
                <code class="text-white/80">f</code> = fee,
                <code class="text-white/80">m</code> = hidden markup,
                <code class="text-white/80">r_mid</code> = mid-market reference rate.
              </p>
            </div>
            <p class="mt-4 text-body-sm text-white/60">
              Only includes providers approved for TEER calculation.
            </p>
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
            <div class="rounded-2xl bg-neutral-900 p-6 overflow-x-auto text-white">
              <AsyncErrorBoundary skeleton-height="120">
                <LaTeXFormula
                  :formula="formulaRci"
                  display
                />
              </AsyncErrorBoundary>
              <p class="mt-4 text-body-sm text-neutral-400">
                <code class="text-white/80">w_i</code> = synthetic volume weights (normalized),
                <code class="text-white/80">S, f, m</code> as defined above.
              </p>
            </div>
            <p class="mt-4 text-body-sm text-neutral-500">
              Only includes providers approved for RCI calculation.
            </p>
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
            <div class="rounded-2xl bg-neutral-950 border border-white/10 p-6 overflow-x-auto text-white">
              <AsyncErrorBoundary skeleton-height="120">
                <LaTeXFormula
                  :formula="formulaRvi"
                  display
                />
              </AsyncErrorBoundary>
              <p class="mt-4 text-body-sm text-neutral-400">
                <code class="text-white/80">Var_w</code> = weighted variance across providers using the same synthetic weights.
              </p>
            </div>
            <p class="mt-4 text-body-sm text-neutral-500">
              Only includes providers approved for RVI calculation.
            </p>
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
              <svg class="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
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
              <svg class="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 class="text-body-lg font-semibold text-neutral-900 mb-3">
              Mid-Market Reference
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              Sourced from OANDA. We use daily mid-market rates as the benchmark, with automatic fallback to the most recent available rate when daily data is unavailable.
            </p>
          </div>

          <div class="rounded-2xl border border-brand-200 bg-surface p-6">
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <svg class="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-body-lg font-semibold text-neutral-900 mb-3">
              Confidence &amp; Suppression
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              Minimum 3 providers required per corridor. Below that threshold, index points are suppressed. A confidence score (0-1) is published with every data point.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 sm:py-20 bg-brand-600">
      <div class="mx-auto max-w-4xl px-page-x text-center">
        <h2 class="text-h2 font-bold text-white mb-4">
          Need the indices directly?
        </h2>
        <p class="text-body-lg text-white/80 mb-10">
          Enterprise customers can access TEER, RCI, and RVI via API and scheduled exports.
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
import { computed, defineAsyncComponent } from 'vue'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import AsyncErrorBoundary from '~/components/shared/AsyncErrorBoundary.vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

const LaTeXFormula = defineAsyncComponent(() => import('~/components/shared/LaTeXFormula.vue'))

const lastUpdatedIso = '2026-02-04'
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

const weightParams = [
  { label: '\u03B1 (frequency)', value: '0.4' },
  { label: '\u03B2 (stability)', value: '0.4' },
  { label: '\u03B3 (recency)', value: '0.2' },
  { label: 'Half-life', value: '180 min' },
  { label: 'Min days', value: '3' },
  { label: 'Min providers', value: '3' },
  { label: 'Min quotes', value: '500' },
  { label: 'Confidence', value: '0\u20131' },
]

const formulaWeightingRaw = String.raw`\begin{aligned}
w_{\text{raw}} &= \ln(1 + F)^{\alpha}\, S^{\beta}\, R^{\gamma}\, m_{\text{tier}} \\
F &= \text{quotes/hour} \\
S &= \exp\!\left(-\tfrac{1}{2} z^2\right),\quad z = \frac{\bar{r} - \tilde{r}}{\sigma_r} \\
R &= \exp(-\lambda \, t_{\text{age}}),\quad t_{\text{age}}=\text{age (minutes)}
\end{aligned}`

const formulaWeightingBlend = String.raw`\begin{aligned}
w_{\text{corr}} &= \frac{w_{\text{raw}}}{\sum_j w_{\text{raw},j}} \\
\text{conf} &= \min\!\left(1, \frac{d}{30}\right)\cdot \min\!\left(1, \frac{n}{n_{\min}}\right) \\
w_{\text{final}} &= \text{conf}\cdot w_{\text{corr}} + (1 - \text{conf})\cdot w_{\text{global}}
\end{aligned}`

const formulaTeer = String.raw`\begin{aligned}
\text{RCI}_{\text{cost}} &= \frac{f + m}{S} \\
m &= \frac{(S - f)\,(r_{\text{mid}} - r_{\text{provider}})}{r_{\text{mid}}} \\
\text{TEER} &= r_{\text{mid}}\cdot\left(1 - \text{RCI}_{\text{cost}}^{(w)}\right)
\end{aligned}`

const formulaRci = String.raw`\begin{aligned}
\text{RCI} &= \frac{\sum_i w_i\cdot \text{cost\_ratio}_i}{\sum_i w_i} \\
\text{cost\_ratio} &= \frac{f + m}{S}
\end{aligned}`

const formulaRvi = String.raw`\begin{aligned}
\;r_{\text{eff}} &= \frac{(S - f)\, r_{\text{provider}}}{S} \\
\text{RVI} &= \sqrt{\operatorname{Var}_w(r_{\text{eff}})} \\
\text{RVI}_{\text{bps}} &= \frac{\text{RVI}}{\text{TEER}} \cdot 10{,}000
\end{aligned}`

const { public: { siteUrl } } = useRuntimeConfig()

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Indices',
    description: 'How TEER, RCI, and RVI are calculated and what they measure.',
  },
})

setSeo({
  title: 'Indices Methodology | Remit-Scout',
  description: 'How TEER, RCI, and RVI are calculated on Remit-Scout: synthetic volume weighting, data inputs, and formulas for interpreting corridor efficiency and volatility.',
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
