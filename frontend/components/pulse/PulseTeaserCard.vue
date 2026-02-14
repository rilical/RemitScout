<script setup lang="ts">
import { computed } from 'vue'
import { useApi } from '~/composables/useApi'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'

type PulseTeaserMover = {
  corridorId: string
  fromCountry: string
  toCountry: string
  sendCurrency: string
  recvCurrency: string
  currentAvgRate: number
  prevAvgRate: number
  deltaPct: number
  providerCount: number
  timestampBucket: string
}

type PulseTeaserResponse = {
  success: true
  updatedAt: string | null
  windowHours: number
  movers: PulseTeaserMover[]
}

const { request } = useApi()
const { data, pending } = await useAsyncData(
  'pulse:teaser:card',
  () => request<PulseTeaserResponse>('/pulse/teaser', { retries: 0 }),
  { server: true },
)

const movers = computed(() => data.value?.movers ?? [])
const updatedAt = computed(() => data.value?.updatedAt ?? null)

const formatPct = (value: number) => {
  const pct = value * 100
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

const formatTimestamp = (iso: string | null) => {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().replace('T', ' ').slice(0, 16)
}

const toFlagEmoji = (code: string) => {
  const normalized = (code || '').trim().toUpperCase()
  if (normalized.length !== 2) return '🌍'
  const base = 0x1f1e6
  return String.fromCodePoint(
    base + normalized.charCodeAt(0) - 65,
    base + normalized.charCodeAt(1) - 65,
  )
}
</script>

<template>
  <div class="rounded-2xl border border-neutral-700 bg-neutral-900/40 p-6 text-left">
    <div class="flex items-center justify-between gap-4">
      <div>
        <div class="text-body-sm font-semibold text-neutral-200">
          Preview (real data)
        </div>
        <div class="text-body-sm text-neutral-400">
          <span v-if="updatedAt">Updated {{ formatTimestamp(updatedAt) }} UTC</span>
          <span v-else>Warming up (no Gold Export data yet)</span>
        </div>
      </div>
      <span class="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-[11px] font-semibold text-neutral-300">
        Plus-gated
      </span>
    </div>

    <div class="mt-4">
      <div
        v-if="pending"
        class="space-y-3"
      >
        <SkeletonBlock
          v-for="n in 3"
          :key="n"
          height="64"
          rounded="xl"
          tone="dark"
          class="border border-neutral-800"
        />
      </div>

      <div
        v-else-if="movers.length === 0"
        class="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-body-sm text-neutral-400"
      >
        No movers yet. Once Gold Export publishes corridor buckets, this preview will populate automatically.
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="m in movers.slice(0, 3)"
          :key="m.corridorId"
          class="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-body-sm font-semibold text-white">
                <span class="mr-2">{{ toFlagEmoji(m.fromCountry) }}</span>
                {{ m.sendCurrency }} → {{ m.recvCurrency }}
                <span class="ml-2 text-neutral-500 text-body-sm">({{ m.fromCountry }}→{{ m.toCountry }})</span>
              </div>
              <div class="mt-1 text-body-sm text-neutral-400">
                Current avg {{ m.currentAvgRate.toFixed(4) }} • Providers {{ m.providerCount }}
              </div>
            </div>
            <div
              class="rounded-lg px-2.5 py-1 text-body-sm font-bold"
              :class="m.deltaPct > 0 ? 'bg-success-600/15 text-success-600 border border-success-600/30' : (m.deltaPct < 0 ? 'bg-danger-600/15 text-danger-600 border border-danger-600/30' : 'bg-neutral-800 text-neutral-200 border border-neutral-700')"
            >
              {{ formatPct(m.deltaPct) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
