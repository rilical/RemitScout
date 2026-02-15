<template>
  <div class="min-h-screen bg-gradient-to-b from-white via-primary-50/20 to-white">
    <div class="container py-12 sm:py-16">
      <Breadcrumbs :items="breadcrumbItems" />

      <!-- Hero Section -->
      <section class="mb-12">
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
              d="M7 16l-4-4m0 0l4-4m-4 4h18m-7 4l4-4m0 0l-4-4m4 4H3"
            />
          </svg>
          Category
        </div>
        <h1 class="text-h1 font-bold text-neutral-900 mb-4">
          Money Transfer Basics
        </h1>
        <p class="max-w-3xl text-body-lg text-neutral-600 mb-8">
          Master the fundamentals: FX rates, fees, timing, safety, and how our comparisons work to help you save on every transfer.
        </p>
      </section>

      <!-- Guides Grid -->
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
                  {{ guide.level }}
                </span>
                <span class="text-body-sm text-neutral-500">
                  {{ guide.readTime }}
                </span>
              </div>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="block text-h4 font-bold text-neutral-900 hover:text-brand-600 transition-colors"
              >
                <RichHtml tag="span" :content="guide.title" />
              </NuxtLink>
              <p class="text-body-sm text-neutral-600 leading-relaxed">
                {{ guide.excerpt }}
              </p>
              <div
                v-if="guide.tags?.length"
                class="flex flex-wrap gap-2"
              >
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

      <!-- Related Categories -->
      <section class="rounded-3xl border border-neutral-200 bg-surface p-8 shadow-sm">
        <h2 class="text-h3 font-bold text-neutral-900 mb-6">
          Explore Other Topics
        </h2>
        <div class="grid gap-4 sm:grid-cols-3">
          <NuxtLink
            to="/learn/all"
            class="group rounded-xl border border-neutral-200 p-5 hover:border-brand-300 hover:shadow-md transition-all"
          >
            <svg
              class="h-8 w-8 mb-2 text-brand-600"
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
            <h3 class="font-bold text-neutral-900 mb-1 group-hover:text-brand-600">All guides</h3>
            <p class="text-body-sm text-neutral-600">Browse the full library</p>
          </NuxtLink>
          <NuxtLink
            to="/learn/providers"
            class="group rounded-xl border border-neutral-200 p-5 hover:border-brand-300 hover:shadow-md transition-all"
          >
            <svg
              class="h-8 w-8 mb-2 text-brand-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h3 class="font-bold text-neutral-900 mb-1 group-hover:text-brand-600">Provider reviews</h3>
            <p class="text-body-sm text-neutral-600">See Remit-Scores by provider</p>
          </NuxtLink>
          <NuxtLink
            to="/exchange-rates"
            class="group rounded-xl border border-neutral-200 p-5 hover:border-brand-300 hover:shadow-md transition-all"
          >
            <svg
              class="h-8 w-8 mb-2 text-brand-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <h3 class="font-bold text-neutral-900 mb-1 group-hover:text-brand-600">Exchange rates</h3>
            <p class="text-body-sm text-neutral-600">Live rates and corridor links</p>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import { LEARN_STATIC_ARTICLES } from '~/lib/learnStaticArticles'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Money Transfer Basics', path: '/learn/money-transfer' },
]

type GuideCard = {
  slug: string
  title: string
  excerpt: string
  readTime: string
  level: string
  tags: string[]
  updated: string
}

const FEATURED_SLUGS = [
  'why-compare-before-every-transfer',
  'how-to-read-remittance-quote',
  'hidden-exchange-rate-fees-explained',
  'why-checkout-price-differs',
  'how-exchange-rates-work',
  'best-time-to-send-money',
]

const guides = computed<GuideCard[]>(() => {
  const bySlug = new Map(LEARN_STATIC_ARTICLES.map(article => [article.slug, article]))

  return FEATURED_SLUGS
    .map(slug => bySlug.get(slug))
    .filter((a): a is (typeof LEARN_STATIC_ARTICLES)[number] => Boolean(a))
    .map(article => ({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      readTime: article.readTime,
      level: article.level,
      tags: [],
      updated: article.lastUpdated,
    }))
})

const { public: { siteUrl } } = useRuntimeConfig()

const seoTitle = 'Money Transfer Basics | Learn Hub | Remit-Scout'
const seoDescription = 'Master international money transfer fundamentals: exchange rates, fees, timing, and comparison strategies.'

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Money Transfer Basics',
    description: seoDescription,
  },
})

setSeo({
  title: seoTitle,
  description: seoDescription,
  canonical: `${siteUrl}/learn/money-transfer`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Money Transfer Basics', url: `${siteUrl}/learn/money-transfer` },
])
</script>
