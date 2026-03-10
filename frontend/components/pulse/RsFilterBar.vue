<script setup lang="ts">
import { computed } from 'vue'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import { isTimeframeAvailable } from '~/composables/usePulseTimeframes'
import type { PulseTimeframe } from '~/stores/pulse'
import type { CorridorOption } from '~/types/pulse'
import { getCountryByCode } from '~/utils/countries-currencies'

interface Props {
  corridors: CorridorOption[]
  selectedCorridor: CorridorOption | null
  amounts: readonly number[]
  selectedAmount: number
  timeframes: readonly string[]
  selectedTimeframe: string
  daysAvailable?: number
  variant?: 'terminal' | 'consumer'
  sticky?: boolean
  lastUpdated?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'terminal',
  sticky: true,
  daysAvailable: undefined,
  lastUpdated: null,
})

const emit = defineEmits<{
  'update:corridor': [corridor: CorridorOption | null]
  'update:amount': [amount: number]
  'update:timeframe': [timeframe: string]
}>()

const isTerminal = computed(() => props.variant === 'terminal')

const barClass = computed(() => {
  if (!props.sticky) return ''

  const base = 'sticky top-0 z-40'
  const theme = isTerminal.value
    ? 'border-b border-neutral-700/50 bg-neutral-900'
    : 'border-b border-neutral-200 bg-neutral-50/95 backdrop-blur'
  return [base, theme].filter(Boolean).join(' ')
})

const selectedFromCountry = computed(() => props.selectedCorridor?.sourceCountry ?? '')
const selectedToCountry = computed(() => props.selectedCorridor?.destCountry ?? '')

const fixedProfileLabel = computed(() => {
  const amount = props.selectedAmount || props.amounts[0] || 500
  return `$${amount} USD sent · bank deposit`
})

const countryName = (countryCode: string) => getCountryByCode(countryCode)?.name ?? countryCode

const sortCountryCodes = (codes: string[]) =>
  [...new Set(codes.filter(Boolean))]
    .sort((left, right) => countryName(left).localeCompare(countryName(right)))

const sourceCountryCodes = computed(() =>
  sortCountryCodes(
    props.corridors
      .map(corridor => corridor.sourceCountry ?? '')
      .filter(Boolean),
  ),
)

const destinationCountryCodesForSource = (sourceCountry: string) =>
  sortCountryCodes(
    props.corridors
      .filter(corridor => corridor.sourceCountry === sourceCountry)
      .map(corridor => corridor.destCountry ?? '')
      .filter(Boolean),
  )

const destinationCountryCodes = computed(() => {
  if (!selectedFromCountry.value) return []
  return destinationCountryCodesForSource(selectedFromCountry.value)
})

const timeframeButtonClass = (timeframe: string) => {
  const available = props.daysAvailable !== undefined
    ? isTimeframeAvailable(props.daysAvailable, timeframe as PulseTimeframe)
    : true

  const base = 'rounded-full px-3 py-1.5 text-body-sm font-medium transition-colors'

  if (!available) {
    return isTerminal.value
      ? `${base} cursor-not-allowed bg-neutral-800 text-neutral-600 opacity-40`
      : `${base} cursor-not-allowed bg-white/10 text-white/35 opacity-70`
  }

  if (timeframe === props.selectedTimeframe) {
    return `${base} bg-brand-600 text-white`
  }

  if (isTerminal.value) {
    return `${base} bg-neutral-800 text-neutral-300 hover:bg-neutral-700`
  }

  return `${base} bg-white/10 text-white/75 hover:bg-white/20`
}

