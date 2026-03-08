<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Corridor Stress"
      subtitle="Triangulation-derived stress scores across all corridors."
      :loading="loading"
      :error="error"
      :meta="pageMeta"
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-3">
          <label class="text-body-sm inline-flex items-center gap-2 text-rs-muted">
            <input
              v-model="autoRefresh"
              type="checkbox"
              class="h-4 w-4 rounded border-rs-border text-brand-600"
            >
            Auto-refresh
            <span
v-if="autoRefresh"
class="font-semibold tabular-nums text-rs-fg"
>{{ countdown }}s</span>
          </label>
          <button
            class="text-body-sm h-10 rounded-lg bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            :disabled="refreshDisabled"
            @click="load"
          >
            {{ refreshDisabled ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
      </template>
    </AdminPageShell>

    <template v-if="!loading && !error">
      <section
        class="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br p-6 text-white shadow-[0_24px_70px_-34px_rgba(15,23,42,0.9)]"
        :class="heroGradientClass"
      >
        <div
          class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_24%)]"
        />
        <div class="relative grid gap-6 lg:grid-cols-[1.45fr,0.95fr]">
          <div>
            <span
              class="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
              :class="heroBadgeClass"
            >
              {{ heroBadgeLabel }}
            </span>
            <h2 class="mt-4 text-[1.9rem] font-semibold leading-tight">
              {{ heroTitle }}
            </h2>
            <p class="text-body-sm text-white/72 mt-2 max-w-2xl">
              {{ heroBody }}
            </p>

            <div class="mt-5 grid gap-3 sm:grid-cols-3">
              <div class="border-white/12 bg-white/8 rounded-2xl border p-4 backdrop-blur-sm">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  Elevated Share
                </p>
                <p class="text-h3 mt-2 font-semibold tabular-nums">
                  {{ formatPercent(stressInsights.elevatedShare, 0) }}
                </p>
                <p class="text-caption text-white/62 mt-1">
                  {{ stressInsights.elevatedCount }} of
                  {{ stressInsights.totalCorridors }} corridors
                </p>
              </div>
              <div class="border-white/12 bg-white/8 rounded-2xl border p-4 backdrop-blur-sm">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  Critical Corridors
                </p>
                <p class="text-h3 mt-2 font-semibold tabular-nums">
                  {{ stressInsights.criticalCount }}
                </p>
                <p class="text-caption text-white/62 mt-1">
                  {{
                    stressInsights.highestRisk
                      ? `Top risk ${formatCorridorPrimary(stressInsights.highestRisk.corridor_id)}`
                      : 'No critical hotspots'
                  }}
                </p>
              </div>
              <div class="border-white/12 bg-white/8 rounded-2xl border p-4 backdrop-blur-sm">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  Freshness
                </p>
                <p class="text-h3 mt-2 font-semibold tabular-nums">{{ snapshotAgeLabel }}</p>
                <p class="text-caption text-white/62 mt-1">
                  {{ freshnessLabel }} · {{ dominantConfidenceLabel }}
                </p>
              </div>
            </div>
          </div>

          <div class="border-white/12 bg-slate-950/28 rounded-[24px] border p-5 backdrop-blur-sm">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Control State
                </p>
                <h3 class="text-body-lg mt-1 font-semibold">Adaptive probing posture</h3>
              </div>
              <span
                class="text-caption rounded-full border px-3 py-1 font-medium"
                :class="controlToneClass"
              >
                {{ controlToneLabel }}
              </span>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="bg-white/6 rounded-2xl border border-white/10 p-4">
                <p class="text-caption text-white/92 font-semibold">Pause scope</p>
                <p class="text-body-sm text-white/72 mt-1">{{ pauseScopeLabel }}</p>
              </div>
              <div class="bg-white/6 rounded-2xl border border-white/10 p-4">
                <p class="text-caption text-white/92 font-semibold">Kill switch</p>
                <p class="text-body-sm text-white/72 mt-1">{{ killSwitchScopeLabel }}</p>
              </div>
            </div>

            <div
              class="bg-white/6 text-body-sm text-white/72 mt-4 rounded-2xl border border-white/10 p-4"
            >
              {{
                stressInsights.highestRisk
                  ? `Highest-risk corridor ${formatCorridorPrimary(stressInsights.highestRisk.corridor_id)} is ${stressInsights.highestRisk.stress_level} at ${formatStressScore(stressInsights.highestRisk.stress_score)}.`
                  : 'No elevated corridors are currently present in the stress set.'
              }}
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="degradedFeeds.length"
        class="text-body-sm rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-amber-900 shadow-sm"
      >
        <div class="font-semibold">Some corridor-stress feeds are degraded.</div>
        <p class="mt-1 text-amber-800">
          {{ degradedFeeds.join(' ') }}
        </p>
      </section>

      <section class="grid gap-4 md:grid-cols-4">
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
          <p class="text-caption text-rs-muted">Total corridors</p>
          <p class="text-h3 mt-2 font-semibold tabular-nums text-rs-fg">
            {{ stressInsights.totalCorridors }}
          </p>
          <p class="text-caption mt-1 text-rs-muted">{{ stressInsights.calmCount }} normal</p>
        </article>
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
          <p class="text-caption text-rs-muted">Elevated+</p>
          <p class="text-h3 mt-2 font-semibold tabular-nums text-amber-600">
            {{ stressInsights.elevatedCount }}
          </p>
          <p class="text-caption mt-1 text-rs-muted">
            {{ formatPercent(stressInsights.elevatedShare, 0) }} of coverage
          </p>
        </article>
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
          <p class="text-caption text-rs-muted">Critical</p>
          <p class="text-h3 mt-2 font-semibold tabular-nums text-red-600">
            {{ stressInsights.criticalCount }}
          </p>
          <p class="text-caption mt-1 text-rs-muted">
            {{ stressInsights.staleCount }} stale snapshots
          </p>
        </article>
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
          <p class="text-caption text-rs-muted">Snapshot age</p>
          <p class="text-h3 mt-2 font-semibold tabular-nums text-rs-fg">{{ snapshotAgeLabel }}</p>
          <p class="text-caption mt-1 text-rs-muted">
            {{
              controlState?.updatedAt
                ? `Control sync ${formatDateTime(controlState.updatedAt)}`
                : 'Control sync unavailable'
            }}
          </p>
        </article>
      </section>

      <template v-if="showEmptyState">
        <section class="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <article
            class="rounded-[24px] border border-dashed border-rs-border bg-rs-surface p-6 shadow-sm"
          >
            <h2 class="text-body-lg font-semibold text-rs-fg">Stress telemetry is warming up</h2>
            <p class="text-body-sm mt-2 text-rs-muted">
              The API is reachable, but no triangulated corridor stress records are present yet. If
              this environment should be active, inspect the triangulation schedule, queue
              permissions, and Gold export freshness before blaming the UI.
            </p>
            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <div class="bg-rs-surface-2/60 rounded-2xl border border-rs-border p-4">
                <p class="text-caption text-rs-muted">Corridors</p>
                <p class="text-body-lg mt-1 font-semibold text-rs-fg">{{ corridors.length }}</p>
              </div>
              <div class="bg-rs-surface-2/60 rounded-2xl border border-rs-border p-4">
                <p class="text-caption text-rs-muted">Highest risk</p>
                <p class="text-body-lg mt-1 font-semibold text-rs-fg">
                  {{
                    stressInsights.highestRisk
                      ? formatCorridorPrimary(stressInsights.highestRisk.corridor_id)
                      : '—'
                  }}
                </p>
              </div>
              <div class="bg-rs-surface-2/60 rounded-2xl border border-rs-border p-4">
                <p class="text-caption text-rs-muted">Freshness</p>
                <p class="text-body-lg mt-1 font-semibold text-rs-fg">{{ freshnessLabel }}</p>
              </div>
            </div>
          </article>

          <article class="rounded-[24px] border border-rs-border bg-rs-surface p-6 shadow-sm">
            <h2 class="text-body-lg font-semibold text-rs-fg">Control Plane</h2>
            <p class="text-body-sm mt-1 text-rs-muted">
              Manual controls stay available even when stress telemetry is empty.
            </p>
            <div class="mt-4">
              <StressControlPanel
                :control-state="controlState ?? undefined"
                :corridors="stressInsights.corridors"
                :pause-probing-loading="pauseProbingLoading"
                :pause-probing-error="pauseProbingError ?? undefined"
                :override-corridor-id="overrideCorridorId"
                :override-level="overrideLevel"
                :override-duration="overrideDuration"
                :override-loading="overrideLoading"
                :override-error="overrideError ?? undefined"
                :kill-switch-loading="killSwitchLoading"
                :kill-switch-error="killSwitchError ?? undefined"
                :action-message="actionMessage ?? undefined"
                @toggle-pause="togglePauseProbing"
                @apply-override="applyOverride"
                @activate-kill-switch="activateKillSwitch"
                @update:override-corridor-id="updateOverrideCorridorId"
                @update:override-level="updateOverrideLevel"
                @update:override-duration="updateOverrideDuration"
              />
            </div>
          </article>
        </section>
      </template>

      <template v-else>
        <section class="grid gap-6 xl:grid-cols-[1.18fr,0.82fr]">
          <article class="rounded-[24px] border border-rs-border bg-rs-surface p-6 shadow-sm">
            <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-body-lg font-semibold text-rs-fg">Corridor Risk Table</h2>
                <p class="text-body-sm mt-1 text-rs-muted">
                  Ranked by severity, score, and recency. Use filters to isolate hot corridors
                  quickly.
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <input
                  v-model="search"
                  type="text"
                  placeholder="Filter corridors…"
                  class="text-body-sm h-10 rounded-lg border border-rs-border bg-white px-3 focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                <select
                  v-model="levelFilter"
                  class="text-body-sm h-10 rounded-lg border border-rs-border bg-white px-3 focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="all">All levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="elevated">Elevated</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="text-body-sm w-full">
                <thead>
                  <tr class="border-b border-rs-border text-left text-rs-muted">
                    <th class="pb-3 pr-3 font-medium">Corridor</th>
                    <th class="pb-3 pr-3 text-right font-medium">Score</th>
                    <th class="pb-3 pr-3 font-medium">Level</th>
                    <th class="pb-3 pr-3 font-medium">Confidence</th>
                    <th class="pb-3 font-medium">Observed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="corridor in filteredCorridors"
                    :key="corridor.corridor_id"
                    class="border-b border-rs-border/60 align-top"
                  >
                    <td class="py-3 pr-3">
                      <div class="font-medium text-rs-fg">
                        {{ formatCorridorPrimary(corridor.corridor_id) }}
                      </div>
                      <div class="text-caption mt-1 text-rs-muted">
                        {{ formatCorridorSecondary(corridor.corridor_id) }}
                      </div>
                    </td>
                    <td class="py-3 pr-3 text-right tabular-nums text-rs-fg">
                      {{ formatStressScore(corridor.stress_score) }}
                    </td>
                    <td class="py-3 pr-3">
                      <CorridorStressBadge
                        :level="corridor.stress_level"
                        :score="corridor.stress_score"
                        show-normal
                      />
                    </td>
                    <td class="py-3 pr-3">
                      <span
                        class="text-caption rounded-full px-2.5 py-1 font-medium"
                        :class="confidenceClass(corridor.confidence_band)"
                      >
                        {{ formatConfidence(corridor.confidence) }}
                      </span>
                    </td>
                    <td class="py-3 text-rs-muted">
                      <div>{{ formatDateTime(corridor.computed_at ?? corridor.date) }}</div>
                      <div class="text-caption mt-1">{{ formatAge(corridor.age_minutes) }}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p
                v-if="!filteredCorridors.length"
                class="text-body-sm py-6 text-center text-rs-muted"
              >
                {{
                  stressInsights.corridors.length
                    ? 'No corridors match the current filters.'
                    : 'No corridor stress data is available.'
                }}
              </p>
            </div>
          </article>

          <div class="space-y-6">
            <article class="rounded-[24px] border border-rs-border bg-rs-surface p-6 shadow-sm">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h2 class="text-body-lg font-semibold text-rs-fg">Watchlist</h2>
                  <p class="text-body-sm mt-1 text-rs-muted">
                    Highest-priority corridors for operator review.
                  </p>
                </div>
                <span
                  class="bg-rs-surface-2 text-caption rounded-full px-3 py-1 font-medium text-rs-muted"
                >
                  {{ stressInsights.topWatchlist.length }} flagged
                </span>
              </div>

              <div
