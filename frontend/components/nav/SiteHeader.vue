<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useCompareForm } from '~/composables/useCompareForm'
import { useAuth } from '~/composables/useAuth'
import { useEntitlements, type Plan } from '~/composables/useEntitlements'
import { FEATURE_FLAGS } from '~/utils/constants'

const mobileMenuOpen = ref(false)
const scrolled = ref(false)
const logoError = ref(false)

const { compareUrl } = useCompareForm()
const { isAuthenticated, signIn, signOut } = useAuth()
const { isPlus, plan, refreshPlan, getEffectivePlan } = useEntitlements()

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

const runtimeConfig = useRuntimeConfig()
type PublicDevConfig = { devControls?: boolean; devSuperAdminEmail?: string }
const devControlsEnabled = computed(() => import.meta.dev || Boolean((runtimeConfig.public as unknown as PublicDevConfig).devControls))
const devSuperAdminEmail = computed(() => (runtimeConfig.public as unknown as PublicDevConfig).devSuperAdminEmail || 'admin@remitscout.test')

// Dev-only plan override state (shared with useEntitlements)
const devPlanOverride = useState<Plan | null>('dev:plan-override', () => null)

const devStatusLabel = computed(() => {
  if (!isAuthenticated.value) return 'Logged out'
  const currentPlan = devPlanOverride.value || plan.value
  return currentPlan === 'plus' ? 'Plus' : 'Free'
})

const devStatusNextLabel = computed(() => {
  if (!isAuthenticated.value) return 'Sign in (Free)'
  const currentPlan = devPlanOverride.value || plan.value
  if (currentPlan === 'free') return 'Upgrade to Plus'
  return 'Sign out'
})

const effectivePlan = computed(() => {
  if (!isAuthenticated.value) return 'free' as Plan
  return devPlanOverride.value || plan.value
})

async function cycleDevStatus() {
  try {
    if (!isAuthenticated.value) {
      // Step 1: Sign in as super admin (if feature flag enabled) or dev user
      const emailToUse = FEATURE_FLAGS.DEV_AUTO_LOGIN && devSuperAdminEmail.value 
        ? devSuperAdminEmail.value 
        : 'dev@remitscout.test'
      
      const result = await signIn(emailToUse)
      if (result && result.ok) {
        devPlanOverride.value = 'free'
        await refreshPlan()
      } else {
        console.error('Dev sign in failed:', result?.error || 'Unknown error')
      }
      return
    }

    const currentPlan = devPlanOverride.value || plan.value

    if (currentPlan === 'free') {
      // Step 2: Upgrade to Plus (dev override)
      devPlanOverride.value = 'plus'
      // Also update the plan state directly for immediate UI update
      const planState = useState<Plan>('entitlements:plan')
      if (planState.value) {
        planState.value = 'plus'
      }
      return
    }

    if (currentPlan === 'plus') {
      // Step 3: Sign out
      devPlanOverride.value = null
      const result = await signOut()
      if (result && result.ok) {
        await refreshPlan()
      }
      return
    }
  } catch (error) {
    console.error('Dev status cycle error:', error)
  }
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
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Left: Logo + Navigation -->
      <div class="flex items-center gap-6">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
        >
          <img
            v-if="isPlus && !logoError"
            :src="logoPlusSrc"
            alt=""
            class="h-10 w-10 object-contain flex-shrink-0"
            @error="handleLogoError"
          >
          <img
            v-else
            :src="logoRegularSrc"
            alt=""
            class="h-10 w-10 object-contain flex-shrink-0"
          >
            <span class="text-lg font-bold text-neutral-900 whitespace-nowrap">
            Remit-Scout
            <span v-if="isPlus && !logoError" class="text-brand-600"> Plus</span>
          </span>
        </NuxtLink>

        <!-- Primary nav (Desktop) -->
        <nav
          class="hidden md:flex items-center gap-1"
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

          <!-- Pulse (Hidden behind feature flag) -->
          <!-- <NuxtLink
            v-if="FEATURE_FLAGS.PULSE_ENABLED"
            to="/pulse"
            class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Pulse
          </NuxtLink> -->

          <!-- Guides -->
          <NuxtLink
            to="/learn"
            class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Guides
          </NuxtLink>

          <!-- Enterprise (Hidden - activate in future) -->
          <!-- <NuxtLink
            to="/institutions"
            class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Enterprise
          </NuxtLink> -->
        </nav>
      </div>

      <!-- Right: Identity + Plan -->
      <div class="flex items-center gap-3">
        <button
          v-if="devControlsEnabled"
          type="button"
          class="hidden sm:inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
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
            v-if="effectivePlan !== 'plus'"
            to="/plus"
            class="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium text-white text-center rounded-md bg-blue-600 hover:bg-blue-700 border border-transparent motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Get Plus
          </NuxtLink>

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
            <NuxtLink
              to="/"
              class="flex items-center gap-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              @click="closeMobileMenu"
            >
              <img
                v-if="isPlus && !logoError"
                :src="logoPlusSrc"
                alt=""
                class="h-10 w-10 object-contain flex-shrink-0"
                @error="handleLogoError"
              >
              <img
                v-else
                :src="logoRegularSrc"
                alt=""
                class="h-10 w-10 object-contain flex-shrink-0"
              >
              <span class="text-base font-bold text-neutral-900 whitespace-nowrap">
                Remit-Scout
                <span v-if="isPlus && !logoError" class="text-brand-600"> Plus</span>
              </span>
            </NuxtLink>
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

            <!-- Pulse (Hidden behind feature flag) -->
            <!-- <NuxtLink
              v-if="FEATURE_FLAGS.PULSE_ENABLED"
              to="/pulse"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
            >
              <span>Pulse</span>
              <span aria-hidden="true">→</span>
            </NuxtLink> -->

            <NuxtLink
              to="/learn"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
            >
              <span>Guides</span>
              <span aria-hidden="true">→</span>
            </NuxtLink>

            <!-- Enterprise (Hidden - activate in future) -->
            <!-- <NuxtLink
              to="/institutions"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition"
            >
              <span>Enterprise</span>
              <span aria-hidden="true">→</span>
            </NuxtLink> -->

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
                v-if="effectivePlan !== 'plus'"
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
