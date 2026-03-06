<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Corridor Stress"
      subtitle="Triangulation-derived stress scores across all corridors."
      :loading="loading"
      :error="error"
      :meta="lastUpdated ? `Last updated: ${formatDateTime(lastUpdated)}` : undefined"
    >
      <template #actions>
        <button
          class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          :disabled="loading"
          @click="load"
        >
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </template>
    </AdminPageShell>

    <template v-if="!loading && !error && summary">
      <section class="grid gap-4 md:grid-cols-4">
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 text-center shadow-sm">
          <p class="text-caption text-rs-muted">Normal</p>
          <p class="text-h3 font-semibold tabular-nums text-green-600">{{ summary.normal }}</p>
        </article>
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 text-center shadow-sm">
          <p class="text-caption text-rs-muted">Elevated</p>
          <p class="text-h3 font-semibold tabular-nums text-amber-600">{{ summary.elevated }}</p>
        </article>
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 text-center shadow-sm">
          <p class="text-caption text-rs-muted">High</p>
          <p class="text-h3 font-semibold tabular-nums text-orange-600">{{ summary.high }}</p>
        </article>
        <article class="rounded-2xl border border-rs-border bg-rs-surface p-5 text-center shadow-sm">
          <p class="text-caption text-rs-muted">Critical</p>
          <p class="text-h3 font-semibold tabular-nums text-red-600">{{ summary.critical }}</p>
        </article>
      </section>

      <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-body-lg font-semibold text-rs-fg">Corridors</h2>
          <input
            v-model="search"
            type="text"
            placeholder="Filter corridors…"
            class="h-9 rounded-lg border border-rs-border px-3 text-body-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-body-sm">
            <thead>
              <tr class="border-b border-rs-border text-left text-rs-muted">
                <th class="pb-2 pr-3 font-medium">Corridor</th>
                <th class="pb-2 pr-3 font-medium text-right">Score</th>
                <th class="pb-2 pr-3 font-medium">Level</th>
                <th class="pb-2 pr-3 font-medium">Confidence</th>
                <th class="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr
v-for="c in filtered"
:key="c.corridor_id"
class="border-b border-rs-border/50"
>
                <td class="py-2 pr-3 font-medium text-rs-fg">{{ c.corridor_id }}</td>
                <td class="py-2 pr-3 text-right tabular-nums text-rs-fg">{{ c.stress_score?.toFixed(2) ?? '—' }}</td>
                <td class="py-2 pr-3">
                  <CorridorStressBadge
:level="c.stress_level"
:score="c.stress_score"
/>
                </td>
                <td class="py-2 pr-3 text-rs-muted">{{ c.confidence ?? '—' }}</td>
                <td class="py-2 text-rs-muted">{{ formatDateTime(c.date) }}</td>
              </tr>
            </tbody>
          </table>
          <p
v-if="!filtered.length"
class="py-4 text-center text-body-sm text-rs-muted"
>
            {{ corridors.length ? 'No matching corridors.' : 'No stress data available.' }}
          </p>
        </div>
      </section>

      <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
        <button
          type="button"
          class="flex w-full items-center justify-between text-body-lg font-semibold text-rs-fg"
          @click="manualInterventionOpen = !manualInterventionOpen"
        >
          Manual Intervention
          <span class="flex items-center gap-2">
            <span class="rounded bg-amber-100 px-2 py-0.5 text-caption font-medium text-amber-800">experimental</span>
            <svg
              class="h-4 w-4 text-rs-muted transition-transform duration-200"
              :class="manualInterventionOpen ? 'rotate-180' : ''"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M19 9l-7 7-7-7"
/></svg>
          </span>
        </button>
        <p class="mt-1 text-body-sm text-rs-muted">Override stress behavior. Backend endpoints may not exist yet.</p>
        <div
v-if="manualInterventionOpen"
class="mt-4 space-y-6"
>
          <div class="rounded-lg border border-rs-border p-4">
            <div class="flex items-center gap-2">
              <h3 class="text-body-sm font-semibold text-rs-fg">Pause Adaptive Probing</h3>
              <span class="rounded bg-amber-100 px-2 py-0.5 text-caption font-medium text-amber-800">experimental</span>
            </div>
            <p class="mt-1 text-caption text-rs-muted">Temporarily disable stress-driven adaptive probing.</p>
            <div class="mt-3 flex items-center gap-3">
              <button
                type="button"
                class="h-9 rounded-lg px-4 text-body-sm font-semibold transition-colors"
                :class="probePaused
                  ? 'border border-amber-600 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'bg-amber-600 text-white hover:bg-amber-700'"
                :disabled="pauseProbingLoading"
                @click="togglePauseProbing"
              >
                {{ pauseProbingLoading ? 'Updating…' : (probePaused ? 'Resume' : 'Pause') }}
              </button>
              <p
v-if="pauseProbingError"
class="text-caption text-red-600"
>
{{ pauseProbingError }}
</p>
            </div>
          </div>

          <div class="rounded-lg border border-rs-border p-4">
            <div class="flex items-center gap-2">
              <h3 class="text-body-sm font-semibold text-rs-fg">Override Stress Level</h3>
              <span class="rounded bg-amber-100 px-2 py-0.5 text-caption font-medium text-amber-800">experimental</span>
            </div>
            <p class="mt-1 text-caption text-rs-muted">Manually set a corridor's stress level for a fixed duration.</p>
            <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label class="text-body-sm text-rs-muted">
                Corridor
                <select
                  v-model="overrideCorridorId"
                  class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
                >
                  <option value="">Select corridor</option>
                  <option
