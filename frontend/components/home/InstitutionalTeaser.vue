<template>
  <section class="py-16 sm:py-20 bg-neutral-50 border-y border-rs-border">
    <div class="container">
      <div class="rounded-3xl border border-rs-border bg-surface p-8 sm:p-10 shadow-sm">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div class="lg:max-w-3xl">
            <p class="text-body-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">
              For institutions
            </p>
            <h2 class="text-h2 font-bold text-rs-fg mb-4 leading-tight">
              Remittance intelligence for research and risk teams
            </h2>
            <p class="text-body-lg text-neutral-700 leading-relaxed">
              We offer real-time corridor data, proprietary cost and volatility indexes, and historical datasets. Materials and access details are shared with qualified clients under NDA.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <NuxtLink
              to="/contact?type=enterprise&topic=pulse"
              class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-body font-semibold text-white hover:bg-brand-700 motion-safe:transition-colors"
            >
              Contact us
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>
