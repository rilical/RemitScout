<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative bg-gray-900 py-12 lg:py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          :items="breadcrumbItems"
          dark
        />

        <div class="mx-auto max-w-4xl text-center mt-8">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-600 mb-4">
            Frequently Asked Questions
          </h1>
          <p class="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto mb-8">
            Answers about how Remit‑Scout works: how we collect quotes, how we rank providers, how to read results, and what you get with Remit‑Scout Plus.
          </p>

          <!-- Trust Note Banner -->
          <div class="mx-auto max-w-3xl mb-8 rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-4">
            <p class="text-sm text-neutral-300 leading-relaxed">
              <strong class="font-semibold text-white">Remit‑Scout is a comparison and research product.</strong> We don't hold, move, or transmit money. When you choose a provider, you complete your transfer directly on the provider's licensed website or app.
            </p>
          </div>

          <TrustBadgesRow
            class="mb-8"
            :badges="trustBadges"
            :cta="trustCta"
          />

          <!-- Search Bar -->
          <div class="mx-auto max-w-2xl mb-12">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search questions..."
                class="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-4 pl-12 text-white placeholder-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              >
              <svg
                class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
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
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 pt-12">
      <div class="lg:grid lg:grid-cols-12 lg:gap-12">
        <!-- Sticky Navigation (Desktop) -->
        <aside class="hidden lg:block lg:col-span-3">
          <div class="sticky top-24 space-y-2">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-4">
              Quick Navigation
            </h3>
            <nav class="space-y-1">
              <a
                v-for="category in categories"
                :key="category.id"
                :href="`#${category.id}`"
                :class="[
                  'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  activeCategory === category.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900',
                ]"
                @click="activeCategory = category.id"
              >
                {{ category.name }}
              </a>
            </nav>
          </div>
        </aside>

        <!-- FAQ Content -->
        <div class="lg:col-span-9">
          <!-- Getting Started -->
          <section
            id="getting-started"
            class="scroll-mt-24 mb-24"
          >
            <h2 class="text-3xl font-bold text-neutral-900 mb-8">
              Getting started
            </h2>
            <div class="space-y-4">
              <FaqAccordion :faqs="filteredFaqs(gettingStartedFaqs)" />
            </div>
          </section>

          <!-- Pricing, quotes, and accuracy -->
          <section
            id="pricing-quotes"
            class="scroll-mt-24 mb-24"
          >
            <h2 class="text-3xl font-bold text-neutral-900 mb-8">
              Pricing, quotes, and accuracy
            </h2>
            <div class="space-y-4">
              <FaqAccordion :faqs="filteredFaqs(pricingFaqs)" />
            </div>
          </section>

          <!-- Rankings and Remit‑Score -->
          <section
            id="rankings"
            class="scroll-mt-24 mb-24"
          >
            <h2 class="text-3xl font-bold text-neutral-900 mb-8">
              Rankings and Remit‑Score
            </h2>
            <div class="space-y-4">
              <FaqAccordion :faqs="filteredFaqs(rankingsFaqs)" />
            </div>
          </section>

          <!-- Providers, safety, and availability -->
          <section
            id="providers-safety"
            class="scroll-mt-24 mb-24"
          >
            <h2 class="text-3xl font-bold text-neutral-900 mb-8">
              Providers, safety, and availability
            </h2>
            <div class="space-y-4">
              <FaqAccordion :faqs="filteredFaqs(providersFaqs)" />
            </div>
          </section>

          <!-- Remit‑Scout Plus -->
          <section
            id="remit-scout-plus"
            class="scroll-mt-24 mb-24"
          >
            <h2 class="text-3xl font-bold text-neutral-900 mb-8">
              Remit‑Scout Plus
            </h2>
            <div class="space-y-4">
              <FaqAccordion :faqs="filteredFaqs(plusFaqs)" />
            </div>
          </section>

          <!-- Partnerships and how we make money -->
          <section
            id="partnerships"
            class="scroll-mt-24 mb-16"
          >
            <h2 class="text-3xl font-bold text-neutral-900 mb-8">
              Partnerships and how we make money
            </h2>
            <div class="space-y-4">
              <FaqAccordion :faqs="filteredFaqs(partnershipsFaqs)" />
            </div>
          </section>

          <!-- Privacy and data -->
          <section
            id="privacy"
            class="scroll-mt-24 mb-16"
          >
            <h2 class="text-3xl font-bold text-neutral-900 mb-8">
              Privacy and data
            </h2>
            <div class="space-y-4">
              <FaqAccordion :faqs="filteredFaqs(privacyFaqs)" />
            </div>
          </section>

          <!-- Reporting issues and support -->
          <section
            id="reporting"
            class="scroll-mt-24 mb-16"
          >
            <h2 class="text-3xl font-bold text-neutral-900 mb-8">
              Reporting issues and support
            </h2>
            <div class="space-y-4">
              <FaqAccordion :faqs="filteredFaqs(reportingFaqs)" />
            </div>
          </section>
        </div>
      </div>

      <!-- Trust & Independence Section -->
      <section class="py-12 sm:py-16 bg-brand-600 mt-20 mb-16 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
              Trust & independence
            </h2>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <div class="space-y-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <ShieldCheckIcon class="w-7 h-7 text-brand-600" />
                  </div>
                  <div class="pt-2">
                    <p class="font-semibold text-white mb-1">
                      Independent rankings
                    </p>
                    <p class="text-white/90 leading-relaxed">
                      Providers cannot buy placement. Rankings reflect delivered outcome, total cost, and other signals shown on the page.
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <ClockIcon class="w-7 h-7 text-brand-600" />
                  </div>
                  <div class="pt-2">
                    <p class="font-semibold text-white mb-1">
                      Timestamped quotes
                    </p>
                    <p class="text-white/90 leading-relaxed">
                      Quotes refresh regularly, with cadence that varies by corridor and data source. Every quote includes a timestamp so you can judge freshness.
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <LockClosedIcon class="w-7 h-7 text-brand-600" />
                  </div>
                  <div class="pt-2">
                    <p class="font-semibold text-white mb-1">
                      Privacy-minded by design
                    </p>
                    <p class="text-white/90 leading-relaxed">
                      You can compare without creating an account. Accounts are used for features like watchlists, alerts, newsletters, and Remit‑Scout Plus.
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <UserGroupIcon class="w-7 h-7 text-brand-600" />
                  </div>
                  <div class="pt-2">
                    <p class="font-semibold text-white mb-1">
                      Built for expats, by expats
                    </p>
                    <p class="text-white/90 leading-relaxed">
                      We’ve lived the “send money home” problem. The goal is simple: help more of your money reach the recipient, with fewer surprises at checkout.
                    </p>
                  </div>
                </div>
              </div>

              <div class="mt-8 pt-8 border-t border-white/20">
                <NuxtLink
                  to="/methodology"
                  class="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors group"
                >
                  <span class="text-sm font-semibold">Find out more about how we pick our providers</span>
                  <svg
                    class="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </NuxtLink>
              </div>
            </div>

            <div>
              <div class="bg-neutral-50 rounded-2xl border border-neutral-200 p-6 sm:p-8">
                <h3 class="text-xl font-bold text-neutral-900 mb-6">
                  Compliance & Security
                </h3>

                <div class="space-y-4">
                  <div class="flex items-center gap-3 p-4 bg-white rounded-xl">
                    <div class="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <svg
                        class="w-4 h-4 text-white"
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
                    </div>
                    <div class="flex-1">
                      <div class="font-semibold text-neutral-900">
                        Privacy requests supported
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 p-4 bg-white rounded-xl">
                    <div class="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <svg
                        class="w-4 h-4 text-white"
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
                    </div>
                    <div class="flex-1">
                      <div class="font-semibold text-neutral-900">
                        Security best practices
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 p-4 bg-white rounded-xl">
                    <div class="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <svg
                        class="w-4 h-4 text-white"
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
                    </div>
                    <div class="flex-1">
                      <div class="font-semibold text-neutral-900">
                        No card storage
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 p-4 bg-white rounded-xl">
                    <div class="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <svg
                        class="w-4 h-4 text-white"
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
                    </div>
                    <div class="flex-1">
                      <div class="font-semibold text-neutral-900">
                        Regulated providers (where applicable)
                      </div>
                    </div>
                  </div>
                </div>

                <p class="mt-6 text-xs text-neutral-500">
                  Regulation applies to providers. Remit‑Scout is a comparison and research product and does not handle funds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Final CTA Section -->
      <section class="mb-16">
        <div class="text-center">
          <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
            Still have questions?
          </h2>
          <p class="text-lg text-neutral-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            If you can't find what you need here, contact us or report an issue — we read every message and use them to improve accuracy and clarity.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-4">
            <NuxtLink
              to="/contact"
              class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Contact support
            </NuxtLink>
            <NuxtLink
              to="/contact"
              class="inline-flex items-center gap-2 rounded-xl border-2 border-neutral-700 bg-neutral-800 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              Report a rate issue
            </NuxtLink>
            <NuxtLink
              to="/methodology"
              class="inline-flex items-center gap-2 rounded-xl border-2 border-neutral-700 bg-neutral-800 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              Read Methodology
            </NuxtLink>
            <NuxtLink
              to="/partnerships"
              class="inline-flex items-center gap-2 rounded-xl border-2 border-neutral-700 bg-neutral-800 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              How we make money
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>

    <TrustMetricsStrip />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ClockIcon, LockClosedIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import TrustBadgesRow from '~/components/shared/TrustBadgesRow.vue'
