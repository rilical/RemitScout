<template>
  <div class="min-h-screen bg-gray-50">
    <div class="border-b border-neutral-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Breadcrumbs :items="breadcrumbItems" />
        <form
          class="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 shadow-sm"
          role="search"
          @submit.prevent="onSearch"
        >
          <svg class="h-4 w-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            v-model="searchTerm"
            type="search"
            placeholder="Search guides"
            class="w-40 bg-transparent text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none"
          >
          <button
            type="submit"
            class="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Go
          </button>
        </form>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Main Content Column -->
        <div class="lg:col-span-8">
          <div v-if="article" class="mb-4">
            <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
              Money Transfer Basics
            </div>
            <div class="text-neutral-600 text-sm">
              Last updated {{ article.lastUpdated || '—' }} • {{ article.readTime || '5 min read' }}
            </div>
          </div>

          <article class="rounded-lg bg-white p-8 shadow-md">
        <header class="mb-8 border-b pb-8">
          <div class="mb-4 flex items-center">
            <Badge variant="secondary">
              {{ article?.category }}
            </Badge>
            <span class="ml-4 text-gray-500">{{ article?.readTime }}</span>
          </div>
          <h1 class="mb-4 text-4xl font-bold text-gray-900">
            {{ article?.title }}
          </h1>
          <p class="mb-6 text-xl text-gray-600">
            {{ article?.excerpt }}
          </p>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="mr-4 h-12 w-12 rounded-full bg-gray-300" />
              <div>
                <div class="font-medium text-gray-900">
                  {{ article?.author }}
                </div>
                <div class="text-gray-500">
                  {{ article?.date }}
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <button class="flex items-center text-gray-500 hover:text-gray-700">
                <svg
                  class="mr-1 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"
                  />
                </svg>
                Share
              </button>
              <button class="flex items-center text-gray-500 hover:text-gray-700">
                <svg
                  class="mr-1 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                Save
              </button>
            </div>
          </div>
        </header>

        <div class="mb-6">
          <AdSlot placement="blog_inline" wrapper-class="rounded-xl" min-height="120px" />
        </div>

        <div class="prose prose-lg max-w-none">
          <div v-html="article?.content" />
        </div>

        <footer class="mt-8 border-t pt-8">
          <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center">
              <button class="mr-4 flex items-center text-gray-500 hover:text-gray-700">
                <svg
                  class="mr-1 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                Was this helpful?
              </button>
              <span class="text-gray-500">{{ article?.helpfulCount }} found this helpful</span>
            </div>
            <div class="flex space-x-2">
              <Badge variant="outline">
                Updated {{ article?.lastUpdated }}
              </Badge>
            </div>
          </div>

          <div class="rounded-lg bg-gray-50 p-6">
            <h3 class="mb-2 text-lg font-semibold text-gray-900">
              Related Articles
            </h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NuxtLink
                v-for="related in article?.relatedArticles"
                :key="related.slug"
                :to="`/learn/${related.slug}`"
                class="block rounded-lg border p-4 transition-all hover:bg-white hover:shadow-md"
              >
                <h4 class="mb-1 font-medium text-gray-900">{{ related.title }}</h4>
                <p class="text-sm text-gray-600">{{ related.excerpt }}</p>
              </NuxtLink>
            </div>
          </div>
        </footer>
      </article>

          <LastUpdated v-if="article" :date="article?.lastUpdated" />

          <div v-if="!article" class="rounded-lg bg-white p-6 shadow">
            <p class="text-neutral-700">Article not found.</p>
          </div>
        </div>

        <!-- Sidebar Column -->
        <aside class="lg:col-span-4 space-y-6">
          <AdSlot placement="blog_sidebar" layout="vertical" wrapper-class="rounded-xl" min-height="160px" />
          <!-- Data Sources & Methodology Box -->
          <div class="rounded-lg bg-slate-900 border border-slate-800 p-5 sticky top-4">
            <div class="flex items-center gap-2 mb-4">
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 class="text-base font-semibold text-white">Data Sources & Methodology</h3>
            </div>
            
            <div class="space-y-4 text-sm">
              <div>
                <p class="text-slate-400 mb-2">This article uses data from:</p>
                <ul class="space-y-2">
                  <li class="flex items-start gap-2 text-slate-300">
                    <svg class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>33+ licensed money transfer providers</span>
                  </li>
                  <li class="flex items-start gap-2 text-slate-300">
                    <svg class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>XE mid-market rate benchmarks</span>
                  </li>
                  <li class="flex items-start gap-2 text-slate-300">
                    <svg class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Regulatory filings (FCA, FinCEN, ASIC)</span>
                  </li>
                </ul>
              </div>

              <div class="pt-3 border-t border-slate-700">
                <p class="text-slate-400 mb-2">Verification:</p>
                <div class="flex items-center gap-2 text-slate-300">
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Synthetically Verified
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-2">
                  Data validated through automated transaction simulations
                </p>
              </div>

              <div class="pt-3 border-t border-slate-700">
                <NuxtLink
                  to="/methodology"
                  class="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>View full methodology</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Editorial Independence Box -->
          <div class="rounded-lg bg-white border border-neutral-200 p-5">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 class="text-sm font-semibold text-neutral-900">Editorial Independence</h4>
            </div>
            <p class="text-xs text-neutral-600 leading-relaxed mb-3">
              Rankings are determined by our proprietary scoring system. Providers cannot pay for placement or influence scores.
            </p>
            <NuxtLink
              to="/how-we-make-money"
              class="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              How we make money →
            </NuxtLink>
          </div>

          <!-- Compare Now CTA -->
          <div class="rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white">
            <h4 class="font-semibold mb-2">Ready to send money?</h4>
            <p class="text-sm text-white/90 mb-4">
              Compare real-time rates from 30+ providers and find the best deal.
            </p>
            <NuxtLink
              to="/send-money"
              class="inline-flex items-center gap-2 w-full justify-center py-2.5 px-4 bg-white text-brand-600 rounded-lg text-sm font-semibold hover:bg-brand-50 transition-colors"
            >
              Compare Rates
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'

const route = useRoute()
const router = useRouter()

const slugParam = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw.join('/') : String(raw || '')
})

const { data: article } = await useArticle(slugParam.value)

watchEffect(() => {
  if (!article.value) return
  useHead({
    title: `${article.value.title} | Remit-Scout`,
    meta: [
      {
        name: 'description',
        content: article.value.excerpt || 'Learn about international money transfers and best practices.',
      },
    ],
  })
})

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: article.value?.title || 'Article', path: route.path },
])

const searchTerm = ref('')
const onSearch = () => {
  if (!searchTerm.value) return
  router.push(`/search?q=${encodeURIComponent(searchTerm.value)}`)
}
</script>
