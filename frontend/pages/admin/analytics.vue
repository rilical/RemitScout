<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header class="rounded-2xl bg-surface p-6 shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-h3 font-semibold text-rs-fg">
              Analytics Console
            </h1>
            <p class="text-body-sm text-rs-muted">
              Internal telemetry insights for corridors, providers, engagement, and savings.
            </p>
          </div>
          <div class="flex flex-wrap items-end gap-3">
            <label class="text-body-sm text-rs-muted">
              Start date
              <input
                v-model="startDate"
                type="date"
                class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              >
            </label>
            <label class="text-body-sm text-rs-muted">
              End date
              <input
                v-model="endDate"
                type="date"
                class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              >
            </label>
            <button
              class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700"
              :disabled="isLoading"
              @click="loadAnalytics"
            >
              {{ isLoading ? 'Loading…' : 'Refresh' }}
            </button>
          </div>
        </div>
        <ErrorState
          v-if="error"
          class="mt-4"
          mode="card"
          :message="error || 'Failed to load data'"
          :on-retry="refresh"
        />
      </header>

      <section class="grid gap-6 lg:grid-cols-3">
        <div class="rounded-2xl bg-surface p-6 shadow-sm lg:col-span-2">
          <h2 class="text-body-lg font-semibold text-rs-fg">Corridor search trends</h2>
          <p class="text-body-sm text-rs-muted">Top corridor sparklines from `/analytics/corridors/trends`.</p>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div
              v-for="trend in corridorTrendCharts"
              :key="trend.corridorId"
              class="rounded-xl border border-rs-border bg-rs-bg p-3"
            >
              <div class="mb-2 text-body-sm font-semibold text-rs-fg">{{ trend.corridorId }}</div>
              <PulseLineChart
