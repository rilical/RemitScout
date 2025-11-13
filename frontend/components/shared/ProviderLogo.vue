<template>
  <div class="inline-block">
    <NuxtImg
      :src="`/logos/${slug}.svg`"
      :alt="alt || slug"
      width="96"
      height="32"
      loading="lazy"
      :placeholder="[50, 25, 75, 5]"
      class="object-contain"
      @error="handleImageError"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  slug: string
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: undefined
})

const handleImageError = (event: Event) => {
  // Fallback to text-based logo if SVG fails to load
  const target = event.target as HTMLImageElement
  const fallback = document.createElement('div')
  fallback.className = 'w-24 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-600 font-medium text-sm'
  fallback.textContent = props.slug.charAt(0).toUpperCase()
  target.parentNode?.replaceChild(fallback, target)
}
</script>