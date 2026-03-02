<script setup lang="ts">
import { computed, ref } from 'vue'
import { CenteredPage, Icon } from '~/ui'
import { useFeatureFlags } from '~/composables/useFeatureFlags'

const { pulseEnabled } = useFeatureFlags()
const previewFailed = ref(false)

const screenshotSrc = '/images/dashboard-preview.png'

const allTourShots = [
  {
    id: 'watchlist',
    title: 'Watchlist',
    body: 'Pin your corridors and see what changed since your last visit.',
    objectPosition: '50% 12%',
    scale: 1.06,
    badge: 'Saved corridors',
  },
  {
    id: 'alerts',
    title: 'Alerts',
    body: 'Set target rates and get notified when your number is hit.',
    objectPosition: '50% 42%',
    scale: 1.08,
    badge: 'Smart alerts',
  },
  {
    id: 'history',
    title: 'History + exports',
    body: 'Review the range before you send, then export when you need records.',
    objectPosition: '50% 78%',
    scale: 1.1,
    badge: 'CSV/PDF',
  },
  {
    id: 'pulse',
    title: 'Pulse',
    body: 'Market intelligence: spreads, volatility signals, and provider shifts.',
    objectPosition: '50% 28%',
    scale: 1.04,
    badge: 'Plus',
  },
] as const

const tourShots = computed(() =>
  pulseEnabled.value
    ? allTourShots
    : allTourShots.filter(s => s.id !== 'pulse'),
)

const activeTourShotId = ref<(typeof allTourShots)[number]['id']>('watchlist')
const activeTourShot = computed(() => tourShots.value.find(s => s.id === activeTourShotId.value) ?? tourShots.value[0])

const allFeatures = [
  { icon: 'bookmark', title: 'Watchlist', body: 'Save your corridors and see rate changes without searching again.', meta: 'Free: 3 corridors. Plus: 16 corridors.' },
  { icon: 'bell-alert', title: 'Rate alerts', body: 'Get notified when your target rate is hit.', meta: 'Free: 1 alert. Plus: 16 alerts.' },
  { icon: 'clock', title: 'History', body: 'Understand the range before you send.', meta: 'Free: 30 days. Plus: 90 days.' },
  { icon: 'arrows-right-left', title: 'Comparison', body: 'Compare providers with fees and FX markup included.', meta: 'Always free.' },
  { icon: 'arrow-down-tray', title: 'Export', body: 'Download your history as CSV or PDF when you need records.', meta: 'Plus only.' },
  { icon: 'chart-bar', title: 'Pulse access', body: 'Live market intelligence: volatility signals, spread tracking, and provider shifts.', meta: 'Plus only.' },
] as const

const features = computed(() =>
  pulseEnabled.value
    ? allFeatures
    : allFeatures.filter(f => f.title !== 'Pulse access'),
)
</script>

