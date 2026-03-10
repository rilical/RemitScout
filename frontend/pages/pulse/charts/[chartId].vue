<template>
  <div class="min-h-screen bg-neutral-900">
    <!-- Header -->
    <div class="border-b border-neutral-700 bg-neutral-800">
      <div class="mx-auto max-w-page px-page-x py-4">
        <div class="flex items-center justify-between">
          <NuxtLink
            to="/pulse"
            class="flex items-center gap-2 text-neutral-400 hover:text-white motion-safe:transition-colors"
          >
            <svg
class="h-5 w-5"
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
            Back to Pulse
          </NuxtLink>

          <div class="flex items-center gap-3">
            <!-- View Mode Toggle -->
            <div class="hidden items-center gap-1 rounded-lg bg-neutral-700 p-1 sm:flex">
              <button
                class="text-body-sm flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium motion-safe:transition-colors"
                :class="
                  store.viewMode === 'sender'
                    ? 'bg-brand-600 text-white'
                    : 'text-neutral-400 hover:bg-neutral-600 hover:text-white'
                "
                @click="store.setViewMode('sender')"
              >
                <svg
class="h-3.5 w-3.5"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Sender
              </button>
              <button
                class="text-body-sm flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium motion-safe:transition-colors"
                :class="
                  store.viewMode === 'analyst'
                    ? 'bg-brand-600 text-white'
                    : 'text-neutral-400 hover:bg-neutral-600 hover:text-white'
                "
                @click="store.setViewMode('analyst')"
              >
                <svg
class="h-3.5 w-3.5"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Analyst
              </button>
            </div>

            <button
              v-if="pulseEmbedsEnabled"
              class="text-body-sm flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-700 px-4 py-2 text-white hover:bg-neutral-600 motion-safe:transition-colors"
              @click="showEmbedModal = true"
            >
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
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              Embed Snapshot
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Header -->
    <PulseFilterHeader
v-model="filters"
:last-updated="lastUpdated"
/>

    <!-- Main Content -->
    <div class="mx-auto max-w-page px-page-x py-8">
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <!-- Main Column -->
        <div class="space-y-8 lg:col-span-8">
          <!-- Full Chart -->
          <div ref="chartContainerRef">
            <PulseChartFull
              :chart-id="chartId"
              :filters="filters"
              :pulse-level="pulseLevel"
              :can-embed="pulseEmbedsEnabled"
              :initial-range="selectedChartRange"
              @embed="pulseEmbedsEnabled && (showEmbedModal = true)"
              @range-change="selectedChartRange = $event"
            />
          </div>

          <!-- Consumer Mode: Simple Takeaway -->
          <div
            v-if="store.viewMode === 'sender'"
            class="rounded-xl border border-neutral-700 bg-neutral-800 p-6"
          >
            <h3 class="text-body-lg mb-2 font-semibold text-white">Key Takeaway</h3>
            <p class="text-neutral-300">
              This chart shows how transfer costs have changed over time. Use this data to identify
              the best times to send money and save on fees.
            </p>
          </div>

          <!-- Analyst Mode: Actionable Insight Panel -->
          <div
