<template>
  <div class="min-h-screen bg-slate-900 py-12">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <NuxtLink to="/plus" class="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Plus</span>
        </NuxtLink>
        <h1 class="text-4xl font-bold text-white mb-2">
          Upgrade to Plus
        </h1>
        <p class="text-lg text-slate-400">
          Complete your subscription in just a few steps
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Checkout Form -->
        <div class="lg:col-span-2">
          <div class="bg-slate-800 rounded-2xl border border-slate-700 p-8">
            <h2 class="text-2xl font-bold text-white mb-6">
              Payment Details
            </h2>

            <form @submit.prevent="handleCheckout" class="space-y-6">
              <!-- Email -->
              <div>
                <label for="email" class="block text-sm font-semibold text-slate-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  class="w-full h-12 rounded-lg border-2 border-slate-600 bg-slate-900 px-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  placeholder="you@example.com"
                  required
                >
              </div>

              <!-- Card Information -->
              <div>
                <label class="block text-sm font-semibold text-slate-300 mb-2">
                  Card Information
                </label>
                <div class="space-y-3">
                  <input
                    v-model="form.cardNumber"
                    type="text"
                    class="w-full h-12 rounded-lg border-2 border-slate-600 bg-slate-900 px-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                    placeholder="1234 1234 1234 1234"
                    maxlength="19"
                    required
                  >
                  <div class="grid grid-cols-2 gap-3">
                    <input
                      v-model="form.expiry"
                      type="text"
                      class="h-12 rounded-lg border-2 border-slate-600 bg-slate-900 px-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                      placeholder="MM / YY"
                      maxlength="7"
                      required
                    >
                    <input
                      v-model="form.cvc"
                      type="text"
                      class="h-12 rounded-lg border-2 border-slate-600 bg-slate-900 px-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                      placeholder="CVC"
                      maxlength="3"
                      required
                    >
                  </div>
                </div>
              </div>

              <!-- Billing Address -->
              <div>
                <label for="country" class="block text-sm font-semibold text-slate-300 mb-2">
                  Country
                </label>
                <select
                  id="country"
                  v-model="form.country"
                  class="w-full h-12 rounded-lg border-2 border-slate-600 bg-slate-900 px-4 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  required
                >
                  <option value="">Select country</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="ES">Spain</option>
                  <option value="IT">Italy</option>
                </select>
              </div>

              <div>
                <label for="zip" class="block text-sm font-semibold text-slate-300 mb-2">
                  ZIP / Postal Code
                </label>
                <input
                  id="zip"
                  v-model="form.zip"
                  type="text"
                  class="w-full h-12 rounded-lg border-2 border-slate-600 bg-slate-900 px-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  placeholder="12345"
                  required
                >
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                :disabled="processing"
                class="w-full h-14 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold shadow-xl hover:shadow-2xl transition-all disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span v-if="!processing">Subscribe to Plus</span>
                <span v-else>Processing...</span>
                <svg v-if="!processing" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </button>

              <p class="text-xs text-slate-500 text-center">
                By subscribing, you agree to our <NuxtLink to="/terms" class="text-blue-400 hover:text-blue-300">Terms of Service</NuxtLink> and <NuxtLink to="/privacy" class="text-blue-400 hover:text-blue-300">Privacy Policy</NuxtLink>
              </p>
            </form>
          </div>

          <!-- Security Notice -->
          <div class="mt-6 bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p class="text-sm font-semibold text-white">Secure Payment</p>
                <p class="text-xs text-slate-400 mt-1">
                  Your payment information is encrypted and processed securely by Stripe. We never store your card details.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-1">
          <div class="bg-slate-800 rounded-2xl border border-slate-700 p-6 sticky top-6">
            <h3 class="text-xl font-bold text-white mb-6">
              Order Summary
            </h3>

            <div class="space-y-4 mb-6">
              <div class="flex items-center justify-between">
                <span class="text-slate-300">Remit-Scout Plus</span>
                <span class="text-white font-semibold">$9.00</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-400">Billing cycle</span>
                <span class="text-slate-300">Monthly</span>
              </div>
              <div class="border-t border-slate-700 pt-4">
                <div class="flex items-center justify-between">
                  <span class="text-white font-semibold">Total due today</span>
                  <span class="text-2xl font-bold text-white">$9.00</span>
                </div>
                <p class="text-xs text-slate-500 mt-2">
                  14-day free trial • Cancel anytime
                </p>
              </div>
            </div>

            <div class="border-t border-slate-700 pt-6 space-y-3">
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-slate-300">Unlimited alerts and watchlist</span>
              </div>
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-slate-300">365-day rate history</span>
              </div>
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-slate-300">Export data (CSV/PDF)</span>
              </div>
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-slate-300">Ad-free experience</span>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t border-slate-700">
              <p class="text-xs text-slate-500 text-center">
                You won't be charged until after your 14-day free trial ends
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const form = ref({
  email: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
  country: '',
  zip: '',
})

const processing = ref(false)

async function handleCheckout() {
  processing.value = true

  try {
    // Create Stripe Checkout Session via your backend API
    const response = await $fetch('/api/stripe/create-checkout', {
      method: 'POST',
      body: {
        plan: 'plus',
        successUrl: `${window.location.origin}/plus/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/plus/failed`
      }
    })
    
    // Redirect to Stripe Checkout
    if (response.url) {
      window.location.href = response.url
    } else {
      throw new Error('No checkout URL returned')
    }
  } catch (error) {
    console.error('Checkout error:', error)
    // If API doesn't exist yet, show helpful message
    if (error.statusCode === 404 || error.message?.includes('fetch')) {
      alert('Stripe integration pending. Please contact support to upgrade to Plus.')
      navigateTo('/contact')
    } else {
      navigateTo('/plus/failed')
    }
  } finally {
    processing.value = false
  }
}

useHead({
  title: 'Checkout - Remit-Scout Plus',
  meta: [
    { name: 'description', content: 'Complete your Remit-Scout Plus subscription' },
  ],
})
</script>










