<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center">
      <div v-if="status === 'error'">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 class="text-lg font-semibold text-slate-900">Confirmation failed</h1>
        <p class="mt-2 text-sm text-slate-600">{{ errorMessage }}</p>
        <NuxtLink to="/sign-in" class="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
          Back to sign in
        </NuxtLink>
      </div>
      <div v-else-if="status === 'success'">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-lg font-semibold text-slate-900">Email confirmed</h1>
        <p class="mt-2 text-sm text-slate-600">Your account is ready. You can now sign in.</p>
        <NuxtLink to="/sign-in" class="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
          Continue to sign in
        </NuxtLink>
      </div>
      <div v-else>
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h1 class="text-lg font-semibold text-slate-900">Confirming email…</h1>
        <p class="mt-2 text-sm text-slate-600">Please wait while we finish verifying your account.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { ensureHydrated, isConfigured } = useAuth()
const route = useRoute()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  if (!isConfigured.value) {
    status.value = 'error'
    errorMessage.value = 'Supabase is not configured.'
    return
  }

  const supabase = useSupabaseClient()
  if (!supabase) {
    status.value = 'error'
    errorMessage.value = 'Supabase client is not available.'
    return
  }

  const tokenHash =
    (typeof route.query.token_hash === 'string' && route.query.token_hash) ||
    (typeof route.query.token === 'string' && route.query.token)

  const type = typeof route.query.type === 'string' ? route.query.type : 'signup'

  if (!tokenHash) {
    status.value = 'error'
    errorMessage.value = 'Missing confirmation token.'
    return
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as any,
  })

  if (error) {
    status.value = 'error'
    errorMessage.value = error.message
    return
  }

  await ensureHydrated()
  status.value = 'success'
})

useHead({
  title: 'Confirming email… | Remit-Scout',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
