<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <AdminPageShell
        title="Institutional Client Management"
        subtitle="Manage B2B institutional clients, API keys, and contracts."
      >
        <template #actions>
          <button
            :disabled="loading"
            class="h-10 rounded-lg border border-rs-border px-4 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
            @click="loadClients"
          >
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </template>
      </AdminPageShell>

      <ErrorState
v-if="error"
mode="card"
:message="error"
:on-retry="loadClients"
/>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <div class="text-h2 font-bold text-rs-fg">{{ summaryData.active }}</div>
          <div class="text-body-sm text-neutral-600">Active</div>
        </div>
        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <div class="text-h2 font-bold text-rs-fg">{{ summaryData.suspended }}</div>
          <div class="text-body-sm text-neutral-600">Suspended</div>
        </div>
        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <div class="text-h2 font-bold text-rs-fg">{{ summaryData.trial }}</div>
          <div class="text-body-sm text-neutral-600">Trial</div>
        </div>
        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <div class="text-h2 font-bold text-rs-fg">{{ summaryData.premium }}</div>
          <div class="text-body-sm text-neutral-600">Premium</div>
        </div>
      </div>

      <!-- Create Client Form -->
      <div class="rounded-2xl bg-surface shadow-sm overflow-hidden">
        <button
          class="w-full p-6 border-b border-rs-border flex items-center justify-between text-left"
          @click="showCreateForm = !showCreateForm"
        >
          <h2 class="text-body-lg font-semibold text-rs-fg">Create New Client</h2>
          <span class="text-neutral-400">{{ showCreateForm ? '−' : '+' }}</span>
        </button>
        <div
v-if="showCreateForm"
class="p-6"
>
          <form
