<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Delivery Progress"
      subtitle="Module readiness and deployment progress by domain."
      :loading="loading"
      :error="error"
      :meta="lastUpdated ? `Last updated: ${formatDateTime(lastUpdated)}` : undefined"
    >
      <template #actions>
        <div class="flex items-center gap-3">
          <label class="inline-flex items-center gap-2 text-body-sm text-rs-muted">
            <input
              v-model="autoRefresh"
              type="checkbox"
              class="h-4 w-4 rounded border-rs-border text-brand-600"
            >
            Auto-refresh
            <span v-if="autoRefresh" class="tabular-nums font-semibold text-rs-fg">{{ countdown }}s</span>
          </label>
          <button
            class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            :disabled="loading"
            @click="load"
          >
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
      </template>
    </AdminPageShell>

    <template v-if="!loading && !error">
      <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Platform Readiness</h2>
        <p class="mb-4 text-body-sm text-rs-muted">Overall module deployment progress across all domains.</p>
        <div class="flex flex-col gap-4">
          <div class="rounded-xl border border-rs-border bg-rs-bg p-4">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-body-sm font-medium text-rs-fg">Overall</span>
              <span class="text-body-sm font-semibold tabular-nums text-rs-fg">
                {{ overallProductionCount }} / {{ modules.length }} ({{ overallPercent }}%)
              </span>
            </div>
            <div class="h-3 overflow-hidden rounded-full bg-rs-surface-2">
              <div
                class="h-full rounded-full bg-green-500 transition-all"
                :style="{ width: `${overallPercent}%` }"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Progress by Domain</h2>
        <p class="mb-4 text-body-sm text-rs-muted">Modules grouped by collector type with production vs other statuses.</p>
        <div v-if="!domainGroups.length" class="py-12 text-center text-body-sm text-rs-muted">
          No module data available.
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="group in domainGroups"
            :key="group.collectorType"
            class="rounded-xl border border-rs-border bg-rs-bg p-4"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="text-body-sm font-medium text-rs-fg">{{ group.collectorType }}</span>
              <span class="text-body-sm tabular-nums text-rs-muted">
                {{ group.productionCount }} production / {{ group.total }} total
              </span>
            </div>
            <div class="mb-2 flex flex-wrap gap-2 text-caption text-rs-muted">
              <span v-if="group.otherStatuses.length" class="rounded bg-amber-100 px-2 py-0.5 text-amber-700">
                {{ group.otherStatuses.join(', ') }}
              </span>
            </div>
            <div class="h-3 overflow-hidden rounded-full bg-rs-surface-2">
              <div
                class="h-full rounded-full bg-green-500 transition-all"
                :style="{ width: `${group.percent}%` }"
              />
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ModuleHealthEntry } from '~/types/modules'
import { getModuleHealth } from '~/lib/opsApi'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Delivery Progress | Remit-Scout',
  description: 'Module readiness and deployment progress by domain.',
})

interface DomainGroup {
  collectorType: string
  total: number
  productionCount: number
  percent: number
  otherStatuses: string[]
}

const { formatDateTime } = useAdminFormat()

const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<string | null>(null)
const modules = ref<ModuleHealthEntry[]>([])

const domainGroups = computed<DomainGroup[]>(() => {
  const byType = new Map<string, ModuleHealthEntry[]>()
  for (const m of modules.value) {
    const key = m.collector_type || 'unknown'
    if (!byType.has(key)) byType.set(key, [])
    byType.get(key)!.push(m)
  }
  return Array.from(byType.entries()).map(([collectorType, mods]) => {
    const productionCount = mods.filter(m => m.status === 'production').length
    const total = mods.length
    const percent = total > 0 ? Math.round((productionCount / total) * 100) : 0
    const statusCounts = new Map<string, number>()
    for (const m of mods) {
      statusCounts.set(m.status, (statusCounts.get(m.status) ?? 0) + 1)
    }
    const otherStatuses = Array.from(statusCounts.entries())
      .filter(([s]) => s !== 'production')
      .map(([s, c]) => `${s}: ${c}`)
    return {
      collectorType,
      total,
      productionCount,
      percent,
      otherStatuses,
    }
  }).sort((a, b) => b.total - a.total)
})

const overallProductionCount = computed(() => modules.value.filter(m => m.status === 'production').length)

const overallPercent = computed(() => {
  const total = modules.value.length
  if (total === 0) return 0
  return Math.round((overallProductionCount.value / total) * 100)
})

const autoRefresh = ref(false)
const countdown = ref(60)
let timer: ReturnType<typeof setInterval> | null = null

watch(autoRefresh, (on) => {
  if (timer) { clearInterval(timer); timer = null }
  if (on) {
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) { countdown.value = 60; void load() }
    }, 1000)
  }
})

onUnmounted(() => { if (timer) clearInterval(timer) })

const load = async () => {
  if (loading.value) return
  loading.value = true
  error.value = null
  try {
    const res = await getModuleHealth()
    modules.value = res.modules
    lastUpdated.value = res.updatedAt ?? new Date().toISOString()
  }
  catch (e: any) {
    error.value = e?.message ?? 'Failed to load module health.'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => { void load() })
</script>
