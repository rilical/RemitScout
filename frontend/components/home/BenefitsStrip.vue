<template>
  <section class="bg-gray-50 py-12" aria-labelledby="benefits-heading">
    <div class="container mx-auto px-4">
      <div class="mb-8 text-center">
        <h2 id="benefits-heading" class="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">
          Why choose Remit-Scout?
        </h2>
        <p class="mx-auto max-w-2xl text-lg text-gray-600">
          We're committed to helping you find the best money transfer deals with complete
          transparency.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <!-- Independent & unbiased -->
        <div class="group text-center">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition-shadow group-hover:shadow-md"
          >
            <svg
              class="h-8 w-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900">Independent & unbiased</h3>
          <p class="text-sm leading-relaxed text-gray-600">
            We don't favor any provider. Our recommendations are based purely on data and user
            reviews.
          </p>
        </div>

        <!-- Updated every 10 minutes -->
        <div class="group text-center">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition-shadow group-hover:shadow-md"
          >
            <svg
              class="h-8 w-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900">Updated every 10 minutes</h3>
          <p class="text-sm leading-relaxed text-gray-600">
            Exchange rates and fees are refreshed continuously to ensure you get the most current
            data.
          </p>
        </div>

        <!-- 30+ trusted providers -->
        <div class="group text-center">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition-shadow group-hover:shadow-md"
          >
            <svg
              class="h-8 w-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900">30+ trusted providers</h3>
          <p class="text-sm leading-relaxed text-gray-600">
            Compare rates from all major money transfer companies, including Wise, Western Union,
            and Remitly.
          </p>
        </div>

        <!-- Mobile-first, fast -->
        <div class="group text-center">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition-shadow group-hover:shadow-md"
          >
            <svg
              class="h-8 w-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900">Mobile-first, fast</h3>
          <p class="text-sm leading-relaxed text-gray-600">
            Optimized for all devices with lightning-fast loading and intuitive mobile experience.
          </p>
        </div>
      </div>

      <!-- Call to action -->
      <div class="mt-8 text-center">
        <NuxtLink
          to="/providers"
          class="inline-flex items-center font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          View all providers
          <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  </section>
</template>

<script setup lang="ts">
// Import shared components
import { NuxtLink } from '#components'

// This component displays trust indicators and benefits
// No client-side logic needed - pure presentation
</script>
