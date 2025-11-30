<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <div class="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <Breadcrumbs :items="breadcrumbItems" />

      <!-- Hero Section with Background -->
      <section class="relative mb-16 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-16 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50/30">
        <!-- Animated Background -->
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/20 via-blue-300/15 to-transparent blur-3xl animate-pulse" />
          <div class="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-400/20 via-emerald-300/15 to-transparent blur-3xl animate-pulse" style="animation-delay: 1.5s;" />

          <!-- Animated Arrows -->
          <svg class="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
            <path d="M150,150 Q300,100 450,150 T750,150" stroke="#2563EB" stroke-width="2" fill="none" style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 8s ease-in-out infinite;" />
            <path d="M200,300 Q400,250 600,300 T1000,300" stroke="#10b981" stroke-width="2" fill="none" style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 10s ease-in-out infinite 1s;" />
            <path d="M100,400 Q250,350 400,400 T700,400" stroke="#2563EB" stroke-width="1.5" fill="none" style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 9s ease-in-out infinite 0.5s;" />
          </svg>
        </div>

        <div class="relative z-10 text-center">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Expert Learning Hub
          </div>
          <h1 class="text-5xl font-bold text-neutral-900 sm:text-6xl mb-6 leading-tight">
            Master International<br>Money Transfers
          </h1>
          <p class="mx-auto max-w-3xl text-xl text-neutral-600 mb-8 leading-relaxed">
            From exchange rates to banking abroad—everything you need to send money smarter, stay connected, and protect your finances while living or traveling internationally.
          </p>

          <!-- Trust Indicators -->
          <div class="flex flex-wrap items-center justify-center gap-6">
            <div class="flex items-center gap-2 text-sm text-neutral-600">
              <svg class="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="font-medium">Expert tested</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-neutral-600">
              <svg class="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="font-medium">Updated regularly</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-neutral-600">
              <svg class="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="font-medium">{{ guides.length }} in-depth guides</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Equal Size Category Cards -->
      <section class="mb-16">
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Money Transfer Basics -->
          <NuxtLink
            to="/learn/money-transfer"
            class="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300 hover:-translate-y-1 flex flex-col"
          >
            <span class="text-4xl mb-3 block" aria-hidden="true">💸</span>
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              Money transfer basics
            </h3>
            <p class="text-sm text-neutral-600 mb-4 flex-1">
              {{ categoryCount('money-transfer-basics') }} guides
            </p>
            <span class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
              Browse
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>

          <!-- Banking Abroad -->
          <NuxtLink
            to="/learn/banking-abroad"
            class="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300 hover:-translate-y-1 flex flex-col"
          >
            <span class="text-4xl mb-3 block" aria-hidden="true">🏦</span>
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              Banking abroad
            </h3>
            <p class="text-sm text-neutral-600 mb-4 flex-1">
              {{ categoryCount('banking-abroad') }} guides
            </p>
            <span class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
              Browse
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>

          <!-- Staying Connected -->
          <NuxtLink
            to="/learn/staying-connected"
            class="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300 hover:-translate-y-1 flex flex-col"
          >
            <span class="text-4xl mb-3 block" aria-hidden="true">📱</span>
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              Staying connected
            </h3>
            <p class="text-sm text-neutral-600 mb-4 flex-1">
              {{ categoryCount('staying-connected') }} guides
            </p>
            <span class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
              Browse
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>

          <!-- Health Insurance -->
          <NuxtLink
            to="/learn/health-insurance"
            class="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300 hover:-translate-y-1 flex flex-col"
          >
            <span class="text-4xl mb-3 block" aria-hidden="true">🏥</span>
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              Health & insurance
            </h3>
            <p class="text-sm text-neutral-600 mb-4 flex-1">
              {{ categoryCount('health-insurance') }} guides
            </p>
            <span class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
              Browse
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>
        </div>
      </section>

      <!-- View All Guides CTA - Full Width -->
      <section class="mb-16">
        <NuxtLink
          to="/learn/all"
          class="group relative overflow-hidden rounded-3xl border-2 border-brand-600 bg-gradient-to-br from-brand-600 to-blue-600 p-12 shadow-2xl transition-all hover:shadow-[0_20px_60px_-15px_rgba(37,99,235,0.5)] hover:scale-[1.01] flex flex-col items-center text-center"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-transparent to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span class="text-7xl mb-6 block relative z-10" aria-hidden="true">📖</span>
          <div class="inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-bold text-white mb-4 relative z-10">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            {{ guides.length }}+ Expert Articles
          </div>
          <h2 class="text-4xl sm:text-5xl font-bold text-white mb-4 relative z-10">
            View All Guides
          </h2>
          <p class="text-xl text-white/95 mb-8 max-w-2xl relative z-10 leading-relaxed">
            Browse our complete library of expert guides covering money transfers, banking abroad, staying connected, and health insurance.
          </p>
          <span class="inline-flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-lg font-bold text-brand-600 shadow-xl group-hover:bg-blue-50 group-hover:gap-4 transition-all relative z-10">
            Explore All Articles
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </NuxtLink>
      </section>

      <!-- Category Sections -->
      <div class="space-y-16 mb-16">
        <section
          v-for="cat in categories"
          :id="cat.key"
          :key="cat.key"
          class="scroll-mt-20"
        >
          <div class="mb-8">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-4">
                <span class="text-4xl" aria-hidden="true">{{ cat.icon }}</span>
                <div class="flex-1">
                  <h2 class="text-3xl font-bold text-neutral-900">
                    {{ cat.name }}
                  </h2>
                  <p class="text-neutral-600 mt-1">
                    {{ cat.description }}
                  </p>
                </div>
              </div>
              <NuxtLink
                :to="getCategoryUrl(cat.key)"
                class="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 shadow-sm hover:bg-brand-50 hover:border-brand-300 transition-all whitespace-nowrap"
              >
                Show all
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </NuxtLink>
            </div>
            <div class="h-1 w-24 bg-gradient-to-r from-brand-600 to-blue-600 rounded-full" />
          </div>

          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="guide in guides.filter(g => g.categoryKey === cat.key).slice(0, 6)"
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
      </div>
    </div>

    <!-- Trust Metrics Strip -->
    <TrustMetricsStrip />

    <!-- Why Trust RemitScout - EEAT Section -->
    <section class="py-12 sm:py-16 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 lg:p-12 shadow-2xl text-white">
          <div class="text-center mb-10">
            <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Trust Remit-Scout
            </h2>
            <p class="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
              Experience, Expertise, Authoritativeness, and Trustworthiness verified through real transfers and transparent methodology
            </p>
          </div>

          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
            <!-- Experience -->
            <div class="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                <span class="text-3xl">👥</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">
                Experience
              </h3>
              <p class="text-sm text-white/90 leading-relaxed mb-3">
                Built by expats who send money home regularly.
                <NuxtLink
                  to="/about"
                  class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                >
                  Learn about our founder
                </NuxtLink>
                and real-world testing across 150+ corridors.
              </p>
              <div class="text-xs text-white/70">
                250,000+ users trust our comparisons
              </div>
            </div>

            <!-- Expertise -->
            <div class="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                <span class="text-3xl">🎓</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">
                Expertise
              </h3>
              <p class="text-sm text-white/90 leading-relaxed mb-3">
                Backed by <strong>Carnegie Mellon's Swartz Entrepreneurship Program</strong>. Data-driven methodology verified through 30+ licensed providers.
              </p>
              <div class="text-xs text-white/70">
                Academic rigor applied to every guide
              </div>
            </div>

            <!-- Authoritativeness -->
            <div class="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                <span class="text-3xl">✅</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">
                Authoritativeness
              </h3>
              <p class="text-sm text-white/90 leading-relaxed mb-3">
                Licensed provider verification (FCA, FinCEN, ASIC). Real transfer receipts.
                <NuxtLink
                  to="/methodology"
                  class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                >
                  Transparent methodology
                </NuxtLink>
                reviewed against live data.
              </p>
              <div class="text-xs text-white/70">
                Only regulated providers included
              </div>
            </div>

            <!-- Trustworthiness -->
            <div class="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                <span class="text-3xl">🔒</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">
                Trustworthiness
              </h3>
              <p class="text-sm text-white/90 leading-relaxed mb-3">
                100% independent rankings.
                <NuxtLink
                  to="/how-we-make-money"
                  class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                >
                  Revenue disclosure
                </NuxtLink>
                transparent. Affiliate commissions never influence rankings.
              </p>
              <div class="text-xs text-white/70">
                $2.5M+ saved by users
              </div>
            </div>
          </div>

          <div class="rounded-2xl border-2 border-white/20 bg-white/10 p-6 backdrop-blur mb-6">
            <div class="flex items-start gap-4">
              <svg
                class="h-8 w-8 flex-shrink-0 text-white mt-1"
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
              <div>
                <h3 class="text-xl font-bold mb-2">
                  Transparency & Verification
                </h3>
                <p class="text-sm text-white/90 leading-relaxed mb-3">
                  Every comparison is backed by real transfer data. Methodology reviewed by
                  <NuxtLink
                    to="/about"
                    class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                  >
                    Omar Ghabayen
                  </NuxtLink>
                  (CMU Swartz Entrepreneurship Program). See our
                  <NuxtLink
                    to="/how-we-make-money"
                    class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                  >
                    affiliate disclosure
                  </NuxtLink>
                  and
                  <NuxtLink
                    to="/privacy"
                    class="font-semibold text-white underline decoration-white/50 hover:decoration-white"
                  >
                    privacy policy
                  </NuxtLink>.
                </p>
              </div>
            </div>
          </div>

          <!-- Internal Links for E-E-A-T -->
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-center">
            <NuxtLink
              to="/about"
              class="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              About the Founder
            </NuxtLink>
            <NuxtLink
              to="/how-we-make-money"
              class="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Revenue Model
            </NuxtLink>
            <NuxtLink
              to="/providers"
              class="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Verified Providers
            </NuxtLink>
            <NuxtLink
              to="/faq"
              class="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              FAQs
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { setSeo } from '~/composables/useSeo'
import { useArticles } from '~/composables/useArticles'

