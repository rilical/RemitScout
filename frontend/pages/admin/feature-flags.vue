<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Feature Flags"
      subtitle="Runtime toggles with audience rules and immutable audit history."
    >
      <template #actions>
        <button
          class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          :disabled="loading"
          @click="loadFlags"
        >
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </template>
    </AdminPageShell>

    <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
      <h2 class="text-body-lg font-semibold text-rs-fg">Create flag</h2>
      <form
        class="mt-4 grid gap-3 lg:grid-cols-4"
        @submit.prevent="createFlag"
      >
        <label class="text-body-sm text-rs-muted lg:col-span-1">
          Key
          <input
            v-model="createForm.key"
            type="text"
            placeholder="ops.new_pipeline"
            class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
          >
        </label>

        <label class="text-body-sm text-rs-muted lg:col-span-1">
          Enabled
          <select
            v-model="createForm.enabled"
            class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
          >
            <option :value="false">false</option>
            <option :value="true">true</option>
          </select>
        </label>

        <label class="text-body-sm text-rs-muted lg:col-span-2">
          Audience rules JSON
          <input
            v-model="createForm.audienceJson"
            type="text"
            placeholder='{"global": true, "audiences": [{"type":"country","allow":["US"]}]}'
            class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm font-mono"
          >
        </label>

        <div class="lg:col-span-4 flex items-center gap-3">
          <button
            type="submit"
            class="h-10 rounded-lg border border-rs-border px-4 text-body-sm font-semibold text-rs-fg hover:bg-neutral-50"
            :disabled="creating"
          >
            {{ creating ? 'Creating…' : 'Create flag' }}
          </button>
          <span
            v-if="createMessage"
            class="text-body-sm"
            :class="createSuccess ? 'text-success-600' : 'text-danger-600'"
          >
            {{ createMessage }}
          </span>
        </div>
      </form>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="mb-4 text-body-lg font-semibold text-rs-fg">Flags</h2>

        <DataTable
          :columns="flagColumns"
          :rows="flagRows"
          :row-key="(row: any) => row.key ?? String(row)"
          :loading="loading"
          :error="error ? { message: error } : null"
          :empty="{ title: 'No feature flags found.' }"
        >
          <template #cell-key="{ row }">
              <button
                class="text-left text-body-sm font-semibold text-rs-fg hover:underline"
                @click="selectFlag(asString((row as any).key))"
              >
                {{ asString((row as any).key) }}
              </button>
            </template>
            <template #cell-enabled="{ row }">
              <span
                class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="asBoolean((row as any).enabled) ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-700'"
              >
                {{ asBoolean((row as any).enabled) ? 'true' : 'false' }}
              </span>
            </template>
        </DataTable>
      </article>

      <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Flag editor</h2>
        <div
          v-if="!selectedFlag"
          class="mt-4 rounded-lg border border-dashed border-rs-border p-4 text-body-sm text-rs-muted"
        >
          Select a flag from the table to edit it.
        </div>

        <div
          v-else
          class="mt-4 space-y-3"
        >
          <div class="text-body-sm text-rs-muted">Editing: <span class="font-semibold text-rs-fg">{{ selectedFlag.key }}</span></div>
          <label class="flex items-center gap-2 text-body-sm text-rs-muted">
            <input
              v-model="editor.enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-rs-border text-brand-600"
            >
            Enabled
          </label>
          <label class="block text-body-sm text-rs-muted">
            Audience rules JSON
            <textarea
              v-model="editor.audienceJson"
              rows="6"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm font-mono"
            />
          </label>
          <label class="block text-body-sm text-rs-muted">
            Metadata JSON
            <textarea
              v-model="editor.metadataJson"
              rows="4"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm font-mono"
            />
          </label>
          <div class="flex items-center gap-3">
            <button
              class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="saving"
              @click="saveSelectedFlag"
            >
              {{ saving ? 'Saving…' : 'Save changes' }}
            </button>
            <span
              v-if="saveMessage"
              class="text-body-sm"
              :class="saveSuccess ? 'text-success-600' : 'text-danger-600'"
            >
              {{ saveMessage }}
            </span>
          </div>
        </div>
      </article>
    </section>

    <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
      <h2 class="text-body-lg font-semibold text-rs-fg">History</h2>
      <p class="text-body-sm text-rs-muted">Latest changes for the selected flag.</p>
      <div class="mt-4 overflow-auto">
        <table class="min-w-full text-body-sm">
          <thead class="text-body-sm uppercase text-neutral-400">
            <tr>
              <th class="py-2 text-left">When</th>
              <th class="py-2 text-left">Action</th>
              <th class="py-2 text-left">Changed by</th>
              <th class="py-2 text-left">Enabled</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in history"
              :key="entry.id"
              class="border-t border-neutral-100"
            >
              <td class="py-2 text-rs-muted">{{ formatTimestamp(entry.changed_at) }}</td>
              <td class="py-2 text-rs-fg">{{ entry.action }}</td>
              <td class="py-2 text-rs-muted">{{ entry.changed_by || 'system' }}</td>
              <td class="py-2 text-rs-muted">{{ entry.next_enabled }}</td>
            </tr>
            <tr v-if="history.length === 0">
              <td
                colspan="4"
                class="py-3 text-center text-body-sm text-neutral-400"
              >
                No history entries yet.
              </td>
            </tr>
          </tbody>
        </table>
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
  title: 'Admin: Feature Flags | Remit-Scout',
  description: 'Manage runtime feature flags and audience rules.',
})

type FeatureFlag = {
  key: string
  enabled: boolean
  audience_rules: Record<string, unknown>
  metadata: Record<string, unknown>
  updated_by: string | null
  updated_at: string
  created_at: string
}

