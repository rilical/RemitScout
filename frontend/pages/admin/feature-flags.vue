<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Feature Flags"
      subtitle="Effective rollout state with explicit precedence: hard env gates, DB overrides, and entitlements."
    >
      <template #actions>
        <button
          class="h-10 rounded-lg border border-rs-border px-4 text-body-sm font-semibold text-rs-fg hover:bg-neutral-50 disabled:opacity-60"
          :disabled="loading"
          @click="loadFlags"
        >
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </template>
    </AdminPageShell>

    <AdminSurfaceOverview :model="surfaceOverview" />

    <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Effective runtime flags</h2>
            <p class="text-body-sm text-rs-muted">
              This is the actual runtime evaluation the app uses, not just the raw DB table.
            </p>
          </div>
          <div class="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-body-sm text-sky-800">
            Current plan: <span class="font-semibold">{{ effectivePlanLabel }}</span>
          </div>
        </div>

        <div class="mt-4 overflow-auto">
          <table class="min-w-full text-body-sm">
            <thead class="text-body-sm uppercase text-neutral-400">
              <tr>
                <th class="py-2 text-left">Flag</th>
                <th class="py-2 text-left">Effective state</th>
                <th class="py-2 text-left">Source</th>
                <th class="py-2 text-left">Hard gate</th>
                <th class="py-2 text-left">Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="flag in runtimeFlags"
                :key="flag.key"
                class="border-t border-neutral-100 align-top"
              >
                <td class="py-3">
                  <div class="font-semibold text-rs-fg">{{ flag.label }}</div>
                  <div class="font-mono text-xs text-rs-muted">{{ flag.key }}</div>
                </td>
                <td class="py-3">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="flag.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'"
                  >
                    {{ flag.enabled ? 'enabled' : 'disabled' }}
                  </span>
                  <div class="mt-2 text-xs text-rs-muted">
                    Audience match: {{ flag.matched_audience_rules ? 'yes' : 'no' }}
                  </div>
                </td>
                <td class="py-3 text-rs-fg">{{ formatFlagSource(flag.source) }}</td>
                <td class="py-3 text-rs-fg">{{ flag.hard_gate_enabled ? 'open' : 'closed' }}</td>
                <td class="py-3 text-rs-muted">
                  <div>{{ flag.reason }}</div>
                  <div v-if="flag.db_flag?.updated_at" class="mt-1 text-xs text-neutral-400">
                    DB updated {{ formatTimestamp(flag.db_flag.updated_at) }}
                  </div>
                </td>
              </tr>
              <tr v-if="runtimeFlags.length === 0">
                <td colspan="5" class="py-4 text-center text-body-sm text-rs-muted">
                  No runtime flags resolved.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Mutation safety</h2>
        <div
          class="mt-4 rounded-2xl border px-4 py-4 text-body-sm"
          :class="canMutate ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'"
        >
          <div class="font-semibold">
            {{ canMutate ? 'Super-admin mutation access confirmed' : 'Read-only mode' }}
          </div>
          <p class="mt-1">
            {{ canMutate
              ? 'Create and update actions are allowed. The runtime console above will refresh after each change.'
              : 'Only super-admins can mutate rollout configuration. This console remains fully visible so operators can verify effective state.' }}
          </p>
        </div>

        <div class="mt-4 space-y-3">
          <div
            v-for="flag in runtimeFlags"
            :key="`${flag.key}:detail`"
            class="rounded-2xl border border-rs-border bg-rs-bg/40 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="text-body-sm font-semibold text-rs-fg">{{ flag.label }}</div>
              <span class="rounded-full bg-rs-surface px-2 py-1 text-xs font-semibold text-rs-muted">
                {{ flag.plan_code }}
              </span>
            </div>
            <p class="mt-2 text-body-sm text-rs-muted">{{ flag.description }}</p>
            <p class="mt-2 text-xs text-neutral-400">
              DB override: {{ flag.db_flag ? `${flag.db_flag.enabled}` : 'none' }} · Hard env gate:
              {{ flag.hard_gate_enabled ? 'open' : 'closed' }}
            </p>
          </div>
        </div>
      </article>
    </section>

    <section
      v-if="canMutate"
      class="grid gap-6 xl:grid-cols-2"
    >
      <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Create DB override</h2>
        <p class="mt-1 text-body-sm text-rs-muted">
          Use DB overrides for rollout targeting. Hard env gates still win when disabled.
        </p>
        <form class="mt-4 grid gap-3" @submit.prevent="createFlag">
          <label class="text-body-sm text-rs-muted">
            Key
            <input
              v-model="createForm.key"
              type="text"
              placeholder="pulse.public"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
            >
          </label>

          <label class="text-body-sm text-rs-muted">
            Enabled
            <select
              v-model="createForm.enabled"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
            >
              <option :value="true">true</option>
              <option :value="false">false</option>
            </select>
          </label>

          <label class="text-body-sm text-rs-muted">
            Audience rules JSON
            <textarea
              v-model="createForm.audienceJson"
              rows="6"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 font-mono text-body-sm"
            />
          </label>

          <div class="flex items-center gap-3">
            <button
              type="submit"
              class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="creating"
            >
              {{ creating ? 'Creating…' : 'Create override' }}
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
      </article>

      <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Edit selected override</h2>
        <div
          v-if="!selectedFlag"
          class="mt-4 rounded-xl border border-dashed border-rs-border p-4 text-body-sm text-rs-muted"
        >
          Select a DB override from the table below.
        </div>

        <div v-else class="mt-4 space-y-3">
          <div class="text-body-sm text-rs-muted">
            Editing: <span class="font-semibold text-rs-fg">{{ selectedFlag.key }}</span>
          </div>
          <label class="flex items-center gap-2 text-body-sm text-rs-muted">
            <input v-model="editor.enabled" type="checkbox" class="h-4 w-4 rounded border-rs-border text-brand-600">
            Enabled
          </label>
          <label class="block text-body-sm text-rs-muted">
            Audience rules JSON
            <textarea
              v-model="editor.audienceJson"
              rows="6"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 font-mono text-body-sm"
            />
          </label>
          <label class="block text-body-sm text-rs-muted">
            Metadata JSON
            <textarea
              v-model="editor.metadataJson"
              rows="5"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 font-mono text-body-sm"
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

    <section class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">DB overrides</h2>
        <p class="mt-1 text-body-sm text-rs-muted">
          These are the mutable DB records. Effective state above shows how they resolve at runtime.
        </p>

        <DataTable
          class="mt-4"
          :columns="flagColumns"
          :rows="flagRows"
          :row-key="(row: any) => row.key ?? String(row)"
          :loading="loading"
          :error="error ? { message: error } : null"
          :empty="{
            title: 'No DB overrides yet.',
            message: 'Bootstrap defaults are active until you add an explicit DB override.'
          }"
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
              :class="asBoolean((row as any).enabled) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'"
            >
              {{ asBoolean((row as any).enabled) ? 'true' : 'false' }}
            </span>
          </template>
        </DataTable>
      </article>

      <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Change history</h2>
        <p class="mt-1 text-body-sm text-rs-muted">Immutable audit trail for the selected DB override.</p>

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
                <td colspan="4" class="py-4 text-center text-body-sm text-rs-muted">
                  No history entries yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import type { DataTableColumn } from '~/ui'