const { data: articles } = await useArticles()

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
]

const categories = [
  {
    key: 'money-transfer-basics',
    name: 'Money transfer basics',
    description: 'FX, fees, timing, safety, and how comparisons work.',
    icon: '💸',
  },
  {
    key: 'banking-abroad',
    name: 'Banking abroad',
    description: 'Accounts, local rails, ATMs, and compliance overseas.',
    icon: '🏦',
  },
  {
    key: 'staying-connected',
    name: 'Staying connected',
    description: 'eSIMs, messaging, and keeping your login secure while traveling.',
    icon: '📡',
  },
  {
    key: 'health-insurance',
    name: 'Health & insurance',
    description: 'Travel/health cover, claims, and paying medical bills abroad.',
    icon: '🩺',
  },
]

const guides = computed(() => articles.value || [])

const categorySlugMap: Record<string, string> = {
  'money-transfer-basics': 'money-transfer',
  'banking-abroad': 'banking-abroad',
  'staying-connected': 'staying-connected',
  'health-insurance': 'health-insurance',
}

const getCategoryUrl = (key: string) => `/learn/${categorySlugMap[key] || key}`

const categoryCount = (key: string) => guides.value.filter(g => g.categoryKey === key).length

setSeo({
  title: 'Money Transfer Guides | Learn Hub | Remit-Scout',
  description:
    'Browse Remit-Scout guides by topic: money transfer basics, banking abroad, staying connected, and health & insurance. View all guides in one grid.',
})
</script>

<style scoped>
@keyframes drawPath {
  0% {
    stroke-dashoffset: 1000;
  }
  100% {
    stroke-dashoffset: 0;
  }
}
</style>
