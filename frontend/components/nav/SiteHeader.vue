<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useCompareForm } from '~/composables/useCompareForm'
import { useAuth } from '~/composables/useAuth'

const mobileMenuOpen = ref(false)
const scrolled = ref(false)

const { compareUrl } = useCompareForm()
const { isAuthenticated, isPlus, watchlistCount, alertsCount } = useAuth()

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
        </nav>
      </div>

      <!-- Right: Identity + Plan -->
      <div class="flex items-center gap-3">
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
            class="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Get Plus
          </NuxtLink>
        </template>

        <!-- Logged in state -->
        <template v-else>
          <!-- Watchlist -->
          <NuxtLink
            to="/watchlist"
            class="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 relative"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span class="sr-only">Watchlist</span>
            <span
              v-if="watchlistCount > 0"
              class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center"
            >
              {{ watchlistCount > 9 ? '9+' : watchlistCount }}
            </span>
          </NuxtLink>

          <!-- Alerts -->
          <NuxtLink
            to="/alerts"
            class="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 relative"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="sr-only">Alerts</span>
            <span
              v-if="alertsCount > 0"
              class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center"
            >
              {{ alertsCount > 9 ? '9+' : alertsCount }}
            </span>
          </NuxtLink>

          <!-- Plus pill (if Plus member) -->
          <span
            v-if="isPlus"
            class="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
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
                to="/watchlist"
                class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
              >
                <div class="flex items-center gap-2">
                  <span>Watchlist</span>
                  <span
                    v-if="watchlistCount > 0"
                    class="rounded-full bg-blue-600 text-white text-xs font-semibold px-1.5 py-0.5 min-w-[1.25rem] text-center"
                  >
                    {{ watchlistCount > 9 ? '9+' : watchlistCount }}
                  </span>
                </div>
                <span aria-hidden="true">→</span>
              </NuxtLink>
              <NuxtLink
                to="/alerts"
                class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
              >
                <div class="flex items-center gap-2">
                  <span>Alerts</span>
                  <span
                    v-if="alertsCount > 0"
                    class="rounded-full bg-blue-600 text-white text-xs font-semibold px-1.5 py-0.5 min-w-[1.25rem] text-center"
                  >
                    {{ alertsCount > 9 ? '9+' : alertsCount }}
                  </span>
                </div>
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
