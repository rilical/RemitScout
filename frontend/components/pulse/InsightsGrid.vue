<template>
  <div>
    <div class="mb-6">
      <h2 class="mb-2 text-2xl font-bold text-gray-900">
        Market Insights
      </h2>
      <p class="text-gray-600">
        Short articles and explainers about what's happening in the market
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <article
        v-for="insight in insights"
        :key="insight.id"
        class="rounded-lg border border-gray-200 bg-white p-6 hover:border-primary-300 hover:shadow-md"
      >
        <div class="mb-3 flex items-center gap-2">
          <span
            class="rounded-full px-2 py-1 text-xs font-medium"
            :class="insight.categoryClass"
          >
            {{ insight.category }}
          </span>
          <span class="text-xs text-gray-500">{{ insight.date }}</span>
        </div>

        <h3 class="mb-3 text-lg font-bold text-gray-900">
          {{ insight.title }}
        </h3>

        <p class="mb-4 text-sm text-gray-600">
          {{ insight.excerpt }}
        </p>

        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">{{ insight.readTime }}</span>
          <button class="text-sm font-medium text-primary-600 hover:text-primary-700">
            Read more →
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
const insights = [
  {
    id: '1',
    title: 'Why USD→MXN rates jumped 2% this week',
    excerpt: 'Understanding the Federal Reserve\'s latest policy decision and its impact on remittance corridors to Mexico.',
    category: 'Market Analysis',
    categoryClass: 'bg-blue-100 text-blue-700',
    date: 'Today',
    readTime: '3 min read',
  },
  {
    id: '2',
    title: 'Cash pickup vs bank transfer: When does speed matter?',
    excerpt: 'A data-driven look at delivery times, costs, and when paying extra for instant transfer actually makes sense.',
    category: 'Guide',
    categoryClass: 'bg-green-100 text-green-700',
    date: 'Yesterday',
    readTime: '5 min read',
  },
  {
    id: '3',
    title: 'Promo codes decoded: Are intro rates worth it?',
    excerpt: 'We analyzed 847 provider promos to show you the real value after fees and FX spreads are factored in.',
    category: 'Research',
    categoryClass: 'bg-purple-100 text-purple-700',
    date: '2 days ago',
    readTime: '4 min read',
  },
  {
    id: '4',
    title: 'Weekend rates: What we learned from 6 months of data',
    excerpt: 'Why Friday afternoon might be the worst time to send money, and when you should wait until Monday.',
    category: 'Insights',
    categoryClass: 'bg-amber-100 text-amber-700',
    date: '3 days ago',
    readTime: '6 min read',
  },
]
</script>
