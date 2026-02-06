<template>
  <section class="py-12 sm:py-16 bg-neutral-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Remit-Score breakdown
          </p>
          <h2 class="text-2xl sm:text-3xl font-bold text-neutral-900">
            How top providers score today
          </h2>
          <p class="text-sm text-neutral-600">
            Delivered value, reliability, speed, support, and trust in one view.
          </p>
        </div>
        <div class="text-xs text-neutral-500">
          Updated {{ updatedLabel }}
        </div>
      </div>

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
              <div class="h-[360px] bg-neutral-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="!providers.length || error"
        class="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600"
      >
        Provider scores are unavailable right now. Try again in a moment.
      </div>

      <div
        v-else
        class="relative group/section"
      >
        <div
          ref="scrollContainer"
          class="overflow-x-auto scrollbar-hide -mx-4 px-4 scroll-smooth snap-x snap-mandatory"
          @scroll="handleScroll"
        >
          <div class="flex gap-6 pb-4">
            <article
              v-for="provider in providers"
              :key="provider.id"
              class="flex-shrink-0 w-[280px] sm:w-[320px] bg-white border border-neutral-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col snap-start"
            >
              <div class="flex items-center justify-between gap-3 px-6 pt-6">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-full bg-white ring-1 ring-neutral-200 flex items-center justify-center overflow-hidden">
                    <img
                      v-if="provider.logoUrl"
                      :src="provider.logoUrl"
                      :alt="provider.name"
                      class="h-8 w-8 object-contain"
                    >
                    <ProviderLogo
                      v-else
                      :slug="provider.slug"
                      :alt="provider.name"
                      class="h-8 w-8"
                    />
                  </div>
                  <div>
                    <p class="text-base font-semibold text-neutral-900">
                      {{ provider.name }}
                    </p>
                    <p class="text-xs text-neutral-500">
                      {{ provider.typeLabel }}
                    </p>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <ScoreBadge :score="provider.remitScore || 0" />
                  <span class="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    Remit-Score
                  </span>
                </div>
              </div>

              <div class="px-6 pt-5 space-y-3">
                <div
                  v-for="metric in provider.metrics"
                  :key="metric.label"
                  class="flex items-center justify-between border-b border-neutral-100 pb-2 text-sm last:border-b-0 last:pb-0"
                >
                  <span class="text-neutral-600">
                    {{ metric.label }}
                  </span>
                  <span class="font-semibold text-neutral-900">
                    {{ metric.value }}
                  </span>
                </div>
              </div>

              <div class="px-6 py-6 mt-auto">
                <NuxtLink
                  :to="`/learn/providers/${provider.slug}`"
                  class="block w-full rounded-lg border border-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
                >
                  Read Full Review
                </NuxtLink>
              </div>
            </article>
          </div>
        </div>

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
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import ProviderLogo from '~/components/shared/ProviderLogo.vue'
import ScoreBadge from '~/components/shared/ScoreBadge.vue'

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
  'provider-metadata-carousel',
  () => request<{ data: ProviderMetadata[] }>('/providers/metadata'),
  { watch: [] },
)

const labelForMetric = (
  value: number | undefined,
  kind: 'delivered' | 'reliability' | 'speed' | 'support' | 'trust',
) => {
  if (value === undefined) {
    if (kind === 'delivered') return 'Competitive'
    if (kind === 'speed' || kind === 'support') return 'Good'
    return 'Strong'
  }

  if (kind === 'delivered') {
    return value >= 0.85 ? 'Competitive' : value >= 0.75 ? 'Good' : 'Fair'
  }

  if (kind === 'speed' || kind === 'support') {
    return value >= 0.85 ? 'Good' : value >= 0.75 ? 'Fair' : 'Limited'
  }

  return value >= 0.85 ? 'Strong' : value >= 0.75 ? 'Good' : 'Fair'
}

const providers = computed(() => {
  const list = data.value?.data || []
  return [...list]
    .map((provider) => {
      const breakdown = provider.scoreBreakdown
      const metrics: MetricRow[] = [
        { label: 'Delivered Value', value: labelForMetric(breakdown?.deliveredValue, 'delivered') },
        { label: 'Reliability', value: labelForMetric(breakdown?.reliability, 'reliability') },
        { label: 'Speed', value: labelForMetric(breakdown?.frictionSpeed, 'speed') },
        { label: 'Support', value: labelForMetric(breakdown?.supportRefunds, 'support') },
        { label: 'Trust & Safety', value: labelForMetric(breakdown?.trustSafety, 'trust') },
      ]

      return {
        ...provider,
        logoUrl: provider.logo?.sm,
        typeLabel: provider.type?.replace(/_/g, ' ') || 'Provider',
        metrics,
      }
    })
    .sort((a, b) => (b.remitScore || 0) - (a.remitScore || 0))
})

const fetchedAt = ref<number | null>(null)

watch(
  () => data.value,
  (value) => {
    if (value) {
      fetchedAt.value = Date.now()
    }
  },
  { immediate: true },
)

const updatedLabel = computed(() => {
  if (!fetchedAt.value) return 'recently'
  const seconds = Math.round((Date.now() - fetchedAt.value) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
})

const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const handleScroll = () => {
  if (!scrollContainer.value) return
  const container = scrollContainer.value
  canScrollLeft.value = container.scrollLeft > 0
  canScrollRight.value = container.scrollLeft < container.scrollWidth - container.clientWidth - 10
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

onMounted(() => {
  if (scrollContainer.value) {
    handleScroll()
  }
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
