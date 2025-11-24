import type { CorridorPopularity } from '~/types/remit'

export default defineEventHandler(async (event) => {
  // Get recent searches from shared store
  const recentSearches = global.recentSearches || []

  // Filter to last 24 hours
  const now = Date.now()
  const last24h = recentSearches.filter(s =>
    now - new Date(s.createdAt).getTime() < 24 * 3600 * 1000,
  )

  // Count corridors
  const corridorMap = new Map<string, number>()
  last24h.forEach((search) => {
    const key = `${search.from}→${search.to}`
    corridorMap.set(key, (corridorMap.get(key) || 0) + 1)
  })

  // Sort by popularity and add metadata
  const sorted: CorridorPopularity[] = Array.from(corridorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([route, count]) => {
      // Add corridor-specific metadata
      const corridorData: Record<string, Partial<CorridorPopularity>> = {
        'US→PH': {
          feeRange: '$0-4',
          speedRange: '15-30 min',
          bestFor: 'Cash pickup to rural areas',
        },
        'US→IN': {
          feeRange: '$0-5',
          speedRange: 'Same day',
          bestFor: 'Highest bank payout',
        },
        'GB→PK': {
          feeRange: '£0-3',
          speedRange: '1-24 hours',
          bestFor: 'Tuition payments',
        },
        'CA→MX': {
          feeRange: '$2-8',
          speedRange: 'Minutes',
          bestFor: 'Cash pickup network',
        },
      }

      return {
        route,
        count24h: count,
        ...(corridorData[route] || {
          feeRange: '$0-10',
          speedRange: '1-2 days',
          bestFor: 'Bank transfers',
        }),
      }
    })

  // Add default popular corridors if no data
  if (sorted.length === 0) {
    const defaults: CorridorPopularity[] = [
      { route: 'US→PH', count24h: 142, feeRange: '$0-4', speedRange: '15-30 min', bestFor: 'Cash pickup to rural areas' },
      { route: 'US→IN', count24h: 98, feeRange: '$0-5', speedRange: 'Same day', bestFor: 'Highest bank payout' },
      { route: 'GB→PK', count24h: 76, feeRange: '£0-3', speedRange: '1-24 hours', bestFor: 'Tuition payments' },
      { route: 'US→MX', count24h: 65, feeRange: '$2-8', speedRange: 'Minutes', bestFor: 'Cash pickup network' },
    ]
    return { data: defaults, updatedAt: new Date().toISOString() }
  }

  return {
    data: sorted,
    updatedAt: new Date().toISOString(),
  }
})

