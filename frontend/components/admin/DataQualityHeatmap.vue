<script setup lang="ts">
import type { TotalCollectionErrorRow } from '~/types/data-quality'
import { getDataQualityModuleStatus } from '~/utils/adminInsights'

defineProps<{
  rows: TotalCollectionErrorRow[]
}>()

const { formatDateTime, formatNumber, formatPercent } = useAdminFormat()

const statusTone = (row: TotalCollectionErrorRow) => {
  switch (getDataQualityModuleStatus(row)) {
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

const statusLabel = (row: TotalCollectionErrorRow) => {
  const status = getDataQualityModuleStatus(row)
  if (status === 'warming') return 'Warming'
  if (status === 'critical') return 'Critical'
  if (status === 'watch') return 'Watch'
  return 'Healthy'
}

const freshnessLabel = (value: string | null) => {
  if (!value) return 'No fresh observations'
  return formatDateTime(value)
}

const errorBarWidth = (rate: number) => `${Math.min(100, Math.max(6, rate * 1000))}%`
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[760px] text-caption">
      <thead>
        <tr class="border-b border-rs-border text-left text-rs-muted">
          <th class="pb-2 pr-3 font-medium">Module</th>
          <th class="pb-2 px-2 font-medium">Status</th>
          <th class="pb-2 px-2 text-right font-medium">Freshness</th>
          <th class="pb-2 px-2 text-right font-medium">Observations</th>
          <th class="pb-2 px-2 text-right font-medium">Failures</th>
          <th class="pb-2 px-2 text-right font-medium">Coverage</th>
          <th class="pb-2 px-2 font-medium">Error Rate</th>
          <th class="pb-2 pl-2 text-right font-medium">Consec. Failures</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.module_id"
          class="border-b border-rs-border/50 align-top"
        >
          <td class="py-3 pr-3">
            <div class="font-medium text-rs-fg">{{ row.display_name }}</div>
            <div class="mt-1 text-xs text-rs-muted">{{ row.module_id }}</div>
          </td>
          <td class="px-2 py-3">
            <span
              class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="statusTone(row)"
            >
              {{ statusLabel(row) }}
            </span>
          </td>
          <td class="px-2 py-3 text-right text-xs text-rs-muted">
            {{ freshnessLabel(row.last_observed_at) }}
          </td>
          <td class="px-2 py-3 text-right tabular-nums text-rs-fg">
            {{ formatNumber(row.total_observations) }}
          </td>
          <td class="px-2 py-3 text-right tabular-nums text-rs-fg">
            {{ formatNumber(row.failure_count) }}
          </td>
          <td class="px-2 py-3 text-right tabular-nums text-rs-fg">
            {{ formatNumber(row.corridor_count) }}
          </td>
          <td class="px-2 py-3">
            <div class="flex min-w-[11rem] items-center gap-3">
              <div class="h-2 flex-1 rounded-full bg-rs-border/70">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="statusTone(row).includes('red') ? 'bg-red-500' : statusTone(row).includes('amber') ? 'bg-amber-500' : statusTone(row).includes('slate') ? 'bg-slate-400' : 'bg-emerald-500'"
                  :style="{ width: errorBarWidth(row.parse_error_rate) }"
                />
              </div>
              <span class="min-w-[4rem] text-right tabular-nums text-rs-fg">
                {{ formatPercent(row.parse_error_rate, 1) }}
              </span>
            </div>
          </td>
          <td class="py-3 pl-2 text-right tabular-nums text-rs-fg">
            {{ formatNumber(row.consecutive_failures) }}
          </td>
        </tr>
      </tbody>
    </table>
    <p
      v-if="!rows.length"
      class="py-6 text-center text-body-sm text-rs-muted"
    >
      No modules have been registered yet. Seed the module registry, then refresh this view.
    </p>
  </div>
</template>
