<template>
  <div>
    <div class="mb-6">
      <h2 class="mb-2 text-h3 font-bold text-white flex items-center gap-2">
        <svg
          class="h-6 w-6 text-primary-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        Market Insights
      </h2>
      <p class="text-neutral-400">
        Data-driven articles and explainers about what's happening in the remittance market
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <NuxtLink
        v-for="insight in insights"
        :key="insight.id"
        to="/learn"
        class="group rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-800/80 to-neutral-800/40 overflow-hidden transition-all duration-300 hover:border-white/20 hover:scale-[1.02] cursor-pointer"
        :aria-label="`Read insight: ${insight.title}`"
      >
        <div
          class="h-1 w-full"
          :class="insight.barClass"
        />

        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <span
              class="rounded-lg px-3 py-1.5 text-body-sm font-semibold"
              :class="insight.categoryClass"
            >
              {{ insight.category }}
            </span>
            <span class="text-body-sm text-rs-muted">{{ insight.date }}</span>
          </div>

          <h3 class="mb-3 text-body-lg font-bold text-white group-hover:text-primary-400 transition-colors">
            {{ insight.title }}
          </h3>

          <p class="mb-5 text-body-sm text-neutral-400 leading-relaxed">
            {{ insight.excerpt }}
          </p>

          <div class="flex items-center justify-between pt-4 border-t border-white/5">
            <div class="flex items-center gap-2 text-body-sm text-rs-muted">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {{ insight.readTime }}
            </div>
            <span class="text-body-sm font-medium text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1 group-hover:gap-2">
              Read insight
              <svg
                class="h-4 w-4 transition-transform group-hover:translate-x-0.5"
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
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div class="mt-8 text-center">
      <NuxtLink
        to="/learn"
        class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface/5 px-6 py-3 text-body-sm font-medium text-neutral-300 transition-all hover:bg-surface/10 hover:text-white"
      >
        View all insights
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
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const insights = [
  {
    id: '1',
    title: 'Why USD→MXN rates jumped 2% this week',
    excerpt: 'Understanding the Federal Reserve\'s latest policy decision and its impact on remittance corridors to Mexico. Here\'s what senders should know.',
    category: 'Market Analysis',
    categoryClass: 'bg-primary-500/20 text-primary-400',
    barClass: 'bg-primary-500',
    date: 'Today',
    readTime: '3 min read',
  },
  {
    id: '2',
    title: 'Cash pickup vs bank transfer: When does speed matter?',
    excerpt: 'A data-driven look at delivery times, costs, and when paying extra for instant transfer actually makes sense for your situation.',
    category: 'Guide',
    categoryClass: 'bg-success-600/20 text-success-600',
    barClass: 'bg-success-600',
    date: 'Yesterday',
    readTime: '5 min read',
  },
  {
    id: '3',
    title: 'Promo codes decoded: Are intro rates worth it?',
    excerpt: 'We analyzed 847 provider promos to show you the real value after fees and FX spreads are factored in. The results may surprise you.',
    category: 'Research',
    categoryClass: 'bg-accent-600/20 text-accent-600',
    barClass: 'bg-accent-600',
    date: '2 days ago',
    readTime: '4 min read',
  },
  {
    id: '4',
    title: 'Weekend rates: What we learned from 6 months of data',
    excerpt: 'Why Friday afternoon might be the worst time to send money, and when you should wait until Monday for better rates.',
    category: 'Insights',
    categoryClass: 'bg-warning-600/20 text-warning-600',
    barClass: 'bg-warning-600',
    date: '3 days ago',
    readTime: '6 min read',
  },
]
</script>
