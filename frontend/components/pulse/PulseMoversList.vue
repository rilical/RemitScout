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
  (e: 'select', mover: PulseTeaserMover): void
  (e: 'added', mover: PulseTeaserMover): void
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
const sampleMovers: PulseTeaserMover[] = [
  { corridorId: 'US-PH', fromCountry: 'US', toCountry: 'PH', sendCurrency: 'USD', recvCurrency: 'PHP', currentAvgRate: 56.04, prevAvgRate: 54.72, deltaPct: 0.024, providerCount: 7, timestampBucket: new Date().toISOString() },
  { corridorId: 'GB-NG', fromCountry: 'GB', toCountry: 'NG', sendCurrency: 'GBP', recvCurrency: 'NGN', currentAvgRate: 1892.5, prevAvgRate: 1927.0, deltaPct: -0.018, providerCount: 5, timestampBucket: new Date().toISOString() },
  { corridorId: 'US-IN', fromCountry: 'US', toCountry: 'IN', sendCurrency: 'USD', recvCurrency: 'INR', currentAvgRate: 83.42, prevAvgRate: 82.51, deltaPct: 0.011, providerCount: 8, timestampBucket: new Date().toISOString() },
  { corridorId: 'EU-PK', fromCountry: 'EU', toCountry: 'PK', sendCurrency: 'EUR', recvCurrency: 'PKR', currentAvgRate: 305.8, prevAvgRate: 315.7, deltaPct: -0.032, providerCount: 4, timestampBucket: new Date().toISOString() },
  { corridorId: 'US-MX', fromCountry: 'US', toCountry: 'MX', sendCurrency: 'USD', recvCurrency: 'MXN', currentAvgRate: 17.38, prevAvgRate: 17.12, deltaPct: 0.015, providerCount: 6, timestampBucket: new Date().toISOString() },
  { corridorId: 'GB-GH', fromCountry: 'GB', toCountry: 'GH', sendCurrency: 'GBP', recvCurrency: 'GHS', currentAvgRate: 16.25, prevAvgRate: 16.62, deltaPct: -0.022, providerCount: 3, timestampBucket: new Date().toISOString() },
]

const apiMovers = computed(() => (data.value?.movers ?? []).slice(0, props.limit))
const movers = computed(() => {
  if (apiMovers.value.length > 0) return apiMovers.value
  if (props.variant === 'public') return sampleMovers.slice(0, props.limit)
  return []
})

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
  return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
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
    emit('added', m)
  }
  catch (error: any) {
    actionError.value = error?.message || 'Unable to add to watchlist.'
  }
}
</script>

<template>
  <section class="rounded-2xl border border-neutral-700 bg-neutral-800 shadow-lg overflow-hidden">
    <div class="border-b border-neutral-700 px-6 py-5">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-body-lg font-bold text-white">
            What's Moving
          </h2>
          <p class="text-body-sm text-neutral-400">
            <span v-if="updatedAt">Updated {{ formatTimestamp(updatedAt) }} UTC</span>
            <span v-else-if="variant === 'public'">Sample data</span>
            <span v-else>Warming up</span>
            <span class="mx-2 text-neutral-600">|</span>
            Last {{ windowHours }}h window
          </p>
        </div>
        <div class="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
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
        class="rounded-xl border border-neutral-700 bg-neutral-900/30 p-6 text-body-sm text-neutral-300"
      >
        No movers data available yet.
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="m in movers"
          :key="m.corridorId"
          class="rounded-xl border border-neutral-700 bg-neutral-900/30 p-4"
          :class="m.corridorId === selectedCorridorId ? 'border-brand-600/60 ring-1 ring-brand-600/30' : ''"
        >
          <div class="flex items-start justify-between gap-3">
            <button
              type="button"
              class="text-left"
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
                class="rounded-lg px-2.5 py-1 text-body-sm font-bold"
                :class="deltaClass(m.deltaPct)"
              >
                {{ formatPct(m.deltaPct) }}
              </div>

              <button
                v-if="canShowAdd"
                type="button"
                class="rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-body-sm font-semibold text-white hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
