<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h1 class="mb-4 text-4xl font-bold text-gray-900">Money Transfer Guides</h1>
        <p class="mb-6 text-xl text-gray-600">
          Learn everything you need to know about international money transfers, exchange rates, and
          fees.
        </p>
      </div>

      <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="article in articles"
          :key="article.slug"
          class="overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
        >
          <div class="aspect-video bg-gray-200" />
          <div class="p-6">
            <div class="mb-2 flex items-center">
              <Badge variant="secondary" class="text-xs">
                {{ article.category }}
              </Badge>
              <span class="ml-2 text-sm text-gray-500">{{ article.readTime }}</span>
            </div>
            <h2
              class="mb-2 cursor-pointer text-xl font-semibold text-gray-900 hover:text-primary-600"
            >
              {{ article.title }}
            </h2>
            <p class="mb-4 text-gray-600">
              {{ article.excerpt }}
            </p>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">By {{ article.author }}</span>
              <span class="text-sm text-gray-500">{{ article.date }}</span>
            </div>
          </div>
        </article>
      </div>

      <div class="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h2 class="mb-4 text-2xl font-bold text-gray-900">Popular Topics</h2>
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div
            v-for="topic in topics"
            :key="topic.name"
            class="cursor-pointer rounded-lg border p-4 text-center hover:bg-gray-50"
          >
            <div class="mb-2 text-2xl">
              {{ topic.icon }}
            </div>
            <div class="font-medium text-gray-900">
              {{ topic.name }}
            </div>
            <div class="text-sm text-gray-600">{{ topic.count }} articles</div>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="mb-2 text-2xl font-bold">Need Help Choosing?</h2>
            <p class="text-primary-100">
              Use our comparison tools to find the best provider for your specific needs.
            </p>
          </div>
          <NuxtLink to="/providers" class="btn-primary bg-white text-primary-600 hover:bg-gray-100">
            Compare Providers
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta
useHead({
  title: 'Money Transfer Guides | Learn About International Payments | Remit-Scout',
  meta: [
    {
      name: 'description',
      content:
        'Learn about international money transfers, exchange rates, fees, and regulations. Expert guides to help you send money abroad safely and cheaply.',
    },
  ],
});

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
];

// Articles data (mock)
const articles = ref([
  {
    slug: 'how-exchange-rates-work',
    title: 'How Exchange Rates Work',
    excerpt:
      'Understanding how currency exchange rates are determined and how they affect your transfers.',
    category: 'Basics',
    readTime: '5 min read',
    author: 'Remit-Scout Team',
    date: '2024-01-15',
  },
  {
    slug: 'hidden-fees-money-transfers',
    title: 'Hidden Fees in Money Transfers',
    excerpt: 'Learn about the different types of fees and how to avoid paying more than necessary.',
    category: 'Fees',
    readTime: '7 min read',
    author: 'Financial Expert',
    date: '2024-01-10',
  },
  {
    slug: 'best-time-to-send-money',
    title: 'Best Time to Send Money Internationally',
    excerpt: 'When is the optimal time to make international transfers for maximum value.',
    category: 'Strategy',
    readTime: '4 min read',
    author: 'Market Analyst',
    date: '2024-01-08',
  },
]);

const topics = ref([
  { name: 'Exchange Rates', icon: '💱', count: 12 },
  { name: 'Transfer Fees', icon: '💰', count: 8 },
  { name: 'Security', icon: '🔒', count: 6 },
  { name: 'Regulations', icon: '⚖️', count: 4 },
]);
</script>
