<script setup lang="ts">
</script>

<template>
  <div class="bg-neutral-50 border-b border-rs-border">
    <div class="container">
      <div class="flex items-center justify-between py-2 text-body-sm">
        <div class="flex items-center gap-4 text-neutral-600">
          <span class="hidden sm:inline">💸 Compare current provider quotes from 30+ providers</span>
          <span class="sm:hidden">💸 Current quotes • 30+ providers</span>
        </div>

        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-1.5 text-neutral-600 hover:text-rs-fg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
            aria-label="Language"
          >
            <span>🌐</span>
            <span class="hidden sm:inline">EN</span>
          </button>

          <button
            class="flex items-center gap-1.5 text-neutral-600 hover:text-rs-fg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
            aria-label="Search"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span class="hidden lg:inline text-body-sm text-neutral-400">/</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
