<template>
  <div class="space-y-6">
    <RsSectionHeader
      title="Bank Gap"
      description="How much more a bank benchmark costs than the strongest specialist route"
      icon-name="building-library"
      :variant="variant"
    />

    <EmptyState
      v-if="!corridorSafe"
      :variant="variant"
      mode="page"
      :reason="emptyReason"
      :corridor-label="corridor?.label"
      :days-available="(corridor as any)?.daysAvailable"
    />

    <template v-else>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <div :class="[cardSurface, 'p-6']">
          <p class="text-label text-neutral-500">Bank benchmark gap</p>
          <div class="mt-3 flex flex-wrap items-end gap-3">
            <p class="text-[2.5rem] font-semibold leading-none tracking-tight text-neutral-900">
              {{ bankGapBps }}
            </p>
            <p class="max-w-sm pb-1 text-body-sm text-neutral-500">
              On the same $500 bank-deposit setup, banks sit above the best specialist route by this margin.
            </p>
          </div>

          <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RsStatCard
              label="Bank total cost"
              :value="bankCostLabel"
              size="lg"
              class="h-full"
              :variant="variant"
              :loading="loadingComparison"
              tooltip="Current estimated all-in bank benchmark cost for the selected corridor"
            />
            <RsStatCard
              label="Best specialist cost"
              :value="specialistCostLabel"
              size="lg"
              class="h-full"
              :variant="variant"
              :loading="loadingComparison"
              tooltip="Lowest specialist all-in cost available in the current provider set"
            />
            <RsStatCard
              label="Estimated savings"
              :value="savingsLabel"
              :delta="savingsPctLabel"
              delta-type="positive"
              delta-label="lower vs bank"
              size="lg"
              class="h-full"
              :variant="variant"
              :loading="loadingComparison"
              tooltip="Savings from the best specialist compared with the bank benchmark"
            />
            <RsStatCard
              label="Current specialist leader"
              :value="specialistNameLabel"
              size="lg"
              class="h-full"
              :variant="variant"
              :loading="loadingComparison"
              tooltip="Specialist currently delivering the strongest all-in value"
            />
          </div>
        </div>

        <ChartCard
          title="Bank vs Specialist Trend"
          subtitle="Bank average cost % against the leading specialist cost % across recent publications"
          :variant="variant"
          :loading="loadingTrend"
          :error="trendError ? { message: trendError } : null"
          :data-available="trendSeriesAvailable"
          :empty="!trendSeriesAvailable ? { title: 'No trend data', message: 'Trend history is not available for this corridor yet.' } : null"
        >
          <template #chart>
            <RsChart
              :option="trendOption"
              height="tall"
              :theme="echartsTheme"
            />
          </template>
        </ChartCard>
      </div>

      <div :class="[cardSurface, 'overflow-hidden']">
        <div class="border-b border-[#E3ECFA] px-6 py-4">
          <h3 class="text-h4 text-neutral-900">Specialist Benchmark Table</h3>
          <p class="mt-1 text-body-sm text-neutral-500">
            Delivered amount and cost position for specialists measured against the same bank benchmark.
          </p>
        </div>

        <div class="px-6 py-5">
          <div
            v-if="loadingTrueCost"
            class="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <SkeletonBlock
              v-for="index in 4"
              :key="index"
              width="full"
              height="96px"
              tone="light"
              rounded="xl"
            />
          </div>

          <div
            v-else-if="benchmarkRows.length === 0"
            class="py-10 text-center"
          >
            <p class="text-body-sm text-neutral-500">
              No specialist benchmark rows are available for this corridor yet.
            </p>
          </div>

          <div
            v-else
            class="overflow-x-auto"
          >
            <table class="min-w-full text-body-sm">
              <thead class="border-b border-[#E3ECFA] text-left text-label text-neutral-500">
                <tr>
                  <th class="px-3 py-3">Provider</th>
                  <th class="px-3 py-3 text-right">Recipient gets</th>
                  <th class="px-3 py-3 text-right">Cost %</th>
                  <th class="px-3 py-3 text-right">Savings vs bank</th>
                  <th class="px-3 py-3 text-right">FX markup</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EAF1FB]">
                <tr
                  v-for="row in benchmarkRows"
                  :key="row.name"
                  :class="row.isBest ? 'bg-[#F6FAFF]' : ''"
                >
                  <td class="px-3 py-3">
                    <div class="flex items-center gap-3">
                      <img
                        :src="getProviderLogoPath(row.name)"
                        :alt="row.name"
                        width="22"
                        height="22"
                        class="h-5 w-auto max-w-[72px] object-contain"
                        loading="lazy"
                        @error="($event.target as HTMLImageElement).style.display = 'none'"
                      >
                      <div class="min-w-0">
                        <p class="truncate font-semibold text-neutral-900">
                          {{ row.name }}
                        </p>
                        <p
                          v-if="row.isBest"
                          class="text-xs font-medium text-brand-600"
                        >
                          Current specialist leader
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-3 text-right font-medium tabular-nums text-neutral-900">
                    {{ row.deliveredFormatted }}
                  </td>
                  <td class="px-3 py-3 text-right tabular-nums text-neutral-700">
                    {{ row.costPct }}
                  </td>
                  <td class="px-3 py-3 text-right tabular-nums">
                    <span :class="row.savingsVsBank >= 0 ? 'text-brand-700' : 'text-neutral-500'">
                      {{ row.savingsLabel }}
                    </span>
                  </td>
                  <td class="px-3 py-3 text-right tabular-nums text-neutral-500">
                    {{ row.markupLabel }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PulseDensity, PulseFilters, CorridorOption, ChartSeries } from '~/types/pulse'
