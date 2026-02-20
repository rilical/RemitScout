<template>
  <div class="min-h-screen bg-gradient-to-b from-white via-primary-50/20 to-white">
    <div class="container py-12 sm:py-16">
      <Breadcrumbs :items="breadcrumbItems" />

      <!-- Hero Section -->
      <section class="mb-12 text-center">
        <div class="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-body-sm font-semibold text-white shadow-sm mb-4">
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          Complete Library
        </div>
        <h1 class="text-h1 font-bold text-neutral-900 mb-4">
          All Guides
        </h1>
        <p class="mx-auto max-w-2xl text-body-lg text-neutral-600 mb-8">
          Browse our complete collection of {{ guideCount }} guides covering money transfers, fees, delivery speed, and exchange rates.
        </p>
      </section>

      <!-- All Guides Grid -->
      <section class="mb-16">
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in guides"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="space-y-4 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="rounded-full bg-brand-50 px-3 py-1.5 text-body-sm font-semibold text-brand-700">
                  {{ getCategoryLabel(guide.categoryKey) }}
                </span>
                <span class="text-body-sm text-neutral-500">
                  {{ guide.readTime }}
                </span>
                <span class="text-body-sm text-neutral-500">
                  {{ guide.level }}
                </span>
              </div>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="block text-h4 font-bold text-neutral-900 hover:text-brand-600 transition-colors"
              >
                <RichHtml
tag="span"
:content="guide.title"
/>
              </NuxtLink>
              <p class="text-body-sm text-neutral-600 leading-relaxed">
                {{ guide.excerpt }}
              </p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in guide.tags"
                  :key="tag"
                  class="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-body-sm font-medium text-neutral-700"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
            <div class="mt-6 flex items-center justify-between pt-4 border-t border-neutral-100">
              <span class="text-body-sm text-neutral-500">
                Updated {{ guide.updated }}
              </span>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
              >
                Read
                <svg
                  class="h-4 w-4"
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
          </article>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-600 p-8 shadow-xl sm:p-12 text-center text-white">
        <h3 class="text-h2 font-bold mb-4">
          Ready to Compare Providers?
        </h3>
        <p class="mx-auto max-w-2xl text-body-lg text-white/90 mb-8">
          Use what you've learned to find the best rates and save on your next transfer.
        </p>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 rounded-xl bg-surface px-8 py-4 text-body font-bold text-brand-600 shadow-lg hover:bg-neutral-50 transition-all hover:scale-105"
        >
          Compare Rates Now
          <svg
            class="h-5 w-5"
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
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import { useArticles } from '~/composables/useArticles'
import { LEARN_STATIC_ARTICLES } from '~/lib/learnStaticArticles'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'All Guides', path: '/learn/all' },
]

const categories = {
  'money-transfer-basics': 'Money Transfer Basics',
  'fees-hidden-costs': 'Fees & Hidden Costs',
  'speed-delivery': 'Speed & Delivery',
  'exchange-rates-timing': 'Exchange Rates & Timing',
  'provider-reviews': 'Provider Reviews',
}

const getCategoryLabel = (key?: string) => categories[key as keyof typeof categories] || 'Guide'

type GuideCard = {
  slug: string
  title: string
  excerpt: string
  categoryKey?: string
  readTime?: string
  level?: string
  tags?: string[]
  updated?: string
}

const { data: markdownArticles } = await useArticles()

type MarkdownGuide = {
  slug: string
  title: string
  excerpt: string
  categoryKey?: string
  readTime?: string
  tags?: string[]
  date?: string
  lastUpdated?: string
}

const vueGuides = computed<GuideCard[]>(() => {
  return LEARN_STATIC_ARTICLES.map(article => ({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    categoryKey: article.categoryKey,
    readTime: article.readTime,
    level: article.level,
    tags: [],
    updated: article.lastUpdated,
  }))
})

const markdownGuides = computed<GuideCard[]>(() => {
  const articles = (markdownArticles.value || []) as MarkdownGuide[]
  return articles.map(article => ({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    categoryKey: article.categoryKey,
    readTime: article.readTime || '5 min read',
    level: 'Guide',
    tags: article.tags || [],
    updated: article.lastUpdated || article.date || '',
  }))
})

const guides = computed<GuideCard[]>(() => [...vueGuides.value, ...markdownGuides.value])
const guideCount = computed(() => guides.value.length)

const { public: { siteUrl } } = useRuntimeConfig()

const seoTitle = 'All Guides | Money Transfer Learning Hub | Remit-Scout'
const seoDescription = 'Browse all Remit-Scout guides on international money transfers, fees, exchange rates, and delivery speed.'

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'All Guides',
    description: seoDescription,
  },
})

setSeo({
  title: seoTitle,
  description: seoDescription,
  canonical: `${siteUrl}/learn/all`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'All Guides', url: `${siteUrl}/learn/all` },
])
</script>
