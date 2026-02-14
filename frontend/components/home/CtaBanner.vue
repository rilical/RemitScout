<template>
  <section class="py-16 sm:py-20 bg-brand-600">
    <div class="mx-auto max-w-4xl px-page-x text-center">
      <h2 class="text-h2 font-bold text-white mb-4">
        Ready to save on your next transfer?
      </h2>
      <p class="text-h4 text-white/90 mb-4">
        Compare live rates from top providers and find the best deal
      </p>
      <p class="text-body-lg text-white/80 mb-10 max-w-2xl mx-auto">
        Enter your transfer details above to see real-time rates and save money on fees and exchange rates.
      </p>
      <NuxtLink
        to="/send-money"
        class="inline-flex items-center gap-3 px-8 py-4 bg-surface text-brand-600 font-bold text-body-lg rounded-xl hover:bg-neutral-50 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
      >
        <span>Compare Rates Now</span>
        <svg
          class="w-5 h-5"
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
  </section>
</template>

<script setup lang="ts">
</script>