import { usePulseStore, type PulseCorridor } from '~/stores/pulse'
import type { BankComparisonData, CostTrendData, ProviderWithTrueCost } from '~/types/remit'
import { getProviderLogoPath } from '~/composables/useProviderLogo'
import { getBankComparisonData, getCostTrendData, getTrueCostBreakdown } from '~/domains/pulse/infrastructure/pulseApi'
import { buildBankVsSpecialistTrendOption } from '~/lib/pulseChartBuilders'
import RsStatCard from '~/ui/cards/RsStatCard.vue'
import ChartCard from '~/ui/charts/ChartCard.vue'
import RsChart from '~/ui/charts/RsChart.vue'
import RsSectionHeader from '~/ui/layout/RsSectionHeader.vue'
import EmptyState from '~/ui/states/EmptyState.vue'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'
import { formatMoney } from '~/shared/lib/format'

interface Props {
  density: PulseDensity
  corridor: CorridorOption | PulseCorridor | null
  filters: PulseFilters
}

const props = defineProps<Props>()

const store = usePulseStore()
const { variant, cardSurface, echartsTheme } = usePulseTheme()
const { isCorridorSafe, getEmptyReason } = usePulseDataSafety()

function isCorridorOptionValue(
  corridor: CorridorOption | PulseCorridor,
): corridor is CorridorOption {
  return 'value' in corridor
}

function isPulseCorridorValue(
  corridor: CorridorOption | PulseCorridor,
): corridor is PulseCorridor {
  return 'slug' in corridor && 'from' in corridor && 'to' in corridor && !('value' in corridor)
}

const corridorForSafety = computed<CorridorOption | null>(() =>
  props.corridor && isCorridorOptionValue(props.corridor) ? props.corridor : null,
)

const corridorForApi = computed<PulseCorridor | null>(() => {
  const corridor = props.corridor
  if (!corridor) return null

  if (isPulseCorridorValue(corridor)) {
    return corridor
  }

  return {
    from: corridor.sourceCountry ?? corridor.label?.split('→')[0]?.trim() ?? '',
    to: corridor.destCountry ?? corridor.label?.split('→')[1]?.trim() ?? '',
    fromCode: corridor.fromCode,
    toCode: corridor.toCode,
    fromFlag: corridor.fromFlag,
    toFlag: corridor.toFlag,
    label: corridor.label,
    slug: corridor.slug ?? corridor.value,
    corridorId: corridor.corridorId ?? corridor.value,
  }
})

const corridorSafe = computed(() =>
  corridorForSafety.value ? isCorridorSafe(corridorForSafety.value) : Boolean(corridorForApi.value),
)
const emptyReason = computed(() => getEmptyReason(corridorForSafety.value))

const loadingComparison = ref(false)
const loadingTrend = ref(false)
const loadingTrueCost = ref(false)

const comparisonData = ref<BankComparisonData | null>(null)
const trendData = ref<CostTrendData[]>([])
const trueCostData = ref<ProviderWithTrueCost[]>([])
const trendError = ref<string | null>(null)

const sendCurrency = computed(() => props.corridor?.fromCode ?? 'USD')
const receiveCurrency = computed(() => props.corridor?.toCode ?? '')

const formatValue = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return formatMoney(value, { currency: sendCurrency.value })
}

