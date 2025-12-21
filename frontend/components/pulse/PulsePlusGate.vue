<template>
  <div class="relative">
    <!-- Gated Content -->
    <div
      v-if="isGated"
      class="relative overflow-hidden rounded-xl"
    >
      <!-- Blurred Preview -->
      <div class="filter blur-sm pointer-events-none select-none opacity-50">
        <slot />
      </div>

      <!-- Lock Overlay -->
      <div class="absolute inset-0 flex items-center justify-center bg-neutral-900/80 backdrop-blur-sm">
        <div class="max-w-sm text-center p-6">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-600/20">
            <svg class="h-8 w-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">
            {{ title || 'Plus Feature' }}
          </h3>
          <p class="text-neutral-400 mb-4">
            {{ description || 'Unlock this feature with Remit-Scout Plus for advanced insights and data access.' }}
          </p>
          <NuxtLink
            to="/plus"
            class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Upgrade to Plus
          </NuxtLink>
          <div class="mt-4">
            <button
              v-if="showLearnMore"
              class="text-sm text-neutral-400 hover:text-white transition-colors"
              @click="$emit('learn-more')"
            >
              Learn more about Plus →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Ungated Content -->
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
interface Props {
  isGated: boolean
  title?: string
  description?: string
  showLearnMore?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'Plus Feature',
  description: 'Unlock this feature with Remit-Scout Plus.',
  showLearnMore: true,
})

defineEmits<{
  'learn-more': []
}>()
</script>
