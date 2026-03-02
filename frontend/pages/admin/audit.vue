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
      />

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
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DataTable } from '~/ui'
import type { DataTableColumn } from '~/ui'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Admin: Audit Logs | Remit-Scout',
  description: 'Audit stream for security, compliance, and admin operations.',
})

const { getLogs, exportLogs, loading, error } = useAudit()
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
}

type AuditPagination = {
  total: number
  limit: number
  offset: number
}

const logs = ref<AuditLogEntry[]>([])
const pagination = ref<AuditPagination>({ total: 0, limit: 100, offset: 0 })

const columns: DataTableColumn[] = [
  { key: 'created_at', label: 'Time' },
  { key: 'action', label: 'Action' },
  { key: 'actor_id', label: 'Actor' },
  { key: 'entity', label: 'Entity' },
  { key: 'category', label: 'Category' },
  { key: 'severity', label: 'Severity' },
]

const tableRows = computed(() =>
  logs.value.map(log => ({
    ...log,
    created_at: formatTimestamp(log.created_at),
    entity: `${log.entity_type || 'entity'}${log.entity_id ? `:${log.entity_id}` : ''}`,
    severity: log.severity || 'info',
  })),
)

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