:series="trend.series"
unit="number"
/>
            </div>
            <div
              v-if="corridorTrendCharts.length === 0"
              class="rounded-xl border border-dashed border-rs-border p-3 text-body-sm text-rs-muted"
            >
              No trend data available for the selected range.
            </div>
          </div>
        </div>

        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">Provider CTR bars</h2>
          <p class="text-body-sm text-rs-muted">Average CTR by provider from `/analytics/providers/ctr`.</p>
          <div class="mt-4 space-y-2">
            <div
              v-for="bar in providerCtrBars"
              :key="bar.providerId"
            >
              <div class="mb-1 flex items-center justify-between text-body-sm text-rs-muted">
                <span>{{ bar.providerLabel }}</span>
                <span>{{ bar.ctr.toFixed(2) }}%</span>
              </div>
              <div class="h-2 rounded bg-neutral-200">
                <div
                  class="h-2 rounded bg-brand-500"
                  :style="{ width: `${bar.widthPct}%` }"
                />
              </div>
            </div>
            <div
              v-if="providerCtrBars.length === 0"
              class="text-body-sm text-rs-muted"
            >
              No CTR data available.
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Engagement trend</h2>
        <p class="text-body-sm text-rs-muted">Active and returning users over time.</p>
        <div class="mt-4">
          <PulseLineChart
            v-if="engagementSeries.length"
            :series="engagementSeries"
            unit="number"
          />
          <div
            v-else
            class="rounded-xl border border-dashed border-rs-border p-3 text-body-sm text-rs-muted"
          >
            No engagement trend data available.
          </div>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">
            Popular Corridors
          </h2>
          <p class="text-body-sm text-rs-muted">
            Search and click activity with trend indicator.
          </p>
          <div class="mt-4 overflow-auto">
            <table class="min-w-full text-body-sm">
              <thead class="text-body-sm uppercase text-neutral-400">
                <tr>
                  <th class="py-2 text-left">
                    Corridor
                  </th>
                  <th class="py-2 text-right">
                    Searches
                  </th>
                  <th class="py-2 text-right">
                    Clicks
                  </th>
                  <th class="py-2 text-right">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in popularCorridors"
                  :key="row.corridor_id"
                  class="border-t border-neutral-100"
                >
                  <td class="py-2 text-left text-neutral-700">
                    {{ row.from_country }} → {{ row.to_country }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ row.search_count }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ row.click_count }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ row.trend }} ({{ row.trend_percentage }}%)
                  </td>
                </tr>
                <tr v-if="popularCorridors.length === 0">
                  <td
                    colspan="4"
                    class="py-3 text-center text-body-sm text-neutral-400"
                  >
                    No data
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">
            Provider Performance
          </h2>
          <p class="text-body-sm text-rs-muted">
            Click-through rate by provider.
          </p>
          <div class="mt-4 overflow-auto">
            <table class="min-w-full text-body-sm">
              <thead class="text-body-sm uppercase text-neutral-400">
                <tr>
                  <th class="py-2 text-left">
                    Provider
                  </th>
                  <th class="py-2 text-right">
                    Clicks
                  </th>
                  <th class="py-2 text-right">
                    CTR
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in favoriteProviders"
                  :key="row.provider_id"
                  class="border-t border-neutral-100"
                >
                  <td class="py-2 text-left text-neutral-700">
                    {{ row.provider_name || row.provider_id }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ row.click_count }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ row.click_through_rate }}%
                  </td>
                </tr>
                <tr v-if="favoriteProviders.length === 0">
                  <td
                    colspan="3"
                    class="py-3 text-center text-body-sm text-neutral-400"
                  >
                    No data
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">
            Provider Impact
          </h2>
          <p class="text-body-sm text-rs-muted">
            Traffic, clicks, and reported transfer volume by provider.
          </p>
          <div class="mt-4 overflow-auto">
            <table class="min-w-full text-body-sm">
              <thead class="text-body-sm uppercase text-neutral-400">
                <tr>
                  <th class="py-2 text-left">
                    Provider
                  </th>
                  <th class="py-2 text-right">
                    Clicks
                  </th>
                  <th class="py-2 text-right">
                    Unique clickers
                  </th>
                  <th class="py-2 text-right">
                    Conversions
                  </th>
                  <th class="py-2 text-right">
                    Conv rate
                  </th>
                  <th class="py-2 text-right">
                    Reported volume
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in providerImpact"
                  :key="row.provider_id"
                  class="border-t border-neutral-100"
                >
                  <td class="py-2 text-left text-neutral-700">
                    {{ row.provider_name || row.provider_id }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ formatCount(row.total_clicks) }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ formatCount(row.unique_clicks) }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ formatCount(row.conversions) }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ formatRate(row.conversion_rate) }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ formatConversionValues(row.conversion_values) }}
                  </td>
                </tr>
                <tr v-if="providerImpact.length === 0">
                  <td
                    colspan="6"
                    class="py-3 text-center text-body-sm text-neutral-400"
                  >
                    No data
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-2 text-body-sm text-neutral-400">
            Reported volume is sourced from affiliate conversion events.
          </p>
        </div>

        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">
            Top Provider Corridors
          </h2>
          <p class="text-body-sm text-rs-muted">
            Corridors driving the most traffic and value per provider.
          </p>
          <div class="mt-4 overflow-auto">
            <table class="min-w-full text-body-sm">
              <thead class="text-body-sm uppercase text-neutral-400">
                <tr>
                  <th class="py-2 text-left">
                    Provider
                  </th>
                  <th class="py-2 text-left">
                    Corridor
                  </th>
                  <th class="py-2 text-right">
                    Clicks
                  </th>
                  <th class="py-2 text-right">
                    Conversions
                  </th>
                  <th class="py-2 text-right">
                    Conv rate
                  </th>
                  <th class="py-2 text-right">
                    Reported volume
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in providerCorridors"
                  :key="`${row.provider_id}-${row.corridor_id || 'none'}`"
                  class="border-t border-neutral-100"
                >
                  <td class="py-2 text-left text-neutral-700">
                    {{ row.provider_name || row.provider_id }}
                  </td>
                  <td class="py-2 text-left text-neutral-700">
                    {{ row.corridor_id || '-' }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ formatCount(row.total_clicks) }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ formatCount(row.conversions) }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ formatRate(row.conversion_rate) }}
                  </td>
                  <td class="py-2 text-right text-neutral-600">
                    {{ formatConversionValues(row.conversion_values) }}
                  </td>
                </tr>
                <tr v-if="providerCorridors.length === 0">
                  <td
                    colspan="6"
                    class="py-3 text-center text-body-sm text-neutral-400"
                  >
                    No data
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-3">
        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">
            Engagement
          </h2>
          <p class="text-body-sm text-rs-muted">
            Daily engagement summary.
          </p>
          <div class="mt-4 space-y-3 text-body-sm text-neutral-600">
            <div>Avg session duration: {{ sessionMetrics.avg_session_duration.toFixed(1) }}s</div>
            <div>Avg searches/session: {{ sessionMetrics.avg_searches_per_session.toFixed(2) }}</div>
            <div>Bounce rate: {{ sessionMetrics.bounce_rate.toFixed(1) }}%</div>
          </div>
        </div>

        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">
            Heatmap
          </h2>
          <p class="text-body-sm text-rs-muted">
            Top source countries by searches.
          </p>
          <ul class="mt-4 space-y-2 text-body-sm text-neutral-600">
            <li
              v-for="row in heatmap.slice(0, 6)"
              :key="row.country_code"
            >
              {{ row.country_name || row.country_code }} — {{ row.search_count }} searches
            </li>
            <li
              v-if="heatmap.length === 0"
              class="text-body-sm text-neutral-400"
            >
              No data
            </li>
          </ul>
        </div>

        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">
            Savings Snapshot
          </h2>
          <p class="text-body-sm text-rs-muted">
            Fee spread proxy (admin view).
          </p>
          <div class="mt-4 space-y-2 text-body-sm text-neutral-600">
            <div>Total searches: {{ savingsSummary.total_searches }}</div>
            <div>Total fee spread: {{ savingsSummary.total_savings_fees.toFixed(2) }}</div>
            <div>Avg fee spread/search: {{ savingsSummary.avg_savings_per_search.toFixed(2) }}</div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">
          User Behavior Patterns
        </h2>
        <p class="text-body-sm text-rs-muted">
          Search frequency distribution.
        </p>
        <div class="mt-4 grid gap-4 md:grid-cols-3">
          <div
            v-for="pattern in userPatterns"
            :key="pattern.pattern_data.bucket"
            class="rounded-xl border border-neutral-100 p-4"
          >
            <div class="text-body-sm uppercase text-neutral-400">
              {{ pattern.pattern_data.bucket }}
            </div>
            <div class="mt-2 text-body-lg font-semibold text-rs-fg">
              {{ pattern.frequency }}
            </div>
            <div class="text-body-sm text-rs-muted">
              {{ pattern.percentage }}%
            </div>
          </div>
          <div
            v-if="userPatterns.length === 0"
            class="text-body-sm text-neutral-400"
          >
            No data
          </div>
        </div>
      </section>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { ChartSeries } from '~/types/pulse'
