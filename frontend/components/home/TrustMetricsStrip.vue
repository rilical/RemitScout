<template>
  <section class="py-12 sm:py-16 bg-brand-600">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Trust Story -->
      <div class="text-center mb-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
          Why Trust Remit-Scout?
        </h2>
        <p class="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
          Built by an expat who got tired of watching money disappear to bank fees. We track <span class="font-semibold whitespace-nowrap">30+ providers</span> across <span class="font-semibold whitespace-nowrap">150+ countries</span> in real time. <span class="font-semibold whitespace-nowrap">Providers cannot pay to rank higher</span>—we just show you which option gets the most money to your recipient.
        </p>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <span class="text-3xl">👥</span>
          </div>
          <div class="text-3xl md:text-4xl font-bold text-white mb-1">
            80k+
          </div>
          <div class="text-sm text-white/90">
            Users trust us
          </div>
        </div>

        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <span class="text-3xl">💰</span>
          </div>
          <div class="text-3xl md:text-4xl font-bold text-white mb-1">
            $2.5M+
          </div>
          <div class="text-sm text-white/90">
            Saved in fees
          </div>
        </div>

        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <span class="text-3xl">🏢</span>
          </div>
          <div class="text-3xl md:text-4xl font-bold text-white mb-1">
            30+
          </div>
          <div class="text-sm text-white/90">
            Providers compared
          </div>
        </div>

        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <span class="text-3xl">🌍</span>
          </div>
          <div class="text-3xl md:text-4xl font-bold text-white mb-1">
            150+
          </div>
          <div class="text-sm text-white/90">
            Corridors covered
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
          <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

