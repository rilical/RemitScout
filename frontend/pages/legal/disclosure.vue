<template>
  <LegalPageShell
    title="Affiliate & Disclosure Policy"
    subtitle="How we stay independent, transparent, and funded."
    badge="Disclosure"
    :last-updated-label="lastUpdatedLabel"
    :last-updated-iso="lastUpdatedIso"
    :breadcrumb-items="breadcrumbItems"
    :toc="tocItems"
    :highlights="highlights"
    :related="relatedLinks"
  >
    <div class="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-a:font-semibold prose-a:text-blue-600">
            <p class="mb-6 text-lg leading-relaxed">
              At <strong class="text-blue-600">Remit-Scout</strong> (operated by <strong class="text-blue-600">Remit-Scout LLC</strong>),
              transparency is fundamental to our mission.
              This Disclosure Policy explains how we maintain our independence, how we may earn compensation,
              and our commitment to providing unbiased, accurate information about money transfer services.
            </p>

            <div class="my-8 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6">
              <h3 class="mb-2 text-lg font-semibold text-blue-900">
                Our Commitment to You
              </h3>
              <p class="text-blue-800">
                We are an independent comparison platform built by expats, for expats. Our founder,
                <NuxtLink
                  to="/about"
                  class="font-semibold underline hover:text-blue-900"
                >Omar Ghabayen</NuxtLink>,
                created Remit-Scout after losing $30 per transfer while sending money home from Carnegie Mellon University.
                This personal experience drives our commitment to transparency and helping you keep more of your money.
              </p>
            </div>

            <h2 id="our-independence" class="mb-4 text-2xl font-bold text-gray-900">
              Our Independence
            </h2>
            <p class="mb-6 leading-relaxed">
              <strong class="text-blue-600">Remit-Scout</strong> operates independently and is not owned by,
              affiliated with, or controlled by any money transfer provider. Our recommendations, rankings,
              and reviews are based on objective analysis of real-time data, periodic spot-check transfers, and
              comprehensive evaluation criteria. Learn more about our
              <NuxtLink
                to="/methodology"
                class="text-blue-600 hover:text-blue-700 underline font-semibold"
              >testing methodology</NuxtLink>
              and how we compare providers.
            </p>

            <h2 id="how-we-make-money" class="mb-4 text-2xl font-bold text-gray-900">
              How We Make Money
            </h2>
            <p class="mb-4 leading-relaxed">
              To keep <strong class="text-blue-600">Remit-Scout</strong> free for users, we generate revenue through
              clearly disclosed partnerships. For complete details, see our
              <NuxtLink
                to="/how-we-make-money"
                class="text-blue-600 hover:text-blue-700 underline font-semibold"
              >How We Make Money</NuxtLink> page.
            </p>

            <h3 class="mb-3 text-xl font-semibold text-gray-900">
              Revenue Sources
            </h3>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li>
                <strong class="text-blue-600">Affiliate Commissions:</strong> When you click on provider links
                and sign up for services through our platform, we may receive a commission. This does not affect
                our rankings, reviews, or editorial content.
              </li>
              <li>
                <strong class="text-blue-600">Remit-Scout Plus:</strong> We offer an optional paid membership that may provide
                additional features and an ad-free experience. Membership does not affect our rankings, reviews, or comparison results.
              </li>
              <li>
                <strong class="text-blue-600">Advertising Partnerships:</strong> We may display advertisements
                from money transfer providers and related services. All ads are clearly marked. If you subscribe to
                <strong class="text-blue-600">Remit-Scout Plus</strong>, we may remove certain advertising placements.
              </li>
              <li>
                <strong class="text-blue-600">Sponsored Content:</strong> Occasionally, we may publish sponsored
                articles or content, which is always clearly labeled as "Sponsored" or "Advertisement."
              </li>
            </ul>

            <div class="my-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
              <h3 class="mb-3 text-lg font-semibold text-gray-900">
                What This Means for You
              </h3>
              <ul class="space-y-2 leading-relaxed">
                <li class="flex items-start">
                  <svg
                    class="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span><strong class="text-blue-600">Rankings are never for sale.</strong> Providers cannot pay to improve their position in our comparisons.</span>
                </li>
                <li class="flex items-start">
                  <svg
                    class="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span><strong class="text-blue-600">Editorial independence is protected.</strong> Our content team operates separately from business development.</span>
                </li>
                <li class="flex items-start">
                  <svg
                    class="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span><strong class="text-blue-600">All affiliate relationships are disclosed.</strong> You'll see clear labels wherever affiliate links appear.</span>
                </li>
                <li class="flex items-start">
                  <svg
                    class="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span><strong class="text-blue-600">Plus does not change rankings.</strong> Subscribing may remove ads, but comparison results remain data-driven.</span>
                </li>
              </ul>
            </div>

            <h2 id="review-process" class="mb-4 text-2xl font-bold text-gray-900">
              Our Review Process
            </h2>
            <p class="mb-4 leading-relaxed">
              Our evaluations are based on data-driven analysis and a transparent methodology. We use a combination of provider
              data, structured quote capture, and periodic spot-check transfers on selected corridors. Learn more in our
              <NuxtLink
                to="/methodology"
                class="text-blue-600 hover:text-blue-700 underline font-semibold"
              >methodology</NuxtLink>.
            </p>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li><strong class="text-blue-600">Delivered value:</strong> The amount received after fees and FX markup, using timestamped quotes</li>
              <li><strong class="text-blue-600">Reliability & data quality:</strong> Quote availability, data freshness, and stability (where available)</li>
              <li><strong class="text-blue-600">Friction & speed:</strong> Speed buckets and observed delivery performance on selected corridors (where available)</li>
              <li><strong class="text-blue-600">Coverage:</strong> Corridor availability and payout methods</li>
              <li><strong class="text-blue-600">User feedback:</strong> Community reviews and reported issues, moderated for authenticity</li>
            </ul>
            <p class="mb-6 leading-relaxed">
              Providers cannot pay to improve their position in our comparisons. Commercial relationships (affiliate links, ads, or
              sponsorships) do not change our methodology or rankings.
            </p>

            <h2 id="editorial-independence" class="mb-4 text-2xl font-bold text-gray-900">
              Editorial Independence
            </h2>
            <p class="mb-6 leading-relaxed">
              Our editorial team operates independently from our business development and partnership teams.
              Editorial decisions—including rankings, reviews, and content recommendations—are made without
              consideration of potential revenue impact. Our founder's background at Carnegie Mellon University
              and experience as an expat sending money internationally informs our approach, but never compromises
              our objectivity. Learn more about our
              <NuxtLink
                to="/about"
                class="text-blue-600 hover:text-blue-700 underline font-semibold"
              >team and mission</NuxtLink>.
            </p>

            <h2 id="partnership-standards" class="mb-4 text-2xl font-bold text-gray-900">
              Partnership Standards
            </h2>
            <p class="mb-4 leading-relaxed">
              We only partner with providers that meet our standards for transparency, reliability, and user protection:
            </p>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li>Valid regulatory licenses in their operating jurisdictions</li>
              <li>Clear, transparent fee and exchange rate disclosures</li>
              <li>Established customer service and complaint resolution processes</li>
              <li>No exclusivity requirements that limit user choice</li>
              <li>Commitment to data security and user privacy</li>
            </ul>

            <h2 id="data-sources" class="mb-4 text-2xl font-bold text-gray-900">
              Data Sources and Accuracy
            </h2>
            <p class="mb-6 leading-relaxed">
              We collect data from multiple sources to ensure accuracy:
            </p>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li><strong class="text-blue-600">Provider APIs / partner feeds:</strong> When available, structured data direct from providers</li>
              <li><strong class="text-blue-600">Public quote flow capture:</strong> Structured capture from provider quote flows where applicable</li>
              <li><strong class="text-blue-600">Spot-check transfers:</strong> Periodic real transfer tests on selected corridors and methods</li>
              <li><strong class="text-blue-600">Regulatory registers:</strong> Public licensing/registration sources where applicable</li>
              <li><strong class="text-blue-600">User submissions:</strong> Reviews and reported issues from our community</li>
            </ul>
            <p class="mb-6 leading-relaxed">
              Rates and fees can change quickly. We show timestamped data captured at a specific moment, but the provider checkout
              experience is always the final source of truth. See our <NuxtLink
                to="/methodology"
                class="text-blue-600 hover:text-blue-700 underline font-semibold"
              >methodology</NuxtLink>
              for details on quote freshness, confidence scoring, and limitations.
            </p>

            <h2 id="user-reviews" class="mb-4 text-2xl font-bold text-gray-900">
              User Reviews and Feedback
            </h2>
            <p class="mb-6 leading-relaxed">
              User reviews are collected through our platform and verified for authenticity. We moderate
              reviews to ensure they comply with our community guidelines, but we do not alter their content
              or ratings. Reviews help inform our evaluations but are just one factor in our comprehensive analysis.
            </p>

            <h2 id="sponsored-content" class="mb-4 text-2xl font-bold text-gray-900">
              Sponsored Content
            </h2>
            <p class="mb-6 leading-relaxed">
              Any sponsored content, including articles, guides, or provider spotlights, is clearly labeled
              as "Sponsored" or "Advertisement." Sponsored providers receive the same rigorous evaluation as
              non-sponsored providers, and sponsorship does not guarantee favorable treatment, higher rankings,
              or positive reviews.
            </p>

            <h2 id="conflicts-of-interest" class="mb-4 text-2xl font-bold text-gray-900">
              Conflicts of Interest
            </h2>
            <p class="mb-6 leading-relaxed">
              We maintain strict separation between our editorial and business operations. Our editorial team
              has no knowledge of or access to revenue data from specific providers. Rankings and recommendations
              are determined solely by our evaluation criteria, not by commercial relationships.
            </p>

            <h2 id="policy-updates" class="mb-4 text-2xl font-bold text-gray-900">
              Updates to This Policy
            </h2>
            <p class="mb-6 leading-relaxed">
              We may update this Disclosure Policy from time to time to reflect changes in our practices,
              partnerships, or legal requirements. Changes will be posted on this page with an updated
              "Last updated" date. We encourage you to review this policy periodically.
            </p>
    </div>

    <template #sidebar>
      <div class="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h3 class="text-sm font-semibold text-blue-900">
          Questions about disclosure?
        </h3>
        <p class="mt-2 text-sm text-blue-800 leading-relaxed">
          If you have questions about partnerships, affiliate relationships, or editorial independence, visit our
          <NuxtLink to="/faq" class="font-semibold underline hover:text-blue-900">FAQ</NuxtLink>
          or <NuxtLink to="/contact" class="font-semibold underline hover:text-blue-900">contact us</NuxtLink>.
        </p>
      </div>
    </template>
  </LegalPageShell>
