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
        View quote snapshots for {{ props.corridors.length }} corridors
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
          value="dataPoints"
          class="bg-neutral-800"
        >
          Most data
        </option>
        <option
          value="recent"
          class="bg-neutral-800"
        >
          Recently updated
        </option>
        <option
          value="name"
          class="bg-neutral-800"
        >
          Alphabetical
        </option>
      </select>
    </div>

    <div
      v-if="groupedCorridors.length === 0"
      class="py-12 text-center text-neutral-400"
    >
      No corridors match your search.
    </div>

    <div
      v-for="[country, items] in groupedCorridors"
      :key="country"
      class="mb-8"
    >
      <h3 class="mb-3 text-body-sm font-semibold uppercase tracking-wider text-neutral-500">
        {{ country }}
      </h3>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          v-for="c in items"
          :key="c.corridorId || c.value"
          type="button"
          class="group w-full cursor-pointer rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-800/80 to-neutral-800/40 p-5 text-left transition-all duration-300 hover:border-white/20 hover:scale-[1.01]"
          :aria-label="`View corridor ${c.label}`"
          @click="$emit('corridor-click', c)"
        >
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 text-h3">
                <span>{{ c.fromFlag }}</span>
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
                <span>{{ c.toFlag }}</span>
              </div>
              <span class="font-semibold text-white group-hover:text-primary-400 transition-colors">{{ c.label }}</span>
            </div>
            <span
              class="relative flex h-2.5 w-2.5 shrink-0"
              :title="freshnessTitle(c)"
            >
              <span
                v-if="freshnessColor(c) === 'green'"
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-600 opacity-75"
              />
              <span
                class="relative inline-flex h-2.5 w-2.5 rounded-full"
                :class="freshnessClasses(c)"
              />
            </span>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="rounded-xl bg-surface/5 p-3">
              <div class="text-body-sm text-rs-muted mb-1">
                Data points
              </div>
              <div class="font-semibold text-white tabular-nums">
                {{ formatDataPoints(c.dataPoints) }}
              </div>
            </div>
            <div class="rounded-xl bg-surface/5 p-3">
              <div class="text-body-sm text-rs-muted mb-1">
                Tier
              </div>
              <div class="font-semibold text-white">
                {{ c.dataTier || c.collectionTier || '—' }}
              </div>
            </div>
            <div class="rounded-xl bg-surface/5 p-3">
              <div class="text-body-sm text-rs-muted mb-1">
                Updated
              </div>
              <div class="font-semibold text-white">
                {{ formatLastUpdated(c.lastUpdated || c.maxDate) }}
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CorridorOption } from '~/types/pulse'

const props = defineProps<{ corridors: CorridorOption[] }>()

defineEmits<{
  'corridor-click': [corridor: CorridorOption]
}>()

const search = ref('')
const sortBy = ref('dataPoints')

const filteredCorridors = computed(() => {
  const q = search.value.toLowerCase()
  let items = props.corridors
  if (q) {
    items = items.filter(c =>
      c.label.toLowerCase().includes(q)
      || (c.sourceCountry ?? '').toLowerCase().includes(q)
      || (c.destCountry ?? '').toLowerCase().includes(q)
      || c.fromCode.toLowerCase().includes(q)
      || c.toCode.toLowerCase().includes(q),
    )
  }
  return [...items].sort((a, b) => {
    if (sortBy.value === 'dataPoints') return (b.dataPoints ?? 0) - (a.dataPoints ?? 0)
    if (sortBy.value === 'recent') {
      const ta = a.lastUpdated || a.maxDate || ''
      const tb = b.lastUpdated || b.maxDate || ''
      return tb.localeCompare(ta)
    }
    return a.label.localeCompare(b.label)
  })
})

const groupedCorridors = computed(() => {
  const groups: Record<string, CorridorOption[]> = {}
  for (const c of filteredCorridors.value) {
    const country = c.sourceCountry ?? c.fromCode ?? 'Other'
    if (!groups[country]) groups[country] = []
    groups[country].push(c)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
})

const MS_24H = 24 * 60 * 60 * 1000
const MS_7D = 7 * 24 * 60 * 60 * 1000

function freshnessColor(c: CorridorOption): 'green' | 'amber' | 'gray' {
  const raw = c.maxDate || c.lastUpdated
  if (!raw) return 'gray'
  const ts = new Date(raw).getTime()
  if (Number.isNaN(ts)) return 'gray'
  const age = Date.now() - ts
  if (age <= MS_24H) return 'green'
  if (age <= MS_7D) return 'amber'
  return 'gray'
}

function freshnessClasses(c: CorridorOption): string {
  const color = freshnessColor(c)
  if (color === 'green') return 'bg-success-600'
  if (color === 'amber') return 'bg-amber-500'
  return 'bg-neutral-500'
}

function freshnessTitle(c: CorridorOption): string {
  const color = freshnessColor(c)
  if (color === 'green') return 'Data updated within 24 hours'
  if (color === 'amber') return 'Data updated within 7 days'
  return 'Data older than 7 days'
}

function formatDataPoints(n?: number): string {
  if (n == null) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function formatLastUpdated(raw?: string | null): string {
  if (!raw) return '—'
  const ts = new Date(raw).getTime()
  if (Number.isNaN(ts)) return '—'
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
</script>
