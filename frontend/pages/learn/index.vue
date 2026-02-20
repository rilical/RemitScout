<template>
  <div class="min-h-screen bg-surface">
    <CompareWidget />

    <!-- Hero Section with Search -->
    <section class="relative overflow-hidden bg-neutral-900 py-16 lg:py-24">
      <div class="mx-auto max-w-page px-page-x">
        <Breadcrumbs
          :items="breadcrumbItems"
          :dark="true"
        />

        <div class="mt-12">
          <div class="text-center mb-12">
            <div class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface/10 px-4 py-2 text-body-sm font-semibold text-white shadow-md mb-6">
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
            <h1 class="text-hero font-bold tracking-tight text-white mb-6">
              Money Transfer <span class="text-brand-600">Guides</span>
            </h1>
            <p class="text-h4 text-white font-medium mb-8 leading-relaxed max-w-3xl mx-auto">
              Everything you need to send money smarter, compare providers, and avoid hidden fees.
            </p>

            <!-- Filters -->
            <div class="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
              <button
                v-for="filter in filters"
                :key="filter.key"
                :class="[
                  'px-4 py-2 rounded-full text-body-sm font-semibold motion-safe:transition-all',
                  activeFilter === filter.key
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-surface/10 border-2 border-white/20 text-white hover:border-brand-400 hover:bg-surface/15',
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
      <div class="mx-auto max-w-page px-page-x">
        <TrustBadgesRow
          :dark="false"
          :badges="reviewBadges"
          :cta="reviewCta"
        />
      </div>
    </section>

    <!-- Start Here Section -->
    <section class="py-16 lg:py-20 bg-surface">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-12">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-surface px-4 py-2 text-body-sm font-semibold text-brand-600 shadow-md mb-6">
            New User Path
          </div>
          <h2 class="text-h2 font-bold text-neutral-900 mb-4">
            Start Here
          </h2>
          <p class="text-body-lg text-neutral-600 max-w-2xl">
            First-time visitor? Start with these essential guides to understand money transfers and avoid costly mistakes.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in startHereGuides"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-surface p-6 shadow-sm motion-safe:transition-all hover:shadow-xl hover:border-brand-300 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-success-100 px-3 py-1.5 text-body-sm font-semibold text-success-700">
                Beginner
              </span>
              <span class="text-body-sm text-neutral-500">
                {{ guide.readTime || '5 min read' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-h4 font-bold text-neutral-900 hover:text-brand-600 motion-safe:transition-colors mb-3"
            >
              <RichHtml
tag="span"
:content="guide.title"
/>
            </NuxtLink>
            <p class="text-body-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 motion-safe:transition-all"
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
      <div class="mx-auto max-w-page px-page-x">
        <div class="text-center mb-12">
          <h2 class="text-h2 font-bold text-brand-600 mb-4">
            Browse by Category
          </h2>
          <p class="text-body-lg text-neutral-600 max-w-2xl mx-auto">
            Explore our guides organized by topic to find exactly what you need
          </p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch max-w-4xl mx-auto">
          <button
            v-for="cat in categories"
            :key="cat.key"
            type="button"
            class="group rounded-2xl border-2 border-neutral-200 bg-surface p-6 shadow-sm motion-safe:transition-all hover:shadow-xl hover:border-brand-300 hover:-translate-y-1 flex flex-col cursor-pointer text-left w-full h-full"
            @click="scrollToSection(cat.key)"
          >
            <div
              class="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-brand-600"
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
            <h3 class="text-body-lg font-bold text-neutral-900 mb-2 text-center">
              {{ cat.name }}
            </h3>
            <p class="text-body-sm text-neutral-600 mb-4 flex-1 text-center">
              {{ getCategoryArticleCount(cat.key) }} guides
            </p>
            <span class="inline-flex items-center justify-center gap-1 text-body-sm font-semibold text-brand-600 group-hover:gap-2 motion-safe:transition-all">
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
      class="py-16 lg:py-20 bg-surface scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-10">
          <div class="flex items-center gap-4 mb-6">
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-brand-600"
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
              <h2 class="text-h2 font-bold text-neutral-900">
                Money Transfer Basics
              </h2>
              <p class="text-neutral-600 mt-1">
                Understand the mechanics and choices: bank transfer vs card vs wallet, cash pickup vs bank deposit, speed, and policies.
              </p>
            </div>
          </div>
          <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-brand-600 rounded-full" />
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in getArticlesByCategory('money-transfer-basics')"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-surface p-6 shadow-sm motion-safe:transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-body-sm font-semibold text-brand-700">
                {{ guide.level || 'Beginner' }}
              </span>
              <span class="text-body-sm text-neutral-500">
                {{ guide.readTime || '5 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-h4 font-bold text-neutral-900 hover:text-brand-600 motion-safe:transition-colors mb-3"
            >
              <RichHtml
tag="span"
:content="guide.title"
/>
            </NuxtLink>
            <p class="text-body-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-end pt-4 border-t border-neutral-100">
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 motion-safe:transition-all"
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
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-10">
          <div class="flex items-center gap-4 mb-6">
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-brand-600"
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
              <div class="inline-flex items-center gap-2 rounded-full bg-brand-600/10 px-3 py-1 text-body-sm font-semibold text-brand-700 mb-2">
                Pricing 101
              </div>
              <h2 class="text-h2 font-bold text-neutral-900">
                Fees & Hidden Costs
              </h2>
              <p class="text-neutral-600 mt-1">
                Own the "truth about fees" category. Learn about FX markup, mid-market rates, promo rates, and "$0 fee" traps.
              </p>
            </div>
          </div>
          <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-brand-600 rounded-full" />
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in getArticlesByCategory('fees-hidden-costs')"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-surface p-6 shadow-sm motion-safe:transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-body-sm font-semibold text-brand-700">
                {{ guide.level || 'Intermediate' }}
              </span>
              <span class="text-body-sm text-neutral-500">
                {{ guide.readTime || '5 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-h4 font-bold text-neutral-900 hover:text-brand-600 motion-safe:transition-colors mb-3"
            >
              <RichHtml
tag="span"
:content="guide.title"
/>
            </NuxtLink>
            <p class="text-body-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-end pt-4 border-t border-neutral-100">
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 motion-safe:transition-all"
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
      class="py-16 lg:py-20 bg-surface scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-10">
          <div class="flex items-center gap-4 mb-6">
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-brand-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h2 class="text-h2 font-bold text-neutral-900">
                Provider Reviews
              </h2>
              <p class="text-neutral-600 mt-1">
                Individual provider reviews: fees, FX, speed, supported corridors, pros/cons, and who it's best for.
              </p>
            </div>
          </div>
          <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-brand-600 rounded-full" />
        </div>

	        <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 mb-8">
	          <p class="text-body-sm text-neutral-700">
	            <strong class="font-semibold text-neutral-900">Note:</strong>
	            Reviews are editorial; rankings come from data. See our
	            <NuxtLink
	              to="/methodology"
	              class="text-brand-600 hover:text-brand-700 underline"
	            >
	              review policy
	            </NuxtLink>
	            for how we test and verify providers.
	          </p>
	        </div>

        <!-- View All Providers CTA -->
        <div class="mb-10">
          <NuxtLink
            to="/learn/providers"
            class="group relative block overflow-hidden rounded-3xl border-2 border-neutral-200 bg-gradient-to-br from-white via-white to-brand-50 p-8 shadow-lg motion-safe:transition-all hover:shadow-2xl hover:border-brand-300 hover:-translate-y-1"
          >
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-body-sm font-bold text-white shadow-md">
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
                  class="h-8 w-8 text-brand-600 transform motion-safe:transition-transform group-hover:translate-x-2"
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
              <h3 class="text-h3 font-bold text-neutral-900 mb-3">
                View All Providers & Read Full Reviews
              </h3>
              <p class="text-body text-neutral-600 mb-6 leading-relaxed max-w-3xl">
                Browse our complete directory of money transfer providers. Compare fees, exchange rates, transfer speeds, supported corridors, and read in-depth editorial reviews to find the best service for your needs.
              </p>
              <div class="flex flex-wrap gap-4 text-body-sm">
                <div class="flex items-center gap-2 text-neutral-700">
                  <svg
                    class="h-5 w-5 text-brand-600"
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
                    class="h-5 w-5 text-brand-600"
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
                    class="h-5 w-5 text-brand-600"
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
            <div class="absolute bottom-0 left-0 w-48 h-48 bg-primary-200 rounded-full opacity-20 blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          </NuxtLink>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in getArticlesByCategory('provider-reviews')"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-surface p-6 shadow-sm motion-safe:transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-body-sm font-semibold text-brand-700">
                Review
              </span>
              <span class="text-body-sm text-neutral-500">
                {{ guide.readTime || '10 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-h4 font-bold text-neutral-900 hover:text-brand-600 motion-safe:transition-colors mb-3"
            >
              <RichHtml
tag="span"
:content="guide.title"
/>
            </NuxtLink>
            <p class="text-body-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-end pt-4 border-t border-neutral-100">
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 motion-safe:transition-all"
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
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-10">
          <div class="flex items-center gap-4 mb-6">
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-brand-600"
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
              <h2 class="text-h2 font-bold text-neutral-900">
                Speed & Delivery
              </h2>
              <p class="text-neutral-600 mt-1">
                Fastest ways to send money internationally: weekend cutoffs, banking hours, when cash pickup beats bank deposit, and what "ETA" really means.
              </p>
            </div>
          </div>
          <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-brand-600 rounded-full" />
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in getArticlesByCategory('speed-delivery')"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-surface p-6 shadow-sm motion-safe:transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-body-sm font-semibold text-brand-700">
                {{ guide.level || 'Beginner' }}
              </span>
              <span class="text-body-sm text-neutral-500">
                {{ guide.readTime || '5 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-h4 font-bold text-neutral-900 hover:text-brand-600 motion-safe:transition-colors mb-3"
            >
              <RichHtml
tag="span"
:content="guide.title"
/>
            </NuxtLink>
            <p class="text-body-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-end pt-4 border-t border-neutral-100">
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 motion-safe:transition-all"
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
      class="py-16 lg:py-20 bg-surface scroll-mt-20"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-10">
          <div class="flex items-center gap-4 mb-6">
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-brand-600"
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
              <h2 class="text-h2 font-bold text-neutral-900">
                Exchange Rates & Timing
              </h2>
              <p class="text-neutral-600 mt-1">
                Best time to send money, how to use rate history, setting target-rate alerts, and monthly sender strategy.
              </p>
            </div>
          </div>
          <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-brand-600 rounded-full" />
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in getArticlesByCategory('exchange-rates-timing')"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-surface p-6 shadow-sm motion-safe:transition-all hover:shadow-xl hover:border-brand-200 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="rounded-full bg-brand-50 px-3 py-1.5 text-body-sm font-semibold text-brand-700">
                {{ guide.level || 'Intermediate' }}
              </span>
              <span class="text-body-sm text-neutral-500">
                {{ guide.readTime || '5 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-h4 font-bold text-neutral-900 hover:text-brand-600 motion-safe:transition-colors mb-3"
            >
              <RichHtml
tag="span"
:content="guide.title"
/>
            </NuxtLink>
            <p class="text-body-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-end pt-4 border-t border-neutral-100">
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 motion-safe:transition-all"
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
    <section class="py-16 lg:py-20 bg-brand-600">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mb-12">
          <div class="inline-flex items-center gap-2 rounded-full bg-surface/20 backdrop-blur-sm px-4 py-2 text-body-sm font-semibold text-white mb-6">
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
          <h2 class="text-h2 font-bold text-white mb-4">
            Recently Updated
          </h2>
          <p class="text-body-lg text-white/90 max-w-2xl">
            International transfer info gets stale fast. Here are guides we've updated recently to ensure accuracy.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="guide in recentlyUpdatedGuides"
            :key="guide.slug"
            class="group flex flex-col rounded-2xl border-2 border-neutral-200 bg-surface p-6 shadow-sm motion-safe:transition-all hover:shadow-xl hover:border-brand-300 hover:-translate-y-1"
          >
            <div class="flex items-center gap-2 mb-4">
              <span class="text-body-sm text-neutral-500">
                {{ guide.readTime || '5 min' }}
              </span>
            </div>
            <NuxtLink
              :to="`/learn/${guide.slug}`"
              class="block text-h4 font-bold text-neutral-900 hover:text-brand-600 motion-safe:transition-colors mb-3"
            >
              <RichHtml
tag="span"
:content="guide.title"
/>
            </NuxtLink>
            <p class="text-body-sm text-neutral-600 leading-relaxed mb-4 flex-1">
              {{ guide.excerpt }}
            </p>
            <div class="flex items-center justify-end pt-4 border-t border-neutral-100">
              <NuxtLink
                :to="`/learn/${guide.slug}`"
                class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700 group-hover:gap-2 motion-safe:transition-all"
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

    <!-- Read Our Guides Section -->
    <section class="py-12 sm:py-16 bg-surface">
      <div class="mx-auto max-w-page px-page-x">
        <div class="text-center mb-12">
          <h2 class="text-h2 font-bold text-neutral-900 mb-4">
            Read Our Guides
          </h2>
          <p class="text-h4 text-neutral-600 font-medium mb-8 leading-relaxed max-w-3xl mx-auto">
            Everything you need to know about international money transfers
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <NuxtLink
            v-for="guide in startHereGuides"
            :key="guide.slug"
            :to="`/learn/${guide.slug}`"
            class="group bg-surface rounded-2xl border-2 border-neutral-200 overflow-hidden hover:border-brand-400 hover:shadow-xl motion-safe:transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
          >
            <div class="p-6 flex flex-col flex-1">
              <div class="flex items-center gap-2 mb-3">
                <span class="rounded-full bg-success-600/15 border border-success-600/30 px-3 py-1.5 text-body-sm font-semibold text-success-600">
                  Beginner
                </span>
                <span class="text-body-sm text-neutral-500">
                  {{ guide.readTime || '5 min read' }}
                </span>
              </div>
              <h3 class="text-body-lg font-bold text-neutral-900 mb-3 group-hover:text-brand-600 motion-safe:transition-colors">
                <RichHtml
                  tag="span"
                  :content="guide.title"
                />
              </h3>
              <p class="text-body-sm text-neutral-600 leading-relaxed mb-4 flex-1">
                {{ guide.excerpt }}
              </p>
              <div class="flex items-center gap-2 text-body-sm font-semibold text-brand-600 group-hover:gap-3 motion-safe:transition-all">
                <span>Read guide</span>
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
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

	    <!-- Research & Intelligence Section (Institutional) -->
	    <section class="py-16 lg:py-20 bg-neutral-900">
	      <div class="mx-auto max-w-page px-page-x">
	        <div class="mb-12">
	          <p class="text-body-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">
            For Transparency & Research
          </p>
          <h2 class="text-h2 font-bold text-white mb-4">
            Transparency & Research
          </h2>
          <p class="text-body-lg text-neutral-400 max-w-3xl">
            Open methodology, corrections policy, and data collection practices behind every comparison.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          <NuxtLink
            to="/research"
            class="group rounded-xl border border-neutral-700 bg-neutral-800/50 p-6 motion-safe:transition-all hover:border-brand-500/50 hover:bg-neutral-800 flex flex-col h-full"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
                <svg
                  class="w-5 h-5 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <h3 class="text-body-lg font-semibold text-white">Research & Data Practices</h3>
            </div>
            <p class="text-body-sm text-neutral-400 mb-4 flex-1">
              Transparency around data collection practices and provider partnership guidelines.
            </p>
            <div class="flex items-center gap-2 text-body-sm text-brand-600 font-medium group-hover:gap-3 motion-safe:transition-all">
              <span>Read research</span>
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
            </div>
          </NuxtLink>

          <NuxtLink
            to="/methodology"
            class="group rounded-xl border border-neutral-700 bg-neutral-800/50 p-6 motion-safe:transition-all hover:border-brand-500/50 hover:bg-neutral-800 flex flex-col h-full"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
                <svg
                  class="w-5 h-5 text-brand-600"
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
              <h3 class="text-body-lg font-semibold text-white">Data Methodology</h3>
            </div>
            <p class="text-body-sm text-neutral-400 mb-4 flex-1">
              Comprehensive documentation of our data collection, verification processes, and synthetic validation methodology.
            </p>
            <div class="flex items-center gap-2 text-body-sm text-brand-600 font-medium group-hover:gap-3 motion-safe:transition-all">
              <span>Read documentation</span>
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
            </div>
          </NuxtLink>

          <NuxtLink
            to="/corrections"
            class="group rounded-xl border border-neutral-700 bg-neutral-800/50 p-6 motion-safe:transition-all hover:border-brand-500/50 hover:bg-neutral-800 flex flex-col h-full"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
                <svg
                  class="w-5 h-5 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 class="text-body-lg font-semibold text-white">Corrections Policy</h3>
            </div>
            <p class="text-body-sm text-neutral-400 mb-4 flex-1">
              How we handle data corrections, error reporting, and accuracy reviews across the site.
            </p>
            <div class="flex items-center gap-2 text-body-sm text-brand-600 font-medium group-hover:gap-3 motion-safe:transition-all">
              <span>Read corrections</span>
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
            </div>
          </NuxtLink>
        </div>

        <div class="mt-10 pt-8 border-t border-neutral-700">
          <div class="flex flex-wrap items-center gap-6 text-body-sm text-rs-muted">
            <div class="flex items-center gap-2">
              <svg
                class="w-4 h-4 text-success-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Synthetically verified data</span>
            </div>
            <div class="flex items-center gap-2">
              <svg
                class="w-4 h-4 text-success-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Timestamped & auditable</span>
            </div>
            <div class="flex items-center gap-2">
              <svg
                class="w-4 h-4 text-success-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Audit-ready snapshots</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust Metrics Strip -->
    <TrustMetricsStrip />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChartBarIcon, DocumentTextIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import { useArticles } from '~/composables/useArticles'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import TrustBadgesRow from '~/components/shared/TrustBadgesRow.vue'
import { PROVIDER_SCORES } from '~/lib/providerScores'
import { LEARN_STATIC_ARTICLES } from '~/lib/learnStaticArticles'

type GuideArticle = {
  slug: string
  title: string
  excerpt: string
  category?: string
  categoryKey?: string
  readTime?: string
  level?: string
  author?: string
  date?: string
  lastUpdated?: string
  helpfulCount?: number
  tags?: string[]
  relatedArticles?: Array<{ slug: string, title: string, excerpt?: string }>
  faq?: Array<{ q: string, a: string }>
  content?: string
}

const { data: articles } = await useArticles()

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
]

const reviewBadges = [
  { label: 'No pay-to-rank', icon: ShieldCheckIcon, strong: true },
  { label: 'Data-driven', icon: ChartBarIcon, strong: true },
  { label: 'Disclosures shown', icon: DocumentTextIcon, strong: true },
]

const reviewCta = {
  label: 'Review policy →',
  to: '/methodology',
}

const activeFilter = ref('all')

const filters = [
  { key: 'all', label: 'All Topics' },
  { key: 'fees', label: 'Fees' },
  { key: 'reviews', label: 'Reviews' },
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
    key: 'exchange-rates-timing',
    name: 'Exchange Rates & Timing',
    icon: 'chart',
    color: 'green',
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

const allGuides = computed<GuideArticle[]>(() => {
  const markdownArticles = (articles.value || []) as GuideArticle[]
  const vueArticles: GuideArticle[] = staticArticles.map(article => ({
    ...article,
    category: getCategoryName(article.categoryKey || ''),
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
    'bank-transfer-vs-card-funding',
    'choose-right-delivery-method',
    'how-fast-is-international-money-transfer',
  ],
  'fees-hidden-costs': [
    'hidden-exchange-rate-fees-explained',
    'promo-codes-intro-rates',
    'why-checkout-price-differs',
  ],
  'exchange-rates-timing': [
    'how-exchange-rates-work',
    'best-time-to-send-money',
  ],
}

const staticArticles: GuideArticle[] = LEARN_STATIC_ARTICLES

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
    'hidden-exchange-rate-fees-explained': 'Hidden Fees Explained<br><span class="text-body font-normal">(FX Markup vs Fee)</span>',
    'how-to-read-remittance-quote': 'How to Read a Quote<br><span class="text-body font-normal">("Recipient Gets")</span>',
    'why-checkout-price-differs': 'Why Checkout Differs<br><span class="text-body font-normal">and What to Do</span>',
    'bank-transfer-vs-card-vs-cash-pickup': 'Bank Transfer vs Card vs Cash Pickup',
    'bank-transfer-vs-card-funding': 'Bank Transfer vs Card Funding: Which Is Cheaper (and When)?',
    'choose-right-delivery-method': 'Choose the Right Delivery Method: Bank Deposit vs Cash Pickup vs Mobile Money',
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
    'bank-transfer-vs-card-funding': 'Understand when bank transfer funding is cheaper than card funding, and when speed matters more than cost.',
    'choose-right-delivery-method': 'Learn which payout method works best for your needs: bank deposit, cash pickup, or mobile money.',
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
  if (categoryKey === 'provider-reviews') {
    return Object.keys(PROVIDER_SCORES).length
  }
  return getArticlesByCategory(categoryKey).length
}

const filteredGuides = computed(() => {
  let filtered = allGuides.value

  if (activeFilter.value !== 'all') {
    const filterMap: Record<string, string[]> = {
      'fees': ['fees-hidden-costs'],
      'reviews': ['provider-reviews'],
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

const { public: { siteUrl } } = useRuntimeConfig()

const seoTitle = 'Money Transfer Guides & Reviews | Remit-Scout'
const seoDescription = 'Comprehensive guides on money transfers, fees, hidden costs, provider reviews, and comparisons. Learn how to send money smarter and avoid costly mistakes.'

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Learn',
    description: seoDescription,
  },
})

useServerSeoMeta({
  title: seoTitle,
  description: seoDescription,
})

setSeo({
  title: seoTitle,
  description: seoDescription,
  canonical: `${siteUrl}/learn`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
])
</script>
