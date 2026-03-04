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
            src="/png/SVG/FULL_LOGO.svg"
            alt="RemitScout"
            width="32"
            height="40"
            loading="eager"
            class="h-10 w-auto mx-auto mb-4 object-contain"
          />
        </NuxtLink>
        <h1 class="text-h2 font-bold text-rs-fg">
          Welcome back
        </h1>
        <p class="mt-2 text-body-sm text-neutral-600">
          Sign in to access your watchlist, alerts, and more
        </p>
      </div>

      <!-- Main Card -->
      <div class="rounded-2xl border border-rs-border bg-surface p-8 shadow-xl">
        <!-- Success Message -->
        <div
          v-if="isLoggedIn"
          class="rounded-xl border-2 border-success-200 bg-success-50 px-4 py-4 text-center"
        >
          <svg
            class="w-12 h-12 text-success-600 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-body-sm font-semibold text-success-700 mb-1">
            Signed in successfully
          </p>
          <p class="text-body-sm text-success-700">
            {{ user?.email }}
          </p>
          <button
            type="button"
            class="mt-4 text-body-sm font-semibold text-success-700 hover:text-success-800 underline"
            @click="handleSignOut"
          >
            Sign out
          </button>
        </div>

        <!-- Sign In Form -->
        <div v-else>
          <div
            v-if="errorMessage"
            class="mb-4 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-body-sm text-danger-800"
          >
            {{ errorMessage }}
          </div>
          <!-- MFA Challenge -->
          <form
            v-if="mfaRequired"
            class="space-y-4"
            @submit.prevent="handleMfaVerify"
          >
            <div class="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-body-sm text-brand-700">
              Multi-factor authentication required. Enter your 6-digit code to continue.
            </div>
            <div>
              <label
                for="mfa-code"
                class="block text-body-sm font-semibold text-neutral-700 mb-2"
              >
                Authenticator code
              </label>
              <input
                id="mfa-code"
                v-model.trim="mfaCode"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                required
                class="h-11 w-full rounded-lg border-2 border-neutral-300 bg-surface px-4 text-rs-fg placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                placeholder="123456"
              >
            </div>

            <button
              type="submit"
              class="w-full rounded-lg bg-brand-600 px-4 py-3 text-body-sm font-semibold text-white hover:bg-brand-700 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:bg-neutral-300 disabled:cursor-not-allowed"
              :disabled="loading"
            >
              {{ loading ? 'Verifying…' : 'Verify' }}
            </button>
            <button
              type="button"
              class="w-full rounded-lg border-2 border-neutral-300 bg-surface px-4 py-3 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-all"
              @click="resetMfaState"
            >
              Back to sign in
            </button>

            <div class="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-body-sm text-neutral-700">
              Lost access to your authenticator device? Send a recovery email and continue from your verified inbox.
            </div>
            <button
              type="button"
              class="w-full rounded-lg border border-rs-border bg-surface px-4 py-3 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
              :disabled="loading || recoverySending"
              @click="sendMfaRecoveryEmail"
            >
              {{ recoverySending ? 'Sending recovery email…' : 'Send recovery email' }}
            </button>
            <p
              v-if="recoveryMessage"
              class="text-body-sm text-success-700"
            >
              {{ recoveryMessage }}
            </p>
          </form>

          <!-- Email/Password -->
          <form
            v-else
            class="space-y-4"
            @submit.prevent="handleEmailSignIn"
          >
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
                autocomplete="current-password"
                required
                minlength="8"
                class="h-11 w-full rounded-lg border-2 border-neutral-300 bg-surface px-4 text-rs-fg placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                placeholder="Your password"
              >
              <div class="mt-2 flex items-center justify-between">
                <NuxtLink
                  to="/forgot-password"
                  class="text-body-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Forgot password?
                </NuxtLink>
              </div>
            </div>

            <button
              type="submit"
              class="w-full rounded-lg bg-brand-600 px-4 py-3 text-body-sm font-semibold text-white hover:bg-brand-700 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:bg-neutral-300 disabled:cursor-not-allowed"
              :disabled="loading"
            >
              {{ loading ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>

          <!-- Divider -->
          <div
            v-if="!mfaRequired"
            class="my-6 flex items-center gap-4"
          >
            <div class="h-px flex-1 bg-neutral-200" />
            <div class="text-body-sm font-semibold text-rs-muted">
              OR
            </div>
            <div class="h-px flex-1 bg-neutral-200" />
          </div>

          <!-- Social Login Buttons -->
          <div
            v-if="!mfaRequired"
            class="space-y-3"
          >
            <button
              type="button"
              class="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-neutral-300 bg-surface px-4 py-3 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all"
              :disabled="loading"
              @click="handleSocialSignIn('google')"
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
              Continue with Google
            </button>
          </div>
        </div>
      </div>

      <!-- Sign Up Link -->
      <div
        v-if="!isLoggedIn"
        class="mt-6 text-center"
      >
        <p class="text-body-sm text-neutral-600">
          Don't have an account?
          <NuxtLink
            to="/sign-up"
            class="font-semibold text-brand-600 hover:text-brand-700"
          >
            Sign up for free
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

const {
  user,
  isLoggedIn,
  signOut,
  signIn,
  signInWithOAuth,
  requestPasswordReset,
  resolvePrimaryMfaFactor,
  startMfaChallenge,
  verifyMfaChallenge,
} = useAuth()
const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Sign in | Remit-Scout',
  description: 'Sign in to access your Remit-Scout dashboard, watchlist, and alerts.',
  canonical: `${siteUrl}${route.path}`,
  noindex: true,
})

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const email = ref('')
const password = ref('')
const mfaRequired = ref(false)
const mfaCode = ref('')
const mfaFactorId = ref<string | null>(null)
const mfaChallengeId = ref<string | null>(null)
const recoverySending = ref(false)
const recoveryMessage = ref<string | null>(null)

