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

  const { state: items, hydrated, reset } = usePersistedState<WatchlistItem[]>(
    'watchlist:items',
    () => [],
    {
      validate: (value): value is WatchlistItem[] => Array.isArray(value),
    },
  )

  const count = computed(() => items.value.length)

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

  function save(target: WatchTarget, options?: { label?: string }): SaveResult {
    const normalized = normalizeTarget(target)
    const existing = findByTarget(normalized)
    if (existing) {
      // Touch for recency
      existing.updatedAt = new Date().toISOString()
      items.value = [...items.value].sort(sortByUpdatedDesc)
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
      label: options?.label ?? defaultLabel(normalized),
      createdAt: now,
      updatedAt: now,
    }

    items.value = [next, ...items.value].sort(sortByUpdatedDesc)
    return { status: 'saved', item: next }
  }

  function ensure(target: WatchTarget, options?: { label?: string }) {
    const result = save(target, options)
    if (result.status === 'limit_reached') {
      // If it already exists, we would have returned it above. At this point we truly can't create.
      return result
    }
    return result
  }

  function remove(id: string) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function removeByTarget(target: WatchTarget) {
    const normalized = normalizeTarget(target)
    const key = targetKey(normalized)
    items.value = items.value.filter(i => targetKey(normalizeTarget(i.target)) !== key)
  }

  function updateLabel(id: string, label: string) {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx === -1) return
    const now = new Date().toISOString()
    const next = { ...items.value[idx], label, updatedAt: now }
    items.value = [next, ...items.value.filter(i => i.id !== id)].sort(sortByUpdatedDesc)
  }

  return {
    items,
    hydrated,
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
  }
}
