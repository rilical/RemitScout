<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-body-sm font-medium"
    :class="badgeClasses"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline'

interface Props {
  variant?: BadgeVariant
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
})

const badgeClasses = computed(() => {
  const variants = {
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-neutral-100 text-neutral-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-danger-100 text-danger-800',
    outline: 'border border-neutral-300 text-neutral-700',
  }
  return variants[props.variant]
})
</script>
