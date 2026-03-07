<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Admin Console"
      subtitle="Launch readiness, operational risk, and control planes in one place."
      :meta="pageMeta"
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
              class="font-semibold tabular-nums text-rs-fg"
            >{{ countdown }}s</span>
          </label>
          <button
            class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            :disabled="loading"
            @click="loadDashboard"
          >
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
      </template>
    </AdminPageShell>

    <section class="grid gap-4 xl:grid-cols-[1.7fr_repeat(3,minmax(0,1fr))]">
      <article class="relative overflow-hidden rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm xl:col-span-2">
        <div
class="absolute inset-x-0 top-0 h-1.5"
:class="launchReadinessStripeClass"
/>
        <div class="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand-100/60 blur-3xl dark:bg-brand-900/20" />

        <div class="relative flex flex-col gap-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="text-caption uppercase tracking-[0.18em] text-rs-muted">Launch Readiness</div>
              <div class="mt-2 flex flex-wrap items-center gap-3">
                <h2 class="text-[2rem] font-semibold leading-none text-rs-fg">{{ launchReadinessLabel }}</h2>
                <span
                  class="inline-flex rounded-full px-3 py-1 text-caption font-semibold uppercase tracking-[0.14em]"
                  :class="launchReadinessBadgeClass"
                >
                  {{ launchReadinessPill }}
                </span>
              </div>
            </div>
            <NuxtLink
              to="/admin/observer"
              class="inline-flex items-center gap-2 rounded-full border border-rs-border bg-rs-bg px-4 py-2 text-body-sm font-semibold text-rs-fg transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              Open Operations Center
              <span aria-hidden="true">→</span>
            </NuxtLink>
          </div>

          <p class="max-w-3xl text-body-sm leading-6 text-rs-muted">
            {{ launchReadinessSummary }}
          </p>

          <div class="grid gap-3 md:grid-cols-3">
            <div class="rounded-2xl border border-rs-border/80 bg-rs-bg/80 p-4">
              <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">Ops Posture</div>
              <div class="mt-2 text-body-lg font-semibold text-rs-fg">{{ opsPostureLabel }}</div>
              <div class="mt-1 text-body-sm text-rs-muted">{{ opsPostureDetail }}</div>
            </div>
            <div class="rounded-2xl border border-rs-border/80 bg-rs-bg/80 p-4">
              <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">Provider Fleet</div>
              <div class="mt-2 text-body-lg font-semibold text-rs-fg">{{ providerFleetHeadline }}</div>
              <div class="mt-1 text-body-sm text-rs-muted">{{ providerFleetDetail }}</div>
            </div>
            <div class="rounded-2xl border border-rs-border/80 bg-rs-bg/80 p-4">
              <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">Data Freshness</div>
              <div class="mt-2 text-body-lg font-semibold text-rs-fg">{{ dataFreshnessHeadline }}</div>
              <div class="mt-1 text-body-sm text-rs-muted">{{ dataFreshnessDetail }}</div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <span
              v-for="reason in readinessReasons"
              :key="reason"
              class="inline-flex rounded-full border border-rs-border bg-rs-bg px-3 py-1.5 text-body-sm text-rs-fg"
            >
              {{ reason }}
            </span>
            <span
              v-if="readinessReasons.length === 0"
              class="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-body-sm text-emerald-700"
            >
              No active launch blockers detected from this page.
            </span>
          </div>
        </div>
      </article>

      <article class="rounded-3xl border border-rs-border bg-rs-surface p-5 shadow-sm">
        <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">Refresh Backlog</div>
        <template v-if="loading && observerSummary === null">
          <SkeletonBlock
width="60%"
height="30"
rounded="md"
class="mt-3"
/>
          <SkeletonBlock
width="75%"
height="16"
rounded="md"
class="mt-3"
/>
        </template>
        <template v-else>
          <div class="mt-3 text-h3 font-semibold text-rs-fg">{{ formatAdminNumber(totalBacklog, 0) }}</div>
          <div
class="mt-2 flex items-center gap-2 text-body-sm"
:class="queuePressureToneClass"
>
            <span
