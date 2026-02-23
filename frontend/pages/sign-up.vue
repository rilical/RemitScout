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
          Create your account
        </h1>
        <p class="mt-2 text-body-sm text-neutral-600">
          Start comparing rates and saving money on transfers
        </p>
      </div>

      <!-- Main Card -->
      <div class="rounded-2xl border border-rs-border bg-surface p-8 shadow-xl">
        <!-- Sign Up Form -->
        <div>
          <div
            v-if="errorMessage"
            class="mb-4 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-body-sm text-danger-800"
          >
            {{ errorMessage }}
          </div>
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
              We sent a confirmation link to <span class="font-semibold">{{ email }}</span>. Confirm your email, then sign in.
            </p>
            <NuxtLink
              to="/sign-in"
              class="inline-block text-body-sm font-semibold text-brand-700 hover:text-primary-800 underline"
            >
              Continue to sign in
            </NuxtLink>
          </div>

          <div v-else>
            <!-- Email/Password -->
            <form
              class="space-y-4"
              @submit.prevent="handleEmailSignUp"
            >
              <div>
                <label
                  for="name"
                  class="block text-body-sm font-semibold text-neutral-700 mb-2"
                >
                  Name
                </label>
                <input
                  id="name"
                  v-model.trim="name"
                  type="text"
                  autocomplete="name"
                  required
                  maxlength="200"
                  class="h-11 w-full rounded-lg border-2 border-neutral-300 bg-surface px-4 text-rs-fg placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                  placeholder="Your name"
                >
              </div>
              <div>
                <label
                  for="email"
                  class="block text-body-sm font-semibold text-neutral-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  v-model.trim="email"
                  type="email"
                  autocomplete="email"
                  required
                  class="h-11 w-full rounded-lg border-2 border-neutral-300 bg-surface px-4 text-rs-fg placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                  placeholder="you@example.com"
                >
              </div>
              <div>
                <label
                  for="password"
                  class="block text-body-sm font-semibold text-neutral-700 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  autocomplete="new-password"
                  required
                  minlength="8"
                  class="h-11 w-full rounded-lg border-2 border-neutral-300 bg-surface px-4 text-rs-fg placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                  placeholder="At least 8 characters"
                >
                <div class="mt-2">
                  <PasswordStrength
                    :model-value="password"
                    @update:valid="passwordValid = $event"
                  />
                </div>
              </div>
              <label class="flex items-start gap-2 text-body-sm text-neutral-700">
                <input
                  id="terms"
                  v-model="termsAccepted"
                  type="checkbox"
                  required
                  class="mt-1 h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-600"
                >
                <span>
                  I agree to the
                  <NuxtLink
                    to="/terms"
                    class="font-semibold text-brand-600 hover:text-brand-700"
                  >Terms of Service</NuxtLink>
                  and
                  <NuxtLink
                    to="/privacy"
                    class="font-semibold text-brand-600 hover:text-brand-700"
                  >Privacy Policy</NuxtLink>.
                </span>
              </label>

              <button
                type="submit"
                :disabled="loading || !passwordValid"
                class="w-full rounded-lg bg-brand-600 px-4 py-3 text-body-sm font-semibold text-white hover:bg-brand-700 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:bg-neutral-300 disabled:cursor-not-allowed"
              >
                {{ loading ? 'Creating account…' : 'Create account' }}
              </button>
            </form>

            <!-- Divider -->
            <div class="my-6 flex items-center gap-4">
              <div class="h-px flex-1 bg-neutral-200" />
              <div class="text-body-sm font-semibold text-rs-muted">
                OR
              </div>
              <div class="h-px flex-1 bg-neutral-200" />
            </div>

            <!-- Social Sign Up Buttons -->
            <div class="space-y-3">
              <button
                type="button"
                class="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-neutral-300 bg-surface px-4 py-3 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all"
                :disabled="loading"
                @click="handleSocialSignUp('google')"
              >
                <svg
                  class="w-5 h-5"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Sign In Link -->
      <div class="mt-6 text-center">
        <p class="text-body-sm text-neutral-600">
          Already have an account?
          <NuxtLink
            to="/sign-in"
            class="font-semibold text-brand-600 hover:text-brand-700"
          >
            Sign in
          </NuxtLink>
        </p>
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

const { signInWithOAuth, signUp, isLoggedIn } = useAuth()
const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Sign up | Remit-Scout',
  description: 'Create a Remit-Scout account to save corridors, set alerts, and track providers.',
  canonical: `${siteUrl}${route.path}`,
  noindex: true,
})

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const sent = ref(false)
const name = ref('')
const email = ref('')
const password = ref('')
const passwordValid = ref(false)
const termsAccepted = ref(false)

async function handleEmailSignUp() {
  errorMessage.value = null
  loading.value = true
  sent.value = false

  if (!termsAccepted.value) {
    loading.value = false
    errorMessage.value = 'Please accept the Terms of Service and Privacy Policy.'
    return
  }

  const result = await signUp({ name: name.value, email: email.value, password: password.value })
  loading.value = false

  if (!result.ok) {
    errorMessage.value = result.error || 'Unable to create account.'
    return
  }

  // If Supabase email confirmation is enabled, the user will not be authenticated yet.
  if (!isLoggedIn.value) {
    sent.value = true
    return
  }

  await navigateTo('/dashboard')
}

async function handleSocialSignUp(provider: 'google') {
  errorMessage.value = null
  loading.value = true
  if (!termsAccepted.value) {
    loading.value = false
    errorMessage.value = 'Please accept the Terms of Service and Privacy Policy.'
    return
  }
  const result = await signInWithOAuth(provider)
  loading.value = false

  if (!result.ok) {
    errorMessage.value = result.error || `Unable to sign up with ${provider}.`
  }
}
</script>
