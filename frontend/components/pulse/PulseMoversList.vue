<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useWatchlist } from '~/composables/useWatchlist'
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

const props = withDefaults(defineProps<{
  variant?: 'public' | 'plus'
  limit?: number
  selectedCorridorId?: string | null
}>(), {
  variant: 'public',
  limit: 10,
  selectedCorridorId: null,
})

const emit = defineEmits<{
  select: [mover: PulseTeaserMover]
  added: [mover: PulseTeaserMover]
}>()

const { request } = useApi()
const watchlist = useWatchlist()
const { isPlus } = useEntitlements()

const actionError = ref<string | null>(null)

const { data, pending } = await useAsyncData(
  'pulse:teaser:movers',
  () => request<PulseTeaserResponse>('/pulse/teaser', { retries: 0 }),
  { server: true },
)

const updatedAt = computed(() => data.value?.updatedAt ?? null)
const windowHours = computed(() => data.value?.windowHours ?? 24)
const apiMovers = computed(() => (data.value?.movers ?? []).slice(0, props.limit))
const movers = computed(() => apiMovers.value)

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

const deltaClass = (deltaPct: number) => {
  if (deltaPct > 0) return 'bg-success-600/15 text-success-400 border border-success-600/30'
  if (deltaPct < 0) return 'bg-danger-600/15 text-danger-400 border border-danger-600/30'
  return 'bg-white/[0.04] text-neutral-300 border border-white/[0.08]'
}

const borderClass = (deltaPct: number) => {
  if (deltaPct > 0) return 'border-l-emerald-500'
  if (deltaPct < 0) return 'border-l-red-500'
  return 'border-l-neutral-600'
}

function generateSparklinePath(seed: number, trending: 'up' | 'down' | 'flat'): string {
  const points: number[] = []
  let value = 50
  for (let i = 0; i < 7; i++) {
    const noise = ((seed * (i + 1) * 7919) % 20) - 10
    if (trending === 'up') value += noise + 3
    else if (trending === 'down') value += noise - 3
    else value += noise
    points.push(Math.max(5, Math.min(95, value)))
  }
  return points.map((y, i) => `${i * 10},${100 - y}`).join(' ')
}

const isSaved = (m: PulseTeaserMover) => {
  return watchlist.isSaved({ type: 'corridor', from: m.fromCountry, to: m.toCountry, method: 'bank' })
}

const canShowAdd = computed(() => props.variant === 'plus' && isPlus.value)

const handleSelect = (m: PulseTeaserMover) => {
  emit('select', m)
}

const handleAdd = async (m: PulseTeaserMover) => {
  actionError.value = null
  try {
    const result = await watchlist.ensure({ type: 'corridor', from: m.fromCountry, to: m.toCountry, method: 'bank' })
    if (result.status === 'limit_reached') {
      actionError.value = result.message
      return
    }
    if (result.status === 'error') {
      actionError.value = result.message
      return
    }
    emit('added', m)
  }
  catch (error: any) {
    actionError.value = error?.message || 'Unable to add to watchlist.'
  }
}
</script>

<template>
  <section class="card-elevated overflow-hidden">
    <div class="border-b border-white/[0.08] px-6 py-5">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-body-lg font-bold text-white">
            What's Moving
          </h2>
          <p class="text-body-sm text-neutral-400">
            <span v-if="updatedAt">Updated {{ formatTimestamp(updatedAt) }} UTC</span>
            <span v-else>Live movers feed warming up</span>
            <span class="mx-2 text-neutral-600">|</span>
            Last {{ windowHours }}h window
          </p>
        </div>
        <div class="text-label font-mono text-neutral-500">
          Source: Gold Export
        </div>
      </div>
    </div>

    <div class="p-4 sm:p-6">
      <div
        v-if="pending"
        class="space-y-3"
      >
        <SkeletonBlock
          v-for="n in 6"
          :key="n"
          height="64"
          rounded="xl"
          tone="dark"
          class="border border-neutral-800"
        />
      </div>

      <div
        v-else-if="movers.length === 0"
        class="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 text-body-sm text-neutral-300"
      >
        <span v-if="variant === 'public'">
          No live movers are available yet. Check back after the next Gold export refresh.
        </span>
        <span v-else>
          No movers data is available for this selection yet. Check back after the next refresh.
        </span>
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="(m, index) in movers"
          :key="m.corridorId"
          class="card-interactive border-l-2 rounded-xl p-4"
          :class="[
            borderClass(m.deltaPct),
            m.corridorId === selectedCorridorId ? 'border-brand-600/60 ring-1 ring-brand-600/30' : '',
          ]"
        >
          <div class="flex items-start justify-between gap-3">
            <button
              type="button"
              class="focus-ring-dark text-left"
              :class="props.variant === 'plus' ? 'hover:opacity-90' : 'cursor-default'"
              @click="props.variant === 'plus' ? handleSelect(m) : undefined"
            >
              <div class="text-body-sm font-semibold text-white">
                <span class="mr-2">{{ toFlagEmoji(m.fromCountry) }}</span>
                {{ m.sendCurrency }} → {{ m.recvCurrency }}
                <span class="ml-2 text-neutral-500 text-body-sm">({{ m.fromCountry }}→{{ m.toCountry }})</span>
              </div>
              <div class="mt-1 text-body-sm text-neutral-400">
                Providers {{ m.providerCount }} • Bucket {{ formatTimestamp(m.timestampBucket) }} UTC
              </div>
            </button>

            <div class="flex items-center gap-2">
              <div
                class="rounded-lg px-2.5 py-1 text-body-sm font-bold text-mono-value"
                :class="deltaClass(m.deltaPct)"
              >
                {{ formatPct(m.deltaPct) }}
              </div>

              <svg
class="h-4 w-12 flex-shrink-0"
viewBox="0 0 60 100"
preserveAspectRatio="none"
>
                <polyline
                  :points="generateSparklinePath(index, m.deltaPct > 0 ? 'up' : m.deltaPct < 0 ? 'down' : 'flat')"
                  fill="none"
                  :stroke="m.deltaPct > 0 ? '#10b981' : m.deltaPct < 0 ? '#ef4444' : '#737373'"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              <button
                v-if="canShowAdd"
                type="button"
                class="focus-ring-dark rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-body-sm font-semibold text-white hover:bg-white/[0.08] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="isSaved(m)"
                @click="handleAdd(m)"
              >
                {{ isSaved(m) ? 'Saved' : 'Add' }}
              </button>
            </div>
          </div>
        </div>

        <p
          v-if="actionError"
          class="text-body-sm text-danger-600"
        >
          {{ actionError }}
        </p>
      </div>
    </div>
  </section>
</template>
