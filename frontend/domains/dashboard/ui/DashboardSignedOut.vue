<script setup lang="ts">
import { ref } from 'vue'
import { CenteredPage, Icon } from '~/ui'

const previewFailed = ref(false)

const features = [
  { icon: 'bookmark', title: 'Watchlist', body: 'Save your corridors and see rate changes without searching again.', meta: 'Free: 3 corridors. Plus: 16 corridors.' },
  { icon: 'bell-alert', title: 'Rate alerts', body: 'Get notified when your target rate is hit.', meta: 'Free: 1 alert. Plus: 16 alerts.' },
  { icon: 'clock', title: 'History', body: 'Understand the range before you send.', meta: 'Free: 30 days. Plus: 365 days.' },
  { icon: 'arrows-right-left', title: 'Comparison', body: 'Compare providers with fees and FX markup included.', meta: 'Always free.' },
  { icon: 'arrow-down-tray', title: 'Export', body: 'Download your history as CSV or PDF when you need records.', meta: 'Plus only.' },
  { icon: 'chart-bar', title: 'Pulse access', body: 'Live market intelligence: volatility signals, spread tracking, and provider shifts.', meta: 'Plus only.' },
] as const
</script>

<template>
  <div class="min-h-screen bg-surface">
    <section class="relative overflow-hidden bg-brand-600">
      <CenteredPage as="div" max-width="7xl" padding-y="lg" section-gap-class="space-y-10">
        <div class="relative text-center">
          <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-surface/10 px-4 py-2 text-white backdrop-blur-sm">
            <Icon name="shield-check" :size="20" class="text-white" />
            <span class="text-body-sm font-semibold">Free to start</span>
          </div>
          <h1 class="text-hero font-bold leading-tight text-white">Your transfer dashboard</h1>
          <p class="mx-auto mt-4 max-w-3xl text-body leading-relaxed text-white/80">Track rates for the routes you care about. Set alerts when rates improve. Compare providers with fees and FX markup included.</p>
          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <NuxtLink to="/sign-up" class="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 text-body font-semibold text-brand-600 shadow-lg transition-colors hover:bg-primary-50">
              <Icon name="user-plus" :size="20" class="text-current" />
              Create free account
            </NuxtLink>
            <NuxtLink to="/sign-in" class="inline-flex items-center justify-center rounded-xl border-2 border-white/30 px-7 py-3 text-body font-semibold text-white transition-colors hover:bg-white/10">Sign in</NuxtLink>
          </div>
          <p class="mt-4 text-body-sm text-white/70">No credit card required</p>
        </div>
        <div class="relative">
          <div class="relative overflow-hidden rounded-2xl border border-white/25 bg-surface shadow-2xl">
            <NuxtImg v-if="!previewFailed" src="/images/dashboard-preview.png" alt="Dashboard preview" width="1898" height="1772" sizes="100vw" loading="lazy" format="webp" class="block h-auto w-full" @error="previewFailed = true" />
            <div v-else class="bg-surface p-8">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="text-body-lg font-bold text-rs-fg">Welcome back</div>
                  <div class="rounded-full bg-brand-600 px-3 py-1 text-body-sm font-semibold text-white">Plus</div>
                </div>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div class="rounded-lg bg-neutral-50 p-3"><div class="mb-1 text-body-sm text-rs-muted">Watchlist</div><div class="text-h4 font-bold text-rs-fg">2</div></div>
                  <div class="rounded-lg bg-neutral-50 p-3"><div class="mb-1 text-body-sm text-rs-muted">Alerts</div><div class="text-h4 font-bold text-rs-fg">1</div></div>
                  <div class="rounded-lg bg-neutral-50 p-3"><div class="mb-1 text-body-sm text-rs-muted">History</div><div class="text-h4 font-bold text-rs-fg">365d</div></div>
                  <div class="rounded-lg bg-neutral-50 p-3"><div class="mb-1 text-body-sm text-rs-muted">Rate</div><div class="text-h4 font-bold text-success-600">56.82</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CenteredPage>
    </section>

    <CenteredPage as="section" max-width="6xl" padding-y="lg" section-gap-class="space-y-10">
      <header class="text-center">
        <h2 class="text-h3 font-bold text-rs-fg">Everything you need, without the noise</h2>
        <p class="mx-auto mt-3 max-w-2xl text-neutral-600">Build a watchlist, set alerts, and compare providers with total cost in view.</p>
      </header>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="f in features" :key="f.title" class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
          <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
            <Icon :name="f.icon" :size="20" class="text-brand-600" />
          </div>
          <h3 class="text-body font-semibold text-rs-fg">{{ f.title }}</h3>
          <p class="mt-2 text-body-sm leading-relaxed text-neutral-600">{{ f.body }}</p>
          <p class="mt-3 text-body-sm text-neutral-400">{{ f.meta }}</p>
        </div>
      </div>
    </CenteredPage>

    <HomeTrustMetricsStrip bg-class="bg-brand-600" />

    <section class="py-16 sm:py-20 bg-neutral-900">
      <div class="container">
        <div class="text-center mb-12">
          <h2 class="text-h1 font-bold text-white mb-4">Choose your plan</h2>
          <p class="text-body-lg text-neutral-300">Start free. Upgrade when you need higher limits, exports, and Pulse analytics.</p>
        </div>
        <div class="grid grid-cols-1 gap-8 max-w-6xl mx-auto lg:grid-cols-2">
          <!-- Free Plan -->
          <div class="bg-surface rounded-3xl border-4 border-neutral-300 p-8 flex flex-col shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full">
            <div class="text-center mb-6">
              <h3 class="text-h3 font-bold text-rs-fg mb-2">Free</h3>
              <p class="text-neutral-600 mb-4">For occasional senders</p>
              <div class="text-hero font-bold text-rs-fg mb-1">$0</div>
              <div class="text-body-sm text-rs-muted font-medium">forever</div>
            </div>
            <ul class="space-y-4 mb-8 flex-grow">
              <li class="flex items-start gap-3">
                <Icon name="check" :size="20" class="text-success-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span class="text-neutral-700 font-medium">3 watchlist corridors</span>
                  <p class="text-body-sm text-rs-muted mt-1">Save your most-used routes</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon name="check" :size="20" class="text-success-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span class="text-neutral-700 font-medium">1 active alert</span>
                  <p class="text-body-sm text-rs-muted mt-1">Get notified when rates change</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon name="check" :size="20" class="text-success-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span class="text-neutral-700 font-medium">30-day transfer history</span>
                  <p class="text-body-sm text-rs-muted mt-1">See recent trends</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon name="check" :size="20" class="text-success-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span class="text-neutral-700 font-medium">Provider comparisons</span>
                  <p class="text-body-sm text-rs-muted mt-1">Always free</p>
                </div>
              </li>
            </ul>
            <NuxtLink to="/sign-up" class="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold transition-all mt-auto shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
              Create Free Account
            </NuxtLink>
          </div>

          <!-- Plus Plan -->
          <div class="bg-brand-600 rounded-3xl border-4 border-primary-400 p-8 relative flex flex-col shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full">
            <div class="text-center mb-6">
              <h3 class="text-h3 font-bold text-white mb-2">Plus</h3>
              <p class="text-white/90 mb-4">For regular senders</p>
              <div class="text-hero font-bold text-white mb-1">$2.83<span class="text-h4 font-medium text-white/80">/mo</span></div>
              <div class="text-body-sm text-white/80 font-medium">$34/year, billed annually</div>
            </div>
            <ul class="space-y-4 mb-8 flex-grow">
              <li class="flex items-start gap-3">
                <Icon name="check" :size="20" class="text-white flex-shrink-0 mt-0.5" />
                <div>
                  <span class="text-white font-semibold">16 watchlist corridors</span>
                  <p class="text-body-sm text-white/80 mt-1">Track the routes you actually use</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon name="check" :size="20" class="text-white flex-shrink-0 mt-0.5" />
                <div>
                  <span class="text-white font-semibold">16 smart alerts</span>
                  <p class="text-body-sm text-white/80 mt-1">Send-score windows and target-rate alerts</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon name="check" :size="20" class="text-white flex-shrink-0 mt-0.5" />
                <div>
                  <span class="text-white font-semibold">Pulse access</span>
                  <p class="text-body-sm text-white/80 mt-1">Best time to send + latest provider quotes</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon name="check" :size="20" class="text-white flex-shrink-0 mt-0.5" />
                <div>
                  <span class="text-white font-semibold">365-day rate history</span>
                  <p class="text-body-sm text-white/80 mt-1">Full year of data</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon name="check" :size="20" class="text-white flex-shrink-0 mt-0.5" />
                <div>
                  <span class="text-white font-semibold">Export + ad-free</span>
                  <p class="text-body-sm text-white/80 mt-1">CSV and PDF formats, no banners</p>
                </div>
              </li>
            </ul>
            <NuxtLink to="/plus" class="w-full py-3.5 bg-surface text-brand-600 hover:bg-primary-50 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] mt-auto">
              See Plus Pricing
            </NuxtLink>
          </div>
        </div>
        <p class="text-center text-body-sm text-neutral-300 mt-8">All plans include access to compare 30+ providers • Cancel anytime</p>
      </div>
    </section>

    <section class="bg-brand-600 py-16">
      <div class="mx-auto max-w-2xl px-4 text-center">
        <h2 class="text-h2 font-bold text-white">Ready to send with confidence?</h2>
        <p class="mt-3 text-body-lg text-white/80">Create a free account to save your routes and set alerts.</p>
        <NuxtLink to="/sign-up" class="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-body font-semibold text-brand-600 shadow-lg transition-colors hover:bg-primary-50">
          <Icon name="user-plus" :size="20" class="text-current" />
          Create free account
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
