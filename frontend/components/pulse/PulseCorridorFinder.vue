<template>
  <section
    class="overflow-hidden rounded-[28px] border border-neutral-700/80 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(145deg,_rgba(23,23,23,0.98),_rgba(10,10,10,0.96))] shadow-[0_24px_80px_-32px_rgba(15,23,42,0.9)]"
  >
    <div class="border-b border-neutral-700/70 px-6 py-5">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-2">
          <span
            class="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-200"
          >
            Gold Corridor Navigator
          </span>
          <div>
            <h2 class="font-mono text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
              Search supported corridors without leaving Pulse
            </h2>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-neutral-300">
              Search by country, currency, or corridor id. Results come from the corridors we
              currently support in Gold, so users only land on routes with actual tracked coverage.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 text-[11px] font-medium text-neutral-300">
          <span class="rounded-full border border-neutral-700 bg-neutral-900/70 px-3 py-1.5">
            {{ corridorCountLabel }}
          </span>
          <span class="rounded-full border border-neutral-700 bg-neutral-900/70 px-3 py-1.5">
            {{ currentFreshnessLabel }}
          </span>
          <span class="rounded-full border border-neutral-700 bg-neutral-900/70 px-3 py-1.5">
            {{ currentCadenceLabel }}
          </span>
          <span class="rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1.5">
            Standard Gold benchmark {{ goldBenchmarkLabel }}
          </span>
        </div>
      </div>
    </div>

    <div class="grid gap-6 px-6 py-6 xl:grid-cols-[1.06fr,0.94fr]">
      <div class="space-y-5">
        <div
          class="rounded-[24px] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        >
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="min-w-0">
              <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Current corridor
              </div>
              <div class="mt-3 flex items-center gap-3">
                <span class="text-4xl leading-none">{{ currentCorridor?.fromFlag || '🌍' }}</span>
                <Icon
