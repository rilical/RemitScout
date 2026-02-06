<template>
  <div class="min-h-screen bg-white">
    <section class="bg-gray-900 text-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav class="mb-8 flex items-center space-x-2 text-sm text-white/70">
          <NuxtLink
            to="/"
            class="hover:text-white transition-colors"
          >Home</NuxtLink>
          <span class="text-white/50">›</span>
          <span class="font-medium text-white">Popular Corridors</span>
        </nav>

        <div class="max-w-3xl">
          <h1 class="text-4xl sm:text-5xl font-bold mb-4">
            Popular Money Transfer Corridors
          </h1>
          <p class="text-xl text-slate-300">
            Compare rates across the most popular international money transfer routes. All data is updated in real-time.
          </p>
        </div>
      </div>
    </section>

    <section class="py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          v-if="pending"
          class="text-center py-12"
        >
          <p class="text-neutral-600">
            Loading popular corridors...
          </p>
        </div>

        <div
          v-else-if="error"
          class="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center"
        >
          <p class="text-rose-900">
            Unable to load popular corridors. Please try again later.
          </p>
        </div>

        <div
          v-else-if="corridorsByCountry.length"
          class="space-y-12"
        >
          <div
            v-for="group in corridorsByCountry"
            :key="group.fromCountry"
            class="space-y-6"
          >
            <div class="flex items-center gap-4">
              <h2 class="text-2xl font-bold text-neutral-900">
                From {{ group.fromCountry }}
              </h2>
              <div class="h-px flex-1 bg-neutral-200" />
              <span class="text-sm text-neutral-500">
                {{ group.corridors.length }} corridor{{ group.corridors.length !== 1 ? 's' : '' }}
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <NuxtLink
                v-for="corridor in group.corridors"
                :key="`${corridor.from}-${corridor.to}`"
                :to="getCorridorUrl(corridor.from, corridor.to)"
                class="group rounded-xl border-2 border-neutral-200 bg-white p-6 hover:border-brand-600 hover:shadow-lg transition-all"
              >
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <span class="text-3xl">{{ getCountryFlag(corridor.from) }}</span>
                    <svg
                      class="h-5 w-5 text-neutral-400 group-hover:text-brand-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                    <span class="text-3xl">{{ getCountryFlag(corridor.to) }}</span>
                  </div>
                  <svg
                    class="w-5 h-5 text-neutral-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-1"
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
                </div>

                <div class="font-bold text-lg text-neutral-900 mb-2">
                  {{ corridor.from }} → {{ corridor.to }}
                </div>

                <div
                  v-if="corridor.top_provider"
                  class="text-sm text-neutral-600 mb-2"
                >
                  Top provider: <span class="font-semibold text-neutral-900">{{ corridor.top_provider }}</span>
                </div>

                <div
                  v-if="corridor.count_24h"
                  class="flex items-center gap-2 text-xs text-neutral-500"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  {{ corridor.count_24h }} searches in last 24h
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>

        <div
          v-else
          class="text-center py-12"
        >
          <p class="text-neutral-600">
            No popular corridors found.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePopularCorridors } from '~/composables/useRemittanceApi'
import { getCorridorUrl } from '~/utils/country-slugs'
import { getCountryByCode } from '~/utils/countries-currencies'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

const { data: popularCorridors, pending, error } = usePopularCorridors()

interface CorridorData {
  from: string
  to: string
  top_provider?: string
  count_24h?: number
  fee_range?: string | null
  speed_range?: string | null
}

const corridorsByCountry = computed(() => {
  if (!popularCorridors.value?.data) return []

  const corridors = popularCorridors.value.data.map((item: any) => {
    const route = item.route || ''
    const [from, to] = route.split(' → ').map((s: string) => s.trim())
    return {
      from: from || '',
      to: to || '',
      top_provider: item.top_provider,
      count_24h: item.count_24h,
      fee_range: item.fee_range,
      speed_range: item.speed_range,
    }
  }).filter((c: CorridorData) => c.from && c.to)

  const grouped = corridors.reduce((acc: Record<string, CorridorData[]>, corridor: CorridorData) => {
    if (!acc[corridor.from]) {
      acc[corridor.from] = []
    }
    acc[corridor.from].push(corridor)
    return acc
  }, {})

  return Object.entries(grouped).map(([fromCountry, corridors]) => ({
    fromCountry,
    corridors: corridors as CorridorData[],
  }))
})

const getCountryFlag = (code: string) => {
  const country = getCountryByCode(code)
  return country?.flag || '🏳️'
}

const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Popular Money Transfer Corridors | Compare Rates | Remit-Scout',
  description: 'Compare rates across the most popular international money transfer corridors. Real-time data from 30+ providers.',
  canonical: `${siteUrl}/corridors`,
  ogImage: `${siteUrl}/og-image.jpg`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Popular Corridors', url: `${siteUrl}/corridors` },
])
</script>
