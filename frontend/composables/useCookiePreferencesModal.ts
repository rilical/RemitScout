export const useCookiePreferencesModal = () => {
  const isOpen = useState<boolean>('cookie-preferences:open', () => false)

  const open = () => {
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  return {
    isOpen,
    open,
    close,
  }
}
