<template>
  <div class="card-surface overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
      <div>
        <h2 class="text-body-lg font-bold text-white">
          Winner Timeline
        </h2>
        <p class="text-body-sm text-neutral-400">
          Who led on delivered amount each day
        </p>
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
          <span class="text-body-sm text-neutral-400">{{ provider }}</span>
          <span class="text-body-sm font-semibold text-white text-mono-value">{{ stats.percentage }}%</span>
        </div>
        <div class="flex items-center gap-2 text-body-sm text-neutral-400">
          <span class="h-2.5 w-2.5 rounded-full bg-neutral-600" />
          <span>Leader changes</span>
          <span class="text-body-sm font-semibold text-white text-mono-value">{{ leaderChangeCount }}</span>
        </div>
      </div>
    </div>

    <!-- Heatmap Timeline -->
    <div class="p-4">
      <div
        v-if="loading"
        class="flex h-24 w-full items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Loading chart"
      >
        <SkeletonBlock
          width="full"
          height="6rem"
          tone="dark"
        />
        <span class="sr-only">Loading chart</span>
      </div>

      <div
        v-else
        class="space-y-4"
      >
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
                class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-label text-neutral-500"
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
            <div class="mb-2 text-body-sm font-medium text-white">
              {{ hoveredDay.date }}
            </div>
            <div class="flex items-center gap-2">
              <span
                class="h-3 w-3 rounded"
                :style="{ backgroundColor: hoveredDay.winnerColor }"
              />
              <span class="text-body-sm text-neutral-300">{{ hoveredDay.winner }}</span>
              <span class="text-body-sm font-semibold text-brand-600">was leader</span>
            </div>
            <div class="mt-1 text-body-sm text-neutral-500 text-mono-value">
              Edge ~${{ hoveredDay.savings.toFixed(2) }} vs #2
            </div>
          </div>
        </div>

        <!-- Week Labels -->
        <div class="flex items-center justify-between text-body-sm text-neutral-500">
          <span>{{ getStartLabel() }}</span>
          <span>Today</span>
        </div>
      </div>
    </div>

    <!-- Legend (compact view toggle) -->
    <div class="flex items-center justify-between border-t border-white/[0.08] px-6 py-3">
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
          <span class="text-body-sm text-neutral-400">{{ provider }}</span>
        </div>
      </div>
      <button
        class="text-body-sm text-neutral-400 hover:text-white transition-colors focus-ring-dark"
        @click="compactView = !compactView"
      >
        {{ compactView ? 'Expand view' : 'Compact view' }}
      </button>
    </div>

    <!-- Trust Stamp -->
    <PulseTrustStamp
      v-if="data"
      :last-updated="data.lastUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import { getProviderHeatmapData, type ProviderHeatmapData, type ProviderHeatmapDay } from '~/lib/pulseApi'
import { PROVIDER_COLORS } from '~/lib/pulseChartRegistry'
import { formatMonthDay } from '~/shared/lib/format'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'

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
  return formatMonthDay(new Date(timestamp))
}

function getStartLabel(): string {
  if (!data.value || data.value.days.length === 0) return ''
  const firstDay = data.value.days[0]
  return formatMonthDay(new Date(firstDay.timestamp))
}

async function loadData() {
  loading.value = true
  try {
    data.value = await getProviderHeatmapData(store.corridor, store.timeframe)
  }
  catch (e) {
    useLogger('PulseProviderHeatmap').error('Failed to load heatmap data', e)
  }
  finally {
    loading.value = false
  }
}

watch(
  () => [store.corridor, store.timeframe],
  () => loadData(),
  { deep: true },
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