import { getAdminApiErrorMessage } from '~/utils/adminApiErrors'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Admin: Analytics | Remit-Scout',
  description: 'Admin analytics dashboard for Remit-Scout.',
})

const ErrorState = defineAsyncComponent(() => import('~/ui/states/ErrorState.vue'))
const PulseLineChart = defineAsyncComponent(() => import('~/components/pulse/PulseLineChart.vue'))

const {
  getPopularCorridors,
  getFavoriteProviders,
  getSessionMetrics,
  getHeatmapData,
  getSavingsMetrics,
  getUserBehaviorPatterns,
  getProviderImpact,
  getCorridorTrends,
  getProviderCTR,
  getEngagementMetrics,
} = useAnalytics()
const { formatMoney } = useRemittanceApi()
const { formatNumber: formatAdminNumber } = useAdminFormat()

const isLoading = ref(false)
const error = ref<string | null>(null)

const toDateInput = (date: Date) => date.toISOString().slice(0, 10)
const today = new Date()
const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

const startDate = ref(toDateInput(weekAgo))
const endDate = ref(toDateInput(today))

const popularCorridors = ref<any[]>([])
const favoriteProviders = ref<any[]>([])
const sessionMetrics = ref({
  total_sessions: 0,
  unique_users: 0,
  avg_session_duration: 0,
  avg_searches_per_session: 0,
  bounce_rate: 0,
})
const heatmap = ref<any[]>([])
const savingsSummary = ref({
  total_searches: 0,
  total_savings_fees: 0,
  total_savings_delta: 0,
  avg_savings_per_search: 0,
  best_provider_savings: 0,
  worst_provider_cost: 0,
})
const userPatterns = ref<any[]>([])
const providerImpact = ref<any[]>([])
const providerCorridors = ref<any[]>([])
const corridorTrendCharts = ref<Array<{ corridorId: string, series: ChartSeries[] }>>([])
const providerCtrBars = ref<Array<{ providerId: string, providerLabel: string, ctr: number, widthPct: number }>>([])
const engagementSeries = ref<ChartSeries[]>([])

