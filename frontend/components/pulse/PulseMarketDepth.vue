<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
          <Icon
            name="chart-bar"
            :size="20"
            class="text-brand-600"
          />
        </div>
        <div>
          <h2 class="text-body-lg font-bold text-white">
            Market Spread
          </h2>
          <p class="text-body-sm text-neutral-400">
            Best-to-worst pricing dispersion
          </p>
        </div>
      </div>
      <div class="text-right">
        <div class="text-body-sm text-neutral-500">
          Providers
        </div>
        <div class="text-h4 font-bold text-white">
          {{ data?.providerCount || 0 }}
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <div
        v-if="loading"
        class="flex h-40 w-full items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Loading chart"
      >
        <SkeletonBlock
          width="full"
          height="10rem"
          tone="dark"
        />
        <span class="sr-only">Loading chart</span>
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <!-- Rate Ladder -->
        <div class="space-y-3">
          <!-- Best Rate -->
          <div class="flex items-center justify-between rounded-lg bg-brand-600/10 border border-brand-600/30 px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600">
                <span class="text-body-sm font-bold text-white">1</span>
              </div>
              <div>
                <div class="text-body-sm font-semibold text-white">
                  Best Price
                </div>
                <div class="text-body-sm text-neutral-400">
                  {{ data?.bestProvider }}
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-body-lg font-mono font-bold text-brand-600">
                {{ formatRate(data?.bestRate) }}
              </div>
            </div>
          </div>

          <!-- Second Best -->
          <div class="flex items-center justify-between rounded-lg bg-neutral-700/50 px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-600">
                <span class="text-body-sm font-bold text-white">2</span>
              </div>
              <div>
                <div class="text-body-sm font-semibold text-white">
                  Runner-up
                </div>
                <div class="text-body-sm text-neutral-400">
                  {{ data?.secondBestProvider }}
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-body-lg font-mono font-bold text-white">
                {{ formatRate(data?.secondBestRate) }}
              </div>
            </div>
          </div>

          <!-- Median -->
          <div class="flex items-center justify-between rounded-lg bg-neutral-700/30 px-4 py-2">
            <div class="flex items-center gap-3">
              <div class="flex h-6 w-6 items-center justify-center">
                <span class="text-body-sm text-neutral-500">-</span>
              </div>
              <div class="text-body-sm text-neutral-400">
                Median Rate
              </div>
            </div>
            <div class="text-right">
              <div class="font-mono text-neutral-300">
                {{ formatRate(data?.medianRate) }}
              </div>
            </div>
          </div>

          <!-- Worst -->
          <div class="flex items-center justify-between rounded-lg bg-danger-600/10 border border-danger-600/30 px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-danger-600/20">
              <Icon
                name="exclamation-triangle"
                :size="16"
                class="text-danger-600"
              />
            </div>
            <div>
              <div class="text-body-sm font-semibold text-white">
                  Worst Price
                </div>
                <div class="text-body-sm text-neutral-400">
                  {{ data?.worstProvider }}
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-body-lg font-mono font-bold text-danger-600">
                {{ formatRate(data?.worstRate) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Spread Summary -->
        <div class="mt-6 rounded-lg bg-neutral-900 p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-body-sm font-medium text-neutral-500 uppercase tracking-wider">
                Market Spread
              </div>
              <div class="text-h3 font-bold text-white">
                {{ spreadRangeBpsDisplay }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-body-sm font-medium text-neutral-500 uppercase tracking-wider">
                Range
              </div>
              <div class="text-body-lg font-mono text-neutral-300">
                {{ formatRate(data?.spreadRange) }}
              </div>
            </div>
          </div>
          <div class="mt-3">
            <div class="h-2 w-full rounded-full bg-neutral-700 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-brand-600 to-danger-600"
                :style="{ width: `${spreadBarWidth}%` }"
              />
            </div>
            <div class="mt-1 flex justify-between text-[10px] text-neutral-500">
              <span>Tight (0)</span>
              <span>Wide (500+ bps)</span>
            </div>
          </div>
        </div>

        <!-- Analyst Insight -->
        <div class="rounded-lg border border-neutral-700 bg-neutral-900/50 p-4">
          <div class="flex items-start gap-3">
            <Icon
              name="info"
              :size="20"
              class="text-brand-600 flex-shrink-0 mt-0.5"
            />
            <div>
              <p class="text-body-sm text-neutral-300">
                {{ analystInsight }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PulseTrustStamp
      v-if="data"
      :last-updated="store.lastUpdated || null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import type { MarketDepth } from '~/types/remit'
import { getMarketDepthData } from '~/lib/pulseApi'
import { Icon } from '~/ui'
import { formatNumber } from '~/shared/lib/format'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'

const store = usePulseStore()

const loading = ref(true)
const data = ref<MarketDepth | null>(null)
const spreadBarWidth = computed(() => {
  if (!data.value) return 0
  return Math.min((data.value.spreadRangeBps || 0) / 5, 100)
})
const spreadRangeBpsDisplay = computed(() => {
  if (!data.value) return 'n/a'
  return `${data.value.spreadRangeBps} bps`
})

const analystInsight = computed(() => {
  if (!data.value) return ''

  const spread = data.value.spreadRangeBps
  if (spread < 50) {
    return 'Market is tightly priced. Competitive pressure is high and spreads are compressed.'
  }
  else if (spread < 150) {
    return 'Normal dispersion. Leader advantage is meaningful but not extreme.'
  }
  else if (spread < 300) {
    return 'Wide dispersion. Pricing variance creates clear winner/loser positioning.'
  }
  else {
    return 'Extreme dispersion detected. Expect aggressive leader shifts and higher price sensitivity.'
  }
})

const formatRate = (value?: number | null) => {
  if (typeof value !== 'number') return 'n/a'
  return formatNumber(value, { minimumFractionDigits: 4, maximumFractionDigits: 4 })
}

async function loadData() {
  loading.value = true
  try {
    data.value = await getMarketDepthData(store.corridor)
  }
  catch (e) {
    useLogger('PulseMarketDepth').error('Failed to load market depth', e)
  }
  finally {
    loading.value = false
  }
}

watch(
  () => [store.corridor, store.timeframe],
  () => loadData(),
  { deep: true },
)

onMounted(() => {
  loadData()
})
</script>
