<template>
  <div class="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:border-brand-500 hover:shadow-2xl">
    <!-- Header Section with Gradient Background -->
    <div class="relative bg-gradient-to-br from-neutral-50 via-white to-brand-50/30 px-6 py-6">
      <!-- Logo and Name -->
      <div class="mb-6 grid grid-cols-[auto_1fr] gap-4 items-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-xl bg-white p-2 shadow-sm ring-1 ring-neutral-200">
          <ProviderLogo
            :slug="provider?.slug || ''"
            :alt="provider?.name"
            class="h-full w-auto object-contain"
          />
        </div>
        <div>
          <h3 class="text-2xl font-bold tracking-tight text-neutral-900">
            {{ provider?.name }}
          </h3>
        </div>
      </div>

      <!-- Remit-Scout Score Badge -->
      <div class="flex items-center gap-4">
        <div
          class="relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-4 bg-white shadow-lg transition-transform group-hover:scale-105"
          :style="{ borderColor: scoreColor }"
        >
          <div class="text-center">
            <div class="text-3xl font-bold leading-none" :class="scoreTextClass">
              {{ scoreDisplay }}
            </div>
          </div>
          <!-- Score Ring Animation -->
          <div class="absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100" :style="{ background: `radial-gradient(circle, ${scoreColor}15 0%, transparent 70%)` }"></div>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-sm font-bold uppercase tracking-wider" :class="scoreTextClass">Remit-Scout Score</span>
          <span class="text-xs font-medium text-neutral-500">Scored on 0-10 scale</span>
          <div class="mt-1 flex items-center gap-1">
            <div class="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200">
              <div 
                class="h-full transition-all duration-500"
                :class="scoreTextClass.replace('text-', 'bg-')"
                :style="{ width: `${(props.provider?.score || 0) * 10}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="px-6 py-6">
      <!-- Description -->
      <p class="mb-6 line-clamp-3 text-base leading-relaxed text-neutral-600">
        {{ provider?.description }}
      </p>

      <!-- Actions -->
      <div class="flex gap-3">
        <NuxtLink
          :to="`/learn/providers/${provider?.slug}`"
          class="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Read Review
        </NuxtLink>
        <a
          v-if="provider?.affiliateUrl || provider?.url"
          :href="provider?.affiliateUrl || provider?.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-300 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-700 transition-all hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Visit
          <svg
            class="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>

    <!-- Hover Accent Line -->
    <div class="absolute bottom-0 left-0 h-1 w-0 transition-all duration-300 group-hover:w-full" :style="{ backgroundColor: scoreColor }"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProviderLogo from '~/components/shared/ProviderLogo.vue'

interface Provider {
  id?: string
  slug: string
  name: string
  score?: number
  rating?: number
  reviewCount?: number
  description?: string
  countries?: number
  features?: string[]
  deliveryMethods?: string[]
  affiliateUrl?: string
  url?: string
  featured?: boolean
}

interface Props {
  provider?: Provider
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
})

const scoreDisplay = computed(() => {
  const score = props.provider?.score || 0
  return score.toFixed(1)
})

const scoreColor = computed(() => {
  const score = props.provider?.score || 0
  if (score >= 9.0) return '#10b981'
  if (score >= 8.0) return '#3b82f6'
  if (score >= 7.0) return '#eab308'
  return '#6b7280'
})

const scoreTextClass = computed(() => {
  const score = props.provider?.score || 0
  if (score >= 9.0) return 'text-green-600'
  if (score >= 8.0) return 'text-blue-600'
  if (score >= 7.0) return 'text-yellow-600'
  return 'text-neutral-600'
})

const scoreBorderClass = computed(() => {
  return 'border-4'
})
</script>
