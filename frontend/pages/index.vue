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

    <!-- EEAT: Safety Notice -->
    <SafetyNotice />

    <!-- 6. Popular corridor chips -->
    <CorridorsGridDynamic @corridor-selected="handleCorridorSelected" />

    <!-- Educational comparison: Bank vs Specialist -->
    <BankVsSpecialistDynamic />

    <!-- 7. How it works (3 steps) -->
    <HowItWorks />

    <!-- 8. The story behind Remit-Scout (Omar's story) -->
    <FounderStory />

    <!-- EEAT: Why prices vary (user education) -->
    <WhyPricesVary />

    <!-- 9b. Remit-Scout Pulse (What's Moving Today) -->
    <PulseMiniTiles />

    <!-- 9c. Institutional teaser (subtle B2B signal) -->
    <InstitutionalTeaser />

    <!-- 10b. Remit-Scout Plus teaser (upgrade benefits) -->
    <PlusTeaser />

    <!-- 11. Testimonials (3 short, real quotes) -->
    <TestimonialsCarousel />

    <!-- 12. Education / Resources cards -->
    <LatestGuides />

    <!-- Travel Tools as part of resources -->
    <TravelToolsSection />

    <!-- 13. Countries coverage grid (154 countries) -->
    <CountryGrid />

    <!-- 14. FAQ (accordion, 5-7 items) -->
    <HomeFaq />

    <!-- 15. Newsletter signup (AFTER FAQ, before final CTA) -->
    <NewsletterSignup />

    <!-- EEAT: Help Footer (report issues, methodology, contact) -->
    <HelpFooter />

    <!-- 16. Final CTA band -->
    <CtaBanner />

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
import HowItWorks from '~/components/home/HowItWorks.vue'
import FounderStory from '~/components/home/FounderStory.vue'
import HowWeMakeMoneyModal from '~/components/shared/HowWeMakeMoneyModal.vue'
import TransparencyStrip from '~/components/home/TransparencyStrip.vue'
import WhyPricesVary from '~/components/home/WhyPricesVary.vue'
import IndependenceBadge from '~/components/home/IndependenceBadge.vue'
import SafetyNotice from '~/components/home/SafetyNotice.vue'
import HelpFooter from '~/components/home/HelpFooter.vue'
import PulseMiniTiles from '~/components/home/PulseMiniTiles.vue'
import InstitutionalTeaser from '~/components/home/InstitutionalTeaser.vue'
import PlusTeaser from '~/components/home/PlusTeaser.vue'
import { setSeo, jsonLdSiteNavigation } from '~/composables/useSeo'
import { useStructuredData } from '~/composables/useStructuredData'

// SEO-critical components: import directly for SSR
import FeaturedProvidersDynamic from '~/components/home/FeaturedProvidersDynamic.vue'
import CorridorsGridDynamic from '~/components/home/CorridorsGridDynamic.vue'
import BankVsSpecialistDynamic from '~/components/home/BankVsSpecialistDynamic.vue'
import CountryGrid from '~/components/home/CountryGrid.vue'
import HomeFaq from '~/components/home/HomeFaq.vue'
import TestimonialsCarousel from '~/components/home/TestimonialsCarousel.vue'

// Below-fold components: can stay async for code-splitting
const TravelToolsSection = defineAsyncComponent(() => import('~/components/home/TravelToolsSection.vue'))
const LatestGuides = defineAsyncComponent(() => import('~/components/home/LatestGuides.vue'))
const CtaBanner = defineAsyncComponent(() => import('~/components/home/CtaBanner.vue'))
const NewsletterSignup = defineAsyncComponent(() => import('~/components/home/NewsletterSignup.vue'))

const modalOpen = ref(false)
const heroDualTabRef = ref<InstanceType<typeof HeroDualTab> | null>(null)

const handleCorridorSelected = (data: { from: string, to: string }) => {
  heroDualTabRef.value?.prefillMoneyForm({
    from: data.from,
    to: data.to,
  })
}

const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Remit-Scout, Compare International Money Transfer Services & Save on Fees',
  description: 'Compare current quotes, fees, and estimated delivery times across 30+ licensed providers. Find a better way to support family abroad.',
  canonical: `${siteUrl}/`,
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
  { name: 'Provider Reviews', url: `${siteUrl}/reviews` },
  { name: 'Exchange Rates', url: `${siteUrl}/exchange-rates` },
  { name: 'Guides', url: `${siteUrl}/learn` },
  { name: 'FAQ', url: `${siteUrl}/faq` },
])
</script>