name="arrow-right"
:size="20"
class="text-neutral-500"
/>
                <span class="text-4xl leading-none">{{ currentCorridor?.toFlag || '🌍' }}</span>
                <div class="min-w-0">
                  <div class="truncate font-mono text-xl font-semibold text-white">
                    {{ currentCorridor?.label || 'Choose a corridor' }}
                  </div>
                  <div class="mt-1 truncate text-sm text-neutral-400">
                    {{ currentRouteLabel }}
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <span
                v-if="currentCorridor?.dataTier"
                class="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-200"
              >
                {{ formatTierLabel(currentCorridor.dataTier) }}
              </span>
              <span
                v-if="currentCorridor?.collectionTier"
                class="rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-300"
              >
                {{ formatTierLabel(currentCorridor.collectionTier) }}
              </span>
            </div>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div class="border-white/8 rounded-2xl border bg-neutral-950/55 p-4">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Coverage
              </div>
              <div class="mt-2 font-mono text-xl font-semibold text-white">
                {{ currentCoverageDaysLabel }}
              </div>
              <div class="mt-1 text-xs leading-5 text-neutral-400">
                {{ currentCoverageRangeLabel }}
              </div>
            </div>

            <div class="border-white/8 rounded-2xl border bg-neutral-950/55 p-4">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Gold points
              </div>
              <div class="mt-2 font-mono text-xl font-semibold text-white">
                {{ currentDataPointsLabel }}
              </div>
              <div class="mt-1 text-xs leading-5 text-neutral-400">
                {{ currentQualityLabel }}
              </div>
            </div>

            <div class="border-white/8 rounded-2xl border bg-neutral-950/55 p-4">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Selected amount
              </div>
              <div class="mt-2 font-mono text-xl font-semibold text-white">
                {{ selectedAmountLabel }}
              </div>
              <div class="mt-1 text-xs leading-5 text-neutral-400">
                Compare and sender actions use this amount. Gold analytics stay normalized to
                {{ goldBenchmarkLabel }}.
              </div>
            </div>

            <div class="border-white/8 rounded-2xl border bg-neutral-950/55 p-4">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Freshness
              </div>
              <div class="mt-2 font-mono text-xl font-semibold text-white">
                {{ currentFreshnessShortLabel }}
              </div>
              <div class="mt-1 text-xs leading-5 text-neutral-400">
                {{ currentFreshnessHelpLabel }}
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <div class="border-white/8 rounded-[24px] border bg-neutral-950/40 p-5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Quick picks
                </div>
                <p class="mt-2 text-sm text-neutral-400">
                  Highest-coverage Gold corridors, with pinned and watchlist routes naturally
                  surfacing first.
                </p>
              </div>
              <span
                class="rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1 text-[11px] font-medium text-neutral-300"
              >
                {{ featuredLabel }}
              </span>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-for="corridor in featuredCorridorsResolved"
                :key="corridor.corridorId || corridor.value"
                type="button"
                class="group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-left text-sm transition"
                :class="corridorButtonClass(corridor)"
                @click="handleCorridorSelect(corridor)"
              >
                <span class="text-base leading-none">{{ corridor.fromFlag }}</span>
                <span class="font-semibold text-white">{{ corridor.label }}</span>
                <span class="text-xs text-neutral-400">
                  {{ formatCompactCoverage(corridor) }}
                </span>
              </button>
            </div>
          </div>

          <div class="border-white/8 rounded-[24px] border bg-neutral-950/40 p-5">
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Active controls
            </div>
            <div class="mt-4 space-y-4">
              <div>
                <div class="mb-2 text-xs font-medium text-neutral-400">Amount</div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="amount in amountOptions"
                    :key="amount"
                    type="button"
                    class="rounded-full border px-3 py-2 text-sm font-semibold transition"
                    :class="
                      amount === selectedAmount
                        ? 'border-brand-400 bg-brand-500/15 text-brand-100'
                        : 'border-neutral-700 bg-neutral-900/70 text-neutral-300 hover:border-neutral-500 hover:text-white'
                    "
                    @click="emit('select-amount', amount)"
                  >
                    {{ formatCurrency(amount) }}
                  </button>
                </div>
              </div>

              <div>
                <div class="mb-2 text-xs font-medium text-neutral-400">Timeframe</div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="timeframe in timeframes"
                    :key="timeframe"
                    type="button"
                    class="rounded-full border px-3 py-2 text-sm font-semibold transition"
                    :class="
                      isTimeframeAvailableForCurrent(timeframe)
                        ? timeframeClass(timeframe)
                        : 'cursor-not-allowed border-neutral-800 bg-neutral-950/80 text-neutral-600'
                    "
                    :disabled="!isTimeframeAvailableForCurrent(timeframe)"
                    @click="emit('select-timeframe', timeframe)"
                  >
                    {{ timeframe }}
                  </button>
                </div>
                <p class="mt-2 text-xs leading-5 text-neutral-500">
                  Timeframe choices respect the selected corridor’s available Gold history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-white/8 rounded-[24px] border bg-neutral-950/45 p-5">
        <div class="flex flex-col gap-3">
          <label
            for="pulse-corridor-search"
            class="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500"
          >
            Search Gold-supported corridors
          </label>
          <div class="relative">
            <Icon
              name="search"
              :size="20"
              class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              id="pulse-corridor-search"
              v-model="query"
              type="search"
              autocomplete="off"
              spellcheck="false"
              placeholder="USD PHP, Philippines, Mexico, US-MX-USD-MXN..."
              class="h-12 w-full rounded-2xl border border-neutral-700 bg-neutral-900/80 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
          </div>
          <div class="flex items-center justify-between text-xs text-neutral-500">
            <span>{{ queryMetaLabel }}</span>
            <button
              v-if="query"
              type="button"
              class="font-medium text-neutral-300 transition hover:text-white"
              @click="query = ''"
            >
              Clear
            </button>
          </div>
        </div>

        <div class="mt-4 space-y-3">
          <button
            v-for="corridor in visibleResults"
            :key="corridor.corridorId || corridor.value"
            type="button"
            class="w-full rounded-2xl border p-4 text-left transition"
            :class="resultCardClass(corridor)"
            @click="handleCorridorSelect(corridor)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xl leading-none">{{ corridor.fromFlag }}</span>
                  <Icon
