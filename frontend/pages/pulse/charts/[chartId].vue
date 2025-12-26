<template>
  <div class="min-h-screen bg-neutral-900">
    <!-- Header -->
    <div class="border-b border-neutral-700 bg-neutral-800">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <NuxtLink
            to="/pulse"
            class="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Pulse
          </NuxtLink>
          
          <div class="flex items-center gap-3">
            <!-- View Mode Toggle -->
            <div class="hidden sm:flex items-center gap-1 rounded-lg bg-neutral-700 p-1">
              <button
                class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                :class="store.viewMode === 'sender'
                  ? 'bg-brand-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-600'"
                @click="store.setViewMode('sender')"
              >
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sender
              </button>
              <button
                class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                :class="store.viewMode === 'analyst'
                  ? 'bg-brand-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-600'"
                @click="store.setViewMode('analyst')"
              >
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analyst
              </button>
            </div>
            
            <button
              class="flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-700 px-4 py-2 text-sm text-white hover:bg-neutral-600 transition-colors"
              @click="showShareModal = true"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            <button
              class="flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-700 px-4 py-2 text-sm text-white hover:bg-neutral-600 transition-colors"
              @click="showEmbedModal = true"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Embed
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
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <!-- Main Column -->
        <div class="lg:col-span-8 space-y-8">
          <!-- Full Chart -->
          <PulseChartFull
            :chart-id="chartId"
            :filters="filters"
            :is-plus="isPlus"
            @share="showShareModal = true"
            @embed="showEmbedModal = true"
            @download="handleDownload"
          />

          <!-- Consumer Mode: Simple Takeaway -->
          <div v-if="store.viewMode === 'sender'" class="rounded-xl border border-neutral-700 bg-neutral-800 p-6">
            <h3 class="text-lg font-semibold text-white mb-2">Key Takeaway</h3>
            <p class="text-neutral-300">
              This chart shows how transfer costs have changed over time. Use this data to identify the best times to send money and save on fees.
            </p>
          </div>

          <!-- Analyst Mode: Actionable Insight Panel -->
          <div v-else class="rounded-xl border border-brand-600/30 bg-brand-600/5 overflow-hidden">
            <div class="border-b border-brand-600/20 px-6 py-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-600/20">
                  <svg class="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white">Actionable Insight</h3>
                  <p class="text-sm text-neutral-400">AI-generated execution guidance</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono text-neutral-500">Confidence:</span>
                <span class="text-sm font-bold text-brand-600">{{ actionableInsight.confidence }}%</span>
              </div>
            </div>
            <div class="p-6">
              <div class="mb-4">
                <span class="inline-flex items-center rounded-full bg-brand-600/20 px-3 py-1 text-sm font-semibold text-brand-600">
                  {{ actionableInsight.signal }}
                </span>
              </div>
              <p class="text-neutral-300 leading-relaxed">
                {{ actionableInsight.action }}
              </p>
              
              <!-- Export & Compliance Actions -->
              <div class="mt-6 pt-4 border-t border-neutral-700 flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <button
                    class="inline-flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition-colors"
                    @click="handleExportCSV"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </button>
                  <button
                    class="inline-flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition-colors"
                    @click="handleExportPDF"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Compliance PDF
                  </button>
                </div>
                <NuxtLink
                  to="/institutions/api"
                  class="text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors"
                >
                  API Access →
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Analyst Mode: Compliance Timestamp -->
          <div v-if="store.viewMode === 'analyst'" class="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-4 text-xs text-neutral-500">
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verified Pipeline v2.4.1
              </span>
              <span>|</span>
              <span class="font-mono">{{ complianceTimestamp }}</span>
              <span>|</span>
              <span class="font-mono">Hash: {{ complianceHash }}</span>
            </div>
            <button class="text-xs font-medium text-neutral-400 hover:text-white transition-colors">
              Audit Log
            </button>
          </div>

          <!-- Data Notes -->
          <PulseDataNotes :chart-id="chartId" />
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-4 space-y-6">
          <!-- Related Charts -->
          <div class="rounded-xl border border-neutral-700 bg-neutral-800 p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Related Charts</h3>
            <div class="space-y-4">
              <NuxtLink
                v-for="chart in relatedCharts"
                :key="chart.id"
                :to="`/pulse/charts/${chart.id}?${queryString}`"
                class="block rounded-lg border border-neutral-700 bg-neutral-800 p-4 hover:border-brand-600 transition-colors"
              >
                <div class="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                  {{ chart.categoryLabel }}
                </div>
                <div class="font-medium text-white">{{ chart.title }}</div>
                <div class="mt-1 text-sm text-neutral-400">{{ chart.description }}</div>
              </NuxtLink>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="rounded-xl border border-neutral-700 bg-neutral-800 p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div class="space-y-3">
              <NuxtLink
                :to="`/send-money/${corridorSlug}`"
                class="flex items-center gap-3 rounded-lg bg-brand-600 px-4 py-3 text-white hover:bg-brand-700 transition-colors"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-medium">Compare Rates Now</span>
              </NuxtLink>
              <button
                class="flex w-full items-center gap-3 rounded-lg border border-neutral-600 bg-neutral-700 px-4 py-3 text-white hover:bg-neutral-600 transition-colors"
                @click="addToWatchlist"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span class="font-medium">Set Price Alert</span>
              </button>
            </div>
          </div>

          <!-- Plus Upsell (if not Plus) -->
          <div
            v-if="!isPlus"
            class="rounded-xl border border-brand-600/30 bg-brand-600/10 p-6"
          >
            <div class="flex items-center gap-2 text-brand-600 mb-3">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span class="font-semibold">Remit-Scout Plus</span>
            </div>
            <p class="text-sm text-neutral-300 mb-4">
              Unlock 365 days of history, CSV exports, and premium insights.
            </p>
            <NuxtLink
              to="/plus"
              class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Upgrade Now
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7-7 7" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Share Modal -->
    <PulseShareModal
      v-if="showShareModal"
      :chart-id="chartId"
      :filters="filters"
      mode="share"
      @close="showShareModal = false"
    />

    <!-- Embed Modal -->
    <PulseShareModal
      v-if="showEmbedModal"
      :chart-id="chartId"
      :filters="filters"
      mode="embed"
      @close="showEmbedModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { PulseFilters, TimeRange } from '~/types/pulse'
