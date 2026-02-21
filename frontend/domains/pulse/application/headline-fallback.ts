export const createHeadlineFallbackController = (
  onTimeout: () => void,
  delayMs = 10_000,
) => {
  let timer: ReturnType<typeof setTimeout> | null = null

  const clear = () => {
    if (!timer) return
    clearTimeout(timer)
    timer = null
  }

  const start = () => {
    clear()
    timer = setTimeout(() => {
      timer = null
      onTimeout()
    }, delayMs)
  }

  return {
    start,
    clear,
  }
}