const chartColors = {
  corridorSearch: 'rgb(var(--rs-color-brand) / 1)',
  corridorClicks: 'rgb(var(--rs-color-brand) / 0.6)',
  activeUsers: 'rgb(var(--rs-color-brand) / 1)',
  returningUsers: 'rgb(var(--rs-color-brand) / 0.6)',
}

const formatCount = (value: number | string | null | undefined) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return '0'
  return formatAdminNumber(parsed, 0)
}

const formatRate = (value: number | string | null | undefined) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return '0%'
  return `${parsed.toFixed(2)}%`
}

const formatConversionValues = (values?: Record<string, number> | null) => {
  if (!values || typeof values !== 'object') return '-'
  const entries = Object.entries(values).filter(([, amount]) => Number.isFinite(Number(amount)))
  if (!entries.length) return '-'
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) => formatMoney(Number(amount), currency))
    .join(', ')
}

const mapCorridorTrendCharts = (rows: any[]) => {
  const grouped = new Map<string, any[]>()
  for (const row of rows) {
    const corridorId = String(row?.corridor_id || 'unknown')
    const bucket = grouped.get(corridorId) || []
    bucket.push(row)
    grouped.set(corridorId, bucket)
  }

  const sorted = Array.from(grouped.entries())
    .map(([corridorId, values]) => ({
      corridorId,
      values,
      totalSearches: values.reduce((sum, item) => sum + Number(item?.search_count || 0), 0),
    }))
    .sort((a, b) => b.totalSearches - a.totalSearches)
    .slice(0, 4)

  corridorTrendCharts.value = sorted.map(item => ({
    corridorId: item.corridorId,
    series: [
      {
        id: `${item.corridorId}-searches`,
        label: 'Searches',
        color: chartColors.corridorSearch,
        points: item.values.map(row => ({
          t: new Date(row.time_bucket).getTime(),
          v: Number(row.search_count || 0),
        })),
      },
      {
        id: `${item.corridorId}-clicks`,
        label: 'Clicks',
        color: chartColors.corridorClicks,
        points: item.values.map(row => ({
          t: new Date(row.time_bucket).getTime(),
          v: Number(row.click_count || 0),
        })),
      },
    ],
  }))
}

const mapProviderCtrBars = (rows: any[]) => {
  const aggregate = new Map<string, { providerLabel: string, totalCtr: number, samples: number }>()
  for (const row of rows) {
    const providerId = String(row?.provider_id || 'unknown')
    const providerLabel = String(row?.provider_name || providerId)
    const ctr = Number(row?.ctr || 0)
    const current = aggregate.get(providerId) || { providerLabel, totalCtr: 0, samples: 0 }
    current.totalCtr += Number.isFinite(ctr) ? ctr : 0
    current.samples += 1
    aggregate.set(providerId, current)
  }

  const averaged = Array.from(aggregate.entries())
    .map(([providerId, value]) => ({
      providerId,
      providerLabel: value.providerLabel,
      ctr: value.samples > 0 ? value.totalCtr / value.samples : 0,
    }))
    .sort((a, b) => b.ctr - a.ctr)
    .slice(0, 10)

  const maxCtr = Math.max(1, ...averaged.map(row => row.ctr))
  providerCtrBars.value = averaged.map(row => ({
    ...row,
    widthPct: Math.max(4, Math.min(100, (row.ctr / maxCtr) * 100)),
  }))
}

