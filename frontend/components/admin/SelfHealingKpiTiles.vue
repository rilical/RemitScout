<script setup lang="ts">
import type { SelfHealingMetrics } from '~/types/agents'

defineProps<{
  metrics: SelfHealingMetrics | null
}>()

const fmt = (v: number | null | undefined, suffix = '') => {
  if (v == null) return '—'
  return `${v.toFixed(1)}${suffix}`
}
</script>

<template>
    <div class="grid grid-cols-2 gap-3 md:grid-cols-6">
    <div class="rounded-xl border border-rs-border bg-rs-surface p-3 text-center">
      <p class="text-caption text-rs-muted">MTTD</p>
      <p class="text-h4 font-semibold tabular-nums text-rs-fg">{{ fmt(metrics?.mttd_minutes, 'm') }}</p>
    </div>
    <div class="rounded-xl border border-rs-border bg-rs-surface p-3 text-center">
      <p class="text-caption text-rs-muted">MTTR</p>
      <p class="text-h4 font-semibold tabular-nums text-rs-fg">{{ fmt(metrics?.mttr_minutes, 'm') }}</p>
    </div>
    <div class="rounded-xl border border-rs-border bg-rs-surface p-3 text-center">
      <p class="text-caption text-rs-muted">Auto-heal Rate</p>
      <p class="text-h4 font-semibold tabular-nums text-rs-fg">
        {{ metrics?.auto_heal_success_rate != null ? `${(metrics.auto_heal_success_rate * 100).toFixed(0)}%` : '—' }}
      </p>
    </div>
    <div class="rounded-xl border border-rs-border bg-rs-surface p-3 text-center">
      <p class="text-caption text-rs-muted">Bundles (24h)</p>
      <p class="text-h4 font-semibold tabular-nums text-rs-fg">{{ metrics?.total_bundles_24h ?? '—' }}</p>
    </div>
    <div class="rounded-xl border border-rs-border bg-rs-surface p-3 text-center">
      <p class="text-caption text-rs-muted">Pending</p>
      <p class="text-h4 font-semibold tabular-nums text-rs-fg">{{ metrics?.pending_bundles ?? '—' }}</p>
    </div>
    <div class="rounded-xl border border-rs-border bg-rs-surface p-3 text-center">
      <p class="text-caption text-rs-muted">Active Repairs</p>
      <p class="text-h4 font-semibold tabular-nums text-rs-fg">{{ metrics?.active_repairs ?? '—' }}</p>
    </div>
  </div>
</template>
