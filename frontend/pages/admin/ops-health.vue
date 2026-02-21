<template>
  <div class="mx-auto w-full max-w-3xl rounded-2xl border border-rs-border bg-rs-surface p-6 text-body-sm text-rs-muted shadow-sm">
    Redirecting to the consolidated observer console...
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Admin: Ops Health | Remit-Scout',
  description: 'Legacy ops health route redirects to observer.',
})

onMounted(() => {
  void navigateTo('/admin/observer', { replace: true })
})
</script>
