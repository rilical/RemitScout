<template>
  <header class="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm" role="banner">
    <div class="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Logo -->
      <NuxtLink
        to="/"
        class="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
      >
        <span
          aria-hidden="true"
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-xl text-white shadow-md"
        >
          💸
        </span>
        <span class="text-2xl font-bold text-neutral-900">
          <span class="text-brand-600">Remit</span><span class="text-neutral-900">Scout</span>
        </span>
      </NuxtLink>

      <!-- Desktop Navigation - Centered with Mega Menu -->
      <nav class="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 transform items-center space-x-6 lg:flex" role="navigation" aria-label="Main navigation">
        <MegaMenu />
        
        <NuxtLink
          to="/guides"
          class="flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          :class="$route.path.startsWith('/guides') ? 'bg-blue-50 text-brand-600' : 'text-neutral-700 hover:bg-blue-50 hover:text-brand-600'"
        >
          <span aria-hidden="true" class="mr-2">📚</span>
          Guides
        </NuxtLink>
        
        <NuxtLink
          to="/about/methodology"
          class="flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          :class="$route.path.startsWith('/about') ? 'bg-blue-50 text-brand-600' : 'text-neutral-700 hover:bg-blue-50 hover:text-brand-600'"
        >
          <span aria-hidden="true" class="mr-2">⭐</span>
          Methodology
        </NuxtLink>
      </nav>

      <!-- Right Side Items -->
      <div class="flex items-center space-x-3">
        <NuxtLink
          to="/contact"
          class="hidden items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 lg:flex"
        >
          <span aria-hidden="true" class="mr-2">🙋</span>
          Help
        </NuxtLink>

        <div class="relative" ref="languageMenu">
          <button
            @click="languageOpen = !languageOpen"
            class="flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
          >
            <span aria-hidden="true" class="mr-2 text-lg">🌐</span>
            EN
            <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            v-if="languageOpen"
            class="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white py-2 shadow-xl"
          >
            <button
              class="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-primary-50 hover:text-primary-700"
              @click="setLanguage('en')"
            >
              <span aria-hidden="true" class="mr-3 text-lg">🇺🇸</span>
              English
            </button>
            <button class="flex w-full cursor-not-allowed items-center px-4 py-2 text-sm text-gray-400" disabled>
              <span aria-hidden="true" class="mr-3 text-lg">🇪🇸</span>
              Español (soon)
            </button>
            <button class="flex w-full cursor-not-allowed items-center px-4 py-2 text-sm text-gray-400" disabled>
              <span aria-hidden="true" class="mr-3 text-lg">🇫🇷</span>
              Français (soon)
            </button>
          </div>
        </div>

        <button
          class="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 lg:hidden"
          @click="toggleMobileMenu"
          :aria-expanded="mobileMenuOpen"
          :aria-controls="mobileMenuOpen ? 'mobile-menu' : undefined"
        >
          <span class="sr-only">Open main menu</span>
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile navigation -->
    <div v-if="mobileMenuOpen" id="mobile-menu" class="border-t border-gray-200 bg-white lg:hidden">
      <div class="space-y-2 px-4 py-6">
        <NuxtLink
          to="/send-money/us-to-in"
          class="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary-700"
          @click="closeMobileMenu"
        >
          💱 Compare
        </NuxtLink>
        <NuxtLink
          to="/providers"
          class="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary-700"
          @click="closeMobileMenu"
        >
          🏦 Providers
        </NuxtLink>
        <NuxtLink
          to="/learn"
          class="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary-700"
          @click="closeMobileMenu"
        >
          📚 Learn
        </NuxtLink>
        <NuxtLink
          to="/about"
          class="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary-700"
          @click="closeMobileMenu"
        >
          ℹ️ About
        </NuxtLink>

        <NuxtLink
          to="/contact"
          class="block rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-semibold text-gray-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
          @click="closeMobileMenu"
        >
          🙋 Help
        </NuxtLink>

        <div class="border-t border-gray-200 pt-4">
          <button
            @click="languageOpen = !languageOpen"
            class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-gray-700 hover:bg-gray-100"
          >
            <span class="font-medium">🌐 Language</span>
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="languageOpen" class="mt-2 space-y-2 rounded-lg border border-gray-200 bg-white p-3">
            <button
              class="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-primary-50 hover:text-primary-700"
              @click="setLanguage('en'); closeMobileMenu()"
            >
              🇺🇸 English
            </button>
            <button class="flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-400" disabled>
              🇪🇸 Español (soon)
            </button>
            <button class="flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-400" disabled>
              🇫🇷 Français (soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const languageOpen = ref(false)
const mobileMenuOpen = ref(false)

const languageMenu = ref<HTMLElement | null>(null)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const setLanguage = (code: string) => {
  languageOpen.value = false
  console.info(`Language changed to ${code}`)
}

const handleOutsideClick = (event: MouseEvent) => {
  if (languageMenu.value && !languageMenu.value.contains(event.target as Node)) {
    languageOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>
