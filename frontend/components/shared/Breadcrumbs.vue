<template>
  <nav class="mb-6 flex items-center space-x-2 text-sm text-gray-500" aria-label="Breadcrumb">
    <NuxtLink to="/" class="hover:text-gray-700">Home</NuxtLink>
    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fill-rule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clip-rule="evenodd"
      />
    </svg>
    <template v-for="(item, index) in filteredItems" :key="item.path">
      <NuxtLink v-if="index < filteredItems.length - 1" :to="item.path" class="hover:text-gray-700">
        {{ item.name }}
      </NuxtLink>
      <span v-else class="font-medium text-gray-900">{{ item.name }}</span>
      <svg v-if="index < filteredItems.length - 1" class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clip-rule="evenodd"
        />
      </svg>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface BreadcrumbItem {
  name: string;
  path: string;
}

const props = defineProps<{
  items: BreadcrumbItem[];
}>();

const filteredItems = computed(() => {
  return props.items.filter(item => item.path !== '/' && item.name !== 'Home');
});
</script>
