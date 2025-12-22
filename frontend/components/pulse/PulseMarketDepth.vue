<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
          <svg class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-bold text-white">Market Depth</h2>
          <p class="text-sm text-neutral-400">Provider rate distribution</p>
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs text-neutral-500">Providers</div>
        <div class="text-xl font-bold text-white">{{ data?.providerCount || 0 }}</div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <div v-if="loading" class="flex h-40 items-center justify-center">
        <div class="flex items-center gap-3 text-neutral-400">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </div>

      <div v-else class="space-y-4">
        <!-- Rate Ladder -->
        <div class="space-y-3">
          <!-- Best Rate -->
          <div class="flex items-center justify-between rounded-lg bg-brand-600/10 border border-brand-600/30 px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600">
                <span class="text-xs font-bold text-white">1</span>
              </div>
              <div>
                <div class="text-sm font-semibold text-white">Best Rate</div>
                <div class="text-xs text-neutral-400">{{ data?.bestProvider }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-mono font-bold text-brand-600">{{ data?.bestRate.toFixed(4) }}</div>
            </div>
          </div>

          <!-- Second Best -->
          <div class="flex items-center justify-between rounded-lg bg-neutral-700/50 px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-600">
                <span class="text-xs font-bold text-white">2</span>
              </div>
              <div>
                <div class="text-sm font-semibold text-white">2nd Best</div>
                <div class="text-xs text-neutral-400">{{ data?.secondBestProvider }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-mono font-bold text-white">{{ data?.secondBestRate.toFixed(4) }}</div>
            </div>
          </div>

          <!-- Median -->
          <div class="flex items-center justify-between rounded-lg bg-neutral-700/30 px-4 py-2">
            <div class="flex items-center gap-3">
              <div class="flex h-6 w-6 items-center justify-center">
                <span class="text-xs text-neutral-500">—</span>
              </div>
              <div class="text-sm text-neutral-400">Median Rate</div>
            </div>
            <div class="text-right">
              <div class="font-mono text-neutral-300">{{ data?.medianRate.toFixed(4) }}</div>
            </div>
          </div>

          <!-- Worst -->
          <div class="flex items-center justify-between rounded-lg bg-danger-600/10 border border-danger-600/30 px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-danger-600/20">
                <svg class="h-4 w-4 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <div class="text-sm font-semibold text-white">Worst Rate</div>
                <div class="text-xs text-neutral-400">{{ data?.worstProvider }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-mono font-bold text-danger-600">{{ data?.worstRate.toFixed(4) }}</div>
            </div>
          </div>
        </div>

        <!-- Spread Summary -->
        <div class="mt-6 rounded-lg bg-neutral-900 p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Market Spread</div>
              <div class="text-2xl font-bold text-white">{{ data?.spreadRangeBps }} bps</div>
            </div>
            <div class="text-right">
              <div class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Range</div>
              <div class="text-lg font-mono text-neutral-300">{{ data?.spreadRange.toFixed(4) }}</div>
            </div>
          </div>
          <div class="mt-3">
            <div class="h-2 w-full rounded-full bg-neutral-700 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-brand-600 to-danger-600"
                :style="{ width: `${Math.min(data?.spreadRangeBps / 5, 100)}%` }"
              />
            </div>
            <div class="mt-1 flex justify-between text-[10px] text-neutral-500">
              <span>Tight (0)</span>
              <span>Wide (500+ bps)</span>
            </div>
          </div>
        </div>

        <!-- Analyst Insight -->
        <div v-if="store.viewMode === 'analyst'" class="rounded-lg border border-neutral-700 bg-neutral-900/50 p-4">
          <div class="flex items-start gap-3">
            <svg class="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="text-sm text-neutral-300">{{ analystInsight }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PulseTrustStamp v-if="data" :last-updated="lastUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import type { MarketDepth } from '~/types/remit'
import { buildMarketDepth } from '~/lib/trueCostCalculator'

const store = usePulseStore()

const loading = ref(true)
const data = ref<MarketDepth | null>(null)
const lastUpdated = ref(new Date().toISOString())

const analystInsight = computed(() => {
  if (!data.value) return ''
  
  const spread = data.value.spreadRangeBps
  if (spread < 50) {
    return 'Market is tightly priced. Provider rates are competitive—good time for price-sensitive transfers.'
  } else if (spread < 150) {
    return 'Normal market conditions. Shop around as there\'s meaningful variation between providers.'
  } else if (spread < 300) {
    return 'Wide spread detected. Some providers are significantly overcharging—compare carefully.'
  } else {
    return 'Extreme spread! Banks are charging 3x+ what specialists charge. Avoid traditional banking for this corridor.'
  }
})

async function loadData() {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const baseMidRate = 56.25
    const providers = [
      { name: 'Wise', rate: baseMidRate * 0.996 },
      { name: 'Remitly', rate: baseMidRate * 0.994 },
      { name: 'XE', rate: baseMidRate * 0.990 },
      { name: 'Xoom', rate: baseMidRate * 0.988 },
      { name: 'WorldRemit', rate: baseMidRate * 0.985 },
      { name: 'Western Union', rate: baseMidRate * 0.975 },
      { name: 'Bank', rate: baseMidRate * 0.944 },
    ]
    
    data.value = buildMarketDepth(providers)
    lastUpdated.value = new Date().toISOString()
  } catch (e) {
    console.error('Failed to load market depth:', e)
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
