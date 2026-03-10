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
      <!-- ROW 1: Smart gauge — Best Time to Send -->
      <ChartCard
        :variant="variant"
        title="Best Time to Send"
        subtitle="Composite market timing score (0 = wait, 100 = great)"
        :loading="loadingSmartSend"
        :error="errorSmartSend ? { message: errorSmartSend } : null"
        :data-available="!!smartSendData"
        :updated-at="smartSendData?.lastUpdated"
      >
        <template #chart>
          <RsChart
            :option="gaugeOption"
            height="compact"
            :theme="echartsTheme"
          />
          <div
            v-if="smartSendData"
            class="mt-3 text-center"
          >
            <p
              class="text-body-sm font-semibold"
              :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
            >
              {{ smartSendData.message }}
            </p>
            <p
              v-if="smartSendData.recommendation"
              class="mt-1 text-body-sm"
              :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
            >
              {{ smartSendData.recommendation }}
            </p>
          </div>
        </template>
      </ChartCard>

      <!-- ROW 2: 4 KPI tiles -->
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <RsStatCard
          label="Best Rate"
          :value="kpiBestRate.value"
          :delta="kpiBestRate.delta"
          :delta-type="kpiBestRate.deltaType"
          delta-label="vs 7d"
          :variant="variant"
          :loading="loadingSnapshot"
          tooltip="Best recipient amount across all providers for your send amount"
        />
        <RsStatCard
          label="Total Cost"
          :value="kpiTotalCost.value"
          :delta="kpiTotalCost.delta"
          :delta-type="kpiTotalCost.deltaType"
          delta-label="vs 7d"
          :variant="variant"
          :loading="loadingSnapshot"
          tooltip="Remittance cost index as a percentage of send amount (fee + FX markup)"
        />
        <RsStatCard
          label="Best Provider"
          :value="kpiBestProvider.value"
          :delta="kpiBestProvider.delta"
          :delta-type="kpiBestProvider.deltaType"
          :variant="variant"
          :loading="loadingSnapshot"
          tooltip="Provider with the best delivered amount over the last 30 days"
        />
        <RsStatCard
          label="Volatility"
          :value="kpiVolatility.value"
          :delta="kpiVolatility.delta"
          delta-type="neutral"
          :variant="variant"
          :loading="loadingSnapshot"
          tooltip="Rate Volatility Index — spread range in basis points over the period"
        />
      </div>

      <!-- ROW 3: Narrative card -->
      <div
        v-if="narrativeData || loadingNarrative"
        :class="cardSurface"
        class="p-6"
      >
        <RsLoadingSkeleton
          v-if="loadingNarrative"
          shape="text-block"
          :variant="variant"
        />
        <template v-else-if="narrativeData">
          <p
            class="text-body-sm leading-relaxed"
            :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-700'"
          >
            {{ narrativeData.summary }}
          </p>
          <div
            class="mt-3 flex flex-wrap items-center gap-3 text-xs"
            :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
          >
            <span v-if="narrativeData.source">Source: {{ narrativeData.source }}</span>
            <span v-if="narrativeData.updatedAt">Updated {{ formatRelative(narrativeData.updatedAt) }}</span>
          </div>
        </template>
      </div>

      <!-- ROW 4: Hero chart — All-in Cost Index -->
      <ChartCard
        :variant="variant"
        title="All-in Cost Index"
        subtitle="Total remittance cost as a % of send amount over time"
        :loading="loadingCharts"
        :error="errorCharts ? { message: errorCharts } : null"
        :data-available="isChartAvailable(allInCostChart)"
        :empty="!isChartAvailable(allInCostChart) ? { title: 'No chart data', message: 'Cost index data is not available for this corridor yet.' } : null"
        :updated-at="allInCostChart?.updatedAt"
      >
        <template #chart>
          <RsChart
            :option="allInCostOption"
            height="standard"
            :theme="echartsTheme"
          />
        </template>
      </ChartCard>

      <!-- ROW 5: Provider quotes grid -->
      <div>
        <RsSectionHeader
          title="Live Provider Quotes"
          :description="`${filters.amount} ${corridor?.fromCode ?? ''} snapshot — best delivered amount first`"
          :variant="variant"
          class="mb-4"
        />

        <RsLoadingSkeleton
          v-if="loadingMarketSnapshot"
          shape="stat-card"
          :count="3"
          :variant="variant"
        />

        <EmptyState
          v-else-if="!marketSnapshotData || marketSnapshotData.quotes.length === 0"
          :variant="variant"
          mode="inline"
          reason="no-data"
          :corridor-label="corridor?.label"
        />

        <div
          v-else
          class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <div
            v-for="(quote, i) in sortedQuotes"
            :key="quote.provider"
            :class="[
              cardSurface,
              'relative p-4 transition-shadow',
            ]"
          >
            <!-- Best badge -->
            <div
              v-if="i === 0"
              class="absolute right-3 top-3"
            >
              <RsBadge
                label="Best"
                variant="success"
                size="xs"
              />
            </div>

            <!-- Provider logo + name -->
            <div class="mb-3 flex items-center gap-3">
              <img
                :src="getProviderLogoPath(quote.provider)"
                :alt="quote.provider"
                width="32"
                height="32"
                class="h-8 w-auto max-w-[80px] object-contain"
                loading="lazy"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              >
              <div class="min-w-0">
                <p
                  class="truncate text-sm font-semibold capitalize"
                  :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
                >
                  {{ quote.provider }}
                </p>
                <p
                  v-if="quote.isPromo && quote.promoText"
                  class="truncate text-xs text-amber-500"
                >
                  {{ quote.promoText }}
                </p>
              </div>
            </div>

            <!-- Delivered amount (hero) -->
            <div class="mb-2">
              <p
                class="text-2xl font-bold"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                {{ currencySymbol(marketSnapshotData.currency) }}{{ quote.recipientGets.toLocaleString('en-US', { maximumFractionDigits: 2 }) }}
              </p>
              <p
                class="text-xs"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                recipient gets
              </p>
            </div>

            <!-- Fee + speed row -->
            <div
              class="flex items-center justify-between gap-2 border-t pt-2 text-xs"
              :class="variant === 'terminal' ? 'border-neutral-700 text-neutral-400' : 'border-neutral-200 text-neutral-500'"
            >
              <span>Fee: {{ quote.fee > 0 ? `$${quote.fee.toFixed(2)}` : 'Free' }}</span>
              <span>{{ quote.speed }}</span>
              <span>{{ quote.markupBps }} bps</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Enterprise layout -->
    <template v-else>
      <!-- ROW 1: 5 KPI tiles with sparklines -->
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <RsStatCard
          label="Best Rate"
          :value="kpiBestRate.value"
          :delta="kpiBestRate.delta"
          :delta-type="kpiBestRate.deltaType"
          delta-label="vs 7d"
          size="sm"
          :sparkline="sparklines.bestRate"
          sparkline-color="#10B981"
          :variant="variant"
          :loading="loadingSnapshot"
        />
        <RsStatCard
          label="Total Cost"
          :value="kpiTotalCost.value"
          :delta="kpiTotalCost.delta"
          :delta-type="kpiTotalCost.deltaType"
          delta-label="vs 7d"
          size="sm"
          :sparkline="sparklines.totalCost"
          sparkline-color="#EF4444"
          :variant="variant"
          :loading="loadingSnapshot"
        />
        <RsStatCard
          label="Best Provider"
          :value="kpiBestProvider.value"
          :delta="kpiBestProvider.delta"
          :delta-type="kpiBestProvider.deltaType"
          size="sm"
          :variant="variant"
          :loading="loadingSnapshot"
        />
        <RsStatCard
          label="Volatility"
          :value="kpiVolatility.value"
          :delta="kpiVolatility.delta"
          delta-type="neutral"
          size="sm"
          :sparkline="sparklines.volatility"
          sparkline-color="#F59E0B"
          :variant="variant"
          :loading="loadingSnapshot"
        />
        <RsStatCard
          label="Confidence"
          :value="kpiConfidence.value"
          :delta="kpiConfidence.delta"
          delta-type="neutral"
          size="sm"
          :sparkline="sparklines.confidence"
          sparkline-color="#6366F1"
          :variant="variant"
          :loading="loadingSnapshot"
        />
      </div>

      <!-- ROW 2: Hero chart (8/12) + Market metrics sidebar (4/12) -->
      <div class="grid grid-cols-12 gap-4">
        <!-- Hero chart -->
        <div class="col-span-12 lg:col-span-8">
          <ChartCard
            :variant="variant"
            title="All-in Cost + FX Markup"
            subtitle="Dual-overlay: total cost (%) and FX markup (bps) over time"
            :loading="loadingCharts"
            :error="errorCharts ? { message: errorCharts } : null"
            :data-available="isChartAvailable(allInCostChart) || isChartAvailable(fxMarkupChart)"
            :updated-at="allInCostChart?.updatedAt"
          >
            <template #chart>
              <RsChart
                :option="enterpriseOverlayOption"
                height="tall"
                :theme="echartsTheme"
              />
            </template>
          </ChartCard>
        </div>

        <!-- Market metrics sidebar -->
        <div class="col-span-12 flex flex-col gap-3 lg:col-span-4">
          <RsStatCard
            label="Market Spread"
            :value="marketMetrics.spread"
            delta-label="bps range"
            delta-type="neutral"
            size="sm"
            :variant="variant"
            :loading="loadingSnapshot"
            tooltip="Spread between best and worst provider in basis points"
          />
          <RsStatCard
            label="Best Price"
            :value="marketMetrics.bestPrice"
            delta-type="positive"
            size="sm"
            :variant="variant"
            :loading="loadingSnapshot"
            tooltip="Highest recipient amount across all providers"
          />
          <RsStatCard
            label="Worst Price"
            :value="marketMetrics.worstPrice"
            delta-type="negative"
            size="sm"
            :variant="variant"
            :loading="loadingSnapshot"
            tooltip="Lowest recipient amount across all providers"
          />
          <RsStatCard
            label="Median"
            :value="marketMetrics.median"
            delta-type="neutral"
            size="sm"
            :variant="variant"
            :loading="loadingSnapshot"
            tooltip="Median recipient amount across providers"
          />
        </div>
      </div>

      <!-- ROW 3: Executive narrative -->
      <div :class="cardSurface">
        <div class="border-b p-5" :class="variant === 'terminal' ? 'border-neutral-700' : 'border-neutral-200'">
          <RsSectionHeader
            title="Executive Summary"
            icon="📋"
            :variant="variant"
          />
        </div>
        <div class="p-5">
          <RsLoadingSkeleton
            v-if="loadingNarrative"
            shape="text-block"
            :variant="variant"
          />
          <EmptyState
            v-else-if="!narrativeData || !narrativeData.dataAvailable"
            :variant="variant"
            mode="inline"
            reason="no-data"
          />
          <template v-else>
            <p
              class="text-body-sm leading-relaxed"
              :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-700'"
            >
              {{ narrativeData.summary }}
            </p>
            <div
              class="mt-4 flex flex-wrap items-center gap-4 text-xs"
              :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
            >
              <span v-if="narrativeData.source">Source: {{ narrativeData.source }}</span>
              <span v-if="narrativeData.updatedAt">Updated {{ formatRelative(narrativeData.updatedAt) }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- ROW 4: Provider benchmarking table -->
      <div>
        <RsSectionHeader
          title="Provider Benchmarking"
          description="Sortable comparison across all active providers for this corridor"
          :variant="variant"
          class="mb-4"
        />
        <RsPulseTable
          :variant="variant"
          :columns="benchmarkColumns"
          :rows="benchmarkRows"
          :row-key="(row: unknown, i: number) => String((row as any).provider ?? i)"
          :loading="loadingBenchmarks"
          :error="errorBenchmarks ? { message: errorBenchmarks } : null"
          :empty="benchmarkRows.length === 0 && !loadingBenchmarks ? { title: 'No benchmark data', message: 'Provider benchmarking data is not available yet.' } : null"
          provider-column="provider"
          :highlight-best="{ column: 'deliveredAmount', direction: 'max' }"
          :sort="benchmarkSort"
          :on-sort-change="onBenchmarkSortChange"
          dense
          sticky-header
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import type { PulseDensity, PulseFilters, PulseProviderBenchmarkRow, CorridorOption } from '~/types/pulse'
import type { PulseCorridor } from '~/stores/pulse'
import type { DataTableSort } from '~/ui/DataTable/types'
import {
  getPulseSnapshotSummary,
  getSmartSendData,
  getPulseNarrative,
  getChartsBatch,
  getMarketSnapshot,
  getProviderBenchmarkingData,
} from '~/lib/pulseApi'
import type {
  SmartSendData,
  PulseNarrativeData,
  MarketSnapshotData,
  PulseChartsBatchItem,
} from '~/lib/pulseApi'
import type { PulseSnapshotSummary } from '~/types/pulse'
import { buildGaugeOption, buildLineOption } from '~/lib/pulseChartBuilders'
import { getProviderLogoPath } from '~/composables/useProviderLogo'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  density: PulseDensity
  corridor: CorridorOption | null
  filters: PulseFilters
}