import { useStructuredData } from '~/composables/useStructuredData'
import { setSeo } from '~/composables/useSeo'
import { TRUST_BADGES } from '~/lib/marketing/trust'

type Faq = {
  question: string
  answer: string
}

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Frequently Asked Questions', path: '/faq' },
]

const searchQuery = ref('')
const activeCategory = ref('getting-started')

const trustBadges = [
  { label: TRUST_BADGES.noPayToRank.label, icon: TRUST_BADGES.noPayToRank.icon },
  { label: TRUST_BADGES.quotesTimestamped.label, icon: TRUST_BADGES.quotesTimestamped.icon },
  { label: TRUST_BADGES.weDontMoveMoney.label, icon: TRUST_BADGES.weDontMoveMoney.icon },
]

const trustCta = {
  label: TRUST_BADGES.reportAProblem.label,
  to: '/contact',
  icon: TRUST_BADGES.reportAProblem.icon,
}

const categories = [
  { id: 'getting-started', name: 'Getting started' },
  { id: 'pricing-quotes', name: 'Pricing, quotes, and accuracy' },
  { id: 'rankings', name: 'Rankings and Remit‑Score' },
  { id: 'providers-safety', name: 'Providers, safety, and availability' },
  { id: 'remit-scout-plus', name: 'Remit‑Scout Plus' },
  { id: 'partnerships', name: 'Partnerships and how we make money' },
  { id: 'privacy', name: 'Privacy and data' },
  { id: 'reporting', name: 'Reporting issues and support' },
]

