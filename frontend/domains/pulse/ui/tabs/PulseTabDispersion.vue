<template>
  <div class="space-y-6">
    <!-- Full-page empty state when corridor data is not safe -->
    <EmptyState
      v-if="!corridorSafe"
      :variant="variant"
      mode="page"
      :reason="emptyReason"
      :corridor-label="corridor?.label"
      :days-available="(corridor as any)?.daysAvailable"
    />

    <!-- Light layout -->
    <template v-else-if="density === 'light'">
      <!-- ROW 1: Section header -->
      <RsSectionHeader
        title="Pricing"
        description="How far apart active providers price the same $500 bank-deposit benchmark"
        icon-name="chart-bar"
        :variant="variant"
      />

      <!-- ROW 2: Hero chart — Effective Rate vs Mid-Market (full width) -->
      <ChartCard
        :variant="variant"
        title="Benchmark Cost vs FX Markup"
        subtitle="Cost (%) on the left axis and FX markup (bps) on the right"
        :loading="loadingCharts"
        :error="errorCharts ? { message: errorCharts } : null"
        :data-available="isChartAvailable(allInCostChart) || isChartAvailable(fxMarkupChart)"
        :empty="!isChartAvailable(allInCostChart) && !isChartAvailable(fxMarkupChart) ? { title: 'No chart data', message: 'Dispersion data is not available for this corridor yet.' } : null"
        :updated-at="allInCostChart?.updatedAt ?? fxMarkupChart?.updatedAt"
      >
        <template #chart>
          <RsChart
            :option="effectiveRateOption"
            height="standard"
            :theme="echartsTheme"
          />
        </template>
      </ChartCard>

      <!-- ROW 3: 2 metric cards -->
      <div class="grid grid-cols-2 gap-4">
        <RsStatCard
          label="Market Spread"
          :value="lightMetrics.spread"
          delta-label="bps"
          delta-type="neutral"
          :variant="variant"
          :loading="loadingOverview"
          tooltip="Spread between best and worst provider in basis points"
        />
        <RsStatCard
          label="Recipient Range"
          :value="lightMetrics.bestVsWorst"
          :delta="lightMetrics.savingsGap"
          delta-label="savings gap"
          delta-type="positive"
          :variant="variant"
          :loading="loadingOverview"
          tooltip="Comparison of best and worst delivered amounts across providers"
        />
      </div>
    </template>

    <!-- Enterprise layout -->
    <template v-else>
      <!-- ROW 1: Section header -->
      <RsSectionHeader
        title="Pricing"
        description="How far apart active providers price the same $500 bank-deposit benchmark"
        icon-name="chart-bar"
        :variant="variant"
      />

      <!-- ROW 2: Hero chart (8/12 cols) + Spread sidebar (4/12 cols) -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <!-- Hero chart -->
        <div class="lg:col-span-8">
          <ChartCard
            :variant="variant"
            title="Benchmark Cost vs FX Markup"
            subtitle="Cost (%) on the left axis and FX markup (bps) on the right"
            :loading="loadingCharts"
            :error="errorCharts ? { message: errorCharts } : null"
            :data-available="isChartAvailable(allInCostChart) || isChartAvailable(fxMarkupChart)"
            :empty="!isChartAvailable(allInCostChart) && !isChartAvailable(fxMarkupChart) ? { title: 'No chart data', message: 'Dispersion data is not available for this corridor yet.' } : null"
            :updated-at="allInCostChart?.updatedAt ?? fxMarkupChart?.updatedAt"
          >
            <template #chart>
              <RsChart
                :option="effectiveRateOption"
                height="tall"
                :theme="echartsTheme"
              />
            </template>
          </ChartCard>
        </div>

        <!-- Spread sidebar: 4 stat cards stacked -->
        <div class="grid auto-rows-fr gap-3 lg:col-span-4">
          <RsStatCard
            label="Market Spread"
            :value="enterpriseMetrics.spread"
            delta-label="bps range"
            delta-type="neutral"
            size="lg"
            class="h-full"
            :variant="variant"
            :loading="loadingOverview"
            tooltip="Spread between best and worst provider in basis points"
          />
          <RsStatCard
            label="Best Recipient Gets"
            :value="enterpriseMetrics.bestPrice"
            delta-type="positive"
            size="lg"
            class="h-full"
            :variant="variant"
            :loading="loadingOverview"
            tooltip="Highest delivered amount across all providers"
          />
          <RsStatCard
            label="Lowest Recipient Gets"
            :value="enterpriseMetrics.worstPrice"
            delta-type="negative"
            size="lg"
            class="h-full"
            :variant="variant"
            :loading="loadingOverview"
            tooltip="Lowest delivered amount across all providers"
          />
          <RsStatCard
            label="Median Recipient Gets"
            :value="enterpriseMetrics.medianRate"
            delta-type="neutral"
            size="lg"
            class="h-full"
            :variant="variant"
            :loading="loadingOverview"
            tooltip="Median delivered amount across providers"
          />
        </div>
      </div>

      <!-- ROW 3: Two charts side by side -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- Left: Fee vs Markup Decomposition -->
        <ChartCard
          :variant="variant"
          title="Fee vs Markup Decomposition"
          subtitle="Stacked breakdown of fee and FX markup cost components"
          :loading="loadingCharts"
          :error="errorCharts ? { message: errorCharts } : null"
          :data-available="isChartAvailable(feeVsMarkupChart)"
          :empty="!isChartAvailable(feeVsMarkupChart) ? { title: 'No data', message: 'Fee decomposition data is not available yet.' } : null"
          :updated-at="feeVsMarkupChart?.updatedAt"
        >
          <template #chart>
            <RsChart
              :option="feeVsMarkupOption"
              height="standard"
              :theme="echartsTheme"
            />
          </template>
        </ChartCard>

        <!-- Right: Spread Distribution (p25/p50/p75) -->
        <ChartCard
          :variant="variant"
          title="Spread Distribution (p25/p50/p75)"
          subtitle="Percentile spread bands across providers over time"
          :loading="loadingCharts"
          :error="errorCharts ? { message: errorCharts } : null"
          :data-available="isChartAvailable(spreadDistributionChart)"
          :empty="!isChartAvailable(spreadDistributionChart) ? { title: 'No data', message: 'Spread distribution data is not available yet.' } : null"
          :updated-at="spreadDistributionChart?.updatedAt"
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import type { PulseDensity, PulseFilters, CorridorOption, PulseOverview } from '~/types/pulse'
import RsStatCard from '~/ui/cards/RsStatCard.vue'
import ChartCard from '~/ui/charts/ChartCard.vue'
import RsChart from '~/ui/charts/RsChart.vue'
import RsSectionHeader from '~/ui/layout/RsSectionHeader.vue'
import EmptyState from '~/ui/states/EmptyState.vue'
import {
  getChartsBatch,
  getPulseOverview,
} from '~/lib/pulseApi'
import type { PulseChartsBatchItem } from '~/lib/pulseApi'
import { buildChartOption, buildCostMarkupDualAxisOption } from '~/lib/pulseChartBuilders'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  density: PulseDensity
  corridor: CorridorOption | null
  filters: PulseFilters
}

