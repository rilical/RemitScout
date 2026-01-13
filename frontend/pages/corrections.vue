<template>
  <LegalPageShell
    title="Corrections Policy"
    subtitle="How we report, verify, and fix accuracy issues."
    badge="Accuracy"
    :last-updated-label="lastUpdatedLabel"
    :last-updated-iso="lastUpdatedIso"
    :breadcrumb-items="breadcrumbItems"
    :toc="tocItems"
    :highlights="highlights"
    :related="relatedLinks"
  >
    <div class="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-a:font-semibold prose-a:text-blue-600">
      <p class="mb-6 text-lg leading-relaxed">
        This Corrections Policy explains how <strong class="text-blue-600">Remit-Scout</strong> handles accuracy issues,
        verifies data discrepancies, and resolves correction requests. We are an independent comparison platform that takes
        accuracy seriously and publishes a clear process for reporting issues and requesting corrections.
      </p>

      <div class="my-8 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6">
        <h3 class="mb-2 text-lg font-semibold text-blue-900">
          Important Information
        </h3>
        <p class="text-blue-800 leading-relaxed">
          <strong class="text-blue-600">Remit-Scout</strong> is an independent comparison platform. We do not hold, move, or transmit money.
          All transfers are completed directly with licensed third-party providers on their platforms. Provider checkout is the definitive
          source of truth for pricing. If our quote differs materially from the checkout amount, we treat it as a correction request
          and investigate promptly. We aim to resolve confirmed issues within 48 hours.
        </p>
      </div>

      <h2 id="accuracy" class="mb-4 text-2xl font-bold text-gray-900">
        Commitment to Accuracy
      </h2>
      <p class="mb-6 leading-relaxed">
        We refresh data frequently for popular corridors and timestamp every quote. Pricing can change quickly in the money transfer
        market, and provider checkout remains the final source of truth. If you see a discrepancy between our quote and the provider's
        checkout amount, we want to know about it. We use multiple data sources and verification methods to ensure accuracy, but
        exchange rates and provider terms can change between quote capture and checkout.
      </p>

      <h2 id="scope" class="mb-4 text-2xl font-bold text-gray-900">
        Scope
      </h2>
      <p class="mb-6 leading-relaxed">
        This policy applies to comparisons, provider pages, and editorial content across <strong class="text-blue-600">Remit-Scout</strong>.
        We do not hold, move, or transmit money; all transfers are completed on provider platforms. This policy covers corrections to
        pricing data, exchange rates, fees, delivery times, and other information displayed on our platform.
      </p>

      <h2 id="request" class="mb-4 text-2xl font-bold text-gray-900">
        How to Request a Correction
      </h2>
      <p class="mb-4 leading-relaxed">
        Report an issue via our <NuxtLink
          to="/contact"
          class="text-blue-600 hover:text-blue-700 underline font-semibold"
        >contact page</NuxtLink>. The fastest path to a fix is providing enough detail for us to reproduce the quote and verify
        the discrepancy.
      </p>
      <p class="mb-4 leading-relaxed">
        <strong class="text-blue-600">Please include the following information:</strong>
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-blue-600">Corridor:</strong> Sending country to receiving country</li>
        <li><strong class="text-blue-600">Send amount:</strong> Amount entered in the comparison</li>
        <li><strong class="text-blue-600">Payout method:</strong> Bank transfer, cash pickup, mobile wallet, etc.</li>
        <li><strong class="text-blue-600">Payment method:</strong> Bank transfer, debit card, credit card, etc.</li>
        <li><strong class="text-blue-600">Timestamp:</strong> When the quote was shown (date and approximate time)</li>
        <li><strong class="text-blue-600">Provider name:</strong> Provider being reported</li>
        <li><strong class="text-blue-600">Screenshot (optional):</strong> Checkout screen showing final amount and fees</li>
      </ul>

      <div class="my-8 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-6">
        <h3 class="mb-2 text-lg font-semibold text-amber-900">
          Why Quotes May Differ
        </h3>
        <p class="mb-4 text-amber-800 leading-relaxed">
          Several factors may cause our quote to differ from the provider's checkout amount:
        </p>
        <ul class="list-inside list-disc space-y-2 text-amber-800 leading-relaxed">
          <li><strong class="text-amber-900">Payment method:</strong> Bank vs card pricing can differ significantly</li>
          <li><strong class="text-amber-900">Promotions:</strong> Targeted discounts or eligibility rules may apply</li>
          <li><strong class="text-amber-900">KYC status:</strong> Verification steps can affect price or speed</li>
          <li><strong class="text-amber-900">Local rules:</strong> Corridor-specific requirements or limits</li>
          <li><strong class="text-amber-900">FX movement:</strong> Exchange rates can move between quote and checkout</li>
        </ul>
      </div>

      <h2 id="process" class="mb-4 text-2xl font-bold text-gray-900">
        What Happens Next
      </h2>
      <p class="mb-4 leading-relaxed">
        When you report a correction request, we follow this process:
      </p>
      <ol class="mb-6 list-inside list-decimal space-y-2 leading-relaxed">
        <li>We reproduce the quote using the corridor, amount, and timestamp you provided.</li>
        <li>We check for checkout differences such as payment method, promotions, and KYC state.</li>
        <li>If the issue is on our side, we fix data logic and refresh affected quotes.</li>
        <li>We document fixes and use reports to improve data capture methods and accuracy.</li>
      </ol>
      <p class="mb-6 leading-relaxed">
        We investigate all reported discrepancies and will respond to your request within 48 hours if we can confirm the issue.
        If the discrepancy is due to factors outside our control (such as FX rate movement or provider-specific promotions),
        we will explain the difference.
      </p>

      <h2 id="timeline" class="mb-4 text-2xl font-bold text-gray-900">
        How Quickly We Fix Errors
      </h2>
      <p class="mb-6 leading-relaxed">
        We aim to resolve confirmed issues within <strong class="text-blue-600">48 hours</strong>. Complex cases may take longer,
        but we prioritize accuracy on active corridors. If we cannot resolve the issue immediately, we will acknowledge your
        request and provide an estimated timeline for resolution.
      </p>

      <h2 id="history" class="mb-4 text-2xl font-bold text-gray-900">
        Historical Records and Past Quotes
      </h2>
      <p class="mb-6 leading-relaxed">
        We maintain historical snapshots to track price movements over time. These records help us identify trends and improve
        our data collection. If an issue is not reported within 48 hours of a quote, we may be unable to adjust historical records
        even if we correct future data. Historical corrections require additional verification and may not always be possible.
      </p>

      <h2 id="sources" class="mb-4 text-2xl font-bold text-gray-900">
        Data Sources and Verification
      </h2>
      <p class="mb-4 leading-relaxed">
        We collect pricing data from multiple sources to improve accuracy and reliability:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-blue-600">Provider data feeds:</strong> Structured data shared by providers through APIs or partnerships</li>
        <li><strong class="text-blue-600">Public quote capture:</strong> Quotes captured from provider pricing flows and public interfaces</li>
        <li><strong class="text-blue-600">Spot-check transfers:</strong> Periodic real transfers on select corridors to verify accuracy</li>
      </ul>
      <p class="mb-6 leading-relaxed">
        We continuously work to expand direct API integrations and improve data freshness across all corridors. All quotes are
        timestamped to ensure we can track when data was captured and identify potential discrepancies.
      </p>

      <h2 id="reviews" class="mb-4 text-2xl font-bold text-gray-900">
        User Reviews and Moderation
      </h2>
      <p class="mb-6 leading-relaxed">
        We welcome user feedback, including negative experiences with providers. Reviews help other users make informed decisions.
        We remove reviews only when they violate our guidelines or appear to be false or fraudulent.
      </p>
      <p class="mb-4 leading-relaxed">
        <strong class="text-blue-600">Review guidelines:</strong>
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-blue-600">Be truthful:</strong> Reviews should reflect a genuine experience with the provider</li>
        <li><strong class="text-blue-600">No personal data:</strong> Do not share account numbers, transfer IDs, or sensitive information</li>
        <li><strong class="text-blue-600">No abuse:</strong> Harassment or hateful content is removed immediately</li>
        <li><strong class="text-blue-600">No spam:</strong> Promotional content or affiliate links are not allowed</li>
        <li><strong class="text-blue-600">Stay relevant:</strong> Keep feedback focused on the provider and transfer experience</li>
      </ul>
      <p class="mb-6 leading-relaxed">
        To report a review, use our <NuxtLink
          to="/contact"
          class="text-blue-600 hover:text-blue-700 underline font-semibold"
        >contact page</NuxtLink> and include the reason for removal. We review all reports and take appropriate action.
      </p>

      <h2 id="updates" class="mb-4 text-2xl font-bold text-gray-900">
        Updates to This Policy
      </h2>
      <p class="mb-6 leading-relaxed">
        We may update this policy from time to time to reflect changes in our data collection practices, verification methods,
        or legal requirements. Updates will be posted here with a new "Last updated" date. Your continued use of our services
        after changes constitutes acceptance of the updated policy.
      </p>
    </div>

    <template #sidebar>
      <div class="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h3 class="text-sm font-semibold text-blue-900">
          Need help reporting an error?
        </h3>
        <p class="mt-2 text-sm text-blue-800 leading-relaxed">
          If you see an error or have a question about a quote, visit our
          <NuxtLink to="/contact" class="font-semibold underline hover:text-blue-900">contact page</NuxtLink>
          and include the details listed in this policy.
        </p>
      </div>
    </template>
  </LegalPageShell>
