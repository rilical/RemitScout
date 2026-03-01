<script setup lang="ts">
import { DataTable, type DataTableColumn, Icon } from '~/ui'
import { formatDate } from '~/shared/lib/format'
import { useEntitlements } from '~/composables/useEntitlements'
import { useEnterpriseApiKeys } from '~/composables/useEnterpriseApiKeys'
import { useEnterpriseEmbeds } from '~/composables/useEnterpriseEmbeds'
import { useEnterpriseExports } from '~/composables/useEnterpriseExports'

const { apiAccess, apiTier, apiRateLimitRpm } = useEntitlements()

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
} = useEnterpriseApiKeys()

const {
  corridorId: embedCorridorId,
  amountBucket: embedAmountBucket,
  methodProfile: embedMethodProfile,
  days: embedDays,
  theme: embedTheme,
  copyStatus: embedCopyStatus,
  snapshotId: embedSnapshotId,
  snapshotExpiresAt: embedSnapshotExpiresAt,
  snapshotGenerating: embedSnapshotGenerating,
  snapshotError: embedSnapshotError,
  indices: embedIndices,
  embedUrls,
  embedCodes,
  createSnapshot: createEmbedSnapshot,
  copyEmbedCode,
} = useEnterpriseEmbeds()

const {
  jobs: exportJobs,
  loading: exportJobsLoading,
  error: exportJobsError,
  jobType: exportJobType,
  format: exportFormat,
  dateFrom: exportDateFrom,
  dateTo: exportDateTo,
  creating: exportCreating,
  columns: exportJobTableColumns,
  rowKey: exportJobTableRowKey,
  fromRow: exportJobFromRow,
  statusClasses: exportStatusClasses,
  fetchJobs: fetchExportJobs,
  createJob: createExportJob,
  downloadJob: downloadExport,
} = useEnterpriseExports()
</script>

