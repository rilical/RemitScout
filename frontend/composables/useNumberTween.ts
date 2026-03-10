import { ref, watch, type Ref } from 'vue'

export function useNumberTween(
  target: Ref<number>,
  options?: { duration?: number; easing?: (t: number) => number }
) {
  const display = ref(0)
  const duration = options?.duration ?? 800
  const easing = options?.easing ?? ((t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

  watch(
    target,
    (newVal, oldVal) => {
      const start = oldVal ?? 0
      const diff = newVal - start
      const startTime = performance.now()

      function tick(now: number) {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        display.value = start + diff * easing(progress)
        if (progress < 1) requestAnimationFrame(tick)
      }

      requestAnimationFrame(tick)
    },
    { immediate: true }
  )

  return display
}
