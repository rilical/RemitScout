<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Data Quality"
      subtitle="Module observation metrics - freshness, failure pressure, repair timing, and corridor coverage."
      :loading="loading"
      :error="error"
      :meta="lastUpdated ? `Last updated: ${formatDateTime(lastUpdated)}` : undefined"
    >
      <template #actions>
        <span
          class="inline-flex items-center rounded-full px-3 py-1 text-body-sm font-semibold"
          :class="telemetryTone"
        >
          {{ telemetryLabel }}
        </span>
        <button
          class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          :disabled="loading"
          @click="load"
        >
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </template>
    </AdminPageShell>

    <template v-if="!loading && !error">
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="card in summaryCards"
          :key="card.label"
          class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm"
        >
          <p class="text-caption font-semibold uppercase tracking-wide text-rs-muted">{{ card.label }}</p>
          <p class="mt-3 text-h4 font-semibold text-rs-fg">{{ card.value }}</p>
          <p class="mt-2 text-body-sm text-rs-muted">{{ card.detail }}</p>
        </article>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.7fr,1fr]">
        <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 class="text-body-lg font-semibold text-rs-fg">Module Quality Overview</h2>
              <p class="mt-1 text-body-sm text-rs-muted">
                {{ telemetryMessage }}
              </p>
            </div>
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-body-sm font-semibold"
              :class="telemetryTone"
            >
              {{ telemetryLabel }}
            </span>
          </div>
          <div class="mt-5">
            <DataQualityHeatmap :rows="qualityInsights.modules" />
          </div>
        </section>

        <aside class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-body-lg font-semibold text-rs-fg">Action Queue</h2>
              <p class="mt-1 text-body-sm text-rs-muted">
                Modules that should get operator attention first.
              </p>
            </div>
            <div class="rounded-xl bg-rs-bg px-3 py-2 text-right">
              <div class="text-caption uppercase tracking-wide text-rs-muted">At risk</div>
              <div class="text-body-lg font-semibold text-rs-fg">
                {{ formatNumber(qualityInsights.watchModules + qualityInsights.criticalModules) }}
              </div>
            </div>
          </div>

          <ul
            v-if="actionRequiredModules.length"
            class="mt-5 space-y-3"
          >
            <li
              v-for="module in actionRequiredModules"
              :key="module.module_id"
              class="rounded-xl border border-rs-border bg-rs-bg/60 p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="truncate text-body-sm font-semibold text-rs-fg">{{ module.display_name }}</h3>
                    <span
                      class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                      :class="moduleStatusTone(module.status)"
                    >
                      {{ moduleStatusLabel(module.status) }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-rs-muted">
                    {{ module.last_observed_at ? `Last seen ${formatDateTime(module.last_observed_at)}` : 'No fresh observations in the last 24 hours.' }}
                  </p>
                </div>
                <div class="text-right text-xs text-rs-muted">
                  <div>{{ formatPercent(module.parse_error_rate, 1) }} error rate</div>
                  <div>{{ formatNumber(module.consecutive_failures) }} consecutive failures</div>
                </div>
              </div>
              <div class="mt-3 flex flex-wrap gap-2 text-xs text-rs-muted">
                <span class="rounded-full bg-rs-surface px-2.5 py-1">
                  {{ formatNumber(module.total_observations) }} obs
                </span>
                <span class="rounded-full bg-rs-surface px-2.5 py-1">
                  {{ formatNumber(module.failure_count) }} failures
                </span>
                <span class="rounded-full bg-rs-surface px-2.5 py-1">
                  {{ formatNumber(module.corridor_count) }} corridor checks
                </span>
                <span class="rounded-full bg-rs-surface px-2.5 py-1">
                  {{ module.cycle_minutes ? `Cycle ${formatMinutes(module.cycle_minutes)}` : 'No completed repair cycle yet' }}
                </span>
              </div>
            </li>
          </ul>

          <div
            v-else
            class="mt-5 rounded-xl border border-dashed border-rs-border px-4 py-8 text-center text-body-sm text-rs-muted"
          >
            No modules currently breach watch thresholds. This panel will pull the noisiest modules to the top as soon as failure pressure rises.
          </div>
        </aside>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-body-lg font-semibold text-rs-fg">MTTD / MTTR by Module</h2>
              <p class="mt-1 text-body-sm text-rs-muted">
                Detection lag versus repair lag over the last 7 days.
              </p>
            </div>
            <div class="text-right text-body-sm text-rs-muted">
              {{ resolvedCycleCount }} modules with completed cycles
            </div>
          </div>
          <div class="mt-5 overflow-x-auto">
            <table class="w-full min-w-[760px] text-body-sm">
              <thead>
                <tr class="border-b border-rs-border text-left text-rs-muted">
                  <th class="pb-2 pr-3 font-medium">Module</th>
                  <th class="pb-2 px-3 text-right font-medium">Detection</th>
                  <th class="pb-2 px-3 text-right font-medium">Repair</th>
                  <th class="pb-2 px-3 text-right font-medium">Total</th>
                  <th class="pb-2 px-3 font-medium">Bottleneck</th>
                  <th class="pb-2 pl-3 font-medium">Period</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in responseRows"
                  :key="row.module_id"
                  class="border-b border-rs-border/50"
                >
                  <td class="py-3 pr-3 font-medium text-rs-fg">{{ row.display_name }}</td>
                  <td class="px-3 py-3 text-right tabular-nums text-rs-fg">{{ formatMinutes(row.mttd_minutes) }}</td>
                  <td class="px-3 py-3 text-right tabular-nums text-rs-fg">{{ formatMinutes(row.mttr_minutes) }}</td>
                  <td class="px-3 py-3 text-right tabular-nums text-rs-fg">{{ formatMinutes(totalCycleMinutes(row)) }}</td>
                  <td class="px-3 py-3">
                    <span
                      class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                      :class="bottleneckTone(row)"
                    >
                      {{ bottleneckLabel(row) }}
                    </span>
                  </td>
                  <td class="py-3 pl-3 text-rs-muted">{{ row.period }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
          <h2 class="text-body-lg font-semibold text-rs-fg">Cycle Narrative</h2>
          <p class="mt-1 text-body-sm text-rs-muted">
            A compact readout of where detection or repair is slowing the loop.
          </p>

          <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div class="rounded-xl border border-rs-border bg-rs-bg/60 p-4">
              <div class="text-caption uppercase tracking-wide text-rs-muted">Average cycle</div>
              <div class="mt-2 text-h4 font-semibold text-rs-fg">{{ averageCycleTimeDisplay }}</div>
              <div class="mt-2 text-body-sm text-rs-muted">
                {{ resolvedCycleCount ? `${resolvedCycleCount} modules produced a complete incident cycle in the last 7 days.` : 'No completed incident cycles yet.' }}
              </div>
            </div>

            <div class="rounded-xl border border-rs-border bg-rs-bg/60 p-4">
              <div class="text-caption uppercase tracking-wide text-rs-muted">Primary bottleneck</div>
              <div class="mt-2 text-body-lg font-semibold text-rs-fg">{{ primaryBottleneck.title }}</div>
              <div class="mt-2 text-body-sm text-rs-muted">{{ primaryBottleneck.detail }}</div>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <span
              v-for="bucket in cycleTimeBuckets"
              :key="bucket.label"
              class="inline-flex items-center rounded-full px-3 py-1 text-body-sm font-medium"
              :class="bucket.badgeClass"
            >
              {{ bucket.label }}: {{ bucket.count }}
            </span>
          </div>

          <div class="mt-5 space-y-3">
            <div class="rounded-xl border border-rs-border bg-rs-bg/60 p-4">
              <div class="text-caption uppercase tracking-wide text-rs-muted">Slowest module</div>
              <div class="mt-2 text-body-lg font-semibold text-rs-fg">
                {{ qualityInsights.slowestCycleModule?.display_name ?? 'No cycle leader yet' }}
              </div>
              <div class="mt-2 text-body-sm text-rs-muted">
                {{ qualityInsights.slowestCycleModule?.cycle_minutes ? `Current slowest full cycle is ${formatMinutes(qualityInsights.slowestCycleModule.cycle_minutes)}.` : 'This will populate once a repair cycle completes.' }}
              </div>
            </div>

            <div class="rounded-xl border border-rs-border bg-rs-bg/60 p-4">
              <div class="text-caption uppercase tracking-wide text-rs-muted">Telemetry note</div>
              <div class="mt-2 text-body-sm text-rs-muted">{{ telemetryMessage }}</div>
            </div>
          </div>
        </aside>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { MttdMttrEntry, TotalCollectionErrorRow } from '~/types/data-quality'
import { getTotalCollectionError, getMttdMttr } from '~/lib/opsApi'
import {
  buildDataQualityInsights,
  type DataQualityModuleInsight,
  type DataQualityModuleStatus,
} from '~/utils/adminInsights'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Data Quality | Remit-Scout',
  description: 'Module quality operations view for observations, failures, and repair timing.',
})

