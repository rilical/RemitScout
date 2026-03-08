<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Institutional Client Management"
      subtitle="Create suspended prelaunch clients, capture onboarding state, and keep live activation gated until launch clears."
    >
      <template #actions>
        <button
          class="text-body-sm h-10 rounded-lg border border-rs-border px-4 font-semibold text-rs-fg hover:bg-neutral-50 disabled:opacity-60"
          :disabled="loading"
          @click="loadClients"
        >
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </template>
    </AdminPageShell>

    <ErrorState v-if="error" mode="card" :message="error" :on-retry="loadClients" />

    <AdminSurfaceOverview :model="surfaceOverview" />

    <section
      v-if="launchGate"
      class="rounded-3xl border p-5 shadow-sm"
      :class="
        launchGate.blocked ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'
      "
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div
            class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
            :class="
              launchGate.blocked
                ? 'border-amber-300 text-amber-800'
                : 'border-emerald-300 text-emerald-800'
            "
          >
            {{ launchGate.blocked ? 'Prelaunch mode active' : 'Launch gate open' }}
          </div>
          <h2 class="text-body-lg mt-3 font-semibold text-rs-fg">
            {{
              launchGate.blocked
                ? 'Live activation is blocked by the institutional launch gate.'
                : 'Institutional clients may be activated live.'
            }}
          </h2>
          <p
            class="text-body-sm mt-2"
            :class="launchGate.blocked ? 'text-amber-900' : 'text-emerald-900'"
          >
            {{ launchGateMessage }}
          </p>
          <p
            v-if="launchGate.updated_at"
            class="mt-2 text-xs"
            :class="launchGate.blocked ? 'text-amber-800' : 'text-emerald-800'"
          >
            Last maturity checkpoint: {{ launchGate.updated_at }}
          </p>
        </div>

        <div
          class="text-body-sm grid gap-2 rounded-2xl border border-white/70 bg-white/70 p-4 text-rs-fg lg:min-w-[320px]"
        >
          <div class="font-semibold">Blocked until gate clears</div>
          <div class="text-rs-muted">{{ blockedActionSummary }}</div>
          <div class="mt-2 font-semibold">Still allowed now</div>
          <div class="text-rs-muted">{{ allowedActionSummary }}</div>
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
        <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">
          Active
        </div>
        <div class="text-h3 mt-2 font-semibold text-rs-fg">{{ summaryData.active }}</div>
        <p class="text-body-sm mt-1 text-rs-muted">Only these clients may send live traffic.</p>
      </article>
      <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
        <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">
          Suspended
        </div>
        <div class="text-h3 mt-2 font-semibold text-rs-fg">{{ summaryData.suspended }}</div>
        <p class="text-body-sm mt-1 text-rs-muted">
          Prelaunch-safe clients waiting on launch or approval.
        </p>
      </article>
      <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
        <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">
          Trial tier
        </div>
        <div class="text-h3 mt-2 font-semibold text-rs-fg">{{ summaryData.trial }}</div>
        <p class="text-body-sm mt-1 text-rs-muted">
          Lower-scope onboarding and validation accounts.
        </p>
      </article>
      <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 shadow-sm">
        <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">
          Premium tier
        </div>
        <div class="text-h3 mt-2 font-semibold text-rs-fg">{{ summaryData.premium }}</div>
        <p class="text-body-sm mt-1 text-rs-muted">
          High-touch clients with broader scope once activated.
        </p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <article class="rounded-3xl border border-rs-border bg-rs-surface shadow-sm">
        <button
          class="flex w-full items-center justify-between px-6 py-5 text-left"
          @click="showCreateForm = !showCreateForm"
        >
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Create prelaunch client</h2>
            <p class="text-body-sm mt-1 text-rs-muted">
              New clients stay suspended automatically while the launch gate is blocked.
            </p>
          </div>
          <span
            class="rounded-full border border-rs-border px-3 py-1 text-xs font-semibold text-rs-muted"
          >
            {{ showCreateForm ? 'Hide' : 'Show' }}
          </span>
        </button>

        <div v-if="showCreateForm" class="border-t border-rs-border px-6 py-6">
          <div
            class="text-body-sm mb-4 rounded-2xl border px-4 py-4"
            :class="
              canMutate
                ? 'border-sky-200 bg-sky-50 text-sky-900'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            "
          >
            <div class="font-semibold">
              {{ canMutate ? 'Super-admin mutation access confirmed' : 'Read-only mode' }}
            </div>
            <p class="mt-1">
              {{
                canMutate
                  ? 'You can create draft clients and capture prelaunch metadata here. Live activation still depends on the launch gate.'
                  : 'Only super-admins can create or mutate institutional clients. Operators can still inspect workflow state and detail records.'
              }}
            </p>
          </div>

          <form class="grid gap-4 md:grid-cols-2" @submit.prevent="createClient">
            <label class="text-body-sm text-rs-muted">
              Client name
              <input
                v-model="createForm.name"
                type="text"
                required
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
                :disabled="!canMutate || creating"
                placeholder="Acme Treasury"
              />
            </label>

            <label class="text-body-sm text-rs-muted">
              Client prefix
              <input
                v-model="createForm.client_prefix"
                type="text"
                required
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
                :disabled="!canMutate || creating"
                placeholder="acme_treasury"
              />
            </label>

            <label class="text-body-sm text-rs-muted">
              Tier
              <select
                v-model="createForm.tier"
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
                :disabled="!canMutate || creating"
              >
                <option value="trial">Trial</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </label>

            <label class="text-body-sm text-rs-muted">
              Internal owner email
              <input
                v-model="createForm.internal_owner_email"
                type="email"
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
                :disabled="!canMutate || creating"
                placeholder="owner@remit-scout.com"
              />
            </label>

            <div class="text-body-sm text-rs-muted md:col-span-2">
              <div class="font-medium text-rs-muted">Allowed country pairs</div>
              <p class="mt-1 text-xs text-rs-muted">
                Search by send country or destination country. We save source/destination country
                only, bank deposit only.
              </p>
              <input
                v-model="createCorridorSearch"
                type="text"
                class="text-body-sm mt-2 w-full rounded-lg border border-rs-border px-3 py-2"
                :disabled="!canMutate || creating || corridorCatalogLoading"
                placeholder="Search by send country or destination country"
                @keydown.enter.prevent="commitCreateCorridorSearch"
              />
              <div
                v-if="corridorCatalogLoading"
                class="mt-2 rounded-2xl border border-rs-border bg-rs-bg/40 px-3 py-3 text-xs text-rs-muted"
              >
                Loading country-pair catalog...
              </div>
              <div
                v-else-if="corridorCatalogError"
                class="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900"
              >
                {{ corridorCatalogError }}
              </div>
              <div
                v-else-if="createCorridorCandidates.length > 0"
                class="mt-2 grid gap-2 sm:grid-cols-2"
              >
                <button
                  v-for="corridor in createCorridorCandidates"
                  :key="`create-${corridor.value}`"
                  type="button"
                  class="rounded-2xl border border-rs-border bg-white px-4 py-3 text-left hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-60"
                  :disabled="!canMutate || creating"
                  @click="addCreateCorridor(corridor.value)"
                >
                  <div class="font-semibold text-rs-fg">{{ corridor.label }}</div>
                  <div class="mt-1 text-xs text-rs-muted">Bank deposit only</div>
                </button>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="corridor in createSelectedCorridorOptions"
                  :key="`create-selected-${corridor.value}`"
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
                  :disabled="!canMutate || creating"
                  @click="removeCreateCorridor(corridor.value)"
                >
                  <span>{{ corridor.label }}</span>
                  <span class="text-brand-500">×</span>
                </button>
                <span
                  v-if="createSelectedCorridorOptions.length === 0"
                  class="text-body-sm text-rs-muted"
                >
                  No country pairs selected yet.
                </span>
              </div>
            </div>

            <label class="text-body-sm text-rs-muted">
              Rate limit RPM
              <input
                v-model.number="createForm.rate_limit_rpm"
                type="number"
                min="0"
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
                :disabled="!canMutate || creating"
              />
            </label>

            <label class="text-body-sm text-rs-muted">
              Rate limit daily
              <input
                v-model.number="createForm.rate_limit_daily"
                type="number"
                min="0"
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
                :disabled="!canMutate || creating"
              />
            </label>

            <label class="text-body-sm text-rs-muted">
              Contract start
              <input
                v-model="createForm.contract_start"
                type="date"
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
                :disabled="!canMutate || creating"
              />
            </label>

            <label class="text-body-sm text-rs-muted">
              Contract end
              <input
                v-model="createForm.contract_end"
                type="date"
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
                :disabled="!canMutate || creating"
              />
            </label>

            <label class="text-body-sm text-rs-muted">
              Report schedule
              <select
                v-model="createForm.report_schedule"
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
                :disabled="!canMutate || creating"
              >
                <option value="none">None</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>

            <div
              class="text-body-sm rounded-2xl border border-dashed border-rs-border bg-rs-bg/30 p-4 text-rs-muted"
            >
              <div class="font-semibold text-rs-fg">Creation behavior</div>
              <p class="mt-2">
                API key activation, webhook delivery, export jobs, production traffic, and live
                entitlement grants stay blocked while the launch gate is closed.
              </p>
            </div>

            <label class="text-body-sm text-rs-muted md:col-span-2">
              Compliance notes
              <textarea
                v-model="createForm.compliance_notes"
                rows="4"
                class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
                :disabled="!canMutate || creating"
                placeholder="Commercial status, legal review, integration notes, or approval blockers."
              />
            </label>

            <label class="text-body-sm text-rs-muted md:col-span-2">
              Onboarding checklist JSON
              <textarea
                v-model="createForm.onboarding_checklist_json"
                rows="7"
                class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 font-mono text-xs"
                :disabled="!canMutate || creating"
              />
            </label>

            <label class="text-body-sm text-rs-muted md:col-span-2">
              Prelaunch config JSON
              <textarea
                v-model="createForm.prelaunch_config_json"
                rows="7"
                class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 font-mono text-xs"
                :disabled="!canMutate || creating"
              />
            </label>

            <div class="flex items-center gap-3 md:col-span-2">
              <button
                type="submit"
                class="text-body-sm h-10 rounded-lg bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                :disabled="!canMutate || creating"
              >
                {{ creating ? 'Creating...' : 'Create client' }}
              </button>
              <span
                v-if="createMessage"
                class="text-body-sm"
                :class="createSuccess ? 'text-success-600' : 'text-danger-600'"
              >
                {{ createMessage }}
              </span>
            </div>
          </form>

          <div
            v-if="newApiKey"
            class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <div class="text-body-sm font-semibold text-emerald-900">Live API key issued</div>
            <p class="text-body-sm mt-1 text-emerald-800">
              Save this key now. It will not be shown again.
            </p>
            <div class="mt-3 flex items-center gap-2">
              <code
                class="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-rs-fg"
                >{{ newApiKey }}</code
              >
              <button
                class="text-body-sm rounded-lg bg-emerald-700 px-3 py-2 font-semibold text-white hover:bg-emerald-800"
                @click="copyApiKey"
              >
                {{ copied ? 'Copied' : 'Copy' }}
              </button>
            </div>
          </div>

          <div
            v-else-if="createSuccess && launchGate?.blocked"
            class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"
          >
            <div class="text-body-sm font-semibold text-amber-900">
              API key withheld while gate is blocked
            </div>
            <p class="text-body-sm mt-1 text-amber-800">
              The client record, owner assignment, checklist, compliance notes, and draft
              configuration were saved. Live key issuance will remain unavailable until the launch
              gate clears.
            </p>
          </div>
        </div>
      </article>

      <article class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Prelaunch workflow</h2>
            <p class="text-body-sm mt-1 text-rs-muted">
              Operational guardrails for institutional onboarding.
            </p>
          </div>
          <span
            class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
            :class="
              detailWorkflow?.live_activation_blocked
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-emerald-300 bg-emerald-50 text-emerald-800'
            "
          >
            {{ detailWorkflow?.live_activation_blocked ? 'Live blocked' : 'Live allowed' }}
          </span>
        </div>

        <div class="mt-4 grid gap-4">
          <div class="rounded-2xl border border-rs-border bg-rs-bg/40 p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">
              Blocked actions
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="item in detailWorkflow?.blocked_actions || []"
                :key="item"
                class="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
              >
                {{ humanizeWorkflowAction(item) }}
              </span>
              <span
                v-if="!(detailWorkflow?.blocked_actions || []).length"
                class="text-body-sm text-rs-muted"
              >
                No runtime blockers are active.
              </span>
            </div>
          </div>

          <div class="rounded-2xl border border-rs-border bg-rs-bg/40 p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">
              Allowed prelaunch actions
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="item in detailWorkflow?.allowed_prelaunch_actions || []"
                :key="item"
                class="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800"
              >
                {{ humanizeWorkflowAction(item) }}
              </span>
            </div>
          </div>

          <div
            class="text-body-sm rounded-2xl border border-rs-border bg-rs-bg/40 p-4 text-rs-muted"
          >
            <div class="font-semibold text-rs-fg">Operator expectation</div>
            <p class="mt-2">
              Keep onboarding moving with suspended records and metadata capture. Do not expect live
              keys, exports, or webhook traffic until the launch gate says the environment is ready.
            </p>
          </div>
        </div>
      </article>
    </section>

    <section class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-body-lg font-semibold text-rs-fg">Clients</h2>
          <p class="text-body-sm mt-1 text-rs-muted">
            Filter by status, inspect onboarding context, and keep prelaunch accounts out of live
            traffic.
          </p>
        </div>

        <label class="text-body-sm text-rs-muted">
          Status filter
          <select
            v-model="statusFilter"
            class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
            @change="loadClients"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="revoked">Revoked</option>
          </select>
        </label>
      </div>

      <DataTable
        class="mt-4"
        :columns="clientColumns"
        :rows="clientRows"
        :row-key="(row: any) => row.id ?? String(row)"
        :loading="loading"
        :error="error ? { message: error } : null"
        :empty="{
          title: 'No institutional clients found.',
          message: 'Use the prelaunch form to create suspended client records before launch.',
        }"
      >
        <template #cell-name="{ row }">
          <button
            class="text-body-sm text-left font-semibold text-rs-fg hover:underline"
            @click="toggleDetail(asString((row as any).id))"
          >
            {{ (row as any).name }}
          </button>
        </template>

        <template #cell-tier="{ row }">
          <span
            class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="tierBadgeClass(clientFromRow((row as any).raw).tier)"
          >
            {{ clientFromRow((row as any).raw).tier }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <span
            class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="statusBadgeClass(clientFromRow((row as any).raw).status)"
          >
            {{ clientFromRow((row as any).raw).status }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-3">
            <button
              class="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:text-neutral-400"
              :disabled="!canMutate"
              @click="startEdit(clientFromRow((row as any).raw))"
            >
              Edit
            </button>
            <button
              v-if="clientFromRow((row as any).raw).status === 'active'"
              class="text-xs font-semibold text-amber-700 hover:text-amber-800 disabled:text-neutral-400"
              :disabled="!canMutate"
              @click="changeStatus(clientFromRow((row as any).raw), 'suspended')"
            >
              Suspend
            </button>
            <button
              v-if="clientFromRow((row as any).raw).status === 'suspended'"
              class="text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:text-neutral-400"
              :disabled="!canMutate || isActivationBlocked"
              :title="isActivationBlocked ? launchGateMessage : undefined"
              @click="changeStatus(clientFromRow((row as any).raw), 'active')"
            >
              Reactivate
            </button>
            <button
              v-if="clientFromRow((row as any).raw).status !== 'revoked'"
              class="text-xs font-semibold text-danger-600 hover:text-danger-700 disabled:text-neutral-400"
              :disabled="!canMutate"
              @click="changeStatus(clientFromRow((row as any).raw), 'revoked')"
            >
              Revoke
            </button>
            <button
              class="text-xs font-semibold text-rs-muted hover:text-rs-fg disabled:text-neutral-400"
              :disabled="!canMutate || isActivationBlocked"
              :title="
                isActivationBlocked
                  ? 'Key rotation remains blocked while the launch gate is closed.'
                  : undefined
              "
              @click="rotateKey(clientFromRow((row as any).raw))"
            >
              Rotate key
            </button>
          </div>
        </template>
      </DataTable>

      <div v-if="expandedClient" class="mt-6 rounded-3xl border border-rs-border bg-rs-bg/30 p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div class="flex items-center gap-3">
              <h3 class="text-body-lg font-semibold text-rs-fg">{{ expandedClient.name }}</h3>
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="statusBadgeClass(expandedClient.status)"
              >
                {{ expandedClient.status }}
              </span>
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="tierBadgeClass(expandedClient.tier)"
              >
                {{ expandedClient.tier }}
              </span>
            </div>
            <p class="text-body-sm mt-1 text-rs-muted">
              Prefix: <span class="font-mono text-rs-fg">{{ expandedClient.client_prefix }}</span>
              <span class="mx-2 text-neutral-300">|</span>
              Owner:
              <span class="text-rs-fg">{{
                expandedClient.internal_owner_email || 'Unassigned'
              }}</span>
            </p>
          </div>

          <button
            class="text-body-sm h-10 rounded-lg border border-rs-border px-4 font-semibold text-rs-fg hover:bg-neutral-50"
            @click="
              expandedId = null;
              clientDetail = null;
            "
          >
            Close
          </button>
        </div>

        <div v-if="detailLoading" class="text-body-sm mt-4 text-rs-muted">
          Loading client detail...
        </div>

        <div v-else-if="clientDetail" class="mt-5 grid gap-4 lg:grid-cols-3">
          <article class="rounded-2xl border border-rs-border bg-rs-surface p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">
              Workflow
            </div>
            <div class="text-body-sm mt-3 text-rs-fg">
              Key state:
              <span class="font-semibold">{{ detailWorkflow?.key_state || 'unknown' }}</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="item in detailWorkflow?.blocked_actions || []"
                :key="`detail-blocked-${item}`"
                class="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
              >
                {{ humanizeWorkflowAction(item) }}
              </span>
              <span
                v-if="!(detailWorkflow?.blocked_actions || []).length"
                class="text-body-sm text-rs-muted"
              >
                No blocked live actions.
              </span>
            </div>
          </article>

          <article class="rounded-2xl border border-rs-border bg-rs-surface p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">
              Usage (30d)
            </div>
            <div class="text-h3 mt-3 font-semibold text-rs-fg">
              {{ clientDetail.usage.total_requests_30d }}
            </div>
            <p class="text-body-sm mt-1 text-rs-muted">
              Suspended prelaunch clients should generally remain at zero.
            </p>
            <div class="mt-3 space-y-1 text-xs text-rs-muted">
              <div
                v-for="entry in clientDetail.usage.by_endpoint"
                :key="entry.endpoint"
                class="flex items-center justify-between gap-3 rounded-lg bg-rs-bg px-3 py-2"
              >
                <span class="font-mono text-rs-fg">{{ entry.endpoint }}</span>
                <span>{{ entry.count }}</span>
              </div>
              <div v-if="clientDetail.usage.by_endpoint.length === 0">
                No endpoint usage recorded.
              </div>
            </div>
          </article>

          <article class="rounded-2xl border border-rs-border bg-rs-surface p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">
              Exports
            </div>
            <div class="mt-3 space-y-1 text-xs text-rs-muted">
              <div
                v-for="entry in clientDetail.exports"
                :key="entry.id"
                class="rounded-lg bg-rs-bg px-3 py-2"
              >
                <div class="font-semibold text-rs-fg">
                  {{ entry.export_kind }} on {{ entry.export_date }}
                </div>
                <div>{{ entry.row_count }} rows</div>
              </div>
              <div v-if="clientDetail.exports.length === 0">No exports recorded.</div>
            </div>
          </article>

          <article class="rounded-2xl border border-rs-border bg-rs-surface p-4 lg:col-span-2">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">
              Commercial and compliance context
            </div>
            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <div
                class="text-body-sm rounded-xl border border-rs-border bg-rs-bg px-3 py-3 text-rs-fg"
              >
                <div class="font-semibold">Owner</div>
                <div class="mt-1 text-rs-muted">
                  {{ expandedClient.internal_owner_email || 'Unassigned' }}
                </div>
              </div>
              <div
                class="text-body-sm rounded-xl border border-rs-border bg-rs-bg px-3 py-3 text-rs-fg"
              >
                <div class="font-semibold">Report schedule</div>
                <div class="mt-1 text-rs-muted">{{ expandedClient.report_schedule }}</div>
              </div>
              <div
                class="text-body-sm rounded-xl border border-rs-border bg-rs-bg px-3 py-3 text-rs-fg md:col-span-2"
              >
                <div class="font-semibold">Compliance notes</div>
                <div class="mt-1 whitespace-pre-wrap text-rs-muted">
                  {{ expandedClient.compliance_notes || 'No compliance notes captured.' }}
                </div>
              </div>
            </div>
          </article>

          <article class="rounded-2xl border border-rs-border bg-rs-surface p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">
              Scopes
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="scope in clientDetail.scopes"
                :key="scope"
                class="rounded-full border border-rs-border bg-rs-bg px-3 py-1 text-xs font-semibold text-rs-fg"
              >
                {{ scope }}
              </span>
            </div>
          </article>

          <article class="rounded-2xl border border-rs-border bg-rs-surface p-4 lg:col-span-3">
            <div class="grid gap-4 lg:grid-cols-2">
              <div>
                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">
                  Onboarding checklist JSON
                </div>
                <pre class="mt-3 overflow-auto rounded-xl bg-rs-bg px-3 py-3 text-xs text-rs-fg">{{
                  formatJson(expandedClient.onboarding_checklist || {})
                }}</pre>
              </div>
              <div>
                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">
                  Prelaunch config JSON
                </div>
                <pre class="mt-3 overflow-auto rounded-xl bg-rs-bg px-3 py-3 text-xs text-rs-fg">{{
                  formatJson(expandedClient.prelaunch_config || {})
                }}</pre>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <div
      v-if="editingClient"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      @click.self="editingClient = null"
    >
      <div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-body-lg font-semibold text-rs-fg">Edit client</h3>
            <p class="text-body-sm mt-1 text-rs-muted">{{ editingClient.name }}</p>
          </div>
          <button
            class="text-body-sm rounded-lg border border-rs-border px-3 py-1.5 font-semibold text-rs-fg hover:bg-neutral-50"
            @click="editingClient = null"
          >
            Close
          </button>
        </div>

        <form class="mt-5 grid gap-4 md:grid-cols-2" @submit.prevent="saveEdit">
          <label class="text-body-sm text-rs-muted">
            Client name
            <input
              v-model="editForm.name"
              type="text"
              class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
              :disabled="saving"
            />
          </label>

          <label class="text-body-sm text-rs-muted">
            Tier
            <select
              v-model="editForm.tier"
              class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
              :disabled="saving"
            >
              <option value="trial">Trial</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </label>

          <div class="text-body-sm text-rs-muted md:col-span-2">
            <div class="font-medium text-rs-muted">Allowed country pairs</div>
            <p class="mt-1 text-xs text-rs-muted">
              Search by send country or destination country. We save source/destination country
              only, bank deposit only.
            </p>
            <input
              v-model="editCorridorSearch"
              type="text"
              class="text-body-sm mt-2 w-full rounded-lg border border-rs-border px-3 py-2"
              :disabled="saving || corridorCatalogLoading"
              placeholder="Search by send country or destination country"
              @keydown.enter.prevent="commitEditCorridorSearch"
            />
            <div
              v-if="corridorCatalogLoading"
              class="mt-2 rounded-2xl border border-rs-border bg-rs-bg/40 px-3 py-3 text-xs text-rs-muted"
            >
              Loading country-pair catalog...
            </div>
            <div
              v-else-if="corridorCatalogError"
              class="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900"
            >
              {{ corridorCatalogError }}
            </div>
            <div
              v-else-if="editCorridorCandidates.length > 0"
              class="mt-2 grid gap-2 sm:grid-cols-2"
            >
              <button
                v-for="corridor in editCorridorCandidates"
                :key="`edit-${corridor.value}`"
                type="button"
                class="rounded-2xl border border-rs-border bg-white px-4 py-3 text-left hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-60"
                :disabled="saving"
                @click="addEditCorridor(corridor.value)"
              >
                <div class="font-semibold text-rs-fg">{{ corridor.label }}</div>
                <div class="mt-1 text-xs text-rs-muted">Bank deposit only</div>
              </button>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="corridor in editSelectedCorridorOptions"
                :key="`edit-selected-${corridor.value}`"
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
                :disabled="saving"
                @click="removeEditCorridor(corridor.value)"
              >
                <span>{{ corridor.label }}</span>
                <span class="text-brand-500">×</span>
              </button>
              <span
                v-if="editSelectedCorridorOptions.length === 0"
                class="text-body-sm text-rs-muted"
              >
                No country pairs selected yet.
              </span>
            </div>
          </div>

          <label class="text-body-sm text-rs-muted">
            Rate limit RPM
            <input
              v-model.number="editForm.rate_limit_rpm"
              type="number"
              min="0"
              class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
              :disabled="saving"
            />
          </label>

          <label class="text-body-sm text-rs-muted">
            Rate limit daily
            <input
              v-model.number="editForm.rate_limit_daily"
              type="number"
              min="0"
              class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
              :disabled="saving"
            />
          </label>

          <label class="text-body-sm text-rs-muted">
            Contract start
            <input
              v-model="editForm.contract_start"
              type="date"
              class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
              :disabled="saving"
            />
          </label>

          <label class="text-body-sm text-rs-muted">
            Contract end
            <input
              v-model="editForm.contract_end"
              type="date"
              class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
              :disabled="saving"
            />
          </label>

          <label class="text-body-sm text-rs-muted">
            Internal owner email
            <input
              v-model="editForm.internal_owner_email"
              type="email"
              class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
              :disabled="saving"
            />
          </label>

          <label class="text-body-sm text-rs-muted">
            Report schedule
            <select
              v-model="editForm.report_schedule"
              class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
              :disabled="saving"
            >
              <option value="none">None</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>

          <label class="text-body-sm text-rs-muted md:col-span-2">
            Compliance notes
            <textarea
              v-model="editForm.compliance_notes"
              rows="4"
              class="text-body-sm mt-1 w-full rounded-lg border border-rs-border px-3 py-2"
              :disabled="saving"
            />
          </label>

          <label class="text-body-sm text-rs-muted md:col-span-2">
            Onboarding checklist JSON
            <textarea
              v-model="editForm.onboarding_checklist_json"
              rows="7"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 font-mono text-xs"
              :disabled="saving"
            />
          </label>

          <label class="text-body-sm text-rs-muted md:col-span-2">
            Prelaunch config JSON
            <textarea
              v-model="editForm.prelaunch_config_json"
              rows="7"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 font-mono text-xs"
              :disabled="saving"
            />
          </label>

          <div class="flex items-center justify-end gap-3 md:col-span-2">
            <button
              type="button"
              class="text-body-sm h-10 rounded-lg border border-rs-border px-4 font-semibold text-rs-fg hover:bg-neutral-50"
              @click="editingClient = null"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="text-body-sm h-10 rounded-lg bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="saving"
            >
              {{ saving ? 'Saving...' : 'Save changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="rotatedApiKey"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      @click.self="rotatedApiKey = ''"
    >
      <div class="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
        <h3 class="text-body-lg font-semibold text-rs-fg">New API key</h3>
        <p class="text-body-sm mt-1 text-rs-muted">
          Save this key now. The current key has already been invalidated.
        </p>

        <div class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <code
            class="block break-all rounded-lg border border-amber-200 bg-white px-3 py-3 text-xs text-rs-fg"
            >{{ rotatedApiKey }}</code
          >
          <div class="mt-3 flex justify-end gap-3">
            <button
              class="text-body-sm rounded-lg bg-amber-700 px-3 py-2 font-semibold text-white hover:bg-amber-800"
              @click="copyRotatedKey"
            >
              {{ rotatedCopied ? 'Copied' : 'Copy' }}
            </button>
            <button
              class="text-body-sm rounded-lg border border-rs-border px-3 py-2 font-semibold text-rs-fg hover:bg-neutral-50"
              @click="rotatedApiKey = ''"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue';
import { useApi } from '~/composables/useApi';
import { DataTable } from '~/ui';
import type { DataTableColumn } from '~/ui';
import type { AdminSurfaceOverviewModel } from '~/utils/adminSurfaceStatus';
import { formatAdminSurfaceAge, getFreshnessTone } from '~/utils/adminSurfaceStatus';
import { getAdminApiErrorMessage } from '~/utils/adminApiErrors';
import {
  buildCorridorSearchText,
  formatCorridorCountryPair,
  toCountryPairId,
} from '~/utils/corridorLabels';

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'admin',
});

const ErrorState = defineAsyncComponent(() => import('~/ui/states/ErrorState.vue'));

useAdminPage({
  title: 'Admin: Institutional Clients | Remit-Scout',
  description: 'Manage B2B institutional clients, prelaunch workflow, and activation guardrails.',
});

type InstitutionalClient = {
  id: string;
  name: string;
  client_prefix: string;
  tier: string;
  corridors_allowed: string[] | null;
  rate_limit_rpm: number;
  rate_limit_daily: number;
  status: string;
  nda_signed_at: string | null;
  contract_start: string | null;
  contract_end: string | null;
  report_schedule: string;
  internal_owner_email?: string | null;
  compliance_notes?: string | null;
  onboarding_checklist?: Record<string, unknown>;
  prelaunch_config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type LaunchGate = {
  ready: boolean;
  required_days: number;
  available_days: number;
  reason: string;
  updated_at: string | null;
  enforced?: boolean;
  blocked?: boolean;
  message?: string;
};

type InstitutionalWorkflow = {
  live_activation_blocked: boolean;
  blocked_actions: string[];
  allowed_prelaunch_actions: string[];
  key_state: string;
};

type CorridorCatalogRecord = {
  corridorId: string;
};

type CorridorCatalogResponse = {
  corridors?: CorridorCatalogRecord[];
};

type CountryPairOption = {
  value: string;
  label: string;
  searchText: string;
};

type ClientDetail = {
  client: InstitutionalClient;
  usage: {
    total_requests_30d: number;
    by_endpoint: Array<{ endpoint: string; count: number }>;
  };
  exports: Array<{
    id: string;
    export_date: string;
    export_kind: string;
    row_count: number;
    created_at: string;
  }>;
  scopes: string[];
  launch_gate?: LaunchGate;
  workflow?: InstitutionalWorkflow;
};

const defaultChecklist = () =>
  JSON.stringify(
    {
      security_review: false,
      contract_confirmed: false,
      corridors_verified: false,
      billing_verified: false,
    },
    null,
    2
  );

const defaultPrelaunchConfig = () =>
  JSON.stringify(
    {
      export_intent: 'none',
      webhook_url: '',
      go_live_owner: '',
    },
    null,
    2
  );

const { request } = useApi();
const { isSuperAdmin } = useAuth();
const log = useLogger('admin/institutional');

const loading = ref(true);
const error = ref<string | null>(null);
const clients = ref<InstitutionalClient[]>([]);
const launchGate = ref<LaunchGate | null>(null);
const workflow = ref<InstitutionalWorkflow | null>(null);
const summaryData = reactive({
  active: 0,
  suspended: 0,
  revoked: 0,
  trial: 0,
  standard: 0,
  premium: 0,
});
const statusFilter = ref('');

const showCreateForm = ref(false);
const creating = ref(false);
const createMessage = ref('');
const createSuccess = ref(false);
const newApiKey = ref('');
const copied = ref(false);

const createForm = reactive({
  name: '',
  client_prefix: '',
  tier: 'trial' as 'trial' | 'standard' | 'premium',
  corridors_raw: '',
  rate_limit_rpm: 60,
  rate_limit_daily: 10000,
  contract_start: '',
  contract_end: '',
  report_schedule: 'none' as 'weekly' | 'monthly' | 'none',
  internal_owner_email: '',
  compliance_notes: '',
  onboarding_checklist_json: defaultChecklist(),
  prelaunch_config_json: defaultPrelaunchConfig(),
});

const expandedId = ref<string | null>(null);
const detailLoading = ref(false);
const clientDetail = ref<ClientDetail | null>(null);
const editingClient = ref<InstitutionalClient | null>(null);
const editForm = reactive({
  name: '',
  tier: 'trial',
  corridors_raw: '',
  rate_limit_rpm: 0,
  rate_limit_daily: 0,
  contract_start: '',
  contract_end: '',
  report_schedule: 'none',
  internal_owner_email: '',
  compliance_notes: '',
  onboarding_checklist_json: '{}',
  prelaunch_config_json: '{}',
});
const saving = ref(false);
const rotatedApiKey = ref('');
const rotatedCopied = ref(false);
const corridorCatalogRaw = ref<CorridorCatalogRecord[]>([]);
const corridorCatalogLoading = ref(false);
const corridorCatalogError = ref<string | null>(null);
const createCorridorSearch = ref('');
const editCorridorSearch = ref('');
const createSelectedCorridors = ref<string[]>([]);
const editSelectedCorridors = ref<string[]>([]);

const canMutate = computed(() => Boolean(isSuperAdmin.value));
const expandedClient = computed(
  () => clients.value.find(client => client.id === expandedId.value) ?? null
);
const detailWorkflow = computed(() => clientDetail.value?.workflow ?? workflow.value);
const isActivationBlocked = computed(() => Boolean(launchGate.value?.blocked));
const corridorCatalogOptions = computed<CountryPairOption[]>(() => {
  const options = new Map<string, CountryPairOption>();
  for (const corridor of corridorCatalogRaw.value) {
    const value = toCountryPairId(corridor.corridorId);
    if (!value || options.has(value)) continue;
    options.set(value, {
      value,
      label: formatCorridorCountryPair(value, ' -> '),
      searchText: buildCorridorSearchText(value),
    });
  }
  return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label));
});
const createSelectedCorridorSet = computed(() => new Set(createSelectedCorridors.value));
const editSelectedCorridorSet = computed(() => new Set(editSelectedCorridors.value));

const launchGateMessage = computed(() => {
  if (!launchGate.value) return '';
  if (launchGate.value.message) return launchGate.value.message;
  if (launchGate.value.ready) {
    return `Institutional launch gate is open with ${launchGate.value.available_days} days of sellable Gold history.`;
  }
  return `Institutional launch stays blocked until ${launchGate.value.required_days} days of sellable Gold history are available (${launchGate.value.available_days} currently available).`;
});

const humanizeWorkflowAction = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const blockedActionSummary = computed(() =>
  (detailWorkflow.value?.blocked_actions || []).length
    ? (detailWorkflow.value?.blocked_actions || []).map(humanizeWorkflowAction).join(', ')
    : 'No blocked actions.'
);

const allowedActionSummary = computed(() =>
  (detailWorkflow.value?.allowed_prelaunch_actions || []).length
    ? (detailWorkflow.value?.allowed_prelaunch_actions || []).map(humanizeWorkflowAction).join(', ')
    : 'No prelaunch actions loaded yet.'
);

const tierBadgeClass = (tier: string) => {
  if (tier === 'premium') return 'bg-fuchsia-100 text-fuchsia-700';
  if (tier === 'standard') return 'bg-sky-100 text-sky-700';
  return 'bg-slate-200 text-slate-700';
};

const statusBadgeClass = (status: string) => {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700';
  if (status === 'suspended') return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
};

const clientColumns: DataTableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'client_prefix', label: 'Prefix' },
  { key: 'tier', label: 'Tier' },
  { key: 'status', label: 'Status' },
  { key: 'internal_owner_email', label: 'Owner' },
  { key: 'contract_end', label: 'Contract End' },
  { key: 'rate_limits', label: 'Rate Limits' },
  { key: 'report_schedule', label: 'Report' },
  { key: 'actions', label: 'Actions', align: 'right' },
];

