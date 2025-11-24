<template>
  <div class="group rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 motion-safe:transition focus-within:ring-2 focus-within:ring-blue-500">
    <NuxtLink
      :to="`/country/${country.code.toLowerCase()}`"
      class="flex items-center gap-3"
    >
      <span class="text-3xl" aria-hidden="true">{{ country.flag }}</span>
      <div class="flex-1 min-w-0">
        <p class="text-xs text-slate-500 mb-1">Best ways to send money</p>
        <p class="text-base font-semibold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
          {{ country.name }}
        </p>
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

    <div class="mt-3 space-y-3">
      <!-- Most Common Corridors Header -->
      <div v-if="sourceLinks.length" class="pt-2 border-t border-slate-200">
        <p class="text-xs font-semibold uppercase tracking-wide text-brand-600 mb-2">
          Most Common Corridors for this country
        </p>
        <p class="text-sm text-slate-600 mb-3">
          Send money to {{ country.name }} from…
        </p>
        <div class="space-y-1">
          <NuxtLink
            v-for="link in sourceLinks"
            :key="link.to"
            :to="link.to"
            class="block rounded-md px-2 py-1.5 text-sm text-slate-800 hover:bg-brand-50 hover:text-brand-700 transition-colors"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Country } from '~/utils/countries-currencies'

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
}>()

const sourceLinks = computed(() => {
  // Use inbound routes (routes TO this country) for "Send money to X from..."
  return props.routes?.inbound ?? props.routes?.sources ?? []
})
</script>
