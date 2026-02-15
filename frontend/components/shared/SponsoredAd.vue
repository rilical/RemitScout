<template>
  <div
    v-if="!hidden"
    class="bg-surface rounded-xl border border-rs-border overflow-hidden"
    :class="containerClass"
  >
    <!-- Header -->
    <div
      v-if="label"
      class="flex items-center justify-between px-4 py-2 bg-neutral-50 border-b border-neutral-100"
    >
      <span class="text-body-sm text-neutral-400 uppercase tracking-wide font-medium">{{ label }}</span>
      <NuxtLink
        v-if="showRemoveLink"
        to="/plus"
        class="text-body-sm text-brand-600 hover:text-brand-700 font-medium"
      >
        Remove ads
      </NuxtLink>
    </div>

    <!-- Ad Content -->
    <div class="p-4">
      <!-- Horizontal Layout (default) -->
      <div
        v-if="layout === 'horizontal'"
        class="flex items-center gap-4"
      >
        <!-- Provider Logo -->
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-body-lg flex-shrink-0"
          :style="{ backgroundColor: ad.brandColor }"
        >
          {{ ad.logoLetter || ad.name.charAt(0) }}
        </div>

        <!-- Provider Info -->
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-rs-fg text-body-sm truncate">
            {{ ad.name }}
          </h4>
          <p class="text-body-sm text-rs-muted line-clamp-2">
            {{ ad.tagline }}
          </p>
          <div
            v-if="ad.rating"
            class="flex items-center gap-2 mt-1"
          >
            <div class="flex">
              <svg
                v-for="i in 5"
                :key="i"
                class="w-3.5 h-3.5"
                :class="i <= Math.floor(ad.rating) ? 'text-warning-600' : 'text-neutral-200'"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <span class="text-body-sm text-rs-muted">{{ ad.rating }} ({{ ad.reviewCount }})</span>
          </div>
        </div>

        <!-- CTA Button -->
        <NuxtLink
          v-if="isInternalUrl"
          :to="ad.url"
          class="flex-shrink-0 rounded-lg px-4 py-2.5 text-body-sm font-semibold text-white transition-colors"
          :style="{ backgroundColor: ad.brandColor }"
          @click="trackClick"
        >
          {{ ad.ctaText || 'Learn More' }}
        </NuxtLink>
        <a
          v-else
          :href="ad.url"
          target="_blank"
          rel="noopener sponsored"
          class="flex-shrink-0 rounded-lg px-4 py-2.5 text-body-sm font-semibold text-white transition-colors"
          :style="{ backgroundColor: ad.brandColor }"
          @click="trackClick"
        >
          {{ ad.ctaText || 'Learn More' }}
        </a>
      </div>

      <!-- Vertical Layout -->
      <div
        v-else-if="layout === 'vertical'"
        class="space-y-3"
      >
        <!-- Provider Header -->
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
            :style="{ backgroundColor: ad.brandColor }"
          >
            {{ ad.logoLetter || ad.name.charAt(0) }}
          </div>
          <div class="min-w-0">
            <h4 class="font-semibold text-rs-fg text-body-sm truncate">
              {{ ad.name }}
            </h4>
            <p class="text-body-sm text-rs-muted truncate">
              {{ ad.tagline }}
            </p>
          </div>
        </div>

        <!-- CTA Button -->
        <NuxtLink
          v-if="isInternalUrl"
          :to="ad.url"
          class="block w-full text-center rounded-lg px-4 py-2.5 text-body-sm font-semibold text-white transition-colors hover:opacity-90"
          :style="{ backgroundColor: ad.brandColor }"
          @click="trackClick"
        >
          {{ ad.ctaText || 'Learn More' }}
        </NuxtLink>
        <a
          v-else
          :href="ad.url"
          target="_blank"
          rel="noopener sponsored"
          class="block w-full text-center rounded-lg px-4 py-2.5 text-body-sm font-semibold text-white transition-colors hover:opacity-90"
          :style="{ backgroundColor: ad.brandColor }"
          @click="trackClick"
        >
          {{ ad.ctaText || 'Learn More' }}
        </a>
      </div>

      <!-- Compact Layout -->
      <div
        v-else-if="layout === 'compact'"
        class="flex items-center gap-3"
      >
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-body-sm flex-shrink-0"
          :style="{ backgroundColor: ad.brandColor }"
        >
          {{ ad.logoLetter || ad.name.charAt(0) }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-body-sm font-medium text-rs-fg truncate">
            {{ ad.name }}
          </p>
        </div>
        <NuxtLink
          v-if="isInternalUrl"
          :to="ad.url"
          class="text-body-sm font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap"
          @click="trackClick"
        >
          {{ ad.ctaText || 'View' }} →
        </NuxtLink>
        <a
          v-else
          :href="ad.url"
          target="_blank"
          rel="noopener sponsored"
          class="text-body-sm font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap"
          @click="trackClick"
        >
          {{ ad.ctaText || 'View' }} →
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface SponsoredAdData {
  id: string
  name: string
  tagline: string
  brandColor: string
  logoLetter?: string
  url: string
  ctaText?: string
  rating?: number
  reviewCount?: string
}

interface Props {
  ad: SponsoredAdData
  layout?: 'horizontal' | 'vertical' | 'compact'
  showRemoveLink?: boolean
  containerClass?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'horizontal',
  showRemoveLink: true,
  containerClass: '',
  label: 'Sponsored',
})

const emit = defineEmits<{
  click: [adId: string]
}>()

const hidden = ref(false)
const isInternalUrl = computed(() => props.ad.url.startsWith('/'))

const trackClick = () => {
  emit('click', props.ad.id)
}
</script>
