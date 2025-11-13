<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

const props = withDefaults(defineProps<{
  open: boolean;
  align?: 'left' | 'right';
  widthClass?: string;
}>(), { 
  align: 'left', 
  widthClass: 'w-80' 
});

const emit = defineEmits(['close']);

const panelRef = ref<HTMLElement | null>(null);
let clickAwayEnabled = false;

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
}

function onClickAway(e: MouseEvent) {
  if (!clickAwayEnabled) return;
  
  const target = e.target as HTMLElement;
  const trigger = target.closest('[data-menu-trigger]');
  
  // Don't close if clicking the trigger button
  if (trigger) return;
  
  if (panelRef.value && !panelRef.value.contains(target)) {
    emit('close');
  }
}

// Watch for panel opening and delay click-away listener
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    clickAwayEnabled = false;
    // Enable click-away after a small delay to prevent immediate closure
    nextTick(() => {
      setTimeout(() => {
        clickAwayEnabled = true;
      }, 100);
    });
  } else {
    clickAwayEnabled = false;
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('mousedown', onClickAway);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('mousedown', onClickAway);
});
</script>

<template>
  <Transition
    enter-active-class="motion-safe:transition motion-safe:ease-out motion-safe:duration-150"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="motion-safe:transition motion-safe:ease-in motion-safe:duration-100"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95">
    <div
      v-if="open"
      ref="panelRef"
      :class="[
        'absolute top-full mt-3 z-50 rounded-2xl border border-slate-200 bg-white shadow-xl p-2',
        widthClass,
        align === 'right' ? 'right-0' : 'left-0'
      ]"
      role="menu"
      data-menu-panel
    >
      <slot />
    </div>
  </Transition>
</template>