v-if="stressInsights.topWatchlist.length"
class="mt-4 space-y-3"
>
                <div
                  v-for="corridor in stressInsights.topWatchlist"
                  :key="corridor.corridor_id"
                  class="bg-rs-surface-2/50 rounded-2xl border border-rs-border p-4"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-body-sm font-semibold text-rs-fg">
                        {{ formatCorridorPrimary(corridor.corridor_id) }}
                      </p>
                      <p class="text-caption mt-1 text-rs-muted">
                        {{ formatCorridorSecondary(corridor.corridor_id) }} ·
                        {{ formatConfidence(corridor.confidence) }} confidence · observed
                        {{ formatDateTime(corridor.computed_at ?? corridor.date) }}
                      </p>
                    </div>
                    <CorridorStressBadge
                      :level="corridor.stress_level"
                      :score="corridor.stress_score"
                      compact
                      show-normal
                    />
                  </div>
                  <p class="text-caption mt-3 text-rs-muted">
                    Age {{ formatAge(corridor.age_minutes) }}
                  </p>
                </div>
              </div>
              <div
                v-else
                class="bg-rs-surface-2/40 text-body-sm mt-4 rounded-2xl border border-dashed border-rs-border p-4 text-rs-muted"
              >
                No elevated corridors are currently queued for operator review.
              </div>
            </article>

            <article class="rounded-[24px] border border-rs-border bg-rs-surface p-6 shadow-sm">
              <h2 class="text-body-lg font-semibold text-rs-fg">Control Plane</h2>
              <p class="text-body-sm mt-1 text-rs-muted">
                Live controls for adaptive probing, manual overrides, and emergency stop.
              </p>
              <div class="mt-4">
                <StressControlPanel
                  :control-state="controlState ?? undefined"
                  :corridors="stressInsights.corridors"
                  :pause-probing-loading="pauseProbingLoading"
                  :pause-probing-error="pauseProbingError ?? undefined"
                  :override-corridor-id="overrideCorridorId"
                  :override-level="overrideLevel"
                  :override-duration="overrideDuration"
                  :override-loading="overrideLoading"
                  :override-error="overrideError ?? undefined"
                  :kill-switch-loading="killSwitchLoading"
                  :kill-switch-error="killSwitchError ?? undefined"
                  :action-message="actionMessage ?? undefined"
                  @toggle-pause="togglePauseProbing"
                  @apply-override="applyOverride"
                  @activate-kill-switch="activateKillSwitch"
                  @update:override-corridor-id="updateOverrideCorridorId"
                  @update:override-level="updateOverrideLevel"
                  @update:override-duration="updateOverrideDuration"
                />
              </div>
            </article>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, type PropType } from 'vue'
