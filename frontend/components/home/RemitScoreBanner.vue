<template>
  <section class="py-4 sm:py-6 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-200 rounded-xl p-6">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-bold text-neutral-900 mb-2">
                What is Remit-Score?
              </h3>
              <p class="text-sm text-neutral-700 mb-3 max-w-3xl leading-relaxed">
                Our proprietary rating system evaluates providers on a 0-10 scale based on real transfer data, not reviews.
                Scores like <span class="font-bold text-brand-600">9.5</span>, <span class="font-bold text-brand-600">8.4</span>, or <span class="font-bold text-brand-600">7.2</span> reflect actual value, reliability, speed, support, and safety.
              </p>
              <button
                @click="showModal = true"
                class="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                Learn how we calculate Remit-Score
                <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <button
            @click="showModal = true"
            class="hidden sm:flex flex-shrink-0 px-4 py-2 bg-white border border-brand-300 hover:border-brand-600 text-brand-600 font-medium rounded-lg transition-colors text-sm"
          >
            View Details
          </button>
        </div>
      </div>
    </div>

    <RemitScoreModal :is-open="showModal" @update:is-open="showModal = $event" />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RemitScoreModal from '~/components/shared/RemitScoreModal.vue'

const showModal = ref(false)
</script>

