<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="relative bg-white py-16 lg:py-20">
      <div class="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-10 text-center">
          <div class="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Transparent Data Collection
          </div>
          <h1 class="text-4xl font-bold leading-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-4">
            Remit-Scout <span class="text-blue-600">Research</span>
          </h1>
          <p class="mt-4 text-xl leading-relaxed text-neutral-600 max-w-2xl mx-auto">
            For money transfer providers: Information about our data collection practices and partnership opportunities.
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-12 lg:py-16">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="prose prose-lg prose-neutral max-w-none">
          <!-- Who We Are -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
              <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </span>
              About Remit-Scout
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-4">
              Remit-Scout is an <strong class="text-neutral-900">independent money transfer comparison platform</strong> that aggregates publicly available pricing information from licensed money transfer providers. Our platform enables consumers to make informed decisions by comparing real-time exchange rates, transfer fees, and delivery options across multiple providers.
            </p>
            <p class="text-lg text-neutral-700 leading-relaxed">
              We operate in full compliance with applicable laws and regulations governing data collection and web scraping practices. Our data collection activities are limited to publicly accessible information displayed on provider websites and do not involve accessing protected systems, customer accounts, or proprietary data.
            </p>
          </div>

          <!-- What We Collect -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
              <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
              Data Collection Scope
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-4">
              Our automated data collection systems access only <strong class="text-neutral-900">publicly available pricing information</strong> displayed on provider websites. This includes:
            </p>
            <ul class="space-y-3 mb-6">
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                <span class="text-neutral-700"><strong class="text-neutral-900">Exchange rates</strong> — Foreign exchange rates offered for various currency pairs</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                <span class="text-neutral-700"><strong class="text-neutral-900">Transfer fees</strong> — Transaction fees disclosed in public pricing calculators</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                <span class="text-neutral-700"><strong class="text-neutral-900">Delivery times</strong> — Estimated delivery windows published on provider websites</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                <span class="text-neutral-700"><strong class="text-neutral-900">Payment methods</strong> — Available payment and payout options for each corridor</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                <span class="text-neutral-700"><strong class="text-neutral-900">Supported corridors</strong> — Country and currency pairs serviced by each provider</span>
              </li>
            </ul>
            <div class="rounded-xl border-l-4 border-blue-600 bg-blue-50 p-5">
              <p class="text-neutral-800 font-medium">
                <strong class="text-blue-700">Important:</strong> We do not collect, store, or process any personal information, authentication credentials, or proprietary data. Our activities are limited to publicly displayed pricing information accessible to any website visitor.
              </p>
            </div>
          </div>

          <!-- How We Collect -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
              <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Data Collection Methodology
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-4">
              Our automated data collection systems identify themselves using the User-Agent string:
            </p>
            <div class="mb-4 rounded-lg bg-neutral-50 p-4 border border-neutral-200">
              <code class="text-blue-600 font-mono text-sm">Remit-Scout-Research/1.0</code>
            </div>
            <p class="text-lg text-neutral-700 leading-relaxed mb-4">
              All collection activities adhere to the following principles:
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-5">
                <div class="flex items-center gap-3 mb-2">
                  <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 class="text-lg font-bold text-neutral-900">Transparency</h3>
                </div>
                <p class="text-neutral-600">All requests clearly identify Remit-Scout Research as the requesting entity</p>
              </div>
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-5">
                <div class="flex items-center gap-3 mb-2">
                  <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 class="text-lg font-bold text-neutral-900">Compliance</h3>
                </div>
                <p class="text-neutral-600">We strictly adhere to robots.txt directives and implement rate limiting to minimize server impact</p>
              </div>
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-5">
                <div class="flex items-center gap-3 mb-2">
                  <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 class="text-lg font-bold text-neutral-900">Accuracy</h3>
                </div>
                <p class="text-neutral-600">All collected data undergoes validation to ensure fair and accurate provider comparisons</p>
              </div>
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-5">
                <div class="flex items-center gap-3 mb-2">
                  <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 class="text-lg font-bold text-neutral-900">Timeliness</h3>
                </div>
                <p class="text-neutral-600">Regular data refresh cycles ensure consumers have access to current pricing information</p>
              </div>
            </div>
          </div>

          <!-- Legal Compliance -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
              <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              Legal Compliance and Best Practices
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-4">
              Remit-Scout operates in full compliance with applicable laws and regulations, including but not limited to the Computer Fraud and Abuse Act (CFAA), the Digital Millennium Copyright Act (DMCA), and relevant data protection regulations. Our data collection practices are designed to:
            </p>
            <ul class="space-y-3 mb-6">
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                <span class="text-neutral-700">Access only publicly available information that does not require authentication or authorization</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                <span class="text-neutral-700">Respect robots.txt directives and implement appropriate rate limiting</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                <span class="text-neutral-700">Maintain transparency through clear identification in all automated requests</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                <span class="text-neutral-700">Refrain from accessing protected systems, customer accounts, or proprietary data</span>
              </li>
            </ul>
            <div class="rounded-xl border-l-4 border-blue-600 bg-blue-50 p-5">
              <p class="text-neutral-800 font-medium">
                We are committed to maintaining our status as good internet citizens and welcome dialogue with providers regarding our data collection practices.
              </p>
            </div>
          </div>

          <!-- Partnership Opportunities -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
              <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              Partnership Opportunities
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              We recognize that our automated data collection represents a minimal portion of your overall web traffic. However, we believe that establishing formal partnerships with licensed money transfer providers offers mutual benefits:
            </p>
            <ul class="space-y-3 mb-6">
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                <span class="text-neutral-700"><strong class="text-neutral-900">Accurate representation</strong> — Ensure your rates, fees, and service details are displayed correctly and prominently</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                <span class="text-neutral-700"><strong class="text-neutral-900">Reduced server load</strong> — API access eliminates the need for automated web scraping, reducing bandwidth and server resource consumption</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                <span class="text-neutral-700"><strong class="text-neutral-900">Enhanced visibility</strong> — Partner providers receive prominent placement and detailed feature highlighting in our comparison results</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                <span class="text-neutral-700"><strong class="text-neutral-900">Quality traffic</strong> — Access to consumers actively comparing providers and ready to make informed decisions</span>
              </li>
            </ul>
            <div class="rounded-xl border-l-4 border-blue-600 bg-blue-50 p-5">
              <p class="text-neutral-800 font-medium mb-4">
                We welcome partnerships with providers who wish to ensure accurate rate representation and explore mutually beneficial collaboration opportunities. Many of our partner providers offer API access, which enables more efficient, accurate, and resource-friendly data collection.
              </p>
              <NuxtLink
                to="/partnerships"
                class="inline-flex items-center gap-2 text-blue-700 font-semibold hover:text-blue-800 transition-colors"
              >
                Learn more about our partnership program
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </NuxtLink>
            </div>
          </div>

          <!-- Contact Box -->
          <div class="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-8 sm:p-10 text-white shadow-xl mt-12">
            <div class="flex items-start gap-6">
              <div class="flex-shrink-0">
                <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-3xl font-bold mb-3">Questions or Partnership Inquiries?</h3>
                <p class="text-lg text-white/90 mb-6 leading-relaxed">
                  We are committed to maintaining transparent communication with all money transfer providers. If you have questions regarding our data collection practices, wish to discuss partnership opportunities, need to report a technical issue, or are interested in providing API access, please contact us.
                </p>
                <NuxtLink
                  to="/contact"
                  class="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-700 shadow-lg transition-all hover:bg-neutral-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Us
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Learn More -->
          <div class="mt-12 grid gap-6 sm:grid-cols-2">
            <NuxtLink
              to="/methodology"
              class="group flex items-center gap-4 rounded-2xl border-2 border-neutral-200 bg-white p-6 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <div class="flex-shrink-0">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <div class="font-bold text-lg text-neutral-900 mb-1">Our Methodology</div>
                <div class="text-sm text-neutral-600">How we compare providers</div>
              </div>
              <svg class="w-5 h-5 text-neutral-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>

            <NuxtLink
              to="/partnerships"
              class="group flex items-center gap-4 rounded-2xl border-2 border-neutral-200 bg-white p-6 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <div class="flex-shrink-0">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <div class="font-bold text-lg text-neutral-900 mb-1">Provider Partnerships</div>
                <div class="text-sm text-neutral-600">Partnership program details</div>
              </div>
              <svg class="w-5 h-5 text-neutral-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Research', path: '/research' },
])

useHead({
  title: 'Remit-Scout Research | Transparent Data Collection',
  meta: [
    {
      name: 'description',
      content: 'Learn about Remit-Scout\'s transparent approach to collecting money transfer pricing data. Our automated research helps consumers compare rates and find the best deals.',
    },
    {
      property: 'og:title',
      content: 'Remit-Scout Research | Transparent Data Collection',
    },
    {
      property: 'og:description',
      content: 'Learn about Remit-Scout\'s transparent approach to collecting money transfer pricing data.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: 'https://remit-scout.com/research',
    },
  ],
})
</script>

