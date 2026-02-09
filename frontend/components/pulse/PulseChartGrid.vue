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
            :class="getCategoryIconBg()"
          >
            <Icon
              :name="getCategoryIcon(category.category)"
              :size="20"
              :class="getCategoryIconColor()"
            />
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">
              {{ category.label }}
            </h2>
            <p class="text-sm text-neutral-400">
              {{ getCategoryDescription(category.category) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ChartPreviewCard
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
import { computed } from 'vue'
import type { ChartCategory, ChartData, PulseFilters } from '~/types/pulse'
import { getAllCategories, isRangeGated } from '~/lib/pulseChartRegistry'
import { Icon, type IconName } from '~/ui'
import ChartPreviewCard from '~/domains/pulse/ui/ChartPreviewCard.vue'

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