const props = defineProps<Props>()

// ── Theme / safety composables ────────────────────────────────────────────────

const { variant, echartsTheme, cardSurface } = usePulseTheme()
const { isCorridorSafe, getEmptyReason, isChartAvailable } = usePulseDataSafety()

// ── Corridor safety ────────────────────────────────────────────────────────────

const corridorSafe = computed(() => isCorridorSafe(props.corridor))
const emptyReason = computed(() => getEmptyReason(props.corridor))

// ── Loading / error state refs ────────────────────────────────────────────────

const loadingSnapshot = ref(false)
const loadingSmartSend = ref(false)
const loadingNarrative = ref(false)
const loadingCharts = ref(false)
const loadingMarketSnapshot = ref(false)
const loadingBenchmarks = ref(false)

const errorSmartSend = ref<string | null>(null)
const errorCharts = ref<string | null>(null)
const errorBenchmarks = ref<string | null>(null)

// ── Data refs ─────────────────────────────────────────────────────────────────

const snapshotData = ref<PulseSnapshotSummary | null>(null)
const smartSendData = ref<SmartSendData | null>(null)
const narrativeData = ref<PulseNarrativeData | null>(null)
const allInCostChart = ref<PulseChartsBatchItem | null>(null)
const fxMarkupChart = ref<PulseChartsBatchItem | null>(null)
const marketSnapshotData = ref<MarketSnapshotData | null>(null)
const benchmarkData = ref<PulseProviderBenchmarkRow[]>([])

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchAll() {
  if (!corridorSafe.value) return

  const corridor = props.corridor as CorridorOption
  const pulseCorridor: PulseCorridor = {
    from: corridor.sourceCountry ?? corridor.fromCode ?? '',
    to: corridor.destCountry ?? corridor.toCode ?? '',
    fromCode: corridor.fromCode ?? '',
    toCode: corridor.toCode ?? '',
    fromFlag: corridor.fromFlag ?? '',
    toFlag: corridor.toFlag ?? '',
    label: corridor.label ?? '',
    slug: corridor.slug ?? corridor.value ?? '',
    corridorId: corridor.corridorId,
  }

  const timeframe = '30D' as const
  const amount = props.filters.amount

  await Promise.all([
    fetchSnapshot(pulseCorridor, timeframe, amount),
    fetchSmartSend(pulseCorridor, timeframe, amount),
    fetchNarrative(pulseCorridor, timeframe, amount),
    fetchCharts(),
    fetchMarketSnapshot(pulseCorridor, amount),
    props.density === 'enterprise' ? fetchBenchmarks(pulseCorridor, timeframe, amount) : Promise.resolve(),
  ])
}

