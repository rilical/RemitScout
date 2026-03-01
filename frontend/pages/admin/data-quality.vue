<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Data Quality"
      subtitle="Module observation metrics — observations, failures, error rates, and corridor coverage."
      :loading="loading"
      :error="error"
      :meta="lastUpdated ? `Last updated: ${formatDateTime(lastUpdated)}` : undefined"
    >
      <template #actions>
        <button
          class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          :disabled="loading"
          @click="load"
        >
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </template>
    </AdminPageShell>

    <template v-if="!loading && !error">
      <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="mb-4 text-body-lg font-semibold text-rs-fg">Module Quality Overview</h2>
        <DataQualityHeatmap :rows="tceRows" />
      </section>

      <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="mb-4 text-body-lg font-semibold text-rs-fg">MTTD / MTTR by Module</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-body-sm">
            <thead>
              <tr class="border-b border-rs-border text-left text-rs-muted">
                <th class="pb-2 pr-3 font-medium">Module</th>
                <th class="pb-2 pr-3 font-medium text-right">MTTD (min)</th>
                <th class="pb-2 pr-3 font-medium text-right">MTTR (min)</th>
                <th class="pb-2 pr-3 font-medium text-right">Total Cycle (min)</th>
                <th class="pb-2 font-medium">Period</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in mttdRows" :key="row.module_id" class="border-b border-rs-border/50">
                <td class="py-2 pr-3 font-medium text-rs-fg">{{ row.display_name }}</td>
                <td class="py-2 pr-3 text-right tabular-nums text-rs-fg">{{ row.mttd_minutes?.toFixed(1) ?? '—' }}</td>
                <td class="py-2 pr-3 text-right tabular-nums text-rs-fg">{{ row.mttr_minutes?.toFixed(1) ?? '—' }}</td>
                <td class="py-2 pr-3 text-right tabular-nums text-rs-fg">{{ totalCycleMinutes(row) }}</td>
                <td class="py-2 text-rs-muted">{{ row.period }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="!mttdRows.length" class="py-4 text-center text-body-sm text-rs-muted">No MTTD/MTTR data available.</p>
        </div>
      </section>

      <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="mb-4 text-body-lg font-semibold text-rs-fg">Triage-to-Resolution Cycle Time</h2>
        <div class="mb-4 flex items-center gap-4 rounded-xl border border-rs-border bg-rs-bg/50 px-4 py-3">
          <span class="text-body-sm text-rs-muted">Average cycle time (MTTD + MTTR):</span>
          <span class="text-body-lg font-semibold tabular-nums text-rs-fg">{{ averageCycleTimeDisplay }}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span
            v-for="bucket in cycleTimeBuckets"
            :key="bucket.label"
            class="inline-flex items-center rounded-full px-3 py-1 text-body-sm font-medium"
            :class="bucket.badgeClass"
          >
            {{ bucket.label }}: {{ bucket.count }}
          </span>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { TotalCollectionErrorRow } from '~/types/data-quality'
import type { MttdMttrEntry } from '~/types/data-quality'
import { getTotalCollectionError, getMttdMttr } from '~/lib/opsApi'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Data Quality | Remit-Scout',
  description: 'Total Collection Error framework for all modules.',
})

const { formatDateTime } = useAdminFormat()

const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<string | null>(null)
const tceRows = ref<TotalCollectionErrorRow[]>([])
const mttdRows = ref<MttdMttrEntry[]>([])

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
    lastUpdated.value = tceRes.updatedAt ?? new Date().toISOString()
  }
  catch (e: any) {
    error.value = e?.message ?? 'Failed to load data quality metrics.'
  }
  finally {
    loading.value = false
  }
}

const totalCycleMinutes = (row: MttdMttrEntry) => {
  const mttd = row.mttd_minutes ?? 0
  const mttr = row.mttr_minutes ?? 0
  const total = mttd + mttr
  return total > 0 ? total.toFixed(1) : '—'
}

const averageCycleTimeDisplay = computed(() => {
  const rows = mttdRows.value.filter(
    r => (r.mttd_minutes ?? 0) + (r.mttr_minutes ?? 0) > 0,
  )
  if (!rows.length) return '—'
  const sum = rows.reduce(
    (acc, r) => acc + (r.mttd_minutes ?? 0) + (r.mttr_minutes ?? 0),
    0,
  )
  const avg = sum / rows.length
  if (avg < 60) return `${avg.toFixed(1)} min`
  if (avg < 1440) return `${(avg / 60).toFixed(1)} h`
  return `${(avg / 1440).toFixed(1)} d`
})

const CYCLE_BUCKETS = [
  { label: '< 30min', min: 0, max: 30, badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { label: '30min–2h', min: 30, max: 120, badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { label: '2h–8h', min: 120, max: 480, badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  { label: '8h–24h', min: 480, max: 1440, badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  { label: '> 24h', min: 1440, max: Infinity, badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
] as const

const cycleTimeBuckets = computed(() => {
  return CYCLE_BUCKETS.map(({ label, min, max, badgeClass }) => {
    const count = mttdRows.value.filter((row) => {
      const total = (row.mttd_minutes ?? 0) + (row.mttr_minutes ?? 0)
      return total > 0 && total >= min && total < max
    }).length
    return { label, count, badgeClass }
  })
})

onMounted(() => { void load() })
</script>
