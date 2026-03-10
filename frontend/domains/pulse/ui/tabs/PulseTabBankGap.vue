<template>
  <div class="space-y-6">
    <!-- Header -->
    <div :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'">
      <h2 class="text-h3 font-bold">Bank vs Specialist</h2>
      <p
        :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-600'"
        class="text-body-sm mt-1"
      >
        How much do banks overcharge?
      </p>
    </div>

    <!-- No corridor state -->
    <div
      v-if="!props.corridor"
      :class="variant === 'terminal' ? 'card-surface' : 'rounded-xl border border-neutral-200 bg-white'"
      class="p-10 text-center"
    >
      <p :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'" class="text-body-sm">
        Select a corridor to see the bank vs specialist comparison.
      </p>
    </div>

    <!-- Loaded content -->
    <template v-else>
      <!-- Loading state -->
      <div
        v-if="loading"
        class="space-y-4"
      >
        <SkeletonBlock
          width="full"
          height="240px"
          :tone="variant === 'terminal' ? 'dark' : 'light'"
          rounded="xl"
        />
        <div
          v-if="density === 'enterprise'"
          class="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <SkeletonBlock
            width="full"
            height="120px"
            :tone="variant === 'terminal' ? 'dark' : 'light'"
            rounded="xl"
          />
          <SkeletonBlock
            width="full"
            height="120px"
            :tone="variant === 'terminal' ? 'dark' : 'light'"
            rounded="xl"
          />
        </div>
      </div>

      <!-- Error state -->
      <div
        v-else-if="error"
        :class="variant === 'terminal' ? 'card-surface' : 'rounded-xl border border-neutral-200 bg-white'"
        class="p-8 text-center"
      >
        <p :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'" class="text-body-sm">
          Unable to load bank comparison data. Please try again.
        </p>
      </div>

      <!-- No data state -->
      <div
        v-else-if="!bankData"
        :class="variant === 'terminal' ? 'card-surface' : 'rounded-xl border border-neutral-200 bg-white'"
        class="p-8 text-center"
      >
        <p :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'" class="text-body-sm">
          No bank comparison data is available for this corridor yet.
        </p>
      </div>

      <!-- LIGHT layout -->
      <template v-else-if="density === 'light'">
        <div class="max-w-2xl mx-auto">
          <div
            :class="variant === 'terminal' ? 'card-surface' : 'rounded-xl border border-neutral-200 bg-white shadow-sm'"
            class="overflow-hidden"
          >
            <!-- Card header -->
            <div
              :class="variant === 'terminal' ? 'border-b border-white/[0.08]' : 'border-b border-neutral-100'"
              class="px-6 py-4"
            >
              <p
                :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-700'"
                class="text-body-sm font-medium text-center"
              >
                If you send
                <span
                  :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
                  class="font-bold"
                >
                  {{ amountDisplay }}
                </span>
                {{ sendCurrency }}
              </p>
            </div>

            <!-- Two panels -->
            <div class="grid grid-cols-2 divide-x divide-neutral-200 divide-opacity-20">
              <!-- Bank panel -->
              <div class="p-6">
                <div class="flex items-center gap-2 mb-4">
                  <span
                    :class="variant === 'terminal' ? 'bg-red-500/20' : 'bg-red-50'"
                    class="flex h-8 w-8 items-center justify-center rounded-lg"
                  >
                    <svg
                      class="h-4 w-4 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </span>
                  <span
                    :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-700'"
                    class="text-body-sm font-semibold"
                  >
                    Bank
                  </span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-body-sm">
                    <span :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'">
                      Wire fee
                    </span>
                    <span
                      :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
                      class="font-medium text-mono-value"
                    >
                      {{ formatVal(bankData.bankFee) }}
                    </span>
                  </div>
                  <div class="flex justify-between text-body-sm">
                    <span :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'">
                      FX markup
                    </span>
                    <span class="font-medium text-red-500 text-mono-value">
                      {{ formatVal(bankData.bankMarkup) }}
                    </span>
                  </div>
                  <div
                    :class="variant === 'terminal' ? 'border-neutral-700' : 'border-neutral-100'"
                    class="border-t pt-2 mt-2"
                  >
                    <div class="flex justify-between">
                      <span
                        :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-700'"
                        class="text-body-sm font-semibold"
                      >
                        Total cost
                      </span>
                      <span class="text-body-lg font-bold text-red-500 text-mono-value">
                        {{ formatVal(bankData.bankTotalCost) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Specialist panel -->
              <div class="p-6">
                <div class="flex items-center gap-2 mb-4">
                  <span
                    :class="variant === 'terminal' ? 'bg-emerald-500/20' : 'bg-emerald-50'"
                    class="flex h-8 w-8 items-center justify-center rounded-lg"
                  >
                    <svg
                      class="h-4 w-4 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                  <span
                    :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-700'"
                    class="text-body-sm font-semibold"
                  >
                    Best Specialist
                  </span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-body-sm">
                    <span :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'">
                      Transfer fee
                    </span>
                    <span
                      :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
                      class="font-medium text-mono-value"
                    >
                      {{ formatVal(bankData.bestSpecialistFee) }}
                    </span>
                  </div>
                  <div class="flex justify-between text-body-sm">
                    <span :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'">
                      FX markup
                    </span>
                    <span class="font-medium text-emerald-500 text-mono-value">
                      {{ formatVal(bankData.bestSpecialistMarkup) }}
                    </span>
                  </div>
                  <div
                    :class="variant === 'terminal' ? 'border-neutral-700' : 'border-neutral-100'"
                    class="border-t pt-2 mt-2"
                  >
                    <div class="flex justify-between">
                      <span
                        :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-700'"
                        class="text-body-sm font-semibold"
                      >
                        Total cost
                      </span>
                      <span class="text-body-lg font-bold text-emerald-500 text-mono-value">
                        {{ formatVal(bankData.bestSpecialistTotalCost) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Provider name badge -->
                <div
                  v-if="bankData.bestSpecialistName"
                  class="mt-3"
                >
                  <span
                    :class="variant === 'terminal' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'"
                    class="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                  >
                    {{ bankData.bestSpecialistName }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Summary footer -->
            <div
              :class="variant === 'terminal' ? 'bg-emerald-500/10 border-t border-emerald-500/20' : 'bg-emerald-50 border-t border-emerald-100'"
              class="px-6 py-4 text-center"
            >
              <p
                :class="variant === 'terminal' ? 'text-emerald-400' : 'text-emerald-700'"
                class="text-body-sm font-medium"
              >
                Using a specialist saves you approximately
                <span class="font-bold text-mono-value">{{ formatVal(bankData.savings) }}</span>
                on this transfer
                <span
                  v-if="typeof bankData.savingsPercent === 'number'"
                  class="opacity-75"
                >
                  ({{ bankData.savingsPercent.toFixed(1) }}% less)
                </span>
              </p>
            </div>
          </div>
        </div>
      </template>

      <!-- ENTERPRISE layout -->
      <template v-else>
        <!-- ROW 2: Stat card + Trend chart -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Bank Gap stat card -->
          <div class="card-surface overflow-hidden">
            <div class="border-b border-white/[0.08] px-5 py-3">
              <h3 class="text-body-sm font-semibold text-neutral-300 uppercase tracking-wider">
                Bank Gap
              </h3>
            </div>
            <div class="px-5 py-5">
              <div class="flex items-end gap-3">
                <span class="text-h2 font-bold text-white text-mono-value">
                  {{ bankGapBps }}
                </span>
                <span class="text-body-sm text-neutral-400 pb-1">bps above specialist</span>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-neutral-500 mb-0.5">Bank all-in cost</p>
                  <p class="text-body-sm font-semibold text-red-400 text-mono-value">
                    {{ formatVal(bankData.bankTotalCost) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500 mb-0.5">Specialist cost</p>
                  <p class="text-body-sm font-semibold text-emerald-400 text-mono-value">
                    {{ formatVal(bankData.bestSpecialistTotalCost) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500 mb-0.5">Savings</p>
                  <p class="text-body-sm font-semibold text-emerald-400 text-mono-value">
                    {{ formatVal(bankData.savings) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500 mb-0.5">Savings %</p>
                  <p class="text-body-sm font-semibold text-emerald-400">
                    {{ typeof bankData.savingsPercent === 'number' ? bankData.savingsPercent.toFixed(1) + '%' : 'n/a' }}
                  </p>
                </div>
              </div>
              <div class="mt-4 pt-3 border-t border-neutral-700">
                <p class="text-xs text-neutral-500">
                  Best specialist: <span class="text-neutral-300 font-medium">{{ bankData.bestSpecialistName || 'n/a' }}</span>
                  &middot; Amount: <span class="text-neutral-300 font-medium text-mono-value">{{ amountDisplay }}</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Bank vs Specialist Trend chart -->
          <div class="card-surface overflow-hidden">
            <div class="border-b border-white/[0.08] px-5 py-3">
              <h3 class="text-body-sm font-semibold text-neutral-300 uppercase tracking-wider">
                Bank vs Specialist Trend
              </h3>
            </div>
            <div class="px-5 py-4">
              <div
                v-if="trendLoading"
                class="flex h-48 items-center justify-center"
              >
                <div class="h-5 w-5 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
              </div>
              <div
                v-else-if="trendSeries.length > 0 && trendSeries[0].points.length > 0"
              >
                <PulseLineChart
                  :series="trendSeries"
                  unit="percent"
                  unit-label="Cost %"
                  :show-area="true"
                />
              </div>
              <div
                v-else
                class="flex h-48 items-center justify-center"
              >
                <p class="text-body-sm text-neutral-500">No trend data available.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ROW 3: Full benchmark table -->
        <div class="card-surface overflow-hidden">
          <div class="border-b border-white/[0.08] px-6 py-4">
            <h3 class="text-body-sm font-semibold text-neutral-300 uppercase tracking-wider">
              Provider Benchmark — Bank vs Specialist
            </h3>
            <p class="text-body-sm text-neutral-500 mt-0.5">
              {{ props.corridor.label }} &middot; {{ amountDisplay }}
            </p>
          </div>

          <div class="px-6 py-4">
            <div
              v-if="trueCostLoading"
              class="flex h-32 items-center justify-center"
            >
              <div class="flex items-center gap-3 text-neutral-400">
                <div class="h-5 w-5 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
                Loading benchmark data...
              </div>
            </div>

            <div
              v-else-if="benchmarkRows.length > 0"
              class="overflow-x-auto"
            >
              <table class="min-w-full text-body-sm">
                <thead class="text-xs uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th class="px-3 py-2 text-left">Provider</th>
                    <th class="px-3 py-2 text-left">Type</th>
                    <th class="px-3 py-2 text-right">Delivered</th>
                    <th class="px-3 py-2 text-right">Cost %</th>
                    <th class="px-3 py-2 text-right">vs Bank Benchmark</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-700">
                  <tr
                    v-for="row in benchmarkRows"
                    :key="row.name"
                    :class="[
                      row.isBank
                        ? 'bg-amber-500/5'
                        : row.isBest
                          ? 'bg-emerald-500/10'
                          : 'hover:bg-neutral-800/60',
                    ]"
                    class="transition-colors"
                  >
                    <td class="px-3 py-3 text-left">
                      <span
                        :class="row.isBest ? 'text-emerald-400 font-semibold' : row.isBank ? 'text-amber-300' : 'text-white'"
                      >
                        {{ row.name }}
                      </span>
                      <span
                        v-if="row.isBest"
                        class="ml-2 inline-block rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-xs font-medium text-emerald-400"
                      >
                        Best
                      </span>
                    </td>
                    <td class="px-3 py-3 text-left">
                      <span
                        :class="row.isBank ? 'bg-amber-500/20 text-amber-300' : 'bg-brand-600/20 text-brand-400'"
                        class="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      >
                        {{ row.isBank ? 'Bank' : 'Specialist' }}
                      </span>
                    </td>
                    <td
                      class="px-3 py-3 text-right font-medium text-mono-value"
                      :class="row.isBest ? 'text-emerald-400' : 'text-white'"
                    >
                      {{ row.deliveredFormatted }}
                    </td>
                    <td
                      class="px-3 py-3 text-right text-mono-value"
                      :class="row.isBank ? 'text-red-400' : 'text-neutral-300'"
                    >
                      {{ row.costPct }}
                    </td>
                    <td class="px-3 py-3 text-right text-mono-value">
                      <span
                        :class="row.vsBankPositive ? 'text-emerald-400' : 'text-red-400'"
                      >
                        {{ row.vsBankLabel }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              v-else
              class="py-8 text-center"
            >
              <p class="text-body-sm text-neutral-500">No provider data available.</p>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { PulseDensity, PulseFilters } from '~/types/pulse'
import type { PulseCorridor } from '~/stores/pulse'
import type { BankComparisonData, CostTrendData, ProviderWithTrueCost } from '~/types/remit'
import type { ChartSeries } from '~/types/pulse'
import { getBankComparisonData, getCostTrendData, getTrueCostBreakdown } from '~/lib/pulseApi'
import { usePulseTheme } from '~/composables/usePulseTheme'
import { usePulseDataSafety } from '~/composables/usePulseDataSafety'
import { formatMoney } from '~/shared/lib/format'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'
import PulseLineChart from '~/components/pulse/PulseLineChart.vue'

// ----- Props -----

interface Props {
  density: PulseDensity
  corridor: PulseCorridor | null
  filters: PulseFilters
}

const props = defineProps<Props>()

// ----- Theme -----

const { variant } = usePulseTheme()
const { isCorridorSafe } = usePulseDataSafety()

// ----- State -----

const loading = ref(false)
const error = ref(false)
const bankData = ref<BankComparisonData | null>(null)

const trendLoading = ref(false)
const trendData = ref<CostTrendData[]>([])

const trueCostLoading = ref(false)
const trueCostData = ref<ProviderWithTrueCost[]>([])

// ----- Derived -----

const sendCurrency = computed(() => props.corridor?.fromCode ?? 'USD')
const recvCurrency = computed(() => props.corridor?.toCode ?? '')

const amountDisplay = computed(() =>
  formatMoney(props.filters.amount, { currency: sendCurrency.value, maximumFractionDigits: 0 }),
)

function formatVal(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'n/a'
  return formatMoney(value, { currency: sendCurrency.value })
}

// Bank gap expressed as basis points delta between bank total cost % and specialist total cost %
const bankGapBps = computed(() => {
  if (!bankData.value) return 'n/a'
  const { bankTotalCost, bestSpecialistTotalCost } = bankData.value
  const amount = props.filters.amount
  if (!amount || !bankTotalCost || !bestSpecialistTotalCost) return 'n/a'
  const bankPct = (bankTotalCost / amount) * 100
  const specialistPct = (bestSpecialistTotalCost / amount) * 100
  const bps = Math.round((bankPct - specialistPct) * 100)
  if (!Number.isFinite(bps)) return 'n/a'
  return `${bps} bps`
})

// Build chart series from cost trend data for enterprise view
const trendSeries = computed<ChartSeries[]>(() => {
  if (trendData.value.length === 0) return []
  const points = trendData.value
    .filter(d => d.date && typeof d.averageHiddenFee === 'number')
    .map(d => ({
      t: new Date(d.date).getTime(),
      v: d.averageHiddenFee,
    }))

  const bestPoints = trendData.value
    .filter(d => d.date && typeof d.bestProviderCost === 'number')
    .map(d => ({
      t: new Date(d.date).getTime(),
      v: d.bestProviderCost,
    }))

  const series: ChartSeries[] = []
  if (points.length > 0) {
    series.push({ id: 'bank', label: 'Bank (avg cost %)', color: '#f87171', points })
  }
  if (bestPoints.length > 0) {
    series.push({ id: 'specialist', label: 'Best Specialist (cost %)', color: '#34d399', points: bestPoints })
  }
  return series
})

// Bank benchmark total cost as a percentage of send amount (used for vs-bank delta)
const bankBenchmarkPct = computed<number | null>(() => {
  if (!bankData.value) return null
  const amount = props.filters.amount
  if (!amount || !bankData.value.bankTotalCost) return null
  return (bankData.value.bankTotalCost / amount) * 100
})

interface BenchmarkRow {
  name: string
  isBank: boolean
  isBest: boolean
  deliveredFormatted: string
  costPct: string
  vsBankLabel: string
  vsBankPositive: boolean
}

const benchmarkRows = computed<BenchmarkRow[]>(() => {
  if (trueCostData.value.length === 0) return []

  const bankName = bankData.value?.bestSpecialistName ?? ''
  const amount = props.filters.amount
  const bankPct = bankBenchmarkPct.value

  // Sort by recipientGets descending (best delivered first)
  const sorted = [...trueCostData.value].sort((a, b) => b.recipientGets - a.recipientGets)
  const bestName = sorted[0]?.name ?? ''

  return sorted.map((p): BenchmarkRow => {
    const isBest = p.name === bestName && !p.name.toLowerCase().includes('bank')
    const costPctVal = amount > 0 ? (p.trueCost.totalCost / amount) * 100 : 0
    const costPctStr = `${costPctVal.toFixed(2)}%`

    let vsBankLabel = 'n/a'
    let vsBankPositive = false
    if (bankPct !== null && Number.isFinite(costPctVal)) {
      const delta = bankPct - costPctVal
      const deltaBps = Math.round(delta * 100)
      vsBankPositive = delta > 0
      vsBankLabel = delta > 0 ? `-${deltaBps} bps` : `+${Math.abs(deltaBps)} bps`
    }

    const deliveredFormatted = `${p.recipientGets.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${recvCurrency.value}`

    return {
      name: p.name,
      isBank: p.name.toLowerCase().includes('bank') || p.name === bankName,
      isBest,
      deliveredFormatted,
      costPct: costPctStr,
      vsBankLabel,
      vsBankPositive,
    }
  })
})

// ----- Data fetching -----

async function loadBankComparison() {
  if (!props.corridor) return
  loading.value = true
  error.value = false
  try {
    bankData.value = await getBankComparisonData(props.corridor, '30D', props.filters.amount)
  }
  catch {
    useLogger('PulseTabBankGap').error('Failed to load bank comparison data')
    error.value = true
    bankData.value = null
  }
  finally {
    loading.value = false
  }
}

async function loadTrend() {
  if (!props.corridor || props.density !== 'enterprise') return
  trendLoading.value = true
  try {
    trendData.value = await getCostTrendData(props.corridor, '30D', props.filters.amount)
  }
  catch {
    useLogger('PulseTabBankGap').warn('Failed to load cost trend data')
    trendData.value = []
  }
  finally {
    trendLoading.value = false
  }
}

async function loadTrueCost() {
  if (!props.corridor || props.density !== 'enterprise') return
  trueCostLoading.value = true
  try {
    trueCostData.value = await getTrueCostBreakdown(props.corridor, props.filters.amount)
  }
  catch {
    useLogger('PulseTabBankGap').warn('Failed to load true cost data')
    trueCostData.value = []
  }
  finally {
    trueCostLoading.value = false
  }
}

async function loadAll() {
  await loadBankComparison()
  if (props.density === 'enterprise') {
    await Promise.allSettled([loadTrend(), loadTrueCost()])
  }
}

// ----- Lifecycle -----

onMounted(() => {
  loadAll()
})

watch(
  () => [props.corridor, props.filters.amount, props.filters.fundingMethod, props.filters.payoutMethod],
  () => loadAll(),
  { deep: true },
)
</script>
