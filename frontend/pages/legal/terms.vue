<template>
  <LegalPageShell
    title="Terms of Service"
    subtitle="The legal agreement for using Remit-Scout and our comparison tools."
    badge="Terms"
    :last-updated-label="lastUpdatedLabel"
    :last-updated-iso="lastUpdatedIso"
    :breadcrumb-items="breadcrumbItems"
    :toc="tocItems"
    :highlights="highlights"
    :related="relatedLinks"
  >
    <div class="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-rs-fg prose-a:font-semibold prose-a:text-brand-600">
      <p class="mb-6 text-body-lg leading-relaxed">
        These Terms of Service ("Terms") govern your access to and use of the <strong class="text-brand-600">Remit-Scout</strong>
        website and services (the "Service"), operated by <strong class="text-brand-600">Remit-Scout LLC</strong> ("Remit-Scout,"
        "we," "our," or "us"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to
        these Terms, please do not use the Service.
      </p>

      <div class="my-8 rounded-lg border-l-4 border-primary-500 bg-primary-50 p-6">
        <h3 class="mb-2 text-body-lg font-semibold text-primary-900">
          Important Information
        </h3>
        <p class="text-primary-800 leading-relaxed">
          <strong class="text-brand-600">Remit-Scout</strong> is an independent comparison platform. We are not a money transfer
          provider, bank, or payment processor, and we do not move money. We provide comparison tools, reviews, and
          educational content to help you make informed decisions. Transfers are completed directly with licensed third-party
          providers. The core comparison experience is available without creating an account; we also offer optional accounts
          and a paid membership (<strong class="text-brand-600">Remit-Scout Plus</strong>) for additional features. Membership
          does not change provider rankings or results. Learn more about our
          <NuxtLink
            to="/about"
            class="font-semibold underline hover:text-primary-900"
          >mission and services</NuxtLink>.
        </p>
      </div>

      <h2
        id="acceptance-of-terms"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Acceptance of Terms
      </h2>
      <p class="mb-6 leading-relaxed">
        By accessing or using <strong class="text-brand-600">Remit-Scout</strong>, you acknowledge that you have read,
        understood, and agree to be bound by these Terms and our
        <NuxtLink
          to="/legal/privacy"
          class="text-brand-600 hover:text-brand-700 underline font-semibold"
        >Privacy Policy</NuxtLink>.
        If you do not agree to these Terms, please do not use the Service. These Terms constitute a legally binding agreement
        between you and Remit-Scout LLC.
      </p>

      <h2
        id="description-of-services"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Description of Services
      </h2>
      <p class="mb-4 leading-relaxed">
        <strong class="text-brand-600">Remit-Scout</strong> provides the following services:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-brand-600">Comparison Tools:</strong> Real-time comparison of money transfer providers, rates, fees, and delivery speeds</li>
        <li><strong class="text-brand-600">Provider Reviews:</strong> Independent reviews and ratings of licensed money transfer providers</li>
        <li><strong class="text-brand-600">Educational Content:</strong> Guides, articles, and resources about international money transfers</li>
        <li><strong class="text-brand-600">Search Functionality:</strong> Tools to find and compare providers for specific corridors and amounts</li>
        <li><strong class="text-brand-600">Account Features (optional):</strong> Features such as saving items, alerts, and enhanced history (availability may vary)</li>
      </ul>
      <p class="mb-6 leading-relaxed">
        <strong>Important:</strong> We are not a money transfer provider, financial institution, or payment processor.
        We do not process, facilitate, or handle any financial transactions. All money transfers are conducted directly
        between you and licensed third-party providers. We are not responsible for the services, terms, or practices
        of any third-party provider.
      </p>

      <h2
        id="no-financial-advice"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        No Financial or Legal Advice
      </h2>
      <p class="mb-6 leading-relaxed">
        Content on <strong class="text-brand-600">Remit-Scout</strong> is for informational purposes only and does not
        constitute financial advice, legal advice, or professional guidance. The information provided through our comparison
        tools, reviews, and educational content is intended to help you make informed decisions, but should not be relied
        upon as the sole basis for financial decisions. You should consult with qualified financial or legal professionals
        before making any significant financial decisions.
      </p>

      <h2
        id="provider-offerings"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Changes to Provider Offerings
      </h2>
      <p class="mb-6 leading-relaxed">
        Money transfer providers may change their exchange rates, fees, promotions, limits, verification requirements,
        delivery speeds, and terms at any time without notice. <strong class="text-brand-600">Remit-Scout</strong> is not
        responsible for these changes. The information displayed on our platform is based on data provided by third-party
        providers and may not reflect the most current rates, fees, or terms. Always verify current rates, fees, and terms
        directly with the provider before initiating a transfer.
      </p>

      <h2
        id="eligibility"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Eligibility
      </h2>
      <p class="mb-6 leading-relaxed">
        You must be at least 18 years old to use our services. By using <strong class="text-brand-600">Remit-Scout</strong>,
        you represent and warrant that you are of legal age to form a binding contract and meet all eligibility requirements.
        If you are using our services on behalf of an organization, you represent that you have authority to bind that
        organization to these Terms.
      </p>

      <h2
        id="accounts"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Accounts
      </h2>
      <p class="mb-6 leading-relaxed">
        Some features may require you to create an account. When creating an account, you agree to provide accurate and
        up-to-date information and to keep your account credentials confidential. You are responsible for all activity that
        occurs under your account. If you believe your account has been compromised, please notify us via our
        <NuxtLink
          to="/contact"
          class="text-brand-600 hover:text-brand-700 underline font-semibold"
        >contact page</NuxtLink>.
      </p>

      <h2
        id="remit-scout-plus"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Remit-Scout Plus (Paid Membership)
      </h2>
      <p class="mb-4 leading-relaxed">
        <strong class="text-brand-600">Remit-Scout Plus</strong> is an optional paid membership that provides access to certain
        additional features. The specific features available under Plus may evolve over time, but Plus does not affect provider
        rankings, comparison results, or our methodology.
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-brand-600">Billing cycle:</strong> Monthly subscription</li>
        <li><strong class="text-brand-600">Automatic renewal:</strong> Your subscription renews automatically unless you cancel</li>
        <li><strong class="text-brand-600">Cancellation:</strong> If you cancel, access continues until the end of your current billing period</li>
        <li><strong class="text-brand-600">No free trial:</strong> Unless we explicitly state otherwise at purchase</li>
        <li><strong class="text-brand-600">No refunds:</strong> All fees are non-refundable unless required by law</li>
      </ul>
      <p class="mb-6 leading-relaxed">
        Payments for Plus are processed by <strong class="text-brand-600">Stripe</strong>. By purchasing Plus, you agree to pay
        the fees and applicable taxes, and you authorize us (through Stripe) to charge your selected payment method. We do not
        store full payment card numbers.
      </p>
      <p class="mb-6 leading-relaxed">
        We may change Plus pricing in the future. If pricing changes apply to existing subscribers, we will provide reasonable
        notice and give you an opportunity to cancel before the new price takes effect.
      </p>

      <h2
        id="user-responsibilities"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        User Responsibilities
      </h2>
      <p class="mb-4 leading-relaxed">
        You agree to use our services responsibly and in accordance with these Terms:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-brand-600">Accurate Information:</strong> Provide accurate, complete, and current information when using our services</li>
        <li><strong class="text-brand-600">Lawful Use:</strong> Use our services only for lawful purposes and in compliance with applicable laws and regulations</li>
        <li><strong class="text-brand-600">No Unauthorized Access:</strong> Not attempt to gain unauthorized access to our systems, accounts, or networks</li>
        <li><strong class="text-brand-600">Respect Intellectual Property:</strong> Respect our intellectual property rights and those of third parties</li>
        <li><strong class="text-brand-600">No Fraudulent Activity:</strong> Not use our services for any fraudulent, deceptive, or illegal purposes</li>
        <li><strong class="text-brand-600">No Interference:</strong> Not interfere with or disrupt the operation of our services or servers</li>
        <li><strong class="text-brand-600">No Automated Access:</strong> Not use bots, scrapers, crawlers, or other automated means to access the Service without our permission</li>
        <li><strong class="text-brand-600">No Reverse Engineering:</strong> Not reverse engineer, decompile, or attempt to discover source code or underlying methods used by the Service</li>
        <li><strong class="text-brand-600">No Circumvention:</strong> Not bypass or circumvent access controls, rate limits, paywalls, or other protective measures</li>
        <li><strong class="text-brand-600">No Resale:</strong> Not resell, license, or commercially exploit the Service or its outputs except as expressly permitted by us</li>
      </ul>

      <h2
        id="intellectual-property"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Intellectual Property Rights
      </h2>
      <p class="mb-6 leading-relaxed">
        All content, features, and functionality of <strong class="text-brand-600">Remit-Scout</strong>, including but not
        limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software,
        are owned by Remit-Scout or its licensors and are protected by copyright, trademark, patent, trade secret, and other
        intellectual property laws. You may not reproduce, distribute, modify, create derivative works of, publicly display,
        publicly perform, republish, download, store, or transmit any of our content without our prior written consent.
      </p>

      <h2
        id="user-content"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        User Content (Reviews)
      </h2>
      <p class="mb-4 leading-relaxed">
        You may be able to submit content such as reviews, ratings, comments, or other materials ("User Content"). You retain
        ownership of your User Content, but you grant Remit-Scout a non-exclusive, worldwide, royalty-free, transferable, and
        sublicensable license to use, host, store, reproduce, modify, publish, display, and distribute your User Content in
        connection with operating and improving the Service.
      </p>
      <p class="mb-6 leading-relaxed">
        You represent and warrant that you have all rights necessary to grant this license and that your User Content does
        not violate any law or any third-party rights. We may remove or restrict User Content at any time in our discretion.
      </p>

      <h2
        id="disclaimer"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
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

      <h2
        id="limitation-of-liability"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Limitation of Liability
      </h2>
      <p class="mb-6 leading-relaxed">
        To the fullest extent permitted by law, in no event shall <strong class="text-brand-600">Remit-Scout</strong>, its
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

      <h2
        id="third-party-services"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
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
        <strong class="text-brand-600">Remit-Scout</strong> may receive referral fees or commissions when you click certain
        links or choose certain providers. These relationships do not influence our rankings or comparison results. Our
        comparison algorithm and provider rankings are based solely on objective criteria including rates, fees, delivery speed,
        and reliability. For more information, see our
        <NuxtLink
          to="/legal/disclosure"
          class="text-brand-600 hover:text-brand-700 underline font-semibold"
        >Disclosure Policy</NuxtLink>.
      </p>
      <p class="mb-6 leading-relaxed">
        We do not endorse, guarantee, or assume responsibility for any third-party services, products, or content. Your
        interactions with third-party providers are solely between you and the provider. We are not a party to any
        transactions between you and third-party providers.
      </p>

      <h2
        id="indemnification"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Indemnification
      </h2>
      <p class="mb-6 leading-relaxed">
        You agree to indemnify, defend, and hold harmless <strong class="text-brand-600">Remit-Scout</strong>, its affiliates,
        officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, losses, costs,
        or expenses (including reasonable attorneys' fees) arising out of or related to:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li>Your use of our services</li>
        <li>Your violation of these Terms</li>
        <li>Your violation of any rights of another party</li>
        <li>Your violation of any applicable laws or regulations</li>
      </ul>

      <h2
        id="termination"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
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

      <h2
        id="changes-to-terms"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Changes to Terms
      </h2>
      <p class="mb-6 leading-relaxed">
        We reserve the right to modify, update, or replace these Terms at any time at our sole discretion. If we make material
        changes, we will notify you by posting the updated Terms on this page with a new "Last updated" date. Your continued
        use of our services after any changes constitutes acceptance of the modified Terms. If you do not agree to the modified
        Terms, you must stop using our services.
      </p>

      <h2
        id="governing-law"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Governing Law and Dispute Resolution
      </h2>
      <p class="mb-6 leading-relaxed">
        These Terms are governed by the laws of the State of Delaware, without regard to conflict-of-law rules.
      </p>
      <p class="mb-6 leading-relaxed">
        <strong class="text-brand-600">Informal resolution:</strong> Before starting a formal dispute, you agree to contact us
        via our <NuxtLink
          to="/contact"
          class="text-brand-600 hover:text-brand-700 underline font-semibold"
        >contact page</NuxtLink>
        and attempt to resolve the dispute informally.
      </p>
      <p class="mb-6 leading-relaxed">
        <strong class="text-brand-600">Arbitration and class action waiver:</strong> To the extent permitted by law, any
        dispute arising from or related to these Terms or the Service will be resolved through binding arbitration in
        Delaware, and you waive any right to a jury trial and to participate in a class action lawsuit. This does not prevent
        either party from bringing an individual claim in small claims court where permitted.
      </p>

      <h2
        id="severability"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Severability
      </h2>
      <p class="mb-6 leading-relaxed">
        If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall
        continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make
        it valid and enforceable.
      </p>

      <h2
        id="entire-agreement"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Entire Agreement
      </h2>
      <p class="mb-6 leading-relaxed">
        These Terms, together with our
        <NuxtLink
          to="/legal/privacy"
          class="text-brand-600 hover:text-brand-700 underline font-semibold"
        >Privacy Policy</NuxtLink>
        and
        <NuxtLink
          to="/legal/disclosure"
          class="text-brand-600 hover:text-brand-700 underline font-semibold"
        >Disclosure Policy</NuxtLink>,
        constitute the entire agreement between you and <strong class="text-brand-600">Remit-Scout</strong> regarding your use
        of our services and supersede all prior agreements and understandings.
      </p>
    </div>

    <template #sidebar>
      <div class="rounded-2xl border border-primary-200 bg-primary-50 p-5">
        <h3 class="text-body-sm font-semibold text-primary-900">
          Questions about our terms?
        </h3>
        <p class="mt-2 text-body-sm text-primary-800 leading-relaxed">
          If you need clarification about these Terms or how the service works, visit our
          <NuxtLink
            to="/faq"
            class="font-semibold underline hover:text-primary-900"
          >FAQ</NuxtLink>
          or <NuxtLink
            to="/contact"
            class="font-semibold underline hover:text-primary-900"
          >contact us</NuxtLink>.
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
    title: 'Independent comparison platform',
    body: 'We do not move money or provide financial services.',
  },
  {
    title: 'No financial advice',
    body: 'Information is educational and should be verified with providers.',
  },
  {
    title: 'Rankings stay unbiased',
    body: 'Remit-Scout Plus and partnerships do not affect rankings.',
  },
]

