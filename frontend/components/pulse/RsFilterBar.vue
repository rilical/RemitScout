<script setup lang="ts">
import { computed } from 'vue'
import { isTimeframeAvailable } from '~/composables/usePulseTimeframes'
import type { PulseTimeframe } from '~/stores/pulse'

interface CorridorOption {
  slug: string
  label: string
  fromFlag?: string
  toFlag?: string
  sufficient?: boolean
  daysAvailable?: number
  isUsdOrigin?: boolean
  unsuppressedPoints?: number
}

interface Props {
  corridors: CorridorOption[]
  selectedCorridor: CorridorOption | null
  amounts: number[]
  selectedAmount: number
  timeframes: string[]
  selectedTimeframe: string
  daysAvailable?: number
  variant?: 'terminal' | 'consumer'
  sticky?: boolean
  lastUpdated?: string | null
  showMethodFilters?: boolean
  fundingMethods?: string[]
  selectedFundingMethod?: string
  payoutMethods?: string[]
  selectedPayoutMethod?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'terminal',
  sticky: true,
  daysAvailable: undefined,
  lastUpdated: null,
  showMethodFilters: false,
  fundingMethods: () => ['bank', 'card', 'cash'],
  selectedFundingMethod: 'bank',
  payoutMethods: () => ['bank', 'cash', 'wallet'],
  selectedPayoutMethod: 'bank',
})

const emit = defineEmits<{
  'update:corridor': [corridor: CorridorOption | null]
  'update:amount': [amount: number]
  'update:timeframe': [timeframe: string]
  'update:fundingMethod': [method: string]
  'update:payoutMethod': [method: string]
}>()

const isTerminal = computed(() => props.variant === 'terminal')

const barClass = computed(() => {
  const base = props.sticky ? 'sticky top-0 z-40' : ''
  const theme = isTerminal.value
    ? 'bg-neutral-900 border-b border-neutral-700/50'
    : 'bg-white border-b border-neutral-200 shadow-sm'
  return [base, theme].filter(Boolean).join(' ')
})

const selectedCorridorSlug = computed(() => props.selectedCorridor?.slug ?? '')

function onCorridorChange(event: Event) {
  const slug = (event.target as HTMLSelectElement).value
  if (!slug) {
    emit('update:corridor', null)
    return
  }
  const found = props.corridors.find(c => c.slug === slug) ?? null
  emit('update:corridor', found)
}

function corridorDotClass(corridor: CorridorOption): string {
  if (corridor.sufficient === false) {
    return 'w-2 h-2 rounded-full bg-neutral-500 flex-shrink-0'
  }
  const days = corridor.daysAvailable ?? 0
  if (corridor.sufficient === true && days >= 7) {
    return 'w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0'
  }
  return 'w-2 h-2 rounded-full bg-amber-400 flex-shrink-0'
}

function corridorDotTitle(corridor: CorridorOption): string | undefined {
  if (corridor.sufficient === false) return 'Insufficient data'
  const days = corridor.daysAvailable ?? 0
  if (corridor.sufficient === true && days < 7) return 'Warming up'
  return undefined
}

function formatAmount(amount: number): string {
  if (amount >= 1000) return `${amount / 1000}K`
  return String(amount)
}

function amountButtonClass(amount: number): string {
  const base = 'px-3 py-1.5 rounded-full text-body-sm font-medium transition-colors'
  if (amount === props.selectedAmount) {
    return `${base} bg-brand-600 text-white`
  }
  if (isTerminal.value) {
    return `${base} bg-neutral-800 text-neutral-400 hover:bg-neutral-700`
  }
  return `${base} bg-neutral-100 text-neutral-600 hover:bg-neutral-200`
}

function timeframeButtonClass(tf: string): string {
  const available = props.daysAvailable !== undefined
    ? isTimeframeAvailable(props.daysAvailable, tf as PulseTimeframe)
    : true

  const base = 'px-3 py-1.5 rounded-full text-body-sm font-medium transition-colors'

  if (!available) {
    return isTerminal.value
      ? `${base} bg-neutral-800 text-neutral-600 cursor-not-allowed opacity-40`
      : `${base} bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-40`
  }

  if (tf === props.selectedTimeframe) {
    return `${base} bg-brand-600 text-white`
  }

  if (isTerminal.value) {
    return `${base} bg-neutral-800 text-neutral-400 hover:bg-neutral-700`
  }
  return `${base} bg-neutral-100 text-neutral-600 hover:bg-neutral-200`
}

function isTimeframeDisabled(tf: string): boolean {
  if (props.daysAvailable === undefined) return false
  return !isTimeframeAvailable(props.daysAvailable, tf as PulseTimeframe)
}

function onTimeframeClick(tf: string) {
  if (!isTimeframeDisabled(tf)) {
    emit('update:timeframe', tf)
  }
}

