<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header class="rounded-2xl bg-surface p-6 shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-h3 font-semibold text-rs-fg">Gold Exports: Indices Snapshot</h1>
            <p class="text-body-sm text-rs-muted">
              Source: <code>gold_export.cdp_daily</code>
            </p>
          </div>
        <div class="flex flex-col gap-2 sm:flex-row">
            <button
              class="h-10 rounded-lg border border-rs-border bg-surface px-4 text-body-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:bg-neutral-100"
              :disabled="loading"
              @click="refresh"
            >
              {{ loading ? 'Refreshing…' : 'Refresh' }}
            </button>
            <button
              class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-primary-300"
              :disabled="downloading || loading"
              @click="downloadCsv"
            >
              {{ downloading ? 'Downloading…' : 'Download CSV' }}
            </button>
            <button
              class="h-10 rounded-lg bg-rs-fg/90 px-4 text-body-sm font-semibold text-white hover:bg-rs-fg disabled:cursor-not-allowed disabled:bg-rs-muted"
              :disabled="downloading || loading"
              @click="downloadPdf"
            >
              {{ downloading ? 'Downloading…' : 'Download PDF' }}
            </button>
          </div>
        </div>
        <div class="mt-3 grid gap-2 text-body-sm text-rs-muted md:grid-cols-2">
          <div>Snapshot date: {{ meta.date || 'n/a' }}</div>
          <div>Last updated: {{ formatTimestamp(meta.last_updated_at) }}</div>
        </div>
        <ErrorState
          v-if="error"
          class="mt-4"
          mode="card"
          :message="error || 'Failed to load Gold exports.'"
          :on-retry="refresh"
        />
      </header>

      <AdminSurfaceOverview :model="surfaceOverview" />

      <section class="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Filters</h2>
        <div class="mt-4 grid gap-4 md:grid-cols-4">
          <label class="text-body-sm text-rs-muted md:col-span-2">
            Search corridor
            <input
              v-model="filters.q"
              type="text"
              placeholder="e.g., US-JO"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              @keydown.enter="applyFilters"
            >
          </label>

          <label class="text-body-sm text-rs-muted">
            Suppression
            <select
              v-model="filters.suppressed"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              @change="applyFilters"
            >
              <option value="">All</option>
              <option value="0">Available only</option>
              <option value="1">Suppressed only</option>
            </select>
          </label>

          <label class="text-body-sm text-rs-muted">
            Page size
            <select
              v-model.number="pagination.limit"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              @change="applyFilters"
            >
              <option :value="200">200</option>
              <option :value="500">500</option>
              <option :value="1000">1000</option>
            </select>
          </label>
        </div>

        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <label class="text-body-sm text-rs-muted">
            Methodology version
            <input
              v-model="filters.methodology"
              type="text"
              placeholder="e.g., indices_v2"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              @keydown.enter="applyFilters"
            >
          </label>
          <label class="text-body-sm text-rs-muted">
            Snapshot date
            <input
              v-model="filters.date"
              type="date"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              @change="applyFilters"
            >
          </label>
        </div>

        <div class="mt-4">
          <div class="text-body-sm text-rs-muted">Send currency</div>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="currency in sendCurrencyOptions"
              :key="currency"
              type="button"
              class="h-9 rounded-full border px-4 text-body-sm font-semibold"
              :class="filters.sendCurrencies.includes(currency)
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-rs-border bg-surface text-neutral-700 hover:bg-neutral-50'"
              @click="toggleSendCurrency(currency)"
            >
              {{ currency }}
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-3">
        <div class="rounded-2xl bg-surface p-6 shadow-sm lg:col-span-2">
          <h2 class="text-body-lg font-semibold text-rs-fg">Snapshot rows</h2>
          <p class="text-body-sm text-rs-muted">
            amount_bucket={{ meta.amount_bucket }}, method_profile={{ meta.method_profile }}
          </p>

          <div class="mt-4 overflow-auto">
            <table class="min-w-full text-body-sm">
              <thead class="text-body-sm uppercase text-neutral-400">
                <tr>
                  <th class="py-2 text-left">Corridor</th>
                  <th class="py-2 text-right">TEER</th>
                  <th class="py-2 text-right">RCI</th>
                  <th class="py-2 text-right">RVI (bps)</th>
                  <th class="py-2 text-right">Providers</th>
                  <th class="py-2 text-right">Weight conf</th>
                  <th class="py-2 text-center">Status</th>
                  <th class="py-2 text-left">Suppression</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in rows"
                  :key="`${row.corridor_id}:${row.date}:${row.method_profile}:${row.amount_bucket}`"
                  class="border-t border-neutral-100"
                >
                  <td class="py-2 text-neutral-700">{{ row.corridor_id }}</td>
                  <td class="py-2 text-right text-neutral-600">{{ formatAdminNumber(row.teer_rate, 6) }}</td>
                  <td class="py-2 text-right text-neutral-600">{{ formatPercentRatio(row.rci_ratio) }}</td>
                  <td class="py-2 text-right text-neutral-600">{{ formatAdminNumber(row.rvi_bps, 1) }}</td>
                  <td class="py-2 text-right text-neutral-600">{{ row.provider_count ?? 'n/a' }}</td>
                  <td class="py-2 text-right text-neutral-600">{{ formatAdminNumber(row.weight_confidence, 3) }}</td>
                  <td class="py-2 text-center">
                    <PublicationStatusBadge :status="(row as any).publication_status" />
                  </td>
                  <td class="py-2 text-body-sm text-rs-muted">
                    <div class="font-medium text-neutral-700">{{ row.suppression_flag ? 'suppressed' : 'ok' }}</div>
                    <div class="text-[11px] text-neutral-400">{{ row.suppression_reason || '—' }}</div>
                  </td>
                </tr>
                <tr v-if="rows.length === 0">
                  <td
                    colspan="8"
                    class="py-3 text-center text-body-sm text-neutral-400"
                  >
                    No rows for this snapshot.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4 flex items-center justify-between">
            <div class="text-body-sm text-rs-muted">
              Total: {{ pagination.total }}
            </div>
            <div class="flex gap-2">
              <button
                class="h-9 rounded-lg border border-rs-border bg-surface px-3 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:bg-neutral-100"
                :disabled="loading || pagination.offset <= 0"
                @click="prevPage"
              >
                Prev
              </button>
              <button
                class="h-9 rounded-lg border border-rs-border bg-surface px-3 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:bg-neutral-100"
                :disabled="loading || pagination.offset + pagination.limit >= pagination.total"
                @click="nextPage"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">Summary</h2>
          <div class="mt-4 grid gap-3">
            <div class="rounded-lg border border-neutral-100 p-3">
              <div class="text-body-sm uppercase text-neutral-400">Corridors</div>
              <div class="mt-1 text-body-lg font-semibold text-rs-fg">{{ summary.corridors_total }}</div>
            </div>
            <div class="rounded-lg border border-neutral-100 p-3">
              <div class="text-body-sm uppercase text-neutral-400">Available ratio</div>
              <div class="mt-1 text-body-lg font-semibold text-rs-fg">{{ formatPercent(summary.available_ratio) }}</div>
            </div>
            <div class="rounded-lg border border-neutral-100 p-3">
              <div class="text-body-sm uppercase text-neutral-400">Suppressed ratio</div>
              <div class="mt-1 text-body-lg font-semibold text-rs-fg">{{ formatPercent(summary.suppressed_ratio) }}</div>
            </div>
            <div class="rounded-lg border border-neutral-100 p-3">
              <div class="text-body-sm uppercase text-neutral-400">Min provider count</div>
              <div class="mt-1 text-body-lg font-semibold text-rs-fg">{{ summary.min_provider_count ?? 'n/a' }}</div>
            </div>
            <div class="rounded-lg border border-neutral-100 p-3">
              <div class="text-body-sm uppercase text-neutral-400">Weight conf p10</div>
              <div class="mt-1 text-body-lg font-semibold text-rs-fg">{{ formatAdminNumber(summary.weight_confidence_p10, 3) }}</div>
            </div>
          </div>
        </div>

        <!-- Correction ledger -->
        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <button
            type="button"
            class="flex w-full items-center justify-between text-body-lg font-semibold text-rs-fg"
            @click="correctionsOpen = !correctionsOpen"
          >
            Correction Ledger
            <svg
              class="h-4 w-4 text-rs-muted transition-transform duration-200"
              :class="correctionsOpen ? 'rotate-180' : ''"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M19 9l-7 7-7-7"
