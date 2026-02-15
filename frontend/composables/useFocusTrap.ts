const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function isVisible(el: HTMLElement) {
  // Basic visibility check: avoids trapping focus on elements that are not rendered.
  return Boolean(el.offsetParent || el.getClientRects().length)
}

type ElementRefLike = { value: unknown }

function resolveHTMLElement(refLike: ElementRefLike): HTMLElement | null {
  const candidate = refLike.value
  if (candidate instanceof HTMLElement) return candidate

  // Vue template refs can point at a component instance; attempt to use its $el.
  const maybeEl = (candidate as any)?.$el
  return maybeEl instanceof HTMLElement ? maybeEl : null
}

export const useFocusTrap = (containerRef: ElementRefLike) => {
  let previouslyFocused: HTMLElement | null = null
  let activeContainer: HTMLElement | null = null
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null

  const getFocusable = () => {
    const container = resolveHTMLElement(containerRef)
    if (!container) return []
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible)
  }

  const focusFirst = () => {
    const container = resolveHTMLElement(containerRef)
    if (!container) return

    const focusable = getFocusable()
    if (focusable.length > 0) {
      focusable[0].focus()
      return
    }

    // Fallback: allow focusing the container itself.
    container.focus()
  }

  const activate = () => {
    if (typeof document === 'undefined') return
    const container = resolveHTMLElement(containerRef)
    if (!container) return

    activeContainer = container
    previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null

    keydownHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusable = getFocusable()
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        if (active === first || !(active instanceof HTMLElement) || !container.contains(active)) {
          e.preventDefault()
          last.focus()
        }
        return
      }

      if (active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', keydownHandler)
    focusFirst()
  }

  const deactivate = () => {
    if (typeof document === 'undefined') {
      activeContainer = null
      keydownHandler = null
      previouslyFocused = null
      return
    }

    if (activeContainer && keydownHandler) {
      activeContainer.removeEventListener('keydown', keydownHandler)
    }

    activeContainer = null
    keydownHandler = null

    if (previouslyFocused) {
      previouslyFocused.focus()
    }
    previouslyFocused = null
  }

  return { activate, deactivate }
}
