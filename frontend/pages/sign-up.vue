<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block">
          <img src="/logos/remit-scout.svg" alt="RemitScout" class="h-10 w-auto mx-auto mb-4">
        </NuxtLink>
        <h1 class="text-3xl font-bold text-slate-900">
          Create your account
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          Start comparing rates and saving money on transfers
        </p>
      </div>

      <!-- Main Card -->
      <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <!-- Success Message -->
        <div
          v-if="success"
          class="rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-4 text-center"
        >
          <svg class="w-12 h-12 text-emerald-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm font-semibold text-emerald-900 mb-1">
            Account created successfully!
          </p>
          <p class="text-xs text-emerald-700 mb-4">
            Check your email for verification
          </p>
          <NuxtLink
            to="/sign-in"
            class="inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800 underline"
          >
            Go to sign in
          </NuxtLink>
        </div>

        <!-- Sign Up Form -->
        <div v-else>
          <!-- Social Sign Up Buttons -->
          <div class="space-y-3">
            <button
              type="button"
              class="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
              @click="handleSocialSignUp('google')"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </button>

            <button
              type="button"
              class="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-slate-900 bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-all"
              @click="handleSocialSignUp('apple')"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Sign up with Apple
            </button>
          </div>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-slate-500 font-medium">Or sign up with email</span>
            </div>
          </div>

          <!-- Email/Password Form -->
          <form class="space-y-4" @submit.prevent="handleSignUp">
            <div>
              <label for="name" class="block text-sm font-semibold text-slate-700 mb-2">
                Full name
              </label>
              <input
                id="name"
                v-model.trim="name"
                type="text"
                autocomplete="name"
                class="h-11 w-full rounded-lg border-2 border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-colors"
                placeholder="John Doe"
                required
              >
            </div>

            <div>
              <label for="email" class="block text-sm font-semibold text-slate-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                v-model.trim="email"
                type="email"
                autocomplete="email"
                class="h-11 w-full rounded-lg border-2 border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-colors"
                placeholder="you@example.com"
                required
              >
            </div>

            <div>
              <label for="password" class="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                v-model="password"
                type="password"
                autocomplete="new-password"
                class="h-11 w-full rounded-lg border-2 border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-colors"
                placeholder="••••••••"
                required
              >
              <p class="mt-1.5 text-xs text-slate-500">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <label for="confirm-password" class="block text-sm font-semibold text-slate-700 mb-2">
                Confirm password
              </label>
              <input
                id="confirm-password"
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                class="h-11 w-full rounded-lg border-2 border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-colors"
                :class="{ 'border-red-500': confirmPassword && password !== confirmPassword }"
                placeholder="••••••••"
                required
              >
              <p v-if="confirmPassword && password !== confirmPassword" class="mt-1.5 text-xs text-red-600">
                Passwords do not match
              </p>
            </div>

            <div class="flex items-start gap-2">
              <input
                id="terms"
                v-model="acceptTerms"
                type="checkbox"
                class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600/20"
                required
              >
              <label for="terms" class="text-xs text-slate-600">
                I agree to the <NuxtLink to="/terms" class="font-semibold text-blue-600 hover:text-blue-700">Terms of Service</NuxtLink> and <NuxtLink to="/privacy" class="font-semibold text-blue-600 hover:text-blue-700">Privacy Policy</NuxtLink>
              </label>
            </div>

            <!-- CAPTCHA -->
            <div class="rounded-lg border-2 border-slate-200 bg-slate-50 p-4">
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <input
                    id="captcha"
                    v-model="captchaChecked"
                    type="checkbox"
                    class="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    required
                  >
                  <label for="captcha" class="text-sm font-medium text-slate-700">
                    I'm not a robot
                  </label>
                </div>
                <div class="flex-shrink-0">
                  <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <p class="mt-2 text-xs text-slate-500">
                Protected by reCAPTCHA • <a href="https://policies.google.com/privacy" target="_blank" class="text-blue-600 hover:text-blue-700">Privacy</a> • <a href="https://policies.google.com/terms" target="_blank" class="text-blue-600 hover:text-blue-700">Terms</a>
              </p>
            </div>

            <button
              type="submit"
              :disabled="password !== confirmPassword || !captchaChecked"
              class="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Create account
            </button>
          </form>
        </div>
      </div>

      <!-- Sign In Link -->
      <div v-if="!success" class="mt-6 text-center">
        <p class="text-sm text-slate-600">
          Already have an account? 
          <NuxtLink to="/sign-in" class="font-semibold text-blue-600 hover:text-blue-700">
            Sign in
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
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const acceptTerms = ref(false)
const captchaChecked = ref(false)
const success = ref(false)

function handleSignUp() {
  // TODO: Implement Supabase sign up
  // const supabase = useSupabaseClient()
  // const { data, error } = await supabase.auth.signUp({
  //   email: email.value,
  //   password: password.value,
  //   options: {
  //     data: {
  //       full_name: name.value,
  //     },
  //   },
  // })
  
  console.log('Sign up:', { name: name.value, email: email.value })
  success.value = true
}

function handleSocialSignUp(provider: 'google' | 'apple') {
  // TODO: Implement Supabase OAuth
  // const supabase = useSupabaseClient()
  // await supabase.auth.signInWithOAuth({ provider })
  
  console.log(`Sign up with ${provider} - Supabase integration pending`)
  alert(`${provider} sign-up coming soon! Connect Supabase to enable social authentication.`)
}

useHead({
  title: 'Sign up | Remit-Scout',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})
</script>