</template>

<script setup lang="ts">
import LegalPageShell from '~/components/legal/LegalPageShell.vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

const { public: { siteUrl } } = useRuntimeConfig()

const lastUpdatedIso = '2025-12-14'
const lastUpdatedLabel = 'December 14, 2025'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Corrections Policy', path: '/corrections' },
]

const highlights = [
  {
    title: '48-hour target',
    body: 'Confirmed issues are prioritized for quick resolution.',
  },
  {
    title: 'Checkout is final',
    body: 'Provider checkout is the source of truth for pricing.',
  },
  {
    title: 'Corrections process',
    body: 'We document fixes and improve capture logic.',
  },
]

const tocItems = [
  { id: 'accuracy', label: 'Commitment to accuracy' },
  { id: 'scope', label: 'Scope' },
  { id: 'request', label: 'How to request a correction' },
  { id: 'process', label: 'What happens next' },
  { id: 'timeline', label: 'How quickly we fix errors' },
  { id: 'history', label: 'Historical records' },
  { id: 'sources', label: 'Data sources' },
  { id: 'reviews', label: 'User reviews' },
  { id: 'updates', label: 'Updates' },
]

const relatedLinks = [
  {
    title: 'Methodology',
    description: 'How we collect and normalize quote data.',
    to: '/methodology',
  },
  {
    title: 'Privacy Policy',
    description: 'How we handle data and cookies.',
    to: '/legal/privacy',
  },
  {
    title: 'How We Make Money',
    description: 'Revenue streams and independence guardrails.',
    to: '/legal/how-we-make-money',
  },
]

setSeo({
  title: 'Corrections Policy | Remit-Scout',
  description: 'How Remit-Scout handles corrections, verifies data, and resolves accuracy issues.',
  canonical: `${siteUrl}/corrections`,
  ogType: 'article',
  publishedTime: lastUpdatedIso,
  modifiedTime: lastUpdatedIso,
  author: 'Remit-Scout Editorial Team',
  tags: ['corrections', 'accuracy', 'methodology'],
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Corrections Policy', url: `${siteUrl}/corrections` },
])

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Corrections Policy',
        'url': `${siteUrl}/corrections`,
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
</script>
