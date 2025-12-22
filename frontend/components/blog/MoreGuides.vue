<template>
  <section class="py-12 bg-neutral-50 rounded-2xl">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-neutral-900 mb-2">
          More Guides
        </h2>
        <p class="text-neutral-600">
          Continue learning about money transfers and international finance
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="guide in guides"
          :key="guide.slug"
          class="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-brand-300"
        >
          <div class="flex items-center gap-2 mb-3">
            <span
              v-if="guide.category"
              class="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
            >
              {{ guide.category }}
            </span>
            <span class="text-xs text-neutral-500">
              {{ guide.readTime || '5 min' }}
            </span>
          </div>
          <NuxtLink
            :to="`/learn/${guide.slug}`"
            class="block"
          >
            <h3 class="text-lg font-bold text-neutral-900 hover:text-brand-600 transition-colors mb-2">
              {{ guide.title }}
            </h3>
            <p
              v-if="guide.excerpt"
              class="text-sm text-neutral-600 leading-relaxed line-clamp-2"
            >
              {{ guide.excerpt }}
            </p>
          </NuxtLink>
        </article>
      </div>

      <div class="mt-8 text-center">
        <NuxtLink
          to="/learn"
          class="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-semibold transition-colors"
        >
          View all guides
          <svg
            class="w-4 h-4"
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
import { useArticles } from '~/composables/useArticles'

interface Guide {
  slug: string
  title: string
  excerpt?: string
  category?: string
  readTime?: string
}

interface Props {
  excludeSlug?: string
  limit?: number
  categoryKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  limit: 3,
})

const { data: articles } = await useArticles()

const guides = computed<Guide[]>(() => {
  let filtered = (articles.value || [])
    .filter(a => a.slug !== props.excludeSlug)
  
  if (props.categoryKey) {
    filtered = filtered.filter(a => a.categoryKey === props.categoryKey)
  }
  
  return filtered
    .slice(0, props.limit)
    .map(a => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      readTime: a.readTime,
    }))
})
</script>








