<script setup lang="ts">
import { computed, watch } from 'vue';
import type { ModuleDetailResponse, ModuleHealthEntry } from '~/types/modules';
import { getModuleDetail } from '~/lib/opsApi';

const STALE_HEALTH_CHECK_SECONDS = 24 * 60 * 60;

const props = defineProps<{
  module: ModuleHealthEntry;
  expanded?: boolean;
}>();

defineEmits<{
  toggle: [moduleId: string];
}>();

const { formatDateTime, formatDuration, formatPercent } = useAdminFormat();

const detail = ref<ModuleDetailResponse | null>(null);
const detailLoading = ref(false);
const detailError = ref<string | null>(null);

watch(
  () => props.expanded,
  isExpanded => {
    if (!isExpanded || detail.value || detailLoading.value) return;
    detailError.value = null;
    detailLoading.value = true;
    getModuleDetail(props.module.module_id)
      .then(response => {
        detail.value = response;
      })
      .catch((cause: unknown) => {
        detailError.value = cause instanceof Error ? cause.message : 'Failed to load module detail';
      })
      .finally(() => {
        detailLoading.value = false;
      });
  }
);

const toTimestamp = (value: string | null | undefined) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const healthCheckAgeSeconds = computed<number | null>(() => {
  const timestamp = toTimestamp(props.module.last_health_check_at);
  if (timestamp === null) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
});

const isStaleHealthCheck = computed(
  () =>
    healthCheckAgeSeconds.value == null || healthCheckAgeSeconds.value > STALE_HEALTH_CHECK_SECONDS
);
const hasConsecutiveFailures = computed(() => props.module.consecutive_failures > 0);
const hasParseRisk = computed(() => props.module.parse_error_rate >= 0.02);

