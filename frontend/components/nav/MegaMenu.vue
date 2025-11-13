<template>
  <div>
    <!-- Desktop Mega Menu -->
    <div class="hidden lg:block">
      <!-- Trigger Button -->
      <button
        ref="triggerRef"
        type="button"
        @click="toggleMenu"
        @keydown="handleTriggerKeydown"
        :class="[
          'inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150',
          isOpen
            ? 'bg-brand-600 text-white'
            : 'text-neutral-700 hover:bg-neutral-100'
        ]"
        :aria-expanded="isOpen"
        aria-haspopup="true"
        aria-label="Open navigation menu"
      >
        <span>{{ currentLabel }}</span>
        <svg
          :class="['h-4 w-4 transition-transform duration-200', isOpen ? 'rotate-180' : '']"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Mega Menu Panel -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="isOpen"
          ref="panelRef"
          class="absolute left-0 right-0 top-full z-50 mt-2"
          @keydown="handlePanelKeydown"
        >
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm" @click="closeMenu" />

          <!-- Panel Content -->
          <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="relative rounded-2xl border border-neutral-200 bg-white shadow-2xl">
              <!-- Tab Navigation -->
              <div class="border-b border-neutral-200 bg-neutral-50/50 rounded-t-2xl">
                <div class="flex items-center justify-between px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div
                      role="tablist"
                      class="inline-flex items-center rounded-lg bg-white border border-neutral-200 p-1"
                    >
                      <button
                        v-for="(tab, index) in compassNav"
                        :key="tab.id"
                        :ref="el => tabRefs[index] = el as HTMLButtonElement"
                        type="button"
                        role="tab"
                        :aria-selected="activeTabId === tab.id"
                        :aria-controls="`panel-${tab.id}`"
                        :tabindex="activeTabId === tab.id ? 0 : -1"
                        @click="selectTab(tab.id)"
                        @keydown="handleTabKeydown($event, index)"
                        :class="[
                          'px-4 py-2 text-sm font-semibold rounded-md transition-all duration-150 whitespace-nowrap',
                          activeTabId === tab.id
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                        ]"
                      >
                        <span class="mr-1.5">{{ tab.icon }}</span>
                        <span>{{ tab.label }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Search & Close -->
                  <div class="flex items-center gap-3">
                    <!-- Search Input -->
                    <div class="relative">
                      <input
                        ref="searchInputRef"
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search or press /"
                        class="w-64 px-4 py-2 pl-9 text-sm border border-neutral-200 rounded-lg focus:border-brand-600 focus:ring-1 focus:ring-brand-600 focus:outline-none"
                        @keydown.esc="searchQuery = ''; closeMenu()"
                      />
                      <svg
                        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <kbd
                        v-if="!searchQuery"
                        class="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs font-semibold text-neutral-400 bg-neutral-100 rounded border border-neutral-200"
                      >
                        /
                      </kbd>
                    </div>

                    <!-- Close Button -->
                    <button
                      type="button"
                      @click="closeMenu"
                      class="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
                      aria-label="Close menu"
                    >
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Tab Content -->
              <div class="p-6">
                <div
                  v-for="tab in compassNav"
                  :key="tab.id"
                  v-show="activeTabId === tab.id && !isSearching"
                  :id="`panel-${tab.id}`"
                  role="tabpanel"
                  :aria-labelledby="`tab-${tab.id}`"
                >
                  <MegaMenuTab :tab="tab" @navigate="closeMenu" />
                </div>

                <!-- Search Results -->
                <div v-if="isSearching" class="min-h-[400px]">
                  <div class="mb-4">
                    <p class="text-sm text-neutral-600">
                      <span class="font-semibold">{{ filteredResults.length }}</span> results in
                      <span class="font-semibold">{{ activeTab.label }}</span>
                    </p>
                  </div>

                  <div v-if="filteredResults.length > 0" class="space-y-1">
                    <NuxtLink
                      v-for="(result, index) in filteredResults"
                      :key="index"
                      :to="result.href"
                      class="group flex items-start gap-3 px-4 py-3 hover:bg-brand-50 rounded-lg transition-all duration-150"
                      @click="closeMenu"
                    >
                      <div class="flex-shrink-0 w-6 h-6 mt-0.5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-semibold">
                        {{ result.type === 'guide' ? '📖' : '🔗' }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors">
                          {{ result.label }}
                        </div>
                        <div class="text-xs text-neutral-500 mt-0.5">{{ result.type }}</div>
                      </div>
                      <svg class="flex-shrink-0 h-4 w-4 text-neutral-400 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </NuxtLink>
                  </div>

                  <div v-else class="text-center py-12">
                    <div class="text-4xl mb-3">🔍</div>
                    <p class="text-neutral-600">No results found for "{{ searchQuery }}"</p>
                    <p class="text-sm text-neutral-500 mt-2">Try a different search term or browse the guides below</p>
                  </div>
                </div>
              </div>

              <!-- Quick Tools Footer -->
              <div class="border-t border-neutral-200 bg-neutral-50/50 rounded-b-2xl px-6 py-4">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Quick tools</span>
                  <div class="flex items-center gap-3">
                    <NuxtLink
                      v-for="tool in quickTools"
                      :key="tool.href"
                      :to="tool.href"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-brand-600 hover:bg-white rounded-lg transition-all duration-150"
                      @click="closeMenu"
                    >
                      <span>{{ tool.icon }}</span>
                      <span>{{ tool.label }}</span>
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Mobile Menu (Accordion) -->
    <div class="lg:hidden">
      <button
        type="button"
        @click="toggleMobileMenu"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-all duration-150"
      >
        <span>Explore</span>
        <svg
          :class="['h-4 w-4 transition-transform duration-200', isMobileOpen ? 'rotate-180' : '']"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Mobile Panel -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="isMobileOpen" class="fixed inset-0 z-50 bg-white overflow-y-auto">
          <!-- Mobile Header -->
          <div class="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-4">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-lg font-bold text-neutral-900">Navigation</h2>
              <button
                type="button"
                @click="toggleMobileMenu"
                class="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100"
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <!-- Mobile Search -->
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="w-full px-4 py-2 text-sm border border-neutral-200 rounded-lg focus:border-brand-600 focus:ring-1 focus:ring-brand-600 focus:outline-none"
            />
          </div>

          <!-- Mobile Accordion -->
          <div class="px-4 py-4 space-y-2">
            <div
              v-for="tab in compassNav"
              :key="tab.id"
              class="border border-neutral-200 rounded-lg overflow-hidden"
            >
              <button
                type="button"
                @click="toggleMobileTab(tab.id)"
                class="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-neutral-50 transition-colors"
              >
                <div class="flex items-center gap-2">
                  <span class="text-xl">{{ tab.icon }}</span>
                  <span class="font-semibold text-neutral-900">{{ tab.label }}</span>
                </div>
                <svg
                  :class="['h-5 w-5 text-neutral-400 transition-transform', activeMobileTab === tab.id ? 'rotate-180' : '']"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <Transition
                enter-active-class="transition-all duration-200"
                enter-from-class="max-h-0"
                enter-to-class="max-h-[2000px]"
                leave-active-class="transition-all duration-200"
                leave-from-class="max-h-[2000px]"
                leave-to-class="max-h-0"
              >
                <div v-if="activeMobileTab === tab.id" class="border-t border-neutral-200 bg-neutral-50 p-4 space-y-4">
                  <!-- Primary Action -->
                  <NuxtLink
                    :to="tab.primary.href"
                    class="block w-full px-4 py-3 text-center bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors"
                    @click="toggleMobileMenu"
                  >
                    {{ tab.primary.label }}
                  </NuxtLink>

                  <!-- Guides -->
                  <div>
                    <h4 class="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Guides</h4>
                    <div class="space-y-1">
                      <NuxtLink
                        v-for="(guide, index) in tab.guides"
                        :key="index"
                        :to="guide.href"
                        class="block px-3 py-2 text-sm text-neutral-700 hover:text-brand-600 hover:bg-white rounded-lg transition-all"
                        @click="toggleMobileMenu"
                      >
                        {{ guide.label }}
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { compassNav, quickTools } from '~/config/compassNav'
import type { NavTab } from '~/config/compassNav'
import MegaMenuTab from './MegaMenuTab.vue'

const isOpen = ref(false)
const isMobileOpen = ref(false)
const activeTabId = ref(compassNav[0].id)
const activeMobileTab = ref<string | null>(null)
const searchQuery = ref('')
const triggerRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLDivElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const tabRefs = ref<HTMLButtonElement[]>([])

const activeTab = computed(() => {
  return compassNav.find(tab => tab.id === activeTabId.value) || compassNav[0]
})

const currentLabel = computed(() => {
  return activeTab.value.label
})

const isSearching = computed(() => searchQuery.value.length > 2)

const filteredResults = computed(() => {
  if (!isSearching.value) return []
  
  const query = searchQuery.value.toLowerCase()
  const results: Array<{ label: string; href: string; type: string }> = []
  
  // Search in guides
  activeTab.value.guides.forEach(guide => {
    if (guide.label.toLowerCase().includes(query)) {
      results.push({ ...guide, type: 'guide' })
    }
  })
  
  // Search in chips
  activeTab.value.chips.forEach(chip => {
    if (chip.label.toLowerCase().includes(query)) {
      results.push({ ...chip, type: 'quick link' })
    }
  })
  
  return results
})

const toggleMenu = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      // Focus first tab
      tabRefs.value[0]?.focus()
    })
  }
}