const filteredFaqs = (faqs: Faq[]) => {
  if (!searchQuery.value) return faqs
  const query = searchQuery.value.toLowerCase()
  return faqs.filter(faq =>
    faq.question.toLowerCase().includes(query)
    || faq.answer.toLowerCase().includes(query),
  )
}

// Getting Started FAQs
const gettingStartedFaqs = [
  {
    question: 'What is Remit‑Scout?',
    answer: '<p>Remit‑Scout is an independent comparison platform for international money transfers. We collect quotes, standardize fees and FX markup into comparable numbers, and highlight the metric most people care about: <strong>what the recipient should receive</strong> for the scenario you entered.</p><p class="mt-2">You can compare providers side by side, then click through to the provider you choose to complete the transfer.</p>',
  },
  {
    question: 'Do you send money for me?',
    answer: '<p>No. Remit‑Scout does not process transfers and never touches your funds. We show you comparison results and then link you to the provider you choose. Your transfer happens on that provider\'s platform, under their identity verification and compliance rules.</p>',
  },
  {
    question: 'How do I compare providers on Remit‑Scout?',
    answer: '<p>Enter your send country, receive country, currency, amount, and (where available) payout method. We fetch quotes from multiple providers and standardize the results into comparable numbers, especially <strong>Recipient gets</strong>.</p><p class="mt-2">When you choose a provider, you click through to complete the transfer on that provider’s checkout.</p>',
  },
  {
    question: 'Why do results change when I change the amount or payout method?',
    answer: '<p>Remittance pricing isn’t one flat price. A provider may be strong at $200 and less competitive at $2,000. Pricing can also change by payment method (bank vs card), payout method (bank deposit vs cash pickup), and speed options.</p><p class="mt-2">A comparison only makes sense when it matches your real scenario, so Remit‑Scout recalculates results based on your inputs.</p>',
  },
]

