<script setup lang="ts">
import { ref } from 'vue'
import { CenteredPage, Icon } from '~/shared/ui'

const previewFailed = ref(false)

const features = [
  {
    icon: 'bookmark',
    title: 'Watchlist',
    body: 'Save your corridors and see rate changes without searching again.',
    meta: 'Free: 3 corridors. Plus: 16 corridors.',
  },
  {
    icon: 'bell-alert',
    title: 'Rate alerts',
    body: 'Get notified when your target rate is hit.',
    meta: 'Free: 1 alert. Plus: 16 alerts.',
  },
  {
    icon: 'clock',
    title: 'History',
    body: 'Understand the range before you send.',
    meta: 'Free: 30 days. Plus: 365 days.',
  },
  {
    icon: 'arrows-right-left',
    title: 'Comparison',
    body: 'Compare providers with fees and FX markup included.',
    meta: 'Always free.',
  },
  {
    icon: 'arrow-down-tray',
    title: 'Export',
    body: 'Download your history as CSV or PDF when you need records.',
    meta: 'Plus only.',
  },
  {
    icon: 'lock',
    title: 'Ad-free',
    body: 'Remove ads and sponsored placements in product surfaces.',
    meta: 'Plus only.',
  },
] as const
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-b from-blue-700 via-blue-600 to-blue-600">
      <div class="absolute inset-0 opacity-20">
        <div class="absolute -left-32 -top-24 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
        <div class="absolute -right-32 top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
      </div>

      <CenteredPage
        as="div"
        max-width="7xl"
        padding-y="lg"
        section-gap-class="space-y-10"
      >
        <div class="relative text-center">
          <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-white backdrop-blur-sm">
            <Icon
              name="shield-check"
              :size="20"
              class="text-white"
            />
            <span class="text-sm font-semibold">Free to start</span>
          </div>

          <h1 class="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Your transfer dashboard
          </h1>
          <p class="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-blue-100 sm:text-xl">
            Track rates for the routes you care about. Set alerts when rates improve. Compare providers with fees and FX markup included.
          </p>

          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <NuxtLink
              to="/sign-up"
              class="inline-flex min-h-btn items-center justify-center gap-2 rounded-btn bg-white px-7 py-3 text-base font-semibold text-blue-700 shadow-lg transition-colors hover:bg-blue-50"
            >
              <Icon
                name="user-plus"
                :size="20"
                class="text-current"
              />
              Create free account
            </NuxtLink>
            <NuxtLink
              to="/sign-in"
              class="inline-flex min-h-btn items-center justify-center rounded-btn border border-white/40 bg-transparent px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Sign in
            </NuxtLink>
          </div>

          <p class="mt-4 text-sm text-blue-200">
            No credit card required
          </p>
        </div>

        <!-- Preview -->
        <div class="relative">
          <div class="absolute -inset-8 rounded-3xl bg-blue-500/20 blur-3xl" />
          <div class="relative overflow-hidden rounded-2xl border border-white/25 bg-white shadow-2xl">
            <img
              v-if="!previewFailed"
              src="/images/dashboard-preview.png"
              alt="Dashboard preview"
              class="block h-auto w-full"
              @error="previewFailed = true"
            >
            <div
              v-else
              class="bg-white p-8"
            >
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="text-lg font-bold text-slate-900">
                    Welcome back
                  </div>
                  <div class="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Plus
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div class="rounded-lg bg-slate-50 p-3">
                    <div class="mb-1 text-xs text-slate-500">
                      Watchlist
                    </div>
                    <div class="text-xl font-bold text-slate-900">
                      2
                    </div>
                  </div>
                  <div class="rounded-lg bg-slate-50 p-3">
                    <div class="mb-1 text-xs text-slate-500">
                      Alerts
                    </div>
                    <div class="text-xl font-bold text-slate-900">
                      1
                    </div>
                  </div>
                  <div class="rounded-lg bg-slate-50 p-3">
                    <div class="mb-1 text-xs text-slate-500">
                      History
                    </div>
                    <div class="text-xl font-bold text-slate-900">
                      365d
                    </div>
                  </div>
                  <div class="rounded-lg bg-slate-50 p-3">
                    <div class="mb-1 text-xs text-slate-500">
                      Rate
                    </div>
                    <div class="text-xl font-bold text-emerald-600">
                      56.82
                    </div>
                  </div>
                </div>
                <div class="rounded-lg bg-slate-50 p-4">
                  <div class="mb-2 flex items-center justify-between">
                    <div class="font-semibold text-slate-900">
                      Rate trend
                    </div>
                    <div class="text-sm text-slate-600">
                      🇺🇸 → 🇵🇭
                    </div>
                  </div>
                  <div class="h-16 rounded bg-gradient-to-t from-blue-100 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CenteredPage>
    </section>

    <!-- Features -->
    <CenteredPage
      as="section"
      max-width="6xl"
      padding-y="lg"
      section-gap-class="space-y-10"
    >
      <header class="text-center">
        <h2 class="text-2xl font-bold text-slate-900 sm:text-3xl">
          Everything you need, without the noise
        </h2>
        <p class="mx-auto mt-3 max-w-2xl text-slate-600">
          Build a watchlist, set alerts, and compare providers with total cost in view.
        </p>
      </header>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="f in features"
          :key="f.title"
          class="rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-lg"
        >
          <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <Icon
              :name="f.icon"
              :size="24"
              class="text-blue-700"
            />
          </div>
          <h3 class="text-base font-semibold text-slate-900">
            {{ f.title }}
          </h3>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">
            {{ f.body }}
          </p>
          <p class="mt-3 text-xs text-slate-400">
            {{ f.meta }}
          </p>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
        <span class="font-semibold">Plus never changes rankings.</span>
        <span class="text-slate-600"> Comparisons remain data-driven for everyone.</span>
      </div>
    </CenteredPage>

    <!-- Trust Strip (existing component) -->
    <HomeTrustMetricsStrip bg-class="bg-blue-600" />

    <!-- Plan CTA -->
    <section class="bg-slate-100 py-16">
      <div class="mx-auto max-w-4xl px-4">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-slate-900">
            Choose your plan
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-slate-600">
            Start free. Upgrade when you need higher limits, exports, and Pulse analytics.
          </p>
        </div>

        <div class="mt-10 grid gap-6 md:grid-cols-2">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-lg font-bold text-slate-900">
                  Free
                </div>
                <div class="text-sm text-slate-600">
                  For occasional senders
                </div>
              </div>
              <div class="text-3xl font-bold text-slate-900">
                $0
              </div>
            </div>

            <ul class="mt-5 space-y-3 text-sm text-slate-700">
              <li class="flex items-center gap-2">
                <Icon name="check" :size="20" class="text-blue-700" />
                3 watchlist corridors
              </li>
              <li class="flex items-center gap-2">
                <Icon name="check" :size="20" class="text-blue-700" />
                1 active alert
              </li>
              <li class="flex items-center gap-2">
                <Icon name="check" :size="20" class="text-blue-700" />
                30-day history
              </li>
              <li class="flex items-center gap-2">
                <Icon name="check" :size="20" class="text-blue-700" />
                Provider comparisons
              </li>
            </ul>

            <NuxtLink
              to="/sign-up"
              class="mt-6 block w-full rounded-btn border border-slate-300 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-400"
            >
              Create account
            </NuxtLink>
          </div>

          <div class="rounded-2xl bg-blue-700 p-6 shadow-lg">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-lg font-bold text-white">
                  Plus
                </div>
                <div class="text-sm text-blue-100">
                  For frequent senders
                </div>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-white">
                  Upgrade
                </div>
                <div class="text-xs text-blue-100">
                  Cancel anytime
                </div>
              </div>
            </div>

            <ul class="mt-5 space-y-3 text-sm text-white">
              <li class="flex items-center gap-2">
                <Icon name="check" :size="20" class="text-white" />
                16 watchlist corridors
              </li>
              <li class="flex items-center gap-2">
                <Icon name="check" :size="20" class="text-white" />
                16 alerts
              </li>
              <li class="flex items-center gap-2">
                <Icon name="check" :size="20" class="text-white" />
                Pulse access
              </li>
              <li class="flex items-center gap-2">
                <Icon name="check" :size="20" class="text-white" />
                Export + ad-free
              </li>
            </ul>

            <NuxtLink
              to="/plus"
              class="mt-6 block w-full rounded-btn bg-white py-3 text-center text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
            >
              See Plus pricing
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="bg-blue-700 py-16">
      <div class="mx-auto max-w-2xl px-4 text-center">
        <h2 class="text-3xl font-bold text-white">
          Ready to send with confidence?
        </h2>
        <p class="mt-3 text-lg text-blue-100">
          Create a free account to save your routes and set alerts.
        </p>
        <NuxtLink
          to="/sign-up"
          class="mt-8 inline-flex min-h-btn items-center justify-center gap-2 rounded-btn bg-white px-8 py-4 text-base font-semibold text-blue-700 shadow-lg transition-colors hover:bg-blue-50"
        >
          <Icon name="user-plus" :size="20" class="text-current" />
          Create free account
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