v-else
class="overflow-hidden rounded-xl border border-brand-600/30 bg-brand-600/5"
>
            <div class="flex items-center justify-between border-b border-brand-600/20 px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
                  <svg
                    class="h-5 w-5 text-brand-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 class="text-body-lg font-bold text-white">Execution Guidance</h3>
                  <p class="text-body-sm text-neutral-400">Scenario guidance for this chart</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-body-sm font-mono text-neutral-500">Signal strength:</span>
                <span class="text-body-sm font-bold text-brand-600">{{ actionableInsight.confidence }}%</span>
              </div>
            </div>
            <div class="p-6">
              <div class="mb-4">
                <span
                  class="text-body-sm inline-flex items-center rounded-full bg-brand-600/20 px-3 py-1 font-semibold text-brand-600"
                >
                  {{ actionableInsight.signal }}
                </span>
              </div>
              <p class="leading-relaxed text-neutral-300">
                {{ actionableInsight.action }}
              </p>

              <!-- Export & Compliance Actions -->
              <div
                class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-700 pt-4"
              >
                <div class="flex items-center gap-3">
                  <p class="text-body-sm max-w-xl text-neutral-300">
                    Pulse exports are out of the current shipment scope. Use this page for live chart
                    review, and route embed or licensed-data requests through sales.
                  </p>
                </div>
                <NuxtLink
                  to="/contact?type=enterprise&topic=pulse"
                  class="text-body-sm font-medium text-brand-600 hover:text-brand-500 motion-safe:transition-colors"
                >
                  Institutional access →
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Analyst Mode: Data provenance -->
          <div
            v-if="store.viewMode === 'analyst'"
            class="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3"
          >
            <div class="text-body-sm flex flex-wrap items-center gap-4 text-neutral-500">
              <span class="font-semibold text-neutral-300">{{ provenanceLabel }}</span>
              <span>|</span>
              <span class="font-mono">{{ corridorContextLabel }}</span>
              <span>|</span>
              <span class="font-mono">{{ timeframeContextLabel }}</span>
            </div>
            <NuxtLink
              to="/methodology"
              class="text-body-sm font-medium text-neutral-400 hover:text-white motion-safe:transition-colors"
            >
              Methodology
            </NuxtLink>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6 lg:col-span-4">
          <!-- Related Charts -->
          <div class="rounded-xl border border-neutral-700 bg-neutral-800 p-6">
            <h3 class="text-body-lg mb-4 font-semibold text-white">Related Charts</h3>
            <div class="space-y-4">
              <NuxtLink
                v-for="chart in relatedCharts"
                :key="chart.id"
                :to="`/pulse/charts/${chart.id}?${queryString}`"
                class="block rounded-lg border border-neutral-700 bg-neutral-800 p-4 hover:border-brand-600 motion-safe:transition-colors"
              >
                <div
                  class="text-body-sm mb-1 font-semibold uppercase tracking-wider text-neutral-500"
                >
                  {{ chart.categoryLabel }}
                </div>
                <div class="font-medium text-white">{{ chart.title }}</div>
                <div class="text-body-sm mt-1 text-neutral-400">{{ chart.description }}</div>
              </NuxtLink>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="rounded-xl border border-neutral-700 bg-neutral-800 p-6">
            <h3 class="text-body-lg mb-4 font-semibold text-white">Quick Actions</h3>
            <div class="space-y-3">
              <NuxtLink
                :to="compareRatesUrl"
                class="flex items-center gap-3 rounded-lg bg-brand-600 px-4 py-3 text-white hover:bg-brand-700 motion-safe:transition-colors"
              >
                <svg
class="h-5 w-5"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="font-medium">Compare Rates Now</span>
              </NuxtLink>
              <button
                class="flex w-full items-center gap-3 rounded-lg border border-neutral-600 bg-neutral-700 px-4 py-3 text-white hover:bg-neutral-600 motion-safe:transition-colors"
                @click="handleSetAlert"
              >
                <svg
class="h-5 w-5"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span class="font-medium">Set Price Alert</span>
              </button>
            </div>
          </div>

          <!-- Enterprise Upsell -->
          <div
v-if="!isPro"
class="rounded-xl border border-brand-600/30 bg-brand-600/10 p-6"
>
            <div class="mb-3 flex items-center gap-2 text-brand-600">
              <svg
class="h-5 w-5"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              <span class="font-semibold">Remit-Scout Enterprise</span>
            </div>
            <p class="text-body-sm mb-4 text-neutral-300">
              Pulse chart access and static public embeds are available on Enterprise.
            </p>
            <NuxtLink
              to="/contact?type=enterprise&topic=pulse"
              class="text-body-sm inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 motion-safe:transition-colors"
            >
              Contact Sales
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
        </div>
      </div>
    </div>

    <PulseShareModal
      v-if="showEmbedModal"
      :chart-id="chartId"
      :filters="filters"
      :range="selectedChartRange"
      :chart-container-ref="getChartContainerElement()"
      @close="showEmbedModal = false"
    />

    <AuthPromptModal
      v-if="authModalOpen"
      :is-open="authModalOpen"
      feature="alert"
      title="Sign in to set alerts"
      message="Create a free account to set price alerts and get notified when conditions improve."
      @close="authModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { PulseFilters, AmountBucket, TimeRange } from '~/types/pulse'