const isSafeRedirect = (url: string): boolean => {
  if (!url) return false
  if (url.startsWith('/') && !url.startsWith('//')) return true
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.origin === window.location.origin
  }
 catch {
    return false
  }
}

const getSafeRedirect = (): string => {
  const raw = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return isSafeRedirect(raw) ? raw : '/dashboard'
}

watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    navigateTo(getSafeRedirect())
  }
}, { immediate: true })

async function handleSignOut() {
  await signOut()
}

function resetMfaState() {
  mfaRequired.value = false
  mfaCode.value = ''
  mfaFactorId.value = null
  mfaChallengeId.value = null
  recoveryMessage.value = null
}

async function handleEmailSignIn() {
  errorMessage.value = null
  loading.value = true

  const redirect = getSafeRedirect()
  const result = await signIn(email.value, password.value)
  loading.value = false

  if (!result.ok && result.mfaRequired) {
    const factorId = result.factorId || (await resolvePrimaryMfaFactor())?.id || null
    if (!factorId) {
      errorMessage.value = 'Multi-factor authentication is required, but no MFA factor was found.'
      return
    }
    const challenge = await startMfaChallenge(factorId)
    if (!challenge.ok || !challenge.challengeId) {
      errorMessage.value = challenge.error || 'Unable to start MFA challenge.'
      return
    }
    mfaFactorId.value = factorId
    mfaChallengeId.value = challenge.challengeId
    mfaRequired.value = true
    recoveryMessage.value = null
    return
  }

  if (!result.ok) {
    errorMessage.value = result.error || 'Unable to sign in.'
    return
  }

  await navigateTo(redirect)
}

async function handleMfaVerify() {
  errorMessage.value = null
  if (!mfaFactorId.value || !mfaChallengeId.value) {
    errorMessage.value = 'MFA challenge is not ready. Please try signing in again.'
    return
  }
  loading.value = true
  const result = await verifyMfaChallenge(mfaFactorId.value, mfaChallengeId.value, mfaCode.value)
  loading.value = false

  if (!result.ok) {
    errorMessage.value = result.error || 'Unable to verify MFA code.'
    return
  }

  await navigateTo(getSafeRedirect())
}

async function sendMfaRecoveryEmail() {
  errorMessage.value = null
  recoveryMessage.value = null

  const targetEmail = email.value.trim().toLowerCase()
  if (!targetEmail) {
    errorMessage.value = 'Enter your email first to receive a recovery link.'
    return
  }

  recoverySending.value = true
  const result = await requestPasswordReset(targetEmail)
  recoverySending.value = false

  if (!result.ok) {
    errorMessage.value = result.error || 'Unable to start recovery flow.'
    return
  }

  recoveryMessage.value = 'Recovery email sent. Reset your password, then contact support if MFA reset is still required.'
}

async function handleSocialSignIn(provider: 'google') {
  errorMessage.value = null
  loading.value = true
  const redirect = getSafeRedirect()
  const result = await signInWithOAuth(provider, redirect)
  loading.value = false

  if (!result.ok) {
    errorMessage.value = result.error || `Unable to sign in with ${provider}.`
  }
}
</script>