const props = defineProps<Props>()

// ── Theme / safety composables ────────────────────────────────────────────────

const { variant, echartsTheme } = usePulseTheme()
const { isCorridorSafe, getEmptyReason, isChartAvailable } = usePulseDataSafety()

// ── Corridor safety ────────────────────────────────────────────────────────────

const corridorSafe = computed(() => isCorridorSafe(props.corridor))
const emptyReason = computed(() => getEmptyReason(props.corridor))

// ── Loading / error state refs ────────────────────────────────────────────────

const loadingCharts = ref(false)
const loadingOverview = ref(false)
const errorCharts = ref<string | null>(null)
const errorOverview = ref<string | null>(null)

// ── Data refs ─────────────────────────────────────────────────────────────────

const allInCostChart = ref<PulseChartsBatchItem | null>(null)
const fxMarkupChart = ref<PulseChartsBatchItem | null>(null)
const feeVsMarkupChart = ref<PulseChartsBatchItem | null>(null)
const spreadDistributionChart = ref<PulseChartsBatchItem | null>(null)
const overviewData = ref<PulseOverview | null>(null)

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchAll() {
  if (!corridorSafe.value) return

  const isEnterprise = props.density === 'enterprise'
  const chartIds = isEnterprise
    ? ['all-in-cost', 'fx-markup', 'fee-vs-markup', 'spread-distribution']
    : ['all-in-cost', 'fx-markup']

  await Promise.all([
    fetchCharts(chartIds),
    fetchOverview(),
  ])
}

