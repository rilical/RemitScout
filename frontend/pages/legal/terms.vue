<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mx-auto max-w-4xl">
        <div class="rounded-lg bg-white p-8 shadow-md">
          <div class="mb-8">
            <h1 class="mb-4 text-4xl font-bold text-gray-900">
              Terms of Service
            </h1>
            <p class="text-gray-600">
              Last updated: January 1, 2025
            </p>
          </div>

          <div class="prose prose-lg max-w-none">
            <p class="mb-6 text-lg leading-relaxed">
              These Terms of Service ("Terms") govern your access to and use of <strong class="text-blue-600">Remit-Scout's</strong>
              website and services. By accessing or using our services, you agree to be bound by these Terms.
              If you do not agree to these Terms, please do not use our services.
            </p>

            <div class="my-8 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6">
              <h3 class="mb-2 text-lg font-semibold text-blue-900">
                Important Information
              </h3>
              <p class="text-blue-800 leading-relaxed">
                <strong class="text-blue-600">Remit-Scout</strong> is an independent comparison platform. We are not a money
                transfer provider and do not process financial transactions. We provide comparison tools, reviews, and
                educational content to help you make informed decisions. All money transfers are processed by licensed
                third-party providers. Learn more about our
                <NuxtLink
                  to="/about"
                  class="font-semibold underline hover:text-blue-900"
                >mission and services</NuxtLink>.
              </p>
            </div>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Acceptance of Terms
            </h2>
            <p class="mb-6 leading-relaxed">
              By accessing or using <strong class="text-blue-600">Remit-Scout</strong>, you acknowledge that you have read,
              understood, and agree to be bound by these Terms and our
              <NuxtLink
                to="/legal/privacy"
                class="text-blue-600 hover:text-blue-700 underline font-semibold"
              >Privacy Policy</NuxtLink>.
              If you do not agree to these Terms, please do not use our services. These Terms constitute a legally binding
              agreement between you and Remit-Scout.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Description of Services
            </h2>
            <p class="mb-4 leading-relaxed">
              <strong class="text-blue-600">Remit-Scout</strong> provides the following services:
            </p>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li><strong class="text-blue-600">Comparison Tools:</strong> Real-time comparison of money transfer providers, rates, fees, and delivery speeds</li>
              <li><strong class="text-blue-600">Provider Reviews:</strong> Independent reviews and ratings of licensed money transfer providers</li>
              <li><strong class="text-blue-600">Educational Content:</strong> Guides, articles, and resources about international money transfers</li>
              <li><strong class="text-blue-600">Search Functionality:</strong> Tools to find and compare providers for specific corridors and amounts</li>
            </ul>
            <p class="mb-6 leading-relaxed">
              <strong>Important:</strong> We are not a money transfer provider, financial institution, or payment processor.
              We do not process, facilitate, or handle any financial transactions. All money transfers are conducted directly
              between you and licensed third-party providers. We are not responsible for the services, terms, or practices
              of any third-party provider.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              No Financial or Legal Advice
            </h2>
            <p class="mb-6 leading-relaxed">
              Content on <strong class="text-blue-600">Remit-Scout</strong> is for informational purposes only and does not
              constitute financial advice, legal advice, or professional guidance. The information provided through our comparison
              tools, reviews, and educational content is intended to help you make informed decisions, but should not be relied
              upon as the sole basis for financial decisions. You should consult with qualified financial or legal professionals
              before making any significant financial decisions.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Changes to Provider Offerings
            </h2>
            <p class="mb-6 leading-relaxed">
              Money transfer providers may change their exchange rates, fees, promotions, limits, verification requirements,
              delivery speeds, and terms at any time without notice. <strong class="text-blue-600">Remit-Scout</strong> is not
              responsible for these changes. The information displayed on our platform is based on data provided by third-party
              providers and may not reflect the most current rates, fees, or terms. Always verify current rates, fees, and terms
              directly with the provider before initiating a transfer.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Eligibility
            </h2>
            <p class="mb-6 leading-relaxed">
              You must be at least 18 years old to use our services. By using <strong class="text-blue-600">Remit-Scout</strong>,
              you represent and warrant that you are of legal age to form a binding contract and meet all eligibility requirements.
              If you are using our services on behalf of an organization, you represent that you have authority to bind that
              organization to these Terms.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              User Responsibilities
            </h2>
            <p class="mb-4 leading-relaxed">
              You agree to use our services responsibly and in accordance with these Terms:
            </p>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li><strong class="text-blue-600">Accurate Information:</strong> Provide accurate, complete, and current information when using our services</li>
              <li><strong class="text-blue-600">Lawful Use:</strong> Use our services only for lawful purposes and in compliance with applicable laws and regulations</li>
              <li><strong class="text-blue-600">No Unauthorized Access:</strong> Not attempt to gain unauthorized access to our systems, accounts, or networks</li>
              <li><strong class="text-blue-600">Respect Intellectual Property:</strong> Respect our intellectual property rights and those of third parties</li>
              <li><strong class="text-blue-600">No Fraudulent Activity:</strong> Not use our services for any fraudulent, deceptive, or illegal purposes</li>
              <li><strong class="text-blue-600">No Interference:</strong> Not interfere with or disrupt the operation of our services or servers</li>
              <li><strong class="text-blue-600">No Automated Access:</strong> Not use bots, scrapers, or other automated means to access our services without permission</li>
            </ul>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Intellectual Property Rights
            </h2>
            <p class="mb-6 leading-relaxed">
              All content, features, and functionality of <strong class="text-blue-600">Remit-Scout</strong>, including but not
              limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software,
              are owned by Remit-Scout or its licensors and are protected by copyright, trademark, patent, trade secret, and other
              intellectual property laws. You may not reproduce, distribute, modify, create derivative works of, publicly display,
              publicly perform, republish, download, store, or transmit any of our content without our prior written consent.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Disclaimer of Warranties
            </h2>
            <p class="mb-6 leading-relaxed">
              Our services are provided "as is" and "as available" without warranties of any kind, either express or implied.
              To the fullest extent permitted by law, we disclaim all warranties, including but not limited to:
            </p>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li>Warranties of merchantability, fitness for a particular purpose, and non-infringement</li>
              <li>Accuracy, completeness, reliability, or timeliness of information provided through our platform</li>
              <li>Uninterrupted, secure, or error-free operation of our services</li>
              <li>That defects will be corrected or that our services are free of viruses or other harmful components</li>
            </ul>
            <p class="mb-6 leading-relaxed">
              We do not guarantee the accuracy, availability, timeliness, pricing, or terms displayed by third-party money transfer
              providers. All information on our platform is subject to change without notice, and you are solely responsible for
              verifying final rates and fees on the provider's website. The information provided through our platform is based on
              data from third-party sources and may contain errors or become outdated. Always verify current rates and terms directly
              with providers before making transfers.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Limitation of Liability
            </h2>
            <p class="mb-6 leading-relaxed">
              To the fullest extent permitted by law, in no event shall <strong class="text-blue-600">Remit-Scout</strong>, its
              affiliates, officers, directors, employees, agents, or licensors be liable for any indirect, incidental, special,
              consequential, or punitive damages, including but not limited to:
            </p>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li>Loss of profits, revenue, data, or use</li>
              <li>Business interruption or loss of business opportunities</li>
              <li>Damages arising from your use of or inability to use our services</li>
              <li>Damages arising from any transactions between you and third-party providers</li>
              <li>Errors or omissions in content or information provided through our platform</li>
            </ul>
            <p class="mb-6 leading-relaxed">
              Our total liability to you for any claims arising from or related to these Terms or our services shall not exceed
              the amount you paid to us, if any, in the twelve months preceding the claim, or $100, whichever is greater.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Third-Party Services and Links
            </h2>
            <p class="mb-6 leading-relaxed">
              Our platform contains links to third-party websites, including money transfer providers. We are not responsible for
              the content, privacy policies, terms of service, or practices of any third-party websites or services. When you
              click on provider links, you will be directed to their websites, and their terms and conditions will apply to any
              transactions you conduct with them. We encourage you to review the terms and privacy policies of any third-party
              services you use.
            </p>
            <p class="mb-6 leading-relaxed">
              <strong class="text-blue-600">Remit-Scout</strong> may receive referral fees or commissions when you click certain
              links or choose certain providers. These relationships do not influence our rankings or comparison results. Our
              comparison algorithm and provider rankings are based solely on objective criteria including rates, fees, delivery speed,
              and reliability. For more information, see our
              <NuxtLink
                to="/legal/disclosure"
                class="text-blue-600 hover:text-blue-700 underline font-semibold"
              >Disclosure Policy</NuxtLink>.
            </p>
            <p class="mb-6 leading-relaxed">
              We do not endorse, guarantee, or assume responsibility for any third-party services, products, or content. Your
              interactions with third-party providers are solely between you and the provider. We are not a party to any
              transactions between you and third-party providers.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Indemnification
            </h2>
            <p class="mb-6 leading-relaxed">
              You agree to indemnify, defend, and hold harmless <strong class="text-blue-600">Remit-Scout</strong>, its affiliates,
              officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, losses, costs,
              or expenses (including reasonable attorneys' fees) arising out of or related to:
            </p>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li>Your use of our services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your violation of any applicable laws or regulations</li>
            </ul>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Termination
            </h2>
            <p class="mb-6 leading-relaxed">
              We may terminate or suspend your access to our services immediately, without prior notice or liability, for any reason,
              including but not limited to:
            </p>
            <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
              <li>Breach of these Terms</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>Violation of applicable laws or regulations</li>
              <li>At our sole discretion, for any other reason</li>
            </ul>
            <p class="mb-6 leading-relaxed">
              Upon termination, your right to use our services will immediately cease. All provisions of these Terms that by their
              nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and
              limitations of liability.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Changes to Terms
            </h2>
            <p class="mb-6 leading-relaxed">
              We reserve the right to modify, update, or replace these Terms at any time at our sole discretion. If we make material
              changes, we will notify you by posting the updated Terms on this page with a new "Last updated" date. Your continued
              use of our services after any changes constitutes acceptance of the modified Terms. If you do not agree to the modified
              Terms, you must stop using our services.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Governing Law and Dispute Resolution
            </h2>
            <p class="mb-6 leading-relaxed">
              These Terms are governed by the laws of the State of Delaware, without regard to conflict-of-law rules. Any dispute
              arising from or related to these Terms or our services shall be resolved through binding arbitration in Delaware,
              in accordance with applicable arbitration rules, unless prohibited by law. You agree to waive any right to a jury
              trial and to participate in a class action lawsuit.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Severability
            </h2>
            <p class="mb-6 leading-relaxed">
              If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall
              continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make
              it valid and enforceable.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Entire Agreement
            </h2>
            <p class="mb-6 leading-relaxed">
              These Terms, together with our
              <NuxtLink
                to="/legal/privacy"
                class="text-blue-600 hover:text-blue-700 underline font-semibold"
              >Privacy Policy</NuxtLink>
              and
              <NuxtLink
                to="/legal/disclosure"
                class="text-blue-600 hover:text-blue-700 underline font-semibold"
              >Disclosure Policy</NuxtLink>,
              constitute the entire agreement between you and <strong class="text-blue-600">Remit-Scout</strong> regarding your use
              of our services and supersede all prior agreements and understandings.
            </p>

            <!-- CTA Section -->
            <div class="my-12 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8">
              <h3 class="mb-4 text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>📚</span>
                <span>Learn More About Remit-Scout</span>
              </h3>
              <p class="mb-6 text-gray-700 leading-relaxed">
                <span>🎯</span> Understand our mission, how we operate, and our commitment to providing transparent, independent money transfer
                comparisons. <span>🛡️</span>
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
                    <div class="text-sm text-gray-600">How we compare providers</div>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/legal/disclosure"
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <div>
                    <div class="font-semibold text-gray-900">Disclosure Policy</div>
                    <div class="text-sm text-gray-600">Our transparency commitment</div>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/legal/privacy"
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <div>
                    <div class="font-semibold text-gray-900">Privacy Policy</div>
                    <div class="text-sm text-gray-600">How we protect your data</div>
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
              </div>
            </div>

            <div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <h3 class="mb-2 text-lg font-semibold text-blue-900">
                Questions About Our Terms of Service?
              </h3>
              <p class="mb-4 text-blue-800 leading-relaxed">
                If you have questions about these Terms or need clarification on any aspect of our services,
                we're here to help. Visit our
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
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Terms of Service | Remit-Scout Legal Agreement',
  description:
    'Read the Terms of Service for Remit-Scout. Understand the rules and conditions for using our money transfer comparison platform.',
  canonical: `${siteUrl}/legal/terms`,
  ogImage: `${siteUrl}/images/og/terms.jpg`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Legal', url: `${siteUrl}/legal` },
  { name: 'Terms of Service', url: `${siteUrl}/legal/terms` },
])

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Legal', path: '/legal' },
  { name: 'Terms of Service', path: '/legal/terms' },
]
</script>
