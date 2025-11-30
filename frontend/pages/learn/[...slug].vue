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

        <div class="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-semibold">Sponsored placement</p>
              <p>Reserve a 300x250/336x280 display spot here. Keep links rel="sponsored"/nofollow and label as an ad.</p>
            </div>
            <span class="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-amber-700">Ad</span>
          </div>
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
      <div v-else class="rounded-lg bg-white p-6 shadow">
        <p class="text-neutral-700">Article not found.</p>
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
