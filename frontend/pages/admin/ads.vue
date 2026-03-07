<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Ad Inventory"
      subtitle="Runtime-aware ad operations with preview-only staging support and explicit rollout status."
    >
      <template #actions>
        <div class="flex items-center gap-3">
          <button
            class="h-10 rounded-lg border border-rs-border px-4 text-body-sm font-semibold text-rs-fg hover:bg-neutral-50 disabled:opacity-60"
            :disabled="loading"
            @click="loadAds"
          >
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
          <button
            class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            :disabled="previewLoading"
            @click="runPreview"
          >
            {{ previewLoading ? 'Running preview...' : 'Run preview' }}
          </button>
        </div>
      </template>
    </AdminPageShell>

    <ErrorState
      v-if="error"
      mode="card"
      :message="error"
      :on-retry="loadAds"
    />

    <AdminSurfaceOverview :model="surfaceOverview" />

    <section
      class="rounded-3xl border p-5 shadow-sm"
      :class="runtimeState.runtime_enabled ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div
            class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
            :class="runtimeState.runtime_enabled ? 'border-emerald-300 text-emerald-800' : 'border-amber-300 text-amber-800'"
          >
            {{ runtimeState.runtime_enabled ? 'Live serving enabled' : 'Preview only' }}
          </div>
          <h2 class="mt-3 text-body-lg font-semibold text-rs-fg">
            {{ runtimeState.runtime_enabled ? 'Ads may render for eligible free users.' : 'Ads are runtime-disabled in this environment.' }}
          </h2>
          <p class="mt-2 text-body-sm" :class="runtimeState.runtime_enabled ? 'text-emerald-900' : 'text-amber-900'">
            {{ runtimeState.reason }}
          </p>
        </div>

        <div class="rounded-2xl border border-white/70 bg-white/70 p-4 text-body-sm text-rs-fg lg:min-w-[320px]">
          <div class="font-semibold">Operational mode</div>
          <div class="mt-2 text-rs-muted">
            Source: {{ runtimeState.source || 'unknown' }}
            <span class="mx-2 text-neutral-300">|</span>
            Mode: {{ runtimeState.mode || 'unknown' }}
          </div>
          <p class="mt-3 text-rs-muted">
            Keep staging disabled for deterministic QA. Use the preview harness below with synthetic or house creatives to validate eligibility and rendering.
          </p>
        </div>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <article class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Preview harness</h2>
            <p class="mt-1 text-body-sm text-rs-muted">
              Deterministic runtime simulation for plan, consent, and placement coverage.
            </p>
          </div>
          <span
            class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
            :class="previewResult?.ad ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-slate-100 text-slate-700'"
          >
            {{ previewResult?.ad ? 'Creative selected' : 'No ad selected' }}
          </span>
        </div>

        <form class="mt-4 grid gap-4 md:grid-cols-2" @submit.prevent="runPreview">
          <label class="text-body-sm text-rs-muted">
            Placement
            <select
              v-model="previewForm.placement"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              :disabled="previewLoading"
            >
              <option v-for="placement in placements" :key="placement" :value="placement">
                {{ placement }}
              </option>
            </select>
          </label>

          <label class="text-body-sm text-rs-muted">
            Simulated plan
            <select
              v-model="previewForm.simulate_plan"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              :disabled="previewLoading"
            >
              <option value="free">Free</option>
              <option value="plus">Plus</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>

          <label class="text-body-sm text-rs-muted">
            Seed
            <input
              v-model="previewForm.seed"
              type="text"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              :disabled="previewLoading"
            >
          </label>

          <div class="grid gap-3 rounded-2xl border border-rs-border bg-rs-bg/30 p-4">
            <label class="flex items-center gap-3 text-body-sm text-rs-fg">
              <input
                v-model="previewForm.marketing_consent"
                type="checkbox"
                class="h-4 w-4 rounded border-rs-border text-brand-600"
                :disabled="previewLoading"
              >
              Marketing consent granted
            </label>
            <label class="flex items-center gap-3 text-body-sm text-rs-fg">
              <input
                v-model="previewForm.ignore_runtime_disabled"
                type="checkbox"
                class="h-4 w-4 rounded border-rs-border text-brand-600"
                :disabled="previewLoading"
              >
              Override runtime-disabled state for QA preview
            </label>
          </div>

          <div class="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="previewLoading"
            >
              {{ previewLoading ? 'Running preview...' : 'Run preview' }}
            </button>
            <span v-if="previewError" class="text-body-sm text-danger-600">{{ previewError }}</span>
          </div>
        </form>

        <div class="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="rounded-2xl border border-rs-border bg-rs-bg/30 p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">Preview decision</div>
            <div class="mt-3 text-body-lg font-semibold text-rs-fg">{{ previewDecisionLabel }}</div>
            <p class="mt-2 text-body-sm text-rs-muted">
              Reason: {{ previewResult?.reason || 'No preview executed yet.' }}
            </p>
            <div class="mt-3 grid gap-2 text-body-sm text-rs-muted">
              <div>Eligible creatives: <span class="font-semibold text-rs-fg">{{ previewResult?.eligible_count ?? 0 }}</span></div>
              <div>Simulated plan: <span class="font-semibold text-rs-fg">{{ previewResult?.simulation?.simulate_plan || 'free' }}</span></div>
              <div>Consent: <span class="font-semibold text-rs-fg">{{ previewResult?.simulation?.marketing_consent ? 'granted' : 'denied' }}</span></div>
            </div>
          </div>

          <div class="rounded-2xl border border-rs-border bg-rs-bg/30 p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">Preview creative</div>
            <div
              v-if="previewResult?.ad"
              class="mt-3 rounded-2xl border border-rs-border bg-white p-4"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2">
                    <span
                      class="h-3 w-3 rounded-full"
                      :style="{ backgroundColor: previewResult.ad.brandColor }"
                    />
                    <div class="text-body-sm font-semibold text-rs-fg">{{ previewResult.ad.name }}</div>
                    <span class="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                      {{ previewResult.ad.kind || 'sponsored' }}
                    </span>
                  </div>
                  <p class="mt-2 text-body-sm text-rs-muted">{{ previewResult.ad.tagline }}</p>
                </div>
                <span class="rounded-full border border-rs-border px-2.5 py-1 text-xs font-semibold text-rs-muted">
                  {{ previewResult.ad.placement }}
                </span>
              </div>
              <div class="mt-3 text-body-sm text-rs-muted">
                CTA: <span class="font-semibold text-rs-fg">{{ previewResult.ad.ctaText || 'n/a' }}</span>
              </div>
              <div class="mt-1 text-body-sm text-rs-muted break-all">
                {{ previewResult.ad.url }}
              </div>
            </div>
            <div
              v-else
              class="mt-3 rounded-2xl border border-dashed border-rs-border bg-white px-4 py-6 text-body-sm text-rs-muted"
            >
              No creative matched the current simulation.
            </div>
          </div>
        </div>
      </article>

      <article class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Inventory controls</h2>
            <p class="mt-1 text-body-sm text-rs-muted">
              Maintain placement coverage and keep unsafe mutations behind super-admin access.
            </p>
          </div>
          <span
            class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
            :class="canMutate ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-800'"
          >
            {{ canMutate ? 'Super-admin mutate' : 'Read only' }}
          </span>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <div class="rounded-2xl border border-rs-border bg-rs-bg/40 p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">Inventory</div>
            <div class="mt-2 text-h3 font-semibold text-rs-fg">{{ summary.total }}</div>
            <p class="mt-1 text-body-sm text-rs-muted">{{ summary.active }} active / {{ summary.inactive }} inactive</p>
          </div>
          <div class="rounded-2xl border border-rs-border bg-rs-bg/40 p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">30d activity</div>
            <div class="mt-2 text-h3 font-semibold text-rs-fg">{{ summary.impressions_30d }}</div>
            <p class="mt-1 text-body-sm text-rs-muted">{{ summary.clicks_30d }} clicks, CTR {{ summaryCtrLabel }}</p>
          </div>
        </div>

        <form class="mt-5 grid gap-4 md:grid-cols-2" @submit.prevent="handleCreate">
          <label class="text-body-sm text-rs-muted">
            Name
            <input
              v-model="form.name"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              :disabled="!canMutate || saving"
              required
            >
          </label>

          <label class="text-body-sm text-rs-muted">
            Tagline
            <input
              v-model="form.tagline"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              :disabled="!canMutate || saving"
              required
            >
          </label>

          <label class="text-body-sm text-rs-muted">
            Destination URL
            <input
              v-model="form.url"
              type="url"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              :disabled="!canMutate || saving"
              required
            >
          </label>

          <label class="text-body-sm text-rs-muted">
            CTA text
            <input
              v-model="form.ctaText"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              :disabled="!canMutate || saving"
            >
          </label>

          <label class="text-body-sm text-rs-muted">
            Brand color
            <input
              v-model="form.brandColor"
              type="color"
              class="mt-1 h-10 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              :disabled="!canMutate || saving"
            >
          </label>

          <label class="text-body-sm text-rs-muted">
            Layout
            <select
              v-model="form.layout"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              :disabled="!canMutate || saving"
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="compact">Compact</option>
            </select>
          </label>

          <label class="text-body-sm text-rs-muted">
            Status
            <select
              v-model="form.status"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              :disabled="!canMutate || saving"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <div class="rounded-2xl border border-dashed border-rs-border bg-rs-bg/30 p-4 text-body-sm text-rs-muted">
            <div class="font-semibold text-rs-fg">Staging policy</div>
            <p class="mt-2">
              Inventory mutations are allowed, but runtime serving should stay disabled in staging. Validate with preview instead of live traffic.
            </p>
          </div>

          <div class="md:col-span-2">
            <div class="text-body-sm text-rs-muted">Placements</div>
            <div class="mt-2 flex flex-wrap gap-2">
              <label
                v-for="placement in placements"
                :key="placement"
                class="inline-flex items-center gap-2 rounded-full border border-rs-border bg-rs-bg/40 px-3 py-2 text-body-sm text-rs-fg"
              >
                <input
                  v-model="form.placements"
                  type="checkbox"
                  :value="placement"
                  class="h-4 w-4 rounded border-rs-border text-brand-600"
                  :disabled="!canMutate || saving"
                >
                {{ placement }}
              </label>
            </div>
          </div>

          <div class="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="!canMutate || saving"
            >
              {{ saving ? 'Creating...' : 'Create ad' }}
            </button>
            <span v-if="formError" class="text-body-sm text-danger-600">{{ formError }}</span>
            <span v-if="formSuccess" class="text-body-sm text-success-600">{{ formSuccess }}</span>
          </div>
        </form>
      </article>
    </section>

    <section class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-body-lg font-semibold text-rs-fg">Inventory list</h2>
          <p class="mt-1 text-body-sm text-rs-muted">
            Every creative should have a clear placement strategy, runtime expectation, and measurable inventory quality.
          </p>
        </div>
        <div class="text-body-sm text-rs-muted">
          Latest update: <span class="font-semibold text-rs-fg">{{ latestInventoryUpdate || 'n/a' }}</span>
        </div>
      </div>

      <div
        v-if="ads.length === 0"
        class="mt-4 rounded-2xl border border-dashed border-rs-border bg-rs-bg/20 px-4 py-8 text-body-sm text-rs-muted"
      >
        No ads configured yet. Seed at least one house or synthetic creative per critical placement so preview coverage is meaningful before runtime is ever enabled.
      </div>

      <div v-else class="mt-5 grid gap-4">
        <article
          v-for="ad in ads"
          :key="ad.id"
          class="rounded-3xl border border-rs-border bg-rs-bg/20 p-5"
        >
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="h-3 w-3 rounded-full"
                  :style="{ backgroundColor: ad.brandColor }"
                />
                <h3 class="text-body-lg font-semibold text-rs-fg">{{ ad.name }}</h3>
                <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {{ ad.kind || 'sponsored' }}
                </span>
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="ad.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'"
                >
                  {{ ad.status }}
                </span>
              </div>

              <p class="mt-2 text-body-sm text-rs-muted">{{ ad.tagline }}</p>
              <div class="mt-2 text-body-sm text-rs-muted break-all">{{ ad.url }}</div>

              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="placement in ad.placements"
                  :key="`${ad.id}:${placement.placement}:${placement.layout}`"
                  class="rounded-full border border-rs-border bg-white px-3 py-1 text-xs font-semibold text-rs-fg"
                >
                  {{ placement.placement }} · {{ placement.layout || 'auto' }} · p{{ placement.priority }}
                </span>
              </div>
            </div>

            <div class="grid gap-3 xl:min-w-[280px]">
              <div class="rounded-2xl border border-rs-border bg-white p-4">
                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">30d metrics</div>
                <div class="mt-2 text-body-sm text-rs-fg">Impressions: {{ ad.impressionCount }}</div>
                <div class="mt-1 text-body-sm text-rs-fg">Clicks: {{ ad.clickCount }}</div>
                <div class="mt-1 text-body-sm text-rs-muted">CTR: {{ getCtrLabel(ad.impressionCount, ad.clickCount) }}</div>
              </div>

              <div class="flex items-center justify-end gap-3">
                <button
                  class="text-body-sm font-semibold text-brand-600 hover:text-brand-700 disabled:text-neutral-400"
                  :disabled="!canMutate"
                  @click="toggleStatus(ad)"
                >
                  {{ ad.status === 'active' ? 'Disable' : 'Enable' }}
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { getAdminApiErrorMessage } from '~/utils/adminApiErrors'
import type { AdminSurfaceOverviewModel } from '~/utils/adminSurfaceStatus'
import { formatAdminSurfaceAge, getFreshnessTone } from '~/utils/adminSurfaceStatus'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

