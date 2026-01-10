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
              <div class="rounded-lg border border-slate-700 bg-slate-900 p-4">
                <div class="text-sm font-semibold text-slate-300">Signed in as</div>
                <div class="text-white font-semibold">{{ userEmail || 'Account email' }}</div>
                <p class="mt-2 text-xs text-slate-500">
                  Payment details are entered securely on Stripe Checkout. We never collect or store card data on this page.
                </p>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                :disabled="processing"
                class="w-full h-14 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold shadow-xl hover:shadow-2xl transition-all disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span v-if="!processing">Continue to Stripe Checkout</span>
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
                  <span class="text-2xl font-bold text-white">$0.00</span>
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
import { computed, ref } from 'vue'
import { useMarketingAnalytics } from '~/composables/useMarketingAnalytics'

const processing = ref(false)
const { isAuthenticated, user } = useAuth()
const billingActions = useBilling()
const userEmail = computed(() => user.value?.email || '')
const { trackCheckoutStart } = useMarketingAnalytics()
const currentRoute = useRoute()
const runtimeConfig = useRuntimeConfig()
const devAutoUpgrade = computed(() => Boolean(runtimeConfig.public.devAuthEnabled) || import.meta.dev)

async function handleCheckout() {
  if (!isAuthenticated.value) {
    await navigateTo({ path: '/sign-in', query: { redirect: '/plus/checkout' } })
    return
  }

  processing.value = true

  try {
    void trackCheckoutStart({
      value: 9,
      currency: 'USD',
      plan: 'plus',
      pagePath: currentRoute.fullPath,
    })
    const result = await billingActions.createCheckoutSession('plus')
    if (result.ok) {
      if (devAutoUpgrade.value && result.sessionId) {
        const verifyResult = await billingActions.verifyCheckoutSession(result.sessionId)
        if (verifyResult.ok) {
          await navigateTo('/plus/success')
          return
        }
      }

      if (result.url) {
        window.location.href = result.url
        return
      }
    }

    throw new Error(result.error || 'No checkout URL returned')
  } catch (error: any) {
    console.error('Checkout error:', error)
    if (error?.statusCode === 404 || error?.message?.includes('fetch')) {
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



