<template>
  <section :class="['py-12 sm:py-16', bgClass]">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Trust Story -->
      <div class="text-center mb-12">
        <h2 :class="['text-3xl sm:text-4xl font-bold mb-4', bgClass === 'bg-brand-600' ? 'text-white' : 'text-neutral-900']">
          Our Impact So Far
        </h2>
        <p :class="['text-lg max-w-3xl mx-auto leading-relaxed', bgClass === 'bg-brand-600' ? 'text-white/90' : 'text-neutral-700']">
          Built by an expat who got tired of watching money disappear to bank fees. We track <span class="font-semibold whitespace-nowrap">{{ SITE_STATS.providers.display }} providers</span> across <span class="font-semibold whitespace-nowrap">{{ SITE_STATS.corridors.display }} countries</span> in real time. <span class="font-semibold whitespace-nowrap">Providers cannot pay to rank higher</span>, we just show you which option gets the most money to your recipient.
        </p>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div :class="['text-3xl md:text-4xl font-bold mb-1', bgClass === 'bg-brand-600' ? 'text-white' : 'text-neutral-900']">
            {{ SITE_STATS.users.display }}
          </div>
          <div :class="['text-sm', bgClass === 'bg-brand-600' ? 'text-white/90' : 'text-neutral-600']">
            {{ SITE_STATS.users.label }}
          </div>
        </div>

        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div :class="['text-3xl md:text-4xl font-bold mb-1', bgClass === 'bg-brand-600' ? 'text-white' : 'text-neutral-900']">
            {{ SITE_STATS.totalSaved.display }}
          </div>
          <div :class="['text-sm', bgClass === 'bg-brand-600' ? 'text-white/90' : 'text-neutral-600']">
            {{ SITE_STATS.totalSaved.label }}
          </div>
        </div>

        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div :class="['text-3xl md:text-4xl font-bold mb-1', bgClass === 'bg-brand-600' ? 'text-white' : 'text-neutral-900']">
            {{ SITE_STATS.providers.display }}
          </div>
          <div :class="['text-sm', bgClass === 'bg-brand-600' ? 'text-white/90' : 'text-neutral-600']">
            {{ SITE_STATS.providers.label }}
          </div>
        </div>

        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div :class="['text-3xl md:text-4xl font-bold mb-1', bgClass === 'bg-brand-600' ? 'text-white' : 'text-neutral-900']">
            {{ SITE_STATS.corridors.display }}
          </div>
          <div :class="['text-sm', bgClass === 'bg-brand-600' ? 'text-white/90' : 'text-neutral-600']">
            {{ SITE_STATS.corridors.label }}
          </div>
        </div>
      </div>

      <!-- Bottom CTA Link -->
      <div class="mt-12 text-center">
        <NuxtLink
          :to="'/methodology'"
          :class="['inline-flex items-center gap-2 transition-colors group', bgClass === 'bg-brand-600' ? 'text-white hover:text-white/80' : 'text-brand-600 hover:text-brand-700']"
        >
          <span class="text-sm font-semibold">Learn about our methodology</span>
          <svg
            class="w-4 h-4 group-hover:translate-x-1 transition-transform"
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
import { SITE_STATS } from '~/config/stats'

interface Props {
  bgClass?: string
}

withDefaults(defineProps<Props>(), {
  bgClass: 'bg-brand-600',
})
</script>
