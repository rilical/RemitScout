<script setup lang="ts">
import { computed } from 'vue'
import { useApi } from '~/composables/useApi'
import { useEntitlements } from '~/composables/useEntitlements'
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

const placeholderPairs = ['USD/MXN', 'USD/INR', 'GBP/PKR', 'EUR/NGN', 'USD/PHP', 'CAD/INR']
</script>

<template>
  <section class="py-14 sm:py-16 bg-neutral-900">
    <div class="container">
      <!-- Terminal header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-h2 font-extrabold text-white leading-tight">
            Remit-Scout Pulse
          </h2>
          <p class="mt-1 text-body-sm text-neutral-400">
            <span v-if="updatedAt">Updated {{ formatTimestamp(updatedAt) }} UTC</span>
            <span v-else>Awaiting Gold Export data</span>
            <span class="mx-2 text-neutral-600">|</span>
            Last {{ windowHours }}h window
          </p>
        </div>
        <NuxtLink
          to="/pulse"
          class="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-body-sm font-bold text-white hover:bg-brand-700 transition"
        >
          {{ ctaLabel }}
        </NuxtLink>
      </div>

      <!-- Terminal body -->
      <div class="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        <!-- Status bar -->
        <div class="flex items-center gap-3 px-4 py-2 border-b border-neutral-800 bg-neutral-900/80">
          <span
            class="h-2 w-2 rounded-full"
            :class="movers.length > 0 ? 'bg-success-500' : 'bg-warning-500 animate-pulse'"
          />
          <span class="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
            {{ movers.length > 0 ? 'LIVE' : 'STANDBY' }}
          </span>
          <span class="text-[11px] font-mono text-neutral-600 ml-auto">
            CORRIDORS: {{ movers.length }} | SRC: GOLD EXPORT
          </span>
        </div>

        <!-- Loading state -->
        <div
          v-if="pending"
          class="p-6"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="n in 6"
              :key="n"
              class="rounded-lg border border-neutral-800 bg-neutral-800/50 p-4"
            >
              <SkeletonBlock
                width="5rem"
                height="12"
                class="mb-3 !bg-neutral-700"
              />
              <SkeletonBlock
                width="8rem"
                height="24"
                class="mb-2 !bg-neutral-700"
              />
              <SkeletonBlock
                width="4rem"
                height="10"
                class="!bg-neutral-700"
              />
            </div>
          </div>
        </div>

        <!-- Empty / warming up — terminal placeholder grid -->
        <div
          v-else-if="movers.length === 0"
          class="p-6"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="(pair, idx) in placeholderPairs"
              :key="idx"
              class="rounded-lg border border-neutral-800 bg-neutral-800/30 p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="text-[11px] font-mono uppercase tracking-wider text-neutral-600">
                  {{ pair }}
                </div>
                <div class="text-[11px] font-mono text-neutral-700">
                  --
                </div>
              </div>
              <div class="h-8 flex items-end gap-px mb-2">
                <div
                  v-for="bar in 12"
                  :key="bar"
                  class="flex-1 bg-neutral-800 rounded-sm"
                  :style="{ height: `${8 + ((idx * 7 + bar * 13) % 92)}%`, opacity: 0.3 }"
                />
              </div>
              <div class="flex justify-between text-[10px] font-mono text-neutral-700">
                <span>AVG --</span>
                <span>CHG --%</span>
              </div>
            </div>
          </div>
          <div class="mt-4 text-center">
            <p class="text-[11px] font-mono text-neutral-600 uppercase tracking-wider">
              Awaiting live corridor data from Gold Export pipeline
            </p>
          </div>
        </div>

        <!-- Live data grid -->
        <div
          v-else
          class="p-4 sm:p-6"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="m in movers"
              :key="m.corridorId"
              class="rounded-lg border border-neutral-800 bg-neutral-800/40 p-4 hover:bg-neutral-800/60 transition"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                    {{ formatCorridor(m).label }}
                  </div>
                  <div class="mt-1 flex items-center gap-2">
                    <span class="text-h4">{{ formatCorridor(m).fromFlag }}</span>
                    <span class="text-neutral-600 font-mono">&rarr;</span>
                    <span class="text-h4">{{ formatCorridor(m).toFlag }}</span>
                  </div>
                </div>

                <div
                  class="rounded px-2 py-1 text-body-sm font-mono font-bold"
                  :class="m.deltaPct > 0 ? 'bg-success-600/15 text-success-400' : (m.deltaPct < 0 ? 'bg-danger-600/15 text-danger-400' : 'bg-neutral-800 text-neutral-400')"
                >
                  {{ formatPct(m.deltaPct) }}
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <div class="text-[10px] font-mono uppercase tracking-wider text-neutral-600">
                    AVG RATE
                  </div>
                  <div class="mt-0.5 text-body-sm font-mono font-bold text-white">
                    {{ m.currentAvgRate.toFixed(4) }}
                  </div>
                </div>
                <div>
                  <div class="text-[10px] font-mono uppercase tracking-wider text-neutral-600">
                    PROVIDERS
                  </div>
                  <div class="mt-0.5 text-body-sm font-mono font-bold text-white">
                    {{ m.providerCount }}
                  </div>
                </div>
              </div>

              <div class="mt-3 text-[10px] font-mono text-neutral-600">
                {{ formatTimestamp(m.timestampBucket) }} UTC
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
