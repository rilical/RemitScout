<template>
  <div
    class="min-h-screen p-4"
    :class="theme === 'dark' ? 'bg-neutral-900' : 'bg-white'"
  >
    <div
      class="rounded-xl overflow-hidden"
      :class="theme === 'dark' ? 'border border-neutral-700 bg-neutral-800' : 'border border-gray-200 bg-gray-50'"
    >
      <div
        class="px-4 py-3 border-b"
        :class="theme === 'dark' ? 'border-neutral-700' : 'border-gray-200'"
      >
        <div class="flex items-center justify-between">
          <div>
            <h1
              class="text-lg font-bold"
              :class="theme === 'dark' ? 'text-white' : 'text-gray-900'"
            >
              {{ chartTitle }}
            </h1>
            <p
              class="text-sm"
              :class="theme === 'dark' ? 'text-neutral-400' : 'text-gray-600'"
            >
              {{ corridorLabel }} · {{ methodLabel }} · ${{ amountBucket }}
            </p>
          </div>
          <div
            class="text-xs"
            :class="theme === 'dark' ? 'text-neutral-500' : 'text-gray-500'"
          >
            {{ weightingLabel }}
          </div>
        </div>
      </div>

      <div class="p-4">
        <div
          v-if="apiKeyWarning"
          class="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
        >
          {{ apiKeyWarning }}
        </div>
        <div
          v-if="loading"
          class="flex h-64 items-center justify-center"
        >
          <div
            class="flex items-center gap-2"
            :class="theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'"
          >
            <svg
              class="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </div>
        </div>
        <div
          v-else-if="error"
          class="flex h-64 items-center justify-center text-sm text-rose-500"
        >
          {{ error }}
        </div>
        <div v-else-if="chartSeries.length">
          <PulseLineChart
            :series="chartSeries"
            :unit="unit"
            :unit-label="unitLabel"
          />
        </div>
        <div
          v-else
          class="flex h-64 items-center justify-center text-sm text-neutral-500"
        >
          No data available yet.
        </div>
        <div
          v-if="!loading && !error"
          class="mt-4 text-xs"
          :class="theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'"
        >
          {{ citationText }}
        </div>
      </div>

      <div
        class="flex items-center justify-between px-4 py-3 border-t"
        :class="theme === 'dark' ? 'border-neutral-700 bg-neutral-800' : 'border-gray-200 bg-gray-100'"
      >
        <div
          class="text-xs"
          :class="theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'"
        >
          Updated {{ formatLastUpdated(lastUpdated) }}
        </div>
        <a
          :href="fullIndexUrl"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-1.5 text-xs font-medium transition-colors"
          :class="theme === 'dark' ? 'text-brand-600 hover:text-brand-700' : 'text-brand-600 hover:text-brand-700'"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          Powered by Remit-Scout
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PulseLineChart from '~/components/pulse/PulseLineChart.vue'
import { getIndexSeries } from '~/lib/indicesApi'
import type { IndexKey } from '~/types/indices'
import type { ChartSeries } from '~/types/pulse'

definePageMeta({
  layout: false,
})

const route = useRoute()
const config = useRuntimeConfig()

const theme = computed(() => (route.query.theme as 'dark' | 'light') || 'dark')
const indexKey = computed(() => route.params.index as IndexKey)
const corridorId = computed(() => (route.query.corridor_id as string) || 'US-PH-USD-PHP')
const amountBucket = computed(() => Number.parseInt(route.query.amount_bucket as string) || 500)
const methodProfile = computed(() => (route.query.method_profile as string) || 'standard_bank')
const days = computed(() => Number.parseInt(route.query.days as string) || 30)
const apiKey = computed(() => (route.query.api_key as string) || '')

const indexMeta: Record<IndexKey, { title: string, color: string, unit: 'rate' | 'percent' | 'bps', unitLabel: string }> = {
  teer: { title: 'Total Effective Exchange Rate (TEER)', color: '#16a34a', unit: 'rate', unitLabel: 'rate' },
  rci: { title: 'Remittance Cost Index (RCI)', color: '#f97316', unit: 'percent', unitLabel: 'percent' },
  rvi_bps: { title: 'Remittance Volatility Index (RVI) · bps', color: '#0ea5e9', unit: 'bps', unitLabel: 'bps' },
}

const loading = ref(true)
const error = ref<string | null>(null)
const apiKeyWarning = ref<string | null>(null)
const chartSeries = ref<ChartSeries[]>([])
const lastUpdated = ref('')
const weightingLabel = ref('synthetic volume weighted')

const meta = computed(() => indexMeta[indexKey.value])
const chartTitle = computed(() => meta.value?.title || 'Index')
const unit = computed(() => meta.value?.unit || 'rate')
const unitLabel = computed(() => meta.value?.unitLabel || 'rate')
const methodLabel = computed(() => {
  if (methodProfile.value === 'standard_card') return 'Card to Bank'
  if (methodProfile.value === 'cash_pickup') return 'Cash Pickup'
  return 'Bank to Bank'
})
const corridorLabel = computed(() => corridorId.value.toUpperCase())
const citationText = computed(() => {
  return `Source: Remit-Scout (${indexKey.value.toUpperCase()}) · ${weightingLabel.value} · Retrieved ${new Date().toLocaleDateString()}`
})

const fullIndexUrl = computed(() => {
  const baseUrl = config.public.siteUrl || ''
  const anchor = indexKey.value === 'teer'
    ? 'teer'
    : indexKey.value === 'rci'
      ? 'rci'
      : 'rvi'
  return `${baseUrl}/indices-methodology#${anchor}`
})

function formatLastUpdated(timestamp: string): string {
  if (!timestamp) return 'unknown'
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString()
}

onMounted(async () => {
  if (!meta.value) {
    error.value = 'Invalid index type.'
    loading.value = false
    return
  }
  if (!apiKey.value) {
    if (config.public.pulseEnabled) {
      apiKeyWarning.value = 'API key is required for production embeds. Provide api_key to remove this warning.'
    }
    else {
      error.value = 'Missing API key.'
      loading.value = false
      return
    }
  }

  try {
    const data = await getIndexSeries({
      corridor_id: corridorId.value.toUpperCase(),
      amount_bucket: amountBucket.value,
      method_profile: methodProfile.value,
      days: days.value,
      ...(apiKey.value ? { api_key: apiKey.value } : {}),
    })
    lastUpdated.value = data.lastUpdated || ''
    weightingLabel.value = data.weightingModel?.replace(/_/g, ' ') || 'synthetic volume weighted'

    const points = data.series
      .filter(point => !point.suppressionFlag)
      .map((point) => {
        const rawValue = point[indexKey.value]
        if (rawValue === null || rawValue === undefined) return null
        const value = meta.value?.unit === 'percent' ? rawValue * 100 : rawValue
        return { t: new Date(point.date).getTime(), v: value }
      })
      .filter((point): point is { t: number, v: number } => Boolean(point))

    chartSeries.value = points.length
      ? [{
          id: indexKey.value,
          label: indexKey.value.toUpperCase(),
          color: meta.value.color,
          points,
        }]
      : []
  }
  catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load index data.'
  }
  finally {
    loading.value = false
  }
})

useHead({
  title: computed(() => meta.value ? `${meta.value.title} | Remit-Scout` : 'Index Embed'),
  bodyAttrs: {
    style: 'margin: 0; padding: 0;',
  },
})
</script>
