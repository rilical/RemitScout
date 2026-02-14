<template>
  <div class="min-h-screen bg-neutral-50 px-6 py-10">
    <div class="mx-auto flex max-w-6xl flex-col gap-6">
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
                  <td class="py-2 text-right text-neutral-600">{{ formatNumber(row.teer_rate, 6) }}</td>
                  <td class="py-2 text-right text-neutral-600">{{ formatPercentRatio(row.rci_ratio) }}</td>
                  <td class="py-2 text-right text-neutral-600">{{ formatNumber(row.rvi_bps, 1) }}</td>
                  <td class="py-2 text-right text-neutral-600">{{ row.provider_count ?? 'n/a' }}</td>
                  <td class="py-2 text-right text-neutral-600">{{ formatNumber(row.weight_confidence, 3) }}</td>
                  <td class="py-2 text-body-sm text-rs-muted">
                    <div class="font-medium text-neutral-700">{{ row.suppression_flag ? 'suppressed' : 'ok' }}</div>
                    <div class="text-[11px] text-neutral-400">{{ row.suppression_reason || '—' }}</div>
                  </td>
                </tr>
                <tr v-if="rows.length === 0">
                  <td
                    colspan="7"
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
              <div class="mt-1 text-body-lg font-semibold text-rs-fg">{{ formatNumber(summary.weight_confidence_p10, 3) }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { setSeo } from '~/composables/useSeo'

definePageMeta({ middleware: ['auth', 'admin'] })

const route = useRoute()
const runtimeConfig = useRuntimeConfig()

setSeo({
  title: 'Admin: Gold Exports | Remit-Scout',
  description: 'Admin Gold exports viewer.',
  canonical: `${runtimeConfig.public.siteUrl}${route.path}`,
  noindex: true,
})

const ErrorState = defineAsyncComponent(() => import('~/ui/states/ErrorState.vue'))

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
  pagination: { total: number; limit: number; offset: number }
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

const filters = reactive({
  q: '',
  suppressed: '' as '' | '0' | '1',
  sendCurrencies: [] as string[],
})

const buildQuery = (includePaging = true) => {
  const query: Record<string, unknown> = {
    amount_bucket: meta.amount_bucket,
    method_profile: meta.method_profile,
  }
  const q = filters.q.trim()
  if (q) query.q = q
  if (filters.suppressed) query.suppressed = filters.suppressed
  if (filters.sendCurrencies.length > 0) query.send_currencies = filters.sendCurrencies.join(',')

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

const formatTimestamp = (value?: string | null) => {
  if (!value) return 'n/a'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'n/a'
  return date.toLocaleString()
}

const formatPercent = (value?: number | null) => {
  if (!Number.isFinite(value)) return 'n/a'
  return `${(Number(value) * 100).toFixed(1)}%`
}

const formatPercentRatio = (value?: number | null) => {
  if (!Number.isFinite(value)) return 'n/a'
  return `${(Number(value) * 100).toFixed(2)}%`
}

const formatNumber = (value?: number | null, fractionDigits = 2) => {
  if (!Number.isFinite(value)) return 'n/a'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: fractionDigits }).format(Number(value))
}

onMounted(load)
</script>
