<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <span>🔗</span>
            For Publishers & Platforms
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            Embed Remit‑Scout on Your Site
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            Widgets, API, and How We Keep Editorial Independence
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            A guide for publishers, platforms, and developers who want to integrate Remit-Scout comparisons while maintaining our commitment to independent rankings.
          </p>
          <div class="flex items-center gap-4 text-sm text-neutral-600">
            <span>10 min read</span>
            <span>•</span>
            <span>Updated December 2024</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="prose prose-lg max-w-none">
          <!-- Widget Examples -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Widget Examples
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              We offer embeddable comparison widgets that you can integrate into your site or app. These widgets show live rates and rankings, updated automatically.
            </p>
            <div class="rounded-2xl border-2 border-neutral-200 bg-neutral-50 p-6 mb-6">
              <div class="text-sm font-semibold text-neutral-600 mb-2">Example Widget</div>
              <div class="bg-white rounded-lg p-4 border border-neutral-200">
                <div class="text-center py-8 text-neutral-400">
                  [Comparison Widget Preview]
                </div>
              </div>
            </div>
            <p class="text-sm text-neutral-600">
              Widgets are responsive, customizable, and can be styled to match your site's design.
            </p>
          </div>

          <!-- White-Label Rules -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-8 lg:p-12">
            <h2 class="text-2xl font-bold text-neutral-900 mb-4">
              White-Label Rules
            </h2>
            <div class="space-y-4">
              <div class="rounded-xl border border-brand-200 bg-white p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">✓ What Partners Can Customize</h3>
                <ul class="space-y-1 text-sm text-neutral-700 list-disc list-inside">
                  <li>Widget colors and styling</li>
                  <li>Default corridors shown</li>
                  <li>Layout and positioning</li>
                </ul>
              </div>
              <div class="rounded-xl border border-red-200 bg-red-50 p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">✗ What Partners Cannot Change</h3>
                <ul class="space-y-1 text-sm text-neutral-700 list-disc list-inside">
                  <li>Rankings or sort order</li>
                  <li>Remit-Score values</li>
                  <li>Provider inclusion/exclusion</li>
                  <li>Score calculation methodology</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- API Endpoints -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              API Endpoints (High Level)
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Our API provides programmatic access to comparison data, rate history, and provider information. Key endpoints include:
            </p>
            <div class="space-y-4">
              <div class="rounded-xl border border-neutral-200 bg-white p-5">
                <code class="text-sm font-mono text-brand-600">GET /api/v1/compare</code>
                <p class="text-sm text-neutral-700 mt-2">
                  Get live comparison results for a specific corridor and amount.
                </p>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-5">
                <code class="text-sm font-mono text-brand-600">GET /api/v1/providers</code>
                <p class="text-sm text-neutral-700 mt-2">
                  Retrieve provider information, Remit-Scores, and metadata.
                </p>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-5">
                <code class="text-sm font-mono text-brand-600">GET /api/v1/rates/history</code>
                <p class="text-sm text-neutral-700 mt-2">
                  Access historical rate data for trend analysis and charting.
                </p>
              </div>
            </div>
            <div class="mt-6 rounded-xl border-2 border-brand-200 bg-brand-50 p-5">
              <p class="text-sm text-neutral-700">
                <strong>Note:</strong> Full API documentation and authentication details are available to approved partners. Contact us for access.
              </p>
            </div>
          </div>

          <!-- Use Cases -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Use Cases
            </h2>
            <div class="grid gap-6 md:grid-cols-2">
              <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">📰 News Sites</h3>
                <p class="text-sm text-neutral-700 leading-relaxed">
                  Embed comparison widgets in articles about remittances, exchange rates, or financial news. Provide readers with actionable tools.
                </p>
              </div>
              <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">💻 Fintech Apps</h3>
                <p class="text-sm text-neutral-700 leading-relaxed">
                  Integrate our API to show money transfer options within your app. White-label the experience while maintaining independent rankings.
                </p>
              </div>
              <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">🌐 Expat Communities</h3>
                <p class="text-sm text-neutral-700 leading-relaxed">
                  Add comparison tools to community forums or websites. Help members find the best rates for their specific corridors.
                </p>
              </div>
              <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">📊 Research Platforms</h3>
                <p class="text-sm text-neutral-700 leading-relaxed">
                  Use our data feeds for academic research, market analysis, or financial reporting. Access aggregated, anonymized insights.
                </p>
              </div>
            </div>
          </div>

          <!-- What Partners Can't Influence -->
          <div class="mb-12 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-8 lg:p-12">
            <h2 class="text-2xl font-bold text-neutral-900 mb-4">
              What Partners Can and Can't Influence
            </h2>
            <p class="text-base font-semibold text-neutral-900 mb-4">
              Spoiler: Rankings Never Change
            </p>
            <div class="space-y-4">
              <div class="rounded-xl border border-emerald-200 bg-white p-4">
                <h3 class="text-base font-bold text-neutral-900 mb-2">✓ Partners Can:</h3>
                <ul class="space-y-1 text-sm text-neutral-700 list-disc list-inside">
                  <li>Customize widget appearance</li>
                  <li>Choose default corridors</li>
                  <li>Set up white-label branding</li>
                  <li>Access API for custom integrations</li>
                </ul>
              </div>
              <div class="rounded-xl border border-red-200 bg-red-50 p-4">
                <h3 class="text-base font-bold text-neutral-900 mb-2">✗ Partners Cannot:</h3>
                <ul class="space-y-1 text-sm text-neutral-700 list-disc list-inside">
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
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              Interested in Integration?
            </h3>
            <p class="text-base text-neutral-700 leading-relaxed mb-4">
              Contact us to discuss widget integration, API access, or data licensing. We work with publishers, platforms, and researchers who share our commitment to transparency.
            </p>
            <div class="flex flex-wrap gap-4">
              <NuxtLink
                to="/contact?type=platform&topic=widget"
                class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-brand-700 transition-all"
              >
                Request Widget Access
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </NuxtLink>
              <NuxtLink
                to="/partnerships"
                class="inline-flex items-center gap-2 rounded-xl border-2 border-brand-600 bg-white px-6 py-3 text-base font-semibold text-brand-600 hover:bg-brand-50 transition-all"
              >
                Learn About Partnerships
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Resources -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-neutral-900 mb-8 text-center">
          Related Resources
        </h2>
        <div class="grid gap-6 md:grid-cols-3">
          <NuxtLink
            to="/partnerships"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Partnerships
            </h3>
            <p class="text-sm text-neutral-600">
              Learn about our partnership program and how we work with providers and publishers.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/how-we-make-money"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Data Licensing
            </h3>
            <p class="text-sm text-neutral-600">
              See how we offer B2B products while maintaining editorial independence.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/how-remit-score-works"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              How Remit-Score Works
            </h3>
            <p class="text-sm text-neutral-600">
              Understand our scoring methodology and why rankings can't be influenced.
            </p>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'For Publishers', path: '/learn/embed-remit-scout-on-your-site' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'Embed Remit-Scout on Your Site: Widgets, API, and Editorial Independence | Remit-Scout',
  description: 'Guide for publishers and platforms: widget examples, white-label rules, API endpoints, use cases, and how we maintain independent rankings.',
  canonical: `${siteUrl}/learn/embed-remit-scout-on-your-site`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'For Publishers', url: `${siteUrl}/learn/embed-remit-scout-on-your-site` },
])
</script>











