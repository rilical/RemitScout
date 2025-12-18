<template>
  <div class="flex items-center gap-2">
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      @click="handleSave"
    >
      <span aria-hidden="true">⭐</span>
      <span>{{ saved ? 'Saved' : 'Save' }}</span>
    </button>

    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      @click="handleOpenAlert"
    >
      <span aria-hidden="true">🔔</span>
      <span>Set alert</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { WatchTarget } from '~/types/tracking'

const props = defineProps<{
  target: WatchTarget
  label?: string
  source?: 'compare' | 'exchange_rates' | 'pulse' | 'guide' | 'other'
}>()

const watchlist = useWatchlist()
const modal = useSaveAlertModal()

const saved = computed(() => watchlist.isSaved(props.target))

const handleSave = () => {
  watchlist.save(props.target, props.label ? { label: props.label } : undefined)
}

const handleOpenAlert = () => {
  modal.open({
    target: props.target,
    label: props.label,
    source: props.source,
  })
}
</script>
