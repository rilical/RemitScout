<template>
  <LegalPageShell
    title="Privacy Policy"
    subtitle="How we collect, use, and protect information across Remit-Scout."
    badge="Privacy"
    :last-updated-label="lastUpdatedLabel"
    :last-updated-iso="lastUpdatedIso"
    :breadcrumb-items="breadcrumbItems"
    :toc="tocItems"
    :highlights="highlights"
    :related="relatedLinks"
  >
    <div class="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-rs-fg prose-a:font-semibold prose-a:text-brand-600">
      <p class="mb-6 text-body-lg leading-relaxed">
        <strong class="text-brand-600">Remit-Scout LLC</strong> ("we," "our," "us") is committed to protecting your privacy.
        This Privacy Policy describes how we collect, use, and safeguard information when you use our money transfer
        comparison tools and related services. We are an independent comparison search engine — we do not provide money
        transfer services or move funds on your behalf.
      </p>

      <div class="my-8 rounded-lg border-l-4 border-primary-500 bg-primary-50 p-6">
        <h3 class="mb-2 text-body-lg font-semibold text-primary-900">
          Accounts & Remit-Scout Plus
        </h3>
        <p class="text-primary-800 leading-relaxed">
          You can browse and compare providers without creating an account. If you choose to create an account or subscribe
          to <strong>Remit-Scout Plus</strong>, we will collect limited personal information (like your name and email) so we
          can provide and support those features. Learn more about our
          <NuxtLink
            to="/about"
            class="font-semibold underline hover:text-primary-900"
          >mission and approach</NuxtLink>.
        </p>
      </div>

      <h2
        id="information-we-collect"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        1. Information We Collect
      </h2>

      <h3 class="mb-3 text-h4 font-semibold text-neutral-900">
        A. Information You Provide to Us
      </h3>
      <p class="mb-4 leading-relaxed">
        We collect information you provide when you create an account, subscribe to <strong class="text-brand-600">Remit-Scout
          Plus</strong>, sign up for our newsletter, or contact support:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-brand-600">Name</strong></li>
        <li><strong class="text-brand-600">Email address</strong></li>
        <li><strong class="text-brand-600">Password</strong> (stored in hashed form)</li>
        <li><strong class="text-brand-600">Newsletter signup details</strong> (name and email, if you opt in)</li>
        <li><strong class="text-brand-600">Support communications</strong> (messages, feedback, and inquiries)</li>
      </ul>
      <p class="mb-6 leading-relaxed">
        If you subscribe to <strong class="text-brand-600">Remit-Scout Plus</strong>, payments are processed by
        <strong>Stripe</strong>. We do not store full payment card numbers. Stripe may collect and process payment details,
        and we may receive limited payment-related information (such as a Stripe customer ID, subscription status, and
        receipts/invoices) to manage your subscription.
      </p>

      <h3 class="mb-3 text-h4 font-semibold text-neutral-900">
        B. Information Collected Automatically
      </h3>
      <p class="mb-4 leading-relaxed">
        When you use our comparison tool, we automatically collect <strong class="text-brand-600">non-personal,
          usage-based data</strong>, including:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li>
          <strong class="text-brand-600">Search Inputs:</strong> Transfer amount, sending country, receiving country,
          and corridor used to generate comparison results
        </li>
        <li><strong class="text-brand-600">Provider Selection:</strong> Which providers you clicked, visited, or compared</li>
        <li>
          <strong class="text-brand-600">Device & Technical Information:</strong> IP address (used only to determine
          approximate location/country and to help protect our service), browser type, device type, operating system
        </li>
        <li><strong class="text-brand-600">Usage Data:</strong> Pages visited, time spent, buttons clicked, referral URLs</li>
        <li>
          <strong class="text-brand-600">Location Data (approximate):</strong> We infer your <strong>country/region only</strong>,
          based on IP, to show correct comparison results. We do <em>not</em> track precise location
        </li>
      </ul>
      <p class="mb-6 leading-relaxed">
        Tracked data is used for analytics, security, and to improve our comparison service. We do <strong>not</strong>
        build personal profiles for advertising or sell personal data.
      </p>
      <p class="mb-6 leading-relaxed">
        Separately, we maintain a historical database of provider rates and fees at specific points in time to power
        comparisons and research. This dataset is not tied to your account identity.
      </p>

      <h3 class="mb-3 text-h4 font-semibold text-neutral-900">
        C. Cookies & Tracking Technologies
      </h3>
      <p class="mb-4 leading-relaxed">
        We use cookies and similar technologies to:
      </p>
      <ul class="mb-4 list-inside list-disc space-y-2 leading-relaxed">
        <li>Operate essential website features</li>
        <li>Understand how users interact with the comparison tool</li>
        <li>Improve performance and user experience</li>
        <li>Measure provider referral performance</li>
      </ul>
      <p class="mb-4 leading-relaxed">
        Types of cookies used:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-brand-600">Essential cookies:</strong> Required for the website to function properly</li>
        <li><strong class="text-brand-600">Functional cookies:</strong> Remember preferences like your last corridor (opt-in where required)</li>
        <li><strong class="text-brand-600">Analytics cookies:</strong> Help us understand usage patterns and improve the service (opt-in where required)</li>
        <li><strong class="text-brand-600">Marketing/Advertising cookies:</strong> Used to deliver and measure ads and attribution (opt-in where required)</li>
      </ul>
      <p class="mb-6 leading-relaxed">
        You may control or delete cookies through your browser settings. Where required, we will provide notice and choices
        (such as a cookie banner) before placing non-essential cookies.
      </p>
      <p class="mb-6 leading-relaxed">
        For more detail, see our
        <NuxtLink
          to="/cookies"
          class="text-brand-600 hover:text-brand-700 underline font-semibold"
        >Cookie Policy</NuxtLink>.
      </p>

      <h3
        id="advertising-and-consent"
        class="mb-3 text-h4 font-semibold text-neutral-900"
      >
        D. Advertising & Consent Management
      </h3>
      <p class="mb-4 leading-relaxed">
        We may show clearly labeled ads on free pages. We use <strong class="text-brand-600">Ezoic</strong> to serve and
        measure ads. We manage consent choices through our cookie banner and preferences settings; ads and marketing
        attribution that require cookies/identifiers only run after you opt in where required by law.
      </p>
      <p class="mb-6 leading-relaxed">
        <strong class="text-brand-600">Remit-Scout Plus</strong> subscribers receive an ad-free experience, and ad
        placeholders are not rendered for Plus accounts.
      </p>

      <h2
        id="how-we-use-information"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        2. How We Use Your Information
      </h2>
      <p class="mb-4 leading-relaxed">
        We use the data we collect to:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-brand-600">Generate accurate money transfer comparisons</strong> based on your search inputs</li>
        <li><strong class="text-brand-600">Create and manage your account</strong> and provide customer support</li>
        <li><strong class="text-brand-600">Manage Remit-Scout Plus</strong> subscriptions, renewals, and cancellations</li>
        <li><strong class="text-brand-600">Send service communications</strong> related to your account or subscription</li>
        <li><strong class="text-brand-600">Send newsletters</strong> if you opt in (you can unsubscribe anytime)</li>
        <li><strong class="text-brand-600">Track provider clicks</strong> for referral attribution and reporting</li>
        <li><strong class="text-brand-600">Improve algorithms, accuracy, and speed</strong> of our comparison tool</li>
        <li><strong class="text-brand-600">Detect errors and prevent misuse</strong> of our platform</li>
        <li><strong class="text-brand-600">Understand trends and platform usage</strong> to enhance user experience</li>
        <li><strong class="text-brand-600">Measure which corridors are most used</strong> to prioritize improvements</li>
        <li><strong class="text-brand-600">Comply with legal obligations</strong> and respond to legal requests</li>
      </ul>
      <p class="mb-6 leading-relaxed">
        We do <strong>not</strong> sell personal information.
      </p>

      <h2
        id="information-sharing"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        3. Information Sharing
      </h2>
      <p class="mb-4 leading-relaxed">
        We do <strong>not</strong> sell, rent, or trade your personal information.
      </p>
      <p class="mb-4 leading-relaxed">
        We may share information with:
      </p>

      <h3 class="mb-3 text-h4 font-semibold text-neutral-900">
        A. Service Providers
      </h3>
      <p class="mb-4 leading-relaxed">
        Trusted partners that help us operate the website, including:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li>Cloud hosting and infrastructure (e.g., AWS)</li>
        <li>Payment processing (Stripe)</li>
        <li>Email/newsletter delivery (Mailchimp)</li>
        <li>Phone/SMS service providers (Quo, if used)</li>
        <li>Advertising (Ezoic)</li>
        <li>Analytics, performance monitoring, and error logging</li>
      </ul>
      <p class="mb-6 leading-relaxed">
        These providers can only use data for our purposes and must protect it in accordance with our agreements.
      </p>

      <h3 class="mb-3 text-h4 font-semibold text-neutral-900">
        B. Money Transfer Providers
      </h3>
      <p class="mb-4 leading-relaxed">
        When you click a provider link (e.g., Wise, Remitly, WorldRemit), you are redirected to their website.
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li>We <strong>do not</strong> send your personal data to providers</li>
        <li>Providers (and/or affiliate networks) may receive referral parameters and click attribution data</li>
        <li>Their privacy policies apply once you leave <strong class="text-brand-600">Remit-Scout</strong></li>
      </ul>

      <h3 class="mb-3 text-h4 font-semibold text-neutral-900">
        C. Legal Compliance & Safety
      </h3>
      <p class="mb-6 leading-relaxed">
        We may disclose information if required to:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li>Comply with applicable laws, regulations, or legal processes</li>
        <li>Respond to valid legal requests from government authorities</li>
        <li>Protect our rights, property, or security, or that of our users</li>
        <li>Prevent fraud, abuse, or illegal activity</li>
      </ul>

      <h2
        id="data-retention"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        4. Data Retention
      </h2>
      <p class="mb-4 leading-relaxed">
        We keep personal information only as long as needed for the purposes described in this Privacy Policy:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-brand-600">Account data:</strong> Kept while your account is active</li>
        <li><strong class="text-brand-600">Subscription records:</strong> Kept as needed for billing, accounting, and compliance</li>
        <li><strong class="text-brand-600">Newsletter data:</strong> Kept until you unsubscribe</li>
        <li><strong class="text-brand-600">Operational logs:</strong> Typically retained for up to 30 days</li>
        <li><strong class="text-brand-600">Click-through/referral data:</strong> Needed for provider reporting and attribution</li>
        <li><strong class="text-brand-600">Provider rate history:</strong> Stored as historical rate/fee snapshots</li>
      </ul>
      <p class="mb-6 leading-relaxed">
        If you request account deletion, we will delete or anonymize personal information where feasible. We may retain
        limited records as necessary to comply with law, prevent fraud, resolve disputes, and enforce our agreements.
      </p>

      <h2
        id="security"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        5. Security
      </h2>
      <p class="mb-4 leading-relaxed">
        We use standard security measures to protect your information, including:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-brand-600">Encryption of data in transit</strong> using SSL/TLS protocols</li>
        <li><strong class="text-brand-600">Secure hosting environments</strong> with regular security updates</li>
        <li><strong class="text-brand-600">Access controls</strong> to limit who can view or modify data</li>
        <li><strong class="text-brand-600">Monitoring and threat detection</strong> to identify and respond to security issues</li>
      </ul>
      <p class="mb-6 leading-relaxed">
        While we strive to protect your data, no system is fully secure. We cannot guarantee absolute security, but we
        implement industry-standard practices to safeguard your information.
      </p>

      <h2
        id="your-rights"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        6. Your Rights
      </h2>
      <p class="mb-4 leading-relaxed">
        Depending on your location, you may have rights to:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-brand-600">Access, correct, or update</strong> your personal information</li>
        <li><strong class="text-brand-600">Request deletion</strong> of your account and associated personal information</li>
        <li><strong class="text-brand-600">Unsubscribe</strong> from marketing emails/newsletters</li>
        <li>
          <strong class="text-brand-600">Request a copy</strong> of the personal information we hold about you
        </li>
        <li><strong class="text-brand-600">Restrict or object</strong> to certain data uses</li>
        <li><strong class="text-brand-600">Data portability</strong> (where applicable)</li>
      </ul>
      <p class="mb-6 leading-relaxed">
        To exercise these rights, please <NuxtLink
          to="/contact"
          class="text-brand-600 hover:text-brand-700 underline font-semibold"
        >contact us</NuxtLink>.
        We will respond to your request within a reasonable timeframe and in accordance with applicable laws.
      </p>

      <h2
        id="children-privacy"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        7. Children's Privacy
      </h2>
      <p class="mb-6 leading-relaxed">
        <strong class="text-brand-600">Remit-Scout</strong> is not intended for users under 18. We do not knowingly collect
        any information from children. If you believe we have inadvertently collected information from a child, please
        <NuxtLink
          to="/contact"
          class="text-brand-600 hover:text-brand-700 underline font-semibold"
        >contact us</NuxtLink>
        immediately, and we will take steps to delete such information.
      </p>

      <h2
        id="international-data-transfers"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        8. International Data Transfers
      </h2>
      <p class="mb-6 leading-relaxed">
        We are based in the United States (Dover, Delaware), and our service providers may process data in the United States
        and other countries. Data protection laws in these locations may differ from those in your country. Where required,
        we take appropriate measures designed to protect your information in accordance with this Privacy Policy.
      </p>

      <h2
        id="policy-updates"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        9. Changes to This Privacy Policy
      </h2>
      <p class="mb-6 leading-relaxed">
        We may update this Privacy Policy periodically to reflect changes in our practices, technology, legal requirements,
        or other factors. The updated version will have a new "Last updated" date. We encourage you to review this policy
        from time to time to stay informed about how we protect your information.
      </p>

      <!-- Enterprise Data Governance Section -->
      <div class="my-12 rounded-xl border border-neutral-700 bg-neutral-900 p-8">
        <div class="flex items-center gap-3 mb-6">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
            <svg
              class="w-5 h-5 text-primary-400"
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
          </div>
          <div>
            <p class="text-body-sm font-semibold text-primary-400 uppercase tracking-wide">
              For Compliance Teams
            </p>
            <h3 class="text-h4 font-bold text-white">
              Enterprise Data Governance
            </h3>
          </div>
        </div>

        <p class="text-neutral-300 leading-relaxed mb-6">
          For enterprise customers and compliance teams conducting due diligence, this section provides technical detail
          on how we protect data and ensure privacy compliance at scale.
        </p>

        <div class="space-y-6">
          <div class="border-l-2 border-primary-500 pl-4">
            <h4 class="text-body font-semibold text-white mb-2">
              Data Anonymization
            </h4>
            <p class="text-body-sm text-neutral-400 leading-relaxed mb-3">
              All corridor analytics and market data are derived from anonymized, aggregated datasets. Individual user
              behavior is never exposed in any reporting or API output.
            </p>
            <ul class="text-body-sm text-neutral-400 space-y-1">
              <li class="flex items-start gap-2">
                <svg
                  class="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>IP addresses are hashed and truncated before storage</span>
              </li>
              <li class="flex items-start gap-2">
                <svg
                  class="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Session identifiers are rotated and non-persistent</span>
              </li>
              <li class="flex items-start gap-2">
                <svg
                  class="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>User agents are generalized to browser family only</span>
              </li>
            </ul>
          </div>

          <div class="border-l-2 border-success-600 pl-4">
            <h4 class="text-body font-semibold text-white mb-2">
              k-Anonymity Guarantees
            </h4>
            <p class="text-body-sm text-neutral-400 leading-relaxed mb-3">
              We apply k-anonymity principles to ensure no individual can be re-identified from aggregate data outputs.
            </p>
            <ul class="text-body-sm text-neutral-400 space-y-1">
              <li class="flex items-start gap-2">
                <svg
                  class="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span><strong class="text-white">Minimum k=5:</strong> No corridor data published unless ≥5 unique users</span>
              </li>
              <li class="flex items-start gap-2">
                <svg
                  class="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span><strong class="text-white">Generalization:</strong> Low-volume corridors are grouped into regional aggregates</span>
              </li>
              <li class="flex items-start gap-2">
                <svg
                  class="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span><strong class="text-white">Suppression:</strong> Outlier data points are excluded from public datasets</span>
              </li>
            </ul>
          </div>

          <div class="border-l-2 border-accent-600 pl-4">
            <h4 class="text-body font-semibold text-white mb-2">
              Aggregation Thresholds
            </h4>
            <p class="text-body-sm text-neutral-400 leading-relaxed mb-3">
              Market data and analytics are subject to minimum aggregation thresholds before publication or API delivery.
            </p>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-lg bg-neutral-800 p-3">
                <p class="text-body-sm text-rs-muted mb-1">
                  Corridor Analytics
                </p>
                <p class="text-body-sm text-white font-semibold">
                  ≥100 data points / 24h
                </p>
              </div>
              <div class="rounded-lg bg-neutral-800 p-3">
                <p class="text-body-sm text-rs-muted mb-1">
                  Provider Metrics
                </p>
                <p class="text-body-sm text-white font-semibold">
                  ≥50 quotes / corridor
                </p>
              </div>
              <div class="rounded-lg bg-neutral-800 p-3">
                <p class="text-body-sm text-rs-muted mb-1">
                  Trend Reports
                </p>
                <p class="text-body-sm text-white font-semibold">
                  ≥7 days lookback
                </p>
              </div>
              <div class="rounded-lg bg-neutral-800 p-3">
                <p class="text-body-sm text-rs-muted mb-1">
                  Geographic Data
                </p>
                <p class="text-body-sm text-white font-semibold">
                  Country-level only
                </p>
              </div>
            </div>
          </div>

          <div class="border-l-2 border-warning-600 pl-4">
            <h4 class="text-body font-semibold text-white mb-2">
              Compliance Certifications
            </h4>
            <ul class="text-body-sm text-neutral-400 space-y-1">
              <li class="flex items-start gap-2">
                <svg
                  class="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>GDPR compliant for EU user data</span>
              </li>
              <li class="flex items-start gap-2">
                <svg
                  class="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>CCPA compliant for California residents</span>
              </li>
              <li class="flex items-start gap-2">
                <svg
                  class="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>SOC 2 Type II certification (in progress)</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-6 pt-6 border-t border-neutral-700">
          <p class="text-body-sm text-rs-muted">
            For enterprise data processing agreements (DPA) or custom compliance documentation, contact
            <a
              href="mailto:support@remit-scout.com"
              class="text-primary-400 hover:text-primary-300"
            >support@remit-scout.com</a>
          </p>
        </div>
      </div>
    </div>

    <template #sidebar>
      <div class="rounded-2xl border border-primary-200 bg-primary-50 p-5">
        <h3 class="text-body-sm font-semibold text-primary-900">
          Questions about our privacy policy?
        </h3>
        <p class="mt-2 text-body-sm text-primary-800 leading-relaxed">
          If you have questions about how we collect, use, or protect your information, visit our
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
    title: 'No selling personal data',
    body: 'We use data to run comparisons, improve accuracy, and protect the platform.',
  },
  {
    title: 'Ad-free for Plus',
    body: 'Plus subscribers do not see ad placements, while free pages may show consented ads.',
  },
  {
    title: 'Control your information',
    body: 'Access, update, or delete your account data and manage email preferences.',
  },
  {
    title: 'Limited sharing',
    body: 'We only share data with essential service providers or when legally required.',
  },
]

