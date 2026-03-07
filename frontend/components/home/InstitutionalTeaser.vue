<template>
  <section class="py-16 sm:py-20 bg-surface">
    <div class="container">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
        <div class="flex items-start gap-6 lg:max-w-2xl">
          <div>
            <p class="text-body-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">
              For institutions
            </p>
            <h2 class="text-h2 font-bold text-neutral-900 mb-4 leading-tight">
              Remittance data for<br class="hidden sm:block">
              research and risk teams
            </h2>
            <p class="text-body-lg text-neutral-600 leading-relaxed max-w-xl">
              Join the institutional waitlist while we build toward 180 days of live sellable history for corridor pricing, proprietary cost indexes, and historical datasets.
            </p>
          </div>
        </div>

        <div class="flex-shrink-0 lg:pl-8">
          <NuxtLink
            to="/contact?type=enterprise&topic=pulse"
            class="group inline-flex items-center gap-3 px-7 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-body rounded-xl motion-safe:transition-colors shadow-lg"
          >
            Get in touch
            <svg
              class="w-4 h-4 motion-safe:transition-transform group-hover:translate-x-1"
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