/></svg>
          </button>
          <p class="mt-1 text-body-sm text-rs-muted">Historical corrections to published index values.</p>
          <div
v-if="correctionsOpen"
class="mt-4 overflow-auto"
>
            <div
v-if="correctionsLoading"
class="text-body-sm text-rs-muted"
>
Loading corrections…
</div>
            <table
v-else-if="corrections.length"
class="min-w-full text-body-sm"
>
              <thead class="text-body-sm uppercase text-neutral-400">
                <tr>
                  <th class="py-2 text-left">Corridor</th>
                  <th class="py-2 text-left">Field</th>
                  <th class="py-2 text-right">Old</th>
                  <th class="py-2 text-right">New</th>
                  <th class="py-2 text-left">Reason</th>
                  <th class="py-2 text-left">Methodology</th>
                  <th class="py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                <tr
v-for="c in corrections"
:key="c.correction_id"
class="border-t border-neutral-100"
>
                  <td class="py-2 text-neutral-700">{{ c.corridor_id }}</td>
                  <td class="py-2 text-neutral-700">{{ c.field_name }}</td>
                  <td class="py-2 text-right text-neutral-600">{{ c.old_value != null ? formatAdminNumber(c.old_value, 6) : '—' }}</td>
                  <td class="py-2 text-right text-neutral-600">{{ c.new_value != null ? formatAdminNumber(c.new_value, 6) : '—' }}</td>
                  <td class="py-2 text-rs-muted">{{ c.reason }}</td>
                  <td class="py-2"><MethodologyVersionBadge :version="c.methodology_version" /></td>
                  <td class="py-2 text-rs-muted">{{ formatTimestamp(c.created_at) }}</td>
                </tr>
              </tbody>
            </table>
            <p
