<template>
  <div
    ref="containerRef"
    class="relative"
  >
    <button
      :id="id"
      type="button"
      :disabled="disabled"
      :class="[
        'w-full min-w-0 rounded-lg border px-3 py-2 text-body-sm text-left flex items-center justify-between transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        isOpen ? 'border-primary-500 ring-2 ring-primary-500' : 'border-neutral-300 hover:border-neutral-400',
        disabled ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed' : 'bg-surface text-rs-fg',
        buttonClass,
      ]"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :aria-labelledby="labelId"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
      @keydown.escape="close"
      @keydown.arrow-down.prevent="handleArrowDown"
      @keydown.arrow-up.prevent="handleArrowUp"
    >
      <span class="flex-1 min-w-0 truncate">
        <slot
          name="selected"
          :option="selectedOption?.option"
        >
          {{ selectedLabel }}
        </slot>
      </span>
      <svg
        class="ml-2 h-5 w-5 flex-shrink-0 text-neutral-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
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
          class="fixed z-modal mt-1 max-h-60 w-full overflow-hidden rounded-lg border border-rs-border bg-surface shadow-xl"
          :style="dropdownStyle"
          role="listbox"
          :aria-labelledby="labelId"
        >
          <div
            v-if="searchable"
            class="sticky top-0 bg-surface border-b border-rs-border px-3 py-2"
          >
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="w-full rounded-md border border-neutral-300 bg-surface px-2.5 py-1.5 text-body-sm text-rs-fg placeholder:text-rs-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              placeholder="Search…"
              @keydown.escape.stop="close"
              @keydown.arrow-down.prevent="handleArrowDown"
              @keydown.arrow-up.prevent="handleArrowUp"
              @keydown.enter.prevent="selectHighlightedOrFirst"
            >
          </div>
          <div class="max-h-52 overflow-auto py-1">
            <button
              v-for="(option, index) in filteredOptions"
              :key="getOptionValue(option, index)"
              type="button"
              :class="[
                'w-full px-3 py-2 text-body-sm text-left flex items-center transition-all',
                isOptionDisabled(option)
                  ? 'text-neutral-400 cursor-not-allowed'
                  : isSelected(option, index)
                    ? getOptionValue(option, index) === 'sendScore'
                      ? 'bg-gradient-to-r from-accent-600 to-primary-50 border-l-4 border-accent-600 text-accent-600 font-semibold'
                      : 'bg-primary-50 text-brand-600 font-medium'
                    : 'text-rs-fg hover:bg-neutral-50',
                index === highlightedIndex && !isSelected(option, index) && !isOptionDisabled(option) ? 'bg-neutral-50' : '',
                getOptionValue(option, index) === 'sendScore' && !isSelected(option, index) && !isOptionDisabled(option)
                  ? 'hover:bg-gradient-to-r hover:from-accent-600/50 hover:to-primary-50/50'
                  : '',
              ]"
              role="option"
              :aria-selected="isSelected(option, index)"
              :aria-disabled="isOptionDisabled(option)"
              @mousedown.prevent="handleOptionClick(option, index)"
              @touchstart.prevent="handleOptionClick(option, index)"
              @mouseenter="highlightedIndex = index"
            >
              <slot
                name="option"
                :option="option"
                :index="index"
              >
                {{ getOptionLabel(option, index) }}
              </slot>
            </button>
            <div
              v-if="filteredOptions.length === 0"
              class="px-3 py-2 text-body-sm text-rs-muted text-center"
            >
              {{ searchable && searchQuery ? 'No matches' : 'No options available' }}
            </div>
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

type NormalizedOption = DropdownOption & { __raw?: string }

interface Props {
  modelValue: string | number
  options: Array<DropdownOption | string>
  id?: string
  disabled?: boolean
  placeholder?: string
  buttonClass?: string
  searchable?: boolean
  getOptionLabel?: (option: DropdownOption | string, index: number) => string
  getOptionValue?: (option: DropdownOption | string, index: number) => string | number
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  disabled: false,
  placeholder: 'Select an option',
  buttonClass: '',
  searchable: false,
  getOptionLabel: undefined,
  getOptionValue: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const containerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)
