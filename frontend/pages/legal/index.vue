<template>
  <div class="min-h-screen bg-white">
    <section class="border-b border-slate-200 bg-slate-50">
      <div class="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div class="flex items-start justify-between gap-6">
          <div class="max-w-2xl">
            <h1 class="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Legal & Disclosures
            </h1>
            <p class="mt-4 text-lg leading-relaxed text-slate-600">
              Policies, disclosures, and methodology. We keep this public so users can understand what we collect,
              how we compare providers, and what we do (and do not) guarantee.
            </p>
          </div>
          <div class="hidden sm:block">
            <NuxtLink
              to="/contact"
              class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Contact
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NuxtLink
          v-for="doc in docs"
          :key="doc.to"
          :to="doc.to"
          class="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900 group-hover:text-slate-950">
                {{ doc.title }}
              </h2>
              <p class="mt-2 text-sm leading-relaxed text-slate-600">
                {{ doc.description }}
              </p>
            </div>
            <svg
              class="mt-1 h-5 w-5 flex-none text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600"
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

      <div class="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h3 class="text-sm font-bold uppercase tracking-wide text-slate-700">
          Quick note
        </h3>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">
          Remit-Scout is an independent comparison product. Transfers are completed on third-party provider sites.
          Provider checkout is the final source of truth for fees and FX.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'

const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Legal & Disclosures',
  description: 'Policies, disclosures, and methodology for Remit-Scout.',
  canonical: `${siteUrl}/legal`,
})

const docs = [
  { to: '/legal/privacy', title: 'Privacy Policy', description: 'What we collect, how it is used, and your options.' },
  { to: '/legal/terms', title: 'Terms of Service', description: 'Terms governing the use of Remit-Scout.' },
  { to: '/legal/disclosure', title: 'Revenue Disclosure', description: 'How we make money and why independence matters.' },
  { to: '/legal/how-we-make-money', title: 'How We Make Money', description: 'Detailed, user-facing explanation of incentives and disclosures.' },
  { to: '/methodology', title: 'Methodology', description: 'How we normalize quotes and compute comparisons.' },
]
</script>
