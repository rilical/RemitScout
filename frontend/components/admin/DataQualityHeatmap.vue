<script setup lang="ts">
import type { TotalCollectionErrorRow } from '~/types/data-quality'

defineProps<{
  rows: TotalCollectionErrorRow[]
}>()

const errorRateColor = (rate: number) => {
  if (rate <= 0.01) return 'bg-green-100 text-green-800'
  if (rate <= 0.05) return 'bg-amber-100 text-amber-800'
  if (rate <= 0.1) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

const fmtRate = (v: number) => `${(v * 100).toFixed(1)}%`
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-caption">
      <thead>
        <tr class="border-b border-rs-border text-left text-rs-muted">
          <th class="pb-2 pr-3 font-medium">Module</th>
          <th class="pb-2 px-2 text-right font-medium">Observations</th>
          <th class="pb-2 px-2 text-right font-medium">Failures</th>
          <th class="pb-2 px-2 text-right font-medium">Corridors</th>
          <th class="pb-2 px-2 text-center font-medium">Error Rate</th>
          <th class="pb-2 pl-2 text-right font-medium">Consec. Failures</th>
        </tr>
      </thead>
      <tbody>
        <tr
v-for="row in rows"
:key="row.module_id"
class="border-b border-rs-border/50"
>
          <td class="py-1.5 pr-3 font-medium text-rs-fg">{{ row.display_name }}</td>
          <td class="px-2 py-1.5 text-right tabular-nums text-rs-fg">{{ row.total_observations }}</td>
          <td class="px-2 py-1.5 text-right tabular-nums text-rs-fg">{{ row.failure_count }}</td>
          <td class="px-2 py-1.5 text-right tabular-nums text-rs-fg">{{ row.corridor_count }}</td>
          <td class="px-2 py-1.5 text-center">
            <span
              class="inline-block min-w-[3rem] rounded px-1 py-0.5 tabular-nums"
              :class="errorRateColor(row.parse_error_rate)"
            >
              {{ fmtRate(row.parse_error_rate) }}
            </span>
          </td>
          <td class="py-1.5 pl-2 text-right tabular-nums text-rs-fg">{{ row.consecutive_failures }}</td>
        </tr>
      </tbody>
    </table>
    <p
v-if="!rows.length"
class="py-4 text-center text-body-sm text-rs-muted"
>
No data quality metrics available.
</p>
  </div>
</template>
