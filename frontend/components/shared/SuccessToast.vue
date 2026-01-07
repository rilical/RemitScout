<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div
        v-if="isVisible"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-3 shadow-2xl"
      >
        <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p class="font-semibold text-white">{{ title }}</p>
          <p v-if="message" class="text-sm text-slate-300">{{ message }}</p>
        </div>
        <button
          type="button"
          class="ml-2 p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          @click="hide"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  message?: string
  duration?: number
}>()

const emit = defineEmits<{
  hide: []
}>()

const isVisible = ref(false)
let timeoutId: ReturnType<typeof setTimeout> | null = null

function show() {
  isVisible.value = true
  if (timeoutId) clearTimeout(timeoutId)
  timeoutId = setTimeout(() => {
    hide()
  }, props.duration || 4000)
}

function hide() {
  isVisible.value = false
  emit('hide')
}

defineExpose({ show, hide })
</script>

