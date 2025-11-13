<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm px-4"
        @click.self="close"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          ref="modalContent"
          class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
          @keydown.esc="close"
        >
          <button
            @click="close"
            class="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-600 rounded-lg p-1"
            aria-label="Close modal"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 id="modal-title" class="text-2xl font-bold text-neutral-900 mb-4">
            {{ STR.methodology.h2 }}
          </h2>

          <div class="space-y-4 text-neutral-700 leading-relaxed">
            <p v-for="(line, index) in STR.methodology.lines" :key="index">
              {{ line }}
            </p>
          </div>

          <NuxtLink
            to="/methodology"
            class="inline-flex items-center gap-2 mt-6 text-brand-600 hover:text-brand-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 rounded"
            @click="close"
          >
            {{ STR.methodology.link }}
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>

          <button
            @click="close"
            class="mt-6 w-full min-h-btn bg-brand-600 text-white font-semibold rounded-btn hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
          >
            {{ STR.methodology.close }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const { STR } = useStrings();

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  'update:isOpen': [value: boolean];
}>();

const modalContent = ref<HTMLElement | null>(null);

const close = () => {
  emit('update:isOpen', false);
};

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    modalContent.value?.focus();
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>


