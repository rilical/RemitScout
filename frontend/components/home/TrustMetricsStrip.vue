<template>
  <section class="py-12 sm:py-16 bg-brand-600">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Trust Story -->
      <div class="text-center mb-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
          Our Impact So Far
        </h2>
        <p class="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
          Built by an expat who got tired of watching money disappear to bank fees. We track <span class="font-semibold whitespace-nowrap">{{ SITE_STATS.providers.display }} providers</span> across <span class="font-semibold whitespace-nowrap">{{ SITE_STATS.corridors.display }} countries</span> in real time. <span class="font-semibold whitespace-nowrap">Providers cannot pay to rank higher</span>, we just show you which option gets the most money to your recipient.
        </p>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <span class="text-3xl">👥</span>
          </div>
          <div class="text-3xl md:text-4xl font-bold text-white mb-1">
            {{ SITE_STATS.users.display }}
          </div>
          <div class="text-sm text-white/90">
            {{ SITE_STATS.users.label }}
          </div>
        </div>

        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <span class="text-3xl">💰</span>
          </div>
          <div class="text-3xl md:text-4xl font-bold text-white mb-1">
            {{ SITE_STATS.totalSaved.display }}
          </div>
          <div class="text-sm text-white/90">
            {{ SITE_STATS.totalSaved.label }}
          </div>
        </div>

        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <span class="text-3xl">🏢</span>
          </div>
          <div class="text-3xl md:text-4xl font-bold text-white mb-1">
            {{ SITE_STATS.providers.display }}
          </div>
          <div class="text-sm text-white/90">
            {{ SITE_STATS.providers.label }}
          </div>
        </div>

        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <span class="text-3xl">🌍</span>
          </div>
          <div class="text-3xl md:text-4xl font-bold text-white mb-1">
            {{ SITE_STATS.corridors.display }}
          </div>
          <div class="text-sm text-white/90">
            {{ SITE_STATS.corridors.label }}
          </div>
        </div>
      </div>

      <!-- Bottom CTA Link -->
      <div class="mt-12 text-center">
        <NuxtLink
          to="/methodology"
          class="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors group"
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
</script>
