<template>
  <div
    :class="pageBg"
    class="min-h-screen"
  >
    <!-- Filter Bar (sticky) -->
    <RsFilterBar
      :corridors="corridors"
      :selected-corridor="selectedCorridorOption"
      :amounts="PULSE_AMOUNTS"
      :selected-amount="store.amount"
      :timeframes="availableTimeframes"
      :selected-timeframe="store.timeframe"
      :variant="variant"
      :sticky="true"
      :show-method-filters="isEnterprise"
      :last-updated="store.lastUpdated || null"
      @update:corridor="handleCorridorChange"
      @update:amount="store.setAmount($event)"
      @update:timeframe="store.setTimeframe($event as PulseTimeframe)"
    />

    <!-- Tab Navigation -->
    <nav :class="[cardSurface, 'flex gap-1 p-1 mx-4 mt-4 rounded-lg overflow-x-auto']">
      <button
        v-for="tab in visibleTabs"
        :key="tab.id"
        :class="[
          store.activeTab === tab.id
            ? 'bg-brand-600 text-white shadow-sm'
            : variant === 'terminal'
              ? 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100',
          'px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap'
        ]"
        @click="store.setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- Active Tab Panel (lazy-loaded) -->
    <div class="px-4 py-6">
      <Suspense>
        <KeepAlive :max="3">
          <component
            :is="activeTabComponent"
            :key="store.activeTab"
            :density="density"
            :corridor="store.corridor"
            :filters="store.filtersForApi"
          />
        </KeepAlive>
        <template #fallback>
          <div class="flex items-center justify-center min-h-[400px]">
            <div class="animate-pulse text-neutral-400 text-body-sm">Loading...</div>
          </div>
        </template>
      </Suspense>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import RsFilterBar from '~/components/pulse/RsFilterBar.vue'
import { usePulseStore, type PulseCorridor, type PulseTimeframe } from '~/stores/pulse'
import { usePulseTheme } from '~/composables/usePulseTheme'
import { usePulseRouteSync } from '~/composables/usePulseRouteSync'
import { useEntitlements } from '~/composables/useEntitlements'
import { usePulseTimeframes } from '~/composables/usePulseTimeframes'
import { getVisibleTabs } from '~/lib/pulseTabs'
import type { PulseTab } from '~/lib/pulseTabs'
import { getCorridors } from '~/domains/pulse/infrastructure/pulseApi'
import type { CorridorOption } from '~/types/pulse'
import type { PulseDensity } from '~/types/pulse'

// ----- Constants -----

export const PULSE_AMOUNTS = [100, 200, 500, 1000] as const

// ----- Store + theme -----

const store = usePulseStore()
const { variant, pageBg, cardSurface } = usePulseTheme()
const { isEnterprise, pulseLevel } = useEntitlements()
const { initFromRoute } = usePulseRouteSync()

// ----- Tabs -----

const visibleTabs = computed(() => getVisibleTabs(pulseLevel.value))

const TAB_COMPONENTS: Record<PulseTab, ReturnType<typeof defineAsyncComponent>> = {
  snapshot: defineAsyncComponent(() => import('./tabs/PulseTabSnapshot.vue')),
  dispersion: defineAsyncComponent(() => import('./tabs/PulseTabDispersion.vue')),
  competition: defineAsyncComponent(() => import('./tabs/PulseTabCompetition.vue')),
  'bank-gap': defineAsyncComponent(() => import('./tabs/PulseTabBankGap.vue')),
  coverage: defineAsyncComponent(() => import('./tabs/PulseTabCoverage.vue')),
  reliability: defineAsyncComponent(() => import('./tabs/PulseTabReliability.vue')),
  indices: defineAsyncComponent(() => import('./tabs/PulseTabIndices.vue')),
  risk: defineAsyncComponent(() => import('./tabs/PulseTabRisk.vue')),
  exports: defineAsyncComponent(() => import('./tabs/PulseTabExports.vue')),
}

const activeTabComponent = computed(() => TAB_COMPONENTS[store.activeTab])

// ----- Density -----

const density = computed<PulseDensity>(() =>
  isEnterprise.value ? 'enterprise' : 'light',
)

// ----- Corridors -----

const corridors = ref<CorridorOption[]>([])

const selectedCorridorOption = computed<CorridorOption | null>(() => {
  if (!store.corridor) return null
  return corridors.value.find(
    c => c.corridorId === store.corridor?.corridorId || c.value === store.corridor?.corridorId,
  ) ?? null
})

// ----- Timeframes -----

const daysAvailable = computed(() => {
  if (!selectedCorridorOption.value) return 90
  return selectedCorridorOption.value.daysAvailable ?? 90
})

const { availableTimeframes } = usePulseTimeframes(daysAvailable)

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

// ----- Init -----

onMounted(async () => {
  initFromRoute()
  try {
    corridors.value = await getCorridors()
    store.initCorridor(corridors.value)
  }
  catch {
    // Corridors unavailable — continue with empty list; components handle empty state
  }
})
</script>
