<template>
  <div class="min-h-screen bg-neutral-50 px-6 py-10">
    <div class="mx-auto flex max-w-6xl flex-col gap-6">
      <!-- Header -->
      <header class="rounded-2xl bg-surface p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-h3 font-semibold text-rs-fg">Operations Health</h1>
            <p class="text-body-sm text-rs-muted mt-1">
              Consolidated indices, provider, and pipeline health.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-body-sm text-neutral-600 cursor-pointer">
              <input v-model="autoRefresh" type="checkbox" class="rounded">
              Auto-refresh (60s)
            </label>
            <button
              :disabled="refreshing"
              class="px-4 py-2 bg-brand-600 text-white text-body-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50"
              @click="refreshAll"
            >
              {{ refreshing ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </div>
      </header>

      <!-- Indices Health -->
      <section class="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg mb-4">Indices Health</h2>
        <LoadingState v-if="indices.loading" mode="inline" message="Loading indices health..." />
        <ErrorState v-else-if="indices.error" mode="card" :message="indices.error" :on-retry="loadIndices" />
        <div v-else-if="indices.data" class="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-xs uppercase text-neutral-400">Status</div>
            <div class="mt-1">
              <span
                class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                :class="indices.data.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
              >
                {{ indices.data.status }}
              </span>
            </div>
          </div>
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-xs uppercase text-neutral-400">Corridors</div>
            <div class="mt-1 text-body-sm font-semibold text-rs-fg">
              {{ indices.data.corridors_observed ?? 'n/a' }} / {{ indices.data.corridors_expected ?? 'n/a' }}
            </div>
          </div>
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-xs uppercase text-neutral-400">Available</div>
            <div class="mt-1 text-body-sm font-semibold text-rs-fg">{{ formatPercent(indices.data.available_ratio) }}</div>
          </div>
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-xs uppercase text-neutral-400">Suppressed</div>
            <div class="mt-1 text-body-sm font-semibold text-rs-fg">{{ formatPercent(indices.data.suppressed_ratio) }}</div>
          </div>
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-xs uppercase text-neutral-400">Min Providers</div>
            <div class="mt-1 text-body-sm font-semibold text-rs-fg">{{ indices.data.min_provider_count ?? 'n/a' }}</div>
          </div>
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-xs uppercase text-neutral-400">Latest Date</div>
            <div class="mt-1 text-body-sm font-semibold text-rs-fg">{{ indices.data.latest_date ?? 'n/a' }}</div>
          </div>
        </div>
      </section>

      <!-- B2B Sweep Status -->
      <section class="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg mb-4">B2B Sweep Status</h2>
        <LoadingState v-if="sweep.loading" mode="inline" message="Loading sweep status..." />
        <ErrorState v-else-if="sweep.error" mode="card" :message="sweep.error" :on-retry="loadSweep" />
        <div v-else-if="sweep.data" class="overflow-x-auto">
          <table class="w-full text-body-sm">
            <thead class="text-xs uppercase text-neutral-400">
              <tr>
                <th class="py-2 text-left">Tier</th>
                <th class="py-2 text-left">Cadence</th>
                <th class="py-2 text-left">Last Enqueued</th>
                <th class="py-2 text-left">Drift</th>
                <th class="py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="tier in (sweep.data.tiers || [])"
                :key="tier.tier"
                class="border-t border-neutral-100"
              >
                <td class="py-2 text-neutral-700 font-medium">{{ tier.tier }}</td>
                <td class="py-2 text-neutral-600">{{ tier.cadence }}</td>
                <td class="py-2 text-neutral-600">{{ tier.last_enqueued || 'n/a' }}</td>
                <td class="py-2 text-neutral-600">{{ tier.drift || 'n/a' }}</td>
                <td class="py-2">
                  <span
                    class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                    :class="tier.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ tier.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Provider Health Grid -->
      <section class="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg mb-4">Provider Health</h2>
        <LoadingState v-if="providers.loading" mode="inline" message="Loading provider health..." />
        <div v-else class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="provider in providers.data"
            :key="provider.name"
            class="rounded-lg border p-3"
            :class="providerCardClass(provider)"
          >
            <div class="text-body-sm font-semibold text-neutral-800">{{ provider.name }}</div>
            <div class="mt-1 text-xs text-neutral-500">
              {{ provider.corridor_count ?? '?' }} corridors
            </div>
            <div class="text-xs" :class="provider.stale_count > 0 ? 'text-amber-600' : 'text-green-600'">
              {{ provider.stale_count ?? 0 }} stale
            </div>
            <div v-if="provider.error" class="text-xs text-danger-600 mt-1">{{ provider.error }}</div>
          </div>
        </div>
      </section>

      <!-- Observer Summary -->
      <section class="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg mb-4">Observer Summary</h2>
        <LoadingState v-if="observer.loading" mode="inline" message="Loading observer summary..." />
        <ErrorState v-else-if="observer.error" mode="card" :message="observer.error" :on-retry="loadObserver" />
        <div v-else-if="observer.data" class="grid gap-4 md:grid-cols-3">
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-xs uppercase text-neutral-400">Gold Latest Date</div>
            <div class="mt-1 text-body-sm font-semibold text-rs-fg">{{ observer.data.gold_latest_date ?? 'n/a' }}</div>
          </div>
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-xs uppercase text-neutral-400">Queue Status</div>
            <div class="mt-1 text-body-sm font-semibold text-rs-fg">{{ observer.data.queue_status ?? 'n/a' }}</div>
          </div>
          <div class="rounded-lg border border-neutral-100 p-3">
            <div class="text-xs uppercase text-neutral-400">Notification Status</div>
            <div class="mt-1 text-body-sm font-semibold text-rs-fg">{{ observer.data.notification_status ?? 'n/a' }}</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { useApi } from '~/composables/useApi'
import { setSeo } from '~/composables/useSeo'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const ErrorState = defineAsyncComponent(() => import('~/ui/states/ErrorState.vue'))
const LoadingState = defineAsyncComponent(() => import('~/ui/states/LoadingState.vue'))

const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Admin: Ops Health | Remit-Scout',
  description: 'Consolidated operations health dashboard.',
  canonical: `${siteUrl}${route.path}`,
  noindex: true,
})

