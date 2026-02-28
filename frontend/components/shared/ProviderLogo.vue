<template>
  <div
    :class="fit ? 'flex items-center justify-center w-full h-full' : 'inline-block max-w-full max-h-full'"
  >
    <img
      v-if="!allSourcesFailed"
      :src="activeLogoSrc"
      :alt="alt || slug"
      :class="fit ? 'max-w-full max-h-full object-contain' : [logoSize, 'object-contain max-w-full max-h-full']"
      :width="logoDimensions.width"
      :height="logoDimensions.height"
      loading="lazy"
      decoding="async"
      @error="handleImageError"
    >
    <div
      v-else
      class="w-24 h-8 bg-neutral-200 rounded flex items-center justify-center text-neutral-600 font-medium text-body-sm"
      :aria-label="`${alt || slug} logo fallback`"
    >
      {{ fallbackLetter }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getProviderLogoSources, getProviderLogoSize, getProviderLogoDimensions } from '~/composables/useProviderLogo'

interface Props {
  slug: string
  alt?: string
  size?: 'small' | 'default' | 'large' | 'xlarge'
  fit?: boolean
  source?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  alt: undefined,
  size: 'default',
  fit: false,
  source: null,
})

const logoSrcCandidates = computed(() => getProviderLogoSources(props.slug, props.source))
const activeSourceIndex = ref(0)
const allSourcesFailed = computed(() => activeSourceIndex.value >= logoSrcCandidates.value.length)
const activeLogoSrc = computed(() => {
  if (allSourcesFailed.value) return ''
  return logoSrcCandidates.value[activeSourceIndex.value] || ''
})
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
const fallbackLetter = computed(() => props.slug.charAt(0).toUpperCase())

watch([() => props.slug, () => props.source], () => {
  activeSourceIndex.value = 0
})

const handleImageError = (event: Event | string) => {
  if (typeof event === 'string') return
  activeSourceIndex.value += 1
}
</script>
