<template>
  <div class="min-h-screen bg-white pb-20 md:pb-0 break-words [text-wrap:pretty] [overflow-wrap:anywhere] [hyphens:auto]">
    <!-- Reusable Compare Widget -->
    <CompareWidget />

    <!-- Hero Section -->
    <div class="relative bg-gradient-to-br from-slate-50 to-white py-12 lg:py-16 overflow-hidden">
      <!-- Subtle Background Graphics with minimal animations -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <!-- Subtle gradient orbs with gentle animation -->
        <div class="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-400/15 via-blue-300/10 to-transparent rounded-full blur-3xl animate-pulse" style="animation-duration: 8s;"></div>
        <div class="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-emerald-400/15 via-emerald-300/10 to-transparent rounded-full blur-3xl animate-pulse" style="animation-duration: 10s; animation-delay: 2s;"></div>
        
        <!-- A few floating icons for visual interest -->
        <div class="absolute top-24 right-32 opacity-8">
          <svg class="w-16 h-16 text-blue-500/20 animate-float" style="animation-duration: 6s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        
        <div class="absolute bottom-32 left-24 opacity-8">
          <svg class="w-14 h-14 text-emerald-500/20 animate-float" style="animation-duration: 7s; animation-delay: 1s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        
        <div class="absolute top-1/3 right-20 opacity-6">
          <svg class="w-12 h-12 text-blue-400/15 animate-float" style="animation-duration: 8s; animation-delay: 2s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        
        <!-- Very subtle grid pattern -->
        <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>
      
      <div class="container mx-auto px-4 max-w-5xl text-center relative z-10">
        <Breadcrumbs :items="breadcrumbItems" />
        
        <h1 class="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl [text-wrap:balance]">
          About <span class="text-blue-600">Remit-Scout</span>
        </h1>
        <p class="mx-auto max-w-2xl text-xl text-slate-600 sm:text-2xl font-medium mb-8">
          Built by expats who got tired of losing money to fees
        </p>
        <p class="mx-auto max-w-3xl text-lg text-slate-600 leading-relaxed">
          Remit-Scout is an expat-built research studio for cross-border money. Backed by <button @click="handleExternalLink('https://www.cmu.edu/swartz-center-for-entrepreneurship/')" class="text-blue-600 hover:text-blue-700 underline font-medium whitespace-nowrap">Carnegie Mellon's Swartz Entrepreneurship Program</button>, we run real transfers, surface the honest "recipient gets" number, and fight hidden markups so your family keeps every possible dollar.
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-12 max-w-6xl">
      
      <!-- Impact Statistics -->
      <section class="mb-16">
        <div class="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-8 lg:p-12 shadow-2xl">
          <div class="text-center mb-10">
            <h2 class="text-2xl sm:text-3xl font-bold text-white mb-3">Our Impact So Far 📈</h2>
            <p class="text-blue-100 text-lg max-w-2xl mx-auto">Small team, big mission: helping families keep more of their hard‑earned money</p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div class="text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
                <span class="text-3xl">👥</span>
              </div>
              <div class="text-3xl md:text-4xl font-bold text-white mb-1">80k+</div>
              <div class="text-sm text-blue-100">people have used Remit-Scout</div>
            </div>

            <div class="text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
                <span class="text-3xl">💰</span>
              </div>
              <div class="text-3xl md:text-4xl font-bold text-white mb-1">$2.5M+</div>
              <div class="text-sm text-blue-100">saved in fees and FX markups</div>
            </div>

            <div class="text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
                <span class="text-3xl">🏢</span>
              </div>
              <div class="text-3xl md:text-4xl font-bold text-white mb-1">30+</div>
              <div class="text-sm text-blue-100">providers tested</div>
            </div>

            <div class="text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
                <span class="text-3xl">🌍</span>
              </div>
              <div class="text-3xl md:text-4xl font-bold text-white mb-1">150+</div>
              <div class="text-sm text-blue-100">corridors covered</div>
            </div>
          </div>

          <div class="mt-10 pt-8 border-t border-blue-500 text-center">
            <p class="text-blue-50 text-base leading-relaxed max-w-3xl mx-auto">
              🎓 Built inside <strong class="font-semibold text-white whitespace-nowrap">Carnegie Mellon University's Swartz Entrepreneurship Program</strong>, supported by mentors, advisors, and a global community of expats who deserve honest comparisons.
            </p>
          </div>
        </div>
      </section>

      <!-- Founder Profile Block -->
      <section class="mb-16">
        <div class="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 lg:p-10 shadow-xl">
          <div class="flex flex-col lg:flex-row items-center gap-8">
            <div class="flex-shrink-0">
              <div class="relative w-32 h-32 lg:w-40 lg:h-40">
                <div class="absolute inset-2 rounded-2xl bg-gradient-to-br from-blue-400 via-blue-300 to-emerald-400 blur-xl opacity-80" />
                <img
                  :src="founderHeadshotUrl"
                  :onerror="`this.src='/images/about/omar-placeholder.jpg'; this.onerror=null;`"
                  alt="Omar Ghabayen, Founder of Remit-Scout"
                  class="relative w-full h-full rounded-2xl object-cover border-4 border-white shadow-2xl"
                />
              </div>
            </div>
            <div class="flex-1 text-center lg:text-left">
              <div class="inline-block mb-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                Founder
              </div>
              <h3 class="text-3xl font-bold text-slate-900 mb-3">Omar Ghabayen</h3>
              <div class="space-y-2 mb-4">
                <div class="flex items-center justify-center lg:justify-start gap-2 text-slate-600">
                  <span>🌍</span>
                  <span class="text-sm font-medium">Expat from Jordan</span>
                </div>
                <div class="flex items-center justify-center lg:justify-start gap-2 text-slate-600">
                  <span>💼</span>
                  <span class="text-sm font-medium">Ex-American Express</span>
                </div>
              </div>
              <div class="relative pl-4 border-l-4 border-blue-400 italic text-slate-700 leading-relaxed">
                <p class="text-base">
                  "You earned every dollar, why should banks and middlemen quietly help themselves to a share? I started Remit-Scout to put control (and cash) back in your hands."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section: Our Story -->
      <section class="mb-16">
        <div class="mb-8 flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 shadow-md">
              <span class="text-3xl">✈️</span>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-slate-900">Our Story</h2>
              <p class="mt-1 text-slate-600">How losing $30 per transfer turned into a transparency project</p>
            </div>
          </div>
        </div>

        <div class="space-y-6 text-base leading-relaxed text-slate-700">
          <p>
            In 2023, <strong class="font-semibold text-slate-900">Omar Ghabayen</strong> left Amman for Carnegie Mellon. Every time his family sent tuition or grocery money from Jordan to the US, about $30 quietly disappeared—half from the sending bank, half from the receiving bank.
          </p>
          <p>
            For a student, that's two weeks of food or a required textbook, gone to fine print.
          </p>
          <p class="font-medium text-slate-800">
            Digging deeper made it worse:
          </p>
          <ul class="ml-6 space-y-2 list-none">
            <li class="flex items-start gap-2">
              <span class="text-red-500 font-bold mt-1">•</span>
              <span>"Low fee" offers hiding high FX markups</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-500 font-bold mt-1">•</span>
              <span>Comparison sites rearranged by sponsorships</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-500 font-bold mt-1">•</span>
              <span>No one showing the only number that actually matters: how much the recipient receives</span>
            </li>
          </ul>
          <p class="text-lg font-semibold text-slate-900">
            <span class="text-blue-600">Remit-Scout</span> is our answer to that problem—a platform built on real transfers, honest comparisons, and zero pay-to-play rankings.
          </p>
          <p>
            We run real transfers, publish what actually happened, and refuse pay‑to‑play rankings. If we say "this provider is #1," it's because your recipient gets more, not because someone bought the slot.
          </p>
          <p class="text-slate-600">
            <strong class="font-semibold text-slate-900">We're lean by design:</strong> a founder, trusted CMU advisors, and a community of expats who send money abroad every month. Every new feature is shaped by people who live this problem.
          </p>
        </div>
      </section>

      <!-- Section: Our Mission -->
      <section class="mb-16">
        <div class="mb-8 flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 shadow-md">
              <span class="text-3xl">🌍</span>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-slate-900">Our Mission</h2>
              <p class="mt-1 text-slate-600">Make cross-border money as predictable as booking a plane ticket</p>
            </div>
          </div>
        </div>

        <div class="space-y-6 text-base leading-relaxed text-slate-700">
          <p class="text-lg font-medium text-slate-800">
            Remit-Scout exists so you always know the landing number:
          </p>
          <ul class="ml-6 space-y-2 list-none">
            <li class="flex items-start gap-2">
              <span class="text-emerald-500 font-bold mt-1">✓</span>
              <span>What your recipient will actually receive</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-emerald-500 font-bold mt-1">✓</span>
              <span>How long it will take</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-emerald-500 font-bold mt-1">✓</span>
              <span>What every fee is paying for</span>
            </li>
          </ul>
          <p class="text-slate-600 italic">
            No glitter, just proofs.
          </p>
          <p class="text-lg font-semibold text-slate-900">
            We operate on four pillars:
          </p>
          <div class="grid gap-4 sm:grid-cols-2 mt-6">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-start gap-3 mb-3">
                <div class="mt-1 h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-2xl">👀</span>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900 mb-1">Transparency</h3>
                  <p class="text-sm text-slate-700 leading-relaxed">
                    Clear "recipient gets" amounts, mid‑market benchmarks, and plain‑language explanations.
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-start gap-3 mb-3">
                <div class="mt-1 h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-2xl">🛡️</span>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900 mb-1">Independence</h3>
                  <p class="text-sm text-slate-700 leading-relaxed">
                    No paid rankings. Ever. Revenue is separated from recommendations.
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-start gap-3 mb-3">
                <div class="mt-1 h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-2xl">✅</span>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900 mb-1">Accuracy</h3>
                  <p class="text-sm text-slate-700 leading-relaxed">
                    Real transfers, real receipts, real delivery times.
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-start gap-3 mb-3">
                <div class="mt-1 h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-2xl">🤝</span>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900 mb-1">Community</h3>
                  <p class="text-sm text-slate-700 leading-relaxed">
                    Built by expats, for expats, with constant feedback loops.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p class="mt-6">
            Whether you're sending family support, covering tuition, paying remote teammates, or racing a deadline, we keep the math obvious and the trust earned.
          </p>
        </div>
      </section>
    </div>

    <!-- Who We Help - Full Width Section -->
    <section class="mb-16 py-12 sm:py-16 bg-brand-600 w-full">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold text-white mb-3">Who We Help 🌐</h2>
          <p class="text-lg text-white/90 max-w-2xl mx-auto">Transparency matters for everyone sending money across borders</p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-6 hover:bg-white/20 transition-all">
            <div class="text-4xl mb-4">🎓</div>
            <h3 class="text-lg font-semibold text-white mb-2">Students & Parents</h3>
            <p class="text-sm text-white/90 leading-relaxed">
              Sending tuition payments where every dollar counts toward your education.
            </p>
          </div>

          <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-6 hover:bg-white/20 transition-all">
            <div class="text-4xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 class="text-lg font-semibold text-white mb-2">Families Supporting Loved Ones</h3>
            <p class="text-sm text-white/90 leading-relaxed">
              Making sure grocery money actually buys groceries back home.
            </p>
          </div>

          <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-6 hover:bg-white/20 transition-all">
            <div class="text-4xl mb-4">💼</div>
            <h3 class="text-lg font-semibold text-white mb-2">Remote Workers & Freelancers</h3>
            <p class="text-sm text-white/90 leading-relaxed">
              Getting paid internationally without losing a chunk to hidden fees.
            </p>
          </div>

          <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-6 hover:bg-white/20 transition-all">
            <div class="text-4xl mb-4">🏢</div>
            <h3 class="text-lg font-semibold text-white mb-2">Small Businesses</h3>
            <p class="text-sm text-white/90 leading-relaxed">
              Paying international contractors fairly and transparently.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content Continued -->
    <div class="container mx-auto px-4 py-12 max-w-6xl">
      <!-- What Makes Us Different -->
      <section class="mb-16">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold text-slate-900 mb-3">What Makes Remit-Scout Different</h2>
        </div>

        <div class="space-y-8">
          <div class="rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
                <span class="text-3xl">👀</span>
              </div>
              <div class="flex-1">
                <h3 class="text-2xl font-semibold text-slate-900 mb-4">Radical Transparency</h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  We show the total amount your recipient will receive, including:
                </p>
                <ul class="space-y-2 text-slate-700 pl-0">
                  <li class="flex items-start">
                    <span class="text-blue-600 font-bold mr-3 mt-0.5 flex-shrink-0 w-4 text-right">•</span>
                    <span>Transfer fees</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-blue-600 font-bold mr-3 mt-0.5 flex-shrink-0 w-4 text-right">•</span>
                    <span>Exchange rate markups</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-blue-600 font-bold mr-3 mt-0.5 flex-shrink-0 w-4 text-right">•</span>
                    <span>Delivery speed</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-blue-600 font-bold mr-3 mt-0.5 flex-shrink-0 w-4 text-right">•</span>
                    <span>Payout methods</span>
                  </li>
                </ul>
                <p class="mt-4 text-slate-600 italic">
                  No guessing, no surprise deductions at the other end.
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 flex-shrink-0">
                <span class="text-3xl">🛡️</span>
              </div>
              <div class="flex-1">
                <h3 class="text-2xl font-semibold text-slate-900 mb-4">Complete Independence</h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  <strong class="font-semibold text-slate-900">Providers cannot pay to rank higher—full stop.</strong>
                </p>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  Our rankings are driven by data:
                </p>
                <ul class="ml-6 space-y-2 text-slate-700 mb-4">
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold mt-1">•</span>
                    <span>Total cost (fees + FX markup)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold mt-1">•</span>
                    <span>Delivery speed</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold mt-1">•</span>
                    <span>Reliability and safety</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold mt-1">•</span>
                    <span>User experience</span>
                  </li>
                </ul>
                <p class="text-base leading-relaxed text-slate-700 mb-2">
                  We do have affiliate partnerships (we may earn a small commission when you click through and complete a transfer), which helps keep Remit-Scout free. But:
                </p>
                <ul class="ml-6 space-y-2 text-slate-700">
                  <li class="flex items-start gap-2">
                    <span class="text-slate-400">→</span>
                    <span>Partnerships never decide who appears in the top spots</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-slate-400">→</span>
                    <span>Sponsored placements are clearly labeled and shown apart from rankings</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-slate-400">→</span>
                    <span>Editorial decisions are made independently (currently by Omar, with input from CMU advisors)</span>
                  </li>
                </ul>
                <p class="mt-4 font-medium text-slate-900">
                  If we recommend a provider, it's because they genuinely offer good value—not because they pay us.
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 flex-shrink-0">
                <span class="text-3xl">✅</span>
              </div>
              <div class="flex-1">
                <h3 class="text-2xl font-semibold text-slate-900 mb-4">Human-Verified Accuracy</h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  We don't just read marketing pages. We:
                </p>
                <ul class="ml-6 space-y-2 text-slate-700">
                  <li class="flex items-start gap-2">
                    <span class="text-purple-600 font-bold mt-1">•</span>
                    <span>Open accounts</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-purple-600 font-bold mt-1">•</span>
                    <span>Run test transfers across different corridors and amounts</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-purple-600 font-bold mt-1">•</span>
                    <span>Time every step from signup to arrival</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-purple-600 font-bold mt-1">•</span>
                    <span>Collect receipts, screenshots, and support transcripts</span>
                  </li>
                </ul>
                <p class="mt-4 font-medium text-slate-900">
                  Recommendations are based on actual experience, not brochures.
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 flex-shrink-0">
                <span class="text-3xl">🤝</span>
              </div>
              <div class="flex-1">
                <h3 class="text-2xl font-semibold text-slate-900 mb-4">Community-Driven</h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  We're built by expats, for expats.
                </p>
                <p class="text-base leading-relaxed text-slate-700">
                  Every comparison, every guide, every feature:
                </p>
                <ul class="ml-6 space-y-2 text-slate-700 mt-2">
                  <li class="flex items-start gap-2">
                    <span class="text-orange-600 font-bold mt-1">•</span>
                    <span>Starts with real stories from people sending money abroad</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-orange-600 font-bold mt-1">•</span>
                    <span>Is refined based on user feedback</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-orange-600 font-bold mt-1">•</span>
                    <span>Gets updated when you report issues, delays, or surprise fees</span>
                  </li>
                </ul>
                <p class="mt-4 font-medium text-slate-900">
                  Your experiences keep the platform honest.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section: How We Work -->
      <section class="mb-16">
        <div class="mb-8 flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 shadow-md">
              <span class="text-3xl">🧪</span>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-slate-900">How We Work</h2>
              <p class="mt-1 text-slate-600">A simple playbook: test, verify, explain</p>
            </div>
          </div>
          <NuxtLink 
            to="/methodology"
            class="hidden sm:flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
          >
            Read Methodology
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NuxtLink>
        </div>

        <!-- Methodology Timeline Visual -->
        <div class="mb-8 hidden md:block">
          <div class="relative">
            <div class="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-emerald-200 via-purple-200 via-orange-200 to-slate-200" />
            <div class="relative flex justify-between items-start">
              <div class="flex flex-col items-center" style="width: 20%">
                <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl shadow-lg mb-3 relative z-10">📊</div>
                <div class="text-xs font-semibold text-center text-slate-700">Data Collection</div>
              </div>
              <div class="flex flex-col items-center" style="width: 20%">
                <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl shadow-lg mb-3 relative z-10">💸</div>
                <div class="text-xs font-semibold text-center text-slate-700">Real Testing</div>
              </div>
              <div class="flex flex-col items-center" style="width: 20%">
                <div class="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl shadow-lg mb-3 relative z-10">🧮</div>
                <div class="text-xs font-semibold text-center text-slate-700">Cost Calculation</div>
              </div>
              <div class="flex flex-col items-center" style="width: 20%">
                <div class="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl shadow-lg mb-3 relative z-10">⭐</div>
                <div class="text-xs font-semibold text-center text-slate-700">Remit Score</div>
              </div>
              <div class="flex flex-col items-center" style="width: 20%">
                <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl shadow-lg mb-3 relative z-10">🔄</div>
                <div class="text-xs font-semibold text-center text-slate-700">Ongoing Updates</div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
                <span class="text-3xl">📊</span>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-slate-900 mb-3">
                  <span class="text-blue-600">1.</span> Data Collection & Verification
                </h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  We start with live exchange rates and fees from provider APIs and sites, then:
                </p>
                <ul class="ml-6 space-y-2 text-slate-700">
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600">→</span>
                    <span>Cross-check them with real transfers</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600">→</span>
                    <span>Verify licensing and regulation with authorities like the FCA (UK), FinCEN (US), ASIC (AU), and peers worldwide</span>
                  </li>
                </ul>
                <p class="mt-4 font-medium text-slate-900">
                  If a provider can't prove it's legit, it doesn't appear. No exceptions.
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 flex-shrink-0">
                <span class="text-3xl">💸</span>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-slate-900 mb-3">
                  <span class="text-emerald-600">2.</span> Real Transfer Testing
                </h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  Whenever possible, we put our own money on the line across:
                </p>
                <ul class="ml-6 space-y-2 text-slate-700">
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600">→</span>
                    <span>Corridors like US→India, UK→Pakistan, Canada→Philippines, and more</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600">→</span>
                    <span>Different amounts</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600">→</span>
                    <span>Bank, cash pickup, and mobile wallet payouts</span>
                  </li>
                </ul>
                <p class="mt-4 text-slate-700">
                  We also test customer support: email, chat, and phone. How quickly do they fix an issue? What happens if a transfer needs to be canceled?
                </p>
                <p class="mt-2 font-medium text-slate-900">
                  Those receipts go straight into our reviews.
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 flex-shrink-0">
                <span class="text-3xl">🧮</span>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-slate-900 mb-3">
                  <span class="text-purple-600">3.</span> Total Cost Calculation
                </h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  Most sites stop at the headline fee and ignore hidden FX markups.
                </p>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  We compare the real "recipient gets" amount to the mid‑market rate (the rate banks give each other). The difference is the hidden markup.
                </p>
                <div class="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-4">
                  <p class="text-sm font-semibold text-purple-900 mb-2">Example:</p>
                  <p class="text-sm text-slate-700 leading-relaxed">
                    If you send <strong>$1,000 USD to India</strong> when the real rate is <strong>83.00 INR</strong> but the provider pays <strong>81.50 INR</strong>, that's <strong class="text-purple-700">₹1,500 gone</strong>. We show:
                  </p>
                  <ul class="mt-3 ml-4 space-y-1 text-sm text-slate-700">
                    <li class="flex items-center gap-2">
                      <span class="text-purple-600">•</span>
                      <span><strong>Total Cost</strong></span>
                    </li>
                    <li class="flex items-center gap-2">
                      <span class="text-purple-600">•</span>
                      <span><strong>Amount Received</strong></span>
                    </li>
                  </ul>
                  <p class="mt-3 text-sm text-slate-700">
                    So you can compare apples to apples.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Remit Score Banner (like home page) -->
          <div class="bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-200 rounded-xl p-6">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-neutral-900 mb-2">
                    <span class="text-orange-600">4.</span> Remit Score Rating System
                  </h3>
                  <p class="text-sm text-neutral-700 mb-3 max-w-3xl leading-relaxed">
                    Each provider gets a <span class="font-semibold">Remit-Score</span> (0-10 scale) based on real transfer data, not paid reviews. 
                    Scores like <span class="font-bold text-brand-600">9.5</span>, <span class="font-bold text-brand-600">8.4</span>, or <span class="font-bold text-brand-600">7.2</span> reflect actual value, speed, reliability, and safety across thousands of transfers.
                  </p>
                  <button
                    @click="showRemitScoreModal = true"
                    class="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Learn how we calculate Remit-Score
                    <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                @click="showRemitScoreModal = true"
                class="hidden sm:flex flex-shrink-0 px-4 py-2 bg-white border border-brand-300 hover:border-brand-600 text-brand-600 font-medium rounded-lg transition-colors text-sm"
              >
                View Details
              </button>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 hover:shadow-lg transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 flex-shrink-0">
                <span class="text-3xl">🔄</span>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-slate-900 mb-3">
                  <span class="text-slate-600">5.</span> Ongoing Monitoring & Updates
                </h3>
                <p class="text-base leading-relaxed text-slate-700 mb-4">
                  Rates move. Fees change. Rules evolve. So we:
                </p>
                <ul class="ml-6 space-y-2 text-slate-700">
                  <li class="flex items-start gap-2">
                    <span class="text-slate-600">→</span>
                    <span>Refresh provider data multiple times a day</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-slate-600">→</span>
                    <span>Revisit Remit Scores on a regular schedule</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-slate-600">→</span>
                    <span>Update reviews when users report slow deliveries, surprise fees, or support issues (and after we've verified with the provider)</span>
                  </li>
                </ul>
                <p class="mt-4 font-medium text-slate-900">
                  The goal: when you compare today, you're seeing today's reality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Mini FAQ for Trust Questions -->
      <section class="mb-16">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold text-slate-900 mb-3">Trust & Safety FAQ 🔒</h2>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">Quick answers to common questions about how Remit-Scout works</p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start gap-3 mb-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0 mt-0.5">
                <span class="text-lg">💰</span>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">How does Remit-Scout make money?</h3>
                <p class="text-sm text-slate-700 leading-relaxed">
                  We earn affiliate commissions when you click through and complete a transfer. But these partnerships never influence our rankings—providers cannot pay to rank higher.
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start gap-3 mb-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 flex-shrink-0 mt-0.5">
                <span class="text-lg">🏆</span>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Can providers pay to rank higher?</h3>
                <p class="text-sm text-slate-700 leading-relaxed">
                  No. Never. Rankings are based purely on data: total cost, delivery speed, reliability, and user experience. Sponsored content is clearly labeled and shown separately.
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start gap-3 mb-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0 mt-0.5">
                <span class="text-lg">🏦</span>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Do you hold or move my money?</h3>
                <p class="text-sm text-slate-700 leading-relaxed">
                  No. We're a comparison tool, not a bank or money transfer service. We link you to licensed providers—the actual transfer happens between you and them.
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start gap-3 mb-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 flex-shrink-0 mt-0.5">
                <span class="text-lg">⏱️</span>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">How often are rates updated?</h3>
                <p class="text-sm text-slate-700 leading-relaxed">
                  Multiple times per day. We pull live rates from provider APIs so you're always seeing current market conditions, not stale data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Safety & Privacy Section -->
      <section class="mb-16">
        <div class="rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-8 lg:p-10">
          <div class="flex items-center gap-3 mb-6">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white flex-shrink-0">
              <span class="text-2xl">🔒</span>
            </div>
            <h2 class="text-2xl font-bold text-slate-900">Your Safety & Privacy</h2>
          </div>
          
          <div class="space-y-4 text-base text-slate-700 leading-relaxed">
            <div class="flex items-start gap-3">
              <span class="text-green-600 font-bold mt-1">✓</span>
              <p><strong class="font-semibold text-slate-900">We never move or hold your funds.</strong> You send money directly through licensed providers—we just show you which one offers the best deal.</p>
            </div>
            <div class="flex items-start gap-3">
              <span class="text-green-600 font-bold mt-1">✓</span>
              <p><strong class="font-semibold text-slate-900">We don't see your full card or bank details.</strong> When you click through to a provider, they handle all payment information securely on their platform.</p>
            </div>
            <div class="flex items-start gap-3">
              <span class="text-green-600 font-bold mt-1">✓</span>
              <p><strong class="font-semibold text-slate-900">We only link to licensed providers.</strong> Every provider on Remit-Scout is verified with regulators like the FCA, FinCEN, ASIC, and international peers.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Our Commitment Section -->
      <section class="mb-16">
        <div class="mb-8 flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 shadow-md">
              <span class="text-3xl">🤝</span>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-slate-900">Our Commitment to You</h2>
            </div>
          </div>
        </div>

        <div class="rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 lg:p-12">
          <div class="grid gap-8 lg:grid-cols-2">
            <div class="space-y-6">
              <h3 class="text-2xl font-bold text-slate-900">Editorial Independence</h3>
              <div class="space-y-4 text-base leading-relaxed text-slate-700">
                <p>
                  <strong class="font-semibold text-slate-900">Rankings are never for sale.</strong>
                </p>
                <p>
                  Sponsored/Partner content is clearly labeled. Affiliate revenue does not influence our rankings or reviews.
                </p>
                <p>
                  We're a comparison tool, not a bank and not your financial advisor. The final decision—and the actual transfer—always happens between you and the provider you choose. Our job is to make that choice as clear and fair as possible.
                </p>
              </div>
            </div>

            <div class="space-y-6">
              <h3 class="text-2xl font-bold text-slate-900">Always Improving</h3>
              <div class="space-y-4 text-base leading-relaxed text-slate-700">
                <p>
                  We're committed to continuous improvement and expanding our coverage. Every day we're:
                </p>
                <ul class="ml-6 space-y-2">
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>Adding new corridors based on user requests</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>Testing additional providers to expand your options</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>Improving our testing methodology based on user feedback</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold">✓</span>
                    <span>Updating rates and fees multiple times per day</span>
                  </li>
                </ul>
                <p class="font-medium text-slate-900">
                  If you need information about a corridor we don't fully cover yet, <NuxtLink to="/contact" class="text-blue-600 hover:underline">let us know</NuxtLink> and we'll prioritize adding it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Transparency & Links -->
      <section class="mb-16 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">🔗</div>
          <h3 class="text-xl font-semibold text-slate-900">See how we work</h3>
        </div>
        <p class="text-sm text-slate-700 [text-wrap:pretty]">
          Dive deeper into our testing, revenue disclosures, and support resources:
        </p>
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <NuxtLink to="/methodology" class="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:border-blue-300 hover:text-blue-700 transition-colors">
            <span>🧪</span><span class="font-semibold">Methodology</span>
          </NuxtLink>
          <NuxtLink to="/faq" class="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:border-blue-300 hover:text-blue-700 transition-colors">
            <span>❓</span><span class="font-semibold">FAQs</span>
          </NuxtLink>
          <NuxtLink to="/how-we-make-money" class="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:border-blue-300 hover:text-blue-700 transition-colors">
            <span>📜</span><span class="font-semibold">How we make money</span>
          </NuxtLink>
          <NuxtLink to="/contact" class="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:border-blue-300 hover:text-blue-700 transition-colors">
            <span>💬</span><span class="font-semibold">Talk to us</span>
          </NuxtLink>
        </div>
      </section>

      <!-- Services We Offer -->
      <section class="mb-16">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold text-slate-900 mb-3">Services We Offer 🎯</h2>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">Everything you need for living, working, and traveling abroad</p>
        </div>

        <div class="grid gap-6 md:grid-cols-3">
          <NuxtLink 
            to="/learn"
            class="group rounded-2xl border-2 border-slate-200 bg-white p-8 hover:border-blue-400 hover:shadow-xl transition-all"
          >
            <div class="flex items-center gap-4 mb-4">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <span class="text-3xl">📚</span>
              </div>
              <h3 class="text-xl font-bold text-slate-900">Learn</h3>
            </div>
            <p class="text-slate-700 leading-relaxed mb-4">
              In-depth guides, tips, and resources for managing money across borders. Learn about exchange rates, fees, regulations, and best practices.
            </p>
            <div class="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
              <span>Explore Guides</span>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </NuxtLink>

          <NuxtLink 
            to="/"
            class="group rounded-2xl border-2 border-slate-200 bg-white p-8 hover:border-emerald-400 hover:shadow-xl transition-all"
          >
            <div class="flex items-center gap-4 mb-4">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                <span class="text-3xl">💸</span>
              </div>
              <h3 class="text-xl font-bold text-slate-900">Money Transfer</h3>
            </div>
            <p class="text-slate-700 leading-relaxed mb-4">
              Compare live rates from 30+ providers. See exactly how much your recipient gets with transparent fee breakdowns and delivery times.
            </p>
            <div class="flex items-center gap-2 text-emerald-600 font-semibold group-hover:gap-3 transition-all">
              <span>Compare Now</span>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </NuxtLink>

          <NuxtLink 
            to="/esim"
            class="group rounded-2xl border-2 border-slate-200 bg-white p-8 hover:border-purple-400 hover:shadow-xl transition-all"
          >
            <div class="flex items-center gap-4 mb-4">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
                <span class="text-3xl">📱</span>
              </div>
              <h3 class="text-xl font-bold text-slate-900">eSIM Comparison</h3>
            </div>
            <p class="text-slate-700 leading-relaxed mb-4">
              Stay connected abroad without roaming fees. Compare eSIM data plans for travelers and expats across 150+ countries.
            </p>
            <div class="flex items-center gap-2 text-purple-600 font-semibold group-hover:gap-3 transition-all">
              <span>Find eSIMs</span>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Partnerships -->
      <section class="mb-16">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold text-slate-900 mb-3">Partnerships 🤝</h2>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">Work with us to bring transparency to cross-border payments</p>
        </div>

        <div class="rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 lg:p-12">
          <div class="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            <div class="flex flex-col space-y-6">
              <h3 class="text-2xl font-bold text-slate-900">For Money Transfer Providers</h3>
              <p class="text-base leading-relaxed text-slate-700 flex-grow">
                If you're a licensed money transfer provider, we'd love to include you in our comparisons. Our platform helps users find the best rates while driving qualified customers to services that genuinely offer value.
              </p>
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <span class="text-emerald-600 font-bold mt-1">✓</span>
                  <span class="text-slate-700">Fair, data-driven rankings based on cost, speed, and reliability</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-emerald-600 font-bold mt-1">✓</span>
                  <span class="text-slate-700">Exposure to 80k+ users comparing rates monthly</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-emerald-600 font-bold mt-1">✓</span>
                  <span class="text-slate-700">Transparent affiliate partnerships—no pay-to-rank schemes</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col space-y-6">
              <h3 class="text-2xl font-bold text-slate-900">For Organizations & Media</h3>
              <p class="text-base leading-relaxed text-slate-700 flex-grow">
                We partner with universities, expat communities, financial education platforms, and media outlets to bring transparent money transfer information to wider audiences.
              </p>
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <span class="text-blue-600 font-bold mt-1">✓</span>
                  <span class="text-slate-700">Educational content partnerships and co-branded resources</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-blue-600 font-bold mt-1">✓</span>
                  <span class="text-slate-700">API access for real-time rate comparisons</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-blue-600 font-bold mt-1">✓</span>
                  <span class="text-slate-700">White-label solutions for your community</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-10 pt-8 border-t border-slate-200 text-center">
            <p class="text-slate-700 mb-6">
              Interested in partnering with Remit-Scout? Let's talk about how we can work together.
            </p>
            <NuxtLink 
              to="/contact"
              class="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-8 py-4 text-lg font-semibold text-white hover:bg-slate-800 transition-colors shadow-lg"
            >
              Discuss Partnership
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Read Our Guides -->
      <section class="mb-16">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold text-slate-900 mb-3">Read Our Guides 📖</h2>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">Expert advice for managing money across borders</p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <NuxtLink 
            to="/learn"
            class="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <span class="text-xl">💱</span>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Exchange Rates 101</h3>
                <p class="text-xs text-slate-600">5 min read</p>
              </div>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              Understand how currency exchange rates work and how they impact your international transfers.
            </p>
          </NuxtLink>

          <NuxtLink 
            to="/learn"
            class="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                <span class="text-xl">💰</span>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Hidden Fees Explained</h3>
                <p class="text-xs text-slate-600">7 min read</p>
              </div>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              Learn about the different types of fees in money transfers and how to avoid paying more than necessary.
            </p>
          </NuxtLink>

          <NuxtLink 
            to="/learn"
            class="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
                <span class="text-xl">🔒</span>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Transfer Safety Guide</h3>
                <p class="text-xs text-slate-600">6 min read</p>
              </div>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              Security best practices for sending money internationally and avoiding scams.
            </p>
          </NuxtLink>

          <NuxtLink 
            to="/learn"
            class="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 group-hover:bg-orange-200 transition-colors">
                <span class="text-xl">⏱️</span>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Best Time to Transfer</h3>
                <p class="text-xs text-slate-600">4 min read</p>
              </div>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              When is the optimal time to make international transfers for maximum value?
            </p>
          </NuxtLink>

          <NuxtLink 
            to="/learn"
            class="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 group-hover:bg-rose-200 transition-colors">
                <span class="text-xl">🌍</span>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Living Abroad Guide</h3>
                <p class="text-xs text-slate-600">10 min read</p>
              </div>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              Essential financial tips for expats: banking, taxes, remittances, and money management.
            </p>
          </NuxtLink>

          <NuxtLink 
            to="/learn"
            class="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                <span class="text-xl">📊</span>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Provider Comparison Tips</h3>
                <p class="text-xs text-slate-600">5 min read</p>
              </div>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              How to evaluate money transfer providers and find the best option for your needs.
            </p>
          </NuxtLink>
        </div>

        <div class="mt-8 text-center">
          <NuxtLink 
            to="/learn"
            class="inline-flex items-center gap-2 rounded-lg border-2 border-blue-600 bg-white px-8 py-4 text-lg font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Browse All Guides
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NuxtLink>
        </div>
      </section>

      <!-- Quick FAQ -->
      <section class="mb-16">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold text-slate-900 mb-3">Frequently Asked Questions ❓</h2>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">Common questions about Remit-Scout and money transfers</p>
        </div>

        <div class="space-y-4 max-w-4xl mx-auto">
          <details class="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-all">
            <summary class="flex items-center justify-between cursor-pointer list-none">
              <h3 class="text-lg font-semibold text-slate-900">Is Remit-Scout free to use?</h3>
              <svg class="h-5 w-5 text-slate-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p class="mt-4 text-slate-700 leading-relaxed">
              Yes, Remit-Scout is completely free for users. We earn small affiliate commissions when you click through and complete a transfer, but these partnerships never influence our rankings or recommendations.
            </p>
          </details>

          <details class="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-all">
            <summary class="flex items-center justify-between cursor-pointer list-none">
              <h3 class="text-lg font-semibold text-slate-900">How do you choose which providers to recommend?</h3>
              <svg class="h-5 w-5 text-slate-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p class="mt-4 text-slate-700 leading-relaxed">
              Our Remit Score rating system evaluates providers based on four equally weighted factors: total cost (fees + FX markup), delivery speed, trust & safety (licensing, security), and customer experience. Rankings are data-driven and cannot be influenced by payments.
            </p>
          </details>

          <details class="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-all">
            <summary class="flex items-center justify-between cursor-pointer list-none">
              <h3 class="text-lg font-semibold text-slate-900">Are all providers licensed and regulated?</h3>
              <svg class="h-5 w-5 text-slate-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p class="mt-4 text-slate-700 leading-relaxed">
              Yes. We verify all providers with financial authorities like the FCA (UK), FinCEN (US), ASIC (Australia), and international regulators. If a provider can't prove they're properly licensed, they don't appear on our platform.
            </p>
          </details>

          <details class="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-all">
            <summary class="flex items-center justify-between cursor-pointer list-none">
              <h3 class="text-lg font-semibold text-slate-900">How accurate are your fee and rate comparisons?</h3>
              <svg class="h-5 w-5 text-slate-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p class="mt-4 text-slate-700 leading-relaxed">
              We check rates throughout the day so you're always seeing current prices. We also test transfers ourselves to make sure delivery times and costs are accurate. If the rate changes before you send, the provider will show you the exact amount you'll pay before you confirm.
            </p>
          </details>

          <details class="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-all">
            <summary class="flex items-center justify-between cursor-pointer list-none">
              <h3 class="text-lg font-semibold text-slate-900">What if I have a problem with a transfer?</h3>
              <svg class="h-5 w-5 text-slate-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p class="mt-4 text-slate-700 leading-relaxed">
              Since the transfer happens directly with the provider, you'll need to contact their customer support first. If you're having trouble getting help, let us know—we track provider support quality and can escalate serious issues.
            </p>
          </details>
        </div>

        <div class="mt-8 text-center">
          <NuxtLink 
            to="/faq"
            class="inline-flex items-center gap-2 rounded-lg border-2 border-slate-600 bg-white px-8 py-4 text-lg font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            View All FAQs
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NuxtLink>
        </div>
      </section>

      <!-- Contact/Feedback Prompt -->
      <section class="mb-16">
        <div class="rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 lg:p-10">
          <div class="flex items-center gap-3 mb-6">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-600 text-white flex-shrink-0">
              <span class="text-2xl">💬</span>
            </div>
            <h2 class="text-2xl font-bold text-slate-900">We Want to Hear From You</h2>
          </div>
          
          <p class="text-base text-slate-700 leading-relaxed mb-6">
            Remit-Scout gets better with your feedback. Whether you found a bug, spotted incorrect fees, want to request a corridor, or have ideas for new features—we're listening.
          </p>

          <div class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
              <div class="text-2xl mb-2">🐛</div>
              <h3 class="text-sm font-semibold text-slate-900 mb-2">Report a Bug</h3>
              <p class="text-xs text-slate-600 leading-relaxed">Something not working? Let us know so we can fix it.</p>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
              <div class="text-2xl mb-2">💡</div>
              <h3 class="text-sm font-semibold text-slate-900 mb-2">Suggest a Feature</h3>
              <p class="text-xs text-slate-600 leading-relaxed">Have an idea? Share it. Many features come from user requests.</p>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
              <div class="text-2xl mb-2">🌍</div>
              <h3 class="text-sm font-semibold text-slate-900 mb-2">Request a Corridor</h3>
              <p class="text-xs text-slate-600 leading-relaxed">Need a route we don't cover? Tell us and we'll prioritize it.</p>
            </div>
          </div>

          <div class="mt-8 text-center">
            <NuxtLink 
              to="/contact"
              class="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-8 py-4 text-lg font-semibold text-white hover:bg-slate-800 transition-colors shadow-lg"
            >
              Contact Us
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </section>

    </div>

    <!-- Trust Metrics Strip -->
    <TrustMetricsStrip />

    <!-- Remit Score Modal -->
    <RemitScoreModal :is-open="showRemitScoreModal" @update:is-open="showRemitScoreModal = $event" />

    <!-- External Link Modal -->
    <Teleport to="body">
      <div
        v-if="showExternalLinkModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click="closeExternalLinkModal"
      >
        <div
          class="relative max-w-md w-full rounded-2xl bg-white p-8 shadow-2xl"
          @click.stop
        >
          <button
            @click="closeExternalLinkModal"
            class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <svg class="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 class="mb-3 text-2xl font-bold text-slate-900">You are leaving Remit-Scout</h3>
            <p class="mb-6 text-slate-600 leading-relaxed">
              You're about to visit an external website. Remit-Scout is not responsible for the content or privacy practices of external sites.
            </p>

            <div class="flex gap-3">
              <button
                @click="closeExternalLinkModal"
                class="flex-1 rounded-lg border-2 border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="confirmExternalLink"
                class="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import RemitScoreModal from '~/components/shared/RemitScoreModal.vue'

const founderHeadshotUrl = '/images/about/omar-ghabayen-headshot.webp'

// Remit Score modal state
const showRemitScoreModal = ref(false)

// External link modal state
const showExternalLinkModal = ref(false)
const pendingExternalUrl = ref('')

const handleExternalLink = (url: string) => {
  pendingExternalUrl.value = url
  showExternalLinkModal.value = true
}

const confirmExternalLink = () => {
  if (pendingExternalUrl.value) {
    window.open(pendingExternalUrl.value, '_blank', 'noopener,noreferrer')
    closeExternalLinkModal()
  }
}

const closeExternalLinkModal = () => {
  showExternalLinkModal.value = false
  pendingExternalUrl.value = ''
}

useHead({
  title: 'About Us | Remit-Scout — Transparent Money Transfer Comparisons',
  meta: [
    {
      name: 'description',
      content: `Built by expats who got tired of losing grocery money to bank fees. Backed by Carnegie Mellon's Swartz Entrepreneurship Program, we run real transfers and fight hidden markups so your family keeps every possible dollar.`,
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'About Us', path: '/about' },
]
</script>
