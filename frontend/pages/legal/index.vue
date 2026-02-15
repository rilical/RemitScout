<template>
  <div class="min-h-screen bg-surface">
    <section class="border-b border-rs-border bg-neutral-50">
      <div class="mx-auto max-w-5xl px-page-x py-14">
        <div class="flex items-start justify-between gap-6">
          <div class="max-w-2xl">
            <h1 class="text-h1 font-bold tracking-tight text-rs-fg">
              Legal & Disclosures
            </h1>
            <p class="mt-4 text-body-lg leading-relaxed text-neutral-600">
              Policies, disclosures, and methodology. We keep this public so users can understand what we collect,
              how we compare providers, and what we do (and do not) guarantee.
            </p>
          </div>
          <div class="hidden sm:block">
            <NuxtLink
              to="/contact"
              class="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-surface px-4 py-2 text-body-sm font-semibold text-rs-fg hover:bg-neutral-100"
            >
              Contact
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-5xl px-page-x py-10">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NuxtLink
          v-for="doc in docs"
          :key="doc.to"
          :to="doc.to"
          class="group rounded-2xl border border-rs-border bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-body-lg font-bold text-rs-fg group-hover:text-neutral-950">
                {{ doc.title }}
              </h2>
              <p class="mt-2 text-body-sm leading-relaxed text-neutral-600">
                {{ doc.description }}
              </p>
            </div>
            <svg
              class="mt-1 h-5 w-5 flex-none text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-600"
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
          </div>
        </NuxtLink>
      </div>

      <div class="mt-10 rounded-2xl border border-rs-border bg-neutral-50 p-6">
        <h3 class="text-body-sm font-bold uppercase tracking-wide text-neutral-700">
          Quick note
        </h3>
        <p class="mt-2 text-body-sm leading-relaxed text-neutral-600">
          Remit-Scout is an independent comparison product. Transfers are completed on third-party provider sites.
          Provider checkout is the final source of truth for fees and FX.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

const { public: { siteUrl } } = useRuntimeConfig()

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Legal & Disclosures',
    description: 'Policies, disclosures, and methodology for Remit-Scout.',
  },
})

setSeo({
  title: 'Legal & Disclosures | Remit-Scout',
  description: 'Policies, disclosures, and methodology for Remit-Scout. Learn what we collect, how we compare providers, and what we do (and do not) guarantee.',
  canonical: `${siteUrl}/legal`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Legal', url: `${siteUrl}/legal` },
])

const docs = [
  { to: '/legal/privacy', title: 'Privacy Policy', description: 'What we collect, how it is used, and your options.' },
  { to: '/legal/terms', title: 'Terms of Service', description: 'Terms governing the use of Remit-Scout.' },
  { to: '/legal/disclosure', title: 'Revenue Disclosure', description: 'How we make money and why independence matters.' },
  { to: '/legal/how-we-make-money', title: 'How We Make Money', description: 'Detailed, user-facing explanation of incentives and disclosures.' },
  { to: '/methodology', title: 'Methodology', description: 'How we normalize quotes and compute comparisons.' },
]
</script>
