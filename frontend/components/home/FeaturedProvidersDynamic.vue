<template>
  <section
    id="providers"
    class="py-16 sm:py-20 bg-white"
    aria-live="polite"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Heading -->
      <div class="mb-12">
        <div class="mb-4">
          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
            Compare money transfer providers for your corridor
          </h2>
          <p class="text-base sm:text-lg text-neutral-600 max-w-4xl leading-relaxed">
            We collect quotes, standardize fees and FX markup into comparable numbers, and rank by delivered outcome. Every quote is timestamped, and refresh cadence varies by corridor and data source.
          </p>
        </div>
      </div>

      <!-- Loading state -->
      <div
        v-if="pending"
        class="relative"
      >
        <div class="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div class="flex gap-6 pb-4">
            <div
              v-for="i in 4"
              :key="i"
              class="flex-shrink-0 w-[280px] sm:w-[320px] animate-pulse"
            >
              <div class="h-[320px] bg-neutral-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      <!-- Error or empty state -->
      <div
        v-else-if="!providers.length || error"
        class="rounded-2xl border border-neutral-200 bg-white p-8 text-center"
      >
        <p class="text-neutral-600">
          Provider information is temporarily unavailable. Please try again later.
        </p>
      </div>

      <!-- Provider cards horizontal scroll -->
      <div
        v-else-if="providers.length > 0"
        class="relative group/section"
      >
        <!-- Scroll container -->
        <div
          ref="scrollContainer"
          class="overflow-x-auto scrollbar-hide -mx-4 px-4 scroll-smooth snap-x snap-mandatory"
          @scroll="handleScroll"
        >
          <div class="flex gap-6 pb-4">
            <article
              v-for="provider in providers"
              :key="provider.id"
              class="flex-shrink-0 w-[280px] sm:w-[320px] bg-white border border-neutral-200 rounded-2xl shadow-md hover:shadow-xl hover:border-brand-600 transition-all duration-300 flex flex-col snap-start"
            >
              <!-- Header: Logo and Score -->
              <div class="px-6 pt-12 pb-10 flex items-center gap-4">
                <!-- Logo: 50% left -->
                <div class="w-1/2 flex items-center justify-start">
                  <img
                    v-if="provider.logoUrl"
                    :src="provider.logoUrl"
                    :alt="provider.name"
                    :class="[provider.logoSize || 'h-18 w-auto', 'object-contain flex-shrink-0']"
                  >
                  <ProviderLogo
                    v-else
                    :slug="provider.slug"
                    :alt="provider.name"
                    :class="provider.logoSize || 'h-18 w-auto'"
                  />
                </div>
                <!-- Score: 50% right -->
                <div class="w-1/2 flex flex-col items-end justify-center gap-1">
                  <ScoreBadge :score="provider.remitScore || 0" />
                  <span class="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    Remit-Score
                  </span>
                </div>
              </div>

              <!-- Metrics Breakdown -->
              <div class="px-6 pb-12 space-y-6 flex-1">
                <div
                  v-for="metric in provider.metrics"
                  :key="metric.label"
                  class="flex items-center justify-between border-b border-neutral-100 pb-5 text-sm last:border-b-0 last:pb-0"
                >
                  <span class="text-neutral-600">
                    {{ metric.label }}
                  </span>
                  <span class="font-semibold text-neutral-900">
                    {{ metric.value }}
                  </span>
                </div>
              </div>

              <!-- CTA -->
              <div class="px-6 pb-12 mt-auto">
                <NuxtLink
                  :to="`/learn/providers/${provider.slug}`"
                  class="block w-full rounded-lg bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
                >
                  Read Full Review
                </NuxtLink>
              </div>
            </article>
          </div>
        </div>
      </div>

      <!-- Navigation controls -->
      <div class="flex items-center justify-center gap-4 mt-6">
        <button
          v-if="canScrollLeft"
          class="p-2 rounded-full border border-neutral-300 hover:border-brand-600 hover:bg-brand-50 transition-colors"
          aria-label="Previous providers"
          @click="scrollLeft"
        >
          <svg
            class="w-5 h-5 text-neutral-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <!-- Pagination dots -->
        <div class="flex items-center gap-2">
          <button
            v-for="(dot, index) in totalPages"
            :key="index"
            :aria-label="`Go to page ${index + 1}`"
            :aria-current="currentPage === index + 1 ? 'true' : 'false'"
            :class="[
              'h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-1',
              currentPage === index + 1
                ? 'w-8 bg-brand-600'
                : 'w-2 bg-neutral-300 hover:bg-neutral-400',
            ]"
            @click="scrollToPage(index)"
          />
        </div>

        <button
          v-if="canScrollRight"
          class="p-2 rounded-full border border-neutral-300 hover:border-brand-600 hover:bg-brand-50 transition-colors"
          aria-label="Next providers"
          @click="scrollRight"
        >
          <svg
            class="w-5 h-5 text-neutral-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useApi } from '~/composables/useApi'
