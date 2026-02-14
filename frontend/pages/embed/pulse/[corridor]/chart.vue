<template>
  <div
    class="min-h-screen"
    :class="isDark ? 'bg-neutral-900' : 'bg-surface'"
  >
    <!-- Compact Header -->
    <div
      class="border-b px-4 py-3"
      :class="isDark ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-neutral-50'"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="text-h4">{{ corridorData?.fromFlag }}</span>
            <svg
              class="h-3 w-3"
              :class="isDark ? 'text-neutral-500' : 'text-neutral-400'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
            <span class="text-h4">{{ corridorData?.toFlag }}</span>
          </div>
          <div>
            <div
              class="text-body-sm font-semibold"
              :class="isDark ? 'text-white' : 'text-neutral-900'"
            >
              <template v-if="corridorData?.label">
                {{ corridorData.label }}
              </template>
              <template v-else>
                <SkeletonBlock
                  width="10rem"
                  height="0.875rem"
                  :tone="isDark ? 'dark' : 'light'"
                />
                <span class="sr-only">Loading corridor</span>
              </template>
            </div>
            <div
              class="text-body-sm"
              :class="isDark ? 'text-neutral-400' : 'text-neutral-500'"
            >
              True Cost vs Mid-Market
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span
            v-if="heroData?.lastUpdated"
            class="relative flex h-2 w-2"
            aria-hidden="true"
          >
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-600 opacity-75" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
          </span>
          <span
            class="text-body-sm"
            :class="isDark ? 'text-neutral-400' : 'text-neutral-500'"
          >
            {{ updatedLabel }}
          </span>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="p-4">
      <div
        v-if="loading"
        class="flex h-64 w-full items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Loading chart"
      >
        <SkeletonBlock
          width="full"
          height="16rem"
          :tone="isDark ? 'dark' : 'light'"
        />
        <span class="sr-only">Loading chart</span>
      </div>

      <div
        v-else-if="loadError"
        class="flex h-64 items-center justify-center text-body-sm"
        :class="isDark ? 'text-neutral-300' : 'text-neutral-700'"
      >
        {{ loadError }}
      </div>

      <div
        v-else
        class="h-64"
      >
        <v-chart
          class="h-full w-full"
          :option="chartOption"
          autoresize
        />
      </div>

      <!-- Key Stats -->
      <div
        class="mt-4 grid grid-cols-3 gap-4 border-t pt-4"
        :class="isDark ? 'border-neutral-700' : 'border-neutral-200'"
      >
        <div>
          <div
            class="text-body-sm"
            :class="isDark ? 'text-neutral-500' : 'text-neutral-500'"
          >
            Current Spread
          </div>
          <div class="text-body-lg font-bold text-brand-600">
            {{ heroData?.currentSpreadPercent.toFixed(2) }}%
          </div>
        </div>
        <div>
          <div
            class="text-body-sm"
            :class="isDark ? 'text-neutral-500' : 'text-neutral-500'"
          >
            Best Provider
          </div>
          <div
            class="text-body-lg font-bold"
            :class="isDark ? 'text-white' : 'text-neutral-900'"
          >
            {{ heroData?.bestProvider }}
          </div>
        </div>
        <div>
          <div
            class="text-body-sm"
            :class="isDark ? 'text-neutral-500' : 'text-neutral-500'"
          >
            You Save
          </div>
          <div class="text-body-lg font-bold text-brand-600">
            ${{ heroData?.lossOn1000.toFixed(2) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Attribution Footer -->
    <div
      class="border-t px-4 py-3"
      :class="isDark ? 'border-neutral-700 bg-neutral-800/50' : 'border-neutral-200 bg-neutral-50'"
    >
      <div class="flex items-center justify-between">
        <div
          class="text-body-sm"
          :class="isDark ? 'text-neutral-400' : 'text-neutral-500'"
        >
          {{ updatedLabel }}
        </div>
        <a
          :href="pulseUrl"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-1 text-body-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          <span>Powered by</span>
          <span class="font-bold">Remit-Scout</span>
          <svg
            class="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getCorridors, getCorridorBySlug, getHeroChartData, type HeroChartData } from '~/lib/pulseApi'
import type { PulseCorridor, PulseTimeframe } from '~/stores/pulse'
import type { CorridorOption } from '~/types/pulse'
import { formatUpdatedLabel } from '~/shared/lib/format'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import { setSeo } from '~/composables/useSeo'
import { useStructuredData } from '~/composables/useStructuredData'

const { pulseEnabled } = useFeatureFlags()

if (!pulseEnabled.value) {
  await navigateTo('/plus', { redirectCode: 302 })
}

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig.public.siteUrl || 'https://remit-scout.com'
const embedUrl = computed(() => `${siteUrl}${route.path}`)
const { addVideoObjectSchema } = useStructuredData()

const loading = ref(true)
const heroData = ref<HeroChartData | null>(null)
const loadError = ref<string | null>(null)

const isDark = computed(() => {
  return route.query.theme !== 'light'
})

const corridorSlug = computed(() => {
  return route.params.corridor as string
})

const timeframe = computed<PulseTimeframe>(() => {
  const tf = route.query.timeframe as string
  if (['24H', '7D', '30D', '1Y', 'MAX'].includes(tf)) {
    return tf as PulseTimeframe
  }
  return '7D'
})

const { data: corridorList } = await useAsyncData('pulse-corridors', () => getCorridors())

const corridorOption = computed<CorridorOption | undefined>(() => {
  const byCache = getCorridorBySlug(corridorSlug.value)
  if (byCache) return byCache
  return (corridorList.value || []).find(c => (c.slug || c.value) === corridorSlug.value || c.value === corridorSlug.value)
})

const corridorData = computed<PulseCorridor | null>(() => {
  const option = corridorOption.value
  if (!option) return null

  const corridorId = option.corridorId
  const parts = corridorId ? corridorId.split('-') : []
  const fromCountry = (option.sourceCountry || parts[0] || 'US').toUpperCase()
  const toCountry = (option.destCountry || parts[1] || 'PH').toUpperCase()

  return {
    from: fromCountry,
    to: toCountry,
    fromCode: option.fromCode,
    toCode: option.toCode,
    fromFlag: option.fromFlag,
    toFlag: option.toFlag,
    label: option.label,
    slug: String(option.slug || option.value || corridorSlug.value),
    corridorId,
  }
})

const pulseUrl = computed(() => {
  const base = runtimeConfig.public.siteUrl || ''
  return base ? `${base}/pulse` : '/pulse'
})

watchEffect(() => {
  const corridorLabel = corridorOption.value?.label || corridorSlug.value
  const title = `Embed: Pulse for ${corridorLabel} | Remit-Scout`
  const description = 'Embeddable Remit-Scout Pulse chart.'

  setSeo({
    title,
    description,
    canonical: embedUrl.value,
    noindex: true,
  })

  addVideoObjectSchema({
    name: title,
    description,
    thumbnailUrl: `${siteUrl}/og-image.png`,
    uploadDate: new Date().toISOString(),
    contentUrl: `${siteUrl}/pulse?corridor=${encodeURIComponent(corridorSlug.value)}`,
    embedUrl: embedUrl.value,
  })
})

const updatedLabel = computed(() => formatUpdatedLabel(heroData.value?.lastUpdated ?? null))

const chartOption = computed(() => {
  if (!heroData.value) return {}

  const points = heroData.value.points
  const times = points.map(p => new Date(p.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
  }))

  const midMarketData = points.map(p => p.midMarketRate)
  const bestProviderData = points.map(p => p.bestProviderRate)

  const minRate = Math.min(...bestProviderData) * 0.998
  const maxRate = Math.max(...midMarketData) * 1.002

  const textColor = isDark.value ? '#9ca3af' : '#6b7280'
  const gridColor = isDark.value ? '#404040' : '#e5e7eb'

  return {
    backgroundColor: 'transparent',
    grid: {
      left: 50,
      right: 15,
      top: 15,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: { lineStyle: { color: gridColor } },
      axisLabel: { color: textColor, fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: minRate,
      max: maxRate,
      axisLine: { show: false },
      axisLabel: {
        color: textColor,
        fontSize: 10,
        formatter: (value: number) => value.toFixed(2),
      },
      splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
      textStyle: { color: isDark.value ? '#ffffff' : '#111827' },
    },
    series: [
      {
        name: 'Mid-Market',
        type: 'line',
        data: midMarketData,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#9ca3af', width: 1.5, type: 'dashed' },
      },
      {
        name: 'Best Provider',
        type: 'line',
        data: bestProviderData,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#2563EB', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.2)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0)' },
            ],
          },
        },
      },
    ],
  }
})

async function loadData() {
  loading.value = true
  loadError.value = null
  try {
    const corridor = corridorData.value
    if (corridor) {
      heroData.value = await getHeroChartData(corridor, timeframe.value, 1000)
    }
  }
  catch (e) {
    loadError.value = 'Unable to load embed data.'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

definePageMeta({
  layout: false,
})

useHead({
  title: `${corridorData.value?.label || 'Transfer'} Rates | Remit-Scout Pulse`,
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
})
</script>
