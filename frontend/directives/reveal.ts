import type { Directive } from 'vue'
import { observeReveal, unobserveReveal } from '~/composables/useRevealObserver'

type RevealValue = {
  animation?: string
  delay?: number
  threshold?: number
} | number | undefined

function getAnimation(modifiers: Record<string, boolean>): string {
  if (modifiers['slide-left']) return 'slide-left'
  if (modifiers['slide-right']) return 'slide-right'
  if (modifiers['scale-in']) return 'scale-in'
  if (modifiers['fade-in']) return 'fade-in'
  if (modifiers['fade-up']) return 'fade-up'
  return 'fade-up'
}

export const vReveal: Directive<HTMLElement, RevealValue> = {
  mounted(el, binding) {
    const modifierAnimation = getAnimation(binding.modifiers as Record<string, boolean>)

    let animation = modifierAnimation
    let delay = 0
    let threshold: number | undefined

    if (typeof binding.value === 'number') {
      delay = binding.value
    } else if (binding.value && typeof binding.value === 'object') {
      animation = binding.value.animation || modifierAnimation
      delay = binding.value.delay || 0
      threshold = binding.value.threshold
    }

    observeReveal(el, animation, delay, threshold)
  },

  unmounted(el) {
    unobserveReveal(el)
  },
}
