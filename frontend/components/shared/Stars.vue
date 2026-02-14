<template>
  <div
    class="flex items-center space-x-1"
    :aria-label="`Rated ${rating} out of 5`"
  >
    <!-- Stars -->
    <svg
      v-for="star in count"
      :key="star"
      class="w-4 h-4"
      :class="getStarClass(star)"
      fill="currentColor"
      viewBox="0 0 20 20"
      role="img"
      :aria-label="star <= Math.floor(rating) ? 'Filled star' : 'Empty star'"
    >
      <path
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>

    <!-- Rating text -->
    <span class="ml-2 text-body-sm font-medium text-neutral-700">
      {{ rating.toFixed(1) }}/5
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rating?: number
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  rating: 0,
  count: 5,
})

const getStarClass = (starIndex: number) => {
  if (starIndex <= Math.floor(props.rating)) {
    return 'text-warning-400'
  }
  else if (starIndex === Math.ceil(props.rating) && props.rating % 1 !== 0) {
    return 'text-warning-400' // Partial star - for future enhancement
  }
  else {
    return 'text-neutral-300'
  }
}
</script>
