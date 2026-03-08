<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Audit Log Console"
      subtitle="Security, compliance, and admin action trails."
    >
      <template #actions>
        <button
          class="h-10 rounded-lg border border-rs-border px-4 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
          :disabled="loading"
          @click="downloadCsv"
        >
          Export CSV
        </button>
        <button
          class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          :disabled="loading"
          @click="applyFilters"
        >
          {{ loading ? 'Loading…' : 'Refresh' }}
        </button>
      </template>
    </AdminPageShell>

    <AdminSurfaceOverview :model="surfaceOverview" />

    <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
      <div class="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div>
          <label
for="audit-start-date"
class="text-body-sm text-rs-muted"
>Start date</label>
          <input
            id="audit-start-date"
            ref="firstFilterRef"
            v-model="startDate"
            type="date"
            aria-label="Filter start date"
            class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
          >
        </div>
        <div>
          <label
for="audit-end-date"
class="text-body-sm text-rs-muted"
>End date</label>
          <input
            id="audit-end-date"
            v-model="endDate"
            type="date"
            aria-label="Filter end date"
            class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
          >
        </div>
        <div>
          <label
for="audit-actor-id"
class="text-body-sm text-rs-muted"
>Actor ID</label>
          <input
            id="audit-actor-id"
            v-model="filters.actor_id"
            type="text"
            class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
          >
        </div>
        <div>
          <label
for="audit-action"
class="text-body-sm text-rs-muted"
>Action</label>
          <input
            id="audit-action"
            v-model="filters.action"
            type="text"
            class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
          >
        </div>
        <div>
          <label
for="audit-category"
class="text-body-sm text-rs-muted"
>Category</label>
          <select
            id="audit-category"
            v-model="filters.category"
            class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
          >
            <option value="">All</option>
            <option value="user_action">User action</option>
            <option value="security">Security</option>
            <option value="compliance">Compliance</option>
            <option value="admin">Admin</option>
            <option value="system">System</option>
            <option value="billing">Billing</option>
            <option value="data_access">Data access</option>
          </select>
        </div>
        <div>
          <label
for="audit-severity"
class="text-body-sm text-rs-muted"
>Severity</label>
          <select
            id="audit-severity"
            v-model="filters.severity"
            class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
          >
            <option value="">All</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      <div class="mt-3 flex items-center gap-2">
        <button
          v-if="hasActiveFilters"
          class="text-body-sm font-semibold text-brand-600 hover:text-brand-700"
          @click="clearAllFilters"
        >
          Clear all filters
        </button>
        <span class="text-body-sm text-rs-muted">Press <kbd class="rounded border border-rs-border px-1.5 py-0.5 text-xs font-mono">/</kbd> to focus filters</span>
      </div>
    </section>

    <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-body-lg font-semibold text-rs-fg">Audit Events</h2>
        <span class="text-body-sm text-rs-muted">Total: {{ pagination.total }}</span>
      </div>

      <DataTable
        variant="consumer"
        :columns="columns"
        :rows="tableRows"
        :row-key="(row: any) => row.event_id ?? String(row)"
        :loading="loading"
        :error="error ? { message: error } : null"
        :empty="{ title: 'No audit events found.' }"
      >
        <template #cell-severity="{ row }">
          <span
            class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
            :class="severityBadgeClass((row as any).severity)"
          >
            {{ (row as any).severity }}
          </span>
        </template>
        <template #cell-action_detail="{ row }">
          <button
            class="text-body-sm font-semibold text-brand-600 hover:text-brand-700"
            @click="openLogDetail((row as any).event_id)"
          >
            View
          </button>
        </template>
      </DataTable>

      <div class="mt-4 flex items-center justify-between">
        <div class="text-body-sm text-rs-muted">
          Offset {{ pagination.offset }} · Page size {{ pagination.limit }}
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

      <div
        v-if="selectedLog"
        class="mt-6 rounded-2xl border border-rs-border bg-rs-bg/40 p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-body-lg font-semibold text-rs-fg">Event detail</h3>
            <p class="text-body-sm text-rs-muted">{{ selectedLog.event_id }}</p>
          </div>
          <button
            class="rounded-lg border border-rs-border px-3 py-1.5 text-body-sm font-semibold text-rs-fg hover:bg-neutral-50"
            @click="selectedLog = null"
          >
            Close
          </button>
        </div>

        <div
