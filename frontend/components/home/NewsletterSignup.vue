<template>
  <section class="py-12 sm:py-16 bg-neutral-900">
    <div class="mx-auto max-w-3xl px-page-x">
      <!-- Success State -->
      <div
        v-if="isSuccess"
        class="text-center"
      >
        <div class="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
          <svg
            class="h-10 w-10 text-emerald-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M5 13l4 4L19 7"
              class="motion-safe:animate-draw-check"
            />
          </svg>
        </div>
        <h2 class="text-h3 font-bold text-white mb-3">
          You're In!
        </h2>
        <p class="text-body-lg text-white/70">
          Check your inbox for confirmation. Welcome to the Remit-Scout community.
        </p>
      </div>

      <!-- Form State -->
      <div
        v-else
        class="text-center"
      >
        <div class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
          <Icon name="envelope" :size="24" />
        </div>
        <h2 class="text-h3 font-bold text-white mb-3">
          Stay Ahead of the Market
        </h2>
        <p class="text-body-lg text-white/60 mb-8">
          Get weekly rate insights, corridor trends, and tips to save more on your transfers.
        </p>

        <form
          class="max-w-xl mx-auto"
          @submit.prevent="handleSubmit"
        >
          <div
            class="relative flex items-center rounded-2xl bg-white/8 border-2 p-1.5 motion-safe:transition-all"
            :class="[
              hasError ? 'border-red-500 motion-safe:animate-shake' : 'border-white/15 focus-within:border-brand-600 focus-within:bg-white/12',
            ]"
          >
            <input
              v-model="email"
              type="email"
              placeholder="Enter your email"
              required
              :disabled="isSubmitting"
              class="flex-1 bg-transparent px-5 py-3 text-body text-white placeholder-white/40 focus:outline-none disabled:opacity-50"
              @input="hasError = false"
            >
            <button
              type="submit"
              :disabled="isSubmitting"
              class="shrink-0 rounded-xl bg-brand-600 px-6 py-3 text-body font-semibold text-white hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:ring-offset-neutral-900 motion-safe:transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                v-if="isSubmitting"
                class="flex items-center gap-2"
              >
                <svg
                  class="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Subscribing...</span>
              </span>
              <span v-else>Subscribe</span>
            </button>
          </div>

          <div
            v-if="errorMessage"
            class="mt-4 flex items-center justify-center gap-2 text-body-sm text-red-400"
          >
            <Icon name="exclamation-triangle" :size="16" />
            <span>{{ errorMessage }}</span>
          </div>

          <p class="mt-4 text-body-sm text-white/35">
            No spam, unsubscribe anytime. We respect your inbox.
          </p>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { Icon } from '~/ui'

const email = ref('')
const isSubmitting = ref(false)
const isSuccess = ref(false)
const errorMessage = ref('')
const hasError = ref(false)
const { request } = useApi()

const handleSubmit = async () => {
  if (!email.value) return

  isSubmitting.value = true
  errorMessage.value = ''
  hasError.value = false

  try {
    await request('/newsletter/subscribe', {
      method: 'POST',
      body: { email: email.value, source: 'NewsletterSignup' },
    })

    isSuccess.value = true
    email.value = ''
  }
  catch (error) {
    errorMessage.value = (error as Error)?.message || 'Something went wrong. Please try again.'
    hasError.value = true
  }
  finally {
    isSubmitting.value = false
  }
}
</script>
