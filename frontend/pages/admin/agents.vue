<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Self-Healing Pipeline"
      subtitle="Agent actions, failure bundles, and repair metrics."
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
      <SelfHealingKpiTiles :metrics="metrics" />

      <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Failure Rate Trends</h2>
        <p class="mb-4 text-body-sm text-rs-muted">Daily failure bundle count and applied repairs over the last 7 days.</p>
        <div
v-if="trendsLoading"
class="flex h-48 items-center justify-center text-body-sm text-rs-muted"
>
          Loading trends…
        </div>
        <div
          v-else-if="trendsError || !trendsData?.points?.length"
          class="flex h-48 items-center justify-center rounded-lg border border-dashed border-rs-border bg-rs-surface-2/50 text-body-sm text-rs-muted"
        >
          {{ trendsError ? 'Trend data unavailable' : 'No trend data available.' }}
        </div>
        <FailureTrendsChart
v-else
:points="trendsData.points"
/>
      </section>

      <section class="grid gap-6 xl:grid-cols-2">
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">Recent Agent Actions</h2>
          <p class="mb-4 text-body-sm text-rs-muted">Last {{ actions.length }} actions across all agents.</p>
          <AgentActionTimeline :actions="actions" />
        </article>

        <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">Failure Bundles</h2>
          <p class="mb-4 text-body-sm text-rs-muted">Active and recent failure bundles in the repair pipeline.</p>
          <FailureBundleTable :bundles="bundles" />
        </article>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AgentActionEntry, FailureBundleSummary, FailureTrendsResponse, SelfHealingMetrics } from '~/types/agents'
import { getAgentActions, getFailureBundles, getFailureTrends, getSelfHealingMetrics } from '~/lib/opsApi'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Self-Healing Pipeline | Remit-Scout',
  description: 'Agent actions, failure bundles, and repair metrics.',
})

const { formatDateTime } = useAdminFormat()

const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<string | null>(null)
const metrics = ref<SelfHealingMetrics | null>(null)
const actions = ref<AgentActionEntry[]>([])
const bundles = ref<FailureBundleSummary[]>([])
const trendsLoading = ref(false)
const trendsError = ref<string | null>(null)
const trendsData = ref<FailureTrendsResponse | null>(null)

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
    const [metricsRes, actionsRes, bundlesRes] = await Promise.all([
      getSelfHealingMetrics(),
      getAgentActions({ limit: 20 }),
      getFailureBundles({ limit: 25 }),
    ])
    metrics.value = metricsRes
    actions.value = actionsRes.actions
    bundles.value = bundlesRes.bundles
    lastUpdated.value = new Date().toISOString()
  }
  catch (e: any) {
    error.value = e?.message ?? 'Failed to load agent data.'
  }
  finally {
    loading.value = false
  }
  loadTrends()
}

const loadTrends = async () => {
  trendsLoading.value = true
  trendsError.value = null
  try {
    trendsData.value = await getFailureTrends({ days: 7 })
  }
  catch {
    trendsError.value = 'Trend data unavailable'
    trendsData.value = null
  }
  finally {
    trendsLoading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>
