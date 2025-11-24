<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        eSIM Coming Soon
      </h1>
      <p class="text-gray-600 mb-6">
        Redirecting to eSIM information page...
      </p>
      <NuxtLink
        to="/esim"
        class="text-primary-600 hover:text-primary-700 font-medium"
      >
        Go to eSIM Page
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// Redirect to main eSIM page
await navigateTo('/esim', { redirectCode: 301 })
</script>
