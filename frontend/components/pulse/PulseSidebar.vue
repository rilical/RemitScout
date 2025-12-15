<template>
  <div class="space-y-6">
    <div class="rounded-lg border border-gray-200 bg-white p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-semibold text-gray-900">
          Your Watchlist
        </h3>
        <span
          v-if="!isPlus"
          class="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700"
        >
          Plus
        </span>
      </div>

      <div v-if="!isPlus">
        <div class="mb-4 rounded-lg bg-gradient-to-br from-primary-50 to-blue-50 p-4">
          <div class="mb-2 flex items-center gap-2">
            <svg
              class="h-5 w-5 text-primary-600"
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
            <span class="text-sm font-medium text-gray-900">Locked feature</span>
          </div>
          <p class="mb-3 text-sm text-gray-600">
            Save corridors + get alerts with Remit‑Scout Plus
          </p>
          <div class="flex gap-2">
            <button class="flex-1 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700">
              Start Plus
            </button>
            <button class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Learn more
            </button>
          </div>
        </div>

        <div class="space-y-3 opacity-50">
          <div
            v-for="i in 3"
            :key="i"
            class="relative rounded-lg border border-gray-200 p-3"
          >
            <div class="mb-2 flex items-center justify-between">
              <div class="text-sm font-medium text-gray-900">
                🇺🇸 → 🇵🇭
              </div>
              <div class="text-xs text-gray-500">
                5m ago
              </div>
            </div>
            <div class="text-xs text-gray-600">
              ₱56,234 • Wise
            </div>
            <div class="absolute inset-0 flex items-center justify-center bg-white/50">
              <svg
                class="h-6 w-6 text-gray-400"
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
          class="group rounded-lg border border-gray-200 p-3 hover:border-primary-300"
        >
          <div class="mb-2 flex items-center justify-between">
            <div class="text-sm font-medium text-gray-900">
              {{ item.corridor }}
            </div>
            <button
              class="opacity-0 transition-opacity group-hover:opacity-100"
              title="Remove"
            >
              <svg
                class="h-4 w-4 text-gray-400 hover:text-gray-600"
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
          <div class="mb-2 text-xs text-gray-600">
            {{ item.recipientGets }} • {{ item.provider }}
          </div>
          <div class="flex gap-2">
            <button class="text-xs text-primary-600 hover:text-primary-700">
              View
            </button>
            <button class="text-xs text-primary-600 hover:text-primary-700">
              Alert
            </button>
          </div>
        </div>
        <button class="w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600">
          + Add corridor
        </button>
      </div>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-semibold text-gray-900">
          Active Alerts
        </h3>
        <span
          v-if="!isPlus"
          class="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700"
        >
          Plus
        </span>
      </div>

      <div v-if="!isPlus">
        <p class="mb-3 text-sm text-gray-600">
          Get notified when rates hit your target
        </p>
        <button class="w-full rounded-lg border border-primary-600 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100">
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
          class="rounded-lg border border-gray-200 p-3"
        >
          <div class="mb-1 flex items-center justify-between">
            <div class="text-sm font-medium text-gray-900">
              {{ alert.corridor }}
            </div>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="alert.statusClass"
            >
              {{ alert.status }}
            </span>
          </div>
          <div class="text-xs text-gray-600">
            Target: {{ alert.target }}
          </div>
        </div>
        <button class="w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600">
          + Create alert
        </button>
      </div>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-6">
      <h3 class="mb-3 font-semibold text-gray-900">
        Data freshness
      </h3>
      <div class="mb-3 flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-green-500" />
        <span class="text-sm text-gray-600">Last updated 2 minutes ago</span>
      </div>
      <div class="mb-4 text-sm text-gray-600">
        Coverage: <strong>847 providers</strong> live for this filter
      </div>
      <button class="w-full text-sm font-medium text-primary-600 hover:text-primary-700">
        Report an issue
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isPlus: boolean
}

defineProps<Props>()

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
    statusClass: 'bg-green-100 text-green-700',
  },
]
</script>