// Pricing, quotes, and accuracy FAQs
const pricingFaqs = [
  {
    question: 'What does "Recipient gets" mean?',
    answer: '<p><strong>"Recipient gets"</strong> is our best estimate of what the recipient should receive after fees and FX markup for the specific scenario you entered.</p><p class="mt-2">It’s practical because it answers the question most senders actually care about: <em>what should arrive?</em></p><p class="mt-3"><strong>Example:</strong></p><div class="bg-neutral-50 rounded-lg p-4 my-3 border border-neutral-200"><p class="text-sm"><strong>Send:</strong> $500 USD</p><p class="text-sm"><strong>Provider A:</strong> $5 fee, 18.00 rate → <strong>8,910 MXN</strong></p><p class="text-sm"><strong>Provider B:</strong> $1.99 fee, 18.45 rate → <strong>9,188 MXN</strong></p><p class="text-sm mt-2 text-emerald-700 font-semibold">That’s 278 MXN more delivered on the same transfer, even if both advertise “low fees”.</p></div><p class="mt-2">We calculate this as:</p><div class="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 overflow-x-auto"><span>\\[\\text{recipient gets} = (\\text{send amount} - \\text{fees}) \\times \\text{provider FX rate}\\]</span></div>',
  },
  {
    question: 'What does "Total cost" include?',
    answer: '<p><strong>Total cost</strong> includes everything that reduces what your recipient should receive:</p><ul class="list-disc pl-5 space-y-2 mt-3"><li><strong>Stated transfer fee:</strong> the upfront charge you see</li><li><strong>FX markup:</strong> the difference between a provider’s rate and a reference mid-market rate at the same time</li></ul><div class="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4"><p class="text-sm font-semibold text-amber-900 mb-2">⚠️ The hidden markup problem</p><p class="text-sm text-amber-800">Example: if the reference USD→MXN rate is 18.50 but a provider offers 18.00, that’s roughly a <strong>2.7% markup</strong>. On a $500 transfer, that’s meaningful — even before any stated fee.</p></div><p class="mt-2">Some providers advertise “$0 fees” but price through the exchange rate. Total cost helps you compare apples to apples.</p>',
  },
  {
    question: 'Why might the provider checkout show a different price than Remit‑Scout?',
    answer: '<p>Checkout can differ from a captured quote. Common reasons include:</p><ul class="list-disc pl-5 space-y-2 mt-3"><li><strong>Payment method:</strong> bank vs card pricing can differ</li><li><strong>Promotions:</strong> offers that depend on user status, codes, or targeted eligibility</li><li><strong>KYC:</strong> verification steps can change eligibility, speed, or fees</li><li><strong>Local rules:</strong> corridor-specific requirements or payout constraints</li><li><strong>FX movement:</strong> rates can move between the time a quote is captured and the time you checkout</li></ul><div class="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4"><p class="text-sm"><strong>💡 Quick checklist</strong></p><ul class="text-sm space-y-1 mt-2 list-disc pl-5"><li>Match payment method, payout method, and amount</li><li>Check for promotions or codes</li><li>Check the quote timestamp</li></ul></div><p class="mt-2"><strong>The provider checkout is always the final source of truth.</strong> If you see a mismatch that looks systematic, <a href="/contact" class="text-brand-600 hover:text-brand-700 underline font-semibold">report it</a> with corridor, amount, time, and a screenshot if possible.</p>',
  },
  {
    question: 'How often do you update rates?',
    answer: '<p>We refresh quotes regularly, especially on popular corridors. Update frequency varies by corridor, payment method, and data source. Every quote is timestamped so you can judge freshness.</p>',
  },
  {
    question: 'Where do you get your pricing data?',
    answer: '<p>We typically collect pricing via:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Direct provider data feeds (most consistent when available)</li><li>Partner data feeds (structured exports)</li><li>Public quote capture from provider quote flows (coverage varies)</li></ul><p class="mt-2">We normalize that data into a standardized comparison. <a href="/methodology" class="text-brand-600 hover:text-brand-700 underline font-semibold">Read our methodology</a> for details.</p>',
  },
  {
    question: 'Do you include promo codes and discounts?',
    answer: '<p>Sometimes. If a provider applies an automatic promotion in the quote flow we capture, you may see it reflected. Many promotions depend on account status, a code, or targeted eligibility, so they can’t always be captured universally.</p><p class="mt-2">That’s why we emphasize Recipient gets as a best estimate and recommend verifying the final checkout amount.</p>',
  },
]

