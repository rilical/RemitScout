<template>
  <div class="min-h-screen bg-slate-50 px-6 py-10">
    <div class="mx-auto flex max-w-6xl flex-col gap-6">
      <header class="rounded-2xl bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-slate-900">
              Audit Log Console
            </h1>
            <p class="text-sm text-slate-500">
              Security, compliance, and user action trails.
            </p>
          </div>
          <div class="flex flex-wrap items-end gap-3">
            <label class="text-xs text-slate-500">
              Start date
              <input
                v-model="startDate"
                type="date"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
            </label>
            <label class="text-xs text-slate-500">
              End date
              <input
                v-model="endDate"
                type="date"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
            </label>
            <button
              class="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              :disabled="loading"
              @click="loadLogs"
            >
              {{ loading ? 'Loading…' : 'Refresh' }}
            </button>
            <button
              class="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              :disabled="loading"
              @click="downloadCsv"
            >
              Export CSV
            </button>
          </div>
        </div>
        <div class="mt-4 grid gap-3 md:grid-cols-4">
          <label class="text-xs text-slate-500">
            Actor ID
            <input
              v-model="filters.actor_id"
              type="text"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
          </label>
          <label class="text-xs text-slate-500">
            Action
            <input
              v-model="filters.action"
              type="text"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
          </label>
          <label class="text-xs text-slate-500">
            Category
            <select
              v-model="filters.category"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
          </label>
          <label class="text-xs text-slate-500">
            Severity
            <select
              v-model="filters.severity"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </div>
        <p
          v-if="error"
          class="mt-3 text-sm text-red-600"
        >
          {{ error }}
        </p>
      </header>

      <section class="rounded-2xl bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">
            Audit Events
          </h2>
          <span class="text-xs text-slate-500">Total: {{ pagination.total }}</span>
        </div>
        <div class="mt-4 overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="text-xs uppercase text-slate-400">
              <tr>
                <th class="py-2 text-left">
                  Time
                </th>
                <th class="py-2 text-left">
                  Action
                </th>
                <th class="py-2 text-left">
                  Actor
                </th>
                <th class="py-2 text-left">
                  Entity
                </th>
                <th class="py-2 text-left">
                  Category
                </th>
                <th class="py-2 text-left">
                  Severity
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="log in logs"
                :key="log.event_id"
                class="border-t border-slate-100"
              >
                <td class="py-2 text-left text-slate-600">
                  {{ formatDate(log.created_at) }}
                </td>
                <td class="py-2 text-left text-slate-700">
                  {{ log.action }}
                </td>
                <td class="py-2 text-left text-slate-600">
                  {{ log.actor_id }}
                </td>
                <td class="py-2 text-left text-slate-600">
                  {{ log.entity_type }}{{ log.entity_id ? `:${log.entity_id}` : '' }}
                </td>
                <td class="py-2 text-left text-slate-600">
                  {{ log.category }}
                </td>
                <td class="py-2 text-left text-slate-600">
                  {{ log.severity || 'info' }}
                </td>
              </tr>
              <tr v-if="logs.length === 0">
                <td
                  colspan="6"
                  class="py-3 text-center text-xs text-slate-400"
                >
                  No audit events found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })

const { getLogs, exportLogs, loading, error } = useAudit()

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

const logs = ref<any[]>([])
const pagination = ref({ total: 0, limit: 100, offset: 0 })

const buildQuery = () => ({
  start_date: new Date(startDate.value).toISOString(),
  end_date: new Date(endDate.value).toISOString(),
  actor_id: filters.actor_id || undefined,
  action: filters.action || undefined,
  category: filters.category || undefined,
  severity: filters.severity || undefined,
  limit: pagination.value.limit,
  offset: pagination.value.offset,
})

const loadLogs = async () => {
  const response = await getLogs(buildQuery())
  logs.value = response?.logs || []
  pagination.value = response?.pagination || pagination.value
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

const formatDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

onMounted(loadLogs)
</script>
