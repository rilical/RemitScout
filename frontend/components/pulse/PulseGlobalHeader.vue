<template>
  <div class="sticky top-0 z-50 bg-neutral-900 border-b border-neutral-700">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <!-- Left: Corridor Selector -->
        <div class="flex items-center gap-4">
          <div class="relative">
            <button
              class="flex items-center gap-3 rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-left transition-colors hover:border-brand-600"
              @click="showCorridorDropdown = !showCorridorDropdown"
            >
              <span class="text-2xl">{{ store.corridor.fromFlag }}</span>
              <Icon
                name="arrow-right"
                :size="16"
                class="text-neutral-500"
              />
              <span class="text-2xl">{{ store.corridor.toFlag }}</span>
              <div class="ml-2">
                <div class="text-sm font-semibold text-white">
                  {{ store.corridor.label }}
                </div>
                <div class="text-xs text-neutral-400">
                  {{ store.corridor.from }} to {{ store.corridor.to }}
                </div>
              </div>
              <Icon
                name="chevron-down"
                :size="16"
                class="ml-2 text-neutral-400 transition-transform"
                :class="{ 'rotate-180': showCorridorDropdown }"
              />
            </button>

            <!-- Corridor Dropdown -->
            <div
              v-if="showCorridorDropdown"
              class="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-neutral-700 bg-neutral-800 shadow-xl"
            >
              <div class="p-2">
                <div class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Tracked Corridors
                </div>
                <button
                  v-for="corridor in corridors"
                  :key="corridor.slug"
                  class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-neutral-700"
                  :class="{ 'bg-brand-600/20': corridor.slug === store.corridor.slug }"
                  @click="selectCorridor(corridor)"
                >
                  <span class="text-xl">{{ corridor.fromFlag }}</span>
                  <Icon
                    name="arrow-right"
                    :size="16"
                    class="text-neutral-500"
                  />
                  <span class="text-xl">{{ corridor.toFlag }}</span>
                  <div class="flex-1">
                    <div class="text-sm font-medium text-white">
                      {{ corridor.label }}
                    </div>
                    <div class="text-xs text-neutral-400">
                      {{ corridor.from }}
                    </div>
                  </div>
                  <Icon
                    v-if="corridor.slug === store.corridor.slug"
                    name="check"
                    :size="16"
                    class="text-brand-600"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- Amount Selector -->
          <div class="relative">
            <select
              :value="store.amount"
              class="h-10 rounded-lg border border-neutral-600 bg-neutral-800 px-4 pr-8 text-sm font-medium text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 appearance-none cursor-pointer"
              @change="handleAmountChange"
            >
              <option :value="100">
                $100
              </option>
              <option :value="200">
                $200
              </option>
              <option :value="500">
                $500
              </option>
              <option :value="1000">
                $1,000
              </option>
              <option :value="5000">
                $5,000
              </option>
              <option :value="10000">
                $10,000
              </option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <Icon
                name="chevron-down"
                :size="16"
                class="text-neutral-400"
              />
            </div>
          </div>
        </div>

        <!-- Center: Timeframe Toggle -->
        <div class="flex items-center gap-1 rounded-lg bg-neutral-800 p-1">
          <button
            v-for="tf in timeframes"
            :key="tf"
            class="rounded-md px-4 py-2 text-sm font-semibold transition-colors"
            :class="store.timeframe === tf
              ? 'bg-brand-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-700'"
            @click="store.setTimeframe(tf)"
          >
            {{ tf }}
          </button>
        </div>

        <!-- Right: Freshness -->
        <div class="flex items-center gap-2 text-sm text-neutral-400">
          <span
            v-if="hasLastUpdated"
            class="relative flex h-2 w-2"
          >
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-600 opacity-75" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
          </span>
          <span>{{ updatedLabel }}</span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 pb-4 text-[11px] text-neutral-400">
        <span>{{ summary ? `${formatNumber(summary.quotesInRange)} quotes in range` : 'Loading coverage...' }}</span>
        <span class="text-neutral-600">|</span>
        <span>{{ summary ? `${summary.providersIncluded} providers included` : '-' }}</span>
        <span class="text-neutral-600">|</span>
        <span>{{ summary ? `Methods: ${formatMethods(summary.methodsIncluded)}` : 'Methods: Bank' }}</span>
        <span class="text-neutral-600">|</span>
        <span>{{ summary ? formatUpdatedLabel(summary.lastUpdated || null) : 'Updated —' }}</span>
      </div>
    </div>

    <!-- Click outside to close dropdown -->
    <div
      v-if="showCorridorDropdown"
      class="fixed inset-0 z-40"
      @click="showCorridorDropdown = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { usePulseStore, type PulseCorridor, type PulseTimeframe } from '~/stores/pulse'
