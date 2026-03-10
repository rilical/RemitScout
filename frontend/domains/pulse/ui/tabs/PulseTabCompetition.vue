<template>
  <div class="space-y-6">
    <!-- ROW 1: Section Header -->
    <RsSectionHeader
      title="Provider Competition"
      description="Leaderboard, benchmarking, and competitive dynamics across providers"
      icon="🏆"
      :variant="variant"
    />

    <!-- Loading state -->
    <template v-if="loading">
      <div class="animate-pulse space-y-4">
        <div :class="[skeletonBg, 'h-40 rounded-xl']" />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div :class="[skeletonBg, 'h-28 rounded-xl']" />
          <div :class="[skeletonBg, 'h-28 rounded-xl']" />
        </div>
      </div>
    </template>

    <!-- Error state -->
    <template v-else-if="loadError">
      <EmptyState
        :variant="variant"
        reason="error"
        title="Could not load competition data"
        :description="loadError"
      />
    </template>

    <!-- No corridor selected -->
    <template v-else-if="!corridor">
      <EmptyState
        :variant="variant"
        reason="no-corridor"
      />
    </template>

    <!-- Light layout -->
    <template v-else-if="density === 'light'">
      <!-- ROW 2: Provider leaderboard (top 5 compact) -->
      <div :class="[cardSurface, 'overflow-hidden']">
        <div
          class="px-4 py-3 border-b"
          :class="variant === 'terminal' ? 'border-neutral-700' : 'border-neutral-200'"
        >
          <p
            class="text-sm font-semibold"
            :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
          >
            Top Providers
          </p>
          <p
            class="text-xs mt-0.5"
            :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
          >
            Ranked by delivered amount for selected filters
          </p>
        </div>

        <div v-if="benchmarkRows.length === 0">
          <div
            class="px-4 py-8 text-center text-sm"
            :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
          >
            No provider data available for this corridor.
          </div>
        </div>

        <ul v-else class="divide-y" :class="variant === 'terminal' ? 'divide-neutral-700' : 'divide-neutral-100'">
          <li
            v-for="(row, index) in top5Rows"
            :key="row.provider"
            class="flex items-center gap-3 px-4 py-3 transition-colors"
            :class="[
              index === 0
                ? 'border-l-2 border-emerald-500'
                : '',
              variant === 'terminal'
                ? 'hover:bg-neutral-800/60'
                : 'hover:bg-neutral-50',
            ]"
          >
            <!-- Rank badge -->
            <span
              class="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0"
              :class="index === 0
                ? 'bg-emerald-500 text-white'
                : variant === 'terminal'
                  ? 'bg-neutral-700 text-neutral-300'
                  : 'bg-neutral-100 text-neutral-600'"
            >{{ index + 1 }}</span>

            <!-- Provider logo + name -->
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <img
                :src="getProviderLogoPath(row.provider)"
                :alt="row.provider"
                width="20"
                height="20"
                class="w-5 h-5 object-contain shrink-0"
                loading="lazy"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              >
              <span
                class="text-sm font-medium truncate"
                :class="variant === 'terminal' ? 'text-neutral-200' : 'text-neutral-800'"
              >{{ row.provider }}</span>
            </div>

            <!-- Delivered amount -->
            <span
              class="text-sm tabular-nums shrink-0"
              :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-700'"
            >
              {{ formatDelivered(row.deliveredAmount) }}
            </span>

            <!-- Cost % -->
            <span
              class="text-xs tabular-nums shrink-0 font-medium"
              :class="index === 0
                ? 'text-emerald-500'
                : variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
            >
              {{ formatCostPct(row.totalCostBps) }}
            </span>
          </li>
        </ul>
      </div>

      <!-- ROW 3: Summary cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Card 1: Leader This Period -->
        <div
          :class="[cardSurface, 'p-5']"
        >
          <p
            class="text-xs font-semibold uppercase tracking-wider mb-3"
            :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
          >
            Leader This Period
          </p>
          <div v-if="leaderRow" class="flex items-center gap-3">
            <img
              :src="getProviderLogoPath(leaderRow.provider)"
              :alt="leaderRow.provider"
              width="40"
              height="40"
              class="w-10 h-10 object-contain shrink-0"
              loading="lazy"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            >
            <div class="min-w-0">
              <p
                class="text-base font-semibold truncate"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >{{ leaderRow.provider }}</p>
              <p
                class="text-sm mt-0.5"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                {{ leaderWinLabel }}
              </p>
            </div>
          </div>
          <div
            v-else
            class="text-sm"
            :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
          >
            No leader data available
          </div>
        </div>

        <!-- Card 2: Leader Edge vs #2 -->
        <RsStatCard
          label="Leader Edge vs #2"
          :value="leaderEdgeLabel"
          :delta="leaderEdgeDelta"
          :delta-type="leaderEdgeDeltaType"
          delta-label="cost advantage"
          :variant="variant"
          :sparkline="leaderEdgeSparkline"
          sparkline-color="#10B981"
        />
      </div>
    </template>

    <!-- Enterprise layout -->
    <template v-else>
      <!-- ROW 2: Full sortable benchmarking table -->
      <RsPulseTable
        :variant="variant"
        caption="Provider Benchmarking Table"
        :columns="benchmarkColumns"
        :rows="rankedBenchmarkRows"
        :row-key="(row) => String((row as Record<string, unknown>).provider ?? '')"
        :loading="loading"
        :empty="rankedBenchmarkRows.length === 0 ? { title: 'No provider data', message: 'No benchmarking data available for this corridor and filters.' } : null"
        provider-column="provider"
        :highlight-best="{ column: 'deliveredAmount', direction: 'max' }"
        :dense="true"
        :sticky-header="true"
        :on-sort-change="handleSortChange"
        :sort="tableSort"
      />

      <!-- ROW 3: Fee vs Markup + Spread Distribution -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Fee vs Markup Decomposition"
          subtitle="Stacked breakdown of transfer cost components"
          :variant="variant"
          :loading="chartsLoading"
          :data-available="isFeeVsMarkupAvailable"
          :updated-at="feeVsMarkupChart?.updatedAt"
          :empty="!isFeeVsMarkupAvailable ? { title: 'No data', message: 'Fee decomposition data not available.' } : null"
        >
          <template #chart>
            <RsChart
              :option="feeVsMarkupOption"
              height="standard"
              :theme="echartsTheme"
            />
          </template>
        </ChartCard>

        <ChartCard
          title="Spread Distribution"
          subtitle="Distribution of bid-ask spreads across providers"
          :variant="variant"
          :loading="chartsLoading"
          :data-available="isSpreadDistributionAvailable"
          :updated-at="spreadDistributionChart?.updatedAt"
          :empty="!isSpreadDistributionAvailable ? { title: 'No data', message: 'Spread distribution data not available.' } : null"
        >
          <template #chart>
            <RsChart
              :option="spreadDistributionOption"
              height="standard"
              :theme="echartsTheme"
            />
          </template>
        </ChartCard>
      </div>

      <!-- ROW 4: Provider Winner Timeline + Leader Change Frequency -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Provider Winner Timeline"
          subtitle="Who led each day over the selected period"
          :variant="variant"
          :loading="chartsLoading"
          :data-available="isProviderWinnerAvailable"
          :updated-at="providerWinnerChart?.updatedAt"
          :empty="!isProviderWinnerAvailable ? { title: 'No data', message: 'Winner timeline data not available.' } : null"
        >
          <template #chart>
            <RsChart
              :option="providerWinnerOption"
              height="standard"
              :theme="echartsTheme"
            />
          </template>
        </ChartCard>

        <ChartCard
          title="Leader Change Frequency"
          subtitle="How often the market leader changes"
          :variant="variant"
          :loading="chartsLoading"
          :data-available="isLeaderChangeAvailable"
          :updated-at="leaderChangeChart?.updatedAt"
          :empty="!isLeaderChangeAvailable ? { title: 'No data', message: 'Leader change data not available.' } : null"
        >
          <template #chart>
            <RsChart
              :option="leaderChangeOption"
              height="standard"
              :theme="echartsTheme"
            />
          </template>
        </ChartCard>
      </div>

      <!-- ROW 5: Leader Edge vs #2 + Pass-Through Latency -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Leader Edge vs #2"
          subtitle="Basis point advantage of top provider over runner-up"
          :variant="variant"
          :loading="chartsLoading"
          :data-available="isLeaderEdgeAvailable"
          :updated-at="leaderEdgeChart?.updatedAt"
          :empty="!isLeaderEdgeAvailable ? { title: 'No data', message: 'Leader edge data not available.' } : null"
        >
          <template #chart>
            <RsChart
              :option="leaderEdgeOption"
              height="standard"
              :theme="echartsTheme"
            />
          </template>
        </ChartCard>

        <ChartCard
          title="Pass-Through Latency"
          subtitle="Time for FX moves to appear in provider prices"
          :variant="variant"
          :loading="chartsLoading"
          :data-available="isPassThroughAvailable"
          :updated-at="passThroughChart?.updatedAt"
          :empty="!isPassThroughAvailable ? { title: 'No data', message: 'Pass-through latency data not available.' } : null"
        >
          <template #chart>
            <RsChart
              :option="passThroughOption"
              height="standard"
              :theme="echartsTheme"
            />
          </template>
        </ChartCard>
      </div>

      <!-- ROW 6: Provider Heatmap -->
      <ChartCard
        title="Provider Heatmap"
        subtitle="Daily winner map — which provider led on each day"
        :variant="variant"
        :loading="heatmapLoading"
        :data-available="isHeatmapAvailable"
        :updated-at="heatmapData?.lastUpdated ?? null"
        :empty="!isHeatmapAvailable ? { title: 'No data', message: 'Provider heatmap data not available.' } : null"
      >
        <template #chart>
          <RsChart
            :option="heatmapOption"
            height="tall"
            :theme="echartsTheme"
          />
        </template>
      </ChartCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PulseDensity, PulseFilters, PulseProviderBenchmarkRow } from '~/types/pulse'