// Rankings and Remit‑Score FAQs
const rankingsFaqs = [
  {
    question: 'How are providers ranked?',
    answer: '<p>We rank providers by delivered outcome and total cost for the scenario you entered, then surface additional signals like payout method availability, speed, and reliability where available.</p><p class="mt-2">The goal is simple: show the options that should deliver the best outcome, not the best marketing.</p>',
  },
  {
    question: 'What is Remit‑Score?',
    answer: '<p><strong>Remit‑Score</strong> is a 0–10 score designed to summarize overall value and usability in one number. It’s built from measurable signals, weighted by importance:</p><div class="bg-neutral-50 rounded-lg p-4 my-4 border border-neutral-200"><ul class="space-y-2 text-sm"><li><strong>Delivered Value (40%):</strong> fees + FX markup and delivered outcome for the scenario shown</li><li><strong>Reliability & Success (20%):</strong> quote success rate and data freshness signals</li><li><strong>Friction & Speed (15%):</strong> ETA and speed buckets where available</li><li><strong>Support & Refunds (15%):</strong> policy and support signals where available</li><li><strong>Trust & Safety (10%):</strong> licensing and safety signals where available</li></ul></div><p class="mt-2">Scores like <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-500 text-brand-600 font-bold text-sm mx-1">9.5</span>, <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-500 text-brand-600 font-bold text-sm mx-1">8.4</span>, or <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-500 text-brand-600 font-bold text-sm mx-1">7.2</span> are shorthand — not pay-to-play.</p><p class="mt-2"><a href="/methodology" class="text-brand-600 hover:text-brand-700 underline font-semibold">See our full methodology</a> for details.</p>',
  },
  {
    question: 'Can providers pay to rank higher?',
    answer: '<p>No. Providers cannot pay to appear higher, improve a Remit‑Score, or change how we sort results. If a provider offers better delivered value for your corridor and amount, they should rank better — whether or not we have a commercial relationship.</p>',
  },
  {
    question: 'Do affiliate relationships affect rankings or Remit‑Score?',
    answer: '<p>No. If we earn a commission for a referral, we disclose it clearly. But commissions do not change scoring, ranking, or sorting. The comparison is driven by data. <a href="/partnerships" class="text-brand-600 hover:text-brand-700 underline font-semibold">Learn more about partnerships</a>.</p>',
  },
  {
    question: 'Why would a provider with a higher fee still appear high?',
    answer: '<p>Sometimes a provider with a higher visible fee still delivers strong value due to a better exchange rate, faster delivery option, higher reliability, or better customer support outcomes. The "best" option depends on what you prioritize — cost, speed, payout method, or trust factors.</p>',
  },
]

// Providers, safety, and availability FAQs
const providersFaqs = [
  {
    question: 'Do you only list licensed or regulated providers?',
    answer: '<p>We aim to cover established providers and to label coverage and availability transparently. Regulation varies by country, corridor, and product type, so the “right” license can differ across markets.</p><p class="mt-2">Where public licensing information or registry entries are available, we use them as part of our trust and labeling approach.</p>',
  },
  {
    question: 'Why don\'t I see the same providers for every corridor?',
    answer: '<p>Not every provider supports every send/receive pair, payout method, or amount. Some providers may support bank deposit but not cash pickup in a specific country, or may not operate in a particular U.S. state or region.</p>',
  },
  {
    question: 'Is Remit‑Scout responsible if something goes wrong with my transfer?',
    answer: '<p>No — the provider you choose is responsible for processing your transfer and handling disputes. Remit‑Scout helps you compare options and links you to the provider, but we do not process payments or control provider outcomes.</p><p class="mt-2">That said, if you report an issue (like a pricing mismatch or misleading quote behavior), we take it seriously and investigate so our comparisons remain accurate and trustworthy.</p>',
  },
]

