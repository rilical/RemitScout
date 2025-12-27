<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
      <div>
        <h2 class="text-lg font-bold text-white">Live Provider Quotes</h2>
        <p class="text-sm text-neutral-400">
          Current rates for ${{ store.amount.toLocaleString() }} {{ store.corridor.fromCode }} → {{ store.corridor.toCode }}
        </p>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <span class="text-neutral-400">Mid-market:</span>
        <span class="font-mono font-bold text-white">{{ data?.midMarketRate.toFixed(4) }}</span>
        <span class="text-neutral-500">{{ store.corridor.toCode }}/{{ store.corridor.fromCode }}</span>
      </div>
    </div>

    <!-- Quotes Grid -->
    <div class="p-4">
      <div v-if="loading" class="flex h-32 items-center justify-center">
        <div class="flex items-center gap-3 text-neutral-400">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading quotes...
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="(quote, index) in data?.quotes"
          :key="quote.provider"
          class="group relative flex items-center justify-between rounded-lg border p-4 transition-all cursor-pointer hover:border-brand-600"
          :class="index === 0 ? 'border-brand-600 bg-brand-600/10' : 'border-neutral-700 bg-neutral-900'"
        >
          <!-- Winner Badge -->
          <div
            v-if="index === 0"
            class="absolute -top-2 -right-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase"
          >
            Best
          </div>

          <!-- Promo Badge -->
          <div
            v-if="quote.isPromo"
            class="absolute -top-2 left-3 rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-black uppercase"
          >
            Promo
          </div>

          <div class="flex items-center gap-3">
            <!-- Provider Logo Placeholder -->
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white"
              :style="{ backgroundColor: quote.color + '30' }"
            >
              {{ quote.provider.charAt(0) }}
            </div>
            <div>
              <div class="font-semibold text-white">{{ quote.provider }}</div>
              <div class="text-xs text-neutral-400">{{ quote.speed }}</div>
            </div>
          </div>

          <div class="text-right">
            <div class="text-lg font-bold" :class="index === 0 ? 'text-brand-600' : 'text-white'">
              {{ getCurrencySymbol(store.corridor.toCode) }}{{ formatNumber(quote.recipientGets) }}
            </div>
            <div class="flex items-center justify-end gap-2 text-xs">
              <span class="text-neutral-500">Fee: ${{ quote.fee.toFixed(2) }}</span>
              <span class="text-neutral-600">•</span>
              <span
                class="rounded px-1.5 py-0.5"
                :class="getMarkupClass(quote.markupBps)"
              >
                {{ quote.markupBps }} bps
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Analyst View: Additional Details -->
      <div v-if="store.viewMode === 'analyst' && data" class="mt-6 border-t border-neutral-700 pt-4">
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div class="text-neutral-500 mb-1">Best vs Worst</div>
            <div class="font-semibold text-brand-600">
              {{ getCurrencySymbol(store.corridor.toCode) }}{{ formatNumber(bestWorstDiff) }} more
            </div>
          </div>
          <div>
            <div class="text-neutral-500 mb-1">Average Markup</div>
            <div class="font-semibold text-white">{{ averageMarkup }} bps</div>
          </div>
          <div>
            <div class="text-neutral-500 mb-1">Providers with Promo</div>
            <div class="font-semibold text-white">{{ promoCount }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Compare CTA -->
    <div class="border-t border-neutral-700 px-6 py-3">
      <NuxtLink
        :to="`/send-money/united-states-to-philippines?amount=${store.amount}`"
        class="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        Compare All Providers
      </NuxtLink>
    </div>

    <!-- Trust Stamp -->
    <PulseTrustStamp v-if="data" :last-updated="data.lastUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import { getMarketSnapshot, getCurrencySymbol, type MarketSnapshotData } from '~/lib/pulseApi'

const store = usePulseStore()

const loading = ref(true)
const data = ref<MarketSnapshotData | null>(null)

const bestWorstDiff = computed(() => {
  if (!data.value || data.value.quotes.length < 2) return 0
  const best = data.value.quotes[0].recipientGets
  const worst = data.value.quotes[data.value.quotes.length - 1].recipientGets
  return best - worst
})

const averageMarkup = computed(() => {
  if (!data.value) return 0
  const total = data.value.quotes.reduce((sum, q) => sum + q.markupBps, 0)
  return Math.round(total / data.value.quotes.length)
})

const promoCount = computed(() => {
  if (!data.value) return 0
  return data.value.quotes.filter(q => q.isPromo).length
})

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function getMarkupClass(bps: number): string {
  if (bps < 50) return 'bg-brand-600/20 text-brand-600'
  if (bps < 100) return 'bg-brand-600/10 text-brand-600'
  if (bps < 150) return 'bg-neutral-700 text-neutral-400'
  return 'bg-danger-600/20 text-danger-600'
}

async function loadData() {
  loading.value = true
  try {
    data.value = await getMarketSnapshot(store.corridor, store.amount)
  } catch (e) {
    console.error('Failed to load market snapshot:', e)
  } finally {
    loading.value = false
  }
}

watch(
  () => [store.corridor, store.amount],
  () => loadData(),
  { deep: true }
)

onMounted(() => {
  loadData()
})
</script>