import type { CorridorStressEntry, StressControlState, StressSummary } from '~/types/stress'
import {
  getCorridorStressOverview,
  getStressControlState,
  pauseAdaptiveProbing,
  applyStressOverride,
  activateStressKillSwitch,
} from '~/lib/opsApi'
import { getAdminApiErrorMessage } from '~/utils/adminApiErrors'
import { buildCorridorStressInsights, type CorridorStressInsight } from '~/utils/adminInsights'
import {
  buildCorridorSearchText,
  formatCorridorCountryCodePair,
  formatCorridorCountryPair,
} from '~/utils/corridorLabels'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Corridor Stress | Remit-Scout',
  description: 'Triangulation-derived stress scores across all corridors.',
})

type FeedKey = 'overview' | 'controls'

const { formatDateTime, formatDuration, formatPercent } = useAdminFormat()

const loading = ref(true)
const refreshing = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<string | null>(null)
const corridors = ref<CorridorStressEntry[]>([])
const summary = ref<StressSummary | null>(null)
const controlState = ref<StressControlState | null>(null)
const feedErrors = ref<Partial<Record<FeedKey, string>>>({})

const search = ref('')
const levelFilter = ref<'all' | 'normal' | 'elevated' | 'high' | 'critical'>('all')
const autoRefresh = ref(false)
const countdown = ref(60)
let timer: ReturnType<typeof setInterval> | null = null

