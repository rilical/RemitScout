<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import MenuPanel from './MenuPanel.vue'
import ComparePanel from './panels/ComparePanel.vue'
import GuidesPanel from './panels/GuidesPanel.vue'
import ExpatsPanel from './panels/ExpatsPanel.vue'
import NavIcon from './NavIcon.vue'
import { NAV } from '~/config/nav'
import { useCompareForm } from '~/composables/useCompareForm'

const openMenu = ref<string | null>(null)
const mobileMenuOpen = ref(false)
const scrolled = ref(false)
const languageMenuOpen = ref(false)

const { compareUrl } = useCompareForm()

const currentLocale = ref('en')
const locales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
]

function toggleLanguageMenu() {
  languageMenuOpen.value = !languageMenuOpen.value
}

function selectLanguage(locale: string) {
  currentLocale.value = locale
  languageMenuOpen.value = false
  // TODO: Implement actual language switching logic
}

function closeLanguageMenu() {
  languageMenuOpen.value = false
}

function toggle(menuId: string) {
  openMenu.value = openMenu.value === menuId ? null : menuId
}

function close() {
  openMenu.value = null
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

function handleClickOutside(e: MouseEvent) {
  if (languageMenuOpen.value && !(e.target as HTMLElement).closest('.language-selector')) {
    closeLanguageMenu()
  }
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
  close()
  closeLanguageMenu()
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
          <div class="relative">
            <button
              data-menu-trigger
              class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-haspopup="true"
              :aria-expanded="openMenu==='compare'"
              @click="toggle('compare')"
            >
              Compare
            </button>
            <MenuPanel
              :open="openMenu==='compare'"
              width-class="w-[min(92vw,900px)]"
              @close="close"
            >
              <ComparePanel />
            </MenuPanel>
          </div>

          <!-- Guides -->
          <div class="relative">
            <button
              data-menu-trigger
              class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-haspopup="true"
              :aria-expanded="openMenu==='guides'"
              @click="toggle('guides')"
            >
              Guides
            </button>
            <MenuPanel
              :open="openMenu==='guides'"
              width-class="w-[min(92vw,900px)]"
              @close="close"
            >
              <GuidesPanel />
            </MenuPanel>
          </div>

          <!-- For Expats -->
          <div class="relative">
            <button
              data-menu-trigger
              class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-haspopup="true"
              :aria-expanded="openMenu==='expats'"
              @click="toggle('expats')"
            >
              For Expats
            </button>
            <MenuPanel
              :open="openMenu==='expats'"
              width-class="w-[min(92vw,900px)]"
              @close="close"
            >
              <ExpatsPanel />
            </MenuPanel>
          </div>

          <!-- Methodology -->
          <NuxtLink
            to="/methodology"
            class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Methodology
          </NuxtLink>
        </nav>
      </div>

      <!-- Right: Utility -->
      <div class="flex items-center gap-2">
        <!-- Language Selector (Desktop) -->
        <div class="relative hidden lg:block language-selector">
          <button
            class="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-md border border-slate-200 hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Select language"
            aria-haspopup="true"
            :aria-expanded="languageMenuOpen"
            @click.stop="toggleLanguageMenu"
          >
            <span class="text-base">{{ locales.find(l => l.code === currentLocale)?.flag || '🌐' }}</span>
            <span class="text-xs font-medium">{{ currentLocale.toUpperCase() }}</span>
            <svg
              class="h-3 w-3 transition-transform"
              :class="{ 'rotate-180': languageMenuOpen }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <!-- Language Dropdown -->
          <div
            v-if="languageMenuOpen"
            class="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-50 py-1"
            @click.stop
          >
            <button
              v-for="locale in locales"
              :key="locale.code"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              :class="{ 'bg-blue-50 text-blue-700': currentLocale === locale.code }"
              @click="selectLanguage(locale.code)"
            >
              <span class="text-lg">{{ locale.flag }}</span>
              <span class="flex-1 text-left">{{ locale.name }}</span>
              <span
                v-if="currentLocale === locale.code"
                class="text-blue-600"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>

        <!-- Compare CTA -->
        <NuxtLink
          :to="compareUrl"
          class="inline-flex items-center rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Compare providers
        </NuxtLink>

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

          <div class="px-4 py-6 space-y-6">
            <!-- Compare Section -->
            <div>
              <div class="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold px-3">
                Compare
              </div>
              <div class="space-y-2">
                <NuxtLink
                  v-for="c in NAV.compareCards"
                  :key="c.id"
                  :to="c.href"
                  class="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 motion-safe:transition"
                >
                  <div class="text-xl flex-shrink-0">
                    <NavIcon
                      :name="c.icon"
                      class="text-blue-600"
                    />
                  </div>
                  <div>
                    <div class="text-sm font-semibold">{{ c.title }}</div>
                    <div class="text-xs text-slate-500 mt-0.5">{{ c.subtitle }}</div>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <!-- Guides Section -->
            <div>
              <div class="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold px-3">
                Guides
              </div>
              <div class="space-y-2">
                <NuxtLink
                  v-for="g in NAV.guides"
                  :key="g.href"
                  :to="g.href"
                  class="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 motion-safe:transition"
                >
                  <div class="text-xl flex-shrink-0">
                    <NavIcon
                      :name="g.icon"
                      class="text-blue-600"
                    />
                  </div>
                  <div>
                    <div class="text-sm font-semibold">{{ g.title }}</div>
                    <div class="text-xs text-slate-500 mt-0.5">{{ g.subtitle }}</div>
                  </div>
                </NuxtLink>
                <div class="my-2 h-px bg-slate-200 mx-3" />
                <NuxtLink
                  to="/guides"
                  class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 motion-safe:transition"
                >
                  View all guides →
                </NuxtLink>
              </div>
            </div>

            <!-- For Expats Section -->
            <div>
              <div class="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold px-3">
                For Expats
              </div>
              <div class="space-y-2">
                <NuxtLink
                  v-for="p in NAV.expatPlaybooks"
                  :key="p.href"
                  :to="p.href"
                  class="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 motion-safe:transition"
                >
                  <div class="text-xl flex-shrink-0">
                    <NavIcon
                      :name="p.icon"
                      class="text-blue-600"
                    />
                  </div>
                  <div>
                    <div class="text-sm font-semibold">{{ p.title }}</div>
                    <div class="text-xs text-slate-500 mt-0.5">{{ p.subtitle }}</div>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <!-- Methodology -->
            <div>
              <NuxtLink
                to="/methodology"
                class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 motion-safe:transition"
              >
                Methodology
              </NuxtLink>
            </div>
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
