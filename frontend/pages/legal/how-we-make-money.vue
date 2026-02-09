<template>
  <LegalPageShell
    title="How We Make Money"
    subtitle="Transparency on revenue, independence, and rankings."
    badge="Revenue"
    :last-updated-label="lastUpdatedLabel"
    :last-updated-iso="lastUpdatedIso"
    :breadcrumb-items="breadcrumbItems"
    :toc="tocItems"
    :highlights="highlights"
    :related="relatedLinks"
  >
    <div class="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-a:font-semibold prose-a:text-blue-600">
      <p class="mb-6">
        Remit-Scout compares licensed money transfer providers. We keep the service free by
        earning revenue in a few clearly defined ways. None of these change how we score
        providers or which options we show first.
      </p>

      <h2
        id="revenue-streams"
        class="mb-3 text-2xl font-bold text-gray-900"
      >
        Revenue streams
      </h2>
      <ul class="mb-6 list-inside list-disc space-y-2">
        <li><strong>Affiliate commissions:</strong> Paid when a user we refer completes a sign-up or transfer.</li>
        <li><strong>Advertising placements:</strong> Marked as “Sponsored” and separated from organic rankings.</li>
        <li v-if="enterpriseEnabled">
          <strong>Partnerships & data access:</strong> White-label data access for partners; no impact on consumer rankings.
        </li>
        <li><strong>Premium tooling:</strong> Optional business-tier analytics (coming soon).</li>
      </ul>

      <h2
        id="editorial-guardrails"
        class="mb-3 text-2xl font-bold text-gray-900"
      >
        Editorial guardrails
      </h2>
      <ul class="mb-6 list-inside list-disc space-y-2">
        <li>Business and editorial teams are separated; commercial deals cannot alter Remit-Score.</li>
        <li>Sponsored slots never replace top-scoring organic results; they are labeled.</li>
        <li>Promo pricing is tagged and doesn’t inflate long-term scores.</li>
        <li>We publish methodology updates and change logs when weights shift.</li>
      </ul>

      <h2
        id="ranking-policy"
        class="mb-3 text-2xl font-bold text-gray-900"
      >
        User-first ranking policy
      </h2>
      <p class="mb-4">
        Providers are ranked by total cost (fees + FX), delivery speed, payout breadth, and trust
        signals. If a provider we do not partner with beats a partner on cost or speed, it still
        appears higher.
      </p>
      <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <strong class="text-emerald-900">Example:</strong>
        <p class="text-emerald-800 mb-0">
          If Provider A (no affiliate link) pays the recipient more than Provider B (affiliate), Provider A ranks above Provider B for that corridor/amount.
        </p>
      </div>

      <h2
        id="conflict-checks"
        class="mb-3 text-2xl font-bold text-gray-900"
      >
        Conflict checks
      </h2>
      <ul class="mb-6 list-inside list-disc space-y-2">
        <li>Quarterly audits of affiliate impact on rankings.</li>
        <li>Dedicated disclosure labels on affiliate buttons and sponsored modules.</li>
        <li>User feedback loop to flag mis-ranked offers.</li>
      </ul>

      <h2
        id="questions"
        class="mb-3 text-2xl font-bold text-gray-900"
      >
        Questions?
      </h2>
      <p>
        Email <a
          href="mailto:support@remit-scout.com"
          class="text-primary-600 hover:text-primary-700"
        >support@remit-scout.com</a>
        if you want more detail about any partnership, ad placement, or ranking decision.
      </p>
    </div>
  </LegalPageShell>
</template>

<script setup lang="ts">
import LegalPageShell from '~/components/legal/LegalPageShell.vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import { useFeatureFlags } from '~/composables/useFeatureFlags'

const { public: { siteUrl } } = useRuntimeConfig()
const { enterpriseEnabled } = useFeatureFlags()

const lastUpdatedIso = '2026-01-17'
const lastUpdatedLabel = 'January 17, 2026'

const highlights = [
  {
    title: 'Affiliate commissions',
    body: 'Revenue comes from referrals, not ranking placement.',
  },
  {
    title: 'Ads and partnerships',
    body: 'Sponsored placements are labeled and separated.',
  },
  {
    title: 'Editorial guardrails',
    body: 'Commercial deals cannot change Remit-Score.',
  },
]

const tocItems = [
  { id: 'revenue-streams', label: 'Revenue streams' },
  { id: 'editorial-guardrails', label: 'Editorial guardrails' },
  { id: 'ranking-policy', label: 'User-first ranking policy' },
  { id: 'conflict-checks', label: 'Conflict checks' },
  { id: 'questions', label: 'Questions' },
]

const relatedLinks = [
  {
    title: 'Disclosure Policy',
    description: 'Transparency and partnerships.',
    to: '/legal/disclosure',
  },
  {
    title: 'Methodology',
    description: 'How we compare providers.',
    to: '/methodology',
  },
  {
    title: 'Terms of Service',
    description: 'The legal agreement.',
    to: '/legal/terms',
  },
  {
    title: 'Privacy Policy',
    description: 'How we protect your data.',
    to: '/legal/privacy',
  },
]

setSeo({
  title: 'How We Make Money | Remit-Scout Transparency',
  description:
    'Learn how Remit-Scout earns revenue through affiliate links, ads, and partnerships without affecting rankings or Remit-Score.',
  canonical: `${siteUrl}/legal/how-we-make-money`,
  ogType: 'article',
  publishedTime: lastUpdatedIso,
  modifiedTime: lastUpdatedIso,
  author: 'Remit-Scout Editorial Team',
  tags: ['revenue', 'transparency', 'independence'],
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Legal', url: `${siteUrl}/legal` },
  { name: 'How We Make Money', url: `${siteUrl}/legal/how-we-make-money` },
])

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'How We Make Money',
        'url': `${siteUrl}/legal/how-we-make-money`,
        'datePublished': lastUpdatedIso,
        'dateModified': lastUpdatedIso,
        'publisher': {
          '@type': 'Organization',
          'name': 'Remit-Scout',
          'url': siteUrl,
        },
      }),
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Legal', path: '/legal' },
  { name: 'How We Make Money', path: '/legal/how-we-make-money' },
]
</script>
