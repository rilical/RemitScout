<template>
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-page-x">
    <div class="w-full max-w-md">
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
          Set a new password
        </h1>
        <p class="mt-2 text-body-sm text-neutral-600">
          Choose a strong password you can remember
        </p>
      </div>

      <div class="rounded-2xl border border-rs-border bg-surface p-8 shadow-xl">
        <div
          v-if="success"
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
            Password updated
          </p>
          <p class="text-body-sm text-success-700 mb-4">
            You can now sign in with your new password.
          </p>
          <NuxtLink
            to="/sign-in"
            class="inline-block text-body-sm font-semibold text-success-700 hover:text-success-800 underline"
          >
            Go to sign in
          </NuxtLink>
        </div>

        <div v-else>
          <div
            v-if="errorMessage"
            class="mb-4 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-body-sm text-danger-800"
          >
            {{ errorMessage }}
          </div>

          <form
            class="space-y-4"
            @submit.prevent="handlePasswordUpdate"
          >
            <div>
              <label
                for="password"
                class="block text-body-sm font-semibold text-neutral-700 mb-2"
              >
                New password
              </label>
              <input
                id="password"
                v-model="password"
                type="password"
                autocomplete="new-password"
                class="h-11 w-full rounded-lg border-2 border-neutral-300 bg-surface px-4 text-rs-fg placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                placeholder="••••••••"
                required
              >
              <div class="mt-2">
                <PasswordStrength
                  :model-value="password"
                  @update:valid="passwordValid = $event"
                />
              </div>
            </div>

            <div>
              <label
                for="confirm-password"
                class="block text-body-sm font-semibold text-neutral-700 mb-2"
              >
                Confirm password
              </label>
              <input
                id="confirm-password"
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                class="h-11 w-full rounded-lg border-2 border-neutral-300 bg-surface px-4 text-rs-fg placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                :class="{ 'border-danger-600': confirmPassword && password !== confirmPassword }"
                placeholder="••••••••"
                required
              >
              <p
                v-if="confirmPassword && password !== confirmPassword"
                class="mt-1.5 text-body-sm text-danger-600"
              >
                Passwords do not match
              </p>
            </div>

            <button
              type="submit"
              :disabled="loading || !isAuthenticated || !passwordValid || password !== confirmPassword"
              class="w-full rounded-lg bg-brand-600 px-4 py-3 text-body-sm font-semibold text-white hover:bg-brand-700 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Updating…' : 'Update password' }}
            </button>
          </form>
        </div>
      </div>

      <div class="mt-6 text-center text-body-sm text-rs-muted">
        Trouble with the link? Request a new reset email from
        <NuxtLink
          to="/forgot-password"
          class="text-brand-600 hover:text-brand-700"
        >Forgot password</NuxtLink>.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'

  const { updatePassword, ensureHydrated, isAuthenticated, isConfigured } = useAuth()
  const route = useRoute()
  const { public: { siteUrl, supabaseSuppressConfigError } } = useRuntimeConfig()

setSeo({
  title: 'Reset password | Remit-Scout',
  description: 'Set a new password for your Remit-Scout account.',
  canonical: `${siteUrl}${route.path}`,
  noindex: true,
})

const password = ref('')
const passwordValid = ref(false)
const confirmPassword = ref('')
const loading = ref(false)
const success = ref(false)
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  if (!isConfigured.value) {
    if (supabaseSuppressConfigError) {
      await navigateTo('/sign-in')
      return
    }
    errorMessage.value = 'Supabase is not configured.'
    return
  }

  const supabase = useSupabaseClient()
  if (!supabase) {
    errorMessage.value = 'Supabase client is not available.'
    return
  }

  const code = typeof route.query.code === 'string' ? route.query.code : null
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      errorMessage.value = error.message
      return
    }
  }

  await ensureHydrated()
  if (!isAuthenticated.value) {
    errorMessage.value = 'This reset link is invalid or expired.'
  }
})

async function handlePasswordUpdate() {
  errorMessage.value = null

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  const result = await updatePassword(password.value)
  loading.value = false

  if (!result.ok) {
    errorMessage.value = result.error || 'Unable to update password.'
    return
  }

  success.value = true
}
</script>