const clientRows = computed(() =>
  clients.value.map(client => ({
    id: client.id,
    name: client.name,
    client_prefix: client.client_prefix,
    tier: client.tier,
    status: client.status,
    internal_owner_email: client.internal_owner_email || 'Unassigned',
    contract_end: client.contract_end || '-',
    rate_limits: `${client.rate_limit_rpm}/min, ${client.rate_limit_daily}/day`,
    report_schedule: client.report_schedule,
    actions: 'actions',
    raw: client,
  }))
);

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : String(value ?? '');
const clientFromRow = (value: unknown): InstitutionalClient => value as InstitutionalClient;

const normalizeAllowedCorridors = (values: string[] | null | undefined): string[] => {
  return Array.from(new Set((values || []).map(value => toCountryPairId(value)).filter(Boolean)));
};

const getFallbackCorridorOption = (corridorId: string): CountryPairOption => {
  const value = toCountryPairId(corridorId);
  return {
    value,
    label: formatCorridorCountryPair(value, ' -> '),
    searchText: buildCorridorSearchText(value),
  };
};

const toSelectedCorridorOptions = (values: string[]) =>
  values.map(
    corridorId =>
      corridorCatalogOptions.value.find(option => option.value === corridorId) ||
      getFallbackCorridorOption(corridorId)
  );

