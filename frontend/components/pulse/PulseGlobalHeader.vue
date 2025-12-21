<template>
  <div class="sticky top-0 z-50 bg-neutral-900 border-b border-neutral-700">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <!-- Left: Corridor Selector -->
        <div class="flex items-center gap-4">
          <div class="relative">
            <button
              class="flex items-center gap-3 rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-left transition-colors hover:border-brand-600"
              @click="showCorridorDropdown = !showCorridorDropdown"
            >
              <span class="text-2xl">{{ store.corridor.fromFlag }}</span>
              <svg class="h-4 w-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span class="text-2xl">{{ store.corridor.toFlag }}</span>
              <div class="ml-2">
                <div class="text-sm font-semibold text-white">{{ store.corridor.label }}</div>
                <div class="text-xs text-neutral-400">{{ store.corridor.from }} to {{ store.corridor.to }}</div>
              </div>
              <svg
                class="ml-2 h-4 w-4 text-neutral-400 transition-transform"
                :class="{ 'rotate-180': showCorridorDropdown }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Corridor Dropdown -->
            <div
              v-if="showCorridorDropdown"
              class="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-neutral-700 bg-neutral-800 shadow-xl"
            >
              <div class="p-2">
                <div class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Popular Corridors
                </div>
                <button
                  v-for="corridor in corridors"
                  :key="corridor.slug"
                  class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-neutral-700"
                  :class="{ 'bg-brand-600/20': corridor.slug === store.corridor.slug }"
                  @click="selectCorridor(corridor)"
                >
                  <span class="text-xl">{{ corridor.fromFlag }}</span>
                  <svg class="h-3 w-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span class="text-xl">{{ corridor.toFlag }}</span>
                  <div class="flex-1">
                    <div class="text-sm font-medium text-white">{{ corridor.label }}</div>
                    <div class="text-xs text-neutral-400">{{ corridor.from }}</div>
                  </div>
                  <svg
                    v-if="corridor.slug === store.corridor.slug"
                    class="h-4 w-4 text-brand-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Amount Selector -->
          <div class="relative">
            <select
              :value="store.amount"
              class="h-10 rounded-lg border border-neutral-600 bg-neutral-800 px-4 pr-8 text-sm font-medium text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 appearance-none cursor-pointer"
              @change="handleAmountChange"
            >
              <option :value="100">$100</option>
              <option :value="200">$200</option>
              <option :value="500">$500</option>
              <option :value="1000">$1,000</option>
              <option :value="5000">$5,000</option>
              <option :value="10000">$10,000</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <svg class="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Center: Timeframe Toggle -->
        <div class="flex items-center gap-1 rounded-lg bg-neutral-800 p-1">
          <button
            v-for="tf in timeframes"
            :key="tf"
            class="rounded-md px-4 py-2 text-sm font-semibold transition-colors"
            :class="store.timeframe === tf
              ? 'bg-brand-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-700'"
            @click="store.setTimeframe(tf)"
          >
            {{ tf }}
          </button>
        </div>

        <!-- Right: Mode Toggle + Status -->
        <div class="flex items-center gap-4">
          <!-- View Mode Toggle -->
          <div class="flex items-center gap-1 rounded-lg bg-neutral-800 p-1">
            <button
              class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              :class="store.viewMode === 'sender'
                ? 'bg-brand-600 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-700'"
              @click="store.setViewMode('sender')"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Sender
            </button>
            <button
              class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              :class="store.viewMode === 'analyst'
                ? 'bg-brand-600 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-700'"
              @click="store.setViewMode('analyst')"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analyst
            </button>
          </div>

          <!-- Live Status -->
          <div class="flex items-center gap-2 text-sm text-neutral-400">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-600 opacity-75" />
              <span class="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
            </span>
            <span>{{ store.lastUpdatedRelative }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Click outside to close dropdown -->
    <div
      v-if="showCorridorDropdown"
      class="fixed inset-0 z-40"
      @click="showCorridorDropdown = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { usePulseStore, POPULAR_CORRIDORS, type PulseCorridor, type PulseTimeframe } from '~/stores/pulse'

const store = usePulseStore()

const showCorridorDropdown = ref(false)

const corridors = POPULAR_CORRIDORS

const timeframes: PulseTimeframe[] = ['24H', '7D', '30D', '1Y', 'MAX']

function selectCorridor(corridor: PulseCorridor) {
  store.setCorridor(corridor)
  showCorridorDropdown.value = false
}

function handleAmountChange(event: Event) {
  const target = event.target as HTMLSelectElement
  store.setAmount(parseInt(target.value, 10))
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    showCorridorDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>
