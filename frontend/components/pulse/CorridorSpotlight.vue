<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">
        Corridor Spotlight
      </h2>
      <NuxtLink
        to="/pulse/corridors"
        class="text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        View all corridors →
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="corridor in spotlightCorridors"
        :key="`${corridor.from}-${corridor.to}`"
        class="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-md"
        @click="$emit('corridor-click', { from: corridor.from, to: corridor.to })"
      >
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2 text-2xl">
            <span>{{ corridor.fromFlag }}</span>
            <svg
              class="h-4 w-4 text-gray-400"
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
            <span>{{ corridor.toFlag }}</span>
          </div>
          <span
            class="rounded-full px-2 py-1 text-xs font-medium"
            :class="corridor.freshnessClass"
          >
            {{ corridor.freshness }}
          </span>
        </div>

        <div class="mb-1 text-sm font-medium text-gray-600">
          {{ corridor.from }} → {{ corridor.to }}
        </div>

        <div class="mb-3">
          <div class="text-xs text-gray-500">
            Best provider right now
          </div>
          <div class="text-lg font-bold text-gray-900">
            {{ corridor.bestProvider }}
          </div>
        </div>

        <div class="mb-3 flex items-baseline justify-between">
          <div>
            <div class="text-xs text-gray-500">
              Recipient gets
            </div>
            <div class="text-xl font-bold text-gray-900">
              {{ corridor.recipientGets }}
            </div>
          </div>
          <div
            class="flex items-center text-sm font-medium"
            :class="corridor.changeType === 'up' ? 'text-green-600' : 'text-red-600'"
          >
            <svg
              class="mr-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="corridor.changeType === 'up'"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            </svg>
            {{ corridor.change24h }}
          </div>
        </div>

        <div class="text-xs text-gray-500">
          For ${{ corridor.amount }} • {{ corridor.method }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'corridor-click': [corridor: { from: string; to: string }]
}>()

const spotlightCorridors = [
  {
    from: 'US',
    to: 'Philippines',
    fromFlag: '🇺🇸',
    toFlag: '🇵🇭',
    bestProvider: 'Wise',
    recipientGets: '₱56,234',
    change24h: '+₱142',
    changeType: 'up' as const,
    amount: 1000,
    method: 'Bank Transfer',
    freshness: 'Updated 5m ago',
    freshnessClass: 'bg-green-100 text-green-700',
  },
  {
    from: 'US',
    to: 'Mexico',
    fromFlag: '🇺🇸',
    toFlag: '🇲🇽',
    bestProvider: 'Remitly',
    recipientGets: 'MXN 18,342',
    change24h: '+MXN 120',
    changeType: 'up' as const,
    amount: 1000,
    method: 'Cash Pickup',
    freshness: 'Updated 12m ago',
    freshnessClass: 'bg-green-100 text-green-700',
  },
  {
    from: 'GB',
    to: 'India',
    fromFlag: '🇬🇧',
    toFlag: '🇮🇳',
    bestProvider: 'Wise',
    recipientGets: '₹92,340',
    change24h: '-₹86',
    changeType: 'down' as const,
    amount: 1000,
    method: 'Bank Transfer',
    freshness: 'Updated 18m ago',
    freshnessClass: 'bg-yellow-100 text-yellow-700',
  },
  {
    from: 'US',
    to: 'India',
    fromFlag: '🇺🇸',
    toFlag: '🇮🇳',
    bestProvider: 'Remitly',
    recipientGets: '₹83,450',
    change24h: '+₹234',
    changeType: 'up' as const,
    amount: 1000,
    method: 'Bank Transfer',
    freshness: 'Updated 8m ago',
    freshnessClass: 'bg-green-100 text-green-700',
  },
  {
    from: 'CA',
    to: 'India',
    fromFlag: '🇨🇦',
    toFlag: '🇮🇳',
    bestProvider: 'Wise',
    recipientGets: '₹62,780',
    change24h: '+₹156',
    changeType: 'up' as const,
    amount: 1000,
    method: 'Bank Transfer',
    freshness: 'Updated 22m ago',
    freshnessClass: 'bg-yellow-100 text-yellow-700',
  },
  {
    from: 'US',
    to: 'Nigeria',
    fromFlag: '🇺🇸',
    toFlag: '🇳🇬',
    bestProvider: 'Sendwave',
    recipientGets: '₦1,234,500',
    change24h: '+₦2,340',
    changeType: 'up' as const,
    amount: 1000,
    method: 'Mobile Wallet',
    freshness: 'Updated 15m ago',
    freshnessClass: 'bg-green-100 text-green-700',
  },
]
</script>
