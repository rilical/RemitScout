export const useCspNonce = () => {
  const nonceState = useState<string | null>('cspNonce', () => null)

  if (import.meta.server) {
    const event = useRequestEvent()
    const nonce = event?.context ? (event.context as { cspNonce?: string }).cspNonce : null
    if (nonce && nonceState.value !== nonce) {
      nonceState.value = nonce
    }
  }

  return nonceState
}