type FeatureFlagHistoryEntry = {
  id: number
  action: string
  changed_by: string | null
  changed_at: string
  next_enabled: boolean | null
}

const { request } = useApi()
const { formatTimestamp } = useAdminFormat()

const loading = ref(false)
const creating = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const createMessage = ref('')
const createSuccess = ref(false)
const saveMessage = ref('')
const saveSuccess = ref(false)

const flags = ref<FeatureFlag[]>([])
const history = ref<FeatureFlagHistoryEntry[]>([])
const selectedKey = ref<string | null>(null)

const createForm = reactive({
  key: '',
  enabled: false,
  audienceJson: '{"global": true, "audiences": []}',
})

const editor = reactive({
  enabled: false,
  audienceJson: '{}',
  metadataJson: '{}',
})

const flagColumns: DataTableColumn[] = [
  { key: 'key', label: 'Key' },
  { key: 'enabled', label: 'Enabled' },
  { key: 'updated_at', label: 'Updated' },
]

const flagRows = computed(() =>
  flags.value.map((flag) => ({
    key: flag.key,
    enabled: flag.enabled,
    updated_at: formatTimestamp(flag.updated_at),
    raw: flag,
  })),
)

const asString = (value: unknown): string => {
  if (typeof value === 'string') return value
  return String(value ?? '')
}

const asBoolean = (value: unknown): boolean => value === true

const selectedFlag = computed(() =>
  flags.value.find((flag) => flag.key === selectedKey.value) ?? null,
)

const parseJsonObject = (value: string, fallback: Record<string, unknown> = {}) => {
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return fallback
  }
  catch {
    throw new Error('Invalid JSON payload.')
  }
}

const normalizeFlagKey = (value: string): string => value.trim().toLowerCase()
const FLAG_KEY_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,63})$/
const isSafeFlagKey = (value: string): boolean => {
  if (!FLAG_KEY_PATTERN.test(value)) return false
  if (value.includes('..') || value.includes('//') || value.includes('/')) return false
  return true
}
const encodeFlagKeyPathSegment = (value: string): string => encodeURIComponent(value)

const hydrateEditor = (flag: FeatureFlag | null) => {
  if (!flag) return
  editor.enabled = flag.enabled
  editor.audienceJson = JSON.stringify(flag.audience_rules || {}, null, 2)
  editor.metadataJson = JSON.stringify(flag.metadata || {}, null, 2)
}

const loadHistory = async (key: string) => {
  const normalized = normalizeFlagKey(key)
  if (!isSafeFlagKey(normalized)) {
    throw new Error('Invalid feature flag key.')
  }
  const encoded = encodeFlagKeyPathSegment(normalized)
  const response = await request<{ history?: FeatureFlagHistoryEntry[] }>(`/admin/feature-flags/${encoded}/history`, {
    query: { limit: 50 },
  })
  history.value = response.history || []
}

const loadFlags = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await request<{ flags?: FeatureFlag[] }>('/admin/feature-flags')
    flags.value = response.flags || []
    if (!selectedKey.value && flags.value.length > 0) {
      selectedKey.value = flags.value[0].key
    }
    if (selectedKey.value) {
      const selected = flags.value.find((item) => item.key === selectedKey.value) || null
      hydrateEditor(selected)
      if (selected) {
        await loadHistory(selected.key)
      }
    }
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load feature flags.'
  }
  finally {
    loading.value = false
  }
}

const selectFlag = async (key: string) => {
  const normalized = normalizeFlagKey(key)
  if (!isSafeFlagKey(normalized)) {
    error.value = 'Invalid feature flag key.'
    return
  }
  selectedKey.value = normalized
  const selected = flags.value.find((item) => item.key === normalized) || null
  hydrateEditor(selected)
  if (!selected) return
  await loadHistory(selected.key)
}

const createFlag = async () => {
  creating.value = true
  createMessage.value = ''
  createSuccess.value = false
  try {
    const key = normalizeFlagKey(createForm.key)
    if (!isSafeFlagKey(key)) {
      throw new Error('Feature flag key must be 1-64 chars using a-z, 0-9, dot, underscore, or hyphen.')
    }
    const audienceRules = parseJsonObject(createForm.audienceJson, { global: true, audiences: [] })
    await request('/admin/feature-flags', {
      method: 'POST',
      body: {
        key,
        enabled: createForm.enabled,
        audience_rules: audienceRules,
      },
    })
    createMessage.value = 'Feature flag created.'
    createSuccess.value = true
    createForm.key = ''
    createForm.enabled = false
    await loadFlags()
  }
  catch (err) {
    createMessage.value = err instanceof Error ? err.message : 'Failed to create feature flag.'
    createSuccess.value = false
  }
  finally {
    creating.value = false
  }
}

const saveSelectedFlag = async () => {
  if (!selectedFlag.value) return
  saving.value = true
  saveMessage.value = ''
  saveSuccess.value = false
  try {
    const key = normalizeFlagKey(selectedFlag.value.key)
    if (!isSafeFlagKey(key)) {
      throw new Error('Invalid feature flag key.')
    }
    const audienceRules = parseJsonObject(editor.audienceJson, {})
    const metadata = parseJsonObject(editor.metadataJson, {})
    await request(`/admin/feature-flags/${encodeFlagKeyPathSegment(key)}`, {
      method: 'PATCH',
      body: {
        enabled: editor.enabled,
        audience_rules: audienceRules,
        metadata,
      },
    })
    saveMessage.value = 'Feature flag updated.'
    saveSuccess.value = true
    await loadFlags()
  }
  catch (err) {
    saveMessage.value = err instanceof Error ? err.message : 'Failed to update feature flag.'
    saveSuccess.value = false
  }
  finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadFlags()
})
</script>
