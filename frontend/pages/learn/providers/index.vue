<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative bg-gradient-to-b from-neutral-50 via-white to-white py-16 lg:py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-10 text-center">
          <h1 class="text-4xl font-bold leading-tight sm:text-5xl mb-4">
            <span class="text-neutral-900">Supported</span>
            <span class="text-brand-600"> Money Transfer </span>
            <span class="text-neutral-900">Providers</span>
          </h1>
          <p class="text-xl leading-relaxed text-neutral-600 mb-8">
            Compare trusted money transfer providers with Remit-Scout scores to find the best service for your needs. 
            Our data-driven methodology evaluates providers based on delivered value, reliability, and transparency.
          </p>

          <!-- Understanding Remit-Scout Scores -->
          <div class="bg-gray-900 border-2 border-gray-800 rounded-3xl p-8 lg:p-12">
            <div class="mb-8">
              <div class="w-full mb-6">
                <h2 class="text-2xl font-bold text-white mb-3">
                  How We Score Providers
                </h2>
                <p class="text-base text-white/90 mb-4 leading-relaxed">
                  Each provider gets a <span class="font-semibold text-brand-400">Remit-Score (0-10 scale)</span> based on real transfer data, not paid reviews. Scores like <span class="font-semibold text-white">9.5</span>, <span class="font-semibold text-white">8.4</span>, or <span class="font-semibold text-white">7.2</span> represent the overall quality and value you can expect when using that provider.
                </p>
                <p class="text-base text-white/90 mb-4 leading-relaxed">
                  Our methodology prioritizes what matters most: <strong class="text-white">how much money actually reaches your recipient</strong>. We analyze fees, exchange rate markups, and the total delivered amount. Providers cannot pay to rank higher—the score reflects real value.
                </p>
              </div>
            </div>

            <!-- Rating Categories & Weights -->
            <div class="mb-10">
              <h3 class="text-2xl font-bold text-white mb-8 text-center">
                Rating Categories & Weights
              </h3>
              
              <div class="space-y-4 w-full">
                <!-- Delivered Value - 40% -->
                <div class="flex w-full border-2 border-white/20 rounded-2xl bg-white/10 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <div class="bg-white/10 p-4 flex items-center justify-center flex-shrink-0 w-20">
                    <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                    <h4 class="font-bold text-white text-lg mb-2">Delivered Value</h4>
                    <p class="text-sm text-white/80 leading-relaxed">
                      Effective cost (FX spread + fees), how often provider is cheapest, quote vs. actual delivery accuracy
                    </p>
                  </div>
                  <div class="bg-brand-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                    <div class="text-4xl font-bold text-white mb-1">40%</div>
                    <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                  </div>
                </div>

                <!-- Reliability & Success - 20% -->
                <div class="flex w-full border-2 border-white/20 rounded-2xl bg-white/10 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <div class="bg-white/10 p-4 flex items-center justify-center flex-shrink-0 w-20">
                    <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                    <h4 class="font-bold text-white text-lg mb-2">Reliability & Success</h4>
                    <p class="text-sm text-white/80 leading-relaxed">
                      Quote success rate, data freshness, pricing stability (where available)
                    </p>
                  </div>
                  <div class="bg-brand-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                    <div class="text-4xl font-bold text-white mb-1">20%</div>
                    <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                  </div>
                </div>

                <!-- Friction & Speed - 15% -->
                <div class="flex w-full border-2 border-white/20 rounded-2xl bg-white/10 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <div class="bg-white/10 p-4 flex items-center justify-center flex-shrink-0 w-20">
                    <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                    <h4 class="font-bold text-white text-lg mb-2">Friction & Speed</h4>
                    <p class="text-sm text-white/80 leading-relaxed">
                      ETA where available, speed buckets, observed delivery times on selected corridors
                    </p>
                  </div>
                  <div class="bg-brand-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                    <div class="text-4xl font-bold text-white mb-1">15%</div>
                    <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                  </div>
                </div>

                <!-- Support & Refunds - 15% -->
                <div class="flex w-full border-2 border-white/20 rounded-2xl bg-white/10 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <div class="bg-white/10 p-4 flex items-center justify-center flex-shrink-0 w-20">
                    <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                    <h4 class="font-bold text-white text-lg mb-2">Support & Refunds</h4>
                    <p class="text-sm text-white/80 leading-relaxed">
                      Refund processing time, dispute resolution SLA, post-resolution satisfaction, chargeback rate
                    </p>
                  </div>
                  <div class="bg-brand-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                    <div class="text-4xl font-bold text-white mb-1">15%</div>
                    <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                  </div>
                </div>

                <!-- Trust & Safety - 10% -->
                <div class="flex w-full border-2 border-white/20 rounded-2xl bg-white/10 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <div class="bg-white/10 p-4 flex items-center justify-center flex-shrink-0 w-20">
                    <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1 p-6 flex flex-col justify-center min-w-0">
                    <h4 class="font-bold text-white text-lg mb-2">Trust & Safety</h4>
                    <p class="text-sm text-white/80 leading-relaxed">
                      Public licensing checks where available, regulatory register verification
                    </p>
                  </div>
                  <div class="bg-brand-600 p-6 flex flex-col items-center justify-center flex-shrink-0 w-32">
                    <div class="text-4xl font-bold text-white mb-1">10%</div>
                    <div class="text-xs text-white/90 uppercase tracking-wider font-semibold">Weight</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Text -->
            <div class="border-t-2 border-white/20 pt-6">
              <p class="text-base text-white/80 leading-relaxed">
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
import { computed } from 'vue'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import ProviderCard from '~/components/shared/ProviderCard.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import IndependenceBadge from '~/components/home/IndependenceBadge.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import HelpFooter from '~/components/home/HelpFooter.vue'
import HomeFaq from '~/components/home/HomeFaq.vue'
import { PROVIDER_SCORES } from '~/lib/providerScores'
import { useProviderMetadata } from '~/composables/useProviderMetadata'
import { setSeo, jsonLdBreadcrumb, jsonLdSiteNavigation } from '~/composables/useSeo'

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