v-if="detailLoading"
class="mt-4 text-body-sm text-rs-muted"
>
          Loading event detail…
        </div>

        <div
v-else
class="mt-4 grid gap-4 md:grid-cols-2"
>
          <div class="rounded-xl border border-rs-border bg-rs-surface p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">Context</div>
            <div class="mt-3 space-y-2 text-body-sm text-rs-fg">
              <div>Action: {{ selectedLog.action || 'n/a' }}</div>
              <div>Actor: {{ selectedLog.actor_id || 'system' }}</div>
              <div>Category: {{ selectedLog.category || 'n/a' }}</div>
              <div>Severity: {{ selectedLog.severity || 'info' }}</div>
              <div>Request ID: {{ selectedLog.request_id || 'n/a' }}</div>
              <div>IP: {{ selectedLog.ip_address || 'n/a' }}</div>
              <div>User agent: {{ selectedLog.user_agent || 'n/a' }}</div>
            </div>
          </div>

          <div class="rounded-xl border border-rs-border bg-rs-surface p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">Reason and evidence</div>
            <div class="mt-3 space-y-2 text-body-sm text-rs-fg">
              <div>Reason: {{ selectedLog.reason || 'No explicit reason provided.' }}</div>
              <div>Entity: {{ selectedLog.entity_type || 'entity' }}{{ selectedLog.entity_id ? `:${selectedLog.entity_id}` : '' }}</div>
              <div>Session: {{ selectedLog.session_id || 'n/a' }}</div>
            </div>
            <div
v-if="selectedLog.evidence_links?.length"
class="mt-3 space-y-1"
>
              <a
                v-for="link in selectedLog.evidence_links"
                :key="link"
                :href="link"
                target="_blank"
                rel="noreferrer"
                class="block text-body-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                {{ link }}
              </a>
            </div>
          </div>

          <div class="rounded-xl border border-rs-border bg-rs-surface p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">Metadata</div>
            <pre class="mt-3 overflow-auto rounded-lg bg-rs-bg px-3 py-3 text-xs text-rs-fg">{{ formatJson(selectedLog.metadata) }}</pre>
          </div>

          <div class="rounded-xl border border-rs-border bg-rs-surface p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">Change diff</div>
            <pre class="mt-3 overflow-auto rounded-lg bg-rs-bg px-3 py-3 text-xs text-rs-fg">{{ formatJson(selectedLog.changes || { before: selectedLog.before_snapshot, after: selectedLog.after_snapshot }) }}</pre>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DataTable } from '~/ui'
import type { DataTableColumn } from '~/ui'
import type { AdminSurfaceOverviewModel } from '~/utils/adminSurfaceStatus'
import { formatAdminSurfaceAge, getFreshnessTone } from '~/utils/adminSurfaceStatus'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Admin: Audit Logs | Remit-Scout',
  description: 'Audit stream for security, compliance, and admin operations.',
})

const { getLogs, getLog, exportLogs, loading, error } = useAudit()
const { formatTimestamp } = useAdminFormat()
const route = useRoute()
const firstFilterRef = ref<HTMLInputElement | null>(null)

const toDateInput = (date: Date) => date.toISOString().slice(0, 10)
const today = new Date()
const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

const startDate = ref(toDateInput(weekAgo))
const endDate = ref(toDateInput(today))

const filters = reactive({
  actor_id: '',
  action: '',
  category: '',
  severity: '',
})

type AuditLogEntry = {
  event_id: string
  created_at: string
  action: string
  actor_id: string | null
  entity_type: string | null
  entity_id: string | null
  category: string | null
  severity: string | null
  metadata?: Record<string, unknown> | null
  before_snapshot?: Record<string, unknown> | null
  after_snapshot?: Record<string, unknown> | null
  changes?: Record<string, unknown> | null
  reason?: string | null
  evidence_links?: string[] | null
  ip_address?: string | null
  user_agent?: string | null
  request_id?: string | null
  session_id?: string | null
}

