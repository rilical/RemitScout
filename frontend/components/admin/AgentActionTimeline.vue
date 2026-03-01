<script setup lang="ts">
import type { AgentActionEntry } from '~/types/agents'

defineProps<{
  actions: AgentActionEntry[]
}>()

const { formatDateTime } = useAdminFormat()

const statusColor = (status: string) => {
  if (status === 'completed') return 'text-green-600'
  if (status === 'failed') return 'text-red-600'
  if (status === 'rejected') return 'text-orange-600'
  if (status === 'executing') return 'text-blue-600'
  return 'text-amber-600'
}

const actionIcon = (type: string) => {
  if (type === 'failure_detected') return '!'
  if (type === 'patch_proposed') return '~'
  if (type === 'patch_validated') return '?'
  if (type === 'patch_deployed') return '+'
  if (type === 'module_quarantined') return 'Q'
  if (type === 'module_restored') return 'R'
  return '*'
}
</script>

<template>
  <div class="space-y-0">
    <div
      v-for="action in actions"
      :key="action.action_id"
      class="relative flex gap-3 pb-4 pl-6"
    >
      <span
        class="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rs-surface-2 text-[10px] font-bold text-rs-muted ring-1 ring-rs-border"
      >
        {{ actionIcon(action.action_type) }}
      </span>
      <div v-if="actions.indexOf(action) < actions.length - 1" class="absolute bottom-0 left-[9px] top-6 w-px bg-rs-border" />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 text-body-sm">
          <span class="font-medium text-rs-fg">{{ action.action_type.replace(/_/g, ' ') }}</span>
          <span :class="statusColor(action.status)" class="text-caption font-medium">{{ action.status }}</span>
        </div>
        <p class="text-caption text-rs-muted">
          {{ action.agent_id }}
          <span v-if="action.module_id"> &middot; {{ action.module_id }}</span>
        </p>
        <p v-if="action.description" class="text-caption text-rs-muted">{{ action.description }}</p>
        <p class="text-caption text-rs-muted">{{ formatDateTime(action.created_at) }}</p>
      </div>
    </div>
    <p v-if="!actions.length" class="text-body-sm text-rs-muted">No recent agent actions.</p>
  </div>
</template>