import { DataTable } from '~/ui'
import type { EffectiveRuntimeFlag, RuntimeFlagSource } from '~/composables/useFeatureFlags'
import type { AdminSurfaceOverviewModel } from '~/utils/adminSurfaceStatus'
import { formatAdminSurfaceAge, getFreshnessTone } from '~/utils/adminSurfaceStatus'
import { getAdminApiErrorMessage } from '~/utils/adminApiErrors'

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

type RuntimeFlagsResponse = {
  flags?: FeatureFlag[]
  runtime?: {
    generated_at: string
    flags: EffectiveRuntimeFlag[]
  }
}

const { request } = useApi()
const { isSuperAdmin } = useAuth()
const { formatTimestamp } = useAdminFormat()
const { refreshRuntimeFlags } = useFeatureFlags()

const loading = ref(false)
const creating = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const createMessage = ref('')
const createSuccess = ref(false)
const saveMessage = ref('')
const saveSuccess = ref(false)

const flags = ref<FeatureFlag[]>([])
const runtimeFlags = ref<EffectiveRuntimeFlag[]>([])
const history = ref<FeatureFlagHistoryEntry[]>([])
const selectedKey = ref<string | null>(null)
const generatedAt = ref<string | null>(null)

const createForm = reactive({
  key: 'pulse.public',
  enabled: false,
  audienceJson: JSON.stringify({ global: true }, null, 2),
})

const editor = reactive({
  enabled: false,
  audienceJson: '{}',
  metadataJson: '{}',
})

const canMutate = computed(() => Boolean(isSuperAdmin.value))
const effectivePlanLabel = computed(() => runtimeFlags.value[0]?.plan_code || 'free')
const hardGatedCount = computed(() => runtimeFlags.value.filter(flag => !flag.hard_gate_enabled).length)
const dbManagedCount = computed(() => flags.value.length)
const audienceScopedCount = computed(() => flags.value.filter(flag => {
  const rules = flag.audience_rules || {}
  return Object.keys(rules).length > 0 && rules.global !== true
}).length)