const { formatDateTime, formatNumber, formatPercent } = useAdminFormat()

const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<string | null>(null)
const tceRows = ref<TotalCollectionErrorRow[]>([])
const mttdRows = ref<MttdMttrEntry[]>([])

const qualityInsights = computed(() => buildDataQualityInsights(tceRows.value, mttdRows.value))

const telemetryLabel = computed(() => {
  switch (qualityInsights.value.telemetryState) {
    case 'live':
      return 'Telemetry live'
    case 'partial':
      return 'Partial coverage'
    case 'warming':
      return 'Warming up'
    default:
      return 'Awaiting seed data'
  }
})

const telemetryTone = computed(() => {
  switch (qualityInsights.value.telemetryState) {
    case 'live':
      return 'bg-emerald-100 text-emerald-700'
    case 'partial':
      return 'bg-amber-100 text-amber-700'
    case 'warming':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
})

const telemetryMessage = computed(() => {
  if (qualityInsights.value.telemetryState === 'empty') {
    return 'The module registry is empty. Seed the module catalog before using this view.'
  }
  if (qualityInsights.value.telemetryState === 'warming') {
    return 'The module catalog is seeded, but no fresh observations landed in the last 24 hours yet.'
  }
  if (qualityInsights.value.telemetryState === 'partial') {
    return `${formatNumber(qualityInsights.value.activeModules)} of ${formatNumber(qualityInsights.value.totalModules)} modules have fresh observations. The rest are quiet or still warming up.`
  }
  return `${formatNumber(qualityInsights.value.activeModules)} modules are producing fresh observations across ${formatNumber(qualityInsights.value.totalCoverageChecks)} corridor checks.`
})

const totalCycleMinutes = (row: Pick<MttdMttrEntry, 'mttd_minutes' | 'mttr_minutes'>): number | null => {
  const total = (row.mttd_minutes ?? 0) + (row.mttr_minutes ?? 0)
  return total > 0 ? total : null
}

const formatMinutes = (minutes: number | null | undefined) => {
  if (minutes === null || minutes === undefined || minutes <= 0) return '—'
  if (minutes < 60) return `${minutes.toFixed(1)} min`
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} h`
  return `${(minutes / 1440).toFixed(1)} d`
}

const moduleStatusTone = (status: DataQualityModuleStatus) => {
  switch (status) {
    case 'critical':
      return 'bg-red-100 text-red-700'
    case 'watch':
      return 'bg-amber-100 text-amber-700'
    case 'warming':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-emerald-100 text-emerald-700'
  }
}

const moduleStatusLabel = (status: DataQualityModuleStatus) => {
  if (status === 'warming') return 'Warming'
  if (status === 'critical') return 'Critical'
  if (status === 'watch') return 'Watch'
  return 'Healthy'
}

const actionRequiredModules = computed<DataQualityModuleInsight[]>(() =>
  qualityInsights.value.actionRequired.slice(0, 6),
)

const responseRows = computed(() =>
  [...mttdRows.value].sort((left, right) => {
    const rightCycle = totalCycleMinutes(right) ?? -1
    const leftCycle = totalCycleMinutes(left) ?? -1
    if (rightCycle !== leftCycle) return rightCycle - leftCycle
    return left.display_name.localeCompare(right.display_name)
  }),
)

const cycleTotals = computed(() =>
  responseRows.value
    .map((row) => totalCycleMinutes(row))
    .filter((value): value is number => value !== null),
)

const averageCycleTimeDisplay = computed(() => {
  if (!cycleTotals.value.length) return '—'
  const sum = cycleTotals.value.reduce((acc, value) => acc + value, 0)
  return formatMinutes(sum / cycleTotals.value.length)
})

const resolvedCycleCount = computed(() => cycleTotals.value.length)

const bottleneckLabel = (row: MttdMttrEntry) => {
  const detection = row.mttd_minutes ?? 0
  const repair = row.mttr_minutes ?? 0
  if (!detection && !repair) return 'No cycle data'
  if (detection > repair * 1.25) return 'Detection lag'
  if (repair > detection * 1.25) return 'Repair lag'
  return 'Balanced'
}

const bottleneckTone = (row: MttdMttrEntry) => {
  const label = bottleneckLabel(row)
  if (label === 'Detection lag') return 'bg-amber-100 text-amber-700'
  if (label === 'Repair lag') return 'bg-rose-100 text-rose-700'
  if (label === 'Balanced') return 'bg-emerald-100 text-emerald-700'
  return 'bg-slate-100 text-slate-600'
}

const primaryBottleneck = computed(() => {
  const detection = qualityInsights.value.longestDetectionRow
  const repair = qualityInsights.value.longestResolutionRow

  if (!detection && !repair) {
    return {
      title: 'No completed cycles',
      detail: 'Once a failure bundle is detected and resolved, this panel will call out whether detection or repair is the limiting step.',
    }
  }

  if ((repair?.mttr_minutes ?? 0) >= (detection?.mttd_minutes ?? 0)) {
    return {
      title: 'Repair is the slower stage',
      detail: repair
        ? `${repair.display_name} has the slowest repair segment at ${formatMinutes(repair.mttr_minutes)}.`
        : 'Resolution is currently slower than detection.',
    }
  }

  return {
    title: 'Detection is the slower stage',
    detail: detection
      ? `${detection.display_name} has the slowest detection segment at ${formatMinutes(detection.mttd_minutes)}.`
      : 'Detection is currently slower than repair.',
  }
})

const summaryCards = computed(() => [
  {
    label: 'Telemetry coverage',
    value: `${formatNumber(qualityInsights.value.activeModules)} / ${formatNumber(qualityInsights.value.totalModules)}`,
    detail: 'Modules with at least one fresh observation in the last 24 hours.',
  },
  {
    label: 'Observation volume',
    value: formatNumber(qualityInsights.value.totalObservations),
    detail: `${formatNumber(qualityInsights.value.totalCoverageChecks)} corridor checks sampled across the module fleet.`,
  },
  {
    label: 'Weighted failure rate',
    value: qualityInsights.value.weightedFailureRate === null ? '—' : formatPercent(qualityInsights.value.weightedFailureRate, 1),
    detail: `${formatNumber(qualityInsights.value.totalFailures)} failures divided by ${formatNumber(qualityInsights.value.totalObservations)} total observations.`,
  },
  {
    label: 'Modules needing attention',
    value: formatNumber(qualityInsights.value.watchModules + qualityInsights.value.criticalModules),
    detail: qualityInsights.value.slowestCycleModule?.display_name
      ? `Slowest current cycle: ${qualityInsights.value.slowestCycleModule.display_name}.`
      : 'No completed repair cycles yet.',
  },
])

const CYCLE_BUCKETS = [
  { label: '< 30 min', min: 0, max: 30, badgeClass: 'bg-emerald-100 text-emerald-800' },
  { label: '30 min - 2 h', min: 30, max: 120, badgeClass: 'bg-green-100 text-green-800' },
  { label: '2 h - 8 h', min: 120, max: 480, badgeClass: 'bg-amber-100 text-amber-800' },
  { label: '8 h - 24 h', min: 480, max: 1440, badgeClass: 'bg-orange-100 text-orange-800' },
  { label: '> 24 h', min: 1440, max: Infinity, badgeClass: 'bg-red-100 text-red-800' },
] as const

const cycleTimeBuckets = computed(() =>
  CYCLE_BUCKETS.map(({ label, min, max, badgeClass }) => ({
    label,
    badgeClass,
    count: cycleTotals.value.filter((total) => total >= min && total < max).length,
  })),
)

const load = async () => {
  if (loading.value) return
  loading.value = true
  error.value = null

  try {
    const [tceRes, mttdRes] = await Promise.all([
      getTotalCollectionError(),
      getMttdMttr(),
    ])
    tceRows.value = tceRes.rows
    mttdRows.value = mttdRes.entries
    lastUpdated.value = tceRes.updatedAt ?? mttdRes.updatedAt ?? new Date().toISOString()
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load data quality metrics.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>
