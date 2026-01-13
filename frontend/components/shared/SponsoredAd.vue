<template>
  <div
    v-if="!hidden"
    class="bg-white rounded-xl border border-slate-200 overflow-hidden"
    :class="containerClass"
  >
    <!-- Header -->
    <div
      v-if="label"
      class="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100"
    >
      <span class="text-xs text-slate-400 uppercase tracking-wide font-medium">{{ label }}</span>
      <NuxtLink
        v-if="showRemoveLink"
        to="/plus"
        class="text-xs text-blue-600 hover:text-blue-700 font-medium"
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
          class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          :style="{ backgroundColor: ad.brandColor }"
        >
          {{ ad.logoLetter || ad.name.charAt(0) }}
        </div>

        <!-- Provider Info -->
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-slate-900 text-sm truncate">{{ ad.name }}</h4>
          <p class="text-xs text-slate-500 line-clamp-2">{{ ad.tagline }}</p>
          <div v-if="ad.rating" class="flex items-center gap-2 mt-1">
            <div class="flex">
              <svg
                v-for="i in 5"
                :key="i"
                class="w-3.5 h-3.5"
                :class="i <= Math.floor(ad.rating) ? 'text-amber-400' : 'text-slate-200'"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <span class="text-xs text-slate-500">{{ ad.rating }} ({{ ad.reviewCount }})</span>
          </div>
        </div>

        <!-- CTA Button -->
        <a
          :href="ad.url"
          target="_blank"
          rel="noopener sponsored"
          class="flex-shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
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
            <h4 class="font-semibold text-slate-900 text-sm truncate">{{ ad.name }}</h4>
            <p class="text-xs text-slate-500 truncate">{{ ad.tagline }}</p>
          </div>
        </div>

        <!-- CTA Button -->
        <a
          :href="ad.url"
          target="_blank"
          rel="noopener sponsored"
          class="block w-full text-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
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
          class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          :style="{ backgroundColor: ad.brandColor }"
        >
          {{ ad.logoLetter || ad.name.charAt(0) }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-900 truncate">{{ ad.name }}</p>
        </div>
        <a
          :href="ad.url"
          target="_blank"
          rel="noopener sponsored"
          class="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
          @click="trackClick"
        >
          {{ ad.ctaText || 'View' }} →
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const trackClick = () => {
  emit('click', props.ad.id)
}
</script>


