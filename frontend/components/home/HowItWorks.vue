<template>
  <section class="py-12 sm:py-16 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
          How It Works
        </h2>
        <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
          Three simple steps to finding the best <span class="whitespace-nowrap">money transfer</span> for you
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        <div class="relative">
          <div class="flex flex-col items-center text-center">
            <div class="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-6">
              <span class="text-3xl">📝</span>
            </div>
            <div class="absolute top-8 left-1/2 w-full h-0.5 bg-brand-200 hidden md:block" style="transform: translateX(50%);" />
            <h3 class="text-xl font-bold text-neutral-900 mb-3">
              <span class="whitespace-nowrap">1. Enter your details</span>
            </h3>
            <p class="text-neutral-600 leading-relaxed">
              Tell us where you're sending from, where the money's going, and how much. <span class="whitespace-nowrap">Takes 30 seconds.</span>
            </p>
          </div>
        </div>

        <div class="relative">
          <div class="flex flex-col items-center text-center">
            <div class="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-6">
              <span class="text-3xl">🔍</span>
            </div>
            <div class="absolute top-8 left-1/2 w-full h-0.5 bg-brand-200 hidden md:block" style="transform: translateX(50%);" />
            <h3 class="text-xl font-bold text-neutral-900 mb-3">
              <span class="whitespace-nowrap">2. We fetch live rates</span>
            </h3>
            <p class="text-neutral-600 leading-relaxed">
              Our system checks <span class="whitespace-nowrap">30+ providers</span> in real-time for the best total cost, including all fees and <span class="whitespace-nowrap">exchange margins.</span>
            </p>
          </div>
        </div>

        <div class="relative">
          <div class="flex flex-col items-center text-center">
            <div class="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-6">
              <span class="text-3xl">✅</span>
            </div>
            <h3 class="text-xl font-bold text-neutral-900 mb-3">
              <span class="whitespace-nowrap">3. Transfer with your</span> <span class="whitespace-nowrap">chosen provider</span>
            </h3>
            <p class="text-neutral-600 leading-relaxed">
              Click through to your preferred provider and complete your transfer. <span class="whitespace-nowrap">We never handle your money.</span>
            </p>
          </div>
        </div>
      </div>

      <div class="mt-12 p-6 bg-brand-50 rounded-xl border border-brand-200">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div class="flex-1">
            <h4 class="font-bold text-neutral-900 mb-2"><span class="whitespace-nowrap">100% Independent</span> & Free</h4>
            <p class="text-neutral-700 leading-relaxed">
              We're independent. <span class="whitespace-nowrap">Providers cannot pay to rank higher.</span> We earn a small commission when you use our links, but this never affects our rankings, we show you the best deal based on total cost, speed, and reliability.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

