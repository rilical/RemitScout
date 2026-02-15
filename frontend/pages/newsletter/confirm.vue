<template>
  <section class="min-h-screen bg-neutral-50 flex items-center justify-center px-6 py-12">
    <div class="max-w-xl w-full bg-surface border border-neutral-200 rounded-3xl p-8 text-center shadow-sm">
      <h1 class="text-h3 font-semibold text-neutral-900 mb-3">
        {{ title }}
      </h1>
      <p class="text-neutral-600 mb-6">
        {{ message }}
      </p>
      <NuxtLink
        to="/"
        class="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700"
      >
        Back to RemitScout
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()

const status = computed(() => String(route.query.status || 'success'))

const title = computed(() => {
  if (status.value === 'success') return 'Subscription confirmed'
  if (status.value === 'already_confirmed') return 'Already confirmed'
  if (status.value === 'expired') return 'Confirmation link expired'
  return 'Confirmation failed'
})

const message = computed(() => {
  if (status.value === 'success') {
    return 'Thanks for confirming. You are now subscribed to the RemitScout newsletter.'
  }
  if (status.value === 'already_confirmed') {
    return 'Your subscription is already active.'
  }
  if (status.value === 'expired') {
    return 'This confirmation link has expired. Please resubscribe.'
  }
  return 'We could not confirm your subscription. Please try again.'
})
</script>
