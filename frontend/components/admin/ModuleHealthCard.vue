<script setup lang="ts">
import { watch } from 'vue'
import type { ModuleHealthEntry, ModuleDetailResponse } from '~/types/modules'
import { getModuleDetail } from '~/lib/opsApi'

const props = defineProps<{
  module: ModuleHealthEntry
  expanded?: boolean
}>()

defineEmits<{
  toggle: [moduleId: string]
}>()

const { formatPercent, formatDateTime } = useAdminFormat()

const detail = ref<ModuleDetailResponse | null>(null)
const detailLoading = ref(false)
const detailError = ref<string | null>(null)

watch(
  () => props.expanded,
  (isExpanded) => {
    if (!isExpanded || detail.value || detailLoading.value) return
    detailError.value = null
    detailLoading.value = true
    getModuleDetail(props.module.module_id)
      .then((res) => {
        detail.value = res
      })
      .catch((e: unknown) => {
        detailError.value = e instanceof Error ? e.message : 'Failed to load module detail'
      })
      .finally(() => {
        detailLoading.value = false
      })
  },
)

const statusColor = (status: string) => {
  if (status === 'production') return 'bg-green-500'
  if (status === 'beta' || status === 'sandbox' || status === 'candidate') return 'bg-amber-500'
  return 'bg-red-500'
}

const statusBorder = (status: string) => {
  if (status === 'production') return 'border-green-200'
  if (status === 'beta' || status === 'sandbox' || status === 'candidate') return 'border-amber-200'
  return 'border-red-200'
}
</script>

<template>
  <div
    class="rounded-xl border p-4 transition-colors"
    :class="statusBorder(module.status)"
  >
    <button
      class="flex w-full items-center justify-between text-left"
      @click="$emit('toggle', module.module_id)"
    >
      <div class="flex items-center gap-3">
        <span
          class="inline-block h-2.5 w-2.5 rounded-full"
          :class="statusColor(module.status)"
        />
        <div>
          <p class="text-body-sm font-medium text-rs-fg">{{ module.display_name }}</p>
          <p class="text-caption text-rs-muted">{{ module.provider_id }} &middot; {{ module.collector_type }}</p>
        </div>
      </div>
      <div class="flex items-center gap-4 text-right text-caption text-rs-muted">
        <span
v-if="module.quarantine_reason"
class="rounded bg-red-100 px-1.5 py-0.5 text-red-700"
>
          {{ module.quarantine_reason }}
        </span>
        <span>{{ formatPercent(module.parse_error_rate) }} err</span>
        <span class="flex items-center gap-1">
          <span
v-if="!expanded"
class="text-rs-muted"
>Show details</span>
          <span
class="transition-transform"
:class="{ 'rotate-180': expanded }"
>&#9662;</span>
        </span>
      </div>
    </button>
    <div
v-if="expanded"
class="mt-3 space-y-3 border-t border-rs-border pt-3"
>
      <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-caption text-rs-muted md:grid-cols-4">
        <div>
          <p class="font-medium text-rs-fg">Last Success</p>
          <p>{{ formatDateTime(module.last_success_at) }}</p>
        </div>
        <div>
          <p class="font-medium text-rs-fg">Consecutive Failures</p>
          <p>{{ module.consecutive_failures }}</p>
        </div>
        <div>
          <p class="font-medium text-rs-fg">Last Failure</p>
          <p>{{ formatDateTime(module.last_failure_at) }}</p>
        </div>
        <div>
          <p class="font-medium text-rs-fg">Last Health Check</p>
          <p>{{ formatDateTime(module.last_health_check_at) }}</p>
        </div>
      </div>
      <div class="rounded-lg border border-rs-border bg-rs-bg p-3">
        <p class="mb-2 text-body-sm font-medium text-rs-fg">Corridor detail</p>
        <div
v-if="detailLoading"
class="text-caption text-rs-muted"
>
          Loading…
        </div>
        <div
          v-else-if="detailError"
          class="rounded-md bg-red-50 px-2 py-1 text-caption text-red-700 dark:bg-red-900/20 dark:text-red-300"
        >
          {{ detailError }}
        </div>
        <div
v-else-if="detail"
class="overflow-auto"
>
          <table class="min-w-full text-body-sm">
            <thead class="text-body-sm uppercase text-neutral-400">
              <tr>
                <th class="py-2 text-left">Corridor</th>
                <th class="py-2 text-right">Obs 24h</th>
                <th class="py-2 text-right">Err 24h</th>
                <th class="py-2 text-right">Freshness (s)</th>
                <th class="py-2 text-left">Last observation</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in detail.corridors"
                :key="row.corridor_id"
                class="border-t border-neutral-100"
              >
                <td class="py-2 text-rs-fg">{{ row.corridor_id }}</td>
                <td class="py-2 text-right text-rs-muted">{{ row.observation_count_24h }}</td>
                <td class="py-2 text-right text-rs-muted">{{ row.error_count_24h }}</td>
                <td class="py-2 text-right text-rs-muted">{{ row.freshness_seconds ?? 'n/a' }}</td>
                <td class="py-2 text-rs-muted">{{ formatDateTime(row.last_observation_at) }}</td>
              </tr>
              <tr v-if="(detail.corridors || []).length === 0">
                <td
                  colspan="5"
                  class="py-3 text-center text-body-sm text-neutral-400"
                >
                  No corridor detail available.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
