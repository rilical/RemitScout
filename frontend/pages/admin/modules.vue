<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Module Registry"
      subtitle="Operational inventory for signal modules, health checks, and collector drift."
      :loading="loading"
      :error="error"
      :meta="lastUpdated ? `Last updated: ${formatDateTime(lastUpdated)}` : undefined"
    >
      <template #actions>
        <div class="flex items-center gap-3">
          <label class="text-body-sm inline-flex items-center gap-2 text-rs-muted">
            <input
              v-model="autoRefresh"
              type="checkbox"
              class="h-4 w-4 rounded border-rs-border text-brand-600"
            />
            Auto-refresh
            <span v-if="autoRefresh" class="font-semibold tabular-nums text-rs-fg"
              >{{ countdown }}s</span
            >
          </label>
          <button
            class="text-body-sm h-10 rounded-lg bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            :disabled="loading"
            @click="load"
          >
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
      </template>
    </AdminPageShell>

    <template v-if="!loading && !error">
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
          <p class="text-caption text-rs-muted">Registered modules</p>
          <p class="text-h3 mt-1 font-semibold tabular-nums text-rs-fg">
            {{ formatNumber(modules.length, 0) }}
          </p>
          <p class="text-body-sm mt-2 text-rs-muted">
            {{ formatNumber(providersCovered, 0) }} providers across
            {{ formatNumber(collectorTypes, 0) }} collector lanes.
          </p>
        </article>
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
          <p class="text-caption text-rs-muted">Production ready</p>
          <p class="text-h3 mt-1 font-semibold tabular-nums text-emerald-600">
            {{ formatNumber(productionCount, 0) }}
          </p>
          <p class="text-body-sm mt-2 text-rs-muted">
            {{ formatNumber(preProductionCount, 0) }} modules remain in candidate, sandbox, or beta
            lanes.
          </p>
        </article>
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
          <p class="text-caption text-rs-muted">Needs attention</p>
          <p class="text-h3 mt-1 font-semibold tabular-nums text-amber-600">
            {{ formatNumber(attentionModules.length, 0) }}
          </p>
          <p class="text-body-sm mt-2 text-rs-muted">
            Quarantine, stale checks, repeated failures, or parse-error drift.
          </p>
        </article>
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
          <p class="text-caption text-rs-muted">Stale health checks</p>
          <p class="text-h3 mt-1 font-semibold tabular-nums text-rose-600">
            {{ formatNumber(staleModules.length, 0) }}
          </p>
          <p class="text-body-sm mt-2 text-rs-muted">
            Checks older than {{ formatDuration(STALE_HEALTH_CHECK_SECONDS) }} or missing entirely.
          </p>
        </article>
      </section>

      <section class="rounded-2xl border p-6 shadow-sm" :class="operatorBrief.panelClass">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-body-lg font-semibold text-rs-fg">Operator brief</h2>
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="operatorBrief.badgeClass"
              >
                {{ operatorBrief.label }}
              </span>
            </div>
            <p class="text-body-sm mt-2 text-rs-fg">{{ operatorBrief.summary }}</p>
            <p class="text-body-sm mt-2 text-rs-muted">{{ operatorBrief.detail }}</p>
          </div>
          <div
            class="text-body-sm rounded-xl border border-white/60 bg-white/60 px-4 py-3 text-rs-muted"
          >
            <div class="font-semibold text-rs-fg">Top focus</div>
            <div class="mt-1">
              {{
                topAttentionModule
                  ? `${topAttentionModule.display_name} (${topAttentionModule.provider_id})`
                  : 'No active interventions queued.'
              }}
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Registry inventory</h2>
            <p class="text-body-sm mt-1 text-rs-muted">
              {{ formatNumber(filteredModules.length, 0) }} of
              {{ formatNumber(modules.length, 0) }} modules visible.
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="badge in statusBadges"
                :key="badge.label"
                class="inline-flex rounded-full border border-rs-border bg-rs-bg px-3 py-1 text-xs font-semibold text-rs-muted"
              >
                {{ badge.label }} {{ formatNumber(badge.count, 0) }}
              </span>
            </div>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <input
              v-model.trim="search"
              type="text"
              placeholder="Filter module or provider"
              class="text-body-sm h-10 min-w-[16rem] rounded-lg border border-rs-border bg-rs-bg px-3 text-rs-fg focus:border-brand-500 focus:outline-none"
            />
            <select
              v-model="statusFilter"
              class="text-body-sm h-10 min-w-[12rem] rounded-lg border border-rs-border bg-rs-bg px-3 text-rs-fg focus:border-brand-500 focus:outline-none"
            >
              <option v-for="option in filterOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="filteredModules.length > 0" class="mt-6 space-y-3">
          <ModuleHealthCard
            v-for="mod in filteredModules"
            :key="mod.module_id"
            :module="mod"
            :expanded="expandedId === mod.module_id"
            @toggle="expandedId = expandedId === $event ? null : $event"
          />
        </div>

        <div
          v-else
          class="mt-6 rounded-2xl border border-dashed border-rs-border bg-rs-bg px-6 py-10 text-center"
        >
          <h3 class="text-body-lg font-semibold text-rs-fg">{{ emptyState.title }}</h3>
          <p class="text-body-sm mt-2 text-rs-muted">{{ emptyState.body }}</p>
          <p class="text-body-sm mt-2 text-rs-muted">{{ emptyState.hint }}</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ModuleHealthEntry, ModuleStatus } from '~/types/modules';
