<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { useEntitlements } from '~/composables/useEntitlements'
import { Icon } from '~/ui'
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

// Relative time for data freshness
const relativeTime = ref('')
let timeInterval: ReturnType<typeof setInterval> | null = null

const updateRelativeTime = () => {
  if (!updatedAt.value) {
    relativeTime.value = ''
    return
  }
  const date = new Date(updatedAt.value)
  if (Number.isNaN(date.getTime())) {
    relativeTime.value = ''
    return
  }
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) {
    relativeTime.value = 'Updated just now'
  }
 else if (diffMins < 60) {
    relativeTime.value = `Updated ${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  }
 else {
    const diffHours = Math.floor(diffMins / 60)
    relativeTime.value = `Updated ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  }
}

onMounted(() => {
  updateRelativeTime()
  timeInterval = setInterval(updateRelativeTime, 30000) // Update every 30 seconds
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})

const formatPct = (value: number) => {
  const pct = value * 100
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

const isSignificantMove = (deltaPct: number) => Math.abs(deltaPct * 100) > 2

const toFlagEmoji = (code: string) => {
  const normalized = (code || '').trim().toUpperCase()
  if (normalized.length !== 2) return null
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
  <section class="py-14 sm:py-16 bg-gradient-to-b from-white via-white to-neutral-50">
    <div class="container">
      <div class="rounded-3xl border border-rs-border bg-surface shadow-lg overflow-hidden">
        <!-- Header with dark gradient -->
        <div class="p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-neutral-900 to-primary-900">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <!-- Live indicator with pulse glow -->
              <div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-surface/10 px-3 py-1 text-body-sm font-semibold text-white/90">
                <span
                  class="h-2.5 w-2.5 rounded-full bg-emerald-400 motion-safe:animate-pulse-glow"
                  aria-hidden="true"
                />
                <span>Live data</span>
              </div>

              <!-- Gradient heading -->
              <h2 class="mt-4 text-h2 font-extrabold leading-tight">
                <span class="bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent">
                  What's Moving Right Now
                </span>
              </h2>
              <p class="mt-2 text-body-sm text-white/80 max-w-2xl">
                Latest corridor moves from Gold Export. No demos, no made-up numbers.
              </p>

              <!-- Data freshness with relative time -->
              <div class="mt-3 flex items-center gap-2 text-body-sm text-white/60">
                <Icon
                  name="clock"
                  :size="16"
                  class="text-current"
                />
                <span v-if="relativeTime">{{ relativeTime }}</span>
                <span v-else-if="updatedAt">Warming up...</span>
                <span v-else>Warming up (no Gold Export data yet)</span>
                <span class="mx-1.5 text-white/30">|</span>
                <span>Last {{ windowHours }}h</span>
              </div>
            </div>

            <NuxtLink
              to="/pulse"
              class="inline-flex items-center justify-center gap-2 rounded-2xl bg-surface px-5 py-3 text-body-sm font-bold text-rs-fg hover:bg-neutral-100 hover:shadow-lg motion-safe:transition-all group"
            >
              {{ ctaLabel }}
              <Icon
                name="arrow-right"
                :size="16"
                class="text-current motion-safe:transition-transform group-hover:translate-x-0.5"
              />
            </NuxtLink>
          </div>
        </div>

        <!-- Loading state -->
        <div
          v-if="pending"
          class="p-6 sm:p-8"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <!-- Empty state -->
        <div
          v-else-if="movers.length === 0"
          class="p-6 sm:p-8"
        >
          <div class="rounded-2xl border border-dashed border-rs-border bg-neutral-50 p-8 text-center">
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
        </div>

        <!-- Live data grid with staggered animations -->
        <div
          v-else
          class="p-6 sm:p-8"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="(m, index) in movers"
              :key="m.corridorId"
              class="relative rounded-2xl border border-rs-border bg-surface p-5 hover:shadow-xl hover:-translate-y-1 motion-safe:transition-all motion-safe:animate-fade-in-up-stagger overflow-hidden group"
              :style="{ animationDelay: `${index * 80}ms` }"
            >
              <!-- Left border accent based on delta -->
              <div
                class="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                :class="m.deltaPct > 0 ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' : (m.deltaPct < 0 ? 'bg-gradient-to-b from-red-400 to-red-600' : 'bg-neutral-300')"
              />

              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-[11px] font-semibold text-rs-muted uppercase tracking-wider">
                    Corridor
                  </div>
                  <div class="mt-1.5 flex items-center gap-2">
                    <!-- Country flags -->
                    <span
                      v-if="formatCorridor(m).fromFlag"
                      class="text-xl"
                      :aria-label="m.fromCountry"
                    >{{ formatCorridor(m).fromFlag }}</span>
                    <span
                      v-else
                      class="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-600"
                    >{{ m.fromCountry }}</span>

                    <Icon
                      name="arrow-right"
                      :size="16"
                      class="text-neutral-400"
                    />

                    <span
                      v-if="formatCorridor(m).toFlag"
                      class="text-xl"
                      :aria-label="m.toCountry"
                    >{{ formatCorridor(m).toFlag }}</span>
                    <span
                      v-else
                      class="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-600"
                    >{{ m.toCountry }}</span>

                    <span class="text-body-sm font-bold text-rs-fg truncate">
                      {{ formatCorridor(m).label }}
                    </span>
                  </div>
                  <div class="mt-1 text-[11px] text-rs-muted">
                    {{ formatCorridor(m).countries }}
                  </div>
                </div>

                <!-- Delta badge with gradient and pulse for significant moves -->
                <div
                  class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-body-sm font-bold shrink-0"
                  :class="[
                    m.deltaPct > 0
                      ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200'
                      : (m.deltaPct < 0
                        ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                        : 'bg-neutral-50 text-neutral-700 border border-rs-border'),
                    isSignificantMove(m.deltaPct) ? 'motion-safe:animate-delta-pulse' : '',
                  ]"
                >
                  <Icon
                    :name="m.deltaPct >= 0 ? 'arrow-up' : 'arrow-down'"
                    :size="16"
                    class="text-current"
                  />
                  {{ formatPct(m.deltaPct) }}
                </div>
              </div>

              <!-- Stats row -->
              <div class="mt-4 grid grid-cols-2 gap-3">
                <div class="rounded-xl border border-rs-border bg-neutral-50/80 p-3 group-hover:bg-neutral-50 motion-safe:transition-colors">
                  <div class="text-[10px] font-semibold text-rs-muted uppercase tracking-wider">
                    Current avg
                  </div>
                  <div class="mt-1 text-body-sm font-bold text-rs-fg tabular-nums">
                    {{ m.currentAvgRate.toFixed(4) }}
                  </div>
                </div>
                <div class="rounded-xl border border-rs-border bg-neutral-50/80 p-3 group-hover:bg-neutral-50 motion-safe:transition-colors">
                  <div class="text-[10px] font-semibold text-rs-muted uppercase tracking-wider">
                    Providers
                  </div>
                  <div class="mt-1 text-body-sm font-bold text-rs-fg">
                    {{ m.providerCount }}
                  </div>
                </div>
              </div>

              <div class="mt-3 text-[10px] text-rs-muted/70 tabular-nums">
                Bucket {{ new Date(m.timestampBucket).toISOString().replace('T', ' ').slice(0, 16) }} UTC
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