const createSelectedCorridorOptions = computed(() =>
  toSelectedCorridorOptions(createSelectedCorridors.value)
);
const editSelectedCorridorOptions = computed(() =>
  toSelectedCorridorOptions(editSelectedCorridors.value)
);

const filterCorridorOptions = (query: string, selected: Set<string>) => {
  const normalizedQuery = query.trim().toLowerCase();
  return corridorCatalogOptions.value
    .filter(option => !selected.has(option.value))
    .filter(option => !normalizedQuery || option.searchText.includes(normalizedQuery))
    .slice(0, 8);
};

const createCorridorCandidates = computed(() =>
  filterCorridorOptions(createCorridorSearch.value, createSelectedCorridorSet.value)
);
const editCorridorCandidates = computed(() =>
  filterCorridorOptions(editCorridorSearch.value, editSelectedCorridorSet.value)
);

const setCreateSelectedCorridors = (values: string[]) => {
  createSelectedCorridors.value = normalizeAllowedCorridors(values);
  createForm.corridors_raw = createSelectedCorridors.value.join(', ');
};

const setEditSelectedCorridors = (values: string[]) => {
  editSelectedCorridors.value = normalizeAllowedCorridors(values);
  editForm.corridors_raw = editSelectedCorridors.value.join(', ');
};

