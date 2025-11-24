import type { RecentSearch } from '~/types/remit'

// Share the same in-memory store
declare global {
  var recentSearches: RecentSearch[]
}

if (!global.recentSearches) {
  global.recentSearches = []
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const item: RecentSearch = {
    id: crypto.randomUUID(),
    from: body.from || 'US',
    to: body.to || 'PH',
    amount: Number(body.amount) || 500,
    method: body.method || 'bank',
    bestProvider: body.bestProvider || undefined,
    createdAt: new Date().toISOString(),
  }

  global.recentSearches.push(item)

  // Keep only last 1000 searches in memory
  if (global.recentSearches.length > 1000) {
    global.recentSearches = global.recentSearches.slice(-1000)
  }

  return { ok: true, id: item.id }
})

