<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <!-- Header -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <svg
            class="w-8 h-8 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489A2 2 0 0111.17 18H8.83a2 2 0 01-1.933-1.511L7.22 16H5a2 2 0 01-2-2V5zm5.771 7H9a2 2 0 002-2V7a2 2 0 00-2-2H5.77l.123.489A2 2 0 007.17 7H8.83a2 2 0 011.933 1.511L10.22 9H5a2 2 0 00-2 2v1a2 2 0 002 2h2.771z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          eSIM Comparison Coming Soon
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          We're working hard to bring you the best eSIM comparison tool for international travel.
          Compare global eSIM providers, data plans, and prices all in one place.
        </p>
      </div>

      <!-- Features -->
      <div class="bg-white rounded-2xl shadow-lg p-8 mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">
          What to Expect
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg
                class="w-6 h-6 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Compare Providers
            </h3>
            <p class="text-gray-600">
              Compare rates and features from top eSIM providers worldwide
            </p>
          </div>
          <div class="text-center">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg
                class="w-6 h-6 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Global Coverage
            </h3>
            <p class="text-gray-600">
              Find eSIM plans for 150+ countries and regions
            </p>
          </div>
          <div class="text-center">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg
                class="w-6 h-6 text-purple-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Real Reviews
            </h3>
            <p class="text-gray-600">
              Read honest reviews and ratings from real travelers
            </p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center">
        <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
          <h3 class="text-2xl font-bold mb-4">
            Want to be notified when we launch?
          </h3>
          <p class="text-primary-100 mb-6">
            Join our waitlist and be the first to know when eSIM comparison goes live
          </p>
          <button class="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
            Join Waitlist
          </button>
        </div>
      </div>

      <!-- Back to Money Transfers -->
      <div class="text-center mt-8">
        <NuxtLink
          to="/send-money/us-to-in"
          class="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
        >
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Money Transfer Comparison
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// SEO for eSIM coming soon page
const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'eSIM Comparison Coming Soon | Remit-Scout',
  description: 'Compare global eSIM providers for international travel. Coming soon to Remit-Scout.',
  canonical: `${siteUrl}/esim`,
  ogImage: `${siteUrl}/images/og/esim.jpg`,
})
</script>
