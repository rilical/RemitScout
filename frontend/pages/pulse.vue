<template>
  <div class="min-h-screen bg-neutral-900">
    <!-- Global Header (Bloomberg-style) -->
    <PulseGlobalHeader />

    <!-- Hero Section -->
    <div class="border-b border-neutral-700 bg-neutral-800">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="flex items-center gap-2 rounded-full bg-brand-600/20 border border-brand-600/30 px-3 py-1.5">
                <span class="relative flex h-2 w-2">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-600 opacity-75" />
                  <span class="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
                </span>
                <span class="text-xs font-semibold text-brand-600 uppercase tracking-wider">Live Data</span>
              </div>
              <span class="text-xs text-neutral-500">The Bloomberg of Remittance</span>
            </div>
            
            <h1 class="text-3xl lg:text-4xl font-bold text-white mb-2">
              <span class="text-white">Remit</span><span class="text-brand-600">Pulse</span>
            </h1>
            <p class="text-base text-neutral-300 max-w-xl">
              Real-time market intelligence for international money transfers. See true costs, track trends, and time your transfers perfectly.
            </p>
          </div>
          
          <div class="hidden lg:flex items-center gap-6 text-sm">
            <div class="text-center">
              <div class="text-2xl font-bold text-white">30+</div>
              <div class="text-neutral-400">Providers</div>
            </div>
            <div class="w-px h-10 bg-neutral-600" />
            <div class="text-center">
              <div class="text-2xl font-bold text-white">150+</div>
              <div class="text-neutral-400">Corridors</div>
            </div>
            <div class="w-px h-10 bg-neutral-600" />
            <div class="text-center">
              <div class="text-2xl font-bold text-brand-600">12.4K</div>
              <div class="text-neutral-400">Quotes today</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <!-- Bento Grid Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Hero Chart - Full Width -->
        <div class="lg:col-span-12">
          <PulseHeroChart />
        </div>

        <!-- Provider Heatmap - 8 cols -->
        <div class="lg:col-span-8">
          <PulseProviderHeatmap />
        </div>

        <!-- Smart Send Gauge - 4 cols -->
        <div class="lg:col-span-4">
          <PulseSmartGauge />
        </div>

        <!-- Market Snapshot (Quick Quotes) - Full Width -->
        <div class="lg:col-span-12">
          <PulseMarketQuotes />
        </div>
      </div>

      <!-- Divider -->
      <div class="my-10 flex items-center gap-4">
        <div class="flex-1 h-px bg-neutral-700" />
        <span class="text-sm font-medium text-neutral-500 uppercase tracking-wider">Deep Dive Charts</span>
        <div class="flex-1 h-px bg-neutral-700" />
      </div>

      <!-- Headline Tiles -->
      <section class="mb-10">
        <PulseHeadlineTiles
          v-if="overview?.tiles"
          :tiles="overview.tiles"
          @tile-click="handleTileClick"
        />
      </section>

      <!-- Chart Grid -->
      <section class="mb-10">
        <h2 class="text-2xl font-bold text-white mb-6">Historical Analysis</h2>
        <PulseChartGrid
          :chart-data="chartData"
          :filters="legacyFilters"
          :is-plus="isPlus"
          @view="navigateToChart"
          @share="handleShare"
          @embed="handleEmbed"
        />
      </section>

      <!-- Data Notes -->
      <section>
        <PulseDataNotes />
      </section>
    </div>

    <!-- Share Modal -->
    <PulseShareModal
      v-if="shareModalChart"
      :chart-id="shareModalChart"
      :filters="legacyFilters"
      mode="share"
      @close="shareModalChart = null"
    />

    <!-- Embed Modal -->
    <PulseShareModal
      v-if="embedModalChart"
      :chart-id="embedModalChart"
      :filters="legacyFilters"
      mode="embed"
      @close="embedModalChart = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { PulseFilters, PulseOverview, ChartData, HeadlineTile } from '~/types/pulse'