// Remit‑Scout Plus FAQs
const plusFaqs = [
  {
    question: 'What is Remit‑Scout Plus?',
    answer: '<p>Remit‑Scout Plus is an optional upgrade for people who send money regularly and want tools for tracking and timing. Plus adds alerts, watchlists, and deeper history so you can monitor corridors over time instead of re-checking manually.</p><p class="mt-2">Plus requires an account (email + password) so we can save your settings.</p>',
  },
  {
    question: 'What\'s included in Remit‑Scout Plus?',
    answer: '<p>Remit‑Scout Plus includes:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Rate alerts (get notified when a rate hits your target or moves meaningfully)</li><li>Exchange rate history (see trends over time, not just a single moment)</li><li>Watchlist (save corridors/currency pairs you care about)</li><li>No ads (a cleaner, distraction‑free experience)</li></ul><p class="mt-2">Plus is designed for repeat senders — people who care about timing and want visibility over weeks and months, not just one transfer today.</p>',
  },
  {
    question: 'How do rate alerts work?',
    answer: '<p>Rate alerts let you pick a corridor or currency pair and set a trigger. For example:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>"Alert me when USD→EUR hits 0.90"</li><li>"Alert me if the rate drops by more than 1% this week"</li><li>"Alert me when this corridor\'s best provider changes"</li></ul><p class="mt-2">When the condition is met, we notify you (typically by email). Alerts help you avoid checking rates obsessively and instead act when there\'s a meaningful opportunity.</p>',
  },
  {
    question: 'What is a watchlist?',
    answer: '<p>A watchlist is your personal dashboard of corridors you care about. If you send money to multiple countries (or you\'re supporting family in more than one place), a watchlist saves you time by letting you:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Jump straight into comparisons for saved corridors</li><li>Track rate history for the same set of currency pairs</li><li>Manage alerts without re-entering countries/amounts every time</li></ul>',
  },
  {
    question: 'Does Plus change rankings or give "better" results?',
    answer: '<p>No. Plus does not change rankings, Remit‑Score calculations, or which providers appear. Plus is a feature upgrade (alerts/history/watchlist/no ads), not a different comparison engine.</p>',
  },
  {
    question: 'If Plus is "no ads," will I still see disclosures?',
    answer: '<p>Yes. "No ads" means we remove advertising placements and keep the experience clean — but disclosures remain, because disclosure is part of trust. If a link may generate a commission, we will still label it clearly.</p>',
  },
  {
    question: 'Can I cancel Plus anytime?',
    answer: '<p>Yes. You can cancel anytime. If you cancel, your plan stays active until the end of your current billing period and you won’t be charged again.</p><p class="mt-2">Billing is handled by Stripe. Cancellation and renewal are managed in your account. We don’t currently offer free trials and we don’t offer refunds for partial periods.</p>',
  },
]

// Partnerships and how we make money FAQs
const partnershipsFaqs = [
  {
    question: 'How does Remit‑Scout make money?',
    answer: '<p>Remit‑Scout may earn revenue in a few ways, with clear separation from rankings:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Affiliate commissions when a user clicks a provider link and completes a transfer (where programs exist)</li><li>Remit‑Scout Plus subscriptions</li><li>Data licensing and widgets for publishers and platforms</li><li>Custom research and analysis for publishers or institutions</li></ul><p class="mt-2">Commercial relationships never override the ranking methodology. <a href="/partnerships" class="text-brand-600 hover:text-brand-700 underline font-semibold">Learn more about partnerships</a>.</p>',
  },
  {
    question: 'What does "We may earn a commission" mean?',
    answer: '<p>It means that if you click through to a provider and complete a qualifying action (like signing up or completing a transfer), the provider may pay us a referral commission. This does not change your cost with the provider, and it does not change how we rank providers.</p>',
  },
  {
    question: 'Do you sell rankings or "featured placements"?',
    answer: '<p>We do not sell ranking position. If we ever run sponsorships, they are labeled plainly as sponsorship and do not affect organic rankings, sorting, or Remit‑Score calculations.</p>',
  },
  {
    question: 'How do you label partnerships?',
    answer: '<p>We use consistent labels across the site so users always know what they\'re seeing:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>"We may earn a commission" near affiliate links</li><li>"Rankings are independent" on comparison surfaces</li><li>"Official Data Feed" when a provider supplies structured data directly</li><li>"Sponsored" only for clearly designated sponsorship placements (if offered)</li></ul>',
  },
]

