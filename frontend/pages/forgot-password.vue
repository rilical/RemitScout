<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <NuxtLink
          to="/"
          class="inline-block"
        >
          <img
            src="/png/SVG/LOGO.svg"
            alt="RemitScout"
            class="h-10 w-auto mx-auto mb-4"
          >
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
          <svg
            class="w-12 h-12 text-blue-600 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
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
        <form
          v-else
          class="space-y-4"
          @submit.prevent="handleReset"
        >
          <div
            v-if="errorMessage"
            class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {{ errorMessage }}
          </div>
          <div>
            <label
              for="email"
              class="block text-sm font-semibold text-slate-700 mb-2"
            >
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

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Sending…' : 'Send reset link' }}
          </button>
        </form>
      </div>

      <!-- Back to Sign In -->
      <div
        v-if="!sent"
        class="mt-6 text-center"
      >
        <NuxtLink
          to="/sign-in"
          class="text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to sign in
        </NuxtLink>
      </div>

      <!-- Quick Links -->
      <div class="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
        <NuxtLink
          to="/about"
          class="hover:text-slate-700"
        >
          About
        </NuxtLink>
        <span>•</span>
        <NuxtLink
          to="/contact"
          class="hover:text-slate-700"
        >
          Contact Us
        </NuxtLink>
        <span>•</span>
        <NuxtLink
          to="/plus"
          class="hover:text-slate-700"
        >
          Remit-Scout Plus
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { requestPasswordReset } = useAuth()

const email = ref('')
const sent = ref(false)
const loading = ref(false)
const errorMessage = ref<string | null>(null)

async function handleReset() {
  errorMessage.value = null
  loading.value = true

  const result = await requestPasswordReset(email.value)
  loading.value = false

  if (!result.ok) {
    errorMessage.value = result.error || 'Unable to send reset link.'
    return
  }

  sent.value = true
}

useHead({
  title: 'Reset password | Remit-Scout',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})
</script>