</template>

<script setup lang="ts">
import LegalPageShell from '~/components/legal/LegalPageShell.vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

const { public: { siteUrl } } = useRuntimeConfig()

const lastUpdatedIso = '2026-01-17'
const lastUpdatedLabel = 'January 17, 2026'

const highlights = [
  {
    title: 'Rankings are never for sale',
    body: 'Providers cannot pay to improve position in comparisons.',
  },
  {
    title: 'Affiliate links stay neutral',
    body: 'Commercial relationships do not change Remit-Score.',
  },
  {
    title: 'Sponsored content is labeled',
    body: 'Paid placements are clearly marked and separated.',
  },
]

const tocItems = [
  { id: 'our-independence', label: 'Our independence' },
  { id: 'how-we-make-money', label: 'How we make money' },
  { id: 'review-process', label: 'Our review process' },
  { id: 'editorial-independence', label: 'Editorial independence' },
  { id: 'partnership-standards', label: 'Partnership standards' },
  { id: 'data-sources', label: 'Data sources and accuracy' },
  { id: 'user-reviews', label: 'User reviews and feedback' },
  { id: 'sponsored-content', label: 'Sponsored content' },
  { id: 'conflicts-of-interest', label: 'Conflicts of interest' },
  { id: 'policy-updates', label: 'Policy updates' },
]

