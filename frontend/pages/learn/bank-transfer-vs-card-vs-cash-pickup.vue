<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <span>💳</span>
            Money Transfer Basics
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            Bank Transfer vs Card vs Cash Pickup vs Mobile Wallet
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            Which Is Cheapest and Safest?
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            Your choice of payment method and payout method dramatically affects cost, speed, and safety. Here's how to choose the right option for your needs.
          </p>
          <div class="flex items-center gap-4 text-sm text-neutral-600">
            <span>7 min read</span>
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
                <span>Funding method and payout method both shape total cost and delivery time.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Bank funding is cheapest, cards are fastest, wallets/cash maximize access.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Match the method to recipient access and urgency, not just headline fees.</span>
              </li>
            </ul>
          </div>
          <!-- Payment Methods Comparison -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Payment Methods (How You Fund the Transfer)
            </h2>
            <div class="space-y-6">
              <div class="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">🏦 Bank Transfer (ACH/Wire)</h3>
                <div class="grid gap-4 md:grid-cols-2 mb-4">
                  <div>
                    <p class="text-sm font-semibold text-neutral-600 mb-2">Pros:</p>
                    <ul class="space-y-1 text-sm text-neutral-700">
                      <li>✓ Lowest fees (often $0–$3)</li>
                      <li>✓ Best exchange rates</li>
                      <li>✓ Higher limits</li>
                    </ul>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-neutral-600 mb-2">Cons:</p>
                    <ul class="space-y-1 text-sm text-neutral-700">
                      <li>✗ Slower (1–2 days to clear)</li>
                      <li>✗ Requires bank account</li>
                    </ul>
                  </div>
                </div>
                <p class="text-sm text-neutral-600"><strong>Best for:</strong> Regular senders, large amounts, cost optimization</p>
              </div>
              <div class="rounded-2xl border-2 border-purple-200 bg-purple-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">💳 Debit/Credit Card</h3>
                <div class="grid gap-4 md:grid-cols-2 mb-4">
                  <div>
                    <p class="text-sm font-semibold text-neutral-600 mb-2">Pros:</p>
                    <ul class="space-y-1 text-sm text-neutral-700">
                      <li>✓ Instant processing</li>
                      <li>✓ Convenient</li>
                      <li>✓ No bank account needed</li>
                    </ul>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-neutral-600 mb-2">Cons:</p>
                    <ul class="space-y-1 text-sm text-neutral-700">
                      <li>✗ Higher fees (2–4%)</li>
                      <li>✗ Lower limits</li>
                      <li>✗ May have cash advance fees</li>
                    </ul>
                  </div>
                </div>
                <p class="text-sm text-neutral-600"><strong>Best for:</strong> Urgent transfers, small amounts, convenience</p>
              </div>
            </div>
          </div>

          <!-- Payout Methods Comparison -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Payout Methods (How Recipient Gets Money)
            </h2>
            <div class="space-y-6">
              <div class="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">📱 Mobile Wallet</h3>
                <div class="grid gap-4 md:grid-cols-2 mb-4">
                  <div>
                    <p class="text-sm font-semibold text-neutral-600 mb-2">Pros:</p>
                    <ul class="space-y-1 text-sm text-neutral-700">
                      <li>✓ Often instant</li>
                      <li>✓ No bank account needed</li>
                      <li>✓ Great for rural areas</li>
                    </ul>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-neutral-600 mb-2">Cons:</p>
                    <ul class="space-y-1 text-sm text-neutral-700">
                      <li>✗ May have withdrawal limits</li>
                      <li>✗ Not available everywhere</li>
                    </ul>
                  </div>
                </div>
                <p class="text-sm text-neutral-600"><strong>Best for:</strong> Africa, parts of Asia, instant delivery needs</p>
              </div>
              <div class="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">💵 Cash Pickup</h3>
                <div class="grid gap-4 md:grid-cols-2 mb-4">
                  <div>
                    <p class="text-sm font-semibold text-neutral-600 mb-2">Pros:</p>
                    <ul class="space-y-1 text-sm text-neutral-700">
                      <li>✓ Fast (15 min - 24h)</li>
                      <li>✓ No bank account needed</li>
                      <li>✓ Widely available</li>
                    </ul>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-neutral-600 mb-2">Cons:</p>
                    <ul class="space-y-1 text-sm text-neutral-700">
                      <li>✗ Name must match exactly</li>
                      <li>✗ Recipient must visit location</li>
                      <li>✗ Slightly higher fees</li>
                    </ul>
                  </div>
                </div>
                <p class="text-sm text-neutral-600"><strong>Best for:</strong> Urgent needs, recipients without bank accounts</p>
              </div>
              <div class="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">🏦 Bank Transfer</h3>
                <div class="grid gap-4 md:grid-cols-2 mb-4">
                  <div>
                    <p class="text-sm font-semibold text-neutral-600 mb-2">Pros:</p>
                    <ul class="space-y-1 text-sm text-neutral-700">
                      <li>✓ Lowest cost</li>
                      <li>✓ Secure</li>
                      <li>✓ No pickup needed</li>
                    </ul>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-neutral-600 mb-2">Cons:</p>
                    <ul class="space-y-1 text-sm text-neutral-700">
                      <li>✗ Slower (1-3 days)</li>
                      <li>✗ Requires bank account</li>
                    </ul>
                  </div>
                </div>
                <p class="text-sm text-neutral-600"><strong>Best for:</strong> Regular transfers, large amounts, cost savings</p>
              </div>
            </div>
          </div>

          <!-- Safety Tips -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-8 lg:p-12">
            <h2 class="text-2xl font-bold text-neutral-900 mb-4">
              Safety Tips by Method
            </h2>
            <div class="space-y-4">
              <div class="rounded-xl border border-brand-200 bg-white p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">Cash Pickup: Name Matching</h3>
                <p class="text-sm text-neutral-700">
                  The recipient's name must match their ID exactly. Middle names, accents, and spelling matter. Double-check before sending.
                </p>
              </div>
              <div class="rounded-xl border border-brand-200 bg-white p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">Mobile Wallet: Limits & Verification</h3>
                <p class="text-sm text-neutral-700">
                  Some wallets have daily withdrawal limits. Recipients may need to verify their account before receiving large amounts.
                </p>
              </div>
              <div class="rounded-xl border border-brand-200 bg-white p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">Bank Transfer: Account Details</h3>
                <p class="text-sm text-neutral-700">
                  Always verify account numbers and routing codes. One wrong digit can send money to the wrong account.
                </p>
              </div>
            </div>
          </div>

          <!-- Common Gotchas -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Common Gotchas to Avoid
            </h2>
            <div class="space-y-4">
              <div class="rounded-xl border border-red-200 bg-red-50 p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">❌ Choosing Card Payment for Large Amounts</h3>
                <p class="text-sm text-neutral-700">
                  Card fees are percentage-based. On a $2,000 transfer, a 3% card fee costs $60 vs. $3 for a bank transfer.
                </p>
              </div>
              <div class="rounded-xl border border-red-200 bg-red-50 p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">❌ Cash Pickup Name Mismatch</h3>
                <p class="text-sm text-neutral-700">
                  If the name doesn't match the ID exactly, the recipient can't pick up the money. You'll need to cancel and resend.
                </p>
              </div>
              <div class="rounded-xl border border-red-200 bg-red-50 p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">❌ Mobile Wallet Limits</h3>
                <p class="text-sm text-neutral-700">
                  Some wallets limit how much can be received per day. Check limits before sending large amounts.
                </p>
              </div>
            </div>
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
            to="/learn/how-fast-is-international-money-transfer"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Transfer Speed Explained
            </h3>
            <p class="text-sm text-neutral-600">
              Learn how payment and payout methods affect delivery time.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/why-compare-before-every-transfer"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Why Compare Providers
            </h3>
            <p class="text-sm text-neutral-600">
              Method availability and pricing vary by provider.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/faq"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              FAQ
            </h3>
            <p class="text-sm text-neutral-600">
              Common questions about payment and payout methods.
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
  { name: 'Payment Methods', path: '/learn/bank-transfer-vs-card-vs-cash-pickup' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'Bank Transfer vs Card vs Cash Pickup vs Mobile Wallet: Which Is Cheapest and Safest? | Remit-Scout',
  description: 'Compare payment and payout methods: bank transfer, card, cash pickup, and mobile wallet. Learn pros, cons, safety tips, and common gotchas.',
  canonical: `${siteUrl}/learn/bank-transfer-vs-card-vs-cash-pickup`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Payment Methods', url: `${siteUrl}/learn/bank-transfer-vs-card-vs-cash-pickup` },
])
</script>










