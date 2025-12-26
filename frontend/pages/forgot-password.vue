<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block">
          <img src="/logos/remit-scout.svg" alt="RemitScout" class="h-10 w-auto mx-auto mb-4">
        </NuxtLink>
        <h1 class="text-3xl font-bold text-slate-900">
          Reset your password
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <!-- Main Card -->
      <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <!-- Success Message -->
        <div
          v-if="sent"
          class="rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-4 text-center"
        >
          <svg class="w-12 h-12 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p class="text-sm font-semibold text-blue-900 mb-1">
            Check your email
          </p>
          <p class="text-xs text-blue-700 mb-4">
            We've sent a password reset link to {{ email }}
          </p>
          <NuxtLink
            to="/sign-in"
            class="inline-block text-sm font-semibold text-blue-700 hover:text-blue-800 underline"
          >
            Back to sign in
          </NuxtLink>
        </div>

        <!-- Reset Form -->
        <form v-else class="space-y-4" @submit.prevent="handleReset">
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
            :disabled="!captchaChecked"
            class="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Send reset link
          </button>
        </form>
      </div>

      <!-- Back to Sign In -->
      <div v-if="!sent" class="mt-6 text-center">
        <NuxtLink to="/sign-in" class="text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to sign in
        </NuxtLink>
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
const email = ref('')
const captchaChecked = ref(false)
const sent = ref(false)

function handleReset() {
  // TODO: Implement Supabase password reset
  // const supabase = useSupabaseClient()
  // const { error } = await supabase.auth.resetPasswordForEmail(email.value)
  
  console.log('Password reset requested for:', email.value)
  sent.value = true
}

useHead({
  title: 'Reset password | Remit-Scout',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})
</script>










