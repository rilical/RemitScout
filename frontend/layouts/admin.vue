<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import AdminCommandPalette, { type AdminCommand } from '~/components/admin/AdminCommandPalette.vue'

const route = useRoute()
const { user } = useAuth()
const { ensureAdminSession, signOutAdmin } = useAdminSession()
const runtimeConfig = useRuntimeConfig()

const sidebarCollapsed = ref(false)
const mobileNavOpen = ref(false)
const isDark = ref(false)
const commandPaletteOpen = ref(false)
const isSigningOut = ref(false)
const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined'

const adminLinks = [
  { to: '/admin', label: 'Overview', description: 'KPI summary + admin feed' },
  { to: '/admin/observer', label: 'Operations Center', description: 'Indices, sweeps, providers, queues' },
  { to: '/admin/analytics', label: 'Analytics', description: 'Traffic, provider CTR, engagement' },
  { to: '/admin/enterprise', label: 'Enterprise', description: 'User plan grants and revocations' },
  { to: '/admin/audit', label: 'Audit', description: 'Admin/security/compliance log stream' },
  { to: '/admin/gold-exports', label: 'Gold Exports', description: 'TEER/RCI/RVI snapshots' },
  { to: '/admin/institutional', label: 'Institutional', description: 'B2B client lifecycle + keys' },
  { to: '/admin/ads', label: 'Ads', description: 'Inventory and placement controls' },
  { to: '/admin/feature-flags', label: 'Feature Flags', description: 'Runtime flags with audience rules' },
]

const userEmail = computed(() => user.value?.email || 'admin@remit-scout.com')

const environmentBadge = computed(() => {
  const env = String((runtimeConfig.public as any).remitScoutEnv || 'dev').toLowerCase()
  if (env === 'production' || env === 'prod') return { label: 'PROD', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' }
  if (env === 'staging') return { label: 'STAGING', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' }
  return { label: 'DEV', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
})

const commands = computed<AdminCommand[]>(() => [
  ...adminLinks.map((link) => ({
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

const applyTheme = (nextDark: boolean) => {
  if (!isBrowser()) return
  document.documentElement.classList.toggle('dark', nextDark)
  try {
    window.localStorage.setItem('admin:theme', nextDark ? 'dark' : 'light')
  }
  catch {
    // ignore storage errors
  }
}

const ensureAdminSessionSafe = async () => {
  const ok = await ensureAdminSession()
  if (!ok) {
    await navigateTo('/sign-in')
  }
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
  () => {
    if (!route.path.startsWith('/admin')) return
    if (isBrowser()) {
      void ensureAdminSessionSafe()
    }
  },
)

watch(isDark, (next) => {
  applyTheme(next)
})

onMounted(() => {
  if (!route.path.startsWith('/admin')) return

  void ensureAdminSessionSafe()

  try {
    const stored = window.localStorage.getItem('admin:theme')
    isDark.value = stored === 'dark'
  }
  catch {
    isDark.value = false
  }
  applyTheme(isDark.value)

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
      <aside
        class="hidden border-r border-rs-border bg-rs-surface lg:flex lg:flex-col"
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
            class="rounded-md border border-rs-border px-2 py-1 text-body-sm text-rs-muted hover:bg-neutral-50 dark:hover:bg-slate-800"
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
            class="mb-2 block rounded-lg border px-3 py-2 transition-colors"
            :class="route.path === link.to
              ? 'border-brand-300 bg-brand-50 text-rs-fg dark:border-sky-700 dark:bg-sky-900/30'
              : 'border-transparent text-rs-muted hover:border-rs-border hover:bg-neutral-50 dark:hover:bg-slate-800'"
          >
            <div
              v-if="!sidebarCollapsed"
              class="text-body-sm font-semibold"
            >
              {{ link.label }}
            </div>
            <div
              v-if="!sidebarCollapsed"
              class="text-body-sm text-rs-muted"
            >
              {{ link.description }}
            </div>
            <div
              v-if="sidebarCollapsed"
              class="text-body-sm font-semibold"
            >
              {{ link.label.slice(0, 2) }}
            </div>
          </NuxtLink>
        </nav>
      </aside>

      <div class="flex min-h-screen min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-20 border-b border-rs-border bg-rs-surface/95 px-4 py-3 backdrop-blur md:px-6">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="rounded-lg border border-rs-border px-3 py-2 text-body-sm text-rs-muted hover:bg-neutral-50 dark:hover:bg-slate-800 lg:hidden"
              @click="mobileNavOpen = !mobileNavOpen"
            >
              Menu
            </button>

            <div class="min-w-0 flex-1">
              <div class="truncate text-body-sm font-semibold text-rs-fg">{{ userEmail }}</div>
              <div class="text-body-sm text-rs-muted">Ctrl/Cmd + K for command palette</div>
            </div>

            <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="environmentBadge.className">
              {{ environmentBadge.label }}
            </span>

            <button
              type="button"
              class="rounded-lg border border-rs-border px-3 py-2 text-body-sm text-rs-muted hover:bg-neutral-50 dark:hover:bg-slate-800"
              @click="isDark = !isDark"
            >
              {{ isDark ? 'Light' : 'Dark' }}
            </button>

            <button
              type="button"
              class="rounded-lg bg-brand-600 px-3 py-2 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="isSigningOut"
              @click="handleSignOut"
            >
              {{ isSigningOut ? 'Signing out…' : 'Sign Out' }}
            </button>
          </div>

          <nav
            v-if="mobileNavOpen"
            class="mt-3 grid gap-2 border-t border-rs-border pt-3 lg:hidden"
          >
            <NuxtLink
              v-for="link in adminLinks"
              :key="`mobile-${link.to}`"
              :to="link.to"
              class="rounded-lg border border-rs-border px-3 py-2 text-body-sm text-rs-fg hover:bg-neutral-50 dark:hover:bg-slate-800"
              @click="mobileNavOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>
        </header>

        <main class="min-w-0 flex-1 px-4 py-6 md:px-6">
          <slot />
        </main>
      </div>
    </div>
  </div>

  <AdminCommandPalette
    :open="commandPaletteOpen"
    :commands="commands"
    @close="commandPaletteOpen = false"
    @execute="executeCommand"
  />
</template>
