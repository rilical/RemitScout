<template>
  <section class="py-12 sm:py-16 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 class="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-8">
        {{ STR.corridors.title }}
      </h2>

      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          v-for="(tile, index) in corridors"
          :key="`${tile.from}-${tile.to}-${index}`"
          @click="handleTileClick(tile)"
          class="group relative overflow-hidden rounded-xl border-2 border-neutral-200 bg-white p-5 text-left transition-all hover:border-brand-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
        >
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">{{ getCountryFlag(tile.from) }}</span>
            <svg class="h-4 w-4 text-neutral-400 group-hover:text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span class="text-2xl">{{ getCountryFlag(tile.to) }}</span>
          </div>

          <div class="font-bold text-neutral-900 mb-2">
            {{ tile.from }} → {{ tile.to }}
          </div>

          <div class="space-y-1 text-sm text-neutral-600">
            <div class="flex items-center gap-2">
              <svg class="h-4 w-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span>{{ tile.feeText }}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ tile.timeText }}</span>
            </div>
          </div>

          <div class="absolute bottom-3 right-3 text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="text-sm font-semibold">Compare now →</span>
          </div>
        </button>
      </div>

      <p class="mt-6 text-center text-xs text-neutral-500">
        {{ STR.corridors.note }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CORRIDOR_TILES } from '~/utils/constants';

const { STR } = useStrings();

const corridors = CORRIDOR_TILES;

const countryFlags: Record<string, string> = {
  US: '🇺🇸',
  UK: '🇬🇧',
  CA: '🇨🇦',
  DE: '🇩🇪',
  FR: '🇫🇷',
  ES: '🇪🇸',
  IT: '🇮🇹',
  AE: '🇦🇪',
  PH: '🇵🇭',
  MX: '🇲🇽',
  IN: '🇮🇳',
  PK: '🇵🇰',
  NG: '🇳🇬',
  MA: '🇲🇦',
  SN: '🇸🇳',
  RO: '🇷🇴',
};

const getCountryFlag = (code: string): string => {
  return countryFlags[code] || '🏳️';
};

const emit = defineEmits<{
  'corridor-selected': [{ from: string; to: string }];
}>();

const handleTileClick = (tile: { from: string; to: string }) => {
  emit('corridor-selected', { from: tile.from, to: tile.to });
  
  if (typeof window !== 'undefined') {
    const heroSection = document.querySelector('#hero-compare');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};
</script>
