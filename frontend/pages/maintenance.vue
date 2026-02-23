<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center px-page-x">
    <div class="max-w-2xl w-full text-center">
      <!-- Logo -->
      <div class="mb-8">
        <NuxtImg
          src="/png/SVG/FULL_LOGO.svg"
          alt="Remit-Scout"
          width="260"
          height="72"
          loading="eager"
          preload
          class="h-14 w-auto mx-auto object-contain"
        />
      </div>

      <!-- Maintenance Icon -->
      <div class="mb-8 flex justify-center">
        <div class="flex items-center justify-center w-24 h-24 rounded-full bg-primary-100">
          <svg
            class="w-12 h-12 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
      </div>

      <!-- Heading -->
      <h1 class="text-h1 font-bold text-neutral-900 mb-4">
        We're performing maintenance
      </h1>

      <p class="text-h4 text-neutral-600 mb-8 max-w-xl mx-auto">
        Remit-Scout is temporarily unavailable while we make improvements to serve you better.
      </p>

      <!-- Info Box -->
      <div class="bg-surface rounded-2xl border-2 border-primary-200 p-8 shadow-lg mb-8">
        <div class="space-y-4 text-left">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
              <svg
                class="w-6 h-6 text-primary-600"
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
            <div>
              <h3 class="font-semibold text-neutral-900 mb-1">
                Estimated downtime
              </h3>
              <p class="text-neutral-600">
                We expect to be back online shortly. Please check back in a few minutes.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
              <svg
                class="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 mb-1">
                What we're doing
              </h3>
              <p class="text-neutral-600">
                We're updating our systems to provide you with faster, more accurate rate comparisons.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
              <svg
                class="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 mb-1">
                Need help?
              </h3>
              <p class="text-neutral-600">
                If you have urgent questions, please contact us at
                <a
                  href="mailto:support@remit-scout.com"
                  class="text-primary-600 hover:text-primary-700 font-medium underline"
                >
                  support@remit-scout.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Refresh Button -->
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-body font-semibold text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
        @click="refreshPage"
      >
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
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Refresh page
      </button>

      <!-- Footer -->
      <p class="mt-8 text-body-sm text-neutral-500">
        Thank you for your patience
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'

definePageMeta({
  layout: false,
})

const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Maintenance | Remit-Scout',
  description: 'Remit-Scout is temporarily unavailable for maintenance. We\'ll be back shortly.',
  canonical: `${siteUrl}${route.path}`,
  noindex: true,
})

const refreshPage = () => {
  window.location.reload()
}
</script>
