import { createId } from '~/utils/id'
import type { WatchTarget, WatchlistItem } from '~/types/tracking'

export type SaveResult =
  | {
    status: 'saved' | 'already_saved'
    item: WatchlistItem
  }
  | {
    status: 'limit_reached'
    limit: number
    message: string
  }

type WatchlistApiResponse = {
  success: boolean
  items?: WatchlistItem[]
  item?: WatchlistItem
  status?: 'saved' | 'already_saved'
  error?: string
  message?: string
  limit?: number
}

function normalizeTarget(target: WatchTarget): WatchTarget {
  switch (target.type) {
    case 'corridor':
      return {
        type: 'corridor',
        from: target.from.toUpperCase(),
        to: target.to.toUpperCase(),
        method: target.method ?? 'bank',
      }
    case 'fxPair':
      return {
        type: 'fxPair',
        base: target.base.toUpperCase(),
        quote: target.quote.toUpperCase(),
      }
    case 'pulseChart':
      return target
    case 'guide':
      return target
  }
}

function targetKey(target: WatchTarget) {
  switch (target.type) {
    case 'corridor':
      return `corridor:${target.from}-${target.to}:${target.method ?? 'bank'}`
    case 'fxPair':
      return `fx:${target.base}-${target.quote}`
    case 'pulseChart':
      return `pulse:${target.chartId}`
    case 'guide':
      return `guide:${target.slug}`
  }
}

function defaultLabel(target: WatchTarget) {
  switch (target.type) {
    case 'corridor':
      return `${target.from}→${target.to}${target.method ? ` • ${target.method}` : ''}`
    case 'fxPair':
      return `${target.base}/${target.quote}`
    case 'pulseChart':
      return `Pulse chart ${target.chartId}`
    case 'guide':
      return `Guide: ${target.slug}`
  }
}

function sortByUpdatedDesc(a: WatchlistItem, b: WatchlistItem) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

