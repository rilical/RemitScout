<script setup lang="ts">
import { onMounted, ref, type ComponentPublicInstance } from 'vue';
import { DataTable, type DataTableColumn, Icon } from '~/ui';
import { formatDate } from '~/shared/lib/format';
import { useEntitlements } from '~/composables/useEntitlements';
import { useEnterpriseApiKeys } from '~/composables/useEnterpriseApiKeys';
import { useEnterpriseEmbeds } from '~/composables/useEnterpriseEmbeds';
import { useEnterpriseExports } from '~/composables/useEnterpriseExports';
import {
  CHART_VISUAL_EXPORT_FORMATS,
  type ChartVisualExportFormat,
  useChartImageExport,
} from '~/composables/useChartImageExport';

const { apiAccess, apiTier, apiRateLimitRpm, indicesEmbedsEnabled, indicesExportsEnabled, limits } =
  useEntitlements();

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
  publishEmbed: publishEmbed,
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

type EmbedVisualKey = 'teer' | 'rci' | 'rvi_bps';

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

function setEmbedPreviewFrame(
  key: EmbedVisualKey,
  frame: Element | ComponentPublicInstance | null
) {
  embedPreviewFrames.value[key] = frame instanceof HTMLIFrameElement ? frame : null;
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
    await exportVisual(frame as HTMLIFrameElement, {
      filename: `remit-scout-${key}-${embedCorridorId.value.toLowerCase()}-${embedTheme.value}`,
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
  await copyPublishedValue(publicUrl, `${label} URL copied.`, 'No published URL available to copy.')
}

const copyPublishedCode = async (embedCode: string, label: string) => {
  await copyPublishedValue(embedCode, `${label} embed code copied.`, 'No embed code available to copy.')
}

onMounted(() => {
  void fetchApiKeys()
  void fetchExportJobs()
  void fetchPublishedEmbeds()
})
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-body-lg font-semibold text-rs-fg">Enterprise API & Embeds</h2>
        <p class="text-body-sm text-rs-muted">
          Manage API access, refresh tokens, and generate TEER/RCI/RVI embeds.
        </p>
      </div>
    </div>

    <div
      v-if="!apiAccess"
      class="text-body-sm mb-6 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-warning-800"
    >
      API access is not enabled for this account. Contact support to enable enterprise API access.
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="space-y-4 rounded-xl border border-rs-border bg-surface p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-body font-semibold text-rs-fg">API Keys</h3>
            <p class="text-body-sm text-rs-muted">Enterprise API access enabled</p>
          </div>
          <button
            type="button"
            class="text-body-sm font-semibold text-brand-600 hover:text-brand-700"
            :disabled="apiKeysLoading || !apiAccess"
            @click="fetchApiKeys"
          >
            Refresh
          </button>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <input
            v-model="apiKeyName"
            type="text"
            placeholder="Key name"
            class="text-body-sm w-full rounded-lg border border-rs-border px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          <button
            type="button"
            class="text-body-sm inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            :disabled="apiKeysLoading || !apiAccess"
            @click="createEnterpriseApiKey"
          >
            Create Key
          </button>
        </div>

        <div class="flex flex-wrap gap-3">
          <label
            v-for="scope in availableScopes"
            :key="scope.value"
            class="text-body-sm inline-flex cursor-pointer select-none items-center gap-1.5 text-neutral-700"
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

        <p v-if="apiKeysError" class="text-body-sm text-danger-600">
          {{ apiKeysError }}
        </p>

        <div
          v-if="apiKeyToken"
          class="text-body-sm rounded-lg border border-success-200 bg-success-50 px-3 py-3 text-success-800"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="font-semibold">New token (save now)</div>
            <button
              type="button"
              class="text-body-sm font-semibold text-success-600 hover:text-success-600"
              @click="copyApiKeyToken"
            >
              Copy
            </button>
          </div>
          <div class="mt-2 break-all font-mono text-[11px] text-success-600">
            {{ apiKeyToken }}
          </div>
          <div v-if="apiKeyTokenLabel" class="mt-1 text-[11px] text-success-600">
            Prefix: {{ apiKeyTokenLabel }}
          </div>
          <div v-if="apiKeyCopyStatus" class="mt-1 text-[11px] text-success-600">
            {{ apiKeyCopyStatus }}
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
            <span class="text-body-sm font-mono text-neutral-600"
              >{{ apiKeyFromRow(row).key_prefix }}••••</span
            >
          </template>

          <template #cell-scopes="{ row }">
            <span class="text-body-sm text-rs-muted">{{
              apiKeyFromRow(row).scopes.join(', ') || '—'
            }}</span>
          </template>

          <template #cell-last_used_at="{ row }">
            <span class="text-body-sm text-rs-muted">{{
              apiKeyFromRow(row).last_used_at ? formatDate(apiKeyFromRow(row).last_used_at!) : '—'
            }}</span>
          </template>

          <template #cell-revoked_at="{ row }">
            <span
              v-if="apiKeyFromRow(row).revoked_at"
              class="text-body-sm rounded-full bg-neutral-100 px-2 py-0.5 text-rs-muted"
              >Revoked</span
            >
            <span
              v-else
              class="text-body-sm rounded-full bg-success-100 px-2 py-0.5 text-success-700"
              >Active</span
            >
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
                class="text-body-sm font-semibold text-danger-600 hover:text-danger-600 disabled:opacity-50"
                :disabled="apiKeysLoading || !apiAccess"
                @click="revokeEnterpriseApiKey(apiKeyFromRow(row))"
              >
                Revoke
              </button>
            </div>
          </template>
        </DataTable>

        <div class="space-y-3 rounded-lg border border-rs-border p-4">
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
          <div v-if="showApiReference" class="text-body-sm space-y-3">
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-rs-muted">
              <span>Rate limit</span
              ><span class="font-medium text-rs-fg">{{ apiRateLimitRpm ?? 600 }} req/min</span>
              <span>Max keys</span
              ><span class="font-medium text-rs-fg">{{ activeApiKeyCount }}/{{ maxApiKeys }}</span>
              <span>API tier</span
              ><span class="font-medium text-rs-fg">Tier {{ apiTier || 2 }} (all corridors)</span>
              <span>Auth header</span
              ><span class="font-mono text-[11px] text-rs-fg">X-API-Key: &lt;token&gt;</span>
            </div>
            <div class="border-t border-rs-border pt-3">
              <div class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Endpoints
              </div>
              <div class="space-y-1 font-mono text-[11px]">
                <div>
                  <span class="text-brand-600">GET</span>
                  <span class="text-neutral-600">/api/v1/indices/series</span>
                  <span class="text-neutral-400">— Time series (TEER, RCI, RVI)</span>
                </div>
                <div>
                  <span class="text-brand-600">GET</span>
                  <span class="text-neutral-600">/api/v1/indices/latest</span>
                  <span class="text-neutral-400">— Latest index point</span>
                </div>
                <div>
                  <span class="text-brand-600">GET</span>
                  <span class="text-neutral-600">/api/v1/indices/corridors</span>
                  <span class="text-neutral-400">— Available corridors</span>
                </div>
                <div>
                  <span class="text-brand-600">GET</span>
                  <span class="text-neutral-600">/api/v1/indices/health</span>
                  <span class="text-neutral-400">— Health check</span>
                </div>
                <div>
                  <span class="text-success-700">POST</span>
                  <span class="text-neutral-600">/api/v1/exports</span>
                  <span class="text-neutral-400">— Create export</span>
                </div>
                <div>
                  <span class="text-brand-600">GET</span>
                  <span class="text-neutral-600">/api/v1/exports</span>
                  <span class="text-neutral-400">— List exports</span>
                </div>
                <div>
                  <span class="text-brand-600">GET</span>
                  <span class="text-neutral-600">/api/v1/exports/:id/download</span>
                  <span class="text-neutral-400">— Download export</span>
                </div>
                <div>
                  <span class="text-brand-600">GET</span>
                  <span class="text-neutral-600">/api/v1/providers</span>
                  <span class="text-neutral-400">— Provider list</span>
                </div>
                <div>
                  <span class="text-brand-600">GET</span>
                  <span class="text-neutral-600">/api/v1/quotes</span>
                  <span class="text-neutral-400">— Corridor quotes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4 rounded-xl border border-rs-border bg-surface p-6">
        <div>
          <h3 class="text-body font-semibold text-rs-fg">Embed Generator</h3>
          <p class="text-body-sm text-rs-muted">
            Publish durable static index embeds for your site and download the exact rendered chart
            as PNG, SVG, or PDF.
          </p>
        </div>

        <div class="grid gap-3">
          <div>
            <label class="text-body-sm font-semibold text-neutral-600">Corridor ID</label>
            <input
              v-model="embedCorridorId"
              type="text"
              class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="US-PH-USD-PHP"
            />
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="text-body-sm font-semibold text-neutral-600">Amount Bucket</label>
              <input
                v-model.number="embedAmountBucket"
                type="number"
                min="1"
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label class="text-body-sm font-semibold text-neutral-600">Method Profile</label>
              <select
                v-model="embedMethodProfile"
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border bg-surface px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="standard_bank">Bank to Bank</option>
                <option value="standard_card">Card to Bank</option>
                <option value="cash_pickup">Cash Pickup</option>
              </select>
            </div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="text-body-sm font-semibold text-neutral-600">Days</label>
              <input
                v-model.number="embedDays"
                type="number"
                min="1"
                max="365"
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label class="text-body-sm font-semibold text-neutral-600">Theme</label>
              <select
                v-model="embedTheme"
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border bg-surface px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            class="text-body-sm inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            :disabled="embedPublishedGenerating || !indicesEmbedsEnabled"
            @click="publishEmbed"
          >
            {{ embedPublishedGenerating ? 'Publishing embed…' : 'Publish Static Embed' }}
          </button>
          <p class="text-[11px] text-rs-muted">
            Enterprise-only publishing. Published embeds are immutable, durable, and remain public
            until you revoke them. Managed live widgets remain a separate integration.
          </p>
        </div>

        <div v-if="embedCopyStatus" class="text-body-sm text-success-600">
          {{ embedCopyStatus }}
        </div>

        <div v-if="embedPublishedError" class="text-body-sm text-danger-600">
          {{ embedPublishedError }}
        </div>

        <div
          v-if="embedPublishedId"
          class="text-body-sm rounded-lg border border-success-200 bg-success-50 px-3 py-3 text-success-800"
        >
          <div class="font-semibold">Published embed ready</div>
          <div class="mt-1 text-[11px] text-success-700">
            Published ID: <span class="font-mono">{{ embedPublishedId }}</span>
          </div>
          <div v-if="embedPublishedAt" class="mt-1 text-[11px] text-success-700">
            Published: {{ formatDate(embedPublishedAt) }}
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="item in embedIndices"
            :key="item.key"
            class="rounded-lg border border-rs-border p-4"
          >
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div class="text-body-sm font-semibold text-rs-fg">{{ item.label }} Embed</div>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="text-body-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                  :disabled="!embedCodes[item.key]"
                  @click="copyEmbedCode(item.key)"
                >
                  Copy
                </button>
                <button
                  v-for="format in embedVisualButtons"
                  :key="`${item.key}-${format.value}`"
                  type="button"
                  class="rounded-md border border-rs-border px-2.5 py-1 text-[11px] font-semibold text-rs-fg transition-colors hover:border-brand-200 hover:text-brand-700 disabled:opacity-50"
                  :disabled="!embedUrls[item.key] || visualExporting"
                  @click="downloadEmbedVisual(item.key, item.label, format.value)"
                >
                  {{
                    visualExporting &&
                    activeVisualExportKey === item.key &&
                    activeVisualExportFormat === format.value
                      ? `Generating ${format.label}...`
                      : format.label
                  }}
                </button>
              </div>
            </div>
            <textarea
              class="text-body-sm w-full rounded-lg border border-rs-border bg-neutral-50 px-3 py-2 font-mono text-neutral-700"
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
                class="w-full overflow-hidden rounded-lg border border-rs-border"
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
                  Publish a static embed to preview this variant.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-rs-border p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <div class="text-body-sm font-semibold text-rs-fg">Published Embeds</div>
              <p class="text-[11px] text-rs-muted">
                Durable public embeds for Pulse and indices. Revocation is manual and immediate.
              </p>
            </div>
            <button
              type="button"
              class="text-body-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-60"
              :disabled="publishedEmbedsLoading"
              @click="fetchPublishedEmbeds"
            >
              Refresh
            </button>
          </div>

          <div v-if="publishedEmbedsError" class="text-body-sm mb-3 text-danger-600">
            {{ publishedEmbedsError }}
          </div>

          <div
            v-if="publishedEmbedsLoading && publishedEmbeds.length === 0"
            class="text-body-sm rounded-lg border border-rs-border bg-neutral-50 px-3 py-4 text-rs-muted"
          >
            Loading published embeds…
          </div>

          <div
            v-else-if="publishedEmbeds.length === 0"
            class="text-body-sm rounded-lg border border-dashed border-rs-border bg-neutral-50 px-3 py-4 text-rs-muted"
          >
            No published embeds yet.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="embed in publishedEmbeds"
              :key="embed.id"
              class="rounded-lg border border-rs-border bg-neutral-50 p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div class="text-body-sm font-semibold text-rs-fg">{{ embed.title }}</div>
                  <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-rs-muted">
                    <span class="rounded-full bg-neutral-200 px-2 py-0.5 text-neutral-700">
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
                    <span
                      v-else
                      class="rounded-full bg-success-100 px-2 py-0.5 text-success-700"
                    >
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
                  class="rounded-lg border border-rs-border bg-surface p-3"
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
                        Copy Embed
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
                  <div class="text-[11px] break-all font-mono text-rs-muted">
                    {{ variant.publicUrl }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Exports -->
    <div class="mt-6 space-y-4 rounded-xl border border-rs-border bg-surface p-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-body font-semibold text-rs-fg">Data Exports</h3>
          <p class="text-body-sm text-rs-muted">
            Create and download bulk data exports in CSV, PDF, or Parquet.
          </p>
        </div>
        <button
          type="button"
          class="text-body-sm font-semibold text-brand-600 hover:text-brand-700"
          :disabled="exportJobsLoading"
          @click="fetchExportJobs"
        >
          Refresh
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-4">
        <select
          v-model="exportJobType"
          class="text-body-sm w-full rounded-lg border border-rs-border bg-surface px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="history">Quote History</option>
          <option value="watchlist">Watchlist</option>
          <option value="alerts">Alerts</option>
          <option value="all">All Data</option>
          <option value="indices">TEER / RCI / RVI</option>
        </select>
        <select
          v-model="exportFormat"
          class="text-body-sm w-full rounded-lg border border-rs-border bg-surface px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
          <option value="parquet">Parquet</option>
        </select>
        <div class="flex items-center gap-2">
          <input
            v-model="exportDateFrom"
            type="date"
            class="text-body-sm w-full rounded-lg border border-rs-border px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="From"
          />
          <span class="text-neutral-400">–</span>
          <input
            v-model="exportDateTo"
            type="date"
            class="text-body-sm w-full rounded-lg border border-rs-border px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="To"
          />
        </div>
        <button
          type="button"
          class="text-body-sm inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          :disabled="exportCreating || (exportJobType === 'indices' && !indicesExportsEnabled)"
          @click="createExportJob"
        >
          {{ exportCreating ? 'Creating…' : 'Create Export' }}
        </button>
      </div>

      <div
        v-if="exportJobType === 'indices'"
        class="rounded-lg border border-rs-border bg-neutral-50 p-4"
      >
        <label class="text-body-sm font-semibold text-neutral-600">Corridor IDs</label>
        <textarea
          v-model="exportCorridorIdsText"
          rows="4"
          class="text-body-sm mt-2 w-full rounded-lg border border-rs-border bg-surface px-3 py-2 font-mono text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          placeholder="US-PH-USD-PHP&#10;US-MX-USD-MXN"
        />
        <div
          class="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-rs-muted"
        >
          <span
            >Required for TEER / RCI / RVI exports. Use comma or newline separated corridor
            IDs.</span
          >
          <span
            >{{ exportCorridorIds.length }} corridor{{
              exportCorridorIds.length === 1 ? '' : 's'
            }}
            selected</span
          >
        </div>
      </div>

      <p class="text-[11px] text-rs-muted">
        Export range follows your backend entitlement. Current max:
        {{
          limits.exportsMaxDays === 'unlimited' ? exportWindowLimitDays : limits.exportsMaxDays
        }}
        day{{
          (limits.exportsMaxDays === 'unlimited'
            ? exportWindowLimitDays
            : limits.exportsMaxDays) === 1
            ? ''
            : 's'
        }}.
      </p>

      <p v-if="exportJobsError" class="text-body-sm text-danger-600">
        {{ exportJobsError }}
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
          <span class="capitalize text-rs-fg">{{ exportJobFromRow(row).jobType }}</span>
        </template>

        <template #cell-status="{ row }">
          <span
            class="text-body-sm rounded-full px-2 py-0.5"
            :class="exportStatusClasses(exportJobFromRow(row).status)"
            >{{ exportJobFromRow(row).status }}</span
          >
        </template>

        <template #cell-createdAt="{ row }">
          <span class="text-body-sm text-rs-muted">{{
            formatDate(exportJobFromRow(row).createdAt)
          }}</span>
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
            >Failed</span
          >
          <span v-else class="text-body-sm text-neutral-400">Pending</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>
