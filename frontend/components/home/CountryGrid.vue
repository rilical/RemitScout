<template>
  <section class="py-12 sm:py-16 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">Our comparisons cover 154 countries</h2>
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
              <div class="text-sm text-neutral-500 mb-0.5">
                {{ userCountry === country.code ? 'Send money to' : `Send from ${userCountry} to` }}
              </div>
              <div class="font-semibold text-neutral-900">{{ country.name }}</div>
            </div>
          </div>

          <button 
            type="button"
            class="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-400 group-hover:border-neutral-400 group-hover:text-neutral-600 transition-colors flex-shrink-0"
            aria-label="View rates"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
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
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { COUNTRY_HIGHLIGHTS } from '~/utils/constants';

const { STR } = useStrings();
const countries = COUNTRY_HIGHLIGHTS;

// Detect user's country for localized corridor URLs
const userCountry = ref('US'); // Default to US

// Detect user location on mount
onMounted(async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data.country_code) {
      userCountry.value = data.country_code.toUpperCase();
    }
  } catch (error) {
    // Fallback to US if detection fails
    console.log('Location detection failed, using US as default');
  }
});

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
};

const getCountryFlag = (code: string): string => {
  return countryFlags[code] || '🏳️';
};

// Generate localized corridor URL based on user's country
const getCorridorUrl = (toCountry: string): string => {
  const from = userCountry.value.toLowerCase();
  const to = toCountry.toLowerCase();
  
  // If user is from the same country, default to US
  if (from === to) {
    return `/send-money/us-to-${to}`;
  }
  
  return `/send-money/${from}-to-${to}`;
};
</script>
