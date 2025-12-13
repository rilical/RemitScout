<template>
  <section class="py-12 sm:py-16 bg-neutral-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-10">
        <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
          Your one-stop hub for international living
        </h2>
        <p class="text-lg text-neutral-600 max-w-3xl mx-auto mb-2">
          Not only do we cover international money transfers, but we're your complete resource for living, working, and traveling abroad.
        </p>
        <p class="text-base text-neutral-500 max-w-2xl mx-auto">
          From finding the best travel insurance to navigating expat life, <span class="whitespace-nowrap">we've got you covered.</span>
        </p>
      </div>

      <!-- Tool Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Travelling & Living Abroad Guides -->
        <NuxtLink
          to="/learn"
          class="bg-white rounded-2xl border border-neutral-200 p-8 hover:shadow-xl hover:border-brand-300 transition-all group"
        >
          <div class="mb-5">
            <span class="text-5xl">📚</span>
          </div>
          <h3 class="text-2xl font-bold text-neutral-900 mb-3 group-hover:text-brand-600 transition-colors">
            Travel & Expat Guides
          </h3>
          <p class="text-neutral-600 mb-6 leading-relaxed text-base">
            Expert guides on living abroad, working remotely, visa requirements, and navigating life as an expat.
          </p>

          <div class="flex items-center text-brand-600 font-semibold group-hover:gap-2 transition-all text-base mb-6">
            <span>Read our guides</span>
            <svg
              class="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform"
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
          </div>

          <div class="pt-4 border-t border-neutral-100">
            <div class="space-y-2 text-sm text-neutral-600">
              <div class="flex items-center gap-2">
                <svg
                  class="h-4 w-4 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Country-specific tips</span>
              </div>
              <div class="flex items-center gap-2">
                <svg
                  class="h-4 w-4 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Regular updates</span>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Best Travel Insurance -->
        <NuxtLink
          to="/learn/travel-insurance"
          class="bg-white rounded-2xl border border-neutral-200 p-8 hover:shadow-xl hover:border-brand-300 transition-all group"
        >
          <div class="mb-5">
            <span class="text-5xl">🛡️</span>
          </div>
          <h3 class="text-2xl font-bold text-neutral-900 mb-3 group-hover:text-brand-600 transition-colors">
            Best Travel Insurance
          </h3>
          <p class="text-neutral-600 mb-6 leading-relaxed text-base">
            Compare top-rated travel insurance providers for peace of mind wherever you go. Medical, trip cancellation, and more.
          </p>

          <div class="flex items-center text-brand-600 font-semibold group-hover:gap-2 transition-all text-base mb-6">
            <span>Compare providers</span>
            <svg
              class="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform"
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
          </div>

          <div class="pt-4 border-t border-neutral-100">
            <div class="space-y-2 text-sm text-neutral-600">
              <div class="flex items-center gap-2">
                <svg
                  class="h-4 w-4 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Medical coverage</span>
              </div>
              <div class="flex items-center gap-2">
                <svg
                  class="h-4 w-4 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Trip protection</span>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Bottom CTA -->
      <div class="mt-12 text-center">
        <p class="text-lg text-neutral-700 mb-2 font-medium">
          Your complete international living companion
        </p>
        <p class="text-base text-neutral-600 max-w-2xl mx-auto">
          All resources are free to access. No hidden fees, no sign-up required.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>
