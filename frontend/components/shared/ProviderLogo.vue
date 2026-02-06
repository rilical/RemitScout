<template>
  <div class="inline-block">
    <img
      :src="logoSrc"
      :alt="alt || slug"
      :class="[logoSize, 'object-contain']"
      @error="handleImageError"
    >
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getProviderLogoPath, getProviderLogoSize } from '~/composables/useProviderLogo'

interface Props {
  slug: string
  alt?: string
  size?: 'small' | 'default' | 'large' | 'xlarge'
}

const props = withDefaults(defineProps<Props>(), {
  alt: undefined,
  size: 'default',
})

const logoSrc = computed(() => getProviderLogoPath(props.slug))
const logoSize = computed(() => getProviderLogoSize(props.slug, props.size))

const handleImageError = (event: Event | string) => {
  if (typeof event === 'string') return
  // Fallback to text-based logo if image fails to load
  const target = event.target as HTMLImageElement
  if (!target) return
  const fallback = document.createElement('div')
  fallback.className = 'w-24 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-600 font-medium text-sm'
  fallback.textContent = props.slug.charAt(0).toUpperCase()
  target.parentNode?.replaceChild(fallback, target)
}
</script>
