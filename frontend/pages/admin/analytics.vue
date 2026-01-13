<template>
  <div class="min-h-screen bg-slate-50 px-6 py-10">
    <div class="mx-auto flex max-w-6xl flex-col gap-6">
      <header class="rounded-2xl bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-slate-900">Analytics Console</h1>
            <p class="text-sm text-slate-500">Internal telemetry insights for corridors, providers, engagement, and savings.</p>
          </div>
          <div class="flex flex-wrap items-end gap-3">
            <label class="text-xs text-slate-500">
              Start date
              <input v-model="startDate" type="date" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label class="text-xs text-slate-500">
              End date
              <input v-model="endDate" type="date" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <button
              class="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              @click="loadAnalytics"
              :disabled="loading"
            >
              {{ loading ? 'Loading…' : 'Refresh' }}
            </button>
          </div>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
      </header>

      <section class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Popular Corridors</h2>
          <p class="text-xs text-slate-500">Search and click activity with trend indicator.</p>
          <div class="mt-4 overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="text-xs uppercase text-slate-400">
                <tr>
                  <th class="py-2 text-left">Corridor</th>
                  <th class="py-2 text-right">Searches</th>
                  <th class="py-2 text-right">Clicks</th>
                  <th class="py-2 text-right">Trend</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in popularCorridors" :key="row.corridor_id" class="border-t border-slate-100">
                  <td class="py-2 text-left text-slate-700">
                    {{ row.from_country }} → {{ row.to_country }}
                  </td>
                  <td class="py-2 text-right text-slate-600">{{ row.search_count }}</td>
                  <td class="py-2 text-right text-slate-600">{{ row.click_count }}</td>
                  <td class="py-2 text-right text-slate-600">
                    {{ row.trend }} ({{ row.trend_percentage }}%)
                  </td>
                </tr>
                <tr v-if="popularCorridors.length === 0">
                  <td colspan="4" class="py-3 text-center text-xs text-slate-400">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Provider Performance</h2>
          <p class="text-xs text-slate-500">Click-through rate by provider.</p>
          <div class="mt-4 overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="text-xs uppercase text-slate-400">
                <tr>
                  <th class="py-2 text-left">Provider</th>
                  <th class="py-2 text-right">Clicks</th>
                  <th class="py-2 text-right">CTR</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in favoriteProviders" :key="row.provider_id" class="border-t border-slate-100">
                  <td class="py-2 text-left text-slate-700">
                    {{ row.provider_name || row.provider_id }}
                  </td>
                  <td class="py-2 text-right text-slate-600">{{ row.click_count }}</td>
                  <td class="py-2 text-right text-slate-600">{{ row.click_through_rate }}%</td>
                </tr>
                <tr v-if="favoriteProviders.length === 0">
                  <td colspan="3" class="py-3 text-center text-xs text-slate-400">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Provider Impact</h2>
          <p class="text-xs text-slate-500">Traffic, clicks, and reported transfer volume by provider.</p>
          <div class="mt-4 overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="text-xs uppercase text-slate-400">
                <tr>
                  <th class="py-2 text-left">Provider</th>
                  <th class="py-2 text-right">Clicks</th>
                  <th class="py-2 text-right">Unique clickers</th>
                  <th class="py-2 text-right">Conversions</th>
                  <th class="py-2 text-right">Conv rate</th>
                  <th class="py-2 text-right">Reported volume</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in providerImpact" :key="row.provider_id" class="border-t border-slate-100">
                  <td class="py-2 text-left text-slate-700">{{ row.provider_name || row.provider_id }}</td>
                  <td class="py-2 text-right text-slate-600">{{ formatCount(row.total_clicks) }}</td>
                  <td class="py-2 text-right text-slate-600">{{ formatCount(row.unique_clicks) }}</td>
                  <td class="py-2 text-right text-slate-600">{{ formatCount(row.conversions) }}</td>
                  <td class="py-2 text-right text-slate-600">{{ formatRate(row.conversion_rate) }}</td>
                  <td class="py-2 text-right text-slate-600">{{ formatConversionValues(row.conversion_values) }}</td>
                </tr>
                <tr v-if="providerImpact.length === 0">
                  <td colspan="6" class="py-3 text-center text-xs text-slate-400">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-2 text-xs text-slate-400">Reported volume is sourced from affiliate conversion events.</p>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Top Provider Corridors</h2>
          <p class="text-xs text-slate-500">Corridors driving the most traffic and value per provider.</p>
          <div class="mt-4 overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="text-xs uppercase text-slate-400">
                <tr>
                  <th class="py-2 text-left">Provider</th>
                  <th class="py-2 text-left">Corridor</th>
                  <th class="py-2 text-right">Clicks</th>
                  <th class="py-2 text-right">Conversions</th>
                  <th class="py-2 text-right">Conv rate</th>
                  <th class="py-2 text-right">Reported volume</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in providerCorridors" :key="`${row.provider_id}-${row.corridor_id || 'none'}`" class="border-t border-slate-100">
                  <td class="py-2 text-left text-slate-700">{{ row.provider_name || row.provider_id }}</td>
                  <td class="py-2 text-left text-slate-700">{{ row.corridor_id || '-' }}</td>
                  <td class="py-2 text-right text-slate-600">{{ formatCount(row.total_clicks) }}</td>
                  <td class="py-2 text-right text-slate-600">{{ formatCount(row.conversions) }}</td>
                  <td class="py-2 text-right text-slate-600">{{ formatRate(row.conversion_rate) }}</td>
                  <td class="py-2 text-right text-slate-600">{{ formatConversionValues(row.conversion_values) }}</td>
                </tr>
                <tr v-if="providerCorridors.length === 0">
                  <td colspan="6" class="py-3 text-center text-xs text-slate-400">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-3">
        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Engagement</h2>
          <p class="text-xs text-slate-500">Daily engagement summary.</p>
          <div class="mt-4 space-y-3 text-sm text-slate-600">
            <div>Avg session duration: {{ sessionMetrics.avg_session_duration.toFixed(1) }}s</div>
            <div>Avg searches/session: {{ sessionMetrics.avg_searches_per_session.toFixed(2) }}</div>
            <div>Bounce rate: {{ sessionMetrics.bounce_rate.toFixed(1) }}%</div>
          </div>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Heatmap</h2>
          <p class="text-xs text-slate-500">Top source countries by searches.</p>
          <ul class="mt-4 space-y-2 text-sm text-slate-600">
            <li v-for="row in heatmap.slice(0, 6)" :key="row.country_code">
              {{ row.country_name || row.country_code }} — {{ row.search_count }} searches
            </li>
            <li v-if="heatmap.length === 0" class="text-xs text-slate-400">No data</li>
          </ul>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Savings Snapshot</h2>
          <p class="text-xs text-slate-500">Fee spread proxy (admin view).</p>
          <div class="mt-4 space-y-2 text-sm text-slate-600">
            <div>Total searches: {{ savingsSummary.total_searches }}</div>
            <div>Total fee spread: {{ savingsSummary.total_savings_fees.toFixed(2) }}</div>
            <div>Avg fee spread/search: {{ savingsSummary.avg_savings_per_search.toFixed(2) }}</div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">User Behavior Patterns</h2>
        <p class="text-xs text-slate-500">Search frequency distribution.</p>
        <div class="mt-4 grid gap-4 md:grid-cols-3">
          <div v-for="pattern in userPatterns" :key="pattern.pattern_data.bucket" class="rounded-xl border border-slate-100 p-4">
            <div class="text-xs uppercase text-slate-400">{{ pattern.pattern_data.bucket }}</div>
            <div class="mt-2 text-lg font-semibold text-slate-900">{{ pattern.frequency }}</div>
            <div class="text-xs text-slate-500">{{ pattern.percentage }}%</div>
          </div>
          <div v-if="userPatterns.length === 0" class="text-xs text-slate-400">No data</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { getPopularCorridors, getFavoriteProviders, getSessionMetrics, getHeatmapData, getSavingsMetrics, getUserBehaviorPatterns, getProviderImpact, loading, error } = useAnalytics()