const pauseProbingLoading = ref(false)
const pauseProbingError = ref<string | null>(null)
const overrideCorridorId = ref('')
const overrideLevel = ref<'normal' | 'elevated' | 'high' | 'critical'>('normal')
const overrideDuration = ref(4)
const overrideLoading = ref(false)
const overrideError = ref<string | null>(null)
const killSwitchLoading = ref(false)
const killSwitchError = ref<string | null>(null)
const actionMessage = ref<string | null>(null)

const updateOverrideCorridorId = (value: string) => {
  overrideCorridorId.value = value
}

const updateOverrideLevel = (value: 'normal' | 'elevated' | 'high' | 'critical') => {
  overrideLevel.value = value
}

const updateOverrideDuration = (value: number) => {
  overrideDuration.value = value
}

const stressInsights = computed(() =>
  buildCorridorStressInsights(corridors.value, summary.value, lastUpdated.value),
)

const feedLabels: Record<FeedKey, string> = {
  overview: 'Stress overview',
  controls: 'Control state',
}

const degradedFeeds = computed(() =>
  Object.entries(feedErrors.value).map(
    ([key, message]) => `${feedLabels[key as FeedKey]}: ${message}`,
  ),
)

const pageMeta = computed(() => {
  const parts: string[] = []
  if (lastUpdated.value) parts.push(`Last updated: ${formatDateTime(lastUpdated.value)}`)
  if (degradedFeeds.value.length)
    parts.push(
      `${degradedFeeds.value.length} degraded feed${degradedFeeds.value.length === 1 ? '' : 's'}`,
    )
  return parts.join(' · ') || null
})

