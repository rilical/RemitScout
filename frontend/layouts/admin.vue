<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import AdminCommandPalette, { type AdminCommand } from '~/components/admin/AdminCommandPalette.vue'

const route = useRoute()
const { user } = useAuth()
const { ensureAdminSession, signOutAdmin } = useAdminSession()
const runtimeConfig = useRuntimeConfig()
const env = () => String(runtimeConfig.public.remitScoutEnv ?? 'dev').toLowerCase()

const sidebarCollapsed = ref(false)
const mobileNavOpen = ref(false)
const commandPaletteOpen = ref(false)
const isSigningOut = ref(false)
const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined'

const adminLinks = [
  { to: '/admin', label: 'Overview', description: 'KPI summary + admin feed', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/admin/observer', label: 'Operations Center', description: 'Indices, sweeps, providers, queues', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  { to: '/admin/discovery', label: 'Provider Control Plane', description: 'Discovery review, apply, certification', icon: 'M4 7h16M4 12h16M4 17h10m4-7l3 3-3 3' },
  { to: '/admin/modules', label: 'Module Registry', description: 'Provider module health and status', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { to: '/admin/agents', label: 'Self-Healing', description: 'Agent actions, failure bundles, repairs', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { to: '/admin/stress', label: 'Corridor Stress', description: 'Stress scores and manual intervention', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { to: '/admin/data-quality', label: 'Data Quality', description: 'Collection error and MTTD/MTTR', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { to: '/admin/incidents', label: 'Incidents', description: 'Detection to resolution timeline', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/admin/delivery-progress', label: 'Delivery Progress', description: 'Module readiness by domain', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { to: '/admin/analytics', label: 'Analytics', description: 'Traffic, provider CTR, engagement', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to: '/admin/enterprise', label: 'Enterprise', description: 'User plan grants and revocations', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { to: '/admin/audit', label: 'Audit', description: 'Admin/security/compliance log stream', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/admin/gold-exports', label: 'Gold Exports', description: 'TEER/RCI/RVI snapshots', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
  { to: '/admin/institutional', label: 'Institutional', description: 'B2B client lifecycle + keys', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
  { to: '/admin/ads', label: 'Ads', description: 'Inventory and placement controls', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  { to: '/admin/feature-flags', label: 'Feature Flags', description: 'Runtime flags with audience rules', icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9' },
  { to: '/admin/newsletter', label: 'Newsletter', description: 'Compose and send campaigns', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
]

const userEmail = computed(() => user.value?.email || 'Unknown')

const environmentBadge = computed(() => {
  const e = env()
  if (e === 'production' || e === 'prod') return { label: 'PROD', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' }
  if (e === 'staging') return { label: 'STAGING', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' }
  return { label: 'DEV', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
})

const commands = computed<AdminCommand[]>(() => [
  ...adminLinks.map(link => ({
    id: `nav:${link.to}`,
    label: `Go to ${link.label}`,
    description: link.description,
    keywords: [link.label, link.to, 'admin', 'navigate'],
  })),
  {
    id: 'query:user-email',
    label: 'Query user by email',
    description: 'Open Enterprise page with grant-email prefilled',
    keywords: ['user', 'email', 'enterprise', 'query'],
  },
  {
    id: 'query:audit-actor',
    label: 'Search audit by actor',
    description: 'Open Audit page filtered by actor ID/email',
    keywords: ['audit', 'actor', 'search', 'query'],
  },
])

const ensureAdminSessionSafe = async () => {
  const ok = await ensureAdminSession()
  if (!ok) {
    await navigateTo('/sign-in')
  }
  return ok
}

const onGlobalKeydown = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    commandPaletteOpen.value = !commandPaletteOpen.value
  }
}

const executeCommand = async (command: AdminCommand) => {
  commandPaletteOpen.value = false

  if (command.id === 'query:user-email') {
    if (!isBrowser()) return
    const value = window.prompt('Enter user email:')
    if (!value) return
    await navigateTo({ path: '/admin/enterprise', query: { email: value.trim().toLowerCase() } })
    return
  }

  if (command.id === 'query:audit-actor') {
    if (!isBrowser()) return
    const value = window.prompt('Enter actor ID or email:')
    if (!value) return
    await navigateTo({ path: '/admin/audit', query: { actor_id: value.trim() } })
    return
  }

  const navTarget = command.id.startsWith('nav:')
    ? command.id.slice('nav:'.length)
    : null
  if (navTarget) {
    await navigateTo(navTarget)
  }
}

const handleSignOut = async () => {
  if (isSigningOut.value) return
  isSigningOut.value = true
  try {
    await signOutAdmin()
    await navigateTo('/sign-in')
  }
  finally {
    isSigningOut.value = false
  }
}

watch(
  () => route.fullPath,
  async () => {
    if (!route.path.startsWith('/admin')) return
    if (isBrowser()) {
      await ensureAdminSessionSafe()
    }
    // Close mobile nav on route change
    mobileNavOpen.value = false
  },
)

onMounted(async () => {
  if (route.path.startsWith('/admin') && isBrowser()) {
    await ensureAdminSessionSafe()
  }
  if (isBrowser()) {
    window.addEventListener('keydown', onGlobalKeydown)
  }
})

onUnmounted(() => {
  if (isBrowser()) {
    window.removeEventListener('keydown', onGlobalKeydown)
  }
})
</script>

<template>
  <div class="min-h-screen bg-rs-bg text-rs-fg">
    <div class="flex min-h-screen">
      <!-- Desktop Sidebar -->
      <aside
        class="hidden border-r border-rs-border bg-rs-surface transition-all duration-200 lg:flex lg:flex-col"
        :class="sidebarCollapsed ? 'w-20' : 'w-72'"
      >
        <div class="flex items-center justify-between border-b border-rs-border p-4">
          <div
            v-if="!sidebarCollapsed"
            class="text-body-sm font-semibold uppercase tracking-wide text-rs-muted"
          >
            Admin Console
          </div>
          <button
            type="button"
            class="rounded-md border border-rs-border px-2 py-1 text-body-sm text-rs-muted hover:bg-neutral-50"
            :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            {{ sidebarCollapsed ? '→' : '←' }}
          </button>
        </div>

        <nav class="flex-1 overflow-y-auto p-3">
          <NuxtLink
            v-for="link in adminLinks"
            :key="link.to"
            :to="link.to"
            class="mb-2 block rounded-lg border px-3 py-2 transition-all duration-200"
            :class="[
              route.path === link.to
                ? 'border-brand-300 bg-brand-50 text-rs-fg border-l-2 border-l-brand-600 dark:border-sky-700 dark:bg-sky-900/30 dark:border-l-brand-500'
                : 'border-transparent text-rs-muted hover:border-rs-border hover:bg-neutral-50 dark:hover:bg-slate-800',
              sidebarCollapsed ? 'flex items-center justify-center' : '',
            ]"
            :title="sidebarCollapsed ? link.label : undefined"
          >
            <!-- Icon (always shown) -->
            <svg
              v-if="sidebarCollapsed"
              class="h-5 w-5 shrink-0"
              :class="route.path === link.to ? 'text-brand-600' : 'text-rs-muted'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="link.icon"
              />
            </svg>
            <!-- Expanded: Icon + text -->
            <template v-else>
              <div class="flex items-center gap-2.5">
                <svg
                  class="h-4 w-4 shrink-0"
                  :class="route.path === link.to ? 'text-brand-600' : 'text-rs-muted'"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    :d="link.icon"
                  />
                </svg>
                <div class="text-body-sm font-semibold">
                  {{ link.label }}
                </div>
              </div>
              <div class="mt-0.5 pl-6.5 text-body-sm text-rs-muted">
                {{ link.description }}
              </div>
            </template>
          </NuxtLink>
        </nav>
      </aside>

      <div class="flex min-h-screen min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-20 border-b border-rs-border bg-rs-surface/95 px-4 py-3 backdrop-blur md:px-6">
          <div class="flex items-center gap-3">
            <!-- Mobile hamburger -->
            <button
              type="button"
              class="rounded-lg border border-rs-border p-2 text-rs-muted hover:bg-neutral-50 lg:hidden"
              aria-label="Open navigation menu"
              @click="mobileNavOpen = !mobileNavOpen"
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
d="M4 6h16M4 12h16M4 18h16"
/>
              </svg>
            </button>

            <div class="min-w-0 flex-1">
              <div class="truncate text-body-sm font-semibold text-rs-fg">{{ userEmail }}</div>
              <div class="text-body-sm text-rs-muted">Ctrl/Cmd + K for command palette</div>
            </div>

            <span
class="rounded-full px-3 py-1 text-xs font-semibold"
:class="environmentBadge.className"
>
              {{ environmentBadge.label }}
            </span>

            <button
              type="button"
              class="rounded-lg bg-brand-600 px-3 py-2 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="isSigningOut"
              @click="handleSignOut"
            >
              {{ isSigningOut ? 'Signing out…' : 'Sign Out' }}
            </button>
          </div>
        </header>

        <!-- Mobile slide-over nav -->
        <Teleport to="body">
          <Transition name="mobile-nav-backdrop">
            <div
              v-if="mobileNavOpen"
              class="fixed inset-0 z-40 bg-black/40 lg:hidden"
              @click="mobileNavOpen = false"
            />
          </Transition>
          <Transition name="mobile-nav-panel">
            <nav
              v-if="mobileNavOpen"
              class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-rs-border bg-rs-surface shadow-xl lg:hidden"
            >
              <div class="flex items-center justify-between border-b border-rs-border p-4">
                <span class="text-body-sm font-semibold uppercase tracking-wide text-rs-muted">Admin Console</span>
                <button
                  type="button"
                  class="rounded-md border border-rs-border p-1.5 text-rs-muted hover:bg-neutral-50 dark:hover:bg-slate-800"
                  aria-label="Close navigation menu"
                  @click="mobileNavOpen = false"
                >
                  <svg
class="h-4 w-4"
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
              <div class="flex-1 overflow-y-auto p-3">
                <NuxtLink
                  v-for="link in adminLinks"
                  :key="`mobile-${link.to}`"
                  :to="link.to"
                  class="mb-2 flex items-center gap-2.5 rounded-lg border px-3 py-2 text-body-sm transition-colors"
                  :class="route.path === link.to
                    ? 'border-brand-300 bg-brand-50 font-semibold text-rs-fg border-l-2 border-l-brand-600 dark:border-sky-700 dark:bg-sky-900/30'
                    : 'border-transparent text-rs-muted hover:border-rs-border hover:bg-neutral-50 dark:hover:bg-slate-800'"
                  @click="mobileNavOpen = false"
                >
                  <svg
                    class="h-4 w-4 shrink-0"
                    :class="route.path === link.to ? 'text-brand-600' : 'text-rs-muted'"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
stroke-linecap="round"
stroke-linejoin="round"
stroke-width="2"
:d="link.icon"
/>
                  </svg>
                  {{ link.label }}
                </NuxtLink>
              </div>
            </nav>
          </Transition>
        </Teleport>

        <main class="min-w-0 flex-1 px-4 py-6 md:px-6">
          <slot />
        </main>
      </div>
    </div>
    <AdminCommandPalette
      :open="commandPaletteOpen"
      :commands="commands"
      @close="commandPaletteOpen = false"
      @execute="executeCommand"
    />
  </div>
</template>

<style scoped>
.mobile-nav-backdrop-enter-active,
.mobile-nav-backdrop-leave-active {
  transition: opacity 200ms ease;
}
.mobile-nav-backdrop-enter-from,
.mobile-nav-backdrop-leave-to {
  opacity: 0;
}

.mobile-nav-panel-enter-active,
.mobile-nav-panel-leave-active {
  transition: transform 200ms ease;
}
.mobile-nav-panel-enter-from,
.mobile-nav-panel-leave-to {
  transform: translateX(-100%);
}
</style>