class="inline-flex h-2.5 w-2.5 rounded-full"
:class="queuePressureDotClass"
/>
            {{ queuePressureLabel }}
          </div>
          <div class="mt-3 grid gap-2 text-body-sm text-rs-muted">
            <div class="flex items-center justify-between">
              <span>Quote refresh</span>
              <span class="font-semibold text-rs-fg">{{ formatAdminNumber(kpis.quoteRefreshPending, 0) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>FX refresh</span>
              <span class="font-semibold text-rs-fg">{{ formatAdminNumber(kpis.fxRefreshPending, 0) }}</span>
            </div>
          </div>
        </template>
      </article>

      <article class="rounded-3xl border border-rs-border bg-rs-surface p-5 shadow-sm">
        <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">Customer Activity</div>
        <template v-if="loading && kpis.activeUsers === null">
          <SkeletonBlock
width="55%"
height="30"
rounded="md"
class="mt-3"
/>
          <SkeletonBlock
width="70%"
height="16"
rounded="md"
class="mt-3"
/>
        </template>
        <template v-else>
          <div class="mt-3 text-h3 font-semibold text-rs-fg">{{ formatAdminNumber(kpis.activeUsers, 0) }}</div>
          <div class="mt-2 text-body-sm text-rs-muted">Active users in the last 30 days</div>
          <div class="mt-3 flex items-center justify-between rounded-2xl border border-rs-border bg-rs-bg px-3 py-2">
            <span class="text-body-sm text-rs-muted">Enterprise accounts</span>
            <span class="text-body-sm font-semibold text-rs-fg">{{ formatAdminNumber(kpis.enterpriseCount, 0) }}</span>
          </div>
        </template>
      </article>

      <article class="rounded-3xl border border-rs-border bg-rs-surface p-5 shadow-sm">
        <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">Service Coverage</div>
        <template v-if="loading && serviceHealth === null">
          <SkeletonBlock
width="55%"
height="30"
rounded="md"
class="mt-3"
/>
          <SkeletonBlock
width="75%"
height="16"
rounded="md"
class="mt-3"
/>
        </template>
        <template v-else>
          <div class="mt-3 text-h3 font-semibold text-rs-fg">{{ serviceCoverageHeadline }}</div>
          <div class="mt-2 text-body-sm text-rs-muted">{{ serviceCoverageDetail }}</div>
          <div class="mt-3 grid gap-2 text-body-sm text-rs-muted">
            <div class="flex items-center justify-between">
              <span>Degraded</span>
              <span class="font-semibold text-rs-fg">{{ formatAdminNumber(serviceSummary.degraded, 0) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Offline</span>
              <span class="font-semibold text-rs-fg">{{ formatAdminNumber(serviceSummary.offline, 0) }}</span>
            </div>
          </div>
        </template>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <article class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Attention Required</h2>
            <p class="text-body-sm text-rs-muted">Derived from backlog, service health, providers, and export freshness.</p>
          </div>
          <span class="rounded-full bg-rs-bg px-3 py-1 text-caption uppercase tracking-[0.14em] text-rs-muted">
            {{ attentionItems.length }} item{{ attentionItems.length === 1 ? '' : 's' }}
          </span>
        </div>

        <div class="mt-4 space-y-3">
          <div
            v-for="item in attentionItems"
            :key="item.title"
            class="rounded-2xl border p-4"
            :class="item.className"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-body-sm font-semibold text-rs-fg">{{ item.title }}</div>
                <div class="mt-1 text-body-sm text-rs-muted">{{ item.detail }}</div>
              </div>
              <NuxtLink
                :to="item.to"
                class="inline-flex items-center gap-2 rounded-full border border-current/15 px-3 py-1.5 text-body-sm font-semibold"
              >
                {{ item.cta }}
                <span aria-hidden="true">→</span>
              </NuxtLink>
            </div>
          </div>

          <div
            v-if="attentionItems.length === 0"
            class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-body-sm text-emerald-700"
          >
            No immediate operator action is being flagged from this overview. Re-check Operations Center before promotion.
          </div>
        </div>
      </article>

      <article class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Control Planes</h2>
        <p class="text-body-sm text-rs-muted">Navigate by intent instead of memorizing page names.</p>

        <div class="mt-4 space-y-4">
          <section
            v-for="group in surfaceGroups"
            :key="group.title"
            class="rounded-2xl border border-rs-border bg-rs-bg/80 p-4"
          >
            <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">{{ group.title }}</div>
            <div class="mt-3 grid gap-2">
              <NuxtLink
                v-for="link in group.links"
                :key="link.to"
                :to="link.to"
                class="rounded-xl border border-rs-border bg-rs-surface px-3 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <div class="text-body-sm font-semibold text-rs-fg">{{ link.label }}</div>
                <div class="mt-1 text-body-sm text-rs-muted">{{ link.description }}</div>
              </NuxtLink>
            </div>
          </section>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <article class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Recent Admin Actions</h2>
            <p class="text-body-sm text-rs-muted">Latest entries from <code>/audit/logs?category=admin&limit=5</code>.</p>
          </div>
          <NuxtLink
            to="/admin/audit"
            class="text-body-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Open audit log
          </NuxtLink>
        </div>

        <ul class="mt-4 space-y-3">
          <li
            v-for="event in recentAdminActions"
            :key="event.event_id"
            class="rounded-2xl border border-rs-border bg-rs-bg/70 p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="text-body-sm font-semibold text-rs-fg">{{ event.action || 'admin.action' }}</div>
              <div class="text-body-sm text-rs-muted">{{ formatTimestamp(event.created_at) }}</div>
            </div>
            <div class="mt-2 text-body-sm text-rs-muted">
              {{ event.actor_id || 'unknown actor' }} · {{ event.entity_type || 'entity' }}{{ event.entity_id ? `:${event.entity_id}` : '' }}
            </div>
          </li>
          <li
            v-if="recentAdminActions.length === 0"
            class="rounded-2xl border border-dashed border-rs-border p-4 text-body-sm text-rs-muted"
          >
            No recent admin actions available.
          </li>
        </ul>
      </article>

      <article class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Operational Snapshot</h2>
        <p class="text-body-sm text-rs-muted">What changed most recently across the admin surfaces.</p>

        <div class="mt-4 space-y-3">
          <div class="rounded-2xl border border-rs-border bg-rs-bg/80 p-4">
            <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">Queue posture</div>
            <div class="mt-2 text-body-md font-semibold text-rs-fg">{{ queuePressureLabel }}</div>
            <div class="mt-1 text-body-sm text-rs-muted">{{ queuePressureNarrative }}</div>
          </div>

          <div class="rounded-2xl border border-rs-border bg-rs-bg/80 p-4">
            <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">Provider posture</div>
            <div class="mt-2 text-body-md font-semibold text-rs-fg">{{ providerFleetHeadline }}</div>
            <div class="mt-1 text-body-sm text-rs-muted">{{ providerFleetDetail }}</div>
          </div>

          <div class="rounded-2xl border border-rs-border bg-rs-bg/80 p-4">
            <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">Export posture</div>
            <div class="mt-2 text-body-md font-semibold text-rs-fg">{{ dataFreshnessHeadline }}</div>
            <div class="mt-1 text-body-sm text-rs-muted">{{ dataFreshnessDetail }}</div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ServiceHealthResponse } from '~/lib/opsApi'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'

definePageMeta({ middleware: ['auth', 'super-admin'], layout: 'admin' })

useAdminPage({
  title: 'Admin Console | Remit-Scout',
  description: 'Admin command center for launch readiness, operations, audits, and controls.',
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
    quote_refresh?: Array<{ status: string, count: number }>
    fx_rate_refresh?: Array<{ status: string, count: number }>
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

type ProvidersHealthAggregateResponse = {
  summary?: {
    total_providers?: number
    healthy_providers?: number
    degraded_providers?: number
    providers_with_errors?: number
    total_corridors?: number
    generated_at?: string | null
  }
}

type AttentionItem = {
  title: string
  detail: string
  to: string
  cta: string
  className: string
}

type SurfaceLink = {
  label: string
  description: string
  to: string
}

const { request } = useApi()
const { formatNumber: formatAdminNumber, formatTimestamp } = useAdminFormat()

const loading = ref(false)
const lastUpdatedAt = ref<string | null>(null)
const failures = ref<string[]>([])
const recentAdminActions = ref<NonNullable<AuditLogsResponse['logs']>>([])
const observerSummary = ref<ObserverSummaryResponse | null>(null)
const serviceHealth = ref<ServiceHealthResponse | null>(null)
const providerHealth = ref<ProvidersHealthAggregateResponse['summary'] | null>(null)

const kpis = reactive({
  activeUsers: null as number | null,
  enterpriseCount: null as number | null,
  quoteRefreshPending: null as number | null,
  fxRefreshPending: null as number | null,
  lastGoldExportAt: null as string | null,
})

const autoRefreshEnabled = ref(false)
const countdown = ref(60)
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

const pageMeta = computed(() => {
  const parts = [
    lastUpdatedAt.value ? `Last refresh ${formatTimestamp(lastUpdatedAt.value)}` : 'Waiting for first refresh.',
  ]

  if (failures.value.length > 0) {
    parts.push(`Partial data: ${failures.value.length} source${failures.value.length === 1 ? '' : 's'} failed`)
  }

  return parts.join(' · ')
})

watch(autoRefreshEnabled, (enabled) => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
  if (enabled) {
    countdown.value = 60
    autoRefreshTimer = setInterval(() => {
      countdown.value -= 1
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

const opsPauseTile = computed(() =>
  serviceHealth.value?.services.find(service => service.service_id === 'ops-pause-state') ?? null,
)

const serviceTiles = computed(() =>
  (serviceHealth.value?.services ?? []).filter(service => service.service_id !== 'ops-pause-state'),
)

const serviceSummary = computed(() => {
  const services = serviceTiles.value
  return {
    total: services.length,
    healthy: services.filter(service => service.status === 'healthy').length,
    degraded: services.filter(service => service.status === 'degraded').length,
    offline: services.filter(service => service.status === 'offline').length,
    unknown: services.filter(service => service.status === 'unknown').length,
  }
})

const totalBacklog = computed(() => (kpis.quoteRefreshPending ?? 0) + (kpis.fxRefreshPending ?? 0))

const providerSummary = computed(() => ({
  total: Number(providerHealth.value?.total_providers ?? 0),
  healthy: Number(providerHealth.value?.healthy_providers ?? 0),
  degraded: Number(providerHealth.value?.degraded_providers ?? 0),
  error: Number(providerHealth.value?.providers_with_errors ?? 0),
  corridors: Number(providerHealth.value?.total_corridors ?? 0),
}))

const queuePressureLevel = computed<'blocked' | 'at_risk' | 'healthy'>(() => {
  if (totalBacklog.value >= 500) return 'blocked'
  if (totalBacklog.value >= 50) return 'at_risk'
  return 'healthy'
})

const queuePressureLabel = computed(() => {
  if (queuePressureLevel.value === 'blocked') return 'Backlog needs intervention'
  if (queuePressureLevel.value === 'at_risk') return 'Backlog building'
  return 'Backlog controlled'
})

const queuePressureNarrative = computed(() =>
  `Quote refresh ${formatAdminNumber(kpis.quoteRefreshPending, 0)} and FX refresh ${formatAdminNumber(kpis.fxRefreshPending, 0)} are pending in the observer summary.`,
)

const queuePressureDotClass = computed(() => {
  if (queuePressureLevel.value === 'blocked') return 'bg-red-500'
  if (queuePressureLevel.value === 'at_risk') return 'bg-amber-500'
  return 'bg-emerald-500'
})

const queuePressureToneClass = computed(() => {
  if (queuePressureLevel.value === 'blocked') return 'text-red-600'
  if (queuePressureLevel.value === 'at_risk') return 'text-amber-600'
  return 'text-emerald-600'
})

const isGoldExportStale = computed(() => {
  if (!kpis.lastGoldExportAt) return true
  const ageMs = Date.now() - new Date(kpis.lastGoldExportAt).getTime()
  return ageMs > 48 * 60 * 60 * 1000
})

const dataFreshnessHeadline = computed(() =>
  kpis.lastGoldExportAt ? formatTimestamp(kpis.lastGoldExportAt) : 'No recent export',
)

const dataFreshnessDetail = computed(() => {
  const goldDate = observerSummary.value?.gold?.latest_date
  if (!kpis.lastGoldExportAt) {
    return goldDate
      ? `Gold snapshot date ${goldDate}, but export metadata is missing.`
      : 'No export timestamp is available yet.'
  }
  return isGoldExportStale.value
    ? `Gold export is older than 48 hours.${goldDate ? ` Latest Gold date ${goldDate}.` : ''}`
    : `Export metadata is fresh.${goldDate ? ` Latest Gold date ${goldDate}.` : ''}`
})

const opsPostureLabel = computed(() => {
  if (serviceHealth.value?.unavailable) return 'Needs verification'
  if (opsPauseTile.value?.message?.toLowerCase().includes('paused')) return 'Ops pause active'
  if (serviceSummary.value.offline > 0) return 'Services offline'
  if (serviceSummary.value.degraded > 0) return 'Services degraded'
  return 'Operational'
})

const opsPostureDetail = computed(() => {
  if (serviceHealth.value?.unavailable) {
    return serviceHealth.value?.message || 'Service health is unavailable.'
  }
  return `${formatAdminNumber(serviceSummary.value.healthy, 0)}/${formatAdminNumber(serviceSummary.value.total, 0)} services healthy, ${formatAdminNumber(serviceSummary.value.degraded, 0)} degraded, ${formatAdminNumber(serviceSummary.value.offline, 0)} offline.`
})

const providerFleetHeadline = computed(() => {
  if (providerSummary.value.total === 0) return 'Provider health unavailable'
  return `${formatAdminNumber(providerSummary.value.healthy, 0)}/${formatAdminNumber(providerSummary.value.total, 0)} healthy`
})

const providerFleetDetail = computed(() => {
  if (providerSummary.value.total === 0) return 'Aggregate provider view did not return data.'
  const degradedParts = []
  if (providerSummary.value.degraded > 0) degradedParts.push(`${formatAdminNumber(providerSummary.value.degraded, 0)} degraded`)
  if (providerSummary.value.error > 0) degradedParts.push(`${formatAdminNumber(providerSummary.value.error, 0)} error`)
  return degradedParts.length > 0
    ? `${degradedParts.join(' · ')} across ${formatAdminNumber(providerSummary.value.corridors, 0)} corridors.`
    : `No provider incidents flagged across ${formatAdminNumber(providerSummary.value.corridors, 0)} corridors.`
})

const serviceCoverageHeadline = computed(() => {
  if (serviceHealth.value?.unavailable) return 'Unavailable'
  if (serviceSummary.value.total === 0) return '0 services'
  return `${formatAdminNumber(serviceSummary.value.healthy, 0)}/${formatAdminNumber(serviceSummary.value.total, 0)} healthy`
})

const serviceCoverageDetail = computed(() => {
  if (serviceHealth.value?.unavailable) {
    return serviceHealth.value?.message || 'Service health unavailable.'
  }
  if (opsPauseTile.value?.message?.toLowerCase().includes('paused')) {
    return 'Current service posture reflects an active ops pause state.'
  }
  return 'Counts reflect the AWS-backed service-health route.'
})

const readinessReasons = computed(() => {
  const reasons: string[] = []
  if (failures.value.length > 0) reasons.push(`${failures.value.length} panel source${failures.value.length === 1 ? '' : 's'} failed`)
  if (serviceHealth.value?.unavailable) reasons.push('Service health unavailable')
  if (opsPauseTile.value?.message?.toLowerCase().includes('paused')) reasons.push('Ops pause is active')
  if (serviceSummary.value.offline > 0) reasons.push(`${serviceSummary.value.offline} service${serviceSummary.value.offline === 1 ? '' : 's'} offline`)
  if (providerSummary.value.error > 0) reasons.push(`${providerSummary.value.error} provider${providerSummary.value.error === 1 ? '' : 's'} in error`)
  if (queuePressureLevel.value !== 'healthy') reasons.push(`${formatAdminNumber(totalBacklog.value, 0)} queued refresh requests`)
  if (isGoldExportStale.value) reasons.push('Gold export freshness is stale')
  return reasons
})

const launchReadinessLevel = computed<'blocked' | 'at_risk' | 'healthy'>(() => {
  if (
    serviceHealth.value?.unavailable
    || opsPauseTile.value?.message?.toLowerCase().includes('paused')
    || serviceSummary.value.offline > 0
    || providerSummary.value.error > 0
    || queuePressureLevel.value === 'blocked'
  ) {
    return 'blocked'
  }
  if (
    failures.value.length > 0
    || serviceSummary.value.degraded > 0
    || providerSummary.value.degraded > 0
    || queuePressureLevel.value === 'at_risk'
    || isGoldExportStale.value
  ) {
    return 'at_risk'
  }
  return 'healthy'
})

const launchReadinessLabel = computed(() => {
  if (launchReadinessLevel.value === 'blocked') return 'Launch blocked'
  if (launchReadinessLevel.value === 'at_risk') return 'Launch at risk'
  return 'Launch-ready'
})

const launchReadinessPill = computed(() => {
  if (launchReadinessLevel.value === 'blocked') return 'Critical'
  if (launchReadinessLevel.value === 'at_risk') return 'Watchlist'
  return 'Healthy'
})

const launchReadinessSummary = computed(() => {
  if (launchReadinessLevel.value === 'blocked') {
    return 'This console is seeing blocking operational risk. Use Operations Center to clear pause state, recover service coverage, and drain backlog before treating staging as release-grade.'
  }
  if (launchReadinessLevel.value === 'at_risk') {
    return 'The system is partially healthy but still carrying operational debt. Review degraded services, provider drift, and export freshness before promotion.'
  }
  return 'The visible admin signals are aligned enough for routine operations. Keep Operations Center green and confirm readiness evidence before promotion.'
})

const launchReadinessStripeClass = computed(() => {
  if (launchReadinessLevel.value === 'blocked') return 'bg-gradient-to-r from-red-500 via-red-400 to-amber-400'
  if (launchReadinessLevel.value === 'at_risk') return 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300'
  return 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-sky-400'
})

const launchReadinessBadgeClass = computed(() => {
  if (launchReadinessLevel.value === 'blocked') return 'bg-red-100 text-red-700'
  if (launchReadinessLevel.value === 'at_risk') return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
})

const attentionItems = computed<AttentionItem[]>(() => {
  const items: AttentionItem[] = []

  if (opsPauseTile.value?.message?.toLowerCase().includes('paused')) {
    items.push({
      title: 'Resume staging operations',
      detail: 'Ops pause is active, so queue growth and missing signals are expected until workers and schedules are restored.',
      to: '/admin/observer',
      cta: 'Open Operations Center',
      className: 'border-red-200 bg-red-50 text-red-700',
    })
  }

  if (serviceSummary.value.offline > 0 || serviceSummary.value.degraded > 0) {
    items.push({
      title: 'Recover service coverage',
      detail: `${formatAdminNumber(serviceSummary.value.degraded, 0)} degraded and ${formatAdminNumber(serviceSummary.value.offline, 0)} offline services are reducing confidence in staging health.`,
      to: '/admin/observer',
      cta: 'Inspect services',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    })
  }

  if (providerSummary.value.error > 0 || providerSummary.value.degraded > 0) {
    items.push({
      title: 'Triage provider incidents',
      detail: `${formatAdminNumber(providerSummary.value.error, 0)} providers in error and ${formatAdminNumber(providerSummary.value.degraded, 0)} degraded providers need corridor review.`,
      to: '/admin/observer',
      cta: 'Review providers',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    })
  }

  if (queuePressureLevel.value !== 'healthy') {
    items.push({
      title: 'Drain refresh backlog',
      detail: `${formatAdminNumber(totalBacklog.value, 0)} queued DB fallback refresh requests are building up in the observer summary.`,
      to: '/admin/observer',
      cta: 'Inspect backlog',
      className: queuePressureLevel.value === 'blocked'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-amber-200 bg-amber-50 text-amber-700',
    })
  }

  if (isGoldExportStale.value) {
    items.push({
      title: 'Re-establish gold freshness',
      detail: dataFreshnessDetail.value,
      to: '/admin/gold-exports',
      cta: 'Open gold exports',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    })
  }

  if (serviceHealth.value?.unavailable) {
    items.push({
      title: 'Restore AWS-backed service telemetry',
      detail: serviceHealth.value?.message || 'The service-health route did not return usable AWS state.',
      to: '/admin/observer',
      cta: 'Inspect observer',
      className: 'border-red-200 bg-red-50 text-red-700',
    })
  }

  return items
})

const allAdminLinks: SurfaceLink[] = [
  { label: 'Operations Center', description: 'Queues, provider health, services, and indices in one triage view.', to: '/admin/observer' },
  { label: 'Provider Control Plane', description: 'Discovery approval, apply state, and certification.', to: '/admin/discovery' },
  { label: 'Self-Healing Pipeline', description: 'Agent actions, failure bundles, and repair metrics.', to: '/admin/agents' },
  { label: 'Incident Timeline', description: 'Follow detection-to-resolution history.', to: '/admin/incidents' },
  { label: 'Module Registry', description: 'Signal module health, quarantine status, and cadence.', to: '/admin/modules' },
  { label: 'Data Quality', description: 'Collection error and MTTD/MTTR diagnostics.', to: '/admin/data-quality' },
  { label: 'Corridor Stress', description: 'Triangulation-derived stress and intervention surfaces.', to: '/admin/stress' },
  { label: 'Gold Exports', description: 'Inspect TEER/RCI/RVI snapshots and freshness.', to: '/admin/gold-exports' },
  { label: 'Enterprise Management', description: 'Grant or revoke enterprise access.', to: '/admin/enterprise' },
  { label: 'Audit Log Console', description: 'Security and admin event investigations.', to: '/admin/audit' },
  { label: 'Institutional Clients', description: 'B2B client lifecycle and API key status.', to: '/admin/institutional' },
  { label: 'Feature Flags', description: 'Runtime controls with audience rules.', to: '/admin/feature-flags' },
]

const surfaceGroups = [
  {
    title: 'Operate Now',
    links: allAdminLinks.slice(0, 4),
  },
  {
    title: 'Investigate',
    links: allAdminLinks.slice(4, 8),
  },
  {
    title: 'Govern',
    links: allAdminLinks.slice(8, 12),
  },
] as const

const loadDashboard = async () => {
  if (loading.value) return
  loading.value = true
  failures.value = []

  const [
    plansResult,
    observerResult,
    goldResult,
    auditResult,
    serviceResult,
    providerResult,
  ] = await Promise.allSettled([
    request<PlansResponse>('/admin/plans'),
    request<ObserverSummaryResponse>('/ops/observer/summary', { query: { windowHours: 24, limit: 25 } }),
    request<GoldExportsResponse>('/ops/gold/exports/cdp-daily', { query: { limit: 1, offset: 0 } }),
    request<AuditLogsResponse>('/audit/logs', { query: { category: 'admin', limit: 5, offset: 0 } }),
    request<ServiceHealthResponse>('/ops/services/health'),
    request<ProvidersHealthAggregateResponse>('/ops/providers/health'),
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
    observerSummary.value = observerResult.value
    const quoteQueue = observerResult.value.queues?.quote_refresh ?? []
    const fxQueue = observerResult.value.queues?.fx_rate_refresh ?? []
    const countPending = (rows: Array<{ status: string, count: number }>) =>
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

  if (serviceResult.status === 'fulfilled') {
    serviceHealth.value = serviceResult.value
  }
 else {
    serviceHealth.value = {
      services: [],
      updatedAt: null,
      unavailable: true,
      source: 'none',
      message: 'Service health could not be loaded from the overview page.',
    }
    failures.value.push('services')
  }

  if (providerResult.status === 'fulfilled') {
    providerHealth.value = providerResult.value.summary ?? null
  }
 else {
    providerHealth.value = null
    failures.value.push('providers')
  }

  lastUpdatedAt.value = new Date().toISOString()
  loading.value = false
}

onMounted(() => {
  void loadDashboard()
})
</script>
