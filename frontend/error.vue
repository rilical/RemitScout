<template>
  <div class="min-h-screen bg-white flex items-center justify-center px-page-x">
    <div
      class="max-w-2xl w-full text-center"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <!-- Logo -->
      <div class="mb-12">
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 694.45 162.52"
            class="h-10 w-auto"
            preserveAspectRatio="xMinYMid meet"
          >
            <g>
              <g>
                <path
                  fill="#2563eb"
                  d="M56.27,111.33c-3.79-3.87-14.3-13.51-16.66-17.14-1.49-2.3-1.93-5.7,0-7.92,7.74-9,18.81-17.13,26.2-26.18,4.42-5.42,3.43-11.36-4.25-8.51-8.46,9.86-21,18.94-28.96,28.9-3.53,4.42-4.89,7.89-3.17,13.54,2.67,8.77,19.3,18.22,23.6,26.34,3.27,6.19-.39,10.19-4.26,14.65-3.92,4.51-23.31,24.36-27.42,26.17-10.38,4.57-20.65-3.18-21.34-13.99L.03,21.1C1.85,7.46,11.66,1.43,24.66.66c15.31-.9,36.49-.86,51.82,0,34.98,1.97,57.34,30.09,50.68,64.74-3.13,16.27-15.07,28.16-28.42,36.77,7.5,12.23,16.82,23.63,24.45,35.72,3.48,5.52,6.72,9.86,3.62,16.68-3.98,8.78-15.7,10.33-22.84,4.36-15.87-15.89-31.98-31.59-47.7-47.62Z"
                />
                <path
                  fill="#fff"
                  d="M67.68,48.81l-17.89,4.79c-2.25.6-3,3.41-1.36,5.06l13.09,13.09c1.65,1.65,4.46.89,5.06-1.36l4.79-17.89c.6-2.25-1.46-4.31-3.7-3.7Z"
                />
              </g>
              <text
                fill="#111827"
                font-family="Inter-Bold, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                font-size="86.93"
                font-weight="700"
                transform="translate(165.35 107.59)"
              >
                <tspan
                  letter-spacing="-0.01em"
                  x="0"
                  y="0"
                >R</tspan>
                <tspan
                  letter-spacing="0em"
                  x="56.03"
                  y="0"
                >emi</tspan>
                <tspan
                  letter-spacing="-0.02em"
                  x="210.71"
                  y="0"
                >t</tspan>
                <tspan
                  letter-spacing="0em"
                  x="241.1"
                  y="0"
                >-Scout</tspan>
              </text>
            </g>
          </svg>
        </NuxtLink>
      </div>

      <!-- Error Code -->
      <div class="mb-6">
        <h1 class="text-7xl sm:text-8xl font-bold text-brand-600 mb-4">
          {{ error.statusCode || 404 }}
        </h1>
      </div>

      <!-- Heading -->
      <h2 class="text-h1 text-neutral-900 mb-3">
        {{ heading }}
      </h2>

      <p class="text-body-lg text-neutral-600 mb-10 max-w-xl mx-auto">
        {{ description }}
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-body font-semibold text-white shadow-lg transition-all hover:bg-brand-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
          @click="handleError"
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Go to homepage
        </button>

        <NuxtLink
          to="/send-money"
          class="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-brand-600 bg-surface px-6 py-3 text-body font-semibold text-brand-600 transition-all hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Compare rates
        </NuxtLink>
      </div>

      <!-- Help Link -->
      <div class="mt-8">
        <p class="text-body-sm text-neutral-600">
          Need help?
          <NuxtLink
            to="/contact"
            class="text-brand-600 hover:text-brand-700 font-medium underline"
          >
            Contact us
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ErrorProps {
  error: {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
}

const props = defineProps<ErrorProps>()

const error = computed(() => props.error || { statusCode: 404, statusMessage: 'Page not found' })

const statusCode = computed(() => error.value.statusCode || 404)
const heading = computed(() => {
  if (statusCode.value === 401) return 'Unauthorized'
  if (statusCode.value === 403) return 'Access denied'
  if (statusCode.value >= 500) return 'Something went wrong'
  return 'Page not found'
})
const description = computed(() => {
  if (statusCode.value === 401) return 'Please sign in to access this page.'
  if (statusCode.value === 403) return 'You do not have permission to view this page.'
  if (statusCode.value >= 500) return 'We hit an unexpected error. Please try again.'
  return error.value.statusMessage || 'The page you\'re looking for doesn\'t exist or has been moved.'
})

const handleError = () => clearError({ redirect: '/' })

useHead({
  title: `${statusCode.value} - ${heading.value} | Remit-Scout`,
  meta: [
    {
      name: 'description',
      content: description.value,
    },
    {
      name: 'robots',
      content: 'noindex, nofollow',
    },
  ],
})
</script>
