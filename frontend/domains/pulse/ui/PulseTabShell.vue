<template>
  <div
    :class="pageBg"
    class="min-h-screen pb-16"
  >
    <section class="overflow-hidden bg-neutral-900 py-16 lg:py-20">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-4xl text-center">
          <h1 class="inline-flex items-center justify-center gap-4 text-h1 font-bold text-white">
            <svg
              class="h-10 w-10 flex-shrink-0 text-brand-500"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              stroke-width="4.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M20 20c-6 6-6 18 0 24" />
              <path d="M44 20c6 6 6 18 0 24" />
              <path d="M12 12c-10 10-10 30 0 40" />
              <path d="M52 12c10 10 10 30 0 40" />
              <circle cx="32" cy="32" r="6" fill="currentColor" stroke="none" />
            </svg>
            <span>Remit-Scout </span>
            <span class="text-brand-500">Pulse</span>
          </h1>
          <p class="mt-5 text-h4 leading-relaxed text-neutral-300">
            See how much value your transfer delivers across the bank corridors we actively track. Compare pricing, provider coverage, and market movement over time with every chart pinned to the same $500 USD bank-deposit benchmark.
          </p>
        </div>
      </div>
    </section>

    <section class="bg-brand-600 py-7 lg:py-8">
      <RsFilterBar
        :corridors="corridors"
        :selected-corridor="selectedCorridorOption"
        :amounts="PULSE_AMOUNTS"
        :selected-amount="store.amount"
        :timeframes="availableTimeframes"
        :selected-timeframe="store.timeframe"
        :variant="variant"
        :sticky="false"
        :last-updated="store.lastUpdated || null"
        @update:corridor="handleCorridorChange"
        @update:amount="store.setAmount($event)"
        @update:timeframe="store.setTimeframe($event as PulseTimeframe)"
      />
    </section>

    <div class="mx-auto max-w-page px-page-x">
      <!-- Tab Navigation -->
      <nav :class="[cardSurface, 'mt-6 flex gap-1 overflow-x-auto rounded-2xl p-1.5']">
        <button
          v-for="tab in visibleTabs"
          :key="tab.id"
          :class="[
            store.activeTab === tab.id
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900',
            'whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors'
          ]"
          @click="store.setActiveTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- Active Tab Panel (lazy-loaded) -->
      <div class="py-6">
        <Suspense>
          <KeepAlive :max="3">
            <component
              :is="activeTabComponent"
              :key="store.activeTab"
              :density="density"
              :corridor="selectedCorridorOption ?? store.corridor"
              :filters="store.filtersForApi"
            />
          </KeepAlive>
          <template #fallback>
            <div class="flex min-h-[400px] items-center justify-center">
              <div class="text-body-sm text-neutral-400 animate-pulse">Loading...</div>
            </div>
          </template>
        </Suspense>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent, watchEffect } from 'vue'
import RsFilterBar from '~/components/pulse/RsFilterBar.vue'
import { sortCorridorsByCoverage } from '~/domains/pulse/application/corridor-discovery'
import { usePulseStore, type PulseCorridor, type PulseTimeframe } from '~/stores/pulse'
import { usePulseTheme } from '~/composables/usePulseTheme'
import { usePulseRouteSync } from '~/composables/usePulseRouteSync'
import { usePulseTimeframes } from '~/composables/usePulseTimeframes'
import { getVisibleTabs } from '~/lib/pulseTabs'
import type { PulseTab } from '~/lib/pulseTabs'
import { getCorridors } from '~/domains/pulse/infrastructure/pulseApi'
import type { CorridorOption } from '~/types/pulse'
import type { PulseDensity } from '~/types/pulse'

// ----- Constants -----

const PULSE_AMOUNTS = [500] as const

// ----- Store + theme -----

const store = usePulseStore()
const { variant, pageBg, cardSurface } = usePulseTheme()
const { isEnterprise, pulseLevel } = useEntitlements()
const { initFromRoute } = usePulseRouteSync()
const route = useRoute()

// ----- Tabs -----

const visibleTabs = computed(() => getVisibleTabs(pulseLevel.value))

