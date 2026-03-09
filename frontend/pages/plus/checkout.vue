<template>
  <div class="min-h-screen bg-neutral-900">
    <CenteredPage
      max-width="5xl"
      padding-y="md"
    >
      <!-- Header -->
      <div class="text-center mb-8">
        <NuxtLink
          to="/plus"
          class="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 mb-4"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Back to Plus</span>
        </NuxtLink>
        <h1 class="text-h1 font-bold text-white mb-2">
          Upgrade to Plus
        </h1>
        <p class="text-body-lg text-neutral-400">
          Complete your subscription in just a few steps
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Checkout Form -->
        <div class="lg:col-span-2">
          <div class="bg-neutral-800 rounded-2xl border border-neutral-700 p-8">
            <h2 class="text-h3 font-bold text-white mb-6">
              Payment Details
            </h2>

            <form
              :data-ready="interactionReady ? 'true' : 'false'"
              class="space-y-6"
            >
              <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                <template v-if="isAuthenticated">
                  <div class="text-body-sm font-semibold text-neutral-300">
                    Signed in as
                  </div>
                  <div class="text-white font-semibold">
                    {{ userEmail || 'Account email' }}
                  </div>
                  <p class="mt-2 text-body-sm text-rs-muted">
                    Payment details are entered securely on Stripe Checkout. We never collect or store card data on this page.
                  </p>
                </template>
                <template v-else>
                  <div class="text-body-sm font-semibold text-neutral-300">
                    Sign in required
                  </div>
                  <div class="text-white font-semibold">
                    Use your Remit-Scout account to continue checkout.
                  </div>
                  <p class="mt-2 text-body-sm text-rs-muted">
                    Plus subscriptions are tied to your account so alerts, watchlists, exports, and billing stay attached to the right user.
                  </p>
                  <p class="mt-2 text-body-sm text-rs-muted">
                    New here?
                    <NuxtLink
                      :to="{ path: '/sign-up', query: { redirect: '/plus/checkout' } }"
                      class="text-primary-400 hover:text-primary-300"
                    >
                      Create a free account first.
                    </NuxtLink>
                  </p>
                </template>
              </div>

              <!-- Submit Button -->
              <NuxtLink
                v-if="!isAuthenticated"
                data-testid="plus-checkout-submit"
                :to="signInRedirectTarget"
                class="w-full h-14 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-body-lg font-semibold shadow-xl hover:shadow-2xl transition-all disabled:bg-neutral-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Sign in to continue</span>
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </NuxtLink>
              <button
                v-else
                data-testid="plus-checkout-submit"
                type="button"
                :disabled="processing || !interactionReady"
                class="w-full h-14 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-body-lg font-semibold shadow-xl hover:shadow-2xl transition-all disabled:bg-neutral-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                @click="handleCheckout"
              >
                <span v-if="!processing">Continue to Stripe Checkout</span>
                <span v-else>Processing...</span>
                <svg
                  v-if="!processing"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </button>

              <p class="text-body-sm text-rs-muted text-center">
                By subscribing, you agree to our <NuxtLink
                  to="/terms"
                  class="text-primary-400 hover:text-primary-300"
                >Terms of Service</NuxtLink> and <NuxtLink
                  to="/privacy"
                  class="text-primary-400 hover:text-primary-300"
                >Privacy Policy</NuxtLink>
              </p>
            </form>
          </div>

          <!-- Security Notice -->
          <div class="mt-6 bg-neutral-800 border border-neutral-700 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <svg
                class="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <p class="text-body-sm font-semibold text-white">
                  Secure Payment
                </p>
                <p class="text-body-sm text-neutral-400 mt-1">
                  Your payment information is encrypted and processed securely by Stripe. We never store your card details.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-1">
          <div class="bg-neutral-800 rounded-2xl border border-neutral-700 p-6 sticky top-6">
            <h3 class="text-h4 font-bold text-white mb-6">
              Order Summary
            </h3>

            <div class="space-y-4 mb-6">
              <div class="flex items-center justify-between">
                <span class="text-neutral-300">Remit-Scout Plus</span>
                <span class="text-white font-semibold">{{ priceDisplay }}</span>
              </div>
              <div class="flex items-center justify-between text-body-sm">
                <span class="text-neutral-400">Billing cycle</span>
                <span class="text-neutral-300">{{ billingIntervalLabel }}</span>
              </div>
              <div
                v-if="billedAnnuallyMonthlyDisplay"
                class="text-body-sm text-rs-muted text-right -mt-2"
              >
                {{ billedAnnuallyMonthlyDisplay }}
              </div>
              <div class="border-t border-neutral-700 pt-4">
                <div class="flex items-center justify-between">
                  <span class="text-white font-semibold">Total due today</span>
                  <span class="text-h3 font-bold text-white">{{ totalDueToday }}</span>
                </div>
                <p class="text-body-sm text-rs-muted mt-2">
                  Cancel anytime
                </p>
              </div>
            </div>

            <div class="border-t border-neutral-700 pt-6 space-y-3">
              <div class="flex items-start gap-2">
                <svg
                  class="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-body-sm text-neutral-300">16 smart alerts + 16 watchlist corridors</span>
              </div>
              <div
