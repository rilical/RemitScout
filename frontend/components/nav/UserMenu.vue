<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { useEntitlements } from '~/composables/useEntitlements'

const { user, signOut } = useAuth()
const { isPlus } = useEntitlements()
const userMenuOpen = ref(false)

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function closeUserMenu() {
  userMenuOpen.value = false
}

function handleSignOut() {
  signOut()
  closeUserMenu()
  navigateTo('/')
}

function handleClickOutside(e: MouseEvent) {
  if (userMenuOpen.value && !(e.target as HTMLElement).closest('.user-menu')) {
    closeUserMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative user-menu">
    <button
      class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      @click.stop="toggleUserMenu"
    >
      <!-- Profile Picture or Initial -->
      <div class="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
        <img
          v-if="user?.avatar"
          :src="user.avatar"
          :alt="user?.name || 'Profile'"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold"
        >
          {{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}
        </div>
      </div>
      <span class="hidden sm:inline">
        {{ user?.name || 'Account' }}
      </span>
      <svg
        class="h-4 w-4 text-slate-600 transition-transform"
        :class="{ 'rotate-180': userMenuOpen }"
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

    <Transition
      enter-active-class="motion-safe:transition motion-safe:ease-out motion-safe:duration-150"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="motion-safe:transition motion-safe:ease-in motion-safe:duration-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="userMenuOpen"
        class="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg z-50 py-1"
        @click.stop
      >
        <div class="px-4 py-3 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <img
                v-if="user?.avatar"
                :src="user.avatar"
                :alt="user?.name || 'Profile'"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold"
              >
                {{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-slate-900 truncate">
                {{ user?.name }}
              </div>
              <div class="text-xs text-slate-500 truncate">
                {{ user?.email }}
              </div>
            </div>
          </div>
          <div
            v-if="isPlus"
            class="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
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
            Plus Member
          </div>
        </div>

        <div class="py-1">
          <NuxtLink
            to="/dashboard"
            class="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            @click="closeUserMenu"
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Dashboard
          </NuxtLink>

          <NuxtLink
            to="/dashboard?tab=account"
            class="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            @click="closeUserMenu"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </NuxtLink>
        </div>

        <div class="border-t border-slate-100 py-1">
          <button
            class="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
            @click="handleSignOut"
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>








