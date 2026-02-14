<template>
  <section class="py-8 sm:py-10 bg-neutral-900">
    <div class="container">
      <div class="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-14 h-14 rounded-xl bg-success-600 flex items-center justify-center">
            <span class="text-h2">✓</span>
          </div>
          <div>
            <h2 class="text-h4 font-bold text-white mb-2">
              Independent rankings
            </h2>
            <p class="text-body-sm text-neutral-300 max-w-2xl leading-relaxed">
              We may earn an affiliate commission when you click a provider link and complete a purchase.
              <strong class="text-white">Providers cannot pay to rank higher</strong>, and affiliate relationships do not affect Remit‑Score calculations.
            </p>
          </div>
        </div>
        <div class="flex-shrink-0">
          <NuxtLink
            to="/legal/how-we-make-money"
            class="inline-flex items-center gap-2 rounded-lg bg-surface px-5 py-2.5 text-body-sm font-semibold text-rs-fg hover:bg-neutral-100 transition-colors"
          >
            Revenue disclosure
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
    </div>
  </section>
</template>

<script setup lang="ts">
</script>
