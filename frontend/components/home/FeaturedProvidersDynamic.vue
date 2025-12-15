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
          <p class="text-base sm:text-lg text-neutral-600 max-w-4xl">
            We collect quotes, standardize fees and FX markup into comparable numbers, and rank by delivered outcome. Every quote is timestamped, and refresh cadence varies by corridor and data source.
          </p>
          <div class="flex flex-wrap items-center gap-4 mt-4">
            <p class="text-sm text-neutral-500">
              Last updated: {{ lastUpdated }}
            </p>
            <div class="flex flex-wrap items-center gap-3 text-sm">
              <NuxtLink
                to="/methodology"
                class="text-neutral-600 hover:text-neutral-900 font-medium"
              >
                Methodology
              </NuxtLink>
              <span class="text-neutral-300">•</span>
              <NuxtLink
                to="/how-we-make-money"
                class="text-neutral-600 hover:text-neutral-900 font-medium"
              >
                How we make money
              </NuxtLink>
              <span class="text-neutral-300">•</span>
              <NuxtLink
                to="/contact"
                class="text-neutral-600 hover:text-neutral-900 font-medium"
              >
                Report an issue
              </NuxtLink>
              <span class="text-neutral-300">•</span>
              <NuxtLink
                to="/contact"
                class="text-neutral-600 hover:text-neutral-900 font-medium"
              >
                Contact
              </NuxtLink>
            </div>
          </div>
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
              <div class="h-[500px] bg-neutral-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      <!-- Provider cards horizontal scroll -->
      <div
        v-else
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
              v-for="provider in sortedProviders"
              :key="provider.id"
              class="flex-shrink-0 w-[280px] sm:w-[320px] bg-white border border-neutral-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col snap-start"
            >
              <!-- Score Badge at top center with circular progress -->
              <div class="flex justify-center pt-6 pb-4">
                <div class="relative w-16 h-16">
                  <svg class="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="#e5e7eb"
                      stroke-width="4"
                      fill="none"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      :stroke="getScoreColor(provider.score)"
                      stroke-width="4"
                      fill="none"
                      :stroke-dasharray="`${(provider.score / 10) * 175.93} 175.93`"
                      stroke-linecap="round"
                      class="transition-all duration-500"
                    />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span
                      class="text-xl font-bold"
                      :class="getScoreTextClass(provider.score)"
                    >
                      {{ provider.score.toFixed(1) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Provider Logo -->
              <div class="px-6 pb-6 text-center">
                <img
                  v-if="provider.logoUrl"
                  :src="provider.logoUrl"
                  :alt="provider.name"
                  class="h-10 mx-auto object-contain"
                >
                <h3
                  v-else
                  class="text-lg font-bold text-neutral-900"
                >
                  {{ provider.name }}
                </h3>
              </div>

              <!-- Find Out More Link -->
              <div class="px-6 pb-6 text-center">
                <NuxtLink
                  :to="`/providers/${provider.id || provider.name.toLowerCase().replace(/\s+/g, '-')}`"
                  class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 rounded-md px-2 py-1"
                >
                  <span>Find out more</span>
                  <svg
                    class="h-4 w-4"
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
                </NuxtLink>
              </div>

              <!-- Metrics with Progress Bars -->
              <div class="px-6 pb-6 space-y-4 flex-1">
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-neutral-700 font-medium">Delivered Value</span>
                    <span class="font-bold text-neutral-900">{{ ((provider.scoreBreakdown?.reliability || provider.reliability || 0.9) * 10).toFixed(1) }}</span>
                  </div>
                  <div class="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full transition-all duration-500"
                      :style="{ width: `${(provider.scoreBreakdown?.reliability || provider.reliability || 0.9) * 100}%` }"
                    />
                  </div>
                </div>

                <div class="space-y-1">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-neutral-700 font-medium">Reliability & Success</span>
                    <span class="font-bold text-neutral-900">{{ ((provider.scoreBreakdown?.coverage || 0.85) * 10).toFixed(1) }}</span>
                  </div>
                  <div class="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full transition-all duration-500"
                      :style="{ width: `${(provider.scoreBreakdown?.coverage || 0.85) * 100}%` }"
                    />
                  </div>
                </div>

                <div class="space-y-1">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-neutral-700 font-medium">Friction & Speed</span>
                    <span class="font-bold text-neutral-900">{{ ((provider.scoreBreakdown?.cost || (1 - provider.marginPct / 10)) * 10).toFixed(1) }}</span>
                  </div>
                  <div class="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full transition-all duration-500"
                      :style="{ width: `${(provider.scoreBreakdown?.cost || (1 - provider.marginPct / 10)) * 100}%` }"
                    />
                  </div>
                </div>

                <div class="space-y-1">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-neutral-700 font-medium">Support & Refunds</span>
                    <span class="font-bold text-neutral-900">{{ ((provider.scoreBreakdown?.speed || provider.reliability || 0.9) * 10).toFixed(1) }}</span>
                  </div>
                  <div class="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full transition-all duration-500"
                      :style="{ width: `${(provider.scoreBreakdown?.speed || provider.reliability || 0.9) * 100}%` }"
                    />
                  </div>
                </div>
              </div>

              <!-- CTAs -->
              <div class="px-6 pb-6 space-y-3">
                <a
                  :href="`/go/${provider.id}`"
                  target="_blank"
                  rel="nofollow"
                  class="block w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-3 text-center transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
                >
                  Go to {{ provider.name }}
                </a>
                <p class="text-xs text-neutral-500 text-center">
                  We may earn a commission. Rankings are independent.
                </p>
                <NuxtLink
                  :to="`/providers/${provider.id}`"
                  class="block w-full text-sm font-medium text-brand-600 hover:text-brand-700 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 rounded"
                >
                  Read the full review
                </NuxtLink>
              </div>
            </article>
          </div>
        </div>

        <!-- Navigation arrows (visible on hover on desktop) -->
        <button
          v-if="canScrollLeft"
          class="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white border border-neutral-300 hover:border-brand-600 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 opacity-0 group-hover/section:opacity-100"
          aria-label="Previous providers"
          @click="scrollLeft"
        >
          <svg
            class="h-5 w-5 text-neutral-600"
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

        <button
          v-if="canScrollRight"
          class="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white border border-neutral-300 hover:border-brand-600 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 opacity-0 group-hover/section:opacity-100"
          aria-label="Next providers"
          @click="scrollRight"
        >
          <svg
            class="h-5 w-5 text-neutral-600"
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

      <!-- Pagination Indicators (Mobile) -->
      <div
        class="flex lg:hidden items-center justify-center gap-2 mt-6"
        role="navigation"
        aria-label="Provider carousel pagination"
      >
        <span class="text-xs text-neutral-600 font-medium">
          {{ currentPage }}/{{ totalPages }}
        </span>
        <div class="flex items-center gap-1.5 mx-2">
          <button
            v-for="(dot, index) in totalPages"
            :key="index"
            :aria-label="`Go to page ${index + 1}`"
            :aria-current="currentPage === index + 1 ? 'true' : 'false'"
            :class="[
              'w-2 h-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-1',
              currentPage === index + 1
                ? 'bg-brand-600 w-6'
                : 'bg-neutral-300 hover:bg-neutral-400',
            ]"
            @click="scrollToPage(index)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRemittanceApi } from '~/composables/useRemittanceApi'
import { useCompareForm } from '~/composables/useCompareForm'

const props = defineProps<{
  from?: string
  to?: string
  amount?: number
  method?: 'bank' | 'cash' | 'wallet'
}>()

const { form } = useCompareForm()

const from = computed(() => props.from || form.value.from || 'US')
const to = computed(() => props.to || form.value.to || 'PH')
const amount = computed(() => props.amount || form.value.amount || 500)
const method = computed(() => props.method || form.value.method || 'bank')

const sortBy = ref<'recipient' | 'fee' | 'speed' | 'rating'>('rating')

const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)

