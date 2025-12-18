<template>
  <section class="py-12 sm:py-16 bg-neutral-50">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <div class="bg-white rounded-3xl border-2 border-neutral-200 p-8 sm:p-12 text-center shadow-lg">
        <div class="mb-4">
          <svg class="w-12 h-12 text-brand-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 class="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
          Sign Up for Our Newsletter
        </h2>
        <p class="text-lg text-neutral-600 mb-8">
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
              class="flex-1 px-6 py-4 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors text-base"
            >
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-8 py-4 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Subscribing...' : 'Subscribe' }}
            </button>
          </div>

          <p
            v-if="successMessage"
            class="mt-4 text-sm text-emerald-600 font-medium"
          >
            {{ successMessage }}
          </p>
          <p
            v-if="errorMessage"
            class="mt-4 text-sm text-danger-600"
          >
            {{ errorMessage }}
          </p>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const email = ref('')
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const handleSubmit = async () => {
  if (!email.value) return

  isSubmitting.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    // TODO: CRITICAL - Replace with actual ESP/marketing endpoint before production
    // This currently simulates signup but doesn't actually save the email
    // Integrate with: Mailchimp, ConvertKit, SendGrid, or your preferred ESP
    // Example: await fetch('/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email: email.value }) })
    await new Promise(resolve => setTimeout(resolve, 1000))

    successMessage.value = '🎉 Thanks for subscribing! Check your inbox for confirmation.'
    email.value = ''
  }
  catch (error) {
    errorMessage.value = 'Something went wrong. Please try again.'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>
