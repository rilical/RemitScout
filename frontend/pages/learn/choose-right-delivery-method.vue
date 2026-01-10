<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <span>📦</span>
            Money Transfer Basics
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            Choose the Right Delivery Method: Bank Deposit vs Cash Pickup vs Mobile Money
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            The payout method can change the price, speed, and success rate. Here's how to pick the best option for your recipient—and avoid common "failed payout" mistakes.
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            When people say a provider is "fast" or "cheap," they're often describing a <em>specific payout method</em>. In international transfers, the delivery method isn't a detail—it's the product. Picking the wrong delivery method is one of the fastest ways to get delays, failures, or unnecessary costs.
          </p>
          <div class="flex items-center gap-4 text-sm text-neutral-600">
            <span>5 min read</span>
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
                <span>Delivery method changes speed, cost, and success rates more than most people expect.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Bank deposit favors convenience, cash pickup favors access, mobile money favors instant delivery.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Accuracy of recipient details is critical for every method.</span>
              </li>
            </ul>
          </div>
          <!-- Three Common Methods -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              The three common delivery methods
            </h2>
            <ol class="space-y-2 text-base text-neutral-700 mb-6">
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                <span><strong class="font-semibold text-neutral-900">Bank deposit</strong> (to a bank account)</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                <span><strong class="font-semibold text-neutral-900">Cash pickup</strong> (recipient collects at a location)</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                <span><strong class="font-semibold text-neutral-900">Mobile money</strong> (to a mobile wallet)</span>
              </li>
            </ol>
            <p class="text-base text-neutral-700 leading-relaxed">
              Each has a different tradeoff profile.
            </p>
          </div>

          <!-- Bank Deposit -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Bank deposit: best for convenience (when details are correct)
            </h2>
            <div class="grid gap-6 md:grid-cols-2 mb-6">
              <div class="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Pros</h3>
                <ul class="space-y-2 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>Convenient for recipients with stable bank access</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>Often good value (can be competitive on fees and FX)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>Lower in-person friction (no travel to pickup point)</span>
                  </li>
                </ul>
              </div>
              <div class="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Cons</h3>
                <ul class="space-y-2 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 font-bold">✗</span>
                    <span>Can be bank-timed (hours to days)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 font-bold">✗</span>
                    <span>Sensitive to account detail accuracy</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 font-bold">✗</span>
                    <span>Some receiving banks may deduct fees (varies)</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
              <p class="text-base text-neutral-700 leading-relaxed mb-3">
                <strong class="font-semibold text-neutral-900">Best when:</strong> recipient has a reliable bank account and you don't need instant cash.
              </p>
              <p class="text-base text-neutral-700 leading-relaxed">
                <strong class="font-semibold text-neutral-900">Avoid mistakes:</strong> double-check account number/IBAN, bank name, routing codes, and recipient name exactly.
              </p>
            </div>
          </div>

          <!-- Cash Pickup -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Cash pickup: best for speed + accessibility (but detail-sensitive)
            </h2>
            <div class="grid gap-6 md:grid-cols-2 mb-6">
              <div class="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Pros</h3>
                <ul class="space-y-2 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>Great for unbanked recipients</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>Often fast once the transfer is available</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>Recipients can choose a nearby location</span>
                  </li>
                </ul>
              </div>
              <div class="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Cons</h3>
                <ul class="space-y-2 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 font-bold">✗</span>
                    <span>Requires correct legal name + ID</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 font-bold">✗</span>
                    <span>Pickup hours and agent availability matter</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 font-bold">✗</span>
                    <span>Higher fraud risk if sent to the wrong person</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 font-bold">✗</span>
                    <span>Can be pricier than bank deposit in some corridors</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
              <p class="text-base text-neutral-700 leading-relaxed mb-3">
                <strong class="font-semibold text-neutral-900">Best when:</strong> recipient needs cash, quickly, and has valid ID.
              </p>
              <p class="text-base text-neutral-700 leading-relaxed">
                <strong class="font-semibold text-neutral-900">Avoid mistakes:</strong> ensure name matches ID, confirm pickup location requirements, and share the reference number securely.
              </p>
            </div>
          </div>

          <!-- Mobile Money -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Mobile money: best for instant delivery in supported corridors
            </h2>
            <div class="grid gap-6 md:grid-cols-2 mb-6">
              <div class="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Pros</h3>
                <ul class="space-y-2 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>Often minutes-level speed</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>Great for recipients who rely on mobile wallets for daily spending</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>Can reduce physical pickup friction</span>
                  </li>
                </ul>
              </div>
              <div class="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Cons</h3>
                <ul class="space-y-2 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 font-bold">✗</span>
                    <span>Requires the correct wallet number and sometimes the right network</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 font-bold">✗</span>
                    <span>Recipient may face cash-out fees (wallet provider dependent)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 font-bold">✗</span>
                    <span>Limits and KYC rules can block large transfers</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
              <p class="text-base text-neutral-700 leading-relaxed mb-3">
                <strong class="font-semibold text-neutral-900">Best when:</strong> recipient actively uses mobile money and your corridor supports it reliably.
              </p>
              <p class="text-base text-neutral-700 leading-relaxed">
                <strong class="font-semibold text-neutral-900">Avoid mistakes:</strong> verify wallet provider/network, the phone number format, and whether the wallet is active/verified.
              </p>
            </div>
          </div>

          <!-- How Delivery Method Changes Price -->
          <div class="mb-12 rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-4">How delivery method changes price (what to watch)</h3>
            <p class="text-base text-neutral-700 leading-relaxed">
              Even with the same provider:
            </p>
            <ul class="space-y-2 text-base text-neutral-700 mt-3">
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span>bank deposit might have a better FX rate than cash pickup,</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span>cash pickup might have higher fees,</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span>mobile money might be cheapest for small amounts but limited for large ones.</span>
              </li>
            </ul>
            <p class="text-base font-semibold text-neutral-900 mt-4">
              That's why the safest comparison method is: <strong class="text-brand-600">compare on recipient gets using the same payout method</strong>.
            </p>
          </div>

          <!-- Decision Framework -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              A decision framework (simple and reliable)
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Ask three questions:
            </p>
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">1. What does the recipient actually want?</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  Some recipients prefer cash. Others prefer bank. Don't assume.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">2. How urgent is it?</h3>
                <ul class="space-y-2 text-base text-neutral-700">
                  <li class="flex items-start gap-3">
                    <span class="text-emerald-600 font-bold">•</span>
                    <span><strong class="font-semibold text-neutral-900">minutes:</strong> mobile money or cash pickup</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-blue-600 font-bold">•</span>
                    <span><strong class="font-semibold text-neutral-900">same day/next day:</strong> depends on corridor and funding method</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-purple-600 font-bold">•</span>
                    <span><strong class="font-semibold text-neutral-900">flexible:</strong> bank deposit can be best value</span>
                  </li>
                </ul>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">3. How confident are you in the details?</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  If you're not 100% sure about bank details, cash pickup may reduce "wrong account" risk—assuming the recipient name/ID matches.
                </p>
              </div>
            </div>
          </div>

          <!-- Failed Payout Mistakes -->
          <div class="mb-12 rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-4">Common "failed payout" mistakes (and how to prevent them)</h3>
            <ul class="space-y-2 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-amber-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">Name mismatch (cash pickup):</strong> Use the recipient's legal name exactly.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">Wrong wallet network (mobile money):</strong> Some countries have multiple wallet systems. Confirm which one the number belongs to.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">Wrong bank code/account format (bank deposit):</strong> Use the exact format required for that country.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">Recipient can't receive that currency:</strong> Some accounts only accept local currency.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">Recipient isn't registered/verified:</strong> Mobile wallets may require KYC before receiving larger amounts.</span>
              </li>
            </ul>
          </div>

          <!-- Quick Checklist -->
          <div class="mb-12 rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-blue-600 p-8 lg:p-12 text-white">
            <h2 class="text-2xl font-bold mb-4">
              Quick checklist: choose the best delivery method
            </h2>
            <ul class="space-y-3 text-base text-white/90">
              <li class="flex items-start gap-3">
                <span class="text-white font-bold">✅</span>
                <span>Confirm recipient preference (cash vs bank vs wallet)</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-white font-bold">✅</span>
                <span>Confirm recipient details (name, ID, account/wallet number)</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-white font-bold">✅</span>
                <span>Compare "recipient gets" across providers using the same method</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-white font-bold">✅</span>
                <span>Check the ETA and pickup hours if using cash pickup</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-white font-bold">✅</span>
                <span>For mobile money, confirm wallet provider and any limits</span>
              </li>
            </ul>
          </div>

          <!-- Bottom Line -->
          <div class="mb-12 rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-3">Bottom line</h3>
            <p class="text-base text-neutral-700 leading-relaxed">
              Delivery method isn't just "how they receive it"—it changes <strong class="font-semibold text-neutral-900">cost, speed, and success rate</strong>. If you match the delivery method to the recipient's real-world needs and compare on "recipient gets," you'll avoid the most common transfer failures and unnecessary costs.
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
            to="/learn/bank-transfer-vs-card-funding"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Bank Transfer vs Card Funding
            </h3>
            <p class="text-sm text-neutral-600">
              Learn how funding method affects cost and speed.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/how-to-read-remittance-quote"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              How to Read a Quote
            </h3>
            <p class="text-sm text-neutral-600">
              Understand "recipient gets" and compare quotes correctly.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/why-compare-before-every-transfer"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Why Compare Before Every Transfer
            </h3>
            <p class="text-sm text-neutral-600">
              Learn why payout method changes affect pricing.
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
  { name: 'Choose Right Delivery Method', path: '/learn/choose-right-delivery-method' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://remit-scout.com'

setSeo({
  title: 'Choose the Right Delivery Method: Bank Deposit vs Cash Pickup vs Mobile Money | Remit-Scout',
  description: 'The payout method can change the price, speed, and success rate. Here\'s how to pick the best option for your recipient—and avoid common "failed payout" mistakes.',
  canonical: `${siteUrl}/learn/choose-right-delivery-method`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Choose Right Delivery Method', url: `${siteUrl}/learn/choose-right-delivery-method` },
])
</script>
