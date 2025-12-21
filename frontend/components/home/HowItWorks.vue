<template>
  <section class="py-12 sm:py-16 bg-brand-600">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-white mb-3">
          How It Works
        </h2>
        <p class="text-base text-white/90 max-w-2xl mx-auto">
          Three steps to comparing your options, clearly
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
        <div class="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-white/30 hover:border-white hover:shadow-2xl transition-all group">
          <div class="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div class="text-center">
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              1. Enter your details
            </h3>
            <p class="text-sm text-neutral-600">
              Tell us where you're sending from, where the money’s going, and how much you want to send. We handle the comparison.
            </p>
          </div>
        </div>

        <div class="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-white/30 hover:border-white hover:shadow-2xl transition-all group">
          <div class="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div class="text-center">
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              2. We pull current quotes
            </h3>
            <p class="text-sm text-neutral-600">
              We gather quotes from 30+ providers, then normalize fees and FX so you can compare like for like. Quotes are timestamped and refreshed regularly (cadence varies).
            </p>
          </div>
        </div>

        <div class="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-white/30 hover:border-white hover:shadow-2xl transition-all group">
          <div class="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="text-center">
            <h3 class="text-lg font-bold text-neutral-900 mb-2 leading-tight break-words">
              3. Complete your transfer
            </h3>
            <p class="text-sm text-neutral-600">
              Click through to your preferred provider and complete your transfer on their site. Remit-Scout never handles your money.
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 p-6">
        <div class="flex items-start gap-4 max-w-4xl mx-auto">
          <div class="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center">
            <svg
              class="w-6 h-6 text-brand-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div class="flex-1">
            <h4 class="font-bold text-white mb-2">
              Independent and free to use
            </h4>
            <p class="text-white/95 text-sm leading-relaxed">
              Providers cannot pay to rank higher. We may earn a small commission when you use our links, but affiliate relationships do not affect rankings or Remit-Score calculations.
              <NuxtLink
                to="/methodology"
                class="text-white hover:text-white/80 font-semibold underline ml-1"
              >
                Read more about our methodology →
              </NuxtLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>
