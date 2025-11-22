<template>
  <div class="min-h-screen bg-white pb-20 md:pb-0 break-words [text-wrap:pretty] [overflow-wrap:anywhere]">
    <!-- Reusable Compare Widget -->
    <CompareWidget />

    <!-- Hero Section -->
    <div class="relative bg-gradient-to-br from-slate-50 to-white py-12 lg:py-16 overflow-hidden">
      <!-- Abstract Background Graphics -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <!-- Gradient orbs -->
        <div class="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 via-blue-300/15 to-transparent rounded-full blur-3xl"></div>
        <div class="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 via-emerald-300/15 to-transparent rounded-full blur-3xl"></div>
        
        <!-- Floating abstract shapes -->
        <div class="absolute top-1/4 right-1/4 opacity-10">
          <div class="w-32 h-32 border-2 border-blue-400/30 rounded-2xl rotate-12"></div>
        </div>
        <div class="absolute bottom-1/4 left-1/4 opacity-10">
          <div class="w-24 h-24 border-2 border-emerald-400/30 rounded-full -rotate-12"></div>
        </div>
        <div class="absolute top-1/2 left-1/3 opacity-8">
          <div class="w-20 h-20 border-2 border-purple-400/25 rounded-lg rotate-45"></div>
        </div>
        
        <!-- Money Transfer Arrows - Symbolizing transfers -->
        <svg class="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
          <!-- Arrow path from left to right (money flowing) -->
          <defs>
            <marker id="arrowhead-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
            </marker>
            <marker id="arrowhead-emerald" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
            </marker>
          </defs>
          
          <!-- Animated transfer arrows -->
          <path 
            d="M100,200 Q300,150 500,200 T900,200" 
            stroke="#3b82f6" 
            stroke-width="3" 
            fill="none"
            marker-end="url(#arrowhead-blue)"
            class="animate-pulse"
            style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 6s ease-in-out infinite;"
          />
          <path 
            d="M150,350 Q350,300 550,350 T950,350" 
            stroke="#10b981" 
            stroke-width="3" 
            fill="none"
            marker-end="url(#arrowhead-emerald)"
            style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 8s ease-in-out infinite 1s;"
          />
          <path 
            d="M200,100 Q400,50 600,100 T1000,100" 
            stroke="#3b82f6" 
            stroke-width="2.5" 
            fill="none"
            marker-end="url(#arrowhead-blue)"
            style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 7s ease-in-out infinite 0.5s;"
          />
        </svg>
        
        <!-- Floating arrow icons -->
        <div class="absolute top-20 left-20 opacity-12">
          <svg class="w-16 h-16 text-blue-500 animate-float" style="animation-delay: 0s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <div class="absolute bottom-32 right-24 opacity-12">
          <svg class="w-14 h-14 text-emerald-500 animate-float" style="animation-delay: 1.5s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <div class="absolute top-1/3 right-16 opacity-10">
          <svg class="w-12 h-12 text-blue-500 animate-float" style="animation-delay: 2s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        
        <!-- Subtle grid pattern -->
        <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>
      
      <div class="container mx-auto px-4 max-w-5xl text-center relative z-10">
        <Breadcrumbs :items="breadcrumbItems" />
        
        <h1 class="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl [text-wrap:balance]">
          How We Make Money
        </h1>
        <p class="mx-auto max-w-3xl text-xl text-slate-600 sm:text-2xl font-medium mb-8">
          Complete transparency about our revenue model and editorial independence
        </p>
        <p class="mx-auto max-w-3xl text-lg text-slate-600 leading-relaxed [text-wrap:pretty]">
          <span class="text-blue-600 font-semibold">Remit-Scout</span> is free to use. To keep the platform running and continue providing transparent comparisons, we earn revenue through clearly disclosed partnerships. <strong class="font-semibold text-blue-600">Revenue never influences our rankings.</strong> Learn more about our <NuxtLink to="/about" class="text-blue-600 hover:text-blue-700 underline font-semibold">founder's experience</NuxtLink> and how we test providers in our <NuxtLink to="/methodology" class="text-blue-600 hover:text-blue-700 underline font-semibold">methodology</NuxtLink>.
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-12 max-w-6xl">
      
      <!-- Why We Need Revenue -->
      <section class="mb-16 rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 lg:p-12">
        <div class="flex items-start gap-4 mb-6">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white flex-shrink-0">
            <span class="text-3xl">💰</span>
          </div>
          <div>
            <h2 class="text-3xl font-bold text-slate-900 mb-3">Why We Need Revenue</h2>
            <p class="text-lg text-slate-700 leading-relaxed [text-wrap:pretty]">
              Running <span class="text-blue-600 font-semibold">Remit-Scout</span> requires resources to keep the platform running smoothly. We test real transfers, update rates daily, and maintain the site so you can find the best deals. Revenue helps us:
            </p>
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-2 mt-6">
          <div class="flex items-start gap-3">
            <span class="text-blue-600 font-bold text-xl mt-1">✓</span>
            <span class="text-slate-700">Keep the platform free for all users</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-blue-600 font-bold text-xl mt-1">✓</span>
            <span class="text-slate-700">Run real test transfers across multiple corridors</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-blue-600 font-bold text-xl mt-1">✓</span>
            <span class="text-slate-700">Maintain and update live exchange rates daily</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-blue-600 font-bold text-xl mt-1">✓</span>
            <span class="text-slate-700">Invest in platform improvements and new features</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-blue-600 font-bold text-xl mt-1">✓</span>
            <span class="text-slate-700">Support our team and operations</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-blue-600 font-bold text-xl mt-1">✓</span>
            <span class="text-slate-700">Expand coverage to more corridors and providers</span>
          </div>
        </div>
      </section>

      <!-- Revenue Streams -->
      <section class="mb-16">
        <div class="mb-8 flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 shadow-md">
              <span class="text-3xl">📊</span>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-slate-900">Our Revenue Streams</h2>
              <p class="mt-1 text-slate-600">Transparent disclosure of how we earn revenue</p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Affiliate Commissions -->
          <div class="rounded-2xl border-2 border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
                <span class="text-2xl">🔗</span>
              </div>
              <div class="flex-1">
                <h3 class="text-2xl font-semibold text-slate-900 mb-3">Affiliate Commissions</h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4 [text-wrap:pretty]">
                  When you click through from <span class="text-blue-600 font-semibold">Remit-Scout</span> and complete a transfer with a provider, we may earn a small commission. This is how most comparison sites work and helps us keep <span class="text-blue-600 font-semibold">Remit-Scout</span> free for everyone. See our <NuxtLink to="/methodology" class="text-blue-600 hover:text-blue-700 underline font-semibold">testing process</NuxtLink> to understand how we verify these providers.
                </p>
                <div class="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-4">
                  <p class="text-sm font-semibold text-blue-900 mb-2">How it works:</p>
                  <ul class="space-y-2 text-sm text-slate-700">
                    <li class="flex items-start gap-2">
                      <span class="text-blue-600 font-bold mt-0.5">•</span>
                      <span>You compare rates on Remit-Scout (free)</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-blue-600 font-bold mt-0.5">•</span>
                      <span>You click through to a provider's website</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-blue-600 font-bold mt-0.5">•</span>
                      <span>You complete a transfer with that provider</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-blue-600 font-bold mt-0.5">•</span>
                      <span>Provider pays us a commission (typically 1-3% of transfer value)</span>
                    </li>
                  </ul>
                </div>
                <p class="text-base leading-relaxed text-slate-700 [text-wrap:pretty]">
                  <strong class="font-semibold text-blue-600">Important:</strong> The commission is already included in the provider's normal prices. You pay the same amount whether you find them through <span class="text-blue-600 font-semibold">Remit-Scout</span> or go directly to their website. The commission doesn't add to your fees or take money away from your recipient. Check our <NuxtLink to="/faq" class="text-blue-600 hover:text-blue-700 underline font-semibold">FAQ page</NuxtLink> for more answers about how this works.
                </p>
              </div>
            </div>
          </div>

          <!-- Sponsored Content -->
          <div class="rounded-2xl border-2 border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 flex-shrink-0">
                <span class="text-2xl">📢</span>
              </div>
              <div class="flex-1">
                <h3 class="text-2xl font-semibold text-slate-900 mb-3">Sponsored Content & Advertising</h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4 [text-wrap:pretty]">
                  Some providers pay for sponsored spots or ads on <span class="text-blue-600 font-semibold">Remit-Scout</span>. Everything that's sponsored is clearly marked and kept separate from our regular rankings. This helps us keep the site running while staying honest about what's an ad. Learn more about our <NuxtLink to="/about" class="text-blue-600 hover:text-blue-700 underline font-semibold">editorial standards</NuxtLink>.
                </p>
                <div class="space-y-3">
                  <div class="flex items-start gap-3">
                    <span class="text-purple-600 font-bold mt-1">✓</span>
                    <span class="text-slate-700"><strong class="font-semibold">Clear labeling:</strong> All sponsored content is marked with "Sponsored" or "Ad" labels</span>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="text-purple-600 font-bold mt-1">✓</span>
                    <span class="text-slate-700"><strong class="font-semibold">Separate placement:</strong> Sponsored results appear in designated areas, never mixed with organic rankings</span>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="text-purple-600 font-bold mt-1">✓</span>
                    <span class="text-slate-700"><strong class="font-semibold">No ranking influence:</strong> Sponsored placements never affect our Remit-Score or ranking order</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Partnerships & APIs -->
          <div class="rounded-2xl border-2 border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 flex-shrink-0">
                <span class="text-2xl">🤝</span>
              </div>
              <div class="flex-1">
                <h3 class="text-2xl font-semibold text-slate-900 mb-3">Partnerships & API Access</h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4 [text-wrap:pretty]">
                  We work with organizations, media companies, and education platforms to share our data and tools. These partnerships help more people find better rates while we keep our rankings honest. <strong class="font-semibold text-blue-600">Partnership money never changes our rankings.</strong> Business deals and what we recommend are kept completely separate.
                </p>
                <div class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p class="text-sm text-slate-700 leading-relaxed mb-3 [text-wrap:pretty]">
                    <strong class="font-semibold text-blue-600">Interested in partnering with us?</strong> We work with money transfer providers, media outlets, and organizations that want to help people save on transfers.
                  </p>
                  <NuxtLink 
                    to="/affiliate-partnerships"
                    class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Explore Partnership Opportunities
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Editorial Independence -->
      <section class="mb-16 rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 lg:p-12">
        <div class="flex items-start gap-4 mb-6">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white flex-shrink-0">
            <span class="text-3xl">🛡️</span>
          </div>
          <div>
            <h2 class="text-3xl font-bold text-slate-900 mb-3">Our Editorial Independence Guarantee</h2>
            <p class="text-lg text-slate-700 leading-relaxed mb-6 [text-wrap:pretty]">
              <span class="text-blue-600 font-semibold">Revenue never influences rankings.</span> This is our promise to you and how we've built trust. Our founder <NuxtLink to="/about" class="text-blue-600 hover:text-blue-700 underline font-semibold">Omar Ghabayen</NuxtLink> built <span class="text-blue-600 font-semibold">Remit-Scout</span> after losing money to hidden fees, so we test providers ourselves and show you the real results. See our <NuxtLink to="/methodology" class="text-blue-600 hover:text-blue-700 underline font-semibold">testing methodology</NuxtLink> to learn how we verify everything.
            </p>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div class="rounded-2xl border border-emerald-200 bg-white p-6">
            <h3 class="text-xl font-semibold text-slate-900 mb-4">How Rankings Work</h3>
            <p class="text-base leading-relaxed text-slate-700 mb-4">
              Providers are ranked solely based on:
            </p>
            <ul class="space-y-2 text-slate-700">
              <li class="flex items-start gap-2">
                <span class="text-emerald-600 font-bold mt-0.5">•</span>
                <span><strong>Total cost</strong> (fees + exchange rate markup)</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-emerald-600 font-bold mt-0.5">•</span>
                <span><strong>Delivery speed</strong> (how fast money arrives)</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-emerald-600 font-bold mt-0.5">•</span>
                <span><strong>Trust & safety</strong> (licensing, security, regulation)</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-emerald-600 font-bold mt-0.5">•</span>
                <span><strong>User experience</strong> (ease of use, customer support)</span>
              </li>
            </ul>
          </div>

          <div class="rounded-2xl border border-emerald-200 bg-white p-6">
            <h3 class="text-xl font-semibold text-slate-900 mb-4">What Never Affects Rankings</h3>
            <ul class="space-y-3 text-slate-700">
              <li class="flex items-start gap-3">
                <span class="text-red-600 font-bold mt-1">✗</span>
                <span><strong>Affiliate partnerships</strong> - Having an affiliate link does not improve a provider's ranking</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-red-600 font-bold mt-1">✗</span>
                <span><strong>Sponsored placements</strong> - Advertising revenue does not influence organic rankings</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-red-600 font-bold mt-1">✗</span>
                <span><strong>Partnership agreements</strong> - Business partnerships are separate from editorial decisions</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-red-600 font-bold mt-1">✗</span>
                <span><strong>Payment for placement</strong> - Providers cannot pay to rank higher (we don't offer this)</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-8 rounded-xl border-2 border-emerald-300 bg-emerald-100 p-6">
          <p class="text-base font-semibold text-emerald-900 mb-2">Real Example:</p>
          <p class="text-sm text-emerald-800 leading-relaxed">
            If Provider A (no affiliate partnership) offers better rates and lower fees than Provider B (with affiliate partnership), Provider A will rank higher. We show you the best deal, period. Revenue opportunities never override data-driven rankings.
          </p>
        </div>
      </section>

      <!-- Transparency Measures -->
      <section class="mb-16">
        <div class="mb-8 flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 shadow-md">
              <span class="text-3xl">👁️</span>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-slate-900">Transparency Measures</h2>
              <p class="mt-1 text-slate-600">How we maintain accountability and trust</p>
            </div>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-6">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <span class="text-2xl">📋</span>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Clear Disclosure</h3>
            <p class="text-sm text-slate-700 leading-relaxed">
              All affiliate links and sponsored content are clearly labeled. You always know when you're clicking through a partner link.
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <span class="text-2xl">📊</span>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Public Methodology</h3>
            <p class="text-sm text-slate-700 leading-relaxed [text-wrap:pretty]">
              Our ranking method is open for everyone to see. Check our <NuxtLink to="/methodology" class="text-blue-600 hover:text-blue-700 underline font-semibold">methodology page</NuxtLink> to understand exactly how we calculate <span class="text-blue-600 font-semibold">Remit-Score</span> and rank providers.
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <span class="text-2xl">🔄</span>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Regular Audits</h3>
            <p class="text-sm text-slate-700 leading-relaxed">
              We regularly review our rankings to ensure revenue relationships haven't influenced results. Editorial and business teams are separated.
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <span class="text-2xl">💬</span>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">User Feedback</h3>
            <p class="text-sm text-slate-700 leading-relaxed">
              We actively monitor user feedback and reports. If you notice a ranking that seems off, we investigate immediately.
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100">
              <span class="text-2xl">📝</span>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Change Logs</h3>
            <p class="text-sm text-slate-700 leading-relaxed">
              When we update our methodology or ranking weights, we publish change logs explaining what changed and why.
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
              <span class="text-2xl">📧</span>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Open Communication</h3>
            <p class="text-sm text-slate-700 leading-relaxed [text-wrap:pretty]">
              Questions about how we make money? <NuxtLink to="/contact" class="text-blue-600 hover:text-blue-700 underline font-semibold">Contact us</NuxtLink> or check our <NuxtLink to="/faq" class="text-blue-600 hover:text-blue-700 underline font-semibold">FAQ page</NuxtLink>. We're committed to being transparent and happy to explain anything about how <span class="text-blue-600 font-semibold">Remit-Scout</span> works.
            </p>
          </div>
        </div>
      </section>

      <!-- The Bottom Line -->
      <section class="mb-16 rounded-3xl border-2 border-slate-300 bg-gradient-to-br from-slate-900 to-slate-800 p-8 lg:p-12 text-white">
        <div class="text-center max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold text-white mb-4 text-center">The Bottom Line</h2>
          <p class="text-lg text-white/90 leading-relaxed mb-6 [text-wrap:pretty]">
            <span class="font-semibold text-white">Remit-Scout</span> needs revenue to operate, but we've built our entire platform around the principle that <strong class="font-semibold text-white">your best interests come first</strong>. We show you the providers that get the most money to your recipient, regardless of our commercial relationships. Our <NuxtLink to="/about" class="text-white underline font-semibold hover:text-blue-200">founder's experience</NuxtLink> as an expat who lost money to fees drives <span class="whitespace-nowrap">everything we do</span>.
          </p>
          <p class="text-lg text-white/90 leading-relaxed mb-8 [text-wrap:pretty]">
            Revenue keeps the lights on. Data drives the rankings. That's our commitment to you. Built by someone who's been there, tested with real transfers, and backed by <span class="font-semibold">Carnegie Mellon's Swartz Entrepreneurship Program</span>.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-4 mb-6">
            <NuxtLink 
              to="/methodology"
              class="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Read Our Methodology
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
            <NuxtLink 
              to="/affiliate-partnerships"
              class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Partner With Us
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
            <NuxtLink 
              to="/contact"
              class="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 bg-slate-800/50 px-6 py-3 text-base font-semibold text-white hover:bg-slate-700/50 transition-colors"
            >
              Ask Questions
            </NuxtLink>
          </div>
          <div class="pt-6 border-t border-white/20">
            <p class="text-sm text-white/80 mb-3">Have more questions? Check out these resources:</p>
            <div class="flex flex-wrap items-center justify-center gap-3">
              <NuxtLink to="/faq" class="text-sm text-white/90 hover:text-white underline">Frequently Asked Questions</NuxtLink>
              <span class="text-white/50">•</span>
              <NuxtLink to="/about" class="text-sm text-white/90 hover:text-white underline">About Remit-Scout</NuxtLink>
              <span class="text-white/50">•</span>
              <NuxtLink to="/providers" class="text-sm text-white/90 hover:text-white underline">Browse All Providers</NuxtLink>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Trust Metrics Strip -->
    <TrustMetricsStrip />
  </div>
</template>

<script setup lang="ts">
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'

useHead({
  title: 'How We Make Money | Remit-Scout - Complete Revenue Transparency',
  meta: [
    {
      name: 'description',
      content: 'Complete transparency about how Remit-Scout earns revenue through affiliate commissions, sponsored content, and partnerships. Revenue never influences our rankings.',
    },
    {
      property: 'og:title',
      content: 'How We Make Money | Remit-Scout - Complete Revenue Transparency'
    },
    {
      property: 'og:description',
      content: 'Learn how Remit-Scout earns revenue while maintaining complete editorial independence. Your best interests come first.'
    }
  ]
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'How We Make Money', path: '/how-we-make-money' },
]
</script>

