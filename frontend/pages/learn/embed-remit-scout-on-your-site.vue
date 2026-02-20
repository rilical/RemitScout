<template>
  <div class="min-h-screen bg-surface">


    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-surface py-16 lg:py-24">
      <div class="mx-auto max-w-page px-page-x">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-surface px-4 py-2 text-body-sm font-semibold text-brand-700 shadow-md mb-6">
            <span>🔗</span>
            For Publishers & Platforms
          </div>
          <h1 class="text-hero font-bold tracking-tight text-neutral-900 mb-6">
            Embed Remit‑Scout on Your Site
          </h1>
          <p class="text-h4 text-neutral-600 font-medium mb-6 leading-relaxed">
            Widgets and Editorial Independence
          </p>
          <p class="text-body-lg text-neutral-700 leading-relaxed mb-6">
            A guide for publishers, platforms, and developers who want to integrate Remit-Scout comparisons while maintaining our commitment to independent rankings.
          </p>
          <div class="flex items-center gap-4 text-body-sm text-neutral-600">
            <span>10 min read</span>
            <span>•</span>
            <span>Updated December 2024</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16 lg:py-20 bg-surface">
      <div class="mx-auto max-w-4xl px-page-x">
        <div class="prose prose-lg max-w-none">
          <div class="mb-12 rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
            <h2 class="text-h4 font-bold text-neutral-900 mb-3">
              Quick takeaways
            </h2>
            <ul class="space-y-2 text-body text-neutral-700">
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Widgets deliver live comparisons while preserving editorial independence.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Partners can customize layout and styling, not rankings or Remit-Score.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Ideal for publishers, fintech apps, community portals, and research platforms.</span>
              </li>
            </ul>
          </div>
          <!-- Widget Examples -->
          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              Widget Examples
            </h2>
            <p class="text-body text-neutral-700 leading-relaxed mb-6">
              We offer embeddable comparison widgets that you can integrate into your site or app. These widgets show live rates and rankings, updated automatically.
            </p>
            <div class="rounded-2xl border-2 border-neutral-200 bg-neutral-50 p-6 mb-6">
              <div class="text-body-sm font-semibold text-neutral-600 mb-2">
                Example Widget
              </div>
              <div class="bg-surface rounded-lg p-4 border border-neutral-200">
                <div class="text-center py-8 text-neutral-400">
                  [Comparison Widget Preview]
                </div>
              </div>
            </div>
            <p class="text-body-sm text-neutral-600">
              Widgets are responsive, customizable, and can be styled to match your site's design.
            </p>
          </div>

          <!-- White-Label Rules -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-neutral-50 p-8 lg:p-12">
            <h2 class="text-h3 font-bold text-neutral-900 mb-4">
              White-Label Rules
            </h2>
            <div class="space-y-4">
              <div class="rounded-xl border border-brand-200 bg-surface p-5">
                <h3 class="text-body font-bold text-neutral-900 mb-2">
                  ✓ What Partners Can Customize
                </h3>
                <ul class="space-y-1 text-body-sm text-neutral-700 list-disc list-inside">
                  <li>Widget colors and styling</li>
                  <li>Default corridors shown</li>
                  <li>Layout and positioning</li>
                </ul>
              </div>
              <div class="rounded-xl border border-danger-200 bg-danger-50 p-5">
                <h3 class="text-body font-bold text-neutral-900 mb-2">
                  ✗ What Partners Cannot Change
                </h3>
                <ul class="space-y-1 text-body-sm text-neutral-700 list-disc list-inside">
                  <li>Rankings or sort order</li>
                  <li>Remit-Score values</li>
                  <li>Provider inclusion/exclusion</li>
                  <li>Score calculation methodology</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Integration Checklist -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              Integration Checklist
            </h2>
            <p class="text-body text-neutral-700 leading-relaxed mb-6">
              A simple path to launch: confirm corridors, embed the widget, and validate quotes before going live.
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-xl border border-neutral-200 bg-surface p-5">
                <p class="text-body-sm font-semibold text-neutral-900 mb-2">
                  1) Scope & corridors
                </p>
                <p class="text-body-sm text-neutral-700">
                  Choose the corridors, amounts, and payout methods you want to show by default.
                </p>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-surface p-5">
                <p class="text-body-sm font-semibold text-neutral-900 mb-2">
                  2) Embed & styling
                </p>
                <p class="text-body-sm text-neutral-700">
                  Drop in the widget, align styles, and place disclosures where required.
                </p>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-surface p-5">
                <p class="text-body-sm font-semibold text-neutral-900 mb-2">
                  3) QA & validation
                </p>
                <p class="text-body-sm text-neutral-700">
                  We verify live quotes against provider checkout for the default scenarios.
                </p>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-surface p-5">
                <p class="text-body-sm font-semibold text-neutral-900 mb-2">
                  4) Launch & monitoring
                </p>
                <p class="text-body-sm text-neutral-700">
                  Monitor performance and corridor coverage as your audience grows.
                </p>
              </div>
            </div>
          </div>

          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>

          <!-- Use Cases -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              Use Cases
            </h2>
            <div class="grid gap-6 md:grid-cols-2">
              <div class="rounded-2xl border-2 border-neutral-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  📰 News Sites
                </h3>
                <p class="text-body-sm text-neutral-700 leading-relaxed">
                  Embed comparison widgets in articles about remittances, exchange rates, or financial news. Provide readers with actionable tools.
                </p>
              </div>
              <div class="rounded-2xl border-2 border-neutral-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  💻 Fintech Apps
                </h3>
                <p class="text-body-sm text-neutral-700 leading-relaxed">
                  Embed our comparison module inside your app. White-label the experience while maintaining independent rankings.
                </p>
              </div>
              <div class="rounded-2xl border-2 border-neutral-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  🌐 Expat Communities
                </h3>
                <p class="text-body-sm text-neutral-700 leading-relaxed">
                  Add comparison tools to community forums or websites. Help members find the best rates for their specific corridors.
                </p>
              </div>
              <div class="rounded-2xl border-2 border-neutral-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  📊 Research Platforms
                </h3>
                <p class="text-body-sm text-neutral-700 leading-relaxed">
                  Use our data feeds for academic research, market analysis, or financial reporting. Access aggregated, anonymized insights.
                </p>
              </div>
            </div>
          </div>

          <!-- What Partners Can't Influence -->
          <div class="mb-12 rounded-3xl border-2 border-success-500 bg-success-50 p-8 lg:p-12">
            <h2 class="text-h3 font-bold text-neutral-900 mb-4">
              What Partners Can and Can't Influence
            </h2>
            <p class="text-body font-semibold text-neutral-900 mb-4">
              Spoiler: Rankings Never Change
            </p>
            <div class="space-y-4">
              <div class="rounded-xl border border-success-600 bg-surface p-4">
                <h3 class="text-body font-bold text-neutral-900 mb-2">
                  ✓ Partners Can:
                </h3>
                <ul class="space-y-1 text-body-sm text-neutral-700 list-disc list-inside">
                  <li>Customize widget appearance</li>
                  <li>Choose default corridors</li>
                  <li>Set up white-label branding</li>
                  <li>Request a white-label embed</li>
                </ul>
              </div>
              <div class="rounded-xl border border-danger-200 bg-danger-50 p-4">
                <h3 class="text-body font-bold text-neutral-900 mb-2">
                  ✗ Partners Cannot:
                </h3>
                <ul class="space-y-1 text-body-sm text-neutral-700 list-disc list-inside">
                  <li>Change provider rankings</li>
                  <li>Modify Remit-Score values</li>
                  <li>Hide or promote specific providers</li>
                  <li>Alter score calculation methodology</li>
                  <li>Pay to improve their own ranking (if they're a provider)</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
              Interested in Integration?
            </h3>
            <p class="text-body text-neutral-700 leading-relaxed mb-4">
              Contact us to discuss widget integration or data licensing. We work with publishers, platforms, and researchers who share our commitment to transparency.
            </p>
            <div class="flex flex-wrap gap-4">
              <NuxtLink
                to="/contact?type=platform&topic=widget"
                class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-body font-semibold text-white shadow-md hover:bg-brand-700 transition-all"
              >
                Request Widget Access
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </NuxtLink>
              <NuxtLink
                to="/partnerships"
                class="inline-flex items-center gap-2 rounded-xl border-2 border-brand-600 bg-surface px-6 py-3 text-body font-semibold text-brand-600 hover:bg-brand-50 transition-all"
              >
                Learn About Partnerships
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Guides -->
    <section class="py-16 lg:py-20 bg-brand-600">
      <div class="mx-auto max-w-page px-page-x">
        <h2 class="text-h2 font-bold text-white mb-8 text-center">
          Related Guides
        </h2>
        <div class="grid gap-6 md:grid-cols-3">
          <NuxtLink
            to="/partnerships"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15"
          >
            <h3 class="text-body-lg font-bold text-white mb-3">
              Partnerships
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Learn about our partnership program and how we work with providers and publishers.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-white group-hover:gap-2 motion-safe:transition-all">
              Read guide <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </span>
          </NuxtLink>
          <NuxtLink
            to="/legal/how-we-make-money"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15"
          >
            <h3 class="text-body-lg font-bold text-white mb-3">
              How We Make Money
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              See how we offer B2B products while maintaining editorial independence.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-white group-hover:gap-2 motion-safe:transition-all">
              Read guide <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </span>
          </NuxtLink>
          <NuxtLink
            to="/learn/how-remit-score-works"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15"
          >
            <h3 class="text-body-lg font-bold text-white mb-3">
              How Remit-Score Works
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Understand our scoring methodology and why rankings can't be influenced.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-white group-hover:gap-2 motion-safe:transition-all">
              Read guide <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Guides', path: '/learn' },
  { name: 'For Publishers', path: '/learn/embed-remit-scout-on-your-site' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

const seoTitle = 'Embed Remit-Scout on Your Site: Widgets and Editorial Independence | Remit-Scout'
const seoDescription = 'Guide for publishers and platforms: widget examples, white-label rules, use cases, and how we maintain independent rankings.'

defineOgImage({
  component: 'OgImageArticle',
  props: {
    title: seoTitle.replace(/\s*\|\s*Remit-Scout\s*$/, ''),
    category: 'Learn',
    readTime: '10 min read',
  },
})

setSeo({
  title: seoTitle,
  description: seoDescription,
  canonical: `${siteUrl}/learn/embed-remit-scout-on-your-site`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'For Publishers', url: `${siteUrl}/learn/embed-remit-scout-on-your-site` },
])
</script>
