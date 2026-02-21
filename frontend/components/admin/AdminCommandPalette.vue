<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

export type AdminCommand = {
  id: string
  label: string
  description: string
  keywords?: string[]
}

const props = defineProps<{
  open: boolean
  commands: AdminCommand[]
}>()

const emit = defineEmits<{
  close: []
  execute: [command: AdminCommand]
}>()

const query = ref('')
const selectedIndex = ref(0)
const searchInput = ref<HTMLInputElement | null>(null)

const filteredCommands = computed(() => {
  const value = query.value.trim().toLowerCase()
  if (!value) return props.commands

  return props.commands.filter((command) => {
    const haystack = [
      command.label,
      command.description,
      ...(command.keywords ?? []),
    ].join(' ').toLowerCase()

    return haystack.includes(value)
  })
})

const setSelected = (index: number) => {
  if (filteredCommands.value.length === 0) {
    selectedIndex.value = 0
    return
  }
  selectedIndex.value = Math.max(0, Math.min(index, filteredCommands.value.length - 1))
}

const executeSelected = () => {
  const selected = filteredCommands.value[selectedIndex.value]
  if (!selected) return
  emit('execute', selected)
}

watch(
  () => props.open,
  async (next) => {
    if (!next) {
      query.value = ''
      selectedIndex.value = 0
      return
    }

    await nextTick()
    searchInput.value?.focus()
  },
)

watch(
  filteredCommands,
  (next) => {
    if (!next.length) {
      selectedIndex.value = 0
      return
    }
    setSelected(selectedIndex.value)
  },
)

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    setSelected(selectedIndex.value + 1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    setSelected(selectedIndex.value - 1)
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    executeSelected()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] flex items-start justify-center bg-neutral-950/60 px-4 pt-24 backdrop-blur-sm"
      @click.self="emit('close')"
      @keydown="onKeyDown"
    >
      <div class="w-full max-w-2xl overflow-hidden rounded-xl border border-rs-border bg-rs-surface shadow-2xl">
        <div class="border-b border-rs-border p-3">
          <input
            ref="searchInput"
            v-model="query"
            type="text"
            placeholder="Jump to page or run an admin query…"
            class="w-full rounded-lg border border-rs-border bg-rs-bg px-3 py-2 text-body-sm text-rs-fg outline-none ring-brand-400 focus:ring-2"
          >
        </div>

        <div
          v-if="filteredCommands.length === 0"
          class="p-4 text-body-sm text-rs-muted"
        >
          No matching commands.
        </div>

        <ul
          v-else
          class="max-h-[380px] overflow-y-auto p-2"
        >
          <li
            v-for="(command, index) in filteredCommands"
            :key="command.id"
          >
            <button
              type="button"
              class="w-full rounded-lg px-3 py-2 text-left transition-colors"
              :class="index === selectedIndex ? 'bg-brand-50 text-rs-fg dark:bg-slate-800' : 'hover:bg-neutral-50 dark:hover:bg-slate-800/70'"
              @mouseenter="setSelected(index)"
              @click="emit('execute', command)"
            >
              <div class="text-body-sm font-semibold">{{ command.label }}</div>
              <div class="text-body-sm text-rs-muted">{{ command.description }}</div>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>