const tocItems = [
  { id: 'information-we-collect', label: 'Information we collect' },
  { id: 'advertising-and-consent', label: 'Advertising & consent' },
  { id: 'how-we-use-information', label: 'How we use information' },
  { id: 'information-sharing', label: 'Information sharing' },
  { id: 'data-retention', label: 'Data retention' },
  { id: 'security', label: 'Security' },
  { id: 'your-rights', label: 'Your rights' },
  { id: 'children-privacy', label: 'Children privacy' },
  { id: 'international-data-transfers', label: 'International data transfers' },
  { id: 'policy-updates', label: 'Policy updates' },
]

const relatedLinks = [
  {
    title: 'About Remit-Scout',
    description: 'Our mission, leadership, and values.',
    to: '/about',
  },
  {
    title: 'Methodology',
    description: 'How we compare providers.',
    to: '/methodology',
  },
  {
    title: 'Disclosure Policy',
    description: 'Transparency and partnerships.',
    to: '/legal/disclosure',
  },
  {
    title: 'Terms of Service',
    description: 'The legal agreement.',
    to: '/legal/terms',
  },
]

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Privacy Policy',
    description: 'How we handle data, cookies, and account information at Remit-Scout.',
  },
})

setSeo({
  title: 'Privacy Policy | How We Protect Your Data | Remit-Scout',
  description:
    'Read the Remit-Scout Privacy Policy. Learn how we handle account info, cookies, subscriptions, and usage data while providing money transfer comparisons.',
  canonical: `${siteUrl}/legal/privacy`,
  ogImage: false,
  ogType: 'article',
  publishedTime: lastUpdatedIso,
  modifiedTime: lastUpdatedIso,
  author: 'Remit-Scout Editorial Team',
  tags: ['privacy', 'data', 'transparency'],
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Legal', url: `${siteUrl}/legal` },
  { name: 'Privacy Policy', url: `${siteUrl}/legal/privacy` },
])

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'PrivacyPolicy',
        'name': 'Privacy Policy',
        'url': `${siteUrl}/legal/privacy`,
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
  { name: 'Privacy Policy', path: '/legal/privacy' },
]
</script>