const bankGapBps = computed(() => {
  const bank = comparisonData.value
  if (!bank) return '—'
  const amount = props.filters.amount
  const bankPct = amount > 0 ? (bank.bankTotalCost / amount) * 100 : 0
  const specialistPct = amount > 0 ? (bank.bestSpecialistTotalCost / amount) * 100 : 0
  if (!Number.isFinite(bankPct) || !Number.isFinite(specialistPct)) return '—'
  return `${Math.round((bankPct - specialistPct) * 100)} bps`
})

const bankCostLabel = computed(() => formatValue(comparisonData.value?.bankTotalCost))
const specialistCostLabel = computed(() => formatValue(comparisonData.value?.bestSpecialistTotalCost))
const savingsLabel = computed(() => formatValue(comparisonData.value?.savings))
const savingsPctLabel = computed(() =>
  typeof comparisonData.value?.savingsPercent === 'number'
    ? `${comparisonData.value.savingsPercent.toFixed(1)}%`
    : '—',
)
const specialistNameLabel = computed(() => comparisonData.value?.bestSpecialistName || '—')

const trendSeriesAvailable = computed(() => trendData.value.length > 0)

const trendOption = computed(() => {
  if (!trendData.value.length) return {}

  const bankSeries: ChartSeries[] = [{
    id: 'bank-cost',
    label: 'Bank average cost',
    color: '#0B1F59',
    points: trendData.value.map(point => ({
      t: new Date(point.date).getTime(),
      v: point.averageHiddenFee,
    })),
  }]

  const specialistSeries: ChartSeries[] = [{
    id: 'specialist-cost',
    label: 'Best specialist cost',
    color: '#2563EB',
    points: trendData.value.map(point => ({
      t: new Date(point.date).getTime(),
      v: point.bestProviderCost,
    })),
  }]

  return buildBankVsSpecialistTrendOption(bankSeries, specialistSeries)
})

const bankBenchmarkPct = computed(() => {
  const bank = comparisonData.value
  if (!bank || props.filters.amount <= 0) return null
  return (bank.bankTotalCost / props.filters.amount) * 100
})

const benchmarkRows = computed(() => {
  const bankPct = bankBenchmarkPct.value
  const rows = [...trueCostData.value].sort((left, right) => right.recipientGets - left.recipientGets)

  return rows.map((provider, index) => {
    const providerCostPct = props.filters.amount > 0
      ? (provider.trueCost.totalCost / props.filters.amount) * 100
      : 0
    const savingsVsBank = bankPct === null ? 0 : (bankPct - providerCostPct) * props.filters.amount / 100

    return {
      name: provider.name,
      isBest: index === 0,
      deliveredFormatted: `${provider.recipientGets.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${receiveCurrency.value}`,
      costPct: `${providerCostPct.toFixed(2)}%`,
      savingsVsBank,
      savingsLabel: savingsVsBank > 0 ? formatMoney(savingsVsBank, { currency: sendCurrency.value }) : '—',
      markupLabel: `${provider.trueCost.spreadBps} bps`,
    }
  })
})

async function loadComparison() {
  if (!props.corridor || !corridorSafe.value) {
    comparisonData.value = null
    return
  }
  loadingComparison.value = true
  try {
    comparisonData.value = await getBankComparisonData(corridorForApi.value, store.timeframe, props.filters.amount)
  }
  catch {
    comparisonData.value = null
  }
  finally {
    loadingComparison.value = false
  }
}

async function loadTrend() {
  if (!props.corridor || !corridorSafe.value) {
    trendData.value = []
    return
  }
  loadingTrend.value = true
  trendError.value = null
  try {
    trendData.value = await getCostTrendData(corridorForApi.value, store.timeframe, props.filters.amount)
  }
  catch (error) {
    trendData.value = []
    trendError.value = error instanceof Error ? error.message : 'Failed to load trend history.'
  }
  finally {
    loadingTrend.value = false
  }
}

async function loadTrueCost() {
  if (!props.corridor || !corridorSafe.value) {
    trueCostData.value = []
    return
  }
  loadingTrueCost.value = true
  try {
    trueCostData.value = await getTrueCostBreakdown(corridorForApi.value, props.filters.amount)
  }
  catch {
    trueCostData.value = []
  }
  finally {
    loadingTrueCost.value = false
  }
}

async function loadAll() {
  await Promise.all([loadComparison(), loadTrend(), loadTrueCost()])
}

watch(
  () => [props.corridor, props.filters.amount, props.filters.fundingMethod, props.filters.payoutMethod, store.timeframe],
  () => {
    loadAll()
  },
  { immediate: true, deep: true },
)
</script>
