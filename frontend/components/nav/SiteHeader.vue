<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useCompareForm } from '~/composables/useCompareForm'
import { useAuth } from '~/composables/useAuth'
import { useEntitlements } from '~/composables/useEntitlements'
import { useFeatureFlags } from '~/composables/useFeatureFlags'

const mobileMenuOpen = ref(false)
const scrolled = ref(false)
const logoError = ref(false)

const { compareUrl } = useCompareForm()
const { isAuthenticated } = useAuth()
const { isPlus } = useEntitlements()
const { pulseEnabled } = useFeatureFlags()
const dashboardNavTo = computed(() => (
  isAuthenticated.value
    ? '/dashboard'
    : '/sign-in?redirect=/dashboard'
))

const logoPlusSrc = computed(() => {
  // Route to SVG file in public/png/SVG directory
  // Use LOGO_PLUS.svg (icon only, no text) for Plus accounts
  return '/png/SVG/LOGO_PLUS.svg'
})

const logoRegularSrc = computed(() => {
  // Use LOGO.svg (icon only, no text) for regular accounts
  return '/png/SVG/LOGO.svg'
})

function handleLogoError() {
  logoError.value = true
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  }
  else {
    document.body.style.overflow = ''
  }
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
  document.body.style.overflow = ''
}

function onScroll() {
  scrolled.value = window.scrollY > 2
}

function handleClickOutside() {
  // Reserved for future use
}

const isActive = (to: string) => {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(`${to}/`)
}

const ariaCurrent = (to: string) => (isActive(to) ? 'page' : undefined)

onMounted(() => {
  window.addEventListener('scroll', onScroll)
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', handleClickOutside)
})