import { getChartById, getRelatedCharts } from '~/lib/pulseChartRegistry'
import { getPulseOverview } from '~/lib/pulseApi'
import { usePulseStore } from '~/stores/pulse'
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import { useEntitlements } from '~/composables/useEntitlements'
import { setSeo } from '~/composables/useSeo'
import { useStructuredData } from '~/composables/useStructuredData'
import { getCorridorUrl } from '~/utils/country-slugs'

const AuthPromptModal = defineAsyncComponent(
  () => import('~/components/shared/AuthPromptModal.vue'),
)
const PulseShareModal = defineAsyncComponent(
  () => import('~/components/pulse/PulseShareModal.vue'),
)
const PulseChartFull = defineAsyncComponent(() => import('~/components/pulse/PulseChartFull.vue'))

const { pulseEnabled } = useFeatureFlags()

if (!pulseEnabled.value) {
  await navigateTo('/plus', { redirectCode: 302 })
}

const route = useRoute()
const store = usePulseStore()
const { isAuthenticated } = useAuth()
const saveAlertModal = useSaveAlertModal()
const { pulseLevel, pulseEmbedsEnabled } = useEntitlements()

const chartId = computed(() => route.params.chartId as string)

const chartMeta = computed(() => getChartById(chartId.value))

const normalizeChartRange = (value: unknown): TimeRange | null => {
  if (typeof value !== 'string') return null

  switch (value.trim().toLowerCase()) {
    case '24h':
    case '7d':
      return '7d'
    case '30d':
      return '30d'
    case '90d':
      return '90d'
    case '1y':
    case '365d':
    case 'max':
      return '365d'
    default:
      return null
  }
}

const resolveInitialChartRange = (): TimeRange => {
  return (
    normalizeChartRange(route.query.range)
    || normalizeChartRange(route.query.timeframe)
    || chartMeta.value?.defaultRange
    || '30d'
  )
}

const filters = ref<PulseFilters>({
  corridor: (route.query.corridor as string) || 'global',
  corridorId: (route.query.corridor_id as string) || store.corridor?.corridorId,
  amount: (Number.parseInt(route.query.amount as string, 10) as AmountBucket) || 200,
  fundingMethod: (route.query.fund as 'bank' | 'card' | 'cash') || 'bank',
  payoutMethod: (route.query.pay as 'bank' | 'cash' | 'wallet') || 'bank',
})

const isPlus = computed(() => pulseLevel.value !== 'none')
const isPro = computed(() => pulseLevel.value === 'full')
const lastUpdated = ref<string>('')
const showEmbedModal = ref(false)
const authModalOpen = ref(false)
const chartContainerRef = ref<HTMLDivElement | null>(null)
const selectedChartRange = ref<TimeRange>(resolveInitialChartRange())

function getChartContainerElement(): HTMLElement | null {
  return chartContainerRef.value instanceof HTMLElement ? chartContainerRef.value : null
}

const CHART_RANGE_LABELS: Record<TimeRange, string> = {
  '7d': '7D',
  '30d': '30D',
  '90d': '90D',
  '365d': '1Y',
}

watch(
  () => [chartId.value, route.query.timeframe, route.query.range],
  () => {
    selectedChartRange.value = resolveInitialChartRange()
  },
)

const relatedCharts = computed(() => getRelatedCharts(chartId.value, 3))

const compareRatesUrl = computed(() => {
  if (store.corridor?.fromCode && store.corridor?.toCode) {
    return getCorridorUrl(store.corridor.fromCode, store.corridor.toCode)
  }

  const corridorParts = (filters.value.corridorId || '').split('-')
  if (corridorParts.length >= 2 && corridorParts[0] && corridorParts[1]) {
    return getCorridorUrl(corridorParts[0], corridorParts[1])
  }

  const slug = (filters.value.corridor || '').trim()
  if (slug && slug.includes('-to-')) {
    return `/send-money/${slug}`
  }

  return getCorridorUrl('US', 'PH')
})

