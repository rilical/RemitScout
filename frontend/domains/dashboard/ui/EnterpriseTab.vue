<script setup lang="ts">
import { computed, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';
import { DataTable, Icon } from '~/ui';
import { formatDate, formatRelativeTime } from '~/shared/lib/format';
import { useApi } from '~/composables/useApi';
import { useEntitlements } from '~/composables/useEntitlements';
import { useEnterpriseApiKeys } from '~/composables/useEnterpriseApiKeys';
import { useEnterpriseEmbeds } from '~/composables/useEnterpriseEmbeds';
import { useEnterpriseExports } from '~/composables/useEnterpriseExports';
import {
  CHART_VISUAL_EXPORT_FORMATS,
  type ChartVisualExportFormat,
  useChartImageExport,
} from '~/composables/useChartImageExport';

type EmbedVisualKey = 'teer' | 'rci' | 'rvi_bps';
type NoticeTone = 'danger' | 'warning' | 'info';

type EnterpriseCorridorRecord = {
  corridorId: string;
  sourceCountry: string;
  destCountry: string;
  sourceCurrency: string;
  destCurrency: string;
  dataTier: number;
  exportCadenceMinutes: number;
  collectionCadenceMinutes: number;
  collectionTier: 'tier_1' | 'tier_2';
  isUsdOrigin: boolean;
  dataPoints: number;
  lastUpdated: string | null;
};

type EnterpriseCorridorResponse = {
  totalCorridors: number;
  corridors: EnterpriseCorridorRecord[];
};

type EnterpriseNotice = {
  tone: NoticeTone;
  title: string;
  body: string;
};

const CORRIDOR_ID_PATTERN = /^[A-Z]{2}-[A-Z]{2}-[A-Z]{3}-[A-Z]{3}$/;
const EXPORT_DELAY_THRESHOLD_MINUTES = 15;
const EMBED_INDEX_ORDER: EmbedVisualKey[] = ['teer', 'rci', 'rvi_bps'];

const METHOD_PROFILE_LABELS: Record<string, string> = {
  standard_bank: 'Bank to bank',
  standard_card: 'Card to bank',
  cash_pickup: 'Cash pickup',
  mobile_wallet: 'Mobile wallet',
  airtime_topup: 'Airtime top-up',
  card_delivery: 'Card delivery',
  home_delivery: 'Home delivery',
};

const EXPORT_JOB_TYPE_LABELS: Record<string, string> = {
  history: 'Quote history',
  watchlist: 'Watchlist',
  alerts: 'Alerts',
  all: 'All data',
  indices: 'TEER / RCI / RVI',
  history_csv: 'Quote history CSV',
  history_parquet: 'Quote history Parquet',
  watchlist_csv: 'Watchlist CSV',
  alerts_csv: 'Alerts CSV',
  all_csv: 'All data CSV',
  all_pdf: 'All data PDF',
  all_parquet: 'All data Parquet',
  indices_csv: 'Indices CSV',
  indices_pdf: 'Indices PDF',
  indices_parquet: 'Indices Parquet',
};

const { apiAccess, apiTier, apiRateLimitRpm, indicesEmbedsEnabled, indicesExportsEnabled, limits } =
  useEntitlements();
const { request } = useApi();

const {
  apiKeys,
  apiKeysLoading,
  apiKeysError,
  apiKeyName,
  apiKeyScopes,
  apiKeyToken,
  apiKeyTokenLabel,
  apiKeyCopyStatus,
  showApiReference,
  maxApiKeys,
  availableScopes,
  activeApiKeyCount,
  apiKeyFromRow,
  columns: apiKeyTableColumns,
  rowKey: apiKeyTableRowKey,
  fetchApiKeys,
  createKey: createEnterpriseApiKey,
  rotateKey: rotateEnterpriseApiKey,
  revokeKey: revokeEnterpriseApiKey,
  copyToken: copyApiKeyToken,
} = useEnterpriseApiKeys();

const {
  corridorId: embedCorridorId,
  amountBucket: embedAmountBucket,
  methodProfile: embedMethodProfile,
  days: embedDays,
  theme: embedTheme,
  copyStatus: embedCopyStatus,
  publishedId: embedPublishedId,
  publishedAt: embedPublishedAt,
  publishedGenerating: embedPublishedGenerating,
  publishedError: embedPublishedError,
  indices: embedIndices,
  embedUrls,
  embedCodes,
  publishEmbed,
  copyEmbedCode,
  copyPublishedValue,
  publishedEmbeds,
  publishedEmbedsLoading,
  publishedEmbedsError,
  fetchPublishedEmbeds,
  revokePublishedEmbed,
} = useEnterpriseEmbeds();

const {
  jobs: exportJobs,
  loading: exportJobsLoading,
  error: exportJobsError,
  jobType: exportJobType,
  format: exportFormat,
  dateFrom: exportDateFrom,
  dateTo: exportDateTo,
  corridorIdsText: exportCorridorIdsText,
  parsedCorridorIds: exportCorridorIds,
  exportWindowLimitDays,
  creating: exportCreating,
  columns: exportJobTableColumns,
  rowKey: exportJobTableRowKey,
  fromRow: exportJobFromRow,
  statusClasses: exportStatusClasses,
  fetchJobs: fetchExportJobs,
  createJob: createExportJob,
  downloadJob: downloadExport,
} = useEnterpriseExports();

const { exportVisual, exporting: visualExporting } = useChartImageExport();
const embedVisualButtons: Array<{ value: ChartVisualExportFormat; label: string }> =
  CHART_VISUAL_EXPORT_FORMATS.map(format => ({
    value: format,
    label: format.toUpperCase(),
  }));

const embedPreviewFrames = ref<Record<EmbedVisualKey, HTMLIFrameElement | null>>({
  teer: null,
  rci: null,
  rvi_bps: null,
});
const embedVisualErrors = ref<Record<EmbedVisualKey, string | null>>({
  teer: null,
  rci: null,
  rvi_bps: null,
});
const activeVisualExportKey = ref<EmbedVisualKey | null>(null);
const activeVisualExportFormat = ref<ChartVisualExportFormat | null>(null);
const corridors = ref<EnterpriseCorridorRecord[]>([]);
const corridorsLoading = ref(false);
const corridorsError = ref<string | null>(null);
const embedCorridorInput = ref(embedCorridorId.value);
const exportCorridorSearch = ref('');
const embedFormError = ref<string | null>(null);
const exportFormError = ref<string | null>(null);

const normalizeCorridorId = (value: string) => value.toUpperCase().trim();

const isCorridorId = (value: string) => CORRIDOR_ID_PATTERN.test(normalizeCorridorId(value));

const selectedExportCorridorIds = computed({
  get: () => exportCorridorIds.value,
  set: (next: string[]) => {
    exportCorridorIdsText.value = next.join('\n');
  },
});

const selectedExportCorridorIdSet = computed(() => new Set(selectedExportCorridorIds.value));

const apiKeyUsageLabel = computed(() => `${activeApiKeyCount.value}/${maxApiKeys.value}`);
const activePublishedEmbedCount = computed(
  () => publishedEmbeds.value.filter(embed => !embed.revokedAt).length
);
const corridorCatalogCount = computed(() => corridors.value.length);

const normalizedEmbedCorridorInput = computed(() => normalizeCorridorId(embedCorridorInput.value));
const manualEmbedCorridorId = computed(() =>
  isCorridorId(embedCorridorInput.value) ? normalizedEmbedCorridorInput.value : ''
);

const selectedEmbedCorridor = computed(
  () =>
    corridors.value.find(
      corridor => corridor.corridorId === normalizeCorridorId(embedCorridorId.value)
    ) ?? null
);

const embedCorridorCandidates = computed(() => {
  const query = embedCorridorInput.value.trim().toLowerCase();
  if (!query) return corridors.value.slice(0, 8);

  return corridors.value
    .filter(corridor => {
      const searchable = [
        corridor.corridorId,
        corridor.sourceCountry,
        corridor.destCountry,
        corridor.sourceCurrency,
        corridor.destCurrency,
        `${corridor.sourceCountry} ${corridor.destCountry}`,
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    })
    .slice(0, 8);
});

const exportCorridorCandidates = computed(() => {
  const query = exportCorridorSearch.value.trim().toLowerCase();
  const available = corridors.value.filter(
    corridor => !selectedExportCorridorIdSet.value.has(corridor.corridorId)
  );

  if (!query) return available.slice(0, 8);

  return available
    .filter(corridor => {
      const searchable = [
        corridor.corridorId,
        corridor.sourceCountry,
        corridor.destCountry,
        corridor.sourceCurrency,
        corridor.destCurrency,
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    })
    .slice(0, 8);
});

const manualExportCorridorId = computed(() => {
  const normalized = normalizeCorridorId(exportCorridorSearch.value);
  if (!isCorridorId(normalized)) return '';
  return selectedExportCorridorIdSet.value.has(normalized) ? '' : normalized;
});

const selectedExportCorridors = computed(() =>
  selectedExportCorridorIds.value.map(corridorId => {
    const known = corridors.value.find(item => item.corridorId === corridorId);
    return (
      known ?? {
        corridorId,
        sourceCountry: corridorId.split('-')[0] || 'Manual',
        destCountry: corridorId.split('-')[1] || 'Entry',
        sourceCurrency: corridorId.split('-')[2] || '—',
        destCurrency: corridorId.split('-')[3] || '—',
        dataTier: 2,
        exportCadenceMinutes: 180,
        collectionCadenceMinutes: 180,
        collectionTier: 'tier_2' as const,
        isUsdOrigin: false,
        dataPoints: 0,
        lastUpdated: null,
      }
    );
  })
);

const delayedExportJobs = computed(() =>
  exportJobs.value.filter(job => {
    const ageMinutes = getJobAgeMinutes(job.createdAt);
    return (
      ['queued', 'running'].includes(job.status) &&
      ageMinutes !== null &&
      ageMinutes >= EXPORT_DELAY_THRESHOLD_MINUTES
    );
  })
);

const enterpriseNotices = computed<EnterpriseNotice[]>(() => {
  const notices: EnterpriseNotice[] = [];

  if (publishedEmbedsError.value || embedPublishedError.value) {
    notices.push({
      tone: 'danger',
      title: 'Embed publishing is degraded',
      body:
        embedPublishedError.value ||
        publishedEmbedsError.value ||
        'Published embeds are failing on this environment. Treat the embed section as degraded until the storage layer is restored.',
    });
  }

  if (delayedExportJobs.value.length > 0) {
    notices.push({
      tone: 'warning',
      title: 'Export processing is delayed',
      body: `${delayedExportJobs.value.length} export job${delayedExportJobs.value.length === 1 ? '' : 's'} ha${delayedExportJobs.value.length === 1 ? 's' : 've'} been queued for more than ${EXPORT_DELAY_THRESHOLD_MINUTES} minutes. Export creation works, but delivery is not healthy on this environment.`,
    });
  }

  if (corridorsError.value) {
    notices.push({
      tone: 'warning',
      title: 'Corridor catalog unavailable',
      body: corridorsError.value,
    });
  }

  if (!apiAccess.value) {
    notices.push({
      tone: 'info',
      title: 'API access is not enabled',
      body: 'The enterprise dashboard can still show billing and export entitlements, but direct API features are locked until API access is enabled for this account.',
    });
  }

  return notices;
});

const effectiveEmbedError = computed(() => embedFormError.value || embedPublishedError.value);
const effectiveExportError = computed(() => exportFormError.value || exportJobsError.value);

watch(
  () => embedCorridorId.value,
  value => {
    if (normalizeCorridorId(embedCorridorInput.value) !== normalizeCorridorId(value)) {
      embedCorridorInput.value = value;
    }
  },
  { immediate: true }
);

function setEmbedPreviewFrame(
  key: EmbedVisualKey,
  frame: Element | ComponentPublicInstance | null
) {
  embedPreviewFrames.value[key] = frame instanceof HTMLIFrameElement ? frame : null;
}

function corridorSubtitle(corridor: EnterpriseCorridorRecord) {
  return `${corridor.sourceCurrency}/${corridor.destCurrency} • Tier ${corridor.dataTier} • ${formatCadence(corridor.exportCadenceMinutes)}`;
}

function corridorTitle(corridor: EnterpriseCorridorRecord) {
  return `${corridor.sourceCountry} → ${corridor.destCountry}`;
}

function formatCadence(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return 'Unknown cadence';
  if (minutes < 60) return `${minutes} min cadence`;
  if (minutes % 60 === 0) return `${minutes / 60} hr cadence`;
  return `${minutes} min cadence`;
}

function formatJobAgeMinutes(createdAt: string) {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;
  return Math.floor((Date.now() - created.getTime()) / 60_000);
}

function getJobAgeMinutes(createdAt: string) {
  return formatJobAgeMinutes(createdAt);
}

function formatJobAgeLabel(createdAt: string) {
  const ageMinutes = formatJobAgeMinutes(createdAt);
  if (ageMinutes === null) return 'Created recently';
  if (ageMinutes < 1) return 'Created just now';
  if (ageMinutes < 60) return `Queued ${ageMinutes} min ago`;
  const ageHours = Math.floor(ageMinutes / 60);
  if (ageHours < 24) return `Queued ${ageHours}h ago`;
  return `Queued ${formatRelativeTime(createdAt)}`;
}

function formatExportJobType(jobType: string) {
  return EXPORT_JOB_TYPE_LABELS[jobType] || jobType.replace(/_/g, ' ');
}

function getMethodProfileLabel(methodProfile: string) {
  return METHOD_PROFILE_LABELS[methodProfile] || methodProfile;
}

function getNoticeClasses(tone: NoticeTone) {
  if (tone === 'danger') {
    return 'border-danger-200 bg-danger-50 text-danger-900';
  }
  if (tone === 'warning') {
    return 'border-warning-200 bg-warning-50 text-warning-900';
  }
  return 'border-brand-100 bg-brand-50 text-brand-900';
}

function getNoticeIcon(tone: NoticeTone) {
  if (tone === 'danger') return 'exclamation-triangle';
  if (tone === 'warning') return 'clock';
  return 'info';
}

function isDelayedJob(job: { status: string; createdAt: string }) {
  const ageMinutes = getJobAgeMinutes(job.createdAt);
  return (
    ['queued', 'running'].includes(job.status) &&
    ageMinutes !== null &&
    ageMinutes >= EXPORT_DELAY_THRESHOLD_MINUTES
  );
}

function selectEmbedCorridor(corridorId: string) {
  embedCorridorId.value = corridorId;
  embedCorridorInput.value = corridorId;
  embedFormError.value = null;
}

function addExportCorridor(corridorId: string) {
  selectedExportCorridorIds.value = [...selectedExportCorridorIds.value, corridorId];
  exportCorridorSearch.value = '';
  exportFormError.value = null;
}

function removeExportCorridor(corridorId: string) {
  selectedExportCorridorIds.value = selectedExportCorridorIds.value.filter(id => id !== corridorId);
}

function useEmbedCorridorForExport() {
  if (
    !manualEmbedCorridorId.value ||
    selectedExportCorridorIdSet.value.has(manualEmbedCorridorId.value)
  ) {
    return;
  }
  addExportCorridor(manualEmbedCorridorId.value);
}

async function handlePublishEmbed() {
  embedFormError.value = null;
  const normalized = manualEmbedCorridorId.value;
  if (!normalized) {
    embedFormError.value =
      'Choose a corridor from the catalog or enter a valid corridor ID like US-PH-USD-PHP.';
    return;
  }

  embedCorridorId.value = normalized;
  await publishEmbed();
}

async function handleCreateExport() {
  exportFormError.value = null;

  if (exportJobType.value === 'indices' && selectedExportCorridorIds.value.length === 0) {
    exportFormError.value = 'Add at least one corridor for TEER / RCI / RVI exports.';
    return;
  }

  await createExportJob();
}

function commitEmbedSearch() {
  if (embedCorridorCandidates.value.length > 0) {
    selectEmbedCorridor(embedCorridorCandidates.value[0].corridorId);
    return;
  }

  if (manualEmbedCorridorId.value) {
    selectEmbedCorridor(manualEmbedCorridorId.value);
  }
}

function commitExportSearch() {
  if (exportCorridorCandidates.value.length > 0) {
    addExportCorridor(exportCorridorCandidates.value[0].corridorId);
    return;
  }

  if (manualExportCorridorId.value) {
    addExportCorridor(manualExportCorridorId.value);
  }
}

async function fetchCorridors() {
  if (!apiAccess.value || corridorsLoading.value) return;

  corridorsLoading.value = true;
  corridorsError.value = null;
  try {
    const response = await request<EnterpriseCorridorResponse>('/indices/corridors');
    corridors.value = Array.isArray(response.corridors) ? response.corridors : [];
  } catch {
    corridorsError.value =
      'The corridor picker could not load. You can still enter corridor IDs manually.';
  } finally {
    corridorsLoading.value = false;
  }
}

async function downloadEmbedVisual(
  key: EmbedVisualKey,
  label: string,
  format: ChartVisualExportFormat
) {
  const frame = embedPreviewFrames.value[key];
  embedVisualErrors.value[key] = null;

  if (!frame) {
    embedVisualErrors.value[key] = 'Publish a static embed before downloading visual exports.';
    return;
  }

  activeVisualExportKey.value = key;
  activeVisualExportFormat.value = format;

  try {
    await exportVisual(frame, {
      filename: `remit-scout-${key}-${normalizeCorridorId(embedCorridorId.value).toLowerCase()}-${embedTheme.value}`,
      title: `${label} Published Embed`,
      format,
    });
  } catch (error) {
    embedVisualErrors.value[key] =
      error instanceof Error ? error.message : 'Unable to generate visual export.';
  } finally {
    activeVisualExportKey.value = null;
    activeVisualExportFormat.value = null;
  }
}

const copyPublishedUrl = async (publicUrl: string, label: string) => {
  await copyPublishedValue(
    publicUrl,
    `${label} URL copied.`,
    'No published URL available to copy.'
  );
};

const copyPublishedCode = async (embedCode: string, label: string) => {
  await copyPublishedValue(
    embedCode,
    `${label} embed code copied.`,
    'No embed code available to copy.'
  );
};

onMounted(() => {
  void fetchApiKeys();
  void fetchExportJobs();
  void fetchPublishedEmbeds();
  void fetchCorridors();
});
</script>

<template>
  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-2xl border border-rs-border bg-gradient-to-br from-neutral-950 via-neutral-900 to-brand-950 text-white shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:p-8">
        <div class="space-y-4">
          <div
            class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70"
          >
            <Icon name="building-library" :size="16" class="text-current" />
            Enterprise
          </div>
          <div class="space-y-2">
            <h2 class="text-h4 font-semibold text-white">Enterprise Data Console</h2>
            <p class="text-body-sm text-white/72 max-w-2xl leading-6">
              Manage API access, publish static TEER / RCI / RVI embeds, and build export jobs from
              a real corridor catalog instead of raw IDs. When staging is degraded, this surface now
              says so instead of pretending everything is healthy.
            </p>
          </div>
          <div class="text-body-sm flex flex-wrap gap-3 text-white/80">
            <div class="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              Tier {{ apiTier || 2 }} API access
            </div>
            <div class="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              {{ apiRateLimitRpm ?? 600 }} req/min
            </div>
            <div class="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              Exports window {{ exportWindowLimitDays }} days
            </div>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="bg-white/6 rounded-2xl border border-white/10 p-4 backdrop-blur-sm">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
              API Keys
            </div>
            <div class="text-h4 mt-2 font-semibold text-white">{{ apiKeyUsageLabel }}</div>
            <div class="text-body-sm text-white/68 mt-1">Active keys vs account cap</div>
          </div>
          <div class="bg-white/6 rounded-2xl border border-white/10 p-4 backdrop-blur-sm">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Published Embeds
            </div>
            <div class="text-h4 mt-2 font-semibold text-white">{{ activePublishedEmbedCount }}</div>
            <div class="text-body-sm text-white/68 mt-1">Active public embed bundles</div>
          </div>
          <div class="bg-white/6 rounded-2xl border border-white/10 p-4 backdrop-blur-sm">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Corridor Catalog
            </div>
            <div class="text-h4 mt-2 font-semibold text-white">{{ corridorCatalogCount }}</div>
            <div class="text-body-sm text-white/68 mt-1">Available corridor suggestions</div>
          </div>
          <div class="bg-white/6 rounded-2xl border border-white/10 p-4 backdrop-blur-sm">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Export Queue
            </div>
            <div class="text-h4 mt-2 font-semibold text-white">{{ delayedExportJobs.length }}</div>
            <div class="text-body-sm text-white/68 mt-1">Delayed jobs over 15 minutes</div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="enterpriseNotices.length > 0" class="space-y-3">
      <div
        v-for="notice in enterpriseNotices"
        :key="`${notice.tone}-${notice.title}`"
        class="rounded-xl border px-4 py-3"
        :class="getNoticeClasses(notice.tone)"
      >
        <div class="flex items-start gap-3">
          <div class="mt-0.5 rounded-full bg-white/60 p-1">
            <Icon :name="getNoticeIcon(notice.tone)" :size="16" class="text-current" />
          </div>
          <div>
            <div class="text-body-sm font-semibold">{{ notice.title }}</div>
            <p class="text-body-sm mt-1 leading-6">
              {{ notice.body }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <section class="space-y-5 rounded-2xl border border-rs-border bg-surface p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 class="text-body-lg font-semibold text-rs-fg">API Access</h3>
            <p class="text-body-sm mt-1 text-rs-muted">
              Issue scoped keys for server-to-server access. Tokens are only shown once, rotation is
              immediate, and revoked keys stop working without waiting for a deploy.
            </p>
          </div>
          <button
            type="button"
            class="text-body-sm inline-flex items-center gap-2 rounded-full border border-rs-border px-3 py-1.5 font-semibold text-rs-fg transition-colors hover:border-brand-200 hover:text-brand-700 disabled:opacity-60"
            :disabled="apiKeysLoading || !apiAccess"
            @click="fetchApiKeys"
          >
            <Icon name="arrows-right-left" :size="16" class="text-current" />
            Refresh
          </button>
        </div>

        <div
          class="grid gap-3 rounded-2xl border border-rs-border bg-neutral-50 p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
        >
          <div class="space-y-3">
            <div class="flex flex-wrap gap-2 text-[11px] text-rs-muted">
              <span class="rounded-full bg-surface px-2.5 py-1 font-semibold text-rs-fg">
                {{ activeApiKeyCount }}/{{ maxApiKeys }} keys used
              </span>
              <span class="rounded-full bg-surface px-2.5 py-1 font-semibold text-rs-fg">
                {{ apiRateLimitRpm ?? 600 }} req/min
              </span>
              <span class="rounded-full bg-surface px-2.5 py-1 font-semibold text-rs-fg">
                Tier {{ apiTier || 2 }}
              </span>
            </div>
            <input
              v-model="apiKeyName"
              type="text"
              placeholder="Key name"
              class="text-body-sm w-full rounded-xl border border-rs-border bg-surface px-3 py-2.5 text-rs-fg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <div class="flex flex-wrap gap-2">
              <label
                v-for="scope in availableScopes"
                :key="scope.value"
                class="text-body-sm inline-flex cursor-pointer items-center gap-2 rounded-full border border-rs-border bg-surface px-3 py-1.5 text-rs-fg transition-colors hover:border-brand-200"
              >
                <input
                  v-model="apiKeyScopes"
                  type="checkbox"
                  :value="scope.value"
                  class="rounded border-rs-border text-brand-600 focus:ring-brand-200"
                />
                <span class="font-mono text-[11px]">{{ scope.value }}</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            class="text-body-sm inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            :disabled="apiKeysLoading || !apiAccess"
            @click="createEnterpriseApiKey"
          >
            Create key
          </button>
        </div>

        <p v-if="apiKeysError" class="text-body-sm text-danger-600">
          {{ apiKeysError }}
        </p>

        <div
          v-if="apiKeyToken"
          class="rounded-2xl border border-success-200 bg-success-50 p-4 text-success-900"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="text-body-sm font-semibold">New token issued</div>
              <p class="mt-1 text-[11px] text-success-700">
                Save this now. For security, the full token is not shown again.
              </p>
            </div>
            <button
              type="button"
              class="text-body-sm font-semibold text-success-700 hover:text-success-800"
              @click="copyApiKeyToken"
            >
              Copy token
            </button>
          </div>
          <div
            class="mt-3 break-all rounded-xl border border-success-200 bg-white/70 px-3 py-3 font-mono text-[11px] text-success-900"
          >
            {{ apiKeyToken }}
          </div>
          <div
            v-if="apiKeyTokenLabel || apiKeyCopyStatus"
            class="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-success-700"
          >
            <span v-if="apiKeyTokenLabel">Prefix {{ apiKeyTokenLabel }}</span>
            <span v-if="apiKeyCopyStatus">{{ apiKeyCopyStatus }}</span>
          </div>
        </div>

        <DataTable
          variant="consumer"
          caption="API keys"
          :columns="apiKeyTableColumns"
          :rows="apiKeys"
          :row-key="apiKeyTableRowKey"
          :loading="apiKeysLoading"
          :empty="{ title: 'No API keys yet', message: 'Create a key to get started.' }"
        >
          <template #cell-name="{ row }">
            <span class="text-rs-fg">{{ apiKeyFromRow(row).name || 'Untitled' }}</span>
          </template>

          <template #cell-key_prefix="{ row }">
            <span class="text-body-sm font-mono text-neutral-600">
              {{ apiKeyFromRow(row).key_prefix }}••••
            </span>
          </template>

          <template #cell-scopes="{ row }">
            <span class="text-body-sm text-rs-muted">
              {{ apiKeyFromRow(row).scopes.join(', ') || '—' }}
            </span>
          </template>

          <template #cell-last_used_at="{ row }">
            <span class="text-body-sm text-rs-muted">
              {{
                apiKeyFromRow(row).last_used_at ? formatDate(apiKeyFromRow(row).last_used_at!) : '—'
              }}
            </span>
          </template>

          <template #cell-revoked_at="{ row }">
            <span
              v-if="apiKeyFromRow(row).revoked_at"
              class="text-body-sm rounded-full bg-neutral-100 px-2 py-0.5 text-rs-muted"
            >
              Revoked
            </span>
            <span
              v-else
              class="text-body-sm rounded-full bg-success-100 px-2 py-0.5 text-success-700"
            >
              Active
            </span>
          </template>

          <template #row-actions="{ row }">
            <div class="flex items-center justify-end gap-2">
              <button
                type="button"
                class="text-body-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                :disabled="apiKeysLoading || !apiAccess || Boolean(apiKeyFromRow(row).revoked_at)"
                @click="rotateEnterpriseApiKey(apiKeyFromRow(row))"
              >
                Rotate
              </button>
              <button
                v-if="!apiKeyFromRow(row).revoked_at"
                type="button"
                class="text-body-sm font-semibold text-danger-600 hover:text-danger-700 disabled:opacity-50"
                :disabled="apiKeysLoading || !apiAccess"
                @click="revokeEnterpriseApiKey(apiKeyFromRow(row))"
              >
                Revoke
              </button>
            </div>
          </template>
        </DataTable>

        <div class="rounded-2xl border border-rs-border bg-neutral-50 p-4">
          <button
            type="button"
            class="text-body-sm flex w-full items-center justify-between font-semibold text-rs-fg"
            @click="showApiReference = !showApiReference"
          >
            <span>API Reference</span>
            <Icon
              :name="showApiReference ? 'chevron-up' : 'chevron-down'"
              :size="16"
              class="text-neutral-400"
            />
          </button>

          <div v-if="showApiReference" class="mt-4 space-y-4">
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="text-body-sm rounded-xl border border-rs-border bg-surface p-3">
                <div class="text-rs-muted">Auth header</div>
                <div class="mt-1 font-mono text-[11px] text-rs-fg">X-API-Key: &lt;token&gt;</div>
              </div>
              <div class="text-body-sm rounded-xl border border-rs-border bg-surface p-3">
                <div class="text-rs-muted">Key policy</div>
                <div class="mt-1 text-rs-fg">Rotate immediately if a token is exposed.</div>
              </div>
            </div>

            <div class="rounded-xl border border-rs-border bg-surface p-4">
              <div
                class="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
              >
                Core endpoints
              </div>
              <div class="space-y-1.5 font-mono text-[11px] text-rs-fg">
                <div><span class="text-brand-600">GET</span> /api/v1/indices/series</div>
                <div><span class="text-brand-600">GET</span> /api/v1/indices/latest</div>
                <div><span class="text-brand-600">GET</span> /api/v1/indices/corridors</div>
                <div><span class="text-brand-600">GET</span> /api/v1/indices/health</div>
                <div><span class="text-success-700">POST</span> /api/v1/exports</div>
                <div><span class="text-brand-600">GET</span> /api/v1/exports</div>
                <div><span class="text-brand-600">GET</span> /api/v1/exports/:id/download</div>
                <div><span class="text-brand-600">GET</span> /api/v1/providers</div>
                <div><span class="text-brand-600">GET</span> /api/v1/quotes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-5 rounded-2xl border border-rs-border bg-surface p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 class="text-body-lg font-semibold text-rs-fg">Static Index Embeds</h3>
            <p class="text-body-sm mt-1 text-rs-muted">
              Publish durable TEER / RCI / RVI embed bundles with corridor search, clear preview
              state, and download controls for the exact rendered chart.
            </p>
          </div>
          <button
            type="button"
            class="text-body-sm inline-flex items-center gap-2 rounded-full border border-rs-border px-3 py-1.5 font-semibold text-rs-fg transition-colors hover:border-brand-200 hover:text-brand-700 disabled:opacity-60"
            :disabled="publishedEmbedsLoading"
            @click="fetchPublishedEmbeds"
          >
            <Icon name="arrows-right-left" :size="16" class="text-current" />
            Refresh embeds
          </button>
        </div>

        <div class="rounded-2xl border border-rs-border bg-neutral-50 p-4">
          <div class="space-y-3">
            <div>
              <label class="text-body-sm font-semibold text-neutral-700">Corridor</label>
              <div class="mt-2">
                <input
                  v-model="embedCorridorInput"
                  type="text"
                  placeholder="Search by country, currency, or corridor ID"
                  class="text-body-sm w-full rounded-xl border border-rs-border bg-surface px-3 py-2.5 text-rs-fg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  @keydown.enter.prevent="commitEmbedSearch"
                />
              </div>
              <div
                class="mt-2 max-h-56 overflow-auto rounded-xl border border-rs-border bg-surface"
              >
                <div v-if="corridorsLoading" class="text-body-sm px-3 py-4 text-rs-muted">
                  Loading corridor catalog…
                </div>
                <button
                  v-for="corridor in embedCorridorCandidates"
                  :key="corridor.corridorId"
                  type="button"
                  class="flex w-full items-start justify-between gap-3 border-b border-rs-border px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-neutral-50"
                  @click="selectEmbedCorridor(corridor.corridorId)"
                >
                  <div>
                    <div class="text-body-sm font-semibold text-rs-fg">
                      {{ corridorTitle(corridor) }}
                    </div>
                    <div class="mt-1 text-[11px] text-rs-muted">
                      {{ corridor.corridorId }} • {{ corridorSubtitle(corridor) }}
                    </div>
                  </div>
                  <div class="text-[11px] text-rs-muted">
                    {{
                      corridor.lastUpdated
                        ? formatRelativeTime(corridor.lastUpdated)
                        : 'No recent update'
                    }}
                  </div>
                </button>
                <div
                  v-if="
                    !corridorsLoading &&
                    embedCorridorCandidates.length === 0 &&
                    !manualEmbedCorridorId
                  "
                  class="text-body-sm px-3 py-4 text-rs-muted"
                >
                  No corridor matches that search.
                </div>
              </div>
              <button
                v-if="
                  manualEmbedCorridorId &&
                  (!selectedEmbedCorridor ||
                    selectedEmbedCorridor.corridorId !== manualEmbedCorridorId)
                "
                type="button"
                class="text-body-sm mt-2 inline-flex items-center gap-2 rounded-full border border-rs-border bg-surface px-3 py-1.5 font-semibold text-rs-fg transition-colors hover:border-brand-200 hover:text-brand-700"
                @click="selectEmbedCorridor(manualEmbedCorridorId)"
              >
                Use manual corridor ID {{ manualEmbedCorridorId }}
              </button>
            </div>

            <div
              v-if="selectedEmbedCorridor || manualEmbedCorridorId"
              class="rounded-2xl border border-rs-border bg-surface p-4"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div class="text-body-sm font-semibold text-rs-fg">
                    {{
                      selectedEmbedCorridor
                        ? corridorTitle(selectedEmbedCorridor)
                        : manualEmbedCorridorId
                    }}
                  </div>
                  <div class="mt-1 text-[11px] text-rs-muted">
                    {{
                      selectedEmbedCorridor
                        ? `${selectedEmbedCorridor.corridorId} • ${corridorSubtitle(selectedEmbedCorridor)}`
                        : 'Manual corridor ID'
                    }}
                  </div>
                </div>
                <button
                  v-if="
                    exportJobType === 'indices' &&
                    manualEmbedCorridorId &&
                    !selectedExportCorridorIdSet.has(manualEmbedCorridorId)
                  "
                  type="button"
                  class="text-body-sm font-semibold text-brand-600 hover:text-brand-700"
                  @click="useEmbedCorridorForExport"
                >
                  Add to current export
                </button>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="text-body-sm font-semibold text-neutral-700">Amount bucket</label>
                <input
                  v-model.number="embedAmountBucket"
                  type="number"
                  min="1"
                  class="text-body-sm mt-2 w-full rounded-xl border border-rs-border bg-surface px-3 py-2.5 text-rs-fg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label class="text-body-sm font-semibold text-neutral-700">Method profile</label>
                <select
                  v-model="embedMethodProfile"
                  class="text-body-sm mt-2 w-full rounded-xl border border-rs-border bg-surface px-3 py-2.5 text-rs-fg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="standard_bank">Bank to bank</option>
                  <option value="standard_card">Card to bank</option>
                  <option value="cash_pickup">Cash pickup</option>
                  <option value="mobile_wallet">Mobile wallet</option>
                  <option value="airtime_topup">Airtime top-up</option>
                  <option value="card_delivery">Card delivery</option>
                  <option value="home_delivery">Home delivery</option>
                </select>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="text-body-sm font-semibold text-neutral-700"
                  >History window (days)</label
                >
                <input
                  v-model.number="embedDays"
                  type="number"
                  min="1"
                  max="365"
                  class="text-body-sm mt-2 w-full rounded-xl border border-rs-border bg-surface px-3 py-2.5 text-rs-fg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label class="text-body-sm font-semibold text-neutral-700">Theme</label>
                <select
                  v-model="embedTheme"
                  class="text-body-sm mt-2 w-full rounded-xl border border-rs-border bg-surface px-3 py-2.5 text-rs-fg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <button
                type="button"
                class="text-body-sm inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                :disabled="embedPublishedGenerating || !indicesEmbedsEnabled"
                @click="handlePublishEmbed"
              >
                {{ embedPublishedGenerating ? 'Publishing embed…' : 'Publish static embed bundle' }}
              </button>
              <span class="text-[11px] text-rs-muted">
                {{ getMethodProfileLabel(embedMethodProfile) }} • {{ embedAmountBucket }} amount
                bucket • {{ embedDays }} day window
              </span>
            </div>

            <p class="text-[11px] leading-5 text-rs-muted">
              Published embeds are immutable public snapshots. If the embed store is degraded on
              staging, this section will fail loudly instead of silently pretending nothing is
              wrong.
            </p>
          </div>
        </div>

        <p v-if="embedCopyStatus" class="text-body-sm text-success-600">
          {{ embedCopyStatus }}
        </p>
        <p v-if="effectiveEmbedError" class="text-body-sm text-danger-600">
          {{ effectiveEmbedError }}
        </p>

        <div
          v-if="embedPublishedId"
          class="rounded-2xl border border-success-200 bg-success-50 p-4 text-success-900"
        >
          <div class="text-body-sm font-semibold">Published bundle ready</div>
          <div class="mt-1 text-[11px] text-success-700">
            Published ID <span class="font-mono">{{ embedPublishedId }}</span>
          </div>
          <div v-if="embedPublishedAt" class="mt-1 text-[11px] text-success-700">
            Published {{ formatDate(embedPublishedAt) }}
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="item in embedIndices"
            :key="item.key"
            class="rounded-2xl border border-rs-border bg-neutral-50 p-4"
          >
            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-body-sm font-semibold text-rs-fg">{{ item.label }} embed</div>
                <p class="mt-1 text-[11px] text-rs-muted">
                  Static code, public URL, and rendered image export for {{ item.label }}.
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="text-body-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                  :disabled="!embedCodes[item.key]"
                  @click="copyEmbedCode(item.key)"
                >
                  Copy code
                </button>
                <button
                  v-for="format in embedVisualButtons"
                  :key="`${item.key}-${format.value}`"
                  type="button"
                  class="rounded-full border border-rs-border px-2.5 py-1 text-[11px] font-semibold text-rs-fg transition-colors hover:border-brand-200 hover:text-brand-700 disabled:opacity-50"
                  :disabled="!embedUrls[item.key] || visualExporting"
                  @click="downloadEmbedVisual(item.key, item.label, format.value)"
                >
                  {{
                    visualExporting &&
                    activeVisualExportKey === item.key &&
                    activeVisualExportFormat === format.value
                      ? `Generating ${format.label}…`
                      : format.label
                  }}
                </button>
              </div>
            </div>

            <textarea
              class="text-body-sm w-full rounded-xl border border-rs-border bg-surface px-3 py-3 font-mono text-neutral-700"
              rows="5"
              readonly
              :value="embedCodes[item.key]"
            />

            <p v-if="embedVisualErrors[item.key]" class="text-body-sm mt-2 text-danger-600">
              {{ embedVisualErrors[item.key] }}
            </p>

            <div class="mt-3">
              <div class="text-body-sm mb-2 text-rs-muted">Preview</div>
              <div
                class="overflow-hidden rounded-xl border border-rs-border bg-surface"
                style="height: 240px"
              >
                <iframe
                  v-if="embedUrls[item.key]"
                  :src="embedUrls[item.key]"
                  :ref="element => setEmbedPreviewFrame(item.key, element)"
                  class="h-full w-full"
                  loading="lazy"
                />
                <div
                  v-else
                  class="text-body-sm flex h-full items-center justify-center px-4 text-center text-rs-muted"
                >
                  Publish a static embed bundle to preview this variant.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-rs-border bg-neutral-50 p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <div class="text-body-sm font-semibold text-rs-fg">Published bundles</div>
              <p class="mt-1 text-[11px] text-rs-muted">
                Active public embed bundles. Revocation is manual and immediate.
              </p>
            </div>
          </div>

          <div
            v-if="publishedEmbedsLoading && publishedEmbeds.length === 0"
            class="text-body-sm rounded-xl border border-rs-border bg-surface px-3 py-4 text-rs-muted"
          >
            Loading published embeds…
          </div>

          <div
            v-else-if="publishedEmbeds.length === 0"
            class="text-body-sm rounded-xl border border-dashed border-rs-border bg-surface px-3 py-4 text-rs-muted"
          >
            No published embeds yet.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="embed in publishedEmbeds"
              :key="embed.id"
              class="rounded-xl border border-rs-border bg-surface p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div class="text-body-sm font-semibold text-rs-fg">{{ embed.title }}</div>
                  <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-rs-muted">
                    <span class="rounded-full bg-neutral-100 px-2 py-0.5">
                      {{ embed.surfaceKind === 'pulse' ? 'Pulse' : 'Indices' }}
                    </span>
                    <span>Published {{ formatDate(embed.publishedAt) }}</span>
                    <span>Theme {{ embed.theme }}</span>
                    <span
                      v-if="embed.revokedAt"
                      class="rounded-full bg-danger-100 px-2 py-0.5 text-danger-700"
                    >
                      Revoked {{ formatDate(embed.revokedAt) }}
                    </span>
                    <span v-else class="rounded-full bg-success-100 px-2 py-0.5 text-success-700">
                      Active
                    </span>
                  </div>
                </div>
                <button
                  v-if="!embed.revokedAt"
                  type="button"
                  class="text-body-sm font-semibold text-danger-600 hover:text-danger-700 disabled:opacity-60"
                  :disabled="publishedEmbedsLoading"
                  @click="revokePublishedEmbed(embed.id)"
                >
                  Revoke
                </button>
              </div>

              <div class="mt-3 space-y-3">
                <div
                  v-for="variant in embed.variants"
                  :key="`${embed.id}-${variant.key}`"
                  class="rounded-xl border border-rs-border bg-neutral-50 p-3"
                >
                  <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div class="text-body-sm font-semibold text-rs-fg">{{ variant.label }}</div>
                    <div class="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        class="text-body-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-60"
                        :disabled="Boolean(embed.revokedAt)"
                        @click="copyPublishedUrl(variant.publicUrl, variant.label)"
                      >
                        Copy URL
                      </button>
                      <button
                        type="button"
                        class="text-body-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-60"
                        :disabled="Boolean(embed.revokedAt)"
                        @click="copyPublishedCode(variant.embedCode, variant.label)"
                      >
                        Copy embed
                      </button>
                      <a
                        v-if="!embed.revokedAt"
                        :href="variant.publicUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-body-sm font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                  <div class="break-all font-mono text-[11px] text-rs-muted">
                    {{ variant.publicUrl }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="space-y-5 rounded-2xl border border-rs-border bg-surface p-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 class="text-body-lg font-semibold text-rs-fg">Data Exports</h3>
          <p class="text-body-sm mt-1 text-rs-muted">
            Build export jobs with a real corridor picker, clearer status copy, and visible delay
            warnings when the export pipeline is falling behind.
          </p>
        </div>
        <button
          type="button"
          class="text-body-sm inline-flex items-center gap-2 rounded-full border border-rs-border px-3 py-1.5 font-semibold text-rs-fg transition-colors hover:border-brand-200 hover:text-brand-700 disabled:opacity-60"
          :disabled="exportJobsLoading"
          @click="fetchExportJobs"
        >
          <Icon name="arrows-right-left" :size="16" class="text-current" />
          Refresh jobs
        </button>
      </div>

      <div
        class="grid gap-3 rounded-2xl border border-rs-border bg-neutral-50 p-4 lg:grid-cols-[minmax(180px,0.95fr)_minmax(140px,0.8fr)_minmax(0,1.4fr)_auto]"
      >
        <select
          v-model="exportJobType"
          class="text-body-sm w-full rounded-xl border border-rs-border bg-surface px-3 py-2.5 text-rs-fg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="history">Quote history</option>
          <option value="watchlist">Watchlist</option>
          <option value="alerts">Alerts</option>
          <option value="all">All data</option>
          <option value="indices">TEER / RCI / RVI</option>
        </select>
        <select
          v-model="exportFormat"
          class="text-body-sm w-full rounded-xl border border-rs-border bg-surface px-3 py-2.5 text-rs-fg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
          <option value="parquet">Parquet</option>
        </select>
        <div class="grid gap-3 sm:grid-cols-2">
          <input
            v-model="exportDateFrom"
            type="date"
            class="text-body-sm w-full rounded-xl border border-rs-border bg-surface px-3 py-2.5 text-rs-fg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="From"
          />
          <input
            v-model="exportDateTo"
            type="date"
            class="text-body-sm w-full rounded-xl border border-rs-border bg-surface px-3 py-2.5 text-rs-fg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="To"
          />
        </div>
        <button
          type="button"
          class="text-body-sm inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          :disabled="exportCreating || (exportJobType === 'indices' && !indicesExportsEnabled)"
          @click="handleCreateExport"
        >
          {{ exportCreating ? 'Creating…' : 'Create export' }}
        </button>
      </div>

      <div
        v-if="exportJobType === 'indices'"
        class="rounded-2xl border border-rs-border bg-neutral-50 p-4"
      >
        <div class="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div class="space-y-3">
            <div>
              <label class="text-body-sm font-semibold text-neutral-700">Add corridors</label>
              <input
                v-model="exportCorridorSearch"
                type="text"
                placeholder="Search by country, currency, or corridor ID"
                class="text-body-sm mt-2 w-full rounded-xl border border-rs-border bg-surface px-3 py-2.5 text-rs-fg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                @keydown.enter.prevent="commitExportSearch"
              />
              <button
                v-if="manualExportCorridorId"
                type="button"
                class="text-body-sm mt-2 inline-flex items-center gap-2 rounded-full border border-rs-border bg-surface px-3 py-1.5 font-semibold text-rs-fg transition-colors hover:border-brand-200 hover:text-brand-700"
                @click="addExportCorridor(manualExportCorridorId)"
              >
                Add manual corridor {{ manualExportCorridorId }}
              </button>
            </div>

            <div class="max-h-64 overflow-auto rounded-xl border border-rs-border bg-surface">
              <div v-if="corridorsLoading" class="text-body-sm px-3 py-4 text-rs-muted">
                Loading corridor catalog…
              </div>
              <button
                v-for="corridor in exportCorridorCandidates"
                :key="corridor.corridorId"
                type="button"
                class="flex w-full items-start justify-between gap-3 border-b border-rs-border px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-neutral-50"
                @click="addExportCorridor(corridor.corridorId)"
              >
                <div>
                  <div class="text-body-sm font-semibold text-rs-fg">
                    {{ corridorTitle(corridor) }}
                  </div>
                  <div class="mt-1 text-[11px] text-rs-muted">
                    {{ corridor.corridorId }} • {{ corridorSubtitle(corridor) }}
                  </div>
                </div>
                <div class="text-[11px] font-semibold text-brand-600">Add</div>
              </button>
              <div
                v-if="
                  !corridorsLoading &&
                  exportCorridorCandidates.length === 0 &&
                  !manualExportCorridorId
                "
                class="text-body-sm px-3 py-4 text-rs-muted"
              >
                No more matching corridors.
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-body-sm font-semibold text-neutral-700">Selected corridors</div>
              <div class="text-[11px] text-rs-muted">
                {{ selectedExportCorridorIds.length }} selected
              </div>
            </div>

            <div
              v-if="selectedExportCorridors.length === 0"
              class="text-body-sm rounded-xl border border-dashed border-rs-border bg-surface px-3 py-6 text-center text-rs-muted"
            >
              Add one or more corridors to export indices data.
            </div>

            <div v-else class="max-h-64 space-y-2 overflow-auto pr-1">
              <div
                v-for="corridor in selectedExportCorridors"
                :key="corridor.corridorId"
                class="rounded-xl border border-rs-border bg-surface p-3"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-body-sm font-semibold text-rs-fg">
                      {{ corridorTitle(corridor) }}
                    </div>
                    <div class="mt-1 text-[11px] text-rs-muted">
                      {{ corridor.corridorId }} • {{ corridor.sourceCurrency }}/{{
                        corridor.destCurrency
                      }}
                    </div>
                  </div>
                  <button
                    type="button"
                    class="text-body-sm font-semibold text-danger-600 hover:text-danger-700"
                    @click="removeExportCorridor(corridor.corridorId)"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 text-[11px] text-rs-muted">
        <span class="rounded-full border border-rs-border bg-neutral-50 px-2.5 py-1">
          Export window
          {{
            limits.exportsMaxDays === 'unlimited' ? exportWindowLimitDays : limits.exportsMaxDays
          }}
          day{{
            (limits.exportsMaxDays === 'unlimited'
              ? exportWindowLimitDays
              : limits.exportsMaxDays) === 1
              ? ''
              : 's'
          }}
        </span>
        <span class="rounded-full border border-rs-border bg-neutral-50 px-2.5 py-1">
          Parquet is available for enterprise export jobs
        </span>
        <span
          v-if="delayedExportJobs.length > 0"
          class="rounded-full border border-warning-200 bg-warning-50 px-2.5 py-1 text-warning-800"
        >
          Delivery delayed on this environment
        </span>
      </div>

      <p v-if="effectiveExportError" class="text-body-sm text-danger-600">
        {{ effectiveExportError }}
      </p>

      <DataTable
        variant="consumer"
        caption="Export jobs"
        :columns="exportJobTableColumns"
        :rows="exportJobs"
        :row-key="exportJobTableRowKey"
        :loading="exportJobsLoading"
        :empty="{ title: 'No exports yet', message: 'Create an export to get started.' }"
      >
        <template #cell-jobType="{ row }">
          <span class="text-rs-fg">{{ formatExportJobType(exportJobFromRow(row).jobType) }}</span>
        </template>

        <template #cell-status="{ row }">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="text-body-sm rounded-full px-2 py-0.5"
              :class="exportStatusClasses(exportJobFromRow(row).status)"
            >
              {{ exportJobFromRow(row).status }}
            </span>
            <span
              v-if="['queued', 'running'].includes(exportJobFromRow(row).status)"
              class="text-[11px] text-rs-muted"
            >
              {{ formatJobAgeLabel(exportJobFromRow(row).createdAt) }}
            </span>
            <span
              v-if="isDelayedJob(exportJobFromRow(row))"
              class="rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-semibold text-warning-800"
            >
              Delayed
            </span>
          </div>
        </template>

        <template #cell-createdAt="{ row }">
          <div class="space-y-1">
            <div class="text-body-sm text-rs-fg">
              {{ formatDate(exportJobFromRow(row).createdAt) }}
            </div>
            <div class="text-[11px] text-rs-muted">
              {{ formatRelativeTime(exportJobFromRow(row).createdAt) }}
            </div>
          </div>
        </template>

        <template #row-actions="{ row }">
          <button
            v-if="exportJobFromRow(row).status === 'done'"
            type="button"
            class="text-body-sm font-semibold text-brand-600 hover:text-brand-700"
            @click="downloadExport(exportJobFromRow(row).id)"
          >
            Download
          </button>
          <span
            v-else-if="exportJobFromRow(row).status === 'failed'"
            class="text-body-sm text-danger-600"
          >
            Failed
          </span>
          <span v-else class="text-body-sm text-neutral-400"> Pending </span>
        </template>
      </DataTable>
    </section>
  </div>
</template>
