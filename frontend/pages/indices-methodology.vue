<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero -->
    <section class="relative bg-slate-950 py-16 lg:py-20">
      <div class="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" dark />

        <div class="mt-10 grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-brand-400">
              Remit-Scout Indices
            </p>
            <h1 class="mt-3 text-4xl font-bold leading-tight text-white sm:text-5xl">
              Indices Methodology
            </h1>
            <p class="mt-5 text-lg leading-relaxed text-slate-300">
              A transparent, auditable description of how TEER™, RCI™, and RVI™ are calculated.
              These indices are <strong class="text-white">synthetic volume‑weighted</strong> using
              quote frequency, spread stability, and recency.
            </p>
            <p class="mt-4 text-sm text-slate-400">
              Last updated:
              <time :datetime="lastUpdatedIso">{{ lastUpdatedLabel }}</time>
            </p>
          </div>

          <div class="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200 shadow-lg">
            <div class="space-y-4">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-400">Weighting Model</p>
                <p class="text-lg font-semibold text-white">synthetic_volume_v1</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-400">Methodology Version</p>
                <p class="text-lg font-semibold text-white">indices_v2</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-400">Default Amount</p>
                <p class="text-lg font-semibold text-white">$500 USD equivalent</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-400">Outputs</p>
                <p class="text-sm text-slate-300">Daily TEER, RCI, RVI, and RVI_bps</p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-10 grid gap-6 md:grid-cols-3">
          <NuxtLink to="/indices-methodology#teer" class="group rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-white/20 hover:bg-white/10 transition-all">
            <p class="text-xs uppercase tracking-wide text-slate-400">Index</p>
            <h3 class="mt-2 text-xl font-bold text-white">TEER™</h3>
            <p class="mt-2 text-sm text-slate-300">Total Effective Exchange Rate.</p>
          </NuxtLink>
          <NuxtLink to="/indices-methodology#rci" class="group rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-white/20 hover:bg-white/10 transition-all">
            <p class="text-xs uppercase tracking-wide text-slate-400">Index</p>
            <h3 class="mt-2 text-xl font-bold text-white">RCI™</h3>
            <p class="mt-2 text-sm text-slate-300">Remittance Cost Index.</p>
          </NuxtLink>
          <NuxtLink to="/indices-methodology#rvi" class="group rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-white/20 hover:bg-white/10 transition-all">
            <p class="text-xs uppercase tracking-wide text-slate-400">Index</p>
            <h3 class="mt-2 text-xl font-bold text-white">RVI™</h3>
            <p class="mt-2 text-sm text-slate-300">Remittance Volatility Index.</p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Synthetic Weighting -->
    <section id="weighting" class="py-16 lg:py-20 bg-white scroll-mt-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <h2 class="text-3xl font-bold text-slate-900">Synthetic Volume Weighting</h2>
            <p class="mt-4 text-base text-slate-600 leading-relaxed">
              We do not see provider transaction volume directly. Instead, we infer relative dominance
              from observable microstructure signals: quote frequency, spread stability, and recency.
            </p>
            <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <pre class="text-sm text-slate-700 whitespace-pre-wrap"><code>
w_raw = ln(1 + F)^α · S^β · R^γ · TierMultiplier
F = quotes_per_hour
S = exp(-0.5 · z^2), z = (avg_rate - median_rate) / std_rate
R = exp(-λ · age_minutes)
              </code></pre>
            </div>
            <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <pre class="text-sm text-slate-700 whitespace-pre-wrap"><code>
w_corridor = w_raw / Σ w_raw
conf = min(1, window_days/30) · min(1, quote_count/min_quotes)
w_final = conf · w_corridor + (1 - conf) · w_global
              </code></pre>
            </div>
            <p class="mt-4 text-sm text-slate-500">
              Default parameters: α=0.4, β=0.4, γ=0.2, half-life=180 minutes, min_days=3, min_providers=3, min_quotes=500.
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-slate-900">Tier multipliers (persistence)</h3>
            <ul class="mt-4 space-y-3 text-sm text-slate-600">
              <li><strong class="text-slate-900">Tier 1:</strong> persistence ≥ 0.9 → 1.5×</li>
              <li><strong class="text-slate-900">Tier 2:</strong> persistence ≥ 0.6 → 1.0×</li>
              <li><strong class="text-slate-900">Tier 3:</strong> persistence &lt; 0.6 → 0.5×</li>
            </ul>
            <div class="mt-6 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
              Weight confidence (0–1) is returned to clients as <code>weightConfidence</code> along with
              the effective window in <code>weightWindowDays</code>.
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TEER -->
    <section id="teer" class="py-16 lg:py-20 bg-slate-50 scroll-mt-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <h2 class="text-3xl font-bold text-slate-900">TEER™ — Total Effective Exchange Rate</h2>
            <p class="mt-4 text-base text-slate-600 leading-relaxed">
              TEER represents the net rate recipients effectively receive after fees and FX markup.
              It is calculated from the weighted cost ratio and the mid‑market reference rate.
            </p>
            <div class="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <pre class="text-sm text-slate-700 whitespace-pre-wrap"><code>
