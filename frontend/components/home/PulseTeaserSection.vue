<script setup lang="ts">
import { computed } from 'vue'
import { useApi } from '~/composables/useApi'
import { useEntitlements } from '~/composables/useEntitlements'

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
const { isPlus } = useEntitlements()

const { data, pending } = await useAsyncData(
  'pulse:teaser',
  () => request<PulseTeaserResponse>('/pulse/teaser', { retries: 0 }),
  { server: true },
)

const movers = computed(() => data.value?.movers ?? [])
const updatedAt = computed(() => data.value?.updatedAt ?? null)
const windowHours = computed(() => data.value?.windowHours ?? 24)
const ctaLabel = computed(() => (isPlus.value ? 'Open Pulse' : 'Preview Pulse'))

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

const formatCorridor = (m: PulseTeaserMover) => {
  const fromFlag = toFlagEmoji(m.fromCountry)
  const toFlag = toFlagEmoji(m.toCountry)
  return {
    fromFlag,
    toFlag,
    label: `${m.sendCurrency} → ${m.recvCurrency}`,
    countries: `${m.fromCountry} → ${m.toCountry}`,
  }
}
</script>

<template>
  <section class="py-14 sm:py-16 bg-gradient-to-b from-white via-white to-slate-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                <span class="h-2 w-2 rounded-full bg-emerald-400" />
                Pulse teaser (real data)
              </div>
              <h2 class="mt-4 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                What’s Moving Right Now
              </h2>
              <p class="mt-2 text-sm sm:text-base text-white/80 max-w-2xl">
                Latest corridor moves from Gold Export. No demos, no made-up numbers.
              </p>
              <p class="mt-3 text-xs text-white/60">
                <span v-if="updatedAt">Updated {{ formatTimestamp(updatedAt) }} UTC</span>
                <span v-else>Warming up (no Gold Export data yet)</span>
                <span class="mx-2">•</span>
                Last {{ windowHours }} hours
              </p>
            </div>

            <NuxtLink
              to="/pulse"
              class="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100 transition"
            >
              {{ ctaLabel }}
            </NuxtLink>
          </div>
        </div>

        <div class="p-6 sm:p-8">
          <div
            v-if="pending"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div
              v-for="n in 6"
              :key="n"
              class="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div class="h-4 w-28 bg-slate-200 rounded mb-3 animate-pulse" />
              <div class="h-8 w-40 bg-slate-200 rounded mb-2 animate-pulse" />
              <div class="h-3 w-24 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>

          <div
            v-else-if="movers.length === 0"
            class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center"
          >
            <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white font-black">
              P
            </div>
            <div class="text-lg font-bold text-slate-900">
              Pulse is warming up
            </div>
            <p class="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
              We do not show placeholder numbers. Once Gold Export has recent corridor buckets, the movers list will appear here.
            </p>
          </div>

          <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div
              v-for="m in movers"
              :key="m.corridorId"
              class="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Corridor
                  </div>
                  <div class="mt-1 flex items-center gap-2">
                    <span class="text-xl">{{ formatCorridor(m).fromFlag }}</span>
                    <span class="text-slate-400">→</span>
                    <span class="text-xl">{{ formatCorridor(m).toFlag }}</span>
                    <span class="text-sm font-bold text-slate-900">
                      {{ formatCorridor(m).label }}
                    </span>
                  </div>
                  <div class="mt-1 text-xs text-slate-500">
                    {{ formatCorridor(m).countries }}
                  </div>
                </div>

                <div
                  class="rounded-xl px-3 py-2 text-xs font-bold"
                  :class="m.deltaPct > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : (m.deltaPct < 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-700 border border-slate-200')"
                >
                  {{ formatPct(m.deltaPct) }}
                </div>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-3">
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Current avg
                  </div>
                  <div class="mt-1 text-sm font-bold text-slate-900">
                    {{ m.currentAvgRate.toFixed(4) }}
                  </div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Providers
                  </div>
                  <div class="mt-1 text-sm font-bold text-slate-900">
                    {{ m.providerCount }}
                  </div>
                </div>
              </div>

              <div class="mt-4 text-[11px] text-slate-500">
                Bucket {{ formatTimestamp(m.timestampBucket) }} UTC
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
