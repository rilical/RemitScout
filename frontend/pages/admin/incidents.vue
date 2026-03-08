<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Incident Timeline"
      subtitle="Failure-bundle detection, triage, repair progress, and operator watchlist."
      :loading="loading"
      :error="error"
      :meta="lastUpdated ? `Last updated: ${formatDateTime(lastUpdated)}` : undefined"
    >
      <template #actions>
        <div class="flex flex-wrap items-center justify-end gap-3">
          <label class="inline-flex items-center gap-2 text-body-sm text-rs-muted">
            <input
              v-model="autoRefresh"
              type="checkbox"
              class="h-4 w-4 rounded border-rs-border text-brand-600"
            >
            Auto-refresh
            <span
              v-if="autoRefresh"
              class="tabular-nums font-semibold text-rs-fg"
            >
              {{ countdown }}s
            </span>
          </label>
          <button
            class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            :disabled="loading"
            @click="load"
          >
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </template>
    </AdminPageShell>

    <template v-if="!loading && !error">
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="card in summaryCards"
          :key="card.label"
          class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm"
        >
          <p class="text-caption font-semibold uppercase tracking-wide text-rs-muted">{{ card.label }}</p>
          <p class="mt-3 text-h4 font-semibold text-rs-fg">{{ card.value }}</p>
          <p class="mt-2 text-body-sm text-rs-muted">{{ card.detail }}</p>
        </article>
      </section>

      <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Timeline Controls</h2>
            <p class="mt-1 text-body-sm text-rs-muted">
              Showing {{ formatNumber(filteredIncidents.length) }} of {{ formatNumber(bundleTotal) }} failure bundles with {{ formatNumber(actionTotal) }} actions correlated.
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-3">
            <label class="flex flex-col gap-1 text-body-sm text-rs-muted">
              Search
              <input
                v-model.trim="searchQuery"
                type="text"
                placeholder="Module, provider, category, or error"
                class="h-10 rounded-lg border border-rs-border bg-rs-bg px-3 text-rs-fg outline-none transition focus:border-brand-500"
              >
            </label>
            <label class="flex flex-col gap-1 text-body-sm text-rs-muted">
              Severity
              <select
                v-model="severityFilter"
                class="h-10 rounded-lg border border-rs-border bg-rs-bg px-3 text-rs-fg outline-none transition focus:border-brand-500"
              >
                <option value="all">All severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-body-sm text-rs-muted">
              Outcome
              <select
                v-model="outcomeFilter"
                class="h-10 rounded-lg border border-rs-border bg-rs-bg px-3 text-rs-fg outline-none transition focus:border-brand-500"
              >
                <option value="all">All outcomes</option>
                <option value="open">Open or proposed</option>
                <option value="applied">Applied</option>
                <option value="failed">Failed</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[0.95fr,1.55fr]">
        <aside class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">Operator Watchlist</h2>
          <p class="mt-1 text-body-sm text-rs-muted">
            Highest-severity unresolved bundles sorted by age and repeated failure pressure.
          </p>

          <ul
            v-if="watchlist.length"
            class="mt-5 space-y-3"
          >
            <li
              v-for="incident in watchlist"
              :key="incident.bundle_id"
              class="rounded-xl border border-rs-border bg-rs-bg/60 p-4"
            >
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-rs-fg">{{ incident.module_id }}</span>
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="severityTone(incident.severity)"
                >
                  {{ severityLabel(incident.severity) }}
                </span>
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="phaseTone(incident.phase)"
                >
                  {{ phaseLabel(incident.phase) }}
                </span>
              </div>
              <p class="mt-2 text-body-sm text-rs-muted">{{ incident.error_message }}</p>
              <div class="mt-3 flex flex-wrap gap-2 text-xs text-rs-muted">
                <span class="rounded-full bg-rs-surface px-2.5 py-1">
                  Age {{ formatElapsed(incident.elapsed_seconds) }}
                </span>
                <span class="rounded-full bg-rs-surface px-2.5 py-1">
                  {{ formatNumber(incident.consecutive_failures) }} consecutive failures
                </span>
                <span class="rounded-full bg-rs-surface px-2.5 py-1">
                  {{ formatNumber(incident.affected_corridor_count) }} affected corridors
                </span>
              </div>
            </li>
          </ul>

          <div
            v-else
            class="mt-5 rounded-xl border border-dashed border-rs-border px-4 py-8 text-center text-body-sm text-rs-muted"
          >
            No unresolved bundles need escalation right now.
          </div>
        </aside>

        <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-body-lg font-semibold text-rs-fg">Incident Timeline</h2>
              <p class="mt-1 text-body-sm text-rs-muted">
                Detection to repair flow with bounded action correlation per module.
              </p>
            </div>
            <div class="text-right text-body-sm text-rs-muted">
              {{ formatNumber(summary.openCount) }} open
            </div>
          </div>

          <div
            v-if="!filteredIncidents.length"
            class="mt-5 rounded-xl border border-dashed border-rs-border px-4 py-10 text-center text-body-sm text-rs-muted"
          >
            {{ emptyStateMessage }}
          </div>

          <ul
            v-else
            class="mt-5 space-y-4"
          >
            <li
              v-for="incident in filteredIncidents"
              :key="incident.bundle_id"
              class="rounded-xl border border-rs-border bg-rs-bg/50 p-5"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-semibold text-rs-fg">{{ incident.module_id }}</span>
                    <span
                      class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                      :class="severityTone(incident.severity)"
                    >
                      {{ severityLabel(incident.severity) }}
                    </span>
                    <span
                      class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                      :class="outcomeTone(incident.repair_outcome)"
                    >
                      {{ outcomeLabel(incident.repair_outcome) }}
                    </span>
                    <span
                      class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                      :class="phaseTone(incident.phase)"
                    >
                      {{ phaseLabel(incident.phase) }}
                    </span>
                    <a
                      v-if="incident.repair_pr_url"
                      :href="incident.repair_pr_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 text-body-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      View PR
                      <svg
                        class="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>

                  <p class="mt-2 text-body-sm text-rs-muted">{{ incident.error_message }}</p>

                  <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div class="rounded-xl border border-rs-border bg-rs-surface px-3 py-3">
                      <div class="text-caption uppercase tracking-wide text-rs-muted">Age</div>
                      <div class="mt-1 text-body-lg font-semibold text-rs-fg">{{ formatElapsed(incident.elapsed_seconds) }}</div>
                    </div>
                    <div class="rounded-xl border border-rs-border bg-rs-surface px-3 py-3">
                      <div class="text-caption uppercase tracking-wide text-rs-muted">Triage lag</div>
                      <div class="mt-1 text-body-lg font-semibold text-rs-fg">{{ formatElapsed(incident.triage_lead_seconds) }}</div>
                    </div>
                    <div class="rounded-xl border border-rs-border bg-rs-surface px-3 py-3">
                      <div class="text-caption uppercase tracking-wide text-rs-muted">Corridors</div>
                      <div class="mt-1 text-body-lg font-semibold text-rs-fg">{{ formatNumber(incident.affected_corridor_count) }}</div>
                    </div>
                    <div class="rounded-xl border border-rs-border bg-rs-surface px-3 py-3">
                      <div class="text-caption uppercase tracking-wide text-rs-muted">Actions</div>
                      <div class="mt-1 text-body-lg font-semibold text-rs-fg">{{ formatNumber(incident.action_count) }}</div>
                    </div>
                  </div>

                  <div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-caption text-rs-muted">
                    <span><strong class="text-rs-fg">Detected:</strong> {{ formatDateTime(incident.created_at) }}</span>
                    <span><strong class="text-rs-fg">Triaged:</strong> {{ formatDateTime(incident.triage_at) }}</span>
                    <span><strong class="text-rs-fg">Resolved:</strong> {{ formatDateTime(incident.resolution_at) }}</span>
                    <span><strong class="text-rs-fg">Latest action:</strong> {{ formatDateTime(incident.latest_action_at) }}</span>
                    <span><strong class="text-rs-fg">Latest status:</strong> {{ incident.latest_action_status ?? '—' }}</span>
                  </div>
                </div>

                <div class="rounded-xl border border-rs-border bg-rs-surface px-4 py-3 lg:w-52">
                  <div class="text-caption uppercase tracking-wide text-rs-muted">Repair outcome</div>
                  <div class="mt-2 text-body-lg font-semibold text-rs-fg">{{ outcomeLabel(incident.repair_outcome) }}</div>
                  <div class="mt-2 text-body-sm text-rs-muted">
                    {{ incident.resolution_seconds ? `Resolved in ${formatElapsed(incident.resolution_seconds)}.` : 'Still in progress or awaiting a repair decision.' }}
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </section>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AgentActionEntry, FailureBundleSummary, RepairOutcome } from '~/types/agents'
import { getAgentActions, getFailureBundles } from '~/lib/opsApi'
import {
  buildIncidentTimeline,
  summarizeIncidentTimeline,
  type IncidentPhase,
  type IncidentTimelineInsight,
} from '~/utils/adminInsights'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Incident Timeline | Remit-Scout',
  description: 'Failure bundle triage and repair timeline.',
})

