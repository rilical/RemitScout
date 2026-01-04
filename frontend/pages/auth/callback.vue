<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center">
      <div v-if="errorMessage">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 class="text-lg font-semibold text-slate-900">Sign-in failed</h1>
        <p class="mt-2 text-sm text-slate-600">{{ errorMessage }}</p>
        <NuxtLink to="/sign-in" class="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
          Back to sign in
        </NuxtLink>
      </div>
      <div v-else>
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h1 class="text-lg font-semibold text-slate-900">Completing sign-in…</h1>
        <p class="mt-2 text-sm text-slate-600">Please wait while we verify your account.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { ensureHydrated, isConfigured } = useAuth()
const route = useRoute()

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
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.getSession()

  if (error) {
    errorMessage.value = error.message
    return
  }

  await ensureHydrated()

  const redirect = process.client
    ? sessionStorage.getItem('auth:redirect') || '/dashboard'
    : '/dashboard'

  if (process.client) {
    sessionStorage.removeItem('auth:redirect')
  }

  await navigateTo(redirect)
})

useHead({
  title: 'Signing in… | Remit-Scout',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
