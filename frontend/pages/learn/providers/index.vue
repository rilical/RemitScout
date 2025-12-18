<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative bg-gradient-to-b from-neutral-50 via-white to-white py-16 lg:py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-10">
          <h1 class="text-4xl font-bold leading-tight text-brand-600 sm:text-5xl mb-4">
            Supported Money Transfer Providers
          </h1>
          <p class="max-w-4xl text-xl leading-relaxed text-neutral-600 mb-8">
            Compare trusted money transfer providers with Remit-Scout scores to find the best service for your needs. 
            Our data-driven methodology evaluates providers based on delivered value, reliability, and transparency.
          </p>

          <!-- Understanding Remit-Scout Scores -->
          <div class="bg-gradient-to-r from-brand-50 to-blue-50 border-2 border-brand-200 rounded-3xl p-8 lg:p-12">
            <div class="mb-8">
              <div class="flex items-start gap-4 mb-6">
                <div class="flex-shrink-0">
                  <div class="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center">
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
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 class="text-2xl font-bold text-neutral-900 mb-3">
                    How We Score Providers
                  </h2>
                  <p class="text-base text-neutral-700 mb-4 leading-relaxed max-w-3xl">
                    Each provider gets a <span class="font-semibold text-brand-600">Remit-Score (0-10 scale)</span> based on real transfer data, not paid reviews. Scores like <span class="font-semibold">9.5</span>, <span class="font-semibold">8.4</span>, or <span class="font-semibold">7.2</span> represent the overall quality and value you can expect when using that provider.
                  </p>
                  <p class="text-base text-neutral-700 mb-4 leading-relaxed max-w-3xl">
                    Our methodology prioritizes what matters most: <strong>how much money actually reaches your recipient</strong>. We analyze fees, exchange rate markups, and the total delivered amount. Providers cannot pay to rank higher—the score reflects real value.
                  </p>
                </div>
              </div>
            </div>

            <!-- Rating Categories & Weights (Burger Stack Layout) -->
            <div class="mb-10">
              <h3 class="text-2xl font-bold text-neutral-900 mb-8 text-center">
                Rating Categories & Weights
              </h3>
              
              <!-- Horizontal Scroll Container for Mobile -->
              <div class="overflow-x-auto pb-6 -mx-4 px-4">
                <div class="flex gap-6 min-w-max lg:grid lg:grid-cols-5 lg:min-w-0">
                  <!-- Delivered Value - 40% -->
                  <div class="flex-shrink-0 w-80 lg:w-auto flex flex-col border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div class="bg-gradient-to-br from-green-50 to-white p-8 flex-grow">
                      <div class="flex items-center justify-center mb-6">
                        <div class="text-6xl">💰</div>
                      </div>
                      <h4 class="font-bold text-neutral-900 text-lg text-center mb-4">Delivered Value</h4>
                      <p class="text-sm text-neutral-600 text-center leading-relaxed mb-6">
                        Effective cost (FX spread + fees), how often provider is cheapest, quote vs. actual delivery accuracy
                      </p>
                    </div>
                    <div class="bg-green-600 p-6 text-center">
                      <div class="text-4xl font-bold text-white mb-1">40%</div>
                      <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                    </div>
                  </div>

                  <!-- Reliability & Success - 20% -->
                  <div class="flex-shrink-0 w-80 lg:w-auto flex flex-col border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div class="bg-gradient-to-br from-blue-50 to-white p-8 flex-grow">
                      <div class="flex items-center justify-center mb-6">
                        <div class="text-6xl">🛡️</div>
                      </div>
                      <h4 class="font-bold text-neutral-900 text-lg text-center mb-4">Reliability & Success</h4>
                      <p class="text-sm text-neutral-600 text-center leading-relaxed mb-6">
                        Quote success rate, data freshness, pricing stability (where available)
                      </p>
                    </div>
                    <div class="bg-blue-600 p-6 text-center">
                      <div class="text-4xl font-bold text-white mb-1">20%</div>
                      <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                    </div>
                  </div>

                  <!-- Friction & Speed - 15% -->
                  <div class="flex-shrink-0 w-80 lg:w-auto flex flex-col border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div class="bg-gradient-to-br from-purple-50 to-white p-8 flex-grow">
                      <div class="flex items-center justify-center mb-6">
                        <div class="text-6xl">⚡</div>
                      </div>
                      <h4 class="font-bold text-neutral-900 text-lg text-center mb-4">Friction & Speed</h4>
                      <p class="text-sm text-neutral-600 text-center leading-relaxed mb-6">
                        ETA where available, speed buckets, observed delivery times on selected corridors
                      </p>
                    </div>
                    <div class="bg-purple-600 p-6 text-center">
                      <div class="text-4xl font-bold text-white mb-1">15%</div>
                      <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                    </div>
                  </div>

                  <!-- Support & Refunds - 15% -->
                  <div class="flex-shrink-0 w-80 lg:w-auto flex flex-col border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div class="bg-gradient-to-br from-orange-50 to-white p-8 flex-grow">
                      <div class="flex items-center justify-center mb-6">
                        <div class="text-6xl">🎯</div>
                      </div>
                      <h4 class="font-bold text-neutral-900 text-lg text-center mb-4">Support & Refunds</h4>
                      <p class="text-sm text-neutral-600 text-center leading-relaxed mb-6">
                        Refund processing time, dispute resolution SLA, post-resolution satisfaction, chargeback rate
                      </p>
                    </div>
                    <div class="bg-orange-600 p-6 text-center">
                      <div class="text-4xl font-bold text-white mb-1">15%</div>
                      <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                    </div>
                  </div>

                  <!-- Trust & Safety - 10% -->
                  <div class="flex-shrink-0 w-80 lg:w-auto flex flex-col border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div class="bg-gradient-to-br from-emerald-50 to-white p-8 flex-grow">
                      <div class="flex items-center justify-center mb-6">
                        <div class="text-6xl">🔒</div>
                      </div>
                      <h4 class="font-bold text-neutral-900 text-lg text-center mb-4">Trust & Safety</h4>
                      <p class="text-sm text-neutral-600 text-center leading-relaxed mb-6">
                        Public licensing checks where available, regulatory register verification
                      </p>
                    </div>
                    <div class="bg-emerald-600 p-6 text-center">
                      <div class="text-4xl font-bold text-white mb-1">10%</div>
                      <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Key Statistics -->
            <div class="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-brand-600 rounded-xl p-4 text-center shadow-md">
                <div class="text-2xl font-bold text-white">{{ SITE_STATS.providers.display }}</div>
                <div class="text-xs text-white/90 mt-1">{{ SITE_STATS.providers.label }}</div>
              </div>
              <div class="bg-brand-600 rounded-xl p-4 text-center shadow-md">
                <div class="text-2xl font-bold text-white">{{ SITE_STATS.corridors.display }}</div>
                <div class="text-xs text-white/90 mt-1">{{ SITE_STATS.corridors.label }}</div>
              </div>
              <div class="bg-brand-600 rounded-xl p-4 text-center shadow-md">
                <div class="text-2xl font-bold text-white">{{ SITE_STATS.totalSaved.display }}</div>
                <div class="text-xs text-white/90 mt-1">{{ SITE_STATS.totalSaved.label }}</div>
              </div>
              <div class="bg-brand-600 rounded-xl p-4 text-center shadow-md">
                <div class="text-2xl font-bold text-white">{{ SITE_STATS.users.display }}</div>
                <div class="text-xs text-white/90 mt-1">{{ SITE_STATS.users.label }}</div>
              </div>
            </div>

            <!-- Bottom Text & CTA -->
            <div class="border-t-2 border-brand-200 pt-6">
              <p class="text-sm text-neutral-600 mb-4 max-w-3xl leading-relaxed">
                Scores are computed from our quote dataset—fees, implied FX rate vs a mid-market reference, and delivered amount. We also factor in measurable signals like stated ETA, payment method support, and quote availability. Providers cannot pay to rank higher, and affiliate relationships do not influence score calculation.
              </p>
              <div class="flex flex-wrap gap-4">
                <NuxtLink
                  to="/methodology"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl shadow-md hover:bg-brand-700 transition-all"
                >
                  <span>Learn Our Full Methodology</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>
                <a
                  href="#provider-cards"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-brand-600 text-brand-600 font-semibold rounded-xl hover:bg-brand-50 transition-all"
                >
                  <span>See Provider Scores</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Provider Cards Section -->
    <section id="provider-cards" class="py-12 bg-neutral-50 scroll-mt-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ProviderCard
            v-for="provider in filteredProviders"
            :key="provider.id"
            :provider="provider"
          />
        </div>
      </div>
    </section>

    <!-- Trust & Independence Section -->
    <IndependenceBadge />

    <!-- Our Impact So Far -->
    <TrustMetricsStrip />

    <!-- FAQ Section -->
    <HomeFaq />

    <!-- Help Footer - Contact & Partnerships -->
    <HelpFooter />

    <!-- Partnership Section -->
    <section class="py-16 lg:py-20 bg-slate-900">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl text-center">
          <h2 class="text-3xl font-bold text-white mb-6">
            🤝 Partner with Remit-Scout
          </h2>
          <p class="text-lg leading-relaxed text-slate-300 mb-6">
            Are you a <strong class="font-semibold text-white">licensed money transfer provider</strong> looking to reach expats and international families? We're always interested in <span class="font-semibold text-white">expanding our coverage</span> and helping more people make informed financial decisions.
          </p>
          <p class="text-base leading-relaxed text-slate-400 mb-4">
            We work with providers who share our commitment to <strong class="font-semibold text-white">transparency</strong> and <span class="font-semibold text-white">outcome-based comparisons</span>. Whether you're a major remittance company or a digital-first startup, we're open to partnerships that help users make better choices.
          </p>
          <p class="text-base leading-relaxed text-slate-400 mb-10">
            We maintain <strong class="font-semibold text-white">editorial independence</strong> in all partnerships. Providers cannot pay to rank higher, and all affiliate relationships are <span class="font-semibold text-white">fully disclosed</span> to our users. Your trust is more valuable than any partnership.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <NuxtLink
              to="/contact"
              class="inline-flex min-h-btn items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <span>📧</span>
              <span>Get in touch</span>
            </NuxtLink>
            <NuxtLink
              to="/partnerships"
              class="inline-flex min-h-btn items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-8 py-3 text-base font-semibold text-slate-900 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <span>💼</span>
              <span>Learn about our partnerships</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import ProviderCard from '~/components/shared/ProviderCard.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import IndependenceBadge from '~/components/home/IndependenceBadge.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import HelpFooter from '~/components/home/HelpFooter.vue'
