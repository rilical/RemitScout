<template>
  <div class="min-h-screen bg-slate-50 px-6 py-10">
    <div class="mx-auto flex max-w-6xl flex-col gap-6">
      <header class="rounded-2xl bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-slate-900">Observer Console</h1>
            <p class="text-sm text-slate-500">
              AWS-first launch observation for Silver, Gold, alerts, and exports.
            </p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <button
              class="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              :disabled="ensuring"
              title="Creates silver.alert_notification_attempt (dev/staging only)"
              @click="ensureAuditTable"
            >
              {{ ensuring ? 'Ensuring…' : 'Ensure email audit table' }}
            </button>
            <button
              class="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              :disabled="evaluating"
              title="Admin-only dev helper: evaluate alerts now (ignores schedule constraints)"
              @click="runAlertEvaluation"
            >
              {{ evaluating ? 'Evaluating…' : 'Run alert evaluation' }}
            </button>
            <button
              class="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              :disabled="loading"
              @click="loadObserver"
            >
              {{ loading ? 'Refreshing…' : 'Refresh status' }}
            </button>
          </div>
        </div>
        <div class="mt-3 text-xs text-slate-500">
          Last refresh: {{ formatTimestamp(lastRefresh) }}
        </div>
        <p
          v-if="error"
          class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700"
        >
          {{ error }}
        </p>
      </header>

      <section class="rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">AWS click-paths</h2>
        <p class="text-xs text-slate-500">
          Open these directly in AWS Console for visual monitoring.
        </p>
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <a
            v-for="link in awsLinks"
            :key="link.label"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-xl border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50"
          >
            <div class="text-sm font-semibold text-slate-900">{{ link.label }}</div>
            <div class="mt-1 text-xs text-slate-500">{{ link.description }}</div>
          </a>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-3">
        <div class="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 class="text-lg font-semibold text-slate-900">Indices health</h2>
          <p class="text-xs text-slate-500">
            Source: <code>/api/v1/ops/indices/health</code>
          </p>
          <div
            v-if="indicesHealth"
            class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div class="rounded-lg border border-slate-100 p-3">
              <div class="text-xs uppercase text-slate-400">Status</div>
              <div class="mt-1 text-lg font-semibold text-slate-900">{{ indicesHealth.status }}</div>
            </div>
            <div class="rounded-lg border border-slate-100 p-3">
              <div class="text-xs uppercase text-slate-400">Available ratio</div>
              <div class="mt-1 text-lg font-semibold text-slate-900">
                {{ formatPercent(indicesHealth.summary?.available_ratio) }}
              </div>
            </div>
            <div class="rounded-lg border border-slate-100 p-3">
              <div class="text-xs uppercase text-slate-400">Suppressed ratio</div>
              <div class="mt-1 text-lg font-semibold text-slate-900">
                {{ formatPercent(indicesHealth.summary?.suppressed_ratio) }}
              </div>
            </div>
            <div class="rounded-lg border border-slate-100 p-3">
              <div class="text-xs uppercase text-slate-400">Min provider count</div>
              <div class="mt-1 text-lg font-semibold text-slate-900">
                {{ formatNumber(indicesHealth.summary?.min_provider_count, 0) }}
              </div>
            </div>
            <div class="rounded-lg border border-slate-100 p-3">
              <div class="text-xs uppercase text-slate-400">Weight confidence p10</div>
              <div class="mt-1 text-lg font-semibold text-slate-900">
                {{ formatNumber(indicesHealth.summary?.weight_confidence_p10, 3) }}
              </div>
            </div>
            <div class="rounded-lg border border-slate-100 p-3">
              <div class="text-xs uppercase text-slate-400">Latest Gold date</div>
              <div class="mt-1 text-lg font-semibold text-slate-900">
                {{ indicesHealth.summary?.latest_date || 'n/a' }}
              </div>
            </div>
          </div>
          <p
            v-else
            class="mt-4 text-sm text-slate-500"
          >
            No indices health data yet.
          </p>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">B2B cadence</h2>
          <p class="text-xs text-slate-500">
            Source: <code>/api/v1/ops/b2b-sweep-status</code>
          </p>
          <div
            v-if="b2bSweepStatus?.schedule?.length"
            class="mt-4 space-y-3"
          >
            <div
              v-for="tier in b2bSweepStatus.schedule"
              :key="tier.priorityTier"
              class="rounded-lg border border-slate-100 p-3"
            >
              <div class="text-sm font-semibold text-slate-900">{{ tier.priorityTier }}</div>
              <div class="mt-1 text-xs text-slate-500">
                providers={{ tier.providers }}, enabled={{ tier.anyEnabled ? 'yes' : 'no' }}
              </div>
              <div class="text-xs text-slate-500">
                drift={{ tier.driftMinutes ?? 'n/a' }} min
              </div>
            </div>
          </div>
          <p
            v-else
            class="mt-4 text-sm text-slate-500"
          >
            No sweep status data yet.
          </p>
        </div>
      </section>

      <section class="rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">Provider spot-check</h2>
        <p class="text-xs text-slate-500">
          These are key provider health endpoints to confirm stale/fresh quote windows.
        </p>
        <div class="mt-4 overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="text-xs uppercase text-slate-400">
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
                class="border-t border-slate-100"
              >
                <td class="py-2 text-slate-700">{{ row.providerLabel }}</td>
                <td class="py-2 text-right text-slate-600">{{ row.corridorCount ?? 'n/a' }}</td>
                <td class="py-2 text-right text-slate-600">{{ row.staleCount ?? 'n/a' }}</td>
                <td class="py-2 text-right text-slate-600">{{ row.freshWindowMinutes ?? 'n/a' }}</td>
                <td class="py-2 text-slate-500">{{ formatTimestamp(row.timestamp) }}</td>
              </tr>
              <tr v-if="providerChecks.length === 0">
                <td
                  colspan="5"
                  class="py-3 text-center text-xs text-slate-400"
                >
                  No provider checks yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">Latest Silver activity</h2>
        <p class="text-xs text-slate-500">
          Source: <code>/api/v1/ops/observer/summary</code>
        </p>

        <div
          v-if="observerSummary?.success"
          class="mt-4 space-y-6"
        >
          <div class="grid gap-6 lg:grid-cols-2">
            <div class="rounded-xl border border-slate-100 p-4">
              <div class="text-sm font-semibold text-slate-900">Watchlist items</div>
              <div class="mt-2 overflow-auto">
                <table class="min-w-full text-sm">
                  <thead class="text-xs uppercase text-slate-400">
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
                      class="border-t border-slate-100"
                    >
                      <td class="py-2 text-xs text-slate-500">{{ formatTimestamp(row.updated_at) }}</td>
                      <td class="py-2 text-xs text-slate-500">{{ row.user_id.slice(0, 8) }}…</td>
                      <td class="py-2 text-slate-700">{{ row.target_type }}</td>
                      <td class="py-2 text-slate-700">{{ row.label || '—' }}</td>
                    </tr>
                    <tr v-if="observerSummary.latest.watchlist_items.length === 0">
                      <td
                        colspan="4"
                        class="py-3 text-center text-xs text-slate-400"
                      >
                        No watchlist items yet.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="rounded-xl border border-slate-100 p-4">
              <div class="text-sm font-semibold text-slate-900">Alerts</div>
              <div class="mt-2 overflow-auto">
                <table class="min-w-full text-sm">
                  <thead class="text-xs uppercase text-slate-400">
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
                      class="border-t border-slate-100"
                    >
                      <td class="py-2 text-xs text-slate-500">{{ formatTimestamp(row.updated_at) }}</td>
                      <td class="py-2 text-slate-700">{{ row.metric }}</td>
                      <td class="py-2 text-slate-700">
                        {{ row.comparator }} {{ row.threshold }}
                        <span
                          v-if="row.currency"
                          class="text-xs text-slate-500"
                        >
                          {{ row.currency }}
                        </span>
                      </td>
                      <td class="py-2 text-xs text-slate-500">{{ row.user_id.slice(0, 8) }}…</td>
                      <td class="py-2 text-slate-700">{{ row.enabled ? 'yes' : 'no' }}</td>
                    </tr>
                    <tr v-if="observerSummary.latest.alerts.length === 0">
                      <td
                        colspan="5"
                        class="py-3 text-center text-xs text-slate-400"
                      >
                        No alerts yet.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-slate-100 p-4">
            <div class="text-sm font-semibold text-slate-900">Alert events</div>
            <div class="mt-2 overflow-auto">
              <table class="min-w-full text-sm">
                <thead class="text-xs uppercase text-slate-400">
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
                    class="border-t border-slate-100"
                  >
                    <td class="py-2 text-xs text-slate-500">{{ formatTimestamp(row.triggered_at) }}</td>
                    <td class="py-2 text-xs text-slate-500">{{ row.alert_id.slice(0, 8) }}…</td>
                    <td class="py-2 text-slate-700">{{ row.value ?? '—' }}</td>
                    <td class="py-2 text-slate-700">{{ row.notification_status ?? '—' }}</td>
                    <td class="py-2 text-xs text-slate-500">{{ row.message || '—' }}</td>
                  </tr>
                  <tr v-if="observerSummary.latest.alert_events.length === 0">
                    <td
                      colspan="5"
                      class="py-3 text-center text-xs text-slate-400"
                    >
                      No alert events yet.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="rounded-xl border border-slate-100 p-4">
            <div class="text-sm font-semibold text-slate-900">Email send attempts (audit)</div>
            <div class="mt-1 text-xs text-slate-500">
              Enable via <code>ALERTS_NOTIFICATION_AUDIT=1</code> (optional <code>..._CONTENT</code>, <code>..._PII</code>).
            </div>
            <div class="mt-2 overflow-auto">
              <table class="min-w-full text-sm">
                <thead class="text-xs uppercase text-slate-400">
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
                    class="border-t border-slate-100"
                  >
                    <td class="py-2 text-xs text-slate-500">{{ formatTimestamp(row.created_at) }}</td>
                    <td class="py-2 text-slate-700">{{ row.status }}</td>
                    <td class="py-2 text-xs text-slate-500">
                      {{ row.to_email || (row.to_email_hash ? `${row.to_email_hash.slice(0, 10)}…` : '—') }}
                    </td>
                    <td class="py-2 text-slate-700">{{ row.subject || '—' }}</td>
                    <td class="py-2 text-xs text-slate-500">
                      {{ row.skip_reason || row.error || '—' }}
                    </td>
                  </tr>
                  <tr v-if="observerSummary.latest.notification_attempts.length === 0">
                    <td
                      colspan="5"
                      class="py-3 text-center text-xs text-slate-400"
                    >
                      No notification attempts recorded.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="rounded-xl border border-slate-100 p-4">
            <div class="text-sm font-semibold text-slate-900">Latest quote records</div>
            <div class="mt-2 overflow-auto">
              <table class="min-w-full text-sm">
                <thead class="text-xs uppercase text-slate-400">
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
                    class="border-t border-slate-100"
                  >
                    <td class="py-2 text-xs text-slate-500">{{ formatTimestamp(row.created_at) }}</td>
                    <td class="py-2 text-slate-700">{{ row.provider_id }}</td>
                    <td class="py-2 text-slate-700">{{ row.corridor_id }}</td>
                    <td class="py-2 text-slate-700">{{ row.amount_bucket }}</td>
                    <td class="py-2 text-slate-700">{{ row.status }}</td>
                  </tr>
                  <tr v-if="observerSummary.latest.quotes.length === 0">
                    <td
                      colspan="5"
                      class="py-3 text-center text-xs text-slate-400"
                    >
                      No quote records yet.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="rounded-xl border border-slate-100 p-4">
            <div class="text-sm font-semibold text-slate-900">DB fallback queues</div>
            <p class="mt-1 text-xs text-slate-500">
              Counts from <code>silver.quote_refresh_request</code> and <code>silver.fx_rate_refresh_request</code>.
            </p>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <div class="rounded-lg border border-slate-100 p-3">
                <div class="text-xs uppercase text-slate-400">Quote refresh</div>
                <div class="mt-2 space-y-1 text-sm text-slate-700">
                  <div
                    v-for="row in observerSummary.queues.quote_refresh"
                    :key="row.status"
                    class="flex items-center justify-between"
                  >
                    <span>{{ row.status }}</span>
                    <span class="font-semibold">{{ row.count }}</span>
                  </div>
                  <div v-if="observerSummary.queues.quote_refresh.length === 0" class="text-xs text-slate-400">n/a</div>
                </div>
              </div>
              <div class="rounded-lg border border-slate-100 p-3">
                <div class="text-xs uppercase text-slate-400">FX refresh</div>
                <div class="mt-2 space-y-1 text-sm text-slate-700">
                  <div
                    v-for="row in observerSummary.queues.fx_rate_refresh"
                    :key="row.status"
                    class="flex items-center justify-between"
                  >
                    <span>{{ row.status }}</span>
                    <span class="font-semibold">{{ row.count }}</span>
                  </div>
                  <div v-if="observerSummary.queues.fx_rate_refresh.length === 0" class="text-xs text-slate-400">n/a</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p
          v-else
          class="mt-4 text-sm text-slate-500"
        >
          Observer summary unavailable yet (migrations/permissions/config may still be applying).
        </p>
      </section>

      <section class="rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">CSV paths (no CLI)</h2>
        <ul class="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>RDS Query Editor v2: run SQL from <code>docs/runbooks/sql/observer-pack.sql</code> and click <strong>Export to CSV</strong>.</li>
          <li>Product export flow: create export via <code>/api/v1/exports</code>, then download from Exports UI.</li>
          <li>S3 export artifacts: open <code>remit-scout-exports-dev</code> and download generated files under the <code>exports/</code> prefix.</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })

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

