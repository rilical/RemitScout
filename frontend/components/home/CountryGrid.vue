<template>
  <section class="py-12 sm:py-16 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
          Our comparisons cover 154 countries
        </h2>
        <p class="text-lg text-neutral-600 max-w-3xl mx-auto">
          Compare money transfer providers for any route worldwide. Find the best exchange rates, lowest fees, and fastest delivery options for your specific corridor.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <NuxtLink
          v-for="country in countries"
          :key="country.code"
          :to="getCorridorUrl(country.code)"
          class="group bg-white rounded-xl border border-neutral-200 p-5 transition-all hover:border-neutral-300 hover:shadow-sm flex items-center justify-between"
        >
          <div class="flex items-center gap-4">
            <span class="text-2xl">{{ getCountryFlag(country.code) }}</span>
            <div>
              <div class="font-semibold text-neutral-900">{{ country.name }}</div>
            </div>
          </div>

          <button
            type="button"
            class="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-400 group-hover:border-neutral-400 group-hover:text-neutral-600 transition-colors flex-shrink-0"
            aria-label="View rates"
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </NuxtLink>
      </div>

      <div class="text-center">
        <NuxtLink
          to="/countries"
          class="inline-flex items-center gap-2 text-neutral-900 font-semibold hover:text-brand-600 transition-colors"
        >
          <span>See all countries</span>
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { COUNTRY_HIGHLIGHTS } from '~/utils/constants'

const { STR } = useStrings()
const countries = COUNTRY_HIGHLIGHTS

const countryFlags: Record<string, string> = {
  IN: '🇮🇳',
  CN: '🇨🇳',
  PH: '🇵🇭',
  NP: '🇳🇵',
  PK: '🇵🇰',
  TH: '🇹🇭',
  LK: '🇱🇰',
  JP: '🇯🇵',
  CA: '🇨🇦',
  US: '🇺🇸',
  MX: '🇲🇽',
  CO: '🇨🇴',
  CL: '🇨🇱',
  BR: '🇧🇷',
  IT: '🇮🇹',
  CH: '🇨🇭',
  PL: '🇵🇱',
  DE: '🇩🇪',
  NG: '🇳🇬',
  GH: '🇬🇭',
  GB: '🇬🇧',
}

const getCountryFlag = (code: string): string => {
  return countryFlags[code] || '🏳️'
}

// Convert country name to URL-friendly slug
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

// Generate URL using country name slug instead of country code
const getCorridorUrl = (countryCode: string): string => {
  const country = countries.find(c => c.code === countryCode)
  if (!country) {
    return `/send-money/`
  }

  const countrySlug = slugify(country.name)
  return `/send-money/${countrySlug}`
}
</script>
