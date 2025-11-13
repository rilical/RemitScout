<template>
  <section class="py-12 sm:py-16 bg-neutral-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">What people are saying</h2>
        <p class="text-lg text-neutral-600">Real stories from people who saved money on their transfers</p>
      </div>

      <div class="relative">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div
            v-for="(testimonial, index) in testimonials"
            :key="index"
            class="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col"
          >
            <div class="flex items-start gap-1 mb-5 text-amber-400">
              <svg v-for="star in 5" :key="star" class="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>

            <p class="text-neutral-700 mb-8 leading-relaxed text-base flex-grow">
              "{{ testimonial.quote }}"
            </p>

            <div class="border-t border-neutral-200 pt-5">
              <div class="font-bold text-neutral-900 text-base">{{ testimonial.name }}</div>
              <div class="text-sm text-neutral-600 mt-1.5">{{ testimonial.corridor }}</div>
              <div class="text-xs text-neutral-500 mt-1">{{ testimonial.useCase }}</div>
            </div>
          </div>
        </div>

      </div>

      <p class="mt-8 text-center text-xs text-neutral-500">
        {{ STR.testimonials.note }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { TESTIMONIALS } from '~/utils/constants';

const { STR } = useStrings();
const testimonials = TESTIMONIALS;
</script>
