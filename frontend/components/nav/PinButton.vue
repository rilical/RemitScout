<template>
  <button
    type="button"
    @click.prevent="togglePin"
    :class="[
      'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all duration-150',
      isPinned
        ? 'bg-brand-100 text-brand-700 hover:bg-brand-200'
        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 opacity-0 group-hover:opacity-100'
    ]"
    :aria-label="isPinned ? 'Unpin from menu' : 'Pin to menu'"
    :title="isPinned ? 'Unpin from menu' : 'Pin to menu'"
  >
    <svg 
      :class="['h-3 w-3 transition-transform', isPinned ? 'rotate-45' : '']" 
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
    </svg>
    <span>{{ isPinned ? 'Pinned' : 'Pin' }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  itemId: string
  itemLabel: string
  itemHref: string
  tabId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  pinned: [value: boolean]
}>()

const pinnedItems = ref<Set<string>>(new Set())

const pinKey = computed(() => `${props.tabId}:${props.itemId}`)
const isPinned = computed(() => pinnedItems.value.has(pinKey.value))

const loadPinnedItems = () => {
  try {
    const stored = localStorage.getItem('remitscout_pinned_items')
    if (stored) {
      const parsed = JSON.parse(stored)
      pinnedItems.value = new Set(parsed)
    }
  } catch (error) {
    console.error('Failed to load pinned items:', error)
  }
}

const savePinnedItems = () => {
  try {
    const items = Array.from(pinnedItems.value)
    localStorage.setItem('remitscout_pinned_items', JSON.stringify(items))
    
    // Also save full item data for display
    const pinnedData = localStorage.getItem('remitscout_pinned_data')
    const data = pinnedData ? JSON.parse(pinnedData) : {}
    
    if (!data[props.tabId]) {
      data[props.tabId] = []
    }
    
    if (isPinned.value) {
      // Add item
      if (!data[props.tabId].find((item: any) => item.id === props.itemId)) {
        data[props.tabId].push({
          id: props.itemId,
          label: props.itemLabel,
          href: props.itemHref
        })
      }
    } else {
      // Remove item
      data[props.tabId] = data[props.tabId].filter((item: any) => item.id !== props.itemId)
    }
    
    localStorage.setItem('remitscout_pinned_data', JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save pinned items:', error)
  }
}

const togglePin = () => {
  if (isPinned.value) {
    pinnedItems.value.delete(pinKey.value)
  } else {
    pinnedItems.value.add(pinKey.value)
  }
  savePinnedItems()
  emit('pinned', isPinned.value)
}

onMounted(() => {
  loadPinnedItems()
})
</script>



