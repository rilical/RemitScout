<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Incident Timeline"
      subtitle="Full incident lifecycle from detection to resolution."
      :loading="loading"
      :error="error"
      :meta="lastUpdated ? `Last updated: ${formatDateTime(lastUpdated)}` : undefined"
    >
      <template #actions>
        <div class="flex items-center gap-3">
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
>{{ countdown }}s</span>
          </label>
          <button
            class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            :disabled="loading"
            @click="load"
          >
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
      </template>
    </AdminPageShell>

    <template v-if="!loading && !error">
      <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Incident Lifecycle</h2>
        <p class="mb-4 text-body-sm text-rs-muted">Detection, triage, and resolution for each failure bundle.</p>
        <div
v-if="!incidents.length"
class="py-12 text-center text-body-sm text-rs-muted"
>
          No incidents to display.
        </div>
        <ul
v-else
class="space-y-4"
>
          <li
            v-for="inc in incidents"
            :key="inc.bundle_id"
            class="rounded-xl border p-4 transition-colors"
            :class="incidentBorderClass(inc)"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium text-rs-fg">{{ inc.module_id }}</span>
                  <span
class="rounded-full px-2 py-0.5 text-caption font-medium"
:class="incidentBadgeClass(inc)"
>
                    {{ inc.repair_outcome ?? 'pending' }}
                  </span>
                  <a
                    v-if="inc.repair_pr_url"
                    :href="inc.repair_pr_url"
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
                <p class="mt-1 text-caption text-rs-muted">{{ inc.error_message }}</p>
                <div class="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-caption text-rs-muted">
                  <span><strong class="text-rs-fg">Detection:</strong> {{ formatDateTime(inc.created_at) }}</span>
                  <span v-if="inc.triage_at"><strong class="text-rs-fg">Triage:</strong> {{ formatDateTime(inc.triage_at) }}</span>
                  <span v-else><strong class="text-rs-fg">Triage:</strong> —</span>
                  <span v-if="inc.resolution_at"><strong class="text-rs-fg">Resolution:</strong> {{ formatDateTime(inc.resolution_at) }}</span>
                  <span v-else><strong class="text-rs-fg">Resolution:</strong> —</span>
                  <span><strong class="text-rs-fg">Duration:</strong> {{ inc.durationLabel }}</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AgentActionEntry, FailureBundleSummary, RepairOutcome } from '~/types/agents'
import { getAgentActions, getFailureBundles } from '~/lib/opsApi'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Incident Timeline | Remit-Scout',
  description: 'Full incident lifecycle from detection to resolution.',
})

interface IncidentRow extends FailureBundleSummary {
  triage_at: string | null
  resolution_at: string | null
  durationLabel: string
}

const { formatDateTime, formatDuration } = useAdminFormat()

const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<string | null>(null)
const bundles = ref<FailureBundleSummary[]>([])
const actions = ref<AgentActionEntry[]>([])

const incidents = computed<IncidentRow[]>(() => {
  const result: IncidentRow[] = []
  const resolutionOutcomes: RepairOutcome[] = ['applied', 'failed', 'rejected']
  for (const b of bundles.value) {
    const moduleActions = actions.value
      .filter(a => a.module_id === b.module_id && new Date(a.created_at).getTime() >= new Date(b.created_at).getTime())
      .sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime())
    const triageAt = moduleActions[0]?.created_at ?? null
    const resolutionAction = [...moduleActions].reverse().find(a => a.completed_at && ['completed', 'failed', 'rejected'].includes(a.status))
    const resolutionAt = resolutionOutcomes.includes(b.repair_outcome as RepairOutcome)
      ? (resolutionAction?.completed_at ?? triageAt ?? b.created_at)
      : null
    const endMs = resolutionAt ? new Date(resolutionAt).getTime() : Date.now()
    const startMs = new Date(b.created_at).getTime()
    const durationSec = Math.max(0, Math.floor((endMs - startMs) / 1000))
    const durationLabel = resolutionOutcomes.includes(b.repair_outcome as RepairOutcome)
      ? (formatDuration(durationSec) ?? '—')
      : `In progress (${formatDuration(durationSec) ?? '—'})`
    result.push({
      ...b,
      triage_at: triageAt,
      resolution_at: resolutionAt,
      durationLabel,
    })
  }
  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

const incidentBadgeClass = (inc: IncidentRow) => {
  if (inc.repair_outcome === 'applied') return 'bg-green-100 text-green-700'
  if (inc.repair_outcome === 'failed' || inc.repair_outcome === 'rejected') return 'bg-red-100 text-red-700'
  return 'bg-amber-100 text-amber-700'
}

const incidentBorderClass = (inc: IncidentRow) => {
  if (inc.repair_outcome === 'applied') return 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20'
  if (inc.repair_outcome === 'failed' || inc.repair_outcome === 'rejected') return 'border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20'
  return 'border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20'
}

const autoRefresh = ref(false)
const countdown = ref(60)
let timer: ReturnType<typeof setInterval> | null = null

watch(autoRefresh, (on) => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (on) {
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
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