const ErrorState = defineAsyncComponent(() => import('~/ui/states/ErrorState.vue'))

useAdminPage({
  title: 'Admin: Ads | Remit-Scout',
  description: 'Manage ad placements with explicit runtime state and preview-safe validation.',
})

type AdPlacement = {
  placement: string
  layout: string | null
  priority: number
}

type AdminAd = {
  id: string
  name: string
  tagline: string
  brandColor: string
  url: string
  ctaText?: string | null
  kind?: string | null
  status: string
  impressionCount: number
  clickCount: number
  createdAt?: string | null
  updatedAt?: string | null
  placements: AdPlacement[]
}

type AdsRuntimeState = {
  runtime_enabled: boolean
  source: string
  mode: string
  reason: string
}

type PreviewSimulation = {
  placement: string
  seed: string
  simulate_plan: 'free' | 'plus' | 'enterprise'
  marketing_consent: boolean
  ignore_runtime_disabled: boolean
}

type PreviewAd = {
  id: string
  name: string
  tagline: string
  brandColor: string
  url: string
  ctaText?: string
  kind?: string
  placement: string
}

type PreviewResponse = {
  runtime: AdsRuntimeState
  simulation: PreviewSimulation
  eligible_count: number
  reason: string
  ad: PreviewAd | null
}

