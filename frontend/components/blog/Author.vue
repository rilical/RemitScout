<template>
  <div class="rounded-2xl border border-neutral-200 bg-white p-6">
    <div class="flex items-start gap-4">
      <div
        v-if="avatar"
        class="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-neutral-100"
      >
        <img
          :src="avatar"
          :alt="name"
          class="w-full h-full object-cover"
        >
      </div>
      <div
        v-else
        class="flex-shrink-0 w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-600"
      >
        {{ name.charAt(0).toUpperCase() }}
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-bold text-neutral-900 mb-1">
          {{ name }}
        </h3>
        <p
          v-if="title"
          class="text-sm text-neutral-600 mb-2"
        >
          {{ title }}
        </p>
        <p
          v-if="bio"
          class="text-sm text-neutral-700 leading-relaxed mb-3"
        >
          {{ bio }}
        </p>
        <div
          v-if="social"
          class="flex items-center gap-3"
        >
          <a
            v-if="social.twitter"
            :href="social.twitter"
            target="_blank"
            rel="noopener noreferrer"
            class="text-neutral-400 hover:text-brand-600 transition-colors"
            aria-label="Twitter"
          >
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>
          <a
            v-if="social.linkedin"
            :href="social.linkedin"
            target="_blank"
            rel="noopener noreferrer"
            class="text-neutral-400 hover:text-brand-600 transition-colors"
            aria-label="LinkedIn"
          >
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Social {
  twitter?: string
  linkedin?: string
}

interface Props {
  name: string
  title?: string
  bio?: string
  avatar?: string
  social?: Social
}

defineProps<Props>()
</script>











