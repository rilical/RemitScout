<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section with Search -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12">
          <div class="text-center mb-12">
            <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Guides & Reviews
            </div>
            <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
              Money Transfer <span class="text-brand-600">Guides</span>
            </h1>
            <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-8 leading-relaxed max-w-3xl mx-auto">
              Everything you need to send money smarter, compare providers, and avoid hidden fees.
            </p>

            <!-- Search Bar -->
            <div class="max-w-2xl mx-auto mb-8">
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search guides, reviews, comparisons..."
                  class="w-full rounded-2xl border-2 border-neutral-200 bg-white px-6 py-4 pl-14 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                <svg
                  class="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <!-- Filters -->
            <div class="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
              <button
                v-for="filter in filters"
                :key="filter.key"
                :class="[
                  'px-4 py-2 rounded-full text-sm font-semibold transition-all',
                  activeFilter === filter.key
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-white border-2 border-neutral-200 text-neutral-700 hover:border-brand-300',
                ]"
                @click="activeFilter = filter.key"
              >
                {{ filter.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How We Review Banner -->
    <section class="py-6 bg-neutral-50 border-b border-neutral-200">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-700">
          <div class="flex items-center gap-2">
            <svg
              class="h-5 w-5 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="font-semibold">No pay-to-rank</span>
          </div>
          <div class="flex items-center gap-2">
            <svg
              class="h-5 w-5 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span class="font-semibold">Data-driven</span>
          </div>
          <div class="flex items-center gap-2">
            <svg
              class="h-5 w-5 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="font-semibold">Disclosures visible</span>
          </div>
          <NuxtLink
            to="/methodology"
            class="text-brand-600 hover:text-brand-700 font-semibold underline"
          >
            Review policy →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Start Here Section -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-12">
          <div class="inline-flex items-center gap-2 rounded-full bg-brand-600/10 px-4 py-2 text-sm font-semibold text-brand-700 mb-6">
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            New User Path
          </div>
          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Start Here
          </h2>
          <p class="text-lg text-neutral-600 max-w-2xl">
            First-time visitor? Start with these essential guides to understand money transfers and avoid costly mistakes.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in startHereGuides"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Beginner
              </span>
              <span class="text-xs text-neutral-500">
                {{ guide.readTime || '5 min read' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-xl font-bold text-neutral-900 hover:text-brand-600 transition-colors mb-3"
            >
              {{ guide.title }}
            </NuxtLink>
            <p class="text-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
            >
              Read guide
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
          </article>
        </div>
      </div>
    </section>

    <!-- Category Grid -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Browse by Category
          </h2>
          <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
            Explore our guides organized by topic to find exactly what you need
          </p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <button
            v-for="cat in categories"
            :key="cat.key"
            type="button"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300 hover:-translate-y-1 flex flex-col cursor-pointer text-left w-full"
            @click="scrollToSection(cat.key)"
          >
            <div
              class="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center"
              :class="`from-${cat.color}-50 to-${cat.color}-100`"
            >
              <svg
                class="w-8 h-8"
                :class="`text-${cat.color}-600`"
                :fill="cat.icon === 'star' ? 'currentColor' : 'none'"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  :d="getCategoryIcon(cat.icon)"
                />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-neutral-900 mb-2 text-center">
              {{ cat.name }}
            </h3>
            <p class="text-sm text-neutral-600 mb-4 flex-1 text-center">
              {{ getCategoryArticleCount(cat.key) }} guides
            </p>
            <span class="inline-flex items-center justify-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
              Browse guides
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
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- Money Transfer Basics Section -->
    <section
      id="money-transfer-basics"
      class="py-16 lg:py-20 bg-white scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-10">
          <div class="flex items-center gap-4 mb-6">
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-neutral-900">
                Money Transfer Basics
              </h2>
              <p class="text-neutral-600 mt-1">
                Understand the mechanics and choices: bank transfer vs card vs wallet, cash pickup vs bank deposit, speed, and policies.
              </p>
            </div>
          </div>
          <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-blue-600 rounded-full" />
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in getArticlesByCategory('money-transfer-basics')"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                {{ guide.level || 'Beginner' }}
              </span>
              <span class="text-xs text-neutral-500">
                {{ guide.readTime || '5 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-xl font-bold text-neutral-900 hover:text-brand-600 transition-colors mb-3"
            >
              {{ guide.title }}
            </NuxtLink>
            <p class="text-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-between pt-4 border-t border-neutral-100">
              <span class="text-xs text-neutral-500">
                {{ guide.lastUpdated ? `Updated ${guide.lastUpdated}` : '' }}
              </span>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
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
      </div>
    </section>

    <!-- Fees & Hidden Costs Section -->
    <section
      id="fees-hidden-costs"
      class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-10">
          <div class="flex items-center gap-4 mb-6">
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <div class="inline-flex items-center gap-2 rounded-full bg-brand-600/10 px-3 py-1 text-xs font-semibold text-brand-700 mb-2">
                Pricing 101
              </div>
              <h2 class="text-3xl font-bold text-neutral-900">
                Fees & Hidden Costs
              </h2>
              <p class="text-neutral-600 mt-1">
                Own the "truth about fees" category. Learn about FX markup, mid-market rates, promo rates, and "$0 fee" traps.
              </p>
            </div>
          </div>
          <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-blue-600 rounded-full" />
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in getArticlesByCategory('fees-hidden-costs')"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                {{ guide.level || 'Intermediate' }}
              </span>
              <span class="text-xs text-neutral-500">
                {{ guide.readTime || '5 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-xl font-bold text-neutral-900 hover:text-brand-600 transition-colors mb-3"
            >
              {{ guide.title }}
            </NuxtLink>
            <p class="text-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-between pt-4 border-t border-neutral-100">
              <span class="text-xs text-neutral-500">
                {{ guide.lastUpdated ? `Updated ${guide.lastUpdated}` : '' }}
              </span>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
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
      </div>
    </section>

    <!-- Provider Reviews Section -->
    <section
      id="provider-reviews"
      class="py-16 lg:py-20 bg-white scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-10">
          <div class="flex items-center gap-4 mb-6">
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-neutral-900">
                Provider Reviews
              </h2>
              <p class="text-neutral-600 mt-1">
                Individual provider reviews: fees, FX, speed, supported corridors, pros/cons, and who it's best for.
              </p>
            </div>
          </div>
          <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-blue-600 rounded-full" />
        </div>

        <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 mb-8">
          <p class="text-sm text-neutral-700">
            <strong class="font-semibold text-neutral-900">Note:</strong> Reviews are editorial; rankings come from data. See our <NuxtLink
              to="/methodology"
              class="text-brand-600 hover:text-brand-700 underline"
            >review policy</NuxtLink> for how we test and verify providers.
          </p>
        </div>

        <!-- View All Providers CTA -->
        <div class="mb-10">
          <NuxtLink
            to="/learn/providers"
            class="group relative block overflow-hidden rounded-3xl border-2 border-neutral-200 bg-gradient-to-br from-white via-white to-brand-50 p-8 shadow-lg transition-all hover:shadow-2xl hover:border-brand-300 hover:-translate-y-1"
          >
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-md">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Full Provider Directory
                </div>
                <svg
                  class="h-8 w-8 text-brand-600 transform transition-transform group-hover:translate-x-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
              <h3 class="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
                View All Providers & Read Full Reviews
              </h3>
              <p class="text-base text-neutral-600 mb-6 leading-relaxed max-w-3xl">
                Browse our complete directory of money transfer providers. Compare fees, exchange rates, transfer speeds, supported corridors, and read in-depth editorial reviews to find the best service for your needs.
              </p>
              <div class="flex flex-wrap gap-4 text-sm">
                <div class="flex items-center gap-2 text-neutral-700">
                  <svg
                    class="h-5 w-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="font-semibold">50+ providers reviewed</span>
                </div>
                <div class="flex items-center gap-2 text-neutral-700">
                  <svg
                    class="h-5 w-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="font-semibold">Detailed fee breakdowns</span>
                </div>
                <div class="flex items-center gap-2 text-neutral-700">
                  <svg
                    class="h-5 w-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="font-semibold">Pros, cons & best for</span>
                </div>
              </div>
            </div>
            <!-- Decorative Background Elements -->
            <div class="absolute top-0 right-0 w-64 h-64 bg-brand-200 rounded-full opacity-20 blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div class="absolute bottom-0 left-0 w-48 h-48 bg-blue-200 rounded-full opacity-20 blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          </NuxtLink>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in getArticlesByCategory('provider-reviews')"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                Review
              </span>
              <span class="text-xs text-neutral-500">
                {{ guide.readTime || '10 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-xl font-bold text-neutral-900 hover:text-brand-600 transition-colors mb-3"
            >
              {{ guide.title }}
            </NuxtLink>
            <p class="text-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-between pt-4 border-t border-neutral-100">
              <span class="text-xs text-neutral-500">
                {{ guide.lastUpdated ? `Updated ${guide.lastUpdated}` : '' }}
              </span>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
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
      </div>
    </section>

    <!-- Head-to-Head Comparisons Section -->
    <section
      id="comparisons"
      class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-10">
          <div class="flex items-center gap-4 mb-6">
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-neutral-900">
                Head-to-Head Comparisons
              </h2>
              <p class="text-neutral-600 mt-1">
                Capture "Wise vs Remitly vs..." intent. General comparisons and corridor-specific comparisons.
              </p>
            </div>
          </div>
          <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-blue-600 rounded-full" />
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in getArticlesByCategory('comparisons')"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                Comparison
              </span>
              <span class="text-xs text-neutral-500">
                {{ guide.readTime || '8 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-xl font-bold text-neutral-900 hover:text-brand-600 transition-colors mb-3"
            >
              {{ guide.title }}
            </NuxtLink>
            <p class="text-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-between pt-4 border-t border-neutral-100">
              <span class="text-xs text-neutral-500">
                {{ guide.lastUpdated ? `Updated ${guide.lastUpdated}` : '' }}
              </span>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
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
      </div>
    </section>

    <!-- Corridor Playbooks Section -->
    <section
      id="corridor-playbooks"
      class="py-16 lg:py-20 bg-white scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-10">
          <div class="flex items-center gap-4 mb-6">
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-neutral-900">
                Corridor Playbooks
              </h2>
              <p class="text-neutral-600 mt-1">
                Country + route guides: best methods, fees, payout types, timing, and local payout methods.
              </p>
            </div>
          </div>
          <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-blue-600 rounded-full" />
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in getArticlesByCategory('corridor-playbooks')"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                Playbook
              </span>
              <span class="text-xs text-neutral-500">
                {{ guide.readTime || '10 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-xl font-bold text-neutral-900 hover:text-brand-600 transition-colors mb-3"
            >
              {{ guide.title }}
            </NuxtLink>
            <p class="text-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-between pt-4 border-t border-neutral-100">
              <span class="text-xs text-neutral-500">
                {{ guide.lastUpdated ? `Updated ${guide.lastUpdated}` : '' }}
              </span>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
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
      </div>
    </section>

    <!-- Speed & Delivery Section -->
    <section
      id="speed-delivery"
      class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-10">
          <div class="flex items-center gap-4 mb-6">
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-neutral-900">
                Speed & Delivery
              </h2>
              <p class="text-neutral-600 mt-1">
                Fastest ways to send money internationally: weekend cutoffs, banking hours, when cash pickup beats bank deposit, and what "ETA" really means.
              </p>
            </div>
          </div>
          <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-blue-600 rounded-full" />
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in getArticlesByCategory('speed-delivery')"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                {{ guide.level || 'Beginner' }}
              </span>
              <span class="text-xs text-neutral-500">
                {{ guide.readTime || '5 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-xl font-bold text-neutral-900 hover:text-brand-600 transition-colors mb-3"
            >
              {{ guide.title }}
            </NuxtLink>
            <p class="text-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-between pt-4 border-t border-neutral-100">
              <span class="text-xs text-neutral-500">
                {{ guide.lastUpdated ? `Updated ${guide.lastUpdated}` : '' }}
              </span>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
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
      </div>
    </section>

    <!-- Exchange Rates & Timing Section -->
    <section
      id="exchange-rates-timing"
      class="py-16 lg:py-20 bg-white scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-10">
          <div class="flex items-center gap-4 mb-6">
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-green-600"
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
            </div>
            <div>
              <h2 class="text-3xl font-bold text-neutral-900">
                Exchange Rates & Timing
              </h2>
              <p class="text-neutral-600 mt-1">
                Best time to send money, how to use rate history, setting target-rate alerts, and monthly sender strategy.
              </p>
            </div>
          </div>
          <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-blue-600 rounded-full" />
        </div>

        <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 mb-8">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center">
              <svg
                class="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-neutral-900 mb-2">
                Tools
              </h3>
              <div class="flex flex-wrap gap-3">
                <NuxtLink
                  :to="{ path: '/dashboard', query: { tab: 'alerts' } }"
                  class="text-sm font-semibold text-brand-600 hover:text-brand-700 underline"
                >
                  Track rates → Set alert
                </NuxtLink>
                <span class="text-neutral-400">•</span>
                <NuxtLink
                  :to="{ path: '/dashboard', query: { tab: 'watchlist' } }"
                  class="text-sm font-semibold text-brand-600 hover:text-brand-700 underline"
                >
                  Save corridor to watchlist
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in getArticlesByCategory('exchange-rates-timing')"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                {{ guide.level || 'Intermediate' }}
              </span>
              <span class="text-xs text-neutral-500">
                {{ guide.readTime || '5 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-xl font-bold text-neutral-900 hover:text-brand-600 transition-colors mb-3"
            >
              {{ guide.title }}
            </NuxtLink>
            <p class="text-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-between pt-4 border-t border-neutral-100">
              <span class="text-xs text-neutral-500">
                {{ guide.lastUpdated ? `Updated ${guide.lastUpdated}` : '' }}
              </span>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
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
      </div>
    </section>

    <!-- Safety, Scams & Compliance Section -->
    <section
      id="safety-scams"
      class="py-16 lg:py-20 bg-neutral-50 scroll-mt-20"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-10">
          <div class="flex items-center gap-4 mb-6">
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-neutral-900">
                Safety, Scams & Compliance
              </h2>
              <p class="text-neutral-600 mt-1">
                Reduce user anxiety and support load: KYC explained, scam red flags, what "regulated provider" means, and how to verify providers.
              </p>
            </div>
          </div>
          <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-blue-600 rounded-full" />
        </div>

        <div class="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 mb-8">
          <div class="flex items-center gap-3">
            <svg
              class="h-6 w-6 text-emerald-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <p class="text-sm font-semibold text-emerald-900">
              Safety first: Always verify providers and be aware of common scams. See our safety guidelines for more information.
            </p>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in getArticlesByCategory('safety-scams')"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                {{ guide.level || 'Beginner' }}
              </span>
              <span class="text-xs text-neutral-500">
                {{ guide.readTime || '5 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-xl font-bold text-neutral-900 hover:text-brand-600 transition-colors mb-3"
            >
              {{ guide.title }}
            </NuxtLink>
            <p class="text-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-between pt-4 border-t border-neutral-100">
              <span class="text-xs text-neutral-500">
                {{ guide.lastUpdated ? `Updated ${guide.lastUpdated}` : '' }}
              </span>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
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
      </div>
    </section>

    <!-- Updated Recently Section -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-12">
          <div class="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-4 py-2 text-sm font-semibold text-emerald-700 mb-6">
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Updated in the last 30 days
          </div>
          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Recently Updated
          </h2>
          <p class="text-lg text-neutral-600 max-w-2xl">
            International transfer info gets stale fast. Here are guides we've updated recently to ensure accuracy.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in recentlyUpdatedGuides"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Updated
              </span>
              <span class="text-xs text-neutral-500">
                {{ guide.readTime || '5 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-xl font-bold text-neutral-900 hover:text-brand-600 transition-colors mb-3"
            >
              {{ guide.title }}
            </NuxtLink>
            <p class="text-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-between pt-4 border-t border-neutral-100">
              <span class="text-xs text-neutral-500">
                {{ guide.lastUpdated || 'Recently updated' }}
              </span>
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
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
      </div>
    </section>

    <!-- View All Guides CTA -->
    <section class="py-16 lg:py-20 bg-gradient-to-br from-brand-600 via-brand-600 to-blue-600">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
            Explore All {{ filteredGuides.length }}+ Guides
          </h2>
          <p class="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Browse our complete library of expert guides covering money transfers, fees, reviews, comparisons, and more.
          </p>
          <NuxtLink
            to="/learn/all"
            class="inline-flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-lg font-bold text-brand-600 shadow-xl hover:bg-neutral-50 transition-all"
          >
            View All Articles
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Trust Metrics Strip -->
    <TrustMetricsStrip />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { setSeo } from '~/composables/useSeo'
import { useArticles } from '~/composables/useArticles'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'

const { data: articles } = await useArticles()

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
]

const searchQuery = ref('')
const activeFilter = ref('all')

const filters = [
  { key: 'all', label: 'All Topics' },
  { key: 'fees', label: 'Fees' },
  { key: 'speed', label: 'Speed' },
  { key: 'safety', label: 'Safety' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'comparisons', label: 'Comparisons' },
  { key: 'corridors', label: 'Corridors' },
  { key: 'exchange-rates', label: 'Exchange Rates' },
]

const categories = [
  {
    key: 'money-transfer-basics',
    name: 'Money Transfer Basics',
    icon: 'currency',
    color: 'emerald',
  },
  {
    key: 'fees-hidden-costs',
    name: 'Fees & Hidden Costs',
    icon: 'banknotes',
    color: 'amber',
  },
  {
    key: 'provider-reviews',
    name: 'Provider Reviews',
    icon: 'star',
    color: 'yellow',
  },
  {
    key: 'comparisons',
    name: 'Comparisons',
    icon: 'scale',
    color: 'purple',
  },
  {
    key: 'corridor-playbooks',
    name: 'Corridor Playbooks',
    icon: 'globe',
    color: 'blue',
  },
  {
    key: 'speed-delivery',
    name: 'Speed & Delivery',
    icon: 'lightning',
    color: 'orange',
  },
  {
    key: 'exchange-rates-timing',
    name: 'Exchange Rates & Timing',
    icon: 'chart',
    color: 'green',
  },
  {
    key: 'safety-scams',
    name: 'Safety & Scams',
    icon: 'shield',
    color: 'red',
  },
]

const getCategoryIcon = (iconName: string) => {
  const icons: Record<string, string> = {
    currency: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    banknotes: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    scale: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
    globe: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    lightning: 'M13 10V3L4 14h7v7l9-11h-7z',
    chart: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  }
  return icons[iconName] || icons.currency
}

const allGuides = computed(() => {
  const markdownArticles = articles.value || []
  const vueArticles = staticArticles.map(article => ({
    ...article,
    category: getCategoryName(article.categoryKey),
  }))
  return [...vueArticles, ...markdownArticles]
})

const getCategoryName = (key: string): string => {
  const cat = categories.find(c => c.key === key)
  return cat?.name || 'Money Transfer Basics'
}

const articleMapping: Record<string, string[]> = {
  'money-transfer-basics': [
    'why-compare-before-every-transfer',
    'bank-transfer-vs-card-vs-cash-pickup',
    'how-to-read-remittance-quote',
  ],
  'fees-hidden-costs': [
    'hidden-exchange-rate-fees-explained',
    'promo-codes-intro-rates',
    'why-checkout-price-differs',
  ],
  'speed-delivery': [
    'how-fast-is-international-money-transfer',
  ],
  'exchange-rates-timing': [
    'best-time-to-send-money',
  ],
}

const staticArticles = [
  {
    slug: 'why-compare-before-every-transfer',
    title: 'Why You Must Compare Before Every Transfer',
    excerpt: 'Even on the same transfer, the difference between providers can be hundreds of dollars. Here\'s why you must compare before every transfer.',
    categoryKey: 'money-transfer-basics',
    readTime: '5 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'hidden-exchange-rate-fees-explained',
    title: 'Hidden Fees Explained (FX Markup vs Fee)',
    excerpt: 'Learn the difference between FX markup and transfer fees, and why "no fee" doesn\'t mean no cost.',
    categoryKey: 'fees-hidden-costs',
    readTime: '6 min read',
    level: 'Intermediate',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'how-to-read-remittance-quote',
    title: 'How to Read a Quote ("Recipient Gets")',
    excerpt: 'Understand what "Recipient Gets" really means and how to compare quotes effectively.',
    categoryKey: 'money-transfer-basics',
    readTime: '5 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'why-checkout-price-differs',
    title: 'Why Checkout Differs and What to Do',
    excerpt: 'Why the final price at checkout might differ from the quote, and what you can do about it.',
    categoryKey: 'fees-hidden-costs',
    readTime: '4 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'bank-transfer-vs-card-vs-cash-pickup',
    title: 'Bank Transfer vs Card vs Cash Pickup',
    excerpt: 'Compare different transfer methods: bank transfer, card payment, and cash pickup options.',
    categoryKey: 'money-transfer-basics',
    readTime: '7 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'how-fast-is-international-money-transfer',
    title: 'How Long Transfers Take (Speed Buckets)',
    excerpt: 'Understand transfer speed buckets: instant, same-day, next-day, and multi-day transfers.',
    categoryKey: 'speed-delivery',
    readTime: '5 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'best-time-to-send-money',
    title: 'Best Time to Send Money',
    excerpt: 'Practical guidance on when to send money, without over-optimizing for rate movements.',
    categoryKey: 'exchange-rates-timing',
    readTime: '6 min read',
    level: 'Intermediate',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'promo-codes-intro-rates',
    title: 'Promo Rates and "$0 Fee" Traps',
    excerpt: 'Understand promotional rates, introductory offers, and "$0 fee" marketing traps.',
    categoryKey: 'fees-hidden-costs',
    readTime: '5 min read',
    level: 'Intermediate',
    lastUpdated: 'December 2024',
  },
]

const startHereGuides = computed(() => {
  const slugs = [
    'why-compare-before-every-transfer',
    'hidden-exchange-rate-fees-explained',
    'how-to-read-remittance-quote',
    'why-checkout-price-differs',
  ]
  return allGuides.value
    .filter(g => slugs.includes(g.slug))
    .map(g => ({
      ...g,
      title: g.title || getTitleFromSlug(g.slug),
      excerpt: g.excerpt || getExcerptFromSlug(g.slug),
      readTime: g.readTime || '5 min read',
    }))
})

const getTitleFromSlug = (slug: string): string => {
  const titles: Record<string, string> = {
    'why-compare-before-every-transfer': 'Why You Must Compare Before Every Transfer',
    'hidden-exchange-rate-fees-explained': 'Hidden Fees Explained (FX Markup vs Fee)',
    'how-to-read-remittance-quote': 'How to Read a Quote ("Recipient Gets")',
    'why-checkout-price-differs': 'Why Checkout Differs and What to Do',
    'bank-transfer-vs-card-vs-cash-pickup': 'Bank Transfer vs Card vs Cash Pickup',
    'how-fast-is-international-money-transfer': 'How Long Transfers Take (Speed Buckets)',
    'best-time-to-send-money': 'Best Time to Send Money',
    'promo-codes-intro-rates': 'Promo Rates and "$0 Fee" Traps',
  }
  return titles[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const getExcerptFromSlug = (slug: string): string => {
  const excerpts: Record<string, string> = {
    'why-compare-before-every-transfer': 'Even on the same transfer, the difference between providers can be hundreds of dollars. Here\'s why you must compare before every transfer.',
    'hidden-exchange-rate-fees-explained': 'Learn the difference between FX markup and transfer fees, and why "no fee" doesn\'t mean no cost.',
    'how-to-read-remittance-quote': 'Understand what "Recipient Gets" really means and how to compare quotes effectively.',
    'why-checkout-price-differs': 'Why the final price at checkout might differ from the quote, and what you can do about it.',
    'bank-transfer-vs-card-vs-cash-pickup': 'Compare different transfer methods: bank transfer, card payment, and cash pickup options.',
    'how-fast-is-international-money-transfer': 'Understand transfer speed buckets: instant, same-day, next-day, and multi-day transfers.',
    'best-time-to-send-money': 'Practical guidance on when to send money, without over-optimizing for rate movements.',
    'promo-codes-intro-rates': 'Understand promotional rates, introductory offers, and "$0 fee" marketing traps.',
  }
  return excerpts[slug] || 'Learn more about this topic in our comprehensive guide.'
}

const getArticlesByCategory = (categoryKey: string) => {
  const slugs = articleMapping[categoryKey] || []
  return allGuides.value
    .filter(g => g.categoryKey === categoryKey || slugs.includes(g.slug))
    .map(g => ({
      ...g,
      title: g.title || getTitleFromSlug(g.slug),
      excerpt: g.excerpt || getExcerptFromSlug(g.slug),
      readTime: g.readTime || '5 min read',
      level: g.level || 'Beginner',
    }))
}

const getCategoryArticleCount = (categoryKey: string) => {
  return getArticlesByCategory(categoryKey).length
}

const filteredGuides = computed(() => {
  let filtered = allGuides.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      g =>
        (g.title || '').toLowerCase().includes(query)
        || (g.excerpt || '').toLowerCase().includes(query)
        || (g.tags || []).some(tag => tag.toLowerCase().includes(query)),
    )
  }

  if (activeFilter.value !== 'all') {
    const filterMap: Record<string, string[]> = {
      'fees': ['fees-hidden-costs'],
      'speed': ['speed-delivery'],
      'safety': ['safety-scams'],
      'reviews': ['provider-reviews'],
      'comparisons': ['comparisons'],
      'corridors': ['corridor-playbooks'],
      'exchange-rates': ['exchange-rates-timing'],
    }
    const categories = filterMap[activeFilter.value] || []
    if (categories.length > 0) {
      const slugs = categories.flatMap(cat => articleMapping[cat] || [])
      filtered = filtered.filter(g => slugs.includes(g.slug))
    }
  }

  return filtered
})

const recentlyUpdatedGuides = computed(() => {
  return allGuides.value
    .filter(g => g.lastUpdated || g.date)
    .slice(0, 6)
    .map(g => ({
      ...g,
      title: g.title || getTitleFromSlug(g.slug),
      excerpt: g.excerpt || getExcerptFromSlug(g.slug),
      readTime: g.readTime || '5 min read',
    }))
})

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }
}

setSeo({
  title: 'Money Transfer Guides & Reviews | Remit-Scout',
  description:
    'Comprehensive guides on money transfers, fees, hidden costs, provider reviews, comparisons, and corridor playbooks. Learn how to send money smarter and avoid costly mistakes.',
})
</script>
