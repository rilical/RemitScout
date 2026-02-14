import { onUnmounted, watch } from 'vue'
import type { WatchSource } from 'vue'

export const useAbortableWatch = (
  source: WatchSource<any> | WatchSource<any>[],
  callback: (value: any, signal: AbortSignal) => Promise<void>,
  options?: { immediate?: boolean },
) => {
  let controller: AbortController | null = null

  const stop = watch(
    source as any,
    async (newValue) => {
      controller?.abort()
      controller = new AbortController()
      const { signal } = controller

      try {
        await callback(newValue, signal)
      }
      catch (e: unknown) {
        const maybeAbort = e as { name?: string } | null
        if ((e instanceof DOMException && e.name === 'AbortError') || maybeAbort?.name === 'AbortError') return
        throw e
      }
    },
    options,
  )

  onUnmounted(() => {
    controller?.abort()
    stop()
  })

  return stop
}