const surfaceOverview = computed<AdminSurfaceOverviewModel>(() => {
  const freshnessTone = getFreshnessTone(generatedAt.value, { watchMinutes: 15, criticalMinutes: 60 })
  const anyHardDisabled = runtimeFlags.value.some(flag => !flag.hard_gate_enabled)
  const anyDbOverrides = flags.value.length > 0

  return {
    runtimeLabel: anyHardDisabled ? 'Precedence active with hard gates' : 'Precedence active',
    runtimeTone: anyHardDisabled ? 'gated' : 'healthy',
    runtimeDetail: anyHardDisabled
      ? 'One or more hard env gates are closed. DB overrides remain visible but cannot force runtime on.'
      : 'The app now resolves flags through one model: hard env gates, DB overrides, then entitlement overrides.',
    freshnessLabel: generatedAt.value ? formatAdminSurfaceAge(generatedAt.value) : 'Not yet evaluated',
    freshnessTone,
    freshnessDetail: generatedAt.value ? `Resolver generated at ${formatTimestamp(generatedAt.value)}` : 'The runtime resolver has not returned a snapshot yet.',
    lastJobLabel: generatedAt.value ? formatTimestamp(generatedAt.value) : 'No runtime evaluation yet',
    lastJobDetail: anyDbOverrides
      ? `${dbManagedCount.value} DB override(s) currently present.`
      : 'No DB overrides exist yet; bootstrap defaults are still active.',
    stats: [
      { label: 'Effective flags', value: String(runtimeFlags.value.length) },
      { label: 'DB overrides', value: String(dbManagedCount.value) },
      { label: 'Hard gates closed', value: String(hardGatedCount.value) },
      { label: 'Audience scoped', value: String(audienceScopedCount.value) },
    ],
    dependencies: [
      {
        label: 'Env hard gates',
        status: anyHardDisabled ? 'gated' : 'healthy',
        detail: anyHardDisabled ? 'At least one hard env gate is disabled.' : 'All hard env gates are open.',
      },
      {
        label: 'Feature flag table',
        status: anyDbOverrides ? 'healthy' : 'watch',
        detail: anyDbOverrides ? 'DB overrides are available and being evaluated.' : 'No DB overrides exist; bootstrap defaults are carrying rollout state.',
      },
      {
        label: 'Entitlement overrides',
        status: 'healthy',
        detail: 'Paid entitlements still override DB for entitled experiences unless a hard env gate is closed.',
      },
    ],
    nextActions: [
      {
        label: 'Verify hard env gates before expecting rollout changes to take effect.',
      },
      {
        label: 'Use DB overrides for targeting and percentage-style rollout rules.',
      },
      {
        label: 'Re-check effective runtime rows after every save to confirm precedence.',
      },
    ],
    emptyState: runtimeFlags.value.length === 0
      ? {
          title: 'Runtime flags have not resolved yet.',
          body: 'Refresh the page after admin auth is established. The resolver output should never be empty once the API responds.',
        }
      : flags.value.length === 0
        ? {
            title: 'No DB overrides are configured.',
            body: 'That is valid. The runtime still works from hard env gates and entitlement overrides until you add explicit DB rollouts.',
          }
        : null,
  }
})

const flagColumns: DataTableColumn[] = [
  { key: 'key', label: 'Key' },
  { key: 'enabled', label: 'Enabled' },
  { key: 'updated_at', label: 'Updated' },
]

const flagRows = computed(() =>
  flags.value.map(flag => ({
    key: flag.key,
    enabled: flag.enabled,
    updated_at: formatTimestamp(flag.updated_at),
    raw: flag,
  })),
)

const asString = (value: unknown): string => typeof value === 'string' ? value : String(value ?? '')
const asBoolean = (value: unknown): boolean => value === true

const selectedFlag = computed(() =>
  flags.value.find(flag => flag.key === selectedKey.value) ?? null,
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

const formatFlagSource = (source: RuntimeFlagSource) => {
  switch (source) {
    case 'hard_env_disabled':
      return 'Hard env gate'
    case 'entitlement_override':
      return 'Entitlement override'
    case 'db_flag':
      return 'DB override'
    case 'bootstrap_default':
      return 'Bootstrap default'
    default:
      return source
  }
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
    const response = await request<RuntimeFlagsResponse>('/admin/feature-flags')
    flags.value = response.flags || []
    runtimeFlags.value = response.runtime?.flags || []
    generatedAt.value = response.runtime?.generated_at || null

    if (!selectedKey.value && flags.value.length > 0) {
      selectedKey.value = flags.value[0].key
    }
    if (selectedKey.value) {
      const selected = flags.value.find(item => item.key === selectedKey.value) || null
      hydrateEditor(selected)
      if (selected) {
        await loadHistory(selected.key)
      }
    }
  }
  catch (err) {
    error.value = getAdminApiErrorMessage(err, 'Failed to load feature flags.')
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
  const selected = flags.value.find(item => item.key === normalized) || null
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
    const audienceRules = parseJsonObject(createForm.audienceJson, { global: true })
    await request('/admin/feature-flags', {
      method: 'POST',
      body: {
        key,
        enabled: createForm.enabled,
        audience_rules: audienceRules,
      },
    })
    createMessage.value = 'Feature flag override created.'
    createSuccess.value = true
    await refreshRuntimeFlags()
    await loadFlags()
  }
  catch (err) {
    createMessage.value = getAdminApiErrorMessage(err, 'Failed to create feature flag override.')
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
    saveMessage.value = 'Feature flag override updated.'
    saveSuccess.value = true
    await refreshRuntimeFlags()
    await loadFlags()
  }
  catch (err) {
    saveMessage.value = getAdminApiErrorMessage(err, 'Failed to update feature flag override.')
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