name="arrow-right"
:size="16"
class="text-neutral-500"
/>
                  <span class="text-xl leading-none">{{ corridor.toFlag }}</span>
                  <span class="truncate font-semibold text-white">{{ corridor.label }}</span>
                </div>
                <p class="mt-2 truncate text-sm text-neutral-400">
                  {{ corridorRouteLabel(corridor) }}
                </p>
              </div>

              <span
                class="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
                :class="freshnessClass(corridor)"
              >
                {{ freshnessTone(corridor) }}
              </span>
            </div>

            <div class="mt-3 flex flex-wrap gap-2 text-[11px] text-neutral-400">
              <span class="rounded-full border border-neutral-700 bg-neutral-900/70 px-2.5 py-1">
                {{ formatCompactCoverage(corridor) }}
              </span>
              <span class="rounded-full border border-neutral-700 bg-neutral-900/70 px-2.5 py-1">
                {{ formatPointCount(corridor.dataPoints) }}
              </span>
              <span
                v-if="typeof corridor.unsuppressedPoints === 'number'"
                class="rounded-full border border-neutral-700 bg-neutral-900/70 px-2.5 py-1"
              >
                {{ formatQualityChip(corridor) }}
              </span>
            </div>
          </button>

          <div
            v-if="visibleResults.length === 0"
            class="rounded-2xl border border-dashed border-neutral-700 bg-neutral-900/40 px-4 py-6 text-sm text-neutral-400"
          >
            No Gold-supported corridors matched that search. Try a country name, currency code, or
            corridor id.
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CorridorOption } from '~/types/pulse'
import type { PulseTimeframe } from '~/stores/pulse'
import { Icon } from '~/ui'
import { getAvailableTimeframes } from '~/composables/usePulseTimeframes'
import { formatNumber, formatUpdatedLabel } from '~/shared/lib/format'
import {
  computeCorridorDaysAvailable,
  matchesCorridorSearch,
  sortCorridorsByCoverage,
} from '~/domains/pulse/application'
import { COUNTRIES } from '~/utils/countries-currencies'

const timeframes: PulseTimeframe[] = ['24H', '7D', '30D', '1Y', 'MAX']

const props = withDefaults(
  defineProps<{
    corridors: CorridorOption[]
    featuredCorridors?: CorridorOption[]
    selectedCorridorId?: string | null
    selectedTimeframe: PulseTimeframe
    selectedAmount: number
    latestUpdatedAt?: string | null
    goldBenchmarkAmount?: number
  }>(),
  {
    featuredCorridors: () => [],
    selectedCorridorId: null,
    latestUpdatedAt: null,
    goldBenchmarkAmount: 500,
  },
)

const emit = defineEmits<{
  'select-corridor': [corridorId: string]
  'select-timeframe': [timeframe: PulseTimeframe]
  'select-amount': [amount: number]
}>()

const query = ref('')

const countryNameByCode = new Map(
  COUNTRIES.map(country => [country.code.trim().toUpperCase(), country.name.trim()]),
)

const sortedCorridors = computed(() => sortCorridorsByCoverage(props.corridors))

const featuredCorridorsResolved = computed(() => {
  if (props.featuredCorridors.length > 0) return props.featuredCorridors.slice(0, 8)
  return sortedCorridors.value.slice(0, 8)
})

const currentCorridor = computed(() => {
  if (props.selectedCorridorId) {
    const matched = props.corridors.find(c => c.corridorId === props.selectedCorridorId)
    if (matched) return matched
  }
  return featuredCorridorsResolved.value[0] || sortedCorridors.value[0] || null
})