class="grid gap-4 md:grid-cols-2"
@submit.prevent="createClient"
>
            <div>
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Name</label>
              <input
                v-model="createForm.name"
                type="text"
                required
                placeholder="Acme Corp"
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
            <div>
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Client Prefix</label>
              <input
                v-model="createForm.client_prefix"
                type="text"
                required
                placeholder="acme"
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
            <div>
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Tier</label>
              <select
                v-model="createForm.tier"
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="trial">Trial</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Corridors Allowed (comma-separated)</label>
              <input
                v-model="createForm.corridors_raw"
                type="text"
                placeholder="US-MX, US-IN, GB-PK"
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
            <div>
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Rate Limit (RPM)</label>
              <input
                v-model.number="createForm.rate_limit_rpm"
                type="number"
                min="0"
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
            <div>
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Rate Limit (Daily)</label>
              <input
                v-model.number="createForm.rate_limit_daily"
                type="number"
                min="0"
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
            <div>
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Contract Start</label>
              <input
                v-model="createForm.contract_start"
                type="date"
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
            <div>
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Contract End</label>
              <input
                v-model="createForm.contract_end"
                type="date"
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
            <div>
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Report Schedule</label>
              <select
                v-model="createForm.report_schedule"
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="none">None</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                type="submit"
                :disabled="creating"
                class="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {{ creating ? 'Creating...' : 'Create Client' }}
              </button>
            </div>
          </form>
          <div
            v-if="createMessage"
            class="mt-3 text-body-sm"
            :class="createSuccess ? 'text-success-600' : 'text-danger-600'"
          >
            {{ createMessage }}
          </div>
          <div
            v-if="newApiKey"
            class="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-lg"
          >
            <div class="text-body-sm font-semibold text-amber-800 mb-2">
              Save this API key now — it will not be shown again
            </div>
            <div class="flex items-center gap-2">
              <code class="flex-1 p-2 bg-white border border-amber-200 rounded text-body-sm break-all font-mono">{{ newApiKey }}</code>
              <button
                class="px-3 py-2 bg-amber-600 text-white text-body-sm font-medium rounded hover:bg-amber-700"
                @click="copyApiKey"
              >
                {{ copied ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Client Table -->
      <div class="rounded-2xl bg-surface shadow-sm overflow-hidden">
        <div class="p-6 border-b border-rs-border flex items-center justify-between">
          <h2 class="text-body-lg font-semibold text-rs-fg">Clients</h2>
          <select
            v-model="statusFilter"
            class="px-3 py-1.5 border border-neutral-300 rounded-lg text-body-sm"
            @change="loadClients"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        <div class="p-6">
          <DataTable
            :columns="clientColumns"
            :rows="clientRows"
            :row-key="(row: any) => row.id ?? String(row)"
            :loading="loading"
            :error="error ? { message: error } : null"
            :empty="{ title: 'No institutional clients found.' }"
          >
            <template #cell-name="{ row }">
              <button
                class="text-left text-body-sm font-semibold text-rs-fg hover:underline"
                @click="toggleDetail(asString((row as any).id))"
              >
                {{ (row as any).name }}
              </button>
            </template>

            <template #cell-tier="{ row }">
              <span
                class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="tierBadgeClass(clientFromRow((row as any).raw).tier)"
              >
                {{ clientFromRow((row as any).raw).tier }}
              </span>
            </template>

            <template #cell-status="{ row }">
              <span
                class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="statusBadgeClass(clientFromRow((row as any).raw).status)"
              >
                {{ clientFromRow((row as any).raw).status }}
              </span>
            </template>

            <template #cell-actions="{ row }">
              <div class="flex items-center justify-end gap-2">
                <button
                  class="text-xs font-medium text-brand-600 hover:text-brand-700"
                  @click="startEdit(clientFromRow((row as any).raw))"
                >
                  Edit
                </button>
                <button
                  v-if="clientFromRow((row as any).raw).status === 'active'"
                  class="text-xs font-medium text-amber-600 hover:text-amber-700"
                  @click="changeStatus(clientFromRow((row as any).raw), 'suspended')"
                >
                  Suspend
                </button>
                <button
                  v-if="clientFromRow((row as any).raw).status === 'suspended'"
                  class="text-xs font-medium text-success-600 hover:text-success-700"
                  @click="changeStatus(clientFromRow((row as any).raw), 'active')"
                >
                  Reactivate
                </button>
                <button
                  v-if="clientFromRow((row as any).raw).status !== 'revoked'"
                  class="text-xs font-medium text-danger-600 hover:text-danger-700"
                  @click="changeStatus(clientFromRow((row as any).raw), 'revoked')"
                >
                  Revoke
                </button>
                <button
                  class="text-xs font-medium text-neutral-600 hover:text-neutral-800"
                  @click="rotateKey(clientFromRow((row as any).raw))"
                >
                  Rotate Key
                </button>
              </div>
            </template>
          </DataTable>

          <div
            v-if="expandedClient"
            class="mt-4 rounded-xl border border-rs-border bg-rs-bg p-4"
          >
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-body-lg font-semibold text-rs-fg">{{ expandedClient.name }} details</h3>
              <button
                type="button"
                class="rounded-md border border-rs-border px-3 py-1 text-body-sm text-rs-muted hover:bg-neutral-50"
                @click="expandedId = null"
              >
                Close
              </button>
            </div>

            <div
v-if="detailLoading"
class="text-body-sm text-rs-muted"
>
Loading details...
</div>
            <div
v-else-if="clientDetail"
class="grid gap-4 md:grid-cols-3"
>
              <div>
                <h4 class="mb-2 text-body-sm font-semibold text-neutral-700">Usage (Last 30 days)</h4>
                <div class="text-body-sm text-neutral-600">
                  Total requests: <strong>{{ clientDetail.usage.total_requests_30d }}</strong>
                </div>
                <div
v-if="clientDetail.usage.by_endpoint.length"
class="mt-2 space-y-1"
>
                  <div
                    v-for="ep in clientDetail.usage.by_endpoint"
                    :key="ep.endpoint"
                    class="flex justify-between text-xs text-neutral-500"
                  >
                    <span class="font-mono">{{ ep.endpoint }}</span>
                    <span>{{ ep.count }}</span>
                  </div>
                </div>
                <div
v-else
class="mt-1 text-xs text-neutral-400"
>
No usage data
</div>
              </div>
              <div>
                <h4 class="mb-2 text-body-sm font-semibold text-neutral-700">Export History</h4>
                <div
v-if="clientDetail.exports.length"
class="space-y-1"
>
                  <div
                    v-for="exp in clientDetail.exports"
                    :key="exp.id"
                    class="flex justify-between text-xs text-neutral-500"
                  >
                    <span>{{ exp.export_date }} ({{ exp.export_kind }})</span>
                    <span>{{ exp.row_count }} rows</span>
                  </div>
                </div>
                <div
v-else
class="text-xs text-neutral-400"
>
No exports yet
</div>
              </div>
              <div>
                <h4 class="mb-2 text-body-sm font-semibold text-neutral-700">Scopes</h4>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="scope in clientDetail.scopes"
                    :key="scope"
                    class="inline-block rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700"
                  >
                    {{ scope }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Modal -->
      <div
        v-if="editingClient"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="editingClient = null"
      >
        <div class="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <h3 class="text-body-lg font-semibold text-rs-fg mb-4">Edit: {{ editingClient.name }}</h3>
          <form
class="grid gap-4"
@submit.prevent="saveEdit"
>
            <div>
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Name</label>
              <input
                v-model="editForm.name"
                type="text"
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg"
              >
            </div>
            <div>
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Tier</label>
              <select
v-model="editForm.tier"
class="w-full px-4 py-2 border border-neutral-300 rounded-lg"
>
                <option value="trial">Trial</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Corridors Allowed</label>
              <input
                v-model="editForm.corridors_raw"
                type="text"
                placeholder="US-MX, US-IN"
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg"
              >
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-body-sm font-medium text-neutral-700 mb-1">RPM</label>
                <input
v-model.number="editForm.rate_limit_rpm"
type="number"
min="0"
class="w-full px-4 py-2 border border-neutral-300 rounded-lg"
>
              </div>
              <div>
                <label class="block text-body-sm font-medium text-neutral-700 mb-1">Daily</label>
                <input
v-model.number="editForm.rate_limit_daily"
type="number"
min="0"
class="w-full px-4 py-2 border border-neutral-300 rounded-lg"
>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-body-sm font-medium text-neutral-700 mb-1">Contract Start</label>
                <input
v-model="editForm.contract_start"
type="date"
class="w-full px-4 py-2 border border-neutral-300 rounded-lg"
>
              </div>
              <div>
                <label class="block text-body-sm font-medium text-neutral-700 mb-1">Contract End</label>
                <input
v-model="editForm.contract_end"
type="date"
class="w-full px-4 py-2 border border-neutral-300 rounded-lg"
>
              </div>
            </div>
            <div>
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Report Schedule</label>
              <select
v-model="editForm.report_schedule"
class="w-full px-4 py-2 border border-neutral-300 rounded-lg"
>
                <option value="none">None</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div class="flex justify-end gap-3 mt-2">
              <button
                type="button"
                class="px-4 py-2 border border-neutral-300 rounded-lg text-body-sm font-medium"
                @click="editingClient = null"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Rotated Key Display -->
      <div
        v-if="rotatedApiKey"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="rotatedApiKey = ''"
      >
        <div class="bg-white rounded-xl p-6 w-full max-w-lg">
          <h3 class="text-body-lg font-semibold text-rs-fg mb-4">New API Key</h3>
          <div class="p-4 bg-amber-50 border border-amber-300 rounded-lg">
            <div class="text-body-sm font-semibold text-amber-800 mb-2">
              Save this API key now — it will not be shown again
            </div>
            <div class="flex items-center gap-2">
              <code class="flex-1 p-2 bg-white border border-amber-200 rounded text-body-sm break-all font-mono">{{ rotatedApiKey }}</code>
              <button
                class="px-3 py-2 bg-amber-600 text-white text-body-sm font-medium rounded hover:bg-amber-700"
                @click="copyRotatedKey"
              >
                {{ rotatedCopied ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>
          <div class="flex justify-end mt-4">
            <button
              class="px-4 py-2 border border-neutral-300 rounded-lg text-body-sm font-medium"
              @click="rotatedApiKey = ''"
            >
              Close
            </button>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, defineAsyncComponent } from 'vue'
import { useApi } from '~/composables/useApi'
import { DataTable } from '~/ui'
import type { DataTableColumn } from '~/ui'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'admin',
})

const ErrorState = defineAsyncComponent(() => import('~/ui/states/ErrorState.vue'))
useAdminPage({
  title: 'Admin: Institutional Clients | Remit-Scout',
  description: 'Manage B2B institutional clients, API keys, and contracts.',
})

const { request } = useApi()
const log = useLogger('admin/institutional')

type InstitutionalClient = {
  id: string
  name: string
  client_prefix: string
  tier: string
  corridors_allowed: string[] | null
  rate_limit_rpm: number
  rate_limit_daily: number
  status: string
  nda_signed_at: string | null
  contract_start: string | null
  contract_end: string | null
  report_schedule: string
  created_at: string
  updated_at: string
}

type ClientDetail = {
  client: InstitutionalClient
  usage: {
    total_requests_30d: number
    by_endpoint: { endpoint: string, count: number }[]
  }
  exports: { id: string, export_date: string, export_kind: string, row_count: number, created_at: string }[]
  scopes: string[]
}

const loading = ref(true)
const error = ref<string | null>(null)
const clients = ref<InstitutionalClient[]>([])
const summaryData = reactive({ active: 0, suspended: 0, revoked: 0, trial: 0, standard: 0, premium: 0 })
const statusFilter = ref('')

const showCreateForm = ref(false)
const creating = ref(false)
const createMessage = ref('')
const createSuccess = ref(false)
const newApiKey = ref('')
const copied = ref(false)

const createForm = reactive({
  name: '',
  client_prefix: '',
  tier: 'trial' as 'trial' | 'standard' | 'premium',
  corridors_raw: '',
  rate_limit_rpm: 60,
  rate_limit_daily: 10000,
  contract_start: '',
  contract_end: '',
  report_schedule: 'none' as 'weekly' | 'monthly' | 'none',
})

const expandedId = ref<string | null>(null)
const detailLoading = ref(false)
const clientDetail = ref<ClientDetail | null>(null)
const expandedClient = computed(() => clients.value.find(client => client.id === expandedId.value) ?? null)

const editingClient = ref<InstitutionalClient | null>(null)
const editForm = reactive({
  name: '',
  tier: 'trial' as string,
  corridors_raw: '',
  rate_limit_rpm: 0,
  rate_limit_daily: 0,
  contract_start: '',
  contract_end: '',
  report_schedule: 'none' as string,
})
const saving = ref(false)

const rotatedApiKey = ref('')
const rotatedCopied = ref(false)

const tierBadgeClass = (tier: string) => {
  if (tier === 'premium') return 'bg-purple-100 text-purple-700'
  if (tier === 'standard') return 'bg-blue-100 text-blue-700'
  return 'bg-neutral-100 text-neutral-700'
}

const statusBadgeClass = (status: string) => {
  if (status === 'active') return 'bg-green-100 text-green-700'
  if (status === 'suspended') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

const clientColumns: DataTableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'client_prefix', label: 'Prefix' },
  { key: 'tier', label: 'Tier' },
  { key: 'status', label: 'Status' },
  { key: 'contract_end', label: 'Contract End' },
  { key: 'rate_limits', label: 'Rate Limits' },
  { key: 'report_schedule', label: 'Report' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

const clientRows = computed(() =>
  clients.value.map(client => ({
    id: client.id,
    name: client.name,
    client_prefix: client.client_prefix,
    tier: client.tier,
    status: client.status,
    contract_end: client.contract_end || '-',
    rate_limits: `${client.rate_limit_rpm}/min, ${client.rate_limit_daily}/day`,
    report_schedule: client.report_schedule,
    actions: 'actions',
    raw: client,
  })),
)

const asString = (value: unknown): string => {
  if (typeof value === 'string') return value
  return String(value ?? '')
}

const clientFromRow = (value: unknown): InstitutionalClient => value as InstitutionalClient

const parseCsvCorridors = (raw: string): string[] | null => {
  if (!raw.trim()) return null
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

const loadClients = async () => {
  loading.value = true
  error.value = null
  try {
    const query: Record<string, string> = {}
    if (statusFilter.value) query.status = statusFilter.value

    const data = await request<{
      clients?: InstitutionalClient[]
      summary?: typeof summaryData
    }>('/admin/institutional/clients', { query })

    if (data) {
      clients.value = data.clients || []
      if (data.summary) {
        Object.assign(summaryData, data.summary)
      }
    }
  }
 catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load institutional clients'
    log.error('Failed to load clients', err)
  }
 finally {
    loading.value = false
  }
}

const createClient = async () => {
  creating.value = true
  createMessage.value = ''
  createSuccess.value = false
  newApiKey.value = ''

  try {
    const data = await request<{ success?: boolean, client?: InstitutionalClient, api_key?: string }>(
      '/admin/institutional/clients',
      {
        method: 'POST',
        body: {
          name: createForm.name,
          client_prefix: createForm.client_prefix,
          tier: createForm.tier,
          corridors_allowed: parseCsvCorridors(createForm.corridors_raw),
          rate_limit_rpm: createForm.rate_limit_rpm,
          rate_limit_daily: createForm.rate_limit_daily,
          contract_start: createForm.contract_start || null,
          contract_end: createForm.contract_end || null,
          report_schedule: createForm.report_schedule,
        },
      },
    )

    if (data?.success) {
      createMessage.value = `Client "${createForm.name}" created successfully.`
      createSuccess.value = true
      newApiKey.value = data.api_key || ''
      createForm.name = ''
      createForm.client_prefix = ''
      createForm.tier = 'trial'
      createForm.corridors_raw = ''
      createForm.rate_limit_rpm = 60
      createForm.rate_limit_daily = 10000
      createForm.contract_start = ''
      createForm.contract_end = ''
      createForm.report_schedule = 'none'
      await loadClients()
    }
 else {
      createMessage.value = 'Failed to create client.'
    }
  }
 catch (err) {
    createMessage.value = 'Failed to create client.'
    createSuccess.value = false
  }
 finally {
    creating.value = false
  }
}

const copyApiKey = async () => {
  await navigator.clipboard.writeText(newApiKey.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

const toggleDetail = async (id: string) => {
  if (expandedId.value === id) {
    expandedId.value = null
    clientDetail.value = null
    return
  }
  expandedId.value = id
  detailLoading.value = true
  clientDetail.value = null

  try {
    const data = await request<ClientDetail>(`/admin/institutional/clients/${id}`)
    clientDetail.value = data
  }
 catch (err) {
    log.error('Failed to load client detail', err)
  }
 finally {
    detailLoading.value = false
  }
}

const startEdit = (client: InstitutionalClient) => {
  editingClient.value = client
  editForm.name = client.name
  editForm.tier = client.tier
  editForm.corridors_raw = client.corridors_allowed?.join(', ') || ''
  editForm.rate_limit_rpm = client.rate_limit_rpm
  editForm.rate_limit_daily = client.rate_limit_daily
  editForm.contract_start = client.contract_start || ''
  editForm.contract_end = client.contract_end || ''
  editForm.report_schedule = client.report_schedule
}

const saveEdit = async () => {
  if (!editingClient.value) return
  saving.value = true

  try {
    await request(
      `/admin/institutional/clients/${editingClient.value.id}`,
      {
        method: 'PATCH',
        body: {
          name: editForm.name,
          tier: editForm.tier,
          corridors_allowed: parseCsvCorridors(editForm.corridors_raw),
          rate_limit_rpm: editForm.rate_limit_rpm,
          rate_limit_daily: editForm.rate_limit_daily,
          contract_start: editForm.contract_start || null,
          contract_end: editForm.contract_end || null,
          report_schedule: editForm.report_schedule,
        },
      },
    )
    editingClient.value = null
    await loadClients()
  }
 catch (err) {
    log.error('Failed to update client', err)
  }
 finally {
    saving.value = false
  }
}

const changeStatus = async (client: InstitutionalClient, newStatus: string) => {
  const action = newStatus === 'revoked' ? 'revoke' : newStatus === 'suspended' ? 'suspend' : 'reactivate'
  if (!confirm(`Are you sure you want to ${action} "${client.name}"?`)) return

  try {
    await request(
      `/admin/institutional/clients/${client.id}/status`,
      {
        method: 'POST',
        body: { status: newStatus },
      },
    )
    await loadClients()
  }
 catch (err) {
    log.error('Failed to change status', err)
  }
}

const rotateKey = async (client: InstitutionalClient) => {
  if (!confirm(`Rotate API key for "${client.name}"? The current key will be immediately invalidated.`)) return

  try {
    const data = await request<{ success?: boolean, api_key?: string }>(
      `/admin/institutional/clients/${client.id}/rotate-key`,
      { method: 'POST' },
    )
    if (data?.api_key) {
      rotatedApiKey.value = data.api_key
      rotatedCopied.value = false
    }
  }
 catch (err) {
    log.error('Failed to rotate key', err)
  }
}

const copyRotatedKey = async () => {
  await navigator.clipboard.writeText(rotatedApiKey.value)
  rotatedCopied.value = true
  setTimeout(() => {
    rotatedCopied.value = false
  }, 2000)
}

onMounted(() => {
  void loadClients()
})
</script>