const highlightedIndex = ref(-1)
const isMounted = ref(false)
const searchQuery = ref('')
const dropdownStyle = ref<{ top: string, left: string, width: string }>({
  top: '0px',
  left: '0px',
  width: '0px',
})

const labelId = computed(() => props.id ? `${props.id}-label` : undefined)

const normalizedOptions = computed<NormalizedOption[]>(() => {
  return props.options.map((option) => {
    if (typeof option === 'string') {
      return { label: option, value: option, __raw: option }
    }
    return option
  })
})

const filteredOptions = computed<NormalizedOption[]>(() => {
  if (!props.searchable || !searchQuery.value) return normalizedOptions.value
  const q = searchQuery.value.toLowerCase()
  return normalizedOptions.value.filter((opt) => {
    const label = opt.label || String(opt.value)
    return label.toLowerCase().includes(q)
  })
})

const defaultGetLabel = (option: NormalizedOption): string => {
  return option.label || String(option.value)
}

const defaultGetValue = (option: NormalizedOption, index: number): string | number => {
  return option.value ?? index
}

const getOptionLabel = (option: NormalizedOption, index: number): string => {
  if (props.getOptionLabel) {
    return props.getOptionLabel(option.__raw ?? option, index)
  }
  return defaultGetLabel(option)
}

const getOptionValue = (option: NormalizedOption, index: number): string | number => {
  if (props.getOptionValue) {
    return props.getOptionValue(option.__raw ?? option, index)
  }
  return defaultGetValue(option, index)
}

const isOptionDisabled = (option: NormalizedOption): boolean => {
  return Boolean(option.disabled)
}

const selectedOption = computed(() => {
  if (props.modelValue === undefined || props.modelValue === null || props.modelValue === '') {
    return null
  }

  const options = normalizedOptions.value
  const index = options.findIndex((opt, idx) => {
    const value = getOptionValue(opt, idx)
    return value === props.modelValue
  })

  return index >= 0 ? { option: options[index], index } : null
})

const selectedLabel = computed(() => {
  if (!props.modelValue) return props.placeholder

  if (selectedOption.value) {
    return getOptionLabel(selectedOption.value.option, selectedOption.value.index)
  }

  return props.placeholder
})

const isSelected = (option: NormalizedOption, index: number): boolean => {
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
  }
  else {
    open()
  }
}

function open() {
  isOpen.value = true
  searchQuery.value = ''
  highlightedIndex.value = filteredOptions.value.findIndex((opt, idx) => isSelected(opt, idx))
  nextTick(() => {
    updateDropdownPosition()
    if (props.searchable) searchInputRef.value?.focus()
  })
}

function close() {
  isOpen.value = false
  highlightedIndex.value = -1
  searchQuery.value = ''
}

function selectOption(option: NormalizedOption, index: number) {
  const value = getOptionValue(option, index)
  emit('update:modelValue', value)
  close()
}

function handleOptionClick(option: NormalizedOption, index: number) {
  if (isOptionDisabled(option)) return
  selectOption(option, index)
}

function selectHighlightedOrFirst() {
  const opts = filteredOptions.value
  if (opts.length === 0) return
  const idx = highlightedIndex.value >= 0 && highlightedIndex.value < opts.length
    ? highlightedIndex.value
    : 0
  const option = opts[idx]
  if (!isOptionDisabled(option)) selectOption(option, idx)
}

function handleArrowDown() {
  if (!isOpen.value) {
    open()
    return
  }

  if (highlightedIndex.value < filteredOptions.value.length - 1) {
    highlightedIndex.value++
  }
  else {
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
  }
  else {
    highlightedIndex.value = filteredOptions.value.length - 1
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

watch(searchQuery, () => {
  highlightedIndex.value = 0
})

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
  }
  else {
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
