<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <!-- Collapsible Header -->
    <button
      class="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-neutral-700"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-3">
        <svg
          class="h-5 w-5 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="font-medium text-white">Data Notes & Methodology</span>
      </div>
      <svg
        class="h-5 w-5 text-neutral-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <div class="flex flex-wrap items-center gap-2 px-6 pb-4 text-xs text-neutral-400">
      <span>Updated every 15 min</span>
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
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
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
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
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
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
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
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
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
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
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
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Full Methodology
          </NuxtLink>
          <NuxtLink
            to="/how-we-make-money"
            class="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 transition-colors"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            How We Make Money
          </NuxtLink>
          <NuxtLink
            to="/corrections"
            class="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 transition-colors"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
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
