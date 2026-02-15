<template>
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
    <div class="w-full max-w-md rounded-2xl border border-rs-border bg-surface p-8 shadow-xl text-center">
      <div v-if="errorMessage">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-600 text-danger-600">
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 class="text-body-lg font-semibold text-rs-fg">
          Sign-in failed
        </h1>
        <p class="mt-2 text-body-sm text-neutral-600">
          {{ errorMessage }}
        </p>
        <NuxtLink
          to="/sign-in"
          class="mt-4 inline-block text-body-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Back to sign in
        </NuxtLink>
      </div>
      <div v-else>
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-brand-600">
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <h1 class="text-body-lg font-semibold text-rs-fg">
          Completing sign-in…
        </h1>
        <p class="mt-2 text-body-sm text-neutral-600">
          Please wait while we verify your account.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'

const { ensureHydrated, isConfigured } = useAuth()
const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Signing in... | Remit-Scout',
  description: 'Completing sign-in for your Remit-Scout account.',
  canonical: `${siteUrl}${route.path}`,
  noindex: true,
})

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
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.getSession()

  if (error) {
    errorMessage.value = error.message
    return
  }

  await ensureHydrated()

  const redirect = import.meta.client
    ? sessionStorage.getItem('auth:redirect') || '/dashboard'
    : '/dashboard'

  if (import.meta.client) {
    sessionStorage.removeItem('auth:redirect')
  }

  await navigateTo(redirect)
})
</script>