async function fetchSnapshot(corridor: PulseCorridor, timeframe: '30D', amount: number) {
  loadingSnapshot.value = true
  try {
    snapshotData.value = await getPulseSnapshotSummary(corridor, timeframe, amount)
  }
  catch {
    snapshotData.value = null
  }
  finally {
    loadingSnapshot.value = false
  }
}

async function fetchSmartSend(corridor: PulseCorridor, timeframe: '30D', amount: number) {
  loadingSmartSend.value = true
  errorSmartSend.value = null
  try {
    smartSendData.value = await getSmartSendData(corridor, timeframe, amount)
  }
  catch (err: any) {
    errorSmartSend.value = err?.message ?? 'Failed to load smart send data'
    smartSendData.value = null
  }
  finally {
    loadingSmartSend.value = false
  }
}

async function fetchNarrative(corridor: PulseCorridor, timeframe: '30D', amount: number) {
  loadingNarrative.value = true
  try {
    narrativeData.value = await getPulseNarrative(corridor, timeframe, amount)
  }
  catch {
    narrativeData.value = null
  }
  finally {
    loadingNarrative.value = false
  }
}

async function fetchCharts() {
  loadingCharts.value = true
  errorCharts.value = null
  try {
    const batch = await getChartsBatch(['all-in-cost', 'fx-markup'], props.filters, '30d')
    allInCostChart.value = batch.charts.find(c => c.id === 'all-in-cost') ?? null
    fxMarkupChart.value = batch.charts.find(c => c.id === 'fx-markup') ?? null
  }
  catch (err: any) {
    errorCharts.value = err?.message ?? 'Failed to load chart data'
    allInCostChart.value = null
    fxMarkupChart.value = null
  }
  finally {
    loadingCharts.value = false
  }
}

