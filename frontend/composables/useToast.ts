import { readonly } from 'vue'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

export const useToast = () => {
  const toasts = useState<Toast[]>('ui:toasts', () => [])

  const dismiss = (id: string) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const show = (type: ToastType, message: string, duration = 5000) => {
    const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `toast_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

    toasts.value.push({ id, type, message, duration })
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  return {
    toasts: readonly(toasts),
    success: (msg: string) => show('success', msg),
    error: (msg: string) => show('error', msg, 8000),
    warning: (msg: string) => show('warning', msg),
    info: (msg: string) => show('info', msg),
    dismiss,
  }
}
