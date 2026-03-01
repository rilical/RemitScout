<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Admin Console"
      subtitle="Operations, analytics, security, and customer controls in one place."
    >
      <template #actions>
        <div class="flex items-center gap-3">
          <label class="inline-flex items-center gap-2 text-body-sm text-rs-muted">
            <input
              v-model="autoRefreshEnabled"
              type="checkbox"
              class="h-4 w-4 rounded border-rs-border text-brand-600"
            >
            Auto-refresh
            <span
              v-if="autoRefreshEnabled"
              class="tabular-nums text-rs-fg font-semibold"
            >{{ countdown }}s</span>
          </label>
          <button
            class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            :disabled="loading"
            @click="loadDashboard"
          >
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
      </template>
    </AdminPageShell>

    <section
      class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      :aria-busy="loading"
    >
      <!-- Card: Active Users -->
      <article
        class="rounded-2xl border bg-rs-surface p-5 shadow-sm transition-colors"
        :class="cardBorderClass('plans')"
      >
        <div class="text-body-sm text-rs-muted">Active users (30d)</div>
        <template v-if="loading && kpis.activeUsers === null">
          <SkeletonBlock width="60%" height="28" rounded="md" class="mt-1" />
          <SkeletonBlock width="50%" height="14" rounded="md" class="mt-2" />
        </template>
        <template v-else-if="failures.includes('plans')">
          <div class="mt-1 flex items-center gap-2 text-danger-600">
            <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span class="text-body-sm font-semibold">Error</span>
          </div>
          <button
            class="mt-2 text-body-sm font-semibold text-brand-600 hover:text-brand-700"
            @click="loadDashboard"
          >
            Retry
          </button>
        </template>
        <template v-else>
          <div class="mt-1 text-h3 font-semibold text-rs-fg">{{ formatAdminNumber(kpis.activeUsers, 0) }}</div>
          <div class="mt-2 text-body-sm text-rs-muted">Enterprise accounts: {{ formatAdminNumber(kpis.enterpriseCount, 0) }}</div>
        </template>
      </article>

      <!-- Card: Queue Backlog -->
      <article
        class="rounded-2xl border bg-rs-surface p-5 shadow-sm transition-colors"
        :class="cardBorderClass('observer')"
      >
        <div class="flex items-center gap-2 text-body-sm text-rs-muted">
          Queue backlog (24h)
          <span
            v-if="!failures.includes('observer') && !loading"
            class="inline-flex h-2.5 w-2.5 rounded-full"
            :class="queueHealthDot"
            :title="queueHealthLabel"
          />
        </div>
        <template v-if="loading && kpis.quoteRefreshPending === null">
          <SkeletonBlock width="80%" height="28" rounded="md" class="mt-1" />
          <SkeletonBlock width="50%" height="14" rounded="md" class="mt-2" />
        </template>
        <template v-else-if="failures.includes('observer')">
          <div class="mt-1 flex items-center gap-2 text-danger-600">
            <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span class="text-body-sm font-semibold">Error</span>
          </div>
          <button
            class="mt-2 text-body-sm font-semibold text-brand-600 hover:text-brand-700"
            @click="loadDashboard"
          >
            Retry
          </button>
        </template>
        <template v-else>
          <div class="mt-1 text-h3 font-semibold text-rs-fg">
            Quote: {{ formatAdminNumber(kpis.quoteRefreshPending, 0) }} · FX: {{ formatAdminNumber(kpis.fxRefreshPending, 0) }}
          </div>
          <div class="mt-2 text-body-sm text-rs-muted">Source: /ops/observer/summary</div>
        </template>
      </article>

      <!-- Card: Last Gold Export -->
      <article
        class="rounded-2xl border bg-rs-surface p-5 shadow-sm transition-colors"
        :class="cardBorderClass('gold_exports')"
      >
        <div class="text-body-sm text-rs-muted">Last Gold export</div>
        <template v-if="loading && kpis.lastGoldExportAt === null">
          <SkeletonBlock width="70%" height="22" rounded="md" class="mt-1" />
          <SkeletonBlock width="50%" height="14" rounded="md" class="mt-2" />
        </template>
        <template v-else-if="failures.includes('gold_exports')">
          <div class="mt-1 flex items-center gap-2 text-danger-600">
            <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span class="text-body-sm font-semibold">Error</span>
          </div>
          <button
            class="mt-2 text-body-sm font-semibold text-brand-600 hover:text-brand-700"
            @click="loadDashboard"
          >
            Retry
          </button>
        </template>
        <template v-else>
          <div
            class="mt-1 text-body-lg font-semibold"
            :class="goldExportAgeClass"
          >
            {{ formatTimestamp(kpis.lastGoldExportAt) }}
          </div>
          <div class="mt-2 text-body-sm text-rs-muted">Source: /ops/gold/exports/cdp-daily</div>
        </template>
      </article>

      <!-- Card: Panel Refresh -->
      <article
        class="rounded-2xl border bg-rs-surface p-5 shadow-sm transition-colors"
        :class="panelRefreshBorderClass"
      >
        <div class="flex items-center gap-2 text-body-sm text-rs-muted">
          Panel refresh
          <svg
            v-if="failures.length > 0 && !loading"
            class="h-4 w-4 text-danger-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <template v-if="loading && lastUpdatedAt === null">
          <SkeletonBlock width="70%" height="22" rounded="md" class="mt-1" />
          <SkeletonBlock width="40%" height="14" rounded="md" class="mt-2" />
        </template>
        <template v-else>
          <div class="mt-1 text-body-lg font-semibold text-rs-fg">{{ formatTimestamp(lastUpdatedAt) }}</div>
          <div
            class="mt-2 text-body-sm"
            :class="failures.length ? 'text-danger-600 font-semibold' : 'text-rs-muted'"
          >
            {{ failures.length ? `${failures.length} panel(s) failed` : 'All panels loaded' }}
          </div>
        </template>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-3">
      <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm xl:col-span-2">
        <h2 class="text-body-lg font-semibold text-rs-fg">Recent admin actions</h2>
        <p class="text-body-sm text-rs-muted">Latest entries from `/audit/logs?category=admin&limit=5`.</p>

        <ul class="mt-4 space-y-3">
          <li
            v-for="event in recentAdminActions"
            :key="event.event_id"
            class="rounded-lg border border-rs-border bg-rs-bg p-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="text-body-sm font-semibold text-rs-fg">{{ event.action || 'admin.action' }}</div>
              <div class="text-body-sm text-rs-muted">{{ formatTimestamp(event.created_at) }}</div>
            </div>
            <div class="mt-1 text-body-sm text-rs-muted">
              {{ event.actor_id || 'unknown actor' }} · {{ event.entity_type || 'entity' }}{{ event.entity_id ? `:${event.entity_id}` : '' }}
            </div>
          </li>
          <li
            v-if="recentAdminActions.length === 0"
            class="rounded-lg border border-dashed border-rs-border p-3 text-body-sm text-rs-muted"
          >
            No recent admin actions available.
          </li>
        </ul>
      </article>

      <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Admin surfaces</h2>
        <div class="mt-4 grid gap-3">
          <NuxtLink
            v-for="link in adminLinks"
            :key="link.to"
            :to="link.to"
            class="rounded-lg border border-rs-border px-3 py-2 transition-colors hover:bg-neutral-50 dark:hover:bg-slate-800"
          >
            <div class="text-body-sm font-semibold text-rs-fg">{{ link.label }}</div>
            <div class="text-body-sm text-rs-muted">{{ link.description }}</div>
          </NuxtLink>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Admin Console | Remit-Scout',
  description: 'Admin command center for operations, analytics, audits, and controls.',
})

