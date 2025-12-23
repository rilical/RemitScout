<template>
  <div class="space-y-10">
    <div
      v-for="category in categories"
      :key="category.category"
      :id="`category-${category.category}`"
    >
      <!-- Category Header -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl"
            :class="getCategoryIconBg()"
          >
            <component
              :is="getCategoryIcon(category.category)"
              class="h-5 w-5"
              :class="getCategoryIconColor()"
            />
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">{{ category.label }}</h2>
            <p class="text-sm text-neutral-400">{{ getCategoryDescription(category.category) }}</p>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <PulseChartCard
          v-for="chart in category.charts"
          :key="chart.id"
          :metadata="chart"
          :insight="getChartInsight(chart.id)"
          :sparkline-data="getSparklineData(chart.id)"
          :is-gated="isChartGated(chart.id)"
          @view="handleView"
          @share="handleShare"
          @embed="handleEmbed"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, computed } from 'vue'
import type { ChartCategory, ChartData, PulseFilters } from '~/types/pulse'
import { getAllCategories, isRangeGated } from '~/lib/pulseChartRegistry'

interface Props {
  chartData: Record<string, ChartData | null>
  filters: PulseFilters
  isPlus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isPlus: false,
})

const emit = defineEmits<{
  view: [chartId: string]
  share: [chartId: string]
  embed: [chartId: string]
}>()

const categories = computed(() => getAllCategories())

function getChartInsight(chartId: string): string {
  const data = props.chartData[chartId]
  return data?.insight || 'Loading...'
}

function getSparklineData(chartId: string) {
  const data = props.chartData[chartId]
  if (!data || data.series.length === 0) return []
  return data.series[0].points
}

function isChartGated(chartId: string): boolean {
  return isRangeGated(chartId, '365d', props.isPlus)
}

function handleView(chartId: string) {
  emit('view', chartId)
}

function handleShare(chartId: string) {
  emit('share', chartId)
}

function handleEmbed(chartId: string) {
  emit('embed', chartId)
}

function getCategoryIconBg(): string {
  return 'bg-brand-600/20'
}

function getCategoryIconColor(): string {
  return 'text-brand-600'
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

const CostIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
])

const DeliveredIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' })
])

const VolatilityIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M13 10V3L4 14h7v7l9-11h-7z' })
])

const AvailabilityIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
])

function getCategoryIcon(category: ChartCategory) {
  switch (category) {
    case 'cost-markup':
      return CostIcon
    case 'delivered-amount':
      return DeliveredIcon
    case 'volatility':
      return VolatilityIcon
    case 'availability':
      return AvailabilityIcon
    default:
      return CostIcon
  }
}
</script>



