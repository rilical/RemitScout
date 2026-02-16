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
  <section class="py-14 sm:py-16 bg-gradient-to-b from-white via-white to-neutral-50">
    <div class="container">
      <div class="rounded-3xl border border-rs-border bg-surface shadow-sm overflow-hidden">
        <div class="p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-neutral-900 to-primary-900">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-surface/10 px-3 py-1 text-body-sm font-semibold text-white/90">
                <span class="h-2 w-2 rounded-full bg-success-600" />
                Pulse teaser (real data)
              </div>
              <h2 class="mt-4 text-h2 font-extrabold text-white leading-tight">
                What’s Moving Right Now
              </h2>
              <p class="mt-2 text-body-sm text-white/80 max-w-2xl">
                Latest corridor moves from Gold Export. No demos, no made-up numbers.
              </p>
              <p class="mt-3 text-body-sm text-white/60">
                <span v-if="updatedAt">Updated {{ formatTimestamp(updatedAt) }} UTC</span>
                <span v-else>Warming up (no Gold Export data yet)</span>
                <span class="mx-2">•</span>
                Last {{ windowHours }} hours
              </p>
            </div>

            <NuxtLink
              to="/pulse"
              class="inline-flex items-center justify-center rounded-2xl bg-surface px-5 py-3 text-body-sm font-bold text-rs-fg hover:bg-neutral-100 transition"
            >
              {{ ctaLabel }}
            </NuxtLink>
          </div>
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
              class="rounded-2xl border border-rs-border bg-neutral-50 p-5"
            >
              <SkeletonBlock
                width="7rem"
                height="16"
                class="mb-3"
              />
              <SkeletonBlock
                width="10rem"
                height="32"
                class="mb-2"
              />
              <SkeletonBlock
                width="6rem"
                height="12"
              />
            </div>
	          </div>
	        </div>

	        <div
	          v-else-if="movers.length === 0"
	          class="rounded-2xl border border-dashed border-rs-border bg-neutral-50 p-8 text-center"
	        >
	          <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white font-black">
	            P
	          </div>
	          <div class="text-body-lg font-bold text-rs-fg">
	            Pulse is warming up
	          </div>
	          <p class="mt-2 text-body-sm text-neutral-600 max-w-xl mx-auto">
	            We do not show placeholder numbers. Once Gold Export has recent corridor buckets, the movers list will appear here.
	          </p>
	        </div>

	        <div
	          v-else
	          class="p-4 sm:p-6"
	        >
	          <!-- Live data grid -->
	          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="m in movers"
              :key="m.corridorId"
              class="rounded-2xl border border-rs-border bg-surface p-5 hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-body-sm font-semibold text-rs-muted uppercase tracking-wide">
                    Corridor
                  </div>
                  <div class="mt-1 flex items-center gap-2">
                    <span class="text-h4">{{ formatCorridor(m).fromFlag }}</span>
                    <span class="text-neutral-400">→</span>
                    <span class="text-h4">{{ formatCorridor(m).toFlag }}</span>
                    <span class="text-body-sm font-bold text-rs-fg">
                      {{ formatCorridor(m).label }}
                    </span>
                  </div>
                  <div class="mt-1 text-body-sm text-rs-muted">
                    {{ formatCorridor(m).countries }}
                  </div>
                </div>

                <div
                  class="rounded-xl px-3 py-2 text-body-sm font-bold"
                  :class="m.deltaPct > 0 ? 'bg-success-600 text-success-600 border border-success-600' : (m.deltaPct < 0 ? 'bg-danger-600 text-danger-600 border border-danger-600' : 'bg-neutral-50 text-neutral-700 border border-rs-border')"
                >
                  {{ formatPct(m.deltaPct) }}
                </div>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-3">
                <div class="rounded-xl border border-rs-border bg-neutral-50 p-3">
                  <div class="text-[11px] font-semibold text-rs-muted uppercase tracking-wide">
                    Current avg
                  </div>
                  <div class="mt-1 text-body-sm font-bold text-rs-fg">
                    {{ m.currentAvgRate.toFixed(4) }}
                  </div>
                </div>
                <div class="rounded-xl border border-rs-border bg-neutral-50 p-3">
                  <div class="text-[11px] font-semibold text-rs-muted uppercase tracking-wide">
                    Providers
                  </div>
                  <div class="mt-1 text-body-sm font-bold text-rs-fg">
                    {{ m.providerCount }}
                  </div>
                </div>
              </div>

              <div class="mt-4 text-[11px] text-rs-muted">
                Bucket {{ formatTimestamp(m.timestampBucket) }} UTC
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
