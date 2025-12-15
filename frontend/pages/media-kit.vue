<template>
  <div class="min-h-screen bg-white pb-24 md:pb-0">
    <CompareWidget />

    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-10 max-w-3xl">
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            📰 Media Kit / Press
          </h1>
          <p class="mt-4 text-lg leading-relaxed text-neutral-700">
            Remittance pricing trends, backed by a living dataset
          </p>
          <p class="mt-3 text-base leading-relaxed text-neutral-600">
            Remit-Scout publishes independent comparisons and time-series indicators for cross-border money transfers, built from observed retail quotes.
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <NuxtLink
              to="/contact?type=press"
              class="inline-flex items-center justify-center rounded-btn bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              Press inquiries
            </NuxtLink>
            <NuxtLink
              to="/pulse"
              class="inline-flex items-center justify-center rounded-btn border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              View Pulse
            </NuxtLink>
          </div>

          <div class="mt-8 flex flex-wrap gap-3">
            <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-slate-200">
              <span aria-hidden="true">📊</span>
              Data-driven
            </div>
            <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-slate-200">
              <span aria-hidden="true">🛡️</span>
              No pay-to-rank
            </div>
            <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-slate-200">
              <span aria-hidden="true">🕒</span>
              Timestamped updates
            </div>
          </div>

          <p class="mt-4 text-sm text-neutral-600">
            Last updated: December 2025
          </p>
        </div>
      </div>
    </section>

    <!-- Main -->
    <main
      id="main-content"
      class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-18"
    >
      <div class="grid gap-10 lg:grid-cols-12">
        <div class="space-y-16 lg:col-span-8">
          <section class="space-y-4">
            <h2 class="text-2xl font-bold text-neutral-900">
              📈 What is Pulse?
            </h2>
            <p class="text-sm leading-relaxed text-neutral-700">
              Pulse is our time-series layer. Compare shows the best option at a moment in time; Pulse shows how outcomes change over time by corridor (and amount buckets where available). It helps readers see what moved, how volatile pricing has been, and whether today looks unusually expensive or unusually cheap.
            </p>
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p class="text-sm font-semibold text-neutral-900">
                Example angles:
              </p>
              <ul class="mt-3 space-y-2 text-sm text-neutral-700">
                <li>“If you sent $200 from the US to Albania each day this month, how did the best delivered amount change?”</li>
                <li>“Which corridors became more expensive this week?”</li>
                <li>“Did provider pricing shift, or was it FX movement?”</li>
              </ul>
            </div>
          </section>

          <section class="space-y-4">
            <h2 class="text-2xl font-bold text-neutral-900">
              🧾 What we measure
            </h2>
            <p class="text-sm leading-relaxed text-neutral-700">
              We measure the sender’s outcome, not marketing claims:
            </p>
            <ul class="space-y-2 text-sm text-neutral-700">
              <li><span class="font-semibold text-neutral-900">Recipient gets:</span> estimated delivered amount after fees and FX markup (based on the quote at capture time)</li>
              <li><span class="font-semibold text-neutral-900">Total cost:</span> fees plus implied FX markup versus a mid-market reference rate at the same timestamp</li>
              <li><span class="font-semibold text-neutral-900">Speed (where available):</span> provider ETA ranges, and observed buckets when feasible</li>
            </ul>
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p class="text-sm text-neutral-700">
                Notes:
              </p>
              <ul class="mt-3 space-y-2 text-sm text-neutral-700">
                <li>Checkout can differ from what you see here due to payment method, promos, KYC, and provider-specific rules.</li>
                <li>We timestamp quotes and publish our methodology so readers can understand how comparisons are built.</li>
              </ul>
              <div class="mt-5 flex flex-wrap gap-3">
                <NuxtLink
                  to="/methodology"
                  class="inline-flex items-center justify-center rounded-btn bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Methodology
                </NuxtLink>
                <NuxtLink
                  to="/how-we-make-money"
                  class="inline-flex items-center justify-center rounded-btn border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  How we make money
                </NuxtLink>
              </div>
            </div>
          </section>

          <section class="space-y-4">
            <h2 class="text-2xl font-bold text-neutral-900">
              🔖 How to cite
            </h2>
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <p class="text-sm font-semibold text-neutral-900">
                  Preferred citation line:
                </p>
                <p class="mt-2 text-sm text-neutral-700">
                  “Source: Remit-Scout (remitscout.com), observed retail quotes, [CORRIDOR], $200 benchmark, retrieved [DATE].”
                </p>
              </div>
              <div>
                <p class="text-sm font-semibold text-neutral-900">
                  If referencing an index:
                </p>
                <p class="mt-2 text-sm text-neutral-700">
                  “Source: Remit-Scout Cost Index (fees + FX markup), retrieved [DATE].”
                </p>
              </div>
              <div>
                <p class="text-sm font-semibold text-neutral-900">
                  If using charts:
                </p>
                <ul class="mt-2 space-y-2 text-sm text-neutral-700">
                  <li>Include “Source: Remit-Scout” plus a retrieval date.</li>
                  <li>Link to the specific Pulse corridor page when possible.</li>
                </ul>
              </div>
            </div>
          </section>

          <section class="space-y-4">
            <h2 class="text-2xl font-bold text-neutral-900">
              📦 Usage &amp; licensing
            </h2>
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <p class="text-sm text-neutral-700">
                Editorial use: You can quote short excerpts with attribution.
              </p>
              <p class="text-sm text-neutral-700">
                Charts, embeds, and data: For republishing charts, embedding widgets, or systematic data use, please request a license.
              </p>
              <div class="flex flex-wrap gap-3 pt-2">
                <NuxtLink
                  to="/contact?type=license"
                  class="inline-flex items-center justify-center rounded-btn bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Request chart license
                </NuxtLink>
                <NuxtLink
                  to="/contact?type=embed"
                  class="inline-flex items-center justify-center rounded-btn border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Request embed
                </NuxtLink>
              </div>
            </div>
          </section>

          <section class="space-y-4">
            <h2 class="text-2xl font-bold text-neutral-900">
              🧩 Embeddable widgets (Pulse)
            </h2>
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <p class="text-sm text-neutral-700">
                We offer embeddable charts for publishers and communities (availability depends on corridor coverage). Examples include:
              </p>
              <ul class="space-y-2 text-sm text-neutral-700">
                <li>Remittance Cost Index (30D / 90D)</li>
                <li>FX Markup Watch</li>
                <li>Top Movers (corridor changes this week)</li>
              </ul>
              <p class="text-sm text-neutral-700">
                Embeds are currently in limited beta. Contact us to request access.
              </p>
            </div>
          </section>

          <section class="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 shadow-sm space-y-4">
            <h2 class="text-xl font-bold text-neutral-900">
              🛡️ Independence &amp; disclosure
            </h2>
            <div class="space-y-2 text-sm leading-relaxed text-neutral-800">
              <p>Remit-Scout keeps monetization separate from rankings.</p>
              <p>We may earn affiliate commissions on referrals.</p>
              <p>Affiliate relationships do not affect sorting, scoring, or Remit-Score calculations.</p>
              <p>Sponsors (if any) are clearly labeled and do not influence comparisons or methodology.</p>
              <p>Remit-Scout does not hold or move funds.</p>
            </div>
            <div class="flex flex-wrap gap-3 pt-1">
              <NuxtLink
                to="/affiliate-disclosure"
                class="inline-flex items-center justify-center rounded-btn border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Affiliate disclosure
              </NuxtLink>
              <NuxtLink
                to="/methodology"
                class="inline-flex items-center justify-center rounded-btn border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Methodology
              </NuxtLink>
            </div>
          </section>

          <section class="space-y-4">
            <h2 class="text-2xl font-bold text-neutral-900">
              ✅ Corrections
            </h2>
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <p class="text-sm text-neutral-700">
                We take accuracy seriously. If you spot an issue:
              </p>
              <ul class="space-y-2 text-sm text-neutral-700">
                <li>Provide corridor, timestamp, and (if possible) a screenshot of the provider checkout screen.</li>
                <li>We investigate and publish corrections when needed.</li>
              </ul>
              <div class="flex flex-wrap gap-3 pt-2">
                <NuxtLink
                  to="/contact"
                  class="inline-flex items-center justify-center rounded-btn bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Report an issue
                </NuxtLink>
                <NuxtLink
                  to="/corrections"
                  class="inline-flex items-center justify-center rounded-btn border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Corrections policy
                </NuxtLink>
              </div>
            </div>
          </section>

          <section class="space-y-6">
            <h2 class="text-2xl font-bold text-neutral-900">
              🎨 Brand assets
            </h2>
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div class="space-y-2">
                <p class="text-sm font-semibold text-neutral-900">
                  Logo
                </p>
                <div class="flex flex-wrap items-center gap-3">
                  <a
                    href="/logos/remit-scout.svg"
                    class="inline-flex items-center justify-center rounded-btn border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    Download SVG
                  </a>
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-semibold text-neutral-900">
                  Brand colors
                </p>
                <div class="flex flex-wrap gap-3">
                  <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-neutral-700">
                    <span class="h-3 w-3 rounded-full bg-brand-600" />
                    <span>Brand blue: #2563EB</span>
                  </div>
                  <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-neutral-700">
                    <span class="h-3 w-3 rounded-full bg-brand-700" />
                    <span>Dark blue: #1D4ED8</span>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-semibold text-neutral-900">
                  Short description
                </p>
                <p class="text-sm text-neutral-700">
                  Remit-Scout is an independent remittance comparison and market-data product that measures recipient outcomes across corridors.
                </p>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-semibold text-neutral-900">
                  Long description
                </p>
                <p class="text-sm text-neutral-700">
                  Remit-Scout helps people compare cross-border money transfer providers by focusing on what the recipient is estimated to receive after fees and FX markup. Our Pulse pages publish time-series trends that show how outcomes change over time by corridor. We maintain a strict no pay-to-rank policy and publish our methodology and disclosures openly.
                </p>
              </div>
            </div>
          </section>

          <section class="rounded-3xl bg-brand-600 px-7 py-10 text-white shadow-sm">
            <div class="space-y-4">
              <p class="text-sm text-white/90">
                Press contact: {{ pressEmail }}<br>
                General: {{ supportEmail }}
              </p>
              <div class="flex flex-wrap gap-3">
                <NuxtLink
                  to="/contact?type=press"
                  class="inline-flex items-center justify-center rounded-btn bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600"
                >
                  Press inquiries
                </NuxtLink>
                <NuxtLink
                  to="/partnerships"
                  class="inline-flex items-center justify-center rounded-btn border border-white/30 bg-transparent px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600"
                >
                  Partnerships
                </NuxtLink>
              </div>
            </div>
          </section>
        </div>

        <!-- Sticky rail (desktop) -->
        <aside class="hidden lg:block lg:col-span-4">
          <div class="lg:sticky lg:top-24 space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p class="text-sm font-semibold text-neutral-900">
                Press &amp; licensing
              </p>
              <p class="mt-2 text-sm leading-relaxed text-neutral-700">
                Need a quote, chart permission, or embed access? Send the details and your deadline.
              </p>
              <div class="mt-4 flex flex-col gap-2">
                <NuxtLink
                  to="/contact?type=press"
                  class="inline-flex items-center justify-center rounded-btn bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Press inquiries
                </NuxtLink>
                <NuxtLink
                  to="/contact?type=license"
                  class="inline-flex items-center justify-center rounded-btn border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Data/licensing inquiry
                </NuxtLink>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p class="text-sm font-semibold text-neutral-900">
                Key links
              </p>
              <div class="mt-3 space-y-2 text-sm">
                <NuxtLink
                  to="/pulse"
                  class="block text-brand-600 hover:text-brand-700 underline decoration-brand-600/30 hover:decoration-brand-700"
                >
                  Pulse
                </NuxtLink>
                <NuxtLink
                  to="/methodology"
                  class="block text-brand-600 hover:text-brand-700 underline decoration-brand-600/30 hover:decoration-brand-700"
                >
                  Methodology
                </NuxtLink>
                <NuxtLink
                  to="/affiliate-disclosure"
                  class="block text-brand-600 hover:text-brand-700 underline decoration-brand-600/30 hover:decoration-brand-700"
                >
                  Affiliate disclosure
                </NuxtLink>
                <NuxtLink
                  to="/corrections"
                  class="block text-brand-600 hover:text-brand-700 underline decoration-brand-600/30 hover:decoration-brand-700"
                >
                  Corrections policy
                </NuxtLink>
                <NuxtLink
                  to="/contact"
                  class="block text-brand-600 hover:text-brand-700 underline decoration-brand-600/30 hover:decoration-brand-700"
                >
                  Contact
                </NuxtLink>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'