const addCreateCorridor = (corridorId: string) => {
  if (createSelectedCorridorSet.value.has(corridorId)) return;
  setCreateSelectedCorridors([...createSelectedCorridors.value, corridorId]);
  createCorridorSearch.value = '';
};

const removeCreateCorridor = (corridorId: string) => {
  setCreateSelectedCorridors(createSelectedCorridors.value.filter(value => value !== corridorId));
};

const addEditCorridor = (corridorId: string) => {
  if (editSelectedCorridorSet.value.has(corridorId)) return;
  setEditSelectedCorridors([...editSelectedCorridors.value, corridorId]);
  editCorridorSearch.value = '';
};

const removeEditCorridor = (corridorId: string) => {
  setEditSelectedCorridors(editSelectedCorridors.value.filter(value => value !== corridorId));
};

const commitCreateCorridorSearch = () => {
  if (createCorridorCandidates.value.length > 0) {
    addCreateCorridor(createCorridorCandidates.value[0].value);
  }
};

const commitEditCorridorSearch = () => {
  if (editCorridorCandidates.value.length > 0) {
    addEditCorridor(editCorridorCandidates.value[0].value);
  }
};

const selectedCorridorsPayload = (values: string[]) => {
  if (values.length === 0) return null;
  return values;
};

const parseJsonObject = (value: string, fallback: Record<string, unknown>) => {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return fallback;
  } catch {
    throw new Error('Invalid JSON payload.');
  }
};