import { usePulseStore, type PulseCorridor } from '~/stores/pulse'
import type { DataTableSort } from '~/ui/DataTable/types'
import { getProviderLogoPath } from '~/composables/useProviderLogo'
import { usePulseTheme } from '~/composables/usePulseTheme'
import { usePulseDataSafety } from '~/composables/usePulseDataSafety'
import {
  getProviderBenchmarkingData,
  getChartsBatch,
  getProviderHeatmapData,
} from '~/lib/pulseApi'
import type { ProviderHeatmapData, PulseChartsBatchItem } from '~/lib/pulseApi'
import {
  buildChartOption,
  buildBarOption,
  buildHeatmapOption,
} from '~/lib/pulseChartBuilders'
import RsSectionHeader from '~/ui/layout/RsSectionHeader.vue'
import RsStatCard from '~/ui/cards/RsStatCard.vue'
import RsChart from '~/ui/charts/RsChart.vue'
import ChartCard from '~/ui/charts/ChartCard.vue'
import RsPulseTable from '~/ui/DataTable/RsPulseTable.vue'
import EmptyState from '~/ui/states/EmptyState.vue'

// ----- Props -----

interface Props {
  density: PulseDensity
  corridor: PulseCorridor | null
  filters: PulseFilters
}

const props = defineProps<Props>()

