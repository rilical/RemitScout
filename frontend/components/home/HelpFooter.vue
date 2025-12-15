<template>
  <section class="py-12 sm:py-16 bg-slate-900">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-white mb-3">
          See something that doesn't look right?
        </h2>
        <p class="text-base text-slate-300 max-w-2xl mx-auto">
          If you notice a mismatch between our displayed quote and checkout, we want to know. 
          We investigate every report and update our data pipeline accordingly.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <NuxtLink
          to="/contact"
          class="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-slate-700 hover:border-brand-500 hover:shadow-2xl transition-all group"
        >
          <div class="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span class="text-4xl">📊</span>
          </div>
          <div class="text-center">
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              Report a rate issue
            </h3>
            <p class="text-sm text-neutral-600">
              Spotted a discrepancy between our quote and your checkout? Let us know so we can investigate and improve our data.
            </p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/methodology"
          class="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-slate-700 hover:border-brand-500 hover:shadow-2xl transition-all group"
        >
          <div class="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span class="text-4xl">📖</span>
          </div>
          <div class="text-center">
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              View our methodology
            </h3>
            <p class="text-sm text-neutral-600">
              See exactly how we collect quotes, calculate scores, and ensure data quality across all providers.
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>



