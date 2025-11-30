<template>
  <div class="min-h-screen bg-gradient-to-b from-white via-blue-50/20 to-white">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <Breadcrumbs :items="breadcrumbItems" />

      <!-- Hero Section -->
      <section class="mb-12 text-center">
        <div class="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm mb-4">
          <span>📚</span>
          Complete Library
        </div>
        <h1 class="text-4xl font-bold text-neutral-900 sm:text-5xl mb-4">
          All Guides
        </h1>
        <p class="mx-auto max-w-2xl text-lg text-neutral-600 mb-8">
          Browse our complete collection of 12 expert guides covering money transfers, banking abroad, staying connected, and health insurance.
        </p>
      </section>

      <!-- All Guides Grid -->
      <section class="mb-16">
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in guides"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="space-y-4 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                  {{ getCategoryLabel(guide.categoryKey) }}
                </span>
                <span class="text-xs text-neutral-500">
                  {{ guide.readTime }}
                </span>
                <span class="text-xs text-neutral-500">
                  {{ guide.level }}
                </span>
              </div>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="block text-xl font-bold text-neutral-900 hover:text-brand-600 transition-colors"
              >
                {{ guide.title }}
              </NuxtLink>
              <p class="text-sm text-neutral-600 leading-relaxed">
                {{ guide.excerpt }}
              </p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in guide.tags"
                  :key="tag"
                  class="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
            <div class="mt-6 flex items-center justify-between pt-4 border-t border-neutral-100">
              <span class="text-xs text-neutral-500">
                Updated {{ guide.updated }}
              </span>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
              >
                Read
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </NuxtLink>
            </div>
          </article>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="rounded-3xl bg-gradient-to-r from-brand-600 to-blue-600 p-8 shadow-xl sm:p-12 text-center text-white">
        <h3 class="text-3xl font-bold mb-4">
          Ready to Compare Providers?
        </h3>
        <p class="mx-auto max-w-2xl text-lg text-white/90 mb-8">
          Use what you've learned to find the best rates and save on your next transfer.
        </p>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-brand-600 shadow-lg hover:bg-neutral-50 transition-all hover:scale-105"
        >
          Compare Rates Now
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'All Guides', path: '/learn/all' },
]

const categories = {
  basics: 'Money transfer basics',
  'banking-abroad': 'Banking abroad',
  'staying-connected': 'Staying connected',
  'health-insurance': 'Health & insurance',
}

const getCategoryLabel = (key: string) => categories[key as keyof typeof categories] || 'Guide'

const guides = [
  {
    slug: 'how-exchange-rates-work',
    title: 'How exchange rates work',
    excerpt: 'Mid-market, FX spread, and how providers price your transfer.',
    categoryKey: 'basics',
    readTime: '5 min read',
    level: 'Beginner',
    tags: ['FX 101', 'Spread'],
    updated: '2024-12-01',
  },
  {
    slug: 'hidden-fees-money-transfers',
    title: 'Hidden fees to avoid when sending money',
    excerpt: 'Transfer fees, correspondent fees, and what "free" really means.',
    categoryKey: 'basics',
    readTime: '6 min read',
    level: 'Beginner',
    tags: ['Fees', 'Transparency'],
    updated: '2024-11-20',
  },
  {
    slug: 'best-time-to-send-money',
    title: 'When is the best time to send money?',
    excerpt: 'Timing around FX moves, cut-off times, and weekends.',
    categoryKey: 'basics',
    readTime: '4 min read',
    level: 'Intermediate',
    tags: ['Timing', 'FX'],
    updated: '2024-11-10',
  },
  {
    slug: 'avoid-hidden-fees',
    title: 'Avoid hidden fees in international transfers',
    excerpt: 'Spot exchange mark-ups and keep more in every transfer.',
    categoryKey: 'basics',
    readTime: '5 min read',
    level: 'Beginner',
    tags: ['Fees', 'Strategy'],
    updated: '2024-11-15',
  },
  {
    slug: 'cash-pickup-vs-bank-deposit',
    title: 'Cash pickup vs bank deposit: what\'s faster?',
    excerpt: 'When cash pickup beats bank, plus safety checks for your recipient.',
    categoryKey: 'banking-abroad',
    readTime: '4 min read',
    level: 'Beginner',
    tags: ['Payout', 'Speed'],
    updated: '2024-10-28',
  },
  {
    slug: 'send-money-us-to-india-guide',
    title: 'How to choose the best payout method for your transfer',
    excerpt: 'Bank deposits vs mobile wallets vs cash pickup—compare fees, speed, and safety.',
    categoryKey: 'banking-abroad',
    readTime: '6 min read',
    level: 'Intermediate',
    tags: ['Payout methods', 'Fees'],
    updated: '2024-11-05',
  },
  {
    slug: 'best-ways-send-money-philippines',
    title: 'How to compare payout methods: bank vs cash vs mobile wallet',
    excerpt: 'Fees, exchange margins and speed compared across different delivery options.',
    categoryKey: 'banking-abroad',
    readTime: '7 min read',
    level: 'Intermediate',
    tags: ['Payout methods', 'Comparison'],
    updated: '2024-11-15',
  },
  {
    slug: 'international-esim-checklist',
    title: 'International eSIM setup checklist',
    excerpt: 'Stay connected abroad without roaming; best-value providers to try.',
    categoryKey: 'staying-connected',
    readTime: '4 min read',
    level: 'Beginner',
    tags: ['eSIM', 'Travel'],
    updated: '2024-10-30',
  },
  {
    slug: 'travel-insurance',
    title: 'Travel insurance for frequent senders',
    excerpt: 'Cover trips while you visit family abroad—medical, baggage, and delay.',
    categoryKey: 'staying-connected',
    readTime: '5 min read',
    level: 'Beginner',
    tags: ['Insurance', 'Travel'],
    updated: '2024-11-02',
  },
  {
    slug: 'wise-vs-remitly-vs-worldremit',
    title: 'How to compare money transfer providers',
    excerpt: 'Learn what to compare: fees, exchange rates, delivery speed, and reliability.',
    categoryKey: 'banking-abroad',
    readTime: '6 min read',
    level: 'Beginner',
    tags: ['Comparison', 'Providers'],
    updated: '2024-11-18',
  },
  {
    slug: 'wise-remitly-western-union-review',
    title: 'How to evaluate money transfer providers',
    excerpt: 'Key factors to consider when comparing fees, rates, speed, and trust scores.',
    categoryKey: 'health-insurance',
    readTime: '8 min read',
    level: 'Intermediate',
    tags: ['Evaluation', 'Providers'],
    updated: '2024-12-02',
  },
  {
    slug: 'usd-php-exchange-rate-guide',
    title: 'How to track exchange rates and time your transfers',
    excerpt: 'Monitor live rates, identify hidden margins, and choose the best time to send.',
    categoryKey: 'health-insurance',
    readTime: '5 min read',
    level: 'Intermediate',
    tags: ['Rates', 'Timing'],
    updated: '2024-11-08',
  },
]

setSeo({
  title: 'All Guides | Money Transfer Learning Hub | Remit-Scout',
  description: 'Browse all 12 expert guides on international money transfers, banking abroad, staying connected, and travel insurance.',
})
</script>

