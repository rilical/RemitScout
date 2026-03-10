<template>
  <div class="space-y-10">
    <div
      v-for="category in categories"
      :id="`category-${category.category}`"
      :key="category.category"
    >
      <!-- Category Header -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl"
            :class="getCategoryIconBg(category.category)"
          >
            <Icon
              :name="getCategoryIcon(category.category)"
              :size="20"
              :class="getCategoryIconColor(category.category)"
            />
          </div>
          <div>
            <h2 class="text-h4 font-bold text-white">
              {{ category.label }}
            </h2>
            <p class="text-body-sm text-neutral-400">
              {{ getCategoryDescription(category.category) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <LazyChartSlot
          v-for="chart in category.charts"
          :key="chart.id"
          :chart-id="chart.id"
        >
          <ChartPreviewCard
            :metadata="chart"
            :insight="getChartInsight(chart.id)"
            :sparkline-data="getSparklineData(chart.id)"
            :updated-at="getChartUpdatedAt(chart.id)"
            :is-gated="isChartGated(chart)"
            :teaser-mode="isTeaserChart(chart)"
            :gate-label="isChartGated(chart) ? 'Full' : undefined"
            :cta-to="isChartGated(chart) ? '/contact?type=enterprise&topic=pulse' : undefined"
            :cta-label="isChartGated(chart) ? 'Contact sales' : undefined"
            :disable-actions="isChartGated(chart)"
            :days-available="props.daysAvailable"
            :can-embed="props.canEmbed"
            @view="handleView"
            @embed="handleEmbed"
          />
        </LazyChartSlot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, onMounted, onUnmounted } from 'vue'
import type { ChartCategory, ChartData, ChartMetadata, PulseFilters } from '~/types/pulse'
import { getAllCategories } from '~/lib/pulseChartRegistry'
import { Icon, type IconName } from '~/ui'
import ChartPreviewCard from '~/domains/pulse/ui/ChartPreviewCard.vue'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'
import type { PulseLevel } from '~/composables/useEntitlements'

type ChartAvailabilityEntry = {
  dataAvailable: boolean
  updatedAt: string | null
  source: 'gold_export' | 'gold_cache' | 'none'
}

interface Props {
  chartData: Record<string, ChartData | null>
  chartAvailability?: Record<string, ChartAvailabilityEntry>
  filters: PulseFilters
  pulseLevel?: PulseLevel
  daysAvailable?: number
  canEmbed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pulseLevel: 'none',
  chartAvailability: () => ({}),
  daysAvailable: 0,
  canEmbed: false,
})

const emit = defineEmits<{
  view: [chartId: string]
  embed: [chartId: string]
}>()

// Lazy loading wrapper component using IntersectionObserver
const LazyChartSlot = defineComponent({
  name: 'LazyChartSlot',
  props: {
    chartId: { type: String, required: true },
  },
  setup(lazyProps, { slots }) {
    const containerRef = ref<HTMLElement | null>(null)
    const isVisible = ref(false)
    let observer: IntersectionObserver | null = null

    onMounted(() => {
      if (!containerRef.value) return
      const observedEl = containerRef.value as unknown as Element
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            isVisible.value = true
            observer?.disconnect()
          }
        },
        { rootMargin: '200px' },
      )
      observer.observe(observedEl)
    })

    onUnmounted(() => {
      observer?.disconnect()
    })

    return () =>
      h('div', { 'ref': containerRef, 'data-chart-id': lazyProps.chartId }, [
        isVisible.value
          ? slots.default?.()
          : h('div', {
              class: 'card-surface p-5',
            }, [
              h(SkeletonBlock, { width: '40%', height: '14', rounded: 'md', tone: 'dark' }),
              h(SkeletonBlock, { width: '70%', height: '20', rounded: 'md', tone: 'dark', class: 'mt-3' }),
              h(SkeletonBlock, { width: 'full', height: '80', rounded: 'lg', tone: 'dark', class: 'mt-4' }),
            ]),
      ])
  },
})

const categories = computed(() => {
  const all = getAllCategories()
  if (props.pulseLevel === 'full') return all
  return all
    .map(cat => ({
      ...cat,
      charts: cat.charts.filter(c => !ENTERPRISE_ONLY_CHART_IDS.has(c.id) && !TEASER_CHART_IDS.has(c.id)),
    }))
    .filter(cat => cat.charts.length > 0)
})

function getChartInsight(chartId: string): string {
  const data = props.chartData[chartId]
  const insight = data?.insight?.trim() || ''
  if (insight) return insight

  const availability = props.chartAvailability?.[chartId]
  if (availability && !availability.dataAvailable) {
    return 'Data pending for this corridor.'
  }

  return ''
}

function getSparklineData(chartId: string) {
  const data = props.chartData[chartId]
  if (!data || data.series.length === 0) return []
  return data.series[0].points
}

function getChartUpdatedAt(chartId: string): string | null {
  const availabilityUpdatedAt = props.chartAvailability?.[chartId]?.updatedAt
  if (availabilityUpdatedAt) return availabilityUpdatedAt
  return props.chartData[chartId]?.updatedAt ?? null
}

const TEASER_CHART_IDS = new Set([
  'provider-winner',
  'pass-through-latency',
  'quote-anomalies',
  'data-freshness',
  'indices-confidence',
  'indices-provider-count',
  'indices-suppression',
])
const ENTERPRISE_ONLY_CHART_IDS = new Set(['corridor-liquidity'])

function isTeaserChart(chart: ChartMetadata): boolean {
  return props.pulseLevel !== 'full' && TEASER_CHART_IDS.has(chart.id)
}

function isChartGated(chart: ChartMetadata): boolean {
  if (props.pulseLevel === 'full') return false
  if (ENTERPRISE_ONLY_CHART_IDS.has(chart.id)) return true
  return TEASER_CHART_IDS.has(chart.id)
}

function handleView(chartId: string) {
  emit('view', chartId)
}

function handleEmbed(chartId: string) {
  emit('embed', chartId)
}

function getCategoryIconBg(category: ChartCategory): string {
  switch (category) {
    case 'cost-markup':
      return 'bg-blue-500/15'
    case 'delivered-amount':
      return 'bg-emerald-500/15'
    case 'volatility':
      return 'bg-amber-500/15'
    case 'availability':
      return 'bg-violet-500/15'
    default:
      return 'bg-neutral-500/15'
  }
}

function getCategoryIconColor(category: ChartCategory): string {
  switch (category) {
    case 'cost-markup':
      return 'text-blue-400'
    case 'delivered-amount':
      return 'text-emerald-400'
    case 'volatility':
      return 'text-amber-400'
    case 'availability':
      return 'text-violet-400'
    default:
      return 'text-neutral-400'
  }
}

function getCategoryDescription(category: ChartCategory): string {
  switch (category) {
    case 'cost-markup':
      return 'All-in cost, FX markup, and fee/markup decomposition'
    case 'delivered-amount':
      return 'Leader shifts, edge vs #2, and pass-through response'
    case 'volatility':
      return 'Dispersion, anomalies, and spread volatility'
    case 'availability':
      return 'Quote success, freshness, and liquidity signals'
    default:
      return ''
  }
}

function getCategoryIcon(category: ChartCategory): IconName {
  switch (category) {
    case 'cost-markup':
      return 'currency-dollar'
    case 'delivered-amount':
      return 'arrow-trending-up'
    case 'volatility':
      return 'bolt'
    case 'availability':
      return 'chart-bar'
    default:
      return 'currency-dollar'
  }
}
</script>
