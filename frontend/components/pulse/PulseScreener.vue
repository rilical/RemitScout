<script setup lang="ts">
import { computed } from 'vue'
import type { CorridorOption, PulseScreenerRow } from '~/types/pulse'
import type { PulseTimeframe } from '~/stores/pulse'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'
import { formatUpdatedLabel } from '~/shared/lib/format'
import { getAvailableTimeframes, isTimeframeAvailable } from '~/composables/usePulseTimeframes'
import { Icon } from '~/ui'

const TIMEFRAMES: PulseTimeframe[] = ['24H', '7D', '30D', '1Y', 'MAX']

const props = withDefaults(
  defineProps<{
    rows: PulseScreenerRow[]
    loading?: boolean
    error?: string | null
    selectedCorridorId?: string | null
    selectedTimeframe?: PulseTimeframe
    pinnedCorridorIds?: string[]
    corridorOptions?: CorridorOption[]
    corridorDaysMap?: Record<string, number>
    trackedCorridorCount?: number
    requestedAmount?: number
    queryAmount?: number
    goldBenchmarkAmount?: number
  }>(),
  {
    corridorOptions: () => [],
    corridorDaysMap: () => ({}),
    selectedTimeframe: '7D',
    trackedCorridorCount: 0,
    requestedAmount: 1000,
    queryAmount: 1000,
    goldBenchmarkAmount: 500,
  },
)

const emit = defineEmits<{
  select: [corridorId: string]
  pin: [corridorId: string]
  unpin: [corridorId: string]
  selectTimeframe: [corridorId: string, timeframe: PulseTimeframe]
}>()

function getDaysAvailableForRow(row: PulseScreenerRow): number {
  const fromMap = props.corridorDaysMap?.[row.corridorId]
  if (typeof fromMap === 'number' && fromMap >= 0) return fromMap
  const opt = props.corridorOptions.find(
    c => c.corridorId === row.corridorId || (c.slug ?? c.value) === row.slug,
  )
  if (!opt?.minDate || !opt?.maxDate) return 0
  const min = new Date(opt.minDate).getTime()
  const max = new Date(opt.maxDate).getTime()
  if (Number.isNaN(min) || Number.isNaN(max)) return 0
  return Math.ceil((max - min) / 86400000)
}

function handleTimeframeClick(row: PulseScreenerRow, tf: PulseTimeframe) {
  if (!isTimeframeAvailable(getDaysAvailableForRow(row), tf)) return
  emit('selectTimeframe', row.corridorId, tf)
}

const pinnedSet = computed(() => new Set(props.pinnedCorridorIds ?? []))

const handlePinToggle = (event: Event, row: PulseScreenerRow) => {
  event.stopPropagation()
  if (pinnedSet.value.has(row.corridorId)) {
    emit('unpin', row.corridorId)
  }
 else {
    emit('pin', row.corridorId)
  }
}

const hasRows = computed(() => props.rows && props.rows.length > 0)

