<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Self-Healing Pipeline"
      subtitle="Agent actions, failure bundles, and repair metrics."
      :loading="loading"
      :error="error"
      :meta="pageMeta"
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-3">
          <label class="text-body-sm inline-flex items-center gap-2 text-rs-muted">
            <input
              v-model="autoRefresh"
              type="checkbox"
              class="h-4 w-4 rounded border-rs-border text-brand-600"
            />
            Auto-refresh
            <span v-if="autoRefresh" class="font-semibold tabular-nums text-rs-fg"
              >{{ countdown }}s</span
            >
          </label>
          <button
            class="text-body-sm h-10 rounded-lg bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            :disabled="refreshDisabled"
            @click="load"
          >
            {{ refreshDisabled ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
      </template>
    </AdminPageShell>

    <template v-if="!loading && !error">
      <section
        class="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br p-6 text-white shadow-[0_24px_70px_-34px_rgba(15,23,42,0.9)]"
        :class="heroGradientClass"
      >
        <div
          class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_26%)]"
        />
        <div class="relative grid gap-6 lg:grid-cols-[1.45fr,0.95fr]">
          <div>
            <span
              class="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
              :class="heroBadgeClass"
            >
              {{ heroBadgeLabel }}
            </span>
            <h2 class="mt-4 text-[1.9rem] font-semibold leading-tight">
              {{ heroTitle }}
            </h2>
            <p class="text-body-sm text-white/72 mt-2 max-w-2xl">
              {{ heroBody }}
            </p>

            <div class="mt-5 grid gap-3 sm:grid-cols-3">
              <div class="border-white/12 bg-white/8 rounded-2xl border p-4 backdrop-blur-sm">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  Open Incidents
                </p>
                <p class="text-h3 mt-2 font-semibold tabular-nums">
                  {{ insights.summary.openCount }}
                </p>
                <p class="text-caption text-white/62 mt-1">
                  {{ insights.summary.criticalOpenCount }} critical · median age
                  {{ formatDuration(insights.summary.medianOpenAgeSeconds) }}
                </p>
              </div>
              <div class="border-white/12 bg-white/8 rounded-2xl border p-4 backdrop-blur-sm">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  Repair Hit Rate
                </p>
                <p class="text-h3 mt-2 font-semibold tabular-nums">
                  {{ formatPercent(insights.repairHitRate, 0) }}
                </p>
                <p class="text-caption text-white/62 mt-1">
                  {{ insights.appliedBundlesInTrend }} applied from
                  {{ insights.totalBundlesInTrend }} bundles in the 7d window
                </p>
              </div>
              <div class="border-white/12 bg-white/8 rounded-2xl border p-4 backdrop-blur-sm">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  Blast Radius
                </p>
                <p class="text-h3 mt-2 font-semibold tabular-nums">
                  {{ insights.impactedCorridors }}
                </p>
                <p class="text-caption text-white/62 mt-1">
                  {{ insights.impactedModules }} modules touched · hottest
                  {{ insights.hottestModuleId ?? 'n/a' }}
                </p>
              </div>
            </div>
          </div>

          <div class="border-white/12 bg-slate-950/28 rounded-[24px] border p-5 backdrop-blur-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Operator Focus
                </p>
                <h3 class="text-body-lg mt-1 font-semibold">What needs attention next</h3>
              </div>
              <span
                class="border-white/12 bg-white/8 text-caption rounded-full border px-3 py-1 font-medium text-white/80"
              >
                {{
                  insights.latestAction
                    ? `Latest ${formatDateTime(insights.latestAction.created_at)}`
                    : 'No recent actions'
                }}
              </span>
            </div>

            <div class="mt-4 space-y-3">
              <div class="bg-white/6 rounded-2xl border border-white/10 p-4">
                <p class="text-caption text-white/92 font-semibold">Current queue pressure</p>
                <p class="text-body-sm mt-1 text-white/70">
                  {{ metrics?.pending_bundles ?? 0 }} pending bundles ·
                  {{ insights.queuedActions }} queued approvals ·
                  {{ insights.executingActions }} executing repairs
                </p>
              </div>
              <div class="bg-white/6 rounded-2xl border border-white/10 p-4">
                <p class="text-caption text-white/92 font-semibold">Hot incident</p>
                <p class="text-body-sm text-white/72 mt-1">
                  {{
                    insights.hottestIncident
                      ? `${insights.hottestIncident.module_id} · ${insights.hottestIncident.severity} · ${insights.hottestIncident.affected_corridor_count} corridors`
                      : 'No open incidents. Recent bundles appear resolved or the pipeline is still warming.'
                  }}
                </p>
              </div>
              <div class="bg-white/6 rounded-2xl border border-white/10 p-4">
                <p class="text-caption text-white/92 font-semibold">Completion mix</p>
                <p class="text-body-sm text-white/72 mt-1">
                  {{ insights.completedActions }} completed · {{ insights.failedActions }} failed ·
                  success {{ formatPercent(insights.actionSuccessRate, 0) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="degradedFeeds.length"
        class="text-body-sm rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-amber-900 shadow-sm"
      >
        <div class="font-semibold">Some self-healing feeds are degraded.</div>
        <p class="mt-1 text-amber-800">
          {{ degradedFeeds.join(' ') }}
        </p>
      </section>

      <SelfHealingKpiTiles :metrics="metrics" />

      <section
        v-if="showEmptyState"
        class="rounded-[24px] border border-dashed border-rs-border bg-rs-surface p-6 shadow-sm"
      >
        <div class="max-w-3xl">
          <h2 class="text-body-lg font-semibold text-rs-fg">Repair telemetry is warming up</h2>
          <p class="text-body-sm mt-2 text-rs-muted">
            The page is live, but staging has not emitted recent agent actions or failure bundles
            for this window. If activity is expected, check the orchestrator schedules, queue depth,
            and module registry policies rather than assuming the UI is broken.
          </p>
          <div class="mt-4 grid gap-3 sm:grid-cols-3">
            <div class="bg-rs-surface-2/60 rounded-2xl border border-rs-border p-4">
              <p class="text-caption text-rs-muted">Actions</p>
              <p class="text-body-lg mt-1 font-semibold text-rs-fg">{{ actions.length }}</p>
            </div>
            <div class="bg-rs-surface-2/60 rounded-2xl border border-rs-border p-4">
              <p class="text-caption text-rs-muted">Bundles</p>
              <p class="text-body-lg mt-1 font-semibold text-rs-fg">{{ bundles.length }}</p>
            </div>
            <div class="bg-rs-surface-2/60 rounded-2xl border border-rs-border p-4">
              <p class="text-caption text-rs-muted">7d bundle count</p>
              <p class="text-body-lg mt-1 font-semibold text-rs-fg">
                {{ insights.totalBundlesInTrend }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <template v-else>
        <section class="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <article class="rounded-[24px] border border-rs-border bg-rs-surface p-6 shadow-sm">
            <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-body-lg font-semibold text-rs-fg">Recent Agent Actions</h2>
                <p class="text-body-sm mt-1 text-rs-muted">
                  Last {{ actions.length }} actions across all registered agents.
                </p>
              </div>
              <div
                class="bg-rs-surface-2/60 text-caption rounded-2xl border border-rs-border px-3 py-2 text-rs-muted"
              >
                {{
                  insights.latestAction
                    ? `Latest activity ${formatDateTime(insights.latestAction.created_at)}`
                    : 'No recent activity'
                }}
              </div>
            </div>
            <AgentActionTimeline :actions="actions" />
          </article>

          <article class="rounded-[24px] border border-rs-border bg-rs-surface p-6 shadow-sm">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-body-lg font-semibold text-rs-fg">Incident Watchlist</h2>
                <p class="text-body-sm mt-1 text-rs-muted">
                  The highest-pressure bundles still unresolved.
                </p>
              </div>
              <span
                class="bg-rs-surface-2 text-caption rounded-full px-3 py-1 font-medium text-rs-muted"
              >
                {{ insights.summary.watchlist.length }} active
              </span>
            </div>

            <div v-if="insights.summary.watchlist.length" class="mt-4 space-y-3">
              <div
                v-for="incident in insights.summary.watchlist"
                :key="incident.bundle_id"
                class="bg-rs-surface-2/50 rounded-2xl border border-rs-border p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-body-sm font-semibold text-rs-fg">{{ incident.module_id }}</p>
                    <p class="text-caption mt-1 text-rs-muted">
                      {{ incident.category }} · {{ incident.affected_corridor_count }} corridors ·
                      {{ incident.consecutive_failures }} consecutive failures
                    </p>
                  </div>
                  <span
                    class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    :class="severityClass(incident.severity)"
                  >
                    {{ incident.severity }}
                  </span>
                </div>
                <p class="text-caption mt-3 text-rs-muted">
                  Open for {{ formatDuration(incident.elapsed_seconds) }} · triage
                  {{ incident.triage_at ? formatDateTime(incident.triage_at) : 'pending' }}
                </p>
              </div>
            </div>
            <div
              v-else
              class="bg-rs-surface-2/40 text-body-sm mt-4 rounded-2xl border border-dashed border-rs-border p-4 text-rs-muted"
            >
              No active incidents. Resolved bundles are moving through the repair loop cleanly.
            </div>
          </article>
        </section>

        <section class="rounded-[24px] border border-rs-border bg-rs-surface p-6 shadow-sm">
          <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-body-lg font-semibold text-rs-fg">Failure Rate Trends</h2>
              <p class="text-body-sm mt-1 text-rs-muted">
                Daily bundle volume and applied repairs over the last 7 days.
              </p>
            </div>
            <div
              class="bg-rs-surface-2/60 text-caption rounded-2xl border border-rs-border px-3 py-2 text-rs-muted"
            >
              {{ insights.appliedBundlesInTrend }} applied repairs in-window
            </div>
          </div>
          <div
            v-if="feedErrors.trends && !trendsData?.points?.length"
            class="bg-rs-surface-2/50 text-body-sm flex h-48 items-center justify-center rounded-xl border border-dashed border-rs-border text-rs-muted"
          >
            Trend data is unavailable right now.
          </div>
          <template v-else-if="trendsData?.points?.length">
            <FailureTrendsChart :points="trendsData.points" />
            <p v-if="insights.totalBundlesInTrend === 0" class="text-caption mt-3 text-rs-muted">
              No new bundle pressure was recorded in the current 7-day window.
            </p>
          </template>
          <div
            v-else
            class="bg-rs-surface-2/50 text-body-sm flex h-48 items-center justify-center rounded-xl border border-dashed border-rs-border text-rs-muted"
          >
            No trend data available yet.
          </div>
        </section>

        <section class="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <article class="rounded-[24px] border border-rs-border bg-rs-surface p-6 shadow-sm">
            <h2 class="text-body-lg font-semibold text-rs-fg">Failure Bundles</h2>
            <p class="text-body-sm mb-4 mt-1 text-rs-muted">
              Active and recently resolved bundles in the repair pipeline.
            </p>
            <FailureBundleTable :bundles="bundles" />
          </article>

          <article class="rounded-[24px] border border-rs-border bg-rs-surface p-6 shadow-sm">
            <h2 class="text-body-lg font-semibold text-rs-fg">Operational Readout</h2>
            <div class="mt-4 space-y-3">
              <div class="bg-rs-surface-2/50 rounded-2xl border border-rs-border p-4">
                <p class="text-caption text-rs-muted">Resolved incidents</p>
                <p class="text-body-lg mt-1 font-semibold text-rs-fg">
                  {{ insights.summary.resolvedCount }}
                </p>
                <p class="text-caption mt-1 text-rs-muted">
                  Median resolution {{ formatDuration(insights.summary.medianResolutionSeconds) }}
                </p>
              </div>
              <div class="bg-rs-surface-2/50 rounded-2xl border border-rs-border p-4">
                <p class="text-caption text-rs-muted">Action completion</p>
                <p class="text-body-lg mt-1 font-semibold text-rs-fg">
                  {{ insights.completedActions }} completed
                </p>
                <p class="text-caption mt-1 text-rs-muted">
                  {{ insights.failedActions }} failed · {{ insights.executingActions }} in-flight
                </p>
              </div>
              <div class="bg-rs-surface-2/50 rounded-2xl border border-rs-border p-4">
                <p class="text-caption text-rs-muted">MTTD / MTTR</p>
                <p class="text-body-lg mt-1 font-semibold text-rs-fg">
                  {{ formatMinutes(metrics?.mttd_minutes) }} /
                  {{ formatMinutes(metrics?.mttr_minutes) }}
                </p>
                <p class="text-caption mt-1 text-rs-muted">Period {{ metrics?.period ?? '7d' }}</p>
              </div>
            </div>
          </article>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  AgentActionEntry,
  FailureBundleSummary,
  FailureTrendsResponse,
  SelfHealingMetrics,
} from '~/types/agents'
import {
  getAgentActions,
  getFailureBundles,
  getFailureTrends,
  getSelfHealingMetrics,
} from '~/lib/opsApi'
import { getAdminApiErrorMessage } from '~/utils/adminApiErrors'
import { buildSelfHealingInsights } from '~/utils/adminInsights'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Self-Healing Pipeline | Remit-Scout',
  description: 'Agent actions, failure bundles, and repair metrics.',
})