// ----- Store + Theme -----

const store = usePulseStore()
const { variant, echartsTheme, cardSurface } = usePulseTheme()
const { isChartAvailable } = usePulseDataSafety()

// ----- State -----

const loading = ref(false)
const loadError = ref<string | null>(null)
const chartsLoading = ref(false)
const heatmapLoading = ref(false)

const benchmarkRows = ref<PulseProviderBenchmarkRow[]>([])
const heatmapData = ref<ProviderHeatmapData | null>(null)

// Chart batch items keyed by chart id
const chartItems = ref<Record<string, PulseChartsBatchItem>>({})

const tableSort = ref<DataTableSort | null>(null)

// ----- Derived: Benchmark table -----

const benchmarkColumns = [
  { key: 'rank', label: 'Rank', sortable: false, align: 'center' as const, widthClass: 'w-12' },
  { key: 'provider', label: 'Provider', sortable: true, align: 'left' as const },
  { key: 'deliveredAmount', label: 'Delivered', sortable: true, align: 'right' as const },
  { key: 'totalCost', label: 'Cost', sortable: true, align: 'right' as const },
  { key: 'fee', label: 'Fee', sortable: true, align: 'right' as const },
  { key: 'markupBps', label: 'FX Markup', sortable: true, align: 'right' as const },
  { key: 'speed', label: 'Speed', sortable: false, align: 'left' as const },
  { key: 'winRate', label: 'Win Rate', sortable: true, align: 'right' as const },
  { key: 'reliability', label: 'Reliability', sortable: true, align: 'right' as const },
]

const sortedBenchmarkRows = computed(() => {
  if (!tableSort.value) return benchmarkRows.value
  const { key, direction } = tableSort.value
  return [...benchmarkRows.value].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[key]
    const bVal = (b as Record<string, unknown>)[key]
    const aNum = typeof aVal === 'number' ? aVal : Number.NEGATIVE_INFINITY
    const bNum = typeof bVal === 'number' ? bVal : Number.NEGATIVE_INFINITY
    return direction === 'asc' ? aNum - bNum : bNum - aNum
  })
})

