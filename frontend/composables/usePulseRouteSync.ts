import { watch } from 'vue'
import type { PulseTimeframe } from '~/stores/pulse'

export function usePulseRouteSync() {
  const route = useRoute()
  const router = useRouter()
  const store = usePulseStore()

  function initFromRoute() {
    const query = route.query as Record<string, string | undefined>
    store.initFromRoute(query)
  }

  // Sync store state changes back to URL query params.
  // Uses the store's own getQueryParams() to determine canonical params,
  // then merges them into the current route query via router.replace().
  watch(
    () => ({
      corridor: store.corridor?.slug,
      amount: store.amount,
      timeframe: store.timeframe,
      mode: store.viewMode,
    }),
    () => {
      const storeParams = store.getQueryParams()
      const query: Record<string, string> = {}

      // Preserve any existing query params not managed by the store.
      for (const [key, val] of Object.entries(route.query)) {
        if (val !== undefined && val !== null && typeof val === 'string') {
          query[key] = val
        }
      }

      // Apply store-managed params (store omits defaults, so clear stale keys).
      const managedKeys = ['corridor', 'corridor_id', 'timeframe', 'mode', 'amount'] as const
      for (const key of managedKeys) {
        delete query[key]
      }
      for (const [key, val] of Object.entries(storeParams)) {
        query[key] = val
      }

      router.replace({ query })
    },
    { deep: true }
  )

  return { initFromRoute }
}
