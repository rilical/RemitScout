<template>
  <div class="rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-800/80 to-neutral-800/40 overflow-hidden">
    <button
      id="pulse-methodology-button"
      class="flex w-full items-center justify-between px-6 py-5 text-left motion-safe:transition-colors hover:bg-surface/5"
      :aria-expanded="expanded ? 'true' : 'false'"
      aria-controls="pulse-methodology-panel"
      @click="expanded = !expanded"
    >
      <h2 class="text-body-lg font-bold text-white flex items-center gap-2">
        <svg
          class="h-5 w-5 text-primary-400"
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
        How Pulse Works
      </h2>
      <svg
        class="h-5 w-5 text-neutral-400 motion-safe:transition-transform motion-safe:duration-300"
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
      id="pulse-methodology-panel"
      role="region"
      aria-labelledby="pulse-methodology-button"
      class="px-6 pb-6 space-y-6"
    >
      <div class="grid gap-6 md:grid-cols-2">
        <div class="rounded-xl bg-surface/5 border border-white/5 p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20">
              <svg
                class="h-5 w-5 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
            </div>
            <h3 class="font-semibold text-white">
              Data Sources
            </h3>
          </div>
          <p class="text-body-sm text-neutral-400 leading-relaxed">
            We capture quotes from provider APIs, partner feeds, and public-facing quote tools. All timestamps reflect when the quote was captured, not when you view this page.
          </p>
        </div>

        <div class="rounded-xl bg-surface/5 border border-white/5 p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-success-600/20">
              <svg
                class="h-5 w-5 text-success-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 class="font-semibold text-white">
              Update Frequency
            </h3>
          </div>
          <ul class="space-y-2 text-body-sm text-neutral-400">
            <li class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-success-600" />
              High-volume corridors: every 5–15 min
            </li>
            <li class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Medium corridors: every 30 min
            </li>
            <li class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-warning-600" />
              Low-volume: hourly or on-demand
            </li>
          </ul>
        </div>

        <div class="rounded-xl bg-surface/5 border border-white/5 p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-600/20">
              <svg
                class="h-5 w-5 text-accent-600"
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
            </div>
            <h3 class="font-semibold text-white">
              What "Recipient Gets" Includes
            </h3>
          </div>
          <p class="text-body-sm text-neutral-400 leading-relaxed">
            The recipient amount includes all disclosed fees and the exchange rate margin (FX spread). It represents the best available quote at the time of capture.
          </p>
        </div>

        <div class="rounded-xl bg-surface/5 border border-white/5 p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-600/20">
              <svg
                class="h-5 w-5 text-warning-600"
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
            <h3 class="font-semibold text-white">
              Why Checkout May Differ
            </h3>
          </div>
          <ul class="space-y-2 text-body-sm text-neutral-400">
            <li class="flex items-start gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-neutral-500 mt-1.5 flex-shrink-0" />
              <span><strong class="text-neutral-300">Payment method:</strong> Card vs bank affects fees</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-neutral-500 mt-1.5 flex-shrink-0" />
              <span><strong class="text-neutral-300">KYC status:</strong> Verified users may get better rates</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-neutral-500 mt-1.5 flex-shrink-0" />
              <span><strong class="text-neutral-300">Timing:</strong> FX rates change throughout the day</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-white/10">
        <NuxtLink
          to="/methodology"
          class="text-body-sm font-medium text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
        >
          Full methodology
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NuxtLink>
        <span class="text-neutral-600">•</span>
        <NuxtLink
          to="/corrections"
          class="text-body-sm font-medium text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
        >
          Corrections policy
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NuxtLink>
        <span class="text-neutral-600">•</span>
        <NuxtLink
          to="/legal/how-we-make-money"
          class="text-body-sm font-medium text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
        >
          How we make money
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NuxtLink>
      </div>

      <div class="rounded-xl bg-primary-500/10 border border-primary-500/20 p-4">
        <div class="flex items-start gap-3">
          <svg
            class="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div class="text-body-sm text-neutral-300">
            <strong class="text-white">Rankings are independent:</strong> We may earn a commission when you click provider links, but this never affects our rankings, which are based solely on recipient value, speed, and reliability.
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
