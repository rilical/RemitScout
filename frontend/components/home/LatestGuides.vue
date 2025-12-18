<template>
  <section class="py-12 sm:py-16 bg-neutral-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
          Read Our Guides
        </h2>
        <p class="text-lg text-neutral-600">
          Everything you need to know about international money transfers
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <NuxtLink
          v-for="(guide, index) in guides"
          :key="index"
          :to="`/learn/${guide.slug}`"
          class="group bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden hover:border-brand-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <!-- Image/Icon Header -->
          <div
            class="relative h-40 bg-gradient-to-br overflow-hidden"
            :class="guide.gradient"
          >
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="transform group-hover:scale-110 transition-transform duration-300">
                <template v-if="isFlagEmoji(guide.emoji)">
                  <span class="text-6xl">{{ guide.emoji }}</span>
                </template>
                <template v-else-if="guide.emoji === '⚖️'">
                  <svg class="w-16 h-16 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </template>
                <template v-else-if="guide.emoji === '💰'">
                  <svg class="w-16 h-16 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </template>
                <template v-else-if="guide.emoji === '🏦'">
                  <svg class="w-16 h-16 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </template>
                <template v-else-if="guide.emoji === '🧭'">
                  <svg class="w-16 h-16 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </template>
                <template v-else-if="guide.emoji === '🛡️'">
                  <svg class="w-16 h-16 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </template>
                <template v-else-if="guide.emoji === '⏱️'">
                  <svg class="w-16 h-16 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </template>
                <template v-else>
                  <span class="text-6xl">{{ guide.emoji }}</span>
                </template>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-3 leading-snug group-hover:text-brand-600 transition-colors">
              {{ guide.title }}
            </h3>

            <p class="text-sm text-neutral-600 mb-4 leading-relaxed line-clamp-2">
              {{ guide.blurb }}
            </p>

            <div class="flex items-center gap-2 text-xs text-neutral-500 mb-4">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{{ guide.readTime }}</span>
              <span>·</span>
              <span>{{ guide.updated }}</span>
            </div>

            <div class="flex items-center text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
              <span>Read guide</span>
              <svg
                class="w-4 h-4 group-hover:translate-x-1 transition-transform"
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
            </div>
          </div>
        </NuxtLink>
      </div>

      <div class="text-center mt-12">
        <NuxtLink
          to="/learn"
          class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-lg hover:shadow-xl"
        >
          <span>View all guides</span>
          <svg
            class="w-5 h-5"
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
  </section>
</template>

<script setup lang="ts">
import { GUIDE_CARDS } from '~/utils/constants'

const { STR } = useStrings()
const guides = GUIDE_CARDS

const isFlagEmoji = (emoji: string) => {
  return emoji.includes('🇵🇭') || emoji.includes('🇺🇸') || emoji.includes('🇮🇳') || /[\u{1F1E6}-\u{1F1FF}]{2}/u.test(emoji)
}
</script>
