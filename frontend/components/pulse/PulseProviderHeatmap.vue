<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
      <div>
        <h2 class="text-lg font-bold text-white">Winner Timeline</h2>
        <p class="text-sm text-neutral-400">Who led on delivered amount each day</p>
      </div>
      <div class="flex items-center gap-4">
        <div
          v-for="(stats, provider) in data?.providerStats"
          :key="provider"
          class="flex items-center gap-2"
        >
          <span
            class="h-3 w-3 rounded"
            :style="{ backgroundColor: getProviderColor(provider) }"
          />
          <span class="text-sm text-neutral-400">{{ provider }}</span>
          <span class="text-sm font-semibold text-white">{{ stats.percentage }}%</span>
        </div>
        <div class="flex items-center gap-2 text-xs text-neutral-400">
          <span class="h-2.5 w-2.5 rounded-full bg-neutral-600" />
          <span>Leader changes</span>
          <span class="text-sm font-semibold text-white">{{ leaderChangeCount }}</span>
        </div>
      </div>
    </div>

    <!-- Heatmap Timeline -->
    <div class="p-4">
      <div v-if="loading" class="flex h-24 items-center justify-center">
        <div class="flex items-center gap-3 text-neutral-400">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </div>

      <div v-else class="space-y-4">
        <!-- Timeline Bars -->
        <div class="relative">
          <div class="flex gap-0.5 overflow-x-auto pb-2 scrollbar-hide">
            <div
              v-for="(day, index) in visibleDays"
              :key="index"
              class="group relative flex-shrink-0 cursor-pointer"
              @mouseenter="hoveredDay = day"
              @mouseleave="hoveredDay = null"
            >
              <div
                class="h-12 rounded transition-all duration-150"
                :class="compactView ? 'w-2' : 'w-6'"
                :style="{ backgroundColor: day.winnerColor }"
              />
              
              <!-- Day Label (only show some in non-compact) -->
              <div
                v-if="!compactView && index % 7 === 0"
                class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-neutral-500"
              >
                {{ formatDayLabel(day.timestamp) }}
              </div>
            </div>
          </div>

          <!-- Hover Tooltip -->
          <div
            v-if="hoveredDay"
            class="absolute z-20 left-1/2 -translate-x-1/2 top-16 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 shadow-xl"
          >
            <div class="mb-2 text-sm font-medium text-white">{{ hoveredDay.date }}</div>
            <div class="flex items-center gap-2">
              <span
                class="h-3 w-3 rounded"
                :style="{ backgroundColor: hoveredDay.winnerColor }"
              />
              <span class="text-sm text-neutral-300">{{ hoveredDay.winner }}</span>
              <span class="text-sm font-semibold text-brand-600">was leader</span>
            </div>
            <div class="mt-1 text-xs text-neutral-500">
              Edge ~${{ hoveredDay.savings.toFixed(2) }} vs #2
            </div>
          </div>
        </div>

        <!-- Week Labels -->
        <div class="flex items-center justify-between text-xs text-neutral-500">
          <span>{{ getStartLabel() }}</span>
          <span>Today</span>
        </div>

      </div>
    </div>

    <!-- Legend (compact view toggle) -->
    <div class="flex items-center justify-between border-t border-neutral-700 px-6 py-3">
      <div class="flex items-center gap-4">
        <div
          v-for="(stats, provider) in data?.providerStats"
          :key="`legend-${provider}`"
          class="flex items-center gap-1.5"
        >
          <span
            class="h-2.5 w-2.5 rounded"
            :style="{ backgroundColor: getProviderColor(provider) }"
          />
          <span class="text-xs text-neutral-400">{{ provider }}</span>
        </div>
      </div>
      <button
        class="text-xs text-neutral-400 hover:text-white transition-colors"
        @click="compactView = !compactView"
      >
        {{ compactView ? 'Expand view' : 'Compact view' }}
      </button>
    </div>

    <!-- Trust Stamp -->
    <PulseTrustStamp v-if="data" :last-updated="data.lastUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import { getProviderHeatmapData, type ProviderHeatmapData, type ProviderHeatmapDay } from '~/lib/pulseMockApi'
import { PROVIDER_COLORS } from '~/lib/pulseChartRegistry'

const store = usePulseStore()

const loading = ref(true)
const data = ref<ProviderHeatmapData | null>(null)
const hoveredDay = ref<ProviderHeatmapDay | null>(null)
const compactView = ref(false)

const visibleDays = computed(() => {
  if (!data.value) return []
  const maxVisible = compactView.value ? 90 : 30
  return data.value.days.slice(-maxVisible)
})

const leaderChangeCount = computed(() => {
  if (!data.value || data.value.days.length === 0) return 0
  let changes = 0
  for (let i = 1; i < data.value.days.length; i += 1) {
    if (data.value.days[i].winner !== data.value.days[i - 1].winner) {
      changes += 1
    }
  }
  return changes
})

function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider.toLowerCase()] || '#666'
}

function formatDayLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getStartLabel(): string {
  if (!data.value || data.value.days.length === 0) return ''
  const firstDay = data.value.days[0]
  return new Date(firstDay.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

async function loadData() {
  loading.value = true
  try {
    data.value = await getProviderHeatmapData(store.corridor, store.timeframe)
  } catch (e) {
    console.error('Failed to load heatmap data:', e)
  } finally {
    loading.value = false
  }
}

watch(
  () => [store.corridor, store.timeframe],
  () => loadData(),
  { deep: true }
)

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>



