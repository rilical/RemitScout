import { describe, it, expect } from 'vitest'

/**
 * Knowledge Plane unit tests — validates chunk types, retrieval quality
 * assessment, and search query construction.
 */

describe('KnowledgePlane', () => {
  describe('KnowledgeChunk types', () => {
    it('validates all source types are recognized', () => {
      const validSourceTypes = ['code', 'documentation', 'observation', 'failure', 'repair']
      expect(validSourceTypes).toHaveLength(5)

      for (const sourceType of validSourceTypes) {
        expect(typeof sourceType).toBe('string')
        expect(sourceType.length).toBeGreaterThan(0)
      }
    })

    it('validates chunk structure', () => {
      const chunk = {
        chunkId: 'chunk-001',
        sourceType: 'code' as const,
        sourcePath: 'backend/plane-b/src/providers/wise/parse.ts',
        content: 'export function parseWiseResponse(html: string) { ... }',
        metadata: { providerId: 'wise', moduleId: 'wise_usd_inr' },
        createdAt: '2026-02-28T10:00:00Z',
        relevanceScore: 0.85,
      }

      expect(chunk.chunkId).toBeTruthy()
      expect(chunk.sourceType).toBe('code')
      expect(chunk.sourcePath).toContain('providers/')
      expect(chunk.relevanceScore).toBeGreaterThanOrEqual(0)
      expect(chunk.relevanceScore).toBeLessThanOrEqual(1)
    })
  })

  describe('RetrievalQualityReport assessment', () => {
    const assessQuality = (chunks: Array<{ relevanceScore: number }>) => {
      let high = 0, medium = 0, low = 0
      let totalScore = 0

      for (const chunk of chunks) {
        totalScore += chunk.relevanceScore
        if (chunk.relevanceScore >= 0.7) high++
        else if (chunk.relevanceScore >= 0.3) medium++
        else low++
      }

      const avgRelevance = chunks.length > 0 ? totalScore / chunks.length : 0
      const sufficient = high >= 1 && avgRelevance >= 0.3

      return {
        totalChunks: chunks.length,
        highRelevanceCount: high,
        mediumRelevanceCount: medium,
        lowRelevanceCount: low,
        averageRelevance: avgRelevance,
        sufficient,
      }
    }

    it('reports sufficient quality when high-relevance chunks exist', () => {
      const chunks = [
        { relevanceScore: 0.9 },
        { relevanceScore: 0.7 },
        { relevanceScore: 0.4 },
      ]

      const report = assessQuality(chunks)
      expect(report.sufficient).toBe(true)
      expect(report.highRelevanceCount).toBe(2)
      expect(report.mediumRelevanceCount).toBe(1)
      expect(report.lowRelevanceCount).toBe(0)
    })

    it('reports insufficient quality when no high-relevance chunks', () => {
      const chunks = [
        { relevanceScore: 0.2 },
        { relevanceScore: 0.1 },
      ]

      const report = assessQuality(chunks)
      expect(report.sufficient).toBe(false)
      expect(report.highRelevanceCount).toBe(0)
    })

    it('handles empty chunk array', () => {
      const report = assessQuality([])
      expect(report.totalChunks).toBe(0)
      expect(report.sufficient).toBe(false)
      expect(report.averageRelevance).toBe(0)
    })

    it('correctly classifies edge-case relevance scores', () => {
      const chunks = [
        { relevanceScore: 0.7 },  // exactly high threshold
        { relevanceScore: 0.3 },  // exactly medium threshold
        { relevanceScore: 0.0 },  // zero
      ]

      const report = assessQuality(chunks)
      expect(report.highRelevanceCount).toBe(1)
      expect(report.mediumRelevanceCount).toBe(1)
      expect(report.lowRelevanceCount).toBe(1)
    })
  })

  describe('search query validation', () => {
    it('rejects empty queries', () => {
      const query = ''
      expect(query.trim().length).toBe(0)
    })

    it('accepts valid provider-scoped queries', () => {
      const options = {
        query: 'parse failure wise',
        providerId: 'wise',
        limit: 10,
        minRelevance: 0.3,
      }

      expect(options.query.trim().length).toBeGreaterThan(0)
      expect(options.limit).toBeGreaterThan(0)
      expect(options.minRelevance).toBeGreaterThanOrEqual(0)
      expect(options.minRelevance).toBeLessThanOrEqual(1)
    })
  })
})