const { formatMoney } = useRemittanceApi()

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

const formatCount = (value: number | string | null | undefined) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return '0'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(parsed)
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

const loadAnalytics = async () => {
  const range = {
    start_date: new Date(startDate.value).toISOString(),
    end_date: new Date(endDate.value).toISOString(),
  }

  const [corridors, providers, sessions, heatmapRes, savings, patterns, impact] = await Promise.all([
    getPopularCorridors({ ...range, limit: 12 }),
    getFavoriteProviders({ ...range, limit: 12 }),
    getSessionMetrics(range),
    getHeatmapData({ ...range, aggregation: 'country' }),
    getSavingsMetrics(range),
    getUserBehaviorPatterns({ ...range, pattern_type: 'search_frequency' }),
    getProviderImpact({ ...range, limit: 50, corridor_limit: 50 }),
  ])

  popularCorridors.value = corridors?.corridors || []
  favoriteProviders.value = providers?.providers || []
  sessionMetrics.value = sessions || sessionMetrics.value
  heatmap.value = heatmapRes?.heatmap || []
  savingsSummary.value = savings?.summary || savingsSummary.value
  userPatterns.value = patterns?.patterns || []
  providerImpact.value = impact?.providers || []
  providerCorridors.value = impact?.corridors || []
}

onMounted(loadAnalytics)
</script>
