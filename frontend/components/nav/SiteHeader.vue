<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { NAV } from '~/config/nav';
import MenuPanel from './MenuPanel.vue';
import ComparePanel from './panels/ComparePanel.vue';
import GuidesPanel from './panels/GuidesPanel.vue';
import ExpatsPanel from './panels/ExpatsPanel.vue';
import NavIcon from './NavIcon.vue';
import { useCompareForm } from '~/composables/useCompareForm';

const openMenu = ref<string | null>(null);
const mobileMenuOpen = ref(false);
const scrolled = ref(false);

const { compareUrl } = useCompareForm();

function toggle(menuId: string) {
  openMenu.value = openMenu.value === menuId ? null : menuId;
}

function close() {
  openMenu.value = null;
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
  document.body.style.overflow = '';
}

function onScroll() {
  scrolled.value = window.scrollY > 2;
}

onMounted(() => {
  window.addEventListener('scroll', onScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
});

// Close mobile menu on route change
const route = useRoute();
watch(() => route.path, () => {
  closeMobileMenu();
  close();
});
</script>

<template>
  <header 
    :class="[
      'sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur motion-safe:transition-shadow',
      scrolled ? 'shadow-[0_1px_12px_rgba(0,0,0,0.05)]' : 'shadow-none'
    ]">
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white border border-slate-300 px-3 py-1.5 rounded-md text-sm font-medium z-[100] focus:outline-none focus:ring-2 focus:ring-blue-500">Skip to content</a>

    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Left: Logo -->
      <div class="flex items-center gap-8">
        <NuxtLink to="/" class="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-xl">💸</span>
          <span class="hidden sm:inline text-lg font-bold">
            <span class="text-blue-600">Remit</span><span class="text-neutral-900">Scout</span>
          </span>
        </NuxtLink>

        <!-- Primary nav (Desktop) -->
        <nav class="hidden md:flex items-center gap-2" aria-label="Primary navigation">
          <!-- Compare -->
          <div class="relative">
            <button 
              data-menu-trigger
              @click="toggle('compare')" 
              class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-haspopup="true" 
              :aria-expanded="openMenu==='compare'">
              Compare
            </button>
            <MenuPanel 
              :open="openMenu==='compare'" 
              width-class="w-[min(92vw,900px)]"
              @close="close">
              <ComparePanel />
            </MenuPanel>
          </div>

          <!-- Guides -->
          <div class="relative">
            <button 
              data-menu-trigger
              @click="toggle('guides')" 
              class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-haspopup="true" 
              :aria-expanded="openMenu==='guides'">
              Guides
            </button>
            <MenuPanel 
              :open="openMenu==='guides'"
              width-class="w-[min(92vw,900px)]"
              @close="close">
              <GuidesPanel />
            </MenuPanel>
          </div>

          <!-- For Expats -->
          <div class="relative">
            <button 
              data-menu-trigger
              @click="toggle('expats')" 
              class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-haspopup="true" 
              :aria-expanded="openMenu==='expats'">
              For Expats
            </button>
            <MenuPanel 
              :open="openMenu==='expats'"
              width-class="w-[min(92vw,900px)]"
              @close="close">
              <ExpatsPanel />
            </MenuPanel>
          </div>

          <!-- Methodology -->
          <NuxtLink 
            to="/methodology" 
            class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            Methodology
          </NuxtLink>
        </nav>
      </div>

      <!-- Right: Utility -->
      <div class="flex items-center gap-2">
        <!-- Search (Desktop) -->
        <button 
          class="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-md border border-slate-200 hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Search">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="text-xs text-slate-400">/</span>
        </button>

        <!-- Language (Desktop) -->
        <button 
          class="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-slate-700 rounded-md border border-slate-200 hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" 
          aria-label="Language">
          EN
        </button>

        <!-- Compare CTA -->
        <NuxtLink 
          :to="compareUrl"
          class="inline-flex items-center rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
          Compare providers
        </NuxtLink>

        <!-- Mobile menu button -->
        <button 
          @click="toggleMobileMenu"
          class="md:hidden inline-flex items-center rounded-md border border-slate-200 p-2 hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" 
          :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
          :aria-expanded="mobileMenuOpen">
          <svg v-if="!mobileMenuOpen" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
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
        leave-to-class="opacity-0">
        <div v-if="mobileMenuOpen" class="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm md:hidden" @click="closeMobileMenu" aria-hidden="true" />
      </Transition>

      <Transition
        enter-active-class="motion-safe:transition motion-safe:ease-out motion-safe:duration-300"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="motion-safe:transition motion-safe:ease-in motion-safe:duration-200"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full">
        <div 
          v-if="mobileMenuOpen"
          class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-xl overflow-y-auto md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation">
          
          <div class="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <span class="text-lg font-bold">
              <span class="text-blue-600">Remit</span><span class="text-neutral-900">Scout</span>
            </span>
            <button 
              @click="closeMobileMenu"
              class="rounded-md p-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close menu">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-4 py-6 space-y-6">
            <!-- Compare Section -->
            <div>
              <div class="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold px-3">Compare</div>
              <div class="space-y-2">
                <NuxtLink 
                  v-for="c in NAV.compareCards" 
                  :key="c.id" 
                  :to="c.href"
                  class="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 motion-safe:transition">
                  <div class="text-xl flex-shrink-0">
                    <NavIcon :name="c.icon" class="text-blue-600" />
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
              <div class="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold px-3">Guides</div>
              <div class="space-y-2">
                <NuxtLink 
                  v-for="g in NAV.guides" 
                  :key="g.href"
                  :to="g.href"
                  class="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 motion-safe:transition">
                  <div class="text-xl flex-shrink-0">
                    <NavIcon :name="g.icon" class="text-blue-600" />
                  </div>
                  <div>
                    <div class="text-sm font-semibold">{{ g.title }}</div>
                    <div class="text-xs text-slate-500 mt-0.5">{{ g.subtitle }}</div>
                  </div>
                </NuxtLink>
                <div class="my-2 h-px bg-slate-200 mx-3"></div>
                <NuxtLink 
                  to="/guides"
                  class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 motion-safe:transition">
                  View all guides →
                </NuxtLink>
              </div>
            </div>

            <!-- For Expats Section -->
            <div>
              <div class="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold px-3">For Expats</div>
              <div class="space-y-2">
                <NuxtLink 
                  v-for="p in NAV.expatPlaybooks" 
                  :key="p.href" 
                  :to="p.href"
                  class="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 motion-safe:transition">
                  <div class="text-xl flex-shrink-0">
                    <NavIcon :name="p.icon" class="text-blue-600" />
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
                class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 motion-safe:transition">
                Methodology
              </NuxtLink>
            </div>
          </div>

          <!-- Mobile Footer CTA -->
          <div class="border-t border-slate-200 p-4">
            <NuxtLink 
              :to="compareUrl"
              class="flex items-center justify-center w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 motion-safe:transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Compare providers
            </NuxtLink>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>
