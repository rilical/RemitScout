<template>
  <section class="py-12 sm:py-16 bg-brand-600">
    <div class="container">
      <div class="text-center mb-12">
        <h2 class="text-h2 font-bold text-white mb-4">
          What people are saying
        </h2>
        <p class="text-body-lg text-white/90">
          Real stories from people who saved money on their transfers
        </p>
      </div>

      <div class="relative">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div
            v-for="(testimonial, index) in testimonials"
            :key="index"
            class="bg-surface rounded-2xl border border-neutral-200 p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col"
          >
            <div class="flex items-start gap-1 mb-5 text-warning-600">
              <svg
                v-for="star in 5"
                :key="star"
                class="w-5 h-5 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>

            <p class="text-neutral-700 mb-8 leading-relaxed text-body flex-grow">
              "{{ testimonial.quote }}"
            </p>

            <div class="border-t border-neutral-200 pt-5">
              <div class="font-bold text-neutral-900 text-body">
                {{ testimonial.name }}
              </div>
              <div class="text-body-sm text-neutral-600 mt-1.5">
                {{ testimonial.corridor }}
              </div>
              <div class="text-body-sm text-neutral-500 mt-1">
                {{ testimonial.useCase }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="mt-8 text-center text-body-sm text-white/80">
        {{ STR.testimonials.note }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { TESTIMONIALS } from '~/utils/constants'

const { STR } = useStrings()
const testimonials = TESTIMONIALS

// Generate Review schema
const reviewSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  'name': 'RemitScout Money Transfer Comparison',
  'description': 'Compare international money transfer services and save on fees',
  'brand': {
    '@type': 'Brand',
    'name': 'RemitScout',
  },
  'aggregateRating': {
    '@type': 'AggregateRating',
    'ratingValue': '5',
    'bestRating': '5',
    'worstRating': '1',
    'ratingCount': testimonials.length,
  },
  'review': testimonials.map(testimonial => ({
    '@type': 'Review',
    'author': {
      '@type': 'Person',
      'name': testimonial.name,
    },
    'reviewRating': {
      '@type': 'Rating',
      'ratingValue': '5',
      'bestRating': '5',
      'worstRating': '1',
    },
    'reviewBody': testimonial.quote,
    'datePublished': new Date().toISOString().split('T')[0],
  })),
}

// Inject JSON-LD schema into head
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(reviewSchema),
    },
  ],
})
</script>
