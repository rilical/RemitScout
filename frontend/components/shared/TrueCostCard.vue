<template>
  <div
    class="rounded-xl border overflow-hidden"
    :class="compact ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-200 bg-white shadow-sm'"
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
        <div class="flex items-center gap-2">
          <span
            class="h-2.5 w-2.5 rounded-sm bg-brand-600"
            :class="compact ? '' : ''"
          />
          <span
            class="font-medium text-neutral-700"
            :class="compact ? 'text-sm' : 'text-sm'"
          >
            Upfront Fee
          </span>
        </div>
        <span
          class="font-bold text-neutral-900"
          :class="compact ? 'text-base' : 'text-sm'"
        >
          {{ formatCurrency(upfrontFee) }}
        </span>
      </div>

      <!-- Hidden Markup Row -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span
            class="rounded-sm"
            :class="[
              compact ? 'h-2.5 w-2.5' : 'h-3 w-3',
              markupSeverityClass
            ]"
          />
          <div class="flex items-center gap-2">
            <span
              class="font-medium text-neutral-700"
              :class="compact ? 'text-sm' : 'text-sm'"
            >
              Hidden FX Markup
            </span>
            <span
              class="rounded-md px-2 py-0.5 text-[10px] font-bold"
              :class="markupBadgeClass"
            >
              {{ spreadBps }} bps
            </span>
          </div>
        </div>
        <span
          class="font-bold"
          :class="[
            compact ? 'text-base' : 'text-sm',
            hiddenMarkup > upfrontFee ? 'text-rose-600' : 'text-amber-600'
          ]"
        >
          {{ formatCurrency(hiddenMarkup) }}
        </span>
      </div>

      <!-- Divider -->
      <div class="border-t border-dashed border-neutral-300 my-3" />

      <!-- Total Cost Row -->
      <div class="flex items-center justify-between mb-4">
        <span
          class="font-bold text-neutral-900 uppercase tracking-wide"
          :class="compact ? 'text-sm' : 'text-sm'"
        >
          Total Cost
        </span>
        <div class="text-right">
          <span
            class="font-bold text-neutral-900"
            :class="compact ? 'text-xl' : 'text-lg'"
          >
            {{ formatCurrency(totalCost) }}
          </span>
          <span
            class="ml-2 font-semibold"
            :class="[
              compact ? 'text-xs' : 'text-xs',
              costSeverityTextClass
            ]"
          >
            ({{ totalCostPercent.toFixed(2) }}%)
          </span>
        </div>
      </div>

      <!-- Visual Cost Bar -->
      <div class="mb-3">
        <div class="h-3 w-full rounded-full bg-neutral-200 overflow-hidden flex">
          <div
            class="h-full bg-brand-600 transition-all duration-500"
            :style="{ width: `${feeBarWidth}%` }"
          />
          <div
            class="h-full transition-all duration-500"
            :class="markupSeverityClass"
            :style="{ width: `${markupBarWidth}%` }"
          />
        </div>
        <div class="flex justify-between mt-1.5 text-[10px] text-neutral-500">
          <span>Fee: {{ feePercent.toFixed(0) }}%</span>
          <span>Markup: {{ markupPercent.toFixed(0) }}%</span>
        </div>
      </div>

      <!-- Loss Aversion Message (Compact Version) -->
      <div
        v-if="hiddenMarkup > 0 && compact"
        class="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5"
      >
        <p class="text-xs text-rose-700 leading-relaxed">
          <span class="font-bold">{{ formatCurrency(hiddenMarkup) }}</span> is hidden in the exchange rate
          <span v-if="hiddenMarkup > upfrontFee" class="font-semibold">
            — that's {{ ((hiddenMarkup / totalCost) * 100).toFixed(0) }}% of your total cost.
          </span>
        </p>
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
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
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
  return `$${value.toFixed(2)}`
}
</script>

