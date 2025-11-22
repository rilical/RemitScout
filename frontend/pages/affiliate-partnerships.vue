<template>
  <div class="min-h-screen bg-white pb-16 md:pb-0 break-words [text-wrap:pretty] [overflow-wrap:anywhere]">
    <div class="relative bg-gradient-to-br from-slate-50 via-white to-blue-50 py-10 overflow-hidden">
      <!-- Handshake Icons & Partnership Graphics -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <!-- Gradient orbs -->
        <div class="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 via-blue-300/15 to-transparent rounded-full blur-3xl"></div>
        <div class="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 via-emerald-300/15 to-transparent rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-purple-300/15 via-blue-300/15 to-emerald-300/15 rounded-full blur-3xl"></div>
        
        <!-- Handshake Icons (Primary Theme) -->
        <div class="absolute top-24 right-32 opacity-15">
          <div class="relative">
            <div class="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-ping" style="animation-duration: 3s;"></div>
            <svg class="relative w-24 h-24 text-blue-500/35 animate-float" style="animation-delay: 0s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>
        
        <div class="absolute bottom-36 left-32 opacity-15">
          <div class="relative">
            <div class="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-ping" style="animation-duration: 4s; animation-delay: 1s;"></div>
            <svg class="relative w-20 h-20 text-emerald-500/35 animate-float" style="animation-delay: 1.5s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>
        
        <div class="absolute top-1/3 left-24 opacity-12">
          <svg class="w-16 h-16 text-purple-500/30 animate-float" style="animation-delay: 2s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        
        <!-- Partnership/Connection Icons -->
        <div class="absolute top-1/4 right-20 opacity-10">
          <svg class="w-18 h-18 text-blue-400/25 animate-float" style="animation-delay: 1s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        
        <div class="absolute bottom-1/3 left-20 opacity-10">
          <svg class="w-16 h-16 text-emerald-400/25 animate-float" style="animation-delay: 3s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        
        <!-- Geometric shapes -->
        <div class="absolute top-40 right-1/3 w-32 h-32 border border-blue-300/10 rounded-2xl rotate-12 opacity-8"></div>
        <div class="absolute bottom-40 left-1/3 w-24 h-24 border border-emerald-300/10 rounded-full -rotate-12 opacity-8"></div>
        
        <!-- Subtle grid pattern -->
        <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>
      
      <div class="container mx-auto max-w-6xl px-4 relative z-10">
        <Breadcrumbs :items="breadcrumbItems" />
        <div class="mt-8 grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div class="space-y-5">
            <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200">
              <span>🤝</span><span>Partner with an expat-founded, CMU-backed team</span>
            </div>
            <h1 class="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl [text-wrap:balance]">
              Build smarter money content with Remit-Scout.
            </h1>
            <p class="text-lg leading-relaxed text-slate-700">
              Turn your audience into savvy senders. We bring live “recipient gets” data, transparent rankings, and tested providers; you bring a community that hates hidden fees.
            </p>
            <div class="flex flex-wrap gap-3 text-sm text-slate-700">
              <NuxtLink to="/methodology" class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 font-semibold hover:text-blue-700">
                <span>🧪</span><span>How we test</span>
              </NuxtLink>
              <NuxtLink to="/how-we-make-money" class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 font-semibold hover:text-blue-700">
                <span>📜</span><span>How we earn</span>
              </NuxtLink>
              <NuxtLink to="/about" class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 font-semibold hover:text-blue-700">
                <span>👤</span><span>Founder story</span>
              </NuxtLink>
            </div>
            <div class="flex flex-wrap gap-3">
              <NuxtLink
                to="/contact"
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Start a partnership
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </NuxtLink>
              <NuxtLink
                to="/learn"
                class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-blue-300 hover:text-blue-700"
              >
                Browse guides
              </NuxtLink>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur">
            <div class="mb-4 flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">📈</div>
              <div>
                <p class="text-sm font-semibold text-slate-900">Why partners stay</p>
                <p class="text-xs text-slate-600">Data, receipts, and a neutral ranking policy.</p>
              </div>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Audience</p>
                <p class="text-lg font-bold text-slate-900">{{ stats.users }}</p>
                <p class="text-xs text-slate-600">expats and students comparing routes monthly</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Corridors</p>
                <p class="text-lg font-bold text-slate-900">{{ stats.corridors }}</p>
                <p class="text-xs text-slate-600">routes monitored with live “recipient gets” math</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Providers</p>
                <p class="text-lg font-bold text-slate-900">{{ stats.providers }}</p>
                <p class="text-xs text-slate-600">licensed, tested services—no paid placement</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Credibility</p>
                <p class="text-lg font-bold text-slate-900">CMU Swartz</p>
                <p class="text-xs text-slate-600">Founder built inside the Swartz Entrepreneurship Program</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto max-w-6xl px-4 py-16 space-y-16">
      <!-- Blog-style intro -->
      <section class="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div class="flex items-start gap-3 mb-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">📰</div>
          <div>
            <p class="text-sm font-semibold text-slate-700">Editorial independence</p>
            <p class="text-xs text-slate-500">Ranking order is never for sale.</p>
          </div>
        </div>
        <div class="space-y-4 text-base leading-relaxed text-slate-700">
          <p>
            We started Remit-Scout because $30 kept disappearing every time Omar wired money home. Partners join us when they want to help readers avoid that fate—with proof, not ads.
          </p>
          <p>
            Every recommendation is tied to live “recipient gets” amounts, mid-market benchmarks, and human-tested support checks. We say no to paid fast lanes, which is why our partners use us as a neutral source instead of another affiliate listicle.
          </p>
          <p class="text-slate-600">
            Want to see the receipts? Read our <NuxtLink to="/methodology" class="font-semibold text-blue-700 hover:underline">methodology</NuxtLink> and <NuxtLink to="/how-we-make-money" class="font-semibold text-blue-700 hover:underline">how we make money</NuxtLink>.
          </p>
        </div>
      </section>

      <!-- Partnership formats -->
      <section class="space-y-8">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">🧩</div>
          <div>
            <h2 class="text-3xl font-bold text-slate-900">Partnership formats that actually perform</h2>
            <p class="text-sm text-slate-600">Pick the mix that fits your channel and audience.</p>
          </div>
        </div>
        <div class="grid gap-6 md:grid-cols-2">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="mb-3 flex items-center gap-2 text-blue-700">
              <span>📝</span><p class="text-sm font-semibold">Content collabs</p>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">Guides, guest posts, interviews</h3>
            <p class="text-sm text-slate-700">We supply data, screenshots, and plain-language explainers; you tell the story in your voice. Great for blogs, newsletters, and community forums.</p>
            <NuxtLink to="/learn" class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800">
              Browse our guides
              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="mb-3 flex items-center gap-2 text-emerald-700">
              <span>🔧</span><p class="text-sm font-semibold">Widgets & tools</p>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">Embedded comparison experiences</h3>
            <p class="text-sm text-slate-700">Drop a Mini Compare widget on your site or use our API feed for your corridor pages. Updated in real time, mobile-ready, and neutral by default.</p>
            <NuxtLink to="/contact" class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              Request embed access
              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="mb-3 flex items-center gap-2 text-orange-700">
              <span>📢</span><p class="text-sm font-semibold">Campaigns & sponsorships</p>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">Co-branded pushes with receipts</h3>
            <p class="text-sm text-slate-700">Run seasonal “save on fees” campaigns using our live rate deltas and screenshots. Perfect for influencers, publishers, and associations.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="mb-3 flex items-center gap-2 text-purple-700">
              <span>💰</span><p class="text-sm font-semibold">Performance partnerships</p>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">Revenue-share with clear attribution</h3>
            <p class="text-sm text-slate-700">Earn when your audience picks a provider through us. Transparent tracking links, pixels, and monthly reporting included.</p>
          </div>
        </div>
      </section>

      <!-- What partners get -->
      <section class="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
              🎁 Partner toolkit
            </div>
            <h2 class="mt-3 text-3xl font-bold text-slate-900">Everything you need to launch fast</h2>
            <p class="text-sm text-slate-600">Assets, data, and support so you can hit publish quickly.</p>
          </div>
          <NuxtLink
            to="/contact"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Request the media kit
          </NuxtLink>
        </div>
        <div class="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Brand assets</p>
            <p class="text-xs text-slate-700 mt-1">Logos, banners, color/typography specs, usage do/don’ts.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Content starters</p>
            <p class="text-xs text-slate-700 mt-1">Prewritten blurbs, comparisons, screenshots, and FAQ blocks.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Technical docs</p>
            <p class="text-xs text-slate-700 mt-1">Widget embeds, API docs, tracking links, conversion pixels.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Reporting</p>
            <p class="text-xs text-slate-700 mt-1">Real-time dashboards + monthly summaries.</p>
          </div>
        </div>
      </section>

      <!-- Why partner (E-E-A-T) -->
      <section class="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-xl">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700">🔒</div>
          <h2 class="text-3xl font-bold text-slate-900">Why partners trust us</h2>
        </div>
        <div class="grid gap-6 md:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Evidence</p>
            <p class="text-sm text-slate-700 mt-2">Live transfers, screenshots, and mid-market comparisons back every claim. See our <NuxtLink to="/methodology" class="font-semibold text-blue-700 hover:underline">methodology</NuxtLink>.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Experience</p>
            <p class="text-sm text-slate-700 mt-2">Founder is an expat who built this inside CMU’s Swartz program; we test providers across {{ stats.corridors }} corridors.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Transparency</p>
            <p class="text-sm text-slate-700 mt-2">No pay-to-play rankings. See <NuxtLink to="/how-we-make-money" class="font-semibold text-blue-700 hover:underline">how we earn</NuxtLink> and <NuxtLink to="/faq" class="font-semibold text-blue-700 hover:underline">FAQ</NuxtLink>.</p>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="space-y-4 max-w-4xl mx-auto">
        <div class="flex items-center gap-3 mb-6">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">❓</div>
          <h2 class="text-3xl font-bold text-slate-900">Partnership FAQ</h2>
        </div>
        <div class="space-y-4">
          <FaqAccordion :faqs="partnershipFaqs" />
        </div>
      </section>

      <!-- CTA -->
      <section class="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center text-white shadow-2xl">
        <h2 class="mb-3 text-3xl font-bold lg:text-4xl">Let’s help your audience keep more of what they earn.</h2>
        <p class="mx-auto mb-6 max-w-2xl text-sm sm:text-base text-white/90">
          Quick start call, media kit on request, and neutral rankings baked in.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <NuxtLink
            to="/contact"
            class="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-700 transition-colors hover:bg-blue-50"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Talk to us
          </NuxtLink>
          <NuxtLink
            to="/how-we-make-money"
            class="inline-flex items-center gap-2 rounded-lg border border-white/40 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-white/10"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Read how we earn
          </NuxtLink>
        </div>
      </section>
    </div>

    <WhyTrustUs />
  </div>
