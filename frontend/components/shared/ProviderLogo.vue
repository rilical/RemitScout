<template>
  <div
    :class="fit ? 'flex items-center justify-center w-full h-full' : 'inline-block max-w-full max-h-full'"
  >
    <img
      :src="logoSrc"
      :alt="alt || slug"
      :class="fit ? 'max-w-full max-h-full object-contain' : [logoSize, 'object-contain max-w-full max-h-full']"
      :width="logoDimensions.width"
      :height="logoDimensions.height"
      loading="lazy"
      decoding="async"
      @error="handleImageError"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getProviderLogoPath, getProviderLogoSize, getProviderLogoDimensions } from '~/composables/useProviderLogo'

interface Props {
  slug: string
  alt?: string
  size?: 'small' | 'default' | 'large' | 'xlarge'
  fit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  alt: undefined,
  size: 'default',
  fit: false,
})

const logoSrc = computed(() => getProviderLogoPath(props.slug))
const logoSize = computed(() => getProviderLogoSize(props.slug, props.size))
const logoDimensions = computed(() => {
  const dims = getProviderLogoDimensions(props.slug)
  switch (props.size) {
    case 'small':
      return dims
    case 'large':
      return { width: dims.width * 2, height: dims.height * 2 }
    case 'xlarge':
      return { width: Math.round(dims.width * 2.5), height: Math.round(dims.height * 2.5) }
    case 'default':
    default:
      return { width: Math.round(dims.width * 1.5), height: Math.round(dims.height * 1.5) }
  }
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
