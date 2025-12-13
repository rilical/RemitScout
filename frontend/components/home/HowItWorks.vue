<template>
  <section class="py-12 sm:py-16 bg-slate-900">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-white mb-3">
          How It Works
        </h2>
        <p class="text-base text-slate-300 max-w-2xl mx-auto">
          Three simple steps to finding the best money transfer for you
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
        <div class="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-slate-700 hover:border-brand-500 hover:shadow-2xl transition-all group">
          <div class="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span class="text-4xl">📝</span>
          </div>
          <div class="text-center">
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              1. Enter your details
            </h3>
            <p class="text-sm text-neutral-600">
              Tell us where you're sending from, where the money's going, and how much. Takes 30 seconds.
            </p>
          </div>
        </div>

        <div class="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-slate-700 hover:border-brand-500 hover:shadow-2xl transition-all group">
          <div class="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span class="text-4xl">🔍</span>
          </div>
          <div class="text-center">
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              2. We fetch live rates
            </h3>
            <p class="text-sm text-neutral-600">
              Our system checks 30+ providers in real-time for the best total cost, including all fees and exchange margins.
            </p>
          </div>
        </div>

        <div class="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-slate-700 hover:border-brand-500 hover:shadow-2xl transition-all group">
          <div class="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span class="text-4xl">✅</span>
          </div>
          <div class="text-center">
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              3. Transfer with your chosen provider
            </h3>
            <p class="text-sm text-neutral-600">
              Click through to your preferred provider and complete your transfer. We never handle your money.
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white/10 rounded-xl border border-white/20 p-6 backdrop-blur-sm">
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
              100% Independent & Free
            </h4>
            <p class="text-white/90 text-sm leading-relaxed">
              Remit-Scout is independent. Providers cannot pay to rank higher. We earn a small commission when you use our links, but this never affects our rankings.
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
