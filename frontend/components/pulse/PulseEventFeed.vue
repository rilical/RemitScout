<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden flex flex-col h-full">
    <div class="border-b border-neutral-700 px-6 py-4">
      <h2 class="text-lg font-bold text-white">Market Events</h2>
      <p class="text-sm text-neutral-400">Spikes, outages, and anomalies detected in this corridor</p>
    </div>

    <div class="px-6 py-4 flex-1 flex flex-col">
      <div v-if="loading" class="flex h-32 items-center justify-center">
        <div class="flex items-center gap-3 text-neutral-400">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Scanning events...
        </div>
      </div>

      <div v-else class="space-y-6 flex-1">
        <div
          v-for="event in events"
          :key="event.id"
          class="flex items-start justify-between gap-4 rounded-lg border border-neutral-700 bg-neutral-900 p-4"
        >
          <div class="flex items-start gap-3">
            <span class="mt-1 h-2.5 w-2.5 rounded-full" :class="getSeverityColor(event.severity)" />
            <div>
              <div class="flex items-center gap-2 text-sm text-neutral-500">
                <span>{{ formatTimestamp(event.timestamp) }}</span>
                <span class="uppercase tracking-wider text-[10px]" :class="getSeverityText(event.severity)">
                  {{ event.severity.toUpperCase() }}
                </span>
              </div>
              <div class="text-sm font-semibold text-white">{{ event.title }}</div>
              <div class="text-xs text-neutral-400">{{ event.description }}</div>
            </div>
          </div>

          <button
            v-if="event.chartId"
            type="button"
            class="shrink-0 rounded-md border border-neutral-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700"
            @click="$emit('view', event.chartId)"
          >
            View
          </button>
        </div>
      </div>
    </div>

    <div class="border-t border-neutral-700 px-6 py-3 text-xs text-neutral-500">
      Events are derived from automated quote monitoring and anomaly detection.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import { getPulseEventFeed } from '~/lib/pulseMockApi'
import type { PulseEventItem } from '~/types/pulse'

const store = usePulseStore()
const events = ref<PulseEventItem[]>([])
const loading = ref(true)

defineEmits<{
  view: [chartId: string]
}>()

function getSeverityColor(level: PulseEventItem['severity']) {
  if (level === 'high') return 'bg-danger-600'
  if (level === 'medium') return 'bg-amber-500'
  return 'bg-brand-600'
}

function getSeverityText(level: PulseEventItem['severity']) {
  if (level === 'high') return 'text-danger-600'
  if (level === 'medium') return 'text-amber-400'
  return 'text-brand-600'
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function loadData() {
  loading.value = true
  try {
    events.value = await getPulseEventFeed(store.corridor, store.timeframe)
  } catch (e) {
    console.error('Failed to load event feed:', e)
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
