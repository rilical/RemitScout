<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <span>⚠️</span>
            Money Transfer Basics
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            Why Checkout Differs (and What to Do)
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            Why the final price at checkout might differ from the quote, what causes it (rate refresh, funding method, payout changes), and how to lock in the best outcome.
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            If you've ever checked a quote, felt good about it, and then saw a different price at checkout—you're not alone. This doesn't automatically mean you're being scammed. It usually means you're seeing how real-time pricing works in money transfers. The key is knowing <strong class="font-semibold text-neutral-900">why it happens</strong> and <strong class="font-semibold text-neutral-900">how to protect yourself</strong>.
          </p>
          <div class="flex items-center gap-4 text-sm text-neutral-600">
            <span>6 min read</span>
            <span>•</span>
            <span>Updated December 2024</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="prose prose-lg max-w-none">
          <div class="mb-12 rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
            <h2 class="text-xl font-bold text-neutral-900 mb-3">Quick takeaways</h2>
            <ul class="space-y-2 text-base text-neutral-700">
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Rate refreshes and method changes are the top reasons checkout shifts.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Lock the same amount, funding method, and payout method across quotes.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Compare at the final step and verify promos and verification status.</span>
              </li>
            </ul>
          </div>
          <!-- Why Price Changes -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Why the price changes between quote and checkout
            </h2>
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">1. Rate refresh (most common)</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Exchange rates move continuously. Many providers refresh rates every few seconds or minutes. If your quote isn't locked, the provider may update the rate at checkout.
                </p>
                <div class="bg-blue-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong>What to do:</strong> Compare providers at the <strong>final step</strong> before you pay. If the quote drifts, refresh both providers and compare again at the same time.
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">2. You changed the funding method without noticing</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  A provider might default to bank funding in the quote tool, but switch to card funding at checkout (or vice versa). Funding method can change: fees, FX rate, verification requirements.
                </p>
                <div class="bg-blue-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong>What to do:</strong> Choose your funding method early and keep it constant across all comparisons.
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">3. You changed the payout method (or it changed you)</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Selecting cash pickup vs bank deposit vs mobile money can change pricing and speed. Sometimes a payout method becomes temporarily unavailable and the app nudges you to another option.
                </p>
                <div class="bg-blue-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong>What to do:</strong> Before comparing, decide the payout method your recipient will actually use—and stick to it.
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">4. Promotions not applied (or expired)</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Some promos only apply after login, only for first transfers, or only for specific payment methods.
                </p>
                <div class="bg-blue-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong>What to do:</strong> Assume promos are unreliable until you see them applied on the final screen. Compare using the real checkout price.
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">5. Compliance / verification triggers</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Larger amounts, new recipients, new cards, or unusual patterns can trigger extra steps. This can delay the transfer or sometimes change what payment methods are allowed.
                </p>
                <div class="bg-blue-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong>What to do:</strong> Do your verification early (before an urgent transfer). If you're in a rush, avoid last-minute new payment methods.
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">6. Card network / bank authorization behavior</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Card authorizations can behave differently than expected, especially with currency conversion and temporary holds. The provider may show one total, but your bank may temporarily show another due to authorization mechanics.
                </p>
                <div class="bg-blue-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong>What to do:</strong> Use debit/bank transfer when you want fewer surprises. If you use a credit card, watch for issuer fees.
                </div>
              </div>
            </div>
          </div>

          <!-- Right Way to Compare -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              The right way to compare (so checkout doesn't surprise you)
            </h2>
            <div class="space-y-4">
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">Rule #1: Checkout is the only quote that matters.</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  Treat earlier screens as "estimates" unless clearly rate-locked.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">Rule #2: Compare two providers at the same moment.</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  Rates move. Comparing one now and one five minutes later can mislead you.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">Rule #3: Match the same inputs.</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Same:
                </p>
                <ul class="space-y-2 text-base text-neutral-700">
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>send amount (or receive amount),</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>funding method,</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>payout method,</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>recipient country and currency.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- What to Do When Checkout Differs -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What to do when checkout differs
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              If checkout is worse than you expected:
            </p>
            <ol class="space-y-3 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                <span><strong class="font-semibold text-neutral-900">Don't pay yet.</strong></span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                <span>Take a screenshot of the checkout screen (useful if you need support).</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                <span>Go back and confirm: funding method, payout method, fees, exchange rate</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">4</span>
                <span>Refresh the quote once.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">5</span>
                <span>Compare another provider's checkout price right now.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">6</span>
                <span>If the difference is meaningful, switch.</span>
              </li>
            </ol>
          </div>

          <!-- How to Lock In Best Outcome -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-8 lg:p-12">
            <h2 class="text-2xl font-bold text-neutral-900 mb-6">
              How to lock in the best outcome
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              You can't control FX markets, but you can control process:
            </p>
            <ul class="space-y-3 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Move quickly once you're ready</strong> (quotes can expire).</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Use the same device and logged-in state</strong> when comparing (some apps show different paths when logged out).</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Avoid last-minute changes</strong> to recipient details or payout method.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Prefer bank funding for cost-sensitive, non-urgent transfers</strong> (often more stable pricing than cards).</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">If you need speed, pay for speed intentionally</strong>—don't accidentally pick a faster, pricier method at checkout.</span>
              </li>
            </ul>
          </div>

          <!-- Simple Takeaway -->
          <div class="mb-12 rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-3">The simple takeaway</h3>
            <p class="text-base text-neutral-700 leading-relaxed">
              Checkout differs because <strong class="font-semibold text-neutral-900">real money rails are dynamic</strong>. The fix is not complicated: compare at checkout with identical inputs. If the final screen isn't good anymore, don't press pay—re-quote and compare again.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Guides -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-neutral-900 mb-8 text-center">
          Related Guides
        </h2>
        <div class="grid gap-6 md:grid-cols-3">
          <NuxtLink
            to="/learn/how-to-read-remittance-quote"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              How to Read a Remittance Quote
            </h3>
            <p class="text-sm text-neutral-600">
              Understand what matters in a quote and what to expect.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/promo-codes-intro-rates"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Promotions & Intro Rates
            </h3>
            <p class="text-sm text-neutral-600">
              Learn how promos affect pricing and when they're real.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/methodology"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Our Methodology
            </h3>
            <p class="text-sm text-neutral-600">
              See how we capture quotes and handle discrepancies.
            </p>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Checkout Differences', path: '/learn/why-checkout-price-differs' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'Why Checkout Differs (and What to Do) | Remit-Scout',
  description: 'Why the final price at checkout might differ from the quote, what causes it (rate refresh, funding method, payout changes), and how to lock in the best outcome.',
  canonical: `${siteUrl}/learn/why-checkout-price-differs`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Checkout Differences', url: `${siteUrl}/learn/why-checkout-price-differs` },
])
</script>