import { getPulseOverview, getChartData, getHeroChartData, getSmartSendData, getMarketSnapshot } from '~/lib/pulseMockApi'
import { pulseChartRegistry } from '~/lib/pulseChartRegistry'
import { usePulseStore, POPULAR_CORRIDORS } from '~/stores/pulse'

const router = useRouter()
const route = useRoute()
const store = usePulseStore()

const isPlus = ref(false)
const shareModalChart = ref<string | null>(null)
const embedModalChart = ref<string | null>(null)

const legacyFilters = computed<PulseFilters>(() => ({
  corridor: store.corridor.slug,
  amount: store.amount as 100 | 200 | 500 | 1000,
  fundingMethod: 'bank',
  payoutMethod: 'bank',
}))

const defaultCorridor = POPULAR_CORRIDORS[0]
const defaultFilters: PulseFilters = {
  corridor: defaultCorridor.slug,
  amount: 1000,
  fundingMethod: 'bank',
  payoutMethod: 'bank',
}

const { data: overview, refresh: refreshOverview } = await useAsyncData(
  'pulse-overview',
  () => getPulseOverview(defaultFilters),
  { server: true }
)

const { data: ssrHeroData } = await useAsyncData(
  'pulse-hero',
  () => getHeroChartData(defaultCorridor, '7D', 1000),
  { server: true }
)

const { data: ssrSmartSendData } = await useAsyncData(
  'pulse-smart-send',
  () => getSmartSendData(defaultCorridor, 1000),
  { server: true }
)

const { data: ssrMarketSnapshot } = await useAsyncData(
  'pulse-market-snapshot',
  () => getMarketSnapshot(defaultCorridor, 1000),
  { server: true }
)

const chartData = ref<Record<string, ChartData | null>>({})

async function loadChartData() {
  const chartIds = pulseChartRegistry.map(c => c.id)
  const promises = chartIds.map(async (id) => {
    const data = await getChartData(id, legacyFilters.value)
    return { id, data }
  })
  
  const results = await Promise.all(promises)
  const newData: Record<string, ChartData | null> = {}
  for (const { id, data } of results) {
    newData[id] = data
  }
  chartData.value = newData
}

function handleTileClick(tile: HeadlineTile) {
  if (tile.chartId) {
    navigateToChart(tile.chartId)
  }
}

function navigateToChart(chartId: string) {
  const params = store.getQueryParams()
  const queryString = new URLSearchParams(params).toString()
  router.push(`/pulse/charts/${chartId}${queryString ? '?' + queryString : ''}`)
}

function handleShare(chartId: string) {
  shareModalChart.value = chartId
}

function handleEmbed(chartId: string) {
  embedModalChart.value = chartId
}

watch(
  () => [store.corridor, store.timeframe, store.amount],
  () => {
    refreshOverview()
    loadChartData()
  },
  { deep: true }
)

onMounted(async () => {
  await store.initFromRoute(route.query as Record<string, string>)
  loadChartData()
})

useHead({
  title: 'Remit-Pulse | The Bloomberg of Remittance',
  meta: [
    {
      name: 'description',
      content: 'Real-time market intelligence for international money transfers. Track true costs vs mid-market rates, spot trends, and time your transfers with live quote data from 30+ providers.',
    },
    {
      property: 'og:title',
      content: 'Remit-Pulse | The Bloomberg of Remittance',
    },
    {
      property: 'og:description',
      content: 'See what you really pay for money transfers. Live market data, provider heatmaps, and smart timing signals.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:url',
      content: 'https://remitscout.com/pulse',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: 'Remit-Pulse | The Bloomberg of Remittance',
    },
    {
      name: 'twitter:description',
      content: 'Real-time market data for international money transfers. See true costs, track trends, time your transfers.',
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: 'https://remitscout.com/pulse',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Remit-Pulse',
        'description': 'Real-time market intelligence for international money transfers',
        'url': 'https://remitscout.com/pulse',
        'applicationCategory': 'FinanceApplication',
        'operatingSystem': 'Web',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
        },
        'provider': {
          '@type': 'Organization',
          'name': 'Remit-Scout',
          'url': 'https://remitscout.com',
        },
      }),
    },
  ],
})
</script>
