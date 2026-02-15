<template>
  <section class="py-12 sm:py-16 bg-surface">
    <div class="container">
      <div class="text-center mb-12">
        <NuxtLink
          to="/learn"
          class="group"
        >
          <h2 class="text-h2 font-bold text-neutral-900 mb-3 group-hover:text-brand-600 transition-colors">
            Read Our Guides
          </h2>
        </NuxtLink>
        <p class="text-body-lg text-neutral-600">
          Everything you need to know about international money transfers
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="(guide, index) in guides"
          :key="index"
          :to="`/learn/${guide.slug}`"
          class="group bg-surface rounded-2xl border-2 border-neutral-200 overflow-hidden hover:border-brand-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
        >
          <div class="p-6 flex flex-col flex-1">
            <h3 class="text-body-lg font-bold text-neutral-900 mb-3 leading-snug break-words group-hover:text-brand-600 transition-colors">
              {{ guide.title }}
            </h3>

            <p class="text-body-sm text-neutral-600 mb-4 leading-relaxed line-clamp-3">
              {{ guide.blurb }}
            </p>

            <div class="flex items-center text-body-sm font-semibold text-brand-600 group-hover:gap-2 transition-all mt-auto">
              <span>Read guide</span>
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
            </div>
          </div>
        </NuxtLink>
      </div>

      <div class="text-center mt-12">
        <NuxtLink
          to="/learn"
          class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-lg hover:shadow-xl"
        >
          <span>View all guides</span>
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useArticles } from '~/composables/useArticles'

const { data: articles } = useArticles()

const staticArticles = [
  {
    slug: 'why-compare-before-every-transfer',
    title: 'Why You Must Compare Before Every Transfer',
    excerpt: 'Even on the same transfer, the difference between providers can be hundreds of dollars. Here\'s why you must compare before every transfer.',
    categoryKey: 'money-transfer-basics',
    readTime: '5 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'hidden-exchange-rate-fees-explained',
    title: 'Hidden Fees Explained (FX Markup vs Fee)',
    excerpt: 'Learn the difference between FX markup and transfer fees, and why "no fee" doesn\'t mean no cost.',
    categoryKey: 'fees-hidden-costs',
    readTime: '6 min read',
    level: 'Intermediate',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'how-to-read-remittance-quote',
    title: 'How to Read a Quote ("Recipient Gets")',
    excerpt: 'Understand what "Recipient Gets" really means and how to compare quotes effectively.',
    categoryKey: 'money-transfer-basics',
    readTime: '5 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'why-checkout-price-differs',
    title: 'Why Checkout Differs and What to Do',
    excerpt: 'Why the final price at checkout might differ from the quote, and what you can do about it.',
    categoryKey: 'fees-hidden-costs',
    readTime: '4 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'bank-transfer-vs-card-vs-cash-pickup',
    title: 'Bank Transfer vs Card vs Cash Pickup',
    excerpt: 'Compare different transfer methods: bank transfer, card payment, and cash pickup options.',
    categoryKey: 'money-transfer-basics',
    readTime: '7 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'how-fast-is-international-money-transfer',
    title: 'How Long Transfers Take (Speed Buckets)',
    excerpt: 'Understand transfer speed buckets: instant, same-day, next-day, and multi-day transfers.',
    categoryKey: 'speed-delivery',
    readTime: '5 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'best-time-to-send-money',
    title: 'Best Time to Send Money',
    excerpt: 'Practical guidance on when to send money, without over-optimizing for rate movements.',
    categoryKey: 'exchange-rates-timing',
    readTime: '6 min read',
    level: 'Intermediate',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'promo-codes-intro-rates',
    title: 'Promo Rates and "$0 Fee" Traps',
    excerpt: 'Understand promotional rates, introductory offers, and "$0 fee" marketing traps.',
    categoryKey: 'fees-hidden-costs',
    readTime: '5 min read',
    level: 'Intermediate',
    lastUpdated: 'December 2024',
  },
]

const allGuides = computed(() => {
  const markdownArticles = articles.value || []
  const vueArticles = staticArticles.map(article => ({
    ...article,
    category: getCategoryName(article.categoryKey),
  }))
  return [...vueArticles, ...markdownArticles]
})

const getCategoryName = (key: string): string => {
  const categoryMap: Record<string, string> = {
    'money-transfer-basics': 'Money Transfer Basics',
    'fees-hidden-costs': 'Fees & Hidden Costs',
    'speed-delivery': 'Speed & Delivery',
    'exchange-rates-timing': 'Exchange Rates & Timing',
    'safety-scams': 'Safety & Scams',
    'provider-reviews': 'Provider Reviews',
    'comparisons': 'Comparisons',
    'corridor-playbooks': 'Corridor Playbooks',
  }
  return categoryMap[key] || 'Guide'
}

const guides = computed(() => {
  return allGuides.value
    .slice(0, 6)
    .map(guide => ({
      title: guide.title || '',
      blurb: guide.excerpt || '',
      readTime: guide.readTime || '5 min read',
      updated: guide.lastUpdated || (('date' in guide && typeof guide.date === 'string') ? guide.date : undefined) || 'Recently',
      slug: guide.slug || '',
      category: guide.category || getCategoryName(guide.categoryKey || ''),
    }))
})
</script>
