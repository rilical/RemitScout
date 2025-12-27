<template>
  <div
    class="rounded-xl border overflow-hidden flex flex-col h-full"
    :class="hasOpportunity ? 'border-brand-600/50 bg-gradient-to-br from-brand-600/10 to-neutral-800' : 'border-neutral-700 bg-neutral-800'"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b px-6 py-4"
      :class="hasOpportunity ? 'border-brand-600/30' : 'border-neutral-700'"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg"
          :class="hasOpportunity ? 'bg-brand-600' : 'bg-neutral-700'"
        >
          <svg
            class="h-5 w-5"
            :class="hasOpportunity ? 'text-white' : 'text-neutral-400'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-bold text-white">Spread Anomaly Signal</h2>
          <p class="text-sm text-neutral-400">Detects abnormal pricing dispersion</p>
        </div>
      </div>
      <div v-if="hasOpportunity" class="flex items-center gap-2">
        <span class="relative flex h-3 w-3">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-600 opacity-75" />
          <span class="relative inline-flex h-3 w-3 rounded-full bg-brand-600" />
        </span>
        <span class="text-xs font-bold text-brand-600 uppercase">Active</span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6 flex flex-col h-full">
      <div v-if="loading" class="flex h-32 items-center justify-center">
        <div class="flex items-center gap-3 text-neutral-400">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Scanning market...
        </div>
      </div>

      <div v-else-if="hasOpportunity && data" class="flex-1 flex flex-col">
        <!-- Opportunity Detected -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center gap-2 rounded-full bg-brand-600/20 border border-brand-600/30 px-4 py-2 mb-4">
            <svg class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm font-bold text-brand-600">ANOMALY DETECTED</span>
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">
            {{ data.provider }} is {{ data.savingsPercent.toFixed(1) }}% under market
          </h3>
          <p class="text-sm text-neutral-400">relative to the corridor average</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="rounded-lg bg-neutral-900 p-4 text-center">
            <div class="text-xs text-neutral-500 mb-1">Current Rate</div>
            <div class="text-xl font-mono font-bold text-brand-600">{{ data.currentRate.toFixed(4) }}</div>
          </div>
          <div class="rounded-lg bg-neutral-900 p-4 text-center">
            <div class="text-xs text-neutral-500 mb-1">Average Rate</div>
            <div class="text-xl font-mono font-bold text-white">{{ data.averageRate.toFixed(4) }}</div>
          </div>
        </div>

        <!-- Percentile Bar -->
        <div class="mb-6">
          <div class="flex justify-between text-xs text-neutral-500 mb-2">
            <span>Rate Distribution</span>
            <span>{{ data.percentile }}th percentile</span>
          </div>
          <div class="relative h-4 w-full rounded-full bg-neutral-700 overflow-hidden">
            <div
              class="absolute inset-y-0 left-0 bg-gradient-to-r from-danger-600 via-amber-500 to-brand-600"
              style="width: 100%"
            />
            <div
              class="absolute top-1/2 -translate-y-1/2 h-6 w-1 bg-white rounded shadow-lg"
              :style="{ left: `${data.percentile}%` }"
            />
          </div>
          <div class="flex justify-between text-[10px] text-neutral-500 mt-1">
            <span>Worst rates</span>
            <span>Best rates</span>
          </div>
        </div>

        <!-- Recommendation -->
          <div class="rounded-lg bg-brand-600/10 border border-brand-600/30 p-4">
            <p class="text-sm text-neutral-300">{{ data.recommendation }}</p>
          </div>

          <div class="mt-auto pt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-700"
            >
              Create Monitor
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              View Details
            </button>
          </div>
      </div>

      <div v-else class="flex flex-col h-full min-h-[400px]">
        <!-- No Opportunity -->
        <div class="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div class="inline-flex items-center justify-center h-20 w-20 rounded-full bg-neutral-700 mb-6">
            <svg class="h-10 w-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-white mb-3">No Anomalies Detected</h3>
          <p class="text-sm text-neutral-400 max-w-xs mx-auto mb-6">
            Pricing dispersion is within normal corridor ranges.
          </p>
          
          <div class="mt-auto w-full max-w-xs">
            <div class="rounded-lg bg-neutral-900 p-4 mb-6">
              <div class="text-xs text-neutral-500 mb-2">Current Spread Status</div>
              <div class="text-lg font-bold text-white mb-1">Normal Range</div>
              <div class="text-xs text-neutral-400">Market conditions are stable</div>
            </div>
          </div>
        </div>

        <div class="mt-auto pt-4">
          <button
            type="button"
            class="flex items-center justify-center gap-2 w-full rounded-lg border border-neutral-600 bg-neutral-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-600"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span>Create Monitor</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import type { ArbitrageOpportunity } from '~/types/remit'
import { getArbitrageOpportunities } from '~/lib/pulseApi'

const store = usePulseStore()

const loading = ref(true)
const data = ref<ArbitrageOpportunity | null>(null)

const hasOpportunity = computed(() => {
  return data.value?.isSignificant === true
})

async function loadData() {
  loading.value = true
  try {
    const opportunity = await getArbitrageOpportunities(store.corridor)
    if (opportunity) {
      data.value = {
        ...opportunity,
        recommendation: 'Potential action: tighten spreads by 5-10 bps to defend share (based on percentile position).',
      }
    } else {
      data.value = {
        provider: '',
        currentRate: 0,
        averageRate: 0,
        savingsPercent: 0,
        percentile: 50,
        isSignificant: false,
        recommendation: '',
      }
    }
  } catch (e) {
    console.error('Failed to load arbitrage data:', e)
  } finally {
    loading.value = false
  }
}

watch(
  () => [store.corridor, store.timeframe],
  () => loadData(),
  { deep: true }
)

onMounted(() => {
  loadData()
})
</script>