const { data: providerMetadata } = await useProviderMetadata()

// Providers data - merge backend metadata with frontend scores to ensure all providers are shown
const allProviders = computed(() => {
  const metadata = providerMetadata.value || []
  const scoreLookup = new Map(
    Object.values(PROVIDER_SCORES).map(provider => [provider.id, provider]),
  )
  const scoreBySlug = new Map(
    Object.values(PROVIDER_SCORES).map(provider => [provider.slug, provider]),
  )

  // Create a map of providers from metadata (with backend data)
  const metadataMap = new Map(
    metadata.map(provider => [
      provider.id,
      {
        id: provider.id,
        slug: provider.slug,
        name: provider.displayName || provider.name,
        score: provider.remitScore ?? 0,
        scoreBreakdown: provider.scoreBreakdown,
        affiliateUrl: provider.affiliateUrl || undefined,
        url: provider.url || undefined,
      },
    ]),
  )

  // Add all providers from PROVIDER_SCORES, merging with metadata when available
  const allProvidersMap = new Map()
  
  Object.values(PROVIDER_SCORES).forEach(scoreProvider => {
    const existing = metadataMap.get(scoreProvider.id)
    if (existing) {
      // Use metadata version, but ensure score is from PROVIDER_SCORES (most up-to-date)
      allProvidersMap.set(scoreProvider.id, {
        ...existing,
        score: scoreProvider.remitScore,
        scoreBreakdown: scoreProvider.scoreBreakdown || existing.scoreBreakdown,
      })
    } else {
      // Provider not in metadata, use score data
      allProvidersMap.set(scoreProvider.id, {
        id: scoreProvider.id,
        slug: scoreProvider.slug,
        name: scoreProvider.name,
        score: scoreProvider.remitScore,
        scoreBreakdown: scoreProvider.scoreBreakdown,
      })
    }
  })

  // Also add any metadata providers that might not be in PROVIDER_SCORES yet
  metadata.forEach(provider => {
    if (!allProvidersMap.has(provider.id)) {
      const scoreSource = scoreLookup.get(provider.id) || scoreBySlug.get(provider.slug)
      allProvidersMap.set(provider.id, {
        id: provider.id,
        slug: provider.slug,
        name: provider.displayName || provider.name,
        score: provider.remitScore ?? scoreSource?.remitScore ?? 0,
        scoreBreakdown: provider.scoreBreakdown ?? scoreSource?.scoreBreakdown,
        affiliateUrl: provider.affiliateUrl || undefined,
        url: provider.url || undefined,
      })
    }
  })

  return Array.from(allProvidersMap.values()).filter(p => p.score > 0)
})

const filteredProviders = computed(() => {
  // Sort by remit-score (descending order)
  return [...allProviders.value].sort((a, b) => {
    const scoreA = a.score || 0
    const scoreB = b.score || 0
    return scoreB - scoreA
  })
})
</script>