import { getModuleHealth } from '~/lib/opsApi';

type ModuleFilter = 'all' | ModuleStatus | 'attention' | 'stale';

const STALE_HEALTH_CHECK_SECONDS = 24 * 60 * 60;

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' });

useAdminPage({
  title: 'Module Registry | Remit-Scout',
  description: 'Health status for all registered signal modules.',
});

const { formatDateTime, formatDuration, formatNumber } = useAdminFormat();

const loading = ref(false);
const error = ref<string | null>(null);
const lastUpdated = ref<string | null>(null);
const modules = ref<ModuleHealthEntry[]>([]);
const expandedId = ref<string | null>(null);
const search = ref('');
const statusFilter = ref<ModuleFilter>('all');

const autoRefresh = ref(false);
const countdown = ref(60);
let timer: ReturnType<typeof setInterval> | null = null;

const filterOptions: Array<{ value: ModuleFilter; label: string }> = [
  { value: 'all', label: 'All modules' },
  { value: 'attention', label: 'Needs attention' },
  { value: 'stale', label: 'Stale checks' },
  { value: 'production', label: 'Production' },
  { value: 'beta', label: 'Beta' },
  { value: 'sandbox', label: 'Sandbox' },
  { value: 'candidate', label: 'Candidate' },
  { value: 'quarantined', label: 'Quarantined' },
  { value: 'deprecated', label: 'Deprecated' },
];

const toTimestamp = (value: string | null | undefined) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const ageSecondsFromNow = (value: string | null | undefined) => {
  const timestamp = toTimestamp(value);
  if (timestamp === null) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
};

const isStaleHealthCheck = (module: ModuleHealthEntry) =>
  ageSecondsFromNow(module.last_health_check_at) > STALE_HEALTH_CHECK_SECONDS;

const moduleNeedsAttention = (module: ModuleHealthEntry) =>
  module.status === 'quarantined' ||
  module.status === 'deprecated' ||
  module.consecutive_failures > 0 ||
  module.parse_error_rate >= 0.02 ||
  isStaleHealthCheck(module);

const attentionRank = (module: ModuleHealthEntry) => {
  let score = 0;
  if (module.status === 'quarantined' || module.status === 'deprecated') score += 8;
  if (isStaleHealthCheck(module)) score += 4;
  if (module.consecutive_failures > 0) score += Math.min(4, module.consecutive_failures);
  if (module.parse_error_rate >= 0.05) score += 4;
  else if (module.parse_error_rate >= 0.02) score += 2;
  if (module.status === 'candidate' || module.status === 'sandbox' || module.status === 'beta')
    score += 1;
  return score;
};

const providersCovered = computed(
  () => new Set(modules.value.map(module => module.provider_id)).size
);
const collectorTypes = computed(
  () => new Set(modules.value.map(module => module.collector_type)).size
);
const productionCount = computed(
  () => modules.value.filter(module => module.status === 'production').length
);
const preProductionCount = computed(
  () =>
    modules.value.filter(
      module =>
        module.status === 'candidate' || module.status === 'sandbox' || module.status === 'beta'
    ).length
);
const attentionModules = computed(() => modules.value.filter(moduleNeedsAttention));
const staleModules = computed(() => modules.value.filter(isStaleHealthCheck));