const mapEngagementSeries = (rows: any[]) => {
  engagementSeries.value = [
    {
      id: 'active-users',
      label: 'Active users',
      color: chartColors.activeUsers,
      points: rows.map(row => ({
        t: new Date(row.time_bucket).getTime(),
        v: Number(row.active_users || 0),
      })),
    },
    {
      id: 'returning-users',
      label: 'Returning users',
      color: chartColors.returningUsers,
      points: rows.map(row => ({
        t: new Date(row.time_bucket).getTime(),
        v: Number(row.returning_users || 0),
      })),
    },
  ].filter(series => series.points.length > 0)
}

const loadAnalytics = async () => {
  if (isLoading.value) return
  isLoading.value = true
  error.value = null
  const range = {
    start_date: new Date(startDate.value).toISOString(),
    end_date: new Date(endDate.value).toISOString(),
  }

  try {
    const results = await Promise.allSettled([
      getPopularCorridors({ ...range, limit: 12 }),
      getFavoriteProviders({ ...range, limit: 12 }),
      getSessionMetrics(range),
      getHeatmapData({ ...range, aggregation: 'country' }),
      getSavingsMetrics(range),
      getUserBehaviorPatterns({ ...range, pattern_type: 'search_frequency' }),
      getProviderImpact({ ...range, limit: 50, corridor_limit: 50 }),
      getCorridorTrends({ ...range, bucket: 'day' }),
      getProviderCTR({ ...range, bucket: 'day' }),
      getEngagementMetrics({ ...range, bucket: 'day' }),
    ])

    const [corridors, providers, sessions, heatmapRes, savings, patterns, impact, trends, ctr, engagement] = results
    popularCorridors.value = corridors.status === 'fulfilled' ? (corridors.value?.corridors || []) : []
    favoriteProviders.value = providers.status === 'fulfilled' ? (providers.value?.providers || []) : []
    sessionMetrics.value = sessions.status === 'fulfilled' && sessions.value ? sessions.value : sessionMetrics.value
    heatmap.value = heatmapRes.status === 'fulfilled' ? (heatmapRes.value?.heatmap || []) : []
    savingsSummary.value = savings.status === 'fulfilled' && savings.value?.summary ? savings.value.summary : savingsSummary.value
    userPatterns.value = patterns.status === 'fulfilled' ? (patterns.value?.patterns || []) : []
    providerImpact.value = impact.status === 'fulfilled' ? (impact.value?.providers || []) : []
    providerCorridors.value = impact.status === 'fulfilled' ? (impact.value?.corridors || []) : []

    if (trends.status === 'fulfilled') {
      mapCorridorTrendCharts(trends.value?.trends || [])
    }
    else {
      corridorTrendCharts.value = []
    }

    if (ctr.status === 'fulfilled') {
      mapProviderCtrBars(ctr.value?.ctr_data || [])
    }
    else {
      providerCtrBars.value = []
    }

    if (engagement.status === 'fulfilled') {
      mapEngagementSeries(engagement.value?.engagement || [])
    }
    else {
      engagementSeries.value = []
    }

    const failures = results.filter(r => r.status === 'rejected')
    if (failures.length === results.length) {
      const reason = (failures[0] as PromiseRejectedResult).reason
      error.value = getAdminApiErrorMessage(reason, 'All analytics endpoints failed to load.')
    }
    else if (failures.length > 0) {
      error.value = `${failures.length} of ${results.length} analytics panels failed to load.`
    }
  }
  catch (err: unknown) {
    error.value = getAdminApiErrorMessage(err, 'Failed to load analytics.')
  }
  finally {
    isLoading.value = false
  }
}

const refresh = () => {
  void loadAnalytics()
}

onMounted(loadAnalytics)
</script>
