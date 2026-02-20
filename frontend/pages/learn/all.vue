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
          <p class="text-body-sm font-semibold text-brand-400 uppercase tracking-wide mb-3">
            Complete Library
          </p>
          <h1 class="text-hero font-bold tracking-tight text-white mb-6 [text-wrap:balance]">
            All <span class="text-brand-600">Guides</span>
          </h1>
          <p class="text-h4 text-neutral-300 font-medium leading-relaxed max-w-3xl [text-wrap:balance]">
            {{ guideCount }} guides covering money transfers, fees, delivery speed, and exchange rates.
          </p>
        </div>
      </div>
    </section>

    <!-- Guides Grid -->
    <section class="py-16 lg:py-20 bg-surface">
      <div class="mx-auto max-w-page px-page-x">
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in guides"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-brand-300"
          >
            <div class="space-y-3 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="rounded-full bg-brand-50 px-3 py-1.5 text-body-sm font-semibold text-brand-700">
                  {{ getCategoryLabel(guide.categoryKey) }}
                </span>
                <span class="text-body-sm text-neutral-500">
                  {{ guide.readTime }}
                </span>
              </div>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="block text-body-lg font-bold text-neutral-900 hover:text-brand-600 motion-safe:transition-colors"
              >
                <RichHtml tag="span" :content="guide.title" />
              </NuxtLink>
              <p class="text-body-sm text-neutral-600 leading-relaxed">
                {{ guide.excerpt }}
              </p>
            </div>
            <div class="mt-6 pt-4 border-t border-neutral-100">
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

    <TrustMetricsStrip />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import { useArticles } from '~/composables/useArticles'
import { LEARN_STATIC_ARTICLES } from '~/lib/learnStaticArticles'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Guides', path: '/learn' },
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