import ProviderLogo from '~/components/shared/ProviderLogo.vue'
import ScoreBadge from '~/components/shared/ScoreBadge.vue'
import { PROVIDER_SCORES } from '~/lib/providerScores'

type ProviderMetadata = {
  id: string
  slug: string
  name: string
  type: string
  remitScore: number
  logo?: { sm?: string }
  scoreBreakdown?: {
    deliveredValue: number
    reliability: number
    frictionSpeed: number
    supportRefunds: number
    trustSafety: number
  }
}

type MetricRow = {
  label: string
  value: string
}

const { request } = useApi()

const { data, pending, error } = await useAsyncData(
  'provider-metadata-featured',
  async () => {
    try {
      return await request<{ data: ProviderMetadata[] }>('/providers/metadata')
    }
    catch (error: any) {
      if (error?.statusCode === 401 || error?.statusCode === 403 || error?.statusCode === 500) {
        return { data: [] }
      }
      throw error
    }
  },
  { watch: [] },
)

const labelForMetric = (
  value: number | undefined,
  kind: 'delivered' | 'reliability' | 'speed' | 'support' | 'trust',
) => {
  if (value === undefined) {
    if (kind === 'delivered') return 'Competitive'
    if (kind === 'speed') return 'Good'
    return 'Strong'
  }

  // Convert 0-1 scale to 0-10 scale (matching ProviderScoreModal logic)
  const score = value * 10

  if (kind === 'speed') {
    return score >= 9.0 ? 'Elite' : score >= 8.5 ? 'Strong' : score >= 7.5 ? 'Good' : 'Fair'
  }

  if (kind === 'delivered') {
    return score >= 8.5 ? 'Competitive' : score >= 7.5 ? 'Good' : 'Fair'
  }

  // For reliability, support, and trust
  return score >= 8.5 ? 'Strong' : score >= 7.5 ? 'Good' : 'Fair'
}

// Individual logo sizing based on aspect ratios
const getLogoSize = (slug: string): string => {
  const sizeMap: Record<string, string> = {
    'wise': 'h-12 w-auto', // viewBox 219.7x50 (4.4:1) - wide
    'remitly': 'h-18 w-auto', // viewBox 1000x428 (2.3:1) - moderate width
    'worldremit': 'h-18 w-auto', // viewBox 1062x326 (3.3:1) - wide
    'western-union': 'h-12 w-auto', // viewBox 299.7x70 (4.3:1) - very wide
    'westernunion': 'h-12 w-auto', // same as above
    'xe-money': 'h-16 w-auto', // viewBox 600x484 (1.24:1) - almost square
    'xe': 'h-16 w-auto', // same as above
  }
  const normalizedSlug = slug.toLowerCase().trim()
  return sizeMap[normalizedSlug] || 'h-18 w-auto'
}

const providers = computed(() => {
  const list = data.value?.data || []

  // Create lookup maps for PROVIDER_SCORES (source of truth)
  const scoreLookup = new Map(
    Object.values(PROVIDER_SCORES).map(provider => [provider.id, provider]),
  )
  const scoreBySlug = new Map(
    Object.values(PROVIDER_SCORES).map(provider => [provider.slug, provider]),
  )

  return [...list]
    .filter(provider => provider.id !== 'wellsfargo' && provider.slug !== 'wells-fargo')
    .map((provider) => {
      // Get score from PROVIDER_SCORES (source of truth) - matches individual provider pages
      const scoreSource = scoreLookup.get(provider.id) || scoreBySlug.get(provider.slug)
      const remitScore = scoreSource?.remitScore ?? provider.remitScore ?? 0

      // Use scoreBreakdown from PROVIDER_SCORES if available, otherwise from API
      const breakdown = scoreSource?.scoreBreakdown || provider.scoreBreakdown
      const metrics: MetricRow[] = [
        { label: 'Delivered Value', value: labelForMetric(breakdown?.deliveredValue, 'delivered') },
        { label: 'Reliability', value: labelForMetric(breakdown?.reliability, 'reliability') },
        { label: 'Speed', value: labelForMetric(breakdown?.frictionSpeed, 'speed') },
        { label: 'Support', value: labelForMetric(breakdown?.supportRefunds, 'support') },
        { label: 'Trust & Safety', value: labelForMetric(breakdown?.trustSafety, 'trust') },
      ]

      return {
        ...provider,
        remitScore, // Use score from PROVIDER_SCORES (matches individual provider pages)
        logoUrl: provider.logo?.sm,
        logoSize: getLogoSize(provider.slug),
        typeLabel: provider.type?.replace(/_/g, ' ') || 'Provider',
        metrics,
      }
    })
    .filter(provider => provider.remitScore > 0) // Only show providers with valid scores
    .sort((a, b) => (b.remitScore || 0) - (a.remitScore || 0))
    .slice(0, 12)
})