type ProviderHealthResponse = {
  summary?: {
    corridor_count?: number | null
    stale_count?: number | null
    fresh_window_minutes?: number | null
  }
  timestamp?: string | null
}

type ProviderCheckRow = {
  providerId: string
  providerLabel: string
  corridorCount: number | null
  staleCount: number | null
  freshWindowMinutes: number | null
  timestamp: string | null
}

type ObserverSummaryResponse = {
  success: boolean
  timestamp: string
  gold: {
    latest_date: string | null
  }
  queues: {
    quote_refresh: Array<{ status: string, count: number }>
    fx_rate_refresh: Array<{ status: string, count: number }>
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

const { request } = useApi()

const loading = ref(false)
const ensuring = ref(false)
const evaluating = ref(false)
const error = ref<string | null>(null)
const lastRefresh = ref<string | null>(null)
const indicesHealth = ref<IndicesHealthResponse | null>(null)
const b2bSweepStatus = ref<B2bSweepStatusResponse | null>(null)
const providerChecks = ref<ProviderCheckRow[]>([])
const observerSummary = ref<ObserverSummaryResponse | null>(null)

const awsLinks = [
  {
    label: 'CloudWatch Dashboard',
    description: 'Primary visual health page for queue depth, SLO, errors, and latency.',
    href: 'https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=remit-scout-dev',
  },
  {
    label: 'ECS Cluster (dev)',
    description: 'Worker desired/running counts and service-level failures.',
    href: 'https://us-east-1.console.aws.amazon.com/ecs/v2/clusters/remit-scout-dev/services?region=us-east-1',
  },
  {
    label: 'SQS Queues',
    description: 'Backlog + oldest message age for ingest, alerts, exports, and B2C.',
    href: 'https://us-east-1.console.aws.amazon.com/sqs/v3/home?region=us-east-1#/queues',
  },
  {
    label: 'RDS Query Editor v2',
    description: 'Run observer SQL and export CSV directly from AWS UI.',
    href: 'https://us-east-1.console.aws.amazon.com/rds/home?region=us-east-1#query-editor:',
  },
  {
    label: 'Bronze bucket',
    description: 'Raw payload objects (when collection is running).',
    href: 'https://s3.console.aws.amazon.com/s3/buckets/remit-scout-bronze-dev?region=us-east-1&bucketType=general&prefix=bronze%2F',
  },
  {
    label: 'Exports bucket',
    description: 'Generated CSV/PDF files from export jobs.',
    href: 'https://s3.console.aws.amazon.com/s3/buckets/remit-scout-exports-dev?region=us-east-1&bucketType=general&prefix=exports%2F',
  },
  {
    label: 'SES Account dashboard',
    description: 'Check sandbox state and whether send-path is blocked by identity limits.',
    href: 'https://us-east-1.console.aws.amazon.com/ses/home?region=us-east-1#/account-dashboard',
  },
  {
    label: 'SES Verified identities',
    description: 'Confirm From domain/email and recipient verification status.',
    href: 'https://us-east-1.console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities',
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

const formatPercent = (value?: number | null) => {
  if (!Number.isFinite(value)) return 'n/a'
  return `${(Number(value) * 100).toFixed(1)}%`
}

const formatNumber = (value?: number | null, fractionDigits = 2) => {
  if (!Number.isFinite(value)) return 'n/a'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: fractionDigits }).format(Number(value))
}

const formatTimestamp = (value?: string | null) => {
  if (!value) return 'n/a'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'n/a'
  return date.toLocaleString()
}

const ensureAuditTable = async () => {
  if (ensuring.value) return
  ensuring.value = true
  try {
    const result = await request<{ success: boolean, error?: string, message?: string }>(
      '/ops/db/ensure-alert-notification-attempts',
      { method: 'POST', timeoutMs: 8000, retries: 0 },
    )
    if (!result?.success) {
      error.value = result?.message || 'Failed to ensure email audit table.'
    }
    else {
      await loadObserver()
    }
  }
  catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to ensure email audit table.'
  }
  finally {
    ensuring.value = false
  }
}

const runAlertEvaluation = async () => {
  if (evaluating.value) return
  evaluating.value = true
  try {
    const result = await request<any>('/ops/alerts/evaluate', {
      method: 'POST',
      body: { frequency: 'daily', ignoreSchedule: true, limit: 50 },
      timeoutMs: 25000,
      retries: 0,
    })
    if (result?.success !== true) {
      error.value = result?.message || 'Alert evaluation failed.'
    }
    else {
      await loadObserver()
    }
  }
  catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Alert evaluation failed.'
  }
  finally {
    evaluating.value = false
  }
}

