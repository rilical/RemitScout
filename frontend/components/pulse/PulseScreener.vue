<script setup lang="ts">
import { computed } from 'vue'
import type { PulseScreenerRow } from '~/types/pulse'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'
import { formatUpdatedLabel } from '~/shared/lib/format'

const props = defineProps<{
  rows: PulseScreenerRow[]
  loading?: boolean
  error?: string | null
  selectedCorridorId?: string | null
}>()

const emit = defineEmits<{
  (e: 'select', corridorId: string): void
}>()

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
      return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
  }
}

const moverClass = (delta: number | null) => {
  if (delta === null) return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
  if (delta > 0) return 'bg-success-600/15 text-success-400 border border-success-600/30'
  if (delta < 0) return 'bg-danger-600/15 text-danger-400 border border-danger-600/30'
  return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
}

const handleSelect = (row: PulseScreenerRow) => {
  if (!row.dataAvailable) return
  emit('select', row.corridorId)
}
</script>

<template>
  <section class="rounded-2xl border border-neutral-700 bg-neutral-800 shadow-lg overflow-hidden">
    <div class="border-b border-neutral-700 px-6 py-5">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-body-lg font-bold text-white">
            Your Watchlist Screener
          </h2>
          <p class="text-body-sm text-neutral-400">
            Smart Send, best provider, spread risk, and freshness for your corridors.
          </p>
        </div>
        <div class="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
          $1000 • bank→bank • 7D • Gold cache
        </div>
      </div>
    </div>

    <div class="p-4 sm:p-6">
      <div
        v-if="error"
        class="rounded-xl border border-danger-600/40 bg-danger-600/10 p-4 text-body-sm text-danger-200"
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
          class="rounded-xl border border-neutral-700 bg-neutral-900/30 p-4"
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
        class="rounded-xl border border-neutral-700 bg-neutral-900/30 p-6 text-body-sm text-neutral-300"
      >
        Add corridors to your watchlist to see a ranked screener here.
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <button
          v-for="row in rows"
          :key="row.corridorId"
          type="button"
          class="w-full rounded-xl border bg-neutral-900/30 p-4 text-left transition hover:border-brand-600/60 hover:bg-neutral-900/50 disabled:opacity-60 disabled:cursor-not-allowed"
          :class="[
            row.corridorId === selectedCorridorId ? 'border-brand-600/70 ring-1 ring-brand-600/40' : 'border-neutral-700',
          ]"
          :disabled="!row.dataAvailable"
          @click="handleSelect(row)"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div class="text-body-sm font-semibold text-white">
                <span class="mr-2">{{ row.fromFlag }}</span>{{ row.label }}
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-2 text-body-sm text-neutral-400">
                <template v-if="row.corridorId === selectedCorridorId">
                  <span v-if="row.bestProvider">Best: {{ row.bestProvider }}</span>
                  <span v-else>Best: —</span>
                  <span class="text-neutral-700">|</span>
                  <span>Gets: {{ formatRecipientGets(row.bestRecipientGets, row.destCurrency) }}</span>
                </template>
                <template v-else>
                  <span>Best provider: select to view</span>
                </template>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold"
                :class="levelClass(row.smartSendLevel)"
              >
                {{ levelLabel(row.smartSendLevel) }}
              </span>
              <span
                v-if="row.moverDeltaPct24h !== null"
                class="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold"
                :class="moverClass(row.moverDeltaPct24h)"
                :title="row.moverTimestampBucket ? `Bucket: ${row.moverTimestampBucket}` : ''"
              >
                {{ formatPct(row.moverDeltaPct24h) }}
              </span>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div class="text-[10px] font-mono uppercase tracking-wider text-neutral-600">
                Spread (bps)
              </div>
              <div class="mt-0.5 text-body-sm font-mono font-bold text-white">
                {{ row.spreadRangeBps === null ? '—' : formatNumber(row.spreadRangeBps) }}
              </div>
            </div>
            <div>
              <div class="text-[10px] font-mono uppercase tracking-wider text-neutral-600">
                Providers
              </div>
              <div class="mt-0.5 text-body-sm font-mono font-bold text-white">
                {{ row.providerCount === null ? '—' : row.providerCount }}
              </div>
            </div>
            <div>
              <div class="text-[10px] font-mono uppercase tracking-wider text-neutral-600">
                Bank gap
              </div>
              <div class="mt-0.5 text-body-sm font-mono font-bold text-white">
                {{ row.bankSavingsPercent === null ? '—' : `${(row.bankSavingsPercent * 100).toFixed(1)}%` }}
              </div>
            </div>
            <div>
              <div class="text-[10px] font-mono uppercase tracking-wider text-neutral-600">
                Updated
              </div>
              <div class="mt-0.5 text-body-sm font-mono font-bold text-white">
                {{ row.updatedAt ? formatUpdatedLabel(row.updatedAt) : (row.dataAvailable ? '—' : 'No data') }}
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>
