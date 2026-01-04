import { describe, it, expect } from 'vitest'

describe('quotes route utilities', () => {
  describe('getNewestCollectedAt', () => {
    const getNewestCollectedAt = (rows: Array<{ collected_at: string | Date | null }>) => {
      let newest = 0
      for (const row of rows) {
        if (!row.collected_at) continue
        const ts = new Date(row.collected_at).getTime()
        if (Number.isFinite(ts) && ts > newest) {
          newest = ts
        }
      }
      return newest
    }

    it('returns newest timestamp from rows', () => {
      const rows = [
        { collected_at: new Date('2024-01-01') },
        { collected_at: new Date('2024-01-02') },
        { collected_at: new Date('2024-01-03') },
      ]

      const result = getNewestCollectedAt(rows)

      expect(result).toBe(new Date('2024-01-03').getTime())
    })

    it('handles string dates', () => {
      const rows = [
        { collected_at: '2024-01-01T00:00:00Z' },
        { collected_at: '2024-01-02T00:00:00Z' },
      ]

      const result = getNewestCollectedAt(rows)

      expect(result).toBe(new Date('2024-01-02T00:00:00Z').getTime())
    })

    it('skips null collected_at values', () => {
      const rows = [
        { collected_at: null },
        { collected_at: new Date('2024-01-01') },
        { collected_at: null },
      ]

      const result = getNewestCollectedAt(rows)

      expect(result).toBe(new Date('2024-01-01').getTime())
    })

    it('returns 0 when no valid dates', () => {
      const rows = [
        { collected_at: null },
        { collected_at: null },
      ]

      const result = getNewestCollectedAt(rows)

      expect(result).toBe(0)
    })
  })

  describe('getCacheAgeSeconds', () => {
    const getCacheAgeSeconds = (newestCollectedAt: number) => {
      if (!newestCollectedAt) return null
      return Math.max(0, Math.round((Date.now() - newestCollectedAt) / 1000))
    }

    it('calculates cache age in seconds', () => {
      const now = Date.now()
      const fiveMinutesAgo = now - 5 * 60 * 1000

      const result = getCacheAgeSeconds(fiveMinutesAgo)

      expect(result).toBe(300)
    })

    it('returns 0 for future timestamps', () => {
      const future = Date.now() + 1000

      const result = getCacheAgeSeconds(future)

      expect(result).toBe(0)
    })

    it('returns null for zero timestamp', () => {
      const result = getCacheAgeSeconds(0)

      expect(result).toBeNull()
    })
  })
})

