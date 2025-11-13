<template>
  <div class="min-h-screen">
    <!-- 1. Utility Trust Strip (very top) -->
    <TopNoticeBar @open-modal="modalOpen = true" />

    <!-- Sticky Compare Bar (shows on scroll) -->
    <StickyCompareBar />

    <!-- 2. Header / Nav (handled by layout) -->

    <!-- 3. Hero: Converter (primary job to be done) -->
    <HeroDualTab ref="heroDualTabRef" />

    <!-- 4. Top 3 live results preview (right under hero) -->
    <FeaturedProvidersDynamic />

    <!-- 4b. Remit-Score explanation -->
    <RemitScoreBanner />

    <!-- 5. Trust metrics strip (compact) -->
    <TrustMetricsStrip />

    <!-- 6. Popular corridor chips -->
    <CorridorsGridDynamic @corridor-selected="handleCorridorSelected" />

    <!-- 7. How it works (3 steps) -->
    <HowItWorks />

    <!-- 8. The story behind Remit-Scout (Omar's story) -->
    <FounderStory />

    <!-- 9. Why comparing saves you money (mini explainer) -->
    <BankVsSpecialistDynamic />

    <!-- 10. Exchange-rate history + Rate alerts (together) -->
    <RateAlertForm />

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
import TopNoticeBar from '~/components/home/TopNoticeBar.vue'
import StickyCompareBar from '~/components/home/StickyCompareBar.vue'
import HeroDualTab from '~/components/home/HeroDualTab.vue'
import RemitScoreBanner from '~/components/home/RemitScoreBanner.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import HowItWorks from '~/components/home/HowItWorks.vue'
import FounderStory from '~/components/home/FounderStory.vue'
import HowWeMakeMoneyModal from '~/components/shared/HowWeMakeMoneyModal.vue'
import { setSeo } from '~/composables/useSeo'
import { useStructuredData } from '~/composables/useStructuredData'

const CorridorsGridDynamic = defineAsyncComponent(() => import('~/components/home/CorridorsGridDynamic.vue'))
const BankVsSpecialistDynamic = defineAsyncComponent(() => import('~/components/home/BankVsSpecialistDynamic.vue'))
const FeaturedProvidersDynamic = defineAsyncComponent(() => import('~/components/home/FeaturedProvidersDynamic.vue'))
const RateAlertForm = defineAsyncComponent(() => import('~/components/home/RateAlertForm.vue'))
const TravelToolsSection = defineAsyncComponent(() => import('~/components/home/TravelToolsSection.vue'))
const TestimonialsCarousel = defineAsyncComponent(() => import('~/components/home/TestimonialsCarousel.vue'))
const LatestGuides = defineAsyncComponent(() => import('~/components/home/LatestGuides.vue'))
const CountryGrid = defineAsyncComponent(() => import('~/components/home/CountryGrid.vue'))
const HomeFaq = defineAsyncComponent(() => import('~/components/home/HomeFaq.vue'))
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
  title: 'Remit-Scout — Compare International Money Transfer Services & Save on Fees',
  description: 'Compare live rates, fees and delivery speed from 30+ licensed providers. Find the best way to support your family abroad.',
  canonical: `${siteUrl}/`,
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
</script>