type FeedKey = 'metrics' | 'actions' | 'bundles' | 'trends'

const { formatDateTime, formatDuration, formatPercent } = useAdminFormat()

const loading = ref(true)
const refreshing = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<string | null>(null)
const metrics = ref<SelfHealingMetrics | null>(null)
const actions = ref<AgentActionEntry[]>([])
const bundles = ref<FailureBundleSummary[]>([])
const trendsData = ref<FailureTrendsResponse | null>(null)
const feedErrors = ref<Partial<Record<FeedKey, string>>>({})

const autoRefresh = ref(false)
const countdown = ref(60)
let timer: ReturnType<typeof setInterval> | null = null

const feedLabels: Record<FeedKey, string> = {
  metrics: 'KPI metrics',
  actions: 'Recent actions',
  bundles: 'Failure bundles',
  trends: 'Trend chart',
}

const insights = computed(() =>
  buildSelfHealingInsights(
    metrics.value,
    actions.value,
    bundles.value,
    trendsData.value?.points ?? [],
  ),
)

const degradedFeeds = computed(() =>
  Object.entries(feedErrors.value).map(
    ([key, message]) => `${feedLabels[key as FeedKey]}: ${message}`,
  ),
)

const pageMeta = computed(() => {
  const parts: string[] = []
  if (lastUpdated.value) parts.push(`Last updated: ${formatDateTime(lastUpdated.value)}`)
  if (degradedFeeds.value.length)
    parts.push(
      `${degradedFeeds.value.length} degraded feed${degradedFeeds.value.length === 1 ? '' : 's'}`,
    )
  return parts.join(' · ') || null
})