type AdsSummary = {
  total: number
  active: number
  inactive: number
  impressions_30d: number
  clicks_30d: number
}

const { request } = useApi()
const { isSuperAdmin } = useAuth()

const placements = [
  'compare_inline',
  'compare_sidebar',
  'home_inline',
  'dashboard_inline',
  'blog_sidebar',
  'blog_inline',
  'blog_banner',
]

const ads = ref<AdminAd[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const formError = ref<string | null>(null)
const formSuccess = ref<string | null>(null)

const runtimeState = reactive<AdsRuntimeState>({
  runtime_enabled: false,
  source: 'unknown',
  mode: 'preview_only',
  reason: 'Runtime state has not loaded yet.',
})

const summary = reactive<AdsSummary>({
  total: 0,
  active: 0,
  inactive: 0,
  impressions_30d: 0,
  clicks_30d: 0,
})

const previewForm = reactive<PreviewSimulation>({
  placement: placements[0],
  seed: 'admin-preview',
  simulate_plan: 'free',
  marketing_consent: true,
  ignore_runtime_disabled: true,
})

const previewResult = ref<PreviewResponse | null>(null)

const form = reactive({
  name: '',
  tagline: '',
  brandColor: '#2563EB',
  url: '',
  ctaText: 'View offer',
  status: 'active',
  layout: 'horizontal',
  placements: [] as string[],
})

const canMutate = computed(() => Boolean(isSuperAdmin.value))

const latestInventoryUpdate = computed(() => {
  const timestamps = ads.value
    .map((ad) => ad.updatedAt || ad.createdAt || null)
    .filter((value): value is string => Boolean(value))
    .sort()
  return timestamps[timestamps.length - 1] || null
})

const summaryCtrLabel = computed(() => getCtrLabel(summary.impressions_30d, summary.clicks_30d))
const previewDecisionLabel = computed(() => {
  if (!previewResult.value) return 'No preview run yet'
  if (previewResult.value.ad) return 'Eligible creative returned'
  return 'Runtime or eligibility blocked'
})

const getCtrLabel = (impressions: number, clicks: number) => {
  if (!impressions) return '0.00%'
  return `${((clicks / impressions) * 100).toFixed(2)}%`
}

const surfaceOverview = computed<AdminSurfaceOverviewModel>(() => {
  const freshnessTone = getFreshnessTone(latestInventoryUpdate.value, { watchMinutes: 1440, criticalMinutes: 10080 })

  return {
    runtimeLabel: runtimeState.runtime_enabled ? 'Live serving enabled' : 'Preview-only mode',
    runtimeTone: runtimeState.runtime_enabled ? 'healthy' : 'gated',
    runtimeDetail: runtimeState.reason,
    freshnessLabel: latestInventoryUpdate.value ? formatAdminSurfaceAge(latestInventoryUpdate.value) : 'No recent inventory updates',
    freshnessTone,
    freshnessDetail: latestInventoryUpdate.value
      ? `Latest inventory update at ${latestInventoryUpdate.value}.`
      : 'No ads have been created or updated yet.',
    lastJobLabel: previewResult.value ? previewDecisionLabel.value : 'No preview run yet',
    lastJobDetail: previewResult.value
      ? `Placement ${previewResult.value.simulation.placement}, reason ${previewResult.value.reason}.`
      : 'Run the preview harness to validate eligibility and placement behavior.',
    stats: [
      { label: 'Ads total', value: String(summary.total) },
      { label: 'Active', value: String(summary.active) },
      { label: '30d impressions', value: String(summary.impressions_30d) },
      { label: '30d clicks', value: String(summary.clicks_30d) },
    ],
    dependencies: [
      {
        label: 'Runtime gate',
        status: runtimeState.runtime_enabled ? 'healthy' : 'gated',
        detail: runtimeState.reason,
      },
      {
        label: 'Inventory coverage',
        status: ads.value.length > 0 ? 'healthy' : 'watch',
        detail: ads.value.length > 0
          ? `${ads.value.length} creative(s) configured for preview and future runtime use.`
          : 'No inventory exists yet, so preview coverage is weak.',
      },
      {
        label: 'Preview harness',
        status: previewResult.value?.ad ? 'healthy' : previewResult.value ? 'watch' : 'watch',
        detail: previewResult.value
          ? `Last reason: ${previewResult.value.reason}.`
          : 'No preview run executed yet.',
      },
    ],
    nextActions: [
      { label: 'Keep staging runtime disabled and validate placements through the preview harness.' },
      { label: 'Seed at least one house or synthetic creative for critical placements before expecting meaningful QA coverage.' },
      { label: 'Use paid-plan and no-consent simulations to verify ads remain correctly suppressed.' },
    ],
    emptyState: ads.value.length === 0
      ? {
          title: 'No ad inventory configured.',
          body: 'Create deterministic house or synthetic creatives first. Preview becomes much more useful once every critical placement has fallback coverage.',
        }
      : null,
  }
})

const resetForm = () => {
  form.name = ''
  form.tagline = ''
  form.brandColor = '#2563EB'
  form.url = ''
  form.ctaText = 'View offer'
  form.status = 'active'
  form.layout = 'horizontal'
  form.placements = []
}

const loadAds = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await request<{
      runtime?: AdsRuntimeState
      summary?: AdsSummary
      ads?: AdminAd[]
    }>('/admin/ads', { method: 'GET' })

    Object.assign(runtimeState, response.runtime || runtimeState)
    Object.assign(summary, {
      total: 0,
      active: 0,
      inactive: 0,
      impressions_30d: 0,
      clicks_30d: 0,
      ...(response.summary || {}),
    })
    ads.value = response.ads || []
  }
  catch (err) {
    error.value = getAdminApiErrorMessage(err, 'Failed to load ads.')
  }
  finally {
    loading.value = false
  }
}

