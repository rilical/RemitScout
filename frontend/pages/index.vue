<template>
  <div>
    <!-- Hero: Converter (primary job to be done) -->
    <HeroDualTab
      id="hero-dual-tab"
      ref="heroDualTabRef"
    />

    <!-- 4. Top 3 live results preview (right under hero) -->
    <FeaturedProvidersDynamic />

    <!-- 4b. Remit-Score explanation -->
    <RemitScoreBanner />

    <!-- EEAT: Transparency Strip (how we compare) -->
    <TransparencyStrip />

    <!-- 5. Trust metrics strip (compact) -->
    <TrustMetricsStrip />

    <!-- EEAT: Independence Badge -->
    <IndependenceBadge />

    <!-- 6. Popular corridor chips -->
    <AsyncErrorBoundary skeleton-height="160">
      <CorridorsGridDynamic @corridor-selected="handleCorridorSelected" />
    </AsyncErrorBoundary>

    <!-- Educational comparison: Bank vs Specialist -->
    <AsyncErrorBoundary skeleton-height="220">
      <BankVsSpecialistDynamic />
    </AsyncErrorBoundary>

    <!-- 7. How it works (3 steps) -->
    <AsyncErrorBoundary skeleton-height="220">
      <HowItWorks />
    </AsyncErrorBoundary>

    <!-- 8. The story behind Remit-Scout (Omar's story) -->
    <AsyncErrorBoundary skeleton-height="260">
      <FounderStory />
    </AsyncErrorBoundary>

    <!-- EEAT: Why prices vary (user education) -->
    <AsyncErrorBoundary skeleton-height="220">
      <WhyPricesVary />
    </AsyncErrorBoundary>

    <!-- 9b. Remit-Scout Pulse (What's Moving Today) -->
    <AsyncErrorBoundary
      v-if="pulseEnabled"
      skeleton-height="220"
    >
      <PulseTeaserSection />
    </AsyncErrorBoundary>

    <!-- 9c. Institutional teaser (subtle B2B signal) -->
    <AsyncErrorBoundary
      v-if="enterpriseEnabled"
      skeleton-height="180"
    >
      <InstitutionalTeaser />
    </AsyncErrorBoundary>

    <!-- 10b. Remit-Scout Plus teaser (upgrade benefits) -->
    <AsyncErrorBoundary skeleton-height="180">
      <PlusTeaser />
    </AsyncErrorBoundary>

    <!-- 11. Testimonials (3 short, real quotes) -->
    <AsyncErrorBoundary skeleton-height="240">
      <TestimonialsCarousel />
    </AsyncErrorBoundary>

    <!-- 12. Education / Resources cards -->
    <AsyncErrorBoundary skeleton-height="240">
      <LatestGuides />
    </AsyncErrorBoundary>

    <!-- Travel Tools as part of resources -->
    <AsyncErrorBoundary skeleton-height="240">
      <TravelToolsSection />
    </AsyncErrorBoundary>

    <!-- 13. Countries coverage grid (154 countries) -->
    <AsyncErrorBoundary skeleton-height="300">
      <CountryGrid />
    </AsyncErrorBoundary>

    <!-- 14. FAQ (accordion, 5-7 items) -->
    <AsyncErrorBoundary skeleton-height="240">
      <HomeFaq />
    </AsyncErrorBoundary>

    <!-- 15. Newsletter signup (AFTER FAQ, before final CTA) -->
    <AsyncErrorBoundary skeleton-height="180">
      <NewsletterSignup />
    </AsyncErrorBoundary>

    <!-- 16. Final CTA band -->
    <AsyncErrorBoundary skeleton-height="180">
      <CtaBanner />
    </AsyncErrorBoundary>

    <!-- 17. Footer (handled by layout) -->

    <!-- How We Make Money Modal -->
    <HowWeMakeMoneyModal
      :is-open="modalOpen"
      @update:is-open="modalOpen = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'
import HeroDualTab from '~/components/home/HeroDualTab.vue'
import RemitScoreBanner from '~/components/home/RemitScoreBanner.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import HowWeMakeMoneyModal from '~/components/shared/HowWeMakeMoneyModal.vue'
import AsyncErrorBoundary from '~/components/shared/AsyncErrorBoundary.vue'
import TransparencyStrip from '~/components/home/TransparencyStrip.vue'
import IndependenceBadge from '~/components/home/IndependenceBadge.vue'
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import { setSeo, jsonLdSiteNavigation } from '~/composables/useSeo'
import { useStructuredData } from '~/composables/useStructuredData'

// Above-fold components: import directly for SSR
import FeaturedProvidersDynamic from '~/components/home/FeaturedProvidersDynamic.vue'

// Below-fold components: async for code-splitting
const HowItWorks = defineAsyncComponent(() => import('~/components/home/HowItWorks.vue'))
const FounderStory = defineAsyncComponent(() => import('~/components/home/FounderStory.vue'))
const WhyPricesVary = defineAsyncComponent(() => import('~/components/home/WhyPricesVary.vue'))
const PulseTeaserSection = defineAsyncComponent(() => import('~/components/home/PulseTeaserSection.vue'))
const InstitutionalTeaser = defineAsyncComponent(() => import('~/components/home/InstitutionalTeaser.vue'))
const PlusTeaser = defineAsyncComponent(() => import('~/components/home/PlusTeaser.vue'))
const CorridorsGridDynamic = defineAsyncComponent(() => import('~/components/home/CorridorsGridDynamic.vue'))
const BankVsSpecialistDynamic = defineAsyncComponent(() => import('~/components/home/BankVsSpecialistDynamic.vue'))
const TestimonialsCarousel = defineAsyncComponent(() => import('~/components/home/TestimonialsCarousel.vue'))
const CountryGrid = defineAsyncComponent(() => import('~/components/home/CountryGrid.vue'))
const HomeFaq = defineAsyncComponent(() => import('~/components/home/HomeFaq.vue'))

// Below-fold components: async for code-splitting
const TravelToolsSection = defineAsyncComponent(() => import('~/components/home/TravelToolsSection.vue'))
const LatestGuides = defineAsyncComponent(() => import('~/components/home/LatestGuides.vue'))
const CtaBanner = defineAsyncComponent(() => import('~/components/home/CtaBanner.vue'))
const NewsletterSignup = defineAsyncComponent(() => import('~/components/home/NewsletterSignup.vue'))

const modalOpen = ref(false)
const heroDualTabRef = ref<InstanceType<typeof HeroDualTab> | null>(null)
const { pulseEnabled, enterpriseEnabled } = useFeatureFlags()

const handleCorridorSelected = (data: { from: string, to: string }) => {
  heroDualTabRef.value?.prefillMoneyForm({
    from: data.from,
    to: data.to,
  })
}

const { public: { siteUrl } } = useRuntimeConfig()

const seoTitle = 'Remit-Scout, Compare International Money Transfer Services & Save on Fees'
const seoDescription = 'Compare current quotes, fees, and estimated delivery times across 30+ licensed providers. Find a better way to support family abroad.'

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Compare Money Transfers',
    description: 'Live rates, fees, and delivery times across 30+ licensed providers.',
  },
})

useServerSeoMeta({
  title: seoTitle,
  description: seoDescription,
})

setSeo({
  title: seoTitle,
  description: seoDescription,
  canonical: `${siteUrl}/`,
  ogImage: false,
})

useHead({
  link: [
    { rel: 'preload', as: 'image', href: '/world.webp' },
  ],
})

// Initialize structured data
const {
  addOrganizationSchema,
  addRemittanceServiceSchema,
  addBreadcrumbSchema,
} = useStructuredData()

// Add homepage structured data
addOrganizationSchema()
addRemittanceServiceSchema()
addBreadcrumbSchema([
  { name: 'Home', url: `${siteUrl}/` },
])
jsonLdSiteNavigation([
  { name: 'Send Money', url: `${siteUrl}/send-money` },
  { name: 'Provider Reviews', url: `${siteUrl}/learn/providers` },
  { name: 'Exchange Rates', url: `${siteUrl}/exchange-rates` },
  { name: 'Guides', url: `${siteUrl}/learn` },
  { name: 'FAQ', url: `${siteUrl}/faq` },
])
</script>