const queryString = computed(() => {
  const params = new URLSearchParams()
  if (filters.value.corridor !== 'global') params.set('corridor', filters.value.corridor)
  if (filters.value.corridorId) params.set('corridor_id', filters.value.corridorId)
  if (filters.value.amount !== 200) params.set('amount', String(filters.value.amount))
  if (filters.value.fundingMethod !== 'bank') params.set('fund', filters.value.fundingMethod)
  if (filters.value.payoutMethod !== 'bank') params.set('pay', filters.value.payoutMethod)
  return params.toString()
})

const formatUtcTimestamp = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Awaiting fresh Pulse data'
  return date.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
}

const provenanceLabel = computed(() => {
  if (!lastUpdated.value) return 'Awaiting fresh Pulse data'
  return `Gold export updated ${formatUtcTimestamp(lastUpdated.value)}`
})

const corridorContextLabel = computed(() => {
  if (filters.value.corridorId) return filters.value.corridorId
  if (filters.value.corridor === 'global') return 'Global corridor view'
  return filters.value.corridor.toUpperCase()
})

const timeframeContextLabel = computed(() => `${CHART_RANGE_LABELS[selectedChartRange.value]} window`)

const actionableInsight = computed(() => {
  const insights: Record<string, { signal: string, action: string, confidence: number }> = {
    'true-cost-vs-mid': {
      signal: 'Spread Compression Detected',
      action:
        'True-cost delta is narrower than the 7D average. Monitor the next few refreshes for a favorable send window.',
      confidence: 87,
    },
    'volatility': {
      signal: 'Low Volatility Window',
      action:
        'FX volatility is near the 30D low. Conditions look more stable than usual for larger transfers.',
      confidence: 92,
    },
    'provider-heatmap': {
      signal: 'Competitive Pressure Rising',
      action:
        'Several providers improved rates recently. Recheck offers before executing to capture any further compression.',
      confidence: 78,
    },
    'market-depth': {
      signal: 'Liquidity Stable',
      action:
        'No significant liquidity gaps were detected in the latest snapshots. Standard execution conditions appear stable.',
      confidence: 85,
    },
  }
  return (
    insights[chartId.value] || {
      signal: 'Market Neutral',
      action: 'No outsized signal is visible right now. Continue monitoring the latest refreshes.',
      confidence: 75,
    }
  )
})

function handleSetAlert() {
  if (!isAuthenticated.value) {
    authModalOpen.value = true
    return
  }
  const label = chartMeta.value?.title || `Pulse chart ${chartId.value}`
  saveAlertModal.open({
    target: { type: 'pulseChart', chartId: chartId.value },
    label,
    source: 'pulse',
  })
}

onMounted(async () => {
  if (isPlus.value) {
    try {
      const overview = await getPulseOverview(filters.value)
      lastUpdated.value = overview.lastUpdated
    }
 catch {
      lastUpdated.value = ''
    }
  }
  await store.initFromRoute(route.query as Record<string, string>)
})

const chartSeoTitle = computed(() =>
  chartMeta.value ? `${chartMeta.value.title} | Remit-Pulse` : 'Chart | Remit-Pulse',
)
const chartSeoDescription = computed(
  () => chartMeta.value?.description || 'Market data chart from Remit-Pulse',
)

useServerSeoMeta({
  title: chartSeoTitle,
  description: chartSeoDescription,
})

setSeo({
  title: chartSeoTitle.value,
  description: chartSeoDescription.value,
  ogImage: false,
})

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: chartSeoTitle,
    description: chartSeoDescription,
  },
})

const {
  public: { siteUrl },
} = useRuntimeConfig()
const { addBreadcrumbSchema } = useStructuredData()

addBreadcrumbSchema([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Pulse', url: `${siteUrl}/pulse` },
  { name: chartSeoTitle.value, url: `${siteUrl}/pulse/charts/${chartId.value}` },
])
</script>