export const useWatchlist = () => {
  const { limits } = useEntitlements()
  const { isLoggedIn } = useAuth()
  const { request } = useApi()

  const { state: items, hydrated: localStorageHydrated, reset: resetLocalStorage } = usePersistedState<WatchlistItem[]>(
    'watchlist:items',
    () => [],
    {
      validate: (value): value is WatchlistItem[] => Array.isArray(value),
    },
  )

  const hydrated = useState<boolean>('watchlist:api:hydrated', () => false)
  const syncing = useState<boolean>('watchlist:syncing', () => false)

  const count = computed(() => items.value.length)

  const upsertItem = (next: WatchlistItem) => {
    const nextKey = targetKey(normalizeTarget(next.target))
    items.value = [
      next,
      ...items.value.filter(item => targetKey(normalizeTarget(item.target)) !== nextKey && item.id !== next.id),
    ].sort(sortByUpdatedDesc)
  }

  async function fetchFromBackend() {
    if (!isLoggedIn.value) {
      hydrated.value = true
      return
    }

    try {
      syncing.value = true
      const response = await request<WatchlistApiResponse>('/watchlist')
      
      if (response.success && response.items) {
        items.value = response.items.sort(sortByUpdatedDesc)
        hydrated.value = true
      } else {
        console.warn('Failed to fetch watchlist from backend:', response)
        hydrated.value = true
      }
    } catch (error) {
      console.error('Error fetching watchlist from backend:', error)
      hydrated.value = true
    } finally {
      syncing.value = false
    }
  }

  async function saveToBackend(target: WatchTarget, label?: string): Promise<SaveResult> {
    const response = await request<WatchlistApiResponse>('/watchlist', {
      method: 'POST',
      body: {
        target,
        label: label ?? defaultLabel(target),
      },
    })

    if (response.success && response.item) {
      upsertItem(response.item)
      return { status: response.status ?? 'saved', item: response.item }
    }

    if (response.error === 'limit_reached') {
      return {
        status: 'limit_reached',
        limit: response.limit ?? 0,
        message: response.message ?? 'Watchlist limit reached.',
      }
    }

    throw new Error(response.message || response.error || 'Failed to save watchlist item')
  }

  async function syncToBackend(operation: 'save' | 'update' | 'delete', item: WatchlistItem | WatchTarget, id?: string) {
    if (!isLoggedIn.value) {
      return
    }

    try {
      if (operation === 'save') {
        const target = item as WatchTarget
        const normalized = normalizeTarget(target)
        await saveToBackend(normalized)
      } else if (operation === 'update' && id) {
        const watchlistItem = item as WatchlistItem
        await request<WatchlistApiResponse>(`/watchlist/${id}`, {
          method: 'PATCH',
          body: {
            label: watchlistItem.label,
          },
        })
      } else if (operation === 'delete' && id) {
        await request<WatchlistApiResponse>(`/watchlist/${id}`, {
          method: 'DELETE',
        })
      }
    } catch (error) {
      console.error(`Error syncing ${operation} to backend:`, error)
    }
  }

  onMounted(async () => {
    if (isLoggedIn.value) {
      await fetchFromBackend()
    } else {
      hydrated.value = localStorageHydrated.value
    }
  })

  watch(isLoggedIn, async (loggedIn) => {
    if (loggedIn) {
      await fetchFromBackend()
    } else {
      hydrated.value = localStorageHydrated.value
    }
  })

  function findById(id: string) {
    return items.value.find(i => i.id === id) ?? null
  }

  function findByTarget(target: WatchTarget) {
    const normalized = normalizeTarget(target)
    const key = targetKey(normalized)
    return items.value.find(item => targetKey(normalizeTarget(item.target)) === key) ?? null
  }

  function isSaved(target: WatchTarget) {
    return !!findByTarget(target)
  }

  async function save(target: WatchTarget, options?: { label?: string }): Promise<SaveResult> {
    const normalized = normalizeTarget(target)
    const label = options?.label ?? defaultLabel(normalized)

    if (isLoggedIn.value) {
      try {
        return await saveToBackend(normalized, label)
      } catch (error) {
        console.error('Error saving watchlist item to backend:', error)
        return {
          status: 'limit_reached',
          limit: limits.value.watchlistItems === 'unlimited' ? 0 : limits.value.watchlistItems,
          message: 'Unable to save watchlist item right now.',
        }
      }
    }

    const existing = findByTarget(normalized)
    
    if (existing) {
      existing.updatedAt = new Date().toISOString()
      items.value = [...items.value].sort(sortByUpdatedDesc)
      
      if (isLoggedIn.value) {
        await syncToBackend('update', existing, existing.id)
      }
      
      return { status: 'already_saved', item: existing }
    }

    const limit = limits.value.watchlistItems
    if (limit !== 'unlimited' && items.value.length >= limit) {
      return {
        status: 'limit_reached',
        limit,
        message: `Free plan supports up to ${limit} saved item${limit === 1 ? '' : 's'}.`,
      }
    }

    const now = new Date().toISOString()
    const next: WatchlistItem = {
      id: createId('wl'),
      target: normalized,
      label,
      createdAt: now,
      updatedAt: now,
    }

    items.value = [next, ...items.value].sort(sortByUpdatedDesc)

    if (isLoggedIn.value) {
      await syncToBackend('save', normalized)
    }

    return { status: 'saved', item: next }
  }

  async function ensure(target: WatchTarget, options?: { label?: string }): Promise<SaveResult> {
    const result = await save(target, options)
    if (result.status === 'limit_reached') {
      return result
    }
    return result
  }

  async function remove(id: string) {
    const index = items.value.findIndex(i => i.id === id)
    if (index === -1) return

    items.value = items.value.filter(i => i.id !== id)

    if (isLoggedIn.value) {
      await syncToBackend('delete', {} as WatchTarget, id)
    }
  }

  function removeByTarget(target: WatchTarget) {
    const normalized = normalizeTarget(target)
    const key = targetKey(normalized)
    const item = items.value.find(i => targetKey(normalizeTarget(i.target)) === key)
    if (item) {
      remove(item.id)
    }
  }

  async function updateLabel(id: string, label: string) {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx === -1) return
    
    const now = new Date().toISOString()
    const next = { ...items.value[idx], label, updatedAt: now }
    items.value = [next, ...items.value.filter(i => i.id !== id)].sort(sortByUpdatedDesc)

    if (isLoggedIn.value) {
      await syncToBackend('update', next, id)
    }
  }

  function reset() {
    items.value = []
    resetLocalStorage()
    if (isLoggedIn.value) {
      fetchFromBackend()
    }
  }

  return {
    items,
    hydrated: computed(() => hydrated.value && localStorageHydrated.value),
    count,
    findById,
    isSaved,
    findByTarget,
    save,
    ensure,
    remove,
    removeByTarget,
    updateLabel,
    reset,
    syncing: readonly(syncing),
    refresh: fetchFromBackend,
  }
}
