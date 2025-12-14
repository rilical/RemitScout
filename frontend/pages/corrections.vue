<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mx-auto max-w-4xl">
        <div class="rounded-lg bg-white p-8 shadow-md">
          <div class="mb-8">
            <h1 class="mb-4 text-4xl font-bold text-gray-900">
              Corrections Policy
            </h1>
            <p class="text-gray-600">
              Last updated: December 2025
            </p>
          </div>

          <div class="prose prose-lg max-w-none">
            <p class="mb-6 text-lg leading-relaxed">
              At <strong class="text-blue-600">Remit-Scout</strong>, accuracy is fundamental to our mission. We strive to provide the most current and accurate information about money transfer providers, including exchange rates, fees, delivery times, and provider availability. However, pricing and availability can change, and errors can occur. This Corrections Policy explains how we handle corrections and how you can report issues.
            </p>

            <div class="my-8 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6">
              <h3 class="mb-2 text-lg font-semibold text-blue-900">
                Our Commitment to Accuracy
              </h3>
              <p class="text-blue-800 leading-relaxed">
                We take data accuracy seriously. Every quote is timestamped, and we refresh data frequently for popular corridors. However, rates can change throughout the day, and some fees or promotions depend on payment method, KYC status, or payout method. The provider's checkout is always the final source of truth. If you notice a discrepancy between our displayed quote and the provider's checkout, we want to know about it.
              </p>
            </div>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              How to Request a Correction
            </h2>
            <p class="mb-4 leading-relaxed">
              If you notice incorrect pricing, fees, availability, or any other information on Remit-Scout, please report it using our issue form. The fastest path to a fix is providing enough detail for us to reproduce the result.
            </p>

            <h3 class="mb-3 text-xl font-semibold text-gray-900">
              What to Include in Your Report
            </h3>
            <p class="mb-4 leading-relaxed">
              To help us investigate and correct issues quickly, please include the following information:
            </p>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li><strong class="text-blue-600">Corridor:</strong> Sending country → receiving country</li>
              <li><strong class="text-blue-600">Send amount:</strong> The amount you entered</li>
              <li><strong class="text-blue-600">Payout method:</strong> Bank transfer, cash pickup, mobile wallet, etc. (if applicable)</li>
              <li><strong class="text-blue-600">Timestamp:</strong> The timestamp shown on Remit-Scout when you viewed the quote</li>
              <li><strong class="text-blue-600">Provider name:</strong> The provider you're reporting about</li>
              <li><strong class="text-blue-600">Payment method:</strong> Bank transfer, debit card, credit card, etc. (if applicable)</li>
              <li><strong class="text-blue-600">Screenshot (optional but helpful):</strong> A screenshot of the provider's checkout screen showing the final amount and fees</li>
            </ul>

            <div class="my-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
              <h3 class="mb-3 text-lg font-semibold text-gray-900">
                Why Quotes May Differ
              </h3>
              <p class="mb-4 leading-relaxed">
                Before reporting, please note that quotes can legitimately differ from checkout due to:
              </p>
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
                  <span><strong class="text-blue-600">Payment method:</strong> Bank transfer vs. debit card vs. credit card can affect pricing</span>
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
                  <span><strong class="text-blue-600">Promotions:</strong> New-user discounts, corridor-specific promos, or limited-time offers</span>
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
                  <span><strong class="text-blue-600">KYC status:</strong> New vs. verified customers may see different rates</span>
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
                  <span><strong class="text-blue-600">Rate movement:</strong> Exchange rates can change between quote time and checkout time</span>
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
                  <span><strong class="text-blue-600">Local rules and recipient banking requirements:</strong> Some providers adjust pricing based on recipient bank or location</span>
                </li>
              </ul>
            </div>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              What Happens After You Report
            </h2>
            <p class="mb-4 leading-relaxed">
              When you report an issue, we follow a systematic process to investigate and resolve it:
            </p>
            <ol class="mb-6 list-inside list-decimal space-y-3 leading-relaxed">
              <li><strong class="text-blue-600">We attempt to reproduce the quote</strong> using the same corridor, amount, payment method, payout method, and timestamp window you provided.</li>
              <li><strong class="text-blue-600">We check for common checkout differences</strong> such as payment method variations, promotional discounts, KYC verification status, transfer limits, and provider-specific rules that might affect pricing.</li>
              <li><strong class="text-blue-600">If the issue is on our side</strong> (for example, stale data, incorrect fee calculation, or systematic capture error), we update our data logic and refresh the affected quotes immediately.</li>
              <li><strong class="text-blue-600">If we publish a correction</strong>, we aim to be specific about what changed and why, so users understand the update.</li>
              <li><strong class="text-blue-600">We use reports to improve our data pipeline</strong> and prevent similar issues in the future.</li>
            </ol>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              How Quickly We Fix Errors
            </h2>
            <p class="mb-6 leading-relaxed">
              We treat data accuracy seriously. We investigate reports promptly and update the site when we confirm an issue. Some mismatches are caused by normal checkout variables (as listed above), but if we find a systematic capture error or stale quote behavior, we fix it immediately. Our goal is to resolve confirmed issues within 24-48 hours, though complex cases may take longer.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Trust & Safety
            </h2>
            <p class="mb-6 leading-relaxed">
              <strong class="text-blue-600">Remit-Scout</strong> is a comparison and research product. We do not hold, move, or transmit money. When you choose a provider, you complete the transfer on that provider's licensed website or app. We help you compare options and link you to providers, but we do not process payments or control provider outcomes. If something goes wrong with your transfer, the provider you chose is responsible for processing your transfer and handling disputes.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Data Sources and Verification
            </h2>
            <p class="mb-4 leading-relaxed">
              We collect pricing data from multiple sources to ensure accuracy:
            </p>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li><strong class="text-blue-600">Direct provider API access:</strong> Real-time exchange rates and fee information (most accurate when available)</li>
              <li><strong class="text-blue-600">Partner data feeds:</strong> Structured exports from provider partners</li>
              <li><strong class="text-blue-600">Public quote capture:</strong> Quote requests from provider websites/apps (useful for coverage, but can be less consistent)</li>
            </ul>
            <p class="mb-6 leading-relaxed">
              We normalize this data into a standardized comparison so you can evaluate providers fairly. However, rates and fees can change, so we recommend verifying current information directly with providers before making transfers. Every quote is timestamped, and we refresh frequently, especially for popular corridors.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Updates to This Policy
            </h2>
            <p class="mb-6 leading-relaxed">
              We may update this Corrections Policy from time to time to reflect changes in our practices, data collection methods, or legal requirements. Changes will be posted on this page with an updated "Last updated" date. We encourage you to review this policy periodically.
            </p>

            <!-- CTA Section -->
            <div class="my-12 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8">
              <h3 class="mb-4 text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>📚</span>
                <span>Learn More About Remit-Scout</span>
              </h3>
              <p class="mb-6 text-gray-700 leading-relaxed">
                <span>🛡️</span> Transparency is at the heart of everything we do. <span>🔍</span> Explore our methodology, learn about our team,
                and understand how we help you find the best money transfer options. <span>✨</span>
              </p>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NuxtLink
                  to="/about"
                  class="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                >
                  <span class="text-3xl">👤</span>
                  <div>
                    <div class="font-semibold text-gray-900">About Us</div>
                    <div class="text-sm text-gray-600">Our story and mission</div>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/methodology"
                  class="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                >
                  <span class="text-3xl">📊</span>
                  <div>
                    <div class="font-semibold text-gray-900">Methodology</div>
                    <div class="text-sm text-gray-600">How we compare providers</div>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/how-we-make-money"
                  class="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                >
                  <span class="text-3xl">💰</span>
                  <div>
                    <div class="font-semibold text-gray-900">Revenue Model</div>
                    <div class="text-sm text-gray-600">How we make money</div>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/faq"
                  class="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                >
                  <span class="text-3xl">❓</span>
                  <div>
                    <div class="font-semibold text-gray-900">FAQ</div>
                    <div class="text-sm text-gray-600">Common questions</div>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/contact"
                  class="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                >
                  <span class="text-3xl">📧</span>
                  <div>
                    <div class="font-semibold text-gray-900">Contact Us</div>
                    <div class="text-sm text-gray-600">Get in touch</div>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/partnerships"
                  class="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                >
                  <span class="text-3xl">🤝</span>
                  <div>
                    <div class="font-semibold text-gray-900">Partnerships</div>
                    <div class="text-sm text-gray-600">Partner with us</div>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <h3 class="mb-2 text-lg font-semibold text-blue-900">
                Questions About Our Corrections Policy?
              </h3>
              <p class="mb-4 text-blue-800 leading-relaxed">
                If you have questions about how we handle corrections, investigate reports, or update our data, we're here to help. Visit our
                <NuxtLink
                  to="/faq"
                  class="font-semibold underline hover:text-blue-900"
                >FAQ page</NuxtLink>
                or <NuxtLink
                  to="/contact?type=issue"
                  class="font-semibold underline hover:text-blue-900"
                >report an issue directly</NuxtLink>.
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
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'
const canonicalUrl = `${siteUrl}/corrections`
const lastReviewedIso = '2025-12-01'

setSeo({
  title: 'Corrections Policy | Report Issues & Request Corrections | Remit-Scout',
  description: 'Report issues and request corrections for Remit-Scout quote data and pages. We investigate and update when needed.',
  canonical: canonicalUrl,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Corrections', url: canonicalUrl },
])

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Corrections', path: '/corrections' },
]
</script>