const refreshDisabled = computed(() => loading.value || refreshing.value)
const showEmptyState = computed(
  () =>
    insights.value.telemetryState !== 'live' &&
    actions.value.length === 0 &&
    bundles.value.length === 0,
)

const heroTone = computed<'stable' | 'active' | 'critical'>(() => {
  if (insights.value.summary.criticalOpenCount > 0 || insights.value.failedActions > 0)
    return 'critical'
  if (
    insights.value.summary.openCount > 0 ||
    insights.value.executingActions > 0 ||
    (metrics.value?.pending_bundles ?? 0) > 0
  )
    return 'active'
  return 'stable'
})

const heroBadgeLabel = computed(() => {
  if (insights.value.telemetryState === 'empty') return 'No Telemetry'
  if (insights.value.telemetryState === 'warming') return 'Warming'
  if (heroTone.value === 'critical') return 'Critical Pressure'
  if (heroTone.value === 'active') return 'Active Repairs'
  return 'Stable'
})

const heroTitle = computed(() => {
  if (insights.value.telemetryState === 'empty') return 'Self-healing telemetry has not landed yet.'
  if (insights.value.telemetryState === 'warming')
    return 'Repair loops are wired, but this window is still quiet.'
  if (heroTone.value === 'critical')
    return 'The repair loop is absorbing live failures and needs operator attention.'
  if (heroTone.value === 'active')
    return 'Repairs are moving through the loop with open work still in flight.'
  return 'The repair loop is healthy and resolving pressure before it spreads.'
})