// Rows with rank column injected for display
const rankedBenchmarkRows = computed(() =>
  sortedBenchmarkRows.value.map((row, i) => ({
    ...row,
    rank: i + 1,
    deliveredAmount: formatDelivered(row.deliveredAmount),
    totalCost: formatCostPct(row.totalCostBps),
    fee: `$${row.fee.toFixed(2)}`,
    markupBps: `${row.markupBps} bps`,
    winRate: `${(row.winRate * 100).toFixed(0)}%`,
    reliability: `${(row.reliability * 100).toFixed(0)}%`,
  })),
)

// ----- Light layout helpers -----

const top5Rows = computed(() => benchmarkRows.value.slice(0, 5))
const leaderRow = computed(() => benchmarkRows.value[0] ?? null)

const leaderWinLabel = computed(() => {
  if (!leaderRow.value) return ''
  const winPct = (leaderRow.value.winRate * 100).toFixed(0)
  return `${winPct}% win rate this period`
})

const leaderEdgeLabel = computed(() => {
  if (benchmarkRows.value.length < 2) return '—'
  const leader = benchmarkRows.value[0]
  const runner = benchmarkRows.value[1]
  const edgeBps = runner.totalCostBps - leader.totalCostBps
  return edgeBps > 0 ? `+${edgeBps.toFixed(1)} bps` : `${edgeBps.toFixed(1)} bps`
})

const leaderEdgeDelta = computed(() => {
  if (benchmarkRows.value.length < 2) return undefined
  const leader = benchmarkRows.value[0]
  const runner = benchmarkRows.value[1]
  const edgeBps = runner.totalCostBps - leader.totalCostBps
  return `${edgeBps > 0 ? '+' : ''}${edgeBps.toFixed(1)} bps`
})

const leaderEdgeDeltaType = computed<'positive' | 'negative' | 'neutral'>(() => {
  if (benchmarkRows.value.length < 2) return 'neutral'
  const leader = benchmarkRows.value[0]
  const runner = benchmarkRows.value[1]
  return runner.totalCostBps > leader.totalCostBps ? 'positive' : 'neutral'
})

// Sparkline from leader-edge chart if available
const leaderEdgeSparkline = computed((): number[] => {
  const item = chartItems.value['leader-edge']
  if (!item?.chart?.series?.[0]?.points) return []
  return item.chart.series[0].points.map(p => p.v)
})

// ----- Chart availability -----

const feeVsMarkupChart = computed(() => chartItems.value['fee-vs-markup'] ?? null)
const spreadDistributionChart = computed(() => chartItems.value['spread-distribution'] ?? null)
const providerWinnerChart = computed(() => chartItems.value['provider-winner'] ?? null)
const leaderChangeChart = computed(() => chartItems.value['leader-change-frequency'] ?? null)
const leaderEdgeChart = computed(() => chartItems.value['leader-edge'] ?? null)
const passThroughChart = computed(() => chartItems.value['pass-through-latency'] ?? null)

const isFeeVsMarkupAvailable = computed(() => isChartAvailable(feeVsMarkupChart.value))
const isSpreadDistributionAvailable = computed(() => isChartAvailable(spreadDistributionChart.value))
const isProviderWinnerAvailable = computed(() => isChartAvailable(providerWinnerChart.value))
const isLeaderChangeAvailable = computed(() => isChartAvailable(leaderChangeChart.value))
const isLeaderEdgeAvailable = computed(() => isChartAvailable(leaderEdgeChart.value))
const isPassThroughAvailable = computed(() => isChartAvailable(passThroughChart.value))
const isHeatmapAvailable = computed(() => {
  return Boolean(heatmapData.value && heatmapData.value.days.length > 0)
})

// ----- Chart ECharts options -----

const feeVsMarkupOption = computed(() => {
  const item = feeVsMarkupChart.value
  if (!item?.chart?.series) return {}
  return buildChartOption('fee-vs-markup', item.chart.series)
})

const spreadDistributionOption = computed(() => {
  const item = spreadDistributionChart.value
  if (!item?.chart?.series) return {}
  return buildChartOption('spread-distribution', item.chart.series)
})

const providerWinnerOption = computed(() => {
  const item = providerWinnerChart.value
  if (!item?.chart?.series) return {}
  // Horizontal stacked bar
  return buildBarOption(item.chart.series, { stacked: true, horizontal: true })
})

const leaderChangeOption = computed(() => {
  const item = leaderChangeChart.value
  if (!item?.chart?.series) return {}
  return buildChartOption('leader-change-frequency', item.chart.series)
})

const leaderEdgeOption = computed(() => {
  const item = leaderEdgeChart.value
  if (!item?.chart?.series) return {}
  return buildChartOption('leader-edge', item.chart.series)
})