const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const currentPage = ref(1)

const getCardWidth = () => {
  if (typeof window === 'undefined') return 320
  return window.innerWidth >= 640 ? 320 : 280
}

const totalPages = computed(() => {
  if (!scrollContainer.value || providers.value.length === 0) return 1
  const container = scrollContainer.value
  const visibleWidth = container.clientWidth

  if (visibleWidth <= 0) return 1

  // Calculate based on card width + gap
  // Cards are w-[280px] sm:w-[320px] with gap-6 (24px)
  const cardWidth = getCardWidth()
  const gap = 24
  const cardWidthWithGap = cardWidth + gap
  const cardsPerPage = Math.floor(visibleWidth / cardWidthWithGap) || 1
  const totalCards = providers.value.length
  const pages = Math.ceil(totalCards / cardsPerPage)

  return Math.max(1, pages)
})

const handleScroll = () => {
  if (!scrollContainer.value) return
  const container = scrollContainer.value
  canScrollLeft.value = container.scrollLeft > 0
  canScrollRight.value = container.scrollLeft < container.scrollWidth - container.clientWidth - 10

  const visibleWidth = container.clientWidth
  if (visibleWidth <= 0) return

  const cardWidth = getCardWidth()
  const gap = 24
  const cardWidthWithGap = cardWidth + gap
  const cardsPerPage = Math.floor(visibleWidth / cardWidthWithGap) || 1
  const scrollAmountPerPage = cardsPerPage * cardWidthWithGap

  const scrollPosition = container.scrollLeft
  const maxScroll = container.scrollWidth - container.clientWidth
  const threshold = 10

  if (scrollPosition >= maxScroll - threshold) {
    currentPage.value = totalPages.value
  }
  else {
    const currentPageIndex = Math.round(scrollPosition / scrollAmountPerPage)
    currentPage.value = Math.min(Math.max(1, currentPageIndex + 1), totalPages.value)
  }
}

const scrollLeft = () => {
  if (!scrollContainer.value) return
  const container = scrollContainer.value
  const cardWidth = getCardWidth()
  const gap = 24
  const cardWidthWithGap = cardWidth + gap
  const visibleWidth = container.clientWidth
  const cardsPerPage = Math.floor(visibleWidth / cardWidthWithGap) || 1
  const scrollAmount = cardsPerPage * cardWidthWithGap
  const currentScroll = container.scrollLeft
  const targetScroll = Math.max(0, currentScroll - scrollAmount)
  container.scrollTo({ left: targetScroll, behavior: 'smooth' })
}

const scrollRight = () => {
  if (!scrollContainer.value) return
  const container = scrollContainer.value
  const cardWidth = getCardWidth()
  const gap = 24
  const cardWidthWithGap = cardWidth + gap
  const visibleWidth = container.clientWidth
  const cardsPerPage = Math.floor(visibleWidth / cardWidthWithGap) || 1
  const scrollAmount = cardsPerPage * cardWidthWithGap
  const currentScroll = container.scrollLeft
  const maxScroll = container.scrollWidth - container.clientWidth
  const targetScroll = Math.min(maxScroll, currentScroll + scrollAmount)
  container.scrollTo({ left: targetScroll, behavior: 'smooth' })
}

const scrollToPage = (pageIndex: number) => {
  if (!scrollContainer.value) return
  const container = scrollContainer.value
  const visibleWidth = container.clientWidth
  const cardWidth = getCardWidth()
  const gap = 24
  const cardWidthWithGap = cardWidth + gap
  const cardsPerPage = Math.floor(visibleWidth / cardWidthWithGap) || 1
  const scrollAmount = cardsPerPage * cardWidthWithGap
  const maxScroll = container.scrollWidth - container.clientWidth
  const targetScroll = Math.min(Math.max(0, pageIndex * scrollAmount), maxScroll)
  container.scrollTo({ left: targetScroll, behavior: 'smooth' })
}

const lastUpdated = computed(() => {
  if (!data.value) return 'recently'
  const now = Date.now()
  return 'recently'
})

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    if (scrollContainer.value) {
      handleScroll()

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          handleScroll()
        })
        resizeObserver.observe(scrollContainer.value as unknown as Element)
      }
    }
  })
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

watch(providers, () => {
  nextTick(() => {
    if (scrollContainer.value) {
      handleScroll()
    }
  })
}, { immediate: false })
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