async function fetchCharts(chartIds: string[]) {
  loadingCharts.value = true
  errorCharts.value = null
  try {
    const batch = await getChartsBatch(chartIds, props.filters, '30d')
    allInCostChart.value = batch.charts.find(c => c.id === 'all-in-cost') ?? null
    fxMarkupChart.value = batch.charts.find(c => c.id === 'fx-markup') ?? null
    feeVsMarkupChart.value = batch.charts.find(c => c.id === 'fee-vs-markup') ?? null
    spreadDistributionChart.value = batch.charts.find(c => c.id === 'spread-distribution') ?? null
  }
  catch (err: any) {
    errorCharts.value = err?.message ?? 'Failed to load chart data'
    allInCostChart.value = null
    fxMarkupChart.value = null
    feeVsMarkupChart.value = null
    spreadDistributionChart.value = null
  }
  finally {
    loadingCharts.value = false
  }
}

async function fetchOverview() {
  loadingOverview.value = true
  errorOverview.value = null
  try {
    overviewData.value = await getPulseOverview(props.filters)
  }
  catch (err: any) {
    errorOverview.value = err?.message ?? 'Failed to load overview data'
    overviewData.value = null
  }
  finally {
    loadingOverview.value = false
  }
}

// ── Lifecycle + watchers ──────────────────────────────────────────────────────

onMounted(fetchAll)

watch(
  () => [props.corridor, props.filters],
  fetchAll,
  { deep: true },
)

// ── Chart options ─────────────────────────────────────────────────────────────

// Hero chart: all-in-cost + fx-markup as two overlaid line series.
const effectiveRateOption = computed<EChartsOption>(() => {
  const costSeries = allInCostChart.value?.chart?.series ?? []
  const fxSeries = fxMarkupChart.value?.chart?.series ?? []
  if (!costSeries.length && !fxSeries.length) return {}
  return buildCostMarkupDualAxisOption(costSeries, fxSeries)
})

const feeVsMarkupOption = computed<EChartsOption>(() => {
  const series = feeVsMarkupChart.value?.chart?.series ?? []
  if (!series.length) return {}
  return buildChartOption('fee-vs-markup', series)
})

const spreadDistributionOption = computed<EChartsOption>(() => {
  const series = spreadDistributionChart.value?.chart?.series ?? []
  if (!series.length) return {}
  return buildChartOption('spread-distribution', series)
})

// ── KPI derivation from overview tiles ────────────────────────────────────────

function findTile(id: string) {
  return overviewData.value?.tiles?.find(t => t.id === id) ?? null
}

// Enterprise sidebar metrics
const enterpriseMetrics = computed(() => {
  const spreadTile = findTile('market-spread') ?? findTile('spread') ?? findTile('rvi')
  const bestTile = findTile('best-rate') ?? findTile('best-price') ?? findTile('bestRecipientGets')
  const worstTile = findTile('worst-rate') ?? findTile('worst-price')
  const medianTile = findTile('median-rate') ?? findTile('median')

  return {
    spread: spreadTile?.value ?? '—',
    bestPrice: bestTile?.value ?? '—',
    worstPrice: worstTile?.value ?? '—',
    medianRate: medianTile?.value ?? '—',
  }
})

// Light layout metrics
const lightMetrics = computed(() => {
  const spreadTile = findTile('market-spread') ?? findTile('spread') ?? findTile('rvi')
  const bestTile = findTile('best-rate') ?? findTile('best-price') ?? findTile('bestRecipientGets')
  const worstTile = findTile('worst-rate') ?? findTile('worst-price')

  const bestVal = bestTile?.value ?? null
  const worstVal = worstTile?.value ?? null

  const bestVsWorst = bestVal && worstVal
    ? `${bestVal} to ${worstVal}`
    : bestVal ?? worstVal ?? '—'

  // Savings gap: delta from the overview tile if available, else derive from best/worst tile deltas.
  const savingsGap = bestTile?.delta ?? null

  return {
    spread: spreadTile?.value ?? '—',
    bestVsWorst,
    savingsGap,
  }
})
</script>
