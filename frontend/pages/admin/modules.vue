<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Module Registry"
      subtitle="Health status for all registered signal modules."
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

    <section v-if="!loading && !error" class="grid gap-4 md:grid-cols-3">
      <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 text-center shadow-sm">
        <p class="text-caption text-rs-muted">Production</p>
        <p class="text-h3 font-semibold tabular-nums text-green-600">{{ healthyCt }}</p>
      </article>
      <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 text-center shadow-sm">
        <p class="text-caption text-rs-muted">Pre-production</p>
        <p class="text-h3 font-semibold tabular-nums text-amber-600">{{ degradedCt }}</p>
      </article>
      <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 text-center shadow-sm">
        <p class="text-caption text-rs-muted">Quarantined</p>
        <p class="text-h3 font-semibold tabular-nums text-red-600">{{ quarantinedCt }}</p>
      </article>
    </section>

    <section v-if="!loading && !error" class="space-y-3">
      <ModuleHealthCard
        v-for="mod in modules"
        :key="mod.module_id"
        :module="mod"
        :expanded="expandedId === mod.module_id"
        @toggle="expandedId = expandedId === $event ? null : $event"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ModuleHealthEntry } from '~/types/modules'
import { getModuleHealth } from '~/lib/opsApi'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Module Registry | Remit-Scout',
  description: 'Health status for all registered signal modules.',
})

const { formatDateTime } = useAdminFormat()

const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<string | null>(null)
const modules = ref<ModuleHealthEntry[]>([])
const expandedId = ref<string | null>(null)

const healthyCt = computed(() => modules.value.filter(m => m.status === 'production').length)
const degradedCt = computed(() => modules.value.filter(m => m.status === 'beta' || m.status === 'sandbox' || m.status === 'candidate').length)
const quarantinedCt = computed(() => modules.value.filter(m => m.status === 'quarantined' || m.status === 'deprecated').length)

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
