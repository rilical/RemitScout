<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Provider Control Plane"
      subtitle="Discovery review, transactional apply, and provider certification in one operator surface."
      :loading="loading"
      :error="error"
      :meta="lastUpdated ? `Last updated: ${formatDateTime(lastUpdated)}` : undefined"
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-3">
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
            class="text-body-sm hover:bg-rs-surface-2 h-10 rounded-lg border border-rs-border bg-rs-surface px-4 font-semibold text-rs-fg disabled:opacity-60"
            :disabled="loading || runningCertification"
            @click="runCertification"
          >
            {{ runningCertification ? 'Running certification…' : 'Run certification' }}
          </button>
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
          <p class="text-caption text-rs-muted">Pending review backlog</p>
          <p class="text-h3 mt-1 font-semibold tabular-nums text-rs-fg">
            {{ formatNumber(pendingReviews.length, 0) }}
          </p>
          <p class="text-body-sm mt-2 text-rs-muted">
            {{
              pendingReviews.length
                ? `${formatNumber(pendingProvidersCount, 0)} providers waiting · oldest item ${oldestPendingLabel}`
                : 'No discovery scans are waiting for operator action.'
            }}
          </p>
        </article>

        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
          <p class="text-caption text-rs-muted">Latest scan posture</p>
          <template v-if="latestScan">
            <div class="mt-2 flex items-center gap-2">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="scanStatusClass(latestScan.status)"
              >
                {{ latestScan.status }}
              </span>
              <span class="text-body-sm font-semibold text-rs-fg">{{
                latestScan.provider_id
              }}</span>
            </div>
            <p class="text-body-sm mt-2 text-rs-muted">
              {{ formatNumber(latestScan.corridors_discovered ?? 0, 0) }} corridors ·
              {{ formatNumber(latestScan.delivery_methods_discovered ?? 0, 0) }} methods ·
              {{ formatNumber(latestScan.errors_count ?? 0, 0) }} errors
            </p>
          </template>
          <p v-else class="text-body-sm mt-2 text-rs-muted">
            No discovery scans have been recorded yet.
          </p>
        </article>

        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
          <p class="text-caption text-rs-muted">Certification posture</p>
          <template v-if="latestRun">
            <div class="mt-2 flex items-center gap-2">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="runStatusClass(latestRun.status)"
              >
                {{ latestRun.status }}
              </span>
              <span class="text-body-sm font-semibold text-rs-fg">{{ latestRun.run_id }}</span>
            </div>
            <p class="text-body-sm mt-2 text-rs-muted">
              Certified {{ formatNumber(latestRun.certified_count, 0) }} · Degraded
              {{ formatNumber(latestRun.degraded_count, 0) }} · Blocked
              {{ formatNumber(latestRun.blocked_count, 0) }}
            </p>
          </template>
          <p v-else class="text-body-sm mt-2 text-rs-muted">
            No certification runs have been recorded yet.
          </p>
        </article>

        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
          <p class="text-caption text-rs-muted">Operator readiness</p>
          <div class="mt-2 flex items-center gap-2">
            <span
              class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="readiness.badgeClass"
            >
              {{ readiness.label }}
            </span>
          </div>
          <p class="text-body-sm mt-2 text-rs-muted">{{ readiness.summary }}</p>
        </article>
      </section>

      <section class="rounded-2xl border p-6 shadow-sm" :class="readiness.panelClass">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-body-lg font-semibold text-rs-fg">Operator brief</h2>
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="readiness.badgeClass"
              >
                {{ readiness.label }}
              </span>
            </div>
            <p class="text-body-sm mt-2 text-rs-fg">{{ readiness.summary }}</p>
            <p class="text-body-sm mt-2 text-rs-muted">{{ readiness.detail }}</p>
          </div>
          <div
            class="text-body-sm rounded-xl border border-white/60 bg-white/60 px-4 py-3 text-rs-muted"
          >
            <div class="font-semibold text-rs-fg">Next checkpoint</div>
            <div class="mt-1">
              {{ nextCheckpoint }}
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-[1.15fr_1.85fr]">
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-body-lg font-semibold text-rs-fg">Pending discovery reviews</h2>
              <p class="text-body-sm text-rs-muted">Scans with unresolved review/apply state.</p>
            </div>
            <div
              class="bg-rs-surface-2 text-body-sm rounded-full px-3 py-1 font-semibold text-rs-fg"
            >
              {{ pendingReviews.length }}
            </div>
          </div>

          <div
            v-if="sectionErrors.pendingReviews"
            class="text-body-sm mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"
          >
            {{ sectionErrors.pendingReviews }}
          </div>

          <div class="mt-4 flex flex-wrap gap-3">
            <input
              v-model.trim="providerFilter"
              type="text"
              placeholder="Filter provider"
              class="text-body-sm h-10 rounded-lg border border-rs-border bg-rs-bg px-3 text-rs-fg focus:border-brand-500 focus:outline-none"
            />
            <input
              v-model.trim="certProviderIdsInput"
              type="text"
              placeholder="Certification providers (csv)"
              class="text-body-sm h-10 min-w-[14rem] rounded-lg border border-rs-border bg-rs-bg px-3 text-rs-fg focus:border-brand-500 focus:outline-none"
            />
            <select
              v-model="certMethod"
              class="text-body-sm h-10 rounded-lg border border-rs-border bg-rs-bg px-3 text-rs-fg focus:border-brand-500 focus:outline-none"
            >
              <option value="bank">Bank</option>
              <option value="cash">Cash</option>
              <option value="wallet">Wallet</option>
              <option value="airtime">Airtime</option>
              <option value="home">Home</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div class="mt-4 overflow-hidden rounded-xl border border-rs-border">
            <table class="text-body-sm min-w-full">
              <thead class="bg-rs-surface-2 text-left text-rs-muted">
                <tr>
                  <th class="px-4 py-3 font-medium">Provider</th>
                  <th class="px-4 py-3 font-medium">Review</th>
                  <th class="px-4 py-3 font-medium">Apply</th>
                  <th class="px-4 py-3 font-medium">Scan</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="scan in filteredPendingReviews"
                  :key="scan.id"
                  class="hover:bg-rs-surface-2/60 cursor-pointer border-t border-rs-border"
                  :class="selectedScan?.id === scan.id ? 'bg-brand-50/60' : ''"
                  @click="openScan(scan.id)"
                >
                  <td class="px-4 py-3 align-top">
                    <div class="font-semibold text-rs-fg">{{ scan.provider_id }}</div>
                    <div class="text-rs-muted">{{ scan.triggered_by || 'manual' }}</div>
                  </td>
                  <td class="px-4 py-3 align-top">
                    <span
                      class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                      :class="reviewBadgeClass(scan.review_status)"
                    >
                      {{ scan.review_status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 align-top">
                    <span
                      class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                      :class="applyBadgeClass(scan.apply_status)"
                    >
                      {{ scan.apply_status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 align-top text-rs-muted">
                    {{ formatDateTime(scan.completed_at || scan.started_at || scan.created_at) }}
                  </td>
                </tr>
                <tr v-if="filteredPendingReviews.length === 0">
                  <td colspan="4" class="px-4 py-8 text-center text-rs-muted">
                    {{
                      pendingReviews.length === 0
                        ? 'No pending discovery reviews.'
                        : 'No pending reviews match the current provider filter.'
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-6">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="text-body-sm font-semibold text-rs-fg">Recent scan activity</h3>
                <p class="text-caption mt-1 text-rs-muted">
                  Recent discovery results are still readable even when the review queue is empty.
                </p>
              </div>
              <div class="bg-rs-surface-2 rounded-full px-3 py-1 text-xs font-semibold text-rs-fg">
                {{ recentScans.length }}
              </div>
            </div>

            <div
              v-if="sectionErrors.recentScans"
              class="text-body-sm mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"
            >
              {{ sectionErrors.recentScans }}
            </div>

            <div v-else-if="filteredRecentScans.length > 0" class="mt-4 space-y-2">
              <button
                v-for="scan in filteredRecentScans.slice(0, 5)"
                :key="`recent:${scan.id}`"
                type="button"
                class="hover:bg-rs-surface-2 flex w-full items-start justify-between gap-3 rounded-xl border border-rs-border bg-rs-bg px-4 py-3 text-left"
                @click="openScan(scan.id)"
              >
                <div>
                  <div class="font-semibold text-rs-fg">{{ scan.provider_id }}</div>
                  <div class="text-caption mt-1 text-rs-muted">
                    {{ formatDateTime(scan.completed_at || scan.started_at || scan.created_at) }}
                  </div>
                </div>
                <div class="flex flex-wrap justify-end gap-2">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="scanStatusClass(scan.status)"
                  >
                    {{ scan.status }}
                  </span>
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="applyBadgeClass(scan.apply_status)"
                  >
                    {{ scan.apply_status }}
                  </span>
                </div>
              </button>
            </div>

            <div
              v-else
              class="mt-4 rounded-xl border border-dashed border-rs-border bg-rs-bg px-4 py-8 text-center text-rs-muted"
            >
              No recent discovery scans available.
            </div>
          </div>
        </article>

        <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-body-lg font-semibold text-rs-fg">Selected scan</h2>
              <p class="text-body-sm text-rs-muted">
                Review state is explicit. Apply is separate and retryable.
              </p>
            </div>
            <div v-if="selectedScan" class="flex flex-wrap gap-2">
              <button
                class="text-body-sm hover:bg-rs-surface-2 h-10 rounded-lg border border-rs-border bg-rs-bg px-4 font-semibold text-rs-fg disabled:opacity-60"
                :disabled="
                  actionBusy ||
                  selectedScan.review_status === 'approved' ||
                  selectedScan.apply_status === 'applied'
                "
                @click="approveSelectedScan"
              >
                Approve
              </button>
              <button
                class="text-body-sm h-10 rounded-lg bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                :disabled="
                  actionBusy ||
                  selectedScan.review_status === 'dismissed' ||
                  selectedScan.apply_status === 'applied'
                "
                @click="applySelectedScan"
              >
                Apply
              </button>
              <button
                class="text-body-sm hover:bg-rs-surface-2 h-10 rounded-lg border border-rs-border bg-rs-bg px-4 font-semibold text-rs-fg disabled:opacity-60"
                :disabled="actionBusy || selectedScan.apply_status === 'applied'"
                @click="dismissSelectedScan"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div
            v-if="actionMessage"
            class="text-body-sm mt-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-brand-800"
          >
            {{ actionMessage }}
          </div>

          <div
            v-if="sectionErrors.selectedScan"
            class="text-body-sm mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"
          >
            {{ sectionErrors.selectedScan }}
          </div>

          <div v-if="selectedScan" class="mt-4 space-y-4">
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <div class="text-xs uppercase tracking-wide text-rs-muted">Provider</div>
                <div class="text-body-lg mt-1 font-semibold text-rs-fg">
                  {{ selectedScan.provider_id }}
                </div>
              </div>
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <div class="text-xs uppercase tracking-wide text-rs-muted">Scan status</div>
                <div class="mt-1">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="scanStatusClass(selectedScan.status)"
                  >
                    {{ selectedScan.status }}
                  </span>
                </div>
              </div>
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <div class="text-xs uppercase tracking-wide text-rs-muted">Review</div>
                <div class="mt-1">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="reviewBadgeClass(selectedScan.review_status)"
                  >
                    {{ selectedScan.review_status }}
                  </span>
                </div>
              </div>
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <div class="text-xs uppercase tracking-wide text-rs-muted">Apply</div>
                <div class="mt-1">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="applyBadgeClass(selectedScan.apply_status)"
                  >
                    {{ selectedScan.apply_status }}
                  </span>
                </div>
              </div>
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <div class="text-xs uppercase tracking-wide text-rs-muted">Completed</div>
                <div class="text-body-sm mt-1 font-semibold text-rs-fg">
                  {{
                    formatDateTime(
                      selectedScan.completed_at ||
                        selectedScan.started_at ||
                        selectedScan.created_at
                    )
                  }}
                </div>
              </div>
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <div class="text-xs uppercase tracking-wide text-rs-muted">Duration</div>
                <div class="text-body-sm mt-1 font-semibold text-rs-fg">
                  {{ formatMilliseconds(selectedScan.duration_ms) }}
                </div>
              </div>
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <div class="text-xs uppercase tracking-wide text-rs-muted">Corridors found</div>
                <div class="text-body-sm mt-1 font-semibold text-rs-fg">
                  {{ formatNumber(selectedScan.corridors_discovered ?? 0, 0) }}
                </div>
              </div>
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <div class="text-xs uppercase tracking-wide text-rs-muted">Errors detected</div>
                <div class="text-body-sm mt-1 font-semibold text-rs-fg">
                  {{ formatNumber(selectedScan.errors_count ?? 0, 0) }}
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
              <h3 class="text-body-sm font-semibold text-rs-fg">Scan summary</h3>
              <p class="text-body-sm mt-2 text-rs-muted">
                Promotions {{ formatNumber(selectedScan.promotions_detected ?? 0, 0) }} · Delivery
                methods {{ formatNumber(selectedScan.delivery_methods_discovered ?? 0, 0) }} ·
                Triggered by {{ selectedScan.triggered_by || 'manual' }}
              </p>
            </div>

            <div class="grid gap-4 xl:grid-cols-2">
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <h3 class="text-body-sm font-semibold text-rs-fg">Diff evidence</h3>
                <pre
                  class="mt-3 max-h-[28rem] overflow-auto rounded-lg bg-slate-950/95 p-4 text-xs text-slate-100"
                  >{{ prettyJson(selectedScan.diff_json) }}</pre
                >
              </div>
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <h3 class="text-body-sm font-semibold text-rs-fg">Apply state</h3>
                <pre
                  class="mt-3 max-h-[28rem] overflow-auto rounded-lg bg-slate-950/95 p-4 text-xs text-slate-100"
                  >{{
                    prettyJson({
                      apply_result_json: selectedScan.apply_result_json,
                      apply_errors_json: selectedScan.apply_errors_json,
                      result_json: selectedScan.result_json,
                    })
                  }}</pre
                >
              </div>
            </div>
          </div>

          <div
            v-else
            class="mt-4 rounded-xl border border-dashed border-rs-border bg-rs-bg px-4 py-8 text-center text-rs-muted"
          >
            Select a discovery scan to review lifecycle state and evidence.
          </div>
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-[1.05fr_1.95fr]">
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-body-lg font-semibold text-rs-fg">Certification runs</h2>
              <p class="text-body-sm text-rs-muted">Canonical 24-provider certification history.</p>
            </div>
            <div
              class="bg-rs-surface-2 text-body-sm rounded-full px-3 py-1 font-semibold text-rs-fg"
            >
              {{ certificationRuns.length }}
            </div>
          </div>

          <div
            v-if="sectionErrors.runs"
            class="text-body-sm mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"
          >
            {{ sectionErrors.runs }}
          </div>

          <div class="mt-4 space-y-3">
            <button
              v-for="run in certificationRuns"
              :key="run.run_id"
              type="button"
              class="w-full rounded-xl border px-4 py-3 text-left transition-colors"
              :class="
                selectedRun?.run_id === run.run_id
                  ? 'border-brand-300 bg-brand-50'
                  : 'hover:bg-rs-surface-2 border-rs-border bg-rs-bg'
              "
              @click="openRun(run.run_id)"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <div class="font-semibold text-rs-fg">{{ run.run_id }}</div>
                  <div class="text-body-sm text-rs-muted">
                    {{ formatDateTime(run.created_at) }} · {{ run.triggered_by }}
                  </div>
                </div>
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="runStatusClass(run.status)"
                >
                  {{ run.status }}
                </span>
              </div>
              <div class="mt-2 grid grid-cols-3 gap-2 text-xs text-rs-muted">
                <div>Certified {{ run.certified_count }}</div>
                <div>Degraded {{ run.degraded_count }}</div>
                <div>Blocked {{ run.blocked_count }}</div>
              </div>
              <div class="mt-2 text-xs text-rs-muted">
                {{ run.review_only ? 'Review-only' : 'Mutating' }} ·
                {{ formatNumber(run.provider_count, 0) }} providers
              </div>
            </button>
            <div
              v-if="certificationRuns.length === 0"
              class="rounded-xl border border-dashed border-rs-border bg-rs-bg px-4 py-8 text-center text-rs-muted"
            >
              No certification runs yet.
            </div>
          </div>
        </article>

        <article class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-body-lg font-semibold text-rs-fg">Certification detail</h2>
              <p class="text-body-sm text-rs-muted">
                Providers that stay on static fallback or unresolved drift do not reach certified.
              </p>
            </div>
            <div v-if="selectedRun" class="text-body-sm grid grid-cols-3 gap-2 text-rs-muted">
              <div>Certified {{ selectedRun.certified_count }}</div>
              <div>Degraded {{ selectedRun.degraded_count }}</div>
              <div>Blocked {{ selectedRun.blocked_count }}</div>
            </div>
          </div>

          <div
            v-if="sectionErrors.selectedRun"
            class="text-body-sm mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"
          >
            {{ sectionErrors.selectedRun }}
          </div>

          <div v-if="selectedRun" class="mt-4 space-y-4">
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <div class="text-xs uppercase tracking-wide text-rs-muted">Environment</div>
                <div class="text-body-sm mt-1 font-semibold text-rs-fg">
                  {{ selectedRun.environment }}
                </div>
              </div>
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <div class="text-xs uppercase tracking-wide text-rs-muted">Execution mode</div>
                <div class="text-body-sm mt-1 font-semibold text-rs-fg">
                  {{ selectedRun.review_only ? 'Review-only' : 'Mutating' }}
                </div>
              </div>
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <div class="text-xs uppercase tracking-wide text-rs-muted">Provider count</div>
                <div class="text-body-sm mt-1 font-semibold text-rs-fg">
                  {{ formatNumber(selectedRun.provider_count, 0) }}
                </div>
              </div>
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <div class="text-xs uppercase tracking-wide text-rs-muted">Completed</div>
                <div class="text-body-sm mt-1 font-semibold text-rs-fg">
                  {{ formatDateTime(selectedRun.completed_at || selectedRun.created_at) }}
                </div>
              </div>
              <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
                <div class="text-xs uppercase tracking-wide text-rs-muted">Duration</div>
                <div class="text-body-sm mt-1 font-semibold text-rs-fg">
                  {{ certificationDurationLabel }}
                </div>
              </div>
            </div>

            <div class="overflow-hidden rounded-xl border border-rs-border">
              <table class="text-body-sm min-w-full">
                <thead class="bg-rs-surface-2 text-left text-rs-muted">
                  <tr>
                    <th class="px-4 py-3 font-medium">Provider</th>
                    <th class="px-4 py-3 font-medium">Status</th>
                    <th class="px-4 py-3 font-medium">Evidence lane</th>
                    <th class="px-4 py-3 font-medium">Drift reasons</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="result in selectedRunResults"
                    :key="`${selectedRun.run_id}:${result.provider_id}`"
                    class="border-t border-rs-border align-top"
                  >
                    <td class="px-4 py-3">
                      <div class="font-semibold text-rs-fg">{{ result.provider_id }}</div>
                      <div class="text-xs text-rs-muted">{{ result.summary }}</div>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                        :class="runStatusClass(result.status)"
                      >
                        {{ result.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-rs-fg">{{ result.evidence_lane }}</td>
                    <td class="px-4 py-3 text-rs-muted">
                      {{ result.drift_reasons?.length ? result.drift_reasons.join(', ') : 'clean' }}
                    </td>
                  </tr>
                  <tr v-if="selectedRunResults.length === 0">
                    <td colspan="4" class="px-4 py-8 text-center text-rs-muted">
                      No provider outcomes recorded for this run yet.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div
            v-else
            class="mt-4 rounded-xl border border-dashed border-rs-border bg-rs-bg px-4 py-8 text-center text-rs-muted"
          >
            Select a certification run to inspect provider outcomes.
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  approveDiscoveryReview,
  applyDiscoveryReview,
  dismissDiscoveryReview,
  getDiscoveryCertificationRun,
  getDiscoveryScan,
  listDiscoveryCertificationRuns,
  listDiscoveryScans,
  listPendingDiscoveryReviews,
  triggerDiscoveryCertification,
  type AdminDiscoveryCertificationResult,
  type AdminDiscoveryCertificationRun,
  type AdminDiscoveryScanDetail,
  type AdminDiscoveryScanSummary,
} from '~/lib/opsApi';

type SectionErrorState = {
  pendingReviews: string | null;
  recentScans: string | null;
  runs: string | null;
  selectedScan: string | null;
  selectedRun: string | null;
};

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' });

useAdminPage({
  title: 'Provider Control Plane | Remit-Scout',
  description:
    'Operator workflow for discovery review, transactional apply, and provider certification.',
});

const { formatDateTime, formatDuration, formatNumber } = useAdminFormat();

const loading = ref(false);
const error = ref<string | null>(null);
const actionMessage = ref<string | null>(null);
const lastUpdated = ref<string | null>(null);
const actionBusy = ref(false);
const runningCertification = ref(false);
const autoRefresh = ref(false);
const countdown = ref(60);
const providerFilter = ref('');
const certProviderIdsInput = ref('');
const certMethod = ref<'bank' | 'cash' | 'wallet' | 'airtime' | 'home' | 'card'>('bank');

const pendingReviews = ref<AdminDiscoveryScanSummary[]>([]);
const recentScans = ref<AdminDiscoveryScanSummary[]>([]);
const selectedScan = ref<AdminDiscoveryScanDetail | null>(null);
const certificationRuns = ref<AdminDiscoveryCertificationRun[]>([]);
const selectedRun = ref<AdminDiscoveryCertificationRun | null>(null);
const selectedRunResults = ref<AdminDiscoveryCertificationResult[]>([]);

const sectionErrors = reactive<SectionErrorState>({
  pendingReviews: null,
  recentScans: null,
  runs: null,
  selectedScan: null,
  selectedRun: null,
});

let timer: ReturnType<typeof setInterval> | null = null;

const getErrorMessage = (cause: unknown, fallback: string) =>
  cause instanceof Error
    ? cause.message
    : typeof cause === 'object' &&
        cause !== null &&
        'message' in cause &&
        typeof cause.message === 'string'
      ? cause.message
      : fallback;

const toTimestamp = (value: string | null | undefined) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const ageSecondsFromNow = (value: string | null | undefined) => {
  const timestamp = toTimestamp(value);
  if (timestamp === null) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
};

const formatAge = (value: string | null | undefined) => {
  const seconds = ageSecondsFromNow(value);
  return seconds == null ? '—' : formatDuration(seconds);
};

const formatMilliseconds = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value < 1000) return `${Math.max(0, Math.round(value))}ms`;
  return `${formatNumber(value / 1000, 1)}s`;
};

const durationSecondsBetween = (
  startedAt: string | null | undefined,
  completedAt: string | null | undefined
) => {
  const started = toTimestamp(startedAt);
  const completed = toTimestamp(completedAt);
  if (started == null || completed == null || completed < started) return null;
  return Math.floor((completed - started) / 1000);
};

const clearSectionErrors = (...keys: Array<keyof SectionErrorState>) => {
  for (const key of keys) {
    sectionErrors[key] = null;
  }
};

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

const filteredPendingReviews = computed(() => {
  const token = providerFilter.value.trim().toLowerCase();
  if (!token) return pendingReviews.value;
  return pendingReviews.value.filter(scan => scan.provider_id.toLowerCase().includes(token));
});

const filteredRecentScans = computed(() => {
  const token = providerFilter.value.trim().toLowerCase();
  if (!token) return recentScans.value;
  return recentScans.value.filter(scan => scan.provider_id.toLowerCase().includes(token));
});

const pendingProvidersCount = computed(
  () => new Set(pendingReviews.value.map(scan => scan.provider_id)).size
);

const oldestPendingLabel = computed(() => {
  const oldestSeconds = pendingReviews.value.reduce<number | null>((oldest, scan) => {
    const age = ageSecondsFromNow(scan.completed_at || scan.started_at || scan.created_at);
    if (age == null) return oldest;
    return oldest == null ? age : Math.max(oldest, age);
  }, null);

  return oldestSeconds == null ? '—' : formatDuration(oldestSeconds);
});

const latestScan = computed(() => recentScans.value[0] ?? pendingReviews.value[0] ?? null);
const latestRun = computed(() => certificationRuns.value[0] ?? null);

const readiness = computed(() => {
  const primaryFailures = [
    sectionErrors.pendingReviews,
    sectionErrors.recentScans,
    sectionErrors.runs,
  ].filter(Boolean).length;

  if (primaryFailures > 0) {
    return {
      label: 'Degraded',
      summary: `${primaryFailures} control-plane data feed${primaryFailures === 1 ? '' : 's'} failed to refresh.`,
      detail:
        'Keep working from the visible panels, but verify Plane A logs, DB health, and recent migrations before you trust the missing sections.',
      panelClass: 'border-amber-200 bg-amber-50',
      badgeClass: 'bg-amber-100 text-amber-800',
    };
  }

  if (pendingReviews.value.length > 0) {
    return {
      label: 'Action required',
      summary: `${formatNumber(pendingReviews.value.length, 0)} discovery scan${pendingReviews.value.length === 1 ? '' : 's'} are waiting for review or apply.`,
      detail:
        'Prioritize the oldest unresolved scan, then run review-only certification to confirm the provider can stay off static fallback.',
      panelClass: 'border-amber-200 bg-amber-50',
      badgeClass: 'bg-amber-100 text-amber-800',
    };
  }

  if (
    latestRun.value &&
    (latestRun.value.blocked_count > 0 || latestRun.value.degraded_count > 0)
  ) {
    return {
      label: 'Watch',
      summary: 'The latest certification run still contains degraded or blocked providers.',
      detail:
        'Open the most recent run and confirm every blocked provider has explicit drift reasons and operator follow-up.',
      panelClass: 'border-sky-200 bg-sky-50',
      badgeClass: 'bg-sky-100 text-sky-700',
    };
  }

  if (!latestScan.value && !latestRun.value) {
    return {
      label: 'Awaiting signal',
      summary: 'Discovery routes are reachable, but no scans or certification evidence exist yet.',
      detail:
        'This is acceptable in a fresh environment. If staging should be exercised, trigger a review-only certification run and confirm the first scan lands.',
      panelClass: 'border-slate-200 bg-slate-50',
      badgeClass: 'bg-slate-200 text-slate-700',
    };
  }

  return {
    label: 'Healthy',
    summary: 'Discovery review, scan history, and provider certification are all reachable.',
    detail:
      'Use this control plane to inspect drift before promotion and keep review/apply state explicit for every provider.',
    panelClass: 'border-emerald-200 bg-emerald-50',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  };
});

const nextCheckpoint = computed(() => {
  if (pendingReviews.value.length > 0) {
    const next = pendingReviews.value[0];
    return `${next.provider_id} is next in queue. Review status is ${next.review_status} and apply status is ${next.apply_status}.`;
  }
  if (latestRun.value) {
    return `Latest certification run ${latestRun.value.run_id} completed ${formatAge(latestRun.value.completed_at || latestRun.value.created_at)} ago.`;
  }
  if (latestScan.value) {
    return `Latest discovery scan ${latestScan.value.id} for ${latestScan.value.provider_id} completed ${formatAge(latestScan.value.completed_at || latestScan.value.started_at || latestScan.value.created_at)} ago.`;
  }
  return 'Trigger a review-only certification run once provider discovery should be active in this environment.';
});

const certificationDurationLabel = computed(() => {
  if (!selectedRun.value) return '—';
  const seconds = durationSecondsBetween(
    selectedRun.value.created_at,
    selectedRun.value.completed_at
  );
  return seconds == null ? '—' : formatDuration(seconds);
});

const prettyJson = (value: unknown) => JSON.stringify(value ?? null, null, 2);

const reviewBadgeClass = (status: string) => {
  if (status === 'approved' || status === 'automation_approved')
    return 'bg-emerald-100 text-emerald-700';
  if (status === 'dismissed') return 'bg-slate-200 text-slate-700';
  if (status === 'not_required') return 'bg-sky-100 text-sky-700';
  return 'bg-amber-100 text-amber-700';
};

const applyBadgeClass = (status: string) => {
  if (status === 'applied') return 'bg-emerald-100 text-emerald-700';
  if (status === 'failed') return 'bg-rose-100 text-rose-700';
  if (status === 'pending_apply' || status === 'applying') return 'bg-amber-100 text-amber-700';
  if (status === 'dismissed' || status === 'not_applicable') return 'bg-slate-200 text-slate-700';
  return 'bg-sky-100 text-sky-700';
};

const runStatusClass = (status: string) => {
  if (status === 'certified' || status === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'blocked' || status === 'failed') return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
};

const scanStatusClass = (status: string) => {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'failed') return 'bg-rose-100 text-rose-700';
  if (status === 'partial') return 'bg-amber-100 text-amber-700';
  return 'bg-sky-100 text-sky-700';
};

const openScan = async (scanId: number) => {
  clearSectionErrors('selectedScan');
  try {
    const response = await getDiscoveryScan(scanId);
    selectedScan.value = response.scan;
  } catch (cause: unknown) {
    sectionErrors.selectedScan = getErrorMessage(cause, 'Failed to load discovery scan detail.');
  }
};

const openRun = async (runId: string) => {
  clearSectionErrors('selectedRun');
  try {
    const response = await getDiscoveryCertificationRun(runId);
    selectedRun.value = response.run;
    selectedRunResults.value = response.results;
  } catch (cause: unknown) {
    sectionErrors.selectedRun = getErrorMessage(cause, 'Failed to load certification run detail.');
  }
};

const load = async () => {
  if (loading.value) return;
  loading.value = true;
  error.value = null;
  clearSectionErrors('pendingReviews', 'recentScans', 'runs');

  try {
    const [pendingResult, scansResult, runsResult] = await Promise.allSettled([
      listPendingDiscoveryReviews(50),
      listDiscoveryScans({ limit: 25 }),
      listDiscoveryCertificationRuns(12),
    ]);

    if (pendingResult.status === 'fulfilled') {
      pendingReviews.value = pendingResult.value.scans;
    } else {
      sectionErrors.pendingReviews = getErrorMessage(
        pendingResult.reason,
        'Pending review queue is unavailable right now.'
      );
    }

    if (scansResult.status === 'fulfilled') {
      recentScans.value = scansResult.value.scans;
    } else {
      sectionErrors.recentScans = getErrorMessage(
        scansResult.reason,
        'Recent discovery scan history is unavailable right now.'
      );
    }

    if (runsResult.status === 'fulfilled') {
      certificationRuns.value = runsResult.value.runs;
    } else {
      sectionErrors.runs = getErrorMessage(
        runsResult.reason,
        'Certification run history is unavailable right now.'
      );
    }

    const hasRenderableData =
      pendingReviews.value.length > 0 ||
      recentScans.value.length > 0 ||
      certificationRuns.value.length > 0;

    if (
      sectionErrors.pendingReviews &&
      sectionErrors.recentScans &&
      sectionErrors.runs &&
      !hasRenderableData
    ) {
      error.value = 'Failed to load provider control plane.';
      return;
    }

    const preferredScanId =
      selectedScan.value?.id ?? pendingReviews.value[0]?.id ?? recentScans.value[0]?.id ?? null;
    if (preferredScanId != null) {
      await openScan(preferredScanId);
    } else {
      selectedScan.value = null;
      clearSectionErrors('selectedScan');
    }

    const preferredRunId = selectedRun.value?.run_id ?? certificationRuns.value[0]?.run_id ?? null;
    if (preferredRunId) {
      await openRun(preferredRunId);
    } else {
      selectedRun.value = null;
      selectedRunResults.value = [];
      clearSectionErrors('selectedRun');
    }

    lastUpdated.value = new Date().toISOString();
  } finally {
    loading.value = false;
  }
};

const mutateSelectedScan = async (operation: 'approve' | 'apply' | 'dismiss') => {
  if (!selectedScan.value || actionBusy.value) return;
  actionBusy.value = true;
  actionMessage.value = null;

  try {
    if (operation === 'approve') {
      const response = await approveDiscoveryReview(selectedScan.value.id);
      selectedScan.value = response.scan;
      actionMessage.value = `Scan ${response.scan.id} approved.`;
    } else if (operation === 'apply') {
      const response = await applyDiscoveryReview(selectedScan.value.id);
      selectedScan.value = response.scan;
      actionMessage.value = response.applied
        ? `Scan ${response.scan.id} applied.`
        : `Apply failed for scan ${response.scan.id}; retry is available.`;
    } else {
      const response = await dismissDiscoveryReview(selectedScan.value.id);
      selectedScan.value = response.scan;
      actionMessage.value = `Scan ${response.scan.id} dismissed.`;
    }

    await load();
  } catch (cause: unknown) {
    actionMessage.value = getErrorMessage(cause, 'Action failed.');
  } finally {
    actionBusy.value = false;
  }
};

const approveSelectedScan = async () => mutateSelectedScan('approve');
const applySelectedScan = async () => mutateSelectedScan('apply');
const dismissSelectedScan = async () => mutateSelectedScan('dismiss');

const runCertification = async () => {
  if (runningCertification.value) return;
  runningCertification.value = true;
  actionMessage.value = null;

  try {
    const providerIds = certProviderIdsInput.value
      .split(',')
      .map(entry => entry.trim().toLowerCase())
      .filter(Boolean);

    const run = await triggerDiscoveryCertification({
      providerIds: providerIds.length ? providerIds : undefined,
      method: certMethod.value,
      reviewOnly: true,
    });

    actionMessage.value = `Certification run ${run.run_id} completed with status ${run.status}.`;
    await load();
    await openRun(run.run_id);
  } catch (cause: unknown) {
    actionMessage.value = getErrorMessage(cause, 'Certification run failed.');
  } finally {
    runningCertification.value = false;
  }
};

onMounted(() => {
  void load();
});
</script>