const currentDaysAvailable = computed(() => computeCorridorDaysAvailable(currentCorridor.value))

const searchableResults = computed(() => {
  const normalizedQuery = query.value.trim()
  if (!normalizedQuery) return featuredCorridorsResolved.value
  return sortedCorridors.value.filter(corridor => matchesCorridorSearch(corridor, normalizedQuery))
})

const visibleResults = computed(() => searchableResults.value.slice(0, 9))

const currentRouteLabel = computed(() => {
  const corridor = currentCorridor.value
  if (!corridor) return 'Use the search to jump to a Gold-supported route.'
  const from = countryLabel(corridor.sourceCountry) || corridor.fromCode
  const to = countryLabel(corridor.destCountry) || corridor.toCode
  return `${from} to ${to} • ${corridor.fromCode} → ${corridor.toCode}`
})

const currentCoverageDaysLabel = computed(() => {
  if (currentDaysAvailable.value <= 0) return 'Warming up'
  return `${formatNumber(currentDaysAvailable.value)}d`
})

const currentCoverageRangeLabel = computed(() => {
  const corridor = currentCorridor.value
  if (!corridor?.minDate || !corridor?.maxDate) return 'Gold history is still being collected.'
  return `${corridor.minDate} to ${corridor.maxDate}`
})

const currentDataPointsLabel = computed(() => formatPointCount(currentCorridor.value?.dataPoints))

const currentQualityLabel = computed(() => {
  const corridor = currentCorridor.value
  if (!corridor) return 'No corridor selected yet.'
  if (
    typeof corridor.unsuppressedPoints === 'number'
    && typeof corridor.dataPoints === 'number'
    && corridor.dataPoints > 0
  ) {
    const share = Math.round((corridor.unsuppressedPoints / corridor.dataPoints) * 100)
    return `${share}% directly displayable`
  }
  if (currentDaysAvailable.value > 0 && currentDaysAvailable.value < 7) {
    return 'Still warming up for longer windows'
  }
  return 'Using Gold export coverage'
})

const currentFreshnessLabel = computed(
  () =>
    `Updated ${formatUpdatedLabel(currentCorridor.value?.lastUpdated || props.latestUpdatedAt || null)}`,
)

const currentFreshnessShortLabel = computed(() => {
  const label = formatUpdatedLabel(
    currentCorridor.value?.lastUpdated || props.latestUpdatedAt || null,
  )
  return label === 'Updated —' ? '—' : label.replace(/^Updated\s+/i, '')
})

const currentFreshnessHelpLabel = computed(() => {
  const corridor = currentCorridor.value
  if (!corridor?.lastUpdated) return 'No freshness timestamp yet.'
  return freshnessTone(corridor) === 'fresh'
    ? 'Recent Gold snapshot available.'
    : 'Use this with coverage and quality to judge readiness.'
})

const currentCadenceLabel = computed(() => {
  const corridor = currentCorridor.value
  if (!corridor) return 'Cadence pending'
  const collection = corridor.collectionCadenceMinutes
  const exportCadence = corridor.exportCadenceMinutes
  if (collection && exportCadence) return `${collection}m collect • ${exportCadence}m export`
  if (collection) return `${collection}m collection cadence`
  if (exportCadence) return `${exportCadence}m export cadence`
  return 'Cadence not published'
})

const corridorCountLabel = computed(
  () => `${formatNumber(props.corridors.length)} Gold-supported corridors`,
)

const featuredLabel = computed(
  () => `${featuredCorridorsResolved.value.length} pinned / top coverage`,
)

const amountOptions = computed(() => {
  const base = [100, 200, 500, 1000, props.selectedAmount]
  return Array.from(new Set(base)).sort((a, b) => a - b)
})

const selectedAmountLabel = computed(() => formatCurrency(props.selectedAmount))