const sortedModules = computed(() =>
  [...modules.value].sort((left, right) => {
    const scoreDelta = attentionRank(right) - attentionRank(left);
    if (scoreDelta !== 0) return scoreDelta;
    return left.display_name.localeCompare(right.display_name);
  })
);

const filteredModules = computed(() => {
  const token = search.value.trim().toLowerCase();

  return sortedModules.value.filter(module => {
    const matchesToken =
      !token ||
      [module.display_name, module.module_id, module.provider_id, module.collector_type].some(
        value => value.toLowerCase().includes(token)
      );

    const matchesStatus =
      statusFilter.value === 'all'
        ? true
        : statusFilter.value === 'attention'
          ? moduleNeedsAttention(module)
          : statusFilter.value === 'stale'
            ? isStaleHealthCheck(module)
            : module.status === statusFilter.value;

    return matchesToken && matchesStatus;
  });
});

watch(filteredModules, entries => {
  if (!expandedId.value) return;
  if (entries.some(entry => entry.module_id === expandedId.value)) return;
  expandedId.value = null;
});

const statusBadges = computed(() => [
  { label: 'Production', count: productionCount.value },
  { label: 'Pre-production', count: preProductionCount.value },
  { label: 'Attention', count: attentionModules.value.length },
  { label: 'Stale', count: staleModules.value.length },
]);

const topAttentionModule = computed(
  () =>
    attentionModules.value.slice().sort((left, right) => {
      const scoreDelta = attentionRank(right) - attentionRank(left);
      if (scoreDelta !== 0) return scoreDelta;
      return left.display_name.localeCompare(right.display_name);
    })[0] ?? null
);

const operatorBrief = computed(() => {
  if (modules.value.length === 0) {
    return {
      label: 'Awaiting data',
      summary: 'No modules are registered in this environment yet.',
      detail:
        'If this is unexpected, verify writes into silver.module_registry, recent migrations, and the module registration path before trusting the dashboard.',
      panelClass: 'border-slate-200 bg-slate-50',
      badgeClass: 'bg-slate-200 text-slate-700',
    };
  }

  if (attentionModules.value.length > 0) {
    const focus = topAttentionModule.value;
    return {
      label: 'Intervention required',
      summary: `${formatNumber(attentionModules.value.length, 0)} modules need follow-up before operators can treat this registry as clean.`,
      detail: focus
        ? `Start with ${focus.display_name}: repeated failures, stale health checks, or quarantine state are already pushing it above the rest of the queue.`
        : 'Review quarantined, failing, and stale modules first.',
      panelClass: 'border-amber-200 bg-amber-50',
      badgeClass: 'bg-amber-100 text-amber-800',
    };
  }

  return {
    label: 'Healthy',
    summary: 'The module registry is readable and there are no active intervention signals.',
    detail:
      'Use the registry inventory below to spot new modules, confirm provider coverage, and drill into corridor freshness before production promotion.',
    panelClass: 'border-emerald-200 bg-emerald-50',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  };
});

const emptyState = computed(() => {
  if (modules.value.length === 0) {
    return {
      title: 'No modules registered yet',
      body: 'This environment is returning an empty module registry.',
      hint: 'If staging should already be populated, verify the registry writer path and silver.module_registry data before using this surface for go-live decisions.',
    };
  }

  return {
    title: 'No modules match the current filters',
    body: 'The current search and status filters excluded every module.',
    hint: 'Reset the filter to All modules or widen the search to inspect the rest of the registry.',
  };
});

watch(autoRefresh, enabled => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (!enabled) return;
  countdown.value = 60;
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      countdown.value = 60;
      void load();
    }
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const getErrorMessage = (cause: unknown, fallback: string) =>
  cause instanceof Error
    ? cause.message
    : typeof cause === 'object' &&
        cause !== null &&
        'message' in cause &&
        typeof cause.message === 'string'
      ? cause.message
      : fallback;

const load = async () => {
  if (loading.value) return;
  loading.value = true;
  error.value = null;

  try {
    const response = await getModuleHealth();
    modules.value = response.modules;
    lastUpdated.value = response.updatedAt ?? new Date().toISOString();
  } catch (cause: unknown) {
    error.value = getErrorMessage(cause, 'Failed to load module health.');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void load();
});
</script>
