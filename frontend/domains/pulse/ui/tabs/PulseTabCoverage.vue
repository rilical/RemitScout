<template>
  <div class="space-y-6">
    <!-- ROW 1: Section Header -->
    <RsSectionHeader
      title="Coverage"
      description="Data coverage and provider availability"
      icon-name="shield-check"
      :variant="variant"
    />

    <!-- Full-page empty state when corridor data is not safe -->
    <EmptyState
      v-if="!corridorSafe"
      :variant="variant"
      mode="page"
      :reason="emptyReason"
      :corridor-label="(corridor as any)?.label"
      :days-available="(corridor as any)?.daysAvailable"
    />

    <!-- Light layout -->
    <template v-else-if="density === 'light'">
      <!-- ROW 2: 2 metric cards -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <!-- Quote Success Rate -->
        <RsStatCard
          label="Quote Success Rate"
          :value="kpiSuccessRate.value"
          :delta="kpiSuccessRate.delta"
          :delta-type="kpiSuccessRate.deltaType"
          delta-label="vs 7d"
          :variant="variant"
          :loading="loadingSummary"
          tooltip="Percentage of provider quote requests that returned a valid result"
        />

        <!-- Data Freshness -->
        <RsStatCard
          label="Data Freshness"
          :value="kpiFreshness.value"
          :delta="kpiFreshness.delta"
          :delta-type="kpiFreshness.deltaType"
          delta-label="p95"
          :variant="variant"
          :loading="loadingSummary"
          tooltip="Median time since last successful data collection (p95 shown as delta)"
        />
      </div>

      <!-- ROW 3: Active Providers -->
      <div :class="[cardSurface, 'p-5']">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <p
              class="text-body-sm font-semibold"
              :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
            >
              Active Providers
            </p>
            <p
              class="mt-0.5 text-body-sm"
              :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
            >
              {{ activeProviderCount }} provider{{ activeProviderCount !== 1 ? 's' : '' }} with recent data
            </p>
          </div>
        </div>

        <!-- Loading skeleton -->
        <div
          v-if="loadingMethod"
          class="flex flex-wrap gap-3"
        >
          <div
            v-for="i in 6"
            :key="i"
            class="h-8 w-8 animate-pulse rounded-full"
            :class="variant === 'terminal' ? 'bg-neutral-700' : 'bg-neutral-200'"
          />
        </div>

        <!-- Provider logos -->
        <div
          v-else-if="methodRows.length > 0"
          class="flex flex-wrap gap-3"
        >
          <img
            v-for="row in methodRows"
            :key="row.provider"
            :src="getProviderLogoPath(row.provider)"
            :alt="row.provider"
            :title="row.provider"
            width="32"
            height="32"
            class="h-8 w-auto max-w-[80px] rounded object-contain"
            loading="lazy"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          >
        </div>

        <p
          v-else
          class="text-body-sm"
          :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
        >
          No provider data available for this corridor.
        </p>
      </div>
    </template>

    <!-- Enterprise layout -->
    <template v-else>
      <!-- Loading state -->
      <template v-if="loadingCharts && !chartsData.length">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div
            v-for="i in 4"
            :key="i"
            class="h-64 animate-pulse rounded-xl"
            :class="variant === 'terminal' ? 'bg-neutral-800/50' : 'bg-neutral-100'"
          />
        </div>
      </template>

      <!-- ROW 2: 4 chart cards -->
      <div
        v-else
        class="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <!-- Quote Success Rate chart -->
        <ChartCard
          title="Quote Success Rate"
          subtitle="% of quote requests returning a valid result over time"
          :variant="variant"
          :loading="loadingCharts"
          :error="errorCharts ? { message: errorCharts } : null"
          :data-available="isChartAvailable(quoteSuccessChart)"
          :updated-at="quoteSuccessChart?.updatedAt"
          :empty="!isChartAvailable(quoteSuccessChart) ? { title: 'No data', message: 'Quote success data not available.' } : null"
        >
          <template #chart>
            <RsChart
              :option="quoteSuccessOption"
              height="standard"
              :theme="echartsTheme"
            />
          </template>
        </ChartCard>

        <!-- Provider Availability chart -->
        <ChartCard
          title="Provider Availability"
          subtitle="Number of active providers over time"
          :variant="variant"
          :loading="loadingCharts"
          :error="errorCharts ? { message: errorCharts } : null"
          :data-available="isChartAvailable(providerAvailabilityChart)"
          :updated-at="providerAvailabilityChart?.updatedAt"
          :empty="!isChartAvailable(providerAvailabilityChart) ? { title: 'No data', message: 'Provider availability data not available.' } : null"
        >
          <template #chart>
            <RsChart
              :option="providerAvailabilityOption"
              height="standard"
              :theme="echartsTheme"
            />
          </template>
        </ChartCard>

        <!-- Data Freshness chart -->
        <ChartCard
          title="Data Freshness (p50 / p95)"
          subtitle="Median and 95th percentile collection lag in minutes"
          :variant="variant"
          :loading="loadingCharts"
          :error="errorCharts ? { message: errorCharts } : null"
          :data-available="isChartAvailable(dataFreshnessChart)"
          :updated-at="dataFreshnessChart?.updatedAt"
          :empty="!isChartAvailable(dataFreshnessChart) ? { title: 'No data', message: 'Data freshness data not available.' } : null"
        >
          <template #chart>
            <RsChart
              :option="dataFreshnessOption"
              height="standard"
              :theme="echartsTheme"
            />
          </template>
        </ChartCard>

        <!-- Corridor Liquidity chart — Enterprise only -->
        <ChartCard
          title="Corridor Liquidity"
          subtitle="Composite liquidity index across all active providers"
          :variant="variant"
          :loading="loadingCharts"
          :error="errorCharts ? { message: errorCharts } : null"
          :data-available="isChartAvailable(corridorLiquidityChart)"
          :updated-at="corridorLiquidityChart?.updatedAt"
          :empty="!isChartAvailable(corridorLiquidityChart) ? { title: 'No data', message: 'Corridor liquidity data not available.' } : null"
        >
          <template #chart>
            <RsChart
              :option="corridorLiquidityOption"
              height="standard"
              :theme="echartsTheme"
            />
          </template>
        </ChartCard>
      </div>

      <!-- ROW 3: Published bank coverage -->
      <div>
        <RsSectionHeader
          title="Published Bank Coverage"
          description="Bank-deposit support and typical transfer speed by provider"
          :variant="variant"
          class="mb-4"
        />
        <RsPulseTable
          :variant="variant"
          caption="Published Bank Coverage"
          :columns="methodColumns"
          :rows="methodTableRows"
          :row-key="(row, i) => String((row as any).provider ?? i)"
          :loading="loadingMethod"
          :error="errorMethod ? { message: errorMethod } : null"
          :empty="methodTableRows.length === 0 && !loadingMethod ? { title: 'No bank coverage data', message: 'Published bank coverage is not available for this corridor.' } : null"
          provider-column="provider"
          :dense="true"
          :sticky-header="true"
        />
      </div>

      <!-- ROW 4: Coverage by Currency -->
      <div>
        <RsSectionHeader
          title="Coverage by Currency"
          description="Corridor availability and provider depth by send currency"
          :variant="variant"
          class="mb-4"
        />

        <!-- Loading skeleton -->
        <div
          v-if="loadingCurrency"
          class="animate-pulse space-y-2"
        >
          <div
            v-for="i in 4"
            :key="i"
            class="h-10 rounded-lg"
            :class="variant === 'terminal' ? 'bg-neutral-800/50' : 'bg-neutral-100'"
          />
        </div>

        <!-- Error -->
        <EmptyState
          v-else-if="errorCurrency"
          :variant="variant"
          mode="inline"
          reason="error"
        />

        <!-- Currency table -->
        <div
          v-else-if="currencyRows.length > 0"
          :class="[cardSurface, 'overflow-hidden']"
        >
          <table class="w-full text-body-sm">
            <thead>
              <tr
                class="border-b text-label"
                :class="variant === 'terminal'
                  ? 'border-neutral-700 text-neutral-400'
                  : 'border-neutral-200 text-neutral-500'"
              >
                <th class="px-4 py-3 text-left">Currency</th>
                <th class="px-4 py-3 text-right">Corridors</th>
                <th class="px-4 py-3 text-right">3+ Providers</th>
                <th class="px-4 py-3 text-right">1-2 Providers</th>
                <th class="px-4 py-3 text-right">No Data</th>
                <th class="px-4 py-3 text-right">Confidence P50</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in currencyRows"
                :key="row.sendCurrency"
                class="border-b transition-colors"
                :class="[
                  i % 2 === 0
                    ? variant === 'terminal' ? 'bg-transparent' : 'bg-white'
                    : variant === 'terminal' ? 'bg-neutral-800/20' : 'bg-neutral-50',
                  variant === 'terminal' ? 'border-neutral-700/50' : 'border-neutral-100',
                  variant === 'terminal' ? 'hover:bg-neutral-800/40' : 'hover:bg-neutral-50',
                ]"
              >
                <td
                  class="px-4 py-2.5 font-semibold"
                  :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
                >
                  {{ row.sendCurrency }}
                </td>
                <td
                  class="px-4 py-2.5 text-right tabular-nums"
                  :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-700'"
                >
                  {{ row.corridorsAvailable }}
                </td>
                <td class="px-4 py-2.5 text-right tabular-nums">
                  <span
                    class="font-medium"
                    :class="row.corridorsWith3PlusProviders > 0
                      ? 'text-emerald-500'
                      : variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
                  >
                    {{ row.corridorsWith3PlusProviders }}
                  </span>
                </td>
                <td
                  class="px-4 py-2.5 text-right tabular-nums"
                  :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-700'"
                >
                  {{ row.corridorsWith1to2Providers }}
                </td>
                <td class="px-4 py-2.5 text-right tabular-nums">
                  <span
                    :class="row.corridorsWith0Providers > 0
                      ? 'text-amber-500'
                      : variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
                  >
                    {{ row.corridorsWith0Providers }}
                  </span>
                </td>
                <td
                  class="px-4 py-2.5 text-right tabular-nums"
                  :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
                >
                  {{ formatConfidence(row.weightConfidenceP50) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <EmptyState
          v-else
          :variant="variant"
          mode="inline"
          reason="no-data"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import type { PulseDensity, PulseFilters, MethodCoverageRow, CorridorOption, PulseCoverageSummary } from '~/types/pulse'
import type { PulseChartsBatchItem, PulseCoverageByCurrencyRow } from '~/domains/pulse/infrastructure/pulseApi'
import {
  getPulseCoverageSummary,
  getMethodCoverage,
  getChartsBatch,
  getCoverageByCurrency,
} from '~/domains/pulse/infrastructure/pulseApi'
import { buildChartOption } from '~/lib/pulseChartBuilders'
import { getProviderLogoPath } from '~/composables/useProviderLogo'
import RsSectionHeader from '~/ui/layout/RsSectionHeader.vue'
import RsStatCard from '~/ui/cards/RsStatCard.vue'
import RsChart from '~/ui/charts/RsChart.vue'
import ChartCard from '~/ui/charts/ChartCard.vue'
import RsPulseTable from '~/ui/DataTable/RsPulseTable.vue'
import EmptyState from '~/ui/states/EmptyState.vue'

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

// ── Corridor safety ─────────────────────────────────────────────────────────

const corridorSafe = computed(() => isCorridorSafe(props.corridor))
const emptyReason = computed(() => getEmptyReason(props.corridor))

// ── Loading / error state refs ────────────────────────────────────────────────

const loadingSummary = ref(false)
const loadingMethod = ref(false)
const loadingCharts = ref(false)
const loadingCurrency = ref(false)

const errorCharts = ref<string | null>(null)
const errorMethod = ref<string | null>(null)
const errorCurrency = ref<string | null>(null)

// ── Data refs ─────────────────────────────────────────────────────────────────

const summaryData = ref<PulseCoverageSummary | null>(null)
const methodRows = ref<MethodCoverageRow[]>([])
const chartsData = ref<PulseChartsBatchItem[]>([])
const currencyRows = ref<PulseCoverageByCurrencyRow[]>([])

// ── Chart item accessors ───────────────────────────────────────────────────────

const quoteSuccessChart = computed(
  () => chartsData.value.find(c => c.id === 'quote-success') ?? null,
)
const providerAvailabilityChart = computed(
  () => chartsData.value.find(c => c.id === 'provider-availability') ?? null,
)
const dataFreshnessChart = computed(
  () => chartsData.value.find(c => c.id === 'data-freshness') ?? null,
)
const corridorLiquidityChart = computed(
  () => chartsData.value.find(c => c.id === 'corridor-liquidity') ?? null,
)

// ── Data fetching ─────────────────────────────────────────────────────────────

function buildPulseCorridor() {
  const c = props.corridor
  if (!c) return null
  return {
    from: c.sourceCountry ?? c.fromCode ?? '',
    to: c.destCountry ?? c.toCode ?? '',
    fromCode: c.fromCode ?? '',
    toCode: c.toCode ?? '',
    fromFlag: c.fromFlag ?? '',
    toFlag: c.toFlag ?? '',
    label: c.label ?? '',
    slug: c.slug ?? c.value ?? '',
    corridorId: c.corridorId,
  }
}

async function fetchAll() {
  if (!corridorSafe.value) return

  const timeframe = '30D' as const

  const tasks: Promise<void>[] = [
    fetchSummary(timeframe),
    fetchMethod(),
  ]

  if (props.density === 'enterprise') {
    tasks.push(fetchCharts(), fetchCurrency())
  }

  await Promise.all(tasks)
}

async function fetchSummary(timeframe: '30D') {
  const pulseCorridor = buildPulseCorridor()
  if (!pulseCorridor) return

  loadingSummary.value = true
  try {
    summaryData.value = await getPulseCoverageSummary(pulseCorridor, timeframe)
  }
  catch {
    summaryData.value = null
  }
  finally {
    loadingSummary.value = false
  }
}

async function fetchMethod() {
  loadingMethod.value = true
  errorMethod.value = null
  try {
    methodRows.value = await getMethodCoverage(props.filters)
  }
  catch (err: any) {
    errorMethod.value = err?.message ?? 'Failed to load method coverage data'
    methodRows.value = []
  }
  finally {
    loadingMethod.value = false
  }
}

async function fetchCharts() {
  loadingCharts.value = true
  errorCharts.value = null
  try {
    // corridor-liquidity is only requested for enterprise density — backend returns 403 for light users
    const chartIds = ['quote-success', 'provider-availability', 'data-freshness', 'corridor-liquidity']
    const batch = await getChartsBatch(chartIds, props.filters, '30d')
    chartsData.value = batch.charts
  }
  catch (err: any) {
    errorCharts.value = err?.message ?? 'Failed to load chart data'
    chartsData.value = []
  }
  finally {
    loadingCharts.value = false
  }
}

async function fetchCurrency() {
  loadingCurrency.value = true
  errorCurrency.value = null
  try {
    const result = await getCoverageByCurrency(props.filters, ['USD', 'AED', 'GBP', 'EUR'], 500)
    currencyRows.value = result.rows
  }
  catch (err: any) {
    errorCurrency.value = err?.message ?? 'Failed to load currency coverage data'
    currencyRows.value = []
  }
  finally {
    loadingCurrency.value = false
  }
}

// ── Lifecycle + watchers ──────────────────────────────────────────────────────

onMounted(fetchAll)

watch(
  () => [props.corridor, props.filters, props.density],
  fetchAll,
  { deep: true },
)

// ── KPI derivation ─────────────────────────────────────────────────────────────

const activeProviderCount = computed(() => {
  if (methodRows.value.length > 0) return methodRows.value.length
  return summaryData.value?.providersIncluded ?? 0
})

const kpiSuccessRate = computed(() => {
  const count = summaryData.value?.providersIncluded ?? 0
  if (!summaryData.value) return { value: '—', delta: null, deltaType: 'neutral' as const }
  const pct = count > 0 ? `${count} providers` : '—'
  return {
    value: pct,
    delta: summaryData.value.quotesInRange > 0
      ? `${summaryData.value.quotesInRange.toLocaleString()} quotes`
      : null,
    deltaType: 'neutral' as const,
  }
})

const kpiFreshness = computed(() => {
  if (!summaryData.value?.lastUpdated) return { value: '—', delta: null, deltaType: 'neutral' as const }

  const updatedAt = new Date(summaryData.value.lastUpdated)
  const diffMs = Date.now() - updatedAt.getTime()
  const diffMins = Math.floor(diffMs / 60_000)

  let value = '—'
  if (!Number.isNaN(diffMins)) {
    if (diffMins < 1) value = '< 1m median'
    else if (diffMins < 60) value = `${diffMins}m median`
    else value = `${Math.floor(diffMins / 60)}h median`
  }

  return {
    value,
    delta: null,
    deltaType: 'neutral' as const,
  }
})

// ── Chart ECharts options ──────────────────────────────────────────────────────

const quoteSuccessOption = computed<EChartsOption>(() => {
  const item = quoteSuccessChart.value
  if (!item?.chart?.series?.length) return {}
  return buildChartOption('quote-success', item.chart.series)
})

const providerAvailabilityOption = computed<EChartsOption>(() => {
  const item = providerAvailabilityChart.value
  if (!item?.chart?.series?.length) return {}
  return buildChartOption('provider-availability', item.chart.series)
})

const dataFreshnessOption = computed<EChartsOption>(() => {
  const item = dataFreshnessChart.value
  if (!item?.chart?.series?.length) return {}
  return buildChartOption('data-freshness', item.chart.series)
})

const corridorLiquidityOption = computed<EChartsOption>(() => {
  const item = corridorLiquidityChart.value
  if (!item?.chart?.series?.length) return {}
  return buildChartOption('corridor-liquidity', item.chart.series)
})

// ── Method coverage table ──────────────────────────────────────────────────────

const methodColumns = [
  { key: 'provider', label: 'Provider', align: 'left' as const, sortable: false },
  { key: 'bank', label: 'Bank deposit', align: 'center' as const, sortable: false },
  { key: 'speed', label: 'Speed', align: 'left' as const, sortable: false },
]

const methodTableRows = computed(() =>
  methodRows.value.map(row => ({
    provider: row.provider,
    bank: row.bank ? 'check' : 'cross',
    speed: row.speed ?? '—',
  })),
)

// ── Currency coverage helpers ──────────────────────────────────────────────────

function formatConfidence(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return `${(value * 100).toFixed(0)}%`
}
</script>
