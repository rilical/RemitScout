<script setup lang="ts">
import CenteredPage from '~/components/shared/CenteredPage.vue'
import FxProviderPricingTable from '~/domains/market-data/ui/FxProviderPricingTable.vue'
import type { FxProviderPricingRow } from '~/domains/market-data/application/fxProviderPricing'

type CorridorLink = { label: string, href: string }

type Props = {
  base: string
  quote: string
  pairLabel: string
  exampleAmount: string
  midMarketRate: string
  watchTarget: { type: 'fxPair', base: string, quote: string }
  providerPricingRows: FxProviderPricingRow[]
  providerPricingLoading?: boolean
  corridorLinks: CorridorLink[]
  breadcrumbItems: Array<{ name: string, path: string }>
}

withDefaults(defineProps<Props>(), {
  providerPricingLoading: false,
})
</script>

<template>
  <CenteredPage root-class="min-h-screen bg-neutral-50">
    <template #header>
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="rounded-3xl bg-white p-8 shadow-lg border border-neutral-200">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm uppercase tracking-wide font-semibold text-brand-600 mb-2">
              Exchange rate
            </p>
            <h1 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
              {{ pairLabel }} rate & transfer costs
            </h1>
            <p class="text-lg text-neutral-600">
              Check today’s mid-market {{ base }}/{{ quote }} rate, see typical provider markups, and learn how to keep more in {{ quote }} when you transfer.
            </p>
          </div>

          <div class="rounded-2xl bg-neutral-100 p-6 w-full lg:w-72">
            <p class="text-sm text-neutral-600 mb-2">
              Mid-market rate
            </p>
            <p class="text-3xl font-bold text-neutral-900 mb-1">
              {{ midMarketRate }}
            </p>
            <p class="text-xs text-neutral-500">
              Updated hourly • For illustration
            </p>
            <div class="mt-4">
              <SaveAlertButtons
                :target="watchTarget"
                :label="`${base}/${quote} FX`"
                source="exchange_rates"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-2xl bg-white p-6 border border-neutral-200 shadow-sm">
        <h2 class="text-xl font-bold text-neutral-900 mb-3">
          Provider markups
        </h2>
        <p class="text-sm text-neutral-600 mb-4">
          We track how providers price {{ base }}/{{ quote }} relative to mid-market. Lower markup means your recipient keeps more.
        </p>

        <FxProviderPricingTable
          :rows="providerPricingRows"
          :loading="providerPricingLoading"
        />
      </div>

      <div class="rounded-2xl bg-white p-6 border border-neutral-200 shadow-sm">
        <h2 class="text-xl font-bold text-neutral-900 mb-3">
          When to send
        </h2>
        <p class="text-sm text-neutral-600 mb-4">
          Timing and pay-in method both impact the real cost. Weekends often widen spreads; bank transfers are cheaper than cards.
        </p>
        <ul class="space-y-2 text-sm text-neutral-700">
          <li class="flex items-start gap-2">
            <span class="text-brand-600 mt-0.5">•</span>
            Aim for weekday daytime transfers to avoid weekend FX buffers.
          </li>
          <li class="flex items-start gap-2">
            <span class="text-brand-600 mt-0.5">•</span>
            Use bank transfer pay-in to slash card fees; choose bank or wallet payout for better rates.
          </li>
          <li class="flex items-start gap-2">
            <span class="text-brand-600 mt-0.5">•</span>
            Compare at least two providers for {{ base }} {{ exampleAmount }}—differences add up.
          </li>
        </ul>
        <NuxtLink
          to="/learn/providers"
          class="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white font-semibold hover:bg-brand-700 transition"
        >
          See provider reviews
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>

    <div class="rounded-2xl bg-white p-6 border border-neutral-200 shadow-sm">
      <h2 class="text-xl font-bold text-neutral-900 mb-3">
        Popular corridors using {{ base }}/{{ quote }}
      </h2>
      <p class="text-sm text-neutral-600 mb-4">
        See full comparison results for the most common remittance paths that rely on this pair.
      </p>
      <div class="flex flex-wrap gap-3">
        <NuxtLink
          v-for="corridor in corridorLinks"
          :key="corridor.href"
          :to="corridor.href"
          class="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-900 hover:border-brand-300 hover:text-brand-700 transition"
        >
          {{ corridor.label }}
        </NuxtLink>
      </div>
    </div>
  </CenteredPage>
</template>