async function fetchMarketSnapshot(corridor: PulseCorridor, amount: number) {
  loadingMarketSnapshot.value = true
  try {
    marketSnapshotData.value = await getMarketSnapshot(corridor, amount)
  }
  catch {
    marketSnapshotData.value = null
  }
  finally {
    loadingMarketSnapshot.value = false
  }
}

async function fetchBenchmarks(corridor: PulseCorridor, timeframe: '30D', amount: number) {
  loadingBenchmarks.value = true
  errorBenchmarks.value = null
  try {
    benchmarkData.value = await getProviderBenchmarkingData(corridor, timeframe, amount)
  }
  catch (err: any) {
    errorBenchmarks.value = err?.message ?? 'Failed to load benchmark data'
    benchmarkData.value = []
  }
  finally {
    loadingBenchmarks.value = false
  }
}

// ── Lifecycle + watchers ──────────────────────────────────────────────────────

onMounted(fetchAll)

watch(
  () => [props.corridor, props.filters],
  fetchAll,
  { deep: true },
)

// ── Smart-send gauge ──────────────────────────────────────────────────────────

const SMART_SEND_SCORE_MAP: Record<string, number> = {
  great: 90,
  good: 70,
  fair: 45,
  wait: 15,
}

const gaugeValue = computed(() => {
  if (!smartSendData.value) return 0
  if (typeof smartSendData.value.percentile === 'number') return smartSendData.value.percentile
  return SMART_SEND_SCORE_MAP[smartSendData.value.level] ?? 50
})

