<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'

const { public: { siteUrl } } = useRuntimeConfig()

const mailtoHref = 'mailto:support@remit-scout.com?subject=Institutional%20inquiry'

setSeo({
  title: 'Institutions | Remit-Scout',
  description:
    'Remittance intelligence for research and risk teams. Contact us for institutional access details.',
  canonical: `${siteUrl}/institutions`,
  noindex: true,
  ogImage: false,
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Institutions', path: '/institutions' },
]
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <section class="py-10 sm:py-14">
      <div class="mx-auto max-w-page px-page-x">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-8 rounded-3xl border border-rs-border bg-surface p-8 sm:p-10 shadow-sm">
          <p class="text-body-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">
            For institutions
          </p>
          <h1 class="text-h2 font-bold text-rs-fg mb-4 leading-tight">
            Remittance intelligence for research and risk teams
          </h1>
          <p class="text-body text-neutral-700 leading-relaxed mb-8">
            Remittance intelligence for research and risk teams. We offer real-time corridor data, proprietary cost and volatility indexes, and historical datasets. Contact us for details.
          </p>

          <div class="flex flex-wrap gap-3">
            <a
              :href="mailtoHref"
              class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-body font-semibold text-white shadow-sm motion-safe:transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:ring-offset-neutral-50"
            >
              Contact us
            </a>
            <a
              :href="mailtoHref"
              class="inline-flex items-center justify-center rounded-xl border border-rs-border bg-surface px-6 py-3 text-body font-semibold text-neutral-800 motion-safe:transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:ring-offset-neutral-50"
            >
              support@remit-scout.com
            </a>
          </div>

          <p class="mt-6 text-body-sm text-neutral-500">
            Materials and access details are shared with qualified clients under NDA.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