const formatJson = (value: unknown) => JSON.stringify(value, null, 2);

const surfaceOverview = computed<AdminSurfaceOverviewModel>(() => {
  const latestClientUpdate = clients.value[0]?.updated_at || launchGate.value?.updated_at || null;
  const freshnessTone = getFreshnessTone(latestClientUpdate, {
    watchMinutes: 1440,
    criticalMinutes: 10080,
  });

  return {
    runtimeLabel: launchGate.value?.blocked ? 'Prelaunch mode active' : 'Live activation allowed',
    runtimeTone: launchGate.value?.blocked ? 'gated' : 'healthy',
    runtimeDetail: launchGate.value?.blocked
      ? 'Client creation, metadata capture, and draft configuration remain allowed. Live keys and production traffic stay blocked.'
      : 'The institutional launch gate is open. Suspended clients may be reactivated and issued live keys.',
    freshnessLabel: latestClientUpdate
      ? formatAdminSurfaceAge(latestClientUpdate)
      : 'No recent client updates',
    freshnessTone,
    freshnessDetail: latestClientUpdate
      ? `Latest client or launch-gate update at ${latestClientUpdate}.`
      : 'No institutional activity has been recorded in this environment yet.',
    lastJobLabel: launchGate.value?.updated_at || 'No launch-gate checkpoint',
    lastJobDetail: launchGateMessage.value || 'Launch-gate state has not loaded yet.',
    stats: [
      { label: 'Active', value: String(summaryData.active) },
      { label: 'Suspended', value: String(summaryData.suspended) },
      { label: 'Trial', value: String(summaryData.trial) },
      { label: 'Premium', value: String(summaryData.premium) },
    ],
    dependencies: [
      {
        label: 'Launch gate',
        status: launchGate.value?.blocked ? 'gated' : launchGate.value?.ready ? 'healthy' : 'watch',
        detail: launchGateMessage.value || 'No launch-gate checkpoint has been returned.',
      },
      {
        label: 'Workflow policy',
        status: detailWorkflow.value?.live_activation_blocked ? 'gated' : 'healthy',
        detail: detailWorkflow.value
          ? `${detailWorkflow.value.allowed_prelaunch_actions.length} prelaunch action(s) are allowed.`
          : 'Workflow policy has not loaded yet.',
      },
      {
        label: 'Client inventory',
        status: clients.value.length > 0 ? 'healthy' : 'watch',
        detail:
          clients.value.length > 0
            ? 'Institutional client records are present and inspectable.'
            : 'No institutional client records exist yet.',
      },
    ],
    nextActions: [
      {
        label:
          'Create or edit suspended clients with owner, compliance notes, checklist state, and draft config before launch.',
      },
      {
        label:
          'Do not expect API key rotation, exports, or webhook activity while the launch gate remains blocked.',
      },
      {
        label:
          'Use detail panels to verify suspended clients are not generating unexpected production usage.',
      },
    ],
    emptyState:
      clients.value.length === 0
        ? {
            title: 'No institutional clients yet.',
            body: 'That is acceptable in staging. Seed suspended records now so onboarding and launch-readiness work can proceed without live risk.',
          }
        : null,
  };
});