type AuditPagination = {
  total: number
  limit: number
  offset: number
}

const logs = ref<AuditLogEntry[]>([])
const pagination = ref<AuditPagination>({ total: 0, limit: 100, offset: 0 })
const selectedLog = ref<AuditLogEntry | null>(null)
const detailLoading = ref(false)

const columns: DataTableColumn[] = [
  { key: 'created_at', label: 'Time' },
  { key: 'action', label: 'Action' },
  { key: 'actor_id', label: 'Actor' },
  { key: 'entity', label: 'Entity' },
  { key: 'category', label: 'Category' },
  { key: 'severity', label: 'Severity' },
  { key: 'action_detail', label: 'Detail', align: 'right' },
]

const tableRows = computed(() =>
  logs.value.map(log => ({
    ...log,
    created_at: formatTimestamp(log.created_at),
    entity: `${log.entity_type || 'entity'}${log.entity_id ? `:${log.entity_id}` : ''}`,
    severity: log.severity || 'info',
    action_detail: 'View',
  })),
)

const severityBadgeClass = (severity: string) => {
  if (severity === 'critical' || severity === 'error') return 'bg-rose-100 text-rose-700'
  if (severity === 'warning') return 'bg-amber-100 text-amber-700'
  return 'bg-sky-100 text-sky-700'
}

const formatJson = (value: unknown) => JSON.stringify(value ?? {}, null, 2)

const surfaceOverview = computed<AdminSurfaceOverviewModel>(() => {
  const latestLogAt = logs.value[0]?.created_at || null
  const criticalCount = logs.value.filter(log => log.severity === 'critical' || log.severity === 'error').length
  const adminCount = logs.value.filter(log => log.category === 'admin').length
  const securityCount = logs.value.filter(log => log.category === 'security').length

  return {
    runtimeLabel: logs.value.length > 0 ? 'Audit stream loaded' : 'No audit events in current filter',
    runtimeTone: logs.value.length > 0 ? (criticalCount > 0 ? 'watch' : 'healthy') : 'watch',
    runtimeDetail: logs.value.length > 0
      ? 'The audit log surface is reading the live immutable event stream.'
      : 'No events matched the current filter window.',
    freshnessLabel: latestLogAt ? formatAdminSurfaceAge(latestLogAt) : 'No recent events',
    freshnessTone: getFreshnessTone(latestLogAt, { watchMinutes: 120, criticalMinutes: 1440 }),
    freshnessDetail: latestLogAt ? `Most recent event at ${formatTimestamp(latestLogAt)}.` : 'The selected filter window returned no events.',
    lastJobLabel: latestLogAt ? formatTimestamp(latestLogAt) : 'No recent writes',
    lastJobDetail: 'Latest successful audit write observed in this filter window.',
    stats: [
      { label: 'Visible events', value: String(logs.value.length) },
      { label: 'Total matches', value: String(pagination.value.total) },
      { label: 'Critical/error', value: String(criticalCount) },
      { label: 'Security events', value: String(securityCount) },
    ],
    dependencies: [
      {
        label: 'Immutable audit log table',
        status: logs.value.length > 0 ? 'healthy' : 'watch',
        detail: logs.value.length > 0 ? 'Events are loading from the audit log table.' : 'No events were returned for the current filter window.',
      },
      {
        label: 'Admin event volume',
        status: adminCount > 0 ? 'healthy' : 'watch',
        detail: adminCount > 0 ? 'Administrative actions are visible in the current window.' : 'No admin events appeared in the current filter window.',
      },
      {
        label: 'Event detail route',
        status: selectedLog.value && !detailLoading.value ? 'healthy' : 'watch',
        detail: selectedLog.value ? 'Detailed event payload is available below.' : 'Open an event to inspect before/after snapshots and evidence links.',
      },
    ],
    nextActions: [
      { label: 'Use the detail view instead of relying on the flat list when investigating security or compliance events.' },
      { label: 'Filter by actor, action, and severity first; export only after the event set is narrowed.' },
      { label: 'Treat empty results as a filter mismatch before assuming the audit pipeline is broken.' },
    ],
    emptyState: logs.value.length === 0
      ? {
          title: 'No audit events matched the filter window.',
          body: 'Widen the time window or clear actor/action filters before escalating this as a pipeline outage.',
        }
      : null,
  }
})

