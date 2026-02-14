<template>
  <div class="min-h-screen bg-neutral-50 px-6 py-10">
    <div class="mx-auto flex max-w-6xl flex-col gap-6">
      <header class="rounded-2xl bg-surface p-6 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-h3 font-semibold text-rs-fg">Smart corridors</h1>
            <p class="mt-1 text-body-sm text-rs-muted">
              Smart Alerts are available for select major corridors we track continuously.
            </p>
          </div>
          <button
            class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-primary-300"
            :disabled="loading"
            @click="fetchCorridors"
          >
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-3">
          <div class="md:col-span-2">
            <label
              for="smart-corridors-search"
              class="block text-body-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2"
            >
              Search
            </label>
            <input
              id="smart-corridors-search"
              v-model="query"
              type="text"
              placeholder="Try: US-MX, USD, Mexico, tier_2…"
              aria-label="Search smart corridors"
              class="h-11 w-full rounded-lg border border-neutral-300 bg-surface px-3 text-rs-fg focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            >
          </div>

          <div>
            <label
              for="smart-corridors-source"
              class="block text-body-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2"
            >
              Source
            </label>
            <select
              id="smart-corridors-source"
              v-model="sourceFilter"
              aria-label="Filter by source country"
              class="h-11 w-full rounded-lg border border-neutral-300 bg-surface px-3 text-rs-fg focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            >
              <option value="">All</option>
              <option
                v-for="code in sourceCountries"
                :key="code"
                :value="code"
              >
                {{ code }}
              </option>
            </select>
          </div>
        </div>

        <ErrorState
          v-if="error"
          class="mt-4"
          mode="card"
          message="Failed to load corridor data"
          :on-retry="fetchCorridors"
        />
      </header>

      <section class="rounded-2xl bg-surface p-6 shadow-sm">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="text-body-sm text-neutral-600">
            <span class="font-semibold text-rs-fg">{{ filtered.length }}</span> shown
            <span v-if="data?.totalMacroCorridors">of {{ data.totalMacroCorridors }}</span>
          </div>
          <div class="text-body-sm text-rs-muted">
            Status is derived from current historical coverage (data collection + signals).
          </div>
        </div>

        <div class="mt-4 overflow-auto">
          <table class="min-w-full text-body-sm">
            <thead class="text-body-sm uppercase text-neutral-400">
              <tr>
                <th class="py-2 text-left">Corridor</th>
                <th class="py-2 text-left">From</th>
                <th class="py-2 text-left">To</th>
                <th class="py-2 text-left">Tier</th>
                <th class="py-2 text-left">Smart status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filtered"
                :key="row.corridorId"
                class="border-t border-neutral-100"
              >
                <td class="py-2 font-mono text-body-sm text-neutral-700">
                  {{ row.corridorId }}
                </td>
                <td class="py-2 text-neutral-600">
                  {{ row.sourceCountry }} ({{ row.sourceCurrency }})
                </td>
                <td class="py-2 text-neutral-600">
                  {{ row.destCountry }} ({{ row.destCurrency }})
                </td>
                <td class="py-2 text-neutral-600">
                  {{ row.tier }}
                </td>
                <td class="py-2">
                  <span
                    v-if="row.smartAlertEligible"
                    class="inline-flex items-center rounded-full bg-success-600 px-2 py-0.5 text-body-sm font-semibold text-success-600"
                  >
                    Available
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center rounded-full bg-warning-600 px-2 py-0.5 text-body-sm font-semibold text-warning-600"
                  >
                    Rolling out
                  </span>
                </td>
              </tr>
              <tr v-if="!loading && filtered.length === 0">
                <td
                  colspan="5"
                  class="py-6"
                >
                  <EmptyState
                    mode="inline"
                    title="No corridors match your filters"
                    message="Try adjusting your search or filter criteria."
                  />
                </td>
              </tr>
              <tr v-if="loading">
                <td
                  colspan="5"
                  class="py-6"
                >
                  <LoadingState
                    mode="inline"
                    message="Loading corridors..."
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EmptyState, ErrorState, LoadingState } from '~/ui/states'

definePageMeta({ middleware: 'auth' })

type MacroCorridor = {
  corridorId: string
  sourceCountry: string
  destCountry: string
  sourceCurrency: string
  destCurrency: string
  tier: string
  isHardCurrencyLane: boolean
  smartAlertEligible: boolean
}

type MacroCorridorResponse = {
  success: boolean
  totalMacroCorridors: number
  smartAlertEligibleCount: number
  corridors: MacroCorridor[]
}

const { request } = useApi()

const data = ref<MacroCorridorResponse | null>(null)
const loading = ref(false)
const error = ref('')

const query = ref('')
const sourceFilter = ref('')

const sourceCountries = computed(() => {
  const set = new Set<string>()
  for (const c of data.value?.corridors ?? []) {
    set.add(c.sourceCountry)
  }
  return Array.from(set).sort()
})

const filtered = computed(() => {
  const corridors = data.value?.corridors ?? []
  const q = query.value.trim().toUpperCase()

  let list = corridors
  if (sourceFilter.value) {
    list = list.filter(c => c.sourceCountry === sourceFilter.value)
  }
  if (q) {
    list = list.filter((c) => {
      const haystack = [
        c.corridorId,
        c.sourceCountry,
        c.destCountry,
        c.sourceCurrency,
        c.destCurrency,
        c.tier,
      ].join(' ').toUpperCase()
      return haystack.includes(q)
    })
  }

  // Keep the page responsive; users can refine filters for the rest.
  return list.slice(0, 250)
})

const fetchCorridors = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await request<MacroCorridorResponse>('/alerts/macro-corridors', {
      timeoutMs: 15000,
      retries: 0,
    })
    if (!res?.success) {
      error.value = 'Unable to load Smart corridors right now.'
      data.value = null
      return
    }
    data.value = res
  }
  catch {
    error.value = 'Unable to load Smart corridors right now.'
    data.value = null
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchCorridors()
})
</script>