const refreshDisabled = computed(() => loading.value || refreshing.value)
const showEmptyState = computed(
  () => stressInsights.value.telemetryState !== 'live' && stressInsights.value.totalCorridors === 0,
)

const filteredCorridors = computed(() => {
  const query = search.value.trim().toLowerCase()
  return stressInsights.value.corridors.filter((corridor) => {
    if (levelFilter.value !== 'all' && corridor.stress_level !== levelFilter.value) return false
    if (!query) return true
    return (
      buildCorridorSearchText(corridor.corridor_id).includes(query)
      || formatCorridorPrimary(corridor.corridor_id).toLowerCase().includes(query)
      || formatCorridorSecondary(corridor.corridor_id).toLowerCase().includes(query)
      || String(corridor.confidence || '')
        .toLowerCase()
        .includes(query)
        || corridor.stress_level.toLowerCase().includes(query)
    )
  })
})

const heroTone = computed<'stable' | 'watch' | 'critical'>(() => {
  if (
    controlState.value?.kill_switch_active
    || stressInsights.value.criticalCount > 0
    || stressInsights.value.freshnessState === 'stale'
  ) {
    return 'critical'
  }
  if (
    controlState.value?.pause_active
    || stressInsights.value.elevatedCount > 0
    || stressInsights.value.freshnessState === 'delayed'
  ) {
    return 'watch'
  }
  return 'stable'
})

const heroBadgeLabel = computed(() => {
  if (stressInsights.value.telemetryState === 'empty') return 'No Telemetry'
  if (stressInsights.value.telemetryState === 'warming') return 'Warming'
  if (heroTone.value === 'critical') return 'Critical Exposure'
  if (heroTone.value === 'watch') return 'Under Watch'
  return 'Stable'
})

const heroTitle = computed(() => {
  if (stressInsights.value.telemetryState === 'empty')
    return 'Corridor-stress telemetry has not landed yet.'
  if (stressInsights.value.telemetryState === 'warming')
    return 'Stress controls are live, but triangulated corridor data is still warming up.'
  if (controlState.value?.kill_switch_active)
    return 'Emergency kill switch is active across the stress response plane.'
  if (heroTone.value === 'critical')
    return 'The corridor network is showing elevated pressure and needs active supervision.'
  if (heroTone.value === 'watch')
    return 'Stress scoring is active and the network is carrying measurable heat.'
  return 'Corridor-stress telemetry is fresh and the network is currently calm.'
})

const heroBody = computed(() => {
  if (stressInsights.value.telemetryState !== 'live') {
    return 'This surface now distinguishes an empty/stale triangulation pipeline from a frontend fetch problem, and it exposes the backend control state so operators can see whether adaptive probing is paused or disabled.'
  }
  return `${stressInsights.value.elevatedCount} corridors are elevated or worse, ${stressInsights.value.criticalCount} are critical, and the freshest snapshot is ${snapshotAgeLabel.value.toLowerCase()}.`
})

const heroGradientClass = computed(() => {
  if (heroTone.value === 'critical') return 'from-red-950 via-slate-950 to-amber-950'
  if (heroTone.value === 'watch') return 'from-amber-950 via-slate-950 to-emerald-950'
  return 'from-emerald-950 via-slate-950 to-cyan-950'
})

const heroBadgeClass = computed(() => {
  if (heroTone.value === 'critical') return 'border-red-300/25 bg-red-400/12 text-red-100'
  if (heroTone.value === 'watch') return 'border-amber-300/25 bg-amber-400/12 text-amber-100'
  return 'border-emerald-300/25 bg-emerald-400/12 text-emerald-100'
})

const snapshotAgeLabel = computed(() => {
  if (stressInsights.value.snapshotAgeMinutes === null) return 'Unknown'
  if (stressInsights.value.snapshotAgeMinutes < 1) return 'Live now'
  return formatDuration(stressInsights.value.snapshotAgeMinutes * 60)
})

const freshnessLabel = computed(() => {
  if (stressInsights.value.freshnessState === 'fresh') return 'Fresh snapshot'
  if (stressInsights.value.freshnessState === 'delayed') return 'Delayed snapshot'
  if (stressInsights.value.freshnessState === 'stale') return 'Stale snapshot'
  return 'Freshness unknown'
})

const dominantConfidenceLabel = computed(() => {
  const dominant = Object.entries(stressInsights.value.confidenceCounts).sort(
    (left, right) => Number(right[1]) - Number(left[1]),
  )[0]
  if (!dominant || Number(dominant[1]) === 0) return 'no confidence telemetry'
  return `${dominant[0]} confidence dominates`
})

