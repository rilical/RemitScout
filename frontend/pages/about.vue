<template>
  <div class="min-h-screen pb-24 md:pb-0">
    <CompareWidget />

    <!-- Hero -->
    <section class="relative overflow-hidden bg-neutral-900 py-16 lg:py-24">
      <div class="mx-auto max-w-page px-page-x">
        <Breadcrumbs
          :items="breadcrumbItems"
          dark
        />

        <div class="mt-12 max-w-4xl">
          <h1 class="text-hero font-bold tracking-tight text-white mb-6">
            About Remit-Scout
          </h1>

          <p class="text-h4 text-white font-medium mb-6 leading-relaxed">
            The true cost of sending money is hidden in the spread.<br class="hidden sm:block"> We make it <span class="text-brand-400">visible</span>.
          </p>

          <p class="text-body-lg text-neutral-200 leading-relaxed mb-4 max-w-3xl">
            Remit-Scout is an independent comparison platform that shows you what your recipient will <span class="font-semibold text-brand-400">actually receive</span> — after every fee, markup, and spread is accounted for. Independent. Algorithmic. Built for clarity.
          </p>

          <p class="text-body text-neutral-300 leading-relaxed mb-8 max-w-3xl">
            Incubated at the <a
              href="https://www.cmu.edu/swartz-center-for-entrepreneurship/"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-brand-400 underline decoration-brand-400/30 hover:text-brand-300 hover:decoration-brand-300"
            >Swartz Center for Entrepreneurship, Carnegie Mellon University</a>.
          </p>
        </div>
      </div>
    </section>

    <!-- The Problem -->
    <section
      v-reveal.slide-left
      class="py-16 lg:py-20 bg-surface"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-5xl">
          <div class="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 class="text-h2 font-bold text-neutral-900 mb-6">
                The problem
              </h2>
              <div class="space-y-5">
                <p class="text-body-lg leading-relaxed text-neutral-700">
                  Most people sending money abroad compare the advertised fee. That's the wrong number. Providers bury their real margin in the exchange rate — a markup on the mid-market rate that's invisible until after you've committed.
                </p>
                <p class="text-body-lg leading-relaxed text-neutral-700">
                  A provider charging <strong class="font-semibold text-neutral-900">$0 in fees</strong> can still cost 3–5% more than a competitor charging $8. The difference lives entirely in the spread. Without normalizing fees and FX markup together, any comparison is incomplete.
                </p>
                <p class="text-body-lg leading-relaxed text-neutral-700">
                  We built one number — <strong class="font-semibold text-brand-600">Net Delivered Value</strong> — that captures the full cost so you can compare on outcome, not marketing copy.
                </p>
              </div>
            </div>

            <div>
              <div class="grid gap-6">
                <div
                  v-for="item in whoWeArePrinciples"
                  :key="item.title"
                  class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm"
                >
                  <div class="flex items-start gap-3">
                    <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                      <component
                        :is="getIconForEmoji(item.emoji)"
                        class="w-5 h-5 text-brand-600"
                      />
                    </div>
                    <div>
                      <h3 class="text-body font-semibold text-neutral-900">
                        {{ item.title }}
                      </h3>
                      <p class="mt-1 text-body-sm leading-relaxed text-neutral-600">
                        {{ item.body }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section
      v-reveal.slide-right
      class="py-16 lg:py-20 bg-neutral-50"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-h2 font-bold text-neutral-900 mb-4">
            How it works
          </h2>
          <p class="text-body-lg leading-relaxed text-neutral-700 mb-10 max-w-3xl">
            We monitor <strong class="font-semibold text-neutral-900">{{ SITE_STATS.providers.display }} licensed providers</strong> across {{ SITE_STATS.corridors.display }} currency corridors. Live quotes are collected through provider APIs and partner feeds, normalized against independent FX benchmarks, and distilled into three proprietary indices.
          </p>

          <div class="grid gap-6 sm:grid-cols-3 mb-12">
            <div
              v-for="index in proprietaryIndices"
              :key="index.acronym"
              class="rounded-2xl bg-neutral-900 p-6"
            >
              <div class="mb-4">
                <span class="inline-block px-3 py-1 bg-brand-600 text-white text-body-sm font-bold rounded-lg mb-3">
                  {{ index.acronym }}
                </span>
                <h3 class="text-body font-semibold text-white leading-snug">
                  {{ index.name }}
                </h3>
              </div>
              <p class="text-body-sm leading-relaxed text-white/70">
                {{ index.body }}
              </p>
            </div>
          </div>

          <div class="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <h3 class="text-h4 font-bold text-neutral-900 mb-6">
                How a comparison works
              </h3>
              <ol class="space-y-6">
                <li class="flex gap-4">
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-surface text-brand-600">
                    <GlobeAltIcon class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-body font-semibold text-neutral-900">
                      Collect quotes
                    </p>
                    <p class="mt-1 text-body-sm leading-relaxed text-neutral-600">
                      Live quotes are gathered through provider APIs and partner feeds for the selected corridor and payment method.
                    </p>
                  </div>
                </li>
                <li class="flex gap-4">
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-surface text-brand-600">
                    <CalculatorIcon class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-body font-semibold text-neutral-900">
                      Normalize total cost
                    </p>
                    <p class="mt-1 text-body-sm leading-relaxed text-neutral-600">
                      Fees and FX markup are combined into a single figure: <strong class="font-semibold text-neutral-900">what the recipient should receive</strong>.
                    </p>
                  </div>
                </li>
                <li class="flex gap-4">
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-surface text-brand-600">
                    <EyeIcon class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-body font-semibold text-neutral-900">
                      Rank by outcome
                    </p>
                    <p class="mt-1 text-body-sm leading-relaxed text-neutral-600">
                      Results are ranked by delivered value, not advertising spend. The explanation shows what's driving the difference.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <div class="space-y-6">
              <NuxtLink
                to="/methodology"
                class="group block rounded-2xl bg-brand-600 p-6 motion-safe:transition-opacity hover:opacity-90"
              >
                <div class="flex items-start gap-3">
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <component
:is="getIconForEmoji('🧪')"
class="w-5 h-5 text-white"
/>
                  </div>
                  <div>
                    <h3 class="text-body font-semibold text-white mb-1">
                      Read the full methodology
                    </h3>
                    <p class="text-body-sm text-white/80 leading-relaxed">
                      How we collect quotes, compute indices, and verify provider coverage.
                    </p>
                  </div>
                </div>
              </NuxtLink>

              <div class="rounded-2xl bg-brand-600 p-6">
                <p class="text-body-sm font-semibold text-white mb-2">
                  A note on quotes
                </p>
                <p class="text-body-sm leading-relaxed text-white/80">
                  Rates can change between quote and checkout due to promotional offers, KYC requirements, payment method selection, and provider rules. Always confirm the final amount on the provider's checkout screen before completing your transfer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Origin -->
    <section
      v-reveal
      class="py-16 lg:py-20 bg-brand-600"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-5xl">
          <div class="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-start">
            <div class="flex flex-col items-center lg:items-start">
              <div class="relative mb-6">
                <a
                  href="https://www.linkedin.com/in/ghabayeno/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block"
                >
                  <div class="absolute inset-2 rounded-3xl bg-white/20 blur-xl" />
                  <NuxtImg
                    :src="headshotSrc"
                    alt="Omar Ghabayen, Founder of Remit-Scout"
                    width="176"
                    height="176"
                    sizes="176px"
                    loading="lazy"
                    format="webp"
                    class="relative w-44 h-44 rounded-3xl object-cover border-4 border-white/20 shadow-2xl hover:opacity-90 motion-safe:transition-opacity cursor-pointer"
                    @error="handleHeadshotError"
                  />
                </a>
              </div>
              <div class="text-center lg:text-left">
                <h3 class="text-h4 font-bold text-white mb-1">
                  Omar Ghabayen
                </h3>
                <p class="text-body-sm text-white/70 mb-3">
                  Founder, Remit-Scout
                </p>
                <div class="flex items-center gap-2 justify-center lg:justify-start text-body-sm text-white/70 mb-2">
                  <svg
class="w-4 h-4 flex-shrink-0"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
>
                    <path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M12 14l9-5-9-5-9 5 9 5z"
/>
                    <path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
/>
                  </svg>
                  <span>Carnegie Mellon University</span>
                </div>
                <a
                  href="https://www.linkedin.com/in/ghabayeno/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-body-sm text-white/70 hover:text-white motion-safe:transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg
class="w-4 h-4"
fill="currentColor"
viewBox="0 0 24 24"
>
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>

            <div>
              <p class="text-body-sm font-semibold text-white/50 uppercase tracking-widest mb-6">
                Origin
              </p>
              <div class="space-y-5">
                <p class="text-body-lg leading-relaxed text-white">
                  "When I first moved to the US for Carnegie Mellon, my family in Jordan would send money to help me settle in. Every time, $20–30 vanished — split between the sending and receiving banks. Nobody could explain where it went.
                </p>
                <p class="text-body-lg leading-relaxed text-white">
                  I started digging and discovered the real cost was buried in the FX spread, not the advertised fee. The comparison sites everyone trusted were only looking at half the picture.
                </p>
                <p class="text-body-lg leading-relaxed text-white">
                  That gap — between what people think they're paying and what they actually pay — is why Remit-Scout exists. We answer one question: how much will actually arrive?"
                </p>
              </div>
              <p class="mt-8 text-body-lg font-medium text-white/70 italic">
                "Global finance is complex. The decision shouldn't be."
              </p>
              <p class="mt-4 text-body-sm text-white/40">
                Reviewed: {{ lastReviewedLabel }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Our Standards -->
    <section
      v-reveal.slide-left
      class="py-16 lg:py-20 bg-neutral-900"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-h2 font-bold text-white mb-4">
            Our standards
          </h2>
          <p class="text-body-lg text-white/70 leading-relaxed mb-10 max-w-3xl">
            We built Remit-Scout for people who want a straight answer. These are the commitments we don't negotiate on.
          </p>

          <div class="grid gap-6 lg:grid-cols-3 mb-10">
            <div
              v-for="standard in ourStandards"
              :key="standard.title"
              class="rounded-2xl bg-white/5 border border-white/10 p-6"
            >
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 mb-4">
                <component
:is="standard.icon"
class="w-5 h-5 text-brand-400"
/>
              </div>
              <h3 class="text-body font-semibold text-white mb-2">
                {{ standard.title }}
              </h3>
              <p class="text-body-sm leading-relaxed text-white/70">
                {{ standard.body }}
              </p>
            </div>
          </div>

          <p class="text-body-sm leading-relaxed text-white/50 max-w-3xl">
            Quotes are refreshed continuously across all monitored corridors, benchmarked against independent FX rate sources, and verified through periodic spot-check transfers on selected routes. Discrepancies reported by users are investigated and corrected within 24 hours.
          </p>
        </div>
      </div>
    </section>

    <!-- Transparency -->
    <section
      v-reveal.slide-right
      class="py-16 lg:py-20 bg-surface"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-h2 font-bold text-neutral-900 mb-4">
            Transparency
          </h2>
          <p class="text-body-lg text-neutral-700 leading-relaxed mb-10">
            We publish everything that matters: how we collect data, how we rank providers, and how we earn revenue.
          </p>

          <div class="grid gap-6 sm:grid-cols-2 mb-12">
            <NuxtLink
              v-for="item in deepDiveLinks"
              :key="item.title"
              :to="item.to"
              class="group rounded-2xl border border-neutral-200 bg-surface p-6 motion-safe:transition-all hover:border-brand-300 hover:shadow-lg"
            >
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <component
:is="getIconForEmoji(item.emoji)"
class="w-5 h-5 text-brand-600"
/>
                </div>
                <div>
                  <h3 class="text-body font-semibold text-neutral-900 group-hover:text-brand-600 motion-safe:transition-colors">
                    {{ item.title }}
                  </h3>
                  <p class="mt-1 text-body-sm leading-relaxed text-neutral-600">
                    {{ item.body }}
                  </p>
                </div>
              </div>
            </NuxtLink>
          </div>

          <div class="mb-10">
            <h3 class="text-h4 font-bold text-neutral-900 mb-6">
              Frequently asked questions
            </h3>
            <FaqAccordion :faqs="faqs" />
          </div>

          <div class="text-center">
            <NuxtLink
              to="/learn"
              class="inline-flex items-center gap-2 text-body font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
            >
              Explore our guides
              <svg
class="w-4 h-4"
fill="none"
stroke="currentColor"
viewBox="0 0 24 24"
>
                <path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
d="M13 7l5 5m0 0l-5 5m5-5H6"
/>
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Work with us -->
    <section
      v-reveal
      class="py-16 lg:py-20 bg-neutral-900"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-h2 font-bold text-white mb-4">
            Work with us
          </h2>
          <p class="text-body-lg text-white/70 leading-relaxed mb-10">
            Two tracks. One standard: independent data, no compromises.
          </p>

          <div class="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <div class="rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-8 flex flex-col">
              <h3 class="text-h4 font-bold text-white mb-3">
                Provider partners
              </h3>
              <p class="text-body text-white/70 leading-relaxed mb-6 flex-1">
                Licensed remittance providers can apply for distribution, affiliate partnerships, and data integrations. Rankings remain strictly outcome-driven — commercial relationships are disclosed and firewalled from the algorithm.
              </p>
              <NuxtLink
                to="/partnerships"
                class="inline-flex items-center gap-2 text-body-sm font-semibold text-brand-400 hover:text-brand-300 motion-safe:transition-colors"
              >
                Partnership details
                <svg
class="w-4 h-4"
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
            </div>

            <div class="rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-8 flex flex-col">
              <h3 class="text-h4 font-bold text-white mb-3">
                Institutional access
              </h3>
              <p class="text-body text-white/70 leading-relaxed mb-6 flex-1">
                Corridor pricing data, proprietary indices, and structured data access are available to qualified research teams and risk desks. Engagements proceed under NDA.
              </p>
              <NuxtLink
                to="/contact?type=enterprise&topic=data"
                class="inline-flex items-center gap-2 text-body-sm font-semibold text-brand-400 hover:text-brand-300 motion-safe:transition-colors"
              >
                Get in touch
                <svg
class="w-4 h-4"
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
            </div>
          </div>
        </div>
      </div>
    </section>

    <TrustMetricsStrip />
  </div>
</template>

<script setup lang="ts">
import {
  CalculatorIcon,
  EyeIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'
import { computed, h, ref } from 'vue'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
import { SITE_STATS } from '~/config/stats'
import { setSeo, jsonLdBreadcrumb, jsonLdOrganization } from '~/composables/useSeo'

const founderHeadshotUrl = '/webpacks/IMG_4439.webp'
const headshotFailed = ref(false)
const headshotSrc = computed(() =>
  headshotFailed.value ? '/images/about/omar-placeholder.jpg' : founderHeadshotUrl,
)
const handleHeadshotError = () => {
  headshotFailed.value = true
}
const lastReviewedLabel = 'February 19, 2026'
const lastReviewedIso = '2026-02-19'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'About Us', path: '/about' },
]

const faqs = [
  {
    question: 'How does Remit-Scout make money?',
    answer: `
      <p>We may earn an affiliate commission when you click a provider link and complete a transfer. These partnerships never influence rankings: providers cannot pay to rank higher.</p>
      <p>Read our <a href="/legal/how-we-make-money" class="font-semibold text-brand-600 hover:text-brand-700 underline">revenue disclosure</a>.</p>
    `,
  },
  {
    question: 'Do you hold or move my money?',
    answer: `<p>No. Remit-Scout is a comparison tool. The transfer happens directly between you and the licensed provider you choose. We never touch your funds.</p>`,
  },
  {
    question: 'What does "recipient gets" mean?',
    answer: `<p>The amount your recipient should receive after all fees and FX markup are applied. It reflects the real-world outcome, not a headline rate.</p>`,
  },
  {
    question: 'How do you verify provider data?',
    answer: `<p>We combine provider APIs, partner feeds, and periodic spot-check transfers on selected corridors. Discrepancies reported by users are investigated and corrected within 24 hours.</p>`,
  },
  {
    question: 'How often are rates updated?',
    answer: `<p>High-volume corridors refresh continuously; long-tail corridors refresh less frequently. Rates can change between quote and checkout due to promotions, KYC, payment method, and provider rules.</p>`,
  },
]

const whoWeArePrinciples = [
  {
    emoji: '🧾',
    title: 'Algorithmic Neutrality',
    body: 'Rankings are determined purely by mathematical outcome. Marketing budgets cannot buy position; our sort order is immutable.',
  },
  {
    emoji: '🔎',
    title: 'Net-Value Indexing',
    body: 'We ignore headline rates. Our engine calculates the final settlement amount, factoring in upfront fees and the hidden FX spread markup.',
  },
  {
    emoji: '🛡️',
    title: 'Open Data Protocol',
    body: 'Trust requires verification. We maintain an open channel for data correction — if a provider updates their pricing logic, our system adapts within 24 hours.',
  },
]

const proprietaryIndices = [
  {
    acronym: 'TEER',
    name: 'True Effective Exchange Rate',
    body: 'The net rate your recipient receives after all fees and FX markup are deducted. The only number that tells you what actually arrives.',
  },
  {
    acronym: 'RCI',
    name: 'Remittance Cost Index',
    body: 'Total transfer cost expressed as a percentage of the send amount. Combines explicit fees and hidden FX spread into one comparable figure.',
  },
  {
    acronym: 'RVI',
    name: 'Remittance Volatility Index',
    body: 'How much pricing varies across providers in a corridor. High volatility signals that significant savings are available for those who compare.',
  },
]

const ourStandards = [
  {
    icon: CalculatorIcon,
    title: 'Outcome-first ranking',
    body: 'We rank by what the recipient receives, not a headline rate or fee. The best provider is the one that delivers the most.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'No pay-to-rank',
    body: 'Providers cannot buy placement in our organic results. Rankings are computed algorithmically and cannot be influenced by commercial relationships.',
  },
  {
    icon: EyeIcon,
    title: 'Editorial independence',
    body: 'If we earn affiliate commissions, they are fully disclosed and strictly firewalled from the ranking algorithm. Your trust is more valuable than any partnership.',
  },
]

const deepDiveLinks = [
  {
    emoji: '🧪',
    title: 'Our methodology',
    body: 'How we collect quotes, compute indices, and verify coverage.',
    to: '/methodology',
  },
  {
    emoji: '🧾',
    title: 'How we make money',
    body: 'Affiliate disclosure and how we stay independent.',
    to: '/how-we-make-money',
  },
  {
    emoji: '🤝',
    title: 'Partnerships',
    body: 'What partnerships mean and what they do not.',
    to: '/partnerships',
  },
  {
    emoji: '❓',
    title: 'FAQs',
    body: 'Quick answers about accuracy, rankings, and updates.',
    to: '/faq',
  },
]

const getIconForEmoji = (emoji: string) => {
  const iconMap: Record<string, any> = {
    '🧾': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', 'd': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }),
    ]),
    '🧪': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', 'd': 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' }),
    ]),
    '🔎': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', 'd': 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }),
    ]),
    '🛡️': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', 'd': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }),
    ]),
    '🤝': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', 'd': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }),
    ]),
    '❓': () => h('svg', { class: 'w-5 h-5 text-brand-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', 'd': 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }),
    ]),
  }
  return iconMap[emoji] || (() => h('span', { class: 'text-h4' }, emoji))
}

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'
const canonicalUrl = `${siteUrl}/about`

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'About Remit-Scout',
    description: 'How we compare providers, stay independent, and help families keep more when sending money abroad.',
  },
})

