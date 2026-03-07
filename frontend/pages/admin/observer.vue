<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <header
      class="relative overflow-hidden rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm"
    >
      <div class="absolute inset-x-0 top-0 h-1.5" :class="observerStripeClass" />
      <div
        class="absolute -left-10 top-10 h-40 w-40 rounded-full bg-brand-100/70 blur-3xl dark:bg-brand-900/20"
      />
      <div
        class="absolute right-0 top-0 h-48 w-48 rounded-full bg-amber-100/60 blur-3xl dark:bg-amber-900/10"
      />

      <div class="relative flex flex-col gap-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div class="text-caption uppercase tracking-[0.18em] text-rs-muted">
              Operations Center
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <h1 class="text-[2rem] font-semibold leading-none text-rs-fg">
                {{ observerReadinessLabel }}
              </h1>
              <span
                class="text-caption inline-flex rounded-full px-3 py-1 font-semibold uppercase tracking-[0.14em]"
                :class="observerBadgeClass"
              >
                {{ observerReadinessPill }}
              </span>
            </div>
            <p class="text-body-sm mt-3 max-w-3xl leading-6 text-rs-muted">
              {{ observerReadinessSummary }}
            </p>
          </div>

          <div class="flex flex-col gap-3">
            <label class="text-body-sm inline-flex items-center gap-2 text-rs-muted xl:justify-end">
              <input
                v-model="autoRefresh"
                type="checkbox"
                class="h-4 w-4 rounded border-rs-border text-brand-600"
              />
              Auto-refresh every 60s
            </label>
            <div class="flex flex-col gap-2 sm:flex-row xl:justify-end">
              <button
                class="text-body-sm h-10 rounded-lg border border-rs-border bg-rs-bg px-4 font-semibold text-rs-fg transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="ensuring || !isSuperAdmin"
                :title="
                  isSuperAdmin
                    ? 'Super-admin only. Status by default; type APPLY to run DDL ensure in dev.'
                    : 'Super-admin required.'
                "
                @click="ensureAuditTable"
              >
                {{ ensuring ? 'Ensuring…' : 'Ensure email audit table' }}
              </button>
              <button
                class="text-body-sm h-10 rounded-lg border border-rs-border bg-rs-bg px-4 font-semibold text-rs-fg transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="evaluating || !isSuperAdmin"
                :title="
                  isSuperAdmin
                    ? 'Super-admin only. Defaults to dry-run; type RUN to execute.'
                    : 'Super-admin required.'
                "
                @click="runAlertEvaluation"
              >
                {{ evaluating ? 'Evaluating…' : 'Run alert evaluation' }}
              </button>
              <button
                class="text-body-sm h-10 rounded-lg bg-brand-600 px-4 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="loading"
                @click="loadObserver"
              >
                {{ loading ? 'Refreshing…' : 'Refresh status' }}
              </button>
            </div>
          </div>
        </div>

        <div class="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
          <div class="space-y-4">
            <div class="flex flex-wrap gap-2">
              <span
                v-for="reason in readinessReasons"
                :key="reason"
                class="text-body-sm inline-flex rounded-full border border-rs-border bg-rs-bg px-3 py-1.5 text-rs-fg"
              >
                {{ reason }}
              </span>
              <span
                v-if="readinessReasons.length === 0"
                class="text-body-sm inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700"
              >
                No critical operator intervention is being flagged.
              </span>
            </div>

            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <article
                v-for="metric in heroMetrics"
                :key="metric.label"
                class="rounded-2xl border border-rs-border/80 bg-rs-bg/80 p-4"
              >
                <div class="flex items-center gap-2">
                  <span class="inline-flex h-2.5 w-2.5 rounded-full" :class="metric.dotClass" />
                  <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">
                    {{ metric.label }}
                  </div>
                </div>
                <div class="text-body-lg mt-3 font-semibold text-rs-fg">{{ metric.headline }}</div>
                <div class="text-body-sm mt-1 leading-6 text-rs-muted">{{ metric.detail }}</div>
              </article>
            </div>
          </div>

          <article class="rounded-2xl border border-rs-border/80 bg-rs-bg/80 p-4">
            <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">Signal Ledger</div>
            <div class="mt-4 space-y-3">
              <div
                v-for="item in signalLedgerItems"
                :key="item.label"
                class="rounded-2xl border border-rs-border bg-rs-surface px-4 py-3"
              >
                <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">
                  {{ item.label }}
                </div>
                <div class="text-body-sm mt-1 font-semibold text-rs-fg">{{ item.value }}</div>
                <div class="text-body-sm mt-1 text-rs-muted">{{ item.detail }}</div>
              </div>
            </div>
          </article>
        </div>

        <div class="text-body-sm flex flex-wrap items-center gap-3 text-rs-muted">
          <span
            >Last refresh:
            {{ lastRefresh ? formatTimestamp(lastRefresh) : 'Waiting for first refresh.' }}</span
          >
          <span v-if="observerSummary?.timestamp"
            >Observer timestamp: {{ formatTimestamp(observerSummary.timestamp) }}</span
          >
          <span v-if="providerHealthSummary?.generated_at"
            >Provider snapshot: {{ formatTimestamp(providerHealthSummary.generated_at) }}</span
          >
          <span v-if="serviceHealthResponse?.updatedAt"
            >Service health: {{ formatTimestamp(serviceHealthResponse.updatedAt) }}</span
          >
        </div>

        <div
          v-if="actionMessage"
          class="text-body-sm rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700"
        >
          {{ actionMessage }}
        </div>

        <div
          v-if="error"
          class="text-body-sm rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700"
        >
          {{ error }}
        </div>
      </div>
    </header>

    <section class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <article class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Attention Required</h2>
            <p class="text-body-sm text-rs-muted">
              Prioritized from pause state, services, queues, providers, indices, and Gold
              freshness.
            </p>
          </div>
          <span
            class="text-caption rounded-full bg-rs-bg px-3 py-1 uppercase tracking-[0.14em] text-rs-muted"
          >
            {{ attentionItems.length }} item{{ attentionItems.length === 1 ? '' : 's' }}
          </span>
        </div>

        <div class="mt-4 space-y-3">
          <div
            v-for="item in attentionItems"
            :key="item.title"
            class="rounded-2xl border p-4"
            :class="item.toneClass"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-body-sm font-semibold text-rs-fg">{{ item.title }}</div>
                <div class="text-body-sm mt-1 text-rs-muted">{{ item.detail }}</div>
              </div>

              <NuxtLink
                v-if="item.to"
                :to="item.to"
                class="border-current/15 text-body-sm inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold"
              >
                {{ item.cta }}
                <span aria-hidden="true">→</span>
              </NuxtLink>

              <a
                v-else-if="item.href"
                :href="item.href"
                target="_blank"
                rel="noopener noreferrer"
                class="border-current/15 text-body-sm inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold"
              >
                {{ item.cta }}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <div
            v-if="attentionItems.length === 0"
            class="text-body-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700"
          >
            No immediate operator action is being elevated above the rest of the board.
          </div>
        </div>
      </article>

      <article class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Immediate AWS Actions</h2>
            <p class="text-body-sm text-rs-muted">
              Open the most relevant consoles for the current failure shape instead of hunting
              manually.
            </p>
          </div>
          <span
            class="text-caption rounded-full bg-rs-bg px-3 py-1 uppercase tracking-[0.14em] text-rs-muted"
          >
            {{ immediateAwsLinks.length }} path{{ immediateAwsLinks.length === 1 ? '' : 's' }}
          </span>
        </div>

        <div class="mt-4 grid gap-3">
          <a
            v-for="link in immediateAwsLinks"
            :key="link.label"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-2xl border border-rs-border bg-rs-bg/80 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-body-sm font-semibold text-rs-fg">{{ link.label }}</div>
                <div class="text-body-sm mt-1 text-rs-muted">{{ link.description }}</div>
              </div>
              <span class="text-body-sm font-semibold text-brand-600">↗</span>
            </div>
            <div class="text-body-sm mt-3 text-rs-muted">{{ link.reason }}</div>
          </a>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <article class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Indices and Cadence</h2>
            <p class="text-body-sm text-rs-muted">
              Gold availability, sweep drift, and tier enablement for the current environment.
            </p>
          </div>
          <button
            type="button"
            class="text-body-sm rounded-full border border-rs-border bg-rs-bg px-3 py-1.5 font-semibold text-rs-fg transition-colors hover:border-brand-300 hover:bg-brand-50"
            :aria-expanded="indicesAccordionOpen"
            @click="indicesAccordionOpen = !indicesAccordionOpen"
          >
            {{ indicesAccordionOpen ? 'Collapse' : 'Expand' }}
          </button>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-rs-border bg-rs-bg/80 p-4">
            <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">
              Indices posture
            </div>
            <div class="text-body-lg mt-2 font-semibold text-rs-fg">{{ indicesHeadline }}</div>
            <div class="text-body-sm mt-1 text-rs-muted">{{ indicesDetail }}</div>
          </div>
          <div class="rounded-2xl border border-rs-border bg-rs-bg/80 p-4">
            <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">B2B cadence</div>
            <div class="text-body-lg mt-2 font-semibold text-rs-fg">{{ sweepHeadline }}</div>
            <div class="text-body-sm mt-1 text-rs-muted">{{ sweepDetail }}</div>
          </div>
        </div>

        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-[600px] opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="max-h-[600px] opacity-100"
          leave-to-class="max-h-0 opacity-0"
        >
          <div v-if="indicesAccordionOpen" class="mt-4 overflow-hidden">
            <div class="rounded-2xl border border-rs-border bg-rs-bg/60 p-4">
              <div class="grid gap-3 md:grid-cols-2">
                <div class="rounded-2xl border border-rs-border bg-rs-surface p-4">
                  <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">
                    Indices detail
                  </div>
                  <div class="text-body-sm mt-3 grid gap-2 text-rs-muted">
                    <div class="flex items-center justify-between">
                      <span>Available ratio</span>
                      <span class="font-semibold text-rs-fg">{{
                        formatPercent(indicesHealth?.summary?.available_ratio)
                      }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>Suppressed ratio</span>
                      <span class="font-semibold text-rs-fg">{{
                        formatPercent(indicesHealth?.summary?.suppressed_ratio)
                      }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>Min provider count</span>
                      <span class="font-semibold text-rs-fg">{{
                        formatAdminNumber(indicesHealth?.summary?.min_provider_count, 0)
                      }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>Latest Gold date</span>
                      <span class="font-semibold text-rs-fg">{{
                        indicesHealth?.summary?.latest_date || 'n/a'
                      }}</span>
                    </div>
                  </div>
                </div>

                <div class="rounded-2xl border border-rs-border bg-rs-surface p-4">
                  <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">
                    Sweep tiers
                  </div>
                  <div class="text-body-sm mt-3 space-y-2 text-rs-muted">
                    <div
                      v-for="tier in b2bSweepStatus?.schedule || []"
                      :key="tier.priorityTier"
                      class="flex items-center justify-between rounded-xl border border-rs-border bg-rs-bg px-3 py-2"
                    >
                      <span class="font-medium text-rs-fg">{{ tier.priorityTier }}</span>
                      <span
                        >{{ tier.providers }} providers · drift {{ tier.driftMinutes ?? 'n/a' }}m ·
                        {{ tier.anyEnabled ? 'enabled' : 'disabled' }}</span
                      >
                    </div>
                    <div
                      v-if="(b2bSweepStatus?.schedule || []).length === 0"
                      class="text-body-sm text-rs-muted"
                    >
                      No sweep status data yet.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </article>

      <article class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Provider Fleet Drill-down</h2>
            <p class="text-body-sm text-rs-muted">
              Full provider grid with corridor-level detail and stale-quote hotspots.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <NuxtLink
              to="/admin/discovery"
              class="text-body-sm rounded-full border border-rs-border bg-rs-bg px-3 py-1.5 font-semibold text-rs-fg transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              Open provider control plane
            </NuxtLink>
            <div class="text-body-sm text-rs-muted">
              {{ providerCounts.healthy }}/{{ providerCounts.total }} healthy
            </div>
          </div>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-[0.95fr_1.05fr]">
          <div class="rounded-2xl border border-rs-border bg-rs-bg/80 p-4">
            <div class="text-caption uppercase tracking-[0.14em] text-rs-muted">Fleet posture</div>
            <div class="text-body-lg mt-2 font-semibold text-rs-fg">
              {{ providerFleetHeadline }}
            </div>
            <div class="text-body-sm mt-1 text-rs-muted">{{ providerFleetDetail }}</div>
            <div class="mt-3 space-y-2">
              <div
                v-for="provider in topProviderRisks"
                :key="provider.provider_id"
                class="rounded-xl border border-rs-border bg-rs-surface px-3 py-3"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex h-2.5 w-2.5 rounded-full"
                    :class="providerStatusDot(provider)"
                  />
                  <span class="text-body-sm font-semibold text-rs-fg">{{
                    provider.display_name
                  }}</span>
                </div>
                <div class="text-body-sm mt-1 text-rs-muted">
                  {{ providerRiskDetail(provider) }}
                </div>
              </div>
              <div
                v-if="topProviderRisks.length === 0"
                class="text-body-sm rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-emerald-700"
              >
                No provider is currently being elevated above the rest of the fleet.
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-rs-border bg-rs-bg/80 p-4">
            <button
              type="button"
              class="text-body-sm flex w-full items-center justify-between font-semibold text-rs-fg"
              :aria-expanded="providerGridAccordionOpen"
              @click="providerGridAccordionOpen = !providerGridAccordionOpen"
            >
              Provider health grid
              <svg
                class="h-4 w-4 text-rs-muted transition-transform duration-200"
                :class="providerGridAccordionOpen ? 'rotate-180' : ''"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-[2200px] opacity-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="max-h-[2200px] opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div v-if="providerGridAccordionOpen" class="overflow-hidden">
                <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <button
                    v-for="provider in providerHealth"
                    :key="provider.provider_id"
                    type="button"
                    class="rounded-xl border border-l-4 p-3 text-left transition-colors"
                    :class="providerCardClass(provider)"
                    @click="toggleProviderDetails(provider.provider_id)"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                        :class="providerStatusDot(provider)"
                      />
                      <span class="text-body-sm font-semibold text-rs-fg">{{
                        provider.display_name
                      }}</span>
                    </div>
                    <div class="mt-1 text-xs text-rs-muted">
                      {{ provider.summary?.corridor_count ?? 0 }} corridors ·
                      {{ provider.summary?.stale_count ?? 0 }} stale
                    </div>
                    <div class="mt-1 text-xs text-rs-muted">
                      {{ provider.status }} ·
                      {{ provider.timestamp ? formatTimestamp(provider.timestamp) : 'No snapshot' }}
                    </div>
                    <div
                      v-if="provider.error"
                      class="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs text-danger-600 dark:bg-red-900/20"
                    >
                      {{ provider.error }}
                    </div>
                  </button>
                </div>

                <div
                  v-if="selectedProvider"
                  class="mt-4 rounded-2xl border border-rs-border bg-rs-surface p-4"
                >
                  <div class="mb-2 flex items-center justify-between">
                    <h3 class="text-body-lg font-semibold text-rs-fg">
                      {{ selectedProvider.display_name }} corridor detail
                    </h3>
                    <button
                      type="button"
                      class="text-body-sm rounded-md border border-rs-border px-3 py-1 text-rs-muted transition-colors hover:border-brand-300 hover:bg-brand-50"
                      @click="selectedProviderId = null"
                    >
                      Close
                    </button>
                  </div>
                  <div class="overflow-auto">
                    <table class="text-body-sm min-w-full">
                      <thead class="text-body-sm uppercase text-neutral-400">
                        <tr>
                          <th class="py-2 text-left">Corridor</th>
                          <th class="py-2 text-right">Quote age (min)</th>
                          <th class="py-2 text-right">Attempt age (min)</th>
                          <th class="py-2 text-left">Last quote</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="corridor in selectedProvider.corridors || []"
                          :key="corridor.corridor_id"
                          class="border-t border-neutral-100"
                        >
                          <td class="py-2 text-rs-fg">{{ corridor.corridor_id }}</td>
                          <td class="py-2 text-right text-rs-muted">
                            {{ corridor.last_quote_age_minutes ?? 'n/a' }}
                          </td>
                          <td class="py-2 text-right text-rs-muted">
                            {{ corridor.last_attempt_age_minutes ?? 'n/a' }}
                          </td>
                          <td class="py-2 text-rs-muted">
                            {{ formatTimestamp(corridor.last_quote_at ?? null) }}
                          </td>
                        </tr>
                        <tr v-if="(selectedProvider.corridors || []).length === 0">
                          <td colspan="4" class="text-body-sm py-3 text-center text-neutral-400">
                            No corridor detail available.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </article>
    </section>

    <!-- Agent-native platform summary -->
    <section class="rounded-2xl bg-surface p-6 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-body-lg font-semibold text-rs-fg">Platform Health</h2>
          <p class="text-body-sm text-rs-muted">
            Module registry, self-healing pipeline, and corridor stress overview.
          </p>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <NuxtLink
          to="/admin/modules"
          class="rounded-xl border border-rs-border p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
        >
          <div class="text-body-sm font-semibold text-rs-fg">Module Registry</div>
          <div class="text-caption mt-1 text-rs-muted">
            {{ platformModuleHealthy }}/{{ platformModuleTotal }} healthy
          </div>
        </NuxtLink>
        <NuxtLink
          to="/admin/agents"
          class="rounded-xl border border-rs-border p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-body-sm font-semibold text-rs-fg">Self-Healing Pipeline</div>
              <div class="text-caption mt-1 text-rs-muted">
                {{ platformSelfHealingHeadline }}
              </div>
            </div>
            <span
              class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
              :class="platformSelfHealingToneClass"
            >
              {{ platformSelfHealingToneLabel }}
            </span>
          </div>
          <div class="text-caption mt-3 grid grid-cols-2 gap-2">
            <div class="bg-rs-surface-2/60 rounded-lg p-2">
              <div class="text-rs-muted">Pending</div>
              <div class="mt-1 font-semibold text-rs-fg">{{ platformPendingBundles }}</div>
            </div>
            <div class="bg-rs-surface-2/60 rounded-lg p-2">
              <div class="text-rs-muted">Recent actions</div>
              <div class="mt-1 font-semibold text-rs-fg">{{ platformActions.length }}</div>
            </div>
          </div>
        </NuxtLink>
        <NuxtLink
          to="/admin/stress"
          class="rounded-xl border border-rs-border p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-body-sm font-semibold text-rs-fg">Corridor Stress</div>
              <div class="text-caption mt-1 text-rs-muted">
                {{ platformStressHeadline }}
              </div>
            </div>
            <span
              class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
              :class="platformStressToneClass"
            >
              {{ platformStressToneLabel }}
            </span>
          </div>
          <div class="text-caption mt-3 grid grid-cols-2 gap-2">
            <div class="bg-rs-surface-2/60 rounded-lg p-2">
              <div class="text-rs-muted">Elevated+</div>
              <div class="mt-1 font-semibold text-rs-fg">{{ platformStressElevated }}</div>
            </div>
            <div class="bg-rs-surface-2/60 rounded-lg p-2">
              <div class="text-rs-muted">Critical</div>
              <div class="mt-1 font-semibold text-rs-fg">
                {{ platformStressInsights.criticalCount }}
              </div>
            </div>
          </div>
        </NuxtLink>
        <NuxtLink
          to="/admin/data-quality"
          class="rounded-xl border border-rs-border p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
        >
          <div class="text-body-sm font-semibold text-rs-fg">Data Quality</div>
          <div class="text-caption mt-1 text-rs-muted">Total Collection Error dashboard</div>
        </NuxtLink>
      </div>

      <div class="mt-4">
        <h3 class="text-body-md mb-3 font-semibold text-rs-fg">Service Health</h3>
        <div v-if="serviceHealthLoading" class="flex flex-wrap gap-3">
          <div
            v-for="label in ['Plane A API', 'Plane B Ingest', 'Export Worker']"
            :key="label"
            class="rounded-xl border border-rs-border p-4"
          >
            <div class="flex items-center gap-2">
              <span class="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-neutral-300" />
              <span class="text-body-sm font-semibold text-rs-fg">{{ label }}</span>
            </div>
            <div class="text-caption mt-1 text-rs-muted">Checking...</div>
          </div>
        </div>
        <div
          v-else-if="serviceHealthUnavailable"
          class="text-body-sm rounded-xl border border-rs-border p-4 text-rs-muted"
        >
          {{ serviceHealthMessage }}
        </div>
        <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="tile in serviceHealthTiles"
            :key="tile.service_id"
            class="rounded-xl border border-rs-border p-4"
          >
            <div class="flex items-center gap-2">
              <span
                class="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                :class="serviceStatusDotClass(tile)"
              />
              <span class="text-body-sm font-semibold text-rs-fg">{{ tile.display_name }}</span>
            </div>
            <div class="text-caption mt-1 text-rs-muted">
              {{ tile.last_active_at ? formatTimestamp(tile.last_active_at) : 'No activity' }}
            </div>
            <div v-if="tile.message" class="text-caption mt-1 text-rs-muted">
              {{ tile.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- Self-healing KPI tiles -->
      <div v-if="platformMetrics" class="mt-4">
        <SelfHealingKpiTiles :metrics="platformMetrics" />
      </div>

      <!-- Recent agent actions inline -->
      <div v-if="platformActions.length" class="mt-4 rounded-xl border border-rs-border p-4">
        <div class="text-body-sm mb-3 font-semibold text-rs-fg">Recent Agent Actions</div>
        <AgentActionTimeline :actions="platformActions" />
      </div>
    </section>

    <section class="rounded-2xl bg-surface p-6 shadow-sm">
      <h2 class="text-body-lg font-semibold text-rs-fg">AWS click-paths</h2>
      <p class="text-body-sm text-rs-muted">
        Open these directly in AWS Console for visual monitoring.
      </p>
      <div class="mt-4 grid gap-3 md:grid-cols-2">
        <a
          v-for="link in awsLinks"
          :key="link.label"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-xl border border-rs-border p-4 hover:border-primary-200 hover:bg-primary-50"
        >
          <div class="text-body-sm font-semibold text-rs-fg">{{ link.label }}</div>
          <div class="text-body-sm mt-1 text-rs-muted">{{ link.description }}</div>
        </a>
      </div>
    </section>

    <section class="grid gap-6 lg:grid-cols-3">
      <div class="rounded-2xl bg-surface p-6 shadow-sm lg:col-span-2">
        <h2 class="text-body-lg font-semibold text-rs-fg">Indices health</h2>
        <p class="text-body-sm text-rs-muted">Source: <code>/api/v1/ops/indices/health</code></p>
        <div v-if="indicesHealth" class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-body-sm uppercase text-neutral-400">Status</div>
            <div class="text-body-lg mt-1 font-semibold text-rs-fg">{{ indicesHealth.status }}</div>
          </div>
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-body-sm uppercase text-neutral-400">Available ratio</div>
            <div class="text-body-lg mt-1 font-semibold text-rs-fg">
              {{ formatPercent(indicesHealth.summary?.available_ratio) }}
            </div>
          </div>
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-body-sm uppercase text-neutral-400">Suppressed ratio</div>
            <div class="text-body-lg mt-1 font-semibold text-rs-fg">
              {{ formatPercent(indicesHealth.summary?.suppressed_ratio) }}
            </div>
          </div>
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-body-sm uppercase text-neutral-400">Min provider count</div>
            <div class="text-body-lg mt-1 font-semibold text-rs-fg">
              {{ formatAdminNumber(indicesHealth.summary?.min_provider_count, 0) }}
            </div>
          </div>
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-body-sm uppercase text-neutral-400">Weight confidence p10</div>
            <div class="text-body-lg mt-1 font-semibold text-rs-fg">
              {{ formatAdminNumber(indicesHealth.summary?.weight_confidence_p10, 3) }}
            </div>
          </div>
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-body-sm uppercase text-neutral-400">Latest Gold date</div>
            <div class="text-body-lg mt-1 font-semibold text-rs-fg">
              {{ indicesHealth.summary?.latest_date || 'n/a' }}
            </div>
          </div>
        </div>
        <p v-else class="text-body-sm mt-4 text-rs-muted">No indices health data yet.</p>
      </div>

      <div class="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">B2B cadence</h2>
        <p class="text-body-sm text-rs-muted">Source: <code>/api/v1/ops/b2b-sweep-status</code></p>
        <div v-if="b2bSweepStatus?.schedule?.length" class="mt-4 space-y-3">
          <div
            v-for="tier in b2bSweepStatus.schedule"
            :key="tier.priorityTier"
            class="rounded-lg border border-neutral-100 p-3"
          >
            <div class="text-body-sm font-semibold text-rs-fg">{{ tier.priorityTier }}</div>
            <div class="text-body-sm mt-1 text-rs-muted">
              providers={{ tier.providers }}, enabled={{ tier.anyEnabled ? 'yes' : 'no' }}
            </div>
            <div class="text-body-sm text-rs-muted">drift={{ tier.driftMinutes ?? 'n/a' }} min</div>
          </div>
        </div>
        <p v-else class="text-body-sm mt-4 text-rs-muted">No sweep status data yet.</p>
      </div>
    </section>

    <section class="rounded-2xl bg-surface p-6 shadow-sm">
      <h2 class="text-body-lg font-semibold text-rs-fg">Provider spot-check</h2>
      <p class="text-body-sm text-rs-muted">
        These are key provider health endpoints to confirm stale/fresh quote windows.
      </p>
      <div class="mt-4 overflow-auto">
        <table class="text-body-sm min-w-full">
          <thead class="text-body-sm uppercase text-neutral-400">
            <tr>
              <th class="py-2 text-left">Provider</th>
              <th class="py-2 text-right">Corridors</th>
              <th class="py-2 text-right">Stale</th>
              <th class="py-2 text-right">Fresh window (min)</th>
              <th class="py-2 text-left">Snapshot</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in providerChecks"
              :key="row.providerId"
              class="border-t border-neutral-100"
            >
              <td class="py-2 text-neutral-700">{{ row.providerLabel }}</td>
              <td class="py-2 text-right text-neutral-600">{{ row.corridorCount ?? 'n/a' }}</td>
              <td class="py-2 text-right text-neutral-600">{{ row.staleCount ?? 'n/a' }}</td>
              <td class="py-2 text-right text-neutral-600">
                {{ row.freshWindowMinutes ?? 'n/a' }}
              </td>
              <td class="py-2 text-rs-muted">{{ formatTimestamp(row.timestamp) }}</td>
            </tr>
            <tr v-if="providerChecks.length === 0">
              <td colspan="5" class="text-body-sm py-3 text-center text-neutral-400">
                No provider checks yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="rounded-2xl bg-surface p-6 shadow-sm">
      <h2 class="text-body-lg font-semibold text-rs-fg">Latest Silver activity</h2>
      <p class="text-body-sm text-rs-muted">Source: <code>/api/v1/ops/observer/summary</code></p>

      <div v-if="observerSummary?.success" class="mt-4 space-y-6">
        <div class="grid gap-6 lg:grid-cols-2">
          <div class="rounded-xl border border-neutral-100 p-4">
            <div class="text-body-sm font-semibold text-rs-fg">Watchlist items</div>
            <div class="mt-2 overflow-auto">
              <table class="text-body-sm min-w-full">
                <thead class="text-body-sm uppercase text-neutral-400">
                  <tr>
                    <th class="py-2 text-left">Updated</th>
                    <th class="py-2 text-left">User</th>
                    <th class="py-2 text-left">Type</th>
                    <th class="py-2 text-left">Label</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in observerSummary.latest.watchlist_items"
                    :key="row.id"
                    class="border-t border-neutral-100"
                  >
                    <td class="text-body-sm py-2 text-rs-muted">
                      {{ formatTimestamp(row.updated_at) }}
                    </td>
                    <td class="text-body-sm py-2 text-rs-muted">{{ row.user_id.slice(0, 8) }}…</td>
                    <td class="py-2 text-neutral-700">{{ row.target_type }}</td>
                    <td class="py-2 text-neutral-700">{{ row.label || '—' }}</td>
                  </tr>
                  <tr v-if="observerSummary.latest.watchlist_items.length === 0">
                    <td colspan="4" class="text-body-sm py-3 text-center text-neutral-400">
                      No watchlist items yet.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="rounded-xl border border-neutral-100 p-4">
            <div class="text-body-sm font-semibold text-rs-fg">Alerts</div>
            <div class="mt-2 overflow-auto">
              <table class="text-body-sm min-w-full">
                <thead class="text-body-sm uppercase text-neutral-400">
                  <tr>
                    <th class="py-2 text-left">Updated</th>
                    <th class="py-2 text-left">Metric</th>
                    <th class="py-2 text-left">Rule</th>
                    <th class="py-2 text-left">User</th>
                    <th class="py-2 text-left">Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in observerSummary.latest.alerts"
                    :key="row.id"
                    class="border-t border-neutral-100"
                  >
                    <td class="text-body-sm py-2 text-rs-muted">
                      {{ formatTimestamp(row.updated_at) }}
                    </td>
                    <td class="py-2 text-neutral-700">{{ row.metric }}</td>
                    <td class="py-2 text-neutral-700">
                      {{ row.comparator }} {{ row.threshold }}
                      <span v-if="row.currency" class="text-body-sm text-rs-muted">
                        {{ row.currency }}
                      </span>
                    </td>
                    <td class="text-body-sm py-2 text-rs-muted">{{ row.user_id.slice(0, 8) }}…</td>
                    <td class="py-2 text-neutral-700">{{ row.enabled ? 'yes' : 'no' }}</td>
                  </tr>
                  <tr v-if="observerSummary.latest.alerts.length === 0">
                    <td colspan="5" class="text-body-sm py-3 text-center text-neutral-400">
                      No alerts yet.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-neutral-100 p-4">
          <div class="text-body-sm font-semibold text-rs-fg">Alert events</div>
          <div class="mt-2 overflow-auto">
            <table class="text-body-sm min-w-full">
              <thead class="text-body-sm uppercase text-neutral-400">
                <tr>
                  <th class="py-2 text-left">Triggered</th>
                  <th class="py-2 text-left">Alert</th>
                  <th class="py-2 text-left">Value</th>
                  <th class="py-2 text-left">Notify</th>
                  <th class="py-2 text-left">Message</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in observerSummary.latest.alert_events"
                  :key="row.id"
                  class="border-t border-neutral-100"
                >
                  <td class="text-body-sm py-2 text-rs-muted">
                    {{ formatTimestamp(row.triggered_at) }}
                  </td>
                  <td class="text-body-sm py-2 text-rs-muted">{{ row.alert_id.slice(0, 8) }}…</td>
                  <td class="py-2 text-neutral-700">{{ row.value ?? '—' }}</td>
                  <td class="py-2 text-neutral-700">{{ row.notification_status ?? '—' }}</td>
                  <td class="text-body-sm py-2 text-rs-muted">{{ row.message || '—' }}</td>
                </tr>
                <tr v-if="observerSummary.latest.alert_events.length === 0">
                  <td colspan="5" class="text-body-sm py-3 text-center text-neutral-400">
                    No alert events yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-xl border border-neutral-100 p-4">
          <div class="text-body-sm font-semibold text-rs-fg">Email send attempts (audit)</div>
          <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-body-sm text-rs-muted">
              Enable via <code>ALERTS_NOTIFICATION_AUDIT=1</code> (optional
              <code>..._CONTENT</code>, <code>..._PII</code>).
            </div>
            <label
              v-if="isSuperAdmin"
              class="text-body-sm flex items-center gap-2 text-neutral-600"
            >
              <input
                v-model="includePii"
                type="checkbox"
                class="h-4 w-4 rounded border-neutral-300 text-brand-600"
                :disabled="loading"
                @change="refresh"
              />
              Show PII
            </label>
          </div>
          <div
            v-if="
              includePii &&
              observerSummary?.pii &&
              observerSummary.pii.requested &&
              !observerSummary.pii.included
            "
            class="mt-1 text-xs text-neutral-400"
          >
            PII was requested but not included. Enable
            <code>ALERTS_NOTIFICATION_AUDIT_PII=1</code> and re-check.
          </div>
          <div class="mt-2 overflow-auto">
            <table class="text-body-sm min-w-full">
              <thead class="text-body-sm uppercase text-neutral-400">
                <tr>
                  <th class="py-2 text-left">Time</th>
                  <th class="py-2 text-left">Status</th>
                  <th class="py-2 text-left">To</th>
                  <th class="py-2 text-left">Subject</th>
                  <th class="py-2 text-left">Detail</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in observerSummary.latest.notification_attempts"
                  :key="row.id"
                  class="border-t border-neutral-100"
                >
                  <td class="text-body-sm py-2 text-rs-muted">
                    {{ formatTimestamp(row.created_at) }}
                  </td>
                  <td class="py-2 text-neutral-700">{{ row.status }}</td>
                  <td class="text-body-sm py-2 text-rs-muted">
                    {{
                      row.to_email ||
                      (row.to_email_hash ? `${row.to_email_hash.slice(0, 10)}…` : '—')
                    }}
                  </td>
                  <td class="py-2 text-neutral-700">{{ row.subject || '—' }}</td>
                  <td class="text-body-sm py-2 text-rs-muted">
                    {{ row.skip_reason || row.error || '—' }}
                  </td>
                </tr>
                <tr v-if="observerSummary.latest.notification_attempts.length === 0">
                  <td colspan="5" class="text-body-sm py-3 text-center text-neutral-400">
                    No notification attempts recorded.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-xl border border-neutral-100 p-4">
          <div class="text-body-sm font-semibold text-rs-fg">Latest quote records</div>
          <div class="mt-2 overflow-auto">
            <table class="text-body-sm min-w-full">
              <thead class="text-body-sm uppercase text-neutral-400">
                <tr>
                  <th class="py-2 text-left">Created</th>
                  <th class="py-2 text-left">Provider</th>
                  <th class="py-2 text-left">Corridor</th>
                  <th class="py-2 text-left">Bucket</th>
                  <th class="py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in observerSummary.latest.quotes"
                  :key="`${row.provider_id}:${row.corridor_id}:${row.created_at}`"
                  class="border-t border-neutral-100"
                >
                  <td class="text-body-sm py-2 text-rs-muted">
                    {{ formatTimestamp(row.created_at) }}
                  </td>
                  <td class="py-2 text-neutral-700">{{ row.provider_id }}</td>
                  <td class="py-2 text-neutral-700">{{ row.corridor_id }}</td>
                  <td class="py-2 text-neutral-700">{{ row.amount_bucket }}</td>
                  <td class="py-2 text-neutral-700">{{ row.status }}</td>
                </tr>
                <tr v-if="observerSummary.latest.quotes.length === 0">
                  <td colspan="5" class="text-body-sm py-3 text-center text-neutral-400">
                    No quote records yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-xl border border-neutral-100 p-4">
          <div class="text-body-sm font-semibold text-rs-fg">DB fallback queues</div>
          <p class="text-body-sm mt-1 text-rs-muted">
            Counts from <code>silver.quote_refresh_request</code> and
            <code>silver.fx_rate_refresh_request</code>.
          </p>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-neutral-100 p-3">
              <div class="text-body-sm uppercase text-neutral-400">Quote refresh</div>
              <div class="text-body-sm mt-2 space-y-1 text-neutral-700">
                <div
                  v-for="row in observerSummary.queues.quote_refresh"
                  :key="row.status"
                  class="flex items-center justify-between"
                >
                  <span>{{ row.status }}</span>
                  <span class="font-semibold">{{ row.count }}</span>
                </div>
                <div
                  v-if="observerSummary.queues.quote_refresh.length === 0"
                  class="text-body-sm text-neutral-400"
                >
                  n/a
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-neutral-100 p-3">
              <div class="text-body-sm uppercase text-neutral-400">FX refresh</div>
              <div class="text-body-sm mt-2 space-y-1 text-neutral-700">
                <div
                  v-for="row in observerSummary.queues.fx_rate_refresh"
                  :key="row.status"
                  class="flex items-center justify-between"
                >
                  <span>{{ row.status }}</span>
                  <span class="font-semibold">{{ row.count }}</span>
                </div>
                <div
                  v-if="observerSummary.queues.fx_rate_refresh.length === 0"
                  class="text-body-sm text-neutral-400"
                >
                  n/a
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-else class="text-body-sm mt-4 text-rs-muted">
        Observer summary unavailable yet (migrations/permissions/config may still be applying).
      </p>
    </section>

    <section class="rounded-2xl bg-surface p-6 shadow-sm">
      <h2 class="text-body-lg font-semibold text-rs-fg">CSV paths (no CLI)</h2>
      <ul class="text-body-sm mt-4 list-disc space-y-2 pl-5 text-neutral-700">
        <li>
          Gold exports snapshot: open <strong>/admin/gold-exports</strong> to browse and download
          TEER/RCI/RVI CSV.
        </li>
        <li>
          RDS Query Editor v2: run SQL from <code>docs/runbooks/sql/observer-pack.sql</code> and
          click <strong>Export to CSV</strong>.
        </li>
        <li>
          Product export flow: create export via <code>/api/v1/exports</code>, then download from
          Exports UI.
        </li>
        <li>
          S3 export artifacts: open the Exports bucket (AWS click-paths above) and download
          generated files under the <code>exports/</code> prefix.
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { AgentActionEntry, SelfHealingMetrics } from '~/types/agents'
import type { CorridorStressEntry, StressSummary } from '~/types/stress'
import {
  getModuleHealth,
  getSelfHealingMetrics,
  getAgentActions,
  getCorridorStressOverview,
  getServiceHealth,
  type ServiceHealthEntry,
} from '~/lib/opsApi'
import { getAdminApiErrorMessage } from '~/utils/adminApiErrors'
import { buildCorridorStressInsights } from '~/utils/adminInsights'

definePageMeta({ middleware: ['auth', 'super-admin'], layout: 'admin' })

const runtimeConfig = useRuntimeConfig()
const { formatPercent, formatNumber: formatAdminNumber, formatTimestamp } = useAdminFormat()
const env = () => String(runtimeConfig.public.remitScoutEnv ?? 'dev').toLowerCase()
const region = () => String(runtimeConfig.public.awsRegion ?? 'us-east-1')

const normalizeEnv = (value?: string) => {
  const raw = (value || '').toLowerCase().trim()
  if (!raw) return 'dev'
  if (raw === 'production') return 'prod'
  if (raw === 'development') return 'dev'
  return raw
}

const envName = normalizeEnv(env())
const awsRegion = region()

const stackName = `remit-scout-${envName}`
const bronzeBucket = `remit-scout-bronze-${envName}`
const exportsBucket = `remit-scout-exports-${envName}`

useAdminPage({
  title: 'Admin: Operations Center | Remit-Scout',
  description:
    'Super-admin operations center for launch readiness, queues, providers, and AWS health.',
})

type IndicesHealthResponse = {
  status: string
  summary?: {
    available_ratio?: number | null
    suppressed_ratio?: number | null
    min_provider_count?: number | null
    weight_confidence_p10?: number | null
    latest_date?: string | null
  }
}

type SweepTier = {
  priorityTier: string
  providers: number
  anyEnabled: boolean
  driftMinutes: number | null
}

type B2bSweepStatusResponse = {
  schedule: SweepTier[]
}

type ProviderCheckRow = {
  providerId: string
  providerLabel: string
  corridorCount: number | null
  staleCount: number | null
  freshWindowMinutes: number | null
  timestamp: string | null
}

type ProviderHealthCorridor = {
  corridor_id: string
  last_quote_at?: string | null
  last_quote_age_minutes?: number | null
  last_attempt_at?: string | null
  last_attempt_age_minutes?: number | null
  status?: string | null
}

type ProviderHealthAggregateItem = {
  provider_id: string
  display_name: string
  status: 'healthy' | 'degraded' | 'error'
  timestamp?: string | null
  error?: string
  summary?: {
    corridor_count?: number | null
    stale_count?: number | null
    fresh_window_minutes?: number | null
  }
  corridors?: ProviderHealthCorridor[]
}

type ProvidersHealthAggregateResponse = {
  summary?: {
    total_providers?: number
    healthy_providers?: number
    degraded_providers?: number
    providers_with_errors?: number
    total_corridors?: number
    generated_at?: string
  }
  providers?: ProviderHealthAggregateItem[]
}

type ObserverSummaryResponse = {
  success: boolean
  timestamp: string
  pii?: {
    requested: boolean
    included: boolean
  }
  gold: {
    latest_date: string | null
  }
  queues: {
    quote_refresh: Array<{ status: string; count: number }>
    fx_rate_refresh: Array<{ status: string; count: number }>
  }
  latest: {
    quotes: Array<{
      provider_id: string
      corridor_id: string
      amount_bucket: number
      payin: string
      payout: string
      status: string
      collected_at: string | null
      ingested_at: string | null
      created_at: string
    }>
    alerts: Array<{
      id: string
      user_id: string
      metric: string
      comparator: string
      threshold: number
      currency: string | null
      frequency: string
      enabled: boolean
      updated_at: string
      created_at: string
    }>
    alert_events: Array<{
      id: string
      alert_id: string
      triggered_at: string
      value: number | null
      notification_status: string | null
      message: string | null
    }>
    watchlist_items: Array<{
      id: string
      user_id: string
      target_type: string
      target_payload: unknown
      label: string | null
      updated_at: string
      created_at: string
    }>
    notification_attempts: Array<{
      id: string
      alert_id: string | null
      user_id: string | null
      channel: string
      provider: string
      to_email_hash: string | null
      to_email: string | null
      subject: string | null
      status: string
      skip_reason: string | null
      error: string | null
      created_at: string
    }>
  }
}

type BatchAlertEvaluationResponse = {
  success: true
  mode: 'batch'
  run_mode?: 'dry_run' | 'execute'
  triggered?: number
  total?: number
  message?: string
}

type SingleAlertEvaluationResponse = {
  success: true
  mode: 'single'
  run_mode?: 'dry_run' | 'execute'
  alertId?: string
  triggered?: boolean
  message?: string
}

type FailedAlertEvaluationResponse = {
  success?: false
  mode?: string
  run_mode?: 'dry_run' | 'execute'
  message?: string
}

type AlertEvaluationResponse =
  | BatchAlertEvaluationResponse
  | SingleAlertEvaluationResponse
  | FailedAlertEvaluationResponse

type AttentionItem = {
  title: string
  detail: string
  cta: string
  to?: string
  href?: string
  toneClass: string
}

type HeroMetric = {
  label: string
  headline: string
  detail: string
  dotClass: string
}

type SignalLedgerItem = {
  label: string
  value: string
  detail: string
}

type ImmediateAwsLink = {
  label: string
  description: string
  href: string
  reason: string
}

const { request } = useApi()

type MeResponse = {
  success: boolean
  user: {
    role: string | null
    app_role: string | null
    is_admin: boolean
  }
}

const platformModuleTotal = ref(0)
const platformModuleHealthy = ref(0)
const platformPendingBundles = ref(0)
const platformStressElevated = ref(0)
const platformMetrics = ref<SelfHealingMetrics | null>(null)
const platformActions = ref<AgentActionEntry[]>([])
const platformStressCorridors = ref<CorridorStressEntry[]>([])
const platformStressSummary = ref<StressSummary | null>(null)
const platformStressUpdatedAt = ref<string | null>(null)
const serviceHealthLoading = ref(false)
const serviceHealthResponse = ref<Awaited<ReturnType<typeof getServiceHealth>> | null>(null)

const loading = ref(false)
const ensuring = ref(false)
const evaluating = ref(false)
const autoRefresh = ref(false)
const error = ref<string | null>(null)
const indicesAccordionOpen = ref(true)

const platformSelfHealingTone = computed<'stable' | 'watch' | 'warming'>(() => {
  if (!platformMetrics.value && platformActions.value.length === 0) return 'warming'
  if (
    (platformMetrics.value?.pending_bundles ?? 0) > 0 ||
    (platformMetrics.value?.active_repairs ?? 0) > 0
  )
    return 'watch'
  return 'stable'
})

const platformSelfHealingToneClass = computed(() => {
  if (platformSelfHealingTone.value === 'watch') return 'bg-amber-100 text-amber-700'
  if (platformSelfHealingTone.value === 'warming') return 'bg-neutral-100 text-neutral-700'
  return 'bg-emerald-100 text-emerald-700'
})

const platformSelfHealingToneLabel = computed(() => {
  if (platformSelfHealingTone.value === 'watch') return 'Active'
  if (platformSelfHealingTone.value === 'warming') return 'Warming'
  return 'Stable'
})

const platformSelfHealingHeadline = computed(() => {
  if (platformSelfHealingTone.value === 'warming') return 'No recent repair telemetry yet.'
  if (platformSelfHealingTone.value === 'watch') {
    return `${platformPendingBundles.value} pending bundles · ${platformMetrics.value?.active_repairs ?? 0} active repairs`
  }
  return `${platformActions.value.length} recent actions · auto-heal ${formatPercent(platformMetrics.value?.auto_heal_success_rate ?? null, 0)}`
})

const platformStressInsights = computed(() =>
  buildCorridorStressInsights(
    platformStressCorridors.value,
    platformStressSummary.value,
    platformStressUpdatedAt.value,
  ),
)

const platformStressTone = computed<'stable' | 'watch' | 'critical' | 'warming'>(() => {
  if (platformStressInsights.value.telemetryState !== 'live') return 'warming'
  if (
    platformStressInsights.value.criticalCount > 0 ||
    platformStressInsights.value.freshnessState === 'stale'
  )
    return 'critical'
  if (
    platformStressInsights.value.elevatedCount > 0 ||
    platformStressInsights.value.freshnessState === 'delayed'
  )
    return 'watch'
  return 'stable'
})

const platformStressToneClass = computed(() => {
  if (platformStressTone.value === 'critical') return 'bg-red-100 text-red-700'
  if (platformStressTone.value === 'watch') return 'bg-amber-100 text-amber-700'
  if (platformStressTone.value === 'warming') return 'bg-neutral-100 text-neutral-700'
  return 'bg-emerald-100 text-emerald-700'
})

const platformStressToneLabel = computed(() => {
  if (platformStressTone.value === 'critical') return 'Critical'
  if (platformStressTone.value === 'watch') return 'Watch'
  if (platformStressTone.value === 'warming') return 'Warming'
  return 'Stable'
})

const platformStressHeadline = computed(() => {
  if (platformStressTone.value === 'warming') return 'No corridor stress set yet.'
  if (platformStressInsights.value.highestRisk) {
    return `${platformStressInsights.value.highestRisk.corridor_id} is the current top-risk corridor.`
  }
  return `${platformStressElevated.value} corridors elevated+ · freshness ${platformStressInsights.value.freshnessState}`
})
const providerGridAccordionOpen = ref(true)
const actionMessage = ref<string | null>(null)
const lastRefresh = ref<string | null>(null)
const indicesHealth = ref<IndicesHealthResponse | null>(null)
const b2bSweepStatus = ref<B2bSweepStatusResponse | null>(null)
const providerChecks = ref<ProviderCheckRow[]>([])
const providerHealth = ref<ProviderHealthAggregateItem[]>([])
const providerHealthSummary = ref<ProvidersHealthAggregateResponse['summary'] | null>(null)
const selectedProviderId = ref<string | null>(null)
const observerSummary = ref<ObserverSummaryResponse | null>(null)
const includePii = ref(false)
const me = ref<MeResponse | null>(null)
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

const isSuperAdmin = computed(() => {
  const role = me.value?.user?.role ?? null
  const appRole = me.value?.user?.app_role ?? null
  return role === 'super_admin' || appRole === 'super_admin'
})

const awsLinks = [
  {
    label: 'CloudWatch Dashboard',
    description: 'Primary visual health page for queue depth, SLO, errors, and latency.',
    href: `https://${awsRegion}.console.aws.amazon.com/cloudwatch/home?region=${awsRegion}#dashboards:name=${encodeURIComponent(stackName)}`,
  },
  {
    label: 'ECS Cluster',
    description: 'Worker desired/running counts and service-level failures.',
    href: `https://${awsRegion}.console.aws.amazon.com/ecs/v2/clusters/${encodeURIComponent(stackName)}/services?region=${awsRegion}`,
  },
  {
    label: 'SQS Queues',
    description: 'Backlog + oldest message age for ingest, alerts, exports, and B2C.',
    href: `https://${awsRegion}.console.aws.amazon.com/sqs/v3/home?region=${awsRegion}#/queues`,
  },
  {
    label: 'RDS Query Editor v2',
    description: 'Run observer SQL and export CSV directly from AWS UI.',
    href: `https://${awsRegion}.console.aws.amazon.com/rds/home?region=${awsRegion}#query-editor:`,
  },
  {
    label: 'Bronze bucket',
    description: 'Raw payload objects (when collection is running).',
    href: `https://s3.console.aws.amazon.com/s3/buckets/${encodeURIComponent(bronzeBucket)}?region=${awsRegion}&bucketType=general&prefix=bronze%2F`,
  },
  {
    label: 'Exports bucket',
    description: 'Generated CSV/PDF files from export jobs.',
    href: `https://s3.console.aws.amazon.com/s3/buckets/${encodeURIComponent(exportsBucket)}?region=${awsRegion}&bucketType=general&prefix=exports%2F`,
  },
  {
    label: 'SES Account dashboard',
    description: 'Check sandbox state and whether send-path is blocked by identity limits.',
    href: `https://${awsRegion}.console.aws.amazon.com/ses/home?region=${awsRegion}#/account-dashboard`,
  },
  {
    label: 'SES Verified identities',
    description: 'Confirm From domain/email and recipient verification status.',
    href: `https://${awsRegion}.console.aws.amazon.com/ses/home?region=${awsRegion}#/verified-identities`,
  },
] as const

const watchedProviders = [
  { id: 'wise', label: 'Wise' },
  { id: 'remitly', label: 'Remitly' },
  { id: 'westernunion', label: 'Western Union' },
  { id: 'xoom', label: 'Xoom' },
  { id: 'ria', label: 'Ria' },
  { id: 'worldremit', label: 'WorldRemit' },
] as const

const selectedProvider = computed(
  () =>
    providerHealth.value.find(provider => provider.provider_id === selectedProviderId.value) ??
    null,
)

const serviceHealthUnavailable = computed(() => serviceHealthResponse.value?.unavailable === true)

const serviceHealthTiles = computed((): ServiceHealthEntry[] => {
  const res = serviceHealthResponse.value
  return res?.services ?? []
})

const opsPauseTile = computed(
  () => serviceHealthTiles.value.find(tile => tile.service_id === 'ops-pause-state') ?? null,
)

const managedServiceTiles = computed(() =>
  serviceHealthTiles.value.filter(tile => tile.service_id !== 'ops-pause-state'),
)

const serviceCounts = computed(() => ({
  total: managedServiceTiles.value.length,
  healthy: managedServiceTiles.value.filter(tile => tile.status === 'healthy').length,
  degraded: managedServiceTiles.value.filter(tile => tile.status === 'degraded').length,
  offline: managedServiceTiles.value.filter(tile => tile.status === 'offline').length,
  unknown: managedServiceTiles.value.filter(tile => tile.status === 'unknown').length,
}))

const opsPauseActive = computed(() => {
  const message = String(opsPauseTile.value?.message ?? '').toLowerCase()
  return message.includes('paused') || message.includes('pause active')
})

const summarizeQueueRows = (rows: Array<{ status: string; count: number }> = []) => {
  return rows.reduce(
    (summary, row) => {
      const count = Number(row.count || 0)
      const status = String(row.status || '').toLowerCase()
      summary.total += count

      if (['pending', 'processing', 'queued'].includes(status)) {
        summary.pending += count
      }

      if (status.includes('fail') || status.includes('error')) {
        summary.failed += count
      }

      return summary
    },
    {
      total: 0,
      pending: 0,
      failed: 0,
    },
  )
}

const quoteQueueSummary = computed(() =>
  summarizeQueueRows(observerSummary.value?.queues?.quote_refresh ?? []),
)

const fxQueueSummary = computed(() =>
  summarizeQueueRows(observerSummary.value?.queues?.fx_rate_refresh ?? []),
)

const totalBacklog = computed(() => quoteQueueSummary.value.pending + fxQueueSummary.value.pending)

const queuePressureLevel = computed<'blocked' | 'at_risk' | 'healthy'>(() => {
  if (totalBacklog.value >= 500) return 'blocked'
  if (totalBacklog.value >= 50) return 'at_risk'
  return 'healthy'
})

const queuePressureDotClass = computed(() => {
  if (queuePressureLevel.value === 'blocked') return 'bg-red-500'
  if (queuePressureLevel.value === 'at_risk') return 'bg-amber-500'
  return 'bg-emerald-500'
})

const queuePressureDetail = computed(
  () =>
    `Quote refresh ${formatAdminNumber(quoteQueueSummary.value.pending, 0)} pending and FX refresh ${formatAdminNumber(fxQueueSummary.value.pending, 0)} pending.`,
)

const providerCounts = computed(() => ({
  total: Number(providerHealthSummary.value?.total_providers ?? providerHealth.value.length),
  healthy: Number(providerHealthSummary.value?.healthy_providers ?? 0),
  degraded: Number(providerHealthSummary.value?.degraded_providers ?? 0),
  error: Number(providerHealthSummary.value?.providers_with_errors ?? 0),
  corridors: Number(providerHealthSummary.value?.total_corridors ?? 0),
}))

const providerFleetHeadline = computed(() => {
  if (providerCounts.value.total === 0) return 'Provider health unavailable'
  return `${formatAdminNumber(providerCounts.value.healthy, 0)}/${formatAdminNumber(providerCounts.value.total, 0)} healthy`
})

const providerFleetDetail = computed(() => {
  if (providerCounts.value.total === 0) return 'Aggregate provider health did not return data.'

  const parts = []
  if (providerCounts.value.degraded > 0) {
    parts.push(`${formatAdminNumber(providerCounts.value.degraded, 0)} degraded`)
  }
  if (providerCounts.value.error > 0) {
    parts.push(`${formatAdminNumber(providerCounts.value.error, 0)} in error`)
  }

  return parts.length > 0
    ? `${parts.join(' · ')} across ${formatAdminNumber(providerCounts.value.corridors, 0)} corridors.`
    : `No provider incidents are being flagged across ${formatAdminNumber(providerCounts.value.corridors, 0)} corridors.`
})

const serviceCoverageHeadline = computed(() => {
  if (serviceHealthUnavailable.value) return 'Service health unavailable'
  if (serviceCounts.value.total === 0) return 'No managed services reported'
  return `${formatAdminNumber(serviceCounts.value.healthy, 0)}/${formatAdminNumber(serviceCounts.value.total, 0)} healthy`
})

const serviceCoverageDetail = computed(() => {
  if (serviceHealthUnavailable.value) {
    return serviceHealthMessage.value
  }

  if (opsPauseActive.value) {
    return opsPauseTile.value?.message || 'Ops pause is active.'
  }

  return `${formatAdminNumber(serviceCounts.value.degraded, 0)} degraded · ${formatAdminNumber(serviceCounts.value.offline, 0)} offline · ${formatAdminNumber(serviceCounts.value.unknown, 0)} unknown.`
})

const opsPauseHeadline = computed(() => {
  if (serviceHealthUnavailable.value) return 'Unknown'
  return opsPauseActive.value ? 'Active' : 'Clear'
})

const opsPauseDetail = computed(() => {
  if (serviceHealthUnavailable.value) return serviceHealthMessage.value
  return opsPauseTile.value?.message || 'AWS pause state is not currently blocking service restore.'
})

const indicesLevel = computed<'blocked' | 'at_risk' | 'healthy'>(() => {
  const status = String(indicesHealth.value?.status ?? '').toLowerCase()
  if (!status) return 'blocked'
  if (['error', 'failed', 'critical', 'blocked'].includes(status)) return 'blocked'
  if (['degraded', 'warning', 'partial', 'at_risk'].includes(status)) return 'at_risk'
  return 'healthy'
})

const indicesHeadline = computed(() => {
  if (!indicesHealth.value?.status) return 'Indices unavailable'
  return String(indicesHealth.value.status).replace(/_/g, ' ')
})

const indicesDetail = computed(() => {
  if (!indicesHealth.value?.status) return 'Indices health did not return data.'
  const available = formatPercent(indicesHealth.value.summary?.available_ratio)
  const suppressed = formatPercent(indicesHealth.value.summary?.suppressed_ratio)
  const latestDate = indicesHealth.value.summary?.latest_date
  return `Available ${available} · Suppressed ${suppressed}${latestDate ? ` · Latest Gold ${latestDate}` : ''}`
})

const sweepSchedule = computed(() => b2bSweepStatus.value?.schedule ?? [])

const maxSweepDriftMinutes = computed(() =>
  sweepSchedule.value.reduce((max, tier) => Math.max(max, Number(tier.driftMinutes ?? 0)), 0),
)

const disabledSweepTiers = computed(
  () => sweepSchedule.value.filter(tier => !tier.anyEnabled).length,
)

const sweepLevel = computed<'blocked' | 'at_risk' | 'healthy'>(() => {
  if (disabledSweepTiers.value > 0) return 'blocked'
  if (maxSweepDriftMinutes.value >= 30) return 'blocked'
  if (maxSweepDriftMinutes.value >= 10) return 'at_risk'
  return 'healthy'
})

const sweepHeadline = computed(() => {
  if (sweepSchedule.value.length === 0) return 'No sweep data'
  if (disabledSweepTiers.value > 0)
    return `${formatAdminNumber(disabledSweepTiers.value, 0)} tier${disabledSweepTiers.value === 1 ? '' : 's'} disabled`
  if (maxSweepDriftMinutes.value > 0)
    return `${formatAdminNumber(maxSweepDriftMinutes.value, 0)}m max drift`
  return 'On cadence'
})

const sweepDetail = computed(() => {
  if (sweepSchedule.value.length === 0) return 'B2B sweep status has not returned schedule data.'
  return `${formatAdminNumber(sweepSchedule.value.length, 0)} tiers tracked · ${formatAdminNumber(disabledSweepTiers.value, 0)} disabled · ${formatAdminNumber(maxSweepDriftMinutes.value, 0)} minutes max drift.`
})

const latestQuoteAt = computed(() => {
  const rows = observerSummary.value?.latest?.quotes ?? []
  let latest: string | null = null

  for (const row of rows) {
    const candidate = row.created_at
    if (!candidate) continue
    if (!latest || new Date(candidate).getTime() > new Date(latest).getTime()) {
      latest = candidate
    }
  }

  return latest
})

const latestQuoteAgeMinutes = computed(() => {
  if (!latestQuoteAt.value) return null
  const age = Math.round((Date.now() - new Date(latestQuoteAt.value).getTime()) / 60000)
  return Number.isFinite(age) ? age : null
})

const latestQuoteHeadline = computed(() =>
  latestQuoteAt.value ? formatTimestamp(latestQuoteAt.value) : 'No recent quotes',
)

const latestQuoteDetail = computed(() => {
  if (latestQuoteAgeMinutes.value == null) return 'Observer summary did not return quote activity.'
  return `Latest observed quote was ${formatAdminNumber(latestQuoteAgeMinutes.value, 0)} minute${latestQuoteAgeMinutes.value === 1 ? '' : 's'} ago.`
})

const goldFreshnessAgeDays = computed(() => {
  const latestDate = observerSummary.value?.gold?.latest_date
  if (!latestDate) return null

  const parsed = new Date(`${latestDate}T00:00:00Z`).getTime()
  if (!Number.isFinite(parsed)) return null

  return Math.floor((Date.now() - parsed) / (24 * 60 * 60 * 1000))
})

const goldFreshnessLevel = computed<'blocked' | 'at_risk' | 'healthy'>(() => {
  if (goldFreshnessAgeDays.value == null) return 'blocked'
  if (goldFreshnessAgeDays.value > 2) return 'blocked'
  if (goldFreshnessAgeDays.value > 1) return 'at_risk'
  return 'healthy'
})

const goldFreshnessHeadline = computed(
  () => observerSummary.value?.gold?.latest_date || 'No Gold snapshot',
)

const goldFreshnessDetail = computed(() => {
  if (!observerSummary.value?.gold?.latest_date)
    return 'Observer summary did not report the latest Gold date.'
  if (goldFreshnessAgeDays.value == null) return 'Gold date could not be aged reliably.'
  return goldFreshnessAgeDays.value > 0
    ? `Latest Gold snapshot is ${formatAdminNumber(goldFreshnessAgeDays.value, 0)} day${goldFreshnessAgeDays.value === 1 ? '' : 's'} old.`
    : 'Latest Gold snapshot is current for today.'
})

const observerReadinessLevel = computed<'blocked' | 'at_risk' | 'healthy'>(() => {
  if (
    Boolean(error.value) ||
    serviceHealthUnavailable.value ||
    opsPauseActive.value ||
    serviceCounts.value.offline > 0 ||
    providerCounts.value.error > 0 ||
    queuePressureLevel.value === 'blocked' ||
    goldFreshnessLevel.value === 'blocked' ||
    sweepLevel.value === 'blocked' ||
    indicesLevel.value === 'blocked'
  ) {
    return 'blocked'
  }

  if (
    serviceCounts.value.degraded > 0 ||
    providerCounts.value.degraded > 0 ||
    queuePressureLevel.value === 'at_risk' ||
    goldFreshnessLevel.value === 'at_risk' ||
    sweepLevel.value === 'at_risk' ||
    indicesLevel.value === 'at_risk'
  ) {
    return 'at_risk'
  }

  return 'healthy'
})

const observerReadinessLabel = computed(() => {
  if (observerReadinessLevel.value === 'blocked') return 'Launch blocked'
  if (observerReadinessLevel.value === 'at_risk') return 'Launch at risk'
  return 'Launch-ready'
})

const observerReadinessPill = computed(() => {
  if (observerReadinessLevel.value === 'blocked') return 'Critical'
  if (observerReadinessLevel.value === 'at_risk') return 'Watchlist'
  return 'Healthy'
})

const observerReadinessSummary = computed(() => {
  if (observerReadinessLevel.value === 'blocked') {
    return 'This environment is not presenting as release-grade. Clear pause state, restore managed services, and drain the active risk signals before promotion.'
  }

  if (observerReadinessLevel.value === 'at_risk') {
    return 'Core observation is working, but the environment is carrying operational debt. Review degraded services, provider drift, queue growth, and Gold cadence before promotion.'
  }

  return 'Core operational signals are aligned. Continue to confirm lower-level evidence and keep the raw observer tables stable before launch.'
})

const observerStripeClass = computed(() => {
  if (observerReadinessLevel.value === 'blocked')
    return 'bg-gradient-to-r from-red-500 via-red-400 to-amber-400'
  if (observerReadinessLevel.value === 'at_risk')
    return 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300'
  return 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-sky-400'
})

const observerBadgeClass = computed(() => {
  if (observerReadinessLevel.value === 'blocked') return 'bg-red-100 text-red-700'
  if (observerReadinessLevel.value === 'at_risk') return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
})

const readinessReasons = computed(() => {
  const reasons: string[] = []

  if (error.value) reasons.push('Some panels failed to load')
  if (serviceHealthUnavailable.value) reasons.push('Service health unavailable')
  if (opsPauseActive.value) reasons.push('Ops pause active')
  if (serviceCounts.value.offline > 0)
    reasons.push(
      `${serviceCounts.value.offline} service${serviceCounts.value.offline === 1 ? '' : 's'} offline`,
    )
  if (providerCounts.value.error > 0)
    reasons.push(
      `${providerCounts.value.error} provider${providerCounts.value.error === 1 ? '' : 's'} in error`,
    )
  if (queuePressureLevel.value !== 'healthy')
    reasons.push(`${formatAdminNumber(totalBacklog.value, 0)} queued refresh requests`)
  if (goldFreshnessLevel.value !== 'healthy') reasons.push('Gold freshness outside target')
  if (sweepLevel.value !== 'healthy') reasons.push('Sweep cadence drift detected')
  if (indicesLevel.value !== 'healthy') reasons.push('Indices need review')

  return reasons
})

const heroMetrics = computed<HeroMetric[]>(() => [
  {
    label: 'Ops Pause',
    headline: opsPauseHeadline.value,
    detail: opsPauseDetail.value,
    dotClass: serviceHealthUnavailable.value
      ? 'bg-neutral-400'
      : opsPauseActive.value
        ? 'bg-red-500'
        : 'bg-emerald-500',
  },
  {
    label: 'Service Coverage',
    headline: serviceCoverageHeadline.value,
    detail: serviceCoverageDetail.value,
    dotClass: serviceHealthUnavailable.value
      ? 'bg-neutral-400'
      : serviceCounts.value.offline > 0
        ? 'bg-red-500'
        : serviceCounts.value.degraded > 0
          ? 'bg-amber-500'
          : 'bg-emerald-500',
  },
  {
    label: 'Provider Fleet',
    headline: providerFleetHeadline.value,
    detail: providerFleetDetail.value,
    dotClass:
      providerCounts.value.error > 0
        ? 'bg-red-500'
        : providerCounts.value.degraded > 0
          ? 'bg-amber-500'
          : 'bg-emerald-500',
  },
  {
    label: 'Refresh Backlog',
    headline: formatAdminNumber(totalBacklog.value, 0),
    detail: queuePressureDetail.value,
    dotClass: queuePressureDotClass.value,
  },
  {
    label: 'Gold Freshness',
    headline: goldFreshnessHeadline.value,
    detail: goldFreshnessDetail.value,
    dotClass:
      goldFreshnessLevel.value === 'blocked'
        ? 'bg-red-500'
        : goldFreshnessLevel.value === 'at_risk'
          ? 'bg-amber-500'
          : 'bg-emerald-500',
  },
  {
    label: 'Sweep Cadence',
    headline: sweepHeadline.value,
    detail: sweepDetail.value,
    dotClass:
      sweepLevel.value === 'blocked'
        ? 'bg-red-500'
        : sweepLevel.value === 'at_risk'
          ? 'bg-amber-500'
          : 'bg-emerald-500',
  },
])

const signalLedgerItems = computed<SignalLedgerItem[]>(() => [
  {
    label: 'Observer summary',
    value: observerSummary.value?.timestamp
      ? formatTimestamp(observerSummary.value.timestamp)
      : 'Not loaded',
    detail: 'Silver, Gold, alert, and DB-fallback rollup.',
  },
  {
    label: 'Provider snapshot',
    value: providerHealthSummary.value?.generated_at
      ? formatTimestamp(providerHealthSummary.value.generated_at)
      : 'Not loaded',
    detail: 'Aggregate provider fleet and corridor staleness.',
  },
  {
    label: 'Service health',
    value: serviceHealthResponse.value?.updatedAt
      ? formatTimestamp(serviceHealthResponse.value.updatedAt)
      : 'Not loaded',
    detail: serviceHealthResponse.value?.source
      ? `Source: ${serviceHealthResponse.value.source}`
      : 'AWS-backed health route.',
  },
  {
    label: 'Latest quote',
    value: latestQuoteHeadline.value,
    detail: latestQuoteDetail.value,
  },
])

const providerRiskScore = (provider: ProviderHealthAggregateItem) => {
  if (provider.status === 'error') return 4
  const staleCount = Number(provider.summary?.stale_count ?? 0)
  if (staleCount >= 3) return 3
  if (provider.status === 'degraded' || staleCount >= 1) return 2
  return 0
}

const topProviderRisks = computed(() => {
  return [...providerHealth.value]
    .filter(provider => providerRiskScore(provider) > 0)
    .sort((a, b) => {
      const scoreDelta = providerRiskScore(b) - providerRiskScore(a)
      if (scoreDelta !== 0) return scoreDelta
      return Number(b.summary?.stale_count ?? 0) - Number(a.summary?.stale_count ?? 0)
    })
    .slice(0, 5)
})

const providerRiskDetail = (provider: ProviderHealthAggregateItem) => {
  const parts = [
    `${formatAdminNumber(provider.summary?.corridor_count ?? 0, 0)} corridors`,
    `${formatAdminNumber(provider.summary?.stale_count ?? 0, 0)} stale`,
  ]

  if (provider.error) {
    parts.unshift(provider.error)
  } else if (provider.status === 'error') {
    parts.unshift('Provider reported error')
  } else if (provider.status === 'degraded') {
    parts.unshift('Provider reported degraded')
  }

  return parts.join(' · ')
}

const attentionItems = computed<AttentionItem[]>(() => {
  const items: AttentionItem[] = []

  if (opsPauseActive.value) {
    items.push({
      title: 'Resume staging operations',
      detail: opsPauseDetail.value,
      cta: 'Inspect services',
      to: '/admin/observer',
      toneClass: 'border-red-200 bg-red-50 text-red-700',
    })
  }

  if (serviceHealthUnavailable.value) {
    items.push({
      title: 'Restore AWS-backed service telemetry',
      detail: serviceHealthMessage.value,
      cta: 'Open ECS cluster',
      href: awsLinks.find(link => link.label === 'ECS Cluster')?.href,
      toneClass: 'border-red-200 bg-red-50 text-red-700',
    })
  } else if (serviceCounts.value.offline > 0 || serviceCounts.value.degraded > 0) {
    items.push({
      title: 'Recover service coverage',
      detail: serviceCoverageDetail.value,
      cta: 'Inspect services',
      to: '/admin/observer',
      toneClass:
        serviceCounts.value.offline > 0
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-amber-200 bg-amber-50 text-amber-700',
    })
  }

  if (providerCounts.value.error > 0 || providerCounts.value.degraded > 0) {
    items.push({
      title: 'Triage provider incidents',
      detail: providerFleetDetail.value,
      cta: 'Open provider control plane',
      to: '/admin/discovery',
      toneClass:
        providerCounts.value.error > 0
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-amber-200 bg-amber-50 text-amber-700',
    })
  }

  if (queuePressureLevel.value !== 'healthy') {
    items.push({
      title: 'Drain refresh backlog',
      detail: queuePressureDetail.value,
      cta: 'Open SQS queues',
      href: awsLinks.find(link => link.label === 'SQS Queues')?.href,
      toneClass:
        queuePressureLevel.value === 'blocked'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-amber-200 bg-amber-50 text-amber-700',
    })
  }

  if (goldFreshnessLevel.value !== 'healthy') {
    items.push({
      title: 'Re-establish Gold freshness',
      detail: goldFreshnessDetail.value,
      cta: 'Open gold exports',
      to: '/admin/gold-exports',
      toneClass:
        goldFreshnessLevel.value === 'blocked'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-amber-200 bg-amber-50 text-amber-700',
    })
  }

  if (indicesLevel.value !== 'healthy') {
    items.push({
      title: 'Verify Gold indices integrity',
      detail: indicesDetail.value,
      cta: 'Open indices health',
      to: '/admin/observer',
      toneClass:
        indicesLevel.value === 'blocked'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-amber-200 bg-amber-50 text-amber-700',
    })
  }

  if (sweepLevel.value !== 'healthy') {
    items.push({
      title: 'Repair B2B cadence drift',
      detail: sweepDetail.value,
      cta: 'Inspect cadence',
      to: '/admin/observer',
      toneClass:
        sweepLevel.value === 'blocked'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-amber-200 bg-amber-50 text-amber-700',
    })
  }

  return items.filter(item => item.to || item.href).slice(0, 5)
})

const immediateAwsLinks = computed<ImmediateAwsLink[]>(() => {
  const prioritized: ImmediateAwsLink[] = []
  const push = (label: string, reason: string) => {
    const link = awsLinks.find(candidate => candidate.label === label)
    if (!link || prioritized.some(item => item.label === label)) return
    prioritized.push({
      ...link,
      reason,
    })
  }

  if (opsPauseActive.value || serviceCounts.value.offline > 0 || serviceCounts.value.degraded > 0) {
    push(
      'ECS Cluster',
      'Check desired and running counts, recent service events, and blocked deployments.',
    )
    push(
      'CloudWatch Dashboard',
      'Confirm the service failure is reflected in alarms, queue age, and API error rate.',
    )
  }

  if (queuePressureLevel.value !== 'healthy') {
    push(
      'SQS Queues',
      'Inspect backlog depth and oldest message age for quote, FX, exports, and alerts.',
    )
  }

  if (
    providerCounts.value.error > 0 ||
    providerCounts.value.degraded > 0 ||
    indicesLevel.value !== 'healthy'
  ) {
    push(
      'RDS Query Editor v2',
      'Validate observer SQL, Silver freshness, and corridor-level drift at the data layer.',
    )
  }

  if (goldFreshnessLevel.value !== 'healthy') {
    push(
      'Exports bucket',
      'Confirm the latest Gold export artifacts are landing and browse current output.',
    )
  }

  if (prioritized.length < 4) {
    push('Bronze bucket', 'Inspect raw ingests if collector output looks stale or incomplete.')
  }

  if (prioritized.length < 4) {
    push(
      'SES Account dashboard',
      'Check notification delivery posture if alert evaluation is not producing emails.',
    )
  }

  return prioritized.slice(0, 4)
})

const serviceStatusDotClass = (tile: ServiceHealthEntry) => {
  if (tile.status === 'healthy') return 'bg-emerald-500'
  if (tile.status === 'degraded') return 'bg-amber-500'
  if (tile.status === 'unknown') return 'bg-neutral-400'
  return 'bg-red-500'
}

const serviceHealthMessage = computed(
  () => serviceHealthResponse.value?.message || 'Health check unavailable',
)

const providerCardClass = (provider: ProviderHealthAggregateItem) => {
  if (provider.status === 'error')
    return 'border-l-red-500 border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800'
  const staleCount = Number(provider.summary?.stale_count ?? 0)
  if (staleCount >= 3)
    return 'border-l-red-500 border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800'
  if (staleCount >= 1 || provider.status === 'degraded')
    return 'border-l-amber-500 border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800'
  return 'border-l-emerald-500 border-green-300 bg-green-50 dark:bg-green-900/10 dark:border-green-800'
}

const providerStatusDot = (provider: ProviderHealthAggregateItem) => {
  if (provider.status === 'error') return 'bg-red-500'
  const staleCount = Number(provider.summary?.stale_count ?? 0)
  if (staleCount >= 3) return 'bg-red-500'
  if (staleCount >= 1 || provider.status === 'degraded') return 'bg-amber-500'
  return 'bg-emerald-500'
}

const toggleProviderDetails = (providerId: string) => {
  selectedProviderId.value = selectedProviderId.value === providerId ? null : providerId
}

const loadMe = async () => {
  try {
    me.value = await request<MeResponse>('/me', { method: 'GET', timeoutMs: 15000, retries: 0 })
  } catch {
    me.value = null
  }
}

const ensureAuditTable = async () => {
  if (ensuring.value) return
  if (!isSuperAdmin.value) {
    error.value = 'Super-admin access is required for this action.'
    return
  }
  ensuring.value = true
  try {
    const typed =
      typeof window !== 'undefined'
        ? window.prompt('Type APPLY to run DDL ensure in dev. Leave blank to check status.')
        : null
    const wantsEnsure = (typed || '').trim().toUpperCase() === 'APPLY'
    const result = await request<{
      success: boolean
      error?: string
      message?: string
      exists?: boolean
      missing?: boolean
      requested_mode?: string
      applied_mode?: string
      migration?: string
    }>('/ops/db/ensure-alert-notification-attempts', {
      method: 'POST',
      body: wantsEnsure ? { mode: 'ensure', confirm: 'APPLY' } : { mode: 'status' },
      timeoutMs: 15000,
      retries: 0,
    })
    if (!result?.success) {
      error.value = result?.message || 'Failed to ensure email audit table.'
    } else {
      actionMessage.value = result?.message || 'Email audit table check completed.'
      await loadObserver()
    }
  } catch (err: unknown) {
    error.value = getAdminApiErrorMessage(err, 'Failed to ensure email audit table.')
  } finally {
    ensuring.value = false
  }
}

const runAlertEvaluation = async () => {
  if (evaluating.value) return
  if (!isSuperAdmin.value) {
    error.value = 'Super-admin access is required for this action.'
    return
  }
  evaluating.value = true
  try {
    const typed =
      typeof window !== 'undefined'
        ? window.prompt('Type RUN to execute (sends notifications). Leave blank for dry-run.')
        : null
    const isExecute = (typed || '').trim().toUpperCase() === 'RUN'
    const mode = isExecute ? ('execute' as const) : ('dry_run' as const)
    const result = await request<AlertEvaluationResponse>('/ops/alerts/evaluate', {
      method: 'POST',
      body: {
        frequency: 'daily',
        ignoreSchedule: true,
        limit: 50,
        mode,
        confirm: isExecute ? 'RUN' : undefined,
      },
      timeoutMs: 25000,
      retries: 0,
    })
    if (result?.success !== true) {
      error.value = result?.message || 'Alert evaluation failed.'
    } else {
      if (result?.mode === 'batch') {
        actionMessage.value = `Alert evaluation (${result?.run_mode || mode}): triggered ${result?.triggered ?? 0}/${result?.total ?? 0}.`
      } else if (result?.mode === 'single') {
        actionMessage.value = `Alert evaluation (${result?.run_mode || mode}): alert ${result?.alertId} triggered=${Boolean(result?.triggered)}.`
      } else {
        actionMessage.value = `Alert evaluation (${mode}) completed.`
      }
      await loadObserver()
    }
  } catch (err: unknown) {
    error.value = getAdminApiErrorMessage(err, 'Alert evaluation failed.')
  } finally {
    evaluating.value = false
  }
}

const loadObserver = async () => {
  if (loading.value) return
  loading.value = true
  error.value = null
  const platformPromise = loadPlatformData()
  const servicePromise = loadServiceHealth()
  try {
    const [indicesResult, sweepResult, summaryResult, providersAggregateResult] =
      await Promise.allSettled([
        request<IndicesHealthResponse>('/ops/indices/health'),
        request<B2bSweepStatusResponse>('/ops/b2b-sweep-status'),
        request<ObserverSummaryResponse>('/ops/observer/summary', {
          query: {
            limit: '50',
            include_pii: includePii.value ? '1' : '0',
          },
        }),
        request<ProvidersHealthAggregateResponse>('/ops/providers/health', {
          query: { include_corridors: '1' },
        }),
      ])

    if (indicesResult.status === 'fulfilled') {
      indicesHealth.value = indicesResult.value
    }
    if (sweepResult.status === 'fulfilled') {
      b2bSweepStatus.value = sweepResult.value
    }
    if (summaryResult.status === 'fulfilled') {
      observerSummary.value = summaryResult.value
    }
    if (providersAggregateResult.status === 'fulfilled') {
      providerHealthSummary.value = providersAggregateResult.value.summary ?? null
      providerHealth.value = providersAggregateResult.value.providers ?? []

      providerChecks.value = watchedProviders.flatMap(provider => {
        const row = providerHealth.value.find(item => item.provider_id === provider.id)
        if (!row) return []
        return [
          {
            providerId: row.provider_id,
            providerLabel: row.display_name || provider.label,
            corridorCount: row.summary?.corridor_count ?? null,
            staleCount: row.summary?.stale_count ?? null,
            freshWindowMinutes: row.summary?.fresh_window_minutes ?? null,
            timestamp: row.timestamp ?? null,
          },
        ]
      })

      if (
        selectedProviderId.value &&
        !providerHealth.value.some(item => item.provider_id === selectedProviderId.value)
      ) {
        selectedProviderId.value = null
      }
    }

    const extractReason = (result: PromiseSettledResult<unknown>) => {
      if (result.status !== 'rejected') return null
      const err = result.reason as { statusCode?: number; message?: string }
      if (err?.statusCode === 404) return '404 — check BFF proxy allowlist'
      return getAdminApiErrorMessage(result.reason, 'unknown error')
    }
    const failures = [
      indicesResult.status === 'rejected'
        ? `indices health (${extractReason(indicesResult)})`
        : null,
      sweepResult.status === 'rejected' ? `B2B sweep status (${extractReason(sweepResult)})` : null,
      summaryResult.status === 'rejected'
        ? `observer summary (${extractReason(summaryResult)})`
        : null,
      providersAggregateResult.status === 'rejected'
        ? `provider health (${extractReason(providersAggregateResult)})`
        : null,
    ].filter(Boolean)
    if (failures.length > 0) {
      error.value = `Some observer panels failed to load: ${failures.join(', ')}`
    }

    await Promise.all([platformPromise, servicePromise])
    lastRefresh.value = new Date().toISOString()
  } catch (err: unknown) {
    error.value = getAdminApiErrorMessage(err, 'Failed to load observer status.')
  } finally {
    loading.value = false
  }
}

const loadServiceHealth = async () => {
  serviceHealthLoading.value = true
  serviceHealthResponse.value = null
  try {
    serviceHealthResponse.value = await getServiceHealth()
  } catch (err: unknown) {
    serviceHealthResponse.value = {
      services: [],
      updatedAt: null,
      unavailable: true,
      source: 'none',
      message: getAdminApiErrorMessage(err, 'Health check unavailable'),
    }
  } finally {
    serviceHealthLoading.value = false
  }
}

const loadPlatformData = async () => {
  const [modulesRes, metricsRes, actionsRes, stressRes] = await Promise.allSettled([
    getModuleHealth(),
    getSelfHealingMetrics(),
    getAgentActions({ limit: 10 }),
    getCorridorStressOverview(),
  ])
  if (modulesRes.status === 'fulfilled') {
    platformModuleTotal.value = modulesRes.value.modules.length
    platformModuleHealthy.value = modulesRes.value.modules.filter(
      m => m.status === 'production',
    ).length
  }
  if (metricsRes.status === 'fulfilled') {
    platformMetrics.value = metricsRes.value
    platformPendingBundles.value = metricsRes.value.pending_bundles
  }
  if (actionsRes.status === 'fulfilled') {
    platformActions.value = actionsRes.value.actions
  }
  if (stressRes.status === 'fulfilled') {
    platformStressCorridors.value = stressRes.value.corridors
    platformStressSummary.value = stressRes.value.summary
    platformStressUpdatedAt.value = stressRes.value.updatedAt ?? null
    platformStressElevated.value = stressRes.value.corridors.filter(
      c => c.stress_level !== 'normal',
    ).length
  }
}

const refresh = () => {
  void loadObserver()
}

watch(autoRefresh, enabled => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
  if (enabled) {
    autoRefreshTimer = setInterval(refresh, 60_000)
  }
})

onMounted(() => {
  void loadMe()
  void loadObserver()
})

onUnmounted(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
})
</script>