const goldBenchmarkLabel = computed(() => formatCurrency(props.goldBenchmarkAmount))

const queryMetaLabel = computed(() => {
  if (!query.value.trim()) {
    return 'Showing curated quick picks first to keep discovery fast.'
  }
  const total = searchableResults.value.length
  return `${formatNumber(total)} corridor${total === 1 ? '' : 's'} matched`
})

const availableTimeframes = computed(
  () => new Set(getAvailableTimeframes(currentDaysAvailable.value)),
)

const isTimeframeAvailableForCurrent = (timeframe: PulseTimeframe) =>
  availableTimeframes.value.has(timeframe)

const handleCorridorSelect = (corridor: CorridorOption) => {
  if (!corridor.corridorId) return
  emit('select-corridor', corridor.corridorId)
  query.value = ''
}

const corridorButtonClass = (corridor: CorridorOption) =>
  corridor.corridorId === props.selectedCorridorId
    ? 'border-brand-400 bg-brand-500/15'
    : 'border-neutral-700 bg-neutral-900/70 hover:border-neutral-500 hover:bg-neutral-900'

const timeframeClass = (timeframe: PulseTimeframe) =>
  props.selectedTimeframe === timeframe
    ? 'border-brand-400 bg-brand-500/15 text-brand-100'
    : 'border-neutral-700 bg-neutral-900/70 text-neutral-300 hover:border-neutral-500 hover:text-white'

const resultCardClass = (corridor: CorridorOption) =>
  corridor.corridorId === props.selectedCorridorId
    ? 'border-brand-400 bg-brand-500/12'
    : 'border-neutral-700 bg-neutral-900/70 hover:border-neutral-500 hover:bg-neutral-900'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)

const countryLabel = (code?: string | null) => {
  if (!code) return ''
  return countryNameByCode.get(code.trim().toUpperCase()) || code.trim().toUpperCase()
}

const formatTierLabel = (value: string) => value.replace(/_/g, ' ')

const formatCompactCoverage = (corridor: CorridorOption) => {
  const days = computeCorridorDaysAvailable(corridor)
  if (days <= 0) return 'warming up'
  return `${formatNumber(days)}d history`
}

const formatPointCount = (value?: number | null) => {
  if (typeof value !== 'number' || value <= 0) return 'No points yet'
  return `${formatNumber(value)} points`
}

const formatQualityChip = (corridor: CorridorOption) => {
  if (
    typeof corridor.unsuppressedPoints !== 'number'
    || typeof corridor.dataPoints !== 'number'
    || corridor.dataPoints <= 0
  ) {
    return 'Quality pending'
  }
  const share = Math.round((corridor.unsuppressedPoints / corridor.dataPoints) * 100)
  return `${share}% displayable`
}

const freshnessTone = (corridor: CorridorOption) => {
  if (!corridor.lastUpdated) return 'warming'
  const updatedAt = new Date(corridor.lastUpdated).getTime()
  if (Number.isNaN(updatedAt)) return 'warming'
  const ageHours = (Date.now() - updatedAt) / (1000 * 60 * 60)
  if (ageHours <= 24) return 'fresh'
  if (ageHours <= 24 * 7) return 'recent'
  return 'warming'
}

const freshnessClass = (corridor: CorridorOption) => {
  const tone = freshnessTone(corridor)
  if (tone === 'fresh') return 'border-emerald-500/30 bg-emerald-500/12 text-emerald-200'
  if (tone === 'recent') return 'border-amber-500/30 bg-amber-500/12 text-amber-200'
  return 'border-neutral-700 bg-neutral-900/70 text-neutral-300'
}

const corridorRouteLabel = (corridor: CorridorOption) => {
  const from = countryLabel(corridor.sourceCountry) || corridor.fromCode
  const to = countryLabel(corridor.destCountry) || corridor.toCode
  return `${from} to ${to} • ${corridor.fromCode} → ${corridor.toCode}`
}
</script>
