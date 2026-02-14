<template>
  <div
    class="fixed bottom-4 right-4 z-toast flex w-full max-w-sm flex-col gap-2"
    aria-live="polite"
    aria-relevant="additions removals"
  >
    <TransitionGroup
      enter-active-class="motion-safe:transition-all motion-safe:duration-300"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="motion-safe:transition-all motion-safe:duration-300"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
      move-class="motion-safe:transition-transform motion-safe:duration-300"
      tag="div"
      class="flex flex-col gap-2"
    >
      <div
        v-for="toast in visibleToasts"
        :key="toast.id"
        class="flex items-start gap-3 rounded-xl px-4 py-3 text-white shadow-lg"
        :class="bgClass(toast.type)"
        role="status"
      >
        <component
          :is="iconFor(toast.type)"
          class="h-5 w-5 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div class="min-w-0 flex-1 text-body-sm leading-snug">
          {{ toast.message }}
        </div>
        <button
          type="button"
          class="rounded-md p-1 text-white/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="Dismiss notification"
          @click="dismiss(toast.id)"
        >
          <XMarkIcon class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/vue/24/solid'
import { useToast } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

type ToastType = 'success' | 'error' | 'warning' | 'info'

const visibleToasts = computed(() => {
  const list = toasts.value || []
  return list.slice(Math.max(0, list.length - 3))
})

const iconFor = (type: ToastType) => {
  switch (type) {
    case 'success':
      return CheckCircleIcon
    case 'error':
    case 'warning':
      return ExclamationTriangleIcon
    case 'info':
    default:
      return InformationCircleIcon
  }
}

const bgClass = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-success-600'
    case 'error':
      return 'bg-danger-600'
    case 'warning':
      return 'bg-warning-600'
    case 'info':
    default:
      return 'bg-primary-600'
  }
}
</script>