type PlansResponse = {
  users?: Array<{ last_seen_at?: string | null }>
  summary?: { enterprise?: number }
}

type ObserverSummaryResponse = {
  gold?: {
    latest_date?: string | null
  }
  queues?: {
    quote_refresh?: Array<{ status: string; count: number }>
    fx_rate_refresh?: Array<{ status: string; count: number }>
  }
}

type GoldExportsResponse = {
  meta?: {
    last_updated_at?: string | null
  }
}

type AuditLogsResponse = {
  logs?: Array<{
    event_id: string
    action: string
    actor_id: string
    entity_type: string
    entity_id: string | null
    created_at: string
  }>
}

const { request } = useApi()
const { formatNumber: formatAdminNumber, formatTimestamp } = useAdminFormat()

const loading = ref(false)
const lastUpdatedAt = ref<string | null>(null)
const failures = ref<string[]>([])
const recentAdminActions = ref<NonNullable<AuditLogsResponse['logs']>>([])

const kpis = reactive({
  activeUsers: null as number | null,
  enterpriseCount: null as number | null,
  quoteRefreshPending: null as number | null,
  fxRefreshPending: null as number | null,
  lastGoldExportAt: null as string | null,
})

// Auto-refresh
const autoRefreshEnabled = ref(false)
const countdown = ref(60)
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

watch(autoRefreshEnabled, (enabled) => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
  if (enabled) {
    countdown.value = 60
    autoRefreshTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        countdown.value = 60
        void loadDashboard()
      }
    }, 1000)
  }
})

onUnmounted(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }
})

// Health status computeds
const totalBacklog = computed(() => (kpis.quoteRefreshPending ?? 0) + (kpis.fxRefreshPending ?? 0))

const queueHealthDot = computed(() => {
  const total = totalBacklog.value
  if (total > 500) return 'bg-danger-600'
  if (total >= 100) return 'bg-amber-500'
  return 'bg-emerald-500'
})

