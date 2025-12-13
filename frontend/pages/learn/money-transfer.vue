<template>
  <div class="min-h-screen bg-gradient-to-b from-white via-blue-50/20 to-white">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <Breadcrumbs :items="breadcrumbItems" />

      <!-- Hero Section -->
      <section class="mb-12">
        <div class="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm mb-4">
          <span>💸</span>
          Category
        </div>
        <h1 class="text-4xl font-bold text-neutral-900 sm:text-5xl mb-4">
          Money Transfer Basics
        </h1>
        <p class="max-w-3xl text-lg text-neutral-600 mb-8">
          Master the fundamentals: FX rates, fees, timing, safety, and how our comparisons work to help you save on every transfer.
        </p>
      </section>

      <!-- Guides Grid -->
      <section class="mb-16">
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in guides"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="space-y-4 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                  {{ guide.level }}
                </span>
                <span class="text-xs text-neutral-500">
                  {{ guide.readTime }}
                </span>
              </div>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="block text-xl font-bold text-neutral-900 hover:text-brand-600 transition-colors"
              >
                {{ guide.title }}
              </NuxtLink>
              <p class="text-sm text-neutral-600 leading-relaxed">
                {{ guide.excerpt }}
              </p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in guide.tags"
                  :key="tag"
                  class="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
            <div class="mt-6 flex items-center justify-between pt-4 border-t border-neutral-100">
              <span class="text-xs text-neutral-500">
                Updated {{ guide.updated }}
              </span>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
              >
                Read
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </NuxtLink>
            </div>
          </article>
        </div>
      </section>

      <!-- Related Categories -->
      <section class="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h2 class="text-2xl font-bold text-neutral-900 mb-6">
          Explore Other Topics
        </h2>
        <div class="grid gap-4 sm:grid-cols-3">
          <NuxtLink
            to="/learn/banking-abroad"
            class="group rounded-xl border border-neutral-200 p-5 hover:border-brand-300 hover:shadow-md transition-all"
          >
            <span class="text-3xl mb-2 block">🏦</span>
            <h3 class="font-bold text-neutral-900 mb-1 group-hover:text-brand-600">Banking abroad</h3>
            <p class="text-sm text-neutral-600">Accounts & ATMs</p>
          </NuxtLink>
          <NuxtLink
            to="/learn/staying-connected"
            class="group rounded-xl border border-neutral-200 p-5 hover:border-brand-300 hover:shadow-md transition-all"
          >
            <span class="text-3xl mb-2 block">📡</span>
            <h3 class="font-bold text-neutral-900 mb-1 group-hover:text-brand-600">Staying connected</h3>
            <p class="text-sm text-neutral-600">Staying connected abroad</p>
          </NuxtLink>
          <NuxtLink
            to="/learn/health-insurance"
            class="group rounded-xl border border-neutral-200 p-5 hover:border-brand-300 hover:shadow-md transition-all"
          >
            <span class="text-3xl mb-2 block">🩺</span>
            <h3 class="font-bold text-neutral-900 mb-1 group-hover:text-brand-600">Health & insurance</h3>
            <p class="text-sm text-neutral-600">Travel coverage</p>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Money Transfer Basics', path: '/learn/money-transfer' },
]

const guides = [
  {
    slug: 'how-exchange-rates-work',
    title: 'How exchange rates work',
    excerpt: 'Mid-market, FX spread, and how providers price your transfer.',
    readTime: '5 min read',
    level: 'Beginner',
    tags: ['FX 101', 'Spread'],
    updated: '2024-12-01',
  },
  {
    slug: 'hidden-fees-money-transfers',
    title: 'Hidden fees to avoid when sending money',
    excerpt: 'Transfer fees, correspondent fees, and what "free" really means.',
    readTime: '6 min read',
    level: 'Beginner',
    tags: ['Fees', 'Transparency'],
    updated: '2024-11-20',
  },
  {
    slug: 'best-time-to-send-money',
    title: 'When is the best time to send money?',
    excerpt: 'Timing around FX moves, cut-off times, and weekends.',
    readTime: '4 min read',
    level: 'Intermediate',
    tags: ['Timing', 'FX'],
    updated: '2024-11-10',
  },
  {
    slug: 'avoid-hidden-fees',
    title: 'Avoid hidden fees in international transfers',
    excerpt: 'Spot exchange mark-ups and keep more in every transfer.',
    readTime: '5 min read',
    level: 'Beginner',
    tags: ['Fees', 'Strategy'],
    updated: '2024-11-15',
  },
]

setSeo({
  title: 'Money Transfer Basics | Learn Hub | Remit-Scout',
  description: 'Master international money transfer fundamentals: exchange rates, fees, timing, and comparison strategies.',
})
</script>

