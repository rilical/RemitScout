<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mx-auto max-w-4xl">
        <div class="rounded-lg bg-white p-8 shadow-md">
          <div class="mb-8">
            <h1 class="mb-4 text-4xl font-bold text-gray-900">
              Affiliate & Disclosure Policy
            </h1>
            <p class="text-gray-600">
              Last updated: November 22, 2025
            </p>
          </div>

          <div class="prose prose-lg max-w-none">
            <p class="mb-6 text-lg leading-relaxed">
              At <strong class="text-blue-600">Remit-Scout</strong>, transparency is fundamental to our mission.
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

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Our Independence
            </h2>
            <p class="mb-6 leading-relaxed">
              <strong class="text-blue-600">Remit-Scout</strong> operates independently and is not owned by,
              affiliated with, or controlled by any money transfer provider. Our recommendations, rankings,
              and reviews are based on objective analysis of real-time data, actual transfer testing, and
              comprehensive evaluation criteria. Learn more about our
              <NuxtLink
                to="/methodology"
                class="text-blue-600 hover:text-blue-700 underline font-semibold"
              >testing methodology</NuxtLink>
              and how we compare providers.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
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
                <strong class="text-blue-600">Advertising Partnerships:</strong> We may display advertisements
                from money transfer providers and related services. All ads are clearly marked.
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
              </ul>
            </div>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Our Review Process
            </h2>
            <p class="mb-4 leading-relaxed">
              Our evaluations are based on comprehensive, data-driven analysis. We test providers through
              <NuxtLink
                to="/methodology"
                class="text-blue-600 hover:text-blue-700 underline font-semibold"
              >real transfer testing</NuxtLink>
              and evaluate multiple factors:
            </p>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li><strong class="text-blue-600">Exchange rates and fee structures:</strong> We compare actual rates and total costs, including hidden fees</li>
              <li><strong class="text-blue-600">Transfer speed and reliability:</strong> We track delivery times and success rates</li>
              <li><strong class="text-blue-600">Customer service quality:</strong> Based on user reviews and our own testing</li>
              <li><strong class="text-blue-600">Security and regulatory compliance:</strong> We verify licensing and regulatory status</li>
              <li><strong class="text-blue-600">Geographic coverage:</strong> We assess which corridors each provider serves best</li>
              <li><strong class="text-blue-600">User experience:</strong> We evaluate ease of use, mobile apps, and customer support</li>
            </ul>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
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

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
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

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Data Sources and Accuracy
            </h2>
            <p class="mb-6 leading-relaxed">
              We collect data from multiple sources to ensure accuracy:
            </p>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li><strong class="text-blue-600">Provider APIs:</strong> Real-time exchange rates and fee information</li>
              <li><strong class="text-blue-600">Real transfer testing:</strong> We conduct actual transfers to verify rates, fees, and delivery times</li>
              <li><strong class="text-blue-600">Regulatory databases:</strong> Licensing and compliance information from official sources</li>
              <li><strong class="text-blue-600">User submissions:</strong> Verified reviews and experiences from our community</li>
              <li><strong class="text-blue-600">Market research:</strong> Industry reports and financial data</li>
            </ul>
            <p class="mb-6 leading-relaxed">
              All data is verified for accuracy and updated regularly. However, rates and fees can change,
              so we recommend verifying current information directly with providers before making transfers.
              See our <NuxtLink
                to="/methodology"
                class="text-blue-600 hover:text-blue-700 underline font-semibold"
              >methodology</NuxtLink>
              for details on how we test and verify information.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              User Reviews and Feedback
            </h2>
            <p class="mb-6 leading-relaxed">
              User reviews are collected through our platform and verified for authenticity. We moderate
              reviews to ensure they comply with our community guidelines, but we do not alter their content
              or ratings. Reviews help inform our evaluations but are just one factor in our comprehensive analysis.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Sponsored Content
            </h2>
            <p class="mb-6 leading-relaxed">
              Any sponsored content, including articles, guides, or provider spotlights, is clearly labeled
              as "Sponsored" or "Advertisement." Sponsored providers receive the same rigorous evaluation as
              non-sponsored providers, and sponsorship does not guarantee favorable treatment, higher rankings,
              or positive reviews.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Conflicts of Interest
            </h2>
            <p class="mb-6 leading-relaxed">
              We maintain strict separation between our editorial and business operations. Our editorial team
              has no knowledge of or access to revenue data from specific providers. Rankings and recommendations
              are determined solely by our evaluation criteria, not by commercial relationships.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Updates to This Policy
            </h2>
            <p class="mb-6 leading-relaxed">
              We may update this Disclosure Policy from time to time to reflect changes in our practices,
              partnerships, or legal requirements. Changes will be posted on this page with an updated
              "Last updated" date. We encourage you to review this policy periodically.
            </p>

            <!-- CTA Section -->
            <div class="my-12 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8">
              <h3 class="mb-4 text-2xl font-bold text-gray-900">
                Learn More About Remit-Scout
              </h3>
              <p class="mb-6 text-gray-700 leading-relaxed">
                Transparency is at the heart of everything we do. Explore our methodology, learn about our team,
                and understand how we help you find the best money transfer options.
              </p>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NuxtLink
                  to="/about"
                  class="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                >
                  <svg
                    class="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <div>
                    <div class="font-semibold text-gray-900">About Us</div>
                    <div class="text-sm text-gray-600">Our story and mission</div>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/methodology"
                  class="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                >
                  <svg
                    class="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <div>
                    <div class="font-semibold text-gray-900">Methodology</div>
                    <div class="text-sm text-gray-600">How we test providers</div>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/how-we-make-money"
                  class="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                >
                  <svg
                    class="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div class="font-semibold text-gray-900">Revenue Model</div>
                    <div class="text-sm text-gray-600">How we make money</div>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/faq"
                  class="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                >
                  <svg
                    class="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div class="font-semibold text-gray-900">FAQ</div>
                    <div class="text-sm text-gray-600">Common questions</div>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/contact"
                  class="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                >
                  <svg
                    class="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <div class="font-semibold text-gray-900">Contact Us</div>
                    <div class="text-sm text-gray-600">Get in touch</div>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/affiliate-partnerships"
                  class="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                >
                  <svg
                    class="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <div>
                    <div class="font-semibold text-gray-900">Partnerships</div>
                    <div class="text-sm text-gray-600">Partner with us</div>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <h3 class="mb-2 text-lg font-semibold text-blue-900">
                Questions About Our Disclosure Policy?
              </h3>
              <p class="mb-4 text-blue-800 leading-relaxed">
                If you have questions about our disclosure practices, affiliate relationships, or how we maintain
                editorial independence, we're here to help. Visit our
                <NuxtLink
                  to="/faq"
                  class="font-semibold underline hover:text-blue-900"
                >FAQ page</NuxtLink>
                or <NuxtLink
                  to="/contact"
                  class="font-semibold underline hover:text-blue-900"
                >contact us directly</NuxtLink>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'

// Meta
useHead({
  title: 'Affiliate & Disclosure Policy | Transparency & Independence | Remit-Scout',
  meta: [
    {
      name: 'description',
      content:
        'Learn about Remit-Scout\'s disclosure policy, affiliate relationships, and how we maintain editorial independence while providing unbiased money transfer comparisons.',
    },
    {
      name: 'keywords',
      content: 'affiliate disclosure, transparency policy, money transfer comparison, editorial independence, Remit-Scout',
    },
  ],
})

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Legal', path: '/legal' },
  { name: 'Affiliate & Disclosure Policy', path: '/legal/disclosure' },
]
</script>