const resetCreateForm = () => {
  createForm.name = '';
  createForm.client_prefix = '';
  createForm.tier = 'trial';
  createForm.corridors_raw = '';
  createForm.rate_limit_rpm = 60;
  createForm.rate_limit_daily = 10000;
  createForm.contract_start = '';
  createForm.contract_end = '';
  createForm.report_schedule = 'none';
  createForm.internal_owner_email = '';
  createForm.compliance_notes = '';
  createForm.onboarding_checklist_json = defaultChecklist();
  createForm.prelaunch_config_json = defaultPrelaunchConfig();
  createCorridorSearch.value = '';
  setCreateSelectedCorridors([]);
};

const loadClients = async () => {
  loading.value = true;
  error.value = null;

  try {
    const query: Record<string, string> = {};
    if (statusFilter.value) {
      query.status = statusFilter.value;
    }

    const data = await request<{
      clients?: InstitutionalClient[];
      summary?: typeof summaryData;
      launch_gate?: LaunchGate;
      workflow?: InstitutionalWorkflow;
    }>('/admin/institutional/clients', { query });

    clients.value = data.clients || [];
    launchGate.value = data.launch_gate || null;
    workflow.value = data.workflow || null;
    Object.assign(summaryData, {
      active: 0,
      suspended: 0,
      revoked: 0,
      trial: 0,
      standard: 0,
      premium: 0,
      ...(data.summary || {}),
    });
  } catch (err) {
    error.value = getAdminApiErrorMessage(err, 'Failed to load institutional clients.');
    log.error('Failed to load institutional clients', err);
  } finally {
    loading.value = false;
  }
};

