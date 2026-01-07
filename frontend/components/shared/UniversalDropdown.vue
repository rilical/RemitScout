<template>
  <div class="relative" ref="containerRef">
    <button
      type="button"
      :id="id"
      :disabled="disabled"
      :class="[
        'w-full rounded-lg border px-3 py-2 text-sm text-left flex items-center justify-between transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        isOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-300 hover:border-slate-400',
        disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-900',
        buttonClass
      ]"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
      @keydown.escape="close"
      @keydown.arrow-down.prevent="handleArrowDown"
      @keydown.arrow-up.prevent="handleArrowUp"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :aria-labelledby="labelId"
    >
      <span class="flex-1 truncate">
        <slot name="selected" :option="selectedOption.value?.option">
          {{ selectedLabel }}
        </slot>
      </span>
      <svg
        class="ml-2 h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="fixed z-[9999] mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
          :style="dropdownStyle"
          role="listbox"
          :aria-labelledby="labelId"
        >
          <button
            v-for="(option, index) in options"
            :key="getOptionValue(option, index)"
            type="button"
            :class="[
              'w-full px-3 py-2 text-sm text-left flex items-center transition-all',
              isSelected(option, index)
                ? getOptionValue(option, index) === 'sendScore'
                  ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 text-purple-900 font-semibold'
                  : 'bg-blue-50 text-blue-600 font-medium'
                : 'text-slate-900 hover:bg-slate-50',
              index === highlightedIndex && !isSelected(option, index) ? 'bg-slate-50' : '',
              getOptionValue(option, index) === 'sendScore' && !isSelected(option, index) ? 'hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-blue-50/50' : ''
            ]"
            role="option"
            :aria-selected="isSelected(option, index)"
            @mousedown.prevent="selectOption(option, index)"
            @touchstart.prevent="selectOption(option, index)"
            @mouseenter="highlightedIndex = index"
          >
            <slot name="option" :option="option" :index="index">
              {{ getOptionLabel(option, index) }}
            </slot>
          </button>
          <div v-if="options.length === 0" class="px-3 py-2 text-sm text-slate-500 text-center">
            No options available
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

export interface DropdownOption {
  label: string
  value: string | number
  [key: string]: any
}

interface Props {
  modelValue: string | number
  options: Array<DropdownOption | string>
  id?: string
  disabled?: boolean
  placeholder?: string
  buttonClass?: string
  getOptionLabel?: (option: DropdownOption | string, index: number) => string
  getOptionValue?: (option: DropdownOption | string, index: number) => string | number
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  disabled: false,
  placeholder: 'Select an option',
  buttonClass: '',
  getOptionLabel: undefined,
  getOptionValue: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const containerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const highlightedIndex = ref(-1)
const isMounted = ref(false)
const dropdownStyle = ref<{ top: string; left: string; width: string }>({
  top: '0px',
  left: '0px',
  width: '0px',
})

const labelId = computed(() => props.id ? `${props.id}-label` : undefined)

const defaultGetLabel = (option: DropdownOption | string): string => {
  if (typeof option === 'string') return option
  return option.label || String(option.value)
}

const defaultGetValue = (option: DropdownOption | string, index: number): string | number => {
  if (typeof option === 'string') return option
  return option.value ?? index
}

const getOptionLabel = (option: DropdownOption | string, index: number): string => {
  if (props.getOptionLabel) {
    return props.getOptionLabel(option, index)
  }
  return defaultGetLabel(option)
}

const getOptionValue = (option: DropdownOption | string, index: number): string | number => {
  if (props.getOptionValue) {
    return props.getOptionValue(option, index)
  }
  return defaultGetValue(option, index)
}

const selectedOption = computed(() => {
  if (!props.modelValue) return null
  
  const found = props.options.find((opt, idx) => {
    const value = getOptionValue(opt, idx)
    return value === props.modelValue
  })
  
  return found ? { option: found, index: props.options.indexOf(found) } : null
})

const selectedLabel = computed(() => {
  if (!props.modelValue) return props.placeholder
  
  if (selectedOption.value) {
    return getOptionLabel(selectedOption.value.option, selectedOption.value.index)
  }
  
  return props.placeholder
})

const isSelected = (option: DropdownOption | string, index: number): boolean => {
  const value = getOptionValue(option, index)
  return value === props.modelValue
}

function updateDropdownPosition() {
  if (!containerRef.value || !dropdownRef.value) return

  const containerRect = containerRef.value.getBoundingClientRect()
  const button = containerRef.value.querySelector('button')
  const buttonRect = button?.getBoundingClientRect() || containerRect
  
  dropdownStyle.value = {
    top: `${buttonRect.bottom + 4}px`,
    left: `${buttonRect.left}px`,
    width: `${buttonRect.width}px`,
  }
}

function toggle() {
  if (props.disabled) return
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

function open() {
  isOpen.value = true
  highlightedIndex.value = props.options.findIndex((opt, idx) => isSelected(opt, idx))
  nextTick(() => {
    updateDropdownPosition()
  })
}

function close() {
  isOpen.value = false
  highlightedIndex.value = -1
}

function selectOption(option: DropdownOption | string, index: number) {
  const value = getOptionValue(option, index)
  emit('update:modelValue', value)
  close()
}

function handleArrowDown() {
  if (!isOpen.value) {
    open()
    return
  }
  
  if (highlightedIndex.value < props.options.length - 1) {
    highlightedIndex.value++
  } else {
    highlightedIndex.value = 0
  }
  
  nextTick(() => {
    scrollToHighlighted()
  })
}

function handleArrowUp() {
  if (!isOpen.value) {
    open()
    return
  }
  
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  } else {
    highlightedIndex.value = props.options.length - 1
  }
  
  nextTick(() => {
    scrollToHighlighted()
  })
}

function scrollToHighlighted() {
  if (!dropdownRef.value) return
  
  const buttons = dropdownRef.value.querySelectorAll('button[role="option"]')
  const highlightedButton = buttons[highlightedIndex.value] as HTMLElement
    
  if (highlightedButton) {
    highlightedButton.scrollIntoView({ block: 'nearest' })
  }
}

function handleClickOutside(event: MouseEvent | TouchEvent) {
  if (!containerRef.value || !dropdownRef.value) return
  
  const target = event.target as Node
  if (!containerRef.value.contains(target) && !dropdownRef.value.contains(target)) {
    close()
  }
}

function handleResize() {
  if (isOpen.value) {
    updateDropdownPosition()
  }
}

function handleScroll(event: Event) {
  if (!isOpen.value || !dropdownRef.value) return
  
  const target = event.target as HTMLElement
  if (target && dropdownRef.value.contains(target)) {
    return
  }
  
  updateDropdownPosition()
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)
    document.addEventListener('scroll', handleScroll, true)
    nextTick(() => {
      updateDropdownPosition()
      if (highlightedIndex.value >= 0) {
        scrollToHighlighted()
      }
    })
  } else {
    document.removeEventListener('mousedown', handleClickOutside)
    document.removeEventListener('touchstart', handleClickOutside)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', handleScroll, true)
    document.removeEventListener('scroll', handleScroll, true)
  }
})

onMounted(() => {
  isMounted.value = true
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('touchstart', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleScroll, true)
  document.removeEventListener('scroll', handleScroll, true)
})
</script>