const gaugeOption = computed<EChartsOption>(() =>
  buildGaugeOption(gaugeValue.value, {
    min: 0,
    max: 100,
    thresholds: [
      { value: 30, color: '#EF4444', label: 'Wait' },
      { value: 55, color: '#F59E0B', label: 'Fair' },
      { value: 75, color: '#3B82F6', label: 'Good' },
      { value: 100, color: '#10B981', label: 'Great' },
    ],
  }),
)

// ── KPI derivation ─────────────────────────────────────────────────────────────

function findKpi(id: string) {
  return snapshotData.value?.kpis.find(k => k.id === id) ?? null
}

const kpiBestRate = computed(() => {
  const kpi = findKpi('best-rate') ?? findKpi('bestRecipientGets') ?? findKpi('best_rate')
  const quote = sortedQuotes.value[0]
  if (kpi) {
    return { value: kpi.value, delta: kpi.delta, deltaType: kpi.deltaType }
  }
  if (quote) {
    const sym = currencySymbol(marketSnapshotData.value?.currency ?? '')
    return {
      value: `${sym}${quote.recipientGets.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      delta: null,
      deltaType: 'neutral' as const,
    }
  }
  return { value: '—', delta: null, deltaType: 'neutral' as const }
})

const kpiTotalCost = computed(() => {
  const kpi = findKpi('total-cost') ?? findKpi('rci') ?? findKpi('cost')
  if (kpi) return { value: kpi.value, delta: kpi.delta, deltaType: kpi.deltaType }
  return { value: '—', delta: null, deltaType: 'neutral' as const }
})

const kpiBestProvider = computed(() => {
  const kpi = findKpi('best-provider') ?? findKpi('leader')
  if (kpi) return { value: kpi.value, delta: kpi.delta, deltaType: kpi.deltaType }
  const leader = snapshotData.value?.leader
  if (leader) {
    return { value: leader, delta: null, deltaType: 'neutral' as const }
  }
  const topQuote = sortedQuotes.value[0]
  if (topQuote) return { value: topQuote.provider, delta: null, deltaType: 'neutral' as const }
  return { value: '—', delta: null, deltaType: 'neutral' as const }
})

const kpiVolatility = computed(() => {
  const kpi = findKpi('volatility') ?? findKpi('rvi')
  if (kpi) return { value: kpi.value, delta: kpi.delta, deltaType: kpi.deltaType }
  return { value: '—', delta: null, deltaType: 'neutral' as const }
})

const kpiConfidence = computed(() => {
  const kpi = findKpi('confidence') ?? findKpi('weight-confidence')
  if (kpi) return { value: kpi.value, delta: kpi.delta, deltaType: kpi.deltaType }
  return { value: '—', delta: null, deltaType: 'neutral' as const }
})

// ── Sparklines: last 30 points from chart series ──────────────────────────────

const sparklines = computed(() => {
  const allInSeries = allInCostChart.value?.chart?.series ?? []
  const fxSeries = fxMarkupChart.value?.chart?.series ?? []

  const take30 = (series: typeof allInSeries, idx = 0) => {
    const s = series[idx]
    if (!s) return []
    return s.points.slice(-30).map(p => p.v)
  }

  return {
    bestRate: take30(allInSeries, 0),
    totalCost: take30(allInSeries, 0),
    volatility: take30(fxSeries, 0),
    confidence: take30(allInSeries, 0),
  }
})

// ── Provider quotes (sorted best first) ───────────────────────────────────────

const sortedQuotes = computed(() => {
  if (!marketSnapshotData.value?.quotes) return []
  return [...marketSnapshotData.value.quotes].sort((a, b) => b.recipientGets - a.recipientGets)
})

// ── Market metrics for enterprise sidebar ─────────────────────────────────────

const marketMetrics = computed(() => {
  const quotes = sortedQuotes.value
  const sym = currencySymbol(marketSnapshotData.value?.currency ?? '')

  if (!quotes.length) {
    return { spread: '—', bestPrice: '—', worstPrice: '—', median: '—' }
  }

  const amounts = quotes.map(q => q.recipientGets).sort((a, b) => b - a)
  const best = amounts[0]
  const worst = amounts[amounts.length - 1]
  const median = amounts[Math.floor(amounts.length / 2)]

  const bpsArr = quotes.map(q => q.markupBps)
  const spreadBps = Math.max(...bpsArr) - Math.min(...bpsArr)

  const fmt = (v: number) => `${sym}${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`

  return {
    spread: `${spreadBps} bps`,
    bestPrice: fmt(best),
    worstPrice: fmt(worst),
    median: fmt(median),
  }
})

// ── All-in cost ECharts option ────────────────────────────────────────────────

const allInCostOption = computed<EChartsOption>(() => {
  const series = allInCostChart.value?.chart?.series ?? []
  if (!series.length) return {}
  return buildLineOption(series, { showArea: true, yAxisLabel: '%' })
})

const enterpriseOverlayOption = computed<EChartsOption>(() => {
  const costSeries = allInCostChart.value?.chart?.series ?? []
  const fxSeries = fxMarkupChart.value?.chart?.series ?? []

  const combined = [
    ...costSeries.map(s => ({ ...s, label: `Cost % — ${s.label}` })),
    ...fxSeries.map(s => ({ ...s, label: `FX Markup bps — ${s.label}` })),
  ]

  if (!combined.length) return {}
  return buildLineOption(combined, { showArea: false })
})

// ── Benchmark table ───────────────────────────────────────────────────────────

const benchmarkColumns = [
  { key: 'rank', label: '#', align: 'center' as const, sortable: false, widthClass: 'w-10' },
  { key: 'provider', label: 'Provider', align: 'left' as const, sortable: true },
  { key: 'deliveredAmount', label: 'Delivered', align: 'right' as const, sortable: true },
  { key: 'totalCost', label: 'Cost %', align: 'right' as const, sortable: true },
  { key: 'fee', label: 'Fee', align: 'right' as const, sortable: true },
  { key: 'markupBps', label: 'FX Markup', align: 'right' as const, sortable: true },
  { key: 'speed', label: 'Speed', align: 'left' as const, sortable: false },
  { key: 'winRate', label: 'Win Rate', align: 'right' as const, sortable: true },
]

const benchmarkSort = ref<DataTableSort | null>({ key: 'deliveredAmount', direction: 'desc' })

const benchmarkRows = computed(() => {
  const rows = [...benchmarkData.value]

  if (benchmarkSort.value) {
    const { key, direction } = benchmarkSort.value
    rows.sort((a, b) => {
      const av = (a as Record<string, unknown>)[key]
      const bv = (b as Record<string, unknown>)[key]
      if (typeof av === 'number' && typeof bv === 'number') {
        return direction === 'asc' ? av - bv : bv - av
      }
      return direction === 'asc'
        ? String(av ?? '').localeCompare(String(bv ?? ''))
        : String(bv ?? '').localeCompare(String(av ?? ''))
    })
  }

  return rows.map((row, i) => ({
    rank: i + 1,
    provider: row.provider,
    deliveredAmount: row.deliveredAmount,
    totalCost: `${(row.totalCostBps / 100).toFixed(2)}%`,
    fee: row.fee > 0 ? `$${row.fee.toFixed(2)}` : 'Free',
    markupBps: `${row.markupBps} bps`,
    speed: row.speed,
    winRate: `${(row.winRate * 100).toFixed(0)}%`,
  }))
})

function onBenchmarkSortChange(next: DataTableSort) {
  benchmarkSort.value = next
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function currencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    PHP: '₱', MXN: '$', INR: '₹', NGN: '₦',
    USD: '$', GBP: '£', CAD: 'C$', AUD: 'A$', EUR: '€',
  }
  return symbols[code] ?? `${code} `
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return ''
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return ''
  const diffMs = Date.now() - ts
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
</script>
