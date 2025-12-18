<template>
  <div class="rounded-lg border border-gray-200 bg-white p-6">
    <button
      class="flex w-full items-center justify-between text-left"
      @click="expanded = !expanded"
    >
      <h2 class="text-xl font-bold text-gray-900">
        How Pulse works
      </h2>
      <svg
        class="h-5 w-5 text-gray-500 transition-transform"
        :class="{ 'rotate-180': expanded }"
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

    <div
      v-show="expanded"
      class="mt-6 space-y-6"
    >
      <div>
        <h3 class="mb-2 font-semibold text-gray-900">
          Data sources
        </h3>
        <p class="text-sm text-gray-600">
          We capture quotes from provider APIs, partner feeds, and public-facing quote tools. All timestamps reflect when the quote was captured, not when you view this page.
        </p>
      </div>

      <div>
        <h3 class="mb-2 font-semibold text-gray-900">
          Update frequency
        </h3>
        <ul class="space-y-1 text-sm text-gray-600">
          <li>• High-volume corridors: every 5-15 minutes</li>
          <li>• Medium corridors: every 30 minutes</li>
          <li>• Low-volume corridors: hourly or on-demand</li>
          <li>• Provider availability checked every 2 minutes</li>
        </ul>
      </div>

      <div>
        <h3 class="mb-2 font-semibold text-gray-900">
          What "Recipient gets" includes
        </h3>
        <p class="text-sm text-gray-600">
          The recipient amount includes all disclosed fees and the exchange rate margin (FX spread). It represents the best available quote at the time of capture for the specified amount and payout method.
        </p>
      </div>

      <div>
        <h3 class="mb-2 font-semibold text-gray-900">
          Why checkout may differ
        </h3>
        <ul class="space-y-1 text-sm text-gray-600">
          <li>• <strong>Payment method:</strong> Card vs bank transfer affects fees</li>
          <li>• <strong>KYC status:</strong> Verified users may get better rates</li>
          <li>• <strong>Promos:</strong> Time-limited offers may expire</li>
          <li>• <strong>Market movement:</strong> FX rates change throughout the day</li>
          <li>• <strong>Timing:</strong> Weekend/holiday rates may differ</li>
        </ul>
      </div>

      <div class="border-t border-gray-200 pt-6">
        <h3 class="mb-3 font-semibold text-gray-900">
          Trust & transparency
        </h3>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            to="/methodology"
            class="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Full methodology →
          </NuxtLink>
          <span class="text-gray-300">•</span>
          <NuxtLink
            to="/corrections"
            class="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Corrections policy →
          </NuxtLink>
          <span class="text-gray-300">•</span>
          <NuxtLink
            to="/how-we-make-money"
            class="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            How we make money →
          </NuxtLink>
        </div>
      </div>

      <div class="rounded-lg bg-gray-50 p-4">
        <div class="mb-2 flex items-start gap-2">
          <svg
            class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600"
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
          <div class="text-sm text-gray-700">
            <strong>Rankings are independent:</strong> We may earn a commission when you click provider links, but this never affects our rankings, which are based solely on recipient value, speed, and reliability.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const expanded = ref(false)
</script>