const canonicalUrl = `${siteUrl}/media-kit`
const lastReviewedIso = '2025-12-01'

setSeo({
  title: 'Media Kit / Press | Remit-Scout',
  description: 'Remittance pricing trends backed by a living dataset. Learn how to cite Remit-Scout, request chart permissions, and understand Pulse.',
  canonical: canonicalUrl,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Media Kit', url: canonicalUrl },
])

const hostname = (() => {
  try {
    return new URL(siteUrl).hostname
  }
  catch {
    return 'Remit-Scout.com'
  }
})()

const supportEmail = `support@${hostname}`
const pressEmail = `press@${hostname}`

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'Remit-Scout',
  'url': siteUrl,
  'logo': `${siteUrl}/logos/remit-scout.svg`,
  'contactPoint': [
    {
      '@type': 'ContactPoint',
      'contactType': 'press',
      'email': pressEmail,
      'url': `${siteUrl}/contact?type=press`,
    },
    {
      '@type': 'ContactPoint',
      'contactType': 'customer support',
      'email': supportEmail,
      'url': `${siteUrl}/contact`,
    },
  ],
  'sameAs': [
    'https://linkedin.com/company/Remit-Scout',
  ],
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  'headline': 'Media Kit / Press',
  'description': 'Remittance pricing trends — backed by a live dataset',
  'author': {
    '@type': 'Organization',
    'name': 'Remit-Scout',
    'url': siteUrl,
  },
  'datePublished': lastReviewedIso,
  'dateModified': lastReviewedIso,
  'publisher': {
    '@type': 'Organization',
    'name': 'Remit-Scout',
    'logo': {
      '@type': 'ImageObject',
      'url': `${siteUrl}/logos/remit-scout.svg`,
    },
  },
  'mainEntityOfPage': {
    '@type': 'WebPage',
    '@id': canonicalUrl,
  },
}

useHead({
  meta: [
    { name: 'author', content: 'Remit-Scout' },
    { property: 'article:modified_time', content: lastReviewedIso },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(organizationSchema),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(articleSchema),
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Media Kit', path: '/media-kit' },
]
</script>
