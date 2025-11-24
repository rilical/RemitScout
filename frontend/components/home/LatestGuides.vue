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
              <div class="text-6xl transform group-hover:scale-110 transition-transform duration-300">
                {{ guide.emoji }}
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
</script>
