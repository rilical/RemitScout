<template>
  <div class="min-h-screen bg-surface">
    <CompareWidget />

    <!-- Hero -->
    <section class="relative bg-neutral-950 py-16 lg:py-20">
      <div class="relative z-10 mx-auto max-w-6xl px-page-x">
        <Breadcrumbs
          :items="breadcrumbItems"
          dark
        />

        <div class="mt-10 grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <p class="text-body-sm font-semibold uppercase tracking-wide text-brand-400">
              Remit-Scout Indices
            </p>
            <h1 class="mt-3 text-h1 font-bold leading-tight text-white">
              Indices Methodology
            </h1>
            <p class="mt-5 text-body-lg leading-relaxed text-neutral-300">
              A transparent, auditable description of how TEER™, RCI™, and RVI™ are calculated.
              These indices are <strong class="text-white">synthetic volume‑weighted</strong> using
              quote frequency, spread stability, and recency.
            </p>
            <p class="mt-4 text-body-sm text-neutral-400">
              Last updated:
              <time :datetime="lastUpdatedIso">{{ lastUpdatedLabel }}</time>
            </p>
          </div>

          <div class="rounded-2xl border border-white/10 bg-surface/5 p-6 text-neutral-200 shadow-lg">
            <div class="space-y-4">
              <div>
                <p class="text-body-sm uppercase tracking-wide text-neutral-400">
                  Weighting Model
                </p>
                <p class="text-body-lg font-semibold text-white">
                  synthetic_volume_v1
                </p>
              </div>
              <div>
                <p class="text-body-sm uppercase tracking-wide text-neutral-400">
                  Methodology Version
                </p>
                <p class="text-body-lg font-semibold text-white">
                  indices_v2
                </p>
              </div>
              <div>
                <p class="text-body-sm uppercase tracking-wide text-neutral-400">
                  Default Amount
                </p>
                <p class="text-body-lg font-semibold text-white">
                  $500 USD equivalent
                </p>
              </div>
              <div>
                <p class="text-body-sm uppercase tracking-wide text-neutral-400">
                  Outputs
                </p>
                <p class="text-body-sm text-neutral-300">
                  Daily TEER, RCI, RVI, and RVI_bps
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-10 grid gap-6 md:grid-cols-3">
          <NuxtLink
            to="/indices-methodology#teer"
            class="group rounded-2xl border border-white/10 bg-surface/5 p-5 hover:border-white/20 hover:bg-surface/10 transition-all"
          >
            <p class="text-body-sm uppercase tracking-wide text-neutral-400">Index</p>
            <h3 class="mt-2 text-h4 font-bold text-white">TEER™</h3>
            <p class="mt-2 text-body-sm text-neutral-300">Total Effective Exchange Rate.</p>
          </NuxtLink>
          <NuxtLink
            to="/indices-methodology#rci"
            class="group rounded-2xl border border-white/10 bg-surface/5 p-5 hover:border-white/20 hover:bg-surface/10 transition-all"
          >
            <p class="text-body-sm uppercase tracking-wide text-neutral-400">Index</p>
            <h3 class="mt-2 text-h4 font-bold text-white">RCI™</h3>
            <p class="mt-2 text-body-sm text-neutral-300">Remittance Cost Index.</p>
          </NuxtLink>
          <NuxtLink
            to="/indices-methodology#rvi"
            class="group rounded-2xl border border-white/10 bg-surface/5 p-5 hover:border-white/20 hover:bg-surface/10 transition-all"
          >
            <p class="text-body-sm uppercase tracking-wide text-neutral-400">Index</p>
            <h3 class="mt-2 text-h4 font-bold text-white">RVI™</h3>
            <p class="mt-2 text-body-sm text-neutral-300">Remittance Volatility Index.</p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Synthetic Weighting -->
    <section
      id="weighting"
      class="py-16 lg:py-20 bg-surface scroll-mt-20"
    >
      <div class="mx-auto max-w-6xl px-page-x">
        <div class="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <h2 class="text-h2 font-bold text-rs-fg">
              Synthetic Volume Weighting
            </h2>
            <p class="mt-4 text-body text-neutral-600 leading-relaxed">
              We do not see provider transaction volume directly. Instead, we infer relative dominance
              from observable microstructure signals: quote frequency, spread stability, and recency.
            </p>
            <div class="mt-6 rounded-xl border border-rs-border bg-neutral-50 p-4 overflow-x-auto">
              <AsyncErrorBoundary skeleton-height="120">
                <LaTeXFormula
                  :formula="formulaWeightingRaw"
                  display
                />
              </AsyncErrorBoundary>
            </div>
            <p class="mt-3 text-body-sm text-rs-muted">
              Where <code>F</code> is quote frequency, <code>S</code> is spread stability, <code>R</code> is recency, and <code>m_tier</code> is the persistence multiplier.
            </p>
            <div class="mt-4 rounded-xl border border-rs-border bg-neutral-50 p-4 overflow-x-auto">
              <AsyncErrorBoundary skeleton-height="120">
                <LaTeXFormula
                  :formula="formulaWeightingBlend"
                  display
                />
              </AsyncErrorBoundary>
            </div>
            <p class="mt-3 text-body-sm text-rs-muted">
              Where <code>d</code> is window days, <code>n</code> is quote count, and <code>n_min</code> is minimum quotes required for full confidence.
            </p>
            <p class="mt-4 text-body-sm text-rs-muted">
              Default parameters: α=0.4, β=0.4, γ=0.2, half-life=180 minutes, min_days=3, min_providers=3, min_quotes=500.
            </p>
          </div>

          <div class="rounded-2xl border border-rs-border bg-surface p-6 shadow-sm lg:self-start">
            <h3 class="text-body-lg font-semibold text-rs-fg">
              Persistence bands (multiplier)
            </h3>
            <ul class="mt-4 space-y-3 text-body-sm text-neutral-600">
              <li><strong class="text-rs-fg">High persistence:</strong> ≥ 0.9 → 1.5×</li>
              <li><strong class="text-rs-fg">Medium persistence:</strong> ≥ 0.6 → 1.0×</li>
              <li><strong class="text-rs-fg">Low persistence:</strong> &lt; 0.6 → 0.5×</li>
            </ul>
            <div class="mt-6 rounded-xl bg-neutral-50 p-4 text-body-sm text-rs-muted">
              Weight confidence (0–1) is returned to clients as <code>weightConfidence</code> along with
              the effective window in <code>weightWindowDays</code>.
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TEER -->
    <section
      id="teer"
      class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20"
    >
      <div class="mx-auto max-w-6xl px-page-x">
        <div class="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <h2 class="text-h2 font-bold text-rs-fg">
              TEER™ — Total Effective Exchange Rate
            </h2>
            <p class="mt-4 text-body text-neutral-600 leading-relaxed">
              TEER represents the net rate recipients effectively receive after fees and FX markup.
              It is calculated from the weighted cost ratio and the mid‑market reference rate.
            </p>
            <div class="mt-6 rounded-xl border border-rs-border bg-neutral-50 p-4 overflow-x-auto">
              <AsyncErrorBoundary skeleton-height="120">
                <LaTeXFormula
                  :formula="formulaTeer"
                  display
                />
              </AsyncErrorBoundary>
            </div>
            <p class="mt-3 text-body-sm text-rs-muted">
              Where <code>S</code> is send amount, <code>f</code> is fee, <code>m</code> is hidden markup, and <code>r_mid</code> is the mid-market reference rate.
            </p>
            <p class="mt-4 text-body-sm text-rs-muted">
              TEER uses providers that are <code>allowed_in_teer</code> and active in the rights matrix.
            </p>
          </div>

          <div class="rounded-2xl border border-rs-border bg-surface p-6 shadow-sm lg:self-start">
            <h3 class="text-body-lg font-semibold text-rs-fg">
              Interpretation
            </h3>
            <ul class="mt-4 space-y-3 text-body-sm text-neutral-600">
              <li><strong class="text-rs-fg">Higher TEER</strong> → better effective rate.</li>
              <li><strong class="text-rs-fg">Lower TEER</strong> → higher friction in the corridor.</li>
              <li>Excludes promotional rates to avoid teaser‑rate distortion.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- RCI -->
    <section
      id="rci"
      class="py-16 lg:py-20 bg-surface scroll-mt-20"
    >
      <div class="mx-auto max-w-6xl px-page-x">
        <div class="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <h2 class="text-h2 font-bold text-rs-fg">
              RCI™ — Remittance Cost Index
            </h2>
            <p class="mt-4 text-body text-neutral-600 leading-relaxed">
              RCI is the weighted total cost of sending money as a percent of the send amount.
              It captures both explicit fees and hidden FX markup.
            </p>
            <div class="mt-6 rounded-xl border border-rs-border bg-neutral-50 p-4 overflow-x-auto">
              <AsyncErrorBoundary skeleton-height="120">
                <LaTeXFormula
                  :formula="formulaRci"
                  display
                />
              </AsyncErrorBoundary>
            </div>
            <p class="mt-3 text-body-sm text-rs-muted">
              Where <code>w_i</code> are the synthetic volume weights (normalized across providers) and <code>S, f, m</code> are as defined above.
            </p>
            <p class="mt-4 text-body-sm text-rs-muted">
              RCI uses providers that are <code>allowed_in_rci</code> and active in the rights matrix.
            </p>
          </div>

          <div class="rounded-2xl border border-rs-border bg-surface p-6 shadow-sm lg:self-start">
            <h3 class="text-body-lg font-semibold text-rs-fg">
              Interpretation
            </h3>
            <ul class="mt-4 space-y-3 text-body-sm text-neutral-600">
              <li><strong class="text-rs-fg">Higher RCI</strong> → more friction (fees + spread).</li>
              <li><strong class="text-rs-fg">Lower RCI</strong> → more efficient corridor.</li>
              <li>Reported as a ratio (0–1); API clients can express it in percent.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- RVI -->
    <section
      id="rvi"
      class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20"
    >
      <div class="mx-auto max-w-6xl px-page-x">
        <div class="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <h2 class="text-h2 font-bold text-rs-fg">
              RVI™ — Remittance Volatility Index
            </h2>
            <p class="mt-4 text-body text-neutral-600 leading-relaxed">
              RVI measures the weighted dispersion of effective rates across providers.
              We also publish RVI_bps for standardized comparison.
            </p>
            <div class="mt-6 rounded-xl border border-rs-border bg-neutral-50 p-4 overflow-x-auto">
              <AsyncErrorBoundary skeleton-height="120">
                <LaTeXFormula
                  :formula="formulaRvi"
                  display
                />
              </AsyncErrorBoundary>
            </div>
            <p class="mt-3 text-body-sm text-rs-muted">
              Where <code>Var_w</code> is the weighted variance across providers (using the same weights used for the index point).
            </p>
            <p class="mt-4 text-body-sm text-rs-muted">
              RVI uses providers that are <code>allowed_in_rvi</code> and active in the rights matrix.
            </p>
          </div>

          <div class="rounded-2xl border border-rs-border bg-surface p-6 shadow-sm lg:self-start">
            <h3 class="text-body-lg font-semibold text-rs-fg">
              Interpretation
            </h3>
            <ul class="mt-4 space-y-3 text-body-sm text-neutral-600">
              <li><strong class="text-rs-fg">Higher RVI</strong> → providers disagree more.</li>
              <li><strong class="text-rs-fg">Lower RVI</strong> → tighter market consensus.</li>
              <li>RVI_bps standardizes volatility vs TEER.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Inputs & Controls -->
    <section
      id="inputs"
      class="py-16 lg:py-20 bg-surface scroll-mt-20"
    >
      <div class="mx-auto max-w-6xl px-page-x">
        <div class="grid gap-8 lg:grid-cols-2">
          <div class="rounded-2xl border border-rs-border bg-surface p-6 shadow-sm">
            <h3 class="text-body-lg font-semibold text-rs-fg">
              Data inputs & filters
            </h3>
            <ul class="mt-4 space-y-3 text-body-sm text-neutral-600">
              <li><strong class="text-rs-fg">Rights matrix allowlists:</strong> per index using allowed_in_teer/allowed_in_rci/allowed_in_rvi.</li>
              <li><strong class="text-rs-fg">Promo exclusion:</strong> indices use base fees & rates only.</li>
              <li><strong class="text-rs-fg">Method profiles:</strong> standard_bank, standard_card, cash_pickup.</li>
              <li><strong class="text-rs-fg">Active providers:</strong> allowed_collect + allowed_b2c + stoplist_status=active.</li>
            </ul>
          </div>

          <div class="rounded-2xl border border-rs-border bg-surface p-6 shadow-sm">
            <h3 class="text-body-lg font-semibold text-rs-fg">
              Mid‑market reference
            </h3>
            <p class="mt-3 text-body-sm text-neutral-600">
              Mid‑market rates are sourced from OANDA. We prefer daily rates from
              <code class="bg-neutral-100 px-1 py-0.5 rounded">gold.fx_rate_history</code>
              and fall back to the latest
              <code class="bg-neutral-100 px-1 py-0.5 rounded">gold.fx_rates</code> entry.
            </p>
          </div>

        <div class="mt-8 rounded-2xl border border-rs-border bg-neutral-50 p-6">
          <h3 class="text-body-lg font-semibold text-rs-fg">
            Confidence & suppression
          </h3>
          <p class="mt-2 text-body-sm text-neutral-600">
            If provider coverage is too low (default minimum: 3 providers), index points are suppressed.
            Confidence metadata is returned as <code>weightConfidence</code> and <code>weightWindowDays</code>.
          </p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-14 bg-neutral-900">
      <div class="mx-auto max-w-6xl px-page-x text-center">
        <h2 class="text-h2 font-bold text-white">
          Need the indices directly?
        </h2>
        <p class="mt-4 text-body text-neutral-300">
          Enterprise customers can access TEER™, RCI™, and RVI™ via API and scheduled exports.
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <NuxtLink
            to="/contact"
            class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-body-sm font-semibold text-white hover:bg-brand-500"
          >
            Contact sales
          </NuxtLink>
          <NuxtLink
            to="/methodology"
            class="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-body-sm font-semibold text-white hover:border-white/40"
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
