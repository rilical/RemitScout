<template>
  <div
    class="rounded-xl border-2 overflow-hidden"
    :class="[
      compact ? '' : 'shadow-sm',
      darkBackground
        ? isBest
          ? 'border-white/30 bg-white/10'
          : 'border-white/20 bg-white/5'
        : isBest 
          ? 'border-brand-600 bg-brand-50/20'
          : 'border-neutral-200 bg-neutral-50'
    ]"
  >
    <!-- Header -->
    <div
      v-if="!compact"
      class="flex items-center justify-between border-b border-neutral-200 px-4 py-3 bg-gradient-to-r from-neutral-50 to-white"
    >
      <div class="flex items-center gap-2">
        <svg class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span class="text-sm font-bold text-neutral-900 uppercase tracking-wide">True Cost Breakdown</span>
      </div>
      <button
        type="button"
        class="group flex items-center gap-1 text-xs text-neutral-500 hover:text-brand-600 transition-colors"
        @click="showTooltip = !showTooltip"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>What's this?</span>
      </button>
    </div>

    <!-- Tooltip -->
    <div
      v-if="showTooltip && !compact"
      class="border-b border-neutral-200 bg-blue-50 px-4 py-3 text-xs text-blue-800"
    >
      <p class="mb-1 font-semibold">Hidden Exchange Rate Markup</p>
      <p class="leading-relaxed">
        Providers often offer a worse exchange rate than the real "mid-market" rate banks use between themselves.
        This difference is a hidden fee that costs you money. We calculate it by comparing the provider's rate to the current mid-market rate.
      </p>
      <button
        type="button"
        class="mt-2 text-blue-600 hover:underline font-medium"
        @click="showTooltip = false"
      >
        Got it
      </button>
    </div>

    <!-- Cost Breakdown -->
    <div :class="compact ? 'p-4' : 'p-4'">
      <!-- Upfront Fee Row -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span :class="['font-medium text-sm', darkBackground ? 'text-white' : 'text-neutral-900']">
              Upfront Fee
            </span>
            <span v-if="hasPromo && promoInfo" :class="[
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold',
              darkBackground ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' : 'bg-emerald-100 text-emerald-700'
            ]">
              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              PROMO
            </span>
          </div>
          <div :class="['text-[10px]', darkBackground ? 'text-white/60' : 'text-neutral-500']">
            {{ hasPromo && promoInfo ? 'Promotional pricing applied' : 'What they charge you directly' }}
          </div>
        </div>
        <span
          :class="['font-bold', darkBackground ? 'text-white' : 'text-neutral-900', compact ? 'text-base' : 'text-sm']"
        >
          {{ formatCurrency(upfrontFee) }}
        </span>
      </div>

      <!-- Hidden Markup Row -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex-1">
          <div :class="['font-medium text-sm mb-0.5', darkBackground ? 'text-white' : 'text-neutral-900']">
            Hidden FX Markup
          </div>
          <div :class="['text-[10px]', darkBackground ? 'text-white/60' : 'text-neutral-500']">
            Money they make from worse exchange rates
          </div>
        </div>
        <span
          :class="['font-bold', darkBackground ? 'text-white' : 'text-neutral-900', compact ? 'text-base' : 'text-sm']"
        >
          {{ formatCurrency(hiddenMarkup) }}
        </span>
      </div>

      <!-- Divider -->
      <div :class="['border-t border-dashed my-3', darkBackground ? 'border-white/20' : 'border-neutral-300']" />

      <!-- Total Cost Row -->
      <div class="flex items-center justify-between mb-4">
        <span
          :class="['font-bold uppercase tracking-wide', darkBackground ? 'text-white' : 'text-neutral-900', compact ? 'text-sm' : 'text-sm']"
        >
          Total Cost
        </span>
        <span
          :class="['font-bold', darkBackground ? 'text-white' : 'text-neutral-900', compact ? 'text-xl' : 'text-lg']"
        >
          {{ formatCurrency(totalCost) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getCostSeverity, getMarkupSeverity } from '~/lib/trueCostCalculator'

interface Props {
  upfrontFee: number
  hiddenMarkup: number
  totalCost: number
  totalCostPercent: number
  spreadBps: number
  amount: number
  compact?: boolean
  isBest?: boolean
  averageCost?: number
  worstCost?: number
  bestCost?: number
  currencyCode?: string
  hasPromo?: boolean
  promoInfo?: {
    fee: number
    rate: number
    newCustomersOnly: boolean
  } | null
}

const props = withDefaults(defineProps<Props & { darkBackground?: boolean }>(), {
  compact: false,
  isBest: false,
  averageCost: 0,
  worstCost: 0,
  bestCost: 0,
  currencyCode: 'USD',
  hasPromo: false,
  promoInfo: null,
  darkBackground: false,
})

const showTooltip = ref(false)

const feePercent = computed(() => {
  if (props.totalCost === 0) return 0
  return (props.upfrontFee / props.totalCost) * 100
})

const markupPercent = computed(() => {
  if (props.totalCost === 0) return 0
  return (props.hiddenMarkup / props.totalCost) * 100
})

const feeBarWidth = computed(() => {
  const maxCostPercent = 5
  const ratio = props.totalCostPercent / maxCostPercent
  return Math.min(ratio * feePercent.value, 100)
})

const markupBarWidth = computed(() => {
  const maxCostPercent = 5
  const ratio = props.totalCostPercent / maxCostPercent
  return Math.min(ratio * markupPercent.value, 100 - feeBarWidth.value)
})

const costSeverity = computed(() => getCostSeverity(props.totalCostPercent))

const markupSeverity = computed(() => getMarkupSeverity(props.spreadBps))

const costSeverityTextClass = computed(() => {
  const classes: Record<string, string> = {
    low: 'text-emerald-600',
    medium: 'text-amber-600',
    high: 'text-orange-600',
    extreme: 'text-rose-600',
  }
  return classes[costSeverity.value]
})

const markupSeverityClass = computed(() => {
  const classes: Record<string, string> = {
    excellent: 'bg-emerald-500',
    good: 'bg-amber-400',
    fair: 'bg-orange-500',
    poor: 'bg-rose-500',
  }
  return classes[markupSeverity.value]
})

const markupBadgeClass = computed(() => {
  const classes: Record<string, string> = {
    excellent: 'bg-emerald-100 text-emerald-700',
    good: 'bg-amber-100 text-amber-700',
    fair: 'bg-orange-100 text-orange-700',
    poor: 'bg-rose-100 text-rose-700',
  }
  return classes[markupSeverity.value]
})

function formatCurrency(value: number): string {
  const currency = props.currencyCode || 'USD'
  if (currency === 'USD') {
    return `$${Math.abs(value).toFixed(2)}`
  }
  // For other currencies, use basic formatting
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value))
}
</script>




