<template>
  <div class="inline-block">
    <NuxtImg
      :src="logoSrc"
      :alt="alt || slug"
      :class="[logoSize, 'object-contain']"
      :width="logoDimensions.width"
      :height="logoDimensions.height"
      :format="logoFormat"
      loading="lazy"
      @error="handleImageError"
    />
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
const logoDimensions = computed(() => {
  switch (props.size) {
    case 'small':
      return { width: 96, height: 32 }
    case 'large':
      return { width: 192, height: 64 }
    case 'xlarge':
      return { width: 240, height: 80 }
    case 'default':
    default:
      return { width: 144, height: 48 }
  }
})
const logoFormat = computed(() => {
  // Don't attempt raster format conversion for SVGs.
  return logoSrc.value.toLowerCase().endsWith('.svg') ? undefined : 'webp'
})

const handleImageError = (event: Event | string) => {
  if (typeof event === 'string') return
  // Fallback to text-based logo if image fails to load
  const target = event.target as HTMLImageElement
  if (!target) return
  const fallback = document.createElement('div')
  fallback.className = 'w-24 h-8 bg-neutral-200 rounded flex items-center justify-center text-neutral-600 font-medium text-body-sm'
  fallback.textContent = props.slug.charAt(0).toUpperCase()
  target.parentNode?.replaceChild(fallback, target)
}
</script>
