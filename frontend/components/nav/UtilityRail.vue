<script setup lang="ts">
</script>

<template>
  <div class="bg-slate-50 border-b border-slate-200">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between py-2 text-xs sm:text-sm">
        <div class="flex items-center gap-4 text-slate-600">
          <span class="hidden sm:inline">💸 Compare live rates from 30+ providers</span>
          <span class="sm:hidden">💸 Live rates • 30+ providers</span>
        </div>

        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-label="Language"
          >
            <span>🌐</span>
            <span class="hidden sm:inline">EN</span>
          </button>

          <button
            class="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
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
            <span class="hidden lg:inline text-xs text-slate-400">/</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