</template>

<script setup lang="ts">
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
import WhyTrustUs from '~/components/home/WhyTrustUs.vue'

useHead({
  title: 'Affiliate & Partnership Program | Remit-Scout',
  meta: [
    {
      name: 'description',
      content:
        'Partner with Remit-Scout: expat-founded, CMU-backed, and relentlessly transparent. Use our data, widgets, and media kit to help your audience save on international transfers.',
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Affiliate & Partnerships', path: '/affiliate-partnerships' },
]

const stats = {
  providers: '30+',
  corridors: '150+',
  users: '80k+',
}

const partnershipFaqs = [
  {
    question: 'How do we start a partnership?',
    answer:
      'Send us a note via our <a href="/contact" class="text-blue-600 hover:text-blue-700 underline font-semibold">contact page</a> and share your audience, channels, and goals. We respond within <strong class="text-blue-600 font-semibold">2 business days</strong> to propose formats (content, embeds, sponsorships, or performance). A light agreement and media kit get you live quickly.',
  },
  {
    question: 'Can we embed your comparison widget or use your API?',
    answer:
      'Yes. We offer embeddable widgets and API feeds with live <strong class="text-blue-600 font-semibold">"recipient gets" amounts</strong>. They are mobile-friendly, <strong class="text-blue-600 font-semibold">neutral by default</strong>, and update as rates change. We also support tracking links and pixels for attribution.',
  },
  {
    question: 'Do you accept paid placement or sponsored ranking changes?',
    answer:
      '<strong class="text-blue-600 font-semibold">No.</strong> Rankings are locked to cost, speed, trust, and customer experience. Sponsorships may appear in labeled placements, but they never change order. Read our disclosure at <a href="/how-we-make-money" class="text-blue-600 hover:text-blue-700 underline font-semibold">/how-we-make-money</a>.',
  },
  {
    question: 'Who creates the content?',
    answer:
      'We can provide data, screenshots, and draft copy; you keep your voice and brand. For campaigns, we co-create assets and supply <strong class="text-blue-600 font-semibold">receipts (rate deltas, timing)</strong> so readers see the proof.',
  },
  {
    question: 'What support and reporting do we get?',
    answer:
      'Partners receive a <strong class="text-blue-600 font-semibold">media kit</strong>, integration support, and <strong class="text-blue-600 font-semibold">monthly performance reports</strong> (click-through, conversions). For performance partnerships, we share real-time dashboards and help optimize placements.',
  },
]
</script>