v-else
class="text-body-sm text-rs-muted"
>
No corrections recorded.
</p>
          </div>
        </div>

        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">Index trend</h2>
          <label class="mt-3 block text-body-sm text-rs-muted">
            Corridor
            <select
              v-model="selectedCorridor"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
            >
              <option
                v-for="corridor in corridorOptions"
                :key="corridor"
                :value="corridor"
              >
                {{ corridor }}
              </option>
            </select>
          </label>

          <div class="mt-4 h-80 rounded-xl border border-neutral-100 bg-white p-2">
            <div
              v-if="chartLoading"
              class="flex h-full items-center justify-center text-body-sm text-rs-muted"
            >
              Loading chart...
            </div>
            <div
              v-else-if="chartError"
              class="flex h-full items-center justify-center text-body-sm text-danger-600"
            >
              {{ chartError }}
            </div>
            <div
              v-else-if="chartSeries.length"
              class="h-full"
            >
              <PulseLineChart
                :series="chartSeries"
                unit="number"
              />
            </div>
            <div
              v-else
              class="flex h-full items-center justify-center text-body-sm text-rs-muted"
            >
              No chart data for this corridor.
            </div>
          </div>

          <div
            v-if="chartDataWindow?.capped && chartSeries.length"
            class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-body-sm text-amber-700"
          >
            Data limited to {{ chartDataWindow.returnedDays }} days — full requested range not yet available.
          </div>

          <div
            v-if="suppressedHistory.length"
            class="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-body-sm text-amber-800"
          >
            <div class="font-semibold">Suppressed history detected</div>
            <p class="mt-1">
              {{ suppressedHistory.length }} point(s) exist for this corridor, but they are suppressed from the visible chart.
            </p>
            <div class="mt-3 grid gap-2 md:grid-cols-2">
              <div
                v-for="point in suppressedHistory.slice(0, 6)"
                :key="`${point.date}:${point.suppressionReason || 'unknown'}`"
                class="rounded-lg border border-amber-200 bg-white px-3 py-2"
              >
                <div class="font-semibold text-rs-fg">{{ point.date }}</div>
                <div class="text-xs text-amber-800">
                  {{ point.suppressionReason || 'suppressed' }}
                  <span v-if="point.providerCount !== undefined && point.providerCount !== null">
                    · providers={{ point.providerCount }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p class="mt-3 text-body-sm text-rs-muted">
            TEER = effective rate, RCI/RVI trend from `/indices/series`.
          </p>
        </div>
      </section>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { getIndexSeries } from '~/lib/indicesApi'
import type { IndexSeriesResponse } from '~/types/indices'
import type { ChartSeries } from '~/types/pulse'
import type { CorrectionLedgerEntry } from '~/types/data-quality'
import { getCorrectionLedger } from '~/lib/opsApi'
import type { AdminSurfaceOverviewModel } from '~/utils/adminSurfaceStatus'
import { formatAdminSurfaceAge, getFreshnessTone } from '~/utils/adminSurfaceStatus'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

const { formatTimestamp, formatPercent, formatNumber: formatAdminNumber } = useAdminFormat()

useAdminPage({
  title: 'Admin: Gold Exports | Remit-Scout',
  description: 'Admin Gold exports viewer.',
})

const ErrorState = defineAsyncComponent(() => import('~/ui/states/ErrorState.vue'))
const PulseLineChart = defineAsyncComponent(() => import('~/components/pulse/PulseLineChart.vue'))

const indexColor = {
  teer: 'rgb(var(--rs-color-brand) / 1)',
  rci: 'rgb(var(--rs-color-brand) / 0.72)',
  rvi: 'rgb(var(--rs-color-brand) / 0.52)',
}

type GoldExportRow = {
  date: string
  corridor_id: string
  from_country: string
  to_country: string
  from_currency: string
  to_currency: string
  amount_bucket: number
  method_profile: string
  teer_rate: number | null
  rci_ratio: number | null
  rvi_bps: number | null
  mid_market_rate: number | null
  provider_count: number | null
  provider_count_binned: number | null
  rci_median_bps: number | null
  rci_p10_bps: number | null
  rci_p90_bps: number | null
  dispersion_bps: number | null
  volatility_7d: number | null
  weight_confidence: number | null
  weight_window_days: number | null
  weighting_model: string | null
  methodology_version: string | null
  pipeline_version: string | null
  suppression_flag: boolean
  suppression_reason: string | null
  created_at: string
}

type GoldExportsResponse = {
  success: boolean
  message?: string
  meta: {
    date: string | null
    amount_bucket: number
    method_profile: string
    last_updated_at: string | null
  }
  summary: {
    corridors_total: number
    available: number
    suppressed: number
    available_ratio: number
    suppressed_ratio: number
    min_provider_count: number | null
    weight_confidence_p10: number | null
  }
  pagination: {
    total: number
    limit: number
    offset: number
  }
  rows: GoldExportRow[]
}

const { request } = useApi()

const sendCurrencyOptions = ['USD', 'AED', 'GBP', 'EUR'] as const

const loading = ref(false)
const downloading = ref(false)
const error = ref<string | null>(null)

const meta = reactive({
  date: null as string | null,
  amount_bucket: 500,
  method_profile: 'standard_bank',
  last_updated_at: null as string | null,
})

const summary = reactive({
  corridors_total: 0,
  available: 0,
  suppressed: 0,
  available_ratio: 0,
  suppressed_ratio: 0,
  min_provider_count: null as number | null,
  weight_confidence_p10: null as number | null,
})

const pagination = reactive({ total: 0, limit: 200, offset: 0 })
const rows = ref<GoldExportRow[]>([])
const selectedCorridor = ref('')
const chartSeries = ref<ChartSeries[]>([])
const chartDataWindow = ref<IndexSeriesResponse['dataWindow'] | null>(null)
const chartLoading = ref(false)
const chartError = ref<string | null>(null)
const suppressedHistory = ref<IndexSeriesResponse['series']>([])

const filters = reactive({
  q: '',
  suppressed: '' as '' | '0' | '1',
  sendCurrencies: [] as string[],
  methodology: '' as string,
  date: '' as string,
})

const corrections = ref<CorrectionLedgerEntry[]>([])
const correctionsOpen = ref(false)
const correctionsLoading = ref(false)

const corridorOptions = computed(() => [...new Set(rows.value.map(row => row.corridor_id))])

watch(corridorOptions, (options) => {
  if (!options.length) {
    selectedCorridor.value = ''
    chartSeries.value = []
    return
  }
  if (!selectedCorridor.value || !options.includes(selectedCorridor.value)) {
    selectedCorridor.value = options[0]
  }
}, { immediate: true })

const buildIndexSeries = (value: number | null): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const loadChart = async () => {
  if (!selectedCorridor.value) {
    chartSeries.value = []
    chartDataWindow.value = null
    chartError.value = null
    return
  }
  if (!meta.date) {
    chartSeries.value = []
    chartDataWindow.value = null
    chartError.value = 'Select a date first.'
    return
  }

  chartLoading.value = true
  chartError.value = null
  suppressedHistory.value = []

  try {
    const data = await getIndexSeries({
      corridor_id: selectedCorridor.value,
      amount_bucket: meta.amount_bucket,
      method_profile: meta.method_profile,
      days: 90,
    })
    suppressedHistory.value = data.series.filter(point => point.suppressionFlag)

    const toPoints = (extractor: (point: typeof data.series[number]) => number | null) =>
      data.series
        .map(point => ({
          point,
          value: extractor(point),
        }))
        .filter(item => !item.point.suppressionFlag && item.value !== null && Number.isFinite(item.value))
        .map(item => ({
          t: new Date(item.point.date).getTime(),
          v: item.value ?? 0,
        }))

    const series: ChartSeries[] = [
      {
        id: 'teer',
        label: 'TEER',
        color: indexColor.teer,
        points: toPoints(item => buildIndexSeries(item.teer) ?? null),
      },
      {
        id: 'rci',
        label: 'RCI',
        color: indexColor.rci,
        points: toPoints((item) => {
          const rci = buildIndexSeries(item.rci)
          return rci === null ? null : rci * 100
        }),
      },
      {
        id: 'rvi',
        label: 'RVI (bps)',
        color: indexColor.rvi,
        points: toPoints(item => buildIndexSeries(item.rvi_bps)),
      },
    ]

    chartSeries.value = series.filter(item => item.points.length > 0)
    chartDataWindow.value = data.dataWindow ?? null
    if (!chartSeries.value.length) {
      chartError.value = suppressedHistory.value.length
        ? 'History exists, but every point in this window is suppressed by publication thresholds.'
        : 'No index history is available for this corridor yet.'
    }
  }
  catch (err: unknown) {
    chartError.value = err instanceof Error ? err.message : 'Failed to load index chart.'
    chartSeries.value = []
    chartDataWindow.value = null
  }
  finally {
    chartLoading.value = false
  }
}

watch(selectedCorridor, loadChart)
watch([() => meta.date, () => meta.amount_bucket, () => meta.method_profile], loadChart)

const buildQuery = (includePaging = true) => {
  const query: Record<string, unknown> = {
    amount_bucket: meta.amount_bucket,
    method_profile: meta.method_profile,
  }
  const q = filters.q.trim()
  if (filters.date) query.date = filters.date
  if (q) query.q = q
  if (filters.suppressed) query.suppressed = filters.suppressed
  if (filters.sendCurrencies.length > 0) query.send_currencies = filters.sendCurrencies.join(',')
  if (filters.methodology) query.methodology = filters.methodology

  if (includePaging) {
    query.limit = pagination.limit
    query.offset = pagination.offset
  }
  return query
}

const load = async () => {
  if (loading.value) return
  loading.value = true
  error.value = null
  try {
    const response = await request<GoldExportsResponse>('/ops/gold/exports/cdp-daily', {
      method: 'GET',
      query: buildQuery(true),
      timeoutMs: 25000,
      retries: 0,
    })

    if (!response?.success) {
      error.value = response?.message || 'Failed to load Gold exports.'
      rows.value = []
      return
    }

    meta.date = response.meta.date
    meta.amount_bucket = response.meta.amount_bucket
    meta.method_profile = response.meta.method_profile
    meta.last_updated_at = response.meta.last_updated_at

    summary.corridors_total = response.summary.corridors_total
    summary.available = response.summary.available
    summary.suppressed = response.summary.suppressed
    summary.available_ratio = response.summary.available_ratio
    summary.suppressed_ratio = response.summary.suppressed_ratio
    summary.min_provider_count = response.summary.min_provider_count
    summary.weight_confidence_p10 = response.summary.weight_confidence_p10

    pagination.total = response.pagination.total
    pagination.limit = response.pagination.limit
    pagination.offset = response.pagination.offset

    rows.value = response.rows || []
    if (!filters.date && response.meta.date) {
      filters.date = response.meta.date
    }
  }
  catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load Gold exports.'
    rows.value = []
  }
  finally {
    loading.value = false
  }
}

