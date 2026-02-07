<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
      <div>
        <h2 class="text-lg font-bold text-white">
          Live Provider Quotes
        </h2>
        <p class="text-sm text-neutral-400">
          Current rates for {{ amountLabel }} ({{ store.corridor.fromCode }} → {{ store.corridor.toCode }})
        </p>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <span class="text-neutral-400">Mid-market:</span>
        <span class="font-mono font-bold text-white">{{ midMarketRateDisplay }}</span>
        <span class="text-neutral-500">{{ store.corridor.toCode }}/{{ store.corridor.fromCode }}</span>
      </div>
    </div>

    <!-- Quotes Grid -->
    <div class="p-4">
      <div
        v-if="loading"
        class="flex h-32 items-center justify-center"
      >
        <div class="flex items-center gap-3 text-neutral-400">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-neutral-500 border-t-transparent" />
          Loading quotes...
        </div>
      </div>

      <div
        v-else-if="data?.quotes.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
      >
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
              <div class="font-semibold text-white">
                {{ quote.provider }}
              </div>
              <div class="text-xs text-neutral-400">
                {{ quote.speed }}
              </div>
            </div>
          </div>

          <div class="text-right">
            <div
              class="text-lg font-bold"
              :class="index === 0 ? 'text-brand-600' : 'text-white'"
            >
              {{ formatMoney(quote.recipientGets, { currency: store.corridor.toCode, maximumFractionDigits: 0 }) }}
            </div>
            <div class="flex items-center justify-end gap-2 text-xs">
              <span class="text-neutral-500">Fee: {{ formatMoney(quote.fee, { currency: store.corridor.fromCode, maximumFractionDigits: 2 }) }}</span>
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
      <div
        v-else
        class="flex h-24 items-center justify-center text-sm text-neutral-500"
      >
        No live quotes yet.
      </div>

      <!-- Analyst View: Additional Details -->
      <div
        v-if="store.viewMode === 'analyst' && data"
        class="mt-6 border-t border-neutral-700 pt-4"
      >
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div class="text-neutral-500 mb-1">
              Best vs Worst
            </div>
            <div class="font-semibold text-brand-600">
              {{ formatMoney(bestWorstDiff, { currency: store.corridor.toCode, maximumFractionDigits: 0 }) }} more
            </div>
          </div>
          <div>
            <div class="text-neutral-500 mb-1">
              Average Markup
            </div>
            <div class="font-semibold text-white">
              {{ averageMarkup }} bps
            </div>
          </div>
          <div>
            <div class="text-neutral-500 mb-1">
              Providers with Promo
            </div>
            <div class="font-semibold text-white">
              {{ promoCount }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Compare CTA -->
    <div class="border-t border-neutral-700 px-6 py-3">
      <NuxtLink
        :to="compareCorridorUrl"
        class="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        <Icon
          name="arrow-right"
          :size="16"
          class="text-current"
        />
        Compare All Providers
      </NuxtLink>
    </div>

    <!-- Trust Stamp -->
    <PulseTrustStamp
      v-if="data"
      :last-updated="data.lastUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import { getMarketSnapshot, type MarketSnapshotData } from '~/lib/pulseApi'
import { getCorridorUrl } from '~/utils/country-slugs'
import { Icon } from '~/ui'
import { formatMoney, formatNumber as formatNumberValue } from '~/shared/lib/format'

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

function getMarkupClass(bps: number): string {
  if (bps < 50) return 'bg-brand-600/20 text-brand-600'
  if (bps < 100) return 'bg-brand-600/10 text-brand-600'
  if (bps < 150) return 'bg-neutral-700 text-neutral-400'
  return 'bg-danger-600/20 text-danger-600'
}

const midMarketRateDisplay = computed(() => {
  if (!data.value) return 'n/a'
  return formatNumberValue(data.value.midMarketRate, { minimumFractionDigits: 4, maximumFractionDigits: 4 })
})

const amountLabel = computed(() => formatMoney(store.amount, { currency: store.corridor.fromCode, maximumFractionDigits: 0 }))

const compareCorridorUrl = computed(() => {
  const id = store.corridor.corridorId
  const fallback = `/send-money/united-states-to-philippines?amount=${store.amount}`
  if (!id) return fallback
  const [from, to] = id.split('-')
  if (!from || !to) return fallback
  const base = getCorridorUrl(from, to)
  return `${base}?amount=${encodeURIComponent(String(store.amount))}`
})

async function loadData() {
  loading.value = true
  try {
    data.value = await getMarketSnapshot(store.corridor, store.amount)
  }
  catch (e) {
    console.error('Failed to load market snapshot:', e)
  }
  finally {
    loading.value = false
  }
}

watch(
  () => [store.corridor, store.amount],
  () => loadData(),
  { deep: true },
)

onMounted(() => {
  loadData()
})
</script>
