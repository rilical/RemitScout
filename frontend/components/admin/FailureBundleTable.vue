<script setup lang="ts">
import type { FailureBundleSummary } from '~/types/agents'

defineProps<{
  bundles: FailureBundleSummary[]
}>()

const { formatDateTime } = useAdminFormat()

const outcomeColor = (outcome: string | null) => {
  if (outcome === 'applied') return 'bg-green-100 text-green-700'
  if (outcome === 'proposed') return 'bg-blue-100 text-blue-700'
  if (outcome === 'failed' || outcome === 'rejected') return 'bg-red-100 text-red-700'
  if (outcome === 'pending') return 'bg-amber-100 text-amber-700'
  return 'bg-neutral-100 text-neutral-600'
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-caption">
      <thead>
        <tr class="border-b border-rs-border text-left text-rs-muted">
          <th class="pb-2 pr-3 font-medium">Module</th>
          <th class="pb-2 pr-3 font-medium">Corridors</th>
          <th class="pb-2 pr-3 font-medium">Category</th>
          <th class="pb-2 pr-3 font-medium text-right">Failures</th>
          <th class="pb-2 pr-3 font-medium">Outcome</th>
          <th class="pb-2 font-medium">Created</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in bundles" :key="b.bundle_id" class="border-b border-rs-border/50">
          <td class="py-1.5 pr-3 font-medium text-rs-fg">{{ b.module_id }}</td>
          <td class="py-1.5 pr-3 text-rs-muted">{{ b.affected_corridors?.join(', ') || '—' }}</td>
          <td class="py-1.5 pr-3 text-rs-muted">{{ b.category }}</td>
          <td class="py-1.5 pr-3 text-right tabular-nums text-rs-fg">{{ b.consecutive_failures }}</td>
          <td class="py-1.5 pr-3">
            <span class="inline-flex rounded-full px-2 py-0.5 font-medium" :class="outcomeColor(b.repair_outcome)">
              {{ b.repair_outcome?.replace(/_/g, ' ') ?? '—' }}
            </span>
          </td>
          <td class="py-1.5 text-rs-muted">{{ formatDateTime(b.created_at) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-if="!bundles.length" class="py-4 text-center text-body-sm text-rs-muted">No failure bundles.</p>
  </div>
</template>
