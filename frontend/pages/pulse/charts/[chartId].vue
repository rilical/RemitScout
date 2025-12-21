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

const route = useRoute()

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

function handleDownload() {
  console.log('Download requested')
}

function addToWatchlist() {
  console.log('Add to watchlist')
}

onMounted(async () => {
  const overview = await getPulseOverview(filters.value)
  lastUpdated.value = overview.lastUpdated
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