// Privacy and data FAQs
const privacyFaqs = [
  {
    question: 'Do you share my personal information with providers?',
    answer: '<p>Remit‑Scout does not send providers your personal identity details just because you compare. Providers may receive information if you click through and create an account or complete a transfer on their platform (which is necessary for the provider to process the transfer).</p>',
  },
  {
    question: 'Do you sell my personal data?',
    answer: '<p>No. We use data to operate and improve the product, not to sell personal profiles. If we use cookies or other tracking, we disclose it and provide choices where required.</p><p class="mt-2"><a href="/legal/privacy" class="text-brand-600 hover:text-brand-700 underline font-semibold">Read our privacy policy</a> for details.</p>',
  },
  {
    question: 'Do you store bank details, ID documents, or transfer credentials?',
    answer: '<p>No. Remit‑Scout does not collect or store your bank login, transfer credentials, or identity documents for money transfers. Those are handled by the provider you choose, on their platform.</p>',
  },
]

// Reporting issues and support FAQs
const reportingFaqs = [
  {
    question: 'I saw a different amount at checkout. What should I do?',
    answer: '<p>First, confirm that your checkout settings match what you compared (payment method, payout method, amount, and promotions). If it still looks inconsistent, please report it using our <a href="/contact" class="text-brand-600 hover:text-brand-700 underline font-semibold">contact form</a> and include:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Corridor (from/to)</li><li>Amount</li><li>Payment method and payout method</li><li>Provider name</li><li>The time you compared</li><li>A screenshot of checkout if possible</li></ul><p class="mt-2">We use these reports to investigate and improve our data pipeline. When we confirm an issue, we correct the listing and refresh the data.</p>',
  },
  {
    question: 'How quickly do you fix errors?',
    answer: '<p>If we confirm an issue, we typically update within 48 hours. Some mismatches are normal checkout variables, but if we find a systematic capture error or stale quote behavior, we correct it and adjust our pipeline.</p><p class="mt-2">If an issue isn’t reported within 48 hours of the relevant quote timestamp, we may not update historical records.</p>',
  },
  {
    question: 'I still need help — how do I contact you?',
    answer: '<p>If your issue is about a transfer you already made, the provider\'s support team is the fastest path because they control the transaction. For Remit‑Scout product issues, reporting mismatches, or partnership inquiries, <a href="/contact" class="text-brand-600 hover:text-brand-700 underline font-semibold">contact us through the site contact form</a>.</p>',
  },
]

// Combine all FAQs for schema
const allFaqs = [
  ...gettingStartedFaqs,
  ...pricingFaqs,
  ...rankingsFaqs,
  ...providersFaqs,
  ...plusFaqs,
  ...partnershipsFaqs,
  ...privacyFaqs,
  ...reportingFaqs,
]

// SEO & Structured Data
const { addFAQSchema, addBreadcrumbSchema } = useStructuredData()
const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Frequently Asked Questions | Remit-Scout',
  description: 'Everything you need to know about comparing money transfer providers on Remit‑Scout — how we collect pricing, how we rank providers, and what you get with Remit‑Scout Plus.',
  canonical: `${siteUrl}/faq`,
})

addBreadcrumbSchema([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'FAQ', url: `${siteUrl}/faq` },
])

addFAQSchema(allFaqs.map(f => ({
  question: f.question,
  answer: f.answer.replace(/<[^>]*>/g, '').replace(/NuxtLink[^>]*>/g, '').replace(/to="[^"]*"/g, ''),
})))
</script>