const { request } = useApi()
const log = useLogger('admin/ops-health')

const PROVIDERS = [
  'remitly', 'westernunion', 'wellsfargo', 'xe', 'transfergo', 'paysend',
  'pangea', 'orbitremit', 'bossmoney', 'ria', 'dahabshiil', 'sendwave',
  'mukuru', 'worldremit', 'wise', 'xoom', 'instarem', 'koronapay',
  'remitbee', 'singx', 'placid', 'wirebarley', 'intermex', 'alansari',
] as const

type ProviderHealth = {
  name: string
  corridor_count: number | null
  stale_count: number
  error?: string
}

const autoRefresh = ref(false)
const refreshing = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const indices = reactive({
  loading: false,
  error: null as string | null,
  data: null as Record<string, unknown> | null,
})

const sweep = reactive({
  loading: false,
  error: null as string | null,
  data: null as Record<string, unknown> | null,
})

const providers = reactive({
  loading: false,
  data: [] as ProviderHealth[],
})

const observer = reactive({
  loading: false,
  error: null as string | null,
  data: null as Record<string, unknown> | null,
})

const formatPercent = (value?: number | null) => {
  if (value == null || !Number.isFinite(value)) return 'n/a'
  return `${(Number(value) * 100).toFixed(1)}%`
}

const providerCardClass = (provider: ProviderHealth) => {
  if (provider.error) return 'border-red-300 bg-red-50'
  if (provider.stale_count >= 3) return 'border-red-300 bg-red-50'
  if (provider.stale_count >= 1) return 'border-amber-300 bg-amber-50'
  return 'border-green-300 bg-green-50'
}

const loadIndices = async () => {
  indices.loading = true
  indices.error = null
  try {
    const data = await request<Record<string, unknown>>('/ops/indices/health')
    indices.data = data
  } catch (error) {
    indices.error = error instanceof Error ? error.message : 'Failed to load'
  } finally {
    indices.loading = false
  }
}

const loadSweep = async () => {
  sweep.loading = true
  sweep.error = null
  try {
    const data = await request<Record<string, unknown>>('/ops/b2b-sweep-status')
    sweep.data = data
  } catch (error) {
    sweep.error = error instanceof Error ? error.message : 'Failed to load'
  } finally {
    sweep.loading = false
  }
}

const loadProviders = async () => {
  providers.loading = true

  const results = await Promise.allSettled(
    PROVIDERS.map(async (name) => {
      try {
        const data = await request<{
          corridor_count?: number
          stale_count?: number
          stale_corridors?: unknown[]
        }>(`/ops/${name}-health`, { timeoutMs: 10000 })
        return {
          name,
          corridor_count: data?.corridor_count ?? null,
          stale_count: data?.stale_count ?? data?.stale_corridors?.length ?? 0,
        }
      } catch (error) {
        return {
          name,
          corridor_count: null,
          stale_count: 0,
          error: error instanceof Error ? error.message : 'Failed',
        }
      }
    }),
  )

  providers.data = results.map((r) =>
    r.status === 'fulfilled' ? r.value : { name: 'unknown', corridor_count: null, stale_count: 0, error: 'Failed' },
  )
  providers.loading = false
}

const loadObserver = async () => {
  observer.loading = true
  observer.error = null
  try {
    const data = await request<Record<string, unknown>>('/ops/observer-summary')
    observer.data = data
  } catch (error) {
    observer.error = error instanceof Error ? error.message : 'Failed to load'
  } finally {
    observer.loading = false
  }
}

const refreshAll = async () => {
  refreshing.value = true
  await Promise.allSettled([loadIndices(), loadSweep(), loadProviders(), loadObserver()])
  refreshing.value = false
}

watch(autoRefresh, (enabled) => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  if (enabled) {
    refreshTimer = setInterval(refreshAll, 60000)
  }
})

onMounted(() => {
  refreshAll()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

useHead({
  title: 'Operations Health | Admin',
})
</script>