const tocItems = [
  { id: 'acceptance-of-terms', label: 'Acceptance of terms' },
  { id: 'description-of-services', label: 'Description of services' },
  { id: 'no-financial-advice', label: 'No financial or legal advice' },
  { id: 'provider-offerings', label: 'Changes to provider offerings' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'remit-scout-plus', label: 'Remit-Scout Plus' },
  { id: 'user-responsibilities', label: 'User responsibilities' },
  { id: 'intellectual-property', label: 'Intellectual property' },
  { id: 'user-content', label: 'User content' },
  { id: 'disclaimer', label: 'Disclaimer of warranties' },
  { id: 'limitation-of-liability', label: 'Limitation of liability' },
  { id: 'third-party-services', label: 'Third-party services' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'termination', label: 'Termination' },
  { id: 'changes-to-terms', label: 'Changes to terms' },
  { id: 'governing-law', label: 'Governing law' },
  { id: 'severability', label: 'Severability' },
  { id: 'entire-agreement', label: 'Entire agreement' },
]

const relatedLinks = [
  {
    title: 'Privacy Policy',
    description: 'How we protect your data.',
    to: '/legal/privacy',
  },
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
    title: 'About Remit-Scout',
    description: 'Our mission and values.',
    to: '/about',
  },
]

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Terms of Service',
    description: 'The legal agreement for using Remit-Scout and Remit-Scout Plus.',
  },
})

setSeo({
  title: 'Terms of Service | Remit-Scout Legal Agreement',
  description:
    'Read the Terms of Service for Remit-Scout. Understand rules for using our comparison platform, accounts, and Remit-Scout Plus membership.',
  canonical: `${siteUrl}/legal/terms`,
  ogImage: false,
  ogType: 'article',
  publishedTime: lastUpdatedIso,
  modifiedTime: lastUpdatedIso,
  author: 'Remit-Scout Editorial Team',
  tags: ['terms', 'legal', 'remit-scout'],
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Legal', url: `${siteUrl}/legal` },
  { name: 'Terms of Service', url: `${siteUrl}/legal/terms` },
])

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'TermsOfService',
        'name': 'Terms of Service',
        'url': `${siteUrl}/legal/terms`,
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
  { name: 'Terms of Service', path: '/legal/terms' },
]
</script>