const { useProviders, attachRatings } = useRemittanceApi()

const { data, pending } = await useProviders(from.value, to.value, amount.value, method.value)

const ratedProviders = computed(() => {
  if (!data.value?.data) return []
  return attachRatings(data.value.data)
})

const sortedProviders = computed(() => {
  const providers = [...ratedProviders.value]

  switch (sortBy.value) {
    case 'fee':
      return providers.sort((a, b) => a.fee - b.fee)
    case 'speed':
      return providers.sort((a, b) => {
        const getHours = (delivery: string) => {
          if (delivery.includes('min')) return 0.5
          if (delivery.includes('same day')) return 8
          if (delivery.includes('day')) return 24
          return 48
        }
        return getHours(a.delivery) - getHours(b.delivery)
      })
    case 'rating':
      return providers.sort((a, b) => b.score - a.score)
    default:
      return providers.sort((a, b) => b.recipientGets - a.recipientGets)
  }
})

const handleScroll = () => {
  if (!scrollContainer.value) return

  const container = scrollContainer.value
  canScrollLeft.value = container.scrollLeft > 0
  canScrollRight.value = container.scrollLeft < container.scrollWidth - container.clientWidth - 10

  // Calculate current page for pagination
  const scrollPosition = container.scrollLeft
  const visibleWidth = container.clientWidth
  const totalScrollWidth = container.scrollWidth

  // Calculate total pages based on visible width
  totalPages.value = Math.ceil(totalScrollWidth / visibleWidth)

  // Calculate current page (add small buffer to handle snap scrolling)
  currentPage.value = Math.min(
    Math.round(scrollPosition / visibleWidth) + 1,
    totalPages.value,
  )
}

const scrollLeft = () => {
  if (!scrollContainer.value) return
  const cardWidth = 320 + 24
  scrollContainer.value.scrollBy({ left: -cardWidth, behavior: 'smooth' })
}

const scrollRight = () => {
  if (!scrollContainer.value) return
  const cardWidth = 320 + 24
  scrollContainer.value.scrollBy({ left: cardWidth, behavior: 'smooth' })
}

const scrollToPage = (pageIndex: number) => {
  if (!scrollContainer.value) return
  const container = scrollContainer.value
  const visibleWidth = container.clientWidth
  const maxScroll = container.scrollWidth - container.clientWidth

  // Calculate target scroll position, clamped to max scroll
  const targetScroll = Math.min(pageIndex * visibleWidth, maxScroll)

  container.scrollTo({ left: targetScroll, behavior: 'smooth' })
}

const getScoreColor = (score: number) => {
  if (score >= 9.0) return '#10b981'
  if (score >= 8.0) return '#3b82f6'
  if (score >= 7.0) return '#eab308'
  return '#ef4444'
}

const getScoreTextClass = (score: number) => {
  if (score >= 9.0) return 'text-green-600'
  if (score >= 8.0) return 'text-blue-600'
  if (score >= 7.0) return 'text-yellow-600'
  return 'text-red-600'
}

const lastUpdated = computed(() => {
  const now = new Date()
  return now.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
})

onMounted(() => {
  if (scrollContainer.value) {
    handleScroll()
  }
})

onUnmounted(() => {
})
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
