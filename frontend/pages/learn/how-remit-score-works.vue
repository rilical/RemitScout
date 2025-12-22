<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <span>⭐</span>
            Methodology
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            How Remit‑Score Works
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            How We Rank Providers Without Pay‑to‑Rank
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            Remit-Score (0–10) is our standardized rating that summarizes value and usability in a single number. Here's how we calculate it, what we measure, and what we don't do.
          </p>
          <div class="flex items-center gap-4 text-sm text-neutral-600">
            <span>8 min read</span>
            <span>•</span>
            <span>Updated December 2024</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="prose prose-lg max-w-none">
          <!-- Categories & Weights -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-8 text-center">
              Rating Categories & Weights
            </h2>
            
            <div class="space-y-4 w-full">
              <!-- Delivered Value - 40% -->
              <div class="flex w-full border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div class="bg-gradient-to-r from-green-50 to-white p-4 flex items-center justify-center flex-shrink-0 w-20">
                  <div class="text-4xl">💰</div>
                </div>
                <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                  <h4 class="font-bold text-neutral-900 text-lg mb-2">Delivered Value</h4>
                  <p class="text-sm text-neutral-600 leading-relaxed">
                    Effective cost (FX spread + fees), how often provider is cheapest, quote vs. actual delivery accuracy
                  </p>
                </div>
                <div class="bg-green-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                  <div class="text-4xl font-bold text-white mb-1">40%</div>
                  <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                </div>
              </div>

              <!-- Reliability & Success - 20% -->
              <div class="flex w-full border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div class="bg-gradient-to-r from-blue-50 to-white p-4 flex items-center justify-center flex-shrink-0 w-20">
                  <div class="text-4xl">🛡️</div>
                </div>
                <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                  <h4 class="font-bold text-neutral-900 text-lg mb-2">Reliability & Success</h4>
                  <p class="text-sm text-neutral-600 leading-relaxed">
                    Quote success rate, data freshness, pricing stability (where available)
                  </p>
                </div>
                <div class="bg-blue-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                  <div class="text-4xl font-bold text-white mb-1">20%</div>
                  <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                </div>
              </div>

              <!-- Friction & Speed - 15% -->
              <div class="flex w-full border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div class="bg-gradient-to-r from-purple-50 to-white p-4 flex items-center justify-center flex-shrink-0 w-20">
                  <div class="text-4xl">⚡</div>
                </div>
                <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                  <h4 class="font-bold text-neutral-900 text-lg mb-2">Friction & Speed</h4>
                  <p class="text-sm text-neutral-600 leading-relaxed">
                    ETA where available, speed buckets, observed delivery times on selected corridors
                  </p>
                </div>
                <div class="bg-purple-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                  <div class="text-4xl font-bold text-white mb-1">15%</div>
                  <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                </div>
              </div>

              <!-- Support & Refunds - 15% -->
              <div class="flex w-full border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div class="bg-gradient-to-r from-orange-50 to-white p-4 flex items-center justify-center flex-shrink-0 w-20">
                  <div class="text-4xl">🎯</div>
                </div>
                <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                  <h4 class="font-bold text-neutral-900 text-lg mb-2">Support & Refunds</h4>
                  <p class="text-sm text-neutral-600 leading-relaxed">
                    Refund processing time, dispute resolution SLA, post-resolution satisfaction, chargeback rate
                  </p>
                </div>
                <div class="bg-orange-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                  <div class="text-4xl font-bold text-white mb-1">15%</div>
                  <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                </div>
              </div>

              <!-- Trust & Safety - 10% -->
              <div class="flex w-full border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div class="bg-gradient-to-r from-slate-50 to-white p-4 flex items-center justify-center flex-shrink-0 w-20">
                  <div class="text-4xl">🔒</div>
                </div>
                <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                  <h4 class="font-bold text-neutral-900 text-lg mb-2">Trust & Safety</h4>
                  <p class="text-sm text-neutral-600 leading-relaxed">
                    Public licensing checks where available, regulatory register verification
                  </p>
                </div>
                <div class="bg-slate-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                  <div class="text-4xl font-bold text-white mb-1">10%</div>
                  <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                </div>
              </div>
            </div>
          </div>

          <!-- What We Measure -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What We Measure
            </h2>
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">📊 Quote Records</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  We capture normalized snapshots called "Quote Records" that include: fees, implied FX rate vs mid-market, delivered amount, ETA, availability, and timestamp.
                </p>
                <p class="text-sm text-neutral-600">
                  These records let us compare providers fairly and track changes over time.
                </p>
              </div>
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">✅ Quote vs. Delivered Accuracy</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  We track how often the amount quoted matches what recipients actually receive. Providers with high accuracy score better.
                </p>
              </div>
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">🔄 Data Freshness</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  We measure how often providers return usable quotes and how fresh the data is. Providers with stale or unreliable data score lower.
                </p>
              </div>
            </div>
          </div>

          <!-- What We Don't Do -->
          <div class="mb-12 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-8 lg:p-12">
            <h2 class="text-2xl font-bold text-neutral-900 mb-4">
              What We Don't Do
            </h2>
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <span class="text-2xl">❌</span>
                <div>
                  <h3 class="text-base font-bold text-neutral-900 mb-1">No Pay-to-Rank</h3>
                  <p class="text-sm text-neutral-700">
                    Providers cannot pay to appear higher or improve their Remit-Score. Rankings are driven by data, not payments.
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-2xl">❌</span>
                <div>
                  <h3 class="text-base font-bold text-neutral-900 mb-1">No Affiliate Influence</h3>
                  <p class="text-sm text-neutral-700">
                    Affiliate relationships do not influence score calculation. We may earn commissions, but they never affect rankings.
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-2xl">❌</span>
                <div>
                  <h3 class="text-base font-bold text-neutral-900 mb-1">No Paid Reviews</h3>
                  <p class="text-sm text-neutral-700">
                    We don't use user reviews or ratings in our scoring. Scores are based on objective data: fees, rates, delivery times, and reliability.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Data Sources -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Data Sources & Provenance
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              We use multiple data sources, ranked by reliability:
            </p>
            <div class="space-y-4">
              <div class="rounded-xl border border-brand-200 bg-white p-5">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-2xl">🧩</span>
                  <h3 class="text-base font-bold text-neutral-900">Provider API / Partner Feed</h3>
                </div>
                <p class="text-sm text-neutral-700">
                  Highest consistency when available. Direct data feeds from providers or partners.
                </p>
              </div>
              <div class="rounded-xl border border-brand-200 bg-white p-5">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-2xl">🌐</span>
                  <h3 class="text-base font-bold text-neutral-900">Public Quote Flow</h3>
                </div>
                <p class="text-sm text-neutral-700">
                  Structured capture from provider quote pages where API access isn't available.
                </p>
              </div>
              <div class="rounded-xl border border-brand-200 bg-white p-5">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-2xl">🧪</span>
                  <h3 class="text-base font-bold text-neutral-900">Spot-Check Transfers</h3>
                </div>
                <p class="text-sm text-neutral-700">
                  Real transfer tests on selected corridors and methods to validate provider claims.
                </p>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              See Remit-Scores in Action
            </h3>
            <p class="text-base text-neutral-700 leading-relaxed mb-4">
              Compare providers with Remit-Scores on our providers page. Each score reflects real value, not marketing promises.
            </p>
            <NuxtLink
              to="/learn/providers"
              class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-brand-700 transition-all"
            >
              View Provider Scores
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Guides -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-neutral-900 mb-8 text-center">
          Related Resources
        </h2>
        <div class="grid gap-6 md:grid-cols-3">
          <NuxtLink
            to="/methodology"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Full Methodology
            </h3>
            <p class="text-sm text-neutral-600">
              Deep dive into how we compare providers and calculate scores.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/providers"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Provider Reviews
            </h3>
            <p class="text-sm text-neutral-600">
              See Remit-Scores for all providers and read detailed reviews.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/how-we-make-money"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              How We Make Money
            </h3>
            <p class="text-sm text-neutral-600">
              Learn how we maintain independence and why rankings aren't for sale.
            </p>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Remit-Score', path: '/learn/how-remit-score-works' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'How Remit-Score Works: How We Rank Providers Without Pay-to-Rank | Remit-Scout',
  description: 'Learn how Remit-Score (0-10) is calculated: categories, weights, what we measure, data sources, and how we maintain independence.',
  canonical: `${siteUrl}/learn/how-remit-score-works`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Remit-Score', url: `${siteUrl}/learn/how-remit-score-works` },
])
</script>