const formatPct = (value: number | null) => {
  if (value === null) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(2)}%`
}

const formatNumber = (value: number | null) => {
  if (value === null) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

const formatRecipientGets = (value: number | null, currency?: string) => {
  if (value === null) return '—'
  const rounded = Math.round(value)
  const formatted = formatNumber(rounded)
  return currency ? `${currency} ${formatted}` : formatted
}

const levelLabel = (level: PulseScreenerRow['smartSendLevel']) => {
  if (!level) return '—'
  if (level === 'great') return 'Great'
  if (level === 'good') return 'Good'
  if (level === 'fair') return 'Fair'
  return 'Wait'
}

const levelClass = (level: PulseScreenerRow['smartSendLevel']) => {
  switch (level) {
    case 'great':
      return 'bg-success-600/15 text-success-400 border border-success-600/30'
    case 'good':
      return 'bg-brand-600/15 text-brand-400 border border-brand-600/30'
    case 'fair':
      return 'bg-warning-500/15 text-warning-400 border border-warning-500/30'
    case 'wait':
      return 'bg-danger-600/15 text-danger-400 border border-danger-600/30'
    default:
      return 'bg-white/[0.04] text-neutral-300 border border-white/[0.08]'
  }
}

const moverClass = (delta: number | null) => {
  if (delta === null) return 'bg-white/[0.04] text-neutral-300 border border-white/[0.08]'
  if (delta > 0) return 'bg-success-600/15 text-success-400 border border-success-600/30'
  if (delta < 0) return 'bg-danger-600/15 text-danger-400 border border-danger-600/30'
  return 'bg-white/[0.04] text-neutral-300 border border-white/[0.08]'
}

const handleSelect = (row: PulseScreenerRow) => {
  if (!row.dataAvailable) return
  emit('select', row.corridorId)
}

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)

const requestedAmountLabel = computed(() => formatUsd(props.requestedAmount))

const queryAmountLabel = computed(() => formatUsd(props.queryAmount))

const goldBenchmarkLabel = computed(() => formatUsd(props.goldBenchmarkAmount))

const screenerContextLabel = computed(() => {
  const base = `${requestedAmountLabel.value} requested • ${props.selectedTimeframe} • bank→bank • ${goldBenchmarkLabel.value} Gold benchmark`
  if (props.requestedAmount === props.queryAmount) return base
  return `${base} • ${queryAmountLabel.value} Pulse bucket`
})

const screenerSummaryLabel = computed(() => {
  const trackedCount = props.trackedCorridorCount ?? 0
  if (trackedCount <= 0)
    return 'Prioritizes pinned and watchlist routes, then highest-coverage Gold corridors.'
  return `Scanning ${formatNumber(trackedCount)} Gold-supported corridors, with pinned and watchlist routes first.`
})
</script>

<template>
  <section class="card-elevated overflow-hidden">
    <div class="border-b border-white/[0.08] px-6 py-5">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-body-lg font-bold text-white">Gold Corridor Screener</h2>
          <p class="text-body-sm text-neutral-400">
            {{ screenerSummaryLabel }}
          </p>
        </div>
        <div class="text-label font-mono text-neutral-500">
          {{ screenerContextLabel }}
        </div>
      </div>
    </div>

    <div class="p-4 sm:p-6">
      <div
        v-if="error"
        class="text-body-sm rounded-xl border border-danger-600/40 bg-danger-600/10 p-4 text-danger-200"
      >
        {{ error }}
      </div>

      <div
v-else-if="loading"
class="space-y-3"
>
        <div
          v-for="n in 6"
          :key="n"
          class="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
        >
          <SkeletonBlock
width="11rem"
height="14"
tone="dark"
/>
          <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SkeletonBlock
width="5rem"
height="12"
tone="dark"
/>
            <SkeletonBlock
width="7rem"
height="12"
tone="dark"
/>
            <SkeletonBlock
width="6rem"
height="12"
tone="dark"
/>
            <SkeletonBlock
width="5rem"
height="12"
tone="dark"
/>
          </div>
        </div>
      </div>

      <div
        v-else-if="!hasRows"
        class="text-body-sm rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 text-neutral-300"
      >
        No Gold-supported corridors are available right now.
      </div>

      <div
v-else
class="space-y-3"
>
        <button
          v-for="row in rows"
          :key="row.corridorId"
          type="button"
          class="w-full rounded-xl border bg-white/[0.02] p-4 text-left transition hover:border-brand-600/60 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60 focus-ring-dark"
          :class="[
            row.corridorId === selectedCorridorId
              ? 'border-brand-600/70 ring-1 ring-brand-600/40'
              : 'border-white/[0.08]',
          ]"
          :disabled="!row.dataAvailable"
          @click="handleSelect(row)"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div class="text-body-sm font-semibold text-white">
                <span class="mr-2">{{ row.fromFlag }}</span>{{ row.label }}
                <span
                  v-if="getDaysAvailableForRow(row) > 0 && getDaysAvailableForRow(row) < 7"
                  class="ml-2 rounded border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-label text-amber-300"
                >
                  Insufficient data
                </span>
              </div>
              <div class="text-body-sm mt-1 flex flex-wrap items-center gap-2 text-neutral-400">
                <span v-if="row.bestProvider">Best: {{ row.bestProvider }}</span>
                <span v-else>Best: —</span>
                <span class="text-neutral-700">|</span>
                <span>Gets: {{ formatRecipientGets(row.bestRecipientGets, row.destCurrency) }}</span>
                <span
v-if="row.corridorId === selectedCorridorId"
class="text-brand-400"
>
                  Loaded below
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="pinnedCorridorIds"
                type="button"
                class="inline-flex items-center justify-center rounded-lg p-1 text-neutral-500 transition-colors hover:text-brand-400 focus-ring-dark"
                :class="pinnedSet.has(row.corridorId) ? 'text-brand-400' : ''"
                :title="pinnedSet.has(row.corridorId) ? 'Unpin corridor' : 'Pin corridor'"
                @click="handlePinToggle($event, row)"
              >
                <Icon
name="bookmark"
:size="14"
/>
              </button>
              <span
                class="inline-flex items-center rounded-lg px-2.5 py-1 text-label"
                :class="levelClass(row.smartSendLevel)"
              >
                {{ levelLabel(row.smartSendLevel) }}
              </span>
              <span
                v-if="row.moverDeltaPct24h !== null"
                class="inline-flex items-center rounded-lg px-2.5 py-1 text-label text-mono-value font-mono"
                :class="moverClass(row.moverDeltaPct24h)"
                :title="
                  getDaysAvailableForRow(row) < 30
                    ? `Based on limited data (${getDaysAvailableForRow(row)} days). Trends become reliable after 30+ days.`
                    : row.moverTimestampBucket
                      ? `Bucket: ${row.moverTimestampBucket}`
                      : ''
                "
              >
                {{ formatPct(row.moverDeltaPct24h) }}
                <span
                  v-if="getDaysAvailableForRow(row) > 0 && getDaysAvailableForRow(row) < 30"
                  class="ml-1 text-body-sm font-normal text-neutral-500"
                >
                  (preliminary)
                </span>
              </span>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-1">
            <button
              v-for="tf in TIMEFRAMES"
              :key="tf"
              type="button"
              class="rounded px-2 py-1 text-label transition-colors focus-ring-dark"
              :class="
                isTimeframeAvailable(getDaysAvailableForRow(row), tf)
                  ? row.corridorId === selectedCorridorId && selectedTimeframe === tf
                    ? 'bg-brand-600 text-white'
                    : 'text-neutral-400 hover:bg-white/[0.06] hover:text-white'
                  : 'cursor-not-allowed text-neutral-600 opacity-50'
              "
              :disabled="!isTimeframeAvailable(getDaysAvailableForRow(row), tf)"
              @click="handleTimeframeClick(row, tf)"
            >
              {{ tf }}
            </button>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div>
              <div class="text-label font-mono text-neutral-600">
                Spread (bps)
              </div>
              <div class="text-body-sm mt-0.5 font-mono font-bold text-mono-value text-white">
                {{ row.spreadRangeBps === null ? '—' : formatNumber(row.spreadRangeBps) }}
              </div>
            </div>
            <div>
              <div class="text-label font-mono text-neutral-600">
                Providers
              </div>
              <div class="text-body-sm mt-0.5 font-mono font-bold text-mono-value text-white">
                {{ row.providerCount === null ? '—' : row.providerCount }}
              </div>
            </div>
            <div>
              <div class="text-label font-mono text-neutral-600">
                Bank gap
              </div>
              <div class="text-body-sm mt-0.5 font-mono font-bold text-mono-value text-white">
                {{
                  row.bankSavingsPercent === null
                    ? '—'
                    : `${(row.bankSavingsPercent * 100).toFixed(1)}%`
                }}
              </div>
            </div>
            <div>
              <div class="text-label font-mono text-neutral-600">
                Stress
              </div>
              <div class="mt-0.5">
                <CorridorStressBadge
                  v-if="row.stressLevel && row.stressLevel !== 'normal'"
                  :level="row.stressLevel"
                  :score="row.stressScore"
                  compact
                />
                <span
v-else
class="text-body-sm font-mono font-bold text-mono-value text-white"
>—</span>
              </div>
            </div>
            <div>
              <div class="text-label font-mono text-neutral-600">
                Updated
              </div>
              <div class="text-body-sm mt-0.5 font-mono font-bold text-mono-value text-white">
                {{
                  row.updatedAt
                    ? formatUpdatedLabel(row.updatedAt)
                    : row.dataAvailable
                      ? '—'
                      : 'No data'
                }}
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>