const loadObserver = async () => {
  if (loading.value) return
  loading.value = true
  error.value = null
  try {
    const [indicesResult, sweepResult, summaryResult, providerResults] = await Promise.allSettled([
      request<IndicesHealthResponse>('/ops/indices/health'),
      request<B2bSweepStatusResponse>('/ops/b2b-sweep-status'),
      request<ObserverSummaryResponse>('/ops/observer/summary?limit=50'),
      Promise.allSettled(
        watchedProviders.map(async (provider) => {
          const response = await request<ProviderHealthResponse>(`/ops/${provider.id}/health`)
          return {
            providerId: provider.id,
            providerLabel: provider.label,
            corridorCount: response.summary?.corridor_count ?? null,
            staleCount: response.summary?.stale_count ?? null,
            freshWindowMinutes: response.summary?.fresh_window_minutes ?? null,
            timestamp: response.timestamp ?? null,
          } satisfies ProviderCheckRow
        }),
      ),
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
    if (providerResults.status === 'fulfilled') {
      providerChecks.value = providerResults.value.flatMap((result) => {
        if (result.status !== 'fulfilled') return []
        return [result.value]
      })
    }

    const failures = [
      indicesResult.status === 'rejected' ? 'indices health' : null,
      sweepResult.status === 'rejected' ? 'B2B sweep status' : null,
      summaryResult.status === 'rejected' ? 'observer summary' : null,
      providerResults.status === 'rejected' ? 'provider checks' : null,
    ].filter(Boolean)
    if (failures.length > 0) {
      error.value = `Some observer panels failed to load: ${failures.join(', ')}`
    }

    lastRefresh.value = new Date().toISOString()
  }
  catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load observer status.'
  }
  finally {
    loading.value = false
  }
}

onMounted(loadObserver)
</script>