const passThroughOption = computed(() => {
  const item = passThroughChart.value
  if (!item?.chart?.series) return {}
  return buildChartOption('pass-through-latency', item.chart.series)
})

// ----- Heatmap option -----

const heatmapOption = computed(() => {
  if (!heatmapData.value || heatmapData.value.days.length === 0) return {}

  const days = heatmapData.value.days
  const providerNames = Object.keys(heatmapData.value.providerStats)

  // x = providers, y = days of week — shows win frequency per provider per weekday
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const xLabels = providerNames.length > 0 ? providerNames : ['—']
  const yLabels = dayNames

  // Build win matrix: wins per provider per day-of-week
  const winMatrix: Record<string, Record<number, number>> = {}
  for (const provider of xLabels) {
    winMatrix[provider] = {}
    for (let dow = 0; dow < 7; dow++) winMatrix[provider][dow] = 0
  }
  for (const d of days) {
    const dow = new Date(d.date).getDay()
    if (winMatrix[d.winner]) {
      winMatrix[d.winner][dow] = (winMatrix[d.winner][dow] ?? 0) + 1
    }
  }

  const heatData: Array<[number, number, number]> = []
  for (let xi = 0; xi < xLabels.length; xi++) {
    for (let yi = 0; yi < yLabels.length; yi++) {
      heatData.push([xi, yi, winMatrix[xLabels[xi]]?.[yi] ?? 0])
    }
  }

  return buildHeatmapOption(heatData, xLabels, yLabels)
})

// ----- Skeleton bg class -----

const skeletonBg = computed(() =>
  variant.value === 'terminal' ? 'bg-neutral-700/30' : 'bg-neutral-200',
)

// ----- Format helpers -----

function formatDelivered(amount: number): string {
  if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`
  return amount.toFixed(2)
}

function formatCostPct(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`
}

// ----- Table sort handler -----

function handleSortChange(next: DataTableSort) {
  tableSort.value = next
}

// ----- Data fetching -----

async function fetchBenchmarkData() {
  if (!props.corridor) {
    benchmarkRows.value = []
    return
  }
  loading.value = true
  loadError.value = null
  try {
    const rows = await getProviderBenchmarkingData(
      props.corridor,
      store.timeframe,
      props.filters.amount,
    )
    // Sort by deliveredAmount descending by default
    benchmarkRows.value = [...rows].sort((a, b) => b.deliveredAmount - a.deliveredAmount)
  }
  catch (err: unknown) {
    loadError.value = err instanceof Error ? err.message : 'Failed to load provider data.'
    benchmarkRows.value = []
  }
  finally {
    loading.value = false
  }
}

async function fetchCharts() {
  if (!props.corridor) return
  chartsLoading.value = true
  try {
    const chartIds = props.density === 'enterprise'
      ? [
          'fee-vs-markup',
          'spread-distribution',
          'provider-winner',
          'leader-change-frequency',
          'leader-edge',
          'pass-through-latency',
        ]
      : ['leader-edge']
    const range = timeframeToRange()
    const batch = await getChartsBatch(chartIds, props.filters, range)
    const map: Record<string, PulseChartsBatchItem> = {}
    for (const item of batch.charts) {
      map[item.id] = item
    }
    chartItems.value = map
  }
  catch {
    // Charts fail gracefully — individual ChartCard empty states handle it
    chartItems.value = {}
  }
  finally {
    chartsLoading.value = false
  }
}

async function fetchHeatmap() {
  if (!props.corridor || props.density !== 'enterprise') return
  heatmapLoading.value = true
  try {
    heatmapData.value = await getProviderHeatmapData(props.corridor, store.timeframe)
  }
  catch {
    heatmapData.value = null
  }
  finally {
    heatmapLoading.value = false
  }
}

function timeframeToRange(): '7d' | '30d' | '90d' | '365d' {
  const map: Record<string, '7d' | '30d' | '90d' | '365d'> = {
    '24H': '7d',
    '7D': '7d',
    '30D': '30d',
    '1Y': '365d',
    'MAX': '365d',
  }
  return map[store.timeframe] ?? '30d'
}

async function fetchAll() {
  if (props.density === 'enterprise') {
    await Promise.all([fetchBenchmarkData(), fetchCharts(), fetchHeatmap()])
  }
  else {
    await Promise.all([fetchBenchmarkData(), fetchCharts()])
  }
}

// ----- Watchers -----

watch(
  () => [props.corridor, props.filters, props.density, store.timeframe] as const,
  () => {
    fetchAll()
  },
  { immediate: true, deep: true },
)
</script>
