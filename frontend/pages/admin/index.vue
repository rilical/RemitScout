<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Admin Console"
      subtitle="Operations, analytics, security, and customer controls in one place."
    >
      <template #actions>
        <button
          class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          :disabled="loading"
          @click="loadDashboard"
        >
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </template>
    </AdminPageShell>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
        <div class="text-body-sm text-rs-muted">Active users (30d)</div>
        <div class="mt-1 text-h3 font-semibold text-rs-fg">{{ formatAdminNumber(kpis.activeUsers, 0) }}</div>
        <div class="mt-2 text-body-sm text-rs-muted">Enterprise accounts: {{ formatAdminNumber(kpis.enterpriseCount, 0) }}</div>
      </article>

      <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
        <div class="text-body-sm text-rs-muted">Queue backlog (24h)</div>
        <div class="mt-1 text-h3 font-semibold text-rs-fg">
          Quote: {{ formatAdminNumber(kpis.quoteRefreshPending, 0) }} · FX: {{ formatAdminNumber(kpis.fxRefreshPending, 0) }}
        </div>
        <div class="mt-2 text-body-sm text-rs-muted">Source: /ops/observer/summary</div>
      </article>

      <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
        <div class="text-body-sm text-rs-muted">Last Gold export</div>
        <div class="mt-1 text-body-lg font-semibold text-rs-fg">
          {{ formatTimestamp(kpis.lastGoldExportAt) }}
        </div>
        <div class="mt-2 text-body-sm text-rs-muted">Source: /ops/gold/exports/cdp-daily</div>
      </article>

      <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
        <div class="text-body-sm text-rs-muted">Panel refresh</div>
        <div class="mt-1 text-body-lg font-semibold text-rs-fg">{{ formatTimestamp(lastUpdatedAt) }}</div>
        <div class="mt-2 text-body-sm text-rs-muted">
          {{ failures.length ? `${failures.length} panel(s) failed` : 'All panels loaded' }}
        </div>
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

const adminLinks = [
  { label: 'Operations Center', description: 'Merged observer + full provider ops view', to: '/admin/observer' },
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
