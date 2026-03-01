<template>
  <div class="space-y-6">
    <!-- Watchlist Card -->
    <div class="rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-800/80 to-neutral-800/40 overflow-hidden">
      <div class="px-6 py-5 border-b border-white/10">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-white flex items-center gap-2">
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
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            Your Watchlist
          </h3>
          <span
            v-if="!isPlus"
            class="rounded-full bg-primary-500/20 px-2.5 py-1 text-body-sm font-bold text-primary-400"
          >
            Plus
          </span>
        </div>
      </div>

      <div class="p-6">
        <div v-if="!isPlus">
          <div v-if="pulseEnabled" class="mb-4 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-600/10 border border-white/5 p-5">
            <div class="mb-3 flex items-center gap-2">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <span class="text-body-sm font-bold text-white">Unlock Pulse Features</span>
              </div>
            </div>
            <p class="mb-4 text-body-sm text-neutral-400">
              Save corridors, set price alerts, and get notified when rates hit your target.
            </p>
            <div class="flex gap-2">
              <NuxtLink
                to="/plus"
                class="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-body-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-500/25 text-center"
              >
                Start Plus
              </NuxtLink>
              <NuxtLink
                to="/plus"
                class="flex-1 rounded-xl border border-white/10 bg-surface/5 px-4 py-2.5 text-body-sm font-medium text-neutral-300 transition-all hover:bg-surface/10 text-center"
              >
                Learn more about Plus
              </NuxtLink>
            </div>
          </div>

          <div class="space-y-3 opacity-40 pointer-events-none select-none">
            <div
              v-for="i in 3"
              :key="i"
              class="relative rounded-xl border border-white/10 bg-surface/5 p-4"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="text-body font-medium text-white">
                  🇺🇸 → 🇵🇭
                </div>
                <div class="text-body-sm text-rs-muted">
                  5m ago
                </div>
              </div>
              <div class="text-body-sm text-neutral-400">
                ₱56,234 • Wise
              </div>
              <div class="absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-sm">
                <svg
                  class="h-6 w-6 text-rs-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="item in watchlistItems"
            :key="item.id"
            class="group rounded-xl border border-white/10 bg-surface/5 p-4 transition-all hover:border-primary-500/30 hover:bg-surface/10"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="text-body font-medium text-white">
                {{ item.corridor }}
              </div>
              <button
                type="button"
                class="opacity-0 transition-opacity group-hover:opacity-100 text-rs-muted hover:text-neutral-300"
                title="Remove"
                aria-label="Remove from watchlist"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div class="mb-3 text-body-sm text-neutral-400">
              {{ item.recipientGets }} • {{ item.provider }}
            </div>
            <div class="flex gap-2">
              <button class="text-body-sm font-medium text-primary-400 hover:text-primary-300">
                View
              </button>
              <button class="text-body-sm font-medium text-primary-400 hover:text-primary-300">
                Alert
              </button>
            </div>
          </div>
          <button class="w-full rounded-xl border border-dashed border-white/20 py-3 text-body-sm font-medium text-neutral-400 transition-all hover:border-primary-500/50 hover:text-primary-400">
            + Add corridor
          </button>
        </div>
      </div>
    </div>

    <!-- Active Alerts Card -->
    <div class="rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-800/80 to-neutral-800/40 overflow-hidden">
      <div class="px-6 py-5 border-b border-white/10">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-white flex items-center gap-2">
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            Active Alerts
          </h3>
          <span
            v-if="!isPlus"
            class="rounded-full bg-primary-500/20 px-2.5 py-1 text-body-sm font-bold text-primary-400"
          >
            Plus
          </span>
        </div>
      </div>

      <div class="p-6">
        <div v-if="!isPlus">
          <p class="mb-4 text-body-sm text-neutral-400">
            Get notified instantly when rates hit your target price.
          </p>
          <button class="w-full rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3 text-body-sm font-semibold text-primary-400 transition-all hover:bg-primary-500/20">
            Unlock with Plus
          </button>
        </div>

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="alert in activeAlerts"
            :key="alert.id"
            class="rounded-xl border border-white/10 bg-surface/5 p-4"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="text-body-sm font-medium text-white">
                {{ alert.corridor }}
              </div>
              <span
                class="rounded-full px-2.5 py-1 text-body-sm font-semibold"
                :class="alert.statusClass"
              >
                {{ alert.status }}
              </span>
            </div>
            <div class="text-body-sm text-neutral-400">
              Target: {{ alert.target }}
            </div>
          </div>
          <button class="w-full rounded-xl border border-dashed border-white/20 py-3 text-body-sm font-medium text-neutral-400 transition-all hover:border-primary-500/50 hover:text-primary-400">
            + Create alert
          </button>
        </div>
      </div>
    </div>

    <!-- Data Status Card -->
    <div class="rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-800/80 to-neutral-800/40 p-6">
      <h3 class="mb-4 font-bold text-white flex items-center gap-2">
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Data Status
      </h3>

      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <span class="relative flex h-3 w-3">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-600 opacity-75" />
            <span class="relative inline-flex h-3 w-3 rounded-full bg-success-600" />
          </span>
          <span class="text-body-sm text-neutral-300">All systems operational</span>
        </div>

        <div class="space-y-2 text-body-sm">
          <div class="flex justify-between">
            <span class="text-neutral-400">Last update</span>
            <span class="text-neutral-300">2 minutes ago</span>
          </div>
          <div class="flex justify-between">
            <span class="text-neutral-400">Providers tracked</span>
            <span class="text-neutral-300 font-semibold">30+</span>
          </div>
          <div class="flex justify-between">
            <span class="text-neutral-400">Quotes today</span>
            <span class="text-success-600 font-semibold">12,456</span>
          </div>
        </div>

        <button class="w-full text-body-sm font-medium text-primary-400 hover:text-primary-300 transition-colors flex items-center justify-center gap-1 pt-2">
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
          Report a problem
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFeatureFlags } from '~/composables/useFeatureFlags'

interface Props {
  isPlus: boolean
}

defineProps<Props>()

const { pulseEnabled } = useFeatureFlags()

const watchlistItems = [
  {
    id: '1',
    corridor: '🇺🇸 → 🇵🇭',
    recipientGets: '₱56,234',
    provider: 'Wise',
  },
  {
    id: '2',
    corridor: '🇺🇸 → 🇲🇽',
    recipientGets: 'MXN 18,342',
    provider: 'Remitly',
  },
]

const activeAlerts = [
  {
    id: '1',
    corridor: '🇺🇸 → 🇵🇭',
    target: '₱57,000',
    status: 'Armed',
    statusClass: 'bg-success-600/20 text-success-600',
  },
]
</script>
