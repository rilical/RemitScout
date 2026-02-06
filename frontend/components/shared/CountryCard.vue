<template>
  <div class="group rounded-xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-brand-300 motion-safe:transition focus-within:ring-2 focus-within:ring-brand-600">
    <NuxtLink
      :to="countryPageUrl"
      class="flex items-center gap-4 mb-4"
    >
      <span
        class="text-4xl"
        aria-hidden="true"
      >{{ country.flag }}</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
          {{ country.name }}
        </p>
        <p class="text-xs text-slate-500 mt-0.5">Best ways to send money</p>
      </div>
      <svg
        class="h-5 w-5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all flex-shrink-0"
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

    <div
      v-if="sourceLinks.length"
      class="pt-4 border-t border-slate-200"
    >
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
        Most Common Corridors
      </p>
      <p class="text-sm font-medium text-brand-700 mb-3">
        Send money to {{ country.name }} from…
      </p>
      <div class="space-y-1.5">
        <NuxtLink
          v-for="link in sourceLinks"
          :key="link.to"
          :to="link.to"
          class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors border border-transparent hover:border-brand-200"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Country } from '~/utils/countries-currencies'
import { getCorridorUrl } from '~/utils/country-slugs'

type RouteLink = {
  label: string
  to: string
}

type CountryRoutes = {
  guide?: RouteLink[]
  sources?: RouteLink[]
  inbound?: RouteLink[]
  outbound?: RouteLink[]
}

const props = defineProps<{
  country: Country
  routes?: CountryRoutes
  userCountry?: string // User's default country code (from geolocation or settings)
}>()

const sourceLinks = computed(() => {
  return props.routes?.inbound ?? props.routes?.sources ?? []
})

// Use user's country if provided, otherwise default to US
const defaultFromCountry = computed(() => props.userCountry || 'US')

const countryPageUrl = computed(() => {
  return getCorridorUrl(defaultFromCountry.value, props.country.code)
})
</script>
