<template>
  <div>
    <div class="mb-6">
      <h2 class="mb-2 text-h3 font-bold text-white flex items-center gap-2">
        <svg
          class="h-6 w-6 text-primary-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        All Corridors
      </h2>
      <p class="text-neutral-400">
        View quote snapshots for {{ corridors.length }} corridors
      </p>
    </div>

    <div class="mb-6 flex flex-col gap-4 sm:flex-row">
      <div class="relative flex-1">
        <svg
          class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-rs-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search corridors..."
          aria-label="Search corridors"
          class="h-12 w-full rounded-xl border border-white/10 bg-surface/5 pl-12 pr-4 text-white placeholder-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
        >
      </div>
      <select
        v-model="sortBy"
        aria-label="Sort corridors"
        class="h-12 rounded-xl border border-white/10 bg-surface/5 px-4 text-neutral-300 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all appearance-none cursor-pointer"
      >
        <option
          value="popular"
          class="bg-neutral-800"
        >
          Most popular
        </option>
        <option
          value="change"
          class="bg-neutral-800"
        >
          Biggest change
        </option>
        <option
          value="value"
          class="bg-neutral-800"
        >
          Best value
        </option>
      </select>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <button
        v-for="corridor in filteredCorridors"
        :key="`${corridor.from}-${corridor.to}`"
        type="button"
        class="group w-full cursor-pointer rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-800/80 to-neutral-800/40 p-5 text-left transition-all duration-300 hover:border-white/20 hover:scale-[1.01]"
        :aria-label="`View corridor ${corridor.from} to ${corridor.to}`"
        @click="$emit('corridor-click', { from: corridor.from, to: corridor.to })"
      >
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 text-h3">
              <span>{{ corridor.fromFlag }}</span>
              <svg
                class="h-4 w-4 text-rs-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
              <span>{{ corridor.toFlag }}</span>
            </div>
            <span class="font-semibold text-white group-hover:text-primary-400 transition-colors">{{ corridor.name }}</span>
          </div>
          <span
            class="flex items-center gap-1 text-body-sm font-semibold"
            :class="corridor.changeType === 'up' ? 'text-success-600' : 'text-danger-600'"
          >
            <svg
              class="h-4 w-4"
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
          </span>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="rounded-xl bg-surface/5 p-3">
            <div class="text-body-sm text-rs-muted mb-1">
              Best provider
            </div>
            <div class="font-semibold text-white">
              {{ corridor.bestProvider }}
            </div>
          </div>
          <div class="rounded-xl bg-surface/5 p-3">
            <div class="text-body-sm text-rs-muted mb-1">
              Recipient gets
            </div>
            <div class="font-semibold text-success-600">
              {{ corridor.recipientGets }}
            </div>
          </div>
          <div class="rounded-xl bg-surface/5 p-3">
            <div class="text-body-sm text-rs-muted mb-1">
              Updated
            </div>
            <div class="font-semibold text-white flex items-center gap-1">
              <span class="relative flex h-1.5 w-1.5">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-600 opacity-75" />
                <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-success-600" />
              </span>
              {{ corridor.updated }}
            </div>
          </div>
        </div>
      </button>
    </div>

    <div class="mt-8 text-center">
      <button class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface/5 px-6 py-3 text-body-sm font-medium text-neutral-300 transition-all hover:bg-surface/10 hover:text-white">
        Load more corridors
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
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

defineEmits<{
  'corridor-click': [corridor: { from: string, to: string }]
}>()

const search = ref('')
const sortBy = ref('popular')

const corridors = [
  { from: 'US', to: 'Philippines', fromFlag: '🇺🇸', toFlag: '🇵🇭', name: 'US → PH', bestProvider: 'Wise', recipientGets: '₱56,234', change24h: '+₱142', changeType: 'up', updated: '5m ago' },
  { from: 'US', to: 'Mexico', fromFlag: '🇺🇸', toFlag: '🇲🇽', name: 'US → MX', bestProvider: 'Remitly', recipientGets: 'MXN 18,342', change24h: '+MXN 120', changeType: 'up', updated: '12m ago' },
  { from: 'GB', to: 'India', fromFlag: '🇬🇧', toFlag: '🇮🇳', name: 'GB → IN', bestProvider: 'Wise', recipientGets: '₹92,340', change24h: '-₹86', changeType: 'down', updated: '18m ago' },
  { from: 'US', to: 'India', fromFlag: '🇺🇸', toFlag: '🇮🇳', name: 'US → IN', bestProvider: 'Remitly', recipientGets: '₹83,450', change24h: '+₹234', changeType: 'up', updated: '8m ago' },
  { from: 'CA', to: 'India', fromFlag: '🇨🇦', toFlag: '🇮🇳', name: 'CA → IN', bestProvider: 'Wise', recipientGets: '₹62,780', change24h: '+₹156', changeType: 'up', updated: '22m ago' },
  { from: 'US', to: 'Nigeria', fromFlag: '🇺🇸', toFlag: '🇳🇬', name: 'US → NG', bestProvider: 'Sendwave', recipientGets: '₦1,234,500', change24h: '+₦2,340', changeType: 'up', updated: '15m ago' },
  { from: 'AU', to: 'Philippines', fromFlag: '🇦🇺', toFlag: '🇵🇭', name: 'AU → PH', bestProvider: 'Wise', recipientGets: '₱38,920', change24h: '+₱98', changeType: 'up', updated: '10m ago' },
  { from: 'US', to: 'Vietnam', fromFlag: '🇺🇸', toFlag: '🇻🇳', name: 'US → VN', bestProvider: 'Remitly', recipientGets: '₫24,560,000', change24h: '+₫45,000', changeType: 'up', updated: '7m ago' },
]

const filteredCorridors = computed(() => {
  return corridors.filter(c =>
    c.name.toLowerCase().includes(search.value.toLowerCase()),
  )
})
</script>