<template>
  <div>
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <div>
        <h2 class="text-body-lg font-semibold text-rs-fg">Enterprise API & Embeds</h2>
        <p class="text-body-sm text-rs-muted">Manage API access, refresh tokens, and generate TEER/RCI/RVI embeds.</p>
      </div>
    </div>

    <div
      v-if="!apiAccess"
      class="mb-6 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-body-sm text-warning-800"
    >
      API access is not enabled for this account. Contact support to enable enterprise API access.
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="bg-surface rounded-xl border border-rs-border p-6 space-y-4">
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
            class="w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-body-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
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
            class="inline-flex items-center gap-1.5 text-body-sm text-neutral-700 cursor-pointer select-none"
          >
            <input
              v-model="apiKeyScopes"
              type="checkbox"
              :value="scope.value"
              class="rounded border-rs-border text-brand-600 focus:ring-brand-200"
            >
            <span class="font-mono text-[11px]">{{ scope.value }}</span>
          </label>
        </div>

        <p
          v-if="apiKeysError"
          class="text-body-sm text-danger-600"
        >
          {{ apiKeysError }}
        </p>

        <div
          v-if="apiKeyToken"
          class="rounded-lg border border-success-200 bg-success-50 px-3 py-3 text-body-sm text-success-800"
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
          <div
            v-if="apiKeyTokenLabel"
            class="mt-1 text-[11px] text-success-600"
          >
            Prefix: {{ apiKeyTokenLabel }}
          </div>
          <div
            v-if="apiKeyCopyStatus"
            class="mt-1 text-[11px] text-success-600"
          >
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
            <span class="font-mono text-body-sm text-neutral-600">{{ apiKeyFromRow(row).key_prefix }}••••</span>
          </template>

          <template #cell-scopes="{ row }">
            <span class="text-body-sm text-rs-muted">{{ apiKeyFromRow(row).scopes.join(', ') || '—' }}</span>
          </template>

          <template #cell-last_used_at="{ row }">
            <span class="text-body-sm text-rs-muted">{{ apiKeyFromRow(row).last_used_at ? formatDate(apiKeyFromRow(row).last_used_at!) : '—' }}</span>
          </template>

          <template #cell-revoked_at="{ row }">
            <span
              v-if="apiKeyFromRow(row).revoked_at"
              class="rounded-full bg-neutral-100 px-2 py-0.5 text-body-sm text-rs-muted"
            >Revoked</span>
            <span
              v-else
              class="rounded-full bg-success-100 px-2 py-0.5 text-body-sm text-success-700"
            >Active</span>
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

        <div class="rounded-lg border border-rs-border p-4 space-y-3">
          <button
            type="button"
            class="flex w-full items-center justify-between text-body-sm font-semibold text-rs-fg"
            @click="showApiReference = !showApiReference"
          >
            <span>API Reference</span>
            <Icon
              :name="showApiReference ? 'chevron-up' : 'chevron-down'"
              :size="16"
              class="text-neutral-400"
            />
          </button>
          <div
            v-if="showApiReference"
            class="space-y-3 text-body-sm"
          >
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-rs-muted">
              <span>Rate limit</span><span class="text-rs-fg font-medium">{{ apiRateLimitRpm ?? 600 }} req/min</span>
              <span>Max keys</span><span class="text-rs-fg font-medium">{{ activeApiKeyCount }}/{{ maxApiKeys }}</span>
              <span>API tier</span><span class="text-rs-fg font-medium">Tier {{ apiTier || 2 }} (all corridors)</span>
              <span>Auth header</span><span class="text-rs-fg font-mono text-[11px]">X-API-Key: &lt;token&gt;</span>
            </div>
            <div class="border-t border-rs-border pt-3">
              <div class="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">Endpoints</div>
              <div class="space-y-1 font-mono text-[11px]">
                <div><span class="text-brand-600">GET</span> <span class="text-neutral-600">/api/v1/indices/series</span> <span class="text-neutral-400">— Time series (TEER, RCI, RVI)</span></div>
                <div><span class="text-brand-600">GET</span> <span class="text-neutral-600">/api/v1/indices/latest</span> <span class="text-neutral-400">— Latest index point</span></div>
                <div><span class="text-brand-600">GET</span> <span class="text-neutral-600">/api/v1/indices/corridors</span> <span class="text-neutral-400">— Available corridors</span></div>
                <div><span class="text-brand-600">GET</span> <span class="text-neutral-600">/api/v1/indices/health</span> <span class="text-neutral-400">— Health check</span></div>
                <div><span class="text-success-700">POST</span> <span class="text-neutral-600">/api/v1/exports</span> <span class="text-neutral-400">— Create export</span></div>
                <div><span class="text-brand-600">GET</span> <span class="text-neutral-600">/api/v1/exports</span> <span class="text-neutral-400">— List exports</span></div>
                <div><span class="text-brand-600">GET</span> <span class="text-neutral-600">/api/v1/exports/:id/download</span> <span class="text-neutral-400">— Download export</span></div>
                <div><span class="text-brand-600">GET</span> <span class="text-neutral-600">/api/v1/providers</span> <span class="text-neutral-400">— Provider list</span></div>
                <div><span class="text-brand-600">GET</span> <span class="text-neutral-600">/api/v1/quotes</span> <span class="text-neutral-400">— Corridor quotes</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-surface rounded-xl border border-rs-border p-6 space-y-4">
        <div>
          <h3 class="text-body font-semibold text-rs-fg">Embed Generator</h3>
          <p class="text-body-sm text-rs-muted">Create shareable index charts for your site with proper citation.</p>
        </div>

        <div class="grid gap-3">
          <div>
            <label class="text-body-sm font-semibold text-neutral-600">Corridor ID</label>
            <input
              v-model="embedCorridorId"
              type="text"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="US-PH-USD-PHP"
            >
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="text-body-sm font-semibold text-neutral-600">Amount Bucket</label>
              <input
                v-model.number="embedAmountBucket"
                type="number"
                min="1"
                class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
            </div>
            <div>
              <label class="text-body-sm font-semibold text-neutral-600">Method Profile</label>
              <select
                v-model="embedMethodProfile"
                class="mt-1 w-full rounded-lg border border-rs-border bg-surface px-3 py-2 text-body-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
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
                class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
            </div>
            <div>
              <label class="text-body-sm font-semibold text-neutral-600">Theme</label>
              <select
                v-model="embedTheme"
                class="mt-1 w-full rounded-lg border border-rs-border bg-surface px-3 py-2 text-body-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-body-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
            :disabled="embedSnapshotGenerating || !apiAccess"
            @click="createEmbedSnapshot"
          >
            {{ embedSnapshotGenerating ? 'Generating snapshot…' : 'Generate Static Embeds' }}
          </button>
          <p class="text-[11px] text-rs-muted">
            Enterprise-only generator. Output is a public, static snapshot URL (no API key in embed code).
          </p>
        </div>

        <div
          v-if="embedCopyStatus"
          class="text-body-sm text-success-600"
        >
          {{ embedCopyStatus }}
        </div>

        <div
          v-if="embedSnapshotError"
          class="text-body-sm text-danger-600"
        >
          {{ embedSnapshotError }}
        </div>

        <div
          v-if="embedSnapshotId"
          class="rounded-lg border border-success-200 bg-success-50 px-3 py-3 text-body-sm text-success-800"
        >
          <div class="font-semibold">Static snapshot ready</div>
          <div class="mt-1 text-[11px] text-success-700">
            Snapshot ID: <span class="font-mono">{{ embedSnapshotId }}</span>
          </div>
          <div
            v-if="embedSnapshotExpiresAt"
            class="mt-1 text-[11px] text-success-700"
          >
            Expires: {{ formatDate(embedSnapshotExpiresAt) }}
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="item in embedIndices"
            :key="item.key"
            class="rounded-lg border border-rs-border p-4"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="text-body-sm font-semibold text-rs-fg">{{ item.label }} Embed</div>
              <button
                type="button"
                class="text-body-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                :disabled="!embedCodes[item.key]"
                @click="copyEmbedCode(item.key)"
              >
                Copy
              </button>
            </div>
            <textarea
              class="w-full rounded-lg border border-rs-border bg-neutral-50 px-3 py-2 text-body-sm font-mono text-neutral-700"
              rows="5"
              readonly
              :value="embedCodes[item.key]"
            />
            <div class="mt-3">
              <div class="text-body-sm text-rs-muted mb-2">Preview</div>
              <div
                class="w-full overflow-hidden rounded-lg border border-rs-border"
                style="height: 240px;"
              >
                <iframe
                  v-if="embedUrls[item.key]"
                  :src="embedUrls[item.key]"
                  class="h-full w-full"
                  loading="lazy"
                />
                <div
                  v-else
                  class="flex h-full items-center justify-center px-4 text-center text-body-sm text-rs-muted"
                >
                  Generate a static snapshot to preview this embed.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Exports -->
    <div class="mt-6 bg-surface rounded-xl border border-rs-border p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-body font-semibold text-rs-fg">Data Exports</h3>
          <p class="text-body-sm text-rs-muted">Create and download bulk data exports (CSV or PDF).</p>
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
          class="w-full rounded-lg border border-rs-border bg-surface px-3 py-2 text-body-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="history">Quote History</option>
          <option value="watchlist">Watchlist</option>
          <option value="alerts">Alerts</option>
          <option value="all">All Data</option>
          <option value="indices">TEER / RCI / RVI</option>
        </select>
        <select
          v-model="exportFormat"
          class="w-full rounded-lg border border-rs-border bg-surface px-3 py-2 text-body-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
        </select>
        <div class="flex items-center gap-2">
          <input
            v-model="exportDateFrom"
            type="date"
            class="w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="From"
          >
          <span class="text-neutral-400">–</span>
          <input
            v-model="exportDateTo"
            type="date"
            class="w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="To"
          >
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-body-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
          :disabled="exportCreating"
          @click="createExportJob"
        >
          {{ exportCreating ? 'Creating…' : 'Create Export' }}
        </button>
      </div>

      <p
        v-if="exportJobsError"
        class="text-body-sm text-danger-600"
      >
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
          <span class="text-rs-fg capitalize">{{ exportJobFromRow(row).jobType }}</span>
        </template>

        <template #cell-status="{ row }">
          <span
            class="rounded-full px-2 py-0.5 text-body-sm"
            :class="exportStatusClasses(exportJobFromRow(row).status)"
          >{{ exportJobFromRow(row).status }}</span>
        </template>

        <template #cell-createdAt="{ row }">
          <span class="text-body-sm text-rs-muted">{{ formatDate(exportJobFromRow(row).createdAt) }}</span>
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
          >Failed</span>
          <span
            v-else
            class="text-body-sm text-neutral-400"
          >Pending</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>
