<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block">
          <img src="/png/SVG/LOGO.svg" alt="RemitScout" class="h-10 w-auto mx-auto mb-4">
        </NuxtLink>
        <h1 class="text-3xl font-bold text-slate-900">
          Welcome back
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          Sign in to access your watchlist, alerts, and more
        </p>
      </div>

      <!-- Main Card -->
      <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <!-- Success Message -->
        <div
          v-if="isLoggedIn"
          class="rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-4 text-center"
        >
          <svg class="w-12 h-12 text-emerald-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm font-semibold text-emerald-900 mb-1">
            Signed in successfully
          </p>
          <p class="text-sm text-emerald-700">
            {{ user?.email }}
          </p>
          <button
            type="button"
            class="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800 underline"
            @click="handleSignOut"
          >
            Sign out
          </button>
        </div>

        <!-- Sign In Form -->
        <div v-else>
          <div
            v-if="errorMessage"
            class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {{ errorMessage }}
          </div>
          <!-- Social Login Buttons -->
          <div class="space-y-3">
            <button
              type="button"
              class="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
              :disabled="loading"
              @click="handleSocialSignIn('google')"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <p class="mt-4 text-xs text-slate-500">
            Google sign-in is the only supported login method for now.
          </p>
        </div>
      </div>

      <!-- Sign Up Link -->
      <div v-if="!isLoggedIn" class="mt-6 text-center">
        <p class="text-sm text-slate-600">
          Don't have an account?
          <NuxtLink to="/sign-up" class="font-semibold text-blue-600 hover:text-blue-700">
            Sign up for free
          </NuxtLink>
        </p>
      </div>

      <!-- Quick Links -->
      <div class="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
        <NuxtLink to="/about" class="hover:text-slate-700">
          About
        </NuxtLink>
        <span>•</span>
        <NuxtLink to="/contact" class="hover:text-slate-700">
          Contact Us
        </NuxtLink>
        <span>•</span>
        <NuxtLink to="/plus" class="hover:text-slate-700">
          Remit-Scout Plus
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, isLoggedIn, signOut, signInWithOAuth } = useAuth()
const route = useRoute()

const loading = ref(false)
const errorMessage = ref<string | null>(null)

async function handleSignOut() {
  await signOut()
}

async function handleSocialSignIn(provider: 'google') {
  errorMessage.value = null
  loading.value = true
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
  const result = await signInWithOAuth(provider, redirect)
  loading.value = false

  if (!result.ok) {
    errorMessage.value = result.error || `Unable to sign in with ${provider}.`
  }
}

useHead({
  title: 'Sign in | Remit-Scout',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})
</script>
