<template>
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-page-x">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <NuxtLink
          to="/"
          class="inline-block"
        >
          <NuxtImg
            src="/png/SVG/LOGO.svg"
            alt="RemitScout"
            width="32"
            height="40"
            loading="eager"
            class="h-10 w-auto mx-auto mb-4 object-contain"
          />
        </NuxtLink>
        <h1 class="text-h2 font-bold text-rs-fg">
          Reset your password
        </h1>
        <p class="mt-2 text-body-sm text-neutral-600">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <!-- Main Card -->
      <div class="rounded-2xl border border-rs-border bg-surface p-8 shadow-xl">
        <!-- Success Message -->
        <div
          v-if="sent"
          class="rounded-xl border-2 border-primary-200 bg-primary-50 px-4 py-4 text-center"
        >
          <svg
            class="w-12 h-12 text-brand-600 mx-auto mb-2"
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
          <p class="text-body-sm font-semibold text-primary-900 mb-1">
            Check your email
          </p>
          <p class="text-body-sm text-brand-700 mb-4">
            We've sent a password reset link to {{ email }}
          </p>
          <NuxtLink
            to="/sign-in"
            class="inline-block text-body-sm font-semibold text-brand-700 hover:text-primary-800 underline"
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
            class="rounded-lg border border-danger-600 bg-danger-600 px-4 py-3 text-body-sm text-danger-600"
          >
            {{ errorMessage }}
          </div>
          <div>
            <label
              for="email"
              class="block text-body-sm font-semibold text-neutral-700 mb-2"
            >
              Email address
            </label>
            <input
              id="email"
              v-model.trim="email"
              type="email"
              autocomplete="email"
              class="h-11 w-full rounded-lg border-2 border-neutral-300 bg-surface px-4 text-rs-fg placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
              placeholder="you@example.com"
              required
            >
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-brand-600 px-4 py-3 text-body-sm font-semibold text-white hover:bg-brand-700 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:bg-neutral-300 disabled:cursor-not-allowed"
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
          class="text-body-sm text-neutral-600 hover:text-rs-fg flex items-center justify-center gap-2"
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
      <div class="mt-8 flex items-center justify-center gap-6 text-body-sm text-rs-muted">
        <NuxtLink
          to="/about"
          class="hover:text-neutral-700"
        >
          About
        </NuxtLink>
        <span>•</span>
        <NuxtLink
          to="/contact"
          class="hover:text-neutral-700"
        >
          Contact Us
        </NuxtLink>
        <span>•</span>
        <NuxtLink
          to="/plus"
          class="hover:text-neutral-700"
        >
          Remit-Scout Plus
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'

const { requestPasswordReset } = useAuth()
const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Forgot password | Remit-Scout',
  description: 'Request a password reset link for your Remit-Scout account.',
  canonical: `${siteUrl}${route.path}`,
  noindex: true,
})

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
</script>
