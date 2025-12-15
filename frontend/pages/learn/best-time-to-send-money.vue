<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <span>📈</span>
            Money Transfer Basics
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            When's the Best Time to Send Money?
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            Using Exchange Rate History + Alerts to Time Transfers
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            Exchange rates fluctuate daily. Learn how to use rate history and alerts to time your transfers for better rates—without day-trading your remittances.
          </p>
          <div class="flex items-center gap-4 text-sm text-neutral-600">
            <span>7 min read</span>
            <span>•</span>
            <span>Updated December 2024</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="prose prose-lg max-w-none">
          <!-- Volatility Basics -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Exchange Rate Volatility Basics
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Currency exchange rates move constantly based on economic news, market sentiment, and global events. A rate that's 18.50 MXN per USD today might be 18.30 tomorrow or 18.70 next week.
            </p>
            <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 mb-6">
              <p class="text-base font-semibold text-neutral-900 mb-2">
                Example: USD → MXN
              </p>
              <p class="text-sm text-neutral-700 mb-3">
                On a $500 transfer, a 0.20 MXN difference in the rate equals about 100 MXN ($5.40) more or less delivered to your recipient.
              </p>
              <p class="text-xs text-neutral-600">
                That's why timing matters—but only if you're strategic about it.
              </p>
            </div>
          </div>

          <!-- Don't Day Trade -->
          <div class="mb-12 rounded-3xl border-2 border-orange-200 bg-orange-50 p-8 lg:p-12">
            <div class="flex items-start gap-4 mb-4">
              <ExclamationTriangleIcon class="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h2 class="text-2xl font-bold text-neutral-900 mb-3">
                  Don't Day-Trade Your Transfers
                </h2>
                <p class="text-base text-neutral-700 leading-relaxed mb-4">
                  Trying to time the perfect rate can backfire. Rates move in both directions, and waiting for a better rate might mean missing a good one. Plus, if you need the money urgently, waiting isn't an option.
                </p>
                <p class="text-base font-semibold text-neutral-900">
                  Better strategy: Set a target rate and use alerts to notify you when it's reached.
                </p>
              </div>
            </div>
          </div>

          <!-- Practical Strategy -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Practical Strategy for Monthly Senders
            </h2>
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">1. Set a Target Rate</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Look at the rate history for your corridor (e.g., USD → MXN). Find a rate you'd be happy with—maybe the average of the last 30 days, or a rate that's better than 70% of recent rates.
                </p>
                <div class="bg-brand-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong>Example:</strong> If USD → MXN has been between 18.20–18.60 over the past month, you might set a target of 18.45 or better.
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">2. Use Rate Alerts</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Set up an alert to notify you when your target rate is reached. This way, you don't have to check rates constantly—you'll know when it's a good time to send.
                </p>
                <NuxtLink
                  to="/pulse"
                  class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-brand-700 transition-all"
                >
                  Set Up Rate Alerts
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </NuxtLink>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">3. Have a Backup Plan</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  If you need to send money urgently and the rate isn't ideal, send it anyway. A 1–2% rate difference is usually less important than getting money to your family when they need it.
                </p>
              </div>
            </div>
          </div>

          <!-- Real Examples -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Real Examples: USD → MXN / USD → PHP
            </h2>
            <div class="space-y-6">
              <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">USD → MXN (Mexican Peso)</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-4">
                  This pair is relatively stable but can move 2–3% in a week during economic news or policy changes.
                </p>
                <div class="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong>Strategy:</strong> If you send $500 monthly, waiting for a 0.30 MXN better rate saves you 150 MXN (~$8). Set an alert for 18.50+ if the current rate is 18.20.
                </div>
              </div>
              <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">USD → PHP (Philippine Peso)</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-4">
                  PHP can be more volatile, especially around remittance-heavy periods (holidays, month-end).
                </p>
                <div class="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong>Strategy:</strong> Rates often improve slightly mid-month. If you can wait, sending around the 15th–20th might get you 0.5–1% better rates.
                </div>
              </div>
            </div>
          </div>

          <!-- Using Pulse -->
          <div class="mb-12 rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-blue-600 p-8 lg:p-12 text-white">
            <h2 class="text-2xl font-bold mb-4">
              Use Pulse to Track Rate History
            </h2>
            <p class="text-base text-white/90 leading-relaxed mb-6">
              Remit-Scout Pulse shows you rate trends over time, helping you identify patterns and set informed target rates. See how rates have moved in the past week, month, or year for your specific corridor.
            </p>
            <NuxtLink
              to="/pulse"
              class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-brand-600 shadow-lg hover:bg-neutral-50 transition-all"
            >
              Explore Pulse
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Guides -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-neutral-900 mb-8 text-center">
          Related Guides
        </h2>
        <div class="grid gap-6 md:grid-cols-3">
          <NuxtLink
            to="/pulse"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Pulse: Rate Trends
            </h3>
            <p class="text-sm text-neutral-600">
              Track exchange rate history and set alerts for your target rate.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/hidden-exchange-rate-fees-explained"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Hidden Exchange Rate Fees
            </h3>
            <p class="text-sm text-neutral-600">
              Understand how FX markup works and affects your transfers.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/why-compare-before-every-transfer"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Why Compare Providers
            </h3>
            <p class="text-sm text-neutral-600">
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

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Best Time to Send', path: '/learn/best-time-to-send-money' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: "When's the Best Time to Send Money? Using Exchange Rate History + Alerts | Remit-Scout",
  description: 'Learn how to time your transfers using rate history and alerts. Practical strategies for monthly senders without day-trading your remittances.',
  canonical: `${siteUrl}/learn/best-time-to-send-money`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Best Time to Send', url: `${siteUrl}/learn/best-time-to-send-money` },
])
</script>