v-if="pulseEnabled"
class="flex items-start gap-2"
>
                <svg
                  class="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-body-sm text-neutral-300">Pulse access (send timing + provider quotes)</span>
              </div>
              <div class="flex items-start gap-2">
                <svg
                  class="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-body-sm text-neutral-300">90-day rate history</span>
              </div>
              <div class="flex items-start gap-2">
                <svg
                  class="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-body-sm text-neutral-300">Export data (CSV/PDF)</span>
              </div>
              <div class="flex items-start gap-2">
                <svg
                  class="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-body-sm text-neutral-300">Ad-free experience</span>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t border-neutral-700">
              <p class="text-body-sm text-rs-muted text-center">
                Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </CenteredPage>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CenteredPage } from '~/ui'
import { useMarketingAnalytics } from '~/composables/useMarketingAnalytics'
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import { formatMoney as formatMoneyValue } from '~/shared/lib/format'

const { pulseEnabled } = useFeatureFlags()

const processing = ref(false)
const interactionReady = ref(false)
const { isAuthenticated, user } = useAuth()
const billingActions = useBilling()
const userEmail = computed(() => user.value?.email || '')
const { trackCheckoutStart } = useMarketingAnalytics()
const currentRoute = useRoute()
const signInRedirectTarget = { path: '/sign-in', query: { redirect: '/plus/checkout' } }

const billingInterval = useState<'month' | 'year'>('billingInterval', () => 'month')

type BillingPricingResponse = {
  success: true
  configured: boolean
  plus: {
    month: { amount: number | null, currency: string | null, priceId: string | null }
    year: { amount: number | null, currency: string | null, priceId: string | null }
  }
}

const { request } = useApi()
const { data: pricing, pending: pricingLoading } = await useAsyncData(
  'billing:pricing',
  () => request<BillingPricingResponse>('/billing/pricing', { retries: 0 }),
  { server: true },
)

const selectedPrice = computed(() => (
  billingInterval.value === 'year' ? pricing.value?.plus.year : pricing.value?.plus.month
))

function formatMoney(amount: number | null | undefined, currency: string | null | undefined): string | null {
  if (amount === null || amount === undefined || !currency) return null
  return formatMoneyValue(amount, { currency })
}

const plusPriceValue = computed(() => selectedPrice.value?.amount ?? null)
const plusPriceCurrency = computed(() => selectedPrice.value?.currency ?? null)
const priceDisplay = computed(() => (
  pricingLoading.value ? '—' : (formatMoney(plusPriceValue.value, plusPriceCurrency.value) || 'Pricing at checkout')
))
const billedAnnuallyMonthlyDisplay = computed(() => {
  if (billingInterval.value !== 'year') return null
  const annualAmount = pricing.value?.plus.year.amount
  const currency = pricing.value?.plus.year.currency
  if (typeof annualAmount !== 'number' || !Number.isFinite(annualAmount) || annualAmount <= 0) return null
  if (!currency) return null
  const monthly = annualAmount / 12
  const formatted = formatMoney(monthly, currency)
  if (!formatted) return null
  return `${formatted} / month billed annually`
})
const billingIntervalLabel = computed(() => (billingInterval.value === 'year' ? 'Annual' : 'Monthly'))
const totalDueToday = computed(() => priceDisplay.value)

onMounted(() => {
  interactionReady.value = true
})

async function handleCheckout() {
  if (!isAuthenticated.value) {
    await navigateTo(signInRedirectTarget)
    return
  }

  processing.value = true

  try {
    void trackCheckoutStart({
      value: plusPriceValue.value ?? 0,
      currency: plusPriceCurrency.value ?? 'USD',
      plan: 'plus',
      pagePath: currentRoute.fullPath,
    })
    const result = await billingActions.createCheckoutSession('plus', billingInterval.value)
    if (result.ok) {
      if (result.url) {
        window.location.href = result.url
        return
      }
    }

    throw new Error(result.error || 'No checkout URL returned')
  }
  catch (error: any) {
    if (error?.statusCode === 404 || error?.message?.includes('fetch')) {
      alert('Stripe integration pending. Please contact support to upgrade to Plus.')
      navigateTo('/contact')
    }
    else {
      navigateTo('/plus/failed')
    }
  }
  finally {
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
