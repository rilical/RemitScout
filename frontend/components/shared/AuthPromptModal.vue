<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        
        <!-- Modal -->
        <div class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <!-- Close button -->
          <button
            type="button"
            class="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            @click="close"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Icon -->
          <div class="mx-auto w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <!-- Content -->
          <div class="text-center mb-6">
            <h3 class="text-xl font-bold text-slate-900 mb-2">
              {{ title }}
            </h3>
            <p class="text-slate-600">
              {{ message }}
            </p>
          </div>

          <!-- Features list -->
          <div class="bg-slate-50 rounded-xl p-4 mb-6">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">With a free account you can:</p>
            <ul class="space-y-2">
              <li class="flex items-center gap-2 text-sm text-slate-700">
                <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Save corridors to your watchlist
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-700">
                <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Set rate alerts for your favorite routes
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-700">
                <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Track your transfer history
              </li>
            </ul>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-3">
            <button
              type="button"
              class="w-full h-12 rounded-xl bg-brand-600 font-semibold text-white hover:bg-brand-700 transition-colors"
              @click="handleSignIn"
            >
              Sign in
            </button>
            <button
              type="button"
              class="w-full h-12 rounded-xl border-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              @click="handleSignUp"
            >
              Create free account
            </button>
          </div>

          <p class="mt-4 text-center text-xs text-slate-500">
            No credit card required. Free forever.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  isOpen: boolean
  title?: string
  message?: string
  feature?: 'watchlist' | 'alert'
}>(), {
  title: 'Sign in to continue',
  message: 'Create a free account to unlock this feature.',
  feature: 'watchlist',
})

const emit = defineEmits<{
  close: []
}>()

const redirectUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return encodeURIComponent(window.location.pathname + window.location.search)
  }
  return ''
})

function close() {
  emit('close')
}

async function handleSignIn() {
  await navigateTo(`/sign-in?redirect=${redirectUrl.value}`)
}

async function handleSignUp() {
  await navigateTo(`/sign-up?redirect=${redirectUrl.value}`)
}
</script>