const { formatDateTime, formatDuration, formatNumber, formatPercent } = useAdminFormat()

const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<string | null>(null)
const bundles = ref<FailureBundleSummary[]>([])
const actions = ref<AgentActionEntry[]>([])
const bundleTotal = ref(0)
const actionTotal = ref(0)
const searchQuery = ref('')
const severityFilter = ref<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
const outcomeFilter = ref<'all' | 'open' | 'applied' | 'failed' | 'rejected'>('all')

const incidents = computed(() => buildIncidentTimeline(bundles.value, actions.value))
const summary = computed(() => summarizeIncidentTimeline(incidents.value))
const watchlist = computed(() => summary.value.watchlist)

const filteredIncidents = computed(() =>
  incidents.value.filter((incident) => {
    const matchesSeverity = severityFilter.value === 'all'
      || incident.severity.toLowerCase() === severityFilter.value
    const matchesOutcome = outcomeFilter.value === 'all'
      || (outcomeFilter.value === 'open'
        ? incident.phase === 'active'
        : incident.repair_outcome === outcomeFilter.value)
    const haystack = [
      incident.module_id,
      incident.provider_id,
      incident.category,
      incident.error_message,
      incident.severity,
    ].join(' ').toLowerCase()
    const matchesSearch = !searchQuery.value
      || haystack.includes(searchQuery.value.toLowerCase())

    return matchesSeverity && matchesOutcome && matchesSearch
  }),
)