import HomeFaq from '~/components/home/HomeFaq.vue'
import { useProviders } from '~/composables/useProviders'
import { setSeo, jsonLdBreadcrumb, jsonLdSiteNavigation } from '~/composables/useSeo'
import { SITE_STATS } from '~/config/stats'

definePageMeta({
  alias: ['/reviews'],
})

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'Supported Money Transfer Providers | Remit-Scout Scores & Reviews | Remit-Scout',
  description:
    'Compare trusted money transfer providers with Remit-Scout scores and user reviews. Find the best service for your transfer needs with independent, data-driven ratings.',
  canonical: `${siteUrl}/learn/providers`,
  ogImage: `${siteUrl}/images/og/providers.jpg`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Providers', url: `${siteUrl}/learn/providers` },
])

jsonLdSiteNavigation([
  { name: 'Send Money', url: `${siteUrl}/send-money` },
  { name: 'Providers', url: `${siteUrl}/learn/providers` },
  { name: 'Exchange Rates', url: `${siteUrl}/exchange-rates` },
  { name: 'Guides', url: `${siteUrl}/learn` },
  { name: 'FAQ', url: `${siteUrl}/faq` },
])

// Providers data
const { data: providers } = await useProviders()
const filteredProviders = computed(() => {
  return providers.value || []
})
</script>
