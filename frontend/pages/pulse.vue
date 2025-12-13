<template>
  <div class="min-h-screen bg-white pb-24 md:pb-0">
    <CompareWidget />

    <section class="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-10 max-w-3xl">
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            📈 Pulse
          </h1>
          <p class="mt-4 text-lg leading-relaxed text-neutral-700">
            Time-series trends for remittance outcomes by corridor.
          </p>
          <p class="mt-3 text-base leading-relaxed text-neutral-600">
            While Compare shows the best options right now, Pulse shows how outcomes change over time with timestamped updates and transparent methodology.
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <NuxtLink
              to="/send-money"
              class="inline-flex items-center justify-center rounded-btn bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              Compare rates
            </NuxtLink>
            <NuxtLink
              to="/media-kit"
              class="inline-flex items-center justify-center rounded-btn border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              Media kit / Press
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
          <section class="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm space-y-4">
            <h2 class="text-2xl font-bold text-neutral-900">
              What Pulse covers
            </h2>
            <ul class="space-y-2 text-sm text-neutral-700">
              <li><span class="font-semibold text-neutral-900">Corridor trends:</span> how delivered outcomes move over time</li>
              <li><span class="font-semibold text-neutral-900">Outcome-first:</span> recipient gets, total cost, and speed where available</li>
              <li><span class="font-semibold text-neutral-900">Transparency:</span> timestamped data and published methodology</li>
            </ul>
            <div class="flex flex-wrap gap-3 pt-2">
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
          </section>

          <section class="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 shadow-sm space-y-3">
            <h2 class="text-xl font-bold text-neutral-900">
              🛡️ Independence
            </h2>
            <p class="text-sm leading-relaxed text-neutral-800">
              Providers cannot pay to rank higher. Affiliate relationships do not affect sorting or scoring. Sponsors (if any) are labeled and never influence comparisons.
            </p>
          </section>
        </div>

        <aside class="hidden lg:block lg:col-span-4">
          <div class="lg:sticky lg:top-24 space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p class="text-sm font-semibold text-neutral-900">
                Want Pulse data or embeds?
              </p>
              <p class="mt-2 text-sm leading-relaxed text-neutral-700">
                We can support licensing and embeddable widgets depending on corridor coverage.
              </p>
              <div class="mt-4 flex flex-col gap-2">
                <NuxtLink
                  to="/contact?type=license"
                  class="inline-flex items-center justify-center rounded-btn bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Licensing inquiry
                </NuxtLink>
                <NuxtLink
                  to="/partnerships"
                  class="inline-flex items-center justify-center rounded-btn border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Partnerships
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
const canonicalUrl = `${siteUrl}/pulse`
const lastReviewedIso = '2025-12-01'

setSeo({
  title: 'Pulse | Remit-Scout',
  description: 'Time-series trends for remittance outcomes by corridor, with timestamped updates and transparent methodology.',
  canonical: canonicalUrl,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Pulse', url: canonicalUrl },
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
  { name: 'Pulse', path: '/pulse' },
]
</script>

