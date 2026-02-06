<template>
  <div class="inline-flex items-center gap-1">
    <span>{{ label }}</span>
    <div class="relative group">
      <button
        type="button"
        class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300 transition-colors"
        :aria-label="`Learn about ${label}`"
        @click="showTooltip = !showTooltip"
        @mouseenter="showTooltip = true"
        @mouseleave="showTooltip = false"
      >
        <svg
          class="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      <!-- Tooltip -->
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="showTooltip"
          class="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-neutral-900 text-white text-xs rounded-lg shadow-lg"
        >
          <div class="relative">
            <p class="font-medium mb-1">
              {{ title }}
            </p>
            <p class="text-neutral-300">
              {{ description }}
            </p>

            <div
              v-if="formula"
              class="mt-2 p-2 bg-neutral-800 rounded"
            >
              <code class="text-xs text-green-400">{{ formula }}</code>
            </div>

            <NuxtLink
              v-if="methodologyLink"
              :to="methodologyLink"
              class="inline-block mt-2 text-brand-400 hover:text-brand-300 underline"
            >
              Full methodology →
            </NuxtLink>

            <!-- Arrow -->
            <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div class="w-2 h-2 bg-neutral-900 transform rotate-45" />
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  label: string
  title: string
  description: string
  formula?: string
  methodologyLink?: string
}

defineProps<Props>()

const showTooltip = ref(false)
</script>