const queueHealthLabel = computed(() => {
  const total = totalBacklog.value
  if (total > 500) return 'High backlog'
  if (total >= 100) return 'Moderate backlog'
  return 'Healthy'
})

const goldExportAgeClass = computed(() => {
  if (!kpis.lastGoldExportAt) return 'text-rs-fg'
  const ageMs = Date.now() - new Date(kpis.lastGoldExportAt).getTime()
  const hours48 = 48 * 60 * 60 * 1000
  return ageMs > hours48 ? 'text-amber-600 dark:text-amber-400' : 'text-rs-fg'
})

const panelRefreshBorderClass = computed(() => {
  if (failures.value.length > 0) return 'border-red-200 dark:border-red-800'
  return 'border-rs-border'
})

const cardBorderClass = (source: string) => {
  if (failures.value.includes(source)) return 'border-red-200 dark:border-red-800'
  return 'border-rs-border'
}

const adminLinks = [
  { label: 'Operations Center', description: 'Merged observer + full provider ops view', to: '/admin/observer' },
  { label: 'Module Registry', description: 'Signal module health, quarantine status, and cadence', to: '/admin/modules' },
  { label: 'Delivery Progress', description: 'Module readiness and deployment progress by domain', to: '/admin/delivery-progress' },
  { label: 'Self-Healing Pipeline', description: 'Agent actions, failure bundles, and repair metrics', to: '/admin/agents' },
  { label: 'Incident Timeline', description: 'Full incident lifecycle from detection to resolution', to: '/admin/incidents' },
  { label: 'Corridor Stress', description: 'Triangulation-derived stress scores across corridors', to: '/admin/stress' },
  { label: 'Data Quality', description: 'Total Collection Error framework per module', to: '/admin/data-quality' },
  { label: 'Analytics Console', description: 'Usage, conversion, and engagement trends', to: '/admin/analytics' },
  { label: 'Enterprise Management', description: 'Grant or revoke enterprise access', to: '/admin/enterprise' },
  { label: 'Audit Log Console', description: 'Security and admin event investigations', to: '/admin/audit' },
  { label: 'Gold Exports', description: 'Inspect TEER/RCI/RVI snapshots and history', to: '/admin/gold-exports' },
  { label: 'Institutional Clients', description: 'B2B client status and API key lifecycle', to: '/admin/institutional' },
  { label: 'Ad Inventory', description: 'Ad placement controls and status', to: '/admin/ads' },
  { label: 'Feature Flags', description: 'Runtime controls with audience rules', to: '/admin/feature-flags' },
]

const loadDashboard = async () => {
  if (loading.value) return
  loading.value = true
  failures.value = []

  const [plansResult, observerResult, goldResult, auditResult] = await Promise.allSettled([
    request<PlansResponse>('/admin/plans'),
    request<ObserverSummaryResponse>('/ops/observer/summary', { query: { windowHours: 24, limit: 25 } }),
    request<GoldExportsResponse>('/ops/gold/exports/cdp-daily', { query: { limit: 1, offset: 0 } }),
    request<AuditLogsResponse>('/audit/logs', { query: { category: 'admin', limit: 5, offset: 0 } }),
  ])

  if (plansResult.status === 'fulfilled') {
    const plans = plansResult.value
    kpis.enterpriseCount = Number(plans.summary?.enterprise ?? 0)

    const thresholdMs = Date.now() - (30 * 24 * 60 * 60 * 1000)
    kpis.activeUsers = (plans.users ?? []).filter((row) => {
      if (!row.last_seen_at) return false
      const parsed = new Date(row.last_seen_at).getTime()
      return Number.isFinite(parsed) && parsed >= thresholdMs
    }).length
  }
  else {
    failures.value.push('plans')
  }

  if (observerResult.status === 'fulfilled') {
    const quoteQueue = observerResult.value.queues?.quote_refresh ?? []
    const fxQueue = observerResult.value.queues?.fx_rate_refresh ?? []
    const countPending = (rows: Array<{ status: string; count: number }>) =>
      rows.reduce((sum, row) => (
        ['pending', 'processing', 'queued'].includes(row.status) ? sum + Number(row.count || 0) : sum
      ), 0)
    kpis.quoteRefreshPending = countPending(quoteQueue)
    kpis.fxRefreshPending = countPending(fxQueue)
  }
  else {
    failures.value.push('observer')
  }

  if (goldResult.status === 'fulfilled') {
    kpis.lastGoldExportAt = goldResult.value.meta?.last_updated_at ?? null
  }
  else {
    failures.value.push('gold_exports')
  }

  if (auditResult.status === 'fulfilled') {
    recentAdminActions.value = auditResult.value.logs ?? []
  }
  else {
    recentAdminActions.value = []
    failures.value.push('audit')
  }

  lastUpdatedAt.value = new Date().toISOString()
  loading.value = false
}

onMounted(() => {
  void loadDashboard()
})
</script>
