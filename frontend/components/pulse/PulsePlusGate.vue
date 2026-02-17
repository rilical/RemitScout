<template>
  <div class="relative">
    <!-- Gated Content -->
    <div
      v-if="isGated"
      class="relative overflow-hidden rounded-xl"
    >
      <!-- Blurred Preview -->
      <div class="filter blur-sm pointer-events-none select-none opacity-50">
        <slot name="preview">
          <div class="rounded-xl border border-neutral-700 bg-neutral-900/40 p-6">
            <div class="h-4 w-36 rounded bg-neutral-700/50" />
            <div class="mt-4 space-y-2">
              <div class="h-3 w-full rounded bg-neutral-800" />
              <div class="h-3 w-5/6 rounded bg-neutral-800" />
              <div class="h-3 w-2/3 rounded bg-neutral-800" />
            </div>
            <div class="mt-6 h-24 rounded-lg border border-neutral-700 bg-neutral-900/30" />
          </div>
        </slot>
      </div>

      <!-- Lock Overlay -->
      <div class="absolute inset-0 flex items-center justify-center bg-neutral-900/80 backdrop-blur-sm">
        <div class="max-w-sm text-center p-6">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-600/20">
            <svg
              class="h-8 w-8 text-brand-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 class="text-h4 font-bold text-white mb-2">
            {{ resolvedTitle }}
          </h3>
          <p class="text-neutral-400 mb-4">
            {{ resolvedDescription }}
          </p>
          <NuxtLink
            :to="resolvedCtaTo"
            class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            {{ resolvedCtaLabel }}
          </NuxtLink>
          <div class="mt-4">
            <button
              v-if="resolvedShowLearnMore"
              class="text-body-sm text-neutral-400 hover:text-white transition-colors"
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
import { computed } from 'vue'

interface Props {
  isGated: boolean
  title?: string
  description?: string
  showLearnMore?: boolean
  tier?: 'plus' | 'enterprise'
  ctaTo?: string
  ctaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  showLearnMore: true,
  tier: 'plus',
})

defineEmits<{
  'learn-more': []
}>()

const resolvedTitle = computed(() => {
  if (props.title) return props.title
  return props.tier === 'enterprise' ? 'Pulse Pro (Enterprise)' : 'Plus Feature'
})

const resolvedDescription = computed(() => {
  if (props.description) return props.description
  return props.tier === 'enterprise'
    ? 'Enterprise feature. Contact sales for access to institutional Pulse Pro analytics.'
    : 'Unlock this feature with Remit-Scout Plus for advanced insights and data access.'
})

const resolvedCtaTo = computed(() => {
  if (props.ctaTo) return props.ctaTo
  return props.tier === 'enterprise' ? '/contact?type=enterprise&topic=pulse' : '/plus'
})

const resolvedCtaLabel = computed(() => {
  if (props.ctaLabel) return props.ctaLabel
  return props.tier === 'enterprise' ? 'Contact sales' : 'Upgrade to Plus'
})

const resolvedShowLearnMore = computed(() => {
  if (props.tier === 'enterprise') return false
  return props.showLearnMore
})
</script>
