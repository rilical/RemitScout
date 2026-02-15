<template>
  <section class="py-12 sm:py-16 bg-surface">
    <div class="mx-auto max-w-3xl px-page-x">
      <div class="bg-surface rounded-3xl border-2 border-neutral-200 p-8 sm:p-12 text-center shadow-lg">
        <div class="mb-4">
          <svg
            class="w-12 h-12 text-white/80 mx-auto"
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
        <h2 class="text-h3 font-bold text-neutral-900 mb-3">
          Sign Up for Our Newsletter
        </h2>
        <p class="text-body-lg text-neutral-600 mb-8">
          Get updates on the latest exchange rates, tips, and special deals!
        </p>

        <form
          class="max-w-xl mx-auto"
          @submit.prevent="handleSubmit"
        >
          <div class="flex flex-col sm:flex-row gap-3">
            <input
              v-model="email"
              type="email"
              placeholder="Enter your email"
              required
              class="flex-1 px-6 py-4 bg-surface border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors text-body"
            >
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-8 py-4 bg-white text-brand-600 font-semibold rounded-xl hover:bg-white/90 transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Subscribing...' : 'Subscribe' }}
            </button>
          </div>

          <p
            v-if="successMessage"
            class="mt-4 text-body-sm text-success-600 font-medium"
          >
            {{ successMessage }}
          </p>
          <p
            v-if="errorMessage"
            class="mt-4 text-body-sm text-danger-600"
          >
            {{ errorMessage }}
          </p>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi'

const email = ref('')
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const { request } = useApi()

const handleSubmit = async () => {
  if (!email.value) return

  isSubmitting.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    await request('/newsletter/subscribe', {
      method: 'POST',
      body: { email: email.value, source: 'NewsletterSignup' },
    })

    successMessage.value = '🎉 Thanks for subscribing! Check your inbox for confirmation.'
    email.value = ''
  }
  catch (error) {
    errorMessage.value = (error as Error)?.message || 'Something went wrong. Please try again.'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>
