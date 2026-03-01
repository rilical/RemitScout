<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
    <div class="w-full max-w-lg text-center">
      <div class="mb-8">
        <NuxtLink to="/" class="inline-block">
          <img src="/logos/remit-scout.svg" alt="Remit-Scout" class="h-10 w-auto mx-auto">
        </NuxtLink>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div class="mb-6">
          <span class="text-6xl font-bold text-slate-200">{{ error?.statusCode ?? '?' }}</span>
        </div>

        <h1 class="text-2xl font-bold text-slate-900 mb-3">
          {{ title }}
        </h1>

        <p class="text-slate-600 mb-8">
          {{ description }}
        </p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            class="inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            @click="handleError"
          >
            Go back home
          </button>

          <NuxtLink
            to="/contact"
            class="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Contact support
          </NuxtLink>
        </div>
      </div>

      <p class="mt-6 text-xs text-slate-400">
        Error ID: {{ errorId }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  error: {
    statusCode?: number
    statusMessage?: string
    message?: string
  } | null
}>()

const errorId = computed(() =>
  `err_${Date.now().toString(36)}`,
)

const title = computed(() => {
  if (props.error?.statusCode === 404) return 'Page not found'
  if (props.error?.statusCode === 403) return 'Access denied'
  if (props.error?.statusCode === 500) return 'Something went wrong'
  return props.error?.statusMessage ?? 'An error occurred'
})

const description = computed(() => {
  if (props.error?.statusCode === 404) {
    return "We couldn't find the page you were looking for. It may have moved or no longer exists."
  }
  if (props.error?.statusCode === 403) {
    return "You don't have permission to access this page."
  }
  return "We've encountered an unexpected error. Our team has been notified. Please try again or return home."
})

const handleError = () => clearError({ redirect: '/' })

useHead({
  title: computed(() => `${title.value} | Remit-Scout`),
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})
</script>
