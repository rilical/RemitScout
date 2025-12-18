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
            <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
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
            <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
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