v-for="c in corridors"
:key="c.corridor_id"
:value="c.corridor_id"
>
                    {{ c.corridor_id }}
                  </option>
                </select>
              </label>
              <label class="text-body-sm text-rs-muted">
                Override level
                <select
                  v-model="overrideLevel"
                  class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
                >
                  <option value="normal">normal</option>
                  <option value="elevated">elevated</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
              </label>
              <label class="text-body-sm text-rs-muted">
                Duration
                <select
                  v-model="overrideDuration"
                  class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
                >
                  <option :value="1">1h</option>
                  <option :value="4">4h</option>
                  <option :value="12">12h</option>
                  <option :value="24">24h</option>
                </select>
              </label>
              <div class="flex items-end">
                <button
                  type="button"
                  class="h-10 w-full rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                  :disabled="overrideLoading || !overrideCorridorId"
                  @click="applyOverride"
                >
                  {{ overrideLoading ? 'Applying…' : 'Apply Override' }}
                </button>
              </div>
            </div>
            <p
v-if="overrideError"
class="mt-2 text-caption text-red-600"
>
{{ overrideError }}
</p>
          </div>

          <div class="rounded-lg border border-red-200 bg-red-50/50 p-4">
            <div class="flex items-center gap-2">
              <h3 class="text-body-sm font-semibold text-red-700">Kill Switch</h3>
              <span class="rounded bg-amber-100 px-2 py-0.5 text-caption font-medium text-amber-800">experimental</span>
            </div>
            <p class="mt-1 text-caption text-red-600/90">Disable all stress-driven adaptive probing. Use only in emergencies.</p>
            <div class="mt-3">
              <button
                type="button"
                class="h-10 rounded-lg border-2 border-red-600 bg-red-600 px-4 text-body-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                :disabled="killSwitchLoading"
                @click="activateKillSwitch"
              >
                {{ killSwitchLoading ? 'Activating…' : 'Activate Kill Switch' }}
              </button>
              <p
v-if="killSwitchError"
class="mt-2 text-caption text-red-600"
>
{{ killSwitchError }}
</p>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CorridorStressEntry, StressSummary } from '~/types/stress'
import {
  getCorridorStressOverview,
  pauseAdaptiveProbing,
  applyStressOverride,
  activateStressKillSwitch,
} from '~/lib/opsApi'
import { getAdminApiErrorMessage } from '~/utils/adminApiErrors'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Corridor Stress | Remit-Scout',
  description: 'Triangulation-derived stress scores across all corridors.',
})

const { formatDateTime } = useAdminFormat()

const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<string | null>(null)
const corridors = ref<CorridorStressEntry[]>([])
const summary = ref<StressSummary | null>(null)
const search = ref('')
const manualInterventionOpen = ref(false)

const pauseProbingLoading = ref(false)
const pauseProbingError = ref<string | null>(null)
const probePaused = ref(false)

const overrideCorridorId = ref('')
const overrideLevel = ref<'normal' | 'elevated' | 'high' | 'critical'>('normal')
const overrideDuration = ref(1)
const overrideLoading = ref(false)
const overrideError = ref<string | null>(null)

const killSwitchLoading = ref(false)
const killSwitchError = ref<string | null>(null)

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return corridors.value
  return corridors.value.filter(c => c.corridor_id.toLowerCase().includes(q))
})

const load = async () => {
  if (loading.value) return
  loading.value = true
  error.value = null
  try {
    const res = await getCorridorStressOverview()
    corridors.value = res.corridors
    summary.value = res.summary
    lastUpdated.value = res.updatedAt ?? new Date().toISOString()
  }
  catch (e: any) {
    error.value = getAdminApiErrorMessage(e, 'Failed to load stress data.')
  }
  finally {
    loading.value = false
  }
}

const togglePauseProbing = async () => {
  if (pauseProbingLoading.value) return
  pauseProbingLoading.value = true
  pauseProbingError.value = null
  const nextPaused = !probePaused.value
  try {
    await pauseAdaptiveProbing(nextPaused)
    probePaused.value = nextPaused
  }
  catch (e: any) {
    const status = e?.statusCode ?? e?.response?.status
    pauseProbingError.value = status === 404
      ? 'Endpoint not implemented yet (404).'
      : getAdminApiErrorMessage(e, 'Failed to update pause state.')
  }
  finally {
    pauseProbingLoading.value = false
  }
}

const applyOverride = async () => {
  if (overrideLoading.value || !overrideCorridorId.value) return
  overrideLoading.value = true
  overrideError.value = null
  try {
    await applyStressOverride(overrideCorridorId.value, overrideLevel.value, overrideDuration.value)
  }
  catch (e: any) {
    const status = e?.statusCode ?? e?.response?.status
    overrideError.value = status === 404
      ? 'Endpoint not implemented yet (404).'
      : getAdminApiErrorMessage(e, 'Failed to apply override.')
  }
  finally {
    overrideLoading.value = false
  }
}

const activateKillSwitch = async () => {
  if (killSwitchLoading.value) return
  killSwitchLoading.value = true
  killSwitchError.value = null
  try {
    await activateStressKillSwitch()
  }
  catch (e: any) {
    const status = e?.statusCode ?? e?.response?.status
    killSwitchError.value = status === 404
      ? 'Endpoint not implemented yet (404).'
      : getAdminApiErrorMessage(e, 'Failed to activate kill switch.')
  }
  finally {
    killSwitchLoading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>
