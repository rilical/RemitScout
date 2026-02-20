<template>
  <div class="sticky top-0 z-40 border-b border-neutral-700 bg-neutral-900/90 backdrop-blur">
    <div class="mx-auto max-w-page px-page-x py-3">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <div
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
            :class="dataAvailable ? 'border-success-600/30 bg-success-600/10 text-success-600' : 'border-neutral-700 bg-neutral-950 text-neutral-400'"
          >
            <span
              class="h-2 w-2 rounded-full"
              :class="dataAvailable ? 'bg-success-600' : 'bg-neutral-500'"
              aria-hidden="true"
            />
            <span>{{ dataAvailable ? 'Data available' : 'Warming up' }}</span>
          </div>

          <div class="text-body-sm text-neutral-200">
            Updated <span class="font-semibold">{{ updatedAtLabel }}</span>
          </div>

          <div class="hidden h-4 w-px bg-neutral-700 lg:block" />

          <div class="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            {{ methodProfileLabel }}
            <span class="text-neutral-700">|</span>
            Bucket {{ amountBucket }}
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span
              v-if="badges.suppressed"
              class="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-400"
            >
              Suppressed
            </span>
            <span
              v-if="badges.lowConfidence"
              class="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-400"
            >
              Low confidence
            </span>
            <span
              v-if="badges.staleQuotes"
              class="rounded-full border border-danger-600/30 bg-danger-600/10 px-2 py-1 text-[11px] font-semibold text-danger-500"
            >
              Stale quotes
            </span>
            <span
              v-if="badges.staleFx"
              class="rounded-full border border-danger-600/30 bg-danger-600/10 px-2 py-1 text-[11px] font-semibold text-danger-500"
            >
              Stale FX
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <button
            type="button"
            class="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-body-sm font-semibold text-neutral-200 hover:border-brand-600/60"
            @click="drawerOpen = !drawerOpen"
          >
            Why?
          </button>
        </div>
      </div>

      <div
        v-if="drawerOpen"
        class="mt-3 rounded-xl border border-neutral-700 bg-neutral-950 p-4"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="text-body-sm font-semibold text-neutral-200">
            Provenance (per panel)
          </div>
          <button
            type="button"
            class="text-body-sm font-semibold text-neutral-400 hover:text-neutral-200"
            @click="drawerOpen = false"
          >
            Close
          </button>
        </div>

        <div class="mt-3 grid gap-2 md:grid-cols-2">
          <div
            v-for="panel in panels"
            :key="panel.id"
            class="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="text-body-sm font-semibold text-white">
                {{ panel.label }}
              </div>
              <div
                class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                :class="panel.dataAvailable ? 'border-success-600/30 bg-success-600/10 text-success-600' : 'border-neutral-700 bg-neutral-950 text-neutral-500'"
              >
                {{ panel.dataAvailable ? 'OK' : 'Empty' }}
              </div>
            </div>
            <div class="mt-1 text-[11px] text-neutral-400">
              <span class="font-semibold text-neutral-300">Source:</span>
              <span>{{ panel.source || '—' }}</span>
              <span class="text-neutral-700">|</span>
              <span class="font-semibold text-neutral-300">Updated:</span>
              <span>{{ formatUpdatedAt(panel.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <div class="mt-3 text-[11px] text-neutral-500">
          Pulse will never invent timestamps or values. If a panel is missing inputs, it shows as empty.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatUpdatedLabel } from '~/shared/lib/format'

export type PulseTruthPanel = {
  id: string
  label: string
  source: string | null
  updatedAt: string | null
  dataAvailable: boolean
}

interface Props {
  updatedAt: string | null
  dataAvailable: boolean
  methodProfile: string
  amountBucket: number
  badges: {
    suppressed: boolean
    lowConfidence: boolean
    staleQuotes: boolean
    staleFx: boolean
  }
  panels: PulseTruthPanel[]
}

const props = defineProps<Props>()

const drawerOpen = ref(false)

const updatedAtLabel = computed(() => {
  if (!props.updatedAt) return '—'
  return formatUpdatedLabel(props.updatedAt)
})

const methodProfileLabel = computed(() => {
  if (props.methodProfile === 'cash_pickup') return 'cash pickup'
  if (props.methodProfile === 'standard_card') return 'standard card'
  return 'standard bank'
})

const formatUpdatedAt = (value: string | null) => {
  if (!value) return '—'
  return formatUpdatedLabel(value)
}
</script>