const loadCorridorCatalog = async () => {
  if (corridorCatalogLoading.value) return;

  corridorCatalogLoading.value = true;
  corridorCatalogError.value = null;

  try {
    const data = await request<CorridorCatalogResponse>('/indices/corridors');
    corridorCatalogRaw.value = Array.isArray(data.corridors) ? data.corridors : [];
  } catch {
    corridorCatalogError.value =
      'The country-pair catalog is unavailable right now. Refresh before updating enterprise corridor access.';
  } finally {
    corridorCatalogLoading.value = false;
  }
};

const createClient = async () => {
  if (!canMutate.value) return;

  creating.value = true;
  createMessage.value = '';
  createSuccess.value = false;
  newApiKey.value = '';

  try {
    const data = await request<{
      success?: boolean;
      client?: InstitutionalClient;
      api_key?: string | null;
      launch_gate?: LaunchGate;
      workflow?: InstitutionalWorkflow;
    }>('/admin/institutional/clients', {
      method: 'POST',
      body: {
        name: createForm.name,
        client_prefix: createForm.client_prefix,
        tier: createForm.tier,
        corridors_allowed: selectedCorridorsPayload(createSelectedCorridors.value),
        rate_limit_rpm: createForm.rate_limit_rpm,
        rate_limit_daily: createForm.rate_limit_daily,
        contract_start: createForm.contract_start || null,
        contract_end: createForm.contract_end || null,
        report_schedule: createForm.report_schedule,
        internal_owner_email: createForm.internal_owner_email || null,
        compliance_notes: createForm.compliance_notes || null,
        onboarding_checklist: parseJsonObject(createForm.onboarding_checklist_json, {}),
        prelaunch_config: parseJsonObject(createForm.prelaunch_config_json, {}),
      },
    });

    launchGate.value = data.launch_gate || launchGate.value;
    workflow.value = data.workflow || workflow.value;

    if (data.success) {
      createSuccess.value = true;
      createMessage.value =
        data.client?.status === 'suspended'
          ? `Client "${createForm.name}" created in suspended prelaunch mode.`
          : `Client "${createForm.name}" created successfully.`;
      newApiKey.value = data.api_key || '';
      resetCreateForm();
      await loadClients();
    } else {
      createMessage.value = 'Failed to create client.';
    }
  } catch (err) {
    createMessage.value = getAdminApiErrorMessage(err, 'Failed to create client.');
    createSuccess.value = false;
  } finally {
    creating.value = false;
  }
};