const refresh = () => {
  void load()
}

const applyFilters = () => {
  pagination.offset = 0
  void load()
}

const toggleSendCurrency = (currency: string) => {
  const idx = filters.sendCurrencies.indexOf(currency)
  if (idx >= 0) filters.sendCurrencies.splice(idx, 1)
  else filters.sendCurrencies.push(currency)
  applyFilters()
}

const prevPage = () => {
  pagination.offset = Math.max(0, pagination.offset - pagination.limit)
  void load()
}

const nextPage = () => {
  pagination.offset = Math.min(pagination.total, pagination.offset + pagination.limit)
  void load()
}

const downloadCsv = async () => {
  if (downloading.value) return
  downloading.value = true
  error.value = null
  try {
    const data = await request<string>('/ops/gold/exports/cdp-daily/export', {
      method: 'GET',
      query: buildQuery(false),
      headers: { accept: 'text/csv' },
      timeoutMs: 60000,
      retries: 0,
    })
    if (typeof data !== 'string') {
      error.value = 'Failed to download CSV.'
      return
    }
    const blob = new Blob([data], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    const suffix = meta.date ? meta.date : 'unknown'
    anchor.download = `gold-exports-${suffix}-${meta.method_profile}-${meta.amount_bucket}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to download CSV.'
  }
  finally {
    downloading.value = false
  }
}

const downloadPdf = async () => {
  if (downloading.value) return

  const query = buildQuery(false)
  query.format = 'pdf'
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }

  downloading.value = true
  error.value = null
  try {
    const response = await request<Blob>(`/ops/gold/exports/cdp-daily/export?${params.toString()}`, {
      method: 'GET',
      headers: { accept: 'application/pdf' },
      responseType: 'blob',
      timeoutMs: 60000,
      retries: 0,
    })
    const output = URL.createObjectURL(response)
    const anchor = document.createElement('a')
    anchor.href = output
    const suffix = meta.date ? meta.date : 'unknown'
    anchor.download = `gold-exports-${suffix}-${meta.method_profile}-${meta.amount_bucket}.pdf`
    anchor.click()
    URL.revokeObjectURL(output)
  }
  catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to download PDF.'
  }
  finally {
    downloading.value = false
  }
}

const loadCorrections = async () => {
  correctionsLoading.value = true
  try {
    const res = await getCorrectionLedger({ limit: 50 })
    corrections.value = res.corrections
  }
  catch {
    corrections.value = []
  }
  finally {
    correctionsLoading.value = false
  }
}

const formatPercentRatio = (value?: number | null) => {
  return formatPercent(value, 2)
}

const surfaceOverview = computed<AdminSurfaceOverviewModel>(() => {
  const freshnessTone = getFreshnessTone(meta.last_updated_at, { watchMinutes: 240, criticalMinutes: 720 })
  const suppressionWatch = summary.suppressed_ratio >= 0.35
  return {
    runtimeLabel: summary.corridors_total > 0 ? 'Gold snapshot available' : 'Gold snapshot warming',
    runtimeTone: summary.corridors_total > 0 ? (suppressionWatch ? 'watch' : 'healthy') : 'watch',
    runtimeDetail: summary.corridors_total > 0
      ? 'This surface reads directly from gold_export.cdp_daily and the indices history API.'
      : 'No rows were returned for the selected slice.',
    freshnessLabel: meta.last_updated_at ? formatAdminSurfaceAge(meta.last_updated_at) : 'No snapshot timestamp',
    freshnessTone,
    freshnessDetail: meta.last_updated_at ? `Snapshot updated ${formatTimestamp(meta.last_updated_at)}.` : 'The current slice has not reported a snapshot timestamp.',
    lastJobLabel: meta.last_updated_at ? formatTimestamp(meta.last_updated_at) : 'No successful export job detected',
    lastJobDetail: `Snapshot date ${meta.date || 'n/a'} · ${meta.method_profile} · amount bucket ${meta.amount_bucket}`,
    stats: [
      { label: 'Corridors', value: String(summary.corridors_total) },
      { label: 'Available ratio', value: formatPercent(summary.available_ratio) },
      { label: 'Suppressed ratio', value: formatPercent(summary.suppressed_ratio) },
      { label: 'Corrections loaded', value: String(corrections.value.length) },
    ],
    dependencies: [
      {
        label: 'CDP daily snapshot',
        status: summary.corridors_total > 0 ? 'healthy' : 'watch',
        detail: summary.corridors_total > 0 ? 'The slice returned snapshot rows.' : 'No snapshot rows matched the current slice.',
      },
      {
        label: 'Indices history API',
        status: chartError.value && !suppressedHistory.value.length ? 'watch' : 'healthy',
        detail: suppressedHistory.value.length
          ? 'History exists, but some or all points are suppressed.'
          : chartSeries.value.length > 0
            ? 'Chart history is available for the selected corridor.'
            : chartError.value || 'Select a corridor to inspect history.',
      },
      {
        label: 'Correction ledger',
        status: corrections.value.length > 0 ? 'healthy' : 'watch',
        detail: corrections.value.length > 0 ? 'Historical corrections are available for operator review.' : 'No corrections were returned in the current window.',
      },
    ],
    nextActions: [
      { label: 'Use snapshot date and methodology filters to validate the exact publish contract you intend to export.' },
      { label: 'Inspect suppressed history before concluding that a corridor has no trend line.' },
      { label: 'Treat a high suppression ratio as a publication-readiness signal, not a frontend rendering issue.' },
    ],
    emptyState: rows.value.length === 0
      ? {
          title: 'No rows matched this Gold slice.',
          body: 'Check the snapshot date, methodology version, suppression filter, and send-currency chips before treating this as a pipeline outage.',
        }
      : null,
  }
})

onMounted(() => {
  void load()
  void loadCorrections()
})
</script>