const relatedLinks = [
  {
    title: 'How We Make Money',
    description: 'Revenue sources and guardrails.',
    to: '/how-we-make-money',
  },
  {
    title: 'Methodology',
    description: 'How we compare providers.',
    to: '/methodology',
  },
  {
    title: 'Privacy Policy',
    description: 'How we protect your data.',
    to: '/legal/privacy',
  },
  {
    title: 'Terms of Service',
    description: 'The legal agreement.',
    to: '/legal/terms',
  },
]

setSeo({
  title: 'Affiliate & Disclosure Policy | Transparency & Independence | Remit-Scout',
  description:
    'Learn about Remit-Scout\'s disclosure policy, affiliate relationships, and how we maintain editorial independence while providing unbiased money transfer comparisons.',
  canonical: `${siteUrl}/legal/disclosure`,
  ogType: 'article',
  publishedTime: lastUpdatedIso,
  modifiedTime: lastUpdatedIso,
  author: 'Remit-Scout Editorial Team',
  tags: ['disclosure', 'transparency', 'affiliate'],
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Legal', url: `${siteUrl}/legal` },
  { name: 'Affiliate & Disclosure Policy', url: `${siteUrl}/legal/disclosure` },
])

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Affiliate & Disclosure Policy',
        'url': `${siteUrl}/legal/disclosure`,
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
  { name: 'Affiliate & Disclosure Policy', path: '/legal/disclosure' },
]
</script>