import { getChartById, getRelatedCharts } from '~/lib/pulseChartRegistry'
import { getPulseOverview } from '~/lib/pulseMockApi'
import { usePulseStore } from '~/stores/pulse'

const route = useRoute()
const store = usePulseStore()

const chartId = computed(() => route.params.chartId as string)

const chartMeta = computed(() => getChartById(chartId.value))

const filters = ref<PulseFilters>({
  corridor: (route.query.corridor as string) || 'global',
  amount: parseInt(route.query.amount as string) || 200,
  fundingMethod: (route.query.fund as 'bank' | 'card' | 'cash') || 'bank',
  payoutMethod: (route.query.pay as 'bank' | 'cash' | 'wallet') || 'bank',
})

const isPlus = ref(false)
const lastUpdated = ref<string>('')
const showShareModal = ref(false)
const showEmbedModal = ref(false)

const relatedCharts = computed(() => getRelatedCharts(chartId.value, 3))

const corridorSlug = computed(() => {
  if (filters.value.corridor === 'global') return 'united-states-to-philippines'
  return filters.value.corridor.replace(/-/g, '-to-').split('-to-')[0] + '-to-' + filters.value.corridor.split('-to-')[1]
})

const queryString = computed(() => {
  const params = new URLSearchParams()
  if (filters.value.corridor !== 'global') params.set('corridor', filters.value.corridor)
  if (filters.value.amount !== 200) params.set('amount', String(filters.value.amount))
  if (filters.value.fundingMethod !== 'bank') params.set('fund', filters.value.fundingMethod)
  if (filters.value.payoutMethod !== 'bank') params.set('pay', filters.value.payoutMethod)
  return params.toString()
})

const complianceTimestamp = computed(() => {
  const now = new Date()
  return now.toISOString()
})

const complianceHash = computed(() => {
  const base = `${chartId.value}-${filters.value.corridor}-${Date.now()}`
  return btoa(base).substring(0, 12).toUpperCase()
})

const actionableInsight = computed(() => {
  const insights: Record<string, { signal: string; action: string; confidence: number }> = {
    'true-cost-vs-mid': {
      signal: 'Spread Compression Detected',
      action: 'True cost delta narrowing vs 7D avg. Execute within 2-4 hours for optimal pricing.',
      confidence: 87,
    },
    'volatility': {
      signal: 'Low Volatility Window',
      action: 'FX volatility at 30D low. Favorable execution conditions for large transfers.',
      confidence: 92,
    },
    'provider-heatmap': {
      signal: 'Competitive Pressure Rising',
      action: '3 providers improved rates in last 6 hours. Monitor for further compression.',
      confidence: 78,
    },
    'market-depth': {
      signal: 'Liquidity Stable',
      action: 'No significant liquidity gaps detected. Standard execution recommended.',
      confidence: 85,
    },
  }
  return insights[chartId.value] || {
    signal: 'Market Neutral',
    action: 'No significant signals detected. Continue monitoring.',
    confidence: 75,
  }
})

function handleDownload() {
  console.log('Download requested')
}

function handleExportCSV() {
  const csvContent = `Chart ID,${chartId.value}\nCorridor,${filters.value.corridor}\nAmount,${filters.value.amount}\nTimestamp,${complianceTimestamp.value}\nHash,${complianceHash.value}\n\n"Note: Full data export requires API access."`
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pulse-${chartId.value}-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function handleExportPDF() {
  alert('PDF export requires Plus subscription. Upgrade to access compliance-ready reports.')
}

function addToWatchlist() {
  console.log('Add to watchlist')
}

onMounted(async () => {
  const overview = await getPulseOverview(filters.value)
  lastUpdated.value = overview.lastUpdated
  await store.initFromRoute(route.query as Record<string, string>)
})

useHead({
  title: computed(() => chartMeta.value ? `${chartMeta.value.title} | Remit-Pulse` : 'Chart | Remit-Pulse'),
  meta: [
    {
      name: 'description',
      content: computed(() => chartMeta.value?.description || 'Market data chart from Remit-Pulse'),
    },
  ],
})
</script>




