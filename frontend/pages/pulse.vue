<template>
  <div class="min-h-screen bg-gray-50">
    <div class="border-b bg-white">
      <div class="container mx-auto px-4">
        <nav class="flex gap-6 text-sm font-medium">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'border-b-2 px-2 py-4 transition-colors',
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900',
            ]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
            <span
              v-if="tab.badge"
              class="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700"
            >
              {{ tab.badge }}
            </span>
          </button>
        </nav>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div class="lg:col-span-8">
          <PulseHero
            v-if="activeTab === 'overview'"
            @filter-change="handleFilterChange"
          />

          <MarketSnapshot
            v-if="activeTab === 'overview'"
            :filters="filters"
            class="mt-8"
          />

          <PulseFeed
            v-if="activeTab === 'overview'"
            :filters="filters"
            class="mt-8"
          />

          <CorridorSpotlight
            v-if="activeTab === 'overview'"
            class="mt-8"
            @corridor-click="handleCorridorClick"
          />

          <ProviderWatch
            v-if="activeTab === 'overview' || activeTab === 'providers'"
            class="mt-8"
          />

          <CorridorsList
            v-if="activeTab === 'corridors'"
            @corridor-click="handleCorridorClick"
          />

          <InsightsGrid
            v-if="activeTab === 'insights'"
          />

          <PlusFeatures
            v-if="activeTab === 'plus'"
          />

          <PulseMethodology
            v-if="activeTab === 'overview'"
            class="mt-8"
          />
        </div>

        <div class="lg:col-span-4">
          <PulseSidebar :is-plus="false" />
        </div>
      </div>
    </div>

    <CorridorDetailModal
      v-if="selectedCorridor"
      :corridor="selectedCorridor"
      @close="selectedCorridor = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'corridors', label: 'Corridors' },
  { id: 'providers', label: 'Providers' },
  { id: 'insights', label: 'Insights' },
  { id: 'plus', label: 'Plus', badge: 'New' },
]

const activeTab = ref('overview')

const filters = ref({
  from: 'US',
  to: 'PH',
  amount: 1000,
  method: 'bank' as 'bank' | 'cash' | 'wallet',
  sortBy: 'recipient' as 'recipient' | 'fastest' | 'reliable',
})

const selectedCorridor = ref<{ from: string; to: string } | null>(null)

const handleFilterChange = (newFilters: typeof filters.value) => {
  filters.value = { ...filters.value, ...newFilters }
}

const handleCorridorClick = (corridor: { from: string; to: string }) => {
  selectedCorridor.value = corridor
}

useHead({
  title: 'Pulse - Live Market Signals | Remit-Scout',
  meta: [
    {
      name: 'description',
      content: 'Live market signals for international money transfers. Track rates, fees, and delivery times across providers and corridors in real-time.',
    },
  ],
})
</script>