const controlToneLabel = computed(() => {
  if (controlState.value?.unavailable) return 'Control status unavailable'
  if (controlState.value?.kill_switch_active) return 'Kill switch active'
  if (controlState.value?.pause_active) return 'Adaptive probing paused'
  return 'Controls live'
})

const controlToneClass = computed(() => {
  if (controlState.value?.kill_switch_active) return 'border-red-300/25 bg-red-400/12 text-red-100'
  if (controlState.value?.pause_active) return 'border-amber-300/25 bg-amber-400/12 text-amber-100'
  return 'border-emerald-300/25 bg-emerald-400/12 text-emerald-100'
})

const pauseScopeLabel = computed(() => {
  if (!controlState.value) return 'Unknown'
  if (controlState.value.unavailable) return 'State endpoint unavailable'
  if (controlState.value.adaptive_probing_paused_modules === 0) return 'No modules paused'
  if (controlState.value.adaptive_probing_paused_modules === controlState.value.total_modules)
    return 'All modules paused'
  return `${controlState.value.adaptive_probing_paused_modules}/${controlState.value.total_modules} modules paused`
})

const killSwitchScopeLabel = computed(() => {
  if (!controlState.value) return 'Unknown'
  if (controlState.value.unavailable) return 'State endpoint unavailable'
  if (controlState.value.stress_probing_disabled_modules === 0) return 'Kill switch is off'
  if (controlState.value.stress_probing_disabled_modules === controlState.value.total_modules)
    return 'Kill switch active on all modules'
  return `${controlState.value.stress_probing_disabled_modules}/${controlState.value.total_modules} modules disabled`
})