RCI_cost = (fee + hidden_markup) / send_amount
hidden_markup = ((send_amount - fee) · (mid_market - provider_rate)) / mid_market
TEER = mid_market · (1 - weighted_RCI_cost)
              </code></pre>
            </div>
            <p class="mt-4 text-sm text-slate-500">
              TEER uses providers that are <code>allowed_in_teer</code> and active in the rights matrix.
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-slate-900">Interpretation</h3>
            <ul class="mt-4 space-y-3 text-sm text-slate-600">
              <li><strong class="text-slate-900">Higher TEER</strong> → better effective rate.</li>
              <li><strong class="text-slate-900">Lower TEER</strong> → higher friction in the corridor.</li>
              <li>Excludes promotional rates to avoid teaser‑rate distortion.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- RCI -->
    <section id="rci" class="py-16 lg:py-20 bg-white scroll-mt-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <h2 class="text-3xl font-bold text-slate-900">RCI™ — Remittance Cost Index</h2>
            <p class="mt-4 text-base text-slate-600 leading-relaxed">
              RCI is the weighted total cost of sending money as a percent of the send amount.
              It captures both explicit fees and hidden FX markup.
            </p>
            <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <pre class="text-sm text-slate-700 whitespace-pre-wrap"><code>
RCI = Σ(weight · cost_ratio) / Σ(weight)
cost_ratio = (fee + hidden_markup) / send_amount
              </code></pre>
            </div>
            <p class="mt-4 text-sm text-slate-500">
              RCI uses providers that are <code>allowed_in_rci</code> and active in the rights matrix.
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-slate-900">Interpretation</h3>
            <ul class="mt-4 space-y-3 text-sm text-slate-600">
              <li><strong class="text-slate-900">Higher RCI</strong> → more friction (fees + spread).</li>
              <li><strong class="text-slate-900">Lower RCI</strong> → more efficient corridor.</li>
              <li>Reported as a ratio (0–1); API clients can express it in percent.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- RVI -->
    <section id="rvi" class="py-16 lg:py-20 bg-slate-50 scroll-mt-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <h2 class="text-3xl font-bold text-slate-900">RVI™ — Remittance Volatility Index</h2>
            <p class="mt-4 text-base text-slate-600 leading-relaxed">
              RVI measures the weighted dispersion of effective rates across providers.
              We also publish RVI_bps for standardized comparison.
            </p>
            <div class="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <pre class="text-sm text-slate-700 whitespace-pre-wrap"><code>
effective_rate = ((send_amount - fee) · provider_rate) / send_amount
RVI = sqrt( weighted_variance(effective_rate) )
RVI_bps = (RVI / TEER) · 10,000
              </code></pre>
            </div>
            <p class="mt-4 text-sm text-slate-500">
              RVI uses providers that are <code>allowed_in_rvi</code> and active in the rights matrix.
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-slate-900">Interpretation</h3>
            <ul class="mt-4 space-y-3 text-sm text-slate-600">
              <li><strong class="text-slate-900">Higher RVI</strong> → providers disagree more.</li>
              <li><strong class="text-slate-900">Lower RVI</strong> → tighter market consensus.</li>
              <li>RVI_bps standardizes volatility vs TEER.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Inputs & Controls -->
    <section id="inputs" class="py-16 lg:py-20 bg-white scroll-mt-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-8 lg:grid-cols-2">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-slate-900">Data inputs & filters</h3>
            <ul class="mt-4 space-y-3 text-sm text-slate-600">
              <li><strong class="text-slate-900">Rights matrix allowlists:</strong> per index using allowed_in_teer/allowed_in_rci/allowed_in_rvi.</li>
              <li><strong class="text-slate-900">Promo exclusion:</strong> indices use base fees & rates only.</li>
              <li><strong class="text-slate-900">Method profiles:</strong> standard_bank, standard_card, cash_pickup.</li>
              <li><strong class="text-slate-900">Active providers:</strong> allowed_collect + allowed_b2c + stoplist_status=active.</li>
            </ul>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-slate-900">Mid‑market reference</h3>
            <p class="mt-3 text-sm text-slate-600">
              Mid‑market rates are sourced from OANDA. We prefer daily rates from
              <code class="bg-slate-100 px-1 py-0.5 rounded">gold.fx_rate_history</code>
              and fall back to the latest
              <code class="bg-slate-100 px-1 py-0.5 rounded">gold.fx_rates</code> entry.
            </p>
          </div>
        </div>

        <div class="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 class="text-lg font-semibold text-slate-900">Confidence & suppression</h3>
          <p class="mt-2 text-sm text-slate-600">
            If provider coverage is too low (default minimum: 3 providers), index points are suppressed.
            Confidence metadata is returned as <code>weightConfidence</code> and <code>weightWindowDays</code>.
          </p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-14 bg-slate-900">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold text-white">Need the indices directly?</h2>
        <p class="mt-4 text-base text-slate-300">
          Enterprise customers can access TEER™, RCI™, and RVI™ via API and scheduled exports.
        </p>
        <div class="mt-6 flex justify-center gap-4">
          <NuxtLink to="/contact" class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500">
            Contact sales
          </NuxtLink>
          <NuxtLink to="/methodology" class="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-white/40">
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

const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Indices Methodology | Remit-Scout',
  description: 'How TEER™, RCI™, and RVI™ are calculated: synthetic volume weighting, inputs, and formulas.',
  canonical: `${siteUrl}/indices-methodology`,
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