setSeo({
  title: 'About Remit-Scout | Independent Money Transfer Comparisons',
  description: 'Meet Remit-Scout: an independent platform built by expats to help families compare transfer costs, speed, and outcomes with transparent methods.',
  canonical: canonicalUrl,
  ogImage: false,
  ogType: 'article',
  publishedTime: lastReviewedIso,
  modifiedTime: lastReviewedIso,
  author: 'Remit-Scout Editorial Team',
  tags: ['about', 'remittances', 'transparency'],
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'About Us', url: canonicalUrl },
])

jsonLdOrganization(siteUrl)

useHead({
  meta: [
    { name: 'author', content: 'Remit-Scout Editorial Team' },
    { property: 'article:modified_time', content: lastReviewedIso },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        'name': 'About Remit-Scout',
        'url': canonicalUrl,
        'description': 'Learn who we are, how we compare providers, and how we stay independent.',
        'dateModified': lastReviewedIso,
        'publisher': {
          '@type': 'Organization',
          'name': 'Remit-Scout',
          'url': siteUrl,
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': 'Omar Ghabayen',
        'jobTitle': 'Founder',
        'affiliation': {
          '@type': 'Organization',
          'name': 'Remit-Scout',
        },
        'alumniOf': {
          '@type': 'EducationalOrganization',
          'name': 'Carnegie Mellon University',
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqs.map(faq => ({
          '@type': 'Question',
          'name': faq.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.answer.replace(/<[^>]*>/g, '').trim(),
          },
        })),
      }),
    },
  ],
})
</script>
