<template>
  <div class="min-h-screen bg-white pb-24 md:pb-0">
    <CompareWidget />

    <section class="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-10 max-w-3xl">
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            ✅ Corrections
          </h1>
          <p class="mt-4 text-lg leading-relaxed text-neutral-700">
            If something looks off, tell us. We investigate and correct issues when needed.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <NuxtLink
              to="/contact?type=issue"
              class="inline-flex items-center justify-center rounded-btn bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              Report an issue
            </NuxtLink>
            <NuxtLink
              to="/methodology"
              class="inline-flex items-center justify-center rounded-btn border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              Methodology
            </NuxtLink>
          </div>
          <p class="mt-4 text-sm text-neutral-600">
            Last updated: December 2025
          </p>
        </div>
      </div>
    </section>

    <main
      id="main-content"
      class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-18"
    >
      <div class="grid gap-10 lg:grid-cols-12">
        <div class="space-y-12 lg:col-span-8">
          <section class="space-y-4">
            <h2 class="text-2xl font-bold text-neutral-900">
              How to request a correction
            </h2>
            <p class="text-sm leading-relaxed text-neutral-700">
              Use our issue form and include enough detail for us to reproduce the result.
            </p>
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p class="text-sm font-semibold text-neutral-900">
                What to include
              </p>
              <ul class="mt-3 space-y-2 text-sm text-neutral-700">
                <li>Corridor (sending country → receiving country)</li>
                <li>Send amount and payout method (if applicable)</li>
                <li>Timestamp shown on Remit-Scout</li>
                <li>Provider name</li>
                <li>Optional: screenshot of the provider checkout screen and fees</li>
              </ul>
            </div>
          </section>

          <section class="space-y-4">
            <h2 class="text-2xl font-bold text-neutral-900">
              What happens after you report
            </h2>
            <ul class="space-y-2 text-sm text-neutral-700">
              <li>We attempt to reproduce the quote with the same corridor, amount, and timestamp window.</li>
              <li>We check for common checkout differences (payment method, promos, KYC, limits, and provider rules).</li>
              <li>If the issue is on our side, we update the data logic and/or refresh the affected quotes.</li>
              <li>If we publish a correction, we aim to be specific about what changed and why.</li>
            </ul>
          </section>

          <section class="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 shadow-sm space-y-3">
            <h2 class="text-xl font-bold text-neutral-900">
              Trust &amp; safety
            </h2>
            <p class="text-sm leading-relaxed text-neutral-800">
              Remit-Scout is a comparison and research product. We do not hold, move, or transmit money. When you choose a provider, you complete the transfer on that provider’s website or app.
            </p>
          </section>
        </div>

        <aside class="hidden lg:block lg:col-span-4">
          <div class="lg:sticky lg:top-24 space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p class="text-sm font-semibold text-neutral-900">
                Report an issue
              </p>
              <p class="mt-2 text-sm leading-relaxed text-neutral-700">
                The fastest path to a fix is a corridor + timestamp + screenshot.
              </p>
              <div class="mt-4 flex flex-col gap-2">
                <NuxtLink
                  to="/contact?type=issue"
                  class="inline-flex items-center justify-center rounded-btn bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Report an issue
                </NuxtLink>
                <NuxtLink
                  to="/contact"
                  class="inline-flex items-center justify-center rounded-btn border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Contact
                </NuxtLink>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p class="text-sm font-semibold text-neutral-900">
                Related
              </p>
              <div class="mt-3 space-y-2 text-sm">
                <NuxtLink
                  to="/methodology"
                  class="block text-brand-600 hover:text-brand-700 underline decoration-brand-600/30 hover:decoration-brand-700"
                >
                  Methodology
                </NuxtLink>
                <NuxtLink
                  to="/how-we-make-money"
                  class="block text-brand-600 hover:text-brand-700 underline decoration-brand-600/30 hover:decoration-brand-700"
                >
                  How we make money
                </NuxtLink>
                <NuxtLink
                  to="/affiliate-disclosure"
                  class="block text-brand-600 hover:text-brand-700 underline decoration-brand-600/30 hover:decoration-brand-700"
                >
                  Affiliate disclosure
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
const canonicalUrl = `${siteUrl}/corrections`
const lastReviewedIso = '2025-12-01'

setSeo({
  title: 'Corrections | Remit-Scout',
  description: 'Report issues and request corrections for Remit-Scout quote data and pages. We investigate and update when needed.',
  canonical: canonicalUrl,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Corrections', url: canonicalUrl },
])

const hostname = (() => {
  try {
    return new URL(siteUrl).hostname
  }
  catch {
    return 'Remit-Scout.com'
  }
})()

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Remit-Scout',
  url: siteUrl,
  logo: `${siteUrl}/logos/remit-scout.svg`,
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: `support@${hostname}`,
      url: `${siteUrl}/contact`,
    },
  ],
  sameAs: [
    'https://linkedin.com/company/Remit-Scout',
  ],
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
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Corrections', path: '/corrections' },
]
</script>