const closeMenu = () => {
  isOpen.value = false
  searchQuery.value = ''
  triggerRef.value?.focus()
}

const selectTab = (tabId: string) => {
  activeTabId.value = tabId
  searchQuery.value = '' // Clear search when switching tabs
}

const toggleMobileMenu = () => {
  isMobileOpen.value = !isMobileOpen.value
  if (!isMobileOpen.value) {
    activeMobileTab.value = null
  }
}

const toggleMobileTab = (tabId: string) => {
  activeMobileTab.value = activeMobileTab.value === tabId ? null : tabId
}

// Keyboard Navigation
const handleTriggerKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleMenu()
  }
}

const handleTabKeydown = (event: KeyboardEvent, currentIndex: number) => {
  let newIndex = currentIndex
  
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      newIndex = currentIndex > 0 ? currentIndex - 1 : compassNav.length - 1
      break
    case 'ArrowRight':
      event.preventDefault()
      newIndex = currentIndex < compassNav.length - 1 ? currentIndex + 1 : 0
      break
    case 'Home':
      event.preventDefault()
      newIndex = 0
      break
    case 'End':
      event.preventDefault()
      newIndex = compassNav.length - 1
      break
    case 'Escape':
      event.preventDefault()
      closeMenu()
      return
    default:
      return
  }
  
  activeTabId.value = compassNav[newIndex].id
  tabRefs.value[newIndex]?.focus()
}

const handlePanelKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

// Global keyboard shortcut for search
const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key === '/' && isOpen.value) {
    event.preventDefault()
    searchInputRef.value?.focus()
  }
}

// Click outside to close
const handleClickOutside = (event: MouseEvent) => {
  if (
    isOpen.value &&
    panelRef.value &&
    triggerRef.value &&
    !panelRef.value.contains(event.target as Node) &&
    !triggerRef.value.contains(event.target as Node)
  ) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  document.removeEventListener('click', handleClickOutside)
})

// Body scroll lock for mobile
watch(isMobileOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>



