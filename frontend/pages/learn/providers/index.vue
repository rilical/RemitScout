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
          <p class="text-xl leading-relaxed text-neutral-600 mb-8">
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
                <div class="flex-1 min-w-0">
                  <h2 class="text-2xl font-bold text-neutral-900 mb-3">
                    How We Score Providers
                  </h2>
                  <p class="text-base text-neutral-700 mb-4 leading-relaxed">
                    Each provider gets a <span class="font-semibold text-brand-600">Remit-Score (0-10 scale)</span> based on real transfer data, not paid reviews. Scores like <span class="font-semibold">9.5</span>, <span class="font-semibold">8.4</span>, or <span class="font-semibold">7.2</span> represent the overall quality and value you can expect when using that provider.
                  </p>
                  <p class="text-base text-neutral-700 mb-4 leading-relaxed">
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
                    <div class="bg-white p-8 flex-grow">
                      <div class="flex items-center justify-center mb-6">
                        <div class="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center">
                          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <h4 class="font-bold text-neutral-900 text-lg text-center mb-4">Delivered Value</h4>
                      <p class="text-sm text-neutral-600 text-center leading-relaxed mb-6">
                        Effective cost (FX spread + fees), how often provider is cheapest, quote vs. actual delivery accuracy
                      </p>
                    </div>
                    <div class="bg-blue-600 p-6 text-center">
                      <div class="text-4xl font-bold text-white mb-1">40%</div>
                      <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                    </div>
                  </div>

                  <!-- Reliability & Success - 20% -->
                  <div class="flex-shrink-0 w-80 lg:w-auto flex flex-col border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div class="bg-white p-8 flex-grow">
                      <div class="flex items-center justify-center mb-6">
                        <div class="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center">
                          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
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
                    <div class="bg-white p-8 flex-grow">
                      <div class="flex items-center justify-center mb-6">
                        <div class="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center">
                          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                      <h4 class="font-bold text-neutral-900 text-lg text-center mb-4">Friction & Speed</h4>
                      <p class="text-sm text-neutral-600 text-center leading-relaxed mb-6">
                        ETA where available, speed buckets, observed delivery times on selected corridors
                      </p>
                    </div>
                    <div class="bg-blue-600 p-6 text-center">
                      <div class="text-4xl font-bold text-white mb-1">15%</div>
                      <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                    </div>
                  </div>

                  <!-- Support & Refunds - 15% -->
                  <div class="flex-shrink-0 w-80 lg:w-auto flex flex-col border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div class="bg-white p-8 flex-grow">
                      <div class="flex items-center justify-center mb-6">
                        <div class="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center">
                          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                      </div>
                      <h4 class="font-bold text-neutral-900 text-lg text-center mb-4">Support & Refunds</h4>
                      <p class="text-sm text-neutral-600 text-center leading-relaxed mb-6">
                        Refund processing time, dispute resolution SLA, post-resolution satisfaction, chargeback rate
                      </p>
                    </div>
                    <div class="bg-blue-600 p-6 text-center">
                      <div class="text-4xl font-bold text-white mb-1">15%</div>
                      <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                    </div>
                  </div>

                  <!-- Trust & Safety - 10% -->
                  <div class="flex-shrink-0 w-80 lg:w-auto flex flex-col border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div class="bg-white p-8 flex-grow">
                      <div class="flex items-center justify-center mb-6">
                        <div class="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center">
                          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>
                      <h4 class="font-bold text-neutral-900 text-lg text-center mb-4">Trust & Safety</h4>
                      <p class="text-sm text-neutral-600 text-center leading-relaxed mb-6">
                        Public licensing checks where available, regulatory register verification
                      </p>
                    </div>
                    <div class="bg-blue-600 p-6 text-center">
                      <div class="text-4xl font-bold text-white mb-1">10%</div>
                      <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Text -->
            <div class="border-t-2 border-brand-200 pt-6">
              <p class="text-base text-neutral-600 leading-relaxed">
                Scores are computed from our quote dataset—fees, implied FX rate vs a mid-market reference, and delivered amount. We also factor in measurable signals like stated ETA, payment method support, and quote availability. Providers cannot pay to rank higher, and affiliate relationships do not influence score calculation.
              </p>
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
    <section class="py-16 lg:py-20 bg-blue-600">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl text-center">
          <div class="flex items-center justify-center gap-3 mb-6">
            <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 class="text-4xl lg:text-5xl font-bold text-white">
              Partner with Remit-Scout
            </h2>
          </div>
          <p class="text-lg lg:text-xl leading-relaxed text-slate-200 mb-6">
            Are you a <strong class="font-semibold text-white">licensed money transfer provider</strong> looking to reach expats and international families? We're always interested in <span class="font-semibold text-white">expanding our coverage</span> and helping more people make informed financial decisions.
          </p>
          <p class="text-base lg:text-lg leading-relaxed text-slate-300 mb-4">
            We work with providers who share our commitment to <strong class="font-semibold text-white">transparency</strong> and <span class="font-semibold text-white">outcome-based comparisons</span>. Whether you're a major remittance company or a digital-first startup, we're open to partnerships that help users make better choices.
          </p>
          <p class="text-base lg:text-lg leading-relaxed text-slate-300 mb-10">
            We maintain <strong class="font-semibold text-white">editorial independence</strong> in all partnerships. Providers cannot pay to rank higher, and all affiliate relationships are <span class="font-semibold text-white">fully disclosed</span> to our users. Your trust is more valuable than any partnership.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <NuxtLink
              to="/contact"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-600 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              <span>Get in touch</span>
            </NuxtLink>
            <NuxtLink
              to="/partnerships"
              class="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-8 py-3.5 text-base font-semibold text-blue-600 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
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