import { getCorridors, getPulseCoverageSummary } from '~/lib/pulseApi'
import type { CorridorOption, PulseCoverageSummary } from '~/types/pulse'
import { formatNumber as formatNumberValue, formatUpdatedLabel } from '~/shared/lib/format'
import { Icon } from '~/ui'
import { COUNTRIES } from '~/utils/countries-currencies'

const store = usePulseStore()

const showCorridorDropdown = ref(false)

const timeframes: PulseTimeframe[] = ['24H', '7D', '30D', '1Y', 'MAX']

const summary = ref<PulseCoverageSummary | null>(null)

const { data: corridorData } = await useAsyncData('pulse-corridors', () => getCorridors())

const toCountryName = (code?: string | null): string => {
  if (!code) return ''
  const normalized = code.trim().toUpperCase()
  const found = COUNTRIES.find(c => c.code.toUpperCase() === normalized)
  return found?.name || normalized
}

const toPulseCorridor = (option: CorridorOption): PulseCorridor => {
  const corridorId = option.corridorId
  const parts = corridorId ? corridorId.split('-') : []
  const sourceCountry = (option.sourceCountry || parts[0] || '').toUpperCase()
  const destCountry = (option.destCountry || parts[1] || '').toUpperCase()

  const fromCode = (option.fromCode || option.sourceCurrency || parts[2] || '').toUpperCase()
  const toCode = (option.toCode || option.destCurrency || parts[3] || '').toUpperCase()

  const slug = String(option.slug || option.value || `${fromCode.toLowerCase()}-${toCode.toLowerCase()}`).trim().toLowerCase()
  const label = option.label || `${fromCode} → ${toCode}`

  return {
    from: toCountryName(sourceCountry) || sourceCountry || fromCode,
    to: toCountryName(destCountry) || destCountry || toCode,
    fromCode,
    toCode,
    fromFlag: option.fromFlag,
    toFlag: option.toFlag,
    label,
    slug,
    corridorId,
  }
}

const corridors = computed<PulseCorridor[]>(() => {
  return (corridorData.value || []).map(toPulseCorridor)
})

const hasLastUpdated = computed(() => {
  if (!store.lastUpdated) return false
  const time = new Date(store.lastUpdated).getTime()
  return !Number.isNaN(time)
})

const updatedLabel = computed(() => {
  // Centralize the "no fabricated freshness" contract.
  return formatUpdatedLabel(hasLastUpdated.value ? store.lastUpdated : null)
})

function selectCorridor(corridor: PulseCorridor) {
  store.setCorridor(corridor)
  showCorridorDropdown.value = false
}

function handleAmountChange(event: Event) {
  const target = event.target as HTMLSelectElement
  store.setAmount(Number.parseInt(target.value, 10))
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    showCorridorDropdown.value = false
  }
}

function formatNumber(value: number): string {
  return formatNumberValue(value)
}

function formatMethods(methods: string[]): string {
  return methods.map(method => method.charAt(0).toUpperCase() + method.slice(1)).join(', ')
}

async function loadSummary() {
  try {
    summary.value = await getPulseCoverageSummary(store.corridor, store.timeframe)
    if (summary.value?.lastUpdated) {
      store.setLastUpdated(summary.value.lastUpdated)
    }
  }
  catch (e) {
    console.error('Failed to load coverage summary:', e)
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  loadSummary()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

watch(
  () => [store.corridor, store.timeframe, store.amount],
  () => loadSummary(),
  { deep: true },
)
</script>
