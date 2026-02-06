<template>
  <div class="rounded-lg bg-slate-900 border border-slate-800 p-5 shadow-md">
    <div class="flex items-start gap-4">
      <div class="flex-shrink-0">
        <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600/20">
          <svg
            class="w-5 h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
      </div>
      <div class="flex-1">
        <h3 class="text-base font-semibold text-white mb-1.5">
          {{ title }}
        </h3>
        <p class="text-sm text-slate-400 leading-relaxed mb-4">
          {{ description }}
        </p>
        <NuxtLink
          :to="link"
          class="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors group"
        >
          <span>{{ linkText }}</span>
          <svg
            class="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
  link: string
  linkText?: string
}>()
</script>
