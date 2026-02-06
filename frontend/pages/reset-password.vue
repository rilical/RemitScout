<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
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
          Set a new password
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          Choose a strong password you can remember
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div
          v-if="success"
          class="rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-4 text-center"
        >
          <svg
            class="w-12 h-12 text-emerald-600 mx-auto mb-2"
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
          <p class="text-sm font-semibold text-emerald-900 mb-1">
            Password updated
          </p>
          <p class="text-xs text-emerald-700 mb-4">
            You can now sign in with your new password.
          </p>
          <NuxtLink
            to="/sign-in"
            class="inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800 underline"
          >
            Go to sign in
          </NuxtLink>
        </div>

        <div v-else>
          <div
            v-if="errorMessage"
            class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
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
                class="block text-sm font-semibold text-slate-700 mb-2"
              >
                New password
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
              <label
                for="confirm-password"
                class="block text-sm font-semibold text-slate-700 mb-2"
              >
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
              <p
                v-if="confirmPassword && password !== confirmPassword"
                class="mt-1.5 text-xs text-red-600"
              >
                Passwords do not match
              </p>
            </div>

            <button
              type="submit"
              :disabled="loading || !isAuthenticated || password !== confirmPassword"
              class="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Updating…' : 'Update password' }}
            </button>
          </form>
        </div>
      </div>

      <div class="mt-6 text-center text-xs text-slate-500">
        Trouble with the link? Request a new reset email from
        <NuxtLink
          to="/forgot-password"
          class="text-blue-600 hover:text-blue-700"
        >Forgot password</NuxtLink>.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { updatePassword, ensureHydrated, isAuthenticated, isConfigured } = useAuth()
const route = useRoute()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const success = ref(false)
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  if (!isConfigured.value) {
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

useHead({
  title: 'Reset password | Remit-Scout',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