const statusPillClass = computed(() => {
  if (props.module.status === 'production') return 'bg-emerald-100 text-emerald-700';
  if (
    props.module.status === 'beta' ||
    props.module.status === 'sandbox' ||
    props.module.status === 'candidate'
  ) {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-rose-100 text-rose-700';
});

const severity = computed(() => {
  if (props.module.status === 'quarantined' || props.module.status === 'deprecated')
    return 'critical';
  if (isStaleHealthCheck.value || hasConsecutiveFailures.value || hasParseRisk.value)
    return 'warning';
  if (
    props.module.status === 'beta' ||
    props.module.status === 'sandbox' ||
    props.module.status === 'candidate'
  )
    return 'watch';
  return 'healthy';
});

const containerClass = computed(() => {
  if (severity.value === 'critical') return 'border-rose-200 bg-rose-50/40';
  if (severity.value === 'warning') return 'border-amber-200 bg-amber-50/40';
  if (severity.value === 'watch') return 'border-sky-200 bg-sky-50/30';
  return 'border-rs-border bg-rs-surface';
});

const statusDotClass = computed(() => {
  if (severity.value === 'critical') return 'bg-rose-500';
  if (severity.value === 'warning') return 'bg-amber-500';
  if (severity.value === 'watch') return 'bg-sky-500';
  return 'bg-emerald-500';
});

const interventionBadge = computed(() => {
  if (severity.value === 'critical')
    return { label: 'Immediate action', className: 'bg-rose-100 text-rose-700' };
  if (severity.value === 'warning')
    return { label: 'Needs review', className: 'bg-amber-100 text-amber-700' };
  if (severity.value === 'watch')
    return { label: 'Monitoring', className: 'bg-sky-100 text-sky-700' };
  return { label: 'Healthy', className: 'bg-emerald-100 text-emerald-700' };
});

const summaryNote = computed(() => {
  if (props.module.quarantine_reason) {
    return `Quarantine reason: ${props.module.quarantine_reason}`;
  }
  if (hasConsecutiveFailures.value && props.module.last_failure_at) {
    return `Last failure at ${formatDateTime(props.module.last_failure_at)}.`;
  }
  if (hasParseRisk.value) {
    return `${formatPercent(props.module.parse_error_rate)} parse-error rate over the recent observation window.`;
  }
  if (isStaleHealthCheck.value) {
    return healthCheckAgeSeconds.value == null
      ? 'Health checks have not been recorded for this module yet.'
      : `Health check freshness is ${formatDuration(healthCheckAgeSeconds.value)}.`;
  }
  return 'No active intervention signals on this module.';
});

const detailBanner = computed(() => {
  if (props.module.quarantine_reason) {
    return {
      className: 'border-rose-200 bg-rose-50 text-rose-700',
      message: `This module is quarantined. ${props.module.quarantine_reason}`,
    };
  }
  if (hasConsecutiveFailures.value) {
    return {
      className: 'border-amber-200 bg-amber-50 text-amber-800',
      message: `${props.module.consecutive_failures} consecutive failures need follow-up before promotion.`,
    };
  }
  if (isStaleHealthCheck.value) {
    return {
      className: 'border-amber-200 bg-amber-50 text-amber-800',
      message: `Health checks are ${healthCheckAgeSeconds.value == null ? 'missing' : `stale by ${formatDuration(healthCheckAgeSeconds.value)}`}.`,
    };
  }
  return null;
});
</script>

<template>
  <div class="rounded-2xl border p-4 shadow-sm transition-colors" :class="containerClass">
    <button
      class="flex w-full flex-col gap-4 text-left xl:flex-row xl:items-start xl:justify-between"
      @click="$emit('toggle', module.module_id)"
    >
      <div class="flex min-w-0 flex-1 items-start gap-4">
        <span class="mt-1 inline-block h-2.5 w-2.5 rounded-full" :class="statusDotClass" />
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-body-sm font-semibold text-rs-fg">{{ module.display_name }}</p>
            <span
              class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
              :class="statusPillClass"
            >
              {{ module.status }}
            </span>
            <span
              class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="interventionBadge.className"
            >
              {{ interventionBadge.label }}
            </span>
          </div>
          <p class="text-caption mt-1 text-rs-muted">
            {{ module.provider_id }} · {{ module.collector_type }}
          </p>
          <p class="text-body-sm mt-2 text-rs-muted">{{ summaryNote }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[32rem]">
        <div class="rounded-xl border border-rs-border bg-rs-bg px-3 py-2">
          <div class="text-xs uppercase tracking-wide text-rs-muted">Parse error</div>
          <div class="text-body-sm mt-1 font-semibold text-rs-fg">
            {{ formatPercent(module.parse_error_rate) }}
          </div>
        </div>
        <div class="rounded-xl border border-rs-border bg-rs-bg px-3 py-2">
          <div class="text-xs uppercase tracking-wide text-rs-muted">Failures</div>
          <div class="text-body-sm mt-1 font-semibold text-rs-fg">
            {{ module.consecutive_failures }}
          </div>
        </div>
        <div class="rounded-xl border border-rs-border bg-rs-bg px-3 py-2">
          <div class="text-xs uppercase tracking-wide text-rs-muted">Last success</div>
          <div class="text-body-sm mt-1 font-semibold text-rs-fg">
            {{ formatDateTime(module.last_success_at) }}
          </div>
        </div>
        <div class="rounded-xl border border-rs-border bg-rs-bg px-3 py-2">
          <div class="text-xs uppercase tracking-wide text-rs-muted">Health check</div>
          <div class="text-body-sm mt-1 font-semibold text-rs-fg">
            {{
              healthCheckAgeSeconds == null
                ? 'Missing'
                : isStaleHealthCheck
                  ? formatDuration(healthCheckAgeSeconds)
                  : formatDateTime(module.last_health_check_at)
            }}
          </div>
        </div>
      </div>
    </button>

    <div
      class="text-body-sm mt-3 flex items-center justify-end border-t border-rs-border pt-3 text-rs-muted"
    >
      <span v-if="!expanded">Show corridor detail</span>
      <span class="ml-2 transition-transform" :class="{ 'rotate-180': expanded }">&#9662;</span>
    </div>

    <div v-if="expanded" class="mt-3 space-y-4 border-t border-rs-border pt-4">
      <div
        v-if="detailBanner"
        class="text-body-sm rounded-xl border px-4 py-3"
        :class="detailBanner.className"
      >
        {{ detailBanner.message }}
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
          <div class="text-xs uppercase tracking-wide text-rs-muted">Last success</div>
          <div class="text-body-sm mt-1 font-semibold text-rs-fg">
            {{ formatDateTime(module.last_success_at) }}
          </div>
        </div>
        <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
          <div class="text-xs uppercase tracking-wide text-rs-muted">Last failure</div>
          <div class="text-body-sm mt-1 font-semibold text-rs-fg">
            {{ formatDateTime(module.last_failure_at) }}
          </div>
        </div>
        <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
          <div class="text-xs uppercase tracking-wide text-rs-muted">Consecutive failures</div>
          <div class="text-body-sm mt-1 font-semibold text-rs-fg">
            {{ module.consecutive_failures }}
          </div>
        </div>
        <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
          <div class="text-xs uppercase tracking-wide text-rs-muted">Parse error rate</div>
          <div class="text-body-sm mt-1 font-semibold text-rs-fg">
            {{ formatPercent(module.parse_error_rate) }}
          </div>
        </div>
        <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
          <div class="text-xs uppercase tracking-wide text-rs-muted">Health check freshness</div>
          <div class="text-body-sm mt-1 font-semibold text-rs-fg">
            {{ healthCheckAgeSeconds == null ? 'Missing' : formatDuration(healthCheckAgeSeconds) }}
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-body-sm font-semibold text-rs-fg">Corridor detail</h3>
            <p class="text-caption mt-1 text-rs-muted">
              Freshness and observation activity by corridor for this module.
            </p>
          </div>
          <div v-if="detail" class="text-caption text-rs-muted">
            {{ detail.corridors.length }} corridor{{ detail.corridors.length === 1 ? '' : 's' }}
          </div>
        </div>

        <div v-if="detailLoading" class="text-caption mt-4 text-rs-muted">Loading…</div>

        <div
          v-else-if="detailError"
          class="text-caption mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700"
        >
          {{ detailError }}
        </div>

        <div v-else-if="detail" class="mt-4 overflow-auto">
          <table class="text-body-sm min-w-full">
            <thead class="text-left text-xs uppercase tracking-wide text-rs-muted">
              <tr>
                <th class="py-2 pr-3">Corridor</th>
                <th class="py-2 pr-3 text-right">Obs 24h</th>
                <th class="py-2 pr-3 text-right">Err 24h</th>
                <th class="py-2 pr-3 text-right">Freshness</th>
                <th class="py-2">Last observation</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in detail.corridors"
                :key="row.corridor_id"
                class="border-t border-rs-border/70"
              >
                <td class="py-2 pr-3 font-medium text-rs-fg">{{ row.corridor_id }}</td>
                <td class="py-2 pr-3 text-right text-rs-muted">{{ row.observation_count_24h }}</td>
                <td class="py-2 pr-3 text-right text-rs-muted">{{ row.error_count_24h }}</td>
                <td class="py-2 pr-3 text-right text-rs-muted">
                  {{
                    row.freshness_seconds == null ? 'n/a' : formatDuration(row.freshness_seconds)
                  }}
                </td>
                <td class="py-2 text-rs-muted">{{ formatDateTime(row.last_observation_at) }}</td>
              </tr>
              <tr v-if="detail.corridors.length === 0">
                <td colspan="5" class="text-body-sm py-4 text-center text-rs-muted">
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
