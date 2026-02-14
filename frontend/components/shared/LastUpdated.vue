<template>
  <div class="mt-8 rounded-lg border border-primary-200 bg-primary-50 p-4">
    <div class="flex items-center">
      <svg
        class="mr-2 h-5 w-5 text-primary-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
          clip-rule="evenodd"
        />
      </svg>
      <span class="font-medium text-primary-800">Last updated: {{ formattedDate }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  date: string
}

const props = defineProps<Props>()

const formattedDate = computed(() => {
  return new Date(props.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>
