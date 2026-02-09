<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <!-- Collapsible Header -->
    <button
      class="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-neutral-700"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-3">
        <Icon
          name="info"
          :size="20"
          class="text-neutral-400"
        />
        <span class="font-medium text-white">Data Notes & Methodology</span>
      </div>
      <Icon
        name="chevron-down"
        :size="20"
        class="text-neutral-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <div class="flex flex-wrap items-center gap-2 px-6 pb-4 text-xs text-neutral-400">
      <span>Updated periodically</span>
      <span class="text-neutral-600">|</span>
      <span>All-in cost = fee + FX markup</span>
      <span class="text-neutral-600">|</span>
      <span>Provenance tags: Verified/Observed/Estimated</span>
    </div>

    <!-- Collapsible Content -->
    <div
      v-show="isOpen"
      class="border-t border-neutral-700 px-6 py-4"
    >
      <div class="space-y-6">
        <!-- Quotes Can Change -->
        <div class="flex gap-3">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600/20 text-brand-600">
            <Icon
              name="exclamation-triangle"
              :size="16"
              class="text-current"
            />
          </div>
          <div>
            <h4 class="font-medium text-white">
              Quotes can change at checkout
            </h4>
            <p class="mt-1 text-sm text-neutral-400">
              The rates shown are indicative and captured at a point in time. Actual rates may differ when you initiate a transfer due to market movements or provider adjustments.
            </p>
          </div>
        </div>

        <!-- What We Normalize -->
        <div class="flex gap-3">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600/20 text-brand-600">
            <Icon
              name="document-text"
              :size="16"
              class="text-current"
            />
          </div>
          <div>
            <h4 class="font-medium text-white">
              What we normalize
            </h4>
            <p class="mt-1 text-sm text-neutral-400">
              All comparisons use the same send amount, payment method, and payout method. We capture quotes at regular intervals throughout the day and use the same mid-market rate benchmark for FX markup calculations.
            </p>
          </div>
        </div>

        <!-- Key Definitions -->
        <div class="flex gap-3">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600/20 text-brand-600">
            <Icon
              name="info"
              :size="16"
              class="text-current"
            />
          </div>
          <div>
            <h4 class="font-medium text-white">
              Key definitions
            </h4>
            <p class="mt-1 text-sm text-neutral-400">
              <strong class="text-white">Markup (bps)</strong> = (mid-market - provider rate) / mid-market.
              <strong class="text-white"> All-in cost</strong> = upfront fee + FX markup cost on the selected amount.
            </p>
          </div>
        </div>

        <!-- Provenance Tags -->
        <div class="flex gap-3">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600/20 text-brand-600">
            <Icon
              name="bookmark"
              :size="16"
              class="text-current"
            />
          </div>
          <div>
            <h4 class="font-medium text-white">
              Provenance tags explained
            </h4>
            <div class="mt-2 space-y-2">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1 rounded-full bg-brand-600/20 px-2 py-0.5 text-xs text-brand-600">
                  <span class="h-1.5 w-1.5 rounded-full bg-brand-600" />
                  Verified
                </span>
                <span class="text-sm text-neutral-400">Direct API quote from the provider</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1 rounded-full bg-neutral-600/20 px-2 py-0.5 text-xs text-neutral-400">
                  <span class="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                  Observed
                </span>
                <span class="text-sm text-neutral-400">Captured from provider website</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1 rounded-full bg-neutral-700/50 px-2 py-0.5 text-xs text-neutral-500">
                  <span class="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                  Estimated
                </span>
                <span class="text-sm text-neutral-400">Interpolated or modeled from partial data</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Chart-specific notes -->
        <div
          v-if="chartSpecificNote"
          class="flex gap-3"
        >
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-700 text-neutral-400">
            <Icon
              name="chart-bar"
              :size="16"
              class="text-current"
            />
          </div>
          <div>
            <h4 class="font-medium text-white">
              About this chart
            </h4>
            <p class="mt-1 text-sm text-neutral-400">
              {{ chartSpecificNote }}
            </p>
          </div>
        </div>

        <!-- Links -->
        <div class="flex flex-wrap gap-4 pt-4 border-t border-neutral-700">
          <NuxtLink
            to="/methodology"
            class="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 transition-colors"
          >
            <Icon
              name="document-text"
              :size="16"
              class="text-current"
            />
            Full Methodology
          </NuxtLink>
          <NuxtLink
            to="/how-we-make-money"
            class="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 transition-colors"
          >
            <Icon
              name="currency-dollar"
              :size="16"
              class="text-current"
            />
            How We Make Money
          </NuxtLink>
          <NuxtLink
            to="/corrections"
            class="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 transition-colors"
          >
            <Icon
              name="pencil-square"
              :size="16"
              class="text-current"
            />
            Corrections
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getChartById } from '~/lib/pulseChartRegistry'
import { Icon } from '~/ui'

interface Props {
  chartId?: string
}

const props = defineProps<Props>()

const isOpen = ref(false)

const chartSpecificNote = computed(() => {
  if (!props.chartId) return null
  const meta = getChartById(props.chartId)
  return meta?.sourceNotes || null
})
</script>