<template>
  <div class="min-h-screen bg-surface">
    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-b from-brand-700 via-brand-600 to-brand-600">
      <div class="absolute inset-0 opacity-20">
        <div class="absolute -left-32 -top-24 h-72 w-72 rounded-full bg-surface/30 blur-3xl" />
        <div class="absolute -right-32 top-20 h-72 w-72 rounded-full bg-surface/20 blur-3xl" />
      </div>

      <CenteredPage
        as="div"
        max-width="7xl"
        padding-y="lg"
        section-gap-class="space-y-10"
      >
        <div class="relative text-center">
          <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-surface/10 px-4 py-2 text-white backdrop-blur-sm">
            <Icon
              name="shield-check"
              :size="20"
              class="text-white"
            />
            <span class="text-body-sm font-semibold">Free to start</span>
          </div>

          <h1 class="text-hero font-bold leading-tight text-white">
            Your transfer dashboard
          </h1>
          <p class="mx-auto mt-4 max-w-3xl text-body leading-relaxed text-primary-100">
            Track rates for the routes you care about. Set alerts when rates improve. Compare providers with fees and FX markup included.
          </p>

          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <NuxtLink
              to="/sign-up"
              class="inline-flex min-h-btn items-center justify-center gap-2 rounded-btn bg-surface px-7 py-3 text-body font-semibold text-brand-700 shadow-lg transition-colors hover:bg-primary-50"
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
              class="inline-flex min-h-btn items-center justify-center rounded-btn border border-white/40 bg-transparent px-7 py-3 text-body font-semibold text-white transition-colors hover:bg-surface/10"
            >
              Sign in
            </NuxtLink>
          </div>

          <p class="mt-4 text-body-sm text-primary-200">
            No credit card required
          </p>
        </div>
        <div class="relative">
          <div class="absolute -inset-8 rounded-3xl bg-primary-500/20 blur-3xl" />
          <div class="relative overflow-hidden rounded-2xl border border-white/25 bg-surface shadow-2xl">
            <NuxtImg
              v-if="!previewFailed"
              src="/images/dashboard-preview.png"
              alt="Dashboard preview"
              width="1898"
              height="1772"
              sizes="100vw"
              loading="lazy"
              format="webp"
              class="block h-auto w-full"
              @error="previewFailed = true"
            />
            <div
              v-else
              class="bg-surface p-8"
            >
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="text-body-lg font-bold text-rs-fg">
                    Welcome back
                  </div>
                  <div class="rounded-full bg-brand-600 px-3 py-1 text-body-sm font-semibold text-white">
                    Plus
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div class="rounded-lg bg-neutral-50 p-3">
                    <div class="mb-1 text-body-sm text-rs-muted">
                      Watchlist
                    </div>
                    <div class="text-h4 font-bold text-rs-fg">
                      2
                    </div>
                  </div>
                  <div class="rounded-lg bg-neutral-50 p-3">
                    <div class="mb-1 text-body-sm text-rs-muted">
                      Alerts
                    </div>
                    <div class="text-h4 font-bold text-rs-fg">
                      1
                    </div>
                  </div>
                  <div class="rounded-lg bg-neutral-50 p-3">
                    <div class="mb-1 text-body-sm text-rs-muted">
                      History
                    </div>
                    <div class="text-h4 font-bold text-rs-fg">
                      90d
                    </div>
                  </div>
                  <div class="rounded-lg bg-neutral-50 p-3">
                    <div class="mb-1 text-body-sm text-rs-muted">
                      Rate
                    </div>
                    <div class="text-h4 font-bold text-success-600">
                      56.82
                    </div>
                  </div>
                </div>
                <div class="rounded-lg bg-neutral-50 p-4">
                  <div class="mb-2 flex items-center justify-between">
                    <div class="font-semibold text-rs-fg">
                      Rate trend
                    </div>
                    <div class="text-body-sm text-neutral-600">
                      🇺🇸 → 🇵🇭
                    </div>
                  </div>
                  <div class="h-16 rounded bg-gradient-to-t from-primary-100 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CenteredPage>
      </section>

      <!-- Product Tour -->
      <CenteredPage
        as="section"
        max-width="7xl"
        padding-y="lg"
        section-gap-class="space-y-10"
      >
        <header class="text-center">
          <h2 class="text-h2 font-bold text-rs-fg">
            A dashboard that feels like a product
          </h2>
          <p class="mx-auto mt-3 max-w-3xl text-neutral-600">
          Watchlist, alerts, history, exports{{ pulseEnabled ? ', and Pulse' : '' }}. Built for repeat transfers, not one-off calculators.
          </p>
        </header>

        <div class="grid gap-8 lg:grid-cols-[360px,1fr]">
          <div class="space-y-3">
            <button
              v-for="shot in tourShots"
              :key="shot.id"
              type="button"
              class="w-full rounded-2xl border p-4 text-left transition-all"
              :class="activeTourShotId === shot.id
                ? 'border-brand-600 bg-primary-50 shadow-sm'
                : 'border-rs-border bg-surface hover:border-neutral-300 hover:bg-neutral-50'"
              @click="activeTourShotId = shot.id"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="text-body font-semibold text-rs-fg">
                    {{ shot.title }}
                  </div>
                  <div class="mt-1 text-body-sm leading-relaxed text-neutral-600">
                    {{ shot.body }}
                  </div>
                </div>
                <div class="flex-shrink-0 rounded-full bg-neutral-900 px-3 py-1 text-body-sm font-semibold text-white">
                  {{ shot.badge }}
                </div>
              </div>
            </button>

            <div class="rounded-2xl border border-rs-border bg-neutral-50 p-4 text-body-sm text-neutral-700">
              Tip: in Plus, you can scale to 16 corridors and 16 alerts and export your history.
            </div>
          </div>

          <div class="relative">
            <div class="absolute -inset-6 rounded-3xl bg-primary-500/10 blur-3xl" />
            <div class="relative overflow-hidden rounded-2xl border border-rs-border bg-surface shadow-xl">
              <div class="flex items-center gap-2 border-b border-rs-border bg-neutral-50 px-4 py-2">
                <div class="flex gap-1.5">
                  <span class="h-3 w-3 rounded-full bg-neutral-300" />
                  <span class="h-3 w-3 rounded-full bg-neutral-300" />
                  <span class="h-3 w-3 rounded-full bg-neutral-300" />
                </div>
                <div class="ml-2 truncate text-body-sm text-neutral-500">
                  Dashboard preview (logged-in)
                </div>
              </div>

              <div class="relative aspect-[16/10] overflow-hidden bg-surface">
                <NuxtImg
                  :src="screenshotSrc"
                  :alt="`Dashboard screenshot: ${activeTourShot.title}`"
                  width="1898"
                  height="1772"
                  sizes="100vw"
                  loading="lazy"
                  format="webp"
                  class="absolute inset-0 h-full w-full object-cover will-change-transform"
                  :style="{
                    objectPosition: activeTourShot.objectPosition,
                    transform: `scale(${activeTourShot.scale})`,
                  }"
                />
                <div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
                <div class="absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-body-sm font-semibold text-white backdrop-blur-sm">
                  {{ activeTourShot.title }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CenteredPage>

      <CenteredPage
as="section"
max-width="6xl"
padding-y="lg"
section-gap-class="space-y-10"
>
        <header class="text-center">
          <h2 class="text-h3 font-bold text-rs-fg">
            Everything you need, without the noise
        </h2>
        <p class="mx-auto mt-3 max-w-2xl text-neutral-600">
          Build a watchlist, set alerts, and compare providers with total cost in view.
        </p>
      </header>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="f in features"
          :key="f.title"
          class="rounded-2xl border border-rs-border bg-surface p-6 transition-all hover:border-primary-300 hover:shadow-lg"
        >
          <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
            <Icon
              :name="f.icon"
              :size="24"
              class="text-brand-700"
            />
          </div>
          <h3 class="text-body font-semibold text-rs-fg">
            {{ f.title }}
          </h3>
          <p class="mt-2 text-body-sm leading-relaxed text-neutral-600">
            {{ f.body }}
          </p>
          <p class="mt-3 text-body-sm text-neutral-400">
            {{ f.meta }}
          </p>
        </div>
      </div>

      <div class="rounded-xl border border-rs-border bg-neutral-50 p-5 text-body-sm text-neutral-700">
        <span class="font-semibold">Plus never changes rankings.</span>
        <span class="text-neutral-600"> Comparisons remain data-driven for everyone.</span>
      </div>
    </CenteredPage>

    <!-- Trust Strip (existing component) -->
    <HomeTrustMetricsStrip bg-class="bg-brand-600" />

    <!-- Plan CTA -->
    <section class="bg-neutral-100 py-16">
      <div class="mx-auto max-w-4xl px-4">
        <div class="text-center">
          <h2 class="text-h2 font-bold text-rs-fg">
            Choose your plan
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-neutral-600">
            Start free. Upgrade when you need higher limits, exports{{ pulseEnabled ? ', and Pulse analytics' : '' }}.
          </p>
        </div>

        <div class="mt-10 grid gap-6 md:grid-cols-2">
          <div class="rounded-2xl border border-rs-border bg-surface p-6 shadow-sm">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-body-lg font-bold text-rs-fg">
                  Free
                </div>
                <div class="text-body-sm text-neutral-600">
                  For occasional senders
                </div>
              </div>
              <div class="text-h2 font-bold text-rs-fg">
                $0
              </div>
            </div>

            <ul class="mt-5 space-y-3 text-body-sm text-neutral-700">
              <li class="flex items-center gap-2">
                <Icon
name="check"
:size="20"
class="text-brand-700"
/>
                3 watchlist corridors
              </li>
              <li class="flex items-center gap-2">
                <Icon
name="check"
:size="20"
class="text-brand-700"
/>
                1 active alert
              </li>
              <li class="flex items-center gap-2">
                <Icon
name="check"
:size="20"
class="text-brand-700"
/>
                30-day history
              </li>
              <li class="flex items-center gap-2">
                <Icon
name="check"
:size="20"
class="text-brand-700"
/>
                Provider comparisons
              </li>
            </ul>

            <NuxtLink
              to="/sign-up"
              class="mt-6 block w-full rounded-btn border border-neutral-300 py-3 text-center text-body-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:border-neutral-400"
            >
              Create account
            </NuxtLink>
          </div>

          <div class="rounded-2xl bg-brand-700 p-6 shadow-lg">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-body-lg font-bold text-white">
                  Plus
                </div>
                <div class="text-body-sm text-primary-100">
                  For frequent senders
                </div>
              </div>
              <div class="text-right">
                <div class="text-h2 font-bold text-white">
                  Upgrade
                </div>
                <div class="text-body-sm text-primary-100">
                  Cancel anytime
                </div>
              </div>
            </div>

            <ul class="mt-5 space-y-3 text-body-sm text-white">
              <li class="flex items-center gap-2">
                <Icon
name="check"
:size="20"
class="text-white"
/>
                16 watchlist corridors
              </li>
              <li class="flex items-center gap-2">
                <Icon
name="check"
:size="20"
class="text-white"
/>
                16 alerts
              </li>
              <li
v-if="pulseEnabled"
class="flex items-center gap-2"
>
                <Icon
name="check"
:size="20"
class="text-white"
/>
                Pulse access
              </li>
              <li class="flex items-center gap-2">
                <Icon
name="check"
:size="20"
class="text-white"
/>
                Export + ad-free
              </li>
            </ul>

            <NuxtLink
              to="/plus"
              class="mt-6 block w-full rounded-btn bg-surface py-3 text-center text-body-sm font-semibold text-brand-700 transition-colors hover:bg-primary-50"
            >
              See Plus pricing
            </NuxtLink>
          </div>
        </div>
        <p class="text-center text-body-sm text-neutral-300 mt-8">All plans include access to compare 30+ providers • Cancel anytime</p>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="bg-brand-700 py-16">
      <div class="mx-auto max-w-2xl px-4 text-center">
        <h2 class="text-h2 font-bold text-white">
          Ready to send with confidence?
        </h2>
        <p class="mt-3 text-body-lg text-primary-100">
          Create a free account to save your routes and set alerts.
        </p>
        <NuxtLink
          to="/sign-up"
          class="mt-8 inline-flex min-h-btn items-center justify-center gap-2 rounded-btn bg-surface px-8 py-4 text-body font-semibold text-brand-700 shadow-lg transition-colors hover:bg-primary-50"
        >
          <Icon
name="user-plus"
:size="20"
class="text-current"
/>
          Create free account
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
