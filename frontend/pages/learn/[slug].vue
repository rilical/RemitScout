<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

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

      <LastUpdated :date="article?.lastUpdated" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta
const route = useRoute()
useHead({
  title: `${useArticle(route.params.slug as string)?.title || 'Article'} | Remit-Scout`,
  meta: [
    {
      name: 'description',
      content:
        useArticle(route.params.slug as string)?.excerpt
        || 'Learn about international money transfers and best practices.',
    },
  ],
})

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: useArticle(route.params.slug as string)?.title || 'Article', path: route.path },
])

// Article data
const { data: article } = await useArticle(route.params.slug as string)
</script>
