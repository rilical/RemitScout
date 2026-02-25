<template>
  <div class="min-h-screen bg-surface">

    <!-- Hero -->
    <section class="relative overflow-hidden bg-neutral-900 py-16 lg:py-24">
      <div class="mx-auto max-w-page px-page-x">
        <Breadcrumbs
          :items="breadcrumbItems"
          :dark="true"
        />

        <div class="mt-12 max-w-4xl">
          <h1 class="text-hero font-bold tracking-tight text-white mb-6 [text-wrap:balance]">
            Money Transfer <span class="text-brand-600">Guides</span>
          </h1>
          <p class="text-h4 text-neutral-300 font-medium leading-relaxed max-w-3xl [text-wrap:balance]">
            Everything you need to send money smarter, compare providers, and avoid hidden fees.
          </p>
        </div>
      </div>
    </section>

    <!-- Trust Strip -->
    <section class="py-6 bg-neutral-50 border-b border-neutral-200">
      <div class="mx-auto max-w-page px-page-x">
        <TrustBadgesRow
          :dark="false"
          :badges="reviewBadges"
          :cta="reviewCta"
        />
      </div>
    </section>

    <!-- Start Here -->
    <section
      v-reveal
      class="py-16 lg:py-20 bg-surface"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-10">
          <p class="text-body-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">
            New here?
          </p>
          <h2 class="text-h2 font-bold text-neutral-900 mb-4">
            Start here
          </h2>
          <p class="text-body-lg text-neutral-600 max-w-2xl [text-wrap:pretty]">
            First-time visitor? These four guides cover everything you need to compare transfers and avoid the most common mistakes.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <article
            v-for="guide in startHereGuides"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-brand-300"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-body-sm font-semibold text-brand-700">
                Beginner
              </span>
              <span class="text-body-sm text-neutral-500">
                {{ guide.readTime || '5 min read' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-body-lg font-bold text-neutral-900 hover:text-brand-600 motion-safe:transition-colors mb-3 flex-1"
            >
              <RichHtml tag="span" :content="guide.title" />
            </NuxtLink>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 motion-safe:transition-all mt-auto pt-4 border-t border-neutral-100"
            >
              Read guide
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <!-- Browse by Category -->
    <section
      v-reveal
      class="py-16 lg:py-20 bg-neutral-50"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="text-center mb-10">
          <h2 class="text-h2 font-bold text-neutral-900 mb-4">
            Browse by category
          </h2>
          <p class="text-body-lg text-neutral-600 max-w-2xl mx-auto [text-wrap:balance]">
            Guides organized by topic so you can find exactly what you need.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
          <button
            v-for="cat in displayCategories"
            :key="cat.key"
            type="button"
            class="group rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-brand-300 flex flex-col cursor-pointer text-left w-full"
            @click="scrollToSection(cat.key)"
          >
            <div class="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-brand-600" :fill="cat.iconFill || 'none'" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="cat.iconPath" />
              </svg>
            </div>
            <h3 class="text-body-lg font-bold text-neutral-900 mb-1">
              {{ cat.name }}
            </h3>
            <p class="text-body-sm text-neutral-500 mb-4 flex-1">
              {{ getCategoryArticleCount(cat.key) }} guides
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 group-hover:gap-2 motion-safe:transition-all">
              Browse
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- Category Sections (DRY v-for) -->
    <template v-for="(cat, idx) in displayCategories" :key="cat.key">
      <section
        :id="cat.key"
        v-reveal
        :class="['py-16 lg:py-20 scroll-mt-20', idx % 2 === 0 ? 'bg-surface' : 'bg-neutral-50']"
      >
        <div class="mx-auto max-w-page px-page-x">
          <!-- Section header -->
          <div class="mb-10">
            <div class="flex items-center gap-4 mb-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                <svg class="w-6 h-6 text-brand-600" :fill="cat.iconFill || 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="cat.iconPath" />
                </svg>
              </div>
              <div>
                <h2 class="text-h2 font-bold text-neutral-900">
                  {{ cat.name }}
                </h2>
                <p class="text-body text-neutral-600 mt-1 [text-wrap:pretty]">
                  {{ cat.description }}
                </p>
              </div>
            </div>
            <div class="h-px w-24 bg-brand-600 rounded-full" />
          </div>

          <!-- Provider Reviews: "View All" card -->
          <template v-if="cat.key === 'provider-reviews'">
            <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 mb-8">
              <p class="text-body-sm text-neutral-700">
                <strong class="font-semibold text-neutral-900">Note:</strong>
                Reviews are editorial; rankings come from live data. See our
                <NuxtLink to="/methodology" class="text-brand-600 hover:text-brand-700 underline">
                  review methodology
                </NuxtLink>
                for how we test and verify providers.
              </p>
            </div>

            <div class="mb-8">
              <NuxtLink
                to="/learn/providers"
                class="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 rounded-2xl bg-neutral-900 p-8 motion-safe:transition-all hover:bg-neutral-800"
              >
                <div>
                  <p class="text-body-sm font-semibold text-brand-400 uppercase tracking-wide mb-2">
                    Full directory
                  </p>
                  <h3 class="text-h3 font-bold text-white mb-2">
                    View all provider reviews
                  </h3>
                  <p class="text-body text-neutral-400 max-w-xl [text-wrap:pretty]">
                    {{ getCategoryArticleCount('provider-reviews') }}+ providers reviewed. Fees, exchange rates, transfer speeds, supported corridors, and in-depth editorial analysis.
                  </p>
                </div>
                <div class="flex-shrink-0 flex items-center gap-2 text-body-sm font-semibold text-brand-400 group-hover:gap-3 motion-safe:transition-all">
                  View all
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </NuxtLink>
            </div>
          </template>

          <!-- Article grid -->
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="guide in getArticlesByCategory(cat.key)"
              :key="guide.slug"
              class="group flex flex-col rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-brand-300"
            >
              <div class="flex items-center gap-2 mb-4">
                <span class="rounded-full bg-brand-50 px-3 py-1.5 text-body-sm font-semibold text-brand-700">
                  {{ cat.key === 'provider-reviews' ? 'Review' : (guide.level || cat.defaultLevel || 'Beginner') }}
                </span>
                <span class="text-body-sm text-neutral-500">
                  {{ guide.readTime || cat.defaultReadTime || '5 min' }}
                </span>
              </div>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="block text-body-lg font-bold text-neutral-900 hover:text-brand-600 motion-safe:transition-colors mb-3 flex-1"
              >
                <RichHtml tag="span" :content="guide.title" />
              </NuxtLink>
              <p class="text-body-sm text-neutral-600 leading-relaxed mb-4">
                {{ guide.excerpt }}
              </p>
              <div class="pt-4 border-t border-neutral-100">
                <NuxtLink
                  :to="`/learn/${guide.slug}`"
                  class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 motion-safe:transition-all"
                >
                  Read guide
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>
              </div>
            </article>
          </div>
        </div>
      </section>
    </template>

    <!-- Transparency & Research -->
    <section class="py-16 lg:py-20 bg-neutral-900">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-10">
          <p class="text-body-sm font-semibold text-brand-400 uppercase tracking-wide mb-3">
            How we work
          </p>
          <h2 class="text-h2 font-bold text-white mb-4 [text-wrap:balance]">
            Transparency & research
          </h2>
          <p class="text-body-lg text-neutral-400 max-w-3xl [text-wrap:pretty]">
            Open methodology, corrections policy, and data practices behind every comparison on Remit-Scout.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <NuxtLink
            to="/methodology"
            class="group rounded-2xl border border-neutral-700 bg-white/5 p-6 motion-safe:transition-all hover:border-brand-600/50 hover:bg-white/10 flex flex-col"
          >
            <div class="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-body-lg font-semibold text-white mb-2">
              Data methodology
            </h3>
            <p class="text-body-sm text-neutral-400 mb-4 flex-1 [text-wrap:pretty]">
              How we collect quotes, compute indices, verify provider coverage, and score providers against each other.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-400 group-hover:gap-2 motion-safe:transition-all">
              Read guide
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>

          <NuxtLink
            to="/indices-methodology"
            class="group rounded-2xl border border-neutral-700 bg-white/5 p-6 motion-safe:transition-all hover:border-brand-600/50 hover:bg-white/10 flex flex-col"
          >
            <div class="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="text-body-lg font-semibold text-white mb-2">
              Indices methodology
            </h3>
            <p class="text-body-sm text-neutral-400 mb-4 flex-1 [text-wrap:pretty]">
              How TEER, RCI, and RVI are calculated — the proprietary indices that power every ranking on Remit-Scout.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-400 group-hover:gap-2 motion-safe:transition-all">
              Read guide
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>

          <NuxtLink
            to="/corrections"
            class="group rounded-2xl border border-neutral-700 bg-white/5 p-6 motion-safe:transition-all hover:border-brand-600/50 hover:bg-white/10 flex flex-col"
          >
            <div class="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-body-lg font-semibold text-white mb-2">
              Corrections policy
            </h3>
            <p class="text-body-sm text-neutral-400 mb-4 flex-1 [text-wrap:pretty]">
              How we handle data errors, error reporting, and accuracy reviews. Every confirmed issue is resolved within 48 hours.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-400 group-hover:gap-2 motion-safe:transition-all">
              Read guide
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>
        </div>

        <div class="mt-8 pt-8 border-t border-neutral-700">
          <div class="flex flex-wrap items-center gap-6 text-body-sm text-neutral-500">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Verified quote data</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Timestamped & auditable</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>No pay-to-rank</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust Metrics -->
    <TrustMetricsStrip />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChartBarIcon, DocumentTextIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import { useArticles } from '~/composables/useArticles'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import TrustBadgesRow from '~/components/shared/TrustBadgesRow.vue'
import { PROVIDER_SCORES } from '~/lib/providerScores'
import { LEARN_STATIC_ARTICLES } from '~/lib/learnStaticArticles'

type GuideArticle = {
  slug: string
  title: string
  excerpt: string
  category?: string
  categoryKey?: string
  readTime?: string
  level?: string
  author?: string
  date?: string
  lastUpdated?: string
  helpfulCount?: number
  tags?: string[]
  relatedArticles?: Array<{ slug: string, title: string, excerpt?: string }>
  faq?: Array<{ q: string, a: string }>
  content?: string
}

const { data: articles } = await useArticles()

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Guides', path: '/learn' },
]

const reviewBadges = [
  { label: 'No pay-to-rank', icon: ShieldCheckIcon, strong: true },
  { label: 'Data-driven', icon: ChartBarIcon, strong: true },
  { label: 'Disclosures shown', icon: DocumentTextIcon, strong: true },
]

const reviewCta = {
  label: 'Review policy →',
  to: '/methodology',
}

const displayCategories = [
  {
    key: 'money-transfer-basics',
    name: 'Money transfer basics',
    description: 'Understand how international transfers work — payment methods, delivery options, and what affects cost and speed.',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    defaultLevel: 'Beginner',
    defaultReadTime: '5 min',
  },
  {
    key: 'fees-hidden-costs',
    name: 'Fees & hidden costs',
    description: 'How providers charge you beyond the headline fee — from FX markup to payment-method surcharges and promotional traps.',
    iconPath: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    defaultLevel: 'Intermediate',
    defaultReadTime: '5 min',
  },
  {
    key: 'provider-reviews',
    name: 'Provider reviews',
    description: 'In-depth editorial reviews of licensed providers: fees, FX rates, supported corridors, and who each service is best for.',
    iconPath: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    iconFill: 'currentColor',
    defaultLevel: 'Review',
    defaultReadTime: '10 min',
  },
  {
    key: 'exchange-rates-timing',
    name: 'Exchange rates & timing',
    description: 'How exchange rates work, how to spot FX markup, and when timing a transfer can make a meaningful difference.',
    iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    defaultLevel: 'Intermediate',
    defaultReadTime: '5 min',
  },
]

const articleMapping: Record<string, string[]> = {
  'money-transfer-basics': [
    'why-compare-before-every-transfer',
    'bank-transfer-vs-card-vs-cash-pickup',
    'how-to-read-remittance-quote',
    'bank-transfer-vs-card-funding',
    'choose-right-delivery-method',
    'how-fast-is-international-money-transfer',
  ],
  'fees-hidden-costs': [
    'hidden-exchange-rate-fees-explained',
    'promo-codes-intro-rates',
    'why-checkout-price-differs',
  ],
  'exchange-rates-timing': [
    'how-exchange-rates-work',
    'best-time-to-send-money',
  ],
}

const staticArticles: GuideArticle[] = LEARN_STATIC_ARTICLES

const allGuides = computed<GuideArticle[]>(() => {
  const markdownArticles = (articles.value || []) as GuideArticle[]
  const vueArticles: GuideArticle[] = staticArticles.map(article => ({
    ...article,
    category: getCategoryName(article.categoryKey || ''),
  }))
  return [...vueArticles, ...markdownArticles]
})

const getCategoryName = (key: string): string => {
  const cat = displayCategories.find(c => c.key === key)
  return cat?.name || 'Money transfer basics'
}

const startHereGuides = computed(() => {
  const slugs = [
    'why-compare-before-every-transfer',
    'hidden-exchange-rate-fees-explained',
    'how-to-read-remittance-quote',
    'why-checkout-price-differs',
  ]
  return allGuides.value
    .filter(g => slugs.includes(g.slug))
    .map(g => ({
      ...g,
      title: g.title || getTitleFromSlug(g.slug),
      excerpt: g.excerpt || getExcerptFromSlug(g.slug),
      readTime: g.readTime || '5 min read',
    }))
})

const getTitleFromSlug = (slug: string): string => {
  const titles: Record<string, string> = {
    'why-compare-before-every-transfer': 'Why You Must Compare Before Every Transfer',
    'hidden-exchange-rate-fees-explained': 'Hidden Fees Explained<br><span class="text-body font-normal">(FX Markup vs Fee)</span>',
    'how-to-read-remittance-quote': 'How to Read a Quote<br><span class="text-body font-normal">("Recipient Gets")</span>',
    'why-checkout-price-differs': 'Why Checkout Differs<br><span class="text-body font-normal">and What to Do</span>',
    'bank-transfer-vs-card-vs-cash-pickup': 'Bank Transfer vs Card vs Cash Pickup',
    'bank-transfer-vs-card-funding': 'Bank Transfer vs Card Funding: Which Is Cheaper?',
    'choose-right-delivery-method': 'Bank Deposit vs Cash Pickup vs Mobile Money',
    'how-fast-is-international-money-transfer': 'How Long Transfers Take (Speed Buckets)',
    'best-time-to-send-money': 'Best Time to Send Money',
    'promo-codes-intro-rates': 'Promo Rates and "$0 Fee" Traps',
  }
  return titles[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const getExcerptFromSlug = (slug: string): string => {
  const excerpts: Record<string, string> = {
    'why-compare-before-every-transfer': 'Even on the same corridor, the difference between providers can be hundreds of dollars. Here\'s why comparing before every transfer matters.',
    'hidden-exchange-rate-fees-explained': 'The difference between FX markup and transfer fees, and why "no fee" rarely means no cost.',
    'how-to-read-remittance-quote': 'What "recipient gets" actually means and how to compare quotes across providers accurately.',
    'why-checkout-price-differs': 'Why the final amount at checkout can differ from the quoted price — and what you can do about it.',
    'bank-transfer-vs-card-vs-cash-pickup': 'Compare funding and delivery methods: bank transfer, card payment, and cash pickup.',
    'bank-transfer-vs-card-funding': 'When bank transfer funding is cheaper than card funding, and when speed matters more than cost.',
    'choose-right-delivery-method': 'Which payout method works best: bank deposit, cash pickup, or mobile money.',
    'how-fast-is-international-money-transfer': 'Transfer speed buckets explained: instant, same-day, next-day, and multi-day.',
    'best-time-to-send-money': 'Practical guidance on timing transfers without over-optimizing for rate movements.',
    'promo-codes-intro-rates': 'Promotional rates, introductory offers, and "$0 fee" marketing traps explained.',
  }
  return excerpts[slug] || 'Learn more in this comprehensive guide.'
}

const getArticlesByCategory = (categoryKey: string) => {
  const slugs = articleMapping[categoryKey] || []
  return allGuides.value
    .filter(g => g.categoryKey === categoryKey || slugs.includes(g.slug))
    .map(g => ({
      ...g,
      title: g.title || getTitleFromSlug(g.slug),
      excerpt: g.excerpt || getExcerptFromSlug(g.slug),
      readTime: g.readTime || '5 min read',
      level: g.level || 'Beginner',
    }))
}

const getCategoryArticleCount = (categoryKey: string) => {
  if (categoryKey === 'provider-reviews') {
    return Object.keys(PROVIDER_SCORES).length
  }
  return getArticlesByCategory(categoryKey).length
}

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const { public: { siteUrl } } = useRuntimeConfig()

const seoTitle = 'Money Transfer Guides & Reviews | Remit-Scout'
const seoDescription = 'Comprehensive guides on money transfers, fees, hidden costs, provider reviews, and comparisons. Learn how to send money smarter and avoid costly mistakes.'

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Guides',
    description: seoDescription,
  },
})

useServerSeoMeta({
  title: seoTitle,
  description: seoDescription,
})

setSeo({
  title: seoTitle,
  description: seoDescription,
  canonical: `${siteUrl}/learn`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Guides', url: `${siteUrl}/learn` },
])
</script>