const copyText = async (value: string) => {
  if (!value || !import.meta.client || !navigator.clipboard?.writeText) return;
  await navigator.clipboard.writeText(value);
};

const copyApiKey = async () => {
  await copyText(newApiKey.value);
  copied.value = true;
  window.setTimeout(() => {
    copied.value = false;
  }, 2000);
};

const copyRotatedKey = async () => {
  await copyText(rotatedApiKey.value);
  rotatedCopied.value = true;
  window.setTimeout(() => {
    rotatedCopied.value = false;
  }, 2000);
};

const toggleDetail = async (id: string) => {
  if (expandedId.value === id) {
    expandedId.value = null;
    clientDetail.value = null;
    return;
  }

  expandedId.value = id;
  detailLoading.value = true;
  clientDetail.value = null;

  try {
    const data = await request<ClientDetail>(`/admin/institutional/clients/${id}`);
    clientDetail.value = data;
    launchGate.value = data.launch_gate || launchGate.value;
    workflow.value = data.workflow || workflow.value;
  } catch (err) {
    error.value = getAdminApiErrorMessage(err, 'Failed to load client detail.');
    log.error('Failed to load institutional client detail', err);
  } finally {
    detailLoading.value = false;
  }
};

const startEdit = (client: InstitutionalClient) => {
  if (!canMutate.value) return;
  editingClient.value = client;
  editForm.name = client.name;
  editForm.tier = client.tier;
  setEditSelectedCorridors(client.corridors_allowed || []);
  editCorridorSearch.value = '';
  editForm.rate_limit_rpm = client.rate_limit_rpm;
  editForm.rate_limit_daily = client.rate_limit_daily;
  editForm.contract_start = client.contract_start || '';
  editForm.contract_end = client.contract_end || '';
  editForm.report_schedule = client.report_schedule;
  editForm.internal_owner_email = client.internal_owner_email || '';
  editForm.compliance_notes = client.compliance_notes || '';
  editForm.onboarding_checklist_json = JSON.stringify(client.onboarding_checklist || {}, null, 2);
  editForm.prelaunch_config_json = JSON.stringify(client.prelaunch_config || {}, null, 2);
};

const saveEdit = async () => {
  if (!editingClient.value) return;

  saving.value = true;
  try {
    await request(`/admin/institutional/clients/${editingClient.value.id}`, {
      method: 'PATCH',
      body: {
        name: editForm.name,
        tier: editForm.tier,
        corridors_allowed: selectedCorridorsPayload(editSelectedCorridors.value),
        rate_limit_rpm: editForm.rate_limit_rpm,
        rate_limit_daily: editForm.rate_limit_daily,
        contract_start: editForm.contract_start || null,
        contract_end: editForm.contract_end || null,
        report_schedule: editForm.report_schedule,
        internal_owner_email: editForm.internal_owner_email || null,
        compliance_notes: editForm.compliance_notes || null,
        onboarding_checklist: parseJsonObject(editForm.onboarding_checklist_json, {}),
        prelaunch_config: parseJsonObject(editForm.prelaunch_config_json, {}),
      },
    });

    const openId = expandedId.value;
    editingClient.value = null;
    await loadClients();
    if (openId) {
      expandedId.value = openId;
      detailLoading.value = true;
      clientDetail.value = null;
      try {
        const data = await request<ClientDetail>(`/admin/institutional/clients/${openId}`);
        clientDetail.value = data;
        launchGate.value = data.launch_gate || launchGate.value;
        workflow.value = data.workflow || workflow.value;
      } finally {
        detailLoading.value = false;
      }
    }
  } catch (err) {
    error.value = getAdminApiErrorMessage(err, 'Failed to update client.');
    log.error('Failed to update institutional client', err);
  } finally {
    saving.value = false;
  }
};

const changeStatus = async (client: InstitutionalClient, newStatus: string) => {
  if (!canMutate.value) return;
  if (newStatus === 'active' && isActivationBlocked.value) {
    error.value = launchGateMessage.value;
    return;
  }

  const action =
    newStatus === 'revoked' ? 'revoke' : newStatus === 'suspended' ? 'suspend' : 'reactivate';
  if (!window.confirm(`Are you sure you want to ${action} "${client.name}"?`)) return;

  try {
    const data = await request<{ workflow?: InstitutionalWorkflow; launch_gate?: LaunchGate }>(
      `/admin/institutional/clients/${client.id}/status`,
      {
        method: 'POST',
        body: { status: newStatus },
      }
    );
    workflow.value = data.workflow || workflow.value;
    launchGate.value = data.launch_gate || launchGate.value;
    await loadClients();
  } catch (err) {
    error.value = getAdminApiErrorMessage(err, 'Failed to change client status.');
    log.error('Failed to change institutional client status', err);
  }
};

const rotateKey = async (client: InstitutionalClient) => {
  if (!canMutate.value) return;
  if (
    !window.confirm(
      `Rotate API key for "${client.name}"? The current key will be invalidated immediately.`
    )
  )
    return;

  try {
    const data = await request<{
      success?: boolean;
      api_key?: string;
      launch_gate?: LaunchGate;
      workflow?: InstitutionalWorkflow;
    }>(`/admin/institutional/clients/${client.id}/rotate-key`, { method: 'POST' });
    rotatedApiKey.value = data.api_key || '';
    rotatedCopied.value = false;
    workflow.value = data.workflow || workflow.value;
    launchGate.value = data.launch_gate || launchGate.value;
  } catch (err) {
    error.value = getAdminApiErrorMessage(err, 'Failed to rotate API key.');
    log.error('Failed to rotate institutional client API key', err);
  }
};

onMounted(() => {
  void loadClients();
  void loadCorridorCatalog();
});
</script>
