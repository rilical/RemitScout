<template>
  <div class="flex items-center gap-3">
    <img
      :src="authorImageUrl"
      :alt="author.name"
      class="w-8 h-8 rounded-full"
    >
    <div class="text-sm">
      <NuxtLink
        :to="`/author/${author.id}`"
        class="font-medium text-neutral-900 hover:text-brand-600 transition-colors"
      >
        {{ author.name }}
      </NuxtLink>
      <p class="text-xs text-neutral-600">
        {{ author.role }}
        <span
          v-if="showDate"
          class="mx-1"
        >·</span>
        <time
          v-if="showDate"
          :datetime="date"
        >{{ formattedDate }}</time>
        <span
          v-if="readTime"
          class="mx-1"
        >·</span>
        <span v-if="readTime">{{ readTime }} min read</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Author } from '~/utils/authors'
import { useAuthors } from '~/composables/useAuthors'

interface Props {
  author: Author
  date?: string
  readTime?: number
  showDate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDate: true,
})

const { getAuthorImageUrl } = useAuthors()

const authorImageUrl = computed(() => {
  return getAuthorImageUrl(props.author)
})

const formattedDate = computed(() => {
  if (!props.date) return ''
  const dateObj = new Date(props.date)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj)
})
</script>
