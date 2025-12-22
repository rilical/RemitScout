<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useCompareForm } from '~/composables/useCompareForm'
import { useAuth } from '~/composables/useAuth'
import { useEntitlements } from '~/composables/useEntitlements'

const mobileMenuOpen = ref(false)
const scrolled = ref(false)

const { compareUrl } = useCompareForm()
const { isAuthenticated, signIn, signOut } = useAuth()
const { isPlus, plan, setPlan } = useEntitlements()

const runtimeConfig = useRuntimeConfig()
type PublicDevConfig = { devControls?: boolean }
const devControlsEnabled = computed(() => import.meta.dev || Boolean((runtimeConfig.public as unknown as PublicDevConfig).devControls))

const devStatusLabel = computed(() => {
  if (!isAuthenticated.value) return 'Logged out'
  return plan.value === 'plus' ? 'Plus' : 'Free'
})

const devStatusNextLabel = computed(() => {
  if (!isAuthenticated.value) return 'Sign in (Free)'
  if (plan.value === 'free') return 'Upgrade to Plus'
  return 'Sign out'
})

function cycleDevStatus() {
  if (!isAuthenticated.value) {
    signIn('dev@remitscout.test')
    setPlan('free')
    return
  }

  if (plan.value === 'free') {
    setPlan('plus')
    return
  }

  signOut()
  setPlan('free')
}

function handleDevCycleFromMenu() {
  cycleDevStatus()
  closeMobileMenu()
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
      'sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur motion-safe:transition-shadow',
      scrolled ? 'shadow-[0_1px_12px_rgba(0,0,0,0.05)]' : 'shadow-none',
    ]"
  >
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white border border-slate-300 px-3 py-1.5 rounded-md text-sm font-medium z-[100] focus:outline-none focus:ring-2 focus:ring-blue-500"
    >Skip to content</a>

    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Left: Logo -->
      <div class="flex items-center gap-8">
        <NuxtLink
          to="/"
          class="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
        >
          <img
            src="/logos/remit-scout.svg"
            alt="RemitScout"
            class="h-8 w-auto"
          >
        </NuxtLink>

        <!-- Primary nav (Desktop) -->
        <nav
          class="hidden md:flex items-center gap-2"
          aria-label="Primary navigation"
        >
          <!-- Dashboard -->
          <NuxtLink
            to="/dashboard"
            class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Dashboard
          </NuxtLink>

          <!-- Compare -->
          <NuxtLink
            to="/send-money"
            class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Compare
          </NuxtLink>

          <!-- Providers -->
          <NuxtLink
            to="/learn/providers"
            class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Providers
          </NuxtLink>

          <!-- Pulse -->
          <NuxtLink
            to="/pulse"
            class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Pulse
          </NuxtLink>

          <!-- Guides -->
          <NuxtLink
            to="/learn"
            class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Guides
          </NuxtLink>

          <!-- Enterprise -->
          <NuxtLink
            to="/institutions"
            class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Enterprise
          </NuxtLink>
        </nav>
      </div>

      <!-- Right: Identity + Plan -->
      <div class="flex items-center gap-3">
        <button
          v-if="devControlsEnabled"
          type="button"
          class="hidden sm:inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          :title="`Dev: ${devStatusLabel} → ${devStatusNextLabel}`"
          @click="cycleDevStatus"
        >
          DEV: {{ devStatusLabel }}
        </button>

        <!-- Logged out state -->
        <template v-if="!isAuthenticated">
          <NuxtLink
            to="/sign-in"
            class="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            to="/plus"
            class="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium text-white text-center rounded-md bg-blue-600 hover:bg-blue-700 border border-transparent motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Get Plus
          </NuxtLink>
        </template>

        <!-- Logged in state -->
        <template v-else>
          <NuxtLink
            to="/dashboard"
            class="md:hidden inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            v-if="!isPlus"
            to="/plus"
            class="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium text-white text-center rounded-md bg-blue-600 hover:bg-blue-700 border border-transparent motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Get Plus
          </NuxtLink>

          <!-- Plus pill (if Plus member) -->
          <span
            v-if="isPlus"
            class="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
          >
            <svg
              class="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Plus
          </span>

          <!-- User Menu -->
          <UserMenu />
        </template>

        <!-- Mobile menu button -->
        <button
          class="md:hidden inline-flex items-center rounded-md border border-slate-200 p-2 hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
          class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-xl overflow-y-auto md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div class="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <img
              src="/logos/remit-scout.svg"
              alt="RemitScout"
              class="h-7 w-auto"
            >
            <button
              class="rounded-md p-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              to="/dashboard"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
            >
              <span>Dashboard</span>
              <span aria-hidden="true">→</span>
            </NuxtLink>

            <NuxtLink
              to="/send-money"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
            >
              <span>Compare</span>
              <span aria-hidden="true">→</span>
            </NuxtLink>

            <NuxtLink
              to="/learn/providers"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
            >
              <span>Providers</span>
              <span aria-hidden="true">→</span>
            </NuxtLink>

            <NuxtLink
              to="/pulse"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
            >
              <span>Pulse</span>
              <span aria-hidden="true">→</span>
            </NuxtLink>

            <NuxtLink
              to="/learn"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
            >
              <span>Guides</span>
              <span aria-hidden="true">→</span>
            </NuxtLink>

            <NuxtLink
              to="/institutions"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
            >
              <span>Enterprise</span>
              <span aria-hidden="true">→</span>
            </NuxtLink>

            <div class="my-3 border-t border-slate-200" />

            <button
              v-if="devControlsEnabled"
              type="button"
              class="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-amber-900 bg-amber-50 border border-amber-200 hover:bg-amber-100 motion-safe:transition"
              :title="`Dev: ${devStatusLabel} → ${devStatusNextLabel}`"
              @click="handleDevCycleFromMenu"
            >
              <span>DEV: {{ devStatusLabel }}</span>
              <span aria-hidden="true">↻</span>
            </button>

            <template v-if="!isAuthenticated">
              <NuxtLink
                to="/sign-in"
                class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
              >
                <span>Sign in</span>
                <span aria-hidden="true">→</span>
              </NuxtLink>
              <NuxtLink
                to="/plus"
                class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
              >
                <span>Get Plus</span>
                <span aria-hidden="true">→</span>
              </NuxtLink>
            </template>

            <template v-else>
              <NuxtLink
                v-if="!isPlus"
                to="/plus"
                class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
              >
                <span>Get Plus</span>
                <span aria-hidden="true">→</span>
              </NuxtLink>
            </template>
          </div>

          <!-- Mobile Footer CTA -->
          <div class="border-t border-slate-200 p-4">
            <NuxtLink
              :to="compareUrl"
              class="flex items-center justify-center w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 motion-safe:transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Compare providers
            </NuxtLink>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>
