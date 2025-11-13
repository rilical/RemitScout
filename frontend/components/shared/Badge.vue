<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="badgeClasses"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';

interface Props {
  variant?: BadgeVariant;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
});

const badgeClasses = computed(() => {
  const variants = {
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 text-gray-700',
  };
  return variants[props.variant];
});
</script>
