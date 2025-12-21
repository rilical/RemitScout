<template>
  <div>
    <div class="mb-6">
      <h2 class="mb-2 text-2xl font-bold text-gray-900">
        All Corridors
      </h2>
      <p class="text-gray-600">
        View live market data for {{ corridors.length }} corridors
      </p>
    </div>

    <div class="mb-4 flex gap-4">
      <input
        v-model="search"
        type="text"
        placeholder="Search corridors..."
        class="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
      <select
        v-model="sortBy"
        class="rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="popular">Most popular</option>
        <option value="change">Biggest change</option>
        <option value="value">Best value</option>
      </select>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div
        v-for="corridor in filteredCorridors"
        :key="`${corridor.from}-${corridor.to}`"
        class="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-md"
        @click="$emit('corridor-click', { from: corridor.from, to: corridor.to })"
      >
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2 text-xl">
            <span>{{ corridor.fromFlag }}</span>
            <span class="text-gray-400">→</span>
            <span>{{ corridor.toFlag }}</span>
            <span class="ml-2 font-semibold text-gray-900">{{ corridor.name }}</span>
          </div>
          <span
            class="text-xs font-medium"
            :class="corridor.changeType === 'up' ? 'text-green-600' : 'text-red-600'"
          >
            {{ corridor.change24h }}
          </span>
        </div>
        <div class="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div class="text-xs text-gray-500">Best provider</div>
            <div class="font-medium text-gray-900">{{ corridor.bestProvider }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Recipient gets</div>
            <div class="font-medium text-gray-900">{{ corridor.recipientGets }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Updated</div>
            <div class="font-medium text-gray-900">{{ corridor.updated }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

defineEmits<{
  'corridor-click': [corridor: { from: string; to: string }]
}>()

const search = ref('')
const sortBy = ref('popular')

const corridors = [
  { from: 'US', to: 'Philippines', fromFlag: '🇺🇸', toFlag: '🇵🇭', name: 'US → PH', bestProvider: 'Wise', recipientGets: '₱56,234', change24h: '+₱142', changeType: 'up', updated: '5m ago' },
  { from: 'US', to: 'Mexico', fromFlag: '🇺🇸', toFlag: '🇲🇽', name: 'US → MX', bestProvider: 'Remitly', recipientGets: 'MXN 18,342', change24h: '+MXN 120', changeType: 'up', updated: '12m ago' },
  { from: 'GB', to: 'India', fromFlag: '🇬🇧', toFlag: '🇮🇳', name: 'GB → IN', bestProvider: 'Wise', recipientGets: '₹92,340', change24h: '-₹86', changeType: 'down', updated: '18m ago' },
  { from: 'US', to: 'India', fromFlag: '🇺🇸', toFlag: '🇮🇳', name: 'US → IN', bestProvider: 'Remitly', recipientGets: '₹83,450', change24h: '+₹234', changeType: 'up', updated: '8m ago' },
]

const filteredCorridors = computed(() => {
  return corridors.filter(c =>
    c.name.toLowerCase().includes(search.value.toLowerCase()),
  )
})
</script>