const selectClass = computed(() => {
  if (isTerminal.value) {
    return 'h-9 rounded-lg border border-neutral-600 bg-neutral-800 pl-3 pr-8 text-body-sm text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 appearance-none cursor-pointer'
  }
  return 'h-9 rounded-lg border border-neutral-300 bg-white pl-3 pr-8 text-body-sm text-neutral-700 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 appearance-none cursor-pointer'
})

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

function formatMethodLabel(method: string, prefix: string): string {
  return `${prefix}: ${method.charAt(0).toUpperCase()}${method.slice(1)}`
}
</script>

<template>
  <div :class="barClass">
    <div class="flex items-center gap-3 px-4 py-3 flex-wrap">
      <!-- Corridor selector (left) -->
      <div class="relative flex-shrink-0">
        <label class="sr-only">Corridor</label>
        <select
          :value="selectedCorridorSlug"
          :class="[selectClass, 'min-w-[200px]']"
          @change="onCorridorChange"
        >
          <option value="">
            All Corridors
          </option>
          <option
            v-for="corridor in corridors"
            :key="corridor.slug"
            :value="corridor.slug"
            :class="isTerminal ? 'bg-neutral-800' : 'bg-white'"
          >
            {{ corridor.fromFlag ? `${corridor.fromFlag} ` : '' }}{{ corridor.toFlag ? `→ ${corridor.toFlag} ` : '' }}{{ corridor.label }}
          </option>
        </select>
        <!-- Corridor data quality dots (shown alongside selected corridor) -->
        <div
          v-if="selectedCorridor"
          class="pointer-events-none absolute inset-y-0 left-2 flex items-center"
        >
          <span
            :class="corridorDotClass(selectedCorridor)"
            :title="corridorDotTitle(selectedCorridor)"
            aria-hidden="true"
          />
        </div>
      </div>

      <!-- Divider -->
      <div
        class="h-6 w-px flex-shrink-0"
        :class="isTerminal ? 'bg-neutral-700' : 'bg-neutral-200'"
        aria-hidden="true"
      />

      <!-- Amount buttons (center) -->
      <div
        class="flex items-center gap-1"
        role="group"
        aria-label="Transfer amount"
      >
        <button
          v-for="amount in amounts"
          :key="amount"
          type="button"
          :class="amountButtonClass(amount)"
          :aria-pressed="amount === selectedAmount"
          @click="emit('update:amount', amount)"
        >
          {{ formatAmount(amount) }}
        </button>
      </div>

      <!-- Timeframe buttons (center-right) — hidden when showMethodFilters is false -->
      <template v-if="showMethodFilters !== false || timeframes.length > 0">
        <div
          v-if="showMethodFilters || timeframes.length > 0"
          class="h-6 w-px flex-shrink-0"
          :class="isTerminal ? 'bg-neutral-700' : 'bg-neutral-200'"
          aria-hidden="true"
        />

        <div
          v-if="showMethodFilters"
          class="flex items-center gap-1"
          role="group"
          aria-label="Timeframe"
        >
          <button
            v-for="tf in timeframes"
            :key="tf"
            type="button"
            :class="timeframeButtonClass(tf)"
            :disabled="isTimeframeDisabled(tf)"
            :aria-pressed="tf === selectedTimeframe"
            @click="onTimeframeClick(tf)"
          >
            {{ tf }}
          </button>
        </div>
      </template>

      <!-- Method selectors (right, Enterprise only) -->
      <template v-if="showMethodFilters">
        <div
          class="h-6 w-px flex-shrink-0"
          :class="isTerminal ? 'bg-neutral-700' : 'bg-neutral-200'"
          aria-hidden="true"
        />

        <div class="flex items-center gap-2">
          <!-- Fund via -->
          <div class="relative flex-shrink-0">
            <label class="sr-only">Funding method</label>
            <select
              :value="selectedFundingMethod"
              :class="selectClass"
              @change="emit('update:fundingMethod', ($event.target as HTMLSelectElement).value)"
            >
              <option
                v-for="method in fundingMethods"
                :key="method"
                :value="method"
                :class="isTerminal ? 'bg-neutral-800' : 'bg-white'"
              >
                {{ formatMethodLabel(method, 'Fund') }}
              </option>
            </select>
          </div>

          <!-- Pay out -->
          <div class="relative flex-shrink-0">
            <label class="sr-only">Payout method</label>
            <select
              :value="selectedPayoutMethod"
              :class="selectClass"
              @change="emit('update:payoutMethod', ($event.target as HTMLSelectElement).value)"
            >
              <option
                v-for="method in payoutMethods"
                :key="method"
                :value="method"
                :class="isTerminal ? 'bg-neutral-800' : 'bg-white'"
              >
                {{ formatMethodLabel(method, 'Pay') }}
              </option>
            </select>
          </div>
        </div>
      </template>

      <!-- Spacer pushes last-updated to far right -->
      <div class="flex-1" />

      <!-- Last updated (far right) -->
      <span
        v-if="lastUpdatedText"
        class="text-xs text-neutral-500 flex-shrink-0"
        aria-live="polite"
      >
        {{ lastUpdatedText }}
      </span>
    </div>
  </div>
</template>