// Close mobile menu on route change
const route = useRoute()
watch(() => route.path, () => {
  closeMobileMenu()
})
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-50 border-b border-rs-border bg-surface/80 backdrop-blur motion-safe:transition-shadow',
      scrolled ? 'shadow-[0_1px_12px_rgba(0,0,0,0.05)]' : 'shadow-none',
    ]"
  >
    <div class="container h-16 flex items-center justify-between">
      <!-- Left: Logo + Navigation -->
      <div class="flex items-center gap-6">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
        >
          <NuxtImg
            v-if="isPlus && !logoError"
            :src="logoPlusSrc"
            alt="Remit-Scout Plus logo"
            width="40"
            height="40"
            loading="eager"
            preload
            class="h-10 w-10 object-contain flex-shrink-0"
            @error="handleLogoError"
          />
          <NuxtImg
            v-else
            :src="logoRegularSrc"
            alt="Remit-Scout logo"
            width="40"
            height="40"
            loading="eager"
            preload
            class="h-10 w-10 object-contain flex-shrink-0"
          />
          <span class="text-body-lg font-bold text-neutral-900 whitespace-nowrap">
            Remit-Scout
            <span
              v-if="isPlus && !logoError"
              class="text-brand-600"
            > Plus</span>
          </span>
        </NuxtLink>

        <!-- Primary nav (Desktop) -->
        <nav
          class="hidden md:flex items-center gap-1"
          aria-label="Primary navigation"
        >
          <!-- Dashboard -->
          <NuxtLink
            :to="dashboardNavTo"
            class="px-3 py-2 text-body-sm font-medium text-neutral-700 hover:text-rs-fg rounded-md hover:bg-neutral-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            :aria-current="ariaCurrent('/dashboard')"
          >
            Dashboard
          </NuxtLink>

          <!-- Compare -->
          <NuxtLink
            to="/send-money"
            class="px-3 py-2 text-body-sm font-medium text-neutral-700 hover:text-rs-fg rounded-md hover:bg-neutral-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            :aria-current="ariaCurrent('/send-money')"
          >
            Compare
          </NuxtLink>

          <!-- Providers -->
          <NuxtLink
            to="/learn/providers"
            class="px-3 py-2 text-body-sm font-medium text-neutral-700 hover:text-rs-fg rounded-md hover:bg-neutral-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            :aria-current="ariaCurrent('/learn/providers')"
          >
            Providers
          </NuxtLink>

          <!-- Pulse (feature-flagged) -->
          <NuxtLink
            v-if="pulseEnabled"
            to="/pulse"
            class="px-3 py-2 text-body-sm font-medium text-neutral-700 hover:text-rs-fg rounded-md hover:bg-neutral-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            :aria-current="ariaCurrent('/pulse')"
          >
            Pulse
          </NuxtLink>

          <!-- Guides -->
          <NuxtLink
            to="/learn"
            class="px-3 py-2 text-body-sm font-medium text-neutral-700 hover:text-rs-fg rounded-md hover:bg-neutral-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            :aria-current="ariaCurrent('/learn')"
          >
            Guides
          </NuxtLink>

          <!-- Enterprise (Hidden - activate in future) -->
          <!-- <NuxtLink
            to="/institutions"
            class="px-3 py-2 text-body-sm font-medium text-neutral-700 hover:text-rs-fg rounded-md hover:bg-neutral-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Enterprise
          </NuxtLink> -->
        </nav>
      </div>

      <!-- Right: Identity + Plan -->
      <div class="flex items-center gap-3">
        <!-- Logged out state -->
        <template v-if="!isAuthenticated">
          <NuxtLink
            to="/sign-in"
            class="hidden sm:inline-flex items-center px-3 py-1.5 text-body-sm font-medium text-neutral-700 hover:text-rs-fg rounded-md hover:bg-neutral-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            to="/plus"
            class="hidden sm:inline-flex items-center px-3 py-1.5 text-body-sm font-medium text-white text-center rounded-md bg-brand-600 hover:bg-brand-700 border border-transparent motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Get Plus
          </NuxtLink>
        </template>

        <!-- Logged in state -->
        <template v-else>
          <NuxtLink
            v-if="!isPlus"
            to="/plus"
            class="hidden sm:inline-flex items-center px-3 py-1.5 text-body-sm font-medium text-white text-center rounded-md bg-brand-600 hover:bg-brand-700 border border-transparent motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Get Plus
          </NuxtLink>

          <!-- User Menu -->
          <UserMenu />
        </template>

        <!-- Mobile menu button -->
        <button
          class="md:hidden inline-flex items-center rounded-md border border-rs-border p-2 hover:bg-neutral-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
          :aria-expanded="mobileMenuOpen"
          @click="toggleMobileMenu"
        >
          <svg
            v-if="!mobileMenuOpen"
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <svg
            v-else
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu Drawer -->
    <Teleport to="body">
      <Transition
        enter-active-class="motion-safe:transition motion-safe:ease-out motion-safe:duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="motion-safe:transition motion-safe:ease-in motion-safe:duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="mobileMenuOpen"
          class="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm md:hidden"
          aria-hidden="true"
          @click="closeMobileMenu"
        />
      </Transition>

      <Transition
        enter-active-class="motion-safe:transition motion-safe:ease-out motion-safe:duration-300"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="motion-safe:transition motion-safe:ease-in motion-safe:duration-200"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <div
          v-if="mobileMenuOpen"
          class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-surface shadow-xl overflow-y-auto md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div class="flex items-center justify-between border-b border-rs-border px-4 py-4">
            <NuxtLink
              to="/"
            class="flex items-center gap-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
            @click="closeMobileMenu"
          >
              <NuxtImg
                v-if="isPlus && !logoError"
                :src="logoPlusSrc"
                alt="Remit-Scout Plus logo"
                width="40"
                height="40"
                loading="lazy"
                class="h-10 w-10 object-contain flex-shrink-0"
                @error="handleLogoError"
              />
              <NuxtImg
                v-else
                :src="logoRegularSrc"
                alt="Remit-Scout logo"
                width="40"
                height="40"
                loading="lazy"
                class="h-10 w-10 object-contain flex-shrink-0"
              />
              <span class="text-body font-bold text-neutral-900 whitespace-nowrap">
                Remit-Scout
                <span
                  v-if="isPlus && !logoError"
                  class="text-brand-600"
                > Plus</span>
              </span>
            </NuxtLink>
            <button
              class="rounded-md p-2 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Close menu"
              @click="closeMobileMenu"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div class="px-4 py-6 space-y-2">
            <NuxtLink
              :to="dashboardNavTo"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-body-sm font-semibold text-neutral-800 hover:bg-neutral-50 motion-safe:transition"
              :aria-current="ariaCurrent('/dashboard')"
            >
              <span>Dashboard</span>
              <span aria-hidden="true">→</span>
            </NuxtLink>

            <NuxtLink
              to="/send-money"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-body-sm font-semibold text-neutral-800 hover:bg-neutral-50 motion-safe:transition"
              :aria-current="ariaCurrent('/send-money')"
            >
              <span>Compare</span>
              <span aria-hidden="true">→</span>
            </NuxtLink>

            <NuxtLink
              to="/learn/providers"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-body-sm font-semibold text-neutral-800 hover:bg-neutral-50 motion-safe:transition"
              :aria-current="ariaCurrent('/learn/providers')"
            >
              <span>Providers</span>
              <span aria-hidden="true">→</span>
            </NuxtLink>

            <!-- Pulse (feature-flagged) -->
            <NuxtLink
              v-if="pulseEnabled"
              to="/pulse"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-body-sm font-semibold text-neutral-800 hover:bg-neutral-50 motion-safe:transition"
              :aria-current="ariaCurrent('/pulse')"
            >
              <span>Pulse</span>
              <span aria-hidden="true">→</span>
            </NuxtLink>

            <NuxtLink
              to="/learn"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-body-sm font-semibold text-neutral-800 hover:bg-neutral-50 motion-safe:transition"
              :aria-current="ariaCurrent('/learn')"
            >
              <span>Guides</span>
              <span aria-hidden="true">→</span>
            </NuxtLink>

            <!-- Enterprise (Hidden - activate in future) -->
            <!-- <NuxtLink
              to="/institutions"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-body-sm font-semibold text-neutral-800 hover:bg-neutral-50 motion-safe:transition"
            >
              <span>Enterprise</span>
              <span aria-hidden="true">→</span>
            </NuxtLink> -->

            <div class="my-3 border-t border-rs-border" />

            <template v-if="!isAuthenticated">
              <NuxtLink
                to="/sign-in"
                class="flex items-center justify-between rounded-lg px-3 py-2.5 text-body-sm font-semibold text-neutral-800 hover:bg-neutral-50 motion-safe:transition"
              >
                <span>Sign in</span>
                <span aria-hidden="true">→</span>
              </NuxtLink>
              <NuxtLink
                to="/plus"
                class="flex items-center justify-between rounded-lg px-3 py-2.5 text-body-sm font-semibold text-neutral-800 hover:bg-neutral-50 motion-safe:transition"
              >
                <span>Get Plus</span>
                <span aria-hidden="true">→</span>
              </NuxtLink>
            </template>

            <template v-else>
              <NuxtLink
                v-if="!isPlus"
                to="/plus"
                class="flex items-center justify-between rounded-lg px-3 py-2.5 text-body-sm font-semibold text-neutral-800 hover:bg-neutral-50 motion-safe:transition"
              >
                <span>Get Plus</span>
                <span aria-hidden="true">→</span>
              </NuxtLink>
            </template>
          </div>

          <!-- Mobile Footer CTA -->
          <div class="border-t border-rs-border p-4">
            <NuxtLink
              :to="compareUrl"
              class="flex items-center justify-center w-full rounded-md bg-brand-600 px-4 py-3 text-body-sm font-semibold text-white hover:bg-brand-700 motion-safe:transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Compare providers
            </NuxtLink>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>
