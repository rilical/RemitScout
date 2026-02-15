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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { PulseFilters } from '~/types/pulse'
import { EmptyState, Icon } from '~/ui'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'
import { formatUpdatedLabel } from '~/shared/lib/format'
import { getCoverageByCurrency, type PulseCoverageByCurrencyRow } from '~/lib/pulseApi'

interface Props {
  filters: PulseFilters
  sendCurrencies?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  sendCurrencies: () => ['USD', 'AED', 'GBP', 'EUR'],
})

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
  }
  catch (err: any) {
    error.value = err?.message || 'Unable to load coverage right now.'
    date.value = null
    updatedAt.value = null
    rows.value = []
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
</script>