const lastUpdatedText = computed(() => {
  if (!props.lastUpdated) return null

  const now = Date.now()
  const then = new Date(props.lastUpdated).getTime()
  const diffMs = now - then
  if (Number.isNaN(diffMs) || diffMs < 0) return 'Updated just now'

  const diffSeconds = Math.floor(diffMs / 1000)
  if (diffSeconds < 60) return 'Updated just now'

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Updated ${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `Updated ${diffDays}d ago`
})

const findCorridor = (sourceCountry: string, destCountry: string) =>
  props.corridors.find(corridor =>
    corridor.sourceCountry === sourceCountry && corridor.destCountry === destCountry,
  ) ?? null

function handleFromCountryChange(sourceCountry: string) {
  if (!sourceCountry) {
    emit('update:corridor', null)
    return
  }

  const allowedDestinations = destinationCountryCodesForSource(sourceCountry)
  const preferredDestination = selectedToCountry.value && allowedDestinations.includes(selectedToCountry.value)
    ? selectedToCountry.value
    : allowedDestinations[0] ?? ''

  emit('update:corridor', findCorridor(sourceCountry, preferredDestination))
}

function handleToCountryChange(destCountry: string) {
  if (!selectedFromCountry.value || !destCountry) {
    emit('update:corridor', null)
    return
  }

  emit('update:corridor', findCorridor(selectedFromCountry.value, destCountry))
}

function isTimeframeDisabled(timeframe: string): boolean {
  if (props.daysAvailable === undefined) return false
  return !isTimeframeAvailable(props.daysAvailable, timeframe as PulseTimeframe)
}

function onTimeframeClick(timeframe: string) {
  if (!isTimeframeDisabled(timeframe)) {
    emit('update:timeframe', timeframe)
  }
}
</script>

<template>
  <div :class="barClass">
    <div class="mx-auto max-w-page px-page-x py-4 lg:py-5">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_280px] lg:items-stretch">
        <div class="rounded-2xl bg-neutral-900 px-6 py-6 text-white shadow-lg shadow-brand-950/15">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Supported bank corridors
          </p>
          <h2 class="mt-3 text-h3 font-bold text-white">
            Choose a corridor we track
          </h2>
          <p class="mt-3 max-w-2xl text-body leading-relaxed text-white/78">
            Pick where you send from and where the money should arrive. Pulse focuses on published bank-transfer corridors, so every view reflects routes we actively track and update.
          </p>
        </div>

        <div class="rounded-2xl bg-neutral-900 px-5 py-5 text-white shadow-lg shadow-brand-950/15">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Benchmark profile
          </p>
          <p class="mt-2 text-body font-semibold text-white">
            {{ fixedProfileLabel }}
          </p>
          <p class="mt-2 text-body-sm leading-relaxed text-white/70">
            Compare every corridor using the same transfer setup, so price and coverage trends stay like-for-like.
          </p>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <div
              v-if="timeframes.length > 0"
              class="flex items-center gap-1"
              role="group"
              aria-label="Timeframe"
            >
              <button
                v-for="timeframe in timeframes"
                :key="timeframe"
                type="button"
                :class="timeframeButtonClass(timeframe)"
                :disabled="isTimeframeDisabled(timeframe)"
                :aria-pressed="timeframe === selectedTimeframe"
                @click="onTimeframeClick(timeframe)"
              >
                {{ timeframe }}
              </button>
            </div>

            <span
              v-if="lastUpdatedText"
              class="text-xs font-medium text-white/60"
              aria-live="polite"
            >
              {{ lastUpdatedText }}
            </span>
          </div>
        </div>
      </div>

      <div class="mt-4 grid gap-4 lg:grid-cols-2 lg:items-end">
        <div>
          <label
            for="pulse-from-country"
            class="mb-1.5 block text-body-sm font-semibold uppercase tracking-wide text-white/80"
          >
            Sending from
          </label>
          <CountrySelect
            id="pulse-from-country"
            :model-value="selectedFromCountry"
            label="Sending from"
            placeholder="Select country"
            :exclude-country="selectedToCountry"
            :allowed-codes="sourceCountryCodes"
            select-class="border-white/20 bg-white text-neutral-900 focus:border-white focus:ring-white/60"
            @update:model-value="handleFromCountryChange"
          />
        </div>

        <div>
          <label
            for="pulse-to-country"
            class="mb-1.5 block text-body-sm font-semibold uppercase tracking-wide text-white/80"
          >
            Receiving in
          </label>
          <CountrySelect
            id="pulse-to-country"
            :model-value="selectedToCountry"
            label="Receiving in"
            placeholder="Select country"
            :exclude-country="selectedFromCountry"
            :allowed-codes="destinationCountryCodes"
            :disabled="!selectedFromCountry"
            select-class="border-white/20 bg-white text-neutral-900 focus:border-white focus:ring-white/60 disabled:border-white/10 disabled:bg-white/70"
            @update:model-value="handleToCountryChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>