watch(autoRefresh, (enabled) => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (enabled) {
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value -= 1
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

const formatStressScore = (value: number | null | undefined): string =>
  value == null ? '—' : value.toFixed(2)

const formatConfidence = (confidence: string | null | undefined): string => {
  const normalized = String(confidence || '').trim()
  if (!normalized) return 'Unknown'
  return normalized.replace(/_/g, ' ')
}

const confidenceClass = (band: CorridorStressInsight['confidence_band']) => {
  if (band === 'manual') return 'bg-blue-100 text-blue-700'
  if (band === 'high') return 'bg-emerald-100 text-emerald-700'
  if (band === 'medium') return 'bg-amber-100 text-amber-700'
  if (band === 'low') return 'bg-orange-100 text-orange-700'
  return 'bg-neutral-100 text-neutral-600'
}

const formatAge = (minutes: number | null | undefined): string => {
  if (minutes == null) return 'Age unknown'
  if (minutes < 1) return 'Updated just now'
  return `${formatDuration(minutes * 60)} ago`
}

const formatCorridorPrimary = (corridorId: string): string => {
  return formatCorridorCountryPair(corridorId, ' -> ')
}

const formatCorridorSecondary = (corridorId: string): string => {
  return formatCorridorCountryCodePair(corridorId, ' -> ')
}

const load = async () => {
  if (refreshDisabled.value) return

  const hasVisibleData = corridors.value.length > 0 || Boolean(controlState.value)

  if (loading.value && !hasVisibleData) {
    error.value = null
  }
 else {
    refreshing.value = true
  }

  const nextFeedErrors: Partial<Record<FeedKey, string>> = {}
  const [overviewRes, controlsRes] = await Promise.allSettled([
    getCorridorStressOverview(),
    getStressControlState(),
  ])

  let fulfilled = 0

  if (overviewRes.status === 'fulfilled') {
    corridors.value = overviewRes.value.corridors
    summary.value = overviewRes.value.summary
    lastUpdated.value = overviewRes.value.updatedAt ?? new Date().toISOString()
    fulfilled += 1
  }
 else {
    nextFeedErrors.overview = getAdminApiErrorMessage(
      overviewRes.reason,
      'Stress overview is temporarily unavailable.',
    )
  }

  if (controlsRes.status === 'fulfilled') {
    controlState.value = controlsRes.value
    fulfilled += 1
  }
 else {
    nextFeedErrors.controls = getAdminApiErrorMessage(
      controlsRes.reason,
      'Control-state telemetry is temporarily unavailable.',
    )
  }

  feedErrors.value = nextFeedErrors

  if (fulfilled > 0) {
    error.value = null
  }
 else if (!hasVisibleData) {
    error.value = 'Failed to load corridor stress.'
  }

  loading.value = false
  refreshing.value = false
}

const togglePauseProbing = async () => {
  if (pauseProbingLoading.value) return
  pauseProbingLoading.value = true
  pauseProbingError.value = null
  actionMessage.value = null
  try {
    const nextPaused = !controlState.value?.pause_active
    await pauseAdaptiveProbing(nextPaused)
    actionMessage.value = nextPaused
      ? 'Adaptive probing has been paused.'
      : 'Adaptive probing has resumed.'
    await load()
  }
 catch (e: unknown) {
    pauseProbingError.value = getAdminApiErrorMessage(e, 'Failed to update pause state.')
  }
 finally {
    pauseProbingLoading.value = false
  }
}

const applyOverride = async () => {
  if (overrideLoading.value || !overrideCorridorId.value) return
  overrideLoading.value = true
  overrideError.value = null
  actionMessage.value = null
  try {
    await applyStressOverride(overrideCorridorId.value, overrideLevel.value, overrideDuration.value)
    actionMessage.value
      = `Override applied to ${formatCorridorPrimary(overrideCorridorId.value)} for ${overrideDuration.value}h.`
    await load()
  }
 catch (e: unknown) {
    overrideError.value = getAdminApiErrorMessage(e, 'Failed to apply override.')
  }
 finally {
    overrideLoading.value = false
  }
}

const activateKillSwitch = async () => {
  if (killSwitchLoading.value) return
  killSwitchLoading.value = true
  killSwitchError.value = null
  actionMessage.value = null
  try {
    await activateStressKillSwitch()
    actionMessage.value = 'Kill switch activated. Stress-driven probing has been disabled.'
    await load()
  }
 catch (e: unknown) {
    killSwitchError.value = getAdminApiErrorMessage(e, 'Failed to activate kill switch.')
  }
 finally {
    killSwitchLoading.value = false
  }
}

const StressControlPanel = defineComponent({
  name: 'StressControlPanel',
  props: {
    controlState: {
      type: Object as PropType<StressControlState | null>,
      required: false,
      default: null,
    },
    corridors: {
      type: Array as PropType<CorridorStressInsight[]>,
      required: true,
    },
    pauseProbingLoading: {
      type: Boolean,
      required: true,
    },
    pauseProbingError: {
      type: String,
      required: false,
      default: null,
    },
    overrideCorridorId: {
      type: String,
      required: true,
    },
    overrideLevel: {
      type: String as PropType<'normal' | 'elevated' | 'high' | 'critical'>,
      required: true,
    },
    overrideDuration: {
      type: Number,
      required: true,
    },
    overrideLoading: {
      type: Boolean,
      required: true,
    },
    overrideError: {
      type: String,
      required: false,
      default: null,
    },
    killSwitchLoading: {
      type: Boolean,
      required: true,
    },
    killSwitchError: {
      type: String,
      required: false,
      default: null,
    },
    actionMessage: {
      type: String,
      required: false,
      default: null,
    },
  },
  emits: [
    'toggle-pause',
    'apply-override',
    'activate-kill-switch',
    'update:override-corridor-id',
    'update:override-level',
    'update:override-duration',
  ],
  setup(props, { emit }) {
    const corridorOptions = computed(() =>
      props.corridors.map(corridor => ({
        value: corridor.corridor_id,
        label: formatCorridorCountryPair(corridor.corridor_id, ' -> '),
      })),
    )

    return () =>
      h('div', { class: 'space-y-5' }, [
        props.controlState?.kill_switch_active
          ? h(
              'div',
              {
                class: 'rounded-2xl border border-red-200 bg-red-50 p-4 text-body-sm text-red-700',
              },
              'Kill switch is active. Stress-driven probing is disabled across the response plane.',
            )
          : null,
        props.actionMessage
          ? h(
              'div',
              {
                class:
                  'rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-body-sm text-emerald-700',
              },
              props.actionMessage,
            )
          : null,
        h('div', { class: 'rounded-2xl border border-rs-border bg-rs-surface-2/50 p-4' }, [
          h('div', { class: 'flex items-center justify-between gap-3' }, [
            h('div', [
              h('p', { class: 'text-body-sm font-semibold text-rs-fg' }, 'Pause adaptive probing'),
              h(
                'p',
                { class: 'mt-1 text-caption text-rs-muted' },
                'Temporarily suspend stress-driven probing decisions while keeping telemetry visible.',
              ),
            ]),
            h(
              'button',
              {
                type: 'button',
                class: [
                  'h-10 rounded-lg px-4 text-body-sm font-semibold transition-colors',
                  props.controlState?.pause_active
                    ? 'border border-amber-600 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'bg-amber-600 text-white hover:bg-amber-700',
                ],
                disabled: props.pauseProbingLoading || props.controlState?.kill_switch_active,
                onClick: () => emit('toggle-pause'),
              },
              props.pauseProbingLoading
                ? 'Updating…'
                : props.controlState?.pause_active
                  ? 'Resume'
                  : 'Pause',
            ),
          ]),
          props.pauseProbingError
            ? h('p', { class: 'mt-2 text-caption text-red-600' }, props.pauseProbingError)
            : null,
        ]),
        h('div', { class: 'rounded-2xl border border-rs-border bg-rs-surface-2/50 p-4' }, [
          h('p', { class: 'text-body-sm font-semibold text-rs-fg' }, 'Manual override'),
          h(
            'p',
            { class: 'mt-1 text-caption text-rs-muted' },
            'Set a corridor stress level explicitly for a bounded duration.',
          ),
          h('div', { class: 'mt-3 grid gap-3 sm:grid-cols-2' }, [
            h('label', { class: 'text-body-sm text-rs-muted' }, [
              h('span', 'Corridor'),
              h(
                'select',
                {
                  class:
                    'mt-1 w-full rounded-lg border border-rs-border bg-white px-3 py-2 text-body-sm',
                  value: props.overrideCorridorId,
                  onChange: (event: Event) =>
                    emit('update:override-corridor-id', (event.target as HTMLSelectElement).value),
                },
                [
                  h('option', { value: '' }, 'Select corridor'),
                  ...corridorOptions.value.map(corridor =>
                    h('option', { value: corridor.value }, corridor.label),
                  ),
                ],
              ),
            ]),
            h('label', { class: 'text-body-sm text-rs-muted' }, [
              h('span', 'Override level'),
              h(
                'select',
                {
                  class:
                    'mt-1 w-full rounded-lg border border-rs-border bg-white px-3 py-2 text-body-sm',
                  value: props.overrideLevel,
                  onChange: (event: Event) =>
                    emit('update:override-level', (event.target as HTMLSelectElement).value),
                },
                [
                  h('option', { value: 'normal' }, 'normal'),
                  h('option', { value: 'elevated' }, 'elevated'),
                  h('option', { value: 'high' }, 'high'),
                  h('option', { value: 'critical' }, 'critical'),
                ],
              ),
            ]),
            h('label', { class: 'text-body-sm text-rs-muted' }, [
              h('span', 'Duration'),
              h(
                'select',
                {
                  class:
                    'mt-1 w-full rounded-lg border border-rs-border bg-white px-3 py-2 text-body-sm',
                  value: String(props.overrideDuration),
                  onChange: (event: Event) =>
                    emit(
                      'update:override-duration',
                      Number((event.target as HTMLSelectElement).value),
                    ),
                },
                [
                  h('option', { value: '1' }, '1h'),
                  h('option', { value: '4' }, '4h'),
                  h('option', { value: '12' }, '12h'),
                  h('option', { value: '24' }, '24h'),
                ],
              ),
            ]),
            h('div', { class: 'flex items-end' }, [
              h(
                'button',
                {
                  type: 'button',
                  class:
                    'h-10 w-full rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60',
                  disabled: props.overrideLoading || !props.overrideCorridorId,
                  onClick: () => emit('apply-override'),
                },
                props.overrideLoading ? 'Applying…' : 'Apply Override',
              ),
            ]),
          ]),
          props.overrideError
            ? h('p', { class: 'mt-2 text-caption text-red-600' }, props.overrideError)
            : null,
        ]),
        h('div', { class: 'rounded-2xl border border-red-200 bg-red-50/70 p-4' }, [
          h('div', { class: 'flex items-center justify-between gap-3' }, [
            h('div', [
              h('p', { class: 'text-body-sm font-semibold text-red-700' }, 'Emergency kill switch'),
              h(
                'p',
                { class: 'mt-1 text-caption text-red-700/80' },
                'Disable all stress-driven adaptive probing. Use only when automation is making the wrong call.',
              ),
            ]),
            h(
              'button',
              {
                type: 'button',
                class:
                  'h-10 rounded-lg border-2 border-red-600 bg-red-600 px-4 text-body-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60',
                disabled: props.killSwitchLoading || props.controlState?.kill_switch_active,
                onClick: () => emit('activate-kill-switch'),
              },
              props.controlState?.kill_switch_active
                ? 'Kill Switch Active'
                : props.killSwitchLoading
                  ? 'Activating…'
                  : 'Activate Kill Switch',
            ),
          ]),
          props.killSwitchError
            ? h('p', { class: 'mt-2 text-caption text-red-600' }, props.killSwitchError)
            : null,
        ]),
      ])
  },
})

onMounted(() => {
  void load()
})
</script>