const TAB_COMPONENTS: Record<PulseTab, ReturnType<typeof defineAsyncComponent>> = {
  snapshot: defineAsyncComponent(() => import('./tabs/PulseTabSnapshot.vue')),
  dispersion: defineAsyncComponent(() => import('./tabs/PulseTabDispersion.vue')),
  competition: defineAsyncComponent(() => import('./tabs/PulseTabCompetition.vue')),
  'bank-gap': defineAsyncComponent(() => import('./tabs/PulseTabBankGap.vue')),
  indices: defineAsyncComponent(() => import('./tabs/PulseTabIndices.vue')),
  coverage: defineAsyncComponent(() => import('./tabs/PulseTabCoverage.vue')),
}

const activeTabComponent = computed(() => TAB_COMPONENTS[store.activeTab])

// ----- Density -----

const density = computed<PulseDensity>(() =>
  isEnterprise.value ? 'enterprise' : 'light',
)

// ----- Corridors -----

const corridors = ref<CorridorOption[]>([])

const isSupportedPulseCorridor = (corridor: CorridorOption): boolean => {
  const collectionTier = corridor.collectionTier?.trim()
  const collectionCadenceMinutes = corridor.collectionCadenceMinutes
  const dataPoints = corridor.dataPoints ?? 0

  return Boolean(corridor.corridorId)
    && collectionTier === 'tier_2'
    && typeof collectionCadenceMinutes === 'number'
    && Number.isFinite(collectionCadenceMinutes)
    && collectionCadenceMinutes > 0
    && dataPoints > 0
}

const corridorMatchesSelection = (corridor: CorridorOption, selection: PulseCorridor | null) => {
  if (!selection) return false
  const slug = corridor.slug ?? corridor.value
  return corridor.corridorId === selection.corridorId
    || corridor.value === selection.corridorId
    || slug === selection.slug
}

const selectedCorridorOption = computed<CorridorOption | null>(() => {
  if (!store.corridor) return null
  return corridors.value.find(
    c => corridorMatchesSelection(c, store.corridor),
  ) ?? null
})

// ----- Timeframes -----

const daysAvailable = computed(() => {
  if (!selectedCorridorOption.value) return 90
  return selectedCorridorOption.value.daysAvailable ?? 90
})

const { availableTimeframes } = usePulseTimeframes(daysAvailable)

watchEffect(() => {
  const activeTabVisible = visibleTabs.value.some(tab => tab.id === store.activeTab)
  if (!activeTabVisible) {
    store.setActiveTab(visibleTabs.value[0]?.id ?? 'snapshot')
  }
})

// ----- Corridor change -----

function handleCorridorChange(option: CorridorOption | null) {
  if (!option) return
  const corridor: PulseCorridor = {
    from: option.sourceCountry ?? option.label?.split('→')[0]?.trim() ?? '',
    to: option.destCountry ?? option.label?.split('→')[1]?.trim() ?? '',
    fromCode: option.fromCode,
    toCode: option.toCode,
    fromFlag: option.fromFlag ?? '',
    toFlag: option.toFlag ?? '',
    label: option.label,
    slug: option.slug ?? option.value,
    corridorId: option.corridorId ?? option.value,
  }
  store.setCorridor(corridor)
}

function findRouteCorridor(options: CorridorOption[]): CorridorOption | null {
  const routeCorridorId = typeof route.query.corridor_id === 'string'
    ? route.query.corridor_id.trim()
    : ''
  const routeCorridorSlug = typeof route.query.corridor === 'string'
    ? route.query.corridor.trim().toLowerCase()
    : ''

  if (!routeCorridorId && !routeCorridorSlug) return null

  return options.find((option) => {
    const slug = String(option.slug ?? option.value ?? '').trim().toLowerCase()
    return option.corridorId === routeCorridorId || slug === routeCorridorSlug
  }) ?? null
}

// ----- Init -----

onMounted(async () => {
  initFromRoute()
  try {
    const loadedCorridors = await getCorridors()
    corridors.value = sortCorridorsByCoverage(
      loadedCorridors.filter(isSupportedPulseCorridor),
    )
    const routeCorridor = findRouteCorridor(corridors.value)
    if (routeCorridor) {
      handleCorridorChange(routeCorridor)
      return
    }
    store.initCorridor(corridors.value)
  }
  catch {
    // Corridors unavailable — continue with empty list; components handle empty state
  }
})

watchEffect(() => {
  if (corridors.value.length === 0 || selectedCorridorOption.value) return
  store.initCorridor(corridors.value)
})
</script>
