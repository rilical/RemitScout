<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <div class="border-b border-neutral-700 px-6 py-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <Icon
              name="chart-bar"
              :size="20"
              class="text-brand-600"
            />
            <h2 class="text-body-lg font-bold text-white">
              COVERAGE BY SEND CURRENCY
            </h2>
            <span class="rounded-full bg-brand-600/20 border border-brand-600/30 px-2 py-0.5 text-body-sm font-semibold text-brand-600">Plus</span>
          </div>
          <p class="text-body-sm text-neutral-400">
            Latest Gold export snapshot, binned by provider coverage. Use this to spot where indices are fragile.
          </p>
        </div>
        <div class="text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          <div v-if="dateLabel">
            {{ dateLabel }}
          </div>
          <div v-if="updatedAtLabel">
            {{ updatedAtLabel }}
          </div>
        </div>
      </div>
    </div>

    <div class="p-6">
      <div
        v-if="error"
        class="rounded-lg border border-danger-600/30 bg-danger-600/10 p-4 text-body-sm text-danger-600"
      >
        {{ error }}
      </div>

      <div
        v-else-if="loading"
        class="grid gap-4 md:grid-cols-2"
        aria-busy="true"
      >
        <div
          v-for="i in 4"
          :key="`coverage-skeleton-${i}`"
          class="rounded-lg border border-neutral-700 bg-neutral-900 p-4"
        >
          <SkeletonBlock
            width="7rem"
            height="18"
            tone="dark"
          />
          <SkeletonBlock
            class="mt-3"
            width="100%"
            height="12"
            tone="dark"
          />
          <SkeletonBlock
            class="mt-2"
            width="80%"
            height="12"
            tone="dark"
          />
        </div>
      </div>

      <EmptyState
        v-else-if="rows.length === 0 || !date"
        title="Pulse is warming up"
        description="Gold exports are not available yet for this slice."
        variant="terminal"
        mode="inline"
      />

      <div
        v-else
        class="grid gap-4 md:grid-cols-2"
      >
        <div
          v-for="row in rows"
          :key="row.sendCurrency"
          class="rounded-lg border border-neutral-700 bg-neutral-900 p-4"
        >
          <div class="flex items-center justify-between">
            <div class="text-body font-bold text-white">
              {{ row.sendCurrency }}
            </div>
            <div class="text-body-sm text-neutral-400">
              {{ formatCount(row.corridorsTotal) }} corridors
            </div>
          </div>

          <div class="mt-3">
            <div class="h-3 overflow-hidden rounded-full border border-neutral-700 bg-neutral-950">
              <div class="flex h-full w-full">
                <div
                  class="h-full bg-success-600"
                  :style="{ width: `${pct(row.corridorsWith3PlusProviders, row.corridorsTotal)}%` }"
                  :title="`>=3 providers: ${row.corridorsWith3PlusProviders}`"
                />
                <div
                  class="h-full bg-amber-500"
                  :style="{ width: `${pct(row.corridorsWith1to2Providers, row.corridorsTotal)}%` }"
                  :title="`1-2 providers: ${row.corridorsWith1to2Providers}`"
                />
                <div
                  class="h-full bg-danger-600"
                  :style="{ width: `${pct(row.corridorsWith0Providers, row.corridorsTotal)}%` }"
                  :title="`0 providers: ${row.corridorsWith0Providers}`"
                />
              </div>
            </div>
            <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1">
                  <span class="h-2 w-2 rounded bg-success-600" />
                  3+ {{ formatCount(row.corridorsWith3PlusProviders) }}
                </span>
                <span class="text-neutral-700">|</span>
                <span class="inline-flex items-center gap-1">
                  <span class="h-2 w-2 rounded bg-amber-500" />
                  1-2 {{ formatCount(row.corridorsWith1to2Providers) }}
                </span>
                <span class="text-neutral-700">|</span>
                <span class="inline-flex items-center gap-1">
                  <span class="h-2 w-2 rounded bg-danger-600" />
                  0 {{ formatCount(row.corridorsWith0Providers) }}
                </span>
              </div>
              <div class="text-neutral-500">
                Suppressed {{ formatPct(row.corridorsSuppressed, row.corridorsTotal) }}
              </div>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-200 hover:border-brand-600/60"
              @click="openGaps(row.sendCurrency, 'none')"
            >
              View 0-coverage
            </button>
            <button
              type="button"
              class="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-200 hover:border-brand-600/60"
              @click="openGaps(row.sendCurrency, 'low')"
            >
              View fragile (1-2)
            </button>
          </div>

          <div class="mt-3 grid grid-cols-3 gap-2">
            <div class="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-2">
              <div class="text-[10px] uppercase tracking-wider text-neutral-500">
                Conf p10
              </div>
              <div class="mt-1 text-body-sm font-semibold text-white">
                {{ formatConfidence(row.weightConfidenceP10) }}
              </div>
            </div>
            <div class="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-2">
              <div class="text-[10px] uppercase tracking-wider text-neutral-500">
                Conf p50
              </div>
              <div class="mt-1 text-body-sm font-semibold text-white">
                {{ formatConfidence(row.weightConfidenceP50) }}
              </div>
            </div>
            <div class="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-2">
              <div class="text-[10px] uppercase tracking-wider text-neutral-500">
                Conf p90
              </div>
              <div class="mt-1 text-body-sm font-semibold text-white">
                {{ formatConfidence(row.weightConfidenceP90) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="gapsOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm"
        aria-label="Close dialog"
        @click="closeGaps"
      />

      <div
        class="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-start justify-between gap-4 border-b border-neutral-800 px-6 py-5">
          <div>
            <div class="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Coverage gaps
            </div>
            <h3 class="mt-1 text-h3 font-bold text-white">
              {{ gapsTitle }}
            </h3>
            <p class="mt-1 text-body-sm text-neutral-400">
              Reason codes reflect rights + capability + freshness signals. No guessing.
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
            aria-label="Close"
            @click="closeGaps"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="px-6 py-5">
          <div
            v-if="gapsError"
            class="rounded-lg border border-danger-600/30 bg-danger-600/10 p-4 text-body-sm text-danger-600"
          >
            {{ gapsError }}
          </div>

          <div
            v-else-if="gapsLoading"
            class="grid gap-3"
            aria-busy="true"
          >
            <div
              v-for="i in 6"
              :key="`gaps-skeleton-${i}`"
              class="rounded-lg border border-neutral-800 bg-neutral-900 p-4"
            >
              <SkeletonBlock
                width="16rem"
                height="14"
                tone="dark"
              />
              <SkeletonBlock
                class="mt-2"
                width="100%"
                height="12"
                tone="dark"
              />
            </div>
          </div>

          <div v-else>
            <div class="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <span>Date {{ gapsDateLabel }}</span>
              <span class="text-neutral-700">|</span>
              <span>Updated {{ gapsUpdatedLabel }}</span>
              <span class="text-neutral-700">|</span>
              <span>Bucket {{ gapsAmountBucket }}</span>
              <span class="text-neutral-700">|</span>
              <span>{{ gapsMethodProfile }}</span>
            </div>

            <div class="mt-4 overflow-auto rounded-xl border border-neutral-800">
              <table class="min-w-full text-body-sm">
                <thead class="bg-neutral-900 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th class="px-4 py-3 text-left">
                      Corridor
                    </th>
                    <th class="px-4 py-3 text-left">
                      Reason
                    </th>
                    <th class="px-4 py-3 text-right">
                      Rights
                    </th>
                    <th class="px-4 py-3 text-right">
                      Supported
                    </th>
                    <th class="px-4 py-3 text-right">
                      Freshest quote
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in gapsRows"
                    :key="row.corridorId"
                    class="border-t border-neutral-800 bg-neutral-950"
                  >
                    <td class="px-4 py-3 text-left text-neutral-200">
                      <div class="font-semibold text-white">
                        {{ row.corridorId }}
                      </div>
                      <div class="text-[11px] text-neutral-500">
                        {{ row.sendCurrency }} → {{ row.recvCurrency || '—' }}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-left">
                      <div
                        class="inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold"
                        :class="reasonBadgeClass(row.gap.reason)"
                      >
                        {{ formatReason(row.gap.reason) }}
                      </div>
                      <div class="mt-1 text-[11px] text-neutral-500">
                        methodMismatch={{ row.gap.methodMismatch }},
                        missing={{ row.gap.capabilityMissing }},
                        unsupported={{ row.gap.capabilityUnsupported }}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-right text-neutral-300">
                      {{ row.gap.rightsEligibleProviders }}
                    </td>
                    <td class="px-4 py-3 text-right text-neutral-300">
                      {{ row.gap.supportedProviders }}
                    </td>
                    <td class="px-4 py-3 text-right text-neutral-300">
                      <span v-if="row.gap.freshestQuoteAgeSeconds !== null">
                        {{ formatAge(row.gap.freshestQuoteAgeSeconds) }}
                      </span>
                      <span v-else class="text-neutral-500">—</span>
                    </td>
                  </tr>
                  <tr v-if="gapsRows.length === 0">
                    <td
                      colspan="5"
                      class="px-4 py-6 text-center text-body-sm text-neutral-500"
                    >
                      No gaps found for this slice.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-4 text-[11px] text-neutral-500">
              Tip: “Rights” means the provider isn’t allowed for the corridor. “Capability” means no supported payout method is recorded. “Freshness” means eligible providers exist but quotes are stale/missing.
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { PulseFilters } from '~/types/pulse'
import { EmptyState, Icon } from '~/ui'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'
import { formatUpdatedLabel } from '~/shared/lib/format'
import { getCoverageByCurrency, getCoverageGapsByCurrency, type PulseCoverageByCurrencyRow, type PulseCoverageGapRow } from '~/lib/pulseApi'

interface Props {
  filters: PulseFilters
  sendCurrencies?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  sendCurrencies: () => ['USD', 'AED', 'GBP', 'EUR'],
})

const emit = defineEmits<{
  loaded: [payload: { date: string | null, updatedAt: string | null, rows: PulseCoverageByCurrencyRow[] }]
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const date = ref<string | null>(null)
const updatedAt = ref<string | null>(null)
const rows = ref<PulseCoverageByCurrencyRow[]>([])

const dateLabel = computed(() => date.value ? `Date ${date.value}` : null)
const updatedAtLabel = computed(() => updatedAt.value ? `Updated ${formatUpdatedLabel(updatedAt.value)}` : null)

const formatCount = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)

const pct = (part: number, total: number) => {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0
  return Math.max(0, Math.min(100, (part / total) * 100))
}

const formatPct = (part: number, total: number) => `${pct(part, total).toFixed(0)}%`

const formatConfidence = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${Math.round(value * 100)}%`
}

const load = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await getCoverageByCurrency(props.filters, props.sendCurrencies)
    date.value = response.date
    updatedAt.value = response.updatedAt
    rows.value = response.rows || []
    emit('loaded', { date: date.value, updatedAt: updatedAt.value, rows: rows.value })
  }
  catch (err: any) {
    error.value = err?.message || 'Unable to load coverage right now.'
    date.value = null
    updatedAt.value = null
    rows.value = []
    emit('loaded', { date: null, updatedAt: null, rows: [] })
  }
  finally {
    loading.value = false
  }
}

watch(
  () => [
    props.filters.fundingMethod,
    props.filters.payoutMethod,
    (props.sendCurrencies || []).join(','),
  ].join('|'),
  () => {
    void load()
  },
)

onMounted(() => {
  void load()
})

const gapsOpen = ref(false)
const gapsLoading = ref(false)
const gapsError = ref<string | null>(null)
const gapsRows = ref<PulseCoverageGapRow[]>([])
const gapsSendCurrency = ref<string>('USD')
const gapsBin = ref<'none' | 'low'>('none')
const gapsDate = ref<string | null>(null)
const gapsUpdatedAt = ref<string | null>(null)
const gapsMethodProfile = ref<'standard_bank' | 'standard_card' | 'cash_pickup'>('standard_bank')
const gapsAmountBucket = ref<number>(500)

const gapsTitle = computed(() => {
  const label = gapsBin.value === 'none' ? '0 coverage corridors' : 'Fragile corridors (1–2 providers)'
  return `${gapsSendCurrency.value} • ${label}`
})

const gapsDateLabel = computed(() => gapsDate.value || '—')
const gapsUpdatedLabel = computed(() => gapsUpdatedAt.value ? formatUpdatedLabel(gapsUpdatedAt.value) : '—')

const openGaps = async (sendCurrency: string, bin: 'none' | 'low') => {
  gapsOpen.value = true
  gapsSendCurrency.value = sendCurrency
  gapsBin.value = bin
  gapsLoading.value = true
  gapsError.value = null
  gapsRows.value = []

  try {
    const response = await getCoverageGapsByCurrency(props.filters, sendCurrency, bin, 500)
    gapsDate.value = response.date
    gapsUpdatedAt.value = response.updatedAt
    gapsMethodProfile.value = response.methodProfile
    gapsAmountBucket.value = response.amountBucket
    gapsRows.value = response.rows || []
  }
  catch (error: any) {
    gapsError.value = error?.message || 'Unable to load coverage gaps right now.'
  }
  finally {
    gapsLoading.value = false
  }
}

const closeGaps = () => {
  gapsOpen.value = false
}

const formatReason = (reason: PulseCoverageGapRow['gap']['reason']) => {
  if (reason === 'rights') return 'Rights'
  if (reason === 'capability') return 'Capability'
  if (reason === 'method_mismatch') return 'Method mismatch'
  if (reason === 'freshness') return 'Freshness'
  return 'Unknown'
}

const reasonBadgeClass = (reason: PulseCoverageGapRow['gap']['reason']) => {
  if (reason === 'rights') return 'border-danger-600/30 bg-danger-600/10 text-danger-500'
  if (reason === 'capability') return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
  if (reason === 'method_mismatch') return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
  if (reason === 'freshness') return 'border-danger-600/30 bg-danger-600/10 text-danger-500'
  return 'border-neutral-700 bg-neutral-950 text-neutral-400'
}

const formatAge = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`
  return `${Math.round(seconds / 86400)}d`
}
</script>