const runPreview = async () => {
  previewLoading.value = true
  previewError.value = null
  try {
    const response = await request<PreviewResponse>('/admin/ads/preview', {
      method: 'GET',
      query: {
        placement: previewForm.placement,
        seed: previewForm.seed,
        simulate_plan: previewForm.simulate_plan,
        marketing_consent: String(previewForm.marketing_consent),
        ignore_runtime_disabled: String(previewForm.ignore_runtime_disabled),
      },
    })
    previewResult.value = response
    Object.assign(runtimeState, response.runtime || runtimeState)
  }
  catch (err) {
    previewError.value = getAdminApiErrorMessage(err, 'Failed to run ads preview.')
  }
  finally {
    previewLoading.value = false
  }
}

const handleCreate = async () => {
  if (!canMutate.value) return

  formError.value = null
  formSuccess.value = null
  if (form.placements.length === 0) {
    formError.value = 'Select at least one placement.'
    return
  }

  saving.value = true
  try {
    await request('/admin/ads', {
      method: 'POST',
      body: {
        ad: {
          name: form.name,
          tagline: form.tagline,
          brandColor: form.brandColor,
          url: form.url,
          ctaText: form.ctaText,
          status: form.status,
          kind: 'house',
        },
        placements: form.placements.map((placement) => ({
          placement,
          layout: form.layout,
        })),
      },
    })
    formSuccess.value = 'Ad created.'
    resetForm()
    await loadAds()
  }
  catch (err) {
    formError.value = getAdminApiErrorMessage(err, 'Failed to create ad.')
  }
  finally {
    saving.value = false
  }
}

const toggleStatus = async (ad: AdminAd) => {
  if (!canMutate.value) return

  const nextStatus = ad.status === 'active' ? 'inactive' : 'active'
  try {
    await request(`/admin/ads/${ad.id}`, {
      method: 'PATCH',
      body: {
        ad: { status: nextStatus },
      },
    })
    await loadAds()
  }
  catch (err) {
    error.value = getAdminApiErrorMessage(err, 'Failed to update ad status.')
  }
}

onMounted(() => {
  void loadAds()
  void runPreview()
})
</script>