const successRate = computed(() => {
  if (summary.value.resolvedCount === 0) return null
  return summary.value.appliedCount / summary.value.resolvedCount
})

const headlineCycle = computed(() => {
  if (summary.value.openCount > 0) {
    return summary.value.medianOpenAgeSeconds
  }
  return summary.value.medianResolutionSeconds
})

const headlineCycleLabel = computed(() =>
  summary.value.openCount > 0 ? 'Median open age' : 'Median resolution loop',
)

const summaryCards = computed(() => [
  {
    label: 'Open incidents',
    value: formatNumber(summary.value.openCount),
    detail: `${formatNumber(summary.value.criticalOpenCount)} high or critical bundles are still unresolved.`,
  },
  {
    label: 'Resolved',
    value: formatNumber(summary.value.resolvedCount),
    detail: `${formatNumber(summary.value.appliedCount)} applied and ${formatNumber(summary.value.rejectedOrFailedCount)} failed or rejected.`,
  },
  {
    label: 'Resolution success',
    value: successRate.value === null ? '—' : formatPercent(successRate.value, 0),
    detail: 'Resolved bundles that ended with an applied repair.',
  },
  {
    label: headlineCycleLabel.value,
    value: formatElapsed(headlineCycle.value),
    detail: 'Computed from the currently loaded bundle sample.',
  },
])

const formatElapsed = (seconds: number | null | undefined) => formatDuration(seconds ?? null) ?? '—'

const severityTone = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-700'
    case 'high':
      return 'bg-orange-100 text-orange-700'
    case 'medium':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const severityLabel = (severity: string) => {
  const normalized = severity.trim()
  return normalized ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}` : 'Unknown'
}

const outcomeTone = (outcome: RepairOutcome | null) => {
  if (outcome === 'applied') return 'bg-emerald-100 text-emerald-700'
  if (outcome === 'failed' || outcome === 'rejected') return 'bg-red-100 text-red-700'
  if (outcome === 'proposed') return 'bg-blue-100 text-blue-700'
  return 'bg-amber-100 text-amber-700'
}

const outcomeLabel = (outcome: RepairOutcome | null) => {
  if (!outcome) return 'Pending'
  return `${outcome.charAt(0).toUpperCase()}${outcome.slice(1)}`
}

const phaseTone = (phase: IncidentPhase) =>
  phase === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'

const phaseLabel = (phase: IncidentPhase) => phase === 'resolved' ? 'Resolved' : 'Active'

const emptyStateMessage = computed(() => {
  if (incidents.value.length === 0) {
    return 'No failure bundles have been emitted yet. This view will populate as soon as the repair pipeline records incidents.'
  }
  return 'No incidents match the current search and filter controls.'
})

const autoRefresh = ref(false)
const countdown = ref(60)
let timer: ReturnType<typeof setInterval> | null = null

watch(autoRefresh, (enabled) => {
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

const load = async () => {
  if (loading.value) return
  loading.value = true
  error.value = null

  try {
    const [bundlesRes, actionsRes] = await Promise.all([
      getFailureBundles({ limit: 50 }),
      getAgentActions({ limit: 100 }),
    ])
    bundles.value = bundlesRes.bundles
    actions.value = actionsRes.actions
    bundleTotal.value = bundlesRes.total
    actionTotal.value = actionsRes.total
    lastUpdated.value = new Date().toISOString()
  }
 catch (e: any) {
    error.value = e?.message ?? 'Failed to load incident data.'
  }
 finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>
