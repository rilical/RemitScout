<template>
  <div class="min-h-screen bg-surface">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 py-16 lg:py-24">
      <div class="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-brand-600/10 via-transparent to-brand-600/10" />
      <div class="relative mx-auto max-w-page px-page-x">
        <Breadcrumbs
          :items="breadcrumbItems"
          :dark="true"
        />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-300/30 bg-surface/10 backdrop-blur-sm px-4 py-2 text-body-sm font-semibold text-white shadow-md mb-6">
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            Money Transfer Basics
          </div>
          <h1 class="text-hero font-bold tracking-tight text-white mb-6">
            When's the <span class="text-brand-400">Best Time</span> to Send Money?
          </h1>
          <p class="text-h4 text-neutral-300 font-medium mb-6 leading-relaxed">
            Using Exchange Rate History + Alerts to Time Transfers
          </p>
          <p class="text-body-lg text-neutral-300 leading-relaxed mb-6 max-w-3xl">
            Exchange rates fluctuate daily. Learn how to use rate history and alerts to time your transfers for better rates—without day-trading your remittances.
          </p>
          <div class="flex items-center gap-4 text-body-sm text-neutral-400">
            <span>7 min read</span>
            <span>•</span>
            <span>Updated December 2024</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16 lg:py-20 bg-surface">
      <div class="mx-auto max-w-page px-page-x">
        <div class="prose prose-lg max-w-none">
          <div class="mb-16 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-primary-50 p-8 lg:p-10 shadow-xl">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 class="text-h3 font-bold text-neutral-900">
                Quick Takeaways
              </h2>
            </div>
            <div class="grid gap-4 sm:grid-cols-3">
              <div class="rounded-xl bg-surface border border-brand-100 p-5 shadow-sm">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                    1
                  </div>
                  <p class="text-body text-neutral-700 leading-relaxed">
                    Rates move daily, but timing only helps if you use a plan, not guesses.
                  </p>
                </div>
              </div>
              <div class="rounded-xl bg-surface border border-brand-100 p-5 shadow-sm">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                    2
                  </div>
                  <p class="text-body text-neutral-700 leading-relaxed">
                    Set a target rate and use alerts instead of checking constantly.
                  </p>
                </div>
              </div>
              <div class="rounded-xl bg-surface border border-brand-100 p-5 shadow-sm">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                    3
                  </div>
                  <p class="text-body text-neutral-700 leading-relaxed">
                    When money is urgent, send it—timing should never block essentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <!-- Volatility Basics -->
          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>
          <div class="mb-16">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center flex-shrink-0">
                <svg
                  class="w-8 h-8 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h2 class="text-h2 font-bold text-neutral-900">
                Exchange Rate Volatility Basics
              </h2>
            </div>
            <p class="text-body-lg text-neutral-700 leading-relaxed mb-8 max-w-3xl">
              Currency exchange rates move constantly based on economic news, market sentiment, and global events. A rate that's 18.50 MXN per USD today might be 18.30 tomorrow or 18.70 next week.
            </p>
            <div class="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-primary-50 p-8 shadow-lg">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center">
                  <span class="text-white font-bold">💵</span>
                </div>
                <p class="text-h4 font-bold text-neutral-900">
                  Example: USD → MXN
                </p>
              </div>
              <p class="text-body text-neutral-700 mb-3 leading-relaxed">
                On a $500 transfer, a <strong class="font-semibold text-neutral-900">0.20 MXN difference</strong> in the rate equals about <strong class="font-semibold text-brand-600">100 MXN ($5.40)</strong> more or less delivered to your recipient.
              </p>
              <div class="mt-4 pt-4 border-t border-brand-200">
                <p class="text-body-sm font-medium text-brand-700">
                  💡 That's why timing matters—but only if you're strategic about it.
                </p>
              </div>
            </div>
          </div>

          <!-- Don't Day Trade -->
          <div class="mb-16 rounded-3xl border-2 border-warning-300 bg-gradient-to-br from-warning-50 via-warning-600 to-warning-50 p-8 lg:p-12 shadow-xl relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-warning-200 rounded-full opacity-20 blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div class="relative flex items-start gap-6">
              <div class="flex-shrink-0">
                <div class="w-16 h-16 rounded-2xl bg-warning-500 flex items-center justify-center shadow-lg">
                  <ExclamationTriangleIcon class="h-8 w-8 text-white" />
                </div>
              </div>
              <div class="flex-1">
                <h2 class="text-h2 font-bold text-neutral-900 mb-4">
                  Don't Day-Trade Your Transfers
                </h2>
                <p class="text-body-lg text-neutral-700 leading-relaxed mb-5">
                  Trying to time the perfect rate can backfire. Rates move in both directions, and waiting for a better rate might mean missing a good one. Plus, if you need the money urgently, waiting isn't an option.
                </p>
                <div class="rounded-xl bg-surface border-2 border-warning-200 p-5">
                  <p class="text-body font-bold text-neutral-900 flex items-center gap-2">
                    <span class="text-brand-600">✓</span>
                    Better strategy: Set a target rate and use alerts to notify you when it's reached.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Practical Strategy -->
          <div class="mb-16">
            <div class="flex items-center gap-4 mb-8">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center flex-shrink-0">
                <svg
                  class="w-8 h-8 text-brand-600"
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
              </div>
              <h2 class="text-h2 font-bold text-neutral-900">
                Practical Strategy for Monthly Senders
              </h2>
            </div>
            <div class="grid gap-6 lg:grid-cols-3">
              <div class="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-white to-brand-50/50 p-7 shadow-lg hover:shadow-xl transition-shadow">
                <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-h4 mb-4">
                  1
                </div>
                <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                  Set a Target Rate
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  Look at the rate history for your corridor (e.g., USD → MXN). Find a rate you'd be happy with—maybe the average of the last 30 days, or a rate that's better than 70% of recent rates.
                </p>
                <div class="bg-brand-100 rounded-lg p-4 border border-brand-200">
                  <p class="text-body-sm text-neutral-700">
                    <strong class="text-neutral-900">Example:</strong> If USD → MXN has been between 18.20–18.60 over the past month, you might set a target of 18.45 or better.
                  </p>
                </div>
              </div>
              <div class="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-white to-brand-50/50 p-7 shadow-lg hover:shadow-xl transition-shadow">
                <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-h4 mb-4">
                  2
                </div>
                <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                  Use Rate Alerts
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-5">
                  Set up an alert to notify you when your target rate is reached. This way, you don't have to check rates constantly—you'll know when it's a good time to send.
                </p>
                <NuxtLink
                  to="/pulse"
                  class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-body-sm font-semibold text-white shadow-md hover:bg-brand-700 transition-all w-full justify-center"
                >
                  Set Up Rate Alerts
                  <svg
                    class="h-5 w-5"
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
              <div class="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-white to-brand-50/50 p-7 shadow-lg hover:shadow-xl transition-shadow">
                <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-h4 mb-4">
                  3
                </div>
                <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                  Have a Backup Plan
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  If you need to send money urgently and the rate isn't ideal, send it anyway. A 1–2% rate difference is usually less important than getting money to your family when they need it.
                </p>
              </div>
            </div>
          </div>

          <!-- Real Examples -->
          <div class="mb-16">
            <div class="flex items-center gap-4 mb-8">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center flex-shrink-0">
                <svg
                  class="w-8 h-8 text-brand-600"
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
              </div>
              <h2 class="text-h2 font-bold text-neutral-900">
                Real Examples: USD → MXN / USD → PHP
              </h2>
            </div>
            <div class="grid gap-6 lg:grid-cols-2">
              <div class="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-white via-brand-50/30 to-white p-7 shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
                    <span class="text-white text-h4">🇲🇽</span>
                  </div>
                  <h3 class="text-h4 font-bold text-neutral-900">
                    USD → MXN (Mexican Peso)
                  </h3>
                </div>
                <p class="text-body text-neutral-700 leading-relaxed mb-5">
                  This pair is relatively stable but can move 2–3% in a week during economic news or policy changes.
                </p>
                <div class="bg-brand-100 rounded-xl border border-brand-200 p-5">
                  <p class="text-body-sm font-semibold text-neutral-900 mb-2">
                    Strategy:
                  </p>
                  <p class="text-body-sm text-neutral-700 leading-relaxed">
                    If you send $500 monthly, waiting for a <strong>0.30 MXN better rate</strong> saves you <strong class="text-brand-600">150 MXN (~$8)</strong>. Set an alert for 18.50+ if the current rate is 18.20.
                  </p>
                </div>
              </div>
              <div class="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-white via-brand-50/30 to-white p-7 shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
                    <span class="text-white text-h4">🇵🇭</span>
                  </div>
                  <h3 class="text-h4 font-bold text-neutral-900">
                    USD → PHP (Philippine Peso)
                  </h3>
                </div>
                <p class="text-body text-neutral-700 leading-relaxed mb-5">
                  PHP can be more volatile, especially around remittance-heavy periods (holidays, month-end).
                </p>
                <div class="bg-brand-100 rounded-xl border border-brand-200 p-5">
                  <p class="text-body-sm font-semibold text-neutral-900 mb-2">
                    Strategy:
                  </p>
                  <p class="text-body-sm text-neutral-700 leading-relaxed">
                    Rates often improve slightly mid-month. If you can wait, sending around the <strong>15th–20th</strong> might get you <strong class="text-brand-600">0.5–1% better rates</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>

          <!-- Using Pulse -->
          <div
            v-if="pulseEnabled"
            class="mb-16 rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700 p-10 lg:p-12 text-white shadow-2xl relative overflow-hidden"
          >
            <div class="absolute top-0 right-0 w-96 h-96 bg-surface/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
            <div class="absolute bottom-0 left-0 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
            <div class="relative">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-16 h-16 rounded-2xl bg-surface/20 backdrop-blur-sm flex items-center justify-center">
                  <svg
                    class="w-8 h-8 text-white"
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
                </div>
                <h2 class="text-h2 font-bold">
                  Use Pulse to Track Rate History
                </h2>
              </div>
              <p class="text-body-lg text-white/95 leading-relaxed mb-8 max-w-2xl">
                Remit-Scout Pulse shows you rate trends over time, helping you identify patterns and set informed target rates. See how rates have moved in the past week, month, or year for your specific corridor.
              </p>
              <NuxtLink
                to="/pulse"
                class="inline-flex items-center gap-2 rounded-xl bg-surface px-8 py-4 text-body font-semibold text-brand-600 shadow-xl hover:bg-neutral-50 hover:shadow-2xl transition-all"
              >
                Explore Pulse
                <svg
                  class="h-5 w-5"
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
      </div>
    </section>

    <!-- Related Guides -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-page px-page-x">
        <h2 class="text-h2 font-bold text-neutral-900 mb-8 text-center">
          Related Guides
        </h2>
        <div class="grid gap-6 md:grid-cols-3">
          <NuxtLink
            v-if="pulseEnabled"
            to="/pulse"
            class="group rounded-2xl border-2 border-neutral-200 bg-surface p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-body-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Pulse: Rate Trends
            </h3>
            <p class="text-body-sm text-neutral-600">
              Track exchange rate history and set alerts for your target rate.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/hidden-exchange-rate-fees-explained"
            class="group rounded-2xl border-2 border-neutral-200 bg-surface p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-body-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Hidden Exchange Rate Fees
            </h3>
            <p class="text-body-sm text-neutral-600">
              Understand how FX markup works and affects your transfers.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/why-compare-before-every-transfer"
            class="group rounded-2xl border-2 border-neutral-200 bg-surface p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-body-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Why Compare Providers
            </h3>
            <p class="text-body-sm text-neutral-600">
              Rate timing is just one factor—provider choice matters more.
            </p>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import { useFeatureFlags } from '~/composables/useFeatureFlags'

const { pulseEnabled } = useFeatureFlags()

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Best Time to Send', path: '/learn/best-time-to-send-money' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

const seoTitle = 'When\'s the Best Time to Send Money? Using Exchange Rate History + Alerts | Remit-Scout'
const seoDescription = 'Learn how to time your transfers using rate history and alerts. Practical strategies for monthly senders without day-trading your remittances.'

defineOgImage({
  component: 'OgImageArticle',
  props: {
    title: seoTitle.replace(/\s*\|\s*Remit-Scout\s*$/, ''),
    category: 'Learn',
    readTime: '7 min read',
  },
})

setSeo({
  title: seoTitle,
  description: seoDescription,
  canonical: `${siteUrl}/learn/best-time-to-send-money`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Best Time to Send', url: `${siteUrl}/learn/best-time-to-send-money` },
])
</script>