const toUtcIsoBoundary = (value: string, boundary: 'start' | 'end') => {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return null
  const suffix = boundary === 'start' ? 'T00:00:00.000Z' : 'T23:59:59.999Z'
  const date = new Date(`${value}${suffix}`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const buildQuery = () => {
  const defaultStart = toUtcIsoBoundary(toDateInput(weekAgo), 'start')!
  const defaultEnd = toUtcIsoBoundary(toDateInput(today), 'end')!
  return {
    start_date: toUtcIsoBoundary(startDate.value, 'start') || defaultStart,
    end_date: toUtcIsoBoundary(endDate.value, 'end') || defaultEnd,
    actor_id: filters.actor_id || undefined,
    action: filters.action || undefined,
    category: filters.category || undefined,
    severity: filters.severity || undefined,
    limit: pagination.value.limit,
    offset: pagination.value.offset,
  }
}

const loadLogs = async () => {
  const response = await getLogs(buildQuery())
  logs.value = (response?.logs || []) as unknown as AuditLogEntry[]
  const nextPagination = (response?.pagination || pagination.value) as AuditPagination
  const maxOffset = Math.max(0, nextPagination.total - nextPagination.limit)
  pagination.value = {
    total: nextPagination.total,
    limit: nextPagination.limit,
    offset: Math.min(Math.max(0, nextPagination.offset), maxOffset),
  }
}

const openLogDetail = async (eventId: string) => {
  detailLoading.value = true
  try {
    const response = await getLog(eventId) as { log?: AuditLogEntry }
    selectedLog.value = response?.log || null
  }
  catch (err) {
    selectedLog.value = null
    error.value = err instanceof Error ? err.message : 'Failed to load audit event detail.'
  }
  finally {
    detailLoading.value = false
  }
}

const refresh = () => {
  void loadLogs()
}

const hasActiveFilters = computed(() =>
  filters.actor_id !== '' || filters.action !== '' || filters.category !== '' || filters.severity !== '',
)

const clearAllFilters = () => {
  filters.actor_id = ''
  filters.action = ''
  filters.category = ''
  filters.severity = ''
  pagination.value.offset = 0
  void loadLogs()
}

const applyFilters = () => {
  pagination.value.offset = 0
  void loadLogs()
}

const prevPage = () => {
  pagination.value.offset = Math.max(0, pagination.value.offset - pagination.value.limit)
  void loadLogs()
}

const nextPage = () => {
  const maxOffset = Math.max(0, pagination.value.total - pagination.value.limit)
  pagination.value.offset = Math.min(maxOffset, pagination.value.offset + pagination.value.limit)
  void loadLogs()
}

const downloadCsv = async () => {
  const data = await exportLogs(buildQuery(), 'csv')
  if (typeof data !== 'string') return
  const blob = new Blob([data], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `audit-logs-${startDate.value}-to-${endDate.value}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

const onAuditKeydown = (event: KeyboardEvent) => {
  if (event.key === '/' && !event.metaKey && !event.ctrlKey) {
    const tag = (event.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
    event.preventDefault()
    firstFilterRef.value?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onAuditKeydown)

  if (typeof route.query.actor_id === 'string') {
    filters.actor_id = route.query.actor_id
  }
  if (typeof route.query.action === 'string') {
    filters.action = route.query.action
  }
  if (typeof route.query.category === 'string') {
    filters.category = route.query.category
  }
  if (typeof route.query.severity === 'string') {
    filters.severity = route.query.severity
  }

  void loadLogs()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onAuditKeydown)
})
</script>
