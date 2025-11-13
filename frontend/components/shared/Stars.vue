<template>
  <div class="flex items-center space-x-1" :aria-label="`Rated ${value} out of 5`">
    <!-- Stars -->
    <svg
      v-for="star in count"
      :key="star"
      class="w-4 h-4"
      :class="getStarClass(star)"
      fill="currentColor"
      viewBox="0 0 20 20"
      role="img"
      :aria-label="star <= Math.floor(value) ? 'Filled star' : 'Empty star'"
    >
      <path
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>

    <!-- Rating text -->
    <span class="ml-2 text-sm font-medium text-gray-700">
      {{ value.toFixed(1) }}/5
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  value: number
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 5
})

const getStarClass = (starIndex: number) => {
  if (starIndex <= Math.floor(props.value)) {
    return 'text-yellow-400'
  } else if (starIndex === Math.ceil(props.value) && props.value % 1 !== 0) {
    return 'text-yellow-400' // Partial star - for future enhancement
  } else {
    return 'text-gray-300'
  }
}
</script>
