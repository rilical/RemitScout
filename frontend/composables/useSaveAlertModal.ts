import type { WatchTarget } from '~/types/tracking'

export type SaveAlertModalContext = {
  target: WatchTarget
  label?: string
  source?: 'compare' | 'exchange_rates' | 'pulse' | 'guide' | 'other' | 'alerts' | 'dashboard'
  alertId?: string
}

let clearContextTimeout: ReturnType<typeof setTimeout> | null = null

export const useSaveAlertModal = () => {
  const isOpen = useState<boolean>('saveAlertModal:isOpen', () => false)
  const context = useState<SaveAlertModalContext | null>('saveAlertModal:context', () => null)

  function open(next: SaveAlertModalContext) {
    if (clearContextTimeout) {
      clearTimeout(clearContextTimeout)
      clearContextTimeout = null
    }
    context.value = next
    isOpen.value = true
  }

  function close() {
    isOpen.value = false

    if (clearContextTimeout) {
      clearTimeout(clearContextTimeout)
      clearContextTimeout = null
    }

    clearContextTimeout = setTimeout(() => {
      context.value = null
      clearContextTimeout = null
    }, 300)
  }

  return {
    isOpen,
    context,
    open,
    close,
  }
}
