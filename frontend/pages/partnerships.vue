<template>
  <div class="min-h-screen bg-white pb-24 md:pb-0">
    <style>
      @keyframes scroll-left {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-50%);
        }
      }
      .animate-scroll-left {
        animation: scroll-left 50s linear infinite;
        width: fit-content;
      }
      .animate-scroll-left:hover {
        animation-play-state: paused;
      }
      * {
        -webkit-hyphens: none !important;
        -moz-hyphens: none !important;
        -ms-hyphens: none !important;
        hyphens: none !important;
        word-break: normal !important;
        overflow-wrap: normal !important;
      }
      p, span, div, h1, h2, h3, h4, h5, h6, a, li, td, th {
        -webkit-hyphens: none !important;
        -moz-hyphens: none !important;
        -ms-hyphens: none !important;
        hyphens: none !important;
      }
    </style>
    <CompareWidget />

    <!-- Hero -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12">
          <div>
            <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6 leading-tight">
              🤝 Partner with <span class="text-brand-600">Remit-Scout</span>
            </h1>

            <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
              Get discovered by expats and international families actively comparing money transfer options
            </p>

            <p class="text-lg text-neutral-700 leading-relaxed mb-4">
              Remit-Scout is a comparison platform that helps people send money internationally. When users search for the best rates on corridors you serve, <strong class="font-semibold text-neutral-900">you appear in results</strong> — and when they click through and complete a transfer, <strong class="font-semibold text-brand-600">you get a new customer</strong>.
            </p>

            <p class="text-base text-neutral-600 leading-relaxed mb-8">
              We rank providers by <strong class="font-semibold text-neutral-900">what recipients actually receive</strong> (after fees and exchange rate markups), not marketing claims. This means if your service offers competitive pricing, you rank higher — even if we don't have an affiliate relationship with you yet.
            </p>

            <div class="mb-6">
              <NuxtLink
                to="/contact?type=partnership"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 mb-4"
              >
                Discuss partnership
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </NuxtLink>
              <div class="flex flex-wrap gap-2">
                <div class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                  <svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  No pay-to-rank
                </div>
                <div class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                  <svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Full disclosure
                </div>
                <div class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                  <svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  We don't move money
                </div>
              </div>
            </div>

            <p class="text-sm text-neutral-600">
              Last updated: December 2025
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Providers We Compare -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
          <div class="flex items-center gap-4 mb-4">
            <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3">
              <span class="text-2xl">🏢</span>
              Providers We Compare
            </h2>
            <span class="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Growing
            </span>
          </div>
          <p class="text-lg leading-relaxed text-neutral-700 mb-4">
            Examples of providers you'll see in our comparison results. We compare many providers — some have affiliate or data partnerships with us; others do not. Regardless, rankings are based on pricing and performance data.
          </p>
          <p class="text-base text-neutral-600 leading-relaxed">
            <strong class="font-semibold text-brand-600">We're still growing.</strong> Remit-Scout is a relatively new platform, and we're actively onboarding new partners. If you're a remittance provider interested in fair, transparent comparison, we'd love to hear from you.
          </p>
        </div>

        <div class="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 py-12 -mx-4 sm:-mx-6 lg:-mx-8">
          <div class="flex gap-8 animate-scroll-left px-6">
            <div
              v-for="(partner, index) in [...partners, ...partners, ...partners]"
              :key="`provider-${partner.name}-${index}`"
              class="flex-shrink-0 w-56 h-36 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
            >
              <div class="text-center">
                <div class="text-3xl mb-3">{{ partner.emoji }}</div>
                <div class="text-base font-semibold text-neutral-900">{{ partner.name }}</div>
                <div class="text-xs text-neutral-500 mt-1">{{ partner.type }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 text-center">
          <p class="text-sm text-neutral-600 mb-4">
            Interested in joining our partner network?
          </p>
          <NuxtLink
            to="/contact?type=provider"
            class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
          >
            Become a partner
            <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Partnership opportunities at a glance -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 mb-4 flex items-center gap-3">
            <span class="text-2xl">🤝</span>
            Partnership opportunities at a glance
          </h2>
          <p class="text-lg leading-relaxed text-neutral-700 mb-4">
            We offer four distinct ways to partner with Remit-Scout, each designed to meet different business needs and goals. Whether you're a remittance provider looking to reach new customers, a media outlet seeking accurate comparison data, a platform building remittance features, or a brand interested in sponsoring independent research — we have a partnership model that fits.
          </p>
          <p class="text-base leading-relaxed text-neutral-600 mb-10">
            All partnerships respect our editorial independence. Rankings, scores, and comparisons are never influenced by commercial relationships — they're determined by data, pricing, and performance metrics.
          </p>

          <div class="space-y-6">
            <div class="rounded-2xl border-2 border-neutral-200 bg-white p-8 hover:shadow-lg transition-shadow">
              <div class="flex items-start gap-4">
                <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <span class="text-3xl">🔗</span>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-semibold text-neutral-900 mb-3">
                    Affiliate Partnerships
                  </h3>
                  <p class="text-base leading-relaxed text-neutral-700 mb-4">
                    Get listed in our comparison results. When users click through and complete a transfer, we may earn a commission.
                  </p>
                  <div class="rounded-lg border border-blue-100 bg-blue-50 p-4 mb-4">
                    <p class="text-sm font-semibold text-blue-900 mb-1">
                      Does this affect rankings?
                    </p>
                    <p class="text-sm text-blue-800">
                      No — rankings are based on data (recipient gets, cost, speed, trust).
                    </p>
                  </div>
                  <NuxtLink
                    to="/contact?type=provider&topic=onboarding"
                    class="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 underline"
                  >
                    Provider onboarding →
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border-2 border-neutral-200 bg-white p-8 hover:shadow-lg transition-shadow">
              <div class="flex items-start gap-4">
                <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <span class="text-3xl">📊</span>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-semibold text-neutral-900 mb-3">
                    Data & Widgets
                  </h3>
                  <p class="text-base leading-relaxed text-neutral-700 mb-4">
                    License our comparison data, market charts (Pulse), or embed our widgets on your site or app.
                  </p>
                  <div class="rounded-lg border border-emerald-100 bg-emerald-50 p-4 mb-4">
                    <p class="text-sm font-semibold text-emerald-900 mb-1">
                      Does this affect rankings?
                    </p>
                    <p class="text-sm text-emerald-800">
                      No — data licensing is separate from scoring and rankings.
                    </p>
                  </div>
                  <NuxtLink
                    to="/contact?type=media"
                    class="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 underline"
                  >
                    Publisher/media inquiry →
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border-2 border-neutral-200 bg-white p-8 hover:shadow-lg transition-shadow">
              <div class="flex items-start gap-4">
                <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100">
                  <span class="text-3xl">🔌</span>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-semibold text-neutral-900 mb-3">
                    API Access
                  </h3>
                  <p class="text-base leading-relaxed text-neutral-700 mb-4">
                    Programmatic access to real-time comparison data for platforms building remittance features or conducting research.
                  </p>
                  <div class="rounded-lg border border-purple-100 bg-purple-50 p-4 mb-4">
                    <p class="text-sm font-semibold text-purple-900 mb-1">
                      Does this affect rankings?
                    </p>
                    <p class="text-sm text-purple-800">
                      No — API partnerships don't influence comparison results.
                    </p>
                  </div>
                  <NuxtLink
                    to="/contact?type=platform&topic=api"
                    class="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 underline"
                  >
                    Platform/API inquiry →
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border-2 border-neutral-200 bg-white p-8 hover:shadow-lg transition-shadow">
              <div class="flex items-start gap-4">
                <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                  <span class="text-3xl">🧾</span>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-semibold text-neutral-900 mb-3">
                    Sponsorship
                  </h3>
                  <p class="text-base leading-relaxed text-neutral-700 mb-4">
                    Support independent research on remittance pricing and reach expats through clearly labeled sponsorships (e.g., "Pulse supported by..."). Brand-safe, clearly labeled.
                  </p>
                  <div class="rounded-lg border border-orange-100 bg-orange-50 p-4 mb-4">
                    <p class="text-sm font-semibold text-orange-900 mb-1">
                      Does this affect rankings?
                    </p>
                    <p class="text-sm text-orange-800">
                      No — sponsorship never changes rankings, sorting, or Remit-Score.
                    </p>
                  </div>
                  <NuxtLink
                    to="/contact?type=sponsorship&topic=inquiry"
                    class="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 underline"
                  >
                    Request sponsorship info →
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Partner - Provider Benefits -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-4">
            <span class="text-2xl">💼</span>
            What You Get as a Provider Partner
          </h2>
          <p class="text-lg leading-relaxed text-neutral-700 mb-8">
            Remit-Scout helps you reach customers who are actively searching for money transfer options. Here's exactly what partnering with us delivers:
          </p>

          <!-- Remit-Score Visual -->
          <div class="bg-gradient-to-r from-brand-50 to-blue-50 border-2 border-brand-200 rounded-3xl p-8 lg:p-12 mb-10">
            <div class="flex flex-col lg:flex-row items-center gap-8">
              <div class="flex-shrink-0">
                <div class="relative">
                  <div class="w-48 h-48 lg:w-64 lg:h-64 rounded-full border-4 border-brand-600 bg-white flex items-center justify-center shadow-xl">
                    <div class="text-center">
                      <div class="text-5xl lg:text-7xl font-bold text-brand-600 mb-2">9.5</div>
                      <div class="text-sm lg:text-base font-semibold text-neutral-700">Remit-Score</div>
                    </div>
                  </div>
                  <div class="absolute -top-4 -right-4 w-20 h-20 lg:w-24 lg:h-24 rounded-full border-4 border-emerald-500 bg-white flex items-center justify-center shadow-lg">
                    <div class="text-center">
                      <div class="text-2xl lg:text-3xl font-bold text-emerald-600">8.4</div>
                    </div>
                  </div>
                  <div class="absolute -bottom-4 -left-4 w-16 h-16 lg:w-20 lg:h-20 rounded-full border-4 border-blue-500 bg-white flex items-center justify-center shadow-lg">
                    <div class="text-center">
                      <div class="text-xl lg:text-2xl font-bold text-blue-600">7.2</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
                  How Remit-Score Works
                </h3>
                <p class="text-base leading-relaxed text-neutral-700 mb-4">
                  Each provider gets a <strong class="font-semibold text-neutral-900">Remit-Score</strong> (0-10 scale) based on real transfer data: what recipients receive, total cost, transfer speed, and reliability signals.
                </p>
                <p class="text-sm leading-relaxed text-neutral-600 mb-4">
                  Scores like <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-600 text-brand-600 font-bold text-sm mx-1">9.5</span>,
                  <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-emerald-500 text-emerald-600 font-bold text-sm mx-1">8.4</span>, or
                  <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-blue-500 text-blue-600 font-bold text-sm mx-1">7.2</span>
                  represent the overall quality and value users can expect from each provider.
                </p>
                <p class="text-sm font-semibold text-neutral-900 whitespace-nowrap">
                  If your pricing is competitive, your Remit-Score reflects that — regardless of commercial relationships.
                </p>
              </div>
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-2 mb-10">
            <div class="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 mb-4">
                <span class="text-2xl">🚀</span>
              </div>
              <h3 class="text-xl font-bold text-neutral-900 mb-3">
                Qualified Traffic & New Customers
              </h3>
              <p class="text-sm leading-relaxed text-neutral-700 mb-3">
                When expats search for the best rates on corridors you serve, your service appears in results. These are <strong class="font-semibold text-neutral-900">high-intent users</strong> actively comparing and ready to transfer. They click through to complete their transfer — and you get a new customer.
              </p>
              <p class="text-xs leading-relaxed text-neutral-600">
                Unlike generic ads, Remit-Scout connects you with people <strong class="font-semibold text-neutral-900">already in the decision-making phase</strong>. They've compared rates and are ready to send.
              </p>
            </div>

            <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 mb-4">
                <span class="text-2xl">📊</span>
              </div>
              <h3 class="text-xl font-bold text-neutral-900 mb-3">
                Fair, Transparent Comparison
              </h3>
              <p class="text-sm leading-relaxed text-neutral-700 mb-3">
                We rank by what recipients actually receive. <strong class="font-semibold text-brand-600">If your pricing is competitive, you rank higher</strong> — regardless of affiliate relationships.
              </p>
              <p class="text-xs leading-relaxed text-neutral-600">
                Many sites charge for placement or prioritize partners. We don't. Our algorithm is transparent — better rates mean higher rankings, even if we earn zero commission.
              </p>
            </div>

            <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 mb-4">
                <span class="text-2xl">🎯</span>
              </div>
              <h3 class="text-xl font-bold text-neutral-900 mb-3">
                Brand Visibility & Trust
              </h3>
              <p class="text-sm leading-relaxed text-neutral-700 mb-3">
                Appearing in comparison results gives you <strong class="font-semibold text-neutral-900">brand exposure</strong> to users actively searching for money transfer options. Every time your service appears in search results, you're building brand awareness among high-intent customers. Even without immediate clicks, seeing your brand name and logo builds recognition and positions you as a legitimate, trustworthy option in the remittance space.
              </p>
              <p class="text-xs leading-relaxed text-neutral-600 mb-3">
                For newer or smaller providers, comparison sites like Remit-Scout are often the first place potential customers discover your service. We level the playing field by letting quality and pricing drive visibility, not marketing budgets. This means emerging providers with competitive rates get the same exposure opportunities as established players.
              </p>
              <div class="rounded-lg border border-brand-100 bg-brand-50 p-3">
                <p class="text-xs font-semibold text-brand-900 mb-1">
                  Provider Reviews
                </p>
                <p class="text-xs leading-relaxed text-brand-800">
                  We will write a comprehensive review about you. Detailed provider reviews help users understand your service, fee structures, transfer speeds, supported corridors, payment methods, and customer experience. These reviews improve trust, answer user questions before they click through, and ultimately increase conversion rates from qualified leads.
                </p>
              </div>
            </div>

            <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 mb-4">
                <span class="text-2xl">⚡</span>
              </div>
              <h3 class="text-xl font-bold text-neutral-900 mb-3">
                Official Data Feed Badge
              </h3>
              <p class="text-sm leading-relaxed text-neutral-700 mb-3">
                When you provide API access for real-time quotes, you receive an <strong class="font-semibold text-brand-600">"Official Data Feed" badge</strong> that appears next to your listings in comparison results. This badge signals to users that your pricing data is verified directly from your system and updated in real-time, not estimated or pulled from public websites. This trust signal significantly improves user confidence and can increase click-through rates by up to 20-30% compared to providers without the badge.
              </p>
              <p class="text-xs leading-relaxed text-neutral-600 mb-3">
                Users understand they're seeing accurate, up-to-date pricing that matches what they'll see at checkout — reducing frustration from pricing discrepancies and building trust in your brand. When we have direct API access, we can display your rates more accurately across all corridors and transfer amounts, minimize discrepancies that lead to user complaints, and ensure your competitive positioning reflects your actual pricing rather than outdated estimates.
              </p>
              <p class="text-xs leading-relaxed text-neutral-600">
                Plus, API integration means faster updates when you adjust pricing, launch promotions, or add new corridors — ensuring users always see your current offers and helping you stay competitive in comparison results.
              </p>
            </div>
          </div>

          <div class="rounded-2xl border-2 border-brand-600 bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white">
            <h3 class="text-2xl font-bold mb-6">
              Ready to get started?
            </h3>

            <div class="mb-6">
              <p class="text-base font-semibold text-white mb-4">
                How partnership onboarding works:
              </p>
              <div class="space-y-4">
                <div class="flex gap-4">
                  <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                    1
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-white mb-1">Intro (15 min)</p>
                    <p class="text-sm text-white/90">Confirm corridors, methods, and eligibility</p>
                  </div>
                </div>
                <div class="flex gap-4">
                  <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                    2
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-white mb-1">Data connection</p>
                    <p class="text-sm text-white/90">API/feed/public quote approach</p>
                  </div>
                </div>
                <div class="flex gap-4">
                  <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                    3
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-white mb-1">QA & validation</p>
                    <p class="text-sm text-white/90">We validate live quotes vs checkout and set escalation contact</p>
                  </div>
                </div>
                <div class="flex gap-4">
                  <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                    4
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-white mb-1">Go live</p>
                    <p class="text-sm text-white/90">Tracking (if affiliate), labels, and first reporting</p>
                  </div>
                </div>
              </div>
            </div>

            <p class="text-base text-white/95 leading-relaxed mb-6">
              There's no upfront cost — we only earn if users complete transfers through your service. Most providers can get listed within 1-2 weeks.
            </p>
            <div class="flex flex-wrap gap-3">
              <NuxtLink
                to="/contact?type=provider&topic=onboarding"
                class="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-semibold text-brand-600 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600"
              >
                Start provider onboarding
              </NuxtLink>
              <NuxtLink
                to="/contact?type=api&topic=documentation"
                class="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-transparent px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600"
              >
                Share API documentation
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Partner Types (Detailed) -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-6">
            <span class="text-2xl">📋</span>
            What We Need From You
          </h2>
          <p class="text-lg leading-relaxed text-neutral-700 mb-8">
            To list your service accurately and fairly, we need a few things. Most providers can get started in under a week:
          </p>

          <div class="grid gap-6 md:grid-cols-2 mb-8">
            <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 mb-4">
                <span class="text-2xl">📡</span>
              </div>
              <h3 class="text-xl font-semibold text-neutral-900 mb-3">
                Rate Data Access (Choose One)
              </h3>
              <div class="space-y-3 text-sm text-neutral-700">
                <div>
                  <strong class="font-semibold text-brand-600">1. API endpoint (preferred):</strong> Real-time quote endpoint. Most accurate.
                </div>
                <div>
                  <strong class="font-semibold text-brand-600">2. Structured data feed:</strong> Regular CSV/JSON exports with pricing data.
                </div>
                <div>
                  <strong class="font-semibold text-brand-600">3. Manual documentation:</strong> Fee schedules and corridors. We'll pull quotes from your website.
                </div>
              </div>
            </div>

            <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 mb-4">
                <span class="text-2xl">📄</span>
              </div>
              <h3 class="text-xl font-semibold text-neutral-900 mb-3">
                Documentation & Service Info
              </h3>
              <ul class="space-y-2 text-sm text-neutral-700">
                <li class="flex items-start gap-2">
                  <span class="text-neutral-400 font-bold mt-0.5">•</span>
                  <span>Supported corridors, fee structure, exchange rate methodology</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-neutral-400 font-bold mt-0.5">•</span>
                  <span>Transfer speed, min/max amounts, licensing info</span>
                </li>
              </ul>
            </div>

            <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 mb-4">
                <span class="text-2xl">👤</span>
              </div>
              <h3 class="text-xl font-semibold text-neutral-900 mb-3">
                Partnership Contact
              </h3>
              <p class="text-sm leading-relaxed text-neutral-700 mb-3">
                A dedicated contact who can answer questions, resolve discrepancies, coordinate tracking, and update us on changes.
              </p>
            </div>

            <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 mb-4">
                <span class="text-2xl">🔗</span>
              </div>
              <h3 class="text-xl font-semibold text-neutral-900 mb-3">
                Affiliate Tracking (Optional)
              </h3>
              <p class="text-sm leading-relaxed text-neutral-700 mb-3">
                Affiliate network credentials or program details if you want to track referrals and pay commissions.
              </p>
              <p class="text-xs leading-relaxed text-neutral-600 italic">
                Note: Completely optional. We'll list you fairly even without an affiliate arrangement.
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <NuxtLink
              to="/contact?type=provider"
              class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            >
              Start onboarding process
            </NuxtLink>
            <NuxtLink
              to="/contact?type=api&topic=documentation"
              class="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 py-3 text-base font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            >
              Share API documentation
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- For Publishers/Media -->
    <section class="py-16 lg:py-20 bg-brand-600">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-white flex items-center gap-3 mb-6">
            <span class="text-2xl">📱</span>
            For Platforms, Publishers & Media
          </h2>
          <p class="text-lg leading-relaxed text-white/95 mb-10">
            Integrate our comparison tools or data into your website, app, or content to help your users save on international transfers.
          </p>

          <div class="rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm p-8">
            <div class="mb-6">
              <p class="text-base font-semibold text-white mb-4">
                Integration options:
              </p>
              <ul class="space-y-3 text-sm text-white/95">
                <li class="flex items-start gap-2">
                  <span class="text-white font-bold mt-0.5">✓</span>
                  <span><strong class="font-semibold text-white">Embed our comparison widget</strong> on your site (can be white-labeled)</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-white font-bold mt-0.5">✓</span>
                  <span><strong class="font-semibold text-white">Use our rate charts and market trends</strong> in articles or reports</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-white font-bold mt-0.5">✓</span>
                  <span><strong class="font-semibold text-white">Collaborate on research</strong> or co-create educational content</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-white font-bold mt-0.5">✓</span>
                  <span><strong class="font-semibold text-white">Access our API</strong> for programmatic comparison data</span>
                </li>
              </ul>
            </div>

            <div class="rounded-lg border border-white/20 bg-white/5 p-4 mb-6">
              <p class="text-sm font-semibold text-white mb-2">
                White-label Compare Module
              </p>
              <p class="text-sm text-white/90 leading-relaxed">
                For apps and communities, we offer a white-label Compare module that lets your users compare providers without leaving your site. You can embed it as a widget or integrate via API, while we keep methodology and disclosure consistent.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <NuxtLink
                to="/contact?type=media&topic=publisher"
                class="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600"
              >
                Publisher/media inquiry
              </NuxtLink>
              <NuxtLink
                to="/contact?type=platform&topic=api"
                class="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-transparent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600"
              >
                Platform/API inquiry
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Independence Rules (Dark Trust Band) -->
    <section class="py-16 lg:py-20 bg-gradient-to-br from-slate-900 to-slate-800">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-white mb-4">
            Our independence rules
          </h2>
          <p class="text-lg leading-relaxed text-white/90 mb-10 max-w-3xl">
            We built Remit-Scout because hidden fees are confusing and costly. Independence isn't a tagline — it's a set of rules we enforce. These rules protect users and ensure partners can't influence what we recommend.
          </p>

          <div class="grid gap-6 md:grid-cols-2">
            <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div class="flex items-start gap-3 mb-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 flex-shrink-0">
                  <span class="text-2xl">🛡️</span>
                </div>
                <h3 class="text-xl font-semibold text-white">
                  Rule 1: No pay-to-rank
                </h3>
              </div>
              <p class="text-sm text-white/80 leading-relaxed">
                Providers cannot pay to appear higher, improve a Remit-Score, or change how we sort results. Rankings are based on comparison data, not commercial relationships.
              </p>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div class="flex items-start gap-3 mb-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 flex-shrink-0">
                  <span class="text-2xl">📐</span>
                </div>
                <h3 class="text-xl font-semibold text-white">
                  Rule 2: Consistent scoring
                </h3>
              </div>
              <p class="text-sm text-white/80 leading-relaxed">
                Our Remit-Score is calculated using a consistent methodology designed to reflect sender value: delivered amount, total cost, reliability, speed, and trust signals.
              </p>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div class="flex items-start gap-3 mb-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 flex-shrink-0">
                  <span class="text-2xl">🔒</span>
                </div>
                <h3 class="text-xl font-semibold text-white">
                  Rule 3: Commercial separation
                </h3>
              </div>
              <p class="text-sm text-white/80 leading-relaxed">
                Affiliate relationships do not change score calculations. If a provider offers the best deal for a corridor, they rank highly — even if we earn nothing from them.
              </p>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div class="flex items-start gap-3 mb-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 flex-shrink-0">
                  <span class="text-2xl">🏷️</span>
                </div>
                <h3 class="text-xl font-semibold text-white">
                  Rule 4: Clear labeling
                </h3>
              </div>
              <p class="text-sm text-white/80 leading-relaxed">
                Where commercial relationships exist, we label them clearly. Disclosures appear near affiliate links, and sponsorships are marked as "Sponsored" or "Ad."
              </p>
            </div>
          </div>

          <div class="mt-10 text-center">
            <NuxtLink
              to="/methodology"
              class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              Read full methodology
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- How We Label Disclosures -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-6">
            <span class="text-2xl">🏷️</span>
            How We Label Partnerships on Remit-Scout
          </h2>
          <p class="text-lg leading-relaxed text-neutral-700 mb-10">
            We use consistent labels so users always know what they're seeing. These badges appear throughout the site:
          </p>

          <div class="grid gap-6 md:grid-cols-2">
            <div class="rounded-2xl border border-neutral-200 bg-white p-6">
              <div class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 ring-1 ring-blue-200 mb-4">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                We may earn a commission
              </div>
              <p class="text-sm leading-relaxed text-neutral-700">
                Indicates an affiliate relationship may exist for that provider link. This appears near outbound links to providers we have partnerships with.
              </p>
            </div>

            <div class="rounded-2xl border border-neutral-200 bg-white p-6">
              <div class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200 mb-4">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Rankings are independent
              </div>
              <p class="text-sm leading-relaxed text-neutral-700">
                Indicates that sorting and scoring is not influenced by paid placement. This appears on comparison pages and methodology documentation.
              </p>
            </div>

            <div class="rounded-2xl border border-neutral-200 bg-white p-6">
              <div class="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-800 ring-1 ring-purple-200 mb-4">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Official Data Feed
              </div>
              <p class="text-sm leading-relaxed text-neutral-700">
                Indicates the provider supplies direct structured data via API for real-time quotes. This improves accuracy and reduces the chance of stale pricing.
              </p>
            </div>

            <div class="rounded-2xl border border-neutral-200 bg-white p-6">
              <div class="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800 ring-1 ring-orange-200 mb-4">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                Sponsored
              </div>
              <p class="text-sm leading-relaxed text-neutral-700">
                Reserved for clearly labeled sponsorship placements (if we offer them). Sponsored content never influences organic rankings or Remit-Scores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Data Sourcing & Accuracy -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-neutral-900 flex items-center gap-3 mb-6">
            <span class="text-2xl">🧪</span>
            Data Sourcing & Accuracy
          </h2>
          <p class="text-lg leading-relaxed text-neutral-700 mb-4">
            How we collect and display comparison data
          </p>
          <p class="text-base leading-relaxed text-neutral-600 mb-8">
            We get pricing data three ways: <strong class="font-semibold text-neutral-900">direct API access from providers</strong> (most accurate), <strong class="font-semibold text-neutral-900">partner data feeds</strong>, or <strong class="font-semibold text-neutral-900">public quote requests</strong> on provider websites. We normalize everything into a single comparable number: what the recipient receives. We update rates frequently on popular corridors (like US to Mexico, UK to India), and less often on less-traveled routes.
          </p>

          <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p class="text-base font-semibold text-neutral-900 mb-4">
              Important notes:
            </p>
            <ul class="space-y-3 text-sm text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-neutral-400 font-bold mt-0.5">•</span>
                <span><strong class="font-semibold text-neutral-900">Quotes can change at checkout.</strong> The final amount depends on payment method (bank transfer vs. card), promotional discounts, KYC verification, and provider-specific rules. Always verify the final amount on the provider's website before completing the transfer.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-neutral-400 font-bold mt-0.5">•</span>
                <span><strong class="font-semibold text-neutral-900">We fix errors quickly.</strong> Every quote shows a timestamp. If you notice incorrect pricing, fees, or availability, use our corrections form. We investigate within 24 hours and update the site when we confirm the issue.</span>
              </li>
            </ul>
            <div class="mt-6 flex flex-wrap gap-3">
              <NuxtLink
                to="/contact?type=issue"
                class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
              >
                Report an issue
              </NuxtLink>
              <NuxtLink
                to="/corrections"
                class="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
              >
                Corrections policy
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl">
          <div class="text-center mb-10">
            <h2 class="text-3xl font-bold text-neutral-900 mb-3">
              Frequently asked questions
            </h2>
            <p class="text-lg text-neutral-600">
              Quick answers about partnerships, independence, and how we work
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div class="space-y-6">
              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between py-4 text-left font-semibold text-neutral-900 hover:text-brand-600 transition-colors">
                  <span class="text-base">Can providers pay to rank higher on Remit-Scout?</span>
                  <svg class="h-5 w-5 flex-shrink-0 text-neutral-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div class="pb-4 pt-2 text-sm leading-relaxed text-neutral-700">
                  No. Providers cannot pay to change ranking order, Remit-Score, or sorting logic. Rankings are determined by comparison data (recipient gets, total cost, speed, trust signals) and our consistent methodology.
                </div>
              </details>

              <div class="border-t border-neutral-200" />

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between py-4 text-left font-semibold text-neutral-900 hover:text-brand-600 transition-colors">
                  <span class="text-base">How do affiliate partnerships work? Do I have to pay to be listed?</span>
                  <svg class="h-5 w-5 flex-shrink-0 text-neutral-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div class="pb-4 pt-2 text-sm leading-relaxed text-neutral-700">
                  <p class="mb-3">
                    <strong class="font-semibold text-neutral-900">No upfront costs.</strong> There's no fee to be listed on Remit-Scout. If you provide API access or structured data, we'll list you for free.
                  </p>
                  <p class="mb-3">
                    Affiliate partnerships are optional. If we have an affiliate relationship, we only earn a commission when a user clicks through from Remit-Scout and completes a transfer with you. If you don't want an affiliate relationship, we'll still list you — you just won't pay any commissions.
                  </p>
                  <p>
                    Either way, your ranking is determined by pricing and service quality, not by whether we have an affiliate relationship. Users pay the same price whether they find you through Remit-Scout or directly — we earn commissions from providers, not users.
                  </p>
                </div>
              </details>

              <div class="border-t border-neutral-200" />

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between py-4 text-left font-semibold text-neutral-900 hover:text-brand-600 transition-colors">
                  <span class="text-base">What's the benefit to me if I don't want an affiliate relationship?</span>
                  <svg class="h-5 w-5 flex-shrink-0 text-neutral-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div class="pb-4 pt-2 text-sm leading-relaxed text-neutral-700">
                  <p class="mb-3">
                    Even without an affiliate relationship, you still benefit from:
                  </p>
                  <ul class="space-y-2 ml-4 list-disc">
                    <li><strong class="font-semibold text-neutral-900">Free exposure:</strong> You appear in comparison results when users search your corridors, driving qualified traffic to your site at no cost.</li>
                    <li><strong class="font-semibold text-neutral-900">Fair ranking:</strong> If your pricing is competitive, you rank higher — you're not penalized for not having an affiliate relationship.</li>
                    <li><strong class="font-semibold text-neutral-900">Brand visibility:</strong> Users discover your service and build awareness, even if they don't click through immediately.</li>
                    <li><strong class="font-semibold text-neutral-900">New customer acquisition:</strong> Users who click through to your site become customers — you just don't pay us a commission.</li>
                  </ul>
                  <p class="mt-3">
                    Many providers start without affiliate relationships and add them later if the traffic volume justifies it. You can always opt in to affiliate tracking later.
                  </p>
                </div>
              </details>

              <div class="border-t border-neutral-200" />

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between py-4 text-left font-semibold text-neutral-900 hover:text-brand-600 transition-colors">
                  <span class="text-base">Can I improve my ranking by paying more or having a stronger affiliate relationship?</span>
                  <svg class="h-5 w-5 flex-shrink-0 text-neutral-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div class="pb-4 pt-2 text-sm leading-relaxed text-neutral-700">
                  <p class="mb-3">
                    <strong class="font-semibold text-neutral-900">No.</strong> Our ranking algorithm is completely independent of commercial relationships. We don't offer "pay-to-rank" or "premium placement" options.
                  </p>
                  <p>
                    Rankings are determined solely by comparison data: what recipients receive (after fees and FX markup), total cost, transfer speed, and trust signals. Our scoring formula is public (see our methodology page). If you want to improve your ranking, improve your pricing and service quality — that's the only way.
                  </p>
                </div>
              </details>

              <div class="border-t border-neutral-200" />

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between py-4 text-left font-semibold text-neutral-900 hover:text-brand-600 transition-colors">
                  <span class="text-base">What if my pricing changes or I notice an error in how I'm listed?</span>
                  <svg class="h-5 w-5 flex-shrink-0 text-neutral-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div class="pb-4 pt-2 text-sm leading-relaxed text-neutral-700">
                  <p class="mb-3">
                    <strong class="font-semibold text-neutral-900">We fix errors quickly.</strong> If you notice incorrect pricing, fees, or service details, contact your partnership contact or use our corrections form. We investigate all provider reports within 24 hours and update the site immediately when we confirm the issue.
                  </p>
                  <p>
                    For pricing changes: If you have API access, updates are automatic. If we pull quotes manually, just let us know when pricing changes and we'll update our system. For new corridors, promotions, or service changes, keep your partnership contact updated and we'll reflect changes on the site.
                  </p>
                </div>
              </details>

              <div class="border-t border-neutral-200" />

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between py-4 text-left font-semibold text-neutral-900 hover:text-brand-600 transition-colors">
                  <span class="text-base">How long does onboarding take? What's the process?</span>
                  <svg class="h-5 w-5 flex-shrink-0 text-neutral-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div class="pb-4 pt-2 text-sm leading-relaxed text-neutral-700">
                  <p class="mb-3">
                    Most providers can be listed within <strong class="font-semibold text-neutral-900">1-2 weeks</strong> of initial contact. Here's the typical process:
                  </p>
                  <ol class="space-y-2 ml-4 list-decimal">
                    <li><strong class="font-semibold text-neutral-900">Initial contact:</strong> Fill out our provider inquiry form or email us with basic info about your service.</li>
                    <li><strong class="font-semibold text-neutral-900">Data sharing:</strong> Share your API endpoint, structured data feed, or pricing documentation.</li>
                    <li><strong class="font-semibold text-neutral-900">Integration:</strong> We integrate your data into our comparison system (usually 3-5 business days).</li>
                    <li><strong class="font-semibold text-neutral-900">Testing & verification:</strong> We test quotes across your corridors and verify accuracy.</li>
                    <li><strong class="font-semibold text-neutral-900">Go live:</strong> You appear in comparison results!</li>
                  </ol>
                  <p class="mt-3">
                    If you have API access ready, the process is faster. If we need to pull quotes manually, it may take a bit longer. We'll keep you updated throughout the process.
                  </p>
                </div>
              </details>
            </div>
          </div>

          <div class="mt-8 text-center">
            <NuxtLink
              to="/faq"
              class="inline-flex items-center justify-center rounded-xl border border-brand-600 bg-white px-6 py-3 text-base font-semibold text-brand-600 transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            >
              View all FAQs
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="py-16 sm:py-20 bg-brand-600">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          Ready to get listed on Remit-Scout?
        </h2>
        <p class="text-xl text-white/90 mb-8">
          Get discovered by expats and international families actively comparing transfer options
        </p>
        <p class="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
          No upfront costs. No pay-to-rank. Just accurate, fair comparison that helps users find the best option — and helps you reach new customers when you offer competitive pricing.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4">
          <NuxtLink
            to="/contact?type=partnership"
            class="inline-flex items-center gap-3 px-8 py-4 bg-white text-brand-600 font-bold text-lg rounded-xl hover:bg-neutral-50 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <span>Discuss partnership</span>
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </NuxtLink>
          <NuxtLink
            to="/methodology"
            class="inline-flex items-center gap-3 px-8 py-4 border-2 border-white/30 bg-transparent text-white font-bold text-lg rounded-xl hover:bg-white/10 transition-all duration-200"
          >
            <span>See how we compare</span>
          </NuxtLink>
        </div>
        <div class="mt-8 pt-8 border-t border-white/20">
          <p class="text-sm text-white/80 mb-3">
            More resources:
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <NuxtLink
              to="/how-we-make-money"
              class="text-sm text-white/90 hover:text-white underline"
            >
              How we make money
            </NuxtLink>
            <span class="text-white/50">•</span>
            <NuxtLink
              to="/affiliate-disclosure"
              class="text-sm text-white/90 hover:text-white underline"
            >
              Affiliate disclosure
            </NuxtLink>
            <span class="text-white/50">•</span>
            <NuxtLink
              to="/corrections"
              class="text-sm text-white/90 hover:text-white underline"
            >
              Corrections policy
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

const partners = ref([
  { name: 'Wise', type: 'Money Transfer', emoji: '💸' },
  { name: 'Remitly', type: 'Money Transfer', emoji: '📱' },
  { name: 'WorldRemit', type: 'Money Transfer', emoji: '🌍' },
  { name: 'Western Union', type: 'Money Transfer', emoji: '🏦' },
  { name: 'MoneyGram', type: 'Money Transfer', emoji: '💼' },
  { name: 'Xoom', type: 'Money Transfer', emoji: '⚡' },
  { name: 'SendWave', type: 'Money Transfer', emoji: '📲' },
  { name: 'Azimo', type: 'Money Transfer', emoji: '🚀' },
])

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'
const canonicalUrl = `${siteUrl}/partnerships`
const lastReviewedIso = '2025-12-01'

setSeo({
  title: 'Partnerships | Remit-Scout',
  description: 'Work with Remit-Scout — an independent remittance comparison and market data platform built for transparency, with no pay-to-rank.',
  canonical: canonicalUrl,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Partnerships', url: canonicalUrl },
])

const hostname = (() => {
  try {
    return new URL(siteUrl).hostname
  }
  catch {
    return 'Remit-Scout.com'
  }
})()

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Remit-Scout',
  url: siteUrl,
  logo: `${siteUrl}/logos/remit-scout.svg`,
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: `support@${hostname}`,
      url: `${siteUrl}/contact`,
    },
  ],
  sameAs: [
    'https://linkedin.com/company/Remit-Scout',
  ],
}

useHead({
  meta: [
    { name: 'author', content: 'Remit-Scout' },
    { property: 'article:modified_time', content: lastReviewedIso },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(organizationSchema),
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Partnerships', path: '/partnerships' },
]
</script>