const heroBody = computed(() => {
  if (insights.value.telemetryState !== 'live') {
    return 'This view stays useful even when staging is quiet: it preserves partial data, highlights degraded feeds, and makes it obvious whether the issue is missing telemetry or a broken request path.'
  }
  return `Current posture: ${insights.value.summary.openCount} open incidents, ${metrics.value?.pending_bundles ?? 0} pending bundles, and ${formatPercent(insights.value.actionSuccessRate, 0)} completion on terminal actions.`
})

const heroGradientClass = computed(() => {
  if (heroTone.value === 'critical') return 'from-rose-950 via-slate-950 to-amber-950'
  if (heroTone.value === 'active') return 'from-slate-950 via-blue-950 to-cyan-950'
  return 'from-emerald-950 via-slate-950 to-slate-900'
})

const heroBadgeClass = computed(() => {
  if (heroTone.value === 'critical') return 'border-rose-300/25 bg-rose-400/12 text-rose-100'
  if (heroTone.value === 'active') return 'border-sky-300/25 bg-sky-400/12 text-sky-100'
  return 'border-emerald-300/25 bg-emerald-400/12 text-emerald-100'
})

watch(autoRefresh, enabled => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (enabled) {
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) {
        countdown.value = 60
        void load()
      }
    }, 1000)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const severityClass = (severity: string | null) => {
  if (severity === 'critical') return 'bg-red-100 text-red-700'
  if (severity === 'high') return 'bg-orange-100 text-orange-700'
  if (severity === 'medium') return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

const formatMinutes = (value: number | null | undefined): string =>
  value == null ? '—' : `${value.toFixed(1)}m`

const load = async () => {
  if (refreshDisabled.value) return

  const hasVisibleData = Boolean(
    metrics.value ||
    actions.value.length ||
    bundles.value.length ||
    trendsData.value?.points?.length,
  )

  if (loading.value && !hasVisibleData) {
    error.value = null
  } else {
    refreshing.value = true
  }

  const nextFeedErrors: Partial<Record<FeedKey, string>> = {}
  const [metricsRes, actionsRes, bundlesRes, trendsRes] = await Promise.allSettled([
    getSelfHealingMetrics(),
    getAgentActions({ limit: 20 }),
    getFailureBundles({ limit: 25 }),
    getFailureTrends({ days: 7 }),
  ])

  let fulfilled = 0

  if (metricsRes.status === 'fulfilled') {
    metrics.value = metricsRes.value
    fulfilled += 1
  } else {
    nextFeedErrors.metrics = getAdminApiErrorMessage(
      metricsRes.reason,
      'Metrics are temporarily unavailable.',
    )
  }

  if (actionsRes.status === 'fulfilled') {
    actions.value = actionsRes.value.actions
    fulfilled += 1
  } else {
    nextFeedErrors.actions = getAdminApiErrorMessage(
      actionsRes.reason,
      'Recent actions are temporarily unavailable.',
    )
  }

  if (bundlesRes.status === 'fulfilled') {
    bundles.value = bundlesRes.value.bundles
    fulfilled += 1
  } else {
    nextFeedErrors.bundles = getAdminApiErrorMessage(
      bundlesRes.reason,
      'Failure bundles are temporarily unavailable.',
    )
  }

  if (trendsRes.status === 'fulfilled') {
    trendsData.value = trendsRes.value
    fulfilled += 1
  } else {
    nextFeedErrors.trends = getAdminApiErrorMessage(
      trendsRes.reason,
      'Trend data is temporarily unavailable.',
    )
  }

  feedErrors.value = nextFeedErrors

  if (fulfilled > 0) {
    lastUpdated.value = new Date().toISOString()
    error.value = null
  } else if (!hasVisibleData) {
    error.value = 'Failed to load the self-healing pipeline.'
  }

  loading.value = false
  refreshing.value = false
}

onMounted(() => {
  void load()
})
</script>
